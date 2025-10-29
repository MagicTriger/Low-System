<template>
  <div class="event-config-panel">
    <div v-if="!control" class="panel-empty">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
      </svg>
      <p class="empty-text">请选择一个组件</p>
    </div>

    <div v-else class="panel-content">
      <!-- 视图切换 -->
      <div class="view-switcher">
        <a-segmented v-model:value="currentView" :options="viewOptions" />
        <a-button v-if="currentView === 'list'" type="link" size="small" @click="handleAddEvent">
          <template #icon><PlusOutlined /></template>
          添加事件
        </a-button>
      </div>

      <!-- 列表视图 -->
      <div v-if="currentView === 'list'" class="event-list">
        <a-empty v-if="eventConfigs.length === 0" description="暂无事件配置" style="margin: 20px 0" />

        <div v-for="(eventConfig, index) in eventConfigs" :key="eventConfig.id" class="event-item">
          <div class="event-item-header" @click="toggleEventExpand(eventConfig.id)">
            <div class="event-item-title">
              <RightOutlined :class="['expand-icon', { expanded: expandedEvents.has(eventConfig.id) }]" />
              <span class="event-name">{{ eventConfig.eventName }}</span>
              <a-tag :color="eventConfig.enabled ? 'green' : 'default'" size="small">
                {{ eventConfig.enabled ? '启用' : '禁用' }}
              </a-tag>
            </div>
            <a-space>
              <a-switch v-model:checked="eventConfig.enabled" size="small" @click.stop @change="handleEventEnabledChange(eventConfig)" />
              <a-button type="text" size="small" danger @click.stop="handleDeleteEvent(index)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-space>
          </div>

          <div v-if="expandedEvents.has(eventConfig.id)" class="event-item-content">
            <!-- 动作列表 -->
            <div class="actions-list">
              <div v-for="(action, actionIndex) in eventConfig.actions" :key="action.id" class="action-item">
                <div class="action-header">
                  <div class="action-title">
                    <component :is="getActionIcon(action.type)" class="action-icon" />
                    <span>{{ getActionLabel(action.type) }}</span>
                  </div>
                  <a-space>
                    <a-button type="text" size="small" @click="handleEditAction(eventConfig, actionIndex)">
                      <template #icon><EditOutlined /></template>
                    </a-button>
                    <a-button type="text" size="small" danger @click="handleDeleteAction(eventConfig, actionIndex)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </a-space>
                </div>
                <div class="action-summary">{{ getActionSummary(action) }}</div>
              </div>

              <a-button type="dashed" block @click="handleAddAction(eventConfig)">
                <template #icon><PlusOutlined /></template>
                添加动作
              </a-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 流程图视图 -->
      <div v-else-if="currentView === 'flow'" class="flow-view">
        <a-empty v-if="eventConfigs.length === 0" description="暂无事件配置" style="margin: 20px 0" />

        <a-tabs v-else v-model:activeKey="activeEventTab" type="card">
          <a-tab-pane v-for="eventConfig in eventConfigs" :key="eventConfig.id" :tab="eventConfig.eventName">
            <EventFlowVisualization :event-config="eventConfig" @node-click="handleFlowNodeClick" />
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 原有的事件列表头部 -->
      <div v-if="false" class="event-list">
        <div class="event-list-header">
          <span class="header-title">事件配置</span>
          <a-button type="link" size="small" @click="handleAddEvent">
            <template #icon><PlusOutlined /></template>
            添加事件
          </a-button>
        </div>

        <a-empty v-if="eventConfigs.length === 0" description="暂无事件配置" style="margin: 20px 0" />

        <div v-for="(eventConfig, index) in eventConfigs" :key="eventConfig.id" class="event-item">
          <div class="event-item-header" @click="toggleEventExpand(eventConfig.id)">
            <div class="event-item-title">
              <RightOutlined :class="['expand-icon', { expanded: expandedEvents.has(eventConfig.id) }]" />
              <span class="event-name">{{ eventConfig.eventName }}</span>
              <a-tag :color="eventConfig.enabled ? 'green' : 'default'" size="small">
                {{ eventConfig.enabled ? '启用' : '禁用' }}
              </a-tag>
            </div>
            <a-space>
              <a-switch v-model:checked="eventConfig.enabled" size="small" @click.stop @change="handleEventEnabledChange(eventConfig)" />
              <a-button type="text" size="small" danger @click.stop="handleDeleteEvent(index)">
                <template #icon><DeleteOutlined /></template>
              </a-button>
            </a-space>
          </div>

          <div v-if="expandedEvents.has(eventConfig.id)" class="event-item-content">
            <!-- 动作列表 -->
            <div class="actions-list">
              <div v-for="(action, actionIndex) in eventConfig.actions" :key="action.id" class="action-item">
                <div class="action-header">
                  <div class="action-title">
                    <component :is="getActionIcon(action.type)" class="action-icon" />
                    <span>{{ getActionLabel(action.type) }}</span>
                  </div>
                  <a-space>
                    <a-button type="text" size="small" @click="handleEditAction(eventConfig, actionIndex)">
                      <template #icon><EditOutlined /></template>
                    </a-button>
                    <a-button type="text" size="small" danger @click="handleDeleteAction(eventConfig, actionIndex)">
                      <template #icon><DeleteOutlined /></template>
                    </a-button>
                  </a-space>
                </div>
                <div class="action-summary">{{ getActionSummary(action) }}</div>
              </div>

              <a-button type="dashed" block @click="handleAddAction(eventConfig)">
                <template #icon><PlusOutlined /></template>
                添加动作
              </a-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加事件对话框 -->
    <a-modal v-model:open="addEventModalVisible" title="添加事件" @ok="handleAddEventConfirm" @cancel="handleAddEventCancel">
      <a-form :model="newEventForm" layout="vertical">
        <a-form-item label="事件名称" required>
          <a-select v-model:value="newEventForm.eventName" placeholder="请选择事件">
            <a-select-option value="onClick">点击 (onClick)</a-select-option>
            <a-select-option value="onChange">值改变 (onChange)</a-select-option>
            <a-select-option value="onFocus">获得焦点 (onFocus)</a-select-option>
            <a-select-option value="onBlur">失去焦点 (onBlur)</a-select-option>
            <a-select-option value="onSubmit">提交 (onSubmit)</a-select-option>
            <a-select-option value="onLoad">加载完成 (onLoad)</a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 动作类型选择器 -->
    <a-modal v-model:open="actionTypeSelectorVisible" title="选择动作类型" :footer="null" width="600px">
      <div class="action-type-list">
        <div
          v-for="actionType in actionTypes"
          :key="actionType.type"
          class="action-type-item"
          @click="handleSelectActionType(actionType.type)"
        >
          <component :is="actionType.icon" class="action-type-icon" />
          <div class="action-type-info">
            <div class="action-type-title">{{ actionType.label }}</div>
            <div class="action-type-description">{{ actionType.description }}</div>
          </div>
          <RightOutlined class="action-type-arrow" />
        </div>
      </div>
    </a-modal>

    <!-- 动作配置抽屉 -->
    <a-drawer
      v-model:open="actionConfigDrawerVisible"
      :title="editingActionIndex !== undefined ? '编辑动作' : '添加动作'"
      width="600"
      :destroyOnClose="true"
    >
      <component :is="currentActionConfigComponent" v-if="currentActionType" v-model="actionConfigForm" :resource-code="resourceCode" />

      <template #footer>
        <a-space>
          <a-button @click="actionConfigDrawerVisible = false">取消</a-button>
          <a-button type="primary" @click="handleSaveAction" :loading="savingAction">保存</a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, shallowRef } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  RightOutlined,
  ThunderboltOutlined,
  ApiOutlined,
  LayoutOutlined,
  LinkOutlined,
  CodeOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import type { Control } from '@/core/types'
