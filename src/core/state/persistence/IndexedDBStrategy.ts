/**
 * IndexedDB持久化策略
 *
 * 使用浏览器IndexedDB存储状态
 * 适用于大量数据的持久化
 */

import type { IPersistenceStrategy } from './IPersistenceStrategy'
import { PersistenceError } from './IPersistenceStrategy'

/**
 * IndexedDB策略配置
 */
export interface IndexedDBStrategyOptions {
  /** 数据库名称 */
  dbName?: string

  /** 对象存储名称 */
  storeName?: string

  /** 数据库版本 */
  version?: number
}

/**
 * IndexedDB持久化策略
 */
export class IndexedDBStrategy implements IPersistenceStrategy {
  readonly name = 'indexedDB'
  private dbName: string
  private storeName: string
  private version: number
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  constructor(private options: IndexedDBStrategyOptions = {}) {
    this.dbName = options.dbName || 'StateDB'
    this.storeName = options.storeName || 'state'
    this.version = options.version || 1

    // 检查IndexedDB是否可用
    if (!this.isAvailable()) {
      throw new PersistenceError('IndexedDB is not available', this.name, 'init')
    }
  }

  /**
   * 初始化数据库
   */
  private async init(): Promise<void> {
    if (this.db) return

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        reject(new PersistenceError('Failed to open IndexedDB', this.name, 'init', request.error || undefined))
      }

      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result

        // 创建对象存储
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName)
        }
      }
    })

    return this.initPromise
  }

  /**
   * 保存状态
   */
  async save(key: string, state: any): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(state, key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new PersistenceError('Failed to save state', this.name, 'save', request.error || undefined))
    })
  }

  /**
   * 加载状态
   */
  async load(key: string): Promise<any> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => resolve(request.result || null)
      request.onerror = () => reject(new PersistenceError('Failed to load state', this.name, 'load', request.error || undefined))
    })
  }

  /**
   * 删除状态
   */
  async remove(key: string): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new PersistenceError('Failed to remove state', this.name, 'remove', request.error || undefined))
    })
  }

  /**
   * 清空所有状态
   */
  async clear(): Promise<void> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => resolve()
      request.onerror = () => reject(new PersistenceError('Failed to clear state', this.name, 'clear', request.error || undefined))
    })
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getKey(key)

      request.onsuccess = () => resolve(request.result !== undefined)
      request.onerror = () => reject(new PersistenceError('Failed to check key existence', this.name, 'has', request.error || undefined))
    })
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => resolve(request.result as string[])
      request.onerror = () => reject(new PersistenceError('Failed to get keys', this.name, 'keys', request.error || undefined))
    })
  }

  /**
   * 关闭数据库连接
   */
  close(): void {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }

  /**
   * 检查IndexedDB是否可用
   */
  private isAvailable(): boolean {
    return typeof indexedDB !== 'undefined'
  }
}
