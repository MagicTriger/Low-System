/**
 * 配置管理器实现
 * 支持多环境、多源、热更新、验证等功能
 */

import type {
  ConfigValue,
  ConfigObject,
  ConfigChangeEvent,
  ConfigChangeListener,
  IConfigSource,
  IConfigManager,
  ConfigSchema,
  ConfigFieldSchema,
  ValidationResult,
  ValidationError,
  Environment,
  ConfigManagerOptions,
} from './types'
import { ConfigError, ConfigValidationError } from './types'

export class ConfigManager implements IConfigManager {
  private config: ConfigObject = {}
  private sources: Map<string, IConfigSource> = new Map()
  private listeners: Map<string, Set<ConfigChangeListener>> = new Map()
  private globalListeners: Set<ConfigChangeListener> = new Set()
  private schema?: ConfigSchema
  private environment: Environment
  private options: Required<ConfigManagerOptions>
  private unwatchFunctions: Map<string, () => void> = new Map()

  constructor(options: ConfigManagerOptions = {}) {
    this.environment = options.environment || 'development'
    this.schema = options.schema
    this.options = {
      environment: this.environment,
      schema: options.schema,
      sources: options.sources || [],
      enableHotReload: options.enableHotReload ?? true,
      enableValidation: options.enableValidation ?? true,
      enableDebug: options.enableDebug ?? false,
    }

    // 添加初始配置源
    if (this.options.sources) {
      this.options.sources.forEach(source => this.addSource(source))
    }
  }

  // 获取配置值
  get<T = ConfigValue>(key: string, defaultValue?: T): T {
    const value = this.getNestedValue(this.config, key)

    if (value === undefined) {
      // 尝试从schema获取默认值
      if (this.schema) {
        const schemaField = this.getSchemaField(key)
        if (schemaField?.default !== undefined) {
          return schemaField.default as T
        }
      }

      return defaultValue as T
    }

    return value as T
  }

  // 设置配置值
  set(key: string, value: ConfigValue): void {
    const oldValue = this.get(key)

    // 验证值
    if (this.options.enableValidation && this.schema) {
      const schemaField = this.getSchemaField(key)
      if (schemaField) {
        this.validateField(key, value, schemaField)
      }
    }

    // 设置值
    this.setNestedValue(this.config, key, value)

    // 触发变更事件
    this.notifyChange({
      key,
      oldValue,
      newValue: value,
      source: 'manual',
      timestamp: new Date(),
    })

    if (this.options.enableDebug) {
      console.debug(`[ConfigManager] Set ${key} = ${JSON.stringify(value)}`)
    }
  }

  // 检查配置键是否存在
  has(key: string): boolean {
    return this.getNestedValue(this.config, key) !== undefined
  }

  // 获取所有配置
  getAll(): ConfigObject {
    return JSON.parse(JSON.stringify(this.config))
  }

  // 合并配置
  merge(config: ConfigObject): void {
    const oldConfig = this.getAll()
    this.config = this.deepMerge(this.config, config)

    // 触发所有变更的键
    this.notifyMergeChanges(oldConfig, this.config)

    if (this.options.enableDebug) {
      console.debug('[ConfigManager] Merged config:', config)
    }
  }

  // 重置配置
  reset(): void {
    const oldConfig = this.config
    this.config = {}

    // 触发所有键的变更
    this.notifyMergeChanges(oldConfig, {})

    if (this.options.enableDebug) {
      console.debug('[ConfigManager] Reset config')
    }
  }