import type { EventConfig, EventAction, EventActionType } from '@/core/api/event-config'
import { EventActionType as ActionType } from '@/core/api/event-config'

// 导入动作配置组件
import OpenOverlayActionConfig from './action-configs/OpenOverlayActionConfig.vue'
import CloseOverlayActionConfig from './action-configs/CloseOverlayActionConfig.vue'
import DataSourceActionConfig from './action-configs/DataSourceActionConfig.vue'
import NavigateActionConfig from './action-configs/NavigateActionConfig.vue'
import CustomActionConfig from './action-configs/CustomActionConfig.vue'

// 导入流程图可视化组件
import EventFlowVisualization from './EventFlowVisualization.vue'

interface Props {
  control: Control | null
  resourceCode?: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  update: [eventName: string, actions: EventAction[]]
}>()

// 状态
const eventConfigs = ref<EventConfig[]>([])
const expandedEvents = ref<Set<string>>(new Set())
const addEventModalVisible = ref(false)
const actionTypeSelectorVisible = ref(false)
const actionConfigDrawerVisible = ref(false)
const savingAction = ref(false)

// 视图切换
const currentView = ref<'list' | 'flow'>('list')
const activeEventTab = ref<string>('')

const viewOptions = [
  { label: '列表视图', value: 'list', icon: 'UnorderedListOutlined' },
  { label: '流程图', value: 'flow', icon: 'PartitionOutlined' },
]

