# Backspace 键和开关按钮修复

## 修复内容

### 1. 修复 Backspace 键误删除组件问题

**问题描述**:

- 用户在输入框中按 Backspace 键时，组件被删除
- 应该只删除输入框中的文本，而不是删除整个组件

**根本原因**:
全局键盘事件监听器没有检查当前焦点是否在可编辑元素中。

**修复方案**:
在 `DesignerNew.vue` 中添加焦点检查，排除在输入框、文本域等可编辑元素中的情况。

**修改文件**: `src/modules/designer/views/DesignerNew.vue`

**代码变更**:

```typescript
// Delete 或 Backspace: 删除
// 但要排除在输入框、文本域等可编辑元素中的情况
if ((e.key === 'Delete' || e.key === 'Backspace') && selectedControlId.value) {
  const target = e.target as HTMLElement
  const isEditable =
    target.tagName === 'INPUT' ||
    target.tagName === 'TEXTAREA' ||
    target.isContentEditable ||
    target.closest('.ant-input') ||
    target.closest('.ant-select') ||
    target.closest('.ant-picker') ||
    target.closest('input') ||
    target.closest('textarea')

  if (!isEditable) {
    e.preventDefault()
    handleControlDelete(selectedControlId.value)
    return
  }
}
```

**检查的可编辑元素**:

- `<input>` 标签
- `<textarea>` 标签
- 设置了 `contentEditable` 的元素
- Ant Design 的输入组件 (`.ant-input`)
- Ant Design 的选择器 (`.ant-select`)
- Ant Design 的日期选择器 (`.ant-picker`)

### 2. 优化开关按钮的显示和样式

**问题描述**:

- 开关按钮（幽灵按钮、危险按钮、加载状态、禁用状态、块级按钮）的显示位置不佳
- 开关按钮的颜色是白色，不够明显

**修复方案**:

#### 2.1 调整字段布局

**修改文件**: `src/core/renderer/controls/register.ts`

将所有开关字段的 `span` 从 12 改为 2（整行显示）：

```typescript
{
  key: 'danger',
  label: '危险按钮',
  type: 'switch' as any,
  defaultValue: false,
  layout: { span: 2 },  // 从 12 改为 2
},
{
  key: 'ghost',
  label: '幽灵按钮',
  type: 'switch' as any,
  defaultValue: false,
  layout: { span: 2 },
},
// ... 其他开关字段同样修改
```

#### 2.2 优化 SwitchField 组件样式

**修改文件**: `src/core/infrastructure/fields/renderers/SwitchField.vue`

**改进**:

- 添加容器 div 确保垂直居中
- 设置开关大小为 small
- 自定义开关颜色：
  - 未选中状态：`rgba(0, 0, 0, 0.25)` (灰色)
  - 选中状态：`#1890ff` (蓝色)
  - 悬停效果

```vue
<template>
  <div class="switch-field">
    <a-switch :checked="modelValue" :disabled="config.disabled" @update:checked="handleUpdate" size="small" />
  </div>
</template>

<style scoped>
.switch-field {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.switch-field :deep(.ant-switch) {
  background-color: rgba(0, 0, 0, 0.25);
}

.switch-field :deep(.ant-switch-checked) {
  background-color: #1890ff;
}

.switch-field :deep(.ant-switch:hover:not(.ant-switch-disabled)) {
  background-color: rgba(0, 0, 0, 0.35);
}

.switch-field :deep(.ant-switch-checked:hover:not(.ant-switch-disabled)) {
  background-color: #40a9ff;
}
</style>
```

#### 2.3 优化 FieldRenderer 布局

**修改文件**: `src/core/infrastructure/fields/FieldRenderer.vue`

**改进**:

- 为开关字段使用特殊的横向布局
- 标签和开关在同一行显示
- 标签在左，开关在右

