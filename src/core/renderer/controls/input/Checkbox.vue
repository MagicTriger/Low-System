<template>
  <div class="control-checkbox" :class="{ 'control-disabled': disabled }">
    <!-- 复选框组 -->
    <a-checkbox-group
      v-if="type === 'group'"
      v-model:value="checkboxValue"
      :disabled="disabled"
      :options="normalizedOptions"
      :name="name"
      @change="handleChange"
    />
    
    <!-- 单个复选框 -->
    <a-checkbox
      v-else
      v-model:checked="checkboxChecked"
      :disabled="disabled"
      :indeterminate="indeterminate"
      :value="value"
      :name="name"
      @change="handleSingleChange"
    >
      {{ label }}
    </a-checkbox>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'

interface CheckboxOption {
  label: string
  value: string | number
  disabled?: boolean
  style?: object
  class?: string
}

interface Props {
  // 基础属性
  modelValue?: (string | number)[] | boolean
  disabled?: boolean
  
  // 复选框配置
  type?: 'single' | 'group'
  label?: string
  value?: string | number
  indeterminate?: boolean
  
  // 复选框组配置
  options?: CheckboxOption[]
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'group',
  indeterminate: false,
  options: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [event: Event]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const checkboxValue = ref<(string | number)[]>(Array.isArray(props.modelValue) ? props.modelValue : [])
const checkboxChecked = ref(Boolean(props.modelValue))

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
  if (props.type === 'group') {
    checkboxValue.value = Array.isArray(newValue) ? newValue : []
  } else {
    checkboxChecked.value = Boolean(newValue)
  }
}, { immediate: true })

// 监听内部值变化
watch(checkboxValue, (newValue) => {
  if (props.type === 'group') {
    emit('update:modelValue', newValue)
  }
})

watch(checkboxChecked, (newValue) => {
  if (props.type === 'single') {
    emit('update:modelValue', newValue)
  }
})

// 事件处理
const handleChange = (checkedValues: (string | number)[]) => {
  checkboxValue.value = checkedValues
  emit('change', { target: { value: checkedValues } } as any)
  emitEvent('change', { value: checkedValues })
}

const handleSingleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  checkboxChecked.value = target.checked
  emit('change', event)
  emitEvent('change', { checked: target.checked, value: props.value, event })
}

// 暴露的方法
const getValue = () => {
  return props.type === 'group' ? checkboxValue.value : checkboxChecked.value
}

const setValue = (value: any) => {
  if (props.type === 'group') {
    checkboxValue.value = Array.isArray(value) ? value : []
  } else {
    checkboxChecked.value = Boolean(value)
  }
}

const getChecked = () => {
  if (props.type === 'group') {
    return checkboxValue.value.length > 0
  }
  return checkboxChecked.value
}

const setChecked = (checked: boolean) => {
  if (props.type === 'single') {
    checkboxChecked.value = checked
  } else if (checked) {
    checkboxValue.value = normalizedOptions.value.map(option => option.value)
  } else {
    checkboxValue.value = []
  }
}

const getSelectedOptions = () => {
  if (props.type === 'group') {
    return normalizedOptions.value.filter(option => checkboxValue.value.includes(option.value))
  }
  return checkboxChecked.value && props.value ? [{ label: props.label, value: props.value }] : []
}

const addOption = (option: CheckboxOption) => {
  if (!props.options.some(opt => opt.value === option.value)) {
    props.options.push(option)
  }
}

const removeOption = (value: string | number) => {
  const index = props.options.findIndex(opt => opt.value === value)
  if (index > -1) {
    props.options.splice(index, 1)
    // 如果移除的选项已被选中，也要从选中值中移除
    if (checkboxValue.value.includes(value)) {
      checkboxValue.value = checkboxValue.value.filter(v => v !== value)
    }
  }
}

const updateOption = (value: string | number, updates: Partial<CheckboxOption>) => {
  const option = props.options.find(opt => opt.value === value)
  if (option) {
    Object.assign(option, updates)
  }
}

const checkAll = () => {
  if (props.type === 'group') {
    checkboxValue.value = normalizedOptions.value
      .filter(option => !option.disabled)
      .map(option => option.value)
  } else {
    checkboxChecked.value = true
  }
}

const uncheckAll = () => {
  if (props.type === 'group') {
    checkboxValue.value = []
  } else {
    checkboxChecked.value = false
  }
}

