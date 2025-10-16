<template>
  <div class="custom-component" :style="componentStyle">
    <div class="custom-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
      </svg>
    </div>
    <div class="custom-content">
      {{ content || '自定义组件' }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  control: {
    content?: string
    backgroundColor?: string
    [key: string]: any
  }
}

const props = defineProps<Props>()

const content = computed(() => props.control.content || '自定义组件')

const componentStyle = computed(() => ({
  backgroundColor: props.control.backgroundColor || '#f5f5f5',
}))
</script>

<style scoped>
.custom-component {
  min-height: 100px;
  padding: 20px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.custom-icon {
  width: 48px;
  height: 48px;
  color: #1890ff;
}

.custom-icon svg {
  width: 100%;
  height: 100%;
}

.custom-content {
  font-size: 14px;
  color: #666;
  text-align: center;
}
</style>
