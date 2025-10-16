/**
 * 数据源接口模块
 * 导出所有数据源相关的接口定义
 */

// 导出数据源接口
export type {
  DataSourceConfig,
  DataSourceMetadata,
  LoadOptions,
  DataSourceEvents,
  IDataSource,
  IDataSourceFactory,
  DataSourceCreator,
} from './IDataSource'

export { DataSourceState, DataSourceType, DataSourceError, DataSourceLoadError, DataSourceTimeoutError } from './IDataSource'

// 导出状态管理接口
export type { StateChangeRecord, IDataSourceStateManager, StateTransitionRule } from './IDataSourceState'

export { DEFAULT_STATE_TRANSITIONS } from './IDataSourceState'

// 导出事件接口
export type {
  DataSourceEventData,
  StateChangeEventData,
  BeforeLoadEventData,
  AfterLoadEventData,
  DataChangeEventData,
  ErrorEventData,
  RefreshEventData,
  DisposeEventData,
  DataSourceEventHandler,
  IDataSourceEventEmitter,
} from './IDataSourceEvents'

export { DataSourceEventType } from './IDataSourceEvents'

// 导出工厂接口
export type { IDataSourceCreator, DataSourceRegistration, IDataSourceFactory as IDataSourceFactoryInterface } from './IDataSourceFactory'

export { DataSourceFactoryError, DataSourceTypeNotRegisteredError, DataSourceConfigInvalidError } from './IDataSourceFactory'
