<template>
  <div class="outline-tree">
    <!-- 工具栏 -->
    <div class="outline-toolbar">
      <div class="toolbar-left">
        <h4 class="outline-title">页面大纲</h4>
        <a-badge :count="totalControls" :number-style="{ backgroundColor: '#52c41a' }">
          <span class="control-count">{{ totalControls }} 个组件</span>
        </a-badge>
      </div>

      <div class="toolbar-right">
        <a-button-group size="small">
          <a-button :type="expandAll ? 'primary' : 'default'" @click="toggleExpandAll" title="展开/折叠全部">
            <branches-outlined />
          </a-button>

          <a-button :type="showHidden ? 'primary' : 'default'" @click="toggleShowHidden" title="显示/隐藏不可见组件">
            <eye-outlined v-if="showHidden" />
            <eye-invisible-outlined v-else />
          </a-button>

          <a-dropdown :trigger="['click']">
            <a-button>
              <more-outlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleMenuClick">
                <a-menu-item key="select-all">
                  <select-outlined />
                  全选组件
                </a-menu-item>
                <a-menu-item key="clear-selection">
                  <close-outlined />
                  清除选择
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="copy-structure">
                  <copy-outlined />
                  复制结构
                </a-menu-item>
                <a-menu-item key="export-json">
                  <export-outlined />
                  导出JSON
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-button-group>
      </div>
    </div>

    <!-- 搜索框 -->
    <div class="outline-search">
      <a-input v-model:value="searchKeyword" placeholder="搜索组件..." allow-clear @change="handleSearch">
        <template #prefix>
          <search-outlined />
        </template>
      </a-input>
    </div>

    <!-- 树形结构 -->
    <div class="outline-content" :class="{ 'is-searching': isSearching }">
      <a-tree
        v-if="!isEmpty"
        :tree-data="filteredTreeData"
        :expanded-keys="expandedKeys"
        :selected-keys="selectedKeys"
        :draggable="!isSearching"
        :block-node="true"
        :show-line="true"
        :show-icon="true"
        @expand="handleExpand"
        @select="handleSelect"
        @drop="handleDrop"
        @right-click="handleRightClick"
      >
        <template #icon="{ dataRef }">
          <component :is="getControlIcon(dataRef.kind)" :style="{ color: getControlColor(dataRef.kind) }" />
        </template>

        <template #title="{ dataRef }">
          <div
            class="tree-node-title"
            :class="{
              'is-selected': selectedKeys.includes(dataRef.key),
              'is-hidden': dataRef.hidden,
              'is-locked': dataRef.locked,
              'is-error': dataRef.hasError,
            }"
            @mouseenter="handleNodeHover(dataRef, true)"
            @mouseleave="handleNodeHover(dataRef, false)"
          >
            <span class="node-name">{{ dataRef.name || dataRef.kind }}</span>

            <div class="node-badges">
              <a-tag v-if="dataRef.hidden" size="small" color="orange">隐藏</a-tag>
              <a-tag v-if="dataRef.locked" size="small" color="red">锁定</a-tag>
              <a-tag v-if="dataRef.hasError" size="small" color="error">错误</a-tag>
              <a-tag v-if="dataRef.children?.length" size="small" color="blue">
                {{ dataRef.children.length }}
              </a-tag>
            </div>

            <div class="node-actions">
              <a-button-group size="small">
                <a-button type="text" size="small" @click.stop="toggleVisibility(dataRef)" :title="dataRef.hidden ? '显示' : '隐藏'">
                  <eye-outlined v-if="dataRef.hidden" />
                  <eye-invisible-outlined v-else />
                </a-button>

                <a-button type="text" size="small" @click.stop="toggleLock(dataRef)" :title="dataRef.locked ? '解锁' : '锁定'">
                  <lock-outlined v-if="dataRef.locked" />
                  <unlock-outlined v-else />
                </a-button>

                <a-dropdown :trigger="['click']" @click.stop>
                  <a-button type="text" size="small">
                    <more-outlined />
                  </a-button>
                  <template #overlay>
                    <a-menu @click="e => handleNodeAction(e, dataRef)">
                      <a-menu-item key="copy">
                        <copy-outlined />
                        复制
                      </a-menu-item>
                      <a-menu-item key="duplicate">
                        <diff-outlined />
                        复制并粘贴
                      </a-menu-item>
                      <a-menu-item key="delete" :disabled="dataRef.locked">
                        <delete-outlined />
                        删除
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="move-up" :disabled="!canMoveUp(dataRef)">
                        <arrow-up-outlined />
                        上移
                      </a-menu-item>
                      <a-menu-item key="move-down" :disabled="!canMoveDown(dataRef)">
                        <arrow-down-outlined />
                        下移
                      </a-menu-item>
                      <a-menu-divider />
                      <a-menu-item key="rename">
                        <edit-outlined />
                        重命名
                      </a-menu-item>
                      <a-menu-item key="properties">
                        <setting-outlined />
                        属性
                      </a-menu-item>
                    </a-menu>
                  </template>
                </a-dropdown>
              </a-button-group>
            </div>
          </div>
        </template>
      </a-tree>

      <!-- 空状态 -->
      <div v-else class="empty-outline">
        <div class="empty-icon">📋</div>
        <div class="empty-title">暂无组件</div>
        <div class="empty-description">从左侧组件面板拖拽组件到画布</div>
      </div>

      <!-- 搜索无结果 -->
      <div v-if="isSearching && filteredTreeData.length === 0" class="no-results">
        <div class="no-results-icon">🔍</div>
        <div class="no-results-title">未找到匹配的组件</div>
        <div class="no-results-description">尝试使用其他关键词搜索</div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <a-dropdown
      v-model:open="contextMenuVisible"
      :trigger="['contextmenu']"
      :overlay-style="{ position: 'fixed', left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }"
    >
      <div></div>
      <template #overlay>
        <a-menu @click="handleContextMenuClick">
          <a-menu-item key="select">
            <select-outlined />
            选择
          </a-menu-item>
          <a-menu-item key="copy">
            <copy-outlined />
            复制
          </a-menu-item>
          <a-menu-item key="delete" :disabled="contextMenuNode?.locked">
            <delete-outlined />
            删除
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="expand-all">
            <branches-outlined />
            展开所有子项
          </a-menu-item>
          <a-menu-item key="collapse-all">
            <shrink-outlined />
            折叠所有子项
          </a-menu-item>
        </a-menu>
      </template>
    </a-dropdown>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { message } from 'ant-design-vue'
