/**
 * 请求去重器
 *
 * 防止重复请求,提高性能
 * 符合需求 8.3 - 请求去重机制
 */

import type { RequestConfig, ApiResponse } from '../IApiClient'
import type { DedupeConfig } from '../types'

/**
 * 待处理请求
 */
interface PendingRequest<T = any> {
  promise: Promise<ApiResponse<T>>
  timestamp: number
}

/**
 * 请求去重器
 */
export class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest>()
  private config: Required<DedupeConfig>

  constructor(config: Partial<DedupeConfig> = {}) {
    this.config = {
      enabled: config.enabled ?? true,
      keyGenerator: config.keyGenerator || this.defaultKeyGenerator,
      strategy: config.strategy || 'cancel-previous',
    }
  }

  /**
   * 去重请求
   */
  async deduplicate<T>(config: RequestConfig, executor: () => Promise<ApiResponse<T>>): Promise<ApiResponse<T>> {
    if (!this.config.enabled) {
      return executor()
    }

    const key = this.config.keyGenerator(config)

    // 检查是否有待处理的相同请求
    const pending = this.pendingRequests.get(key)

    if (pending) {
      return this.handleDuplicate(key, pending, executor)
    }

    // 执行新请求
    const promise = executor()

    // 记录待处理请求
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now(),
    })

    try {
      const response = await promise
      return response
    } finally {
      // 清理待处理请求
      this.pendingRequests.delete(key)
    }
  }

  /**
   * 处理重复请求
   */
  private async handleDuplicate<T>(
    key: string,
    pending: PendingRequest<T>,
    executor: () => Promise<ApiResponse<T>>
  ): Promise<ApiResponse<T>> {
    switch (this.config.strategy) {
      case 'cancel-previous':
        // 取消之前的请求,执行新请求
        this.pendingRequests.delete(key)
        return this.deduplicate({ url: key } as RequestConfig, executor)

      case 'ignore-new':
        // 忽略新请求,返回之前的请求结果
        return pending.promise

      case 'queue':
        // 等待之前的请求完成后再执行新请求
        await pending.promise.catch(() => {})
        return this.deduplicate({ url: key } as RequestConfig, executor)

      default:
        return pending.promise
    }
  }

  /**
   * 默认键生成器
   */
  private defaultKeyGenerator(config: RequestConfig): string {
    const method = config.method || 'GET'
    const url = config.url || ''
    const params = config.params ? JSON.stringify(config.params) : ''
    const data = config.data ? JSON.stringify(config.data) : ''

    return `${method}:${url}:${params}:${data}`
  }

  /**
   * 清空所有待处理请求
   */
  clear(): void {
    this.pendingRequests.clear()
  }

  /**
   * 获取待处理请求数量
   */
  get size(): number {
    return this.pendingRequests.size
  }

  /**
   * 检查是否有待处理请求
   */
  hasPending(config: RequestConfig): boolean {
    const key = this.config.keyGenerator(config)
    return this.pendingRequests.has(key)
  }
}

/**
 * 全局请求去重器实例
 */
export const globalRequestDeduplicator = new RequestDeduplicator()
