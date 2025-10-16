/**
 * 数据源状态管理接口
 * 定义数据源状态的管理和追踪
 */

import { DataSourceState } from './IDataSource'

// 状态变更记录
export interface StateChangeRecord {
  /** 变更时间 */
  timestamp: Date
  /** 前一个状态 */
  prevState: DataSourceState
  /** 当前状态 */
  currentState: DataSourceState
  /** 变更原因 */
  reason?: string
}

// 数据源状态管理器接口
export interface IDataSourceStateManager {
  /**
   * 获取当前状态
   */
  getState(): DataSourceState

  /**
   * 设置状态
   */
  setState(state: DataSourceState, reason?: string): void

  /**
   * 检查是否处于指定状态
   */
  isState(state: DataSourceState): boolean

  /**
   * 检查是否可以转换到指定状态
   */
  canTransitionTo(state: DataSourceState): boolean

  /**
   * 获取状态历史
   */
  getHistory(): StateChangeRecord[]

  /**
   * 清空状态历史
   */
  clearHistory(): void

  /**
   * 订阅状态变更
   */
  onStateChange(handler: (state: DataSourceState, prevState: DataSourceState) => void): () => void
}

// 状态转换规则
export interface StateTransitionRule {
  /** 源状态 */
  from: DataSourceState
  /** 目标状态 */
  to: DataSourceState
  /** 是否允许转换 */
  allowed: boolean
  /** 转换条件 */
  condition?: () => boolean
}

// 默认状态转换规则
export const DEFAULT_STATE_TRANSITIONS: StateTransitionRule[] = [
  // Idle 可以转换到 Loading
  { from: DataSourceState.Idle, to: DataSourceState.Loading, allowed: true },

  // Loading 可以转换到 Loaded, Error
  { from: DataSourceState.Loading, to: DataSourceState.Loaded, allowed: true },
  { from: DataSourceState.Loading, to: DataSourceState.Error, allowed: true },

  // Loaded 可以转换到 Refreshing, Loading, Idle
  { from: DataSourceState.Loaded, to: DataSourceState.Refreshing, allowed: true },
  { from: DataSourceState.Loaded, to: DataSourceState.Loading, allowed: true },
  { from: DataSourceState.Loaded, to: DataSourceState.Idle, allowed: true },

  // Error 可以转换到 Loading, Idle
  { from: DataSourceState.Error, to: DataSourceState.Loading, allowed: true },
  { from: DataSourceState.Error, to: DataSourceState.Idle, allowed: true },

  // Refreshing 可以转换到 Loaded, Error
  { from: DataSourceState.Refreshing, to: DataSourceState.Loaded, allowed: true },
  { from: DataSourceState.Refreshing, to: DataSourceState.Error, allowed: true },
]
