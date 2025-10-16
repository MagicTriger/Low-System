<template>
  <div 
    class="canvas-editor"
    :class="canvasClasses"
    :style="canvasStyles"
    @drop="handleDrop"
    @dragover="handleDragOver"
    @dragenter="handleDragEnter"
    @dragleave="handleDragLeave"
    @click="handleCanvasClick"
  >
    <!-- 画布背景网格 -->
    <div v-if="showGrid" class="canvas-grid" :style="gridStyles"></div>
    
    <!-- 拖拽放置指示器 -->
    <div 
      v-if="isDragOver" 
      class="drop-indicator"
      :style="dropIndicatorStyles"
    >
      <div class="drop-indicator-content">
        <plus-outlined />
        <span>放置组件到此处</span>
      </div>
    </div>
    
    <!-- 控件渲染区域 -->
    <div class="controls-container" :style="containerStyles">
      <ControlRenderer
        v-for="control in controls"
        :key="control.id"
        :control="control"
        :view-id="viewId"
        :zoom="zoom"
        :selected="isControlSelected(control.id)"
        @select="handleControlSelect"
        @delete="handleControlDelete"
        @copy="handleControlCopy"
        @move="handleControlMove"
      />
    </div>
    
    <!-- 选择框 -->
    <div 
      v-if="selectionBox.visible" 
      class="selection-box"
      :style="selectionBoxStyles"
    ></div>
    
    <!-- 空状态 -->
    <div v-if="isEmpty" class="empty-canvas">
      <div class="empty-icon">🎨</div>
      <div class="empty-title">开始设计您的页面</div>
      <div class="empty-description">从左侧组件面板拖拽组件到此处</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, reactive, onMounted, onUnmounted } from 'vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { message } from 'ant-design-vue'
import { RootViewContext } from '../../root-view-context'
import ControlRenderer from '../control-renderer.vue'
import type { Control } from '../../base'

interface Props {
  viewId: string
  zoom?: number
  showGrid?: boolean
  gridSize?: number
  width?: number
  height?: number
  backgroundColor?: string
  controls?: Control[]
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1,
  showGrid: true,
  gridSize: 20,
  width: 375,
  height: 667,
  backgroundColor: '#ffffff',
  controls: () => []
})

// 事件定义
const emit = defineEmits<{
  'control-add': [control: Control, position: { x: number; y: number }]
  'control-select': [controlId: string]
  'control-delete': [controlId: string]
  'control-copy': [control: Control]
  'control-move': [controlId: string, position: { x: number; y: number }]
  'canvas-click': [event: MouseEvent]
}>()

// 注入上下文
const ctx = inject<RootViewContext>(RootViewContext.ProvideKey)

// 状态管理
const isDragOver = ref(false)
const dragOverPosition = ref({ x: 0, y: 0 })
const selectedControlIds = ref<Set<string>>(new Set())
const selectionBox = reactive({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

// 计算属性
const isEmpty = computed(() => props.controls.length === 0)

const canvasClasses = computed(() => [
  'canvas-editor',
  {
    'is-drag-over': isDragOver.value,
    'show-grid': props.showGrid,
    'is-empty': isEmpty.value
  }
])

const canvasStyles = computed(() => ({
  width: `${props.width}px`,
  height: `${props.height}px`,
  backgroundColor: props.backgroundColor,
  transform: `scale(${props.zoom})`,
  transformOrigin: 'top left',
  position: 'relative',
  overflow: 'hidden'
}))

const gridStyles = computed(() => ({
  backgroundImage: `
    linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
  `,
  backgroundSize: `${props.gridSize}px ${props.gridSize}px`
}))

const containerStyles = computed(() => ({
  position: 'relative',
  width: '100%',
  height: '100%',
  minHeight: '100%'
}))

const dropIndicatorStyles = computed(() => ({
  left: `${dragOverPosition.value.x - 50}px`,
  top: `${dragOverPosition.value.y - 25}px`
}))

const selectionBoxStyles = computed(() => ({
  left: `${Math.min(selectionBox.startX, selectionBox.endX)}px`,
  top: `${Math.min(selectionBox.startY, selectionBox.endY)}px`,
  width: `${Math.abs(selectionBox.endX - selectionBox.startX)}px`,
  height: `${Math.abs(selectionBox.endY - selectionBox.startY)}px`
}))

// 方法
const isControlSelected = (controlId: string) => {
  return selectedControlIds.value.has(controlId)
}

const handleDragEnter = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = true
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  
  // 更新拖拽位置
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  dragOverPosition.value = {
    x: (event.clientX - rect.left) / props.zoom,
    y: (event.clientY - rect.top) / props.zoom
  }
}

const handleDragLeave = (event: DragEvent) => {
  // 只有当离开画布边界时才隐藏指示器
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const x = event.clientX
  const y = event.clientY
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    isDragOver.value = false
  }
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  isDragOver.value = false
  
  try {
    // 获取拖拽数据
    const controlKind = event.dataTransfer?.getData('text/plain')
    const controlData = event.dataTransfer?.getData('application/json')
    
    if (!controlKind) {
      return
    }
    
    // 计算放置位置
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const position = {
      x: (event.clientX - rect.left) / props.zoom,
      y: (event.clientY - rect.top) / props.zoom
    }
    
    // 创建新控件
    const newControl: Control = {
      id: `${controlKind}_${Date.now()}`,
      kind: controlKind,
      name: controlKind,
      props: getDefaultProps(controlKind),
      styles: {
        position: 'absolute',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1
      },
      classes: [],
      eventExection: {},
      children: []
    }
    
    // 触发添加事件
    emit('control-add', newControl, position)
    
    message.success(`已添加${controlKind}组件`)
  } catch (error) {
    console.error('拖拽放置失败:', error)
    message.error('添加组件失败')
  }
}

