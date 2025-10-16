/**
 * 客户端配置
 * 定义系统内置的客户端类型
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
 * 系统内置客户端配置
 * 这些客户端不能被编辑或删除
 */
export const SYSTEM_CLIENTS: ClientConfig[] = [
  {
    id: 1,
    parentId: null,
    menuCode: 'designer',
    name: '设计端',
    module: 'designer',
    nodeType: 1,
    nodeTypeText: '客户端',
    sortOrder: 1,
    icon: 'desktop',
    path: '/designer',
    description: '低代码设计器，用于可视化设计页面和组件',
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    parentId: null,
    menuCode: 'admin',
    name: '管理端',
    module: 'admin',
    nodeType: 1,
    nodeTypeText: '客户端',
    sortOrder: 2,
    icon: 'desktop',
    path: '/admin',
    description: '系统管理后台，用于管理用户、权限、资源等',
    createdAt: new Date().toISOString(),
  },
]

/**
 * 获取默认客户端数据
 */
export function getDefaultClients(): MenuTreeNode[] {
  return SYSTEM_CLIENTS.map(client => ({
    ...client,
    nodeType: client.nodeType as 1 | 2 | 3,
    children: [],
  }))
}

/**
 * 检查是否为系统客户端
 */
export function isSystemClient(id: number, menuCode?: string): boolean {
  return SYSTEM_CLIENTS.some(client => client.id === id || (menuCode && client.menuCode === menuCode))
}

/**
 * 获取客户端配置
 */
export function getClientConfig(id: number): ClientConfig | undefined {
  return SYSTEM_CLIENTS.find(client => client.id === id)
}

/**
 * 获取所有客户端 ID
 */
export function getSystemClientIds(): number[] {
  return SYSTEM_CLIENTS.map(client => client.id)
}
