/**
 * 设计器 API 模块
 *
 * 提供页面设计相关的 API 接口
 * 使用统一的命名约定和响应格式
 */

import { api } from './request'
import type { ApiResponse, ApiListResponse, ApiQueryParams, ResourceDTO, DesignDTO } from './types'

/**
 * 设计器查询参数
 */
export interface DesignerQueryParams extends ApiQueryParams {
  /** 资源类型 */
  type?: string
  /** 状态 */
  status?: string
}

/**
 * 创建页面参数
 */
export interface CreatePageParams {
  /** 页面名称 */
  name: string
  /** 页面编码 */
  code: string
  /** 页面描述 */
  description?: string
  /** 页面类型 */
  type?: string
}

/**
 * 保存设计数据参数
 */
export interface SaveDesignParams {
  /** 资源代码 */
  resourceCode: string
  /** 设计数据 */
  designData: DesignDTO
}

/**
 * 复制页面参数
 */
export interface CopyPageParams {
  /** 源页面ID */
  id: string
  /** 新页面名称 */
  name: string
}

/**
 * 组件上传响应
 */
export interface ComponentUploadResponse {
  /** 组件URL */
  url: string
  /** 组件ID */
  id?: string
  /** 组件名称 */
  name?: string
}

/**
 * 设计器 API 服务
 */
export const designerApi = {
  /**
   * 获取页面设计数据
   * GET /designer/page
   */
  get(params: { resourceCode: string }) {
    return api.get<DesignDTO>('/designer/page', { params })
  },

  /**
   * 保存页面设计数据
   * POST /designer/page
   */
  save(data: SaveDesignParams) {
    return api.post<boolean>('/designer/page', data)
  },

  /**
   * 发布页面
   * POST /designer/publish
   */
  publish(params: { resourceCode: string }) {
    return api.post<boolean>('/designer/publish', params)
  },

  /**
   * 预览页面
   * GET /designer/preview
   */
  preview(params: { resourceCode: string }) {
    return api.get<DesignDTO>('/designer/preview', { params })
  },

  /**
   * 获取页面列表
   * GET /designer/pages
   */
  getList(params?: DesignerQueryParams) {
    return api.get<ApiListResponse<ResourceDTO>>('/designer/pages', { params })
  },

  /**
   * 创建新页面
   * POST /designer/page/create
   */
  create(data: CreatePageParams) {
    return api.post<ResourceDTO>('/designer/page/create', data)
  },

  /**
   * 删除页面
   * DELETE /designer/page/:id
   */
  delete(id: string) {
    return api.delete<boolean>(`/designer/page/${id}`)
  },

  /**
   * 复制页面
   * POST /designer/page/:id/copy
   */
  copy(params: CopyPageParams) {
    return api.post<ResourceDTO>(`/designer/page/${params.id}/copy`, { name: params.name })
  },

  /**
   * 获取组件库
   * GET /designer/components
   */
  getComponents() {
    return api.get<any[]>('/designer/components')
  },

  /**
   * 上传组件
   * POST /designer/component/upload
   */
  uploadComponent(file: File) {
    return api.upload<ComponentUploadResponse>('/designer/component/upload', file)
  },

  // ========== 向后兼容的方法别名 ==========

  /**
   * @deprecated 使用 getList 替代
   */
  getPageList(params?: { keyword?: string; page?: number; pageSize?: number }) {
    return this.getList(params)
  },

  /**
   * @deprecated 使用 create 替代
   */
  createPage(data: CreatePageParams) {
    return this.create(data)
  },

  /**
   * @deprecated 使用 delete 替代
   */
  deletePage(id: string) {
    return this.delete(id)
  },

  /**
   * @deprecated 使用 copy 替代
   */
  copyPage(id: string, name: string) {
    return this.copy({ id, name })
  },
}
