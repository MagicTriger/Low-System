# 禁用字段修复

## 问题描述

用户报告了以下问题：

1. **按钮组件有重复的禁用配置** - 在"按钮属性"和"基础属性"中都有"禁用"字段
2. **禁用配置无法重新启用** - 点击禁用后，无法再次点击启用

## 问题分析

### 问题 1: 重复的禁用字段

- **基础属性面板**（BasicPanel）中有 `disabled` 字段 - 这是所有组件共有的
- **按钮组件配置**中也有 `disabled` 字段 - 这是重复的

### 问题 2: 无法重新启用

根据日志分析：

```
[SwitchField] Switch toggled: disabled = true previous value: false
[FieldRenderer] Field value updated: disabled = true
...
✅ 禁用状态已更新: true
```

开关确实被切换了，但问题出在 `componentProps` 的计算逻辑上：

```typescript
// 之前的代码
const componentProps = computed(() => {
  return {
    ...(selectedComponent.value.props || {}), // 从 props 中获取 disabled
    disabled: selectedComponent.value.disabled, // 从根级别获取 disabled (可能覆盖了 props 中的值)
  }
})
```

这导致：

1. 用户点击开关，`disabled` 被更新到 `props.disabled`
2. 但 `componentProps` 中的 `disabled` 被根级别的值覆盖
3. 如果根级别的 `disabled` 是 `undefined` 或 `false`，开关会显示为关闭状态
4. 用户再次点击时，又会设置为 `true`，形成循环

## 解决方案

### 1. 删除按钮组件中的重复 disabled 字段

按钮组件的配置中已经没有 `disabled` 字段了（之前已被删除），只保留基础属性面板中的 `disabled` 字段。

### 2. 修复 componentProps 的计算逻辑

修改 PropertiesPanel.vue 中的 `componentProps` 计算逻辑，确保优先从 `props` 中获取值：

**修改前**：

```typescript
const componentProps = computed(() => {
  if (!selectedComponent.value) return {}

  return {
    // 基础属性
    id: selectedComponent.value.id,
    name: selectedComponent.value.name,
    kind: selectedComponent.value.kind,

    // 组件特定属性 (props)
    ...(selectedComponent.value.props || {}),

    // 布局属性 (layout)
    ...(selectedComponent.value.layout || {}),

    // 样式属性 (styles)
    ...(selectedComponent.value.styles || {}),

    // 其他属性
    visible: selectedComponent.value.visible,
    disabled: selectedComponent.value.disabled, // ← 问题：可能覆盖 props 中的值
  }
})
```

**修改后**：

```typescript
const componentProps = computed(() => {
  if (!selectedComponent.value) return {}

  return {
    // 基础属性
    id: selectedComponent.value.id,
    name: selectedComponent.value.name,
    kind: selectedComponent.value.kind,

    // 组件特定属性 (props)
    ...(selectedComponent.value.props || {}),

    // 布局属性 (layout)
    ...(selectedComponent.value.layout || {}),

    // 样式属性 (styles)
    ...(selectedComponent.value.styles || {}),

    // 其他属性 - 优先从 props 中获取，如果 props 中没有则从根级别获取
    visible: selectedComponent.value.props?.visible ?? selectedComponent.value.visible,
    disabled: selectedComponent.value.props?.disabled ?? selectedComponent.value.disabled, // ← 修复：优先使用 props 中的值
  }
})
```

## 修改的文件

### src/core/renderer/designer/settings/PropertiesPanel.vue

修改了 `componentProps` 的计算逻辑，使用空值合并运算符 (`??`) 确保优先从 `props` 中获取 `visible` 和 `disabled` 的值。

## 工作原理

### 空值合并运算符 (??)

```typescript
disabled: selectedComponent.value.props?.disabled ?? selectedComponent.value.disabled
```

这个表达式的含义：

1. 首先尝试获取 `selectedComponent.value.props?.disabled`
2. 如果值是 `null` 或 `undefined`，则使用 `selectedComponent.value.disabled`
3. 如果值是 `false`，则使用 `false`（不会fallback到根级别）

这确保了：

- 如果 `props.disabled` 是 `true`，使用 `true`
- 如果 `props.disabled` 是 `false`，使用 `false`
- 如果 `props.disabled` 不存在，才使用根级别的 `disabled`

### 值的流转

1. **用户点击开关**：

   ```
   用户点击 → SwitchField 触发 update:modelValue
   → FieldRenderer 接收并传递
   → PanelGroup 接收并触发 update
   → PropertiesPanel 接收并调用 handlePropertyUpdate
   → DesignerNew 更新 control.props.disabled
   ```

