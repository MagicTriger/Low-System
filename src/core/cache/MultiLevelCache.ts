/**
 * 多级缓存系统
 * 支持内存缓存、LocalStorage和IndexedDB
 */

import { LRUCache, type CacheOptions } from './LRUCache'

export type CacheLevel = 'memory' | 'localStorage' | 'indexedDB'

export interface MultiLevelCacheOptions {
  /** 内存缓存配置 */
  memory?: CacheOptions
  /** 是否启用LocalStorage */
  localStorage?: boolean
  /** 是否启用IndexedDB */
  indexedDB?: boolean
  /** IndexedDB数据库名 */
  dbName?: string
}

export interface CacheProvider {
  get(key: string): Promise<any>
  set(key: string, value: any, ttl?: number): Promise<void>
  has(key: string): Promise<boolean>
  delete(key: string): Promise<boolean>
  clear(): Promise<void>
}

/**
 * LocalStorage缓存提供者
 */
class LocalStorageProvider implements CacheProvider {
  private prefix = 'cache:'

  async get(key: string): Promise<any> {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return undefined

      const { value, expiresAt } = JSON.parse(item)

      if (expiresAt && Date.now() > expiresAt) {
        await this.delete(key)
        return undefined
      }

      return value
    } catch {
      return undefined
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const item = {
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
      }
      localStorage.setItem(this.prefix + key, JSON.stringify(item))
    } catch (error) {
      console.warn('LocalStorage set failed:', error)
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== undefined
  }

  async delete(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch {
      return false
    }
  }

  async clear(): Promise<void> {
    const keys = Object.keys(localStorage)
    for (const key of keys) {
      if (key.startsWith(this.prefix)) {
        localStorage.removeItem(key)
      }
    }
  }
}

/**
 * IndexedDB缓存提供者
 */
class IndexedDBProvider implements CacheProvider {
  private db: IDBDatabase | null = null
  private dbName: string
  private storeName = 'cache'

  constructor(dbName = 'app-cache') {
    this.dbName = dbName
  }

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'key' })
        }
      }
    })
  }

  async get(key: string): Promise<any> {
    try {
      const db = await this.getDB()
      const tx = db.transaction([this.storeName], 'readonly')
      const store = tx.objectStore(this.storeName)

      return new Promise((resolve, reject) => {
        const request = store.get(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
          const result = request.result
          if (!result) {
            resolve(undefined)
            return
          }

          if (result.expiresAt && Date.now() > result.expiresAt) {
            this.delete(key)
            resolve(undefined)
            return
          }

          resolve(result.value)
        }
      })
    } catch {
      return undefined
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const db = await this.getDB()
      const tx = db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)

      const item = {
        key,
        value,
        expiresAt: ttl ? Date.now() + ttl : undefined,
      }

      return new Promise((resolve, reject) => {
        const request = store.put(item)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('IndexedDB set failed:', error)
    }
  }

  async has(key: string): Promise<boolean> {
    const value = await this.get(key)
    return value !== undefined
  }

  async delete(key: string): Promise<boolean> {
    try {
      const db = await this.getDB()
      const tx = db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)

      return new Promise((resolve, reject) => {
        const request = store.delete(key)
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(true)
      })
    } catch {
      return false
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB()
      const tx = db.transaction([this.storeName], 'readwrite')
      const store = tx.objectStore(this.storeName)

      return new Promise((resolve, reject) => {
        const request = store.clear()
        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.warn('IndexedDB clear failed:', error)
    }
  }
}

/**
 * 多级缓存
 */
export class MultiLevelCache {
  private memoryCache: LRUCache
  private providers: Map<CacheLevel, CacheProvider> = new Map()

  constructor(options: MultiLevelCacheOptions = {}) {
    // 初始化内存缓存
    this.memoryCache = new LRUCache(options.memory || { maxSize: 100, ttl: 300000 })

    // 初始化LocalStorage
    if (options.localStorage !== false) {
      this.providers.set('localStorage', new LocalStorageProvider())
    }

    // 初始化IndexedDB
    if (options.indexedDB) {
      this.providers.set('indexedDB', new IndexedDBProvider(options.dbName))
    }
  }

  /**
   * 获取缓存值(从最快的层级开始查找)
   */
  async get<T = any>(key: string): Promise<T | undefined> {
    // 1. 检查内存缓存
    let value = this.memoryCache.get(key)
    if (value !== undefined) {
      return value
    }

    // 2. 检查LocalStorage
    const localStorageProvider = this.providers.get('localStorage')
    if (localStorageProvider) {
      value = await localStorageProvider.get(key)
      if (value !== undefined) {
        // 回填到内存缓存
        this.memoryCache.set(key, value)
        return value
      }
    }

    // 3. 检查IndexedDB
    const indexedDBProvider = this.providers.get('indexedDB')
    if (indexedDBProvider) {
      value = await indexedDBProvider.get(key)
      if (value !== undefined) {
        // 回填到上层缓存
        this.memoryCache.set(key, value)
        if (localStorageProvider) {
          await localStorageProvider.set(key, value)
        }
        return value
      }
    }

    return undefined
  }

  /**
   * 设置缓存值(写入所有层级)
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    // 写入内存缓存
    this.memoryCache.set(key, value, ttl)

    // 写入持久化层
    const promises: Promise<void>[] = []

    for (const provider of this.providers.values()) {
      promises.push(provider.set(key, value, ttl))
    }

    await Promise.allSettled(promises)
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    if (this.memoryCache.has(key)) {
      return true
    }

    for (const provider of this.providers.values()) {
      if (await provider.has(key)) {
        return true
      }
    }

    return false
  }

  /**
   * 删除缓存
   */
  async delete(key: string): Promise<boolean> {
    this.memoryCache.delete(key)

    const promises: Promise<boolean>[] = []
    for (const provider of this.providers.values()) {
      promises.push(provider.delete(key))
    }

    const results = await Promise.allSettled(promises)
    return results.some(r => r.status === 'fulfilled' && r.value)
  }

  /**
   * 清空所有缓存
   */
  async clear(): Promise<void> {
    this.memoryCache.clear()

    const promises: Promise<void>[] = []
    for (const provider of this.providers.values()) {
      promises.push(provider.clear())
    }

    await Promise.allSettled(promises)
  }

  /**
   * 获取内存缓存统计
   */
  getStats() {
    return this.memoryCache.getStats()
  }

  /**
   * 销毁缓存
   */
  destroy(): void {
    this.memoryCache.destroy()
  }
}
