/**
 * 缓存管理器
 *
 * 统一管理多种缓存策略
 * 符合需求 8.3 - 请求缓存机制
 */

import type { ICacheManager, ICacheStrategy } from './ICacheStrategy'
import { MemoryCacheStrategy } from './MemoryCacheStrategy'

/**
 * 缓存管理器实现
 */
export class CacheManager implements ICacheManager {
  private strategies = new Map<string, ICacheStrategy>()
  private defaultStrategyName: string = 'memory'

  constructor() {
    // 注册默认的内存缓存策略
    this.registerStrategy(new MemoryCacheStrategy())
  }

  /**
   * 注册缓存策略
   */
  registerStrategy(strategy: ICacheStrategy): void {
    this.strategies.set(strategy.name, strategy)
  }

  /**
   * 获取缓存策略
   */
  getStrategy(name: string): ICacheStrategy | undefined {
    return this.strategies.get(name)
  }

  /**
   * 设置默认策略
   */
  setDefaultStrategy(name: string): void {
    if (!this.strategies.has(name)) {
      throw new Error(`Cache strategy "${name}" not found`)
    }
    this.defaultStrategyName = name
  }

  /**
   * 获取默认策略
   */
  getDefaultStrategy(): ICacheStrategy {
    const strategy = this.strategies.get(this.defaultStrategyName)
    if (!strategy) {
      throw new Error(`Default cache strategy "${this.defaultStrategyName}" not found`)
    }
    return strategy
  }

  /**
   * 使用指定策略获取缓存
   */
  async get<T = any>(key: string, strategyName?: string): Promise<T | null> {
    const strategy = strategyName ? this.getStrategy(strategyName) : this.getDefaultStrategy()

    if (!strategy) {
      throw new Error(`Cache strategy "${strategyName}" not found`)
    }

    return strategy.get<T>(key)
  }

  /**
   * 使用指定策略设置缓存
   */
  async set<T = any>(key: string, value: T, ttl?: number, strategyName?: string): Promise<void> {
    const strategy = strategyName ? this.getStrategy(strategyName) : this.getDefaultStrategy()

    if (!strategy) {
      throw new Error(`Cache strategy "${strategyName}" not found`)
    }

    return strategy.set(key, value, ttl)
  }

  /**
   * 删除缓存
   */
  async delete(key: string, strategyName?: string): Promise<void> {
    const strategy = strategyName ? this.getStrategy(strategyName) : this.getDefaultStrategy()

    if (!strategy) {
      throw new Error(`Cache strategy "${strategyName}" not found`)
    }

    return strategy.delete(key)
  }

  /**
   * 清空所有缓存
   */
  async clearAll(): Promise<void> {
    const promises = Array.from(this.strategies.values()).map(strategy => strategy.clear())
    await Promise.all(promises)
  }

  /**
   * 生成缓存键
   */
  static generateKey(url: string, params?: Record<string, any>): string {
    const paramStr = params ? JSON.stringify(params) : ''
    return `${url}:${paramStr}`
  }
}

/**
 * 全局缓存管理器实例
 */
export const globalCacheManager = new CacheManager()
