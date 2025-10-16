/**
 * 资源数据缓存服务
 * 提供资源数据的缓存和管理
 */

import type { MenuTreeNode } from '@/core/api/menu'

export interface CacheEntry<T> {
  data: T
  timestamp: number
  expiresAt: number
}

export interface CacheOptions {
  ttl?: number // 缓存时间（毫秒）
  maxSize?: number // 最大缓存数量
}

/**
 * 资源缓存服务
 */
export class ResourceCache {
  private cache = new Map<string, CacheEntry<any>>()
  private defaultTTL = 5 * 60 * 1000 // 默认5分钟
  private maxSize = 100 // 最大缓存100个条目

  /**
   * 设置缓存
   */
  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTTL
    const now = Date.now()

    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= (options.maxSize || this.maxSize)) {
      this.evictOldest()
    }

    this.cache.set(key, {
      data,
      timestamp: now,
      expiresAt: now + ttl,
    })
  }

  /**
   * 获取缓存
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  /**
   * 检查缓存是否存在且有效
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)

    if (!entry) {
      return false
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.cache.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.cache.delete(key))
  }

  /**
   * 删除最旧的缓存条目
   */
  private evictOldest(): void {
    let oldestKey: string | null = null
    let oldestTime = Infinity

    this.cache.forEach((entry, key) => {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp
        oldestKey = key
      }
    })

    if (oldestKey) {
      this.cache.delete(oldestKey)
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const now = Date.now()
    let validCount = 0
    let expiredCount = 0

    this.cache.forEach(entry => {
      if (now > entry.expiresAt) {
        expiredCount++
      } else {
        validCount++
      }
    })

    return {
      total: this.cache.size,
      valid: validCount,
      expired: expiredCount,
      maxSize: this.maxSize,
    }
  }
}

// 创建全局单例
export const resourceCache = new ResourceCache()

/**
 * 生成资源列表缓存键
 */
export function getResourceListCacheKey(params: any): string {
  const { name, menuCode, module, nodeType, page, size } = params
  return `resources:${name || ''}:${menuCode || ''}:${module || ''}:${nodeType || ''}:${page || 1}:${size || 10}`
}

/**
 * 生成资源详情缓存键
 */
export function getResourceDetailCacheKey(id: number): string {
  return `resource:${id}`
}

/**
 * 生成资源树缓存键
 */
export function getResourceTreeCacheKey(): string {
  return 'resources:tree'
}
