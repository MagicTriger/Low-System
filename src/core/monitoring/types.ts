/**
 * 监控系统类型定义
 */

// 指标类型
export enum MetricType {
  Counter = 'counter',
  Gauge = 'gauge',
  Histogram = 'histogram',
  Summary = 'summary',
}

// 指标数据
export interface Metric {
  /** 指标名称 */
  name: string
  /** 指标类型 */
  type: MetricType
  /** 指标值 */
  value: number
  /** 时间戳 */
  timestamp: Date
  /** 标签 */
  labels?: Record<string, string>
  /** 单位 */
  unit?: string
}

// 性能指标
export interface PerformanceMetric {
  /** 操作名称 */
  operation: string
  /** 持续时间(毫秒) */
  duration: number
  /** 开始时间 */
  startTime: Date
  /** 结束时间 */
  endTime: Date
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: string
  /** 元数据 */
  metadata?: Record<string, any>
}

// 计数器接口
export interface ICounter {
  /** 增加计数 */
  inc(value?: number, labels?: Record<string, string>): void
  /** 获取当前值 */
  get(labels?: Record<string, string>): number
  /** 重置计数 */
  reset(labels?: Record<string, string>): void
}

// 仪表接口
export interface IGauge {
  /** 设置值 */
  set(value: number, labels?: Record<string, string>): void
  /** 增加值 */
  inc(value?: number, labels?: Record<string, string>): void
  /** 减少值 */
  dec(value?: number, labels?: Record<string, string>): void
  /** 获取当前值 */
  get(labels?: Record<string, string>): number
}

// 直方图接口
export interface IHistogram {
  /** 观察值 */
  observe(value: number, labels?: Record<string, string>): void
  /** 获取统计信息 */
  getStats(labels?: Record<string, string>): HistogramStats
}

export interface HistogramStats {
  count: number
  sum: number
  min: number
  max: number
  mean: number
  p50: number
  p95: number
  p99: number
}

// 监控器接口
export interface IMonitor {
  /**
   * 创建计数器
   */
  counter(name: string, help?: string): ICounter

  /**
   * 创建仪表
   */
  gauge(name: string, help?: string): IGauge

  /**
   * 创建直方图
   */
  histogram(name: string, help?: string, buckets?: number[]): IHistogram

  /**
   * 记录性能指标
   */
  recordPerformance(metric: PerformanceMetric): void

  /**
   * 开始性能追踪
   */
  startTrace(operation: string, metadata?: Record<string, any>): PerformanceTrace

  /**
   * 获取所有指标
   */
  getMetrics(): Metric[]

  /**
   * 获取性能指标
   */
  getPerformanceMetrics(): PerformanceMetric[]

  /**
   * 清空指标
   */
  clear(): void
}

// 性能追踪
export interface PerformanceTrace {
  /** 操作名称 */
  operation: string
  /** 开始时间 */
  startTime: Date
  /** 元数据 */
  metadata?: Record<string, any>
  /** 结束追踪 */
  end(success?: boolean, error?: string): void
}

// 监控器配置
export interface MonitorOptions {
  /** 是否启用 */
  enabled?: boolean
  /** 性能指标保留数量 */
  maxPerformanceMetrics?: number
  /** 是否启用调试 */
  enableDebug?: boolean
}

// 监控错误类
export class MonitorError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'MonitorError'
  }
}
