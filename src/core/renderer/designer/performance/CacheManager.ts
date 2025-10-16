// 缓存管理器 - 提供多层级缓存策略
export interface CacheEntry<T = any> {
  key: string
  value: T
  timestamp: number
  ttl: number
  size: number
  accessCount: number
  lastAccessed: number
  tags: string[]
  metadata: Record<string, any>
}

export interface CacheConfig {
  maxSize: number
  maxMemory: number
  defaultTTL: number
  cleanupInterval: number
  compressionThreshold: number
  persistentStorage: boolean
  storagePrefix: string
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'ttl'
  enableCompression: boolean
  enableEncryption: boolean
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  deletes: number
  evictions: number
  totalSize: number
  totalMemory: number
  hitRate: number
  memoryUsage: number
}

export interface CacheLayer {
  name: string
  priority: number
  maxSize: number
  ttl: number
  enabled: boolean
}

// 默认配置
export const defaultCacheConfig: CacheConfig = {
  maxSize: 1000,
  maxMemory: 50 * 1024 * 1024, // 50MB
  defaultTTL: 300000, // 5分钟
  cleanupInterval: 60000, // 1分钟
  compressionThreshold: 1024, // 1KB
  persistentStorage: true,
  storagePrefix: 'lowcode_cache_',
  evictionPolicy: 'lru',
  enableCompression: true,
  enableEncryption: false
}

// 缓存层级定义
export const defaultCacheLayers: CacheLayer[] = [
  {
    name: 'memory',
    priority: 1,
    maxSize: 500,
    ttl: 60000, // 1分钟
    enabled: true
  },
  {
    name: 'session',
    priority: 2,
    maxSize: 200,
    ttl: 300000, // 5分钟
    enabled: true
  },
  {
    name: 'local',
    priority: 3,
    maxSize: 100,
    ttl: 3600000, // 1小时
    enabled: true
  },
  {
    name: 'indexed',
    priority: 4,
    maxSize: 50,
    ttl: 86400000, // 24小时
    enabled: true
  }
]

