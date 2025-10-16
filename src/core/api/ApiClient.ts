/**
 * API客户端实现
 *
 * 提供统一的HTTP请求封装,支持拦截器、重试、缓存等功能
 * 符合需求 8.1, 8.2, 8.3, 8.4, 8.5
 */

import type {
  IApiClient,
  RequestConfig,
  ApiResponse,
  ApiError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorConfig,
  CancelToken,
} from './IApiClient'
import type { RequestMetadata, RequestState } from './types'
import { RequestPriority } from './types'

/**
 * 拦截器描述符
 */
interface InterceptorDescriptor<T> {
  id: number
  handler: T
  config?: InterceptorConfig
}

/**
 * API客户端实现类
 */
export class ApiClient implements IApiClient {
  private defaults: RequestConfig
  private requestInterceptors: InterceptorDescriptor<RequestInterceptor>[] = []
  private responseInterceptors: InterceptorDescriptor<{
    fulfilled: ResponseInterceptor
    rejected?: ErrorInterceptor
  }>[] = []
  private interceptorIdCounter = 0
  private pendingRequests = new Map<string, AbortController>()

  private baseURL: string = ''

  constructor(config: RequestConfig = {}) {
    // 提取baseURL（可以是完整URL或相对路径）
    if (config.url) {
      this.baseURL = config.url
    }

    this.defaults = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      responseType: 'json',
      withCredentials: false,
      ...config,
    }

