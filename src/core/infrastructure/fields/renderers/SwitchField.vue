<template>
  <div class="switch-field">
    <a-switch :checked="modelValue" :disabled="config.disabled" @update:checked="handleUpdate" size="small" />
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

function handleUpdate(checked: boolean) {
  console.log('[SwitchField] Switch toggled:', props.config.key, '=', checked, 'previous value:', props.modelValue)
  emit('update:modelValue', checked)
}
</script>

<style scoped>
.switch-field {
  display: flex;
  align-items: center;
  min-height: 32px;
}

.switch-field :deep(.ant-switch) {
  background-color: rgba(0, 0, 0, 0.25);
}

.switch-field :deep(.ant-switch-checked) {
  background-color: #1890ff;
}

.switch-field :deep(.ant-switch:hover:not(.ant-switch-disabled)) {
  background-color: rgba(0, 0, 0, 0.35);
}

.switch-field :deep(.ant-switch-checked:hover:not(.ant-switch-disabled)) {
  background-color: #40a9ff;
}
</style>
