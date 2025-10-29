/**
 * 数据源工厂实现
 * 负责创建和管理各种类型的数据源
 */

import type { IDataSource, IDataSourceFactory, DataSourceConfig, DataSourceCreator, DataSourceType } from './interfaces/IDataSource'
import { DataSourceError } from './interfaces/IDataSource'
import type { Logger } from '../logging/Logger'
import type { EventBus } from '../events/EventBus'
import type { IDataSourcePluginRegistry } from './plugins/IDataSourcePlugin'
import { DataSourcePluginRegistry } from './plugins/DataSourcePluginRegistry'
import { HttpDataSourcePlugin } from './plugins/builtin/HttpDataSourcePlugin'
import { StaticDataSourcePlugin } from './plugins/builtin/StaticDataSourcePlugin'

/**
 * 数据源工厂配置
 */
export interface DataSourceFactoryConfig {
  /**
   * 是否启用缓存
   */
  enableCache?: boolean

  /**
   * 是否启用日志
   */
  enableLogging?: boolean

  /**
   * 默认超时时间(毫秒)
   */
  defaultTimeout?: number

  /**
   * 默认重试次数
   */
  defaultRetryCount?: number
}

/**
 * 数据源工厂实现
 */
export class DataSourceFactory implements IDataSourceFactory {
  private creators = new Map<DataSourceType, DataSourceCreator>()
  private instances = new Map<string, IDataSource>()
  private config: Required<DataSourceFactoryConfig>
  private logger?: Logger
  private eventBus?: EventBus
  private pluginRegistry: IDataSourcePluginRegistry

  constructor(pluginRegistry: IDataSourcePluginRegistry, config: DataSourceFactoryConfig = {}, logger?: Logger, eventBus?: EventBus) {
    this.pluginRegistry = pluginRegistry
    this.config = {
      enableCache: true,
      enableLogging: true,
      defaultTimeout: 30000,
      defaultRetryCount: 3,
      ...config,
    }
    this.logger = logger
    this.eventBus = eventBus

    // 注册内置数据源类型
    this.registerBuiltinTypes()
  }

  /**
   * 创建数据源
   */
  create<T = any>(config: DataSourceConfig): IDataSource<T> {
    // 应用默认配置
    const fullConfig: DataSourceConfig = {
      ...config,
      timeout: config.timeout ?? this.config.defaultTimeout,
      retryCount: config.retryCount ?? this.config.defaultRetryCount,
    }

    // 检查是否已存在
    if (this.config.enableCache && this.instances.has(fullConfig.id)) {
      this.logger?.debug(`Reusing existing data source: ${fullConfig.id}`)
      return this.instances.get(fullConfig.id) as IDataSource<T>
    }

    // 首先尝试从插件系统获取创建器
    const plugin = this.pluginRegistry.getPluginByType(fullConfig.type)
    let dataSource: IDataSource<T>

    if (plugin) {
      // 使用插件创建数据源
      try {
        if (!plugin.validateConfig(fullConfig)) {
          throw new DataSourceError(`Invalid configuration for data source type: ${fullConfig.type}`, fullConfig.id)
        }

        dataSource = plugin.createDataSource<T>(fullConfig)
      } catch (error) {
        const err = new DataSourceError(`Failed to create data source via plugin: ${fullConfig.id}`, fullConfig.id, error as Error)
        this.logger?.error('Data source creation failed', err)
        this.eventBus?.emit('datasource.error', { id: fullConfig.id, error: err })
        throw err
      }
    } else {
      // 回退到传统的创建器方式（向后兼容）
      const creator = this.creators.get(fullConfig.type)
      if (!creator) {
        throw new DataSourceError(`Unsupported data source type: ${fullConfig.type}`, fullConfig.id)
      }

      try {
        dataSource = creator<T>(fullConfig)
      } catch (error) {
        const err = new DataSourceError(`Failed to create data source: ${fullConfig.id}`, fullConfig.id, error as Error)
        this.logger?.error('Data source creation failed', err)
        this.eventBus?.emit('datasource.error', { id: fullConfig.id, error: err })
        throw err
      }
    }

    // 缓存实例
    if (this.config.enableCache) {
      this.instances.set(fullConfig.id, dataSource)
    }

    // 设置事件监听
    this.setupDataSourceEvents(dataSource)

    // 记录日志
    if (this.config.enableLogging) {
      this.logger?.info(`Data source created: ${fullConfig.id}`, {
        type: fullConfig.type,
        name: fullConfig.name,
      })
    }

    // 发送事件
    this.eventBus?.emit('datasource.created', {
      id: fullConfig.id,
      type: fullConfig.type,
      config: fullConfig,
    })

    return dataSource
  }