import {
  BranchesOutlined,
  EyeOutlined,
  EyeInvisibleOutlined,
  MoreOutlined,
  SelectOutlined,
  CloseOutlined,
  CopyOutlined,
  ExportOutlined,
  SearchOutlined,
  LockOutlined,
  UnlockOutlined,
  DeleteOutlined,
  DiffOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  EditOutlined,
  SettingOutlined,
  ShrinkOutlined,
} from '@ant-design/icons-vue'
import type { Control } from '../../base'

interface TreeNode {
  key: string
  title: string
  name: string
  kind: string
  hidden: boolean
  locked: boolean
  hasError: boolean
  children?: TreeNode[]
  control: Control
}

interface Props {
  controls: Control[]
  selectedControlId?: string
  viewId: string
}

const props = withDefaults(defineProps<Props>(), {
  controls: () => [],
  selectedControlId: '',
  viewId: '',
})

// 事件定义
const emit = defineEmits<{
  'control-select': [controlId: string]
  'control-delete': [controlId: string]
  'control-copy': [control: Control]
  'control-move': [controlId: string, targetId: string, position: 'before' | 'after' | 'inside']
  'control-toggle-visibility': [controlId: string]
  'control-toggle-lock': [controlId: string]
  'control-rename': [controlId: string, newName: string]
  'controls-select-all': []
  'controls-clear-selection': []
}>()

// 状态管理
const searchKeyword = ref('')
const expandedKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])
const expandAll = ref(false)
const showHidden = ref(true)
const contextMenuVisible = ref(false)
const contextMenuPosition = reactive({ x: 0, y: 0 })
const contextMenuNode = ref<TreeNode | null>(null)

// 计算属性
const isSearching = computed(() => searchKeyword.value.trim().length > 0)
const isEmpty = computed(() => props.controls.length === 0)
const totalControls = computed(() => countControls(props.controls))

