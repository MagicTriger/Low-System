<template>
  <a-input
    v-model:value="inputValue"
    :placeholder="placeholder"
    :size="inputSize"
    :disabled="disabled"
    :readonly="readonly"
    :maxlength="maxlength"
    :show-count="showCount"
    :allow-clear="allowClear"
    :bordered="bordered"
    :status="status"
    @change="handleChange"
    @blur="handleBlur"
    @focus="handleFocus"
    @pressEnter="handlePressEnter"
  >
    <template #prefix v-if="prefixIcon">
      <component :is="prefixIcon" />
    </template>
    <template #suffix v-if="suffixIcon">
      <component :is="suffixIcon" />
    </template>
    <template #addonBefore v-if="addonBefore">
      {{ addonBefore }}
    </template>
    <template #addonAfter v-if="addonAfter">
      {{ addonAfter }}
    </template>
  </a-input>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface StringControl extends Control {
  props?: {
    placeholder?: string
    size?: 'large' | 'middle' | 'small'
    disabled?: boolean
    readonly?: boolean
    maxlength?: number
    showCount?: boolean
    allowClear?: boolean
    bordered?: boolean
    status?: 'error' | 'warning'
    prefixIcon?: string
    suffixIcon?: string
    addonBefore?: string
    addonAfter?: string
  }
}

const props = defineProps<{ control: StringControl }>()

const { control, value, eventHandler } = useControlMembers(props)

// 内部状态
const focused = ref(false)

// 计算属性
const inputValue = computed({
  get: () => value.value || '',
  set: (val: string) => {
    value.value = val
  }
})

const placeholder = computed(() => control.value.props?.placeholder || '请输入内容')
const inputSize = computed(() => control.value.props?.size || 'middle')
const disabled = computed(() => control.value.props?.disabled || false)
const readonly = computed(() => control.value.props?.readonly || false)
const maxlength = computed(() => control.value.props?.maxlength)
const showCount = computed(() => control.value.props?.showCount || false)
const allowClear = computed(() => control.value.props?.allowClear || false)
const bordered = computed(() => control.value.props?.bordered !== false)
const status = computed(() => control.value.props?.status)
const prefixIcon = computed(() => control.value.props?.prefixIcon)
const suffixIcon = computed(() => control.value.props?.suffixIcon)
const addonBefore = computed(() => control.value.props?.addonBefore)
const addonAfter = computed(() => control.value.props?.addonAfter)

// 事件处理
const handleChange = async (event: Event) => {
  await eventHandler?.('change', event, inputValue.value)
}

const handleBlur = async (event: FocusEvent) => {
  focused.value = false
  await eventHandler?.('blur', event, inputValue.value)
}

const handleFocus = async (event: FocusEvent) => {
  focused.value = true
  await eventHandler?.('focus', event, inputValue.value)
}

const handlePressEnter = async (event: KeyboardEvent) => {
  await eventHandler?.('pressEnter', event, inputValue.value)
}

// 暴露方法
defineExpose({
  focus: () => {
    // 输入框聚焦逻辑
    const input = document.querySelector(`#${control.value.id} input`) as HTMLInputElement
    input?.focus()
  },
  blur: () => {
    // 输入框失焦逻辑
    const input = document.querySelector(`#${control.value.id} input`) as HTMLInputElement
    input?.blur()
  },
  getValue: () => inputValue.value,
  setValue: (val: string) => {
    inputValue.value = val
  },
  validate: async () => {
    // 验证逻辑
    return true
  },
  reset: () => {
    inputValue.value = ''
  }
})
</script>

<style scoped>
/* 字符串输入控件样式 */
</style>