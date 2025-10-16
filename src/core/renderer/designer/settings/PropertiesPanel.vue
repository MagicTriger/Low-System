<template>
  <div class="properties-panel">
    <div v-if="!selectedComponent" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
        ></path>
      </svg>
      <p class="empty-text">请选择一个组件</p>
      <p class="empty-hint">选择画布中的组件来编辑其属性</p>
    </div>

    <div v-else class="panel-content">
      <div class="component-info">
        <div class="component-title">
          <span class="component-name">{{ selectedComponent.kindName || selectedComponent.kind }}</span>
        </div>
        <div class="component-id">ID: {{ selectedComponent.id }}</div>
      </div>

      <!-- 标签页导航 -->
      <div class="panel-tabs">
        <div
          v-for="tab in panelTabs"
          :key="tab.key"
          :class="['panel-tab', { active: activeTab === tab.key }]"
          :title="tab.title"
          @click="activeTab = tab.key"
        >
          <component :is="tab.icon" class="tab-icon" />
        </div>
      </div>

      <!-- 标签页内容 -->
      <div class="panels-container">
        <PanelGroup
          v-for="panel in activePanels"
          :key="panel.group"
          :config="panel"
          :values="componentProps"
          @update="handlePropertyUpdate"
          @validate="handlePropertyValidate"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, h } from 'vue'
import { usePropertyPanelService } from '@core/services/helpers'
import { useModule } from '@core/state/helpers'
import PanelGroup from './PanelGroup.vue'
import type { Control } from '@/core/renderer/base'
import { SettingOutlined, LayoutOutlined, BgColorsOutlined, ThunderboltOutlined } from '@ant-design/icons-vue'

interface Props {
  control: Control | null
  dataSources?: any[]
  dataOperations?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => [],
  dataOperations: () => [],
})

const emit = defineEmits<{
  update: [property: string, value: any]
}>()

// 获取服务和状态管理模块
let service: any = null
let designerModule: any = null

try {
  service = usePropertyPanelService()
} catch (error) {
  console.warn('[PropertiesPanel] PropertyPanelService not available:', error)
}

try {
  designerModule = useModule('designer')
} catch (error) {
  console.warn('[PropertiesPanel] Designer module not available:', error)
}

// 获取选中组件 - 优先使用props,备用状态管理器
const selectedComponent = computed(() => {
  // ✅ 优先使用props (DesignerNew传递的selectedControl)
  if (props.control) {
    console.log('[PropertiesPanel] ✅ Selected control from props:', props.control)
    return props.control
  }

  // 备用: 从状态模块获取
  if (designerModule) {
    try {
      const control = designerModule.state.selectedControl
      if (control) {
        console.log('[PropertiesPanel] ✅ Selected control from state:', control)
        return control
      }
    } catch (error) {
      console.debug('[PropertiesPanel] Failed to get selected component from state:', error)
    }
  }

  console.log('[PropertiesPanel] ❌ No control selected')
  return null
})

// 获取组件属性 - 合并props、layout、styles等所有属性
const componentProps = computed(() => {
  if (!selectedComponent.value) return {}

  // 合并所有属性到一个对象,方便字段访问
  return {
    // 基础属性
    id: selectedComponent.value.id,
    name: selectedComponent.value.name,
    kind: selectedComponent.value.kind,

    // 组件特定属性 (props)
    ...(selectedComponent.value.props || {}),

    // 布局属性 (layout)
    ...(selectedComponent.value.layout || {}),

    // 样式属性 (styles)
    ...(selectedComponent.value.styles || {}),

    // 其他属性 - 优先从 props 中获取，如果 props 中没有则从根级别获取
    visible: selectedComponent.value.props?.visible ?? selectedComponent.value.visible,
    disabled: selectedComponent.value.props?.disabled ?? selectedComponent.value.disabled,
  }
})

// 获取面板配置
const panels = computed(() => {
  if (!selectedComponent.value || !service) {
    console.log('[PropertiesPanel] No component or service:', {
      hasComponent: !!selectedComponent.value,
      hasService: !!service,
    })
    return []
  }

  try {
    const panelConfigs = service.getPanelsForComponent(selectedComponent.value.kind)
    console.log('[PropertiesPanel] Got panels for', selectedComponent.value.kind, ':', panelConfigs)
    return panelConfigs
  } catch (error) {
    console.error('[PropertiesPanel] Failed to get panels:', error)
    return []
  }
})