// 表单数据
const newEventForm = ref({
  eventName: '',
})

const currentEventConfig = ref<EventConfig | null>(null)
const editingActionIndex = ref<number>()
const currentActionType = ref<EventActionType>()
const actionConfigForm = ref<any>({})

// 动作类型定义
const actionTypes = [
  {
    type: ActionType.OPEN_OVERLAY,
    label: '打开浮层',
    description: '打开指定的浮层并传递参数',
    icon: LayoutOutlined,
  },
  {
    type: ActionType.CLOSE_OVERLAY,
    label: '关闭浮层',
    description: '关闭当前或指定的浮层',
    icon: CloseOutlined,
  },
  {
    type: ActionType.DATA_SOURCE,
    label: '数据源操作',
    description: '执行数据源的增删改查操作',
    icon: ApiOutlined,
  },
  {
    type: ActionType.NAVIGATE,
    label: '页面导航',
    description: '跳转到指定页面',
    icon: LinkOutlined,
  },
  {
    type: ActionType.CUSTOM,
    label: '自定义脚本',
    description: '执行自定义 JavaScript 代码',
    icon: CodeOutlined,
  },
]

// 动作配置组件映射
const actionConfigComponents = {
  [ActionType.OPEN_OVERLAY]: OpenOverlayActionConfig,
  [ActionType.CLOSE_OVERLAY]: CloseOverlayActionConfig,
  [ActionType.DATA_SOURCE]: DataSourceActionConfig,
  [ActionType.NAVIGATE]: NavigateActionConfig,
  [ActionType.CUSTOM]: CustomActionConfig,
}

const currentActionConfigComponent = computed(() => {
  if (!currentActionType.value) return null
  return actionConfigComponents[currentActionType.value]
})

// 监听控件变化，加载事件配置
watch(
  () => props.control,
  newControl => {
    if (newControl) {
      loadEventConfigs(newControl)
    } else {
      eventConfigs.value = []
    }
  },
  { immediate: true }
)

// 监听事件配置变化，自动设置活动标签
watch(
  () => eventConfigs.value,
  newConfigs => {
    if (newConfigs.length > 0 && !activeEventTab.value) {
      activeEventTab.value = newConfigs[0].id
    }
  },
  { immediate: true }
)

// 加载事件配置
function loadEventConfigs(control: Control) {
  // 从控件的 eventExecution 属性加载事件配置
  const configs: EventConfig[] = []

  if (control.eventExecution) {
    Object.entries(control.eventExecution).forEach(([eventName, actions]) => {
      configs.push({
        id: `${control.id}_${eventName}`,
        controlId: control.id,
        eventName,
        actions: actions as EventAction[],
        enabled: true,
      })
    })
  }

  eventConfigs.value = configs
}

