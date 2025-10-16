<template>
  <div class="size-visualizer">
    <!-- Width -->
    <div class="size-row">
      <label class="size-label">宽度 (Width)</label>
      <div class="size-input-group">
        <a-input v-model:value="sizeConfig.width.value" size="small" style="width: 80px" @update:value="handleUpdate" />
        <a-select v-model:value="sizeConfig.width.unit" size="small" style="width: 70px" @update:value="handleUpdate">
          <a-select-option value="px">px</a-select-option>
          <a-select-option value="%">%</a-select-option>
          <a-select-option value="auto">auto</a-select-option>
          <a-select-option value="vw">vw</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- Height -->
    <div class="size-row">
      <label class="size-label">高度 (Height)</label>
      <div class="size-input-group">
        <a-input v-model:value="sizeConfig.height.value" size="small" style="width: 80px" @update:value="handleUpdate" />
        <a-select v-model:value="sizeConfig.height.unit" size="small" style="width: 70px" @update:value="handleUpdate">
          <a-select-option value="px">px</a-select-option>
          <a-select-option value="%">%</a-select-option>
          <a-select-option value="auto">auto</a-select-option>
          <a-select-option value="vh">vh</a-select-option>
        </a-select>
      </div>
    </div>

    <!-- Preview -->
    <div class="preview-section">
      <label class="size-label">预览</label>
      <div class="preview-container">
        <div class="preview-box" :style="previewStyle">
          <span class="preview-text">{{ displaySize }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Presets -->
    <div class="presets">
      <label class="size-label">快速设置</label>
      <div class="preset-buttons">
        <button class="preset-button" @click="setPreset('full')">全屏</button>
        <button class="preset-button" @click="setPreset('half')">半屏</button>
        <button class="preset-button" @click="setPreset('auto')">自动</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
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

const sizeConfig = ref({
  width: { value: '100', unit: 'px' },
  height: { value: '100', unit: 'px' },
})

const previewStyle = computed(() => {
  const width = sizeConfig.value.width.unit === 'auto' ? 'auto' : `${sizeConfig.value.width.value}${sizeConfig.value.width.unit}`
  const height = sizeConfig.value.height.unit === 'auto' ? 'auto' : `${sizeConfig.value.height.value}${sizeConfig.value.height.unit}`

  return {
    width: width === 'auto' ? 'auto' : Math.min(parseInt(sizeConfig.value.width.value) || 100, 200) + 'px',
    height: height === 'auto' ? 'auto' : Math.min(parseInt(sizeConfig.value.height.value) || 100, 150) + 'px',
    minWidth: width === 'auto' ? '100px' : undefined,
    minHeight: height === 'auto' ? '60px' : undefined,
  }
})

const displaySize = computed(() => {
  const width = sizeConfig.value.width.unit === 'auto' ? 'auto' : `${sizeConfig.value.width.value}${sizeConfig.value.width.unit}`
  const height = sizeConfig.value.height.unit === 'auto' ? 'auto' : `${sizeConfig.value.height.value}${sizeConfig.value.height.unit}`
  return `${width} × ${height}`
})

// 解析modelValue
watch(
  () => props.modelValue,
  value => {
    if (typeof value === 'object' && value !== null) {
      if (value.width) {
        const widthMatch = String(value.width).match(/^(\d+)(px|%|auto|vw)?$/)
        if (widthMatch) {
          sizeConfig.value.width = {
            value: widthMatch[1],
            unit: widthMatch[2] || 'px',
          }
        } else if (value.width === 'auto') {
          sizeConfig.value.width = { value: '', unit: 'auto' }
        }
      }
      if (value.height) {
        const heightMatch = String(value.height).match(/^(\d+)(px|%|auto|vh)?$/)
        if (heightMatch) {
          sizeConfig.value.height = {
            value: heightMatch[1],
            unit: heightMatch[2] || 'px',
          }
        } else if (value.height === 'auto') {
          sizeConfig.value.height = { value: '', unit: 'auto' }
        }
      }
    }
  },
  { immediate: true }
)

function handleUpdate() {
  const width = sizeConfig.value.width.unit === 'auto' ? 'auto' : `${sizeConfig.value.width.value}${sizeConfig.value.width.unit}`
  const height = sizeConfig.value.height.unit === 'auto' ? 'auto' : `${sizeConfig.value.height.value}${sizeConfig.value.height.unit}`

  emit('update:modelValue', { width, height })
}

function setPreset(type: string) {
  switch (type) {
    case 'full':
      sizeConfig.value = {
        width: { value: '100', unit: '%' },
        height: { value: '100', unit: '%' },
      }
      break
    case 'half':
      sizeConfig.value = {
        width: { value: '50', unit: '%' },
        height: { value: '100', unit: '%' },
      }
      break
    case 'auto':
      sizeConfig.value = {
        width: { value: '', unit: 'auto' },
        height: { value: '', unit: 'auto' },
      }
      break
  }
  handleUpdate()
}
</script>

<style scoped>
.size-visualizer {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 8px;
}

.size-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.size-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
}

.size-input-group {
  display: flex;
  gap: 8px;
}

.preview-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
}

.preview-container {
  margin-top: 8px;
  padding: 16px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
}

.preview-box {
  background: #e6f7ff;
  border: 2px solid #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.preview-text {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
  padding: 8px;
}

.presets {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
}

.preset-buttons {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.preset-button {
  flex: 1;
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.preset-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}
</style>
