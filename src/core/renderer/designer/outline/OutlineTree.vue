<template>
  <div class="outline-tree">
    <!-- 工具栏 -->
    <div class="outline-toolbar">
      <div class="toolbar-left">
        <h4 class="outline-title">大纲</h4>
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

    <!-- 视图切换标签 -->
    <div class="view-tabs">
      <a-segmented v-model:value="activeView" :options="viewOptions" block>
        <template #label="{ value, title }">
          <div class="tab-label">
            <component :is="getViewIcon(String(value))" />
            <span>{{ title }}</span>
            <a-badge
              v-if="value === 'page'"
              :count="pageControlCount"
              :number-style="{ backgroundColor: '#3b82f6', fontSize: '10px', height: '16px', lineHeight: '16px', minWidth: '16px' }"
            />
            <a-badge
              v-if="value === 'overlay'"
              :count="overlayCount"
              :number-style="{ backgroundColor: '#9254de', fontSize: '10px', height: '16px', lineHeight: '16px', minWidth: '16px' }"
            />
            <a-badge
              v-if="value === 'all'"
              :count="totalControls"
              :number-style="{ backgroundColor: '#52c41a', fontSize: '10px', height: '16px', lineHeight: '16px', minWidth: '16px' }"
            />
          </div>
        </template>
      </a-segmented>
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
              'is-overlay': dataRef.isOverlay,
              'is-overlay-inactive': dataRef.isOverlay && !dataRef.isActive,
            }"
            @mouseenter="handleNodeHover(dataRef, true)"
            @mouseleave="handleNodeHover(dataRef, false)"
          >
            <span class="node-name">{{ dataRef.name || dataRef.kind }}</span>

            <div class="node-badges">
              <!-- 浮层绑定信息标签 -->
              <a-tag v-if="dataRef.isOverlay && dataRef.control.props?.binding" size="small" color="blue">
                🔗 {{ dataRef.control.props.binding.triggerControlName }}
              </a-tag>
              <a-tag v-if="dataRef.isOverlay" size="small" :color="dataRef.isActive ? 'green' : 'default'">
                {{ dataRef.isActive ? '已打开' : '未打开' }}
              </a-tag>
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

                <!-- 浮层删除按钮 -->
                <a-button
                  v-if="dataRef.isOverlay"
                  type="text"
                  size="small"
                  danger
                  @click.stop="handleDeleteOverlay(dataRef)"
                  title="删除浮层"
                >
                  <delete-outlined />
                </a-button>
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
    <div
      v-if="contextMenuVisible"
      class="context-menu-overlay"
      @click="contextMenuVisible = false"
      @contextmenu.prevent="contextMenuVisible = false"
    >
      <div class="context-menu" :style="{ left: contextMenuPosition.x + 'px', top: contextMenuPosition.y + 'px' }" @click.stop>
        <a-menu @click="handleContextMenuClick">
          <a-menu-item key="select">
            <select-outlined />
            选择
          </a-menu-item>
          <a-menu-item key="copy">
            <copy-outlined />
            复制
          </a-menu-item>
          <a-menu-item key="paste-before" :disabled="!hasClipboard">
            <vertical-align-top-outlined />
            粘贴到之前
          </a-menu-item>
          <a-menu-item key="paste-after" :disabled="!hasClipboard">
            <vertical-align-bottom-outlined />
            粘贴到之后
          </a-menu-item>
          <a-menu-item key="paste-inside" :disabled="!hasClipboard || !canPasteInside">
            <snippets-outlined />
            粘贴到内部
          </a-menu-item>
          <a-menu-divider />
          <a-menu-item key="create-bound-overlay" v-if="contextMenuNode && !contextMenuNode.isOverlay">
            <appstore-outlined />
            创建关联浮层
          </a-menu-item>
          <a-menu-divider v-if="contextMenuNode && !contextMenuNode.isOverlay" />
          <a-menu-item key="delete" :disabled="contextMenuNode?.locked">
            <delete-outlined />
            删除
          </a-menu-item>
          <a-menu-divider />
        </a-menu>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch, nextTick } from 'vue'