  // 监听配置变化
  watch(key: string, listener: ConfigChangeListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set())
    }

    this.listeners.get(key)!.add(listener)

    // 返回取消监听函数
    return () => {
      const listeners = this.listeners.get(key)
      if (listeners) {
        listeners.delete(listener)
        if (listeners.size === 0) {
          this.listeners.delete(key)
        }
      }
    }
  }

  // 监听所有配置变化
  watchAll(listener: ConfigChangeListener): () => void {
    this.globalListeners.add(listener)

    return () => {
      this.globalListeners.delete(listener)
    }
  }

  // 添加配置源
  addSource(source: IConfigSource): void {
    if (this.sources.has(source.name)) {
      throw new ConfigError(`Config source already exists: ${source.name}`)
    }

    this.sources.set(source.name, source)

    // 如果支持监听,设置监听
    if (this.options.enableHotReload && source.watch) {
      const unwatch = source.watch(config => {
        this.handleSourceUpdate(source.name, config)
      })
      this.unwatchFunctions.set(source.name, unwatch)
    }

    if (this.options.enableDebug) {
      console.debug(`[ConfigManager] Added source: ${source.name}`)
    }
  }

  // 移除配置源
  removeSource(name: string): void {
    this.sources.delete(name)

    // 取消监听
    const unwatch = this.unwatchFunctions.get(name)
    if (unwatch) {
      unwatch()
      this.unwatchFunctions.delete(name)
    }

    if (this.options.enableDebug) {
      console.debug(`[ConfigManager] Removed source: ${name}`)
    }
  }

  // 重新加载配置
  async reload(): Promise<void> {
    if (this.options.enableDebug) {
      console.debug('[ConfigManager] Reloading config...')
    }

    // 按优先级排序配置源
    const sortedSources = Array.from(this.sources.values()).sort((a, b) => a.priority - b.priority)

    // 加载所有配置源
    const configs = await Promise.all(sortedSources.map(source => source.load()))

    // 合并配置
    const oldConfig = this.getAll()
    this.config = {}

    for (const config of configs) {
      this.config = this.deepMerge(this.config, config)
    }

    // 验证配置
    if (this.options.enableValidation) {
      const result = this.validate()
      if (!result.valid) {
        throw new ConfigValidationError('Config validation failed after reload', result.errors || [])
      }
    }

    // 触发变更事件
    this.notifyMergeChanges(oldConfig, this.config)

    if (this.options.enableDebug) {
      console.debug('[ConfigManager] Config reloaded')
    }
  }

  // 验证配置
  validate(): ValidationResult {
    if (!this.schema) {
      return { valid: true }
    }

    const errors: ValidationError[] = []

    // 验证所有schema字段
    for (const [key, fieldSchema] of Object.entries(this.schema)) {
      const value = this.get(key)

      try {
        this.validateField(key, value, fieldSchema)
      } catch (error) {
        if (error instanceof ConfigError) {
          errors.push({
            path: key,
            message: error.message,
            value,
          })
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    }
  }

  // 设置配置模式
  setSchema(schema: ConfigSchema): void {
    this.schema = schema

    // 验证当前配置
    if (this.options.enableValidation) {
      const result = this.validate()
      if (!result.valid) {
        console.warn('[ConfigManager] Current config does not match schema:', result.errors)
      }
    }
  }

  // 获取当前环境
  getEnvironment(): Environment {
    return this.environment
  }

  // 设置环境
  setEnvironment(env: Environment): void {
    const oldEnv = this.environment
    this.environment = env

    if (this.options.enableDebug) {
      console.debug(`[ConfigManager] Environment changed: ${oldEnv} -> ${env}`)
    }
  }

  // 私有方法

  private getNestedValue(obj: ConfigObject, path: string): ConfigValue | undefined {
    const keys = path.split('.')
    let current: any = obj

    for (const key of keys) {
      if (current === null || current === undefined) {
        return undefined
      }
      current = current[key]
    }

    return current
  }

  private setNestedValue(obj: ConfigObject, path: string, value: ConfigValue): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    let current: any = obj

    for (const key of keys) {
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {}
      }
      current = current[key]
    }

    current[lastKey] = value
  }

  private deepMerge(target: ConfigObject, source: ConfigObject): ConfigObject {
    const result = { ...target }

    for (const [key, value] of Object.entries(source)) {
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        result[key] = this.deepMerge((result[key] as ConfigObject) || {}, value as ConfigObject)
      } else {
        result[key] = value
      }
    }

    return result
  }

  private notifyChange(event: ConfigChangeEvent): void {
    // 通知特定键的监听器
    const listeners = this.listeners.get(event.key)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error('[ConfigManager] Listener error:', error)
        }
      })
    }

    // 通知全局监听器
    this.globalListeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('[ConfigManager] Global listener error:', error)
      }
    })
  }

  private notifyMergeChanges(oldConfig: ConfigObject, newConfig: ConfigObject): void {
    const allKeys = new Set([...this.getAllKeys(oldConfig), ...this.getAllKeys(newConfig)])

    for (const key of allKeys) {
      const oldValue = this.getNestedValue(oldConfig, key)
      const newValue = this.getNestedValue(newConfig, key)

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        this.notifyChange({
          key,
          oldValue: oldValue!,
          newValue: newValue!,
          source: 'merge',
          timestamp: new Date(),
        })
      }
    }
  }

  private getAllKeys(obj: ConfigObject, prefix = ''): string[] {
    const keys: string[] = []

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key
      keys.push(fullKey)

      if (value && typeof value === 'object' && !Array.isArray(value)) {
        keys.push(...this.getAllKeys(value as ConfigObject, fullKey))
      }
    }

    return keys
  }

  private handleSourceUpdate(sourceName: string, config: ConfigObject): void {
    if (this.options.enableDebug) {
      console.debug(`[ConfigManager] Source updated: ${sourceName}`)
    }

    // 重新加载配置
    this.reload().catch(error => {
      console.error('[ConfigManager] Failed to reload after source update:', error)
    })
  }

  private getSchemaField(key: string): ConfigFieldSchema | undefined {
    if (!this.schema) {
      return undefined
    }

    return this.schema[key]
  }

  private validateField(key: string, value: ConfigValue, schema: ConfigFieldSchema): void {
    // 检查必填
    if (schema.required && (value === undefined || value === null)) {
      throw new ConfigError(`Config field is required: ${key}`, key)
    }

    // 如果值为undefined且不是必填,跳过验证
    if (value === undefined || value === null) {
      return
    }

    // 检查类型
    const actualType = Array.isArray(value) ? 'array' : typeof value
    if (actualType !== schema.type) {
      throw new ConfigError(`Config field type mismatch: ${key} (expected ${schema.type}, got ${actualType})`, key)
    }

    // 检查枚举
    if (schema.enum && !schema.enum.includes(value)) {
      throw new ConfigError(`Config field value not in enum: ${key} (value: ${value})`, key)
    }

    // 检查数值范围
    if (typeof value === 'number') {
      if (schema.min !== undefined && value < schema.min) {
        throw new ConfigError(`Config field value too small: ${key} (min: ${schema.min}, value: ${value})`, key)
      }
      if (schema.max !== undefined && value > schema.max) {
        throw new ConfigError(`Config field value too large: ${key} (max: ${schema.max}, value: ${value})`, key)
      }
    }

    // 检查字符串模式
    if (typeof value === 'string' && schema.pattern) {
      if (!schema.pattern.test(value)) {
        throw new ConfigError(`Config field value does not match pattern: ${key}`, key)
      }
    }

    // 自定义验证
    if (schema.validate) {
      const result = schema.validate(value)
      if (result === false) {
        throw new ConfigError(`Config field validation failed: ${key}`, key)
      }
      if (typeof result === 'string') {
        throw new ConfigError(`Config field validation failed: ${key} (${result})`, key)
      }
    }
  }
}

// 导出全局配置管理器实例
export const globalConfig = new ConfigManager()
