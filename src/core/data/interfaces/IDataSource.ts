/**
 * 数据源抽象接口
 * 定义统一的数据源接口,支持多种数据源类型
 */

// 数据源状态
export enum DataSourceState {
  Idle = 'idle', // 空闲
  Loading = 'loading', // 加载中
  Loaded = 'loaded', // 已加载
  Error = 'error', // 错误
  Refreshing = 'refreshing', // 刷新中
}

// 数据源类型
export enum DataSourceType {
  Static = 'static', // 静态数据
  API = 'api', // API接口
  Database = 'database', // 数据库
  WebSocket = 'websocket', // WebSocket
  Custom = 'custom', // 自定义
}

// 数据源配置
export interface DataSourceConfig {
  /** 数据源ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 数据源类型 */
  type: DataSourceType
  /** 数据源描述 */
  description?: string
  /** 是否自动加载 */
  autoLoad?: boolean
  /** 缓存时间(毫秒) */
  cacheDuration?: number
  /** 重试次数 */
  retryCount?: number
  /** 重试延迟(毫秒) */
  retryDelay?: number
  /** 超时时间(毫秒) */
  timeout?: number
  /** 额外配置 */
  options?: Record<string, any>
}

// 数据源元数据
export interface DataSourceMetadata {
  /** 数据源ID */
  id: string
  /** 数据源名称 */
  name: string
  /** 数据源类型 */
  type: DataSourceType
  /** 数据源状态 */
  state: DataSourceState
  /** 最后加载时间 */
  lastLoadTime?: Date
  /** 最后错误 */
  lastError?: Error
  /** 数据记录数 */
  recordCount?: number
  /** 是否有缓存 */
  hasCached: boolean
}

// 加载选项
export interface LoadOptions {
  /** 是否强制刷新(忽略缓存) */
  forceRefresh?: boolean
  /** 加载参数 */
  params?: Record<string, any>
  /** 超时时间(毫秒) */
  timeout?: number
  /** 信号(用于取消) */
  signal?: AbortSignal
}

// 数据源事件
export interface DataSourceEvents {
  /** 状态变更事件 */
  'state-change': (state: DataSourceState, prevState: DataSourceState) => void
  /** 数据加载前事件 */
  'before-load': (options?: LoadOptions) => void
  /** 数据加载后事件 */
  'after-load': (data: any) => void
  /** 数据变更事件 */
  'data-change': (data: any, prevData: any) => void
  /** 错误事件 */
  error: (error: Error) => void
  /** 刷新事件 */
  refresh: () => void
}

// 数据源接口
export interface IDataSource<T = any> {
  /** 数据源配置 */
  readonly config: DataSourceConfig

  /** 数据源元数据 */
  readonly metadata: DataSourceMetadata

  /** 当前状态 */
  readonly state: DataSourceState

  /** 当前数据 */
  readonly data: T | null

  /** 是否正在加载 */
  readonly isLoading: boolean

  /** 是否有错误 */
  readonly hasError: boolean

  /** 最后的错误 */
  readonly error: Error | null

  /**
   * 加载数据
   */
  load(options?: LoadOptions): Promise<T>

  /**
   * 刷新数据
   */
  refresh(options?: LoadOptions): Promise<T>

  /**
   * 重新加载数据
   */
  reload(options?: LoadOptions): Promise<T>

  /**
   * 清空数据
   */
  clear(): void

  /**
   * 设置数据
   */
  setData(data: T): void

  /**
   * 获取数据
   */
  getData(): T | null

  /**
   * 订阅事件
   */
  on<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): () => void

  /**
   * 取消订阅
   */
  off<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): void

  /**
   * 销毁数据源
   */
  dispose(): void
}

// 数据源工厂接口
export interface IDataSourceFactory {
  /**
   * 创建数据源
   */
  create<T = any>(config: DataSourceConfig): IDataSource<T>

  /**
   * 注册数据源类型
   */
  register(type: DataSourceType, creator: DataSourceCreator): void

  /**
   * 取消注册数据源类型
   */
  unregister(type: DataSourceType): void

  /**
   * 检查是否支持数据源类型
   */
  supports(type: DataSourceType): boolean
}

// 数据源创建器
export type DataSourceCreator = <T = any>(config: DataSourceConfig) => IDataSource<T>

// 数据源错误类
export class DataSourceError extends Error {
  constructor(
    message: string,
    public dataSourceId: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DataSourceError'
  }
}

// 数据源加载错误
export class DataSourceLoadError extends DataSourceError {
  constructor(message: string, dataSourceId: string, originalError?: Error) {
    super(message, dataSourceId, originalError)
    this.name = 'DataSourceLoadError'
  }
}

// 数据源超时错误
export class DataSourceTimeoutError extends DataSourceError {
  constructor(dataSourceId: string, timeout: number) {
    super(`Data source load timeout after ${timeout}ms`, dataSourceId)
    this.name = 'DataSourceTimeoutError'
  }
}
