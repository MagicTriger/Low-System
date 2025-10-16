<template>
  <div class="dashboard-container" :style="containerStyle">
    <div v-if="showTitle" class="dashboard-title">{{ title }}</div>
    <div class="dashboard-content">
      <slot>
        <div class="dashboard-placeholder">拖拽组件到此处</div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  control: {
    title?: string
    showTitle?: boolean
    backgroundColor?: string
    [key: string]: any
  }
}

const props = defineProps<Props>()

const title = computed(() => props.control.title || '大屏标题')
const showTitle = computed(() => props.control.showTitle !== false)

const containerStyle = computed(() => ({
  backgroundColor: props.control.backgroundColor || '#0c1e35',
}))
</script>

<style scoped>
.dashboard-container {
  min-height: 400px;
  padding: 24px;
  border-radius: 8px;
  color: white;
}

.dashboard-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 24px;
  text-align: center;
}

.dashboard-content {
  min-height: 300px;
}

.dashboard-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  border: 2px dashed rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 16px;
}
</style>
