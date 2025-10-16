<template>
  <div class="outline-tree">
    <div
      v-for="node in nodes"
      :key="node.id"
      class="tree-node"
      :class="{ 
        'is-active': node.id === activeNodeId,
        'is-expanded': node.expanded,
        'has-children': node.children && node.children.length > 0
      }"
    >
      <!-- 节点内容 -->
      <div 
        class="node-content"
        :style="{ paddingLeft: `${level * 20}px` }"
        @click="handleNodeClick(node)"
        @contextmenu.prevent="handleContextMenu($event, node)"
      >
        <!-- 展开/折叠按钮 -->
        <div 
          v-if="node.children && node.children.length > 0"
          class="expand-button"
          @click.stop="toggleExpand(node)"
        >
          <right-outlined v-if="!node.expanded" />
          <down-outlined v-else />
        </div>
        <div v-else class="expand-placeholder"></div>
        
        <!-- 节点图标 -->
        <div class="node-icon">
          <component :is="getNodeIcon(node.kind)" />
        </div>
        
        <!-- 节点名称 -->
        <div class="node-name">{{ node.name }}</div>
        
        <!-- 节点操作 -->
        <div class="node-actions" v-if="node.id === activeNodeId">
          <a-tooltip title="复制">
            <a-button size="small" type="text" @click.stop="handleCopy(node)">
              <copy-outlined />
            </a-button>
          </a-tooltip>
          <a-tooltip title="删除">
            <a-button size="small" type="text" danger @click.stop="handleDelete(node)">
              <delete-outlined />
            </a-button>
          </a-tooltip>
        </div>
      </div>
      
      <!-- 子节点 -->
      <template v-if="node.expanded && node.children && node.children.length > 0">
        <OutlineTree
          :nodes="node.children"
          :active-node-id="activeNodeId"
          :level="level + 1"
          @node-select="$emit('node-select', $event)"
          @node-delete="$emit('node-delete', $event)"
          @node-copy="$emit('node-copy', $event)"
          @node-paste="$emit('node-paste', $event)"
          @node-move="$emit('node-move', $event)"
        />
      </template>
    </div>
    
    <!-- 右键菜单 -->
    <a-dropdown
      v-model:open="contextMenuVisible"
      :trigger="['contextmenu']"
      placement="bottomLeft"
    >
      <div></div>
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <a-menu-item key="copy">
            <copy-outlined />
            复制
          </a-menu-item>
          <a-menu-item key="paste" :disabled="!canPaste">
            <snippets-outlined />
            粘贴
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="moveUp" :disabled="!canMoveUp">
            <arrow-up-outlined />
            上移
          </a-menu-item>
          <a-menu-item key="moveDown" :disabled="!canMoveDown">
            <arrow-down-outlined />
            下移
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="delete" danger>
            <delete-outlined />
            删除
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  UnorderedListOutlined,
  RightOutlined,
  DownOutlined,
  CopyOutlined,
  DeleteOutlined,
  SnippetsOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  AppstoreOutlined,
  FormOutlined,
  LayoutOutlined,
  TableOutlined
} from '@ant-design/icons-vue'

interface OutlineNode {
  id: string
  name: string
  kind: string
  control: any
  children?: OutlineNode[]
  expanded?: boolean
}

interface Props {
  nodes: OutlineNode[]
  activeNodeId?: string
  level?: number
}

const props = withDefaults(defineProps<Props>(), {
  level: 0
})

// 状态管理
const contextMenuVisible = ref(false)
const contextMenuNode = ref<OutlineNode | null>(null)

// 计算属性
const canPaste = computed(() => {
  // 检查是否有可粘贴的内容
  return false // 暂时返回false
})

const canMoveUp = computed(() => {
  // 检查是否可以上移
  return contextMenuNode.value ? true : false
})

const canMoveDown = computed(() => {
  // 检查是否可以下移
  return contextMenuNode.value ? true : false
})

// 方法
const getNodeIcon = (kind: string) => {
  const iconMap: Record<string, any> = {
    button: AppstoreOutlined,
    span: FormOutlined,
    string: FormOutlined,
    flex: LayoutOutlined,
    table: TableOutlined
  }
  
  return iconMap[kind] || AppstoreOutlined
}

const toggleExpand = (node: OutlineNode) => {
  node.expanded = !node.expanded
}

const handleNodeClick = (node: OutlineNode) => {
  emit('node-select', node)
}

const handleContextMenu = (event: MouseEvent, node: OutlineNode) => {
  contextMenuNode.value = node
  contextMenuVisible.value = true
}

const handleCopy = (node: OutlineNode) => {
  emit('node-copy', node)
}

const handleDelete = (node: OutlineNode) => {
  emit('node-delete', node)
}

const handleMenuClick = ({ key }: { key: string }) => {
  if (!contextMenuNode.value) return
  
  switch (key) {
    case 'copy':
      emit('node-copy', contextMenuNode.value)
      break
    case 'paste':
      emit('node-paste', contextMenuNode.value)
      break
    case 'moveUp':
      emit('node-move', contextMenuNode.value, 'up')
      break
    case 'moveDown':
      emit('node-move', contextMenuNode.value, 'down')
      break
    case 'delete':
      emit('node-delete', contextMenuNode.value)
      break
  }
  
  contextMenuVisible.value = false
  contextMenuNode.value = null
}

const expandAll = () => {
  const expandNodes = (nodes: OutlineNode[]) => {
    nodes.forEach(node => {
      node.expanded = true
      if (node.children) {
        expandNodes(node.children)
      }
    })
  }
  
  expandNodes(props.nodes)
}

const collapseAll = () => {
  const collapseNodes = (nodes: OutlineNode[]) => {
    nodes.forEach(node => {
      node.expanded = false
      if (node.children) {
        collapseNodes(node.children)
      }
    })
  }
  
  collapseNodes(props.nodes)
}

// 事件定义
const emit = defineEmits<{
  'node-select': [node: OutlineNode]
  'node-delete': [node: OutlineNode]
  'node-copy': [node: OutlineNode]
  'node-paste': [node: OutlineNode]
  'node-move': [node: OutlineNode, direction: string]
}>()
</script>

<style scoped>
.outline-panel {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
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
}

.outline-tree {
  width: 100%;
}

.tree-node {
  position: relative;
}

.node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 4px;
  margin: 1px 4px;
}

.node-content:hover {
  background: #f8f9fa;
}

.tree-node.is-active .node-content {
  background: #e6f7ff;
  color: #1890ff;
}

.expand-button {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.expand-button:hover {
  background: #e6f7ff;
  color: #1890ff;
}

.expand-placeholder {
  width: 16px;
  height: 16px;
}

.node-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #595959;
}

.tree-node.is-active .node-icon {
  color: #1890ff;
}

.node-name {
  flex: 1;
  font-size: 12px;
  color: #262626;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node.is-active .node-name {
  color: #1890ff;
}

.node-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.tree-node.is-active .node-actions,
.node-content:hover .node-actions {
  opacity: 1;
}

.node-actions .ant-btn {
  width: 20px;
  height: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
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
</style>