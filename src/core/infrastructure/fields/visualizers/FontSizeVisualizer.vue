<template>
  <div class="font-size-visualizer">
    <div class="size-list">
      <div v-for="size in fontSizes" :key="size" :class="['size-item', { active: currentSize === size }]" @click="selectSize(size)">
        <span class="size-value">{{ size }}px</span>
        <span class="size-preview" :style="{ fontSize: size + 'px' }">Aa</span>
      </div>
    </div>

    <div class="custom-size">
      <label class="custom-label">自定义大小:</label>
      <a-input-number
        :value="currentSize"
        :min="8"
        :max="120"
        :step="1"
        size="small"
        style="width: 100px"
        @update:value="handleCustomSize"
      />
      <span class="unit">px</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { FieldConfig } from '../types'

interface Props {
  config: FieldConfig
  modelValue: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64, 72]
const currentSize = ref(14)

// 解析modelValue
watch(
  () => props.modelValue,
  value => {
    if (typeof value === 'number') {
      currentSize.value = value
    } else if (typeof value === 'string') {
      const parsed = parseInt(value.replace(/px/, ''))
      if (!isNaN(parsed)) {
        currentSize.value = parsed
      }
    }
  },
  { immediate: true }
)

function selectSize(size: number) {
  currentSize.value = size
  emit('update:modelValue', size)
}

function handleCustomSize(value: number | null) {
  if (value !== null) {
    currentSize.value = value
    emit('update:modelValue', value)
  }
}
</script>

<style scoped>
.font-size-visualizer {
  padding: 8px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 8px;
}

.size-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(50px, 1fr));
  gap: 4px;
  margin-bottom: 8px;
}

.size-item {
  padding: 4px 6px;
  background: #fff;
  border: 1px solid #d9d9d9;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.size-item:hover {
  border-color: #40a9ff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.size-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.size-value {
  font-size: 10px;
  color: #8c8c8c;
  font-weight: 500;
}

.size-item.active .size-value {
  color: #1890ff;
}

.size-preview {
  font-weight: 500;
  color: #262626;
  line-height: 1;
  font-size: 14px;
}

.size-item.active .size-preview {
  color: #1890ff;
}

.custom-size {
  display: flex;
  align-items: center;
  gap: 6px;
  padding-top: 8px;
  border-top: 1px solid #e8e8e8;
}

.custom-label {
  font-size: 11px;
  color: #8c8c8c;
  font-weight: 500;
}

.unit {
  font-size: 12px;
  color: #8c8c8c;
}
</style>