import { message, Modal } from 'ant-design-vue'
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
  SnippetsOutlined,
  VerticalAlignTopOutlined,
  VerticalAlignBottomOutlined,
  AppstoreOutlined,
  FileOutlined,
  GlobalOutlined,
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
  isOverlay?: boolean // 标记是否为浮层节点
  isActive?: boolean // 标记浮层是否已打开
  children?: TreeNode[]
  control: Control
}

interface Props {
  controls: Control[]
  overlays?: Control[] // 新增浮层列表
  selectedControlId?: string
  viewId: string
  hasClipboardData?: boolean
  openOverlayIds?: string[] // 新增已打开的浮层ID列表
  currentCanvas?: 'page' | 'overlay' // 当前画布模式
}

const props = withDefaults(defineProps<Props>(), {
  controls: () => [],
  overlays: () => [],
  selectedControlId: '',
  viewId: '',
  hasClipboardData: false,
  openOverlayIds: () => [],
  currentCanvas: 'page',
})

// 事件定义
const emit = defineEmits<{
  'control-select': [controlId: string]
  'control-delete': [controlId: string]
  'control-copy': [control: Control]
  'control-paste': [targetId: string, position?: 'before' | 'after' | 'inside']
  'control-move': [controlId: string, targetId: string, position: 'before' | 'after' | 'inside']
  'control-move-up': [controlId: string]
  'control-move-down': [controlId: string]
  'control-toggle-visibility': [controlId: string]
  'control-toggle-lock': [controlId: string]
  'control-rename': [controlId: string, newName?: string]
  'control-hover': [controlId: string, isHover: boolean]
  'control-add-event': [payload: { controlId: string; eventType: string; action: any }]
  'controls-select-all': []
  'controls-clear-selection': []
  'canvas-switch': [canvas: 'page' | 'overlay', overlayId?: string]
  'overlay-create': [overlay: Control]
  'overlay-select': [overlayId: string]
  'overlay-delete': [overlayId: string]
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
const activeView = ref<'all' | 'page' | 'overlay'>('all')

// 同步 activeView 和 currentCanvas
watch(
  () => props.currentCanvas,
  newCanvas => {
    if (newCanvas === 'page' && activeView.value !== 'page') {
      activeView.value = 'page'
    } else if (newCanvas === 'overlay' && activeView.value !== 'overlay') {
      activeView.value = 'overlay'
    }
  },
  { immediate: true }
)

// 当用户切换视图时，通知父组件并自动切换画布
watch(activeView, newView => {
  if (newView === 'page') {
    emit('canvas-switch', 'page')
  } else if (newView === 'overlay') {
    // 切换到浮层视图时，自动选择第一个浮层
    if (props.overlays && props.overlays.length > 0) {
      const firstOverlay = props.overlays[0]
      emit('canvas-switch', 'overlay', firstOverlay.id)
      emit('overlay-select', firstOverlay.id)
    } else {
      // 如果没有浮层，提示用户创建
      message.info('当前没有浮层，请点击"创建浮层"按钮')
      // 保持在页面视图
      activeView.value = 'page'
    }
  }
  // 'all' 视图时，默认使用 page 模式
  else if (newView === 'all') {
    emit('canvas-switch', 'page')
  }
})

// 视图选项
const viewOptions = [
  { value: 'all', title: '全部' },
  { value: 'page', title: '页面' },
  { value: 'overlay', title: '浮层' },
]

// 计算属性
const isSearching = computed(() => searchKeyword.value.trim().length > 0)
const isEmpty = computed(() => {
  if (activeView.value === 'page') {
    return props.controls.length === 0
  } else if (activeView.value === 'overlay') {
    return (props.overlays?.length || 0) === 0
  }
  return props.controls.length === 0 && (props.overlays?.length || 0) === 0
})
const pageControlCount = computed(() => countControls(props.controls))
const overlayCount = computed(() => props.overlays?.length || 0)
const totalControls = computed(() => pageControlCount.value + countControls(props.overlays || []))
const hasClipboard = computed(() => props.hasClipboardData)
const canPasteInside = computed(() => {
  if (!contextMenuNode.value) return false
  // 只有容器类型的控件可以粘贴到内部
  const containerTypes = ['flex', 'grid', 'mobile-container', 'container']
  return containerTypes.includes(contextMenuNode.value.kind.toLowerCase())
})

const treeData = computed(() => {
  const pageNodes = buildTreeData(props.controls)
  const overlayNodes = buildOverlayTreeData(props.overlays || [])

  // 根据当前视图返回对应的数据
  if (activeView.value === 'page') {
    return pageNodes
  } else if (activeView.value === 'overlay') {
    return overlayNodes
  }

  // 'all' - 返回所有数据
  return [...pageNodes, ...overlayNodes]
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
      hasError: false,
      control,
    }

    if (control.children && control.children.length > 0) {
      node.children = buildTreeData(control.children, key)
    }

    return node
  })
}

