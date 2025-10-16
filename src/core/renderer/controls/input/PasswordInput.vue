<template>
  <div class="control-password-input" :class="{ 'control-disabled': disabled }">
    <a-input-password
      v-model:value="passwordValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :size="size"
      :status="status"
      :addon-before="addonBefore"
      :addon-after="addonAfter"
      :prefix="prefix"
      :suffix="suffix"
      :bordered="bordered"
      :auto-focus="autoFocus"
      :read-only="readOnly"
      :max-length="maxLength"
      :show-count="showCount"
      :allow-clear="allowClear"
      :visibility-toggle="visibilityToggle"
      :icon-render="iconRender"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
      @press-enter="handlePressEnter"
      @input="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useControlMembers } from '../../control-members'
import type { VNode } from 'vue'

type SizeType = 'large' | 'middle' | 'small'
type StatusType = 'error' | 'warning'

interface Props {
  // 基础属性
  modelValue?: string
  disabled?: boolean
  placeholder?: string
  
  // 显示属性
  size?: SizeType
  status?: StatusType
  addonBefore?: string
  addonAfter?: string
  prefix?: string
  suffix?: string
  bordered?: boolean
  autoFocus?: boolean
  readOnly?: boolean
  maxLength?: number
  showCount?: boolean
  allowClear?: boolean
  
  // 密码特有属性
  visibilityToggle?: boolean
  iconRender?: (visible: boolean) => VNode
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'middle',
  bordered: true,
  autoFocus: false,
  readOnly: false,
  showCount: false,
  allowClear: false,
  visibilityToggle: true
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  pressEnter: [event: KeyboardEvent]
  input: [event: Event]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const passwordValue = ref<string>(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  passwordValue.value = newValue
}, { immediate: true })

// 监听内部值变化
watch(passwordValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 事件处理
const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  passwordValue.value = target.value
  emit('change', event)
  emitEvent('change', { value: target.value, event })
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
  emitEvent('blur', { event })
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
  emitEvent('focus', { event })
}

const handlePressEnter = (event: KeyboardEvent) => {
  emit('pressEnter', event)
  emitEvent('pressEnter', { event })
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  passwordValue.value = target.value
  emit('input', event)
  emitEvent('input', { value: target.value, event })
}

// 暴露的方法
const getValue = () => {
  return passwordValue.value
}

const setValue = (value: string) => {
  passwordValue.value = value
}

const clear = () => {
  passwordValue.value = ''
}

const focus = () => {
  // 聚焦到输入框
}

const blur = () => {
  // 失焦
}

const validate = () => {
  // 基础验证逻辑
  const value = passwordValue.value
  
  // 检查最大长度
  if (props.maxLength && value.length > props.maxLength) {
    return false
  }
  
  return true
}

const reset = () => {
  passwordValue.value = ''
}

const select = () => {
  // 选中所有文本
}

const selectRange = (start: number, end: number) => {
  // 选中指定范围的文本
}

const getLength = () => {
  return passwordValue.value.length
}

const isEmpty = () => {
  return passwordValue.value.length === 0
}

const isValid = () => {
  return validate()
}

// 密码强度检查
const getStrength = () => {
  const password = passwordValue.value
  let strength = 0
  
  if (password.length >= 8) strength++
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  return strength
}

const getStrengthText = () => {
  const strength = getStrength()
  
  switch (strength) {
    case 0:
    case 1:
      return '弱'
    case 2:
    case 3:
      return '中'
    case 4:
    case 5:
      return '强'
    default:
      return '弱'
  }
}

const hasUpperCase = () => {
  return /[A-Z]/.test(passwordValue.value)
}

const hasLowerCase = () => {
  return /[a-z]/.test(passwordValue.value)
}

const hasNumber = () => {
  return /[0-9]/.test(passwordValue.value)
}

const hasSpecialChar = () => {
  return /[^a-zA-Z0-9]/.test(passwordValue.value)
}

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  clear,
  focus,
  blur,
  validate,
  reset,
  select,
  selectRange,
  getLength,
  isEmpty,
  isValid,
  getStrength,
  getStrengthText,
  hasUpperCase,
  hasLowerCase,
  hasNumber,
  hasSpecialChar
})
</script>

<style scoped>
.control-password-input {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-password-input {
  min-height: 32px;
}

/* 密码输入框样式 */
:deep(.ant-input-password) {
  width: 100%;
}

/* 可见性切换按钮样式 */
:deep(.ant-input-password-icon) {
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.3s;
}

:deep(.ant-input-password-icon:hover) {
  color: #1890ff;
}

/* 清除按钮样式 */
:deep(.ant-input-clear-icon) {
  color: #8c8c8c;
  cursor: pointer;
  transition: color 0.3s;
}

:deep(.ant-input-clear-icon:hover) {
  color: #1890ff;
}

/* 前缀和后缀样式 */
:deep(.ant-input-prefix) {
  margin-right: 4px;
  color: #8c8c8c;
}

:deep(.ant-input-suffix) {
  margin-left: 4px;
  color: #8c8c8c;
}

/* 附加内容样式 */
:deep(.ant-input-group-addon) {
  padding: 0 11px;
  color: rgba(0, 0, 0, 0.85);
  font-weight: normal;
  font-size: 14px;
  text-align: center;
  background-color: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  transition: all 0.3s;
}

/* 无边框样式 */
:deep(.ant-input-borderless) {
  box-shadow: none;
}

/* 状态样式 */
:deep(.ant-input-status-error) {
  border-color: #ff4d4f;
}

:deep(.ant-input-status-warning) {
  border-color: #faad14;
}

/* 只读样式 */
:deep(.ant-input[readonly]) {
  background-color: #f5f5f5;
  cursor: default;
}

/* 字符计数样式 */
:deep(.ant-input-show-count-suffix) {
  color: #8c8c8c;
}

/* 大小样式 */
:deep(.ant-input-lg) {
  padding: 6.5px 11px;
  font-size: 16px;
}

:deep(.ant-input-sm) {
  padding: 0px 7px;
  font-size: 14px;
}
</style>