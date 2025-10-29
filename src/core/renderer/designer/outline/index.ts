// 大纲树组件
export { default as OutlineTree } from './OutlineTree.vue'

// 类型定义 - 从 types.ts 导出
export type {
  OutlineNode,
  OverlayOutlineNode,
  OutlineTreeData,
  OutlineConfig,
  OutlineAction,
  OutlineViewType,
  NodeDropPosition,
  NodeMoveDirection,
  OutlineTreeEvents,
} from './types'

// 类型守卫
export { isOverlayNode, isPageNode } from './types'

// 默认配置和常量
export { defaultOutlineConfig, defaultOutlineActions, controlIconMap, controlColorMap } from './types'

// 工具函数
import type { Control } from '../../base'
import type { OutlineNode, OverlayOutlineNode, OutlineTreeData } from './types'

/**
 * 构建页面组件的大纲树
 */
export const buildOutlineTree = (controls: Control[], parentId?: string, level = 0): OutlineNode[] => {
  return controls.map((control, index) => {
    const node: OutlineNode = {
      id: control.id,
      key: parentId ? `${parentId}-${index}` : `${index}`,
      title: control.name || control.kind,
      name: control.name || '',
      kind: control.kind,
      hidden: control.styles?.display === 'none' || control.styles?.visibility === 'hidden',
      locked: control.locked || false,
      hasError: false,
      level,
      parentId,
      control,
    }

    if (control.children && control.children.length > 0) {
      node.children = buildOutlineTree(control.children, node.id, level + 1)
    }

    return node
  })
}

/**
 * 构建浮层组件的大纲树
 */
export const buildOverlayOutlineTree = (overlays: Control[], openOverlayIds: string[] = []): OverlayOutlineNode[] => {
  return overlays.map((overlay, index) => {
    const overlayId = overlay.id
    const isActive = openOverlayIds.includes(overlayId)

    const node: OverlayOutlineNode = {
      id: overlayId,
      key: `overlay-${index}`,
      title: overlay.name || `浮层 ${index + 1}`,
      name: overlay.name || '',
      kind: overlay.kind || 'overlay-container',
      hidden: false,
      locked: overlay.locked || false,
      hasError: false,
      level: 0,
      isOverlay: true,
      isActive,
      overlayId,
      overlayType: overlay.props?.overlayType || 'modal',
      overlayProps: overlay.props,
      control: overlay,
    }

    // 构建浮层内部的组件树
    if (overlay.children && overlay.children.length > 0) {
      node.children = buildOutlineTree(overlay.children, node.id, 1)
    }

    return node
  })
}

/**
 * 构建完整的大纲树数据（包含页面和浮层）
 */
export const buildOutlineTreeData = (
  pageControls: Control[],
  overlayControls: Control[] = [],
  openOverlayIds: string[] = []
): OutlineTreeData => {
  return {
    pageNodes: buildOutlineTree(pageControls),
    overlayNodes: buildOverlayOutlineTree(overlayControls, openOverlayIds),
  }
}

/**
 * 根据ID查找节点
 */
