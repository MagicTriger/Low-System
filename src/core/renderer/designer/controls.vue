<template>
  <div class="controls-panel">
    <!-- 搜索栏 -->
    <div class="search-section" v-if="inSearch">
      <a-input
        ref="searchInput"
        v-model:value="searchKeyword"
        placeholder="搜索组件"
        size="small"
        allow-clear
        @blur="handleSearchBlur"
        @clear="handleSearchClear"
      >
        <template #prefix>
          <search-outlined />
        </template>
      </a-input>
    </div>

    <!-- 标题栏 -->
    <div v-else class="header-section">
      <div class="title">
        <block-outlined />
        <span>组件库</span>
      </div>
      <div class="actions">
        <a-tooltip title="搜索组件">
          <a-button size="small" type="text" @click="startSearch">
            <search-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="刷新">
          <a-button size="small" type="text" @click="refreshControls">
            <reload-outlined />
          </a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- 组件分类 -->
    <div class="controls-content">
      <template v-if="searchKeyword">
        <!-- 搜索结果 -->
        <div class="search-results">
          <div class="section-title">搜索结果 ({{ searchResults.length }})</div>
          <div class="controls-grid">
            <div
              v-for="control in searchResults"
              :key="control.kind"
              class="control-item"
              :draggable="true"
              @dragstart="handleDragStart($event, control)"
              @click="handleControlClick(control)"
            >
              <div class="control-icon">
                <component :is="getControlIcon(control.icon)" />
              </div>
              <div class="control-name">{{ control.kindName }}</div>
            </div>
          </div>
        </div>
      </template>

      <template v-else>
        <!-- 分类展示 -->
        <a-collapse v-model:active-key="activeKeys" ghost size="small">
          <a-collapse-panel v-for="typeInfo in controlTypes" :key="typeInfo.type" :header="typeInfo.name">
            <template #extra>
              <component :is="getControlIcon(typeInfo.icon)" />
            </template>

            <div class="controls-grid">
              <div
                v-for="control in getControlsByType(typeInfo.type)"
                :key="control.kind"
                class="control-item"
                :draggable="true"
                @dragstart="handleDragStart($event, control)"
                @click="handleControlClick(control)"
              >
                <div class="control-icon">
                  <component :is="getControlIcon(control.icon)" />
                </div>
                <div class="control-name">{{ control.kindName }}</div>
              </div>
            </div>
          </a-collapse-panel>
        </a-collapse>
      </template>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <a-divider />
      <div class="stats-info">
        <span>共 {{ totalControls }} 个组件</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  BlockOutlined,
  SearchOutlined,
  ReloadOutlined,
  AppstoreOutlined,
  FormOutlined,
  LayoutOutlined,
  TableOutlined,
  BarChartOutlined,
  DashboardOutlined,
  PictureOutlined,
  MobileOutlined,
  SettingOutlined,
} from '@ant-design/icons-vue'
import { ControlTypeInfos, getAllControlDefinitions, searchControlDefinitions, getControlDefinitionsByType } from '../definitions'
import type { BaseControlDefinition as ControlDefinition } from '../base'

// 状态管理
const inSearch = ref(false)
const searchKeyword = ref('')
const activeKeys = ref(['common', 'input'])
const searchInput = ref()

// 计算属性
const controlTypes = computed(() => ControlTypeInfos)

const allControls = computed(() => {
  return getAllControlDefinitions().filter(def => !def.hidden)
})

const totalControls = computed(() => allControls.value.length)

const searchResults = computed(() => {
  if (!searchKeyword.value) return []
  return searchControlDefinitions(searchKeyword.value)
})

// 方法
const getControlsByType = (type: string) => {
  return getControlDefinitionsByType(type as any)
}

