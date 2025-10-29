/**
 * 统一 API 类型定义
 *
 * 本文件定义了所有 API 模块使用的统一类型和接口
 * 符合需求 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

export * from './IApiClient'

// ============================================================================
// 统一的 API 响应类型 (Requirement 3.2)
// ============================================================================

/**
 * 统一的 API 响应格式
 *
 * 所有 API 方法应该返回此格式的响应
 *
 * @template T - 响应数据类型
 */
export interface ApiResponse<T = any> {
  /** 响应数据 */
  data: T
  /** 业务状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 请求是否成功 */
  success: boolean
  /** 时间戳 */
  timestamp?: number
  /** 请求追踪ID */
  traceId?: string
}

/**
 * 统一的列表响应格式
 *
 * 用于返回列表数据的 API
 *
 * @template T - 列表项类型
 */
export interface ApiListResponse<T = any> {
  /** 数据列表 */
  list: T[]
  /** 总记录数 */
  total: number
  /** 当前页码（可选，用于分页） */
  page?: number
  /** 每页数量（可选，用于分页） */
  pageSize?: number
  /** 总页数（可选，用于分页） */
  totalPages?: number
  /** 是否有下一页（可选） */
  hasNext?: boolean
  /** 是否有上一页（可选） */
  hasPrevious?: boolean
}

// ============================================================================
// 统一的请求参数类型 (Requirement 3.3, 3.4, 3.5)
// ============================================================================

/**
 * 统一的分页参数
 *
 * 用于需要分页的 API 请求
 */
export interface ApiPaginationParams {
  /** 页码（从1开始） */
  page?: number
  /** 每页数量 */
  pageSize?: number
  /** 排序字段 */
  sortBy?: string
  /** 排序方向 */
  sortOrder?: 'asc' | 'desc' | 'ascend' | 'descend'
}

/**
 * 统一的查询参数
 *
 * 用于需要搜索和过滤的 API 请求
 */
export interface ApiQueryParams extends ApiPaginationParams {
  /** 搜索关键词 */
  keyword?: string
  /** 过滤条件 */
  filters?: Record<string, any>
  /** 排序器配置 */
  sorter?: {
    field: string
    order: 'ascend' | 'descend'
  }
  /** 时间范围 */
  dateRange?: {
    start?: string
    end?: string
  }
}

/**
 * 统一的列表查询参数
 *
 * 结合分页和查询功能
 */
export interface ApiListParams extends ApiQueryParams {
  /** 资源代码（用于特定资源的查询） */
  resourceCode?: string
  /** 是否包含已删除的记录 */
  includeDeleted?: boolean
}

// ============================================================================
// 通用 CRUD 参数类型 (Requirement 3.3)
// ============================================================================

/**
 * 创建资源的参数类型
 *
 * @template T - 资源数据类型
 */
export interface ApiCreateParams<T = any> {
  /** 资源数据 */
  data: T
  /** 资源代码（可选） */
  resourceCode?: string
}

/**
 * 更新资源的参数类型
 *
 * @template T - 资源数据类型
 */
export interface ApiUpdateParams<T = any> {
  /** 资源ID */
  id: string | number
  /** 更新的数据（部分更新） */
  data: Partial<T>
}

/**
 * 删除资源的参数类型
 */
export interface ApiDeleteParams {
  /** 资源ID */
  id: string | number
  /** 是否软删除 */
  soft?: boolean
}

/**
 * 批量操作参数类型
 */
export interface ApiBatchParams<T = any> {
  /** 资源ID列表 */
  ids: Array<string | number>
  /** 操作数据（可选） */
  data?: T
}

// ============================================================================
// 特定业务类型 (Requirement 3.6)
// ============================================================================

/**
 * 资源 DTO
 */
export interface ResourceDTO {
  id: string | number
  code: string
  name: string
  type?: string
  description?: string
  createdAt?: string
  updatedAt?: string
  [key: string]: any
}

/**
 * 设计数据 DTO
 */
