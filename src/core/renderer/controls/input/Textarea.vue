<template>
  <div class="control-textarea" :class="{ 'control-disabled': disabled }">
    <a-textarea
      v-model:value="textareaValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :rows="rows"
      :auto-size="autoSize"
      :size="size"
      :status="status"
      :bordered="bordered"
      :allow-clear="allowClear"
      :auto-focus="autoFocus"
      :max-length="maxLength"
      :show-count="showCount"
      :readonly="readonly"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
      @input="handleInput"
      @press-enter="handlePressEnter"
      @resize="handleResize"
    />
    
    <!-- 字数统计 -->
    <div v-if="showWordCount && !showCount" class="word-count">
      {{ currentLength }}/{{ maxLength || '∞' }}
    </div>
    
    <!-- 错误提示 -->
    <div v-if="errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'

type SizeType = 'large' | 'middle' | 'small'
type StatusType = 'error' | 'warning'
type AutoSizeType = boolean | { minRows?: number; maxRows?: number }

interface Props {
  // 基础属性
  modelValue?: string
  disabled?: boolean
  placeholder?: string
  readonly?: boolean
  
  // 显示属性
  size?: SizeType
  status?: StatusType
  bordered?: boolean
  allowClear?: boolean
  autoFocus?: boolean
  
  // 文本区域配置
  rows?: number
  autoSize?: AutoSizeType
  maxLength?: number
  showCount?: boolean
  showWordCount?: boolean
  
  // 验证配置
  required?: boolean
  minLength?: number
  pattern?: string | RegExp
  validator?: (value: string) => string | null
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'middle',
  bordered: true,
  allowClear: false,
  autoFocus: false,
  rows: 4,
  autoSize: false,
  showCount: false,
  showWordCount: false,
  required: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [event: Event]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  input: [event: Event]
  pressEnter: [event: KeyboardEvent]
  resize: [size: { width: number; height: number }]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const textareaValue = ref(props.modelValue || '')
const errorMessage = ref<string | null>(null)

// 计算属性
const currentLength = computed(() => textareaValue.value.length)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  textareaValue.value = newValue || ''
}, { immediate: true })

// 监听内部值变化
watch(textareaValue, (newValue) => {
  emit('update:modelValue', newValue)
  validateValue(newValue)
})

// 验证函数
const validateValue = (value: string) => {
  errorMessage.value = null
  
  // 必填验证
  if (props.required && !value.trim()) {
    errorMessage.value = '此字段为必填项'
    return false
  }
  
  // 最小长度验证
  if (props.minLength && value.length < props.minLength) {
    errorMessage.value = `最少需要输入 ${props.minLength} 个字符`
    return false
  }
  
  // 最大长度验证
  if (props.maxLength && value.length > props.maxLength) {
    errorMessage.value = `最多只能输入 ${props.maxLength} 个字符`
    return false
  }
  
  // 正则验证
  if (props.pattern) {
    const regex = typeof props.pattern === 'string' ? new RegExp(props.pattern) : props.pattern
    if (!regex.test(value)) {
      errorMessage.value = '输入格式不正确'
      return false
    }
  }
  
  // 自定义验证
  if (props.validator) {
    const result = props.validator(value)
    if (result) {
      errorMessage.value = result
      return false
    }
  }
  
  return true
}

// 事件处理
const handleChange = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  textareaValue.value = target.value
  emit('change', event)
  emitEvent('change', { value: target.value, event })
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
  emitEvent('blur', { value: textareaValue.value, event })
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
  emitEvent('focus', { value: textareaValue.value, event })
}

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement
  textareaValue.value = target.value
  emit('input', event)
  emitEvent('input', { value: target.value, event })
}

const handlePressEnter = (event: KeyboardEvent) => {
  emit('pressEnter', event)
  emitEvent('pressEnter', { value: textareaValue.value, event })
}

const handleResize = (size: { width: number; height: number }) => {
  emit('resize', size)
  emitEvent('resize', { size })
}

// 暴露的方法
const getValue = () => {
  return textareaValue.value
}

const setValue = (value: string) => {
  textareaValue.value = value
}

const clear = () => {
  textareaValue.value = ''
}

const focus = () => {
  // 聚焦到文本区域
}

const blur = () => {
  // 失焦
}

const select = () => {
  // 选中所有文本
}

const selectRange = (start: number, end: number) => {
  // 选中指定范围的文本
}

const insertText = (text: string, position?: number) => {
  if (position === undefined) {
    textareaValue.value += text
  } else {
    const value = textareaValue.value
    textareaValue.value = value.slice(0, position) + text + value.slice(position)
  }
}