// 构建浮层树数据
const buildOverlayTreeData = (overlays: Control[]): TreeNode[] => {
  return overlays.map((overlay, index) => {
    const key = `overlay-${index}`
    const isActive = props.openOverlayIds?.includes(overlay.id) || false

    const node: TreeNode = {
      key,
      title: overlay.name || `浮层 ${index + 1}`,
      name: overlay.name || '',
      kind: overlay.kind || 'Overlay',
      hidden: false,
      locked: overlay.locked || false,
      hasError: false,
      isOverlay: true,
      isActive,
      control: overlay,
    }

    // 构建浮层内部的组件树
    if (overlay.children && overlay.children.length > 0) {
      node.children = buildTreeData(overlay.children, key)
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
    Overlay: 'appstore-outlined', // 浮层图标
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
    Overlay: '#9254de', // 浮层颜色
  }

  return colorMap[kind] || '#8c8c8c'
}

const getViewIcon = (view: string) => {
  const iconMap: Record<string, any> = {
    all: GlobalOutlined,
    page: FileOutlined,
    overlay: AppstoreOutlined,
  }
  return iconMap[view] || FileOutlined
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

const handleDrop = (info: any) => {
  try {
    const { node, dragNode, dropPosition, dropToGap } = info

    if (!node || !dragNode || !node.control || !dragNode.control) {
      console.warn('拖拽信息不完整', info)
      return
    }

    // 检查是否是浮层组件的拖拽（从组件库拖拽）
    // 浮层组件的 kind 应该是 'overlay-container' (deprecated) 或 'Overlay'
    // ⚠️ Note: 'overlay-container' is deprecated, prefer using 'Modal' component
    const isOverlayComponent = dragNode.control.kind === 'overlay-container' || dragNode.control.kind === 'Overlay'

    if (isOverlayComponent) {
      // 处理浮层组件的拖拽 - 创建新的浮层实例
      handleOverlayDrop(dragNode)
      return
    }

    const targetId = node.control.id
    const dragId = dragNode.control.id

    // 不能拖拽到自己
    if (dragId === targetId) {
      return
    }

    let position: 'before' | 'after' | 'inside'

    // dropToGap 为 true 表示拖拽到节点之间的间隙
    // dropToGap 为 false 表示拖拽到节点内部
    if (!dropToGap) {
      position = 'inside'
    } else {
      // dropPosition 是相对于目标节点的位置
      // -1 表示在目标节点之前，1 表示在目标节点之后
      position = dropPosition === -1 ? 'before' : 'after'
    }

    emit('control-move', dragId, targetId, position)
  } catch (error) {
    console.error('拖拽处理失败:', error)
  }
}

/**
 * 处理浮层组件的拖拽
 * 从组件库拖拽浮层组件到大纲树时，创建新的浮层实例
 */
const handleOverlayDrop = (dragNode: any) => {
  try {
    console.log('🎯 [OutlineTree] 处理浮层组件拖拽', dragNode)

    // 创建新的浮层实例
    const overlayInstance = createOverlayInstance(dragNode.control)

    // 通知父组件添加浮层
    emit('overlay-create', overlayInstance)

    // 自动切换到浮层视图
    activeView.value = 'overlay'
    emit('canvas-switch', 'overlay')

    // 选中新创建的浮层
    emit('overlay-select', overlayInstance.id)

    message.success(`浮层 "${overlayInstance.name}" 已创建`)
  } catch (error) {
    console.error('❌ [OutlineTree] 创建浮层失败:', error)
    message.error('创建浮层失败')
  }
}

/**
 * 创建浮层实例
 * 生成唯一的浮层ID和初始配置
 */
const createOverlayInstance = (sourceControl: Control): Control => {
  // 生成唯一的浮层ID
  const overlayId = generateOverlayId()

  // 创建浮层实例
  const overlayInstance: Control = {
    id: overlayId,
    kind: 'overlay-container',
    name: `浮层 ${Date.now().toString().slice(-4)}`,
    props: {
      overlayId,
      overlayName: `浮层 ${Date.now().toString().slice(-4)}`,
      overlayType: 'modal',
      containerType: 'flex',
      containerProps: {
        direction: 'column',
        justify: 'flex-start',
        align: 'stretch',
        gap: 16,
      },
      width: 600,
      height: 400,
      position: 'center',
      closable: true,
      maskClosable: true,
      keyboard: true,
      ...sourceControl.props,
    },
    children: [],
    styles: {},
    events: {},
    locked: false,
  }

  console.log('✅ [OutlineTree] 浮层实例已创建:', overlayInstance)

  return overlayInstance
}

/**
 * 生成唯一的浮层ID
 * 格式: overlay_<timestamp>_<random>
 */
const generateOverlayId = (): string => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `overlay_${timestamp}_${random}`
}

/**
 * 处理浮层删除
 * 显示确认对话框，检查事件引用，删除浮层及其子组件
 */
const handleDeleteOverlay = (node: TreeNode) => {
  if (!node.isOverlay || !node.control) {
    console.warn('⚠️ [OutlineTree] 无效的浮层节点')
    return
  }

  const overlayId = node.control.id
  const overlayName = node.control.name || '浮层'

  // 检查浮层是否被事件引用
  const eventReferences = checkOverlayEventReferences(overlayId)

  // 构建确认对话框内容
  let content = `确定要删除浮层 "${overlayName}" 吗？`

  if (eventReferences.length > 0) {
    content += '\n\n⚠️ 警告：此浮层被以下组件的事件引用：\n'
    eventReferences.forEach(ref => {
      content += `\n• ${ref.controlName || ref.controlId} (${ref.eventType})`
    })
    content += '\n\n删除后，这些事件配置将失效。'
  }

  content += '\n\n此操作不可撤销。'

  // 显示确认对话框
  Modal.confirm({
    title: '删除浮层',
    content,
    okText: '确定删除',
    okType: 'danger',
    cancelText: '取消',
    onOk: () => {
      try {
        // 触发删除事件
        emit('overlay-delete', overlayId)

        // 显示成功消息
        if (eventReferences.length > 0) {
          message.warning(`浮层 "${overlayName}" 已删除，${eventReferences.length} 个事件引用已失效`)
        } else {
          message.success(`浮层 "${overlayName}" 已删除`)
        }

        console.log('✅ [OutlineTree] 浮层删除成功:', overlayId)
      } catch (error) {
        console.error('❌ [OutlineTree] 浮层删除失败:', error)
        message.error('删除浮层失败')
      }
    },
  })
}

/**
 * 检查浮层是否被事件引用
 * 遍历所有控件的事件配置，查找引用了指定浮层的事件
 */
const checkOverlayEventReferences = (overlayId: string): Array<{ controlId: string; controlName?: string; eventType: string }> => {
  const references: Array<{ controlId: string; controlName?: string; eventType: string }> = []

  // 递归检查控件树
  const checkControl = (control: Control) => {
    // 检查控件的事件配置
    if (control.events) {
      Object.entries(control.events).forEach(([eventType, eventConfig]) => {
        if (eventConfig && Array.isArray(eventConfig)) {
          // 检查事件动作链中是否引用了该浮层
          eventConfig.forEach((action: any) => {
            if ((action.type === 'OPEN_OVERLAY' || action.type === 'CLOSE_OVERLAY') && action.config?.overlayId === overlayId) {
              references.push({
                controlId: control.id,
                controlName: control.name,
                eventType,
              })
            }
          })
        }
      })
    }

    // 递归检查子控件
    if (control.children) {
      control.children.forEach(checkControl)
    }
  }

  // 检查页面控件
  props.controls.forEach(checkControl)

  // 检查其他浮层的控件
  if (props.overlays) {
    props.overlays.forEach(overlay => {
      if (overlay.id !== overlayId && overlay.children) {
        overlay.children.forEach(checkControl)
      }
    })
  }

  return references
}

const handleRightClick = ({ event, node }: any) => {
  event.preventDefault()
  event.stopPropagation()

  // 设置菜单位置
  contextMenuPosition.x = event.clientX
  contextMenuPosition.y = event.clientY
  contextMenuNode.value = node

  // 延迟显示菜单,避免闪烁
  nextTick(() => {
    contextMenuVisible.value = true
  })
}

const handleNodeHover = (node: TreeNode, isHover: boolean) => {
  // 节点悬停事件 - 可用于画布高亮显示
  emit('control-hover', node.control.id, isHover)
}

const toggleVisibility = (node: TreeNode) => {
  emit('control-toggle-visibility', node.control.id)
}

const toggleLock = (node: TreeNode) => {
  emit('control-toggle-lock', node.control.id)
}

const canMoveUp = (node: TreeNode) => {
  if (!node.control) return false
  const parent = findParentNode(treeData.value, node.key)
  if (!parent || !parent.children) return false
  const index = parent.children.findIndex(n => n.key === node.key)
  return index > 0
}

const canMoveDown = (node: TreeNode) => {
  if (!node.control) return false
  const parent = findParentNode(treeData.value, node.key)
  if (!parent || !parent.children) return false
  const index = parent.children.findIndex(n => n.key === node.key)
  return index < parent.children.length - 1
}

const findParentNode = (nodes: TreeNode[], targetKey: string, parent: TreeNode | null = null): TreeNode | null => {
  for (const node of nodes) {
    if (node.key === targetKey) return parent
    if (node.children) {
      const found = findParentNode(node.children, targetKey, node)
      if (found) return found
    }
  }
  return null
}

/**
 * 为指定组件创建关联浮层
 */
const handleCreateBoundOverlay = (node: TreeNode) => {
  try {
    const triggerControl = node.control
    const overlayId = generateOverlayId()
    const overlayName = `${triggerControl.name || triggerControl.kind} - 浮层`

    // 创建浮层实例，包含绑定信息
    const overlayInstance: Control = {
      id: overlayId,
      kind: 'overlay-container',
      name: overlayName,
      props: {
        overlayId,
        overlayName,
        overlayType: 'modal',

        // 绑定信息
        binding: {
          triggerControlId: triggerControl.id,
          triggerControlName: triggerControl.name || triggerControl.kind,
          triggerEventType: 'onClick',
          autoConfigEvent: true,
        },

        containerType: 'flex',
        containerProps: {
          direction: 'column',
          justify: 'flex-start',
          align: 'stretch',
          gap: 16,
        },
        width: 600,
        height: 400,
        position: 'center',
        closable: true,
        maskClosable: true,
        keyboard: true,
      },
      children: [],
      styles: {},
      events: {},
      locked: false,
    }

    // 通知父组件添加浮层
    emit('overlay-create', overlayInstance)

    // 自动配置触发组件的事件
    if (overlayInstance.props.binding?.autoConfigEvent) {
      emit('control-add-event', {
        controlId: triggerControl.id,
        eventType: 'onClick',
        action: {
          id: `action_${Date.now()}`,
          type: 'OPEN_OVERLAY',
          config: {
            overlayId: overlayId,
          },
          enabled: true,
        },
      })
    }

    // 切换到浮层视图
    activeView.value = 'overlay'
    emit('overlay-select', overlayId)

    message.success(`已为"${triggerControl.name || triggerControl.kind}"创建关联浮层`)
  } catch (error) {
    console.error('❌ [OutlineTree] 创建关联浮层失败:', error)
    message.error('创建关联浮层失败')
  }
}

const handleMenuClick = (info: any) => {
  const key = String(info.key)
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

const handleNodeAction = (info: any, node: TreeNode) => {
  const key = String(info.key)
  switch (key) {
    case 'copy':
      emit('control-copy', node.control)
      break
    case 'duplicate':
      emit('control-copy', node.control)
      emit('control-paste', node.control.id)
      break
    case 'delete':
      emit('control-delete', node.control.id)
      break
    case 'move-up':
      if (canMoveUp(node)) {
        emit('control-move-up', node.control.id)
      }
      break
    case 'move-down':
      if (canMoveDown(node)) {
        emit('control-move-down', node.control.id)
      }
      break
    case 'rename':
      emit('control-rename', node.control.id)
      break
    case 'properties':
      emit('control-select', node.control.id)
      break
  }
}

const handleContextMenuClick = (info: any) => {
  if (!contextMenuNode.value) return

  const key = String(info.key)
  switch (key) {
    case 'select':
      emit('control-select', contextMenuNode.value.control.id)
      break
    case 'copy':
      emit('control-copy', contextMenuNode.value.control)
      break
    case 'paste-before':
      if (contextMenuNode.value) {
        emit('control-paste', contextMenuNode.value.control.id, 'before')
      }
      break
    case 'paste-after':
      if (contextMenuNode.value) {
        emit('control-paste', contextMenuNode.value.control.id, 'after')
      }
      break
    case 'paste-inside':
      if (contextMenuNode.value) {
        emit('control-paste', contextMenuNode.value.control.id, 'inside')
      }
      break
    case 'create-bound-overlay':
      if (contextMenuNode.value) {
        handleCreateBoundOverlay(contextMenuNode.value)
      }
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
      const nodeKey = findNodeKeyById(treeData.value, newId)
      if (nodeKey) {
        selectedKeys.value = [nodeKey]
      }
    }
  },
  { immediate: true }
)

const findNodeKeyById = (nodes: TreeNode[], controlId: string): string | null => {
  for (const node of nodes) {
    if (node.control.id === controlId) return node.key
    if (node.children) {
      const found = findNodeKeyById(node.children, controlId)
      if (found) return found
    }
  }
  return null
}

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

// 监听浮层列表变化
watch(
  () => props.overlays,
  () => {
    // 浮层列表变化时，更新展开状态
    nextTick(() => {
      if (expandAll.value) {
        expandedKeys.value = getAllKeys(treeData.value)
      }
    })
  },
  { deep: true }
)

// 监听已打开的浮层ID列表变化，实时更新浮层状态
watch(
  () => props.openOverlayIds,
  () => {
    // 强制更新树数据以反映浮层状态变化
    nextTick(() => {
      // 树数据会自动重新计算，因为它依赖于 openOverlayIds
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

.view-tabs {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.5);
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
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

.tree-node-title.is-overlay {
  background: rgba(146, 84, 222, 0.08);
  border: 1px solid rgba(146, 84, 222, 0.2);
}

.tree-node-title.is-overlay-inactive {
  opacity: 0.6;
  background: rgba(146, 84, 222, 0.05);
  border-style: dashed;
}

.tree-node-title.is-overlay:hover {
  background: rgba(146, 84, 222, 0.12);
  border-color: rgba(146, 84, 222, 0.3);
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

/* 右键菜单样式 */
.context-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  background: transparent;
}

.context-menu {
  position: fixed;
  z-index: 10000;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 8px;
  box-shadow:
    0 6px 16px 0 rgba(0, 0, 0, 0.08),
    0 3px 6px -4px rgba(0, 0, 0, 0.12),
    0 9px 28px 8px rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(10px);
  overflow: hidden;
  min-width: 160px;
}

.context-menu :deep(.ant-menu) {
  background: transparent !important;
  border: none !important;
}

.context-menu :deep(.ant-menu-item) {
  color: #374151 !important;
  padding: 8px 16px !important;
  margin: 0 !important;
  border-radius: 0 !important;
}

.context-menu :deep(.ant-menu-item:hover) {
  background: rgba(59, 130, 246, 0.08) !important;
}

.context-menu :deep(.ant-menu-item-disabled) {
  color: #d1d5db !important;
  opacity: 0.5 !important;
}

.context-menu :deep(.ant-menu-item-divider) {
  margin: 4px 0 !important;
  background: rgba(0, 0, 0, 0.06) !important;
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
