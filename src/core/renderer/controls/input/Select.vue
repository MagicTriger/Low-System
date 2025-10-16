<template>
  <div class="control-select" :class="{ 'control-disabled': disabled }">
    <a-select
      v-model:value="selectValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :size="size"
      :status="status"
      :bordered="bordered"
      :allow-clear="allowClear"
      :auto-focus="autoFocus"
      :default-active-first-option="defaultActiveFirstOption"
      :dropdown-class-name="dropdownClassName"
      :dropdown-match-select-width="dropdownMatchSelectWidth"
      :dropdown-style="dropdownStyle"
      :filter-option="filterOption"
      :first-active-value="firstActiveValue"
      :get-popup-container="getPopupContainer"
      :label-in-value="labelInValue"
      :max-tag-count="maxTagCount"
      :max-tag-placeholder="maxTagPlaceholder"
      :max-tag-text-length="maxTagTextLength"
      :menu-item-selected-icon="menuItemSelectedIcon"
      :mode="mode"
      :not-found-content="notFoundContent"
      :option-filter-prop="optionFilterProp"
      :option-label-prop="optionLabelProp"
      :remove-icon="removeIcon"
      :search-value="searchValue"
      :show-arrow="showArrow"
      :show-search="showSearch"
      :suffix-icon="suffixIcon"
      :tag-render="tagRender"
      :token-separators="tokenSeparators"
      :virtual="virtual"
      :loading="loading"
      @change="handleChange"
      @deselect="handleDeselect"
      @focus="handleFocus"
      @blur="handleBlur"
      @clear="handleClear"
      @dropdown-visible-change="handleDropdownVisibleChange"
      @input-key-down="handleInputKeyDown"
      @mouse-enter="handleMouseEnter"
      @mouse-leave="handleMouseLeave"
      @popup-scroll="handlePopupScroll"
      @search="handleSearch"
      @select="handleSelect"
    >
      <a-select-option
        v-for="option in normalizedOptions"
        :key="option.value"
        :value="option.value"
        :disabled="option.disabled"
        :title="option.title"
        :class="option.class"
      >
        {{ option.label }}
      </a-select-option>
      
      <a-select-opt-group
        v-for="group in optionGroups"
        :key="group.label"
        :label="group.label"
      >
        <a-select-option
          v-for="option in group.options"
          :key="option.value"
          :value="option.value"
          :disabled="option.disabled"
          :title="option.title"
          :class="option.class"
        >
          {{ option.label }}
        </a-select-option>
      </a-select-opt-group>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'
import type { VNode } from 'vue'

type SizeType = 'large' | 'middle' | 'small'
type StatusType = 'error' | 'warning'
type ModeType = 'multiple' | 'tags' | 'combobox'

interface SelectOption {
  label: string
  value: string | number
  disabled?: boolean
  title?: string
  class?: string
}

interface SelectOptionGroup {
  label: string
  options: SelectOption[]
}

interface Props {
  // 基础属性
  modelValue?: string | number | (string | number)[] | null
  disabled?: boolean
  placeholder?: string
  
  // 显示属性
  size?: SizeType
  status?: StatusType
  bordered?: boolean
  allowClear?: boolean
  autoFocus?: boolean
  loading?: boolean
  
  // 选项数据
  options?: SelectOption[]
  optionGroups?: SelectOptionGroup[]
  
  // 下拉框配置
  defaultActiveFirstOption?: boolean
  dropdownClassName?: string
  dropdownMatchSelectWidth?: boolean | number
  dropdownStyle?: object
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement
  notFoundContent?: string | VNode
  virtual?: boolean
  
  // 搜索配置
  showSearch?: boolean
  filterOption?: boolean | ((input: string, option: any) => boolean)
  optionFilterProp?: string
  optionLabelProp?: string
  searchValue?: string
  
  // 多选配置
  mode?: ModeType
  maxTagCount?: number | 'responsive'
  maxTagPlaceholder?: string | ((omittedValues: any[]) => VNode)
  maxTagTextLength?: number
  tagRender?: (props: any) => VNode
  tokenSeparators?: string[]
  
