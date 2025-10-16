/**
 * 插件管理器实现
 * 负责插件的注册、卸载、激活、停用和依赖管理
 */

import type { IPlugin, IPluginManager, PluginContext, PluginValidationResult, PluginValidationError } from './IPlugin'
import {
  PluginState,
  PluginError,
  PluginDependencyError,
  PluginVersionConflictError,
  PluginAlreadyExistsError,
  PluginNotFoundError,
  PluginCircularDependencyError,
} from './IPlugin'
import type { IContainer } from '../di/types'
import type { IEventBus } from '../events/types'
import type { IConfigManager } from '../config/types'
import type { ILogger } from '../logging/types'

/**
 * 插件管理器配置
 */
export interface PluginManagerOptions {
  /** 是否启用严格模式 (严格检查依赖和版本) */
  strictMode?: boolean
  /** 是否自动激活插件 */
  autoActivate?: boolean
  /** 是否允许重复注册 */
  allowDuplicates?: boolean
}

/**
 * 插件管理器实现
 */
export class PluginManager implements IPluginManager {
  private plugins = new Map<string, IPlugin>()
  private pluginStates = new Map<string, PluginState>()
  private context: PluginContext
  private options: Required<PluginManagerOptions>

  constructor(
    private container: IContainer,
    private eventBus: IEventBus,
    private config: IConfigManager,
    private logger: ILogger,
    options: PluginManagerOptions = {}
  ) {
    this.options = {
      strictMode: options.strictMode ?? true,
      autoActivate: options.autoActivate ?? false,
      allowDuplicates: options.allowDuplicates ?? false,
    }

    this.context = {
      container: this.container,
      eventBus: this.eventBus,
      config: this.config,
      logger: this.logger.child('PluginManager'),
      pluginManager: this,
    }

    this.logger.info('PluginManager initialized', {
      strictMode: this.options.strictMode,
      autoActivate: this.options.autoActivate,
    })
  }

  /**
   * 注册插件
   */
  async register(plugin: IPlugin): Promise<void> {
    const pluginId = plugin.metadata.id

    this.logger.debug(`Registering plugin: ${pluginId}`)

    // 检查是否已注册
    if (this.hasPlugin(pluginId) && !this.options.allowDuplicates) {
      throw new PluginAlreadyExistsError(pluginId)
    }

    // 验证插件
    const validation = this.validatePlugin(plugin)
    if (!validation.valid) {
      const errors = validation.errors?.map(e => e.message).join('; ') || 'Unknown error'
      throw new PluginError(`Plugin validation failed: ${errors}`, pluginId)
    }

    // 检查依赖
    if (this.options.strictMode) {
      this.checkDependencies(plugin)
    }

    try {
      // 安装插件
      await plugin.install(this.context)

      // 注册插件
      this.plugins.set(pluginId, plugin)
      this.pluginStates.set(pluginId, PluginState.Installed)

      // 发布事件
      this.eventBus.emit('plugin:registered', {
        pluginId,
        metadata: plugin.metadata,
      })

      this.logger.info(`Plugin registered: ${pluginId}`, {
        version: plugin.metadata.version,
      })

      // 自动激活
      if (this.options.autoActivate) {
        await this.activate(pluginId)
      }
    } catch (error) {
      this.pluginStates.set(pluginId, PluginState.Error)
      this.logger.error(`Failed to register plugin: ${pluginId}`, error as Error)
      throw new PluginError(`Failed to register plugin: ${pluginId}`, pluginId, error as Error)
    }
  }

  /**
   * 卸载插件
   */
  async unregister(pluginId: string): Promise<void> {
    this.logger.debug(`Unregistering plugin: ${pluginId}`)

    const plugin = this.getPlugin(pluginId)
    if (!plugin) {
      throw new PluginNotFoundError(pluginId)
    }

    // 检查是否有其他插件依赖此插件
    if (this.options.strictMode) {
      const dependents = this.getDependentPlugins(pluginId)
      if (dependents.length > 0) {
        const dependentIds = dependents.map(p => p.metadata.id).join(', ')
        throw new PluginError(`Cannot unregister plugin "${pluginId}" because it is required by: ${dependentIds}`, pluginId)
      }
    }

    try {
      // 如果插件已激活,先停用
      if (this.isActive(pluginId)) {
        await this.deactivate(pluginId)
      }

      // 卸载插件
      await plugin.uninstall(this.context)

      // 移除插件
      this.plugins.delete(pluginId)
      this.pluginStates.delete(pluginId)

      // 发布事件
      this.eventBus.emit('plugin:unregistered', { pluginId })

      this.logger.info(`Plugin unregistered: ${pluginId}`)
    } catch (error) {
      this.pluginStates.set(pluginId, PluginState.Error)
      this.logger.error(`Failed to unregister plugin: ${pluginId}`, error as Error)
      throw new PluginError(`Failed to unregister plugin: ${pluginId}`, pluginId, error as Error)
    }
  }