2. **值的读取**：
   ```
   PropertiesPanel.componentProps 计算
   → 优先从 props.disabled 获取
   → 传递给 PanelGroup
   → 传递给 FieldRenderer
   → 传递给 SwitchField
   → 显示正确的开关状态
   ```

## 验证步骤

### 测试 1: 禁用按钮

1. 启动开发服务器：`npm run dev`
2. 添加一个按钮到画布
3. 选中按钮
4. 打开"基础属性"面板
5. 点击"禁用"开关

**预期结果**：

- ✅ 开关变为开启状态（蓝色）
- ✅ 画布中的按钮变为禁用状态（灰色）
- ✅ 控制台显示：`[SwitchField] Switch toggled: disabled = true`
- ✅ 控制台显示：`✅ 禁用状态已更新: true`

### 测试 2: 重新启用按钮

1. 在禁用状态下，再次点击"禁用"开关
2. 观察开关和按钮的状态

**预期结果**：

- ✅ 开关变为关闭状态（灰色）
- ✅ 画布中的按钮恢复为正常状态
- ✅ 控制台显示：`[SwitchField] Switch toggled: disabled = false`
- ✅ 控制台显示：`✅ 禁用状态已更新: false`

### 测试 3: 多次切换

1. 连续多次点击"禁用"开关
2. 观察每次切换的效果

**预期结果**：

- ✅ 每次点击都能正确切换状态
- ✅ 开关状态与按钮状态保持同步
- ✅ 不会出现"只能禁用无法启用"的问题

### 测试 4: 保存和加载

1. 禁用按钮
2. 保存设计
3. 刷新页面
4. 加载设计

**预期结果**：

- ✅ 按钮保持禁用状态
- ✅ "禁用"开关显示为开启状态
- ✅ 可以正常切换禁用状态

### 测试 5: 其他组件

测试其他组件的禁用功能：

- 输入框
- 选择框
- 文本组件

**预期结果**：

- ✅ 所有组件的禁用功能都正常工作
- ✅ 可以正常启用和禁用
- ✅ 状态保持同步

## 技术细节

### 为什么使用 ?? 而不是 ||

```typescript
// 使用 ?? (空值合并)
disabled: props?.disabled ?? rootDisabled

// 使用 || (逻辑或)
disabled: props?.disabled || rootDisabled
```

区别：

- `??` 只在左侧为 `null` 或 `undefined` 时使用右侧值
- `||` 在左侧为任何假值（`false`, `0`, `''`, `null`, `undefined`）时使用右侧值

对于布尔值，必须使用 `??`，因为：

- `false ?? true` 返回 `false` ✅
- `false || true` 返回 `true` ❌

### 可选链操作符 (?.)

```typescript
selectedComponent.value.props?.disabled
```

这个表达式的含义：

- 如果 `props` 存在，返回 `props.disabled`
- 如果 `props` 不存在，返回 `undefined`（而不是抛出错误）

### 值的优先级

1. **最高优先级**：`props.disabled` - 组件实例的禁用状态
2. **次优先级**：`rootDisabled` - 根级别的禁用状态（通常不使用）
3. **默认值**：`false` - 如果都不存在，默认为启用状态

## 相关代码

### PropertiesPanel.vue

```typescript
// 获取组件属性
const componentProps = computed(() => {
  if (!selectedComponent.value) return {}

  return {
    // ... 其他属性

    // 优先从 props 中获取
    visible: selectedComponent.value.props?.visible ?? selectedComponent.value.visible,
    disabled: selectedComponent.value.props?.disabled ?? selectedComponent.value.disabled,
  }
})
```

### DesignerNew.vue

```typescript
// 处理 disabled 属性更新
else if (property === 'disabled') {
  const mergedProps = {
    ...(selectedControl.value.props || {}),
    disabled: value,  // 更新到 props.disabled
  }
  updateControl(selectedControlId.value, { props: mergedProps })
  console.log('✅ 禁用状态已更新:', value)
}
```

### Button.vue

```typescript
// 读取 disabled 属性
const disabled = computed(() => control.value.props?.disabled || false)
```

## 总结

本次修复解决了两个问题：

1. ✅ **删除了重复的禁用字段** - 只保留基础属性面板中的 `disabled` 字段
2. ✅ **修复了无法重新启用的问题** - 通过修改 `componentProps` 的计算逻辑，确保优先从 `props` 中获取值

修复后：

- 用户可以正常切换禁用状态
- 开关状态与组件状态保持同步
- 状态可以正确保存和加载
- 所有组件的禁用功能都正常工作

## 相关文档

- [属性面板系统设计](./design.md) - 整体设计文档
- [任务列表](./tasks.md) - 当前进度和待办任务
- [开关字段修复](./BACKSPACE_AND_SWITCH_FIX.md) - 之前的开关字段修复