const toggleAll = () => {
  if (props.type === 'group') {
    const enabledOptions = normalizedOptions.value.filter(option => !option.disabled)
    const allChecked = enabledOptions.every(option => checkboxValue.value.includes(option.value))
    
    if (allChecked) {
      checkboxValue.value = checkboxValue.value.filter(value => 
        !enabledOptions.some(option => option.value === value)
      )
    } else {
      const newValues = [...checkboxValue.value]
      enabledOptions.forEach(option => {
        if (!newValues.includes(option.value)) {
          newValues.push(option.value)
        }
      })
      checkboxValue.value = newValues
    }
  } else {
    checkboxChecked.value = !checkboxChecked.value
  }
}

const isChecked = (value: string | number) => {
  if (props.type === 'group') {
    return checkboxValue.value.includes(value)
  }
  return checkboxChecked.value && props.value === value
}

const check = (value: string | number) => {
  if (props.type === 'group' && !checkboxValue.value.includes(value)) {
    checkboxValue.value.push(value)
  } else if (props.type === 'single' && props.value === value) {
    checkboxChecked.value = true
  }
}

const uncheck = (value: string | number) => {
  if (props.type === 'group') {
    checkboxValue.value = checkboxValue.value.filter(v => v !== value)
  } else if (props.type === 'single' && props.value === value) {
    checkboxChecked.value = false
  }
}

const toggle = (value?: string | number) => {
  if (props.type === 'group' && value !== undefined) {
    if (checkboxValue.value.includes(value)) {
      uncheck(value)
    } else {
      check(value)
    }
  } else if (props.type === 'single') {
    checkboxChecked.value = !checkboxChecked.value
  }
}

const clear = () => {
  if (props.type === 'group') {
    checkboxValue.value = []
  } else {
    checkboxChecked.value = false
  }
}

const validate = () => {
  // 基础验证逻辑
  return true
}

const reset = () => {
  clear()
}

const isEmpty = () => {
  if (props.type === 'group') {
    return checkboxValue.value.length === 0
  }
  return !checkboxChecked.value
}

const getCount = () => {
  if (props.type === 'group') {
    return checkboxValue.value.length
  }
  return checkboxChecked.value ? 1 : 0
}

const isAllChecked = () => {
  if (props.type === 'group') {
    const enabledOptions = normalizedOptions.value.filter(option => !option.disabled)
    return enabledOptions.length > 0 && enabledOptions.every(option => checkboxValue.value.includes(option.value))
  }
  return checkboxChecked.value
}

const isIndeterminate = () => {
  if (props.type === 'group') {
    const enabledOptions = normalizedOptions.value.filter(option => !option.disabled)
    const checkedCount = enabledOptions.filter(option => checkboxValue.value.includes(option.value)).length
    return checkedCount > 0 && checkedCount < enabledOptions.length
  }
  return props.indeterminate
}

const getOptionByValue = (value: string | number) => {
  return normalizedOptions.value.find(option => option.value === value)
}

const isOptionDisabled = (value: string | number) => {
  const option = getOptionByValue(value)
  return option?.disabled || false
}

const getEnabledOptions = () => {
  return normalizedOptions.value.filter(option => !option.disabled)
}

const getDisabledOptions = () => {
  return normalizedOptions.value.filter(option => option.disabled)
}

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  getChecked,
  setChecked,
  getSelectedOptions,
  addOption,
  removeOption,
  updateOption,
  checkAll,
  uncheckAll,
  toggleAll,
  isChecked,
  check,
  uncheck,
  toggle,
  clear,
  validate,
  reset,
  isEmpty,
  getCount,
  isAllChecked,
  isIndeterminate,
  getOptionByValue,
  isOptionDisabled,
  getEnabledOptions,
  getDisabledOptions
})
</script>

