/**
 * 事件总线中间件和工具函数
 * 提供常用的事件处理增强功能
 */

import type { EventHandler, EventContext } from './types'

/**
 * 创建带日志的事件处理器
 */
export function withLogging<T = any>(
  handler: EventHandler<T>,
  logger: Console = console,
  logLevel: 'debug' | 'info' | 'warn' | 'error' = 'info'
): EventHandler<T> {
  return async (data: T, context: EventContext) => {
    if (logLevel === 'debug' || logLevel === 'info') {
      logger[logLevel](`[EventBus] Handling event: ${context.event}`, {
        timestamp: context.timestamp,
        source: context.source,
      })
    }

    try {
      await handler(data, context)

      if (logLevel === 'debug') {
        logger.debug(`[EventBus] Event handled: ${context.event}`)
      }
    } catch (error) {
      logger.error(`[EventBus] Handler error for ${context.event}:`, error)
      throw error
    }
  }
}

/**
 * 创建带性能监控的事件处理器
 */
export function withPerformance<T = any>(
  handler: EventHandler<T>,
  onMetric?: (eventType: string, duration: number) => void
): EventHandler<T> {
  return async (data: T, context: EventContext) => {
    const startTime = performance.now()

    try {
      await handler(data, context)
    } finally {
      const duration = performance.now() - startTime

      if (onMetric) {
        onMetric(context.event, duration)
      } else {
        console.debug(`[Performance] ${context.event}: ${duration.toFixed(2)}ms`)
      }
    }
  }
}

/**
 * 创建带验证的事件处理器
 */
export function withValidation<T = any>(
  handler: EventHandler<T>,
  validator: (data: T) => boolean | { valid: boolean; error?: string }
): EventHandler<T> {
  return async (data: T, context: EventContext) => {
    const result = validator(data)

    if (typeof result === 'boolean') {
      if (!result) {
        throw new Error(`Validation failed for event: ${context.event}`)
      }
    } else {
      if (!result.valid) {
        throw new Error(`Validation failed for event: ${context.event}: ${result.error || 'Unknown error'}`)
      }
    }

    await handler(data, context)
  }
}

/**
 * 创建带重试的事件处理器
 */
export function withRetry<T = any>(handler: EventHandler<T>, maxRetries: number = 3, retryDelay: number = 1000): EventHandler<T> {
  return async (data: T, context: EventContext) => {
    let lastError: Error | undefined

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        await handler(data, context)
        return
      } catch (error) {
        lastError = error as Error

        if (attempt < maxRetries) {
          console.warn(`[Retry] Event ${context.event} failed (attempt ${attempt + 1}/${maxRetries}), retrying...`)
          await new Promise(resolve => setTimeout(resolve, retryDelay))
        }
      }
    }

    throw new Error(`Event handler failed after ${maxRetries} retries: ${lastError?.message}`)
  }
}

/**
 * 创建带超时的事件处理器
 */
