/**
 * 数据迁移脚本集合
 *
 * 定义各个版本之间的数据迁移逻辑
 */

import type { Migration } from './VersionManager'

/**
 * 从 1.x 迁移到 2.0
 *
 * 主要变更:
 * - 数据源配置格式变更
 * - 控件定义结构变更
 * - 状态管理格式变更
 */
export const migration_1x_to_2_0: Migration = {
  id: 'migration_1x_to_2_0',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '从 1.x 迁移到 2.0 - 架构重构',
  priority: 100,

  async up(data: any) {
    const migrated = { ...data }

    // 迁移数据源配置
    if (migrated.dataSources) {
      migrated.dataSources = migrated.dataSources.map((ds: any) => ({
        id: ds.id,
        type: ds.type,
        config: {
          ...ds.config,
          // 新增字段
          version: '2.0',
        },
      }))
    }

    // 迁移控件定义
    if (migrated.controls) {
      migrated.controls = migrated.controls.map((ctrl: any) => ({
        ...ctrl,
        // 添加版本信息
        __version: '2.0.0',
        // 迁移属性结构
        properties: ctrl.props || ctrl.properties,
      }))
      delete migrated.controls.props
    }

    // 迁移状态管理
    if (migrated.store) {
      migrated.state = {
        modules: migrated.store.modules || {},
        version: '2.0.0',
      }
      delete migrated.store
    }

    return migrated
  },

  async down(data: any) {
    const reverted = { ...data }

    // 回滚数据源配置
    if (reverted.dataSources) {
      reverted.dataSources = reverted.dataSources.map((ds: any) => {
        const { version, ...config } = ds.config
        return {
          id: ds.id,
          type: ds.type,
          config,
        }
      })
    }

    // 回滚控件定义
    if (reverted.controls) {
      reverted.controls = reverted.controls.map((ctrl: any) => {
        const { __version, properties, ...rest } = ctrl
        return {
          ...rest,
          props: properties,
        }
      })
    }

    // 回滚状态管理
    if (reverted.state) {
      reverted.store = {
        modules: reverted.state.modules || {},
      }
      delete reverted.state
    }

    return reverted
  },
}

/**
 * 从 2.0 迁移到 2.1
 *
 * 主要变更:
 * - 添加插件系统支持
 * - 优化数据流配置
 */
export const migration_2_0_to_2_1: Migration = {
  id: 'migration_2_0_to_2_1',
  fromVersion: '2.0.0',
  toVersion: '2.1.0',
  description: '从 2.0 迁移到 2.1 - 插件系统',
  priority: 90,

  async up(data: any) {
    const migrated = { ...data }

    // 添加插件配置
    if (!migrated.plugins) {
      migrated.plugins = {
        enabled: [],
        config: {},
      }
    }

    // 迁移数据流配置
    if (migrated.dataFlows) {
      migrated.dataFlows = migrated.dataFlows.map((flow: any) => ({
        ...flow,
        transforms: flow.transforms || [],
        version: '2.1.0',
      }))
    }

    return migrated
  },

  async down(data: any) {
    const reverted = { ...data }

    // 移除插件配置
    delete reverted.plugins

    // 回滚数据流配置
    if (reverted.dataFlows) {
      reverted.dataFlows = reverted.dataFlows.map((flow: any) => {
        const { version, ...rest } = flow
        return rest
      })
    }

    return reverted
  },
}

/**
 * 从 2.1 迁移到 2.2
 *
 * 主要变更:
 * - 性能优化配置
 * - 缓存策略配置
 */
export const migration_2_1_to_2_2: Migration = {
  id: 'migration_2_1_to_2_2',
  fromVersion: '2.1.0',
  toVersion: '2.2.0',
  description: '从 2.1 迁移到 2.2 - 性能优化',
  priority: 80,

  async up(data: any) {
    const migrated = { ...data }

    // 添加性能配置
    if (!migrated.performance) {
      migrated.performance = {
        lazyLoading: true,
        virtualScroll: true,
        caching: {
          enabled: true,
          strategy: 'lru',
          maxSize: 100,
        },
      }
    }

    return migrated
  },

  async down(data: any) {
    const reverted = { ...data }
    delete reverted.performance
    return reverted
  },
}

/**
 * 控件定义迁移 - 从旧格式到新格式
 */
export const migrateControlDefinition: Migration = {
  id: 'migrate_control_definition',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '迁移控件定义格式',
  priority: 95,

  async up(data: any) {
    if (!data.kind) return data

    return {
      kind: data.kind,
      kindName: data.kindName || data.name,
      category: data.category || 'basic',
      icon: data.icon,
      component: data.component,
      properties: data.props || data.properties || [],
      events: data.events || [],
      methods: data.methods || [],
      dataBinding: data.dataBinding || {},
      __version: '2.0.0',
    }
  },

  async down(data: any) {
    const { __version, properties, ...rest } = data
    return {
      ...rest,
      props: properties,
    }
  },
}

/**
 * 数据源配置迁移
 */
export const migrateDataSourceConfig: Migration = {
  id: 'migrate_datasource_config',
  fromVersion: '1.0.0',
  toVersion: '2.0.0',
  description: '迁移数据源配置格式',
  priority: 95,

  async up(data: any) {
    if (!data.type) return data

    return {
      id: data.id || `ds_${Date.now()}`,
      type: data.type,
      config: {
        ...(data.config || data),
        version: '2.0.0',
      },
      metadata: {
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }
  },

  async down(data: any) {
    const { metadata, config, ...rest } = data
    const { version, ...configRest } = config
    return {
      ...rest,
      ...configRest,
    }
  },
}

/**
 * 获取所有迁移脚本
 */
export function getAllMigrations(): Migration[] {
  return [migration_1x_to_2_0, migration_2_0_to_2_1, migration_2_1_to_2_2, migrateControlDefinition, migrateDataSourceConfig]
}

/**
 * 注册所有迁移脚本到版本管理器
 */
export function registerAllMigrations(versionManager: any): void {
  const migrations = getAllMigrations()
  migrations.forEach(migration => {
    versionManager.registerMigration(migration)
  })
}
