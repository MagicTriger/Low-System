<template>
  <div class="designer-container">
    <div class="designer-header">
      <div class="designer-title">
        <h2>设计器</h2>
      </div>
      <div class="designer-actions">
        <slot name="actions" />
      </div>
    </div>
    
    <div class="designer-body">
      <div class="designer-sidebar" :class="{ collapsed: sidebarCollapsed }">
        <div class="sidebar-header">
          <h3>组件库</h3>
          <button class="collapse-btn" @click="toggleSidebar">
            <Icon :name="sidebarCollapsed ? 'expand' : 'collapse'" />
          </button>
        </div>
        <div class="sidebar-content">
          <slot name="sidebar" />
        </div>
      </div>
      
      <div class="designer-main">
        <div class="canvas-container">
          <slot name="canvas" />
        </div>
      </div>
      
      <div class="designer-properties" :class="{ collapsed: propertiesCollapsed }">
        <div class="properties-header">
          <h3>属性面板</h3>
          <button class="collapse-btn" @click="toggleProperties">
            <Icon :name="propertiesCollapsed ? 'expand' : 'collapse'" />
          </button>
        </div>
        <div class="properties-content">
          <slot name="properties" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Icon } from '@/core/components'

// 响应式数据
const sidebarCollapsed = ref(false)
const propertiesCollapsed = ref(false)

// 方法
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const toggleProperties = () => {
  propertiesCollapsed.value = !propertiesCollapsed.value
}

// 暴露方法给父组件
defineExpose({
  toggleSidebar,
  toggleProperties,
  sidebarCollapsed,
  propertiesCollapsed
})
</script>

<style scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

.designer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.designer-title h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.designer-actions {
  display: flex;
  gap: 8px;
}

.designer-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.designer-sidebar {
  width: 280px;
  background: white;
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.designer-sidebar.collapsed {
  width: 48px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.sidebar-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.collapse-btn {
  padding: 4px;
  border: none;
  background: transparent;
  color: #6b7280;
  cursor: pointer;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.collapse-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.sidebar-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.designer-sidebar.collapsed .sidebar-header h3,
.designer-sidebar.collapsed .sidebar-content {
  display: none;
}

.designer-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f9fafb;
}

.canvas-container {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.designer-properties {
  width: 320px;
  background: white;
  border-left: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
}

.designer-properties.collapsed {
  width: 48px;
}

.properties-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.properties-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.properties-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.designer-properties.collapsed .properties-header h3,
.designer-properties.collapsed .properties-content {
  display: none;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .designer-sidebar {
    width: 240px;
  }
  
  .designer-properties {
    width: 280px;
  }
}

@media (max-width: 768px) {
  .designer-body {
    flex-direction: column;
  }
  
  .designer-sidebar,
  .designer-properties {
    width: 100%;
    height: 200px;
  }
  
  .designer-sidebar.collapsed,
  .designer-properties.collapsed {
    height: 48px;
  }
}
</style>