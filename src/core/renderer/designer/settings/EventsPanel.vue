<template>
  <div class="events-panel">
    <EventConfigPanel :control="control" :resource-code="resourceCode" @update="handleUpdate" />
  </div>
</template>

<script setup lang="ts">
import type { Control } from '@/core/types'
import EventConfigPanel from './EventConfigPanel.vue'

interface Props {
  control: Control | null
  resourceCode?: string
}

defineProps<Props>()

const emit = defineEmits<{
  update: [event: string, executions: any[]]
}>()

function handleUpdate(eventName: string, actions: any[]) {
  emit('update', eventName, actions)
}
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
