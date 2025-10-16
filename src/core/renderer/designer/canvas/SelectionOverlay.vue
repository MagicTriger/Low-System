<template>
  <div v-if="visible" class="selection-overlay" :class="{ 'is-hovered': isHovered }" :style="overlayStyle">
    <!-- 选择边框 -->
    <div class="selection-border" />

    <!-- 组件标签 -->
    <div class="selection-label">
      <span class="label-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
          ></path>
        </svg>
      </span>
      <span class="label-text">{{ controlName }}</span>
    </div>

    <!-- 调整手柄 -->
    <template v-if="showResizeHandles && !isHovered">
      <div
        v-for="handle in resizeHandles"
        :key="handle"
        class="resize-handle"
        :class="`resize-handle-${handle}`"
        @mousedown.stop="handleResizeStart($event, handle)"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  visible: boolean
  controlName: string
  rect: DOMRect
  isHovered?: boolean
  showResizeHandles?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isHovered: false,
  showResizeHandles: true,
})

const emit = defineEmits<{
  'resize-start': [event: MouseEvent, handle: string]
}>()

// 调整手柄位置
const resizeHandles = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']

// 覆盖层样式
const overlayStyle = computed(() => ({
  left: `${props.rect.left}px`,
  top: `${props.rect.top}px`,
  width: `${props.rect.width}px`,
  height: `${props.rect.height}px`,
}))

// 处理调整大小开始
function handleResizeStart(event: MouseEvent, handle: string) {
  emit('resize-start', event, handle)
}
</script>

<style scoped>
.selection-overlay {
  position: absolute;
  pointer-events: none;
  z-index: 999;
}

.selection-border {
  position: absolute;
  inset: -2px;
  border: 2px solid #3b82f6;
  border-radius: 4px;
  pointer-events: none;
}

.selection-overlay.is-hovered .selection-border {
  border-color: #60a5fa;
  border-style: dashed;
}

/* 组件标签 */
.selection-label {
  position: absolute;
  top: -28px;
  left: -2px;
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: #3b82f6;
  color: white;
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  white-space: nowrap;
  pointer-events: none;
}

.selection-overlay.is-hovered .selection-label {
  background: #60a5fa;
}

.label-icon {
  display: flex;
  align-items: center;
}

.label-icon svg {
  width: 14px;
  height: 14px;
  stroke-width: 2;
}

.label-text {
  line-height: 1;
}

/* 调整手柄 */
.resize-handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 2px solid #3b82f6;
  border-radius: 50%;
  pointer-events: auto;
  cursor: pointer;
  z-index: 1;
}

.resize-handle:hover {
  background: #3b82f6;
  transform: scale(1.2);
}

/* 手柄位置 */
.resize-handle-nw {
  top: -4px;
  left: -4px;
  cursor: nw-resize;
}

.resize-handle-n {
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.resize-handle-ne {
  top: -4px;
  right: -4px;
  cursor: ne-resize;
}

.resize-handle-e {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  cursor: e-resize;
}

.resize-handle-se {
  bottom: -4px;
  right: -4px;
  cursor: se-resize;
}

.resize-handle-s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.resize-handle-sw {
  bottom: -4px;
  left: -4px;
  cursor: sw-resize;
}

.resize-handle-w {
  top: 50%;
  left: -4px;
  transform: translateY(-50%);
  cursor: w-resize;
}
</style>
