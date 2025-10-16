/**
 * 应用启动时的迁移引导
 *
 * 在应用启动时自动初始化迁移系统
 */

import { initializeGlobalMigrationSystem } from './index'
import { FEATURE_FLAGS } from '../features'
import { integrateCoreServices } from './CoreServicesIntegration'
import { integrateDataLayer } from './DataLayerIntegration'
import { integrateStateManagement } from './StateManagementIntegration'
import { integrateServices } from './ServicesIntegration'

/**
 * 引导迁移系统
 */
export async function bootstrapMigration(): Promise<void> {
  try {
    console.log('🔄 Bootstrapping migration system...')

    // 初始化迁移系统
    const migrationSystem = await initializeGlobalMigrationSystem({
      currentVersion: '2.0.0',
      enableCompatLayer: true,
      enableFeatureFlags: true,
      enableVersionManager: true,
      autoMigrate: true,
      verbose: import.meta.env.DEV, // 开发环境启用详细日志
    })

    // 获取特性开关
    const featureFlags = migrationSystem.getFeatureFlags()

    if (featureFlags) {
      // 在开发环境启用所有新特性用于测试
      if (import.meta.env.DEV) {
        console.log('🧪 Development mode: Enabling new features for testing')

        // 启用核心架构特性
        featureFlags.enable(FEATURE_FLAGS.NEW_DI_CONTAINER)
        featureFlags.enable(FEATURE_FLAGS.NEW_EVENT_BUS)
        featureFlags.enable(FEATURE_FLAGS.NEW_CONFIG_MANAGER)

        // 启用API层特性
        featureFlags.enable(FEATURE_FLAGS.NEW_API_CLIENT)
        featureFlags.enable(FEATURE_FLAGS.REQUEST_CACHE)
        featureFlags.enable(FEATURE_FLAGS.AUTO_RETRY)

        // 启用性能优化特性
        featureFlags.enable(FEATURE_FLAGS.LAZY_LOADING)
        featureFlags.enable(FEATURE_FLAGS.WEB_WORKER)
        featureFlags.enable(FEATURE_FLAGS.MULTI_LEVEL_CACHE)

        // 启用兼容层
        featureFlags.enable(FEATURE_FLAGS.LEGACY_ADAPTER)
        featureFlags.enable(FEATURE_FLAGS.API_COMPAT_LAYER)
      }

      // 显示特性状态摘要
      if (import.meta.env.DEV) {
        const flags = featureFlags.getAllFlags()
        const enabledCount = flags.filter(f => f.enabled).length
        console.log(`📊 Feature Flags: ${enabledCount}/${flags.length} enabled`)
        console.log('   Use window.__MIGRATION_SYSTEM__ to inspect details')
      }
    }

    // 检查是否需要数据迁移
    await checkAndMigrateData(migrationSystem)

    // 集成核心服务
    console.log('🔧 Integrating core services...')
    const coreServices = await integrateCoreServices(migrationSystem.getCompatLayer(), migrationSystem.getFeatureFlags(), {
      useGlobalInstances: true,
      registerToCompatLayer: true,
      verbose: import.meta.env.DEV,
    })
    console.log('✅ Core services integrated')

    // 集成数据层
    console.log('🔧 Integrating data layer...')
    const dataLayer = await integrateDataLayer(
      {
        useGlobalInstances: true,
        registerToCompatLayer: true,
        verbose: import.meta.env.DEV,
      },
      {
        container: coreServices.getContainer(),
        eventBus: coreServices.getEventBus(),
        config: coreServices.getConfigManager(),
        logger: coreServices.getLogger(),
      },
      migrationSystem.getCompatLayer(),
      migrationSystem.getFeatureFlags()
    )
    console.log('✅ Data layer integrated')

    // 集成状态管理
    console.log('🔧 Integrating state management...')
    const stateManagement = await integrateStateManagement(
      {
        useGlobalInstance: true,
        registerToCompatLayer: true,
        verbose: import.meta.env.DEV,
      },
      {
        container: coreServices.getContainer(),
        eventBus: coreServices.getEventBus(),
        logger: coreServices.getLogger(),
      },
      migrationSystem.getCompatLayer(),
      migrationSystem.getFeatureFlags()
    )
    console.log('✅ State management integrated')

    // 集成核心服务
    console.log('🔧 Integrating core services...')
    const services = await integrateServices(
      {
        useGlobalInstances: true,
        registerToCompatLayer: true,
        verbose: import.meta.env.DEV,
        services: {
          plugin: true,
          layout: true,
          runtime: true,
          business: true,
        },
      },
      {
        container: coreServices.getContainer(),
        eventBus: coreServices.getEventBus(),
        logger: coreServices.getLogger(),
      },
      migrationSystem.getCompatLayer(),
      migrationSystem.getFeatureFlags()
    )
    console.log('✅ Core services integrated')

    console.log('✅ Migration system bootstrapped successfully')

    // 在开发环境暴露到全局
    if (import.meta.env.DEV) {
      ;(window as any).__MIGRATION_SYSTEM__ = {
        system: migrationSystem,
        compatLayer: migrationSystem.getCompatLayer(),
        featureFlags: migrationSystem.getFeatureFlags(),
        versionManager: migrationSystem.getVersionManager(),
        coreServices: {
          container: coreServices.getContainer(),
          eventBus: coreServices.getEventBus(),
          config: coreServices.getConfigManager(),
          logger: coreServices.getLogger(),
        },
        dataLayer: {
          dataSourceFactory: dataLayer.getDataSourceFactory(),
          dataFlowEngine: dataLayer.getDataFlowEngine(),
        },
        stateManagement: {
          stateManager: stateManagement.getStateManager(),
        },
        services: {
          registeredServices: services.getRegisteredServices(),
        },
      }
    }
  } catch (error) {
    console.error('❌ Failed to bootstrap migration system:', error)
    throw error
  }
}

/**
 * 检查并迁移数据
 */
async function checkAndMigrateData(migrationSystem: any): Promise<void> {
  try {
    // 从localStorage加载用户数据
    const userDataKey = 'app_user_data'
    const storedData = localStorage.getItem(userDataKey)

    if (!storedData) {
      console.log('ℹ️  No user data found, skipping migration')
      return
    }

    const userData = JSON.parse(storedData)
    const dataVersion = userData.__version || '1.0.0'

    // 检查版本兼容性
    const compatibility = migrationSystem.checkCompatibility(dataVersion)

    if (!compatibility.compatible) {
      console.error('❌ Data version incompatible:', compatibility.errors)
      return
    }

    // 如果需要迁移
    if (compatibility.requiredMigrations.length > 0) {
      console.log(`🔄 Migrating user data from ${dataVersion} to 2.0.0...`)
      console.log(`  Required migrations: ${compatibility.requiredMigrations.length}`)

      // 执行迁移
      const migratedData = await migrationSystem.migrateData(userData)

      // 保存迁移后的数据
      localStorage.setItem(userDataKey, JSON.stringify(migratedData))

      console.log('✅ User data migrated successfully')
    } else {
      console.log('ℹ️  User data is up to date, no migration needed')
    }
  } catch (error) {
    console.error('❌ Failed to migrate user data:', error)
    // 不抛出错误,允许应用继续运行
  }
}

/**
 * 在应用卸载时清理
 */
export function cleanupMigration(): void {
  console.log('🧹 Cleaning up migration system...')
  // 清理逻辑
}
