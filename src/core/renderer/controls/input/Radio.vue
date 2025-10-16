<template>
  <div class="control-radio" :class="{ 'control-disabled': disabled }">
    <!-- 单选按钮组 -->
    <a-radio-group
      v-if="type === 'group'"
      v-model:value="radioValue"
      :disabled="disabled"
      :size="size"
      :button-style="buttonStyle"
      :options="normalizedOptions"
      :option-type="optionType"
      :name="name"
      @change="handleChange"
    />
    
    <!-- 单个单选按钮 -->
    <a-radio
      v-else
      v-model:checked="radioChecked"
      :disabled="disabled"
      :value="value"
      :name="name"
      @change="handleSingleChange"
    >
      {{ label }}
    </a-radio>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'

type SizeType = 'large' | 'middle' | 'small'
type ButtonStyleType = 'outline' | 'solid'
type OptionTypeType = 'default' | 'button'

interface RadioOption {
  label: string
  value: string | number
  disabled?: boolean
  style?: object
  class?: string
}

interface Props {
  // 基础属性
  modelValue?: string | number | boolean
  disabled?: boolean
  
  // 单选按钮配置
  type?: 'single' | 'group'
  label?: string
  value?: string | number
  
  // 单选按钮组配置
  options?: RadioOption[]
  size?: SizeType
  buttonStyle?: ButtonStyleType
  optionType?: OptionTypeType
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'group',
  size: 'middle',
  buttonStyle: 'outline',
  optionType: 'default',
  options: () => []
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [event: Event]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const radioValue = ref(props.modelValue)
const radioChecked = ref(Boolean(props.modelValue))

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
    radioValue.value = newValue
  } else {
    radioChecked.value = Boolean(newValue)
  }
}, { immediate: true })

// 监听内部值变化
watch(radioValue, (newValue) => {
  if (props.type === 'group') {
    emit('update:modelValue', newValue)
  }
})

watch(radioChecked, (newValue) => {
  if (props.type === 'single') {
    emit('update:modelValue', newValue ? props.value : null)
  }
})

// 事件处理
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  radioValue.value = target.value
  emit('change', event)
  emitEvent('change', { value: target.value, event })
}

const handleSingleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  radioChecked.value = target.checked
  emit('change', event)
  emitEvent('change', { checked: target.checked, value: props.value, event })
}

// 暴露的方法
const getValue = () => {
  return props.type === 'group' ? radioValue.value : (radioChecked.value ? props.value : null)
}

const setValue = (value: any) => {
  if (props.type === 'group') {
    radioValue.value = value
  } else {
    radioChecked.value = Boolean(value)
  }
}

const getChecked = () => {
  if (props.type === 'group') {
    return radioValue.value !== null && radioValue.value !== undefined
  }
  return radioChecked.value
}

const setChecked = (checked: boolean) => {
  if (props.type === 'single') {
    radioChecked.value = checked
  }
}

const getSelectedOption = () => {
  if (props.type === 'group' && radioValue.value !== null) {
    return normalizedOptions.value.find(option => option.value === radioValue.value)
  }
  return null
}

const addOption = (option: RadioOption) => {
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

const updateOption = (value: string | number, updates: Partial<RadioOption>) => {
  const option = props.options.find(opt => opt.value === value)
  if (option) {
    Object.assign(option, updates)
  }
}

const clear = () => {
  if (props.type === 'group') {
    radioValue.value = null
  } else {
    radioChecked.value = false
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
    return radioValue.value === null || radioValue.value === undefined
  }
  return !radioChecked.value
}

const hasValue = (value: string | number) => {
  if (props.type === 'group') {
    return radioValue.value === value
  }
  return radioChecked.value && props.value === value
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
  getSelectedOption,
  addOption,
  removeOption,
  updateOption,
  clear,
  validate,
  reset,
  isEmpty,
  hasValue,
  getOptionByValue,
  isOptionDisabled,
  getEnabledOptions,
  getDisabledOptions
})
</script>

