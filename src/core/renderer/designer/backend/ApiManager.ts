import { ref, reactive, computed } from 'vue'

// API 配置接口
export interface ApiConfig {
  baseURL: string
  timeout: number
  headers: Record<string, string>
  interceptors: {
    request: RequestInterceptor[]
    response: ResponseInterceptor[]
  }
  retryConfig: {
    maxRetries: number
    retryDelay: number
    retryCondition: (error: any) => boolean
  }
  cache: {
    enabled: boolean
    maxAge: number
    maxSize: number
  }
}

export interface ApiEndpoint {
  id: string
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  description?: string
  params?: Record<string, any>
  headers?: Record<string, string>
  body?: any
  timeout?: number
  cache?: boolean
  transform?: {
    request?: (data: any) => any
    response?: (data: any) => any
  }
  validation?: {
    request?: (data: any) => boolean
    response?: (data: any) => boolean
  }
}

export interface ApiRequest {
  id: string
  endpoint: string
  method: string
  url: string
  params?: Record<string, any>
  headers?: Record<string, string>
  body?: any
  timestamp: number
  status: 'pending' | 'success' | 'error' | 'cancelled'
  response?: any
  error?: string
  duration?: number
}

export interface RequestInterceptor {
  id: string
  name: string
  handler: (config: any) => any | Promise<any>
  enabled: boolean
}

export interface ResponseInterceptor {
  id: string
  name: string
  handler: (response: any) => any | Promise<any>
  errorHandler?: (error: any) => any | Promise<any>
  enabled: boolean
}

export interface CacheEntry {
  key: string
  data: any
  timestamp: number
  maxAge: number
}