// 切换事件展开/折叠
function toggleEventExpand(eventId: string) {
  if (expandedEvents.value.has(eventId)) {
    expandedEvents.value.delete(eventId)
  } else {
    expandedEvents.value.add(eventId)
  }
}

// 添加事件
function handleAddEvent() {
  newEventForm.value = { eventName: '' }
  addEventModalVisible.value = true
}

function handleAddEventConfirm() {
  if (!newEventForm.value.eventName) {
    message.error('请选择事件名称')
    return
  }

  // 检查是否已存在
  const exists = eventConfigs.value.some(e => e.eventName === newEventForm.value.eventName)
  if (exists) {
    message.error('该事件已存在')
    return
  }

  const newEvent: EventConfig = {
    id: `${props.control!.id}_${newEventForm.value.eventName}`,
    controlId: props.control!.id,
    eventName: newEventForm.value.eventName,
    actions: [],
    enabled: true,
  }

  eventConfigs.value.push(newEvent)
  expandedEvents.value.add(newEvent.id)
  addEventModalVisible.value = false

  // 触发更新
  emitUpdate(newEvent.eventName, newEvent.actions)
}

function handleAddEventCancel() {
  addEventModalVisible.value = false
}

// 删除事件
function handleDeleteEvent(index: number) {
  const eventConfig = eventConfigs.value[index]
  eventConfigs.value.splice(index, 1)
  expandedEvents.value.delete(eventConfig.id)

  // 触发更新
  emitUpdate(eventConfig.eventName, [])
}

// 事件启用/禁用
function handleEventEnabledChange(eventConfig: EventConfig) {
  emitUpdate(eventConfig.eventName, eventConfig.enabled ? eventConfig.actions : [])
}

// 添加动作
function handleAddAction(eventConfig: EventConfig) {
  currentEventConfig.value = eventConfig
  editingActionIndex.value = undefined
  actionTypeSelectorVisible.value = true
}

// 编辑动作
function handleEditAction(eventConfig: EventConfig, actionIndex: number) {
  currentEventConfig.value = eventConfig
  editingActionIndex.value = actionIndex

  const action = eventConfig.actions[actionIndex]
  currentActionType.value = action.type
  actionConfigForm.value = { ...action.config }

  actionConfigDrawerVisible.value = true
}

// 删除动作
function handleDeleteAction(eventConfig: EventConfig, actionIndex: number) {
  eventConfig.actions.splice(actionIndex, 1)
  emitUpdate(eventConfig.eventName, eventConfig.actions)
}

// 选择动作类型
function handleSelectActionType(type: EventActionType) {
  currentActionType.value = type
  actionConfigForm.value = {}
  actionTypeSelectorVisible.value = false
  actionConfigDrawerVisible.value = true
}

// 保存动作
function handleSaveAction() {
  if (!currentEventConfig.value) return

  // 验证配置
  const validation = validateActionConfig(currentActionType.value!, actionConfigForm.value)
  if (!validation.valid) {
    message.error(validation.message || '配置验证失败')
    return
  }

  savingAction.value = true

  try {
    const action: EventAction = {
      id: editingActionIndex.value !== undefined ? currentEventConfig.value.actions[editingActionIndex.value].id : `action_${Date.now()}`,
      type: currentActionType.value!,
      config: { ...actionConfigForm.value },
    }

    if (editingActionIndex.value !== undefined) {
      // 编辑现有动作
      currentEventConfig.value.actions[editingActionIndex.value] = action
    } else {
      // 添加新动作
      currentEventConfig.value.actions.push(action)
    }

    emitUpdate(currentEventConfig.value.eventName, currentEventConfig.value.actions)

    message.success('保存成功')
    actionConfigDrawerVisible.value = false
  } finally {
    savingAction.value = false
  }
}

