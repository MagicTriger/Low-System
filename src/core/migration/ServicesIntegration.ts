/**
 * 核心服务集成
 *
 * 将所有核心服务统一注册到DI容器中进行管理
 */

import type { Container } from '../di/Container'
import type { EventBus } from '../events/EventBus'
import type { Logger } from '../logging/Logger'
import type { ApiCompatLayer } from '../compat'
import type { FeatureFlags } from '../features'
import { FEATURE_FLAGS } from '../features'

/**
 * 服务集成配置
 */
export interface ServicesIntegrationConfig {
  useGlobalInstances?: boolean
  registerToCompatLayer?: boolean
  verbose?: boolean
  services?: {
    plugin?: boolean
    layout?: boolean
    runtime?: boolean
    business?: boolean
  }
}

/**
 * 核心服务集成类
 */
export class ServicesIntegration {
  private container: Container
  private eventBus?: EventBus
  private logger?: Logger
  private compatLayer?: ApiCompatLayer
  private featureFlags?: FeatureFlags
  private options: Required<Omit<ServicesIntegrationConfig, 'services'>> & {
    services: Required<NonNullable<ServicesIntegrationConfig['services']>>
  }

  constructor(
    integrationConfig: ServicesIntegrationConfig = {},
    coreServices?: {
      container?: Container
      eventBus?: EventBus
      logger?: Logger
    },
    compatLayer?: ApiCompatLayer,
    featureFlags?: FeatureFlags
  ) {
    if (!coreServices?.container) {
      throw new Error('Container is required for ServicesIntegration')
    }

    this.container = coreServices.container
    this.eventBus = coreServices.eventBus
    this.logger = coreServices.logger
    this.compatLayer = compatLayer
    this.featureFlags = featureFlags

    const defaultServices = {
      plugin: true,
      layout: true,
      runtime: true,
      business: true,
    }

    this.options = {
      useGlobalInstances: integrationConfig.useGlobalInstances ?? true,
      registerToCompatLayer: integrationConfig.registerToCompatLayer ?? true,
      verbose: integrationConfig.verbose ?? false,
      services: {
        ...defaultServices,
        ...integrationConfig.services,
      },
    }
  }

  /**
   * 集成所有核心服务
   */
  async integrate(): Promise<void> {
    if (this.options.verbose) {
      console.log('🔧 Integrating core services...')
    }

    // 检查特性开关
    const shouldIntegrate = !this.featureFlags || this.featureFlags.isEnabled(FEATURE_FLAGS.UNIFIED_SERVICES)

    if (!shouldIntegrate) {
      console.log('ℹ️  Services integration skipped (feature flag disabled)')
      return
    }

    // 1. 注册插件系统
    if (this.options.services.plugin) {
      await this.registerPluginSystem()
    }

    // 2. 注册布局系统
    if (this.options.services.layout) {
      await this.registerLayoutSystem()
    }

    // 3. 注册业务服务
    if (this.options.services.business) {
      await this.registerBusinessServices()
    }

    // 4. 初始化所有服务
    await this.initializeServices()

    // 5. 注册到兼容层
    if (this.options.registerToCompatLayer && this.compatLayer) {
      await this.registerToCompatLayer()
    }

    if (this.options.verbose) {
      console.log('✅ Core services integrated successfully')
    }
  }

  /**
   * 注册插件系统
   */
  private async registerPluginSystem(): Promise<void> {
    if (this.options.verbose) {
      console.log('  📦 Registering plugin system...')
    }

    try {
      // 动态导入插件系统
      const pluginModule = await import('../plugins')
      const { PluginManager } = pluginModule

      // 注册PluginManager
      if (PluginManager) {
        this.container.register('PluginManager', { useClass: PluginManager }, { lifetime: 'singleton' as any })
      }

      if (this.options.verbose) {
        console.log('  ✓ Plugin system registered')
      }
    } catch (error) {
      this.logger?.warn('Failed to register plugin system', error)
      if (this.options.verbose) {
        console.warn('  ⚠ Plugin system registration failed:', error)
      }
    }
  }

