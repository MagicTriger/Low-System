<template>
  <div class="flex-visualizer">
    <!-- Flex Direction -->
    <div class="control-group">
      <label class="control-label">主轴方向</label>
      <div class="button-group">
        <button
          v-for="option in directionOptions"
          :key="option.value"
          :class="['icon-button', { active: flexConfig.direction === option.value }]"
          :title="option.label"
          @click="setDirection(option.value)"
        >
          <component :is="option.icon" />
        </button>
      </div>
    </div>

    <!-- Justify Content -->
    <div class="control-group">
      <label class="control-label">主轴对齐</label>
      <div class="button-group">
        <button
          v-for="option in justifyOptions"
          :key="option.value"
          :class="['icon-button', { active: flexConfig.justify === option.value }]"
          :title="option.label"
          @click="setJustify(option.value)"
        >
          {{ option.icon }}
        </button>
      </div>
    </div>

    <!-- Align Items -->
    <div class="control-group">
      <label class="control-label">交叉轴对齐</label>
      <div class="button-group">
        <button
          v-for="option in alignOptions"
          :key="option.value"
          :class="['icon-button', { active: flexConfig.align === option.value }]"
          :title="option.label"
          @click="setAlign(option.value)"
        >
          {{ option.icon }}
        </button>
      </div>
    </div>

    <!-- Flex Ratio -->
    <div class="control-group">
      <label class="control-label">子元素占比</label>
      <a-input v-model:value="flexConfig.flexRatio" size="small" placeholder="例如: 1:2:1" @change="emitUpdate" />
      <div class="ratio-hint">输入比例，如 1:2 表示左边1/3，右边2/3</div>
    </div>

    <!-- Preview -->
    <div class="preview-box" :style="previewStyle">
      <div class="preview-item" v-for="(ratio, index) in ratioArray" :key="index" :style="{ flex: `${ratio} 1 0%` }">
        {{ index + 1 }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { ArrowRightOutlined, ArrowLeftOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons-vue'
import type { FieldConfig } from '../types'

interface Props {
  config: FieldConfig
  modelValue: any
  childrenCount?: number // 容器中实际的子元素数量
}

interface Emits {
  (e: 'update:modelValue', value: any): void
}

const props = withDefaults(defineProps<Props>(), {
  childrenCount: 3, // 默认显示 3 个
})
const emit = defineEmits<Emits>()

const flexConfig = ref({
  direction: 'row',
  justify: 'flex-start',
  align: 'stretch',
  flexRatio: '1:1:1',
})

const directionOptions = [
  { value: 'row', label: '水平', icon: ArrowRightOutlined },
  { value: 'row-reverse', label: '水平反向', icon: ArrowLeftOutlined },
  { value: 'column', label: '垂直', icon: ArrowDownOutlined },
  { value: 'column-reverse', label: '垂直反向', icon: ArrowUpOutlined },
]

const justifyOptions = [
  { value: 'flex-start', label: '起始对齐', icon: '⊣' },
  { value: 'flex-end', label: '末尾对齐', icon: '⊢' },
  { value: 'center', label: '居中对齐', icon: '⊣⊢' },
  { value: 'space-between', label: '两端对齐', icon: '⊣ ⊢' },
  { value: 'space-around', label: '环绕对齐', icon: '⊣  ⊢' },
  { value: 'space-evenly', label: '均匀对齐', icon: '⊣   ⊢' },
]

const alignOptions = [
  { value: 'flex-start', label: '顶部对齐', icon: '⊤' },
  { value: 'flex-end', label: '底部对齐', icon: '⊥' },
  { value: 'center', label: '居中对齐', icon: '↕' },
  { value: 'stretch', label: '拉伸', icon: '↕↕' },
  { value: 'baseline', label: '基线对齐', icon: '—' },
]

// 解析比例字符串为数组，预览数量由占比字符串决定
const ratioArray = computed(() => {
  const ratioString = flexConfig.value.flexRatio || '1:1:1'
  const ratios = ratioString
    .split(':')
    .map(r => parseFloat(r.trim()))
    .filter(r => !isNaN(r))

  // 如果没有有效的比例，使用默认值
  if (ratios.length === 0) {
    return [1, 1, 1]
  }

  return ratios
})

const previewStyle = computed(() => ({
  display: 'flex',
  flexDirection: flexConfig.value.direction as any,
  justifyContent: flexConfig.value.justify as any,
  alignItems: flexConfig.value.align as any,
  gap: '8px',
}))

// 解析modelValue
watch(
  () => props.modelValue,
  value => {
    if (typeof value === 'object' && value !== null) {
      flexConfig.value = {
        direction: value.direction || 'row',
        justify: value.justify || 'flex-start',
        align: value.align || 'stretch',
        flexRatio: value.flexRatio || '1:1:1',
      }
    }
  },
  { immediate: true }
)

function setDirection(value: string) {
  flexConfig.value.direction = value
  emitUpdate()
}

function setJustify(value: string) {
  flexConfig.value.justify = value
  emitUpdate()
}

function setAlign(value: string) {
  flexConfig.value.align = value
  emitUpdate()
}

function emitUpdate() {
  emit('update:modelValue', { ...flexConfig.value })
}
</script>

<style scoped>
.flex-visualizer {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  margin-top: 8px;
}

.control-group {
  margin-bottom: 12px;
}

.control-group:last-of-type {
  margin-bottom: 16px;
}

.control-label {
  display: block;
  font-size: 12px;
  color: #8c8c8c;
  margin-bottom: 8px;
  font-weight: 500;
}

.button-group {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.gap-inputs {
  display: flex;
  gap: 8px;
}

.icon-button {
  min-width: 36px;
  height: 32px;
  padding: 4px 8px;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s;
}

.icon-button:hover {
  border-color: #40a9ff;
  color: #40a9ff;
}

.icon-button.active {
  border-color: #1890ff;
  color: #1890ff;
  background: #e6f7ff;
}

.preview-box {
  min-height: 100px;
  padding: 12px;
  background: #fff;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  gap: 8px;
}

.preview-item {
  min-width: 40px;
  height: 40px;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 500;
}

.ratio-hint {
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.4;
}
</style>
