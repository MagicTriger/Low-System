# 图标不显示问题调试指南

## 问题描述

从控制台日志可以看到：

- ✅ 图标选择成功
- ✅ 属性更新逻辑触发
- ❌ 但图标值为空字符串
- ❌ 画布上的按钮不显示图标

## 调试步骤

### 1. 打开浏览器控制台

确保控制台可以看到所有日志。

### 2. 选择按钮并打开图标选择器

1. 在画布上选择一个按钮组件
2. 在属性面板中找到"图标"字段
3. 点击"选择"按钮打开图标选择器

### 3. 选择一个图标

1. 在图标库中选择任意图标（如 HomeOutlined）
2. 观察控制台输出

**预期日志顺序**:

```
[IconField] Icon selected: {name: "HomeOutlined", ...}
[IconField] Emitting update:modelValue: HomeOutlined
[FieldRenderer] Field value updated: icon = HomeOutlined
[PanelGroup] Field updated: icon = HomeOutlined
[PropertiesPanel] Updating property: icon = HomeOutlined
[DesignerNew] 属性更新: icon = HomeOutlined
[updateControl] Updating control: button_xxx {props: {icon: "HomeOutlined"}}
[Button] Icon value: HomeOutlined Props: {icon: "HomeOutlined", ...}
[Button] Icon component for HomeOutlined : [Function]
```

### 4. 检查关键点

#### 检查点 1: IconField 是否正确发出事件

- 查找 `[IconField] Emitting update:modelValue:` 日志
- 确认值不是空字符串

#### 检查点 2: FieldRenderer 是否接收到值

- 查找 `[FieldRenderer] Field value updated:` 日志
- 确认 key 是 'icon' 且 value 不为空

#### 检查点 3: PanelGroup 是否传递值

- 查找 `[PanelGroup] Field updated:` 日志
- 确认值正确传递

#### 检查点 4: PropertiesPanel 是否处理更新

- 查找 `[PropertiesPanel] Updating property:` 日志
- 确认 property 是 'icon' 且 value 不为空

#### 检查点 5: DesignerNew 是否更新 control

- 查找 `[DesignerNew] 属性更新:` 日志
- 查找 `[updateControl] Control updated:` 日志
- 确认 props.icon 已更新

#### 检查点 6: Button 组件是否接收到 icon

- 查找 `[Button] Icon value:` 日志
- 查找 `[Button] Icon component for` 日志
- 确认图标组件已找到

## 常见问题

### 问题 1: IconField 发出的值是空字符串

**可能原因**:

- IconPicker 的 select 事件没有正确触发
- icon.name 是 undefined

**解决方案**:
检查 IconPicker 组件的 selectIcon 方法

### 问题 2: FieldRenderer 没有接收到值

**可能原因**:

- v-model 绑定不正确
- IconField 的 emit 没有正确触发

**解决方案**:
检查 IconField 的 v-model 绑定和 emit 调用

### 问题 3: 值传递到 Button 但图标不显示

**可能原因**:

- 图标名称不正确
- AntIcons 中没有该图标
- 图标组件导入失败

**解决方案**:

1. 检查图标名称是否正确（如 "HomeOutlined"）
2. 在控制台执行: `Object.keys(AntIcons).filter(k => k.includes('Home'))`
3. 确认图标存在

### 问题 4: 图标组件找到了但不渲染

**可能原因**:

- template 中的 v-if 条件不满足
- component :is 绑定有问题

**解决方案**:
检查 Button.vue 的 template:

```vue
<template #icon v-if="icon">
  <component :is="iconComponent" />
</template>
```

## 修复建议

### 修复 1: 确保 IconPicker 正确发出 select 事件

IconPicker.vue 的 selectIcon 方法应该:

```typescript
function selectIcon(icon: IconDefinition) {
  selectedIcon.value = icon.name
  emit('update:modelValue', icon.name)
  emit('select', icon) // 确保发出 select 事件
}
```

### 修复 2: IconField 监听 select 事件

IconField.vue 应该:

```vue
<IconPicker v-model="selectedIcon" @select="handleIconSelect" />
```

```typescript
function handleIconSelect(icon: any) {
  console.log('[IconField] Icon selected:', icon)
  selectedIcon.value = icon.name
  emit('update:modelValue', icon.name)
  pickerVisible.value = false
}
```

### 修复 3: 确保 Button 组件正确导入图标

Button.vue 应该:

```typescript
import * as AntIcons from '@ant-design/icons-vue'

const iconComponent = computed(() => {
  if (!icon.value) return null
  return (AntIcons as any)[icon.value] || null
})
```

## 测试清单

- [ ] 图标选择器能正常打开
- [ ] 点击图标后选择器关闭
- [ ] 控制台显示完整的日志链
- [ ] 图标字段显示选中的图标名称
- [ ] 画布上的按钮显示图标
- [ ] 保存后刷新，图标仍然显示

## 下一步

如果所有调试日志都正常，但图标仍不显示：

1. 检查 CSS 样式是否隐藏了图标
2. 检查 z-index 是否导致图标被遮挡
3. 使用浏览器开发者工具检查 DOM 结构
4. 确认图标组件是否真的被渲染到 DOM 中