  /**
   * 激活插件
   */
  async activate(pluginId: string): Promise<void> {
    this.logger.debug(`Activating plugin: ${pluginId}`)

    const plugin = this.getPlugin(pluginId)
    if (!plugin) {
      throw new PluginNotFoundError(pluginId)
    }

    const state = this.pluginStates.get(pluginId)
    if (state === PluginState.Active) {
      this.logger.warn(`Plugin already active: ${pluginId}`)
      return
    }

    try {
      // 激活依赖的插件
      const dependencies = this.resolveDependencies(plugin)
      for (const dep of dependencies) {
        if (!this.isActive(dep.metadata.id)) {
          await this.activate(dep.metadata.id)
        }
      }

      // 激活插件
      await plugin.activate()

      // 更新状态
      this.pluginStates.set(pluginId, PluginState.Active)

      // 发布事件
      this.eventBus.emit('plugin:activated', { pluginId })

      this.logger.info(`Plugin activated: ${pluginId}`)
    } catch (error) {
      this.pluginStates.set(pluginId, PluginState.Error)
      this.logger.error(`Failed to activate plugin: ${pluginId}`, error as Error)
      throw new PluginError(`Failed to activate plugin: ${pluginId}`, pluginId, error as Error)
    }
  }

  /**
   * 停用插件
   */
  async deactivate(pluginId: string): Promise<void> {
    this.logger.debug(`Deactivating plugin: ${pluginId}`)

    const plugin = this.getPlugin(pluginId)
    if (!plugin) {
      throw new PluginNotFoundError(pluginId)
    }

    const state = this.pluginStates.get(pluginId)
    if (state !== PluginState.Active) {
      this.logger.warn(`Plugin not active: ${pluginId}`)
      return
    }

    // 检查是否有激活的插件依赖此插件
    if (this.options.strictMode) {
      const dependents = this.getDependentPlugins(pluginId).filter(p => this.isActive(p.metadata.id))
      if (dependents.length > 0) {
        const dependentIds = dependents.map(p => p.metadata.id).join(', ')
        throw new PluginError(`Cannot deactivate plugin "${pluginId}" because it is required by active plugins: ${dependentIds}`, pluginId)
      }
    }

    try {
      // 停用插件
      await plugin.deactivate()

      // 更新状态
      this.pluginStates.set(pluginId, PluginState.Deactivated)

      // 发布事件
      this.eventBus.emit('plugin:deactivated', { pluginId })

      this.logger.info(`Plugin deactivated: ${pluginId}`)
    } catch (error) {
      this.pluginStates.set(pluginId, PluginState.Error)
      this.logger.error(`Failed to deactivate plugin: ${pluginId}`, error as Error)
      throw new PluginError(`Failed to deactivate plugin: ${pluginId}`, pluginId, error as Error)
    }
  }

  /**
   * 获取插件
   */
  getPlugin(pluginId: string): IPlugin | undefined {
    return this.plugins.get(pluginId)
  }

  /**
   * 获取所有插件
   */
  getAllPlugins(): IPlugin[] {
    return Array.from(this.plugins.values())
  }

  /**
   * 获取激活的插件
   */
  getActivePlugins(): IPlugin[] {
    return this.getAllPlugins().filter(p => this.isActive(p.metadata.id))
  }

  /**
   * 检查插件是否已注册
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  /**
   * 检查插件是否已激活
   */
  isActive(pluginId: string): boolean {
    return this.pluginStates.get(pluginId) === PluginState.Active
  }

  /**
   * 解析插件依赖
   */
  resolveDependencies(plugin: IPlugin): IPlugin[] {
    const dependencies: IPlugin[] = []
    const deps = plugin.metadata.dependencies || []

    for (const dep of deps) {
      const depPlugin = this.getPlugin(dep.pluginId)

      if (!depPlugin) {
        if (!dep.optional) {
          throw new PluginDependencyError(plugin.metadata.id, [dep.pluginId])
        }
        continue
      }

      // 检查版本兼容性
      if (this.options.strictMode && !this.isVersionCompatible(depPlugin.metadata.version, dep.version)) {
        throw new PluginVersionConflictError(dep.pluginId, dep.version, depPlugin.metadata.version)
      }

      dependencies.push(depPlugin)
    }

    return dependencies
  }

