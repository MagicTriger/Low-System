import type { RootView } from '@/core/types'
import request from '@/core/api/request'

/**
 * 设计器 API 服务
 */

// 保存设计
export interface SaveDesignRequest {
  id?: string
  name: string
  rootView: RootView
  dataSources?: Record<string, any>
  dataTransfers?: Record<string, any>
}

export interface SaveDesignResponse {
  id: string
  name: string
  createTime: string
  updateTime: string
}

// 加载设计
export interface LoadDesignResponse {
  id: string
  name: string
  rootView: RootView
  dataSources?: Record<string, any>
  dataTransfers?: Record<string, any>
  createTime: string
  updateTime: string
}

// 设计列表项
export interface DesignListItem {
  id: string
  name: string
  description?: string
  thumbnail?: string
  createTime: string
  updateTime: string
}

/**
 * 保存设计
 */
export function saveDesign(data: SaveDesignRequest) {
  return request<SaveDesignResponse>({
    url: data.id ? `/api/designer/${data.id}` : '/api/designer',
    method: data.id ? 'PUT' : 'POST',
    data,
  })
}

/**
 * 加载设计
 */
export function loadDesign(id: string) {
  return request<LoadDesignResponse>({
    url: `/api/designer/${id}`,
    method: 'GET',
  })
}

/**
 * 获取设计列表
 */
export function getDesignList(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request<{ list: DesignListItem[]; total: number }>({
    url: '/api/designer/list',
    method: 'GET',
    params,
  })
}

/**
 * 删除设计
 */
export function deleteDesign(id: string) {
  return request<{ success: boolean }>({
    url: `/api/designer/${id}`,
    method: 'DELETE',
  })
}

/**
 * 复制设计
 */
export function duplicateDesign(id: string, name: string) {
  return request<SaveDesignResponse>({
    url: `/api/designer/${id}/duplicate`,
    method: 'POST',
    data: { name },
  })
}

/**
 * 导出设计为 JSON
 */
export function exportDesign(id: string) {
  return request<LoadDesignResponse>({
    url: `/api/designer/${id}/export`,
    method: 'GET',
  })
}

/**
 * 导入设计
 */
export function importDesign(data: any) {
  return request<SaveDesignResponse>({
    url: '/api/designer/import',
    method: 'POST',
    data,
  })
}
