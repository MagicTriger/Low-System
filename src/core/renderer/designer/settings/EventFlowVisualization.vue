<template>
  <div class="event-flow-visualization">
    <div class="visualization-header">
      <span class="header-title">事件流程图</span>
      <a-space>
        <a-button type="text" size="small" @click="expandAll">
          <template #icon><ExpandOutlined /></template>
          全部展开
        </a-button>
        <a-button type="text" size="small" @click="collapseAll">
          <template #icon><ShrinkOutlined /></template>
          全部折叠
        </a-button>
      </a-space>
    </div>

    <div class="visualization-content">
      <a-empty v-if="!eventConfig || eventConfig.actions.length === 0" description="暂无事件配置" />

      <div v-else class="flow-tree">
        <!-- 事件触发节点 -->
        <div class="flow-node event-trigger-node">
          <div class="node-content">
            <ThunderboltOutlined class="node-icon" />
            <span class="node-label">{{ eventConfig.eventName }}</span>
          </div>
        </div>

        <!-- 连接线 -->
        <div class="flow-connector vertical"></div>

        <!-- 动作节点 -->
        <div class="actions-flow">
          <div v-for="(action, index) in eventConfig.actions" :key="action.id" class="action-flow-item">
            <!-- 序号指示器 -->
            <div class="action-sequence">
              <div class="sequence-number">{{ index + 1 }}</div>
            </div>

            <!-- 连接线 -->
            <div v-if="index > 0" class="flow-connector vertical short"></div>

            <!-- 动作节点 -->
            <div class="flow-node action-node" @click="handleNodeClick(action)">
              <div class="node-content">
                <component :is="getActionIcon(action.type)" class="node-icon" />
                <div class="node-info">
                  <div class="node-label">{{ getActionLabel(action.type) }}</div>
                  <div class="node-description">{{ getActionSummary(action) }}</div>
                </div>
              </div>

              <!-- 展开/折叠按钮 -->
              <a-button
                v-if="hasEventChain(action)"
                type="text"
                size="small"
                class="expand-button"
                @click.stop="toggleActionExpand(action.id)"
              >
                <RightOutlined :class="['expand-icon', { expanded: expandedActions.has(action.id) }]" />
              </a-button>
            </div>

            <!-- 事件链 (onSuccess 和 onError) -->
            <div v-if="hasEventChain(action) && expandedActions.has(action.id)" class="event-chain">
              <!-- onSuccess 分支 -->
              <div v-if="action.onSuccess && action.onSuccess.length > 0" class="chain-branch success-branch">
                <div class="branch-connector">
                  <div class="connector-line horizontal"></div>
                  <div class="connector-line vertical"></div>
                </div>

                <div class="branch-content">
                  <div class="branch-label success-label">
                    <CheckCircleOutlined class="branch-icon" />
                    <span>成功时执行</span>
                  </div>

                  <div class="branch-actions">
                    <EventFlowVisualization
                      v-for="(chainAction, chainIndex) in action.onSuccess"
                      :key="chainAction.id"
                      :event-config="{ id: `chain-${chainAction.id}`, controlId: '', eventName: '', actions: [chainAction], enabled: true }"
                      :level="level + 1"
                      :show-event-trigger="false"
                      @node-click="handleNodeClick"
                    />
                  </div>
                </div>
              </div>

              <!-- onError 分支 -->
              <div v-if="action.onError && action.onError.length > 0" class="chain-branch error-branch">
                <div class="branch-connector">
                  <div class="connector-line horizontal"></div>
                  <div class="connector-line vertical"></div>
                </div>

                <div class="branch-content">
                  <div class="branch-label error-label">
                    <CloseCircleOutlined class="branch-icon" />
                    <span>失败时执行</span>
                  </div>

                  <div class="branch-actions">
                    <EventFlowVisualization
                      v-for="(chainAction, chainIndex) in action.onError"
                      :key="chainAction.id"
                      :event-config="{ id: `chain-${chainAction.id}`, controlId: '', eventName: '', actions: [chainAction], enabled: true }"
                      :level="level + 1"
                      :show-event-trigger="false"
                      @node-click="handleNodeClick"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 节点详情抽屉 -->
    <a-drawer v-model:open="detailDrawerVisible" title="动作详情" width="500" :destroyOnClose="true">
      <div v-if="selectedAction" class="action-detail">
        <a-descriptions :column="1" bordered size="small">
          <a-descriptions-item label="动作类型">
            <a-tag color="blue">{{ getActionLabel(selectedAction.type) }}</a-tag>
          </a-descriptions-item>

          <a-descriptions-item label="动作ID">
            <code>{{ selectedAction.id }}</code>
          </a-descriptions-item>

          <a-descriptions-item label="配置详情">
            <pre class="config-json">{{ JSON.stringify(selectedAction.config, null, 2) }}</pre>
          </a-descriptions-item>

          <a-descriptions-item v-if="selectedAction.onSuccess && selectedAction.onSuccess.length > 0" label="成功链">
            <a-tag color="success">{{ selectedAction.onSuccess.length }} 个动作</a-tag>
          </a-descriptions-item>

          <a-descriptions-item v-if="selectedAction.onError && selectedAction.onError.length > 0" label="失败链">
            <a-tag color="error">{{ selectedAction.onError.length }} 个动作</a-tag>
          </a-descriptions-item>
        </a-descriptions>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  ThunderboltOutlined,
  RightOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ExpandOutlined,
  ShrinkOutlined,
  ApiOutlined,
  LayoutOutlined,
  LinkOutlined,
  CodeOutlined,
  CloseOutlined,
} from '@ant-design/icons-vue'
import type { EventConfig, EventAction, EventActionType } from '@/core/api/event-config'
import { EventActionType as ActionType } from '@/core/api/event-config'

