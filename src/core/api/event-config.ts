/**
 * 事件配置 API 模块
 *
 * 提供事件配置相关的 API 接口
 * 使用统一的命名约定和响应格式
 */

import { api } from './request'
import type { ApiResponse, ApiListResponse, ApiListParams, ApiBatchParams } from './types'

/**
 * 事件操作类型
 */
export enum EventActionType {
  OPEN_OVERLAY = 'openOverlay',
  CLOSE_OVERLAY = 'closeOverlay',
  DATA_SOURCE = 'dataSource',
  NAVIGATE = 'navigate',
  CUSTOM = 'custom',
}

/**
 * 数据源操作类型
 */
export enum DataSourceOperationType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  QUERY = 'query',
}

/**
 * 事件动作配置
 */
export interface EventActionConfig {
  // 打开/关闭浮层
  overlayId?: string
  overlayParams?: Record<string, any>

  // 数据源操作
  dataSourceId?: string
  operationType?: DataSourceOperationType
  operationParams?: Record<string, any>

  // 导航
  path?: string
  query?: Record<string, any>

  // 自定义
  script?: string
}

/**
 * 事件动作
 */
export interface EventAction {
  id: string
  type: EventActionType
  config: EventActionConfig
  onSuccess?: EventAction[]
  onError?: EventAction[]
}

/**
 * 事件配置
 */
export interface EventConfig {
  id: string
  controlId: string
  eventName: string
  actions: EventAction[]
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * 事件列表查询参数
 */
export interface EventConfigListParams extends ApiListParams {
  resourceCode: string
  controlId?: string
  eventName?: string
}

/**
 * 创建事件配置参数
 */
export interface CreateEventConfigParams {
  resourceCode: string
  controlId: string
  eventName: string
  actions: EventAction[]
  enabled?: boolean
}

/**
 * 更新事件配置参数
 */
export interface UpdateEventConfigParams {
  id: string
  data: Partial<EventConfig>
}

/**
 * 事件验证响应
 */
export interface EventValidationResponse {
  valid: boolean
  errors?: string[]
}

/**
 * 可用操作类型响应
 */
export interface AvailableActionsResponse {
  overlays: Array<{ id: string; name: string }>
  dataSources: Array<{
    id: string
    name: string
    operations: Array<{
      type: DataSourceOperationType
      label: string
      params: Array<{ name: string; type: string; required: boolean }>
    }>
  }>
}

/**
 * 批量更新事件配置参数
 */
export interface BatchUpdateEventConfigParams {
  resourceCode: string
  events: EventConfig[]
}

/**
 * 事件配置 API 服务
 */
export const eventConfigApi = {
  /**
   * 获取控件的所有事件配置
   * GET /event/list
   */
  getList(params: EventConfigListParams) {
    return api.get<ApiListResponse<EventConfig>>('/event/list', { params })
  },

  /**
   * 获取单个事件配置
   * GET /event/:id
   */
  get(id: string) {
    return api.get<EventConfig>(`/event/${id}`)
  },

  /**
   * 创建事件配置
   * POST /event/create
   */
  create(data: CreateEventConfigParams) {
    return api.post<EventConfig>('/event/create', data)
  },

  /**
   * 更新事件配置
   * PUT /event/:id
   */
  update(id: string, data: Partial<EventConfig>) {
    return api.put<EventConfig>(`/event/${id}`, data)
  },

  /**
   * 删除事件配置
   * DELETE /event/:id
   */
  delete(id: string) {
    return api.delete<boolean>(`/event/${id}`)
  },

  /**
   * 获取可用的操作类型列表
   * GET /event/available-actions
   */
  getAvailableActions(resourceCode: string) {
    return api.get<AvailableActionsResponse>('/event/available-actions', {
      params: { resourceCode },
    })
  },

  /**
   * 验证事件配置
   * POST /event/validate
   */
  validate(data: EventConfig) {
    return api.post<EventValidationResponse>('/event/validate', data)
  },

  /**
   * 批量更新事件配置
   * POST /event/batch-update
   */
  batchUpdate(data: BatchUpdateEventConfigParams) {
    return api.post<boolean>('/event/batch-update', data)
  },
}

// ============================================================================
// 向后兼容的类型别名
// ============================================================================

/**
 * @deprecated 使用 EventConfigListParams 替代
 */
export type EventListParams = EventConfigListParams

/**
 * @deprecated 使用 ApiListResponse<EventConfig> 替代
 */
export type EventListResponse = ApiListResponse<EventConfig>
