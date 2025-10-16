/**
 * 状态管理器工厂函数
 *
 * 提供便捷的创建和配置方法
 */

import { StateManager, type StateManagerOptions } from './StateManager'
import type { IPersistenceStrategy } from './persistence'
import { LocalStorageStrategy } from './persistence'
import { PersistenceManager } from './persistence'

/**
 * 创建状态管理器配置
 */
export interface CreateStateManagerConfig extends StateManagerOptions {
  /** 持久化策略 */
  persistence?: {
    /** 策略实例 */
    strategy?: IPersistenceStrategy
    /** 持久化选项 */
    options?: {
      keyPrefix?: string
      paths?: string[]
      excludePaths?: string[]
      throttle?: number
      saveOnUnload?: boolean
    }
  }
}

/**
 * 创建状态管理器实例
 */
export function createStateManager(config: CreateStateManagerConfig = {}): {
  stateManager: StateManager
  persistence?: PersistenceManager
} {
  // 创建状态管理器
  const stateManager = new StateManager({
    strict: config.strict,
    enableTimeTrave: config.enableTimeTrave,
    maxHistorySize: config.maxHistorySize,
    devtools: config.devtools,
  })

  // 创建持久化管理器 (如果配置了)
  let persistence: PersistenceManager | undefined

  if (config.persistence) {
    const strategy = config.persistence.strategy || new LocalStorageStrategy({ prefix: 'state:' })

    persistence = new PersistenceManager(stateManager, strategy, config.persistence.options)
  }

  return {
    stateManager,
    persistence,
  }
}

/**
 * 创建默认状态管理器 (开发环境)
 */
export function createDevStateManager(): {
  stateManager: StateManager
  persistence: PersistenceManager
} {
  const { stateManager, persistence } = createStateManager({
    strict: true,
    enableTimeTrave: true,
    maxHistorySize: 100,
    devtools: true,
    persistence: {
      options: {
        keyPrefix: 'dev:state:',
        throttle: 500,
        saveOnUnload: true,
      },
    },
  })

  return {
    stateManager,
    persistence: persistence!,
  }
}

/**
 * 创建生产环境状态管理器
 */
export function createProdStateManager(): {
  stateManager: StateManager
  persistence: PersistenceManager
} {
  const { stateManager, persistence } = createStateManager({
    strict: false,
    enableTimeTrave: false,
    maxHistorySize: 0,
    devtools: false,
    persistence: {
      options: {
        keyPrefix: 'state:',
        throttle: 2000,
        saveOnUnload: true,
      },
    },
  })

  return {
    stateManager,
    persistence: persistence!,
  }
}