// API 管理器类
export class ApiManager {
  private config: ApiConfig
  private endpoints: Map<string, ApiEndpoint> = new Map()
  private requests: Map<string, ApiRequest> = new Map()
  private cache: Map<string, CacheEntry> = new Map()
  private abortControllers: Map<string, AbortController> = new Map()

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = {
      baseURL: '',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
      interceptors: {
        request: [],
        response: [],
      },
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: error => error.status >= 500,
      },
      cache: {
        enabled: true,
        maxAge: 300000, // 5分钟
        maxSize: 100,
      },
      ...config,
    }
  }

  // 配置管理
  updateConfig(config: Partial<ApiConfig>): void {
    Object.assign(this.config, config)
  }

  getConfig(): ApiConfig {
    return { ...this.config }
  }

  // 端点管理
  registerEndpoint(endpoint: ApiEndpoint): void {
    this.endpoints.set(endpoint.id, endpoint)
  }

  unregisterEndpoint(id: string): void {
    this.endpoints.delete(id)
  }

  getEndpoint(id: string): ApiEndpoint | undefined {
    return this.endpoints.get(id)
  }

  getAllEndpoints(): ApiEndpoint[] {
    return Array.from(this.endpoints.values())
  }

  updateEndpoint(id: string, updates: Partial<ApiEndpoint>): void {
    const endpoint = this.endpoints.get(id)
    if (endpoint) {
      Object.assign(endpoint, updates)
    }
  }

  // 拦截器管理
  addRequestInterceptor(interceptor: RequestInterceptor): void {
    this.config.interceptors.request.push(interceptor)
  }

  addResponseInterceptor(interceptor: ResponseInterceptor): void {
    this.config.interceptors.response.push(interceptor)
  }

  removeRequestInterceptor(id: string): void {
    const index = this.config.interceptors.request.findIndex(i => i.id === id)
    if (index > -1) {
      this.config.interceptors.request.splice(index, 1)
    }
  }

  removeResponseInterceptor(id: string): void {
    const index = this.config.interceptors.response.findIndex(i => i.id === id)
    if (index > -1) {
      this.config.interceptors.response.splice(index, 1)
    }
  }

  // API 调用
  async request(
    endpointId: string,
    options: {
      params?: Record<string, any>
      body?: any
      headers?: Record<string, string>
      timeout?: number
      cache?: boolean
    } = {}
  ): Promise<any> {
    const endpoint = this.endpoints.get(endpointId)
    if (!endpoint) {
      throw new Error(`Endpoint '${endpointId}' not found`)
    }

    const requestId = this.generateRequestId()
    const startTime = Date.now()

    // 创建请求对象
    const apiRequest: ApiRequest = {
      id: requestId,
      endpoint: endpointId,
      method: endpoint.method,
      url: this.buildUrl(endpoint.url, options.params || endpoint.params),
      params: options.params || endpoint.params,
      headers: { ...endpoint.headers, ...options.headers },
      body: options.body || endpoint.body,
      timestamp: startTime,
      status: 'pending',
    }

    this.requests.set(requestId, apiRequest)

    try {
      // 检查缓存
      if (this.shouldUseCache(endpoint, options)) {
        const cachedData = this.getFromCache(apiRequest.url)
        if (cachedData) {
          apiRequest.status = 'success'
          apiRequest.response = cachedData
          apiRequest.duration = Date.now() - startTime
          return cachedData
        }
      }

      // 应用请求拦截器
      let requestConfig = await this.applyRequestInterceptors({
        method: endpoint.method,
        url: apiRequest.url,
        headers: { ...this.config.headers, ...apiRequest.headers },
        body: apiRequest.body,
        timeout: options.timeout || endpoint.timeout || this.config.timeout,
      })

      // 请求验证
      if (endpoint.validation?.request && !endpoint.validation.request(requestConfig.body)) {
        throw new Error('Request validation failed')
      }

      // 请求转换
      if (endpoint.transform?.request) {
        requestConfig.body = endpoint.transform.request(requestConfig.body)
      }

      // 发送请求
      const response = await this.sendRequest(requestId, requestConfig)

      // 应用响应拦截器
      let processedResponse = await this.applyResponseInterceptors(response)

      // 响应转换
      if (endpoint.transform?.response) {
        processedResponse = endpoint.transform.response(processedResponse)
      }

      // 响应验证
      if (endpoint.validation?.response && !endpoint.validation.response(processedResponse)) {
        throw new Error('Response validation failed')
      }

      // 更新请求状态
      apiRequest.status = 'success'
      apiRequest.response = processedResponse
      apiRequest.duration = Date.now() - startTime

      // 缓存响应
      if (this.shouldUseCache(endpoint, options)) {
        this.setCache(apiRequest.url, processedResponse)
      }

      return processedResponse
    } catch (error) {
      // 更新请求状态
      apiRequest.status = 'error'
      apiRequest.error = error instanceof Error ? error.message : String(error)
      apiRequest.duration = Date.now() - startTime

      // 重试逻辑
      if (this.shouldRetry(error)) {
        return this.retryRequest(endpointId, options, 1)
      }

      throw error
    } finally {
      // 清理 AbortController
      this.abortControllers.delete(requestId)
    }
  }

  // 取消请求
  cancelRequest(requestId: string): void {
    const controller = this.abortControllers.get(requestId)
    if (controller) {
      controller.abort()

      const request = this.requests.get(requestId)
      if (request) {
        request.status = 'cancelled'
      }
    }
  }

  // 取消所有请求
  cancelAllRequests(): void {
    for (const [requestId] of this.abortControllers) {
      this.cancelRequest(requestId)
    }
  }

  // 批量请求
  async batchRequest(
    requests: Array<{
      endpointId: string
      options?: any
    }>
  ): Promise<any[]> {
    const promises = requests.map(req => this.request(req.endpointId, req.options).catch(error => ({ error })))

    return Promise.all(promises)
  }

  // 并发请求
  async concurrentRequest(
    requests: Array<{
      endpointId: string
      options?: any
    }>,
    maxConcurrency = 5
  ): Promise<any[]> {
    const results: any[] = []
    const executing: Promise<any>[] = []

    for (let i = 0; i < requests.length; i++) {
      const request = requests[i]
      const promise = this.request(request.endpointId, request.options)
        .then(result => {
          results[i] = result
        })
        .catch(error => {
          results[i] = { error }
        })
        .finally(() => {
          const index = executing.indexOf(promise)
          if (index > -1) {
            executing.splice(index, 1)
          }
        })

      executing.push(promise)

      if (executing.length >= maxConcurrency) {
        await Promise.race(executing)
      }
    }

    await Promise.all(executing)
    return results
  }

  // 请求历史
  getRequestHistory(filter?: { endpoint?: string; status?: string; limit?: number }): ApiRequest[] {
    let history = Array.from(this.requests.values())

    if (filter) {
      if (filter.endpoint) {
        history = history.filter(req => req.endpoint === filter.endpoint)
      }
      if (filter.status) {
        history = history.filter(req => req.status === filter.status)
      }
      if (filter.limit) {
        history = history.slice(-filter.limit)
      }
    }

    return history.sort((a, b) => b.timestamp - a.timestamp)
  }

  // 清空请求历史
  clearRequestHistory(): void {
    this.requests.clear()
  }

  // 缓存管理
  clearCache(): void {
    this.cache.clear()
  }

  getCacheStats(): {
    size: number
    entries: number
    hitRate: number
  } {
    const entries = Array.from(this.cache.values())
    const totalSize = entries.reduce((sum, entry) => sum + JSON.stringify(entry.data).length, 0)

    // 计算缓存命中率
    const totalRequests = this.cacheHits + this.cacheMisses
    const hitRate = totalRequests > 0 ? (this.cacheHits / totalRequests) * 100 : 0

    return {
      size: totalSize,
      entries: entries.length,
      hitRate: Math.round(hitRate * 100) / 100,
    }
  }

  private cacheHits = 0
  private cacheMisses = 0

  // 健康检查
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy'
    endpoints: Array<{
      id: string
      status: 'ok' | 'error'
      responseTime?: number
      error?: string
    }>
  }> {
    const results = await Promise.allSettled(
      Array.from(this.endpoints.values()).map(async endpoint => {
        const startTime = Date.now()
        try {
          await this.request(endpoint.id)
          return {
            id: endpoint.id,
            status: 'ok' as const,
            responseTime: Date.now() - startTime,
          }
        } catch (error) {
          return {
            id: endpoint.id,
            status: 'error' as const,
            error: error instanceof Error ? error.message : String(error),
          }
        }
      })
    )

    const endpoints = results.map(result =>
      result.status === 'fulfilled'
        ? result.value
        : {
            id: 'unknown',
            status: 'error' as const,
            error: 'Health check failed',
          }
    )

    const healthyCount = endpoints.filter(ep => ep.status === 'ok').length
    const status = healthyCount > endpoints.length / 2 ? 'healthy' : 'unhealthy'

    return { status, endpoints }
  }

  // 导出配置
  exportConfig(): {
    config: ApiConfig
    endpoints: ApiEndpoint[]
  } {
    return {
      config: this.getConfig(),
      endpoints: this.getAllEndpoints(),
    }
  }

  // 导入配置
  importConfig(data: { config?: Partial<ApiConfig>; endpoints?: ApiEndpoint[] }): void {
    if (data.config) {
      this.updateConfig(data.config)
    }

    if (data.endpoints) {
      this.endpoints.clear()
      data.endpoints.forEach(endpoint => {
        this.registerEndpoint(endpoint)
      })
    }
  }

  // 私有方法
  private buildUrl(url: string, params?: Record<string, any>): string {
    let fullUrl = url.startsWith('http') ? url : `${this.config.baseURL}${url}`

    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })

      const queryString = searchParams.toString()
      if (queryString) {
        fullUrl += (fullUrl.includes('?') ? '&' : '?') + queryString
      }
    }

    return fullUrl
  }

  private async sendRequest(requestId: string, config: any): Promise<any> {
    const controller = new AbortController()
    this.abortControllers.set(requestId, controller)

    const fetchOptions: RequestInit = {
      method: config.method,
      headers: config.headers,
      signal: controller.signal,
    }

    if (config.body && config.method !== 'GET') {
      fetchOptions.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body)
    }

    // 设置超时
    const timeoutId = setTimeout(() => {
      controller.abort()
    }, config.timeout)

    try {
      const response = await fetch(config.url, fetchOptions)
      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      } else {
        return await response.text()
      }
    } catch (error) {
      clearTimeout(timeoutId)
      throw error
    }
  }

  private async applyRequestInterceptors(config: any): Promise<any> {
    let processedConfig = config

    for (const interceptor of this.config.interceptors.request) {
      if (interceptor.enabled) {
        try {
          processedConfig = await interceptor.handler(processedConfig)
        } catch (error) {
          console.error(`Request interceptor '${interceptor.name}' failed:`, error)
        }
      }
    }

    return processedConfig
  }

  private async applyResponseInterceptors(response: any): Promise<any> {
    let processedResponse = response

    for (const interceptor of this.config.interceptors.response) {
      if (interceptor.enabled) {
        try {
          processedResponse = await interceptor.handler(processedResponse)
        } catch (error) {
          console.error(`Response interceptor '${interceptor.name}' failed:`, error)

          if (interceptor.errorHandler) {
            try {
              processedResponse = await interceptor.errorHandler(error)
            } catch (handlerError) {
              console.error(`Response interceptor error handler failed:`, handlerError)
            }
          }
        }
      }
    }

    return processedResponse
  }

  private shouldUseCache(endpoint: ApiEndpoint, options: any): boolean {
    return this.config.cache.enabled && endpoint.method === 'GET' && options.cache !== false && endpoint.cache !== false
  }

  private getFromCache(key: string): any | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    const now = Date.now()
    if (now - entry.timestamp > entry.maxAge) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  private setCache(key: string, data: any): void {
    // 检查缓存大小限制
    if (this.cache.size >= this.config.cache.maxSize) {
      // 删除最旧的条目
      const oldestKey = Array.from(this.cache.keys())[0]
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      key,
      data,
      timestamp: Date.now(),
      maxAge: this.config.cache.maxAge,
    })
  }

  private shouldRetry(error: any): boolean {
    return this.config.retryConfig.retryCondition(error)
  }

  private async retryRequest(endpointId: string, options: any, attempt: number): Promise<any> {
    if (attempt > this.config.retryConfig.maxRetries) {
      throw new Error(`Max retries (${this.config.retryConfig.maxRetries}) exceeded`)
    }

    // 等待重试延迟
    await new Promise(resolve => setTimeout(resolve, this.config.retryConfig.retryDelay * attempt))

    try {
      return await this.request(endpointId, options)
    } catch (error) {
      if (this.shouldRetry(error)) {
        return this.retryRequest(endpointId, options, attempt + 1)
      }
      throw error
    }
  }

  private generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

