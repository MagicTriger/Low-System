/**
 * LocalStorage缓存策略
 *
 * 使用浏览器LocalStorage实现持久化缓存
 * 符合需求 8.3 - 请求缓存机制
 */

import type { ICacheStrategy, CacheEntry } from './ICacheStrategy'

/**
 * LocalStorage缓存策略实现
 */
export class LocalStorageCacheStrategy implements ICacheStrategy {
  readonly name = 'localStorage'

  private prefix: string
  private defaultTTL: number

  constructor(prefix: string = 'api_cache_', defaultTTL: number = 5 * 60 * 1000) {
    this.prefix = prefix
    this.defaultTTL = defaultTTL
  }

  /**
   * 获取缓存
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const storageKey = this.getStorageKey(key)
      const data = localStorage.getItem(storageKey)

      if (!data) {
        return null
      }

      const entry: CacheEntry<T> = JSON.parse(data)

      // 检查是否过期
      if (this.isExpired(entry)) {
        await this.delete(key)
        return null
      }

      return entry.value
    } catch (error) {
      console.error('Failed to get cache from localStorage:', error)
      return null
    }
  }

  /**
   * 设置缓存
   */
  async set<T = any>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const now = Date.now()
      const expiresAt = now + (ttl || this.defaultTTL)

      const entry: CacheEntry<T> = {
        key,
        value,
        createdAt: now,
        expiresAt,
      }

      const storageKey = this.getStorageKey(key)
      localStorage.setItem(storageKey, JSON.stringify(entry))
    } catch (error) {
      console.error('Failed to set cache to localStorage:', error)

      // 如果存储空间不足,尝试清理过期缓存
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        await this.cleanup()
        // 重试一次
        try {
          const storageKey = this.getStorageKey(key)
          localStorage.setItem(
            storageKey,
            JSON.stringify({
              key,
              value,
              createdAt: Date.now(),
              expiresAt: Date.now() + (ttl || this.defaultTTL),
            })
          )
        } catch {
          // 如果还是失败,忽略错误
        }
      }
    }
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(key)
      localStorage.removeItem(storageKey)
    } catch (error) {
      console.error('Failed to delete cache from localStorage:', error)
    }
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.keys()
      for (const key of keys) {
        await this.delete(key)
      }
    } catch (error) {
      console.error('Failed to clear cache from localStorage:', error)
    }
  }

  /**
   * 检查缓存是否存在
   */
  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== null
  }

  /**
   * 获取所有缓存键
   */
  async keys(): Promise<string[]> {
    const keys: string[] = []

    try {
      for (let i = 0; i < localStorage.length; i++) {
        const storageKey = localStorage.key(i)
        if (storageKey && storageKey.startsWith(this.prefix)) {
          const key = storageKey.substring(this.prefix.length)
          keys.push(key)
        }
      }
    } catch (error) {
      console.error('Failed to get keys from localStorage:', error)
    }

    return keys
  }

  /**
   * 获取缓存大小
   */
  async size(): Promise<number> {
    const keys = await this.keys()
    return keys.length
  }

  /**
   * 获取存储键
   */
  private getStorageKey(key: string): string {
    return this.prefix + key
  }

  /**
   * 检查是否过期
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt
  }

  /**
   * 清理过期缓存
   */
  private async cleanup(): Promise<void> {
    const keys = await this.keys()

    for (const key of keys) {
      const storageKey = this.getStorageKey(key)
      const data = localStorage.getItem(storageKey)

      if (data) {
        try {
          const entry: CacheEntry = JSON.parse(data)
          if (this.isExpired(entry)) {
            await this.delete(key)
          }
        } catch {
          // 如果解析失败,删除该缓存
          await this.delete(key)
        }
      }
    }
  }
}
