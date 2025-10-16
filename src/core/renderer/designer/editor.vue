<template>
  <div class="designer-editor">
    <div class="editor-toolbar">
      <div class="toolbar-left">
        <button class="toolbar-btn" @click="undo" :disabled="!canUndo">
          <Icon name="undo" />
          <span>撤销</span>
        </button>
        <button class="toolbar-btn" @click="redo" :disabled="!canRedo">
          <Icon name="redo" />
          <span>重做</span>
        </button>
        <div class="toolbar-divider"></div>
        <button class="toolbar-btn" @click="copy" :disabled="!selectedElement">
          <Icon name="copy" />
          <span>复制</span>
        </button>
        <button class="toolbar-btn" @click="paste" :disabled="!canPaste">
          <Icon name="paste" />
          <span>粘贴</span>
        </button>
        <button class="toolbar-btn" @click="deleteElement" :disabled="!selectedElement">
          <Icon name="delete" />
          <span>删除</span>
        </button>
      </div>
      
      <div class="toolbar-right">
        <div class="zoom-controls">
          <button class="toolbar-btn" @click="zoomOut">
            <Icon name="zoom-out" />
          </button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button class="toolbar-btn" @click="zoomIn">
            <Icon name="zoom-in" />
          </button>
          <button class="toolbar-btn" @click="resetZoom">
            <Icon name="fit" />
          </button>
        </div>
      </div>
    </div>
    
    <div class="editor-content" ref="editorRef">
      <div class="canvas-wrapper" :style="canvasStyle">
        <div class="canvas" :style="{ transform: `scale(${zoom})` }">
          <slot name="canvas" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@/core/components'

// Props
interface Props {
  canUndo?: boolean
  canRedo?: boolean
  selectedElement?: any
  canPaste?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  canUndo: false,
  canRedo: false,
  selectedElement: null,
  canPaste: false
})

// Emits
const emit = defineEmits<{
  undo: []
  redo: []
  copy: []
  paste: []
  delete: []
  zoomChange: [zoom: number]
}>()

// 响应式数据
const editorRef = ref<HTMLElement>()
const zoom = ref(1)
const minZoom = 0.1
const maxZoom = 5

// 计算属性
const canvasStyle = computed(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100%',
  padding: '20px'
}))

// 方法
const undo = () => {
  emit('undo')
}

const redo = () => {
  emit('redo')
}

const copy = () => {
  emit('copy')
}

const paste = () => {
  emit('paste')
}

const deleteElement = () => {
  emit('delete')
}

const zoomIn = () => {
  const newZoom = Math.min(zoom.value * 1.2, maxZoom)
  setZoom(newZoom)
}

const zoomOut = () => {
  const newZoom = Math.max(zoom.value / 1.2, minZoom)
  setZoom(newZoom)
}

const resetZoom = () => {
  setZoom(1)
}

const setZoom = (newZoom: number) => {
  zoom.value = newZoom
  emit('zoomChange', newZoom)
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'z':
        event.preventDefault()
        if (event.shiftKey) {
          redo()
        } else {
          undo()
        }
        break
      case 'c':
        event.preventDefault()
        copy()
        break
      case 'v':
        event.preventDefault()
        paste()
        break
      case '=':
      case '+':
        event.preventDefault()
        zoomIn()
        break
      case '-':
        event.preventDefault()
        zoomOut()
        break
      case '0':
        event.preventDefault()
        resetZoom()
        break
    }
  } else if (event.key === 'Delete' || event.key === 'Backspace') {
    if (props.selectedElement) {
      event.preventDefault()
      deleteElement()
    }
  }
}

// 鼠标滚轮缩放
const handleWheel = (event: WheelEvent) => {
  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()
    const delta = event.deltaY > 0 ? 0.9 : 1.1
    const newZoom = Math.max(minZoom, Math.min(maxZoom, zoom.value * delta))
    setZoom(newZoom)
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  editorRef.value?.addEventListener('wheel', handleWheel, { passive: false })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  editorRef.value?.removeEventListener('wheel', handleWheel)
})

// 暴露方法
defineExpose({
  zoomIn,
  zoomOut,
  resetZoom,
  setZoom,
  zoom
})
</script>

<style scoped>
.designer-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
}

.editor-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.toolbar-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.zoom-level {
  font-size: 12px;
  color: #6b7280;
  min-width: 40px;
  text-align: center;
}

.editor-content {
  flex: 1;
  overflow: auto;
  background: #f9fafb;
}

.canvas-wrapper {
  min-height: 100%;
  background: 
    radial-gradient(circle, #d1d5db 1px, transparent 1px),
    radial-gradient(circle, #d1d5db 1px, transparent 1px);
  background-size: 20px 20px;
  background-position: 0 0, 10px 10px;
}

.canvas {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  transform-origin: center;
  transition: transform 0.2s ease;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .toolbar-btn span {
    display: none;
  }
  
  .toolbar-btn {
    padding: 6px;
  }
  
  .zoom-level {
    font-size: 10px;
  }
}
</style>