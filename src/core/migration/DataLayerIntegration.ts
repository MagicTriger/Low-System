/**
 * 数据层集成
 *
 * 将数据源、数据管道、数据流引擎集成到迁移系统
 */

import { DataSourceFactory, getGlobalDataSourceFactory, setGlobalDataSourceFactory } from '../data/DataSourceFactory'
import { DataFlowEngine } from '../runtime/DataFlowEngine'
import type { Container } from '../di/Container'
import type { EventBus } from '../events/EventBus'
import type { ConfigManager } from '../config/ConfigManager'
import type { Logger } from '../logging/Logger'
import type { ApiCompatLayer } from '../compat'
import type { FeatureFlags } from '../features'
import { FEATURE_FLAGS } from '../features'

/**
 * 数据层集成配置
 */
export interface DataLayerIntegrationConfig {
  /**
   * 是否使用全局实例
   */
  useGlobalInstances?: boolean

  /**
   * 是否注册到兼容层
   */
  registerToCompatLayer?: boolean

  /**
   * 是否启用详细日志
   */
  verbose?: boolean

  /**
   * 数据源工厂配置
   */
  dataSourceFactory?: {
    enableCache?: boolean
    enableLogging?: boolean
    defaultTimeout?: number
    defaultRetryCount?: number
  }
}

/**
 * 数据层集成类
 */
export class DataLayerIntegration {
  private dataSourceFactory: DataSourceFactory
  private dataFlowEngine: DataFlowEngine
  private container?: Container
  private eventBus?: EventBus
  private config?: ConfigManager
  private logger?: Logger
  private compatLayer?: ApiCompatLayer
  private featureFlags?: FeatureFlags
  private options: Required<Omit<DataLayerIntegrationConfig, 'dataSourceFactory'>>

  constructor(
    integrationConfig: DataLayerIntegrationConfig = {},
    coreServices?: {
      container?: Container
      eventBus?: EventBus
      config?: ConfigManager
      logger?: Logger
    },
    compatLayer?: ApiCompatLayer,
    featureFlags?: FeatureFlags
  ) {
    this.options = {
      useGlobalInstances: true,
      registerToCompatLayer: true,
      verbose: false,
      ...integrationConfig,
    }

    this.container = coreServices?.container
    this.eventBus = coreServices?.eventBus
    this.config = coreServices?.config
    this.logger = coreServices?.logger
    this.compatLayer = compatLayer
    this.featureFlags = featureFlags

    // 初始化数据源工厂
    if (this.options.useGlobalInstances) {
      this.dataSourceFactory = getGlobalDataSourceFactory()
    } else {
      this.dataSourceFactory = new DataSourceFactory(integrationConfig.dataSourceFactory, this.logger, this.eventBus)
    }

    // 初始化数据流引擎
    this.dataFlowEngine = new DataFlowEngine()
  }

  /**
   * 集成数据层
   */
  async integrate(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔧 Integrating data layer...')
    }

    // 检查特性开关
    const shouldIntegrate = !this.featureFlags || this.featureFlags.isEnabled(FEATURE_FLAGS.NEW_DATA_FLOW_ENGINE)

    if (!shouldIntegrate) {
      console.log('ℹ️  Data layer integration skipped (feature flag disabled)')
      return
    }

    // 1. 注册到DI容器
    if (this.container) {
      await this.registerToDIContainer()
    }

    // 2. 注册到兼容层
    if (this.options.registerToCompatLayer && this.compatLayer) {
      await this.registerToCompatLayer()
    }

    // 3. 配置数据层事件
    await this.configureEvents()

    // 4. 初始化数据层
    await this.initialize()