const handleCanvasClick = (event: MouseEvent) => {
  // 清除选择
  selectedControlIds.value.clear()
  emit('canvas-click', event)
}

const handleControlSelect = (controlId: string) => {
  selectedControlIds.value.clear()
  selectedControlIds.value.add(controlId)
  emit('control-select', controlId)
}

const handleControlDelete = (controlId: string) => {
  selectedControlIds.value.delete(controlId)
  emit('control-delete', controlId)
}

const handleControlCopy = (control: Control) => {
  emit('control-copy', control)
}

const handleControlMove = (controlId: string, position: { x: number; y: number }) => {
  emit('control-move', controlId, position)
}

const getDefaultProps = (kind: string) => {
  const defaultPropsMap: Record<string, any> = {
    'span': { text: '文本内容' },
    'button': { text: '按钮', type: 'primary' },
    'string': { placeholder: '请输入内容' },
    'number': { placeholder: '请输入数字' },
    'boolean': { checked: false },
    'image': { src: '', alt: '图片' },
    'flex': { direction: 'row', gap: 8 },
    'grid': { columns: 2, gap: 16 },
    'table': { columns: [], dataSource: [] },
    'line-chart': { 
      data: [
        { name: '1月', value: 120 },
        { name: '2月', value: 132 },
        { name: '3月', value: 101 }
      ]
    },
    'bar-chart': { 
      data: [
        { name: '产品A', value: 320 },
        { name: '产品B', value: 302 },
        { name: '产品C', value: 301 }
      ]
    },
    'pie-chart': { 
      data: [
        { name: '直接访问', value: 335 },
        { name: '邮件营销', value: 310 },
        { name: '联盟广告', value: 234 }
      ]
    }
  }
  
  return defaultPropsMap[kind] || {}
}

// 键盘事件处理
const handleKeyDown = (event: KeyboardEvent) => {
  // Delete 键删除选中控件
  if (event.key === 'Delete' && selectedControlIds.value.size > 0) {
    event.preventDefault()
    selectedControlIds.value.forEach(controlId => {
      emit('control-delete', controlId)
    })
    selectedControlIds.value.clear()
  }
  
  // Escape 键取消选择
  if (event.key === 'Escape') {
    event.preventDefault()
    selectedControlIds.value.clear()
  }
  
  // Ctrl+A 全选
  if (event.ctrlKey && event.key === 'a') {
    event.preventDefault()
    selectedControlIds.value.clear()
    props.controls.forEach(control => {
      selectedControlIds.value.add(control.id)
    })
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.canvas-editor {
  position: relative;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #ffffff;
  overflow: hidden;
  user-select: none;
  cursor: default;
}

.canvas-editor.is-drag-over {
  border-color: #1890ff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
}

.canvas-grid {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  opacity: 0.5;
}

.drop-indicator {
  position: absolute;
  z-index: 1000;
  pointer-events: none;
}

.drop-indicator-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(24, 144, 255, 0.9);
  color: white;
  border-radius: 4px;
  font-size: 12px;
  white-space: nowrap;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.controls-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.selection-box {
  position: absolute;
  border: 1px dashed #1890ff;
  background: rgba(24, 144, 255, 0.1);
  pointer-events: none;
  z-index: 999;
}

.empty-canvas {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #8c8c8c;
  user-select: none;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #595959;
}

.empty-description {
  font-size: 14px;
  color: #8c8c8c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .canvas-editor {
    min-height: 400px;
  }
  
  .empty-icon {
    font-size: 36px;
  }
  
  .empty-title {
    font-size: 14px;
  }
  
  .empty-description {
    font-size: 12px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .canvas-editor {
    border-color: #434343;
    background: #1f1f1f;
  }
  
  .canvas-grid {
    background-image: 
      linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px) !important;
  }
  
  .empty-canvas {
    color: #8c8c8c;
  }
  
  .empty-title {
    color: #a6a6a6;
  }
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .canvas-editor {
    border-width: 2px;
  }
  
  .drop-indicator-content {
    border: 2px solid #ffffff;
  }
  
  .selection-box {
    border-width: 2px;
  }
}
</style>