const treeData = computed(() => {
  return buildTreeData(props.controls)
})

const filteredTreeData = computed(() => {
  if (!isSearching.value) {
    return showHidden.value ? treeData.value : filterHiddenNodes(treeData.value)
  }

  return searchNodes(treeData.value, searchKeyword.value.toLowerCase())
})

// 方法
const countControls = (controls: Control[]): number => {
  let count = controls.length
  controls.forEach(control => {
    if (control.children) {
      count += countControls(control.children)
    }
  })
  return count
}

const buildTreeData = (controls: Control[], parentKey = ''): TreeNode[] => {
  return controls.map((control, index) => {
    const key = parentKey ? `${parentKey}-${index}` : `${index}`
    const node: TreeNode = {
      key,
      title: control.name || control.kind,
      name: control.name || '',
      kind: control.kind,
      hidden: control.styles?.display === 'none' || control.styles?.visibility === 'hidden',
      locked: control.locked || false,
      hasError: false, // TODO: 实现错误检测
      control,
    }

    if (control.children && control.children.length > 0) {
      node.children = buildTreeData(control.children, key)
    }

    return node
  })
}

const filterHiddenNodes = (nodes: TreeNode[]): TreeNode[] => {
  return nodes
    .filter(node => !node.hidden)
    .map(node => ({
      ...node,
      children: node.children ? filterHiddenNodes(node.children) : undefined,
    }))
}

const searchNodes = (nodes: TreeNode[], keyword: string): TreeNode[] => {
  const result: TreeNode[] = []

  for (const node of nodes) {
    const matches = node.name.toLowerCase().includes(keyword) || node.kind.toLowerCase().includes(keyword)

    let childMatches: TreeNode[] = []
    if (node.children) {
      childMatches = searchNodes(node.children, keyword)
    }

    if (matches || childMatches.length > 0) {
      result.push({
        ...node,
        children: childMatches.length > 0 ? childMatches : node.children,
      })
    }
  }

  return result
}

const getControlIcon = (kind: string) => {
  const iconMap: Record<string, string> = {
    span: 'font-size-outlined',
    button: 'control-outlined',
    string: 'field-string-outlined',
    number: 'field-number-outlined',
    boolean: 'check-square-outlined',
    image: 'picture-outlined',
    flex: 'layout-outlined',
    grid: 'table-outlined',
    table: 'table-outlined',
    'line-chart': 'line-chart-outlined',
    'bar-chart': 'bar-chart-outlined',
    'pie-chart': 'pie-chart-outlined',
    'mobile-container': 'mobile-outlined',
    'mobile-list': 'unordered-list-outlined',
    'svg-icon': 'star-outlined',
    'svg-shape': 'bg-colors-outlined',
  }

  return iconMap[kind] || 'block-outlined'
}

const getControlColor = (kind: string) => {
  const colorMap: Record<string, string> = {
    span: '#1890ff',
    button: '#52c41a',
    string: '#722ed1',
    number: '#fa8c16',
    boolean: '#13c2c2',
    image: '#eb2f96',
    flex: '#2f54eb',
    grid: '#389e0d',
    table: '#d48806',
    'line-chart': '#1890ff',
    'bar-chart': '#52c41a',
    'pie-chart': '#fa541c',
    'mobile-container': '#722ed1',
    'mobile-list': '#13c2c2',
    'svg-icon': '#eb2f96',
    'svg-shape': '#2f54eb',
  }

  return colorMap[kind] || '#8c8c8c'
}

const toggleExpandAll = () => {
  expandAll.value = !expandAll.value
  if (expandAll.value) {
    expandedKeys.value = getAllKeys(treeData.value)
  } else {
    expandedKeys.value = []
  }
}

const getAllKeys = (nodes: TreeNode[]): string[] => {
  const keys: string[] = []
  const traverse = (nodes: TreeNode[]) => {
    nodes.forEach(node => {
      keys.push(node.key)
      if (node.children) {
        traverse(node.children)
      }
    })
  }
  traverse(nodes)
  return keys
}

const toggleShowHidden = () => {
  showHidden.value = !showHidden.value
}