<style scoped>
.control-radio {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-radio {
  min-height: 32px;
}

/* 单选按钮组样式 */
:deep(.ant-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* 单选按钮样式 */
:deep(.ant-radio-wrapper) {
  display: inline-flex;
  align-items: center;
  margin-right: 8px;
  margin-bottom: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

:deep(.ant-radio-wrapper:hover) {
  color: #1890ff;
}

:deep(.ant-radio-wrapper-disabled) {
  color: #d9d9d9;
  cursor: not-allowed;
}

:deep(.ant-radio-wrapper-disabled:hover) {
  color: #d9d9d9;
}

/* 单选按钮圆圈样式 */
:deep(.ant-radio) {
  position: relative;
  display: inline-block;
  margin-right: 8px;
  cursor: pointer;
}

:deep(.ant-radio-inner) {
  position: relative;
  top: 0;
  left: 0;
  display: block;
  width: 16px;
  height: 16px;
  border: 1px solid #d9d9d9;
  border-radius: 50%;
  background-color: #fff;
  transition: all 0.3s;
}

:deep(.ant-radio:hover .ant-radio-inner) {
  border-color: #1890ff;
}

:deep(.ant-radio-checked .ant-radio-inner) {
  border-color: #1890ff;
  background-color: #1890ff;
}

:deep(.ant-radio-checked .ant-radio-inner::after) {
  position: absolute;
  top: 3px;
  left: 3px;
  display: table;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #fff;
  content: '';
  transform: scale(1);
  transition: all 0.3s cubic-bezier(0.78, 0.14, 0.15, 0.86);
}

:deep(.ant-radio-disabled .ant-radio-inner) {
  border-color: #d9d9d9;
  background-color: #f5f5f5;
  cursor: not-allowed;
}

:deep(.ant-radio-disabled.ant-radio-checked .ant-radio-inner::after) {
  background-color: #d9d9d9;
}

/* 单选按钮文本样式 */
:deep(.ant-radio + span) {
  padding-left: 8px;
  padding-right: 8px;
  user-select: none;
}

/* 按钮样式单选按钮 */
:deep(.ant-radio-button-wrapper) {
  position: relative;
  display: inline-block;
  height: 32px;
  margin: 0;
  padding: 0 15px;
  color: #262626;
  line-height: 30px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-left: 0;
  cursor: pointer;
  transition: all 0.3s;
}

:deep(.ant-radio-button-wrapper:first-child) {
  border-left: 1px solid #d9d9d9;
  border-radius: 6px 0 0 6px;
}

:deep(.ant-radio-button-wrapper:last-child) {
  border-radius: 0 6px 6px 0;
}

:deep(.ant-radio-button-wrapper:only-child) {
  border-radius: 6px;
}

:deep(.ant-radio-button-wrapper:hover) {
  position: relative;
  color: #1890ff;
  border-color: #1890ff;
  z-index: 1;
}

:deep(.ant-radio-button-wrapper-checked) {
  position: relative;
  color: #1890ff;
  background: #fff;
  border-color: #1890ff;
  box-shadow: -1px 0 0 0 #1890ff;
  z-index: 1;
}

:deep(.ant-radio-button-wrapper-checked:first-child) {
  box-shadow: none;
}

:deep(.ant-radio-button-wrapper-checked:hover) {
  color: #40a9ff;
  border-color: #40a9ff;
  box-shadow: -1px 0 0 0 #40a9ff;
}

:deep(.ant-radio-button-wrapper-disabled) {
  color: #d9d9d9;
  background-color: #f5f5f5;
  border-color: #d9d9d9;
  cursor: not-allowed;
}

:deep(.ant-radio-button-wrapper-disabled:hover) {
  color: #d9d9d9;
  background-color: #f5f5f5;
  border-color: #d9d9d9;
}

/* 实心按钮样式 */
:deep(.ant-radio-group-solid .ant-radio-button-wrapper-checked) {
  color: #fff;
  background: #1890ff;
  border-color: #1890ff;
}

:deep(.ant-radio-group-solid .ant-radio-button-wrapper-checked:hover) {
  color: #fff;
  background: #40a9ff;
  border-color: #40a9ff;
}

/* 大小样式 */
:deep(.ant-radio-group-large .ant-radio-button-wrapper) {
  height: 40px;
  padding: 0 15px;
  font-size: 16px;
  line-height: 38px;
}

:deep(.ant-radio-group-small .ant-radio-button-wrapper) {
  height: 24px;
  padding: 0 7px;
  font-size: 14px;
  line-height: 22px;
}

/* 垂直布局 */
:deep(.ant-radio-group-vertical) {
  flex-direction: column;
  align-items: flex-start;
}

:deep(.ant-radio-group-vertical .ant-radio-wrapper) {
  margin-right: 0;
  margin-bottom: 8px;
}

/* 焦点样式 */
:deep(.ant-radio-input:focus + .ant-radio-inner) {
  border-color: #1890ff;
  box-shadow: 0 0 0 3px rgba(24, 144, 255, 0.12);
}

/* 错误状态样式 */
:deep(.ant-radio-wrapper-error .ant-radio-inner) {
  border-color: #ff4d4f;
}

:deep(.ant-radio-wrapper-error:hover .ant-radio-inner) {
  border-color: #ff4d4f;
}

/* 警告状态样式 */
:deep(.ant-radio-wrapper-warning .ant-radio-inner) {
  border-color: #faad14;
}

:deep(.ant-radio-wrapper-warning:hover .ant-radio-inner) {
  border-color: #faad14;
}
</style>