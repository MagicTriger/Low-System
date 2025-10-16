/**
 * API层通用类型定义
 */

export * from './IApiClient'

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
