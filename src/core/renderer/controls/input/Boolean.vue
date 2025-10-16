<template>
  <component
    :is="componentType"
    v-model:checked="inputValue"
    :disabled="disabled"
    :size="inputSize"
    @change="handleChange"
  >
    {{ label }}
  </component>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface BooleanControl extends Control {
  props?: {
    label?: string
    type?: 'checkbox' | 'switch'
    size?: 'large' | 'default' | 'small'
    disabled?: boolean
    checkedChildren?: string
    unCheckedChildren?: string
  }
}

const props = defineProps<{ control: BooleanControl }>()

const { control, value, eventHandler } = useControlMembers(props)

// 计算属性
const inputValue = computed({
  get: () => {
    return Boolean(value.value)
  },
  set: (val: boolean) => {
    value.value = val
  }
})

const componentType = computed(() => {
  return control.value.props?.type === 'switch' ? 'a-switch' : 'a-checkbox'
})

const label = computed(() => control.value.props?.label || '')
const inputSize = computed(() => control.value.props?.size || 'default')
const disabled = computed(() => control.value.props?.disabled || false)

// 事件处理
const handleChange = async (checked: boolean, event: Event) => {
  await eventHandler?.('change', checked, event)
}

// 暴露方法
defineExpose({
  getValue: () => inputValue.value,
  setValue: (val: boolean) => {
    inputValue.value = val
  },
  toggle: () => {
    inputValue.value = !inputValue.value
  },
  check: () => {
    inputValue.value = true
  },
  uncheck: () => {
    inputValue.value = false
  },
  validate: async () => {
    return true // 布尔值通常不需要验证
  },
  reset: () => {
    inputValue.value = false
  }
})
</script>

<style scoped>
/* 布尔输入控件样式 */
</style>