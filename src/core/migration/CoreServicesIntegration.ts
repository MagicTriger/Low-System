/**
 * 核心服务集成
 *
 * 将核心服务注册到迁移系统和兼容层
 */

import { Container, globalContainer } from '../di/Container'
import { EventBus, globalEventBus } from '../events/EventBus'
import { ConfigManager, globalConfig } from '../config/ConfigManager'
import { Logger, globalLogger } from '../logging/Logger'
import type { ApiCompatLayer } from '../compat'
import type { FeatureFlags } from '../features'
import { FEATURE_FLAGS } from '../features'
import { initializePropertyPanelService } from '../infrastructure/services'
import type { PropertyPanelService } from '../infrastructure/services'

/**
 * 核心服务集成配置
 */
export interface CoreServicesIntegrationConfig {
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
}

/**
 * 核心服务集成类
 */
export class CoreServicesIntegration {
  private container: Container
  private eventBus: EventBus
  private config: ConfigManager
  private logger: Logger
  private compatLayer?: ApiCompatLayer
  private featureFlags?: FeatureFlags
  private options: Required<CoreServicesIntegrationConfig>
  private propertyPanelService?: PropertyPanelService

  constructor(config: CoreServicesIntegrationConfig = {}, compatLayer?: ApiCompatLayer, featureFlags?: FeatureFlags) {
    this.options = {
      useGlobalInstances: true,
      registerToCompatLayer: true,
      verbose: false,
      ...config,
    }

    this.compatLayer = compatLayer
    this.featureFlags = featureFlags

    // 初始化核心服务
    this.container = this.options.useGlobalInstances ? globalContainer : new Container()
    this.eventBus = this.options.useGlobalInstances ? globalEventBus : new EventBus()
    this.config = this.options.useGlobalInstances ? globalConfig : new ConfigManager()
    this.logger = this.options.useGlobalInstances ? globalLogger : new Logger()
  }

  /**
   * 集成所有核心服务
   */
  async integrate(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔧 Integrating core services...')
    }

    // 1. 注册服务到DI容器
    await this.registerToDIContainer()

    // 2. 注册服务到兼容层
    if (this.options.registerToCompatLayer && this.compatLayer) {
      await this.registerToCompatLayer()
    }

    // 3. 配置服务间的依赖关系
    await this.configureDependencies()

    // 4. 初始化服务
    await this.initializeServices()

    if (this.options.verbose) {
      console.log('✅ Core services integrated successfully')
    }
  }

  /**
   * 注册服务到DI容器
   */
  private async registerToDIContainer(): Promise<void> {
    if (this.options.verbose) {
      console.log('  📦 Registering services to DI container...')
    }

    // 注册容器自身
    this.container.register('Container', { useValue: this.container }, { lifetime: 'singleton' as any })

    // 注册事件总线
    this.container.register('EventBus', { useValue: this.eventBus }, { lifetime: 'singleton' as any })

    // 注册配置管理器
    this.container.register('ConfigManager', { useValue: this.config }, { lifetime: 'singleton' as any })

    // 注册日志器
    this.container.register('Logger', { useValue: this.logger }, { lifetime: 'singleton' as any })

    // 初始化并注册PropertyPanelService
    try {
      this.propertyPanelService = await initializePropertyPanelService()
      this.container.register('PropertyPanelService', { useValue: this.propertyPanelService }, { lifetime: 'singleton' as any })

      if (this.options.verbose) {
        console.log('  ✓ PropertyPanelService initialized and registered')
      }
    } catch (error) {
      console.error('  ✗ Failed to initialize PropertyPanelService:', error)
      // 不抛出错误,允许系统继续运行
    }

    if (this.options.verbose) {
      console.log('  ✓ Services registered to DI container')
    }
  }

  /**
   * 注册服务到兼容层
   */
  private async registerToCompatLayer(): Promise<void> {
    if (!this.compatLayer) return

    if (this.options.verbose) {
      console.log('  🔄 Registering services to compatibility layer...')
    }

    // 注册容器
    this.compatLayer.registerApi('Container', this.container)
    this.compatLayer.registerApi('DIContainer', this.container) // 别名

    // 注册事件总线
    this.compatLayer.registerApi('EventBus', this.eventBus)

    // 注册配置管理器
    this.compatLayer.registerApi('ConfigManager', this.config)
    this.compatLayer.registerApi('Config', this.config) // 别名

    // 注册日志器
    this.compatLayer.registerApi('Logger', this.logger)

    // 注册PropertyPanelService
    if (this.propertyPanelService) {
      this.compatLayer.registerApi('PropertyPanelService', this.propertyPanelService)
    }

    if (this.options.verbose) {
      console.log('  ✓ Services registered to compatibility layer')
    }
  }

  /**
   * 配置服务间的依赖关系
   */
  private async configureDependencies(): Promise<void> {
    if (this.options.verbose) {
      console.log('  🔗 Configuring service dependencies...')
    }

    // 配置日志器使用事件总线
    this.eventBus.on('log.error', data => {
      // 可以在这里添加额外的错误处理逻辑
    })

    // 配置配置管理器使用事件总线
    this.config.watchAll(event => {
      this.eventBus.emit('config.changed', event)
    })

    if (this.options.verbose) {
      console.log('  ✓ Service dependencies configured')
    }
  }

  /**
   * 初始化服务
   */
  private async initializeServices(): Promise<void> {
    if (this.options.verbose) {
      console.log('  🚀 Initializing services...')
    }

    // 加载配置
    try {
      await this.config.reload()
    } catch (error) {
      console.warn('Failed to reload config:', error)
    }

    // 发送初始化完成事件
    this.eventBus.emit('core.services.initialized', {
      container: this.container,
      eventBus: this.eventBus,
      config: this.config,
      logger: this.logger,
    })

    if (this.options.verbose) {
      console.log('  ✓ Services initialized')
    }
  }

  /**
   * 获取容器
   */
  getContainer(): Container {
    return this.container
  }

  /**
   * 获取事件总线
   */
  getEventBus(): EventBus {
    return this.eventBus
  }

  /**
   * 获取配置管理器
   */
  getConfigManager(): ConfigManager {
    return this.config
  }

  /**
   * 获取日志器
   */
  getLogger(): Logger {
    return this.logger
  }

  /**
   * 获取PropertyPanelService
   */
  getPropertyPanelService(): PropertyPanelService | undefined {
    return this.propertyPanelService
  }
}

/**
 * 创建并集成核心服务
 */
export async function integrateCoreServices(
  compatLayer?: ApiCompatLayer,
  featureFlags?: FeatureFlags,
  config: CoreServicesIntegrationConfig = {}
): Promise<CoreServicesIntegration> {
  // 检查特性开关
  const shouldIntegrate = !featureFlags || featureFlags.isEnabled(FEATURE_FLAGS.NEW_DI_CONTAINER)

  if (!shouldIntegrate) {
    console.log('ℹ️  Core services integration skipped (feature flag disabled)')
    // 返回一个使用全局实例的集成对象
    return new CoreServicesIntegration({ useGlobalInstances: true }, compatLayer, featureFlags)
  }

  const integration = new CoreServicesIntegration(config, compatLayer, featureFlags)
  await integration.integrate()

  return integration
}
