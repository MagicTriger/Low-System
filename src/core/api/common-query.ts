import { api } from './request'
import type { ApiResponse, PageResponse, Pagination } from '../types'

// 通用查询参数
export interface QueryParams {
  page?: number
  pageSize?: number
  keyword?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
}

// 通用查询API
export const commonQueryApi = {
  // 分页查询
  query<T = any>(url: string, params?: QueryParams) {
    return api.get<PageResponse<T>>(url, { params })
  },

  // 获取单个资源
  get<T = any>(url: string, id: string | number) {
    return api.get<T>(`${url}/${id}`)
  },

  // 创建资源
  create<T = any>(url: string, data: any) {
    return api.post<T>(url, data)
  },

  // 更新资源
  update<T = any>(url: string, id: string | number, data: any) {
    return api.put<T>(`${url}/${id}`, data)
  },

  // 删除资源
  delete(url: string, id: string | number) {
    return api.delete(`${url}/${id}`)
  },

  // 批量删除
  batchDelete(url: string, ids: (string | number)[]) {
    return api.post(`${url}/batch-delete`, { ids })
  },

  // 导出数据
  export(url: string, params?: QueryParams) {
    return api.download(`${url}/export`, 'export.xlsx', { params })
  },
}