```vue
<template>
  <div class="field-renderer" :class="fieldClasses">
    <!-- 开关字段使用横向布局 -->
    <div v-if="isSwitchField" class="field-switch-row">
      <label v-if="config.label" class="field-label">
        {{ config.label }}
        <a-tooltip v-if="config.tooltip" :title="config.tooltip">
          <QuestionCircleOutlined class="field-tooltip-icon" />
        </a-tooltip>
      </label>

      <component
        :is="rendererComponent"
        v-if="rendererComponent"
        v-model="fieldValue"
        :config="config"
        :errors="fieldErrors"
        class="field-input"
        @validate="handleValidate"
      />
    </div>

    <!-- 其他字段使用垂直布局 -->
    <template v-else>
      <!-- ... 原有布局 ... -->
    </template>
  </div>
</template>

<style scoped>
/* 开关字段特殊布局 */
.field-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
}

.field-switch-row .field-label {
  margin-bottom: 0;
  flex: 1;
}

.field-switch-row .field-input {
  flex-shrink: 0;
}
</style>
```

## 测试步骤

### 测试 1: Backspace 键功能

1. 在设计器中添加一个按钮组件
2. 选中按钮
3. 在属性面板的文本输入框中输入一些文字
4. 按 Backspace 键

**预期结果**:

- ✅ 输入框中的文字被删除
- ✅ 按钮组件不会被删除

5. 点击画布空白处，取消输入框焦点
6. 选中按钮组件
7. 按 Backspace 键

**预期结果**:

- ✅ 按钮组件被删除

### 测试 2: Delete 键功能

重复测试 1 的步骤，使用 Delete 键代替 Backspace 键。

### 测试 3: 开关按钮显示

1. 在设计器中添加一个按钮组件
2. 选中按钮，打开属性面板
3. 找到"按钮属性"折叠框
4. 查看以下开关字段：
   - 危险按钮
   - 幽灵按钮
   - 加载状态
   - 禁用状态
   - 块级按钮

**预期结果**:

- ✅ 每个开关字段占据整行
- ✅ 标签在左侧，开关在右侧
- ✅ 标签和开关在同一行，垂直居中对齐
- ✅ 开关未选中时显示灰色
- ✅ 开关选中时显示蓝色
- ✅ 鼠标悬停时有颜色变化

### 测试 4: 开关功能

1. 点击每个开关按钮
2. 观察画布上的按钮变化

**预期结果**:

- ✅ 危险按钮：按钮变为红色
- ✅ 幽灵按钮：按钮变为透明背景
- ✅ 加载状态：按钮显示加载图标
- ✅ 禁用状态：按钮变为禁用状态
- ✅ 块级按钮：按钮宽度变为 100%

## 其他可编辑元素

如果发现其他输入组件也有 Backspace 误删除问题，可以在检查列表中添加：

```typescript
const isEditable =
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.isContentEditable ||
  target.closest('.ant-input') ||
  target.closest('.ant-select') ||
  target.closest('.ant-picker') ||
  target.closest('.ant-input-number') || // 数字输入框
  target.closest('.ant-mentions') || // 提及组件
  target.closest('.ant-cascader') || // 级联选择
  target.closest('.ant-tree-select') || // 树选择
  target.closest('input') ||
  target.closest('textarea')
```

## 已知限制

1. **富文本编辑器**: 如果使用富文本编辑器，可能需要额外的检查
2. **自定义输入组件**: 如果有自定义的输入组件，需要添加相应的 class 检查

## 相关文件

- `src/modules/designer/views/DesignerNew.vue` - 键盘事件处理
- `src/core/infrastructure/fields/renderers/SwitchField.vue` - 开关字段渲染器
- `src/core/infrastructure/fields/FieldRenderer.vue` - 字段渲染器容器
- `src/core/renderer/controls/register.ts` - 按钮组件配置

## 总结

本次修复解决了两个重要的用户体验问题：

1. **Backspace 键误删除** - 通过检查焦点元素，确保只在非编辑状态下删除组件
2. **开关按钮优化** - 通过调整布局和样式，使开关按钮更加美观和易用

这些改进将显著提升设计器的使用体验。