<style scoped>
.control-checkbox {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-checkbox {
  min-height: 32px;
}

/* 复选框组样式 */
:deep(.ant-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 复选框样式 */
:deep(.ant-checkbox-wrapper) {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

:deep(.ant-checkbox-wrapper:hover) {
  color: #1890ff;
}

:deep(.ant-checkbox-wrapper-disabled) {
  color: #d9d9d9;
  cursor: not-allowed;
}

:deep(.ant-checkbox-wrapper-disabled:hover) {
  color: #d9d9d9;
}

/* 复选框方框样式 */
:deep(.ant-checkbox) {
  position: relative;
  display: inline-block;
  margin-right: 8px;
  cursor: pointer;
}

:deep(.ant-checkbox-inner) {
  position: relative;
  top: 0;
  left: 0;
  display: block;
  width: 16px;
  height: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background-color: #fff;
  transition: all 0.3s;
}

:deep(.ant-checkbox:hover .ant-checkbox-inner) {
  border-color: #1890ff;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner) {
  border-color: #1890ff;
  background-color: #1890ff;
}

:deep(.ant-checkbox-checked .ant-checkbox-inner::after) {
  position: absolute;
  top: 50%;
  left: 21.5%;
  display: table;
  width: 5.71428571px;
  height: 9.14285714px;
  border: 2px solid #fff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg) scale(1) translate(-50%, -50%);
  opacity: 1;
  transition: all 0.2s cubic-bezier(0.12, 0.4, 0.29, 1.46) 0.1s;
  content: '';
}

:deep(.ant-checkbox-indeterminate .ant-checkbox-inner) {
  border-color: #1890ff;
  background-color: #1890ff;
}

:deep(.ant-checkbox-indeterminate .ant-checkbox-inner::after) {
  position: absolute;
  top: 50%;
  left: 50%;
  display: table;
  width: 8px;
  height: 8px;
  background-color: #fff;
  border: 0;
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
  content: '';
}

:deep(.ant-checkbox-disabled .ant-checkbox-inner) {
  border-color: #d9d9d9;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

:deep(.ant-checkbox-disabled.ant-checkbox-checked .ant-checkbox-inner::after) {
  border-color: #d9d9d9;
}

:deep(.ant-checkbox-disabled.ant-checkbox-indeterminate .ant-checkbox-inner::after) {
  background-color: #d9d9d9;
}

/* 复选框文本样式 */
:deep(.ant-checkbox + span) {
  padding-left: 8px;
  padding-right: 8px;
  user-select: none;
}

/* 垂直布局 */
:deep(.ant-checkbox-group-vertical) {
  flex-direction: column;
  align-items: flex-start;
}

:deep(.ant-checkbox-group-vertical .ant-checkbox-wrapper) {
  margin-right: 0;
  margin-bottom: 8px;
}

/* 焦点样式 */
:deep(.ant-checkbox-input:focus + .ant-checkbox-inner) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12);
}

/* 错误状态样式 */
:deep(.ant-checkbox-wrapper-error .ant-checkbox-inner) {
  border-color: #ff4d4f;
}

:deep(.ant-checkbox-wrapper-error:hover .ant-checkbox-inner) {
  border-color: #ff4d4f;
}

:deep(.ant-checkbox-wrapper-error.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: #ff4d4f;
  border-color: #ff4d4f;
}

/* 警告状态样式 */
:deep(.ant-checkbox-wrapper-warning .ant-checkbox-inner) {
  border-color: #faad14;
}

:deep(.ant-checkbox-wrapper-warning:hover .ant-checkbox-inner) {
  border-color: #faad14;
}

:deep(.ant-checkbox-wrapper-warning.ant-checkbox-checked .ant-checkbox-inner) {
  background-color: #faad14;
  border-color: #faad14;
}

/* 动画效果 */
:deep(.ant-checkbox-inner) {
  transition: all 0.3s cubic-bezier(0.645, 0.045, 0.355, 1);
}

:deep(.ant-checkbox-inner::after) {
  transition: all 0.1s cubic-bezier(0.71, -0.46, 0.88, 0.6), opacity 0.1s;
}

/* 选中动画 */
@keyframes antCheckboxEffect {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

:deep(.ant-checkbox-wrapper:not(.ant-checkbox-wrapper-disabled):hover .ant-checkbox::after) {
  visibility: visible;
  transform: scale(1);
  opacity: 0;
  animation: antCheckboxEffect 0.36s ease-in-out;
  animation-fill-mode: both;
  content: '';
}

:deep(.ant-checkbox::after) {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: 1px solid #1890ff;
  border-radius: 2px;
  visibility: hidden;
  animation: antCheckboxEffect 0.36s ease-in-out;
  animation-fill-mode: both;
  content: '';
}
</style>