export interface DesignDTO {
  resourceCode: string
  rootView: any
  version: string
  createdAt: string
  updatedAt: string
  metadata?: {
    author?: string
    description?: string
    tags?: string[]
  }
}

// ============================================================================
// 向后兼容的类型别名
// ============================================================================

/**
 * @deprecated 使用 ApiListResponse 替代
 */
export type ListResponse<T> = ApiListResponse<T>

/**
 * @deprecated 使用 ApiPaginationParams 替代
 */
export type PaginationParams = ApiPaginationParams

/**
 * @deprecated 使用 ApiQueryParams 替代
 */
export type QueryParams = ApiQueryParams

// ============================================================================
// 原有类型定义（保持向后兼容）
// ============================================================================

/**
 * 进度事件
 */
export interface ProgressEvent {
  /** 已加载字节数 */
  loaded: number
  /** 总字节数 */
  total?: number
  /** 进度百分比 */
  progress: number
  /** 速率(字节/秒) */
  rate?: number
  /** 预计剩余时间(秒) */
  estimated?: number
}

/**
 * 请求去重配置
 */
export interface DedupeConfig {
  /** 是否启用去重 */
  enabled: boolean
  /** 去重键生成函数 */
  keyGenerator?: (config: any) => string
  /** 去重策略 */
  strategy?: 'cancel-previous' | 'ignore-new' | 'queue'
}

/**
 * 熔断器配置
 */
export interface CircuitBreakerConfig {
  /** 是否启用熔断器 */
  enabled: boolean
  /** 失败阈值 */
  failureThreshold: number
  /** 成功阈值(用于恢复) */
  successThreshold: number
  /** 超时时间(毫秒) */
  timeout: number
  /** 半开状态尝试次数 */
  halfOpenAttempts: number
}

/**
 * 熔断器状态
 */
export enum CircuitBreakerState {
  /** 关闭状态(正常) */
  CLOSED = 'closed',
  /** 打开状态(熔断) */
  OPEN = 'open',
  /** 半开状态(尝试恢复) */
  HALF_OPEN = 'half_open',
}

/**
 * 请求优先级
 */
export enum RequestPriority {
  /** 低优先级 */
  LOW = 0,
  /** 普通优先级 */
  NORMAL = 1,
  /** 高优先级 */
  HIGH = 2,
  /** 紧急优先级 */
  URGENT = 3,
}

/**
 * 请求状态
 */
export enum RequestState {
  /** 待处理 */
  PENDING = 'pending',
  /** 进行中 */
  IN_PROGRESS = 'in_progress',
  /** 已完成 */
  COMPLETED = 'completed',
  /** 已失败 */
  FAILED = 'failed',
  /** 已取消 */
  CANCELLED = 'cancelled',
}

/**
 * 请求元数据
 */
export interface RequestMetadata {
  /** 请求ID */
  id: string
  /** 请求开始时间 */
  startTime: number
  /** 请求结束时间 */
  endTime?: number
  /** 请求耗时(毫秒) */
  duration?: number
  /** 请求状态 */
  state: RequestState
  /** 重试次数 */
  retryCount: number
  /** 是否来自缓存 */
  fromCache: boolean
  /** 优先级 */
  priority: RequestPriority
}

/**
 * 批量请求配置
 */
export interface BatchRequestConfig {
  /** 批量请求列表 */
  requests: Array<{
    key: string
    config: any
  }>
  /** 是否并行执行 */
  parallel?: boolean
  /** 最大并发数 */
  maxConcurrency?: number
  /** 是否在某个请求失败时停止 */
  stopOnError?: boolean
}

/**
 * 批量请求结果
 */
export interface BatchRequestResult<T = any> {
  /** 成功的请求 */
  succeeded: Array<{
    key: string
    data: T
  }>
  /** 失败的请求 */
  failed: Array<{
    key: string
    error: any
  }>
  /** 总耗时 */
  totalDuration: number
}
