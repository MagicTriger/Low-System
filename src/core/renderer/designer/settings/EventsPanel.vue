<template>
  <div class="events-panel">
    <div v-if="!control" class="panel-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
      <p class="empty-text">请选择一个组件</p>
    </div>

    <div v-else class="panel-content">
      <div class="panel-placeholder">
        <p>事件配置系统正在重构中...</p>
        <p class="placeholder-hint">新的事件配置系统将提供更好的用户体验</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Control } from '@/core/types'

interface Props {
  control: Control | null
}

defineProps<Props>()

defineEmits<{
  update: [event: string, executions: any[]]
}>()
</script>

<style scoped>
.events-panel {
  height: 100%;
  overflow-y: auto;
  background: #ffffff;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
  color: #9ca3af;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  stroke-width: 1.5;
}

.empty-text {
  font-size: 14px;
  margin: 0;
}

.panel-content {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.panel-placeholder {
  text-align: center;
  color: #666666;
  padding: 40px 20px;
}

.panel-placeholder p {
  margin: 8px 0;
}

.placeholder-hint {
  font-size: 12px;
  color: #999999;
}

.events-panel::-webkit-scrollbar {
  width: 8px;
}

.events-panel::-webkit-scrollbar-track {
  background: #f9fafb;
}

.events-panel::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.events-panel::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