  // 显示配置
  labelInValue?: boolean
  showArrow?: boolean
  firstActiveValue?: string | string[]
  
  // 图标配置
  suffixIcon?: VNode
  removeIcon?: VNode
  menuItemSelectedIcon?: VNode
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'middle',
  bordered: true,
  allowClear: false,
  autoFocus: false,
  loading: false,
  options: () => [],
  optionGroups: () => [],
  defaultActiveFirstOption: true,
  dropdownMatchSelectWidth: true,
  showSearch: false,
  filterOption: true,
  optionFilterProp: 'children',
  optionLabelProp: 'children',
  labelInValue: false,
  showArrow: true,
  virtual: true
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, option: any]
  deselect: [value: any, option: any]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  clear: []
  dropdownVisibleChange: [open: boolean]
  inputKeyDown: [event: KeyboardEvent]
  mouseEnter: [event: MouseEvent]
  mouseLeave: [event: MouseEvent]
  popupScroll: [event: Event]
  search: [value: string]
  select: [value: any, option: any]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const selectValue = ref(props.modelValue)

// 标准化选项数据
const normalizedOptions = computed(() => {
  return props.options.map(option => ({
    ...option,
    label: option.label || String(option.value),
    value: option.value
  }))
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  selectValue.value = newValue
}, { immediate: true })

// 监听内部值变化
watch(selectValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 事件处理
const handleChange = (value: any, option: any) => {
  selectValue.value = value
  emit('change', value, option)
  emitEvent('change', { value, option })
}

const handleDeselect = (value: any, option: any) => {
  emit('deselect', value, option)
  emitEvent('deselect', { value, option })
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
  emitEvent('focus', { event })
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
  emitEvent('blur', { event })
}

const handleClear = () => {
  selectValue.value = props.mode ? [] : null
  emit('clear')
  emitEvent('clear', {})
}

const handleDropdownVisibleChange = (open: boolean) => {
  emit('dropdownVisibleChange', open)
  emitEvent('dropdownVisibleChange', { open })
}

const handleInputKeyDown = (event: KeyboardEvent) => {
  emit('inputKeyDown', event)
  emitEvent('inputKeyDown', { event })
}

const handleMouseEnter = (event: MouseEvent) => {
  emit('mouseEnter', event)
  emitEvent('mouseEnter', { event })
}

const handleMouseLeave = (event: MouseEvent) => {
  emit('mouseLeave', event)
  emitEvent('mouseLeave', { event })
}

const handlePopupScroll = (event: Event) => {
  emit('popupScroll', event)
  emitEvent('popupScroll', { event })
}

const handleSearch = (value: string) => {
  emit('search', value)
  emitEvent('search', { value })
}

const handleSelect = (value: any, option: any) => {
  emit('select', value, option)
  emitEvent('select', { value, option })
}

// 暴露的方法
const getValue = () => {
  return selectValue.value
}

const setValue = (value: any) => {
  selectValue.value = value
}

const clear = () => {
  selectValue.value = props.mode ? [] : null
}

const focus = () => {
  // 聚焦到选择器
}

const blur = () => {
  // 失焦
}

const getSelectedOptions = () => {
  if (!selectValue.value) return []
  
  const values = Array.isArray(selectValue.value) ? selectValue.value : [selectValue.value]
  return normalizedOptions.value.filter(option => values.includes(option.value))
}

const addOption = (option: SelectOption) => {
  if (!props.options.some(opt => opt.value === option.value)) {
    props.options.push(option)
  }
}

const removeOption = (value: string | number) => {
  const index = props.options.findIndex(opt => opt.value === value)
  if (index > -1) {
    props.options.splice(index, 1)
  }
}

const updateOption = (value: string | number, updates: Partial<SelectOption>) => {
  const option = props.options.find(opt => opt.value === value)
  if (option) {
    Object.assign(option, updates)
  }
}

const selectAll = () => {
  if (props.mode) {
    selectValue.value = normalizedOptions.value
      .filter(option => !option.disabled)
      .map(option => option.value)
  }
}

const deselectAll = () => {
  if (props.mode) {
    selectValue.value = []
  } else {
    selectValue.value = null
  }
}

const validate = () => {
  // 基础验证逻辑
  if (props.mode) {
    return Array.isArray(selectValue.value)
  }
  return true
}

const reset = () => {
  selectValue.value = props.mode ? [] : null
}

const isEmpty = () => {
  if (props.mode) {
    return !Array.isArray(selectValue.value) || selectValue.value.length === 0
  }
  return selectValue.value === null || selectValue.value === undefined
}

const getOptionByValue = (value: string | number) => {
  return normalizedOptions.value.find(option => option.value === value)
}

const hasValue = (value: string | number) => {
  if (props.mode) {
    return Array.isArray(selectValue.value) && selectValue.value.includes(value)
  }
  return selectValue.value === value
}

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  clear,
  focus,
  blur,
  getSelectedOptions,
  addOption,
  removeOption,
  updateOption,
  selectAll,
  deselectAll,
  validate,
  reset,
  isEmpty,
  getOptionByValue,
  hasValue
})
</script>

