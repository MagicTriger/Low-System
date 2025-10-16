<template>
  <div class="control-number-input" :class="{ 'control-disabled': disabled }">
    <a-input-number
      v-model:value="numberValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :min="min"
      :max="max"
      :step="step"
      :precision="precision"
      :size="size"
      :status="status"
      :addon-before="addonBefore"
      :addon-after="addonAfter"
      :prefix="prefix"
      :suffix="suffix"
      :bordered="bordered"
      :controls="controls"
      :keyboard="keyboard"
      :string-mode="stringMode"
      :auto-focus="autoFocus"
      :read-only="readOnly"
      :formatter="formatter"
      :parser="parser"
      :decimal-separator="decimalSeparator"
      :controls-position="controlsPosition"
      @change="handleChange"
      @blur="handleBlur"
      @focus="handleFocus"
      @press-enter="handlePressEnter"
      @step="handleStep"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'

type SizeType = 'large' | 'middle' | 'small'
type StatusType = 'error' | 'warning'
type ControlsPositionType = 'right' | 'left'

interface Props {
  // 基础属性
  modelValue?: number | string | null
  disabled?: boolean
  placeholder?: string
  
  // 数值属性
  min?: number
  max?: number
  step?: number | string
  precision?: number
  
  // 显示属性
  size?: SizeType
  status?: StatusType
  addonBefore?: string
  addonAfter?: string
  prefix?: string
  suffix?: string
  bordered?: boolean
  controls?: boolean
  keyboard?: boolean
  stringMode?: boolean
  autoFocus?: boolean
  readOnly?: boolean
  
  // 格式化属性
  formatter?: (value: number | string | undefined) => string
  parser?: (displayValue: string | undefined) => number | string
  decimalSeparator?: string
  controlsPosition?: ControlsPositionType
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  step: 1,
  size: 'middle',
  bordered: true,
  controls: true,
  keyboard: true,
  stringMode: false,
  autoFocus: false,
  readOnly: false,
  decimalSeparator: '.',
  controlsPosition: 'right'
})

const emit = defineEmits<{
  'update:modelValue': [value: number | string | null]
  change: [value: number | string | null]
  blur: [event: FocusEvent]
  focus: [event: FocusEvent]
  pressEnter: [event: KeyboardEvent]
  step: [value: number | string, info: { offset: number, type: 'up' | 'down' }]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const numberValue = ref<number | string | null>(props.modelValue ?? null)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  numberValue.value = newValue ?? null
}, { immediate: true })

// 监听内部值变化
watch(numberValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 事件处理
const handleChange = (value: number | string | null) => {
  numberValue.value = value
  emit('change', value)
  emitEvent('change', { value })
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

const handleStep = (value: number | string, info: { offset: number, type: 'up' | 'down' }) => {
  emit('step', value, info)
  emitEvent('step', { value, info })
}

// 暴露的方法
const getValue = () => {
  return numberValue.value
}

const setValue = (value: number | string | null) => {
  numberValue.value = value
}

const clear = () => {
  numberValue.value = null
}

const focus = () => {
  // 聚焦到输入框
}

const blur = () => {
  // 失焦
}

const validate = () => {
  // 验证逻辑
  const value = numberValue.value
  
  if (value === null || value === undefined || value === '') {
    return true // 空值认为有效
  }
  
  const numValue = typeof value === 'string' ? parseFloat(value) : value
  
  if (isNaN(numValue)) {
    return false
  }
  
  if (props.min !== undefined && numValue < props.min) {
    return false
  }
  
  if (props.max !== undefined && numValue > props.max) {
    return false
  }
  
  return true
}

const reset = () => {
  numberValue.value = null
}

const increase = () => {
  const current = numberValue.value
  const step = typeof props.step === 'string' ? parseFloat(props.step) : props.step
  
  if (current === null || current === undefined || current === '') {
    numberValue.value = step
  } else {
    const numValue = typeof current === 'string' ? parseFloat(current) : current
    const newValue = numValue + step
    
    if (props.max === undefined || newValue <= props.max) {
      numberValue.value = props.stringMode ? newValue.toString() : newValue
    }
  }
}

const decrease = () => {
  const current = numberValue.value
  const step = typeof props.step === 'string' ? parseFloat(props.step) : props.step
  
  if (current === null || current === undefined || current === '') {
    numberValue.value = -step
  } else {
    const numValue = typeof current === 'string' ? parseFloat(current) : current
    const newValue = numValue - step
    
    if (props.min === undefined || newValue >= props.min) {
      numberValue.value = props.stringMode ? newValue.toString() : newValue
    }
  }
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
  increase,
  decrease
})
</script>

<style scoped>
.control-number-input {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-number-input {
  min-height: 32px;
}

/* 数字输入框样式 */
:deep(.ant-input-number) {
  width: 100%;
}

/* 控制按钮样式 */
:deep(.ant-input-number-handler-wrap) {
  opacity: 1;
}

:deep(.ant-input-number-handler) {
  border-left: 1px solid #d9d9d9;
}

:deep(.ant-input-number-handler:hover) {
  color: #1890ff;
}

/* 左侧控制按钮样式 */
:deep(.ant-input-number-controls-left .ant-input-number-handler-wrap) {
  right: auto;
  left: 0;
}

:deep(.ant-input-number-controls-left .ant-input-number-handler) {
  border-left: none;
  border-right: 1px solid #d9d9d9;
}

/* 无边框样式 */
:deep(.ant-input-number-borderless) {
  box-shadow: none;
}

/* 状态样式 */
:deep(.ant-input-number-status-error) {
  border-color: #ff4d4f;
}

:deep(.ant-input-number-status-warning) {
  border-color: #faad14;
}

/* 只读样式 */
:deep(.ant-input-number[readonly]) {
  background-color: #f5f5f5;
  cursor: default;
}

:deep(.ant-input-number[readonly] .ant-input-number-handler-wrap) {
  display: none;
}
</style>