/**
 * 配置管理系统类型定义
 */

// 配置值类型
export type ConfigValue = string | number | boolean | null | ConfigObject | ConfigArray

export interface ConfigObject {
  [key: string]: ConfigValue
}

export type ConfigArray = ConfigValue[]

// 环境类型
export type Environment = 'development' | 'production' | 'test' | 'staging'

// 配置源接口
export interface IConfigSource {
  /**
   * 配置源名称
   */
  readonly name: string

  /**
   * 配置源优先级 (数字越大优先级越高)
   */
  readonly priority: number

  /**
   * 加载配置
   */
  load(): Promise<ConfigObject>

  /**
   * 监听配置变化
   */
  watch?(callback: (config: ConfigObject) => void): () => void
}

// 配置变更事件
export interface ConfigChangeEvent {
  /** 变更的键路径 */
  key: string
  /** 旧值 */
  oldValue: ConfigValue
  /** 新值 */
  newValue: ConfigValue
  /** 变更来源 */
  source: string
  /** 变更时间 */
  timestamp: Date
}

// 配置监听器
export type ConfigChangeListener = (event: ConfigChangeEvent) => void

// 配置验证器
export interface IConfigValidator {
  /**
   * 验证配置
   */
  validate(config: ConfigObject): ValidationResult
}

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
}

export interface ValidationError {
  path: string
  message: string
  value?: ConfigValue
}

// 配置模式定义
export interface ConfigSchema {
  [key: string]: ConfigFieldSchema
}

export interface ConfigFieldSchema {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  required?: boolean
  default?: ConfigValue
  description?: string
  validate?: (value: ConfigValue) => boolean | string
  enum?: ConfigValue[]
  min?: number
  max?: number
  pattern?: RegExp
}

// 配置管理器接口
export interface IConfigManager {
  /**
   * 获取配置值
   */
  get<T = ConfigValue>(key: string, defaultValue?: T): T

  /**
   * 设置配置值
   */
  set(key: string, value: ConfigValue): void

  /**
   * 检查配置键是否存在
   */
  has(key: string): boolean

  /**
   * 获取所有配置
   */
  getAll(): ConfigObject

  /**
   * 合并配置
   */
  merge(config: ConfigObject): void

  /**
   * 重置配置
   */
  reset(): void

  /**
   * 监听配置变化
   */
  watch(key: string, listener: ConfigChangeListener): () => void

  /**
   * 监听所有配置变化
   */
  watchAll(listener: ConfigChangeListener): () => void

  /**
   * 添加配置源
   */
  addSource(source: IConfigSource): void

  /**
   * 移除配置源
   */
  removeSource(name: string): void

  /**
   * 重新加载配置
   */
  reload(): Promise<void>

  /**
   * 验证配置
   */
  validate(): ValidationResult

  /**
   * 设置配置模式
   */
  setSchema(schema: ConfigSchema): void

  /**
   * 获取当前环境
   */
  getEnvironment(): Environment

  /**
   * 设置环境
   */
  setEnvironment(env: Environment): void
}

// 配置管理器选项
export interface ConfigManagerOptions {
  /** 默认环境 */
  environment?: Environment
  /** 配置模式 */
  schema?: ConfigSchema
  /** 配置源列表 */
  sources?: IConfigSource[]
  /** 是否启用热更新 */
  enableHotReload?: boolean
  /** 是否启用验证 */
  enableValidation?: boolean
  /** 是否启用调试日志 */
  enableDebug?: boolean
}

// 配置错误类
export class ConfigError extends Error {
  constructor(
    message: string,
    public key?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'ConfigError'
  }
}

// 配置验证错误
export class ConfigValidationError extends ConfigError {
  constructor(
    message: string,
    public errors: ValidationError[]
  ) {
    super(message)
    this.name = 'ConfigValidationError'
  }
}