export const findNodeById = (nodes: (OutlineNode | OverlayOutlineNode)[], id: string): OutlineNode | OverlayOutlineNode | null => {
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

/**
 * 根据key查找节点
 */
export const findNodeByKey = (nodes: (OutlineNode | OverlayOutlineNode)[], key: string): OutlineNode | OverlayOutlineNode | null => {
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

/**
 * 获取所有节点的key
 */
export const getAllNodeKeys = (nodes: (OutlineNode | OverlayOutlineNode)[]): string[] => {
  const keys: string[] = []
  const traverse = (nodes: (OutlineNode | OverlayOutlineNode)[]) => {
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

/**
 * 搜索节点
 */
export const searchNodes = (nodes: (OutlineNode | OverlayOutlineNode)[], keyword: string): (OutlineNode | OverlayOutlineNode)[] => {
  const result: (OutlineNode | OverlayOutlineNode)[] = []
  const lowerKeyword = keyword.toLowerCase()

  for (const node of nodes) {
    const matches = node.name.toLowerCase().includes(lowerKeyword) || node.kind.toLowerCase().includes(lowerKeyword)

    let childMatches: (OutlineNode | OverlayOutlineNode)[] = []
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

/**
 * 过滤隐藏的节点
 */
export const filterHiddenNodes = (nodes: (OutlineNode | OverlayOutlineNode)[]): (OutlineNode | OverlayOutlineNode)[] => {
  return nodes
    .filter(node => !node.hidden)
    .map(node => ({
      ...node,
      children: node.children ? filterHiddenNodes(node.children) : undefined,
    }))
}

/**
 * 统计节点数量
 */
export const countNodes = (nodes: (OutlineNode | OverlayOutlineNode)[]): number => {
  let count = nodes.length
  nodes.forEach(node => {
    if (node.children) {
      count += countNodes(node.children)
    }
  })
  return count
}

/**
 * 获取节点路径
 */
export const getNodePath = (nodes: (OutlineNode | OverlayOutlineNode)[], targetId: string): (OutlineNode | OverlayOutlineNode)[] => {
  const path: (OutlineNode | OverlayOutlineNode)[] = []

  const findPath = (
    nodes: (OutlineNode | OverlayOutlineNode)[],
    targetId: string,
    currentPath: (OutlineNode | OverlayOutlineNode)[]
  ): boolean => {
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

/**
 * 判断节点是否可以移动
 */
export const canMoveNode = (nodes: (OutlineNode | OverlayOutlineNode)[], nodeId: string, direction: 'up' | 'down'): boolean => {
  const findNodeWithSiblings = (
    nodeList: (OutlineNode | OverlayOutlineNode)[],
    targetId: string
  ): { node: OutlineNode | OverlayOutlineNode; siblings: (OutlineNode | OverlayOutlineNode)[]; index: number } | null => {
    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i]
      if (node.id === targetId) {
        return { node, siblings: nodeList, index: i }
      }
      if (node.children) {
        const found = findNodeWithSiblings(node.children, targetId)
        if (found) return found
      }
    }
    return null
  }

  const result = findNodeWithSiblings(nodes, nodeId)
  if (!result) return false

  const { index, siblings } = result
  if (direction === 'up') return index > 0
  if (direction === 'down') return index < siblings.length - 1
  return false
}

/**
 * 移动节点
 */
export const moveNode = (
  nodes: (OutlineNode | OverlayOutlineNode)[],
  nodeId: string,
  direction: 'up' | 'down'
): (OutlineNode | OverlayOutlineNode)[] => {
  const clonedNodes = JSON.parse(JSON.stringify(nodes))

  const findAndMove = (nodeList: (OutlineNode | OverlayOutlineNode)[]): boolean => {
    for (let i = 0; i < nodeList.length; i++) {
      if (nodeList[i].id === nodeId) {
        const targetIndex = direction === 'up' ? i - 1 : i + 1
        if (targetIndex >= 0 && targetIndex < nodeList.length) {
          ;[nodeList[i], nodeList[targetIndex]] = [nodeList[targetIndex], nodeList[i]]
          return true
        }
        return false
      }
      if (nodeList[i].children) {
        if (findAndMove(nodeList[i].children!)) return true
      }
    }
    return false
  }

  findAndMove(clonedNodes)
  return clonedNodes
}

/**
 * 复制节点
 */
export const duplicateNode = (node: OutlineNode | OverlayOutlineNode): OutlineNode | OverlayOutlineNode => {
  const newNode = {
    ...node,
    id: `${node.id}_copy_${Date.now()}`,
    key: `${node.key}_copy`,
    name: `${node.name} 副本`,
  }

  if (node.children) {
    newNode.children = node.children.map(child => duplicateNode(child))
  }

  return newNode
}
