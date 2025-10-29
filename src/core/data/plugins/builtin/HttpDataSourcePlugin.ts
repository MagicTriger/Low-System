/**
 * HTTP数据源插件
 * 提供基于HTTP/REST API的数据源
 */

import type { IDataSource, DataSourceConfig, DataSourceState, DataSourceMetadata, LoadOptions, DataSourceEvents } from '../../interfaces'
import { BaseDataSourcePlugin } from '../BaseDataSourcePlugin'
import type { DataSourcePluginMetadata } from '../IDataSourcePlugin'

// HTTP数据源配置
export interface HttpDataSourceConfig extends DataSourceConfig {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  params?: Record<string, any>
  body?: any
  timeout?: number
}

// HTTP数据源实现
class HttpDataSource<T = any> implements IDataSource<T> {
  private _data: T | null = null
  private _error: Error | null = null
  private _isLoading = false
  private _state: DataSourceState = 'idle' as DataSourceState
  private eventHandlers: Map<keyof DataSourceEvents, Set<Function>> = new Map()

  constructor(public readonly config: HttpDataSourceConfig) {}

  get metadata(): DataSourceMetadata {
    return {
      id: this.config.id,
      name: this.config.name,
      type: this.config.type,
      state: this.state,
      hasCached: false,
      recordCount: this._data ? (Array.isArray(this._data) ? this._data.length : 1) : 0,
    }
  }

  get state(): DataSourceState {
    if (this._isLoading) return 'loading' as DataSourceState
    if (this._error) return 'error' as DataSourceState
    if (this._data) return 'loaded' as DataSourceState
    return 'idle' as DataSourceState
  }

  get data(): T | null {
    return this._data
  }

  get isLoading(): boolean {
    return this._isLoading
  }

  get hasError(): boolean {
    return this._error !== null
  }

  get error(): Error | null {
    return this._error
  }

  async load(options?: LoadOptions): Promise<T> {
    this.emit('before-load', options)

    const prevState = this.state
    this._isLoading = true
    this._error = null

    try {
      const url = this.buildUrl(options?.params)
      const fetchOptions = this.buildFetchOptions(options)

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      const prevData = this._data
      this._data = data

      this.emit('state-change', this.state, prevState)
      this.emit('after-load', data)
      this.emit('data-change', data, prevData)

      return data
    } catch (error) {
      this._error = error as Error
      this.emit('error', error as Error)
      this.emit('state-change', this.state, prevState)
      throw error
    } finally {
      this._isLoading = false
    }
  }

  async refresh(options?: LoadOptions): Promise<T> {
    this.emit('refresh')
    return this.load({ ...options, forceRefresh: true })
  }

  async reload(options?: LoadOptions): Promise<T> {
    this.clear()
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

  private buildUrl(additionalParams?: Record<string, any>): string {
    const { url, params } = this.config
    const allParams = { ...params, ...additionalParams }

    if (!allParams || Object.keys(allParams).length === 0) {
      return url
    }

    const searchParams = new URLSearchParams()
    Object.entries(allParams).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })

    return `${url}?${searchParams.toString()}`
  }

  private buildFetchOptions(options?: LoadOptions): RequestInit {
    const { method = 'GET', headers, body, timeout } = this.config

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(body)
    }

    const effectiveTimeout = options?.timeout || timeout
    if (effectiveTimeout || options?.signal) {
      const controller = new AbortController()
      if (effectiveTimeout) {
        setTimeout(() => controller.abort(), effectiveTimeout)
      }
      fetchOptions.signal = options?.signal || controller.signal
    }

    return fetchOptions
  }
}

// HTTP数据源插件
export class HttpDataSourcePlugin extends BaseDataSourcePlugin {
  constructor() {
    const metadata: DataSourcePluginMetadata = {
      id: 'http-datasource',
      name: 'HTTP Data Source',
      version: '1.0.0',
      description: 'Provides HTTP/REST API data source',
      dataSourceType: 'http',
      capabilities: ['load', 'refresh', 'params', 'headers'],
    }
    super(metadata)
  }

  createDataSource<T = any>(config: DataSourceConfig): IDataSource<T> {
    this.assertInitialized()
    return new HttpDataSource<T>(config as HttpDataSourceConfig)
  }

  protected onValidateConfig(config: DataSourceConfig): boolean {
    const httpConfig = config as HttpDataSourceConfig
    return !!httpConfig.url
  }

  protected onGetConfigSchema(): Record<string, any> {
    return {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          description: 'API endpoint URL',
          required: true,
        },
        method: {
          type: 'string',
          enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
          default: 'GET',
        },
        headers: {
          type: 'object',
          description: 'HTTP headers',
        },
        params: {
          type: 'object',
          description: 'Query parameters',
        },
        body: {
          type: 'any',
          description: 'Request body',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in milliseconds',
        },
      },
    }
  }
}
