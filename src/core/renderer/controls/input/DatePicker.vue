<template>
  <div class="control-date-picker" :class="{ 'control-disabled': disabled }">
    <a-date-picker
      v-if="picker === 'date'"
      v-model:value="dateValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :format="format"
      :value-format="valueFormat"
      :show-time="showTime"
      :show-today="showToday"
      :allow-clear="allowClear"
      :auto-focus="autoFocus"
      :bordered="bordered"
      :size="size"
      :status="status"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :get-popup-container="getPopupContainer"
      :input-read-only="inputReadOnly"
      :locale="locale"
      :mode="mode"
      :open="open"
      :picker="picker"
      :placement="placement"
      :popup-style="popupStyle"
      :dropdown-class-name="dropdownClassName"
      :suffix-icon="suffixIcon"
      :clear-icon="clearIcon"
      :prev-icon="prevIcon"
      :next-icon="nextIcon"
      :super-prev-icon="superPrevIcon"
      :super-next-icon="superNextIcon"
      @change="handleChange"
      @ok="handleOk"
      @panel-change="handlePanelChange"
      @calendar-change="handleCalendarChange"
      @open-change="handleOpenChange"
    />
    
    <a-range-picker
      v-else-if="picker === 'range'"
      v-model:value="rangeValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :format="format"
      :value-format="valueFormat"
      :show-time="showTime"
      :allow-clear="allowClear"
      :auto-focus="autoFocus"
      :bordered="bordered"
      :size="size"
      :status="status"
      :disabled-date="disabledDate"
      :disabled-time="disabledTime"
      :get-popup-container="getPopupContainer"
      :input-read-only="inputReadOnly"
      :locale="locale"
      :mode="mode"
      :open="open"
      :placement="placement"
      :popup-style="popupStyle"
      :dropdown-class-name="dropdownClassName"
      :suffix-icon="suffixIcon"
      :clear-icon="clearIcon"
      :prev-icon="prevIcon"
      :next-icon="nextIcon"
      :super-prev-icon="superPrevIcon"
      :super-next-icon="superNextIcon"
      :separator="separator"
      @change="handleChange"
      @ok="handleOk"
      @panel-change="handlePanelChange"
      @calendar-change="handleCalendarChange"
      @open-change="handleOpenChange"
    />
    
    <a-time-picker
      v-else-if="picker === 'time'"
      v-model:value="timeValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :format="format"
      :value-format="valueFormat"
      :allow-clear="allowClear"
      :auto-focus="autoFocus"
      :bordered="bordered"
      :size="size"
      :status="status"
      :disabled-hours="disabledHours"
      :disabled-minutes="disabledMinutes"
      :disabled-seconds="disabledSeconds"
      :get-popup-container="getPopupContainer"
      :hide-disabled-options="hideDisabledOptions"
      :hour-step="hourStep"
      :minute-step="minuteStep"
      :second-step="secondStep"
      :input-read-only="inputReadOnly"
      :open="open"
      :placement="placement"
      :popup-style="popupStyle"
      :dropdown-class-name="dropdownClassName"
      :suffix-icon="suffixIcon"
      :clear-icon="clearIcon"
      :use12-hours="use12Hours"
      @change="handleChange"
      @open-change="handleOpenChange"
    />
    
    <a-time-range-picker
      v-else-if="picker === 'timeRange'"
      v-model:value="timeRangeValue"
      :disabled="disabled"
      :placeholder="placeholder"
      :format="format"
      :value-format="valueFormat"
      :allow-clear="allowClear"
      :auto-focus="autoFocus"
      :bordered="bordered"
      :size="size"
      :status="status"
      :disabled-hours="disabledHours"
      :disabled-minutes="disabledMinutes"
      :disabled-seconds="disabledSeconds"
      :get-popup-container="getPopupContainer"
      :hide-disabled-options="hideDisabledOptions"
      :hour-step="hourStep"
      :minute-step="minuteStep"
      :second-step="secondStep"
      :input-read-only="inputReadOnly"
      :open="open"
      :placement="placement"
      :popup-style="popupStyle"
      :dropdown-class-name="dropdownClassName"
      :suffix-icon="suffixIcon"
      :clear-icon="clearIcon"
      :use12-hours="use12Hours"
      :order="order"
      @change="handleChange"
      @open-change="handleOpenChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Dayjs } from 'dayjs'

