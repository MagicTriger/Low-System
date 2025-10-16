# 属性面板动态渲染实现

## 更新日期

2025-10-12

## 更新内容

### 修改的文件

- `src/core/renderer/designer/settings/PropertiesPanel.vue`

## 实现的功能

### ✅ 动态属性分组

属性面板现在会根据控件定义中的 `settings` 配置动态生成属性编辑器，支持以下分组：

1. **基本 (basic)** - 固定显示

   - 控件ID（只读）
   - 实例ID（只读）
   - 控件名称（可编辑）
   - 权限绑定（下拉选择）

2. **数据 (data)** - 动态生成

   - 根据控件定义的 `settings` 中 `group: 'data'` 的配置生成

3. **公共 (common)** - 动态生成

   - 根据控件定义的 `settings` 中 `group: 'common'` 的配置生成

4. **扩展 (extend)** - 动态生成
   - 根据控件定义的 `settings` 中 `group: 'extend'` 的配置生成

### ✅ 支持的属性类型

#### 1. string - 字符串输入

```vue
<a-input
  :value="getPropertyValue(setting.key)"
  @update:value="v => handleSettingChange(setting.key, v)"
  size="small"
  :placeholder="setting.placeholder"
/>
```

#### 2. select - 下拉选择

```vue
<a-select
  :value="getPropertyValue(setting.key)"
  @update:value="v => handleSettingChange(setting.key, v)"
  size="small"
  style="width: 100%"
  allow-clear
>
  <a-select-option v-for="opt in setting.options" :key="opt.value" :value="opt.value">
    {{ opt.label }}
  </a-select-option>
</a-select>
```

#### 3. boolean - 开关

```vue
<a-switch :checked="getPropertyValue(setting.key)" @update:checked="v => handleSettingChange(setting.key, v)" size="small" />
```

#### 4. icon - 图标选择器

```vue
<IconPickerField :model-value="getPropertyValue(setting.key)" @update:model-value="v => handleSettingChange(setting.key, v)" />
```

### ✅ 新增的方法

#### hasGroupSettings(group: string)

检查控件定义中是否有指定分组的属性配置。

```typescript
function hasGroupSettings(group: string): boolean {
  if (!controlDefinition.value?.settings) return false
  return controlDefinition.value.settings.some((s: any) => s.group === group)
}
```

#### getGroupSettings(group: string)

获取指定分组的所有属性配置。

```typescript
function getGroupSettings(group: string): any[] {
  if (!controlDefinition.value?.settings) return []
  return controlDefinition.value.settings.filter((s: any) => s.group === group)
}
```

#### getPropertyValue(key: string)

获取控件属性的值。

```typescript
function getPropertyValue(key: string): any {
  return props.control?.props?.[key] ?? ''
}
```

#### handleSettingChange(key: string, value: any)

处理属性值的变更。

```typescript
function handleSettingChange(key: string, value: any) {
  const newProps = { ...props.control?.props, [key]: value }
  emit('update', 'props', newProps)
}
```

## 工作原理

### 1. 读取控件定义

```typescript
const controlDefinition = computed<BaseControlDefinition | null>(() => {
  if (!props.control) return null
  return ControlDefinitions[props.control.kind] || null
})
```

### 2. 检查分组是否存在

```typescript
v-if="hasGroupSettings('data')"
```

### 3. 获取分组的属性配置

```typescript
v-for="setting in getGroupSettings('data')"
```

### 4. 根据类型渲染编辑器

```vue
<a-input v-if="setting.type === 'string'" ... />
<a-select v-else-if="setting.type === 'select'" ... />
<a-switch v-else-if="setting.type === 'boolean'" ... />
<IconPickerField v-else-if="setting.type === 'icon'" ... />
```

### 5. 更新属性值

```typescript
@update:value="v => handleSettingChange(setting.key, v)"
```

## 按钮组件的属性显示

根据 `register.ts` 中的按钮定义，属性面板会显示：

### 基本分组

- 控件ID: `ctrl_xxx` (只读)
- 实例ID: `ctrl_xxx` (只读)
- 控件名称: (可编辑)
- 权限绑定: (下拉选择)