<style scoped>
.control-select {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-select {
  min-height: 32px;
}

/* 选择器样式 */
:deep(.ant-select) {
  width: 100%;
}

/* 选择器选中项样式 */
:deep(.ant-select-selector) {
  transition: all 0.3s;
}

:deep(.ant-select-focused .ant-select-selector) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

/* 多选标签样式 */
:deep(.ant-select-selection-item) {
  background-color: #f6f8fa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 0 7px;
  margin-right: 4px;
  margin-bottom: 2px;
  display: inline-flex;
  align-items: center;
  max-width: 100%;
}

:deep(.ant-select-selection-item-content) {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:deep(.ant-select-selection-item-remove) {
  margin-left: 4px;
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.3s;
}

:deep(.ant-select-selection-item-remove:hover) {
  color: #ff4d4f;
}

/* 下拉框样式 */
:deep(.ant-select-dropdown) {
  border-radius: 6px;
  box-shadow: 0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05);
}

:deep(.ant-select-item) {
  padding: 5px 12px;
  cursor: pointer;
  transition: background-color 0.3s;
}

:deep(.ant-select-item:hover) {
  background-color: #f5f5f5;
}

:deep(.ant-select-item-option-selected) {
  background-color: #e6f7ff;
  color: #1890ff;
}

:deep(.ant-select-item-option-disabled) {
  color: #d9d9d9;
  cursor: not-allowed;
}

:deep(.ant-select-item-option-disabled:hover) {
  background-color: transparent;
}

/* 分组样式 */
:deep(.ant-select-item-group) {
  padding: 8px 12px;
  color: #8c8c8c;
  font-size: 12px;
  font-weight: bold;
  background-color: #fafafa;
}

/* 搜索框样式 */
:deep(.ant-select-selection-search-input) {
  border: none;
  outline: none;
  background: transparent;
}

/* 清除按钮样式 */
:deep(.ant-select-clear) {
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.3s;
}

:deep(.ant-select-clear:hover) {
  color: #1890ff;
}

/* 箭头图标样式 */
:deep(.ant-select-arrow) {
  color: #8c8c8c;
  transition: transform 0.3s, color 0.3s;
}

:deep(.ant-select-open .ant-select-arrow) {
  transform: rotate(180deg);
  color: #1890ff;
}

/* 加载状态样式 */
:deep(.ant-select-selection-placeholder) {
  color: #bfbfbf;
}

/* 无边框样式 */
:deep(.ant-select-borderless .ant-select-selector) {
  border: none !important;
  box-shadow: none !important;
}

/* 状态样式 */
:deep(.ant-select-status-error .ant-select-selector) {
  border-color: #ff4d4f;
}

:deep(.ant-select-status-warning .ant-select-selector) {
  border-color: #faad14;
}

/* 大小样式 */
:deep(.ant-select-lg .ant-select-selector) {
  padding: 6.5px 11px;
  font-size: 16px;
}

:deep(.ant-select-sm .ant-select-selector) {
  padding: 0px 7px;
  font-size: 14px;
}
</style>