/**
 * 客户端配置
 * 已废弃：不再使用系统内置客户端，改用纯后端数据
 */

import type { MenuTreeNode } from '@/core/api/menu'

/**
 * 客户端配置接口
 */
export interface ClientConfig {
  id: number
  parentId: null
  menuCode: string
  name: string
  module: string
  nodeType: number
  nodeTypeText: string
  sortOrder: number
  icon: string
  path: string
  description?: string
  createdAt: string
}

/**
 * 获取默认客户端数据
 * @deprecated 不再使用系统内置客户端，改用纯后端数据
 */
export function getDefaultClients(): MenuTreeNode[] {
  // 返回空数组，不再使用内置客户端
  return []
}

/**
 * 检查是否为系统客户端
 * @deprecated 不再使用系统内置客户端
 */
export function isSystemClient(id: number, menuCode?: string): boolean {
  return false
}

/**
 * 获取客户端配置
 * @deprecated 不再使用系统内置客户端
 */
export function getClientConfig(id: number): ClientConfig | undefined {
  return undefined
}

/**
 * 获取所有客户端 ID
 * @deprecated 不再使用系统内置客户端
 */
export function getSystemClientIds(): number[] {
  return []
}
