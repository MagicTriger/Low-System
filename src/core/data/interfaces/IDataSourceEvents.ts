/**
 * 数据源事件接口
 * 定义数据源的事件系统
 */

import type { DataSourceState, LoadOptions } from './IDataSource'

// 事件类型
export enum DataSourceEventType {
  StateChange = 'state-change',
  BeforeLoad = 'before-load',
  AfterLoad = 'after-load',
  DataChange = 'data-change',
  Error = 'error',
  Refresh = 'refresh',
  Dispose = 'dispose',
}

// 事件数据
export interface DataSourceEventData {
  /** 数据源ID */
  dataSourceId: string
  /** 事件类型 */
  type: DataSourceEventType
  /** 时间戳 */
  timestamp: Date
  /** 事件数据 */
  payload?: any
}

// 状态变更事件数据
export interface StateChangeEventData extends DataSourceEventData {
  type: DataSourceEventType.StateChange
  payload: {
    prevState: DataSourceState
    currentState: DataSourceState
    reason?: string
  }
}

// 加载前事件数据
export interface BeforeLoadEventData extends DataSourceEventData {
  type: DataSourceEventType.BeforeLoad
  payload: {
    options?: LoadOptions
  }
}

// 加载后事件数据
export interface AfterLoadEventData extends DataSourceEventData {
  type: DataSourceEventType.AfterLoad
  payload: {
    data: any
    duration: number
  }
}

// 数据变更事件数据
export interface DataChangeEventData extends DataSourceEventData {
  type: DataSourceEventType.DataChange
  payload: {
    data: any
    prevData: any
  }
}

// 错误事件数据
export interface ErrorEventData extends DataSourceEventData {
  type: DataSourceEventType.Error
  payload: {
    error: Error
  }
}

// 刷新事件数据
export interface RefreshEventData extends DataSourceEventData {
  type: DataSourceEventType.Refresh
  payload: {
    options?: LoadOptions
  }
}

// 销毁事件数据
export interface DisposeEventData extends DataSourceEventData {
  type: DataSourceEventType.Dispose
  payload: {}
}

// 事件处理器
export type DataSourceEventHandler<T extends DataSourceEventData = DataSourceEventData> = (event: T) => void

// 数据源事件发射器接口
export interface IDataSourceEventEmitter {
  /**
   * 发射事件
   */
  emit<T extends DataSourceEventData>(event: T): void

  /**
   * 订阅事件
   */
  on<T extends DataSourceEventData>(type: DataSourceEventType, handler: DataSourceEventHandler<T>): () => void

  /**
   * 订阅一次性事件
   */
  once<T extends DataSourceEventData>(type: DataSourceEventType, handler: DataSourceEventHandler<T>): () => void

  /**
   * 取消订阅
   */
  off<T extends DataSourceEventData>(type: DataSourceEventType, handler: DataSourceEventHandler<T>): void

  /**
   * 取消所有订阅
   */
  offAll(type?: DataSourceEventType): void

  /**
   * 获取事件历史
   */
  getEventHistory(type?: DataSourceEventType): DataSourceEventData[]

  /**
   * 清空事件历史
   */
  clearEventHistory(): void
}
