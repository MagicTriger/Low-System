/**
 * 持久化管理器
 *
 * 核心功能:
 * - 管理持久化策略
 * - 状态过滤和转换
 * - 自动保存和恢复
 * - 加密支持
 */

import type { IPersistenceStrategy, PersistenceOptions } from './IPersistenceStrategy'
import { PersistenceError } from './IPersistenceStrategy'
import type { StateManager } from '../StateManager'

/**
 * 持久化管理器
 */
export class PersistenceManager {
  private strategy: IPersistenceStrategy
  private options: Required<PersistenceOptions>
  private saveTimer: number | null = null
  private unsubscribe: (() => void) | null = null

  constructor(
    private stateManager: StateManager,
    strategy: IPersistenceStrategy,
    options: PersistenceOptions = {}
  ) {
    this.strategy = strategy
    this.options = {
      keyPrefix: options.keyPrefix || 'module:',
      paths: options.paths || [],
      excludePaths: options.excludePaths || [],
      serializer: options.serializer || JSON.stringify,
      deserializer: options.deserializer || JSON.parse,
      encrypt: options.encrypt || false,
      encryptionKey: options.encryptionKey || '',
      throttle: options.throttle || 1000,
      saveOnUnload: options.saveOnUnload ?? true,
    }

    // 订阅状态变更
    this.subscribeToChanges()

    // 页面卸载时保存
    if (this.options.saveOnUnload) {
      this.setupUnloadHandler()
    }
  }

  /**
   * 持久化指定模块的状态
   */
  async persistModule(moduleName: string): Promise<void> {
    try {
      const state = this.stateManager.getState(moduleName)

      if (!state) {
        throw new PersistenceError(`Module "${moduleName}" not found`, this.strategy.name, 'persist')
      }

      // 过滤状态
      const filtered = this.filterState(state)

      // 转换状态
      const transformed = this.transformState(filtered)

      // 加密 (如果启用)
      const data = this.options.encrypt ? this.encrypt(transformed) : transformed

      // 保存
      const key = `${this.options.keyPrefix}${moduleName}`
      await this.strategy.save(key, data)
    } catch (error) {
      console.error(`Failed to persist module "${moduleName}":`, error)
      throw error
    }
  }

  /**
   * 恢复指定模块的状态
   */
  async restoreModule(moduleName: string): Promise<any> {
    try {
      const key = `${this.options.keyPrefix}${moduleName}`
      const data = await this.strategy.load(key)

      if (!data) {
        return null
      }

      // 解密 (如果启用)
      const decrypted = this.options.encrypt ? this.decrypt(data) : data

      // 反转换状态
      const state = this.transformState(decrypted, true)

      return state
    } catch (error) {
      console.error(`Failed to restore module "${moduleName}":`, error)
      throw error
    }
  }

  /**
   * 持久化所有状态
   */
  async persistAll(): Promise<void> {
    const state = this.stateManager.getState()
    const modules = Object.keys(state)

    await Promise.all(modules.map(module => this.persistModule(module)))
  }

  /**
   * 恢复所有状态
   */
  async restoreAll(): Promise<void> {
    const keys = await this.strategy.keys()
    const moduleKeys = keys.filter(key => key.startsWith(this.options.keyPrefix))

    for (const key of moduleKeys) {
      const moduleName = key.substring(this.options.keyPrefix.length)
      const state = await this.restoreModule(moduleName)

      if (state) {
        // 合并到状态管理器
        const currentState = this.stateManager.getState()
        currentState[moduleName] = state
      }
    }
  }

  /**
   * 清空持久化数据
   */
  async clearAll(): Promise<void> {
    const keys = await this.strategy.keys()
    const moduleKeys = keys.filter(key => key.startsWith(this.options.keyPrefix))

    await Promise.all(moduleKeys.map(key => this.strategy.remove(key)))
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe()
      this.unsubscribe = null
    }

    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
      this.saveTimer = null
    }
  }

  // ========== 私有方法 ==========

  /**
   * 订阅状态变更
   */
  private subscribeToChanges(): void {
    this.unsubscribe = this.stateManager.subscribeMutation(() => {
      this.scheduleSave()
    })
  }

  /**
   * 调度保存 (节流)
   */
  private scheduleSave(): void {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer)
    }

    this.saveTimer = window.setTimeout(() => {
      this.persistAll().catch(error => {
        console.error('Failed to auto-save state:', error)
      })
    }, this.options.throttle)
  }

  /**
   * 设置页面卸载处理器
   */
  private setupUnloadHandler(): void {
    window.addEventListener('beforeunload', () => {
      // 同步保存 (使用localStorage作为后备)
      try {
        const state = this.stateManager.getState()
        const filtered = this.filterState(state)
        const transformed = this.transformState(filtered)
        const data = this.options.encrypt ? this.encrypt(transformed) : transformed

        localStorage.setItem(`${this.options.keyPrefix}__backup__`, JSON.stringify(data))
      } catch (error) {
        console.error('Failed to save state on unload:', error)
      }
    })
  }

  /**
   * 过滤状态
   */
  private filterState(state: any): any {
    if (!state || typeof state !== 'object') {
      return state
    }

    const result: any = Array.isArray(state) ? [] : {}

    for (const key in state) {
      const path = key
      const value = state[key]

      // 检查是否在排除路径中
      if (this.isExcluded(path)) {
        continue
      }

      // 检查是否在包含路径中 (如果指定了paths)
      if (this.options.paths.length > 0 && !this.isIncluded(path)) {
        continue
      }

      // 递归过滤
      if (typeof value === 'object' && value !== null) {
        result[key] = this.filterState(value)
      } else {
        result[key] = value
      }
    }

    return result
  }

  /**
   * 检查路径是否被排除
   */
  private isExcluded(path: string): boolean {
    return this.options.excludePaths.some(pattern => {
      return this.matchPath(path, pattern)
    })
  }

  /**
   * 检查路径是否被包含
   */
  private isIncluded(path: string): boolean {
    return this.options.paths.some(pattern => {
      return this.matchPath(path, pattern)
    })
  }

  /**
   * 匹配路径模式
   */
  private matchPath(path: string, pattern: string): boolean {
    // 简单的通配符匹配
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$')
    return regex.test(path)
  }

  /**
   * 转换状态
   */
  private transformState(state: any, reverse = false): any {
    if (reverse) {
      // 反序列化
      if (typeof state === 'string') {
        return this.options.deserializer(state)
      }
      return state
    } else {
      // 序列化
      return this.options.serializer(state)
    }
  }

  /**
   * 加密数据
   */
  private encrypt(data: string): string {
    if (!this.options.encryptionKey) {
      throw new PersistenceError('Encryption key is required', this.strategy.name, 'encrypt')
    }

    // 简单的XOR加密 (生产环境应使用更强的加密算法)
    const key = this.options.encryptionKey
    let encrypted = ''

    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      encrypted += String.fromCharCode(charCode)
    }

    return btoa(encrypted)
  }

  /**
   * 解密数据
   */
  private decrypt(data: string): string {
    if (!this.options.encryptionKey) {
      throw new PersistenceError('Encryption key is required', this.strategy.name, 'decrypt')
    }

    // 简单的XOR解密
    const key = this.options.encryptionKey
    const encrypted = atob(data)
    let decrypted = ''

    for (let i = 0; i < encrypted.length; i++) {
      const charCode = encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      decrypted += String.fromCharCode(charCode)
    }

    return decrypted
  }
}
