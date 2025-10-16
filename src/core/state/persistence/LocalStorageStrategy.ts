/**
 * LocalStorage持久化策略
 *
 * 使用浏览器LocalStorage存储状态
 * 适用于小量数据的持久化
 */

import type { IPersistenceStrategy } from './IPersistenceStrategy'
import { PersistenceError } from './IPersistenceStrategy'

/**
 * LocalStorage策略配置
 */
export interface LocalStorageStrategyOptions {
  /** 存储键前缀 */
  prefix?: string

  /** 是否启用压缩 */
  compress?: boolean
}

/**
 * LocalStorage持久化策略
 */
export class LocalStorageStrategy implements IPersistenceStrategy {
  readonly name = 'localStorage'
  private prefix: string

  constructor(private options: LocalStorageStrategyOptions = {}) {
    this.prefix = options.prefix || 'state:'

    // 检查LocalStorage是否可用
    if (!this.isAvailable()) {
      throw new PersistenceError('LocalStorage is not available', this.name, 'init')
    }
  }

  /**
   * 保存状态
   */
  async save(key: string, state: any): Promise<void> {
    try {
      const fullKey = this.getFullKey(key)
      const data = JSON.stringify(state)

      localStorage.setItem(fullKey, data)
    } catch (error) {
      throw new PersistenceError(
        `Failed to save state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'save',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 加载状态
   */
  async load(key: string): Promise<any> {
    try {
      const fullKey = this.getFullKey(key)
      const data = localStorage.getItem(fullKey)

      if (data === null) {
        return null
      }

      return JSON.parse(data)
    } catch (error) {
      throw new PersistenceError(
        `Failed to load state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'load',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 删除状态
   */
  async remove(key: string): Promise<void> {
    try {
      const fullKey = this.getFullKey(key)
      localStorage.removeItem(fullKey)
    } catch (error) {
      throw new PersistenceError(
        `Failed to remove state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'remove',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 清空所有状态
   */
  async clear(): Promise<void> {
    try {
      const keys = await this.keys()
      keys.forEach(key => {
        localStorage.removeItem(this.getFullKey(key))
      })
    } catch (error) {
      throw new PersistenceError(
        `Failed to clear state: ${error instanceof Error ? error.message : 'Unknown error'}`,
        this.name,
        'clear',
        error instanceof Error ? error : undefined
      )
    }
  }

  /**
   * 检查键是否存在
   */
  async has(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key)
    return localStorage.getItem(fullKey) !== null
  }

  /**
   * 获取所有键
   */
  async keys(): Promise<string[]> {
    const keys: string[] = []

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length))
      }
    }

    return keys
  }

  /**
   * 获取完整键名
   */
  private getFullKey(key: string): string {
    return `${this.prefix}${key}`
  }

  /**
   * 检查LocalStorage是否可用
   */
  private isAvailable(): boolean {
    try {
      const testKey = '__test__'
      localStorage.setItem(testKey, 'test')
      localStorage.removeItem(testKey)
      return true
    } catch {
      return false
    }
  }
}