interface Props {
  eventConfig: EventConfig | null
  level?: number
  showEventTrigger?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  level: 0,
  showEventTrigger: true,
})

const emit = defineEmits<{
  nodeClick: [action: EventAction]
}>()

// 状态
const expandedActions = ref<Set<string>>(new Set())
const detailDrawerVisible = ref(false)
const selectedAction = ref<EventAction | null>(null)

// 动作类型定义
const actionTypes = [
  {
    type: ActionType.OPEN_OVERLAY,
    label: '打开浮层',
    icon: LayoutOutlined,
  },
  {
    type: ActionType.CLOSE_OVERLAY,
    label: '关闭浮层',
    icon: CloseOutlined,
  },
  {
    type: ActionType.DATA_SOURCE,
    label: '数据源操作',
    icon: ApiOutlined,
  },
  {
    type: ActionType.NAVIGATE,
    label: '页面导航',
    icon: LinkOutlined,
  },
  {
    type: ActionType.CUSTOM,
    label: '自定义脚本',
    icon: CodeOutlined,
  },
]

// 展开所有节点
function expandAll() {
  if (!props.eventConfig) return

  const allActionIds = new Set<string>()

  function collectActionIds(actions: EventAction[]) {
    actions.forEach(action => {
      if (hasEventChain(action)) {
        allActionIds.add(action.id)
      }
      if (action.onSuccess) {
        collectActionIds(action.onSuccess)
      }
      if (action.onError) {
        collectActionIds(action.onError)
      }
    })
  }

  collectActionIds(props.eventConfig.actions)
  expandedActions.value = allActionIds
}

// 折叠所有节点
function collapseAll() {
  expandedActions.value.clear()
}

// 切换动作展开/折叠
function toggleActionExpand(actionId: string) {
  if (expandedActions.value.has(actionId)) {
    expandedActions.value.delete(actionId)
  } else {
    expandedActions.value.add(actionId)
  }
}

// 检查是否有事件链
function hasEventChain(action: EventAction): boolean {
  return (action.onSuccess && action.onSuccess.length > 0) || (action.onError && action.onError.length > 0)
}

// 处理节点点击
function handleNodeClick(action: EventAction) {
  selectedAction.value = action
  detailDrawerVisible.value = true
  emit('nodeClick', action)
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
</script>

<style scoped>
.event-flow-visualization {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
}

.visualization-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
}

.header-title {
  font-weight: 500;
  font-size: 14px;
}

.visualization-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.flow-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.flow-node {
  position: relative;
  min-width: 280px;
  padding: 16px;
  background: #ffffff;
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.flow-node:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.event-trigger-node {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  color: #ffffff;
}

.event-trigger-node .node-icon {
  color: #ffffff;
}

.action-node {
  background: #ffffff;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.node-icon {
  font-size: 24px;
  color: #1890ff;
  flex-shrink: 0;
}

.node-info {
  flex: 1;
  min-width: 0;
}

.node-label {
  font-weight: 500;
  font-size: 14px;
  display: block;
  margin-bottom: 4px;
}

.node-description {
  font-size: 12px;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.event-trigger-node .node-description {
  color: rgba(255, 255, 255, 0.9);
}

.expand-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
}

.expand-icon {
  font-size: 12px;
  transition: transform 0.3s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.flow-connector {
  width: 2px;
  background: #d9d9d9;
  margin: 0 auto;
}

.flow-connector.vertical {
  height: 32px;
}

.flow-connector.vertical.short {
  height: 16px;
}

.actions-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.action-flow-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  position: relative;
}

.action-sequence {
  position: absolute;
  left: -40px;
  top: 16px;
}

.sequence-number {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #1890ff;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.event-chain {
  width: 100%;
  margin-top: 16px;
  padding-left: 40px;
}

.chain-branch {
  margin-bottom: 16px;
  position: relative;
}

.branch-connector {
  position: absolute;
  left: -40px;
  top: 0;
}

.connector-line {
  background: #d9d9d9;
}

.connector-line.horizontal {
  width: 40px;
  height: 2px;
  position: absolute;
  left: 0;
  top: 24px;
}

.connector-line.vertical {
  width: 2px;
  height: 100%;
  position: absolute;
  left: 0;
  top: 24px;
}

.success-branch .connector-line {
  background: #52c41a;
}

.error-branch .connector-line {
  background: #ff4d4f;
}

.branch-content {
  padding-left: 16px;
  border-left: 2px solid #e8e8e8;
}

.success-branch .branch-content {
  border-left-color: #52c41a;
}

.error-branch .branch-content {
  border-left-color: #ff4d4f;
}

.branch-label {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  margin-bottom: 12px;
  width: fit-content;
}

.success-label {
  background: #f6ffed;
  color: #52c41a;
  border: 1px solid #b7eb8f;
}

.error-label {
  background: #fff2f0;
  color: #ff4d4f;
  border: 1px solid #ffccc7;
}

.branch-icon {
  font-size: 14px;
}

.branch-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-detail {
  padding: 16px 0;
}

.config-json {
  background: #f5f5f5;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

.visualization-content::-webkit-scrollbar {
  width: 8px;
}

.visualization-content::-webkit-scrollbar-track {
  background: #f9fafb;
}

.visualization-content::-webkit-scrollbar-thumb {
  background: #d1d5db;
  border-radius: 4px;
}

.visualization-content::-webkit-scrollbar-thumb:hover {
  background: #9ca3af;
}
</style>
