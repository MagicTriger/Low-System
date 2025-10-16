<template>
  <div class="border-visualizer">
    <!-- Border Width -->
    <div class="control-row">
      <label class="control-label">宽度</label>
      <a-input-number v-model:value="borderConfig.width" :min="0" :max="20" size="small" style="width: 80px" @update:value="handleUpdate" />
      <span class="unit">px</span>
    </div>

    <!-- Border Style -->
    <div class="control-row">
      <label class="control-label">样式</label>
      <a-select v-model:value="borderConfig.style" size="small" style="width: 120px" @update:value="handleUpdate">
        <a-select-option value="solid">实线 (solid)</a-select-option>
        <a-select-option value="dashed">虚线 (dashed)</a-select-option>
        <a-select-option value="dotted">点线 (dotted)</a-select-option>
        <a-select-option value="double">双线 (double)</a-select-option>
        <a-select-option value="groove">凹槽 (groove)</a-select-option>
        <a-select-option value="ridge">凸起 (ridge)</a-select-option>
      </a-select>
    </div>

    <!-- Border Color -->
    <div class="control-row">
      <label class="control-label">颜色</label>
      <div class="color-input-wrapper">
        <input v-model="borderConfig.color" type="color" class="color-picker" @input="handleUpdate" />
        <a-input v-model:value="borderConfig.color" size="small" style="width: 100px" @update:value="handleUpdate" />
      </div>
    </div>

    <!-- Border Radius -->
    <div class="control-row">
      <label class="control-label">圆角</label>
      <a-input-number
        v-model:value="borderConfig.radius"
        :min="0"
        :max="100"
        size="small"
        style="width: 80px"
        @update:value="handleUpdate"
      />
      <span class="unit">px</span>
    </div>

    <!-- Preview -->
    <div class="preview-section">
      <label class="control-label">预览</label>
      <div class="preview-box" :style="previewStyle">Border Preview</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { FieldConfig } from '../types'

interface Props {
  config: FieldConfig
  modelValue: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const borderConfig = ref({
  width: 1,
  style: 'solid',
  color: '#d9d9d9',
  radius: 0,
})

const previewStyle = computed(() => ({
  border: `${borderConfig.value.width}px ${borderConfig.value.style} ${borderConfig.value.color}`,
  borderRadius: `${borderConfig.value.radius}px`,
}))

// 解析modelValue
watch(
  () => props.modelValue,
  value => {
    if (!value) return

    // 解析 border: "1px solid #d9d9d9"
    const borderMatch = value.match(/(\d+)px\s+(\w+)\s+(#[0-9a-fA-F]{3,6}|\w+)/)
    if (borderMatch) {
      borderConfig.value.width = parseInt(borderMatch[1]) || 1
      borderConfig.value.style = borderMatch[2] || 'solid'
      borderConfig.value.color = borderMatch[3] || '#d9d9d9'
    }
  },
  { immediate: true }
)

function handleUpdate() {
  const { width, style, color, radius } = borderConfig.value
  const borderValue = `${width}px ${style} ${color}`

  // 如果有圆角,可以考虑返回对象或者只返回border值
  emit('update:modelValue', borderValue)
}
</script>

<style scoped>
.border-visualizer {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 8px;
}

.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.control-label {
  font-size: 12px;
  color: #8c8c8c;
  font-weight: 500;
  min-width: 40px;
}

.unit {
  font-size: 12px;
  color: #8c8c8c;
}

.color-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker {
  width: 32px;
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  cursor: pointer;
}

.preview-section {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #e8e8e8;
}

.preview-box {
  margin-top: 8px;
  padding: 20px;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #595959;
  min-height: 80px;
}
</style>