// 默认配置
export const defaultApiConfig: ApiConfig = {
  baseURL: '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  interceptors: {
    request: [],
    response: [],
  },
  retryConfig: {
    maxRetries: 3,
    retryDelay: 1000,
    retryCondition: error => error.status >= 500,
  },
  cache: {
    enabled: true,
    maxAge: 300000,
    maxSize: 100,
  },
}

// 全局 API 管理器实例
export const globalApiManager = new ApiManager(defaultApiConfig)

// 工具函数
export const createApiManager = (config?: Partial<ApiConfig>) => {
  return new ApiManager(config)
}

export const createEndpoint = (
  id: string,
  method: ApiEndpoint['method'],
  url: string,
  options: Partial<Omit<ApiEndpoint, 'id' | 'method' | 'url'>> = {}
): ApiEndpoint => ({
  id,
  method,
  url,
  name: options.name || id,
  ...options,
})

export const createRequestInterceptor = (id: string, name: string, handler: RequestInterceptor['handler']): RequestInterceptor => ({
  id,
  name,
  handler,
  enabled: true,
})

export const createResponseInterceptor = (
  id: string,
  name: string,
  handler: ResponseInterceptor['handler'],
  errorHandler?: ResponseInterceptor['errorHandler']
): ResponseInterceptor => ({
  id,
  name,
  handler,
  errorHandler,
  enabled: true,
})