// 验证动作配置
function validateActionConfig(type: EventActionType, config: any): { valid: boolean; message?: string } {
  switch (type) {
    case ActionType.OPEN_OVERLAY:
      if (!config.overlayId) {
        return { valid: false, message: '请选择要打开的浮层' }
      }
      break
    case ActionType.DATA_SOURCE:
      if (!config.dataSourceId) {
        return { valid: false, message: '请选择数据源' }
      }
      if (!config.operationType) {
        return { valid: false, message: '请选择操作类型' }
      }
      break
    case ActionType.NAVIGATE:
      if (!config.path) {
        return { valid: false, message: '请输入导航路径' }
      }
      break
    case ActionType.CUSTOM:
      if (!config.script) {
        return { valid: false, message: '请输入自定义脚本' }
      }
      break
  }

  return { valid: true }
}

// 触发更新事件
function emitUpdate(eventName: string, actions: EventAction[]) {
  emit('update', eventName, actions)
}

// 获取动作图标
function getActionIcon(type: EventActionType) {
  const actionType = actionTypes.find(at => at.type === type)
  return actionType?.icon || ThunderboltOutlined
}

// 获取动作标签
function getActionLabel(type: EventActionType) {
  const actionType = actionTypes.find(at => at.type === type)
  return actionType?.label || type
}

// 获取动作摘要
function getActionSummary(action: EventAction): string {
  switch (action.type) {
    case ActionType.OPEN_OVERLAY:
      return `打开浮层: ${action.config.overlayId || '未指定'}`
    case ActionType.CLOSE_OVERLAY:
      return action.config.overlayId ? `关闭浮层: ${action.config.overlayId}` : '关闭当前浮层'
    case ActionType.DATA_SOURCE:
      return `${action.config.dataSourceId || '未指定'} - ${action.config.operationType || '未指定'}`
    case ActionType.NAVIGATE:
      return `导航到: ${action.config.path || '未指定'}`
    case ActionType.CUSTOM:
      return '执行自定义脚本'
    default:
      return '未知动作'
  }
}

// 处理流程图节点点击
function handleFlowNodeClick(action: EventAction) {
  // 可以在这里添加额外的处理逻辑
  console.log('Flow node clicked:', action)
}
</script>

<style scoped>
.event-config-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
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
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
}

.view-switcher {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #fafafa;
}

.event-list {
  padding: 16px;
  flex: 1;
  overflow-y: auto;
}

.flow-view {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.flow-view :deep(.ant-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.flow-view :deep(.ant-tabs-content) {
  flex: 1;
  overflow: hidden;
}

.flow-view :deep(.ant-tabs-tabpane) {
  height: 100%;
}

.event-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.header-title {
  font-weight: 500;
  font-size: 14px;
}

.event-item {
  margin-bottom: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  overflow: hidden;
}

.event-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #fafafa;
  cursor: pointer;
  transition: background 0.3s;
}

.event-item-header:hover {
  background: #f0f0f0;
}

.event-item-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.expand-icon {
  font-size: 12px;
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.event-name {
  font-weight: 500;
}

.event-item-content {
  padding: 12px;
  background: #ffffff;
  border-top: 1px solid #e8e8e8;
}

.actions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-item {
  padding: 12px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
}

.action-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.action-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.action-icon {
  font-size: 16px;
  color: #1890ff;
}

.action-summary {
  font-size: 12px;
  color: #666;
  padding-left: 24px;
}

.action-type-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-type-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-type-item:hover {
  border-color: #1890ff;
  background: #f0f7ff;
}

.action-type-icon {
  font-size: 24px;
  color: #1890ff;
}

.action-type-info {
  flex: 1;
}

.action-type-title {
  font-weight: 500;
  margin-bottom: 4px;
}

.action-type-description {
  font-size: 12px;
  color: #666;
}

.action-type-arrow {
  font-size: 12px;
  color: #999;
}

.panel-content::-webkit-scrollbar {
  width: 8px;
}

.panel-content::-webkit-scrollbar-track {
  background: #f9fafb;
}

.panel-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.panel-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