const handleSearch = () => {
  if (isSearching.value) {
    // 搜索时自动展开所有匹配的节点
    expandedKeys.value = getAllKeys(filteredTreeData.value)
  }
}

const handleExpand = (keys: string[]) => {
  expandedKeys.value = keys
}

const handleSelect = (keys: string[], { node }: any) => {
  selectedKeys.value = keys
  if (keys.length > 0) {
    emit('control-select', node.control.id)
  }
}

const handleDrop = ({ node, dragNode, dropPosition }: any) => {
  const targetId = node.control.id
  const dragId = dragNode.control.id

  let position: 'before' | 'after' | 'inside'
  if (dropPosition === 0) {
    position = 'inside'
  } else if (dropPosition === -1) {
    position = 'before'
  } else {
    position = 'after'
  }

  emit('control-move', dragId, targetId, position)
}

const handleRightClick = ({ event, node }: any) => {
  event.preventDefault()
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuNode.value = node
  contextMenuVisible.value = true
}

const handleNodeHover = (node: TreeNode, isHover: boolean) => {
  // TODO: 实现画布中对应控件的高亮显示
  console.log('Node hover:', node.control.id, isHover)
}

const toggleVisibility = (node: TreeNode) => {
  emit('control-toggle-visibility', node.control.id)
}

const toggleLock = (node: TreeNode) => {
  emit('control-toggle-lock', node.control.id)
}

const canMoveUp = (node: TreeNode) => {
  // TODO: 实现移动判断逻辑
  return true
}

const canMoveDown = (node: TreeNode) => {
  // TODO: 实现移动判断逻辑
  return true
}

const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'select-all':
      emit('controls-select-all')
      break
    case 'clear-selection':
      emit('controls-clear-selection')
      selectedKeys.value = []
      break
    case 'copy-structure':
      copyStructureToClipboard()
      break
    case 'export-json':
      exportToJson()
      break
  }
}

const handleNodeAction = ({ key }: { key: string }, node: TreeNode) => {
  switch (key) {
    case 'copy':
      emit('control-copy', node.control)
      break
    case 'duplicate':
      emit('control-copy', node.control)
      // TODO: 自动粘贴
      break
    case 'delete':
      emit('control-delete', node.control.id)
      break
    case 'move-up':
      // TODO: 实现上移
      break
    case 'move-down':
      // TODO: 实现下移
      break
    case 'rename':
      // TODO: 实现重命名
      break
    case 'properties':
      emit('control-select', node.control.id)
      break
  }
}

const handleContextMenuClick = ({ key }: { key: string }) => {
  if (!contextMenuNode.value) return

  switch (key) {
    case 'select':
      emit('control-select', contextMenuNode.value.control.id)
      break
    case 'copy':
      emit('control-copy', contextMenuNode.value.control)
      break
    case 'delete':
      emit('control-delete', contextMenuNode.value.control.id)
      break
    case 'expand-all':
      expandNodeChildren(contextMenuNode.value)
      break
    case 'collapse-all':
      collapseNodeChildren(contextMenuNode.value)
      break
  }

  contextMenuVisible.value = false
}

const expandNodeChildren = (node: TreeNode) => {
  const keys = getAllKeysFromNode(node)
  expandedKeys.value = [...new Set([...expandedKeys.value, ...keys])]
}

const collapseNodeChildren = (node: TreeNode) => {
  const keys = getAllKeysFromNode(node)
  expandedKeys.value = expandedKeys.value.filter(key => !keys.includes(key))
}

const getAllKeysFromNode = (node: TreeNode): string[] => {
  const keys = [node.key]
  if (node.children) {
    node.children.forEach(child => {
      keys.push(...getAllKeysFromNode(child))
    })
  }
  return keys
}

const copyStructureToClipboard = () => {
  const structure = JSON.stringify(props.controls, null, 2)
  navigator.clipboard
    .writeText(structure)
    .then(() => {
      message.success('页面结构已复制到剪贴板')
    })
    .catch(() => {
      message.error('复制失败')
    })
}

