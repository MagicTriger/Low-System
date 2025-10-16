<template>
  <div class="canvas-toolbar">
    <!-- 左侧：画布信息 -->
    <div class="toolbar-section toolbar-left">
      <div class="canvas-info">
        <span class="canvas-title">{{ title }}</span>
        <span class="canvas-dimensions">{{ canvasWidth }} × {{ canvasHeight }}px</span>
      </div>
    </div>

    <!-- 中间：操作按钮 -->
    <div class="toolbar-section toolbar-center">
      <div class="toolbar-actions">
        <button class="toolbar-btn" :disabled="!canUndo" @click="$emit('undo')" title="撤销 (Ctrl+Z)">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"></path>
          </svg>
        </button>

        <button class="toolbar-btn" :disabled="!canRedo" @click="$emit('redo')" title="重做 (Ctrl+Y)">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6-6m6 6l-6 6"></path>
          </svg>
        </button>

        <div class="toolbar-divider"></div>

        <button class="toolbar-btn" :class="{ active: showGrid }" @click="$emit('toggle-grid')" title="显示网格">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
          </svg>
        </button>

        <button class="toolbar-btn" :class="{ active: showGuides }" @click="$emit('toggle-guides')" title="显示辅助线">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            ></path>
          </svg>
        </button>

        <div class="toolbar-divider"></div>

        <button class="toolbar-btn" @click="$emit('data-source')" title="数据源配置">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"
            ></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- 右侧：缩放控制 -->
    <div class="toolbar-section toolbar-right">
      <div class="zoom-controls">
        <button class="toolbar-btn" @click="$emit('zoom-out')" :disabled="zoom <= minZoom" title="缩小 (Ctrl+-)">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7"
            ></path>
          </svg>
        </button>

        <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>

        <button class="toolbar-btn" @click="$emit('zoom-in')" :disabled="zoom >= maxZoom" title="放大 (Ctrl++)">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
            ></path>
          </svg>
        </button>

        <button class="toolbar-btn" @click="$emit('zoom-reset')" title="重置缩放 (Ctrl+0)">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            ></path>
          </svg>
        </button>

        <button class="toolbar-btn" @click="$emit('zoom-fit')" title="适应画布">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            ></path>
          </svg>
        </button>
      </div>

      <div class="toolbar-divider"></div>

      <button class="toolbar-btn" @click="$emit('settings')" title="画布设置">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  canvasWidth: number
  canvasHeight: number
  zoom: number
  minZoom?: number
  maxZoom?: number
  showGrid: boolean
  showGuides: boolean
  canUndo: boolean
  canRedo: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '画布',
  minZoom: 0.1,
  maxZoom: 5,
})

defineEmits<{
  'zoom-in': []
  'zoom-out': []
  'zoom-reset': []
  'zoom-fit': []
  'toggle-grid': []
  'toggle-guides': []
  undo: []
  redo: []
  settings: []
  'data-source': []
}>()
</script>

<style scoped>
.canvas-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.toolbar-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.canvas-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.canvas-title {
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.canvas-dimensions {
  font-size: 12px;
  color: #6b7280;
}

.toolbar-actions,
.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  color: #374151;
}

.toolbar-btn:hover:not(:disabled) {
  background: #f9fafb;
  border-color: #d1d5db;
  color: #1f2937;
}

.toolbar-btn:active:not(:disabled) {
  background: #f3f4f6;
}

.toolbar-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.toolbar-btn.active {
  background: #eff6ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.icon {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

.toolbar-divider {
  width: 1px;
  height: 20px;
  background: #e5e7eb;
  margin: 0 4px;
}

.zoom-level {
  min-width: 48px;
  text-align: center;
  font-size: 12px;
  font-weight: 500;
  color: #6b7280;
}

/* 响应式 */
@media (max-width: 768px) {
  .canvas-toolbar {
    padding: 0 8px;
  }

  .toolbar-section {
    gap: 8px;
  }

  .canvas-title {
    font-size: 13px;
  }

  .canvas-dimensions {
    display: none;
  }
}
</style>
