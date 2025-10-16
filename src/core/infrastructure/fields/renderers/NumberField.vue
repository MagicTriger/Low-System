<template>
  <a-input-number
    :value="modelValue"
    :placeholder="config.placeholder"
    :disabled="config.disabled"
    :readonly="config.readonly"
    :min="config.min"
    :max="config.max"
    :step="config.step || 1"
    style="width: 100%"
    @update:value="handleUpdate"
  />
</template>

<script setup lang="ts">
import type { FieldConfig } from '../types'

interface Props {
  config: FieldConfig
  modelValue: any
  errors?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'validate', errors: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

function handleUpdate(value: number | null) {
  emit('update:modelValue', value)
}
</script>