const exportToJson = () => {
  const dataStr = JSON.stringify(props.controls, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = `page-structure-${Date.now()}.json`
  link.click()
  URL.revokeObjectURL(url)
  message.success('页面结构已导出')
}

// 监听器
watch(
  () => props.selectedControlId,
  newId => {
    if (newId) {
      // TODO: 根据控件ID找到对应的树节点并选中
      // selectedKeys.value = [findNodeKeyById(newId)]
    }
  },
  { immediate: true }
)

watch(
  () => props.controls,
  () => {
    // 控件列表变化时，更新展开状态
    nextTick(() => {
      if (expandAll.value) {
        expandedKeys.value = getAllKeys(treeData.value)
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.outline-tree {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: rgba(248, 249, 250, 0.95);
}

.outline-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.5);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.outline-title {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #1f2937;
}

.control-count {
  font-size: 12px;
  color: #6b7280;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.outline-search {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.5);
}

.outline-content {
  flex: 1;
  overflow: auto;
  padding: 8px;
  background: rgba(248, 249, 250, 0.95);
}

.outline-content.is-searching {
  padding: 8px 16px;
}

.tree-node-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  border-radius: 4px;
  transition: all 0.2s;
  min-height: 32px;
}

.tree-node-title:hover {
  background: rgba(59, 130, 246, 0.08);
}

.tree-node-title.is-selected {
  background: rgba(59, 130, 246, 0.12);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.tree-node-title.is-hidden {
  opacity: 0.5;
}

.tree-node-title.is-locked {
  background: rgba(251, 191, 36, 0.1);
}

.tree-node-title.is-error {
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.3);
}

.node-name {
  flex: 1;
  font-size: 13px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-badges {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 8px;
}

.node-actions {
  opacity: 0;
  transition: opacity 0.2s;
}

.tree-node-title:hover .node-actions {
  opacity: 1;
}

.empty-outline,
.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: #9ca3af;
}

.empty-icon,
.no-results-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.empty-title,
.no-results-title {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 8px;
  color: #6b7280;
}

.empty-description,
.no-results-description {
  font-size: 14px;
  color: #9ca3af;
}

/* Ant Design 组件浅色主题覆盖 */
:deep(.ant-tree) {
  background: transparent !important;
  color: #374151 !important;
}

:deep(.ant-tree-node-content-wrapper) {
  color: #374151 !important;
}

:deep(.ant-tree-node-content-wrapper:hover) {
  background-color: rgba(59, 130, 246, 0.08) !important;
}

:deep(.ant-tree-node-selected .ant-tree-node-content-wrapper) {
  background-color: rgba(59, 130, 246, 0.12) !important;
}

:deep(.ant-tree-switcher) {
  color: #6b7280 !important;
}

:deep(.ant-tree-title) {
  color: #374151 !important;
}

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

:deep(.ant-btn) {
  background: rgba(255, 255, 255, 0.6) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  color: #374151 !important;
}

:deep(.ant-btn:hover) {
  background: rgba(59, 130, 246, 0.08) !important;
  border-color: rgba(59, 130, 246, 0.3) !important;
  color: #3b82f6 !important;
}

:deep(.ant-btn-primary) {
  background: #3b82f6 !important;
  border-color: #3b82f6 !important;
  color: #ffffff !important;
}

:deep(.ant-btn-primary:hover) {
  background: #2563eb !important;
  border-color: #2563eb !important;
}

:deep(.ant-btn-text) {
  background: transparent !important;
  border: none !important;
  color: #374151 !important;
}

:deep(.ant-btn-text:hover) {
  background: rgba(59, 130, 246, 0.08) !important;
  color: #3b82f6 !important;
}

:deep(.ant-badge) {
  color: #374151 !important;
}

:deep(.ant-tag) {
  background: rgba(255, 255, 255, 0.6) !important;
  border-color: rgba(0, 0, 0, 0.1) !important;
  color: #374151 !important;
}

:deep(.ant-dropdown-menu) {
  background: rgba(255, 255, 255, 0.95) !important;
}

:deep(.ant-dropdown-menu-item) {
  color: #374151 !important;
}

:deep(.ant-dropdown-menu-item:hover) {
  background: rgba(59, 130, 246, 0.08) !important;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .outline-toolbar {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }

  .node-actions {
    opacity: 1;
  }
}
</style>
