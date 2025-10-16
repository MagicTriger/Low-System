/**
 * 重试管理器
 *
 * 实现请求自动重试机制
 * 符合需求 8.3 - 自动重试机制
 */

import type { RetryConfig } from '../IApiClient'

/**
 * 重试上下文
 */
export interface RetryContext {
  /** 当前重试次数 */
  attempt: number
  /** 最大重试次数 */
  maxAttempts: number
  /** 错误信息 */
  error: any
  /** 请求配置 */
  config: any
}

/**
 * 重试策略
 */
export type RetryStrategy = (context: RetryContext) => boolean

/**
 * 重试管理器
 */
export class RetryManager {
  /**
   * 执行带重试的操作
   */
  static async executeWithRetry<T>(operation: () => Promise<T>, config: RetryConfig): Promise<T> {
    let lastError: any
    let attempt = 0

    while (attempt < config.times) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        attempt++

        // 检查是否应该重试
        if (attempt >= config.times) {
          break
        }

        if (config.shouldRetry && !config.shouldRetry(error)) {
          break
        }

        // 等待后重试
        const delay = this.calculateDelay(config, attempt)
        await this.sleep(delay)
      }
    }

    throw lastError
  }

  /**
   * 计算重试延迟
   */
  private static calculateDelay(config: RetryConfig, attempt: number): number {
    const baseDelay = config.delay

    switch (config.backoff) {
      case 'exponential':
        return baseDelay * Math.pow(2, attempt - 1)
      case 'linear':
      default:
        return baseDelay * attempt
    }
  }

  /**
   * 睡眠函数
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 默认重试策略: 网络错误或5xx错误
   */
  static defaultRetryStrategy: RetryStrategy = context => {
    const { error } = context

    // 网络错误
    if (!error.response) {
      return true
    }

    // 5xx服务器错误
    if (error.status >= 500 && error.status < 600) {
      return true
    }

    // 429 Too Many Requests
    if (error.status === 429) {
      return true
    }

    return false
  }

  /**
   * 幂等请求重试策略: 只重试GET、HEAD、OPTIONS、PUT、DELETE
   */
  static idempotentRetryStrategy: RetryStrategy = context => {
    const method = context.config?.method?.toUpperCase()
    const idempotentMethods = ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']

    if (!idempotentMethods.includes(method)) {
      return false
    }

    return RetryManager.defaultRetryStrategy(context)
  }
}