export function withTimeout<T = any>(handler: EventHandler<T>, timeoutMs: number): EventHandler<T> {
  return async (data: T, context: EventContext) => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Event handler timeout after ${timeoutMs}ms for event: ${context.event}`))
      }, timeoutMs)
    })

    await Promise.race([handler(data, context), timeoutPromise])
  }
}

/**
 * 创建带错误处理的事件处理器
 */
export function withErrorHandler<T = any>(
  handler: EventHandler<T>,
  errorHandler: (error: Error, data: T, context: EventContext) => void | Promise<void>
): EventHandler<T> {
  return async (data: T, context: EventContext) => {
    try {
      await handler(data, context)
    } catch (error) {
      await errorHandler(error as Error, data, context)
    }
  }
}

/**
 * 组合多个处理器增强函数
 */
export function compose<T = any>(handler: EventHandler<T>, ...enhancers: Array<(h: EventHandler<T>) => EventHandler<T>>): EventHandler<T> {
  return enhancers.reduce((enhanced, enhancer) => enhancer(enhanced), handler)
}

/**
 * 性能指标收集器
 */
export class PerformanceCollector {
  private metrics = new Map<string, PerformanceMetric>()

  record(eventType: string, duration: number): void {
    let metric = this.metrics.get(eventType)

    if (!metric) {
      metric = {
        eventType,
        count: 0,
        totalDuration: 0,
        averageDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
      }
      this.metrics.set(eventType, metric)
    }

    metric.count++
    metric.totalDuration += duration
    metric.averageDuration = metric.totalDuration / metric.count
    metric.minDuration = Math.min(metric.minDuration, duration)
    metric.maxDuration = Math.max(metric.maxDuration, duration)
  }

  getMetrics(eventType?: string): PerformanceMetric[] {
    if (eventType) {
      const metric = this.metrics.get(eventType)
      return metric ? [metric] : []
    }
    return Array.from(this.metrics.values())
  }

  clear(): void {
    this.metrics.clear()
  }

  getReport(): string {
    const metrics = this.getMetrics()
    if (metrics.length === 0) {
      return 'No performance metrics collected'
    }

    let report = 'Performance Metrics:\n'
    report += '='.repeat(80) + '\n'
    report += `${'Event Type'.padEnd(30)} ${'Count'.padEnd(10)} ${'Avg(ms)'.padEnd(10)} ${'Min(ms)'.padEnd(10)} ${'Max(ms)'.padEnd(10)}\n`
    report += '-'.repeat(80) + '\n'

    for (const metric of metrics) {
      report += `${metric.eventType.padEnd(30)} `
      report += `${metric.count.toString().padEnd(10)} `
      report += `${metric.averageDuration.toFixed(2).padEnd(10)} `
      report += `${metric.minDuration.toFixed(2).padEnd(10)} `
      report += `${metric.maxDuration.toFixed(2).padEnd(10)}\n`
    }

    return report
  }
}

interface PerformanceMetric {
  eventType: string
  count: number
  totalDuration: number
  averageDuration: number
  minDuration: number
  maxDuration: number
}

/**
 * 限流器
 */
export class Throttler {
  private lastExecutionTime = new Map<string, number>()

  constructor(private throttleMs: number = 1000) {}

  shouldExecute(key: string): boolean {
    const now = Date.now()
    const lastTime = this.lastExecutionTime.get(key) || 0
    const timeSinceLastExecution = now - lastTime

    if (timeSinceLastExecution >= this.throttleMs) {
      this.lastExecutionTime.set(key, now)
      return true
    }

    return false
  }

  wrap<T = any>(handler: EventHandler<T>): EventHandler<T> {
    return async (data: T, context: EventContext) => {
      if (this.shouldExecute(context.event)) {
        await handler(data, context)
      } else {
        console.debug(`[Throttler] Event ${context.event} throttled`)
      }
    }
  }
}

/**
 * 防抖器
 */
export class Debouncer {
  private timers = new Map<string, any>()

  constructor(private debounceMs: number = 300) {}

  wrap<T = any>(handler: EventHandler<T>): EventHandler<T> {
    return async (data: T, context: EventContext) => {
      const existingTimer = this.timers.get(context.event)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      return new Promise<void>(resolve => {
        const timer = setTimeout(async () => {
          this.timers.delete(context.event)
          await handler(data, context)
          resolve()
        }, this.debounceMs)

        this.timers.set(context.event, timer)
      })
    }
  }

  clear(eventType?: string): void {
    if (eventType) {
      const timer = this.timers.get(eventType)
      if (timer) {
        clearTimeout(timer)
        this.timers.delete(eventType)
      }
    } else {
      for (const timer of this.timers.values()) {
        clearTimeout(timer)
      }
      this.timers.clear()
    }
  }
}

/**
 * 事件批处理器
 */
export class EventBatcher<T = any> {
  private batches = new Map<string, T[]>()
  private timers = new Map<string, any>()

  constructor(
    private batchSize: number = 10,
    private batchTimeMs: number = 1000
  ) {}

  wrap(handler: EventHandler<T[]>): EventHandler<T> {
    return async (data: T, context: EventContext) => {
      let batch = this.batches.get(context.event)
      if (!batch) {
        batch = []
        this.batches.set(context.event, batch)
      }

      batch.push(data)

      // 如果达到批次大小,立即处理
      if (batch.length >= this.batchSize) {
        await this.flush(context.event, handler, context)
        return
      }

      // 否则设置定时器
      const existingTimer = this.timers.get(context.event)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }

      const timer = setTimeout(async () => {
        await this.flush(context.event, handler, context)
      }, this.batchTimeMs)

      this.timers.set(context.event, timer)
    }
  }

  private async flush(eventType: string, handler: EventHandler<T[]>, context: EventContext): Promise<void> {
    const batch = this.batches.get(eventType)
    if (batch && batch.length > 0) {
      this.batches.delete(eventType)
      const timer = this.timers.get(eventType)
      if (timer) {
        clearTimeout(timer)
        this.timers.delete(eventType)
      }

      await handler(batch, context)
    }
  }

  async flushAll(handler: EventHandler<T[]>, context: EventContext): Promise<void> {
    for (const eventType of this.batches.keys()) {
      await this.flush(eventType, handler, context)
    }
  }
}
