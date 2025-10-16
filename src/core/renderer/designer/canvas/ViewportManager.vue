<template>
  <div class="viewport-manager">
    <!-- 工具栏 -->
    <div class="viewport-toolbar">
      <!-- 缩放控制 -->
      <div class="zoom-controls">
        <a-button-group size="small">
          <a-button @click="zoomOut" :disabled="zoom <= minZoom">
            <minus-outlined />
          </a-button>
          <a-dropdown :trigger="['click']">
            <a-button>
              {{ Math.round(zoom * 100) }}%
              <down-outlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleZoomSelect">
                <a-menu-item v-for="level in zoomLevels" :key="level" :value="level">
                  {{ Math.round(level * 100) }}%
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
          <a-button @click="zoomIn" :disabled="zoom >= maxZoom">
            <plus-outlined />
          </a-button>
        </a-button-group>
        
        <a-button size="small" @click="zoomToFit" title="适应画布">
          <fullscreen-outlined />
        </a-button>
        
        <a-button size="small" @click="resetZoom" title="重置缩放">
          <redo-outlined />
        </a-button>
      </div>
      
      <!-- 设备预览 -->
      <div class="device-controls">
        <a-select 
          v-model:value="selectedDevice" 
          size="small" 
          style="width: 120px"
          @change="handleDeviceChange"
        >
          <a-select-option value="custom">自定义</a-select-option>
          <a-select-option 
            v-for="device in devicePresets" 
            :key="device.name" 
            :value="device.name"
          >
            {{ device.name }}
          </a-select-option>
        </a-select>
        
        <a-button 
          size="small" 
          @click="toggleOrientation"
          :disabled="selectedDevice === 'custom'"
          title="旋转设备"
        >
          <rotate-right-outlined />
        </a-button>
      </div>
      
      <!-- 视图控制 -->
      <div class="view-controls">
        <a-button-group size="small">
          <a-button 
            :type="showGrid ? 'primary' : 'default'"
            @click="toggleGrid"
            title="显示网格"
          >
            <border-outlined />
          </a-button>
          
          <a-button 
            :type="showRuler ? 'primary' : 'default'"
            @click="toggleRuler"
            title="显示标尺"
          >
            <column-width-outlined />
          </a-button>
          
          <a-button 
            :type="showGuides ? 'primary' : 'default'"
            @click="toggleGuides"
            title="显示参考线"
          >
            <line-outlined />
          </a-button>
        </a-button-group>
      </div>
    </div>
    
    <!-- 视口容器 -->
    <div 
      class="viewport-container"
      :class="viewportClasses"
      @wheel="handleWheel"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
    >
      <!-- 标尺 -->
      <div v-if="showRuler" class="rulers">
        <div class="ruler ruler-horizontal">
          <div 
            v-for="mark in horizontalMarks" 
            :key="mark.position"
            class="ruler-mark"
            :style="{ left: mark.position + 'px' }"
          >
            <span class="ruler-label">{{ mark.label }}</span>
          </div>
        </div>
        <div class="ruler ruler-vertical">
          <div 
            v-for="mark in verticalMarks" 
            :key="mark.position"
            class="ruler-mark"
            :style="{ top: mark.position + 'px' }"
          >
            <span class="ruler-label">{{ mark.label }}</span>
          </div>
        </div>
      </div>
      
      <!-- 画布区域 -->
      <div 
        class="canvas-wrapper"
        :style="canvasWrapperStyles"
        ref="canvasWrapperRef"
      >
        <div 
          class="canvas-container"
          :style="canvasContainerStyles"
        >
          <slot 
            :zoom="zoom"
            :width="canvasWidth"
            :height="canvasHeight"
            :show-grid="showGrid"
          />
        </div>
        
        <!-- 参考线 -->
        <div v-if="showGuides" class="guides">
          <div 
            v-for="guide in guides" 
            :key="guide.id"
            class="guide"
            :class="guide.type"
            :style="getGuideStyle(guide)"
            @mousedown="startDragGuide(guide, $event)"
          />
        </div>
      </div>
    </div>
    
    <!-- 设备信息显示 -->
    <div v-if="selectedDevice !== 'custom'" class="device-info">
      <span>{{ currentDeviceInfo.name }}</span>
      <span>{{ canvasWidth }} × {{ canvasHeight }}</span>
      <span>{{ currentDeviceInfo.dpr }}x DPR</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { 
  MinusOutlined, 
  PlusOutlined, 
  DownOutlined,
  FullscreenOutlined,
  RedoOutlined,
  RotateRightOutlined,
  BorderOutlined,
  ColumnWidthOutlined,
  LineOutlined
} from '@ant-design/icons-vue'

interface DevicePreset {
  name: string
  width: number
  height: number
  dpr: number
  category: 'mobile' | 'tablet' | 'desktop'
}