  /**
   * 注册布局系统
   */
  private async registerLayoutSystem(): Promise<void> {
    if (this.options.verbose) {
      console.log('  📐 Registering layout system...')
    }

    try {
      // 动态导入布局系统
      const layoutModule = await import('../layout')

      // 注册LayoutManager
      if (layoutModule.createLayoutManager) {
        this.container.register('LayoutManager', { useFactory: () => layoutModule.createLayoutManager() }, { lifetime: 'singleton' as any })
      }

      // 注册GridSystem
      if (layoutModule.createGridSystem) {
        this.container.register('GridSystem', { useFactory: () => layoutModule.createGridSystem() }, { lifetime: 'singleton' as any })
      }

      // 注册ContainerManager
      if (layoutModule.createContainerManager) {
        this.container.register(
          'ContainerManager',
          { useFactory: () => layoutModule.createContainerManager() },
          { lifetime: 'singleton' as any }
        )
      }

      if (this.options.verbose) {
        console.log('  ✓ Layout system registered')
      }
    } catch (error) {
      this.logger?.warn('Failed to register layout system', error)
      if (this.options.verbose) {
        console.warn('  ⚠ Layout system registration failed:', error)
      }
    }
  }

  /**
   * 注册业务服务
   */
  private async registerBusinessServices(): Promise<void> {
    if (this.options.verbose) {
      console.log('  💼 Registering business services...')
    }

    try {
      // 动态导入业务服务
      const { DesignPersistenceService } = await import('../services/DesignPersistenceService')
      const { DataSourceService } = await import('../services/DataSourceService')

      // 注册DesignPersistenceService
      this.container.register('DesignPersistenceService', { useClass: DesignPersistenceService }, { lifetime: 'singleton' as any })

      // 注册DataSourceService
      this.container.register('DataSourceService', { useClass: DataSourceService }, { lifetime: 'singleton' as any })

      if (this.options.verbose) {
        console.log('  ✓ Business services registered')
      }
    } catch (error) {
      this.logger?.warn('Failed to register business services', error)
      if (this.options.verbose) {
        console.warn('  ⚠ Business services registration failed:', error)
      }
    }
  }

  /**
   * 初始化所有服务
   */
  private async initializeServices(): Promise<void> {
    if (this.options.verbose) {
      console.log('  🚀 Initializing services...')
    }

    // 发送初始化事件
    this.eventBus?.emit('services.initialized', {
      services: this.getRegisteredServices(),
    })

    if (this.options.verbose) {
      console.log('  ✓ Services initialized')
    }
  }

  /**
   * 注册到兼容层
   */
  private async registerToCompatLayer(): Promise<void> {
    if (!this.compatLayer) return

    if (this.options.verbose) {
      console.log('  🔄 Registering to compatibility layer...')
    }

    // 添加服务访问的兼容映射
    this.compatLayer.addMapping({
      pattern: /^services\.get$/,
      target: async call => {
        const [serviceName] = call.args || []
        return this.container.resolve(serviceName)
      },
      advice: {
        oldApi: 'services.get',
        newApi: 'container.resolve',
        description: '使用DI容器获取服务',
        example: `
// 旧版
const service = services.get('MyService')

// 新版
import { useService } from '@/core/services/helpers'
const service = useService<MyService>('MyService')`,
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    if (this.options.verbose) {
      console.log('  ✓ Registered to compatibility layer')
    }
  }

  /**
   * 获取已注册的服务列表
   */
  getRegisteredServices(): string[] {
    const services: string[] = []

    try {
      const registrations = (this.container as any).registrations
      if (registrations && registrations instanceof Map) {
        services.push(...Array.from(registrations.keys()))
      }
    } catch (error) {
      this.logger?.debug('Failed to get registered services', error)
    }

    return services
  }

  /**
   * 获取容器实例
   */
  getContainer(): Container {
    return this.container
  }
}

/**
 * 创建并集成核心服务
 */
export async function integrateServices(
  config: ServicesIntegrationConfig = {},
  coreServices?: {
    container?: Container
    eventBus?: EventBus
    logger?: Logger
  },
  compatLayer?: ApiCompatLayer,
  featureFlags?: FeatureFlags
): Promise<ServicesIntegration> {
  const integration = new ServicesIntegration(config, coreServices, compatLayer, featureFlags)

  await integration.integrate()

  return integration
}
