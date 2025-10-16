<template>
  <div class="dom-size-input">
    <a-input-number
      :value="modelValue?.value"
      @update:value="updateValue"
      :placeholder="placeholder"
      size="small"
      style="flex: 1"
      :disabled="!modelValue?.type || modelValue?.type === 'none'"
    />
    <a-select :value="modelValue?.type || 'none'" @update:value="updateType" size="small" style="width: 80px">
      <a-select-option value="none">无</a-select-option>
      <a-select-option value="px">像素</a-select-option>
      <a-select-option value="%">%</a-select-option>
      <a-select-option value="rem">字宽</a-select-option>
    </a-select>
  </div>
</template>

<script setup lang="ts">
import { ControlSize, ControlSizeType } from '@/core/renderer/base'

interface Props {
  modelValue?: ControlSize
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: ControlSize | undefined]
}>()

function updateValue(value: number | null) {
  if (value == null || !props.modelValue?.type || props.modelValue?.type === ControlSizeType.None) {
    return
  }
  emit('update:modelValue', {
    type: props.modelValue.type,
    value,
  })
}

function updateType(type: string) {
  if (type === 'none') {
    emit('update:modelValue', undefined)
  } else {
    emit('update:modelValue', {
      type: type as ControlSizeType,
      value: props.modelValue?.value || 0,
    })
  }
}
</script>

<style scoped>
.dom-size-input {
  display: flex;
  gap: 4px;
  align-items: center;
}
</style>