interface Guide {
  id: string
  type: 'horizontal' | 'vertical'
  position: number
}

interface Props {
  initialZoom?: number
  initialWidth?: number
  initialHeight?: number
  minZoom?: number
  maxZoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  initialZoom: 1,
  initialWidth: 375,
  initialHeight: 667,
  minZoom: 0.1,
  maxZoom: 5
})

// 事件定义
const emit = defineEmits<{
  'zoom-change': [zoom: number]
  'size-change': [width: number, height: number]
  'device-change': [device: string]
}>()

// 设备预设
const devicePresets: DevicePreset[] = [
  { name: 'iPhone SE', width: 375, height: 667, dpr: 2, category: 'mobile' },
  { name: 'iPhone 12', width: 390, height: 844, dpr: 3, category: 'mobile' },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, dpr: 3, category: 'mobile' },
  { name: 'iPad', width: 768, height: 1024, dpr: 2, category: 'tablet' },
  { name: 'iPad Pro', width: 1024, height: 1366, dpr: 2, category: 'tablet' },
  { name: 'Desktop', width: 1440, height: 900, dpr: 1, category: 'desktop' },
  { name: 'Desktop Large', width: 1920, height: 1080, dpr: 1, category: 'desktop' }
]

// 状态管理
const zoom = ref(props.initialZoom)
const canvasWidth = ref(props.initialWidth)
const canvasHeight = ref(props.initialHeight)
const selectedDevice = ref('iPhone SE')
const isLandscape = ref(false)
const showGrid = ref(true)
const showRuler = ref(true)
const showGuides = ref(true)

// 视口状态
const viewportState = reactive({
  panX: 0,
  panY: 0,
  isPanning: false,
  lastMouseX: 0,
  lastMouseY: 0
})

// 参考线
const guides = ref<Guide[]>([])
const dragGuide = ref<Guide | null>(null)

// 缩放级别
const zoomLevels = [0.1, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5]

// 计算属性
const currentDeviceInfo = computed(() => {
  const device = devicePresets.find(d => d.name === selectedDevice.value)
  return device || { name: '自定义', dpr: 1, category: 'custom' as const }
})

const viewportClasses = computed(() => [
  'viewport-container',
  {
    'is-panning': viewportState.isPanning,
    'show-grid': showGrid.value,
    'show-ruler': showRuler.value
  }
])

const canvasWrapperStyles = computed(() => ({
  transform: `translate(${viewportState.panX}px, ${viewportState.panY}px)`,
  transformOrigin: 'top left'
}))

const canvasContainerStyles = computed(() => ({
  width: `${canvasWidth.value}px`,
  height: `${canvasHeight.value}px`,
  transform: `scale(${zoom.value})`,
  transformOrigin: 'top left'
}))

// 标尺刻度
const horizontalMarks = computed(() => {
  const marks = []
  const step = 50
  const maxWidth = canvasWidth.value + 200
  
  for (let i = 0; i <= maxWidth; i += step) {
    marks.push({
      position: i * zoom.value,
      label: i.toString()
    })
  }
  
  return marks
})

const verticalMarks = computed(() => {
  const marks = []
  const step = 50
  const maxHeight = canvasHeight.value + 200
  
  for (let i = 0; i <= maxHeight; i += step) {
    marks.push({
      position: i * zoom.value,
      label: i.toString()
    })
  }
  
  return marks
})

// 方法
const zoomIn = () => {
  const currentIndex = zoomLevels.findIndex(level => level >= zoom.value)
  const nextIndex = Math.min(currentIndex + 1, zoomLevels.length - 1)
  setZoom(zoomLevels[nextIndex])
}

const zoomOut = () => {
  const currentIndex = zoomLevels.findIndex(level => level >= zoom.value)
  const prevIndex = Math.max(currentIndex - 1, 0)
  setZoom(zoomLevels[prevIndex])
}

const setZoom = (newZoom: number) => {
  zoom.value = Math.max(props.minZoom, Math.min(props.maxZoom, newZoom))
  emit('zoom-change', zoom.value)
}

const resetZoom = () => {
  setZoom(1)
  viewportState.panX = 0
  viewportState.panY = 0
}

const zoomToFit = () => {
  // 计算适合的缩放比例
  const container = document.querySelector('.viewport-container') as HTMLElement
  if (!container) return
  
  const containerRect = container.getBoundingClientRect()
  const padding = 40
  
  const scaleX = (containerRect.width - padding * 2) / canvasWidth.value
  const scaleY = (containerRect.height - padding * 2) / canvasHeight.value
  const scale = Math.min(scaleX, scaleY, 1)
  
  setZoom(scale)
  
  // 居中显示
  viewportState.panX = (containerRect.width - canvasWidth.value * scale) / 2
  viewportState.panY = (containerRect.height - canvasHeight.value * scale) / 2
}

