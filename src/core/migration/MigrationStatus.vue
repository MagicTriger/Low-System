<template>
  <div v-if="showStatus" class="migration-status">
    <div class="migration-status-header">
      <h3>🔄 Migration System Status</h3>
      <button @click="toggleExpanded">{{ expanded ? '▼' : '▶' }}</button>
      <button @click="close">✕</button>
    </div>

    <div v-if="expanded" class="migration-status-body">
      <!-- 兼容层状态 -->
      <div class="status-section">
        <h4>📦 Compatibility Layer</h4>
        <div class="status-item">
          <span>Status:</span>
          <span :class="status.compatLayer.enabled ? 'enabled' : 'disabled'">
            {{ status.compatLayer.enabled ? '✅ Enabled' : '❌ Disabled' }}
          </span>
        </div>
      </div>

      <!-- 特性开关状态 -->
      <div class="status-section">
        <h4>🎛️ Feature Flags</h4>
        <div class="status-item">
          <span>Total Flags:</span>
          <span>{{ status.featureFlags.flags.length }}</span>
        </div>
        <div class="feature-list">
          <div v-for="flag in status.featureFlags.flags" :key="flag.name" class="feature-item">
            <span :class="flag.enabled ? 'enabled' : 'disabled'">
              {{ flag.enabled ? '✅' : '❌' }}
            </span>
            <span class="feature-name">{{ flag.name }}</span>
            <span class="feature-desc">{{ flag.description }}</span>
          </div>
        </div>
      </div>

      <!-- 版本管理状态 -->
      <div class="status-section">
        <h4>📋 Version Manager</h4>
        <div class="status-item">
          <span>Current Version:</span>
          <span>{{ status.versionManager.currentVersion }}</span>
        </div>
        <div class="status-item">
          <span>Migration History:</span>
          <span>{{ status.versionManager.history.length }} records</span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="status-actions">
        <button @click="refresh">🔄 Refresh</button>
        <button @click="exportStatus">📥 Export</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getGlobalMigrationSystem } from './index'

const showStatus = ref(import.meta.env.DEV) // 仅在开发环境显示
const expanded = ref(false)
const status = ref({
  compatLayer: { enabled: false, instance: null },
  featureFlags: { enabled: false, flags: [] },
  versionManager: { enabled: false, currentVersion: '', history: [] },
})

function toggleExpanded() {
  expanded.value = !expanded.value
}

function close() {
  showStatus.value = false
}

function refresh() {
  loadStatus()
}

function exportStatus() {
  const data = JSON.stringify(status.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `migration-status-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

function loadStatus() {
  try {
    const migrationSystem = getGlobalMigrationSystem()
    status.value = migrationSystem.getStatus() as any
  } catch (error) {
    console.error('Failed to load migration status:', error)
  }
}

onMounted(() => {
  loadStatus()
})
</script>

<style scoped>
.migration-status {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border: 2px solid #1890ff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  max-width: 400px;
  max-height: 600px;
  overflow: auto;
  z-index: 9999;
  font-size: 12px;
}

.migration-status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: #1890ff;
  color: white;
  border-radius: 6px 6px 0 0;
}

.migration-status-header h3 {
  margin: 0;
  font-size: 14px;
  flex: 1;
}

.migration-status-header button {
  background: transparent;
  border: none;
  color: white;
  cursor: pointer;
  padding: 4px 8px;
  margin-left: 8px;
  font-size: 14px;
}

.migration-status-header button:hover {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.migration-status-body {
  padding: 12px;
}

.status-section {
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.status-section:last-child {
  border-bottom: none;
}

.status-section h4 {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: #1890ff;
}

.status-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
  font-size: 12px;
}

.status-item span:first-child {
  color: #666;
}

.enabled {
  color: #52c41a;
  font-weight: bold;
}

.disabled {
  color: #ff4d4f;
}

.feature-list {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.feature-item {
  display: flex;
  align-items: center;
  padding: 4px 0;
  font-size: 11px;
}

.feature-item span {
  margin-right: 8px;
}

.feature-name {
  font-weight: bold;
  color: #333;
  min-width: 120px;
}

.feature-desc {
  color: #999;
  font-size: 10px;
}

.status-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.status-actions button {
  flex: 1;
  padding: 8px;
  background: #1890ff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.status-actions button:hover {
  background: #40a9ff;
}
</style>