const replaceText = (start: number, end: number, text: string) => {
  const value = textareaValue.value
  textareaValue.value = value.slice(0, start) + text + value.slice(end)
}

const getLength = () => {
  return textareaValue.value.length
}

const getWordCount = () => {
  return textareaValue.value.trim().split(/\s+/).filter(word => word.length > 0).length
}

const getLineCount = () => {
  return textareaValue.value.split('\n').length
}

const isEmpty = () => {
  return textareaValue.value.trim().length === 0
}

const validate = () => {
  return validateValue(textareaValue.value)
}

const reset = () => {
  textareaValue.value = ''
  errorMessage.value = null
}

const isValid = () => {
  return errorMessage.value === null
}

const getErrorMessage = () => {
  return errorMessage.value
}

const clearError = () => {
  errorMessage.value = null
}

const appendText = (text: string) => {
  textareaValue.value += text
}

const prependText = (text: string) => {
  textareaValue.value = text + textareaValue.value
}

const replaceAll = (searchValue: string | RegExp, replaceValue: string) => {
  textareaValue.value = textareaValue.value.replace(searchValue, replaceValue)
}

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  clear,
  focus,
  blur,
  select,
  selectRange,
  insertText,
  replaceText,
  getLength,
  getWordCount,
  getLineCount,
  isEmpty,
  validate,
  reset,
  isValid,
  getErrorMessage,
  clearError,
  appendText,
  prependText,
  replaceAll
})
</script>

<style scoped>
.control-textarea {
  width: 100%;
  position: relative;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 字数统计样式 */
.word-count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #8c8c8c;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
  pointer-events: none;
}

/* 错误提示样式 */
.error-message {
  margin-top: 4px;
  font-size: 12px;
  color: #ff4d4f;
  line-height: 1.4;
}

/* 设计器模式样式 */
.designer-mode .control-textarea {
  min-height: 80px;
}

/* 文本区域样式 */
:deep(.ant-input) {
  width: 100%;
  resize: vertical;
  transition: all 0.3s;
}

:deep(.ant-input:focus) {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

:deep(.ant-input:hover) {
  border-color: #40a9ff;
}

/* 禁用状态样式 */
:deep(.ant-input:disabled) {
  background-color: #f5f5f5;
  color: #8c8c8c;
  cursor: not-allowed;
}

/* 只读状态样式 */
:deep(.ant-input[readonly]) {
  background-color: #fafafa;
  cursor: default;
}

/* 无边框样式 */
:deep(.ant-input-borderless) {
  border: none !important;
  box-shadow: none !important;
}

/* 状态样式 */
:deep(.ant-input-status-error) {
  border-color: #ff4d4f;
}

:deep(.ant-input-status-error:focus) {
  border-color: #ff4d4f;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2);
}

:deep(.ant-input-status-warning) {
  border-color: #faad14;
}

:deep(.ant-input-status-warning:focus) {
  border-color: #faad14;
  box-shadow: 0 0 0 2px rgba(250, 173, 20, 0.2);
}

/* 大小样式 */
:deep(.ant-input-lg) {
  padding: 6.5px 11px;
  font-size: 16px;
  line-height: 1.5;
}

:deep(.ant-input-sm) {
  padding: 0px 7px;
  font-size: 14px;
  line-height: 1.5;
}

/* 字数统计样式 */
:deep(.ant-input-data-count) {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-size: 12px;
  color: #8c8c8c;
  background: rgba(255, 255, 255, 0.8);
  padding: 2px 4px;
  border-radius: 2px;
  pointer-events: none;
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

/* 占位符样式 */
:deep(.ant-input::placeholder) {
  color: #bfbfbf;
  opacity: 1;
}

/* 自动调整高度样式 */
:deep(.ant-input-autosize) {
  min-height: 32px;
  max-height: 200px;
  overflow-y: auto;
}

/* 滚动条样式 */
:deep(.ant-input::-webkit-scrollbar) {
  width: 6px;
}

:deep(.ant-input::-webkit-scrollbar-track) {
  background: #f1f1f1;
  border-radius: 3px;
}

:deep(.ant-input::-webkit-scrollbar-thumb) {
  background: #c1c1c1;
  border-radius: 3px;
}

:deep(.ant-input::-webkit-scrollbar-thumb:hover) {
  background: #a8a8a8;
}

/* 选中文本样式 */
:deep(.ant-input::selection) {
  background-color: #bae7ff;
}
</style>