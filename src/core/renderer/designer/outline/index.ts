// 大纲树组件
export { default as OutlineTree } from './OutlineTree.vue'

// 类型定义
export interface OutlineNode {
  id: string
  key: string
  title: string
  name: string
  kind: string
  hidden: boolean
  locked: boolean
  hasError: boolean
  level: number
  parentId?: string
  children?: OutlineNode[]
  control: any // Control 类型
}

export interface OutlineConfig {
  showHidden: boolean
  expandAll: boolean
  showIcons: boolean
  showBadges: boolean
  enableDrag: boolean
  enableSearch: boolean
}

export interface OutlineAction {
  key: string
  label: string
  icon: string
  disabled?: boolean
  danger?: boolean
  divider?: boolean
}

// 默认配置
export const defaultOutlineConfig: OutlineConfig = {
  showHidden: true,
  expandAll: false,
  showIcons: true,
  showBadges: true,
  enableDrag: true,
  enableSearch: true
}

// 预定义操作
export const defaultOutlineActions: OutlineAction[] = [
  { key: 'copy', label: '复制', icon: 'copy-outlined' },
  { key: 'duplicate', label: '复制并粘贴', icon: 'diff-outlined' },
  { key: 'delete', label: '删除', icon: 'delete-outlined', danger: true },
  { key: 'divider-1', label: '', icon: '', divider: true },
  { key: 'move-up', label: '上移', icon: 'arrow-up-outlined' },
  { key: 'move-down', label: '下移', icon: 'arrow-down-outlined' },
  { key: 'divider-2', label: '', icon: '', divider: true },
  { key: 'rename', label: '重命名', icon: 'edit-outlined' },
  { key: 'properties', label: '属性', icon: 'setting-outlined' }
]

// 控件图标映射
export const controlIconMap: Record<string, string> = {
  'span': 'font-size-outlined',
  'button': 'control-outlined',
  'string': 'field-string-outlined',
  'number': 'field-number-outlined',
  'boolean': 'check-square-outlined',
  'image': 'picture-outlined',
  'flex': 'layout-outlined',
  'grid': 'table-outlined',
  'table': 'table-outlined',
  'line-chart': 'line-chart-outlined',
  'bar-chart': 'bar-chart-outlined',
  'pie-chart': 'pie-chart-outlined',
  'mobile-container': 'mobile-outlined',
  'mobile-list': 'unordered-list-outlined',
  'svg-icon': 'star-outlined',
  'svg-shape': 'bg-colors-outlined'
}

// 控件颜色映射
export const controlColorMap: Record<string, string> = {
  'span': '#1890ff',
  'button': '#52c41a',
  'string': '#722ed1',
  'number': '#fa8c16',
  'boolean': '#13c2c2',
  'image': '#eb2f96',
  'flex': '#2f54eb',
  'grid': '#389e0d',
  'table': '#d48806',
  'line-chart': '#1890ff',
  'bar-chart': '#52c41a',
  'pie-chart': '#fa541c',
  'mobile-container': '#722ed1',
  'mobile-list': '#13c2c2',
  'svg-icon': '#eb2f96',
  'svg-shape': '#2f54eb'
}

// 工具函数
export const buildOutlineTree = (controls: any[], parentId?: string, level = 0): OutlineNode[] => {
  return controls.map((control, index) => {
    const node: OutlineNode = {
      id: control.id,
      key: parentId ? `${parentId}-${index}` : `${index}`,
      title: control.name || control.kind,
      name: control.name || '',
      kind: control.kind,
      hidden: control.styles?.display === 'none' || control.styles?.visibility === 'hidden',
      locked: control.locked || false,
      hasError: false, // TODO: 实现错误检测
      level,
      parentId,
      control
    }
    
    if (control.children && control.children.length > 0) {
      node.children = buildOutlineTree(control.children, node.id, level + 1)
    }
    
    return node
  })
}

export const findNodeById = (nodes: OutlineNode[], id: string): OutlineNode | null => {
  for (const node of nodes) {
    if (node.id === id) {
      return node
    }
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return null
}

export const findNodeByKey = (nodes: OutlineNode[], key: string): OutlineNode | null => {
  for (const node of nodes) {
    if (node.key === key) {
      return node
    }
    if (node.children) {
      const found = findNodeByKey(node.children, key)
      if (found) return found
    }
  }
  return null
}

export const getAllNodeKeys = (nodes: OutlineNode[]): string[] => {
  const keys: string[] = []
  const traverse = (nodes: OutlineNode[]) => {
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

export const searchNodes = (nodes: OutlineNode[], keyword: string): OutlineNode[] => {
  const result: OutlineNode[] = []
  const lowerKeyword = keyword.toLowerCase()
  
  for (const node of nodes) {
    const matches = node.name.toLowerCase().includes(lowerKeyword) || 
                   node.kind.toLowerCase().includes(lowerKeyword)
    
    let childMatches: OutlineNode[] = []
    if (node.children) {
      childMatches = searchNodes(node.children, keyword)
    }
    
    if (matches || childMatches.length > 0) {
      result.push({
        ...node,
        children: childMatches.length > 0 ? childMatches : node.children
      })
    }
  }
  
  return result
}

export const filterHiddenNodes = (nodes: OutlineNode[]): OutlineNode[] => {
  return nodes.filter(node => !node.hidden).map(node => ({
    ...node,
    children: node.children ? filterHiddenNodes(node.children) : undefined
  }))
}

export const countNodes = (nodes: OutlineNode[]): number => {
  let count = nodes.length
  nodes.forEach(node => {
    if (node.children) {
      count += countNodes(node.children)
    }
  })
  return count
}

export const getNodePath = (nodes: OutlineNode[], targetId: string): OutlineNode[] => {
  const path: OutlineNode[] = []
  
  const findPath = (nodes: OutlineNode[], targetId: string, currentPath: OutlineNode[]): boolean => {
    for (const node of nodes) {
      const newPath = [...currentPath, node]
      
      if (node.id === targetId) {
        path.push(...newPath)
        return true
      }
      
      if (node.children && findPath(node.children, targetId, newPath)) {
        return true
      }
    }
    return false
  }
  
  findPath(nodes, targetId, [])
  return path
}

export const canMoveNode = (
  nodes: OutlineNode[], 
  nodeId: string, 
  direction: 'up' | 'down'
): boolean => {
  // TODO: 实现移动判断逻辑
  return true
}

export const moveNode = (
  nodes: OutlineNode[], 
  nodeId: string, 
  direction: 'up' | 'down'
): OutlineNode[] => {
  // TODO: 实现节点移动逻辑
  return nodes
}

export const duplicateNode = (node: OutlineNode): OutlineNode => {
  const newNode: OutlineNode = {
    ...node,
    id: `${node.id}_copy_${Date.now()}`,
    key: `${node.key}_copy`,
    name: `${node.name} 副本`
  }
  
  if (node.children) {
    newNode.children = node.children.map(child => duplicateNode(child))
  }
  
  return newNode
}