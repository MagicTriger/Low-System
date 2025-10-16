# 紧急修复：图标和属性不生效问题

## 问题现状

从控制台日志和截图可以看到：

1. ✅ 图标选择器正常打开
2. ✅ 用户可以选择图标
3. ❌ 选择后图标值为空字符串
4. ❌ 画布上的按钮不显示图标
5. ❌ 其他配置项（按钮类型、大小、字体大小等）也不生效

## 根本原因分析

从日志 `[PropertiesPanel] Updating property: icon =` 可以看出，传递给 `handlePropertyUpdate` 的值是空字符串或 undefined。

**可能的原因**:

1. IconField 的 v-model 绑定问题
2. IconPicker 的 select 事件没有正确触发
3. FieldRenderer 的 modelValue 传递问题

## 立即修复方案

### 修复 1: 简化 IconField 的事件处理

**文件**: `src/core/infrastructure/fields/renderers/IconField.vue`

**问题**: 使用了 Modal 的 OK 按钮，但用户直接点击图标时应该立即关闭

**解决方案**: 移除 Modal 的 footer，直接在选择图标时关闭

```vue
<template>
  <div class="icon-field">
    <a-input
      :value="modelValue"
      :placeholder="config.placeholder || '选择图标'"
      :disabled="config.disabled"
      :readonly="true"
      @click="handlePickerClick"
    >
      <template #prefix>
        <component :is="iconComponent" v-if="iconComponent" class="icon-preview" />
        <span v-else class="icon-placeholder">?</span>
      </template>
      <template #suffix>
        <a-button v-if="modelValue" type="text" size="small" @click.stop="handleClear">
          <CloseCircleOutlined />
        </a-button>
      </template>
    </a-input>

    <a-modal v-model:open="pickerVisible" title="选择图标" width="800px" :footer="null" @cancel="pickerVisible = false">
      <IconPicker v-model="selectedIcon" @select="handleIconSelect" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CloseCircleOutlined } from '@ant-design/icons-vue'
import * as AntIcons from '@ant-design/icons-vue'
import IconPicker from '@core/renderer/icons/IconPicker.vue'
import type { FieldConfig } from '../types'

interface Props {
  config: FieldConfig
  modelValue: any
  errors?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'validate', errors: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const pickerVisible = ref(false)
const selectedIcon = ref(props.modelValue || '')

const iconComponent = computed(() => {
  if (!props.modelValue) return null
  return (AntIcons as any)[props.modelValue] || null
})

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  newValue => {
    selectedIcon.value = newValue || ''
  },
  { immediate: true }
)

function handlePickerClick() {
  if (props.config.disabled) return
  selectedIcon.value = props.modelValue || ''
  pickerVisible.value = true
}

function handleIconSelect(icon: any) {
  console.log('[IconField] Icon selected:', icon)
  const iconName = icon.name || icon
  console.log('[IconField] Emitting update:modelValue:', iconName)
  selectedIcon.value = iconName
  emit('update:modelValue', iconName)
  pickerVisible.value = false
}

function handleClear() {
  console.log('[IconField] Clearing icon')
  selectedIcon.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.icon-field {
  width: 100%;
}

.icon-field :deep(.ant-input) {
  cursor: pointer;
}

.icon-preview {
  font-size: 16px;
  color: #1890ff;
}

.icon-placeholder {
  display: inline-block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  color: #d9d9d9;
  font-size: 12px;
}
</style>
```

### 修复 2: 确保 IconPicker 正确发出事件

**文件**: `src/core/renderer/icons/IconPicker.vue`

确认 selectIcon 方法正确发出事件：

```typescript
function selectIcon(icon: IconDefinition) {
  console.log('[IconPicker] Selecting icon:', icon.name)
  selectedIcon.value = icon.name
  emit('update:modelValue', icon.name)
  emit('select', icon)
}
```

### 修复 3: 检查 Button 组件的 props 读取

**文件**: `src/core/renderer/controls/common/Button.vue`

确保正确读取 props：

```typescript
const icon = computed(() => {
  const iconValue = control.value.props?.icon
  console.log('[Button] Reading icon from props:', iconValue)
  console.log('[Button] Full props:', JSON.stringify(control.value.props))
  return iconValue
})
```

## 测试步骤

### 步骤 1: 清除浏览器缓存

```bash
# 在浏览器中按 Ctrl+Shift+Delete
# 或者硬刷新 Ctrl+Shift+R
```

### 步骤 2: 重新测试图标选择

1. 打开设计器
2. 添加一个按钮组件
3. 打开浏览器控制台
4. 选择按钮，打开属性面板
5. 点击图标字段
6. 选择一个图标（如 HomeOutlined）
7. 观察控制台日志

**预期日志**:

```
[IconPicker] Selecting icon: HomeOutlined
[IconField] Icon selected: {name: "HomeOutlined", ...}
[IconField] Emitting update:modelValue: HomeOutlined
[FieldRenderer] Field value updated: icon = HomeOutlined
[PanelGroup] Field updated: icon = HomeOutlined
[PropertiesPanel] Updating property: icon = HomeOutlined
[DesignerNew] 属性更新: icon = HomeOutlined
[Button] Reading icon from props: HomeOutlined
```

### 步骤 3: 验证图标显示

1. 检查图标字段是否显示图标预览
2. 检查画布上的按钮是否显示图标
3. 尝试切换不同的图标
4. 尝试清除图标

## 如果问题仍然存在

### 检查 1: 验证 IconPicker 的 select 事件

在浏览器控制台执行：

```javascript
// 检查 IconPicker 组件是否正确挂载
document.querySelector('.icon-picker')

// 检查图标项是否可点击
document.querySelectorAll('.icon-item')
```

### 检查 2: 验证事件传递链

在每个组件中添加更多日志：

1. IconPicker.selectIcon
2. IconField.handleIconSelect
3. FieldRenderer.fieldValue setter
4. PanelGroup.handleFieldUpdate
5. PropertiesPanel.handlePropertyUpdate
6. DesignerNew.handlePropertyUpdate

### 检查 3: 验证 Button 组件的 props

在控制台执行：

```javascript
// 获取选中的按钮组件
const button = document.querySelector('[data-control-id^="button_"]')
// 检查 Vue 实例的 props
button.__vueParentComponent.props.control.props
```

## 备用方案

如果上述修复都不起作用，考虑：

### 方案 A: 使用 IconPickerField 替代 IconField

直接使用 `src/core/renderer/designer/settings/IconPickerField.vue`，它已经被证明可以工作。

### 方案 B: 简化图标选择流程

使用简单的下拉选择器而不是图标库：

```typescript
{
  key: 'icon',
  label: '图标',
  type: FieldType.SELECT,
  options: [
    { label: '无', value: '' },
    { label: 'Home', value: 'HomeOutlined' },
    { label: 'User', value: 'UserOutlined' },
    { label: 'Setting', value: 'SettingOutlined' },
    // ... 更多常用图标
  ],
  layout: { span: 12 },
}
```

## 紧急联系

如果需要立即解决，请：

1. 提供完整的控制台日志截图
2. 提供网络请求截图（F12 -> Network）
3. 提供 Vue DevTools 的组件树截图
