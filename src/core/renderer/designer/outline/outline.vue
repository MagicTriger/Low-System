<template>
  <div class="outline-panel">
    <!-- 标题栏 -->
    <div class="outline-header">
      <div class="title">
        <unordered-list-outlined />
        <span>页面大纲</span>
      </div>
      <div class="actions">
        <a-tooltip title="展开所有">
          <a-button size="small" type="text" @click="expandAll">
            <plus-square-outlined />
          </a-button>
        </a-tooltip>
        <a-tooltip title="折叠所有">
          <a-button size="small" type="text" @click="collapseAll">
            <minus-square-outlined />
          </a-button>
        </a-tooltip>
      </div>
    </div>

    <!-- 大纲切换 -->
    <div class="outline-tabs">
      <div class="tab-item" :class="{ active: activeTab === 'controls' }" @click="activeTab = 'controls'">
        <appstore-outlined />
        <span>控件大纲</span>
      </div>
      <div class="tab-item" :class="{ active: activeTab === 'overlays' }" @click="activeTab = 'overlays'">
        <group-outlined />
        <span>浮层大纲</span>
      </div>
    </div>

    <!-- 大纲树 -->
    <div class="outline-content">
      <template v-if="activeTab === 'controls'">
        <OutlineTree
          :nodes="controlNodes"
          :active-node-id="activeNodeId"
          @node-select="handleNodeSelect"
          @node-delete="handleNodeDelete"
          @node-copy="handleNodeCopy"
          @node-paste="handleNodePaste"
          @node-move="handleNodeMove"
        />
      </template>

      <template v-if="activeTab === 'overlays'">
        <OutlineTree
          :nodes="overlayNodes"
          :active-node-id="activeNodeId"
          @node-select="handleNodeSelect"
          @node-delete="handleNodeDelete"
          @node-copy="handleNodeCopy"
        />
      </template>

      <!-- 空状态 -->
      <div v-if="isEmpty" class="empty-state">
        <div class="empty-icon">📄</div>
        <div class="empty-text">暂无内容</div>
        <div class="empty-tip">拖拽组件到画布开始设计</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { UnorderedListOutlined, PlusSquareOutlined, MinusSquareOutlined, AppstoreOutlined, GroupOutlined } from '@ant-design/icons-vue'
import { RootViewContext } from '../../root-view-context'
import OutlineTree from './tree.vue'
import type { Control } from '../../base'

interface Props {
  viewId: string
}

const props = defineProps<Props>()

// 注入上下文
const ctx = inject<RootViewContext>(RootViewContext.ProvideKey)

// 状态管理
const activeTab = ref<'controls' | 'overlays'>('controls')
const expandedKeys = ref<string[]>([])

// 计算属性
const view = computed(() => ctx?.viewIdMap[props.viewId])
const isRootView = computed(() => view.value?.id === ctx?.rootView.value?.id)

const activeNodeId = computed(() => {
  return ctx?.activeCtrls.value[props.viewId]?.id
})

const controlNodes = computed(() => {
  if (!view.value?.controls) return []
  return buildOutlineNodes(view.value.controls)
})

const overlayNodes = computed(() => {
  if (!isRootView.value || !ctx?.rootView.value?.overlays) return []
  return buildOutlineNodes(ctx.rootView.value.overlays)
})

const isEmpty = computed(() => {
  if (activeTab.value === 'controls') {
    return controlNodes.value.length === 0
  }
  return overlayNodes.value.length === 0
})

// 构建大纲节点
const buildOutlineNodes = (controls: Control[]): OutlineNode[] => {
  return controls.map(control => ({
    id: control.id,
    name: control.name || control.kind,
    kind: control.kind,
    control,
    children: control.children ? buildOutlineNodes(control.children) : [],
    expanded: expandedKeys.value.includes(control.id),
  }))
}

// 事件处理
const handleNodeSelect = (node: OutlineNode) => {
  ctx?.setActiveControl(props.viewId, node.control.id)
}

const handleNodeDelete = (node: OutlineNode) => {
  ctx?.deleteControl(props.viewId, node.control.id)
}

const handleNodeCopy = (node: OutlineNode) => {
  ctx?.copyControl(node.control)
}

const handleNodePaste = (targetNode?: OutlineNode) => {
  ctx?.pasteControl(props.viewId, targetNode?.control.id)
}

const handleNodeMove = (dragNode: OutlineNode, dropNode: OutlineNode, position: 'before' | 'after' | 'inside') => {
  // 实现节点移动逻辑
  console.log('移动节点:', dragNode.id, '到', dropNode.id, position)
}

const expandAll = () => {
  const getAllNodeIds = (nodes: OutlineNode[]): string[] => {
    const ids: string[] = []
    nodes.forEach(node => {
      ids.push(node.id)
      if (node.children) {
        ids.push(...getAllNodeIds(node.children))
      }
    })
    return ids
  }

  expandedKeys.value = getAllNodeIds(controlNodes.value.concat(overlayNodes.value))
}

const collapseAll = () => {
  expandedKeys.value = []
}

// 类型定义
interface OutlineNode {
  id: string
  name: string
  kind: string
  control: Control
  children: OutlineNode[]
  expanded: boolean
}
</script>

<style scoped>
.outline-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #fff;
  border-right: 1px solid #f0f0f0;
}

.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
}

.title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #262626;
}

.actions {
  display: flex;
  gap: 4px;
}

.outline-tabs {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
}

.tab-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 12px;
  color: #8c8c8c;
  border-bottom: 2px solid transparent;
}

.tab-item:hover {
  color: #1890ff;
  background: #f8f9fa;
}

.tab-item.active {
  color: #1890ff;
  border-bottom-color: #1890ff;
  background: #e6f7ff;
}

.outline-content {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: #8c8c8c;
}

.empty-icon {
  font-size: 48px;
  margin-bottom: 12px;
  opacity: 0.5;
}

.empty-text {
  font-size: 14px;
  margin-bottom: 4px;
}

.empty-tip {
  font-size: 12px;
  opacity: 0.8;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .outline-tabs {
    flex-direction: column;
  }

  .tab-item {
    justify-content: flex-start;
    padding: 6px 12px;
  }
}
</style>