  /**
   * 验证插件
   */
  validatePlugin(plugin: IPlugin): PluginValidationResult {
    const errors: PluginValidationError[] = []
    const warnings: string[] = []

    // 验证元数据
    if (!plugin.metadata.id) {
      errors.push({
        type: 'metadata',
        message: 'Plugin ID is required',
      })
    }

    if (!plugin.metadata.name) {
      errors.push({
        type: 'metadata',
        message: 'Plugin name is required',
      })
    }

    if (!plugin.metadata.version) {
      errors.push({
        type: 'metadata',
        message: 'Plugin version is required',
      })
    } else if (!this.isValidVersion(plugin.metadata.version)) {
      errors.push({
        type: 'version',
        message: `Invalid version format: ${plugin.metadata.version}`,
      })
    }

    // 验证依赖
    const deps = plugin.metadata.dependencies || []
    for (const dep of deps) {
      if (!dep.pluginId) {
        errors.push({
          type: 'dependency',
          message: 'Dependency plugin ID is required',
        })
      }

      if (!dep.version) {
        errors.push({
          type: 'dependency',
          message: `Dependency version is required for ${dep.pluginId}`,
          pluginId: dep.pluginId,
        })
      }
    }

    // 检查循环依赖
    try {
      this.detectCircularDependencies(plugin)
    } catch (error) {
      if (error instanceof PluginCircularDependencyError) {
        errors.push({
          type: 'dependency',
          message: error.message,
          pluginId: plugin.metadata.id,
        })
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    }
  }

  /**
   * 获取插件加载顺序
   */
  getLoadOrder(): IPlugin[] {
    const plugins = this.getAllPlugins()
    const sorted: IPlugin[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (plugin: IPlugin) => {
      const pluginId = plugin.metadata.id

      if (visited.has(pluginId)) {
        return
      }

      if (visiting.has(pluginId)) {
        throw new PluginCircularDependencyError([pluginId])
      }

      visiting.add(pluginId)

      // 先访问依赖
      const deps = this.resolveDependencies(plugin)
      for (const dep of deps) {
        visit(dep)
      }

      visiting.delete(pluginId)
      visited.add(pluginId)
      sorted.push(plugin)
    }

    for (const plugin of plugins) {
      visit(plugin)
    }

    return sorted
  }

  /**
   * 检查依赖是否满足
   */
  private checkDependencies(plugin: IPlugin): void {
    const missingDeps: string[] = []
    const deps = plugin.metadata.dependencies || []

    for (const dep of deps) {
      if (!dep.optional && !this.hasPlugin(dep.pluginId)) {
        missingDeps.push(dep.pluginId)
      }
    }

    if (missingDeps.length > 0) {
      throw new PluginDependencyError(plugin.metadata.id, missingDeps)
    }
  }

  /**
   * 获取依赖此插件的插件列表
   */
  private getDependentPlugins(pluginId: string): IPlugin[] {
    return this.getAllPlugins().filter(p => {
      const deps = p.metadata.dependencies || []
      return deps.some(d => d.pluginId === pluginId)
    })
  }

  /**
   * 检测循环依赖
   */
  private detectCircularDependencies(plugin: IPlugin, visited: Set<string> = new Set()): void {
    const pluginId = plugin.metadata.id

    if (visited.has(pluginId)) {
      const cycle = Array.from(visited).concat(pluginId)
      throw new PluginCircularDependencyError(cycle)
    }

    visited.add(pluginId)

    const deps = plugin.metadata.dependencies || []
    for (const dep of deps) {
      const depPlugin = this.getPlugin(dep.pluginId)
      if (depPlugin) {
        this.detectCircularDependencies(depPlugin, new Set(visited))
      }
    }
  }

  /**
   * 检查版本兼容性
   * 简化版本检查,支持基本的语义化版本
   */
  private isVersionCompatible(actualVersion: string, requiredVersion: string): boolean {
    // 简单实现: 支持 ^1.0.0, ~1.0.0, >=1.0.0, 1.0.0 等格式
    if (requiredVersion.startsWith('^')) {
      // 主版本兼容
      const required = requiredVersion.slice(1)
      return this.compareVersions(actualVersion, required) >= 0
    }

    if (requiredVersion.startsWith('~')) {
      // 次版本兼容
      const required = requiredVersion.slice(1)
      return this.compareVersions(actualVersion, required) >= 0
    }

    if (requiredVersion.startsWith('>=')) {
      const required = requiredVersion.slice(2).trim()
      return this.compareVersions(actualVersion, required) >= 0
    }

    if (requiredVersion.startsWith('>')) {
      const required = requiredVersion.slice(1).trim()
      return this.compareVersions(actualVersion, required) > 0
    }

    if (requiredVersion.startsWith('<=')) {
      const required = requiredVersion.slice(2).trim()
      return this.compareVersions(actualVersion, required) <= 0
    }

    if (requiredVersion.startsWith('<')) {
      const required = requiredVersion.slice(1).trim()
      return this.compareVersions(actualVersion, required) < 0
    }

    // 精确匹配
    return actualVersion === requiredVersion
  }

  /**
   * 比较版本号
   * @returns 0: 相等, >0: v1 > v2, <0: v1 < v2
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0

      if (p1 > p2) return 1
      if (p1 < p2) return -1
    }

    return 0
  }

  /**
   * 验证版本格式
   */
  private isValidVersion(version: string): boolean {
    // 简单的语义化版本验证
    return /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(version)
  }
}