const getControlIcon = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    component: AppstoreOutlined,
    input: FormOutlined,
    container: LayoutOutlined,
    table: TableOutlined,
    chart: BarChartOutlined,
    dashboard: DashboardOutlined,
    svg: PictureOutlined,
    mobile: MobileOutlined,
    custom: SettingOutlined,
    button: AppstoreOutlined,
    text: FormOutlined,
    flex: LayoutOutlined,
  }

  return iconMap[iconName || 'component'] || AppstoreOutlined
}

const startSearch = async () => {
  inSearch.value = true
  await nextTick()
  searchInput.value?.focus()
}

const handleSearchBlur = () => {
  if (!searchKeyword.value) {
    inSearch.value = false
  }
}

const handleSearchClear = () => {
  searchKeyword.value = ''
  inSearch.value = false
}

const refreshControls = () => {
  // 刷新组件库
  console.log('刷新组件库')
}

const handleDragStart = (event: DragEvent, control: ControlDefinition) => {
  // 设置拖拽数据，格式需要匹配 DragData 接口
  const dragData = {
    type: 'control-library',
    controlKind: control.kind,
  }

  event.dataTransfer?.setData('text/plain', JSON.stringify(dragData))
  event.dataTransfer?.setData('application/json', JSON.stringify(dragData))

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }

  console.log('开始拖拽组件:', control.kind)
}

const handleControlClick = (control: ControlDefinition) => {
  // 触发控件选择事件
  emit('control-select', control)
}

// 事件定义
const emit = defineEmits<{
  'control-select': [control: ControlDefinition]
}>()
</script>

<style scoped>
.controls-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(248, 249, 250, 0.95);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
}

.search-section,
.header-section {
  padding: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
}

.header-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #1f2937;
}

.actions {
  display: flex;
  gap: 4px;
}

.controls-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
  background: rgba(248, 249, 250, 0.95);
}

.search-results {
  margin-bottom: 16px;
}

.section-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
  padding-left: 4px;
}

.controls-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.control-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 6px;
  cursor: grab;
  transition: all 0.2s ease;
  background: rgba(255, 255, 255, 0.7);
}

.control-item:hover {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.08);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.control-item:active {
  cursor: grabbing;
  transform: translateY(0);
}

.control-icon {
  font-size: 20px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
}

.control-item:hover .control-icon {
  color: #3b82f6;
}

.control-name {
  font-size: 12px;
  color: #374151;
  text-align: center;
  line-height: 1.2;
}

.control-item:hover .control-name {
  color: #3b82f6;
}

.stats-section {
  padding: 8px 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: rgba(255, 255, 255, 0.5);
}

.stats-info {
  font-size: 12px;
  color: #6b7280;
  text-align: center;
}

/* 折叠面板样式调整 */
:deep(.ant-collapse) {
  background: transparent;
  border: none;
}

:deep(.ant-collapse-item) {
  border: none;
  margin-bottom: 8px;
}

:deep(.ant-collapse-header) {
  padding: 8px 12px !important;
  background: rgba(255, 255, 255, 0.6) !important;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  color: #374151 !important;
}

:deep(.ant-collapse-content) {
  background: transparent;
  border: none;
}

:deep(.ant-collapse-content-box) {
  padding: 8px 0 !important;
}

/* 输入框浅色主题 */
:deep(.ant-input) {
  background: rgba(255, 255, 255, 0.8) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  color: #1f2937 !important;
}

:deep(.ant-input::placeholder) {
  color: #9ca3af !important;
}

:deep(.ant-input-prefix) {
  color: #6b7280 !important;
}

/* 按钮浅色主题 */
:deep(.ant-btn-text) {
  color: #374151 !important;
}

:deep(.ant-btn-text:hover) {
  color: #3b82f6 !important;
  background: rgba(59, 130, 246, 0.08) !important;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .controls-grid {
    grid-template-columns: 1fr;
  }

  .control-item {
    flex-direction: row;
    justify-content: flex-start;
    padding: 8px 12px;
  }

  .control-icon {
    font-size: 16px;
  }

  .control-name {
    text-align: left;
  }
}
</style>
