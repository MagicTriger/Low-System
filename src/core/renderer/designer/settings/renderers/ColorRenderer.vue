<template>
  <div class="color-input">
    <input type="color" :value="modelValue || '#000000'" @input="updateValue" class="color-picker" />
    <a-input :value="modelValue" @update:value="updateValue" :placeholder="placeholder || '颜色值'" size="small" style="flex: 1" />
  </div>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  placeholder?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string | undefined]
}>()

function updateValue(event: Event | string) {
  const value = typeof event === 'string' ? event : (event.target as HTMLInputElement).value
  emit('update:modelValue', value || undefined)
}
</script>

<style scoped>
.color-input {
  display: flex;
  gap: 4px;
  align-items: center;
}

.color-picker {
  width: 32px;
  height: 32px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  background: transparent;
}

.color-picker::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker::-webkit-color-swatch {
  border: none;
  border-radius: 3px;
}
</style>
