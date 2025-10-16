<template>
  <div class="designer-preview">
    <div class="preview-header">
      <div class="preview-title">
        <h3>预览</h3>
      </div>
      <div class="preview-actions">
        <button class="action-btn" @click="toggleFullscreen" :title="isFullscreen ? '退出全屏' : '全屏预览'">
          <Icon :name="isFullscreen ? 'fullscreen-exit' : 'fullscreen'" />
        </button>
        <button class="action-btn" @click="refresh" title="刷新预览">
          <Icon name="refresh" />
        </button>
        <button class="action-btn" @click="openInNewTab" title="在新标签页中打开">
          <Icon name="external-link" />
        </button>
      </div>
    </div>
    
    <div class="preview-toolbar">
      <div class="device-selector">
        <button 
          v-for="device in devices" 
          :key="device.name"
          class="device-btn"
          :class="{ active: currentDevice === device.name }"
          @click="selectDevice(device.name)"
          :title="device.label"
        >
          <Icon :name="device.icon" />
          <span>{{ device.label }}</span>
        </button>
      </div>
      
      <div class="preview-controls">
        <div class="scale-control">
          <label>缩放:</label>
          <select v-model="scale" @change="onScaleChange">
            <option value="0.5">50%</option>
            <option value="0.75">75%</option>
            <option value="1">100%</option>
            <option value="1.25">125%</option>
            <option value="1.5">150%</option>
          </select>
        </div>
      </div>
    </div>
    
    <div class="preview-content" :class="{ fullscreen: isFullscreen }">
      <div class="preview-frame" :style="frameStyle">
        <div class="frame-content" :style="contentStyle">
          <slot name="content" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { Icon } from '@/core/components'

// 设备预设
const devices = [
  { name: 'desktop', label: '桌面', icon: 'desktop', width: 1200, height: 800 },
  { name: 'tablet', label: '平板', icon: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', label: '手机', icon: 'mobile', width: 375, height: 667 },
  { name: 'custom', label: '自定义', icon: 'settings', width: 800, height: 600 }
]

// 响应式数据
const currentDevice = ref('desktop')
const scale = ref(1)
const isFullscreen = ref(false)

// 计算属性
const currentDeviceConfig = computed(() => {
  return devices.find(d => d.name === currentDevice.value) || devices[0]
})

const frameStyle = computed(() => {
  const device = currentDeviceConfig.value
  return {
    width: `${device.width}px`,
    height: `${device.height}px`,
    transform: `scale(${scale.value})`,
    transformOrigin: 'top left'
  }
})

const contentStyle = computed(() => ({
  width: '100%',
  height: '100%',
  overflow: 'auto'
}))

// 方法
const selectDevice = (deviceName: string) => {
  currentDevice.value = deviceName
}

const onScaleChange = () => {
  // 缩放变化时的处理
}

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value
  
  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

const refresh = () => {
  // 刷新预览内容
  window.location.reload()
}

const openInNewTab = () => {
  // 在新标签页中打开预览
  window.open(window.location.href, '_blank')
}

// 键盘快捷键
const handleKeydown = (event: KeyboardEvent) => {
  if (event.key === 'F11') {
    event.preventDefault()
    toggleFullscreen()
  } else if (event.key === 'F5') {
    event.preventDefault()
    refresh()
  }
}

// 全屏状态监听
const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

// 生命周期
onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

// 暴露方法
defineExpose({
  selectDevice,
  toggleFullscreen,
  refresh,
  currentDevice,
  scale,
  isFullscreen
})
</script>

<style scoped>
.designer-preview {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f9fafb;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
}

.preview-title h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.preview-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  padding: 6px;
  border: 1px solid #d1d5db;
  background: white;
  color: #374151;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.preview-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.device-selector {
  display: flex;
  gap: 4px;
}

.device-btn {
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

.device-btn:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.device-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.preview-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.scale-control {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6b7280;
}

.scale-control select {
  padding: 4px 8px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 12px;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.preview-content.fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: #f9fafb;
  padding: 0;
  align-items: center;
}

.preview-frame {
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: transform 0.2s ease;
}

.frame-content {
  background: white;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .device-btn span {
    display: none;
  }
  
  .device-btn {
    padding: 6px;
  }
  
  .preview-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
  
  .device-selector {
    justify-content: center;
  }
  
  .preview-controls {
    justify-content: center;
  }
}
</style>