// 缓存管理器类
export class CacheManager {
  private config: CacheConfig
  private layers: Map<string, Map<string, CacheEntry>>
  private layerConfigs: Map<string, CacheLayer>
  private stats: CacheStats
  private cleanupTimer: number | null = null
  private compressionWorker: Worker | null = null
  private encryptionKey: CryptoKey | null = null

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...defaultCacheConfig, ...config }
    this.layers = new Map()
    this.layerConfigs = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0,
      totalSize: 0,
      totalMemory: 0,
      hitRate: 0,
      memoryUsage: 0
    }

    this.initializeLayers()
    this.startCleanupTimer()
    this.initializeWorkers()
  }

  // 初始化缓存层
  private initializeLayers(): void {
    for (const layer of defaultCacheLayers) {
      if (layer.enabled) {
        this.layers.set(layer.name, new Map())
        this.layerConfigs.set(layer.name, layer)
      }
    }
  }

  // 启动清理定时器
  private startCleanupTimer(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
    }

    this.cleanupTimer = window.setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  // 初始化 Workers
  private async initializeWorkers(): Promise<void> {
    // 压缩 Worker
    if (this.config.enableCompression && window.Worker) {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { action, data, id } = e.data;
            
            if (action === 'compress') {
              try {
                const compressed = JSON.stringify(data);
                self.postMessage({ id, result: compressed, error: null });
              } catch (error) {
                self.postMessage({ id, result: null, error: error.message });
              }
            } else if (action === 'decompress') {
              try {
                const decompressed = JSON.parse(data);
                self.postMessage({ id, result: decompressed, error: null });
              } catch (error) {
                self.postMessage({ id, result: null, error: error.message });
              }
            }
          };
        `
        
        const blob = new Blob([workerCode], { type: 'application/javascript' })
        this.compressionWorker = new Worker(URL.createObjectURL(blob))
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error)
      }
    }

    // 加密密钥
    if (this.config.enableEncryption && window.crypto && window.crypto.subtle) {
      try {
        this.encryptionKey = await window.crypto.subtle.generateKey(
          { name: 'AES-GCM', length: 256 },
          false,
          ['encrypt', 'decrypt']
        )
      } catch (error) {
        console.warn('Failed to generate encryption key:', error)
      }
    }
  }

  // 获取缓存
  async get<T = any>(key: string, layer?: string): Promise<T | null> {
    const layers = layer ? [layer] : Array.from(this.layerConfigs.keys()).sort(
      (a, b) => this.layerConfigs.get(a)!.priority - this.layerConfigs.get(b)!.priority
    )

    for (const layerName of layers) {
      const layerCache = this.layers.get(layerName)
      if (!layerCache) continue

      const entry = layerCache.get(key)
      if (!entry) continue

      // 检查是否过期
      if (this.isExpired(entry)) {
        layerCache.delete(key)
        this.stats.evictions++
        continue
      }

      // 更新访问统计
      entry.accessCount++
      entry.lastAccessed = Date.now()
      this.stats.hits++

      // 解压缩和解密
      let value = entry.value
      if (this.config.enableCompression && entry.size > this.config.compressionThreshold) {
        value = await this.decompress(value)
      }
      if (this.config.enableEncryption) {
        value = await this.decrypt(value)
      }

      // 提升到更高优先级的层
      if (layerName !== layers[0]) {
        await this.promoteToHigherLayer(key, entry, layers[0])
      }

      this.updateStats()
      return value
    }

    this.stats.misses++
    this.updateStats()
    return null
  }

  // 设置缓存
  async set<T = any>(
    key: string, 
    value: T, 
    options: {
      ttl?: number
      layer?: string
      tags?: string[]
      metadata?: Record<string, any>
    } = {}
  ): Promise<void> {
    const ttl = options.ttl || this.config.defaultTTL
    const targetLayer = options.layer || 'memory'
    const tags = options.tags || []
    const metadata = options.metadata || {}

    const layerCache = this.layers.get(targetLayer)
    if (!layerCache) {
      throw new Error(`Cache layer '${targetLayer}' not found`)
    }

    // 计算大小
    const size = this.calculateSize(value)

    // 压缩和加密
    let processedValue = value
    if (this.config.enableEncryption) {
      processedValue = await this.encrypt(processedValue)
    }
    if (this.config.enableCompression && size > this.config.compressionThreshold) {
      processedValue = await this.compress(processedValue)
    }

    const entry: CacheEntry<T> = {
      key,
      value: processedValue,
      timestamp: Date.now(),
      ttl,
      size,
      accessCount: 0,
      lastAccessed: Date.now(),
      tags,
      metadata
    }

    // 检查容量限制
    await this.ensureCapacity(targetLayer, size)

    layerCache.set(key, entry)
    this.stats.sets++
    this.stats.totalSize++
    this.stats.totalMemory += size

    // 持久化存储
    if (this.config.persistentStorage && (targetLayer === 'local' || targetLayer === 'indexed')) {
      await this.persistEntry(targetLayer, key, entry)
    }

    this.updateStats()
  }

  // 删除缓存
  async delete(key: string, layer?: string): Promise<boolean> {
    let deleted = false
    const layers = layer ? [layer] : Array.from(this.layers.keys())

    for (const layerName of layers) {
      const layerCache = this.layers.get(layerName)
      if (!layerCache) continue

      const entry = layerCache.get(key)
      if (entry) {
        layerCache.delete(key)
        this.stats.deletes++
        this.stats.totalSize--
        this.stats.totalMemory -= entry.size
        deleted = true

        // 从持久化存储中删除
        if (this.config.persistentStorage && (layerName === 'local' || layerName === 'indexed')) {
          await this.removePersistentEntry(layerName, key)
        }
      }
    }

    if (deleted) {
      this.updateStats()
    }

    return deleted
  }

  // 清空缓存
  async clear(layer?: string): Promise<void> {
    const layers = layer ? [layer] : Array.from(this.layers.keys())

    for (const layerName of layers) {
      const layerCache = this.layers.get(layerName)
      if (!layerCache) continue

      const size = layerCache.size
      const memory = Array.from(layerCache.values()).reduce((sum, entry) => sum + entry.size, 0)

      layerCache.clear()
      this.stats.totalSize -= size
      this.stats.totalMemory -= memory

      // 清空持久化存储
      if (this.config.persistentStorage && (layerName === 'local' || layerName === 'indexed')) {
        await this.clearPersistentStorage(layerName)
      }
    }

    this.updateStats()
  }

  // 检查缓存是否存在
  has(key: string, layer?: string): boolean {
    const layers = layer ? [layer] : Array.from(this.layers.keys())

    for (const layerName of layers) {
      const layerCache = this.layers.get(layerName)
      if (!layerCache) continue

      const entry = layerCache.get(key)
      if (entry && !this.isExpired(entry)) {
        return true
      }
    }

    return false
  }

  // 获取缓存大小
  size(layer?: string): number {
    if (layer) {
      return this.layers.get(layer)?.size || 0
    }

    return Array.from(this.layers.values()).reduce((sum, cache) => sum + cache.size, 0)
  }

  // 获取缓存键列表
  keys(layer?: string): string[] {
    const allKeys: string[] = []
    const layers = layer ? [layer] : Array.from(this.layers.keys())

    for (const layerName of layers) {
      const layerCache = this.layers.get(layerName)
      if (layerCache) {
        allKeys.push(...Array.from(layerCache.keys()))
      }
    }

    return [...new Set(allKeys)]
  }

  // 根据标签删除缓存
  async deleteByTag(tag: string): Promise<number> {
    let deletedCount = 0

    for (const [layerName, layerCache] of this.layers) {
      const keysToDelete: string[] = []

      for (const [key, entry] of layerCache) {
        if (entry.tags.includes(tag)) {
          keysToDelete.push(key)
        }
      }

      for (const key of keysToDelete) {
        await this.delete(key, layerName)
        deletedCount++
      }
    }

    return deletedCount
  }

  // 获取缓存统计
  getStats(): CacheStats {
    return { ...this.stats }
  }

  // 获取缓存配置
  getConfig(): CacheConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(config: Partial<CacheConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (config.cleanupInterval) {
      this.startCleanupTimer()
    }
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = Date.now()
    let cleanedCount = 0

    for (const [layerName, layerCache] of this.layers) {
      const keysToDelete: string[] = []

      for (const [key, entry] of layerCache) {
        if (this.isExpired(entry)) {
          keysToDelete.push(key)
        }
      }

      for (const key of keysToDelete) {
        const entry = layerCache.get(key)!
        layerCache.delete(key)
        this.stats.evictions++
        this.stats.totalSize--
        this.stats.totalMemory -= entry.size
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.updateStats()
    }
  }

  // 检查缓存是否过期
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl
  }

  // 确保容量
  private async ensureCapacity(layerName: string, requiredSize: number): Promise<void> {
    const layerCache = this.layers.get(layerName)!
    const layerConfig = this.layerConfigs.get(layerName)!

    // 检查数量限制
    if (layerCache.size >= layerConfig.maxSize) {
      await this.evictEntries(layerName, 1)
    }

    // 检查内存限制
    const currentMemory = Array.from(layerCache.values()).reduce((sum, entry) => sum + entry.size, 0)
    if (currentMemory + requiredSize > this.config.maxMemory) {
      const memoryToFree = currentMemory + requiredSize - this.config.maxMemory
      await this.evictByMemory(layerName, memoryToFree)
    }
  }

  // 驱逐缓存条目
  private async evictEntries(layerName: string, count: number): Promise<void> {
    const layerCache = this.layers.get(layerName)!
    const entries = Array.from(layerCache.entries())

    let entriesToEvict: [string, CacheEntry][] = []

    switch (this.config.evictionPolicy) {
      case 'lru':
        entriesToEvict = entries
          .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
          .slice(0, count)
        break

      case 'lfu':
        entriesToEvict = entries
          .sort(([, a], [, b]) => a.accessCount - b.accessCount)
          .slice(0, count)
        break

      case 'fifo':
        entriesToEvict = entries
          .sort(([, a], [, b]) => a.timestamp - b.timestamp)
          .slice(0, count)
        break

      case 'ttl':
        entriesToEvict = entries
          .sort(([, a], [, b]) => (a.timestamp + a.ttl) - (b.timestamp + b.ttl))
          .slice(0, count)
        break
    }

    for (const [key] of entriesToEvict) {
      await this.delete(key, layerName)
    }
  }

  // 根据内存驱逐
  private async evictByMemory(layerName: string, memoryToFree: number): Promise<void> {
    const layerCache = this.layers.get(layerName)!
    const entries = Array.from(layerCache.entries())
      .sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)

    let freedMemory = 0
    for (const [key, entry] of entries) {
      if (freedMemory >= memoryToFree) break

      await this.delete(key, layerName)
      freedMemory += entry.size
    }
  }

  // 提升到更高层级
  private async promoteToHigherLayer(key: string, entry: CacheEntry, targetLayer: string): Promise<void> {
    await this.set(key, entry.value, {
      ttl: entry.ttl - (Date.now() - entry.timestamp),
      layer: targetLayer,
      tags: entry.tags,
      metadata: entry.metadata
    })
  }

  // 计算大小
  private calculateSize(value: any): number {
    try {
      return new Blob([JSON.stringify(value)]).size
    } catch {
      return JSON.stringify(value).length * 2 // 粗略估算
    }
  }

  // 压缩数据
  private async compress(data: any): Promise<any> {
    if (!this.compressionWorker) return data

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage)
          
          if (e.data.error) {
            reject(new Error(e.data.error))
          } else {
            resolve(e.data.result)
          }
        }
      }

      this.compressionWorker.addEventListener('message', handleMessage)
      this.compressionWorker.postMessage({ action: 'compress', data, id })
    })
  }

  // 解压缩数据
  private async decompress(data: any): Promise<any> {
    if (!this.compressionWorker) return data

    return new Promise((resolve, reject) => {
      const id = Math.random().toString(36).substr(2, 9)
      
      const handleMessage = (e: MessageEvent) => {
        if (e.data.id === id) {
          this.compressionWorker!.removeEventListener('message', handleMessage)
          
          if (e.data.error) {
            reject(new Error(e.data.error))
          } else {
            resolve(e.data.result)
          }
        }
      }

      this.compressionWorker.addEventListener('message', handleMessage)
      this.compressionWorker.postMessage({ action: 'decompress', data, id })
    })
  }

  // 加密数据
  private async encrypt(data: any): Promise<any> {
    if (!this.encryptionKey || !window.crypto.subtle) return data

    try {
      const jsonString = JSON.stringify(data)
      const encoder = new TextEncoder()
      const dataBuffer = encoder.encode(jsonString)
      
      const iv = window.crypto.getRandomValues(new Uint8Array(12))
      const encrypted = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        dataBuffer
      )

      return {
        encrypted: Array.from(new Uint8Array(encrypted)),
        iv: Array.from(iv)
      }
    } catch (error) {
      console.warn('Encryption failed:', error)
      return data
    }
  }

  // 解密数据
  private async decrypt(data: any): Promise<any> {
    if (!this.encryptionKey || !window.crypto.subtle || !data.encrypted) return data

    try {
      const encrypted = new Uint8Array(data.encrypted)
      const iv = new Uint8Array(data.iv)
      
      const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        this.encryptionKey,
        encrypted
      )

      const decoder = new TextDecoder()
      const jsonString = decoder.decode(decrypted)
      return JSON.parse(jsonString)
    } catch (error) {
      console.warn('Decryption failed:', error)
      return data
    }
  }

  // 持久化缓存条目
  private async persistEntry(layer: string, key: string, entry: CacheEntry): Promise<void> {
    const storageKey = `${this.config.storagePrefix}${layer}_${key}`

    try {
      if (layer === 'local') {
        localStorage.setItem(storageKey, JSON.stringify(entry))
      } else if (layer === 'indexed' && window.indexedDB) {
        // IndexedDB 实现
        const request = indexedDB.open('lowcode_cache', 1)
        
        request.onupgradeneeded = () => {
          const db = request.result
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache', { keyPath: 'key' })
          }
        }

        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['cache'], 'readwrite')
          const store = transaction.objectStore('cache')
          store.put({ key: storageKey, ...entry })
        }
      }
    } catch (error) {
      console.warn('Failed to persist cache entry:', error)
    }
  }

  // 删除持久化条目
  private async removePersistentEntry(layer: string, key: string): Promise<void> {
    const storageKey = `${this.config.storagePrefix}${layer}_${key}`

    try {
      if (layer === 'local') {
        localStorage.removeItem(storageKey)
      } else if (layer === 'indexed' && window.indexedDB) {
        const request = indexedDB.open('lowcode_cache', 1)
        
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['cache'], 'readwrite')
          const store = transaction.objectStore('cache')
          store.delete(storageKey)
        }
      }
    } catch (error) {
      console.warn('Failed to remove persistent cache entry:', error)
    }
  }

  // 清空持久化存储
  private async clearPersistentStorage(layer: string): Promise<void> {
    try {
      if (layer === 'local') {
        const keys = Object.keys(localStorage).filter(key => 
          key.startsWith(`${this.config.storagePrefix}${layer}_`)
        )
        keys.forEach(key => localStorage.removeItem(key))
      } else if (layer === 'indexed' && window.indexedDB) {
        const request = indexedDB.open('lowcode_cache', 1)
        
        request.onsuccess = () => {
          const db = request.result
          const transaction = db.transaction(['cache'], 'readwrite')
          const store = transaction.objectStore('cache')
          store.clear()
        }
      }
    } catch (error) {
      console.warn('Failed to clear persistent storage:', error)
    }
  }

  // 更新统计信息
  private updateStats(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
    this.stats.memoryUsage = this.stats.totalMemory / this.config.maxMemory
  }

  // 销毁缓存管理器
  destroy(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    if (this.compressionWorker) {
      this.compressionWorker.terminate()
      this.compressionWorker = null
    }

    this.layers.clear()
    this.layerConfigs.clear()
  }
}

// 工具函数
export function createCacheManager(config?: Partial<CacheConfig>): CacheManager {
  return new CacheManager(config)
}

export function validateCacheConfig(config: Partial<CacheConfig>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.maxSize && config.maxSize < 1) {
    errors.push('maxSize must be at least 1')
  }

  if (config.maxMemory && config.maxMemory < 1024) {
    errors.push('maxMemory must be at least 1024 bytes')
  }

  if (config.defaultTTL && config.defaultTTL < 1000) {
    errors.push('defaultTTL must be at least 1000ms')
  }

  if (config.cleanupInterval && config.cleanupInterval < 10000) {
    errors.push('cleanupInterval must be at least 10000ms')
  }

  if (config.evictionPolicy && !['lru', 'lfu', 'fifo', 'ttl'].includes(config.evictionPolicy)) {
    errors.push('evictionPolicy must be one of: lru, lfu, fifo, ttl')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 全局缓存管理器实例
export const globalCacheManager = createCacheManager()

// Vue 组合式 API
export function useCacheManager() {
  return {
    cache: globalCacheManager,
    get: globalCacheManager.get.bind(globalCacheManager),
    set: globalCacheManager.set.bind(globalCacheManager),
    delete: globalCacheManager.delete.bind(globalCacheManager),
    clear: globalCacheManager.clear.bind(globalCacheManager),
    has: globalCacheManager.has.bind(globalCacheManager),
    size: globalCacheManager.size.bind(globalCacheManager),
    keys: globalCacheManager.keys.bind(globalCacheManager),
    getStats: globalCacheManager.getStats.bind(globalCacheManager)
  }
}