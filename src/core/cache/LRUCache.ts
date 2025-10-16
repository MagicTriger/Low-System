/**
 * LRU (Least Recently Used) 缓存实现
 */

export interface CacheOptions {
  /** 最大缓存条目数 */
  maxSize: number
  /** 默认TTL(毫秒) */
  ttl?: number
  /** 过期检查间隔(毫秒) */
  checkInterval?: number
}

export interface CacheEntry<T> {
  key: string
  value: T
  expiresAt?: number
  accessCount: number
  lastAccessed: number
}

export interface CacheStats {
  size: number
  maxSize: number
  hits: number
  misses: number
  evictions: number
  hitRate: number
}

/**
 * LRU缓存
 */
export class LRUCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private accessOrder: string[] = []
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  }
  private checkTimer?: NodeJS.Timeout

  constructor(private options: CacheOptions) {
    if (options.checkInterval) {
      this.startExpirationCheck()
    }
  }

  /**
   * 获取缓存值
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      this.stats.misses++
      return undefined
    }

    // 检查是否过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      this.stats.misses++
      return undefined
    }

    // 更新访问信息
    entry.accessCount++
    entry.lastAccessed = Date.now()

    // 更新LRU顺序
    this.updateAccessOrder(key)

    this.stats.hits++
    return entry.value
  }

  /**
   * 设置缓存值
   */
  set(key: string, value: T, ttl?: number): void {
    // 检查是否需要驱逐
    if (!this.cache.has(key) && this.cache.size >= this.options.maxSize) {
      this.evictLRU()
    }

    const expiresAt = ttl || this.options.ttl ? Date.now() + (ttl || this.options.ttl!) : undefined

    const entry: CacheEntry<T> = {
      key,
      value,
      expiresAt,
      accessCount: 0,
      lastAccessed: Date.now(),
    }

    this.cache.set(key, entry)
    this.updateAccessOrder(key)
  }

  /**
   * 检查键是否存在
   */
  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // 检查是否过期
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.delete(key)
      return false
    }

    return true
  }

  /**
   * 删除缓存
   */
  delete(key: string): boolean {
    const deleted = this.cache.delete(key)
    if (deleted) {
      const index = this.accessOrder.indexOf(key)
      if (index > -1) {
        this.accessOrder.splice(index, 1)
      }
    }
    return deleted
  }

  /**
   * 清空缓存
   */
  clear(): void {
    this.cache.clear()
    this.accessOrder = []
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
    }
  }

  /**
   * 获取缓存大小
   */
  get size(): number {
    return this.cache.size
  }

  /**
   * 获取所有键
   */
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  /**
   * 获取所有值
   */
  values(): T[] {
    return Array.from(this.cache.values()).map(entry => entry.value)
  }

  /**
   * 获取统计信息
   */
  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      size: this.cache.size,
      maxSize: this.options.maxSize,
      hits: this.stats.hits,
      misses: this.stats.misses,
      evictions: this.stats.evictions,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    }
  }

  /**
   * 驱逐最少使用的条目
   */
  private evictLRU(): void {
    if (this.accessOrder.length === 0) return

    const lruKey = this.accessOrder[0]
    this.delete(lruKey)
    this.stats.evictions++
  }

  /**
   * 更新访问顺序
   */
  private updateAccessOrder(key: string): void {
    const index = this.accessOrder.indexOf(key)
    if (index > -1) {
      this.accessOrder.splice(index, 1)
    }
    this.accessOrder.push(key)
  }

  /**
   * 启动过期检查
   */
  private startExpirationCheck(): void {
    this.checkTimer = setInterval(() => {
      this.removeExpired()
    }, this.options.checkInterval!)
  }

  /**
   * 移除过期条目
   */
  private removeExpired(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this.delete(key)
      }
    }
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    if (this.checkTimer) {
      clearInterval(this.checkTimer)
    }
    this.clear()
  }
}
