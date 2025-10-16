/**
 * 数据源插件注册器实现
 * 负责管理数据源插件的注册、初始化和销毁
 */

import type { IDataSourcePlugin, IDataSourcePluginRegistry, DataSourcePluginConfig, DataSourcePluginHooks } from './IDataSourcePlugin'
import { DataSourcePluginError, PluginValidationError, PluginDependencyError } from './IDataSourcePlugin'

export class DataSourcePluginRegistry implements IDataSourcePluginRegistry {
  private plugins = new Map<string, IDataSourcePlugin>()
  private pluginsByType = new Map<string, IDataSourcePlugin>()
  private hooks: DataSourcePluginHooks = {}

  constructor(hooks?: DataSourcePluginHooks) {
    if (hooks) {
      this.hooks = hooks
    }
  }

  register(plugin: IDataSourcePlugin): void {
    const { id, dataSourceType } = plugin.metadata

    // 验证插件
    this.validatePlugin(plugin)

    // 检查是否已注册
    if (this.plugins.has(id)) {
      throw new DataSourcePluginError(`Plugin ${id} is already registered`, id)
    }

    // 检查数据源类型是否已被占用
    if (this.pluginsByType.has(dataSourceType)) {
      const existingPlugin = this.pluginsByType.get(dataSourceType)!
      throw new DataSourcePluginError(
        `Data source type ${dataSourceType} is already registered by plugin ${existingPlugin.metadata.id}`,
        id
      )
    }

    // 检查依赖
    this.checkDependencies(plugin)

    // 执行注册前钩子
    if (this.hooks.beforeRegister) {
      this.hooks.beforeRegister(plugin)
    }

    // 注册插件
    this.plugins.set(id, plugin)
    this.pluginsByType.set(dataSourceType, plugin)

    // 执行注册后钩子
    if (this.hooks.afterRegister) {
      this.hooks.afterRegister(plugin)
    }

    console.log(`[PluginRegistry] Registered plugin: ${id} (type: ${dataSourceType})`)
  }

  unregister(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      throw new DataSourcePluginError(`Plugin ${pluginId} is not registered`, pluginId)
    }

    // 执行注销前钩子
    if (this.hooks.beforeUnregister) {
      this.hooks.beforeUnregister(plugin)
    }

    // 销毁插件
    plugin.dispose()

    // 注销插件
    this.plugins.delete(pluginId)
    this.pluginsByType.delete(plugin.metadata.dataSourceType)

    // 执行注销后钩子
    if (this.hooks.afterUnregister) {
      this.hooks.afterUnregister(pluginId)
    }

    console.log(`[PluginRegistry] Unregistered plugin: ${pluginId}`)
  }

  getPlugin(pluginId: string): IDataSourcePlugin | undefined {
    return this.plugins.get(pluginId)
  }

  getPluginByType(dataSourceType: string): IDataSourcePlugin | undefined {
    return this.pluginsByType.get(dataSourceType)
  }

  getAllPlugins(): IDataSourcePlugin[] {
    return Array.from(this.plugins.values())
  }

  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId)
  }

  async initializeAll(config?: Record<string, DataSourcePluginConfig>): Promise<void> {
    const plugins = Array.from(this.plugins.values())

    // 按依赖顺序初始化
    const sortedPlugins = this.sortPluginsByDependencies(plugins)

    for (const plugin of sortedPlugins) {
      const pluginConfig = config?.[plugin.metadata.id]

      // 检查是否启用
      if (pluginConfig?.enabled === false) {
        console.log(`[PluginRegistry] Skipping disabled plugin: ${plugin.metadata.id}`)
        continue
      }

      try {
        await plugin.initialize(pluginConfig)
        console.log(`[PluginRegistry] Initialized plugin: ${plugin.metadata.id}`)
      } catch (error) {
        console.error(`[PluginRegistry] Failed to initialize plugin ${plugin.metadata.id}:`, error)
        throw new DataSourcePluginError(`Failed to initialize plugin ${plugin.metadata.id}`, plugin.metadata.id, error as Error)
      }
    }
  }

  async disposeAll(): Promise<void> {
    const plugins = Array.from(this.plugins.values())

    // 按依赖顺序的反序销毁
    const sortedPlugins = this.sortPluginsByDependencies(plugins).reverse()

    for (const plugin of sortedPlugins) {
      try {
        await plugin.dispose()
        console.log(`[PluginRegistry] Disposed plugin: ${plugin.metadata.id}`)
      } catch (error) {
        console.error(`[PluginRegistry] Failed to dispose plugin ${plugin.metadata.id}:`, error)
      }
    }

    this.plugins.clear()
    this.pluginsByType.clear()
  }

  // 私有方法

  private validatePlugin(plugin: IDataSourcePlugin): void {
    const { id, name, version, dataSourceType } = plugin.metadata

    if (!id || !name || !version || !dataSourceType) {
      throw new PluginValidationError(id || 'unknown', 'Plugin metadata is incomplete')
    }

    if (typeof plugin.initialize !== 'function') {
      throw new PluginValidationError(id, 'Plugin must implement initialize method')
    }

    if (typeof plugin.createDataSource !== 'function') {
      throw new PluginValidationError(id, 'Plugin must implement createDataSource method')
    }

    if (typeof plugin.validateConfig !== 'function') {
      throw new PluginValidationError(id, 'Plugin must implement validateConfig method')
    }

    if (typeof plugin.dispose !== 'function') {
      throw new PluginValidationError(id, 'Plugin must implement dispose method')
    }
  }

  private checkDependencies(plugin: IDataSourcePlugin): void {
    const { id, dependencies } = plugin.metadata

    if (!dependencies || dependencies.length === 0) {
      return
    }

    const missingDependencies = dependencies.filter(depId => !this.plugins.has(depId))

    if (missingDependencies.length > 0) {
      throw new PluginDependencyError(id, missingDependencies)
    }
  }

  private sortPluginsByDependencies(plugins: IDataSourcePlugin[]): IDataSourcePlugin[] {
    const sorted: IDataSourcePlugin[] = []
    const visited = new Set<string>()
    const visiting = new Set<string>()

    const visit = (plugin: IDataSourcePlugin) => {
      const { id, dependencies } = plugin.metadata

      if (visited.has(id)) {
        return
      }

      if (visiting.has(id)) {
        throw new DataSourcePluginError(`Circular dependency detected for plugin ${id}`, id)
      }

      visiting.add(id)

      // 先访问依赖
      if (dependencies) {
        for (const depId of dependencies) {
          const depPlugin = this.plugins.get(depId)
          if (depPlugin) {
            visit(depPlugin)
          }
        }
      }

      visiting.delete(id)
      visited.add(id)
      sorted.push(plugin)
    }

    plugins.forEach(visit)

    return sorted
  }
}
