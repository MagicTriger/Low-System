<template>
  <div class="color-field">
    <a-input
      :value="modelValue"
      :placeholder="config.placeholder || '#000000'"
      :disabled="config.disabled"
      :readonly="config.readonly"
      @update:value="handleInputUpdate"
    >
      <template #prefix>
        <div class="color-preview" :style="{ backgroundColor: modelValue || '#ffffff' }" @click="handleColorClick"></div>
      </template>
    </a-input>
    <input
      v-if="!config.disabled && !config.readonly"
      ref="colorPickerRef"
      type="color"
      :value="modelValue || '#000000'"
      class="color-picker-hidden"
      @input="handleColorChange"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
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

const colorPickerRef = ref<HTMLInputElement>()

function handleInputUpdate(value: string) {
  emit('update:modelValue', value)
}

function handleColorClick() {
  if (!props.config.disabled && !props.config.readonly) {
    colorPickerRef.value?.click()
  }
}

function handleColorChange(event: Event) {
  const target = event.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.color-field {
  position: relative;
}

.color-preview {
  width: 20px;
  height: 20px;
  border-radius: 2px;
  border: 1px solid #d9d9d9;
  cursor: pointer;
  transition: all 0.3s;
}

.color-preview:hover {
  border-color: #40a9ff;
}

.color-picker-hidden {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
}
</style>
