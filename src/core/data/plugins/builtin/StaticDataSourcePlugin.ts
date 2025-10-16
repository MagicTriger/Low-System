/**
 * 静态数据源插件
 * 提供静态数据的数据源
 */

import type { IDataSource, DataSourceConfig } from '../../interfaces'
import { BaseDataSourcePlugin } from '../BaseDataSourcePlugin'
import type { DataSourcePluginMetadata } from '../IDataSourcePlugin'

// 静态数据源配置
export interface StaticDataSourceConfig extends DataSourceConfig {
  data: any
}

// 静态数据源实现
class StaticDataSource<T = any> implements IDataSource<T> {
  private _data: T | null
  private _error: Error | null = null

  constructor(public readonly config: StaticDataSourceConfig) {
    this._data = config.data
  }

  get metadata() {
    return {
      type: 'static',
      version: '1.0.0',
      capabilities: ['load'],
    }
  }

  get state() {
    if (this._error) return 'error' as const
    if (this._data !== null) return 'loaded' as const
    return 'idle' as const
  }

  get data(): T | null {
    return this._data
  }

  get isLoading(): boolean {
    return false
  }

  get hasError(): boolean {
    return this._error !== null
  }

  get error(): Error | null {
    return this._error
  }

  async load(options?: any): Promise<T> {
    if (this._data === null) {
      throw new Error('No data available')
    }
    return this._data
  }

  async refresh(options?: any): Promise<T> {
    return this.load(options)
  }

  async reload(options?: any): Promise<T> {
    return this.load(options)
  }

  clear(): void {
    this._data = null
    this._error = null
  }

  setData(data: T): void {
    this._data = data
  }

  getData(): T | null {
    return this._data
  }

  on(event: string, handler: any): () => void {
    return () => {}
  }

  off(event: string, handler: any): void {}

  dispose(): void {
    this.clear()
  }
}

// 静态数据源插件
export class StaticDataSourcePlugin extends BaseDataSourcePlugin {
  constructor() {
    const metadata: DataSourcePluginMetadata = {
      id: 'static-datasource',
      name: 'Static Data Source',
      version: '1.0.0',
      description: 'Provides static data source',
      dataSourceType: 'static',
      capabilities: ['load'],
    }
    super(metadata)
  }

  createDataSource<T = any>(config: DataSourceConfig): IDataSource<T> {
    this.assertInitialized()
    return new StaticDataSource<T>(config as StaticDataSourceConfig)
  }

  protected onValidateConfig(config: DataSourceConfig): boolean {
    const staticConfig = config as StaticDataSourceConfig
    return staticConfig.data !== undefined
  }

  protected onGetConfigSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        data: {
          type: 'any',
          description: 'Static data',
          required: true,
        },
      },
    }
  }
}