// 验证错误
const validationErrors = ref<Record<string, string[]>>({})

// 当前激活的标签页
const activeTab = ref<string>('basic')

// 标签页配置 (合并布局和样式)
const panelTabs = [
  { key: 'basic', title: '基础属性', icon: SettingOutlined },
  { key: 'layout', title: '布局样式', icon: LayoutOutlined },
  { key: 'event', title: '事件属性', icon: ThunderboltOutlined },
]

// 根据当前标签页过滤面板
const activePanels = computed(() => {
  if (!panels.value || panels.value.length === 0) return []

  // 根据标签页分组面板 (布局和样式合并到layout标签)
  const tabGroupMap: Record<string, string[]> = {
    basic: ['component', 'basic'],
    layout: ['layout', 'position', 'size', 'spacing', 'flex', 'style', 'font', 'border', 'radius', 'background', 'shadow'],
    event: ['event', 'events'],
  }

  const groups = tabGroupMap[activeTab.value] || []
  return panels.value.filter(panel => groups.includes(panel.group))
})

// 更新属性
function handlePropertyUpdate(key: string, value: any) {
  if (!selectedComponent.value) return

  try {
    console.log('[PropertiesPanel] Updating property:', key, '=', value)

    // 触发emit事件传递给DesignerNew.vue
    // DesignerNew会处理实际的组件更新
    emit('update', key, value)

    // 触发EventBus事件(用于其他监听器)
    if (service && (service as any).eventBus) {
      ;(service as any).eventBus.emit('control.property.updated', {
        componentId: selectedComponent.value.id,
        componentKind: selectedComponent.value.kind,
        property: key,
        value,
        timestamp: Date.now(),
      })
    }

    // 清除该字段的验证错误
    if (validationErrors.value[key]) {
      delete validationErrors.value[key]
    }
  } catch (error) {
    console.error('[PropertiesPanel] Failed to update property:', error)
  }
}

// 处理属性验证
function handlePropertyValidate(key: string, errors: string[]) {
  if (errors.length > 0) {
    validationErrors.value[key] = errors
  } else {
    delete validationErrors.value[key]
  }
}

// 监听选中组件变化,清除验证错误
watch(selectedComponent, () => {
  validationErrors.value = {}
})
</script>

<style scoped>
.properties-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  width: 48px;
  height: 48px;
  color: #d9d9d9;
  margin-bottom: 16px;
}

.empty-text {
  font-size: 16px;
  color: #8c8c8c;
  margin: 0 0 8px 0;
  font-weight: 500;
}

.empty-hint {
  font-size: 14px;
  color: #bfbfbf;
  margin: 0;
}

.panel-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.component-info {
  padding: 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.component-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.component-name {
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.component-id {
  font-size: 12px;
  color: #8c8c8c;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.panel-tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.panel-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fafafa;
  border: 1px solid #e8e8e8;
}

.panel-tab:hover {
  background: #f0f0f0;
  border-color: #d9d9d9;
}

.panel-tab.active {
  background: #1890ff;
  border-color: #1890ff;
  color: #fff;
}

.tab-icon {
  font-size: 18px;
}

.panel-tab.active .tab-icon {
  color: #fff;
}

.panels-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

/* 滚动条样式 */
.panels-container::-webkit-scrollbar {
  width: 6px;
}

.panels-container::-webkit-scrollbar-track {
  background: #f0f0f0;
}

.panels-container::-webkit-scrollbar-thumb {
  background: #d9d9d9;
  border-radius: 3px;
}

.panels-container::-webkit-scrollbar-thumb:hover {
  background: #bfbfbf;
}

/* 响应式 */
@media (max-width: 768px) {
  .component-info {
    padding: 12px;
  }

  .panels-container {
    padding: 12px;
  }

  .empty-state {
    padding: 20px;
  }

  .empty-icon {
    width: 36px;
    height: 36px;
  }
}
</style>
