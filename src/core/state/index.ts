/**
 * 状态管理模块导出
 */

// 核心接口和类型
export * from './IStateModule'
export * from './StateManager'

// 持久化
export * from './persistence'

// 适配器
export * from './adapters/PiniaAdapter'

// 迁移工具
export * from './migration/MigrationHelper'

// 便捷函数
export { createStateManager } from './factory'
