<template>
  <div class="data-panel" :style="panelStyle">
    <div class="panel-header">
      <span class="panel-title">{{ title }}</span>
    </div>
    <div class="panel-content">
      <div class="panel-value">{{ value }}</div>
      <div class="panel-label">{{ label }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  control: {
    title?: string
    value?: string | number
    label?: string
    backgroundColor?: string
    [key: string]: any
  }
}

const props = defineProps<Props>()

const title = computed(() => props.control.title || '数据面板')
const value = computed(() => props.control.value || '1,234')
const label = computed(() => props.control.label || '总数')

const panelStyle = computed(() => ({
  backgroundColor: props.control.backgroundColor || '#1890ff',
}))
</script>

<style scoped>
.data-panel {
  padding: 20px;
  border-radius: 8px;
  color: white;
  min-height: 120px;
}

.panel-header {
  margin-bottom: 16px;
}

.panel-title {
  font-size: 14px;
  opacity: 0.9;
}

.panel-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.panel-value {
  font-size: 32px;
  font-weight: bold;
}

.panel-label {
  font-size: 14px;
  opacity: 0.8;
}
</style>
