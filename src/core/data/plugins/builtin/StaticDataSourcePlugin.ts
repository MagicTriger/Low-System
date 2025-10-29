/**
 * 静态数据源插件
 * 提供静态数据的数据源
 */

import type { IDataSource, DataSourceConfig, DataSourceState, DataSourceMetadata, LoadOptions, DataSourceEvents } from '../../interfaces'
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
  private eventHandlers: Map<keyof DataSourceEvents, Set<Function>> = new Map()

  constructor(public readonly config: StaticDataSourceConfig) {
    this._data = config.data
  }

  get metadata(): DataSourceMetadata {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      state: this.state,
      hasCached: true,
      recordCount: this._data ? (Array.isArray(this._data) ? this._data.length : 1) : 0,
    }
  }

  get state(): DataSourceState {
    if (this._error) return 'error' as DataSourceState
    if (this._data !== null) return 'loaded' as DataSourceState
    return 'idle' as DataSourceState
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

  async load(options?: LoadOptions): Promise<T> {
    this.emit('before-load', options)

    if (this._data === null) {
      const error = new Error('No data available')
      this._error = error
      this.emit('error', error)
      throw error
    }

    this.emit('after-load', this._data)
    return this._data
  }

  async refresh(options?: LoadOptions): Promise<T> {
    this.emit('refresh')
    return this.load(options)
  }

  async reload(options?: LoadOptions): Promise<T> {
    return this.load(options)
  }

  clear(): void {
    this._data = null
    this._error = null
  }

  setData(data: T): void {
    const prevData = this._data
    this._data = data
    this.emit('data-change', data, prevData)
  }

  getData(): T | null {
    return this._data
  }

  on<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as Function)
    return () => this.off(event, handler)
  }

  off<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler as Function)
    }
  }

  private emit<K extends keyof DataSourceEvents>(event: K, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  dispose(): void {
    this.clear()
    this.eventHandlers.clear()
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
