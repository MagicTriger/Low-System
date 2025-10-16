<template>
  <div class="margin-padding-visualizer">
    <div class="box-model">
      <!-- Margin Layer -->
      <div class="margin-layer">
        <span class="layer-label">Margin</span>
        <input v-model.number="values.top" type="number" class="box-input top" placeholder="0" @input="handleUpdate" />
        <input v-model.number="values.right" type="number" class="box-input right" placeholder="0" @input="handleUpdate" />
        <input v-model.number="values.bottom" type="number" class="box-input bottom" placeholder="0" @input="handleUpdate" />
        <input v-model.number="values.left" type="number" class="box-input left" placeholder="0" @input="handleUpdate" />

        <!-- Content Box -->
        <div class="content-box">
          <span class="content-label">{{ config.visualizer?.type === 'margin' ? 'Content' : 'Content' }}</span>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="quick-actions">
      <a-button size="small" @click="setAll">全部相同</a-button>
      <a-button size="small" @click="reset">重置</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
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

const values = ref({
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
})

// 解析值
watch(
  () => props.modelValue,
  value => {
    if (!value) {
      values.value = { top: 0, right: 0, bottom: 0, left: 0 }
      return
    }

    const parts = value.trim().replace(/px/g, '').split(/\s+/)

    if (parts.length === 1) {
      // 10 -> 10 10 10 10
      const v = parseInt(parts[0]) || 0
      values.value = { top: v, right: v, bottom: v, left: v }
    } else if (parts.length === 2) {
      // 10 20 -> 10 20 10 20
      const v1 = parseInt(parts[0]) || 0
      const v2 = parseInt(parts[1]) || 0
      values.value = { top: v1, right: v2, bottom: v1, left: v2 }
    } else if (parts.length === 3) {
      // 10 20 30 -> 10 20 30 20
      const v1 = parseInt(parts[0]) || 0
      const v2 = parseInt(parts[1]) || 0
      const v3 = parseInt(parts[2]) || 0
      values.value = { top: v1, right: v2, bottom: v3, left: v2 }
    } else if (parts.length >= 4) {
      // 10 20 30 40
      values.value = {
        top: parseInt(parts[0]) || 0,
        right: parseInt(parts[1]) || 0,
        bottom: parseInt(parts[2]) || 0,
        left: parseInt(parts[3]) || 0,
      }
    }
  },
  { immediate: true }
)

function handleUpdate() {
  const { top, right, bottom, left } = values.value

  // 简化输出
  if (top === right && right === bottom && bottom === left) {
    emit('update:modelValue', `${top}px`)
  } else if (top === bottom && right === left) {
    emit('update:modelValue', `${top}px ${right}px`)
  } else {
    emit('update:modelValue', `${top}px ${right}px ${bottom}px ${left}px`)
  }
}

function setAll() {
  const value = values.value.top
  values.value = { top: value, right: value, bottom: value, left: value }
  handleUpdate()
}

function reset() {
  values.value = { top: 0, right: 0, bottom: 0, left: 0 }
  handleUpdate()
}
</script>

<style scoped>
.margin-padding-visualizer {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 8px;
}

.box-model {
  position: relative;
  width: 100%;
  min-height: 180px;
}

.margin-layer {
  position: relative;
  width: 100%;
  height: 180px;
  background: #fff3cd;
  border: 2px dashed #ffc107;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.layer-label {
  position: absolute;
  top: 4px;
  left: 4px;
  font-size: 10px;
  color: #8c8c8c;
  font-weight: 500;
}

.box-input {
  position: absolute;
  width: 45px;
  padding: 4px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  text-align: center;
  background: #fff;
  transition: all 0.3s;
}

.box-input:hover {
  border-color: #40a9ff;
}

.box-input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.box-input.top {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.box-input.right {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.box-input.bottom {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.box-input.left {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.content-box {
  width: 120px;
  height: 80px;
  background: #e6f7ff;
  border: 2px solid #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content-label {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
}

.quick-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}
</style>
