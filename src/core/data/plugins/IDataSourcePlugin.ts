/**
 * 数据源插件接口
 * 定义数据源插件的标准接口和生命周期
 */

import type { IDataSource, DataSourceConfig } from '../interfaces'

// 插件元数据
export interface DataSourcePluginMetadata {
  /** 插件ID */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 */
  version: string
  /** 插件描述 */
  description?: string
  /** 插件作者 */
  author?: string
  /** 数据源类型 */
  dataSourceType: string
  /** 支持的功能 */
  capabilities?: string[]
  /** 依赖的其他插件 */
  dependencies?: string[]
}

// 插件配置
export interface DataSourcePluginConfig {
  /** 是否启用 */
  enabled?: boolean
  /** 插件特定配置 */
  options?: Record<string, any>
}

// 数据源插件接口
export interface IDataSourcePlugin {
  /** 插件元数据 */
  readonly metadata: DataSourcePluginMetadata

  /**
   * 插件初始化
   */
  initialize(config?: DataSourcePluginConfig): Promise<void> | void

  /**
   * 创建数据源实例
   */
  createDataSource<T = any>(config: DataSourceConfig): IDataSource<T>

  /**
   * 验证配置
   */
  validateConfig(config: DataSourceConfig): boolean

  /**
   * 获取配置模式
   */
  getConfigSchema?(): Record<string, any>

  /**
   * 插件销毁
   */
  dispose(): Promise<void> | void
}

// 插件注册器接口
export interface IDataSourcePluginRegistry {
  /**
   * 注册插件
   */
  register(plugin: IDataSourcePlugin): void

  /**
   * 注销插件
   */
  unregister(pluginId: string): void

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): IDataSourcePlugin | undefined

  /**
   * 根据数据源类型获取插件
   */
  getPluginByType(dataSourceType: string): IDataSourcePlugin | undefined

  /**
   * 获取所有插件
   */
  getAllPlugins(): IDataSourcePlugin[]

  /**
   * 检查插件是否已注册
   */
  hasPlugin(pluginId: string): boolean

  /**
   * 初始化所有插件
   */
  initializeAll(config?: Record<string, DataSourcePluginConfig>): Promise<void>

  /**
   * 销毁所有插件
   */
  disposeAll(): Promise<void>
}

// 插件加载器接口
export interface IDataSourcePluginLoader {
  /**
   * 加载插件
   */
  load(pluginPath: string): Promise<IDataSourcePlugin>

  /**
   * 批量加载插件
   */
  loadMultiple(pluginPaths: string[]): Promise<IDataSourcePlugin[]>

  /**
   * 从目录加载所有插件
   */
  loadFromDirectory(directory: string): Promise<IDataSourcePlugin[]>
}

// 插件生命周期钩子
export interface DataSourcePluginHooks {
  /**
   * 插件注册前
   */
  beforeRegister?(plugin: IDataSourcePlugin): void | Promise<void>

  /**
   * 插件注册后
   */
  afterRegister?(plugin: IDataSourcePlugin): void | Promise<void>

  /**
   * 插件注销前
   */
  beforeUnregister?(plugin: IDataSourcePlugin): void | Promise<void>

  /**
   * 插件注销后
   */
  afterUnregister?(pluginId: string): void | Promise<void>

  /**
   * 数据源创建前
   */
  beforeCreateDataSource?(config: DataSourceConfig): void | Promise<void>

  /**
   * 数据源创建后
   */
  afterCreateDataSource?(dataSource: IDataSource): void | Promise<void>
}

// 插件错误
export class DataSourcePluginError extends Error {
  constructor(
    message: string,
    public pluginId?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DataSourcePluginError'
  }
}

// 插件验证错误
export class PluginValidationError extends DataSourcePluginError {
  constructor(pluginId: string, reason: string) {
    super(`Plugin validation failed: ${reason}`, pluginId)
    this.name = 'PluginValidationError'
  }
}

// 插件依赖错误
export class PluginDependencyError extends DataSourcePluginError {
  constructor(
    pluginId: string,
    public missingDependencies: string[]
  ) {
    super(`Plugin ${pluginId} has missing dependencies: ${missingDependencies.join(', ')}`, pluginId)
    this.name = 'PluginDependencyError'
  }
}
