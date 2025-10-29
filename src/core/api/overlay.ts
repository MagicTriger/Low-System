/**
 * 浮层 API 模块
 *
 * 提供浮层配置相关的 API 接口
 * 使用统一的命名约定和响应格式
 */

import { api } from './request'
import type { ApiResponse, ApiListResponse, ApiListParams, ApiCreateParams, ApiUpdateParams } from './types'
import type { EventAction } from './event-config'

/**
 * 浮层配置数据类型
 */
export interface OverlayConfig {
  id: string
  name: string
  title?: string
  width?: string | number
  height?: string | number
  visible?: boolean
  closable?: boolean
  maskClosable?: boolean
  controls: any[]
  /** 浮层打开时执行的事件动作链 */
  onOpen?: EventAction[]
  /** 浮层关闭时执行的事件动作链 */
  onClose?: EventAction[]
  /** 视图容器绑定 - 绑定到页面中的父组件ID */
  parentControlId?: string
  /** 视图容器绑定 - 浮层在页面大纲中的显示位置 */
  containerPosition?: 'inline' | 'floating'
  createdAt?: string
  updatedAt?: string
}

/**
 * 浮层列表查询参数
 */
export interface OverlayListParams extends ApiListParams {
  resourceCode: string
}

/**
 * 创建浮层参数
 */
export interface CreateOverlayParams {
  resourceCode: string
  name: string
  title?: string
  width?: string | number
  height?: string | number
  closable?: boolean
  maskClosable?: boolean
  controls: any[]
  /** 浮层打开时执行的事件动作链 */
  onOpen?: EventAction[]
  /** 浮层关闭时执行的事件动作链 */
  onClose?: EventAction[]
  /** 视图容器绑定 - 绑定到页面中的父组件ID */
  parentControlId?: string
  /** 视图容器绑定 - 浮层在页面大纲中的显示位置 */
  containerPosition?: 'inline' | 'floating'
}

/**
 * 更新浮层参数
 */
export interface UpdateOverlayParams {
  id: string
  data: Partial<OverlayConfig>
}

/**
 * 更新浮层顺序参数
 */
export interface UpdateOverlayOrderParams {
  resourceCode: string
  overlayIds: string[]
}

/**
 * 复制浮层参数
 */
export interface CopyOverlayParams {
  id: string
  name: string
}

/**
 * 浮层 API 服务
 */
export const overlayApi = {
  /**
   * 获取页面的所有浮层配置
   * GET /overlay/list
   */
  getList(params: OverlayListParams) {
    return api.get<ApiListResponse<OverlayConfig>>('/overlay/list', { params })
  },

  /**
   * 获取单个浮层配置
   * GET /overlay/:id
   */
  get(id: string) {
    return api.get<OverlayConfig>(`/overlay/${id}`)
  },

  /**
   * 创建浮层
   * POST /overlay/create
   */
  create(data: CreateOverlayParams) {
    return api.post<OverlayConfig>('/overlay/create', data)
  },

  /**
   * 更新浮层配置
   * PUT /overlay/:id
   */
  update(id: string, data: Partial<OverlayConfig>) {
    return api.put<OverlayConfig>(`/overlay/${id}`, data)
  },

  /**
   * 删除浮层
   * DELETE /overlay/:id
   */
  delete(id: string) {
    return api.delete<boolean>(`/overlay/${id}`)
  },

  /**
   * 批量更新浮层顺序
   * POST /overlay/order
   */
  updateOrder(data: UpdateOverlayOrderParams) {
    return api.post<boolean>('/overlay/order', data)
  },

  /**
   * 复制浮层
   * POST /overlay/:id/copy
   */
  copy(params: CopyOverlayParams) {
    return api.post<OverlayConfig>(`/overlay/${params.id}/copy`, { name: params.name })
  },
}

// ============================================================================
// 向后兼容的类型别名
// ============================================================================

/**
 * @deprecated 使用 ApiListResponse<OverlayConfig> 替代
 */
export type OverlayListResponse = ApiListResponse<OverlayConfig>