    if (this.options.verbose) {
      console.log('✅ Data layer integrated successfully')
    }
  }

  /**
   * 注册到DI容器
   */
  private async registerToDIContainer(): Promise<void> {
    if (!this.container) return

    if (this.options.verbose) {
      console.log('  📦 Registering data layer to DI container...')
    }

    // 注册数据源工厂
    this.container.register('DataSourceFactory', { useValue: this.dataSourceFactory }, { lifetime: 'singleton' as any })

    // 注册数据流引擎
    this.container.register('DataFlowEngine', { useValue: this.dataFlowEngine }, { lifetime: 'singleton' as any })

    if (this.options.verbose) {
      console.log('  ✓ Data layer registered to DI container')
    }
  }

  /**
   * 注册到兼容层
   */
  private async registerToCompatLayer(): Promise<void> {
    if (!this.compatLayer) return

    if (this.options.verbose) {
      console.log('  🔄 Registering data layer to compatibility layer...')
    }

    // 注册数据源工厂
    this.compatLayer.registerApi('DataSourceFactory', this.dataSourceFactory)

    // 注册数据流引擎
    this.compatLayer.registerApi('DataFlowEngine', this.dataFlowEngine)

    // 添加旧版API映射
    this.addLegacyApiMappings()

    if (this.options.verbose) {
      console.log('  ✓ Data layer registered to compatibility layer')
    }
  }

  /**
   * 添加旧版API映射
   */
  private addLegacyApiMappings(): void {
    if (!this.compatLayer) return

    // 映射旧版数据源创建API
    this.compatLayer.addMapping({
      pattern: /^dataSource\.create$/,
      target: async call => {
        const [config] = call.args || []
        return this.dataSourceFactory.create(config)
      },
      advice: {
        oldApi: 'dataSource.create',
        newApi: 'DataSourceFactory.create',
        description: '使用新的数据源工厂创建数据源',
        example: `
// 旧版
const ds = dataSource.create({ 
  id: 'my-ds',
  name: 'My DataSource',
  type: 'api' 
})

// 新版
const factory = container.resolve('DataSourceFactory')
const ds = factory.create({
  id: 'my-ds',
  name: 'My DataSource',
  type: 'api'
})`,
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    // 映射旧版数据流执行API
    this.compatLayer.addMapping({
      pattern: /^dataFlow\.execute$/,
      target: async call => {
        const [flow, data] = call.args || []
        return this.dataFlowEngine.execute(flow, data)
      },
      advice: {
        oldApi: 'dataFlow.execute',
        newApi: 'DataFlowEngine.execute',
        description: '使用新的数据流引擎执行数据流',
        example: `
// 旧版
const result = await dataFlow.execute(flow, data)

// 新版
const engine = container.resolve('DataFlowEngine')
const result = await engine.execute(flow, data)`,
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })
  }

  /**
   * 配置数据层事件
   */
  private async configureEvents(): Promise<void> {
    if (!this.eventBus) return

    if (this.options.verbose) {
      console.log('  🔗 Configuring data layer events...')
    }

    // 监听数据源创建
    this.eventBus.on('datasource.created', data => {
      this.logger?.info('Data source created', data)
    })

    // 监听数据源错误
    this.eventBus.on('datasource.error', data => {
      this.logger?.error('Data source error', data.error)
    })

    // 监听数据源状态变更
    this.eventBus.on('datasource.state.changed', data => {
      this.logger?.debug('Data source state changed', data)
    })

    if (this.options.verbose) {
      console.log('  ✓ Data layer events configured')
    }
  }

  /**
   * 初始化数据层
   */
  private async initialize(): Promise<void> {
    if (this.options.verbose) {
      console.log('  🚀 Initializing data layer...')
    }

    // 发送初始化完成事件
    this.eventBus?.emit('datalayer.initialized', {
      dataSourceFactory: this.dataSourceFactory,
      dataFlowEngine: this.dataFlowEngine,
    })

    if (this.options.verbose) {
      console.log('  ✓ Data layer initialized')
    }
  }

  /**
   * 获取数据源工厂
   */
  getDataSourceFactory(): DataSourceFactory {
    return this.dataSourceFactory
  }

  /**
   * 获取数据流引擎
   */
  getDataFlowEngine(): DataFlowEngine {
    return this.dataFlowEngine
  }
}

/**
 * 创建并集成数据层
 */
export async function integrateDataLayer(
  config: DataLayerIntegrationConfig = {},
  coreServices?: {
    container?: Container
    eventBus?: EventBus
    config?: ConfigManager
    logger?: Logger
  },
  compatLayer?: ApiCompatLayer,
  featureFlags?: FeatureFlags
): Promise<DataLayerIntegration> {
  const integration = new DataLayerIntegration(config, coreServices, compatLayer, featureFlags)

  await integration.integrate()

  return integration
}