### 数据分组

- 数据源: (下拉选择，选项为空)

### 公共分组

- 文本: (文本输入框)
- 图标: (图标选择器，点击弹出图标库)
- 点击不冒泡: (开关)

### 扩展分组

- 大小: (下拉选择: 小/中/大)
- 类型: (下拉选择: default/primary/dashed/text/link)
- 背景透明: (开关)
- 危险: (开关)
- 形状: (下拉选择: 默认/圆形/圆角)

## 优势

### 1. 动态性

- 不需要为每个控件类型编写专门的属性面板
- 只需在控件定义中配置 `settings`
- 自动生成对应的编辑器

### 2. 可扩展性

- 添加新控件时，只需配置 `settings`
- 添加新属性类型时，只需在模板中添加对应的 v-else-if
- 易于维护和扩展

### 3. 一致性

- 所有控件的属性面板结构一致
- 统一的交互体验
- 统一的样式风格

## 使用示例

### 在控件定义中配置属性

```typescript
{
  kind: 'my-control',
  kindName: '我的控件',
  settings: [
    {
      key: 'title',
      name: '标题',
      type: 'string',
      defaultValue: '',
      group: 'common',
      placeholder: '请输入标题'
    },
    {
      key: 'size',
      name: '大小',
      type: 'select',
      defaultValue: 'middle',
      options: [
        { label: '小', value: 'small' },
        { label: '中', value: 'middle' },
        { label: '大', value: 'large' }
      ],
      group: 'extend'
    },
    {
      key: 'visible',
      name: '可见',
      type: 'boolean',
      defaultValue: true,
      group: 'extend'
    }
  ]
}
```

### 属性面板自动显示

属性面板会自动：

1. 检测到 `common` 分组，显示"公共"折叠面板
2. 在"公共"面板中显示"标题"文本输入框
3. 检测到 `extend` 分组，显示"扩展"折叠面板
4. 在"扩展"面板中显示"大小"下拉框和"可见"开关

## 注意事项

### 1. 属性值存储位置

属性值存储在 `control.props` 对象中：

```typescript
{
  id: 'button_001',
  kind: 'button',
  props: {
    text: '按钮文字',
    type: 'primary',
    size: 'small',
    icon: 'CheckOutlined'
  }
}
```

### 2. 属性更新机制

当用户修改属性时：

1. `handleSettingChange` 被调用
2. 创建新的 `props` 对象
3. 通过 `emit('update', 'props', newProps)` 通知父组件
4. 父组件更新控件定义
5. 画布重新渲染

### 3. 图标选择器集成

图标选择器组件 `IconPickerField` 需要：

- 接收 `model-value` prop
- 发出 `update:model-value` 事件
- 显示图标预览
- 提供清除功能

## 测试建议

### 功能测试

1. **测试属性显示**

   ```
   - 选择按钮组件
   - 检查是否显示"基本"、"数据"、"公共"、"扩展"分组
   - 检查每个分组中的属性是否正确显示
   ```

2. **测试属性编辑**

   ```
   - 修改文本属性
   - 修改下拉选择属性
   - 切换开关属性
   - 选择图标
   - 检查画布中的组件是否更新
   ```

3. **测试不同控件**
   ```
   - 选择不同类型的控件
   - 检查属性面板是否正确切换
   - 检查属性分组是否正确
   ```

### UI测试

1. **布局测试**

   - 检查属性面板的布局
   - 检查折叠面板的展开/收起
   - 检查不同屏幕尺寸下的显示

2. **交互测试**
   - 测试输入框的输入
   - 测试下拉框的选择
   - 测试开关的切换
   - 测试图标选择器的弹出

## 总结

本次更新实现了：

- ✅ 动态属性分组显示
- ✅ 根据控件定义自动生成编辑器
- ✅ 支持多种属性类型
- ✅ 集成图标选择器
- ✅ 统一的交互体验

属性面板现在完全动态化，可以根据控件定义自动适配，大大提升了可维护性和扩展性。
