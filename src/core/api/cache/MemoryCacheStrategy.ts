/**
 * 内存缓存策略
 *
 * 使用Map实现的内存缓存,支持LRU淘汰
 * 符合需求 8.3 - 请求缓存机制
 */

import type { ICacheStrategy, CacheEntry } from './ICacheStrategy'

/**
 * LRU缓存配置
 */
export interface LRUCacheConfig {
  /** 最大缓存数量 */
  maxSize: number
  /** 默认TTL(毫秒) */
  defaultTTL: number
}

/**
 * 内存缓存策略实现
 */
export class MemoryCacheStrategy implements ICacheStrategy {
  readonly name = 'memory'

  private cache = new Map<string, CacheEntry>()
  private accessOrder: string[] = []
  private config: LRUCacheConfig

  constructor(config: Partial<LRUCacheConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 100,
      defaultTTL: config.defaultTTL || 5 * 60 * 1000, // 5分钟
    }

    // 定期清理过期缓存
    this.startCleanupTimer()
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 检查是否过期
    if (this.isExpired(entry)) {
      await this.delete(key)
      return null
    }

    // 更新访问顺序(LRU)
    this.updateAccessOrder(key)

    return entry.value as T
  }

  /**
   * 设置缓存
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    const now = Date.now()
    const expiresAt = now + (ttl || this.config.defaultTTL)

    const entry: CacheEntry<T> = {
      key,
      value,
      createdAt: now,
      expiresAt,
    }

    // 检查是否需要淘汰
    if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
      await this.evictLRU()
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    this.cache.delete(key)
    this.removeFromAccessOrder(key)
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.cache.clear()
    this.accessOrder = []
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (!entry) return false

    if (this.isExpired(entry)) {
      await this.delete(key)
      return false
    }

    return true
  }

  /**
   * 获取所有缓存键
   */
  async keys(): Promise<string[]> {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取缓存大小
   */
  async size(): Promise<number> {
    return this.cache.size
  }

  /**
   * 检查是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    // 移除旧位置
    this.removeFromAccessOrder(key)
    // 添加到末尾(最近访问)
    this.accessOrder.push(key)
  }

  /**
   * 从访问顺序中移除
   */
  private removeFromAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index !== -1) {
      this.accessOrder.splice(index, 1)
    }
  }

  /**
   * 淘汰最少使用的缓存(LRU)
   */
  private async evictLRU(): Promise<void> {
    if (this.accessOrder.length === 0) return

    const lruKey = this.accessOrder[0]
    await this.delete(lruKey)
  }

  /**
   * 启动清理定时器
   */
  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanup()
    }, 60000) // 每分钟清理一次
  }

  /**
   * 清理过期缓存
   */
  private async cleanup(): Promise<void> {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        expiredKeys.push(key)
      }
    })

    for (const key of expiredKeys) {
      await this.delete(key)
    }
  }
}
