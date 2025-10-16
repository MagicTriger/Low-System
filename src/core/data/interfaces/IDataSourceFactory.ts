/**
 * 数据源工厂接口
 * 定义数据源的创建和注册机制
 */

import type { IDataSource, DataSourceConfig, DataSourceType } from './IDataSource'

// 数据源创建器
export interface IDataSourceCreator<T = any> {
  /**
   * 创建数据源实例
   */
  create(config: DataSourceConfig): IDataSource<T>

  /**
   * 验证配置
   */
  validateConfig(config: DataSourceConfig): boolean

  /**
   * 获取默认配置
   */
  getDefaultConfig(): Partial<DataSourceConfig>
}

// 数据源注册信息
export interface DataSourceRegistration {
  /** 数据源类型 */
  type: DataSourceType
  /** 创建器 */
  creator: IDataSourceCreator
  /** 描述 */
  description?: string
  /** 是否内置 */
  builtin: boolean
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
  register(type: DataSourceType, creator: IDataSourceCreator, description?: string): void

  /**
   * 取消注册数据源类型
   */
  unregister(type: DataSourceType): void

  /**
   * 检查是否支持数据源类型
   */
  supports(type: DataSourceType): boolean

  /**
   * 获取所有注册的数据源类型
   */
  getRegisteredTypes(): DataSourceType[]

  /**
   * 获取数据源注册信息
   */
  getRegistration(type: DataSourceType): DataSourceRegistration | undefined

  /**
   * 获取所有注册信息
   */
  getAllRegistrations(): DataSourceRegistration[]

  /**
   * 验证配置
   */
  validateConfig(config: DataSourceConfig): boolean
}

// 数据源工厂错误
export class DataSourceFactoryError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'DataSourceFactoryError'
  }
}

// 数据源类型未注册错误
export class DataSourceTypeNotRegisteredError extends DataSourceFactoryError {
  constructor(type: DataSourceType) {
    super(`Data source type not registered: ${type}`)
    this.name = 'DataSourceTypeNotRegisteredError'
  }
}

// 数据源配置无效错误
export class DataSourceConfigInvalidError extends DataSourceFactoryError {
  constructor(
    message: string,
    public config: DataSourceConfig
  ) {
    super(message)
    this.name = 'DataSourceConfigInvalidError'
  }
}