// 常用拦截器
export const commonInterceptors = {
  // 认证拦截器
  auth: (token: string) =>
    createRequestInterceptor('auth', 'Authentication', config => ({
      ...config,
      headers: {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      },
    })),

  // 日志拦截器
  logging: () => ({
    request: createRequestInterceptor('logging-request', 'Request Logging', config => {
      console.log('API Request:', config)
      return config
    }),
    response: createResponseInterceptor(
      'logging-response',
      'Response Logging',
      response => {
        console.log('API Response:', response)
        return response
      },
      error => {
        console.error('API Error:', error)
        throw error
      }
    ),
  }),

  // 错误处理拦截器
  errorHandler: () =>
    createResponseInterceptor(
      'error-handler',
      'Error Handler',
      response => response,
      error => {
        // 统一错误处理逻辑
        if (error.status === 401) {
          // 处理未授权
          console.error('Unauthorized access')
        } else if (error.status >= 500) {
          // 处理服务器错误
          console.error('Server error:', error)
        }
        throw error
      }
    ),

  // 加载状态拦截器
  loading: (setLoading: (loading: boolean) => void) => ({
    request: createRequestInterceptor('loading-request', 'Loading Start', config => {
      setLoading(true)
      return config
    }),
    response: createResponseInterceptor(
      'loading-response',
      'Loading End',
      response => {
        setLoading(false)
        return response
      },
      error => {
        setLoading(false)
        throw error
      }
    ),
  }),
}

// Vue 组合式 API 钩子
export const useApiManager = (config?: Partial<ApiConfig>) => {
  const manager = config ? new ApiManager(config) : globalApiManager
  const loading = ref(false)
  const error = ref<string | null>(null)

  const request = async (endpointId: string, options?: any) => {
    loading.value = true
    error.value = null

    try {
      const result = await manager.request(endpointId, options)
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : String(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    manager,
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    request,

    // 便捷方法
    get: (endpointId: string, params?: any) => request(endpointId, { params }),

    post: (endpointId: string, body?: any) => request(endpointId, { body }),

    put: (endpointId: string, body?: any) => request(endpointId, { body }),

    delete: (endpointId: string, params?: any) => request(endpointId, { params }),

    // 管理方法
    registerEndpoint: (endpoint: ApiEndpoint) => manager.registerEndpoint(endpoint),

    addInterceptor: (type: 'request' | 'response', interceptor: any) => {
      if (type === 'request') {
        manager.addRequestInterceptor(interceptor)
      } else {
        manager.addResponseInterceptor(interceptor)
      }
    },
  }
}
