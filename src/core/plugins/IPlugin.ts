/**
 * 插件系统核心接口定义
 * 提供标准化的插件注册、生命周期管理和依赖解析机制
 */

import type { IContainer } from '../di/types'
import type { IEventBus } from '../events/types'
import type { IConfigManager } from '../config/types'
import type { ILogger } from '../logging/types'

/**
 * 插件元数据
 * 描述插件的基本信息和依赖关系
 */
export interface PluginMetadata {
  /** 插件唯一标识符 */
  id: string
  /** 插件名称 */
  name: string
  /** 插件版本 (遵循语义化版本规范) */
  version: string
  /** 插件作者 */
  author?: string
  /** 插件描述 */
  description?: string
  /** 插件依赖列表 */
  dependencies?: PluginDependency[]
  /** 插件提供的功能标识 */
  provides?: string[]
  /** 插件标签 */
  tags?: string[]
  /** 插件主页 */
  homepage?: string
  /** 插件许可证 */
  license?: string
}

/**
 * 插件依赖
 * 描述插件对其他插件的依赖关系
 */
export interface PluginDependency {
  /** 依赖的插件ID */
  pluginId: string
  /** 依赖的版本范围 (支持语义化版本范围) */
  version: string
  /** 是否为可选依赖 */
  optional?: boolean
}

/**
 * 插件上下文
 * 提供插件运行时所需的核心服务
 */
export interface PluginContext {
  /** 依赖注入容器 */
  container: IContainer
  /** 事件总线 */
  eventBus: IEventBus
  /** 配置管理器 */
  config: IConfigManager
  /** 日志器 */
  logger: ILogger
  /** 插件管理器引用 */
  pluginManager: IPluginManager
}

/**
 * 插件状态
 */
export enum PluginState {
  /** 未安装 */
  Uninstalled = 'uninstalled',
  /** 已安装但未激活 */
  Installed = 'installed',
  /** 已激活 */
  Active = 'active',
  /** 已停用 */
  Deactivated = 'deactivated',
  /** 错误状态 */
  Error = 'error',
}

/**
 * 插件接口
 * 所有插件必须实现此接口
 */
export interface IPlugin {
  /** 插件元数据 */
  readonly metadata: PluginMetadata

  /** 当前插件状态 */
  readonly state: PluginState

  /**
   * 安装插件
   * 在此阶段注册服务、配置等
   * @param context 插件上下文
   */
  install(context: PluginContext): Promise<void>

  /**
   * 卸载插件
   * 清理插件注册的资源
   * @param context 插件上下文
   */
  uninstall(context: PluginContext): Promise<void>

  /**
   * 激活插件
   * 启动插件功能
   */
  activate(): Promise<void>

  /**
   * 停用插件
   * 暂停插件功能但不卸载
   */
  deactivate(): Promise<void>

  /**
   * 配置插件
   * 可选方法,用于插件配置
   * @param config 配置对象
   */
  configure?(config: Record<string, any>): void

  /**
   * 插件健康检查
   * 可选方法,用于检查插件状态
   */
  healthCheck?(): Promise<PluginHealthStatus>
}

/**
 * 插件健康状态
 */
export interface PluginHealthStatus {
  /** 是否健康 */
  healthy: boolean
  /** 状态消息 */
  message?: string
  /** 详细信息 */
  details?: Record<string, any>
}

/**
 * 插件管理器接口
 */
export interface IPluginManager {
  /**
   * 注册插件
   * @param plugin 插件实例
   */
  register(plugin: IPlugin): Promise<void>

  /**
   * 卸载插件
   * @param pluginId 插件ID
   */
  unregister(pluginId: string): Promise<void>

  /**
   * 激活插件
   * @param pluginId 插件ID
   */
  activate(pluginId: string): Promise<void>

  /**
   * 停用插件
   * @param pluginId 插件ID
   */
  deactivate(pluginId: string): Promise<void>

  /**
   * 获取插件
   * @param pluginId 插件ID
   */
  getPlugin(pluginId: string): IPlugin | undefined

  /**
   * 获取所有插件
   */
  getAllPlugins(): IPlugin[]

  /**
   * 获取激活的插件
   */
  getActivePlugins(): IPlugin[]

  /**
   * 检查插件是否已注册
   * @param pluginId 插件ID
   */
  hasPlugin(pluginId: string): boolean

  /**
   * 检查插件是否已激活
   * @param pluginId 插件ID
   */
  isActive(pluginId: string): boolean

  /**
   * 解析插件依赖
   * @param plugin 插件实例
   * @returns 依赖的插件列表
   */
  resolveDependencies(plugin: IPlugin): IPlugin[]

  /**
   * 验证插件
   * @param plugin 插件实例
   */
  validatePlugin(plugin: IPlugin): PluginValidationResult

  /**
   * 获取插件加载顺序
   * 根据依赖关系计算插件的加载顺序
   */
  getLoadOrder(): IPlugin[]
}

/**
 * 插件验证结果
 */
export interface PluginValidationResult {
  /** 是否有效 */
  valid: boolean
  /** 错误列表 */
  errors?: PluginValidationError[]
  /** 警告列表 */
  warnings?: string[]
}

/**
 * 插件验证错误
 */
export interface PluginValidationError {
  /** 错误类型 */
  type: 'metadata' | 'dependency' | 'version' | 'conflict' | 'other'
  /** 错误消息 */
  message: string
  /** 相关插件ID */
  pluginId?: string
}

/**
 * 插件错误基类
 */
export class PluginError extends Error {
  constructor(
    message: string,
    public pluginId?: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PluginError'
  }
}

/**
 * 插件依赖错误
 */
export class PluginDependencyError extends PluginError {
  constructor(
    pluginId: string,
    public missingDependencies: string[]
  ) {
    super(`Plugin "${pluginId}" has missing dependencies: ${missingDependencies.join(', ')}`, pluginId)
    this.name = 'PluginDependencyError'
  }
}

/**
 * 插件版本冲突错误
 */
export class PluginVersionConflictError extends PluginError {
  constructor(
    pluginId: string,
    public requiredVersion: string,
    public actualVersion: string
  ) {
    super(`Plugin "${pluginId}" version conflict: required ${requiredVersion}, but got ${actualVersion}`, pluginId)
    this.name = 'PluginVersionConflictError'
  }
}

/**
 * 插件已存在错误
 */
export class PluginAlreadyExistsError extends PluginError {
  constructor(pluginId: string) {
    super(`Plugin "${pluginId}" is already registered`, pluginId)
    this.name = 'PluginAlreadyExistsError'
  }
}

/**
 * 插件未找到错误
 */
export class PluginNotFoundError extends PluginError {
  constructor(pluginId: string) {
    super(`Plugin "${pluginId}" not found`, pluginId)
    this.name = 'PluginNotFoundError'
  }
}

/**
 * 插件循环依赖错误
 */
export class PluginCircularDependencyError extends PluginError {
  constructor(public cycle: string[]) {
    super(`Circular dependency detected: ${cycle.join(' -> ')}`)
    this.name = 'PluginCircularDependencyError'
  }
}