    // 添加默认的认证拦截器
    this.addRequestInterceptor(config => {
      // 从 localStorage 获取 token
      const accessToken = localStorage.getItem('accessToken')
      const tokenType = localStorage.getItem('tokenType') || 'Bearer'

      if (accessToken) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `${tokenType} ${accessToken}`
      }

      return config
    })
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'GET',
    })
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'POST',
      data,
    })
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'PUT',
      data,
    })
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'DELETE',
    })
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'PATCH',
      data,
    })
  }

  /**
   * HEAD请求
   */
  async head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'HEAD',
    })
  }

  /**
   * OPTIONS请求
   */
  async options<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      url,
      method: 'OPTIONS',
    })
  }

  /**
   * 通用请求方法
   */
  async request<T = any>(config: RequestConfig): Promise<ApiResponse<T>> {
    // 合并默认配置
    let mergedConfig = this.mergeConfig(this.defaults, config)

    // 生成请求ID
    const requestId = this.generateRequestId()
    const metadata: RequestMetadata = {
      id: requestId,
      startTime: Date.now(),
      state: 'pending' as RequestState,
      retryCount: 0,
      fromCache: false,
      priority: RequestPriority.NORMAL,
    }

    try {
      // 执行请求拦截器
      mergedConfig = await this.executeRequestInterceptors(mergedConfig)

      // 检查缓存
      if (mergedConfig.cache?.enabled && !mergedConfig.cache.forceRefresh) {
        const cachedResponse = await this.getFromCache<T>(mergedConfig)
        if (cachedResponse) {
          metadata.fromCache = true
          metadata.endTime = Date.now()
          metadata.duration = metadata.endTime - metadata.startTime
          return cachedResponse
        }
      }

      // 发送请求
      metadata.state = 'in_progress' as RequestState
      let response = await this.sendRequest<T>(mergedConfig, requestId)

      // 执行响应拦截器
      response = await this.executeResponseInterceptors(response)

      // 缓存响应
      if (mergedConfig.cache?.enabled) {
        await this.saveToCache(mergedConfig, response)
      }

      // 更新元数据
      metadata.state = 'completed' as RequestState
      metadata.endTime = Date.now()
      metadata.duration = metadata.endTime - metadata.startTime

      return response
    } catch (error: any) {
      metadata.state = 'failed' as RequestState
      metadata.endTime = Date.now()
      metadata.duration = metadata.endTime - metadata.startTime

      // 执行错误拦截器
      const processedError = await this.executeErrorInterceptors(error)

      // 重试逻辑
      if (this.shouldRetry(mergedConfig, processedError, metadata.retryCount)) {
        metadata.retryCount++
        await this.delay(this.getRetryDelay(mergedConfig, metadata.retryCount))
        return this.request<T>(mergedConfig)
      }

      throw this.createApiError(processedError, mergedConfig)
    } finally {
      // 清理待处理请求
      this.pendingRequests.delete(requestId)
    }
  }

  /**
   * 发送实际的HTTP请求
   */
  private async sendRequest<T>(config: RequestConfig, requestId: string): Promise<ApiResponse<T>> {
    const abortController = new AbortController()
    this.pendingRequests.set(requestId, abortController)

    // 构建完整URL
    const url = this.buildURL(config.url!, config.params)

    // 设置超时
    const timeoutId = config.timeout ? setTimeout(() => abortController.abort(), config.timeout) : null

    try {
      const response = await fetch(url, {
        method: config.method,
        headers: config.headers as HeadersInit,
        body: this.serializeData(config.data, config.headers),
        signal: abortController.signal,
        credentials: config.withCredentials ? 'include' : 'same-origin',
      })

      if (timeoutId) clearTimeout(timeoutId)

      // 解析响应
      const data = await this.parseResponse<T>(response, config.responseType)

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        config,
        requestId,
      }
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw this.createCancelError(requestId)
      }

      throw error
    }
  }

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor, config?: InterceptorConfig): number {
    const id = this.interceptorIdCounter++
    this.requestInterceptors.push({
      id,
      handler: interceptor,
      config,
    })

    // 按优先级排序
    this.requestInterceptors.sort((a, b) => (b.config?.priority || 0) - (a.config?.priority || 0))

    return id
  }

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor, errorInterceptor?: ErrorInterceptor, config?: InterceptorConfig): number {
    const id = this.interceptorIdCounter++
    this.responseInterceptors.push({
      id,
      handler: {
        fulfilled: interceptor,
        rejected: errorInterceptor,
      },
      config,
    })

    // 按优先级排序
    this.responseInterceptors.sort((a, b) => (b.config?.priority || 0) - (a.config?.priority || 0))

    return id
  }

  /**
   * 移除请求拦截器
   */
  removeRequestInterceptor(id: number): void {
    const index = this.requestInterceptors.findIndex(i => i.id === id)
    if (index !== -1) {
      this.requestInterceptors.splice(index, 1)
    }
  }

  /**
   * 移除响应拦截器
   */
  removeResponseInterceptor(id: number): void {
    const index = this.responseInterceptors.findIndex(i => i.id === id)
    if (index !== -1) {
      this.responseInterceptors.splice(index, 1)
    }
  }

  /**
   * 创建取消令牌
   */
  createCancelToken(): CancelToken {
    let cancel: (reason?: string) => void
    let isCancelled = false
    let cancelReason: string | undefined

    const promise = new Promise<string>(resolve => {
      cancel = (reason?: string) => {
        isCancelled = true
        cancelReason = reason
        resolve(reason || 'Request cancelled')
      }
    })

    return {
      promise,
      cancel: cancel!,
      get isCancelled() {
        return isCancelled
      },
      get reason() {
        return cancelReason
      },
    }
  }

  /**
   * 取消请求
   */
  cancelRequest(requestId: string, reason?: string): void {
    const controller = this.pendingRequests.get(requestId)
    if (controller) {
      controller.abort()
      this.pendingRequests.delete(requestId)
    }
  }

  /**
   * 取消所有请求
   */
  cancelAllRequests(reason?: string): void {
    this.pendingRequests.forEach((controller, requestId) => {
      controller.abort()
    })
    this.pendingRequests.clear()
  }

  /**
   * 获取默认配置
   */
  getDefaults(): RequestConfig {
    return { ...this.defaults }
  }

  /**
   * 设置默认配置
   */
  setDefaults(config: Partial<RequestConfig>): void {
    this.defaults = this.mergeConfig(this.defaults, config)
  }

  /**
   * 执行请求拦截器链
   */
  private async executeRequestInterceptors(config: RequestConfig): Promise<RequestConfig> {
    let processedConfig = config

    for (const interceptor of this.requestInterceptors) {
      // 检查是否应该运行
      if (interceptor.config?.runWhen && !interceptor.config.runWhen(processedConfig)) {
        continue
      }

      try {
        processedConfig = await interceptor.handler(processedConfig)
      } catch (error) {
        console.error('Request interceptor error:', error)
        throw error
      }
    }

    return processedConfig
  }

  /**
   * 执行响应拦截器链
   */
  private async executeResponseInterceptors<T>(response: ApiResponse<T>): Promise<ApiResponse<T>> {
    let processedResponse = response

    for (const interceptor of this.responseInterceptors) {
      try {
        processedResponse = await interceptor.handler.fulfilled(processedResponse)
      } catch (error) {
        console.error('Response interceptor error:', error)
        throw error
      }
    }

    return processedResponse
  }

  /**
   * 执行错误拦截器链
   */
  private async executeErrorInterceptors(error: any): Promise<any> {
    let processedError = error

    for (const interceptor of this.responseInterceptors) {
      if (interceptor.handler.rejected) {
        try {
          processedError = await interceptor.handler.rejected(processedError)
        } catch (err) {
          processedError = err
        }
      }
    }

    return processedError
  }

  /**
   * 合并配置
   */
  private mergeConfig(defaults: RequestConfig, config: RequestConfig): RequestConfig {
    return {
      ...defaults,
      ...config,
      headers: {
        ...defaults.headers,
        ...config.headers,
      },
      params: {
        ...defaults.params,
        ...config.params,
      },
    }
  }

  /**
   * 构建完整URL
   */
  private buildURL(url: string, params?: Record<string, any>): string {
    // 如果URL不是完整的URL（不包含协议），则添加baseURL
    let fullURL = url
    if (this.baseURL && !url.startsWith('http://') && !url.startsWith('https://')) {
      fullURL = this.baseURL + (url.startsWith('/') ? url : '/' + url)
    }

    if (!params || Object.keys(params).length === 0) {
      return fullURL
    }

    const queryString = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join('&')

    return fullURL + (fullURL.includes('?') ? '&' : '?') + queryString
  }

  /**
   * 序列化请求数据
   */
  private serializeData(data: any, headers?: Record<string, string>): BodyInit | undefined {
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
   * 解析响应数据
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
        // 根据Content-Type自动判断
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

  /**
   * 判断是否应该重试
   */
  private shouldRetry(config: RequestConfig, error: any, retryCount: number): boolean {
    if (!config.retry) return false
    if (retryCount >= config.retry.times) return false

    // 自定义重试条件
    if (config.retry.shouldRetry) {
      return config.retry.shouldRetry(error)
    }

    // 默认重试条件: 网络错误或5xx错误
    if (error.isNetworkError) return true
    if (error.status && error.status >= 500) return true

    // 检查可重试的状态码
    if (config.retry.retryableStatuses) {
      return config.retry.retryableStatuses.includes(error.status)
    }

    return false
  }

  /**
   * 获取重试延迟
   */
  private getRetryDelay(config: RequestConfig, retryCount: number): number {
    if (!config.retry) return 0

    const baseDelay = config.retry.delay

    if (config.retry.backoff === 'exponential') {
      return baseDelay * Math.pow(2, retryCount - 1)
    }

    return baseDelay * retryCount
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 生成请求ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 创建API错误
   */
  private createApiError(error: any, config: RequestConfig): ApiError {
    const apiError = new Error(error.message || 'Request failed') as ApiError
    apiError.code = error.code || 'UNKNOWN_ERROR'
    apiError.status = error.status
    apiError.response = error.response
    apiError.config = config
    apiError.isNetworkError = !error.response
    apiError.isTimeoutError = error.name === 'TimeoutError'
    apiError.isCancelError = error.name === 'AbortError'
    return apiError
  }

  /**
   * 创建取消错误
   */
  private createCancelError(requestId: string): ApiError {
    const error = new Error('Request cancelled') as ApiError
    error.code = 'CANCELLED'
    error.isNetworkError = false
    error.isTimeoutError = false
    error.isCancelError = true
    return error
  }

  /**
   * 从缓存获取
   */
  private async getFromCache<T>(config: RequestConfig): Promise<ApiResponse<T> | null> {
    // 缓存实现将在6.4中完成
    return null
  }

  /**
   * 保存到缓存
   */
  private async saveToCache<T>(config: RequestConfig, response: ApiResponse<T>): Promise<void> {
    // 缓存实现将在6.4中完成
  }
}

/**
 * API客户端工厂
 */
export class ApiClientFactory {
  /**
   * 创建API客户端实例
   */
  static create(config?: RequestConfig): IApiClient {
    return new ApiClient(config)
  }

  /**
   * 创建带基础URL的客户端
   */
  static createWithBaseURL(baseURL: string, config?: RequestConfig): IApiClient {
    return new ApiClient({
      ...config,
      url: baseURL,
    })
  }
}
