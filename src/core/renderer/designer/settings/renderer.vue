<template>
  <div class="settings-renderer">
    <div class="settings-header">
      <h3>属性设置</h3>
      <button class="close-btn" @click="$emit('close')" title="关闭">×</button>
    </div>

    <div class="settings-content" v-if="selectedControl">
      <div class="control-info">
        <div class="control-type">
          <span>{{ selectedControl.kind }}</span>
        </div>
        <div class="control-id">ID: {{ selectedControl.id }}</div>
      </div>

      <div class="settings-panel">
        <div class="panel-placeholder">
          <p>属性配置系统正在重构中...</p>
          <p class="placeholder-hint">新的属性配置系统将提供更好的用户体验</p>
        </div>
      </div>
    </div>

    <div v-else class="no-selection">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        ></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
      <p>请选择一个控件来编辑属性</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  selectedControl?: any
}

const props = defineProps<Props>()

defineEmits(['close', 'property-change', 'style-change', 'validation-change'])

const selectedControl = computed(() => props.selectedControl)
</script>

<style scoped>
.settings-renderer {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: white;
  border-left: 1px solid #e5e7eb;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #f9fafb;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.close-btn {
  padding: 4px 8px;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
  font-size: 20px;
  line-height: 1;
}

.close-btn:hover {
  background: #e5e7eb;
  color: #374151;
}

.settings-content {
  flex: 1;
  overflow: auto;
}

.control-info {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.control-type {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.control-id {
  font-size: 12px;
  color: #6b7280;
}

.settings-panel {
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.panel-placeholder {
  text-align: center;
  color: #666666;
}

.panel-placeholder p {
  margin: 8px 0;
}

.placeholder-hint {
  font-size: 12px;
  color: #999999;
}

.no-selection {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
  text-align: center;
  padding: 32px;
}

.empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 16px;
  stroke-width: 1.5;
}

.no-selection p {
  margin: 0;
  font-size: 14px;
}
</style>
