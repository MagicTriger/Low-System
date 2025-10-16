/**
 * 迁移系统入口
 *
 * 初始化兼容层、特性开关和版本管理
 */

import { ApiCompatLayer, getGlobalCompatLayer, setGlobalCompatLayer } from '../compat'
import { FeatureFlags, getGlobalFeatureFlags, setGlobalFeatureFlags, initializeDefaultFeatureFlags } from '../features'
import { VersionManager, registerAllMigrations } from '../version'

/**
 * 迁移系统配置
 */
export interface MigrationSystemConfig {
  /**
   * 当前版本
   */
  currentVersion?: string

  /**
   * 是否启用兼容层
   */
  enableCompatLayer?: boolean

  /**
   * 是否启用特性开关
   */
  enableFeatureFlags?: boolean

  /**
   * 是否启用版本管理
   */
  enableVersionManager?: boolean

  /**
   * 是否自动迁移
   */
  autoMigrate?: boolean

  /**
   * 是否启用详细日志
   */
  verbose?: boolean
}

/**
 * 迁移系统
 */
export class MigrationSystem {
  private compatLayer?: ApiCompatLayer
  private featureFlags?: FeatureFlags
  private versionManager?: VersionManager
  private config: Required<MigrationSystemConfig>

  constructor(config: MigrationSystemConfig = {}) {
    this.config = {
      currentVersion: '2.0.0',
      enableCompatLayer: true,
      enableFeatureFlags: true,
      enableVersionManager: true,
      autoMigrate: true,
      verbose: false,
      ...config,
    }
  }

  /**
   * 初始化迁移系统
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing Migration System...')

    // 1. 初始化兼容层
    if (this.config.enableCompatLayer) {
      await this.initializeCompatLayer()
    }

    // 2. 初始化特性开关
    if (this.config.enableFeatureFlags) {
      await this.initializeFeatureFlags()
    }

    // 3. 初始化版本管理
    if (this.config.enableVersionManager) {
      await this.initializeVersionManager()
    }

    console.log('✅ Migration System initialized successfully')
  }

  /**
   * 初始化兼容层
   */
  private async initializeCompatLayer(): Promise<void> {
    if (this.config.verbose) {
      console.log('📦 Initializing Compatibility Layer...')
    }

    this.compatLayer = new ApiCompatLayer({
      enabled: true,
      version: this.config.currentVersion,
      autoMigrate: this.config.autoMigrate,
    })

    // 设置为全局实例
    setGlobalCompatLayer(this.compatLayer)

    // TODO: 注册新版API实例
    // this.compatLayer.registerApi('DataFlowEngine', dataFlowEngine)
    // this.compatLayer.registerApi('StateManager', stateManager)
    // this.compatLayer.registerApi('EventBus', eventBus)

    if (this.config.verbose) {
      console.log('✓ Compatibility Layer initialized')
    }
  }

  /**
   * 初始化特性开关
   */
  private async initializeFeatureFlags(): Promise<void> {
    if (this.config.verbose) {
      console.log('🎛️  Initializing Feature Flags...')
    }

    this.featureFlags = new FeatureFlags({
      defaultEnabled: false,
      enableEvents: true,
      enablePersistence: true,
    })

    // 注册默认特性
    initializeDefaultFeatureFlags(this.featureFlags)

    // 设置为全局实例
    setGlobalFeatureFlags(this.featureFlags)

    if (this.config.verbose) {
      console.log('✓ Feature Flags initialized')
      console.log(`  Registered ${this.featureFlags.getAllFlags().length} feature flags`)
    }
  }

  /**
   * 初始化版本管理
   */
  private async initializeVersionManager(): Promise<void> {
    if (this.config.verbose) {
      console.log('📋 Initializing Version Manager...')
    }

    this.versionManager = new VersionManager({
      currentVersion: this.config.currentVersion,
      autoMigrate: this.config.autoMigrate,
      enableVersionCheck: true,
    })

    // 注册所有迁移脚本
    registerAllMigrations(this.versionManager)

    if (this.config.verbose) {
      console.log('✓ Version Manager initialized')
    }
  }

  /**
   * 获取兼容层
   */
  getCompatLayer(): ApiCompatLayer | undefined {
    return this.compatLayer
  }

  /**
   * 获取特性开关
   */
  getFeatureFlags(): FeatureFlags | undefined {
    return this.featureFlags
  }

  /**
   * 获取版本管理器
   */
  getVersionManager(): VersionManager | undefined {
    return this.versionManager
  }

  /**
   * 迁移数据
   */
  async migrateData(data: any, targetVersion?: string): Promise<any> {
    if (!this.versionManager) {
      throw new Error('Version Manager not initialized')
    }

    const dataVersion = data.__version || '1.0.0'

    if (this.config.verbose) {
      console.log(`📦 Migrating data from ${dataVersion} to ${targetVersion || this.config.currentVersion}...`)
    }

    const migratedData = await this.versionManager.migrate(data, targetVersion)

    if (this.config.verbose) {
      console.log('✓ Data migration completed')
    }

    return migratedData
  }

  /**
   * 检查版本兼容性
   */
  checkCompatibility(version: string) {
    if (!this.versionManager) {
      throw new Error('Version Manager not initialized')
    }

    return this.versionManager.checkCompatibility(version)
  }

  /**
   * 获取迁移状态
   */
  getStatus() {
    return {
      compatLayer: {
        enabled: !!this.compatLayer,
        instance: this.compatLayer,
      },
      featureFlags: {
        enabled: !!this.featureFlags,
        flags: this.featureFlags?.getAllFlags() || [],
      },
      versionManager: {
        enabled: !!this.versionManager,
        currentVersion: this.config.currentVersion,
        history: this.versionManager?.getMigrationHistory() || [],
      },
    }
  }
}

/**
 * 全局迁移系统实例
 */
let globalMigrationSystem: MigrationSystem | null = null

/**
 * 获取全局迁移系统
 */
export function getGlobalMigrationSystem(): MigrationSystem {
  if (!globalMigrationSystem) {
    globalMigrationSystem = new MigrationSystem()
  }
  return globalMigrationSystem
}

/**
 * 设置全局迁移系统
 */
export function setGlobalMigrationSystem(system: MigrationSystem): void {
  globalMigrationSystem = system
}

/**
 * 初始化全局迁移系统
 */
export async function initializeGlobalMigrationSystem(config?: MigrationSystemConfig): Promise<MigrationSystem> {
  const system = new MigrationSystem(config)
  await system.initialize()
  setGlobalMigrationSystem(system)
  return system
}
