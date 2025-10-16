/**
 * HTTP/HTTPS适配器
 *
 * 使用Fetch API实现标准HTTP请求
 * 符合需求 8.1, 8.2, 8.3
 */

import type { IApiAdapter } from './IApiAdapter'
import type { RequestConfig, ApiResponse } from '../IApiClient'

/**
 * HTTP适配器实现
 */
export class HttpAdapter implements IApiAdapter {
  readonly name = 'http'
  readonly version = '1.0.0'

  /**
   * 执行HTTP请求
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    const url = this.buildURL(config.url!, config.params)
    const abortController = new AbortController()

    // 设置超时
    const timeoutId = config.timeout ? setTimeout(() => abortController.abort(), config.timeout) : null

    try {
      const response = await fetch(url, {
        method: config.method || 'GET',
        headers: config.headers as HeadersInit,
        body: this.serializeBody(config.data, config.headers),
        signal: abortController.signal,
        credentials: config.withCredentials ? 'include' : 'same-origin',
      })

      if (timeoutId) clearTimeout(timeoutId)

      // 检查HTTP状态
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      // 解析响应
      const data = await this.parseResponse<T>(response, config.responseType)

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        config,
      }
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }

      throw error
    }
  }

  /**
   * 检查是否支持协议
   */
  supports(protocol: string): boolean {
    return protocol === 'http' || protocol === 'https'
  }

  /**
   * 构建完整URL
   */
  private buildURL(url: string, params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return url
    }

    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    return url + (url.includes('?') ? '&' : '?') + queryString
  }

  /**
   * 序列化请求体
   */
  private serializeBody(data: any, headers?: Record<string, string>): BodyInit | undefined {
    if (!data) return undefined

    const contentType = headers?.['Content-Type'] || headers?.['content-type']

    if (contentType?.includes('application/json')) {
      return JSON.stringify(data)
    }

    if (contentType?.includes('application/x-www-form-urlencoded')) {
      return new URLSearchParams(data).toString()
    }

    if (data instanceof FormData || data instanceof Blob || typeof data === 'string') {
      return data
    }

    return JSON.stringify(data)
  }

  /**
   * 解析响应
   */
  private async parseResponse<T>(response: Response, responseType?: string): Promise<T> {
    switch (responseType) {
      case 'json':
        return response.json()
      case 'text':
        return response.text() as any
      case 'blob':
        return response.blob() as any
      case 'arraybuffer':
        return response.arrayBuffer() as any
      default:
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('application/json')) {
          return response.json()
        }
        return response.text() as any
    }
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}
