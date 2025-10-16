/**
 * HTTP数据源插件
 * 提供基于HTTP/REST API的数据源
 */

import type { IDataSource, DataSourceConfig } from '../../interfaces'
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

  constructor(public readonly config: HttpDataSourceConfig) {}

  get metadata() {
    return {
      type: 'http',
      version: '1.0.0',
      capabilities: ['load', 'refresh'],
    }
  }

  get state() {
    if (this._isLoading) return 'loading' as const
    if (this._error) return 'error' as const
    if (this._data) return 'loaded' as const
    return 'idle' as const
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

  async load(options?: any): Promise<T> {
    this._isLoading = true
    this._error = null

    try {
      const url = this.buildUrl()
      const fetchOptions = this.buildFetchOptions()

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      this._data = data
      return data
    } catch (error) {
      this._error = error as Error
      throw error
    } finally {
      this._isLoading = false
    }
  }

  async refresh(options?: any): Promise<T> {
    return this.load({ ...options, forceRefresh: true })
  }

  async reload(options?: any): Promise<T> {
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

  on(event: string, handler: any): () => void {
    // 简化实现
    return () => {}
  }

  off(event: string, handler: any): void {
    // 简化实现
  }

  dispose(): void {
    this.clear()
  }

  private buildUrl(): string {
    const { url, params } = this.config
    if (!params || Object.keys(params).length === 0) {
      return url
    }

    const searchParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      searchParams.append(key, String(value))
    })

    return `${url}?${searchParams.toString()}`
  }

  private buildFetchOptions(): RequestInit {
    const { method = 'GET', headers, body, timeout } = this.config

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body)
    }

    if (timeout) {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), timeout)
      options.signal = controller.signal
    }

    return options
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