  /**
   * 注册数据源类型
   */
  register(type: DataSourceType, creator: DataSourceCreator): void {
    if (this.creators.has(type)) {
      this.logger?.warn(`Data source type already registered: ${type}`)
    }

    this.creators.set(type, creator)

    this.logger?.info(`Data source type registered: ${type}`)
    this.eventBus?.emit('datasource.type.registered', { type })
  }

  /**
   * 取消注册数据源类型
   */
  unregister(type: DataSourceType): void {
    this.creators.delete(type)

    this.logger?.info(`Data source type unregistered: ${type}`)
    this.eventBus?.emit('datasource.type.unregistered', { type })
  }

  /**
   * 检查是否支持数据源类型
   */
  supports(type: DataSourceType): boolean {
    return this.creators.has(type)
  }

  /**
   * 获取数据源实例
   */
  getInstance<T = any>(id: string): IDataSource<T> | undefined {
    return this.instances.get(id) as IDataSource<T> | undefined
  }

  /**
   * 获取所有数据源实例
   */
  getAllInstances(): IDataSource[] {
    return Array.from(this.instances.values())
  }

  /**
   * 销毁数据源
   */
  destroy(id: string): void {
    const dataSource = this.instances.get(id)
    if (dataSource) {
      dataSource.dispose()
      this.instances.delete(id)

      this.logger?.info(`Data source destroyed: ${id}`)
      this.eventBus?.emit('datasource.destroyed', { id })
    }
  }

  /**
   * 销毁所有数据源
   */
  destroyAll(): void {
    for (const [id, dataSource] of this.instances.entries()) {
      dataSource.dispose()
      this.logger?.info(`Data source destroyed: ${id}`)
    }

    this.instances.clear()
    this.eventBus?.emit('datasource.all.destroyed')
  }

  /**
   * 获取支持的数据源类型列表
   */
  getSupportedTypes(): DataSourceType[] {
    return Array.from(this.creators.keys())
  }

  /**
   * 注册内置数据源类型
   */
  private registerBuiltinTypes(): void {
    // 这里可以注册内置的数据源类型
    // 实际的数据源实现会通过插件系统注册
    this.logger?.debug('Built-in data source types registered')
  }

  /**
   * 设置数据源事件监听
   */
  private setupDataSourceEvents(dataSource: IDataSource): void {
    if (!this.eventBus) return

    // 监听状态变更
    dataSource.on('state-change', (state, prevState) => {
      this.eventBus!.emit('datasource.state.changed', {
        id: dataSource.config.id,
        state,
        prevState,
      })
    })

    // 监听数据变更
    dataSource.on('data-change', (data, prevData) => {
      this.eventBus!.emit('datasource.data.changed', {
        id: dataSource.config.id,
        data,
        prevData,
      })
    })

    // 监听错误
    dataSource.on('error', error => {
      this.logger?.error(`Data source error: ${dataSource.config.id}`, error)
      this.eventBus!.emit('datasource.error', {
        id: dataSource.config.id,
        error,
      })
    })

    // 监听加载前
    dataSource.on('before-load', options => {
      this.logger?.debug(`Data source loading: ${dataSource.config.id}`, options)
      this.eventBus!.emit('datasource.loading', {
        id: dataSource.config.id,
        options,
      })
    })

    // 监听加载后
    dataSource.on('after-load', data => {
      this.logger?.debug(`Data source loaded: ${dataSource.config.id}`)
      this.eventBus!.emit('datasource.loaded', {
        id: dataSource.config.id,
        data,
      })
    })
  }
}

/**
 * 全局数据源工厂实例
 */
export let globalDataSourceFactory: DataSourceFactory | null = null

/**
 * 获取全局数据源工厂
 */
export function getGlobalDataSourceFactory(): DataSourceFactory {
  if (!globalDataSourceFactory) {
    // 创建插件注册表
    const pluginRegistry = new DataSourcePluginRegistry()

    // 注册内置插件
    const httpPlugin = new HttpDataSourcePlugin()
    const staticPlugin = new StaticDataSourcePlugin()

    pluginRegistry.register(httpPlugin)
    pluginRegistry.register(staticPlugin)

    // 初始化插件
    pluginRegistry.initializeAll().catch(error => {
      console.error('Failed to initialize data source plugins:', error)
    })

    globalDataSourceFactory = new DataSourceFactory(pluginRegistry)
  }
  return globalDataSourceFactory
}

/**
 * 设置全局数据源工厂
 */
export function setGlobalDataSourceFactory(factory: DataSourceFactory): void {
  globalDataSourceFactory = factory
}
