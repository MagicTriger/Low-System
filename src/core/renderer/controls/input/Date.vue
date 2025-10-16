<template>
  <div class="control-date" :class="{ 'control-disabled': disabled }">
    <a-date-picker
      v-if="type === 'date'"
      v-model:value="currentValue"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :bordered="bordered"
      :allow-clear="allowClear"
      :format="format"
      :value-format="valueFormat"
      :show-time="showTime"
      :show-today="showToday"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :picker="picker"
      :status="status"
      :prefix="prefixIcon"
      :suffix="suffixIcon"
      @change="handleChange"
      @ok="handleOk"
      @panel-change="handlePanelChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <a-range-picker
      v-else-if="type === 'range'"
      v-model:value="currentValue"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :bordered="bordered"
      :allow-clear="allowClear"
      :format="format"
      :value-format="valueFormat"
      :show-time="showTime"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :picker="picker"
      :status="status"
      :separator="separator"
      @change="handleChange"
      @ok="handleOk"
      @panel-change="handlePanelChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
    <a-time-picker
      v-else-if="type === 'time'"
      v-model:value="currentValue"
      :placeholder="placeholder"
      :size="size"
      :disabled="disabled"
      :bordered="bordered"
      :allow-clear="allowClear"
      :format="format"
      :value-format="valueFormat"
      :hour-step="hourStep"
      :minute-step="minuteStep"
      :second-step="secondStep"
      :disabled-time="disabledTime"
      :status="status"
      :prefix="prefixIcon"
      :suffix="suffixIcon"
      @change="handleChange"
      @focus="handleFocus"
      @blur="handleBlur"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Dayjs } from 'dayjs'

interface Props {
  // 基础属性
  type?: 'date' | 'range' | 'time'
  placeholder?: string | [string, string]
  size?: 'large' | 'middle' | 'small'
  disabled?: boolean
  bordered?: boolean
  allowClear?: boolean
  
  // 格式化
  format?: string
  valueFormat?: string
  
  // 日期选择器特有
  showTime?: boolean | object
  showToday?: boolean
  picker?: 'date' | 'week' | 'month' | 'quarter' | 'year'
  
  // 时间选择器特有
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  
  // 范围选择器特有
  separator?: string
  
  // 状态
  status?: 'error' | 'warning'
  
  // 图标
  prefixIcon?: string
  suffixIcon?: string
  
  // 禁用函数
  disabledDate?: (current: Dayjs) => boolean
  disabledTime?: (current: Dayjs) => object
  
  // 控件通用属性
  modelValue?: any
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'date',
  size: 'middle',
  bordered: true,
  allowClear: true,
  showToday: true,
  picker: 'date',
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
  separator: '~'
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, dateString: string | [string, string]]
  ok: [value: any]
  panelChange: [value: any, mode: string | [string, string]]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 内部值管理
const currentValue = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  currentValue.value = newValue
})

// 监听内部值变化
watch(currentValue, (newValue) => {
  emit('update:modelValue', newValue)
})

// 事件处理
const handleChange = (value: any, dateString: string | [string, string]) => {
  currentValue.value = value
  emit('change', value, dateString)
  emitEvent('change', { value, dateString })
}

const handleOk = (value: any) => {
  emit('ok', value)
  emitEvent('ok', { value })
}

const handlePanelChange = (value: any, mode: string | [string, string]) => {
  emit('panelChange', value, mode)
  emitEvent('panelChange', { value, mode })
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
  emitEvent('focus', { event })
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
  emitEvent('blur', { event })
}

// 暴露的方法
const focus = () => {
  // 获取日期选择器实例并聚焦
}

const blur = () => {
  // 获取日期选择器实例并失焦
}

const getValue = () => {
  return currentValue.value
}

const setValue = (value: any) => {
  currentValue.value = value
}

const validate = () => {
  // 验证逻辑
  return true
}

const reset = () => {
  currentValue.value = undefined
}

const open = () => {
  // 打开日期选择器
}

const close = () => {
  // 关闭日期选择器
}

// 暴露方法给父组件
defineExpose({
  focus,
  blur,
  getValue,
  setValue,
  validate,
  reset,
  open,
  close
})
</script>

<style scoped>
.control-date {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-date {
  min-height: 32px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.designer-mode .control-date:hover {
  border-color: #1890ff;
}
</style>