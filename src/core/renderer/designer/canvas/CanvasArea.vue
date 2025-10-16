<template>
  <div
    ref="canvasContainerRef"
    class="canvas-area"
    :class="{ 'show-grid': showGrid }"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="canvas-wrapper" :style="wrapperStyle">
      <div ref="canvasRef" class="canvas" :style="canvasStyle" @click="handleCanvasClick">
        <!-- 空状态提示 -->
        <div v-if="isEmpty" class="canvas-empty">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            ></path>
          </svg>
          <p class="empty-text">从左侧组件库拖拽组件到这里开始设计</p>
        </div>

        <!-- 控件渲染区域 -->
        <slot name="controls" />

        <!-- 放置指示器 -->
        <div v-if="dropIndicator" class="drop-indicator" :class="`drop-indicator-${dropIndicator.type}`" :style="dropIndicatorStyle" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DropIndicator } from '../composables/useDragDrop'

interface Props {
  width: number
  height: number
  zoom: number
  showGrid: boolean
  isEmpty: boolean
  dropIndicator?: DropIndicator | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  drop: [event: DragEvent]
  'canvas-click': [event: MouseEvent]
}>()

// 引用
const canvasContainerRef = ref<HTMLElement>()
const canvasRef = ref<HTMLElement>()

// 样式
const wrapperStyle = computed(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'flex-start',
  minHeight: '100%',
  padding: '40px',
}))

const canvasStyle = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  transform: `scale(${props.zoom})`,
  transformOrigin: 'top left',
  position: 'relative' as const,
}))

const dropIndicatorStyle = computed(() => {
  if (!props.dropIndicator?.rect) return {}

  const rect = props.dropIndicator.rect
  return {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
  }
})

// 拖放处理
function handleDragOver(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()
}

function handleDragLeave(event: DragEvent) {
  event.stopPropagation()
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  event.stopPropagation()

  emit('drop', event)
}

// 画布点击
function handleCanvasClick(event: MouseEvent) {
  // 只有点击画布本身时才触发（不是子元素）
  if (event.target === canvasRef.value) {
    emit('canvas-click', event)
  }
}

// 暴露方法
defineExpose({
  canvasContainerRef,
  canvasRef,
})
</script>

<style scoped>
.canvas-area {
  flex: 1;
  overflow: auto;
  background: #f9fafb;
  position: relative;
}

.canvas-area.show-grid {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 0, 0, 0.05) 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: -1px -1px;
}

.canvas-wrapper {
  min-height: 100%;
}

.canvas {
  position: relative;
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.2s ease;
  overflow: hidden;
}

/* 空状态 */
.canvas-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 400px;
  color: #9ca3af;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin-bottom: 16px;
  stroke-width: 1.5;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

/* 放置指示器 */
.drop-indicator {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  transition: all 0.2s ease;
}

.drop-indicator-before {
  border-top: 2px solid #3b82f6;
  height: 0;
}

.drop-indicator-after {
  border-bottom: 2px solid #3b82f6;
  height: 0;
}

.drop-indicator-inside {
  border: 2px dashed #3b82f6;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 4px;
}

/* 滚动条样式 */
.canvas-area::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

.canvas-area::-webkit-scrollbar-track {
  background: #f1f1f1;
}

.canvas-area::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

.canvas-area::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
