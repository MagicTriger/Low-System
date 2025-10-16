import { api } from './request'
import type { ApiResponse, ResourceDTO, DesignDTO } from '../types'

// 设计器相关API
export const designerApi = {
  // 获取页面设计数据
  get(params: { resourceCode: string }) {
    return api.get<DesignDTO>('/designer/page', { params })
  },
  
  // 保存页面设计数据
  save(data: { resourceCode: string; designData: DesignDTO }) {
    return api.post<boolean>('/designer/page', data)
  },
  
  // 发布页面
  publish(params: { resourceCode: string }) {
    return api.post<boolean>('/designer/publish', params)
  },
  
  // 预览页面
  preview(params: { resourceCode: string }) {
    return api.get<DesignDTO>('/designer/preview', { params })
  },
  
  // 获取页面列表
  getPageList(params?: { keyword?: string; page?: number; pageSize?: number }) {
    return api.get<{ list: ResourceDTO[]; total: number }>('/designer/pages', { params })
  },
  
  // 创建新页面
  createPage(data: { name: string; code: string; description?: string }) {
    return api.post<ResourceDTO>('/designer/page/create', data)
  },
  
  // 删除页面
  deletePage(id: string) {
    return api.delete(`/designer/page/${id}`)
  },
  
  // 复制页面
  copyPage(id: string, name: string) {
    return api.post<ResourceDTO>(`/designer/page/${id}/copy`, { name })
  },
  
  // 获取组件库
  getComponents() {
    return api.get<any[]>('/designer/components')
  },
  
  // 上传组件
  uploadComponent(file: File) {
    return api.upload<{ url: string }>('/designer/component/upload', file)
  }
}