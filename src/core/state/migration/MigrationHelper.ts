/**
 * 迁移助手
 *
 * 提供从Pinia迁移到新状态管理系统的工具
 */

import type { Store } from 'pinia'
import type { StateManager } from '../StateManager'
import type { IStateModule } from '../IStateModule'
import { PiniaAdapter } from '../adapters/PiniaAdapter'

/**
 * 迁移配置
 */
export interface MigrationConfig {
  /** 要迁移的store列表 */
  stores: Array<{
    /** Pinia store实例 */
    store: Store<string, any, any, any>
    /** 是否保留Pinia store */
    keepPinia?: boolean
  }>

  /** 是否启用双向同步 */
  enableSync?: boolean

  /** 迁移完成回调 */
  onComplete?: () => void

  /** 迁移错误回调 */
  onError?: (error: Error) => void
}

/**
 * 迁移助手类
 */
export class MigrationHelper {
  private adapter: PiniaAdapter

  constructor(private stateManager: StateManager) {
    this.adapter = new PiniaAdapter(stateManager)
  }

  /**
   * 执行迁移
   */
  async migrate(config: MigrationConfig): Promise<void> {
    try {
      for (const { store, keepPinia = true } of config.stores) {
        await this.migrateStore(store, {
          autoSync: config.enableSync ?? true,
          keepPiniaStore: keepPinia,
        })
      }

      config.onComplete?.()
    } catch (error) {
      config.onError?.(error as Error)
      throw error
    }
  }

  /**
   * 迁移单个store
   */
  private async migrateStore(
    piniaStore: Store<string, any, any, any>,
    options: { autoSync: boolean; keepPiniaStore: boolean }
  ): Promise<void> {
    console.log(`Migrating store: ${piniaStore.$id}`)

    // 注册到新状态管理器
    this.adapter.registerPiniaStore(piniaStore)

    console.log(`Store ${piniaStore.$id} migrated successfully`)
  }

  /**
   * 生成迁移报告
   */
  generateReport(stores: Store<string, any, any, any>[]): MigrationReport {
    const report: MigrationReport = {
      totalStores: stores.length,
      migratedStores: [],
      warnings: [],
      recommendations: [],
    }

    for (const store of stores) {
      const analysis = this.analyzeStore(store)
      report.migratedStores.push({
        name: store.$id,
        stateKeys: analysis.stateKeys,
        getterCount: analysis.getterCount,
        mutationCount: analysis.mutationCount,
        actionCount: analysis.actionCount,
      })

      report.warnings.push(...analysis.warnings)
      report.recommendations.push(...analysis.recommendations)
    }

    return report
  }

  /**
   * 分析store
   */
  private analyzeStore(store: Store<string, any, any, any>): StoreAnalysis {
    const analysis: StoreAnalysis = {
      stateKeys: [],
      getterCount: 0,
      mutationCount: 0,
      actionCount: 0,
      warnings: [],
      recommendations: [],
    }

    // 分析状态
    const state = store.$state
    analysis.stateKeys = Object.keys(state)

    // 分析方法
    for (const key in store) {
      if (key.startsWith('$') || key.startsWith('_')) {
        continue
      }

      const value = (store as any)[key]

      if (typeof value === 'function') {
        if (key.startsWith('set') || key.startsWith('toggle')) {
          analysis.mutationCount++
        } else {
          analysis.actionCount++
        }
      } else {
        analysis.getterCount++
      }
    }

    // 生成警告和建议
    if (analysis.stateKeys.length > 20) {
      analysis.warnings.push(`Store ${store.$id} has ${analysis.stateKeys.length} state keys. Consider splitting into smaller modules.`)
    }

    if (analysis.actionCount > 15) {
      analysis.recommendations.push(`Store ${store.$id} has ${analysis.actionCount} actions. Consider grouping related actions.`)
    }

    return analysis
  }

  /**
   * 验证迁移
   */
  validateMigration(piniaStore: Store<string, any, any, any>): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
    }

    try {
      // 检查状态是否已迁移
      const state = this.stateManager.getState(piniaStore.$id)
      if (!state) {
        result.valid = false
        result.errors.push(`Store ${piniaStore.$id} not found in new state manager`)
        return result
      }

      // 检查状态键是否匹配
      const piniaKeys = Object.keys(piniaStore.$state).sort()
      const newKeys = Object.keys(state).sort()

      if (JSON.stringify(piniaKeys) !== JSON.stringify(newKeys)) {
        result.warnings.push(`State keys mismatch for store ${piniaStore.$id}. Pinia: ${piniaKeys.join(', ')}, New: ${newKeys.join(', ')}`)
      }

      // 检查状态值是否匹配
      for (const key of piniaKeys) {
        const piniaValue = piniaStore.$state[key]
        const newValue = state[key]

        if (JSON.stringify(piniaValue) !== JSON.stringify(newValue)) {
          result.warnings.push(`State value mismatch for ${piniaStore.$id}.${key}`)
        }
      }
    } catch (error) {
      result.valid = false
      result.errors.push(`Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }
}

/**
 * Store分析结果
 */
interface StoreAnalysis {
  stateKeys: string[]
  getterCount: number
  mutationCount: number
  actionCount: number
  warnings: string[]
  recommendations: string[]
}

/**
 * 迁移报告
 */
export interface MigrationReport {
  totalStores: number
  migratedStores: Array<{
    name: string
    stateKeys: string[]
    getterCount: number
    mutationCount: number
    actionCount: number
  }>
  warnings: string[]
  recommendations: string[]
}

/**
 * 验证结果
 */
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * 创建迁移助手实例
 */
export function createMigrationHelper(stateManager: StateManager): MigrationHelper {
  return new MigrationHelper(stateManager)
}