const handleZoomSelect = ({ key }: { key: string }) => {
  setZoom(parseFloat(key))
}

const handleDeviceChange = (deviceName: string) => {
  if (deviceName === 'custom') return
  
  const device = devicePresets.find(d => d.name === deviceName)
  if (device) {
    if (isLandscape.value) {
      canvasWidth.value = device.height
      canvasHeight.value = device.width
    } else {
      canvasWidth.value = device.width
      canvasHeight.value = device.height
    }
    
    emit('size-change', canvasWidth.value, canvasHeight.value)
    emit('device-change', deviceName)
  }
}

const toggleOrientation = () => {
  isLandscape.value = !isLandscape.value
  const temp = canvasWidth.value
  canvasWidth.value = canvasHeight.value
  canvasHeight.value = temp
  
  emit('size-change', canvasWidth.value, canvasHeight.value)
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
}

const toggleRuler = () => {
  showRuler.value = !showRuler.value
}

const toggleGuides = () => {
  showGuides.value = !showGuides.value
}

// 鼠标事件处理
const handleWheel = (event: WheelEvent) => {
  if (event.ctrlKey || event.metaKey) {
    // 缩放
    event.preventDefault()
    const delta = event.deltaY > 0 ? -0.1 : 0.1
    setZoom(zoom.value + delta)
  } else {
    // 平移
    viewportState.panX -= event.deltaX
    viewportState.panY -= event.deltaY
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (event.button === 1 || (event.button === 0 && event.altKey)) {
    // 中键或 Alt+左键开始平移
    event.preventDefault()
    viewportState.isPanning = true
    viewportState.lastMouseX = event.clientX
    viewportState.lastMouseY = event.clientY
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (viewportState.isPanning) {
    const deltaX = event.clientX - viewportState.lastMouseX
    const deltaY = event.clientY - viewportState.lastMouseY
    
    viewportState.panX += deltaX
    viewportState.panY += deltaY
    
    viewportState.lastMouseX = event.clientX
    viewportState.lastMouseY = event.clientY
  }
}

const handleMouseUp = () => {
  viewportState.isPanning = false
}

const handleMouseLeave = () => {
  viewportState.isPanning = false
}

// 参考线相关
const getGuideStyle = (guide: Guide) => {
  if (guide.type === 'horizontal') {
    return {
      top: `${guide.position * zoom.value}px`,
      left: '0',
      right: '0',
      height: '1px'
    }
  } else {
    return {
      left: `${guide.position * zoom.value}px`,
      top: '0',
      bottom: '0',
      width: '1px'
    }
  }
}

const startDragGuide = (guide: Guide, event: MouseEvent) => {
  event.preventDefault()
  dragGuide.value = guide
}

// 监听器
watch(() => selectedDevice.value, (newDevice) => {
  if (newDevice !== 'custom') {
    handleDeviceChange(newDevice)
  }
}, { immediate: true })
</script>

<style scoped>
.viewport-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f5f5;
}

.viewport-toolbar {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: #ffffff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.zoom-controls,
.device-controls,
.view-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.viewport-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.viewport-container.is-panning {
  cursor: grabbing;
}

.rulers {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.ruler {
  position: absolute;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e8e8e8;
}

.ruler-horizontal {
  top: 0;
  left: 0;
  right: 0;
  height: 20px;
}

.ruler-vertical {
  top: 0;
  left: 0;
  bottom: 0;
  width: 20px;
}

.ruler-mark {
  position: absolute;
  font-size: 10px;
  color: #666;
}

.ruler-horizontal .ruler-mark {
  top: 2px;
}

.ruler-vertical .ruler-mark {
  left: 2px;
  writing-mode: vertical-lr;
}

.canvas-wrapper {
  position: absolute;
  top: 20px;
  left: 20px;
}

.canvas-container {
  position: relative;
  background: #ffffff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.guides {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.guide {
  position: absolute;
  background: #1890ff;
  cursor: move;
  pointer-events: auto;
}

.guide.horizontal {
  height: 1px;
}

.guide.vertical {
  width: 1px;
}

.device-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 16px;
  background: #fafafa;
  border-top: 1px solid #e8e8e8;
  font-size: 12px;
  color: #666;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .viewport-toolbar {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .zoom-controls,
  .device-controls,
  .view-controls {
    gap: 4px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .viewport-manager {
    background: #141414;
  }
  
  .viewport-toolbar {
    background: #1f1f1f;
    border-bottom-color: #434343;
  }
  
  .ruler {
    background: rgba(31, 31, 31, 0.9);
    border-color: #434343;
  }
  
  .ruler-mark {
    color: #a6a6a6;
  }
  
  .canvas-container {
    background: #1f1f1f;
  }
  
  .device-info {
    background: #141414;
    border-top-color: #434343;
    color: #a6a6a6;
  }
}
</style>