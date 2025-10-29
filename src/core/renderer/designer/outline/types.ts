/**
 * 大纲树类型定义
 * 支持页面组件和浮层组件的统一管理
 */

import type { Control } from '../../base'

/**
 * 基础大纲节点接口
 */
export interface OutlineNode {
  /** 节点唯一标识 */
  id: string
  /** 节点键值（用于树组件） */
  key: string
  /** 节点标题 */
  title: string
  /** 节点名称 */
  name: string
  /** 组件类型 */
  kind: string
  /** 是否隐藏 */
  hidden: boolean
  /** 是否锁定 */
  locked: boolean
  /** 是否有错误 */
  hasError: boolean
  /** 节点层级 */
  level: number
  /** 父节点ID */
  parentId?: string
  /** 子节点列表 */
  children?: OutlineNode[]
  /** 关联的控件对象 */
  control: Control
}

/**
 * 浮层大纲节点接口
 * 扩展自基础大纲节点，添加浮层特有属性
 */
export interface OverlayOutlineNode extends OutlineNode {
  /** 标记为浮层节点 */
  isOverlay: true
  /** 浮层是否已打开/激活 */
  isActive: boolean
  /** 浮层唯一ID */
  overlayId: string
  /** 浮层类型 */
  overlayType: 'modal' | 'drawer' | 'fullscreen'
  /** 浮层配置属性 */
  overlayProps?: {
    /** 浮层名称 */
    overlayName?: string
    /** 视图容器类型 */
    containerType?: 'flex' | 'grid' | 'custom'
    /** 视图容器属性 */
    containerProps?: Record<string, any>
    /** 目标视图 */
    targetView?: string
    /** 宽度 */
    width?: string | number
    /** 高度 */
    height?: string | number
    /** 显示位置 */
    position?: 'center' | 'top' | 'right' | 'bottom' | 'left'
    /** 是否可关闭 */
    closable?: boolean
    /** 点击遮罩是否可关闭 */
    maskClosable?: boolean
    /** 是否支持键盘ESC关闭 */
    keyboard?: boolean
  }
}

/**
 * 大纲树数据结构
 * 包含页面节点和浮层节点的分离数据
 */
export interface OutlineTreeData {
  /** 页面组件节点列表 */
  pageNodes: OutlineNode[]
  /** 浮层节点列表 */
  overlayNodes: OverlayOutlineNode[]
}

/**
 * 大纲树配置接口
 */
export interface OutlineConfig {
  /** 是否显示隐藏的节点 */
  showHidden: boolean
  /** 是否展开所有节点 */
  expandAll: boolean
  /** 是否显示图标 */
  showIcons: boolean
  /** 是否显示徽章 */
  showBadges: boolean
  /** 是否启用拖拽 */
  enableDrag: boolean
  /** 是否启用搜索 */
  enableSearch: boolean
}

/**
 * 大纲树操作接口
 */
export interface OutlineAction {
  /** 操作键值 */
  key: string
  /** 操作标签 */
  label: string
  /** 操作图标 */
  icon: string
  /** 是否禁用 */
  disabled?: boolean
  /** 是否为危险操作 */
  danger?: boolean
  /** 是否为分隔线 */
  divider?: boolean
}

/**
 * 大纲树视图类型
 */
export type OutlineViewType = 'all' | 'page' | 'overlay'

/**
 * 节点移动位置
 */
export type NodeDropPosition = 'before' | 'after' | 'inside'

/**
 * 节点移动方向
 */
export type NodeMoveDirection = 'up' | 'down'

/**
 * 大纲树事件类型
 */
export interface OutlineTreeEvents {
  /** 节点选择事件 */
  'node-select': (nodeId: string) => void
  /** 节点删除事件 */
  'node-delete': (nodeId: string) => void
  /** 节点复制事件 */
  'node-copy': (node: OutlineNode | OverlayOutlineNode) => void
  /** 节点粘贴事件 */
  'node-paste': (targetId: string, position: NodeDropPosition) => void
  /** 节点移动事件 */
  'node-move': (nodeId: string, targetId: string, position: NodeDropPosition) => void
  /** 节点可见性切换事件 */
  'node-toggle-visibility': (nodeId: string) => void
  /** 节点锁定切换事件 */
  'node-toggle-lock': (nodeId: string) => void
  /** 节点重命名事件 */
  'node-rename': (nodeId: string, newName: string) => void
  /** 全选事件 */
  'select-all': () => void
  /** 清除选择事件 */
  'clear-selection': () => void
  /** 画布切换事件 */
  'canvas-switch': (canvas: 'page' | 'overlay') => void
  /** 浮层选择事件 */
  'overlay-select': (overlayId: string) => void
}

/**
 * 类型守卫：判断节点是否为浮层节点
 */
export function isOverlayNode(node: OutlineNode | OverlayOutlineNode): node is OverlayOutlineNode {
  return 'isOverlay' in node && node.isOverlay === true
}

/**
 * 类型守卫：判断节点是否为普通页面节点
 */
export function isPageNode(node: OutlineNode | OverlayOutlineNode): node is OutlineNode {
  return !('isOverlay' in node) || node.isOverlay !== true
}

/**
 * 默认大纲树配置
 */
export const defaultOutlineConfig: OutlineConfig = {
  showHidden: true,
  expandAll: false,
  showIcons: true,
  showBadges: true,
  enableDrag: true,
  enableSearch: true,
}

/**
 * 预定义的大纲树操作
 */
export const defaultOutlineActions: OutlineAction[] = [
  { key: 'copy', label: '复制', icon: 'copy-outlined' },
  { key: 'duplicate', label: '复制并粘贴', icon: 'diff-outlined' },
  { key: 'delete', label: '删除', icon: 'delete-outlined', danger: true },
  { key: 'divider-1', label: '', icon: '', divider: true },
  { key: 'move-up', label: '上移', icon: 'arrow-up-outlined' },
  { key: 'move-down', label: '下移', icon: 'arrow-down-outlined' },
  { key: 'divider-2', label: '', icon: '', divider: true },
  { key: 'rename', label: '重命名', icon: 'edit-outlined' },
  { key: 'properties', label: '属性', icon: 'setting-outlined' },
]

/**
 * 控件图标映射
 */
export const controlIconMap: Record<string, string> = {
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
  'overlay-container': 'appstore-outlined', // ⚠️ DEPRECATED: Use 'Modal' instead
  Overlay: 'appstore-outlined',
}

/**
 * 控件颜色映射
 */
export const controlColorMap: Record<string, string> = {
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
  'overlay-container': '#faad14', // Changed to warning color (deprecated)
  Overlay: '#9254de',
}