type PickerType = 'date' | 'week' | 'month' | 'quarter' | 'year' | 'time' | 'range' | 'timeRange'
type SizeType = 'large' | 'middle' | 'small'
type StatusType = 'error' | 'warning'
type PlacementType = 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight'

interface Props {
  // 基础属性
  modelValue?: Dayjs | [Dayjs, Dayjs] | string | [string, string] | null
  picker?: PickerType
  disabled?: boolean
  placeholder?: string | [string, string]
  
  // 格式化属性
  format?: string
  valueFormat?: string
  
  // 显示属性
  showTime?: boolean | object
  showToday?: boolean
  allowClear?: boolean
  autoFocus?: boolean
  bordered?: boolean
  size?: SizeType
  status?: StatusType
  
  // 时间相关属性
  use12Hours?: boolean
  hourStep?: number
  minuteStep?: number
  secondStep?: number
  hideDisabledOptions?: boolean
  
  // 禁用属性
  disabledDate?: (current: Dayjs) => boolean
  disabledTime?: (current: Dayjs) => object
  disabledHours?: () => number[]
  disabledMinutes?: (selectedHour: number) => number[]
  disabledSeconds?: (selectedHour: number, selectedMinute: number) => number[]
  
  // 弹窗属性
  getPopupContainer?: (triggerNode: HTMLElement) => HTMLElement
  inputReadOnly?: boolean
  locale?: object
  mode?: string | [string, string]
  open?: boolean
  placement?: PlacementType
  popupStyle?: object
  dropdownClassName?: string
  
  // 图标属性
  suffixIcon?: any
  clearIcon?: any
  prevIcon?: any
  nextIcon?: any
  superPrevIcon?: any
  superNextIcon?: any
  
  // 范围选择器属性
  separator?: string
  order?: boolean
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  picker: 'date',
  format: 'YYYY-MM-DD',
  showToday: true,
  allowClear: true,
  bordered: true,
  size: 'middle',
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
  separator: '~',
  order: true
})

const emit = defineEmits<{
  'update:modelValue': [value: any]
  change: [value: any, dateString: string | [string, string]]
  ok: [value: any]
  panelChange: [value: any, mode: string | [string, string]]
  calendarChange: [value: any, dateString: string | [string, string]]
  openChange: [open: boolean]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 不同类型的值管理
const dateValue = ref()
const rangeValue = ref()
const timeValue = ref()
const timeRangeValue = ref()

// 根据picker类型选择对应的值
const currentValue = computed({
  get() {
    switch (props.picker) {
      case 'range':
        return rangeValue.value
      case 'time':
        return timeValue.value
      case 'timeRange':
        return timeRangeValue.value
      default:
        return dateValue.value
    }
  },
  set(value) {
    switch (props.picker) {
      case 'range':
        rangeValue.value = value
        break
      case 'time':
        timeValue.value = value
        break
      case 'timeRange':
        timeRangeValue.value = value
        break
      default:
        dateValue.value = value
        break
    }
  }
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  currentValue.value = newValue
}, { immediate: true })

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

const handleCalendarChange = (value: any, dateString: string | [string, string]) => {
  emit('calendarChange', value, dateString)
  emitEvent('calendarChange', { value, dateString })
}

const handleOpenChange = (open: boolean) => {
  emit('openChange', open)
  emitEvent('openChange', { open })
}

// 暴露的方法
const getValue = () => {
  return currentValue.value
}

const setValue = (value: any) => {
  currentValue.value = value
}

const clear = () => {
  currentValue.value = null
}

const focus = () => {
  // 聚焦到输入框
}

const blur = () => {
  // 失焦
}

const validate = () => {
  // 验证逻辑
  if (props.picker === 'range' || props.picker === 'timeRange') {
    return Array.isArray(currentValue.value) && currentValue.value.length === 2
  }
  return currentValue.value != null
}

const reset = () => {
  currentValue.value = null
}

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  clear,
  focus,
  blur,
  validate,
  reset
})
</script>

<style scoped>
.control-date-picker {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-date-picker {
  min-height: 32px;
}

/* 日期选择器样式 */
:deep(.ant-picker) {
  width: 100%;
}

:deep(.ant-picker-range) {
  width: 100%;
}

/* 时间选择器样式 */
:deep(.ant-time-picker) {
  width: 100%;
}

:deep(.ant-time-range-picker) {
  width: 100%;
}
</style>