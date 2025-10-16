<template>
  <div class="position-visualizer">
    <!-- Position Type -->
    <div class="position-types">
      <button
        v-for="type in positionTypes"
        :key="type.value"
        :class="['type-button', { active: positionConfig.type === type.value }]"
        @click="setType(type.value)"
      >
        {{ type.label }}
      </button>
    </div>

    <!-- Position Values (only show for absolute, relative, fixed) -->
    <div v-if="showPositionValues" class="position-grid">
      <div class="position-center">
        <input v-model="positionConfig.top" type="text" class="position-input top" placeholder="auto" @input="handleUpdate" />
        <input v-model="positionConfig.right" type="text" class="position-input right" placeholder="auto" @input="handleUpdate" />
        <input v-model="positionConfig.bottom" type="text" class="position-input bottom" placeholder="auto" @input="handleUpdate" />
        <input v-model="positionConfig.left" type="text" class="position-input left" placeholder="auto" @input="handleUpdate" />
        <div class="position-box">
          <span class="position-label">{{ positionConfig.type }}</span>
        </div>
      </div>
    </div>

    <!-- Description -->
    <div class="description">
      <span class="description-text">{{ currentDescription }}</span>
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

const positionTypes = [
  { value: 'static', label: 'Static' },
  { value: 'relative', label: 'Relative' },
  { value: 'absolute', label: 'Absolute' },
  { value: 'fixed', label: 'Fixed' },
  { value: 'sticky', label: 'Sticky' },
]

const descriptions = {
  static: '默认定位,元素按照正常文档流排列',
  relative: '相对定位,相对于元素原始位置偏移',
  absolute: '绝对定位,相对于最近的非static父元素定位',
  fixed: '固定定位,相对于浏览器窗口定位',
  sticky: '粘性定位,在滚动时切换relative和fixed',
}

const positionConfig = ref({
  type: 'static',
  top: 'auto',
  right: 'auto',
  bottom: 'auto',
  left: 'auto',
})

const showPositionValues = computed(() => {
  return ['relative', 'absolute', 'fixed', 'sticky'].includes(positionConfig.value.type)
})

const currentDescription = computed(() => {
  return descriptions[positionConfig.value.type as keyof typeof descriptions] || ''
})

// 解析modelValue
watch(
  () => props.modelValue,
  value => {
    if (typeof value === 'object' && value !== null) {
      positionConfig.value = {
        type: value.type || 'static',
        top: value.top || 'auto',
        right: value.right || 'auto',
        bottom: value.bottom || 'auto',
        left: value.left || 'auto',
      }
    } else if (typeof value === 'string') {
      positionConfig.value.type = value
    }
  },
  { immediate: true }
)

function setType(type: string) {
  positionConfig.value.type = type
  handleUpdate()
}

function handleUpdate() {
  emit('update:modelValue', { ...positionConfig.value })
}
</script>

<style scoped>
.position-visualizer {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 8px;
}

.position-types {
  display: flex;
  gap: 4px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.type-button {
  padding: 6px 12px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.type-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.type-button.active {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.position-grid {
  margin-bottom: 12px;
}

.position-center {
  position: relative;
  width: 100%;
  height: 160px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
}

.position-input {
  position: absolute;
  width: 60px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
  text-align: center;
  background: #fff;
  transition: all 0.3s;
}

.position-input:hover {
  border-color: #40a9ff;
}

.position-input:focus {
  outline: none;
  border-color: #40a9ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.position-input.top {
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.position-input.right {
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.position-input.bottom {
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
}

.position-input.left {
  left: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.position-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 60px;
  background: #e6f7ff;
  border: 2px solid #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.position-label {
  font-size: 12px;
  color: #1890ff;
  font-weight: 500;
  text-transform: capitalize;
}

.description {
  padding: 8px;
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 2px;
}

.description-text {
  font-size: 12px;
  color: #595959;
  line-height: 1.5;
}
</style>
