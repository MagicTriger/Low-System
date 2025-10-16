<template>
  <div class="slider-field">
    <a-slider
      :value="modelValue"
      :disabled="config.disabled"
      :min="config.min || 0"
      :max="config.max || 100"
      :step="config.step || 1"
      style="flex: 1"
      @update:value="handleUpdate"
    />
    <a-input-number
      :value="modelValue"
      :disabled="config.disabled"
      :min="config.min || 0"
      :max="config.max || 100"
      :step="config.step || 1"
      style="width: 80px; margin-left: 12px"
      @update:value="handleUpdate"
    />
  </div>
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

<style scoped>
.slider-field {
  display: flex;
  align-items: center;
  width: 100%;
}
</style>
