/**
 * 监控系统实现
 * 提供性能追踪和指标收集
 */

import type {
  Metric,
  MetricType,
  PerformanceMetric,
  PerformanceTrace,
  IMonitor,
  ICounter,
  IGauge,
  IHistogram,
  HistogramStats,
  MonitorOptions,
} from './types'
import { MetricType as Type } from './types'

// 计数器实现
class Counter implements ICounter {
  private values = new Map<string, number>()

  constructor(
    private name: string,
    private monitor: Monitor
  ) {}

  inc(value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(labels)
    const current = this.values.get(key) || 0
    this.values.set(key, current + value)

    this.monitor.recordMetric({
      name: this.name,
      type: Type.Counter,
      value: current + value,
      timestamp: new Date(),
      labels,
    })
  }

  get(labels?: Record<string, string>): number {
    const key = this.getKey(labels)
    return this.values.get(key) || 0
  }

  reset(labels?: Record<string, string>): void {
    const key = this.getKey(labels)
    this.values.set(key, 0)
  }

  private getKey(labels?: Record<string, string>): string {
    if (!labels) return 'default'
    return JSON.stringify(labels)
  }
}

// 仪表实现
class Gauge implements IGauge {
  private values = new Map<string, number>()

  constructor(
    private name: string,
    private monitor: Monitor
  ) {}

  set(value: number, labels?: Record<string, string>): void {
    const key = this.getKey(labels)
    this.values.set(key, value)

    this.monitor.recordMetric({
      name: this.name,
      type: Type.Gauge,
      value,
      timestamp: new Date(),
      labels,
    })
  }

  inc(value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(labels)
    const current = this.values.get(key) || 0
    this.set(current + value, labels)
  }

  dec(value: number = 1, labels?: Record<string, string>): void {
    this.inc(-value, labels)
  }

  get(labels?: Record<string, string>): number {
    const key = this.getKey(labels)
    return this.values.get(key) || 0
  }

  private getKey(labels?: Record<string, string>): string {
    if (!labels) return 'default'
    return JSON.stringify(labels)
  }
}

// 直方图实现
class Histogram implements IHistogram {
  private observations = new Map<string, number[]>()

  constructor(
    private name: string,
    private monitor: Monitor,
    private buckets: number[] = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10]
  ) {}

  observe(value: number, labels?: Record<string, string>): void {
    const key = this.getKey(labels)
    const observations = this.observations.get(key) || []
    observations.push(value)
    this.observations.set(key, observations)

    this.monitor.recordMetric({
      name: this.name,
      type: Type.Histogram,
      value,
      timestamp: new Date(),
      labels,
    })
  }

  getStats(labels?: Record<string, string>): HistogramStats {
    const key = this.getKey(labels)
    const observations = this.observations.get(key) || []

    if (observations.length === 0) {
      return {
        count: 0,
        sum: 0,
        min: 0,
        max: 0,
        mean: 0,
        p50: 0,
        p95: 0,
        p99: 0,
      }
    }

    const sorted = [...observations].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)

    return {
      count: sorted.length,
      sum,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      mean: sum / sorted.length,
      p50: this.percentile(sorted, 0.5),
      p95: this.percentile(sorted, 0.95),
      p99: this.percentile(sorted, 0.99),
    }
  }

  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil(sorted.length * p) - 1
    return sorted[Math.max(0, index)]
  }

  private getKey(labels?: Record<string, string>): string {
    if (!labels) return 'default'
    return JSON.stringify(labels)
  }
}

// 性能追踪实现
class Trace implements PerformanceTrace {
  constructor(
    public readonly operation: string,
    public readonly startTime: Date,
    public readonly metadata: Record<string, any> | undefined,
    private monitor: Monitor
  ) {}

  end(success: boolean = true, error?: string): void {
    const endTime = new Date()
    const duration = endTime.getTime() - this.startTime.getTime()

    this.monitor.recordPerformance({
      operation: this.operation,
      duration,
      startTime: this.startTime,
      endTime,
      success,
      error,
      metadata: this.metadata,
    })
  }
}

// 监控器实现
export class Monitor implements IMonitor {
  private metrics: Metric[] = []
  private performanceMetrics: PerformanceMetric[] = []
  private counters = new Map<string, Counter>()
  private gauges = new Map<string, Gauge>()
  private histograms = new Map<string, Histogram>()
  private options: Required<MonitorOptions>

  constructor(options: MonitorOptions = {}) {
    this.options = {
      enabled: options.enabled ?? true,
      maxPerformanceMetrics: options.maxPerformanceMetrics || 1000,
      enableDebug: options.enableDebug ?? false,
    }
  }

  counter(name: string, help?: string): ICounter {
    if (!this.counters.has(name)) {
      this.counters.set(name, new Counter(name, this))
    }
    return this.counters.get(name)!
  }

  gauge(name: string, help?: string): IGauge {
    if (!this.gauges.has(name)) {
      this.gauges.set(name, new Gauge(name, this))
    }
    return this.gauges.get(name)!
  }

  histogram(name: string, help?: string, buckets?: number[]): IHistogram {
    if (!this.histograms.has(name)) {
      this.histograms.set(name, new Histogram(name, this, buckets))
    }
    return this.histograms.get(name)!
  }

  recordPerformance(metric: PerformanceMetric): void {
    if (!this.options.enabled) return

    this.performanceMetrics.push(metric)

    // 限制数量
    if (this.performanceMetrics.length > this.options.maxPerformanceMetrics) {
      this.performanceMetrics.shift()
    }

    if (this.options.enableDebug) {
      console.debug('[Monitor] Performance:', metric)
    }
  }

  startTrace(operation: string, metadata?: Record<string, any>): PerformanceTrace {
    return new Trace(operation, new Date(), metadata, this)
  }

  getMetrics(): Metric[] {
    return [...this.metrics]
  }

  getPerformanceMetrics(): PerformanceMetric[] {
    return [...this.performanceMetrics]
  }

  clear(): void {
    this.metrics = []
    this.performanceMetrics = []
    this.counters.clear()
    this.gauges.clear()
    this.histograms.clear()
  }

  // 内部方法,供指标对象调用
  recordMetric(metric: Metric): void {
    if (!this.options.enabled) return
    this.metrics.push(metric)
  }
}

// 导出全局监控器实例
export const globalMonitor = new Monitor()
