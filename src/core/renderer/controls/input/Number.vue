<template>
  <a-input-number
    v-model:value="inputValue"
    :placeholder="placeholder"
    :size="inputSize"
    :disabled="disabled"
    :readonly="readonly"
    :min="min"
    :max="max"
    :step="step"
    :precision="precision"
    :formatter="formatter"
    :parser="parser"
    :controls="showControls"
    :keyboard="keyboard"
    :bordered="bordered"
    :status="status"
    :addon-before="addonBefore"
    :addon-after="addonAfter"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @pressEnter="handlePressEnter"
  >
    <template #prefix v-if="prefixIcon">
      <component :is="prefixIcon" />
    </template>
  </a-input-number>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface NumberControl extends Control {
  props?: {
    placeholder?: string
    size?: 'large' | 'middle' | 'small'
    disabled?: boolean
    readonly?: boolean
    min?: number
    max?: number
    step?: number
    precision?: number
    formatter?: (value: number | string | undefined) => string
    parser?: (displayValue: string | undefined) => number | string
    controls?: boolean
    keyboard?: boolean
    bordered?: boolean
    status?: 'error' | 'warning'
    prefixIcon?: string
    addonBefore?: string
    addonAfter?: string
  }
}

const props = defineProps<{ control: NumberControl }>()

const { control, value, eventHandler } = useControlMembers(props)

// 计算属性
const inputValue = computed({
  get: () => {
    const val = value.value
    return val !== null && val !== undefined ? Number(val) : undefined
  },
  set: (val: number | undefined) => {
    value.value = val
  }
})

const placeholder = computed(() => control.value.props?.placeholder || '请输入数字')
const inputSize = computed(() => control.value.props?.size || 'middle')
const disabled = computed(() => control.value.props?.disabled || false)
const readonly = computed(() => control.value.props?.readonly || false)
const min = computed(() => control.value.props?.min)
const max = computed(() => control.value.props?.max)
const step = computed(() => control.value.props?.step || 1)
const precision = computed(() => control.value.props?.precision)
const showControls = computed(() => control.value.props?.controls !== false)
const keyboard = computed(() => control.value.props?.keyboard !== false)
const bordered = computed(() => control.value.props?.bordered !== false)
const status = computed(() => control.value.props?.status)
const prefixIcon = computed(() => control.value.props?.prefixIcon)
const addonBefore = computed(() => control.value.props?.addonBefore)
const addonAfter = computed(() => control.value.props?.addonAfter)

const formatter = computed(() => {
  if (control.value.props?.formatter) {
    return control.value.props.formatter
  }
  
  // 默认格式化器
  return (value: number | string | undefined) => {
    if (value === undefined || value === null) return ''
    return String(value)
  }
})

const parser = computed(() => {
  if (control.value.props?.parser) {
    return control.value.props.parser
  }
  
  // 默认解析器
  return (displayValue: string | undefined) => {
    if (!displayValue) return ''
    return displayValue.replace(/[^\d.-]/g, '')
  }
})

// 事件处理
const handleChange = async (value: number | string | null) => {
  await eventHandler?.('change', value)
}

const handleBlur = async (event: FocusEvent) => {
  await eventHandler?.('blur', event, inputValue.value)
}

const handleFocus = async (event: FocusEvent) => {
  await eventHandler?.('focus', event, inputValue.value)
}

const handlePressEnter = async (event: KeyboardEvent) => {
  await eventHandler?.('pressEnter', event, inputValue.value)
}

// 暴露方法
defineExpose({
  focus: () => {
    const input = document.querySelector(`#${control.value.id} input`) as HTMLInputElement
    input?.focus()
  },
  blur: () => {
    const input = document.querySelector(`#${control.value.id} input`) as HTMLInputElement
    input?.blur()
  },
  getValue: () => inputValue.value,
  setValue: (val: number) => {
    inputValue.value = val
  },
  validate: async () => {
    // 数字验证逻辑
    const val = inputValue.value
    
    if (val === undefined || val === null) {
      return true // 空值由required规则处理
    }
    
    if (min.value !== undefined && val < min.value) {
      return false
    }
    
    if (max.value !== undefined && val > max.value) {
      return false
    }
    
    return true
  },
  reset: () => {
    inputValue.value = undefined
  },
  increase: () => {
    const current = inputValue.value || 0
    const newValue = current + step.value
    if (max.value === undefined || newValue <= max.value) {
      inputValue.value = newValue
    }
  },
  decrease: () => {
    const current = inputValue.value || 0
    const newValue = current - step.value
    if (min.value === undefined || newValue >= min.value) {
      inputValue.value = newValue
    }
  }
})
</script>

<style scoped>
/* 数字输入控件样式 */
</style>