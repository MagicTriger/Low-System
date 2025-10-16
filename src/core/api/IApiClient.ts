/**
 * API客户端核心接口定义
 *
 * 提供统一的API调用接口,支持多种协议和适配器
 * 符合需求 8.1, 8.2, 8.3, 8.4, 8.5
 */

/**
 * 请求配置接口
 */
export interface RequestConfig {
  /** 请求URL */
  url?: string
  /** HTTP方法 */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'
  /** 请求头 */
  headers?: Record<string, string>
  /** URL查询参数 */
  params?: Record<string, any>
  /** 请求体数据 */
  data?: any
  /** 请求超时时间(毫秒) */
  timeout?: number
  /** 响应类型 */
  responseType?: 'json' | 'text' | 'blob' | 'arraybuffer' | 'document'
  /** 是否携带凭证 */
  withCredentials?: boolean
  /** 重试配置 */
  retry?: RetryConfig
  /** 缓存配置 */
  cache?: CacheConfig
  /** 请求取消令牌 */
  cancelToken?: CancelToken
  /** 上传进度回调 */
  onUploadProgress?: (progress: ProgressEvent) => void
  /** 下载进度回调 */
  onDownloadProgress?: (progress: ProgressEvent) => void
  /** 自定义元数据 */
  metadata?: Record<string, any>
}

/**
 * 重试配置
 */
export interface RetryConfig {
  /** 重试次数 */
  times: number
  /** 重试延迟(毫秒) */
  delay: number
  /** 退避策略 */
  backoff?: 'linear' | 'exponential'
  /** 可重试的HTTP状态码 */
  retryableStatuses?: number[]
  /** 重试条件判断函数 */
  shouldRetry?: (error: any) => boolean
}

/**
 * 缓存配置
 */
export interface CacheConfig {
  /** 是否启用缓存 */
  enabled: boolean
  /** 缓存过期时间(毫秒) */
  ttl: number
  /** 缓存键(默认使用URL+参数) */
  key?: string
  /** 缓存策略 */
  strategy?: 'memory' | 'localStorage' | 'sessionStorage'
  /** 是否强制刷新 */
  forceRefresh?: boolean
}

/**
 * API响应接口
 */
export interface ApiResponse<T = any> {
  /** 响应数据 */
  data: T
  /** HTTP状态码 */
  status: number
  /** 状态文本 */
  statusText: string
  /** 响应头 */
  headers: Record<string, string>
  /** 请求配置 */
  config: RequestConfig
  /** 请求ID */
  requestId?: string
}

/**
 * API错误接口
 */
export interface ApiError extends Error {
  /** 错误代码 */
  code: string
  /** HTTP状态码 */
  status?: number
  /** 响应数据 */
  response?: ApiResponse
  /** 请求配置 */
  config?: RequestConfig
  /** 是否为网络错误 */
  isNetworkError: boolean
  /** 是否为超时错误 */
  isTimeoutError: boolean
  /** 是否为取消错误 */
  isCancelError: boolean
}

/**
 * 请求拦截器
 */
export type RequestInterceptor = (config: RequestConfig) => RequestConfig | Promise<RequestConfig>

/**
 * 响应拦截器
 */
export type ResponseInterceptor = (response: ApiResponse) => ApiResponse | Promise<ApiResponse>

/**
 * 错误拦截器
 */
export type ErrorInterceptor = (error: ApiError) => any

/**
 * 拦截器配置
 */
export interface InterceptorConfig {
  /** 拦截器优先级(数字越大优先级越高) */
  priority?: number
  /** 是否同步执行 */
  synchronous?: boolean
  /** 是否在错误时继续执行 */
  runWhen?: (config: RequestConfig) => boolean
}

/**
 * 取消令牌接口
 */
export interface CancelToken {
  /** 取消原因 */
  reason?: string
  /** 取消Promise */
  promise: Promise<string>
  /** 取消函数 */
  cancel: (reason?: string) => void
  /** 是否已取消 */
  isCancelled: boolean
}

/**
 * API客户端接口
 */
export interface IApiClient {
  /**
   * 发送GET请求
   */
  get<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 发送POST请求
   */
  post<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 发送PUT请求
   */
  put<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 发送DELETE请求
   */
  delete<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 发送PATCH请求
   */
  patch<T = any>(url: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 发送HEAD请求
   */
  head<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 发送OPTIONS请求
   */
  options<T = any>(url: string, config?: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 通用请求方法
   */
  request<T = any>(config: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 添加请求拦截器
   */
  addRequestInterceptor(interceptor: RequestInterceptor, config?: InterceptorConfig): number

  /**
   * 添加响应拦截器
   */
  addResponseInterceptor(interceptor: ResponseInterceptor, errorInterceptor?: ErrorInterceptor, config?: InterceptorConfig): number

  /**
   * 移除请求拦截器
   */
  removeRequestInterceptor(id: number): void

  /**
   * 移除响应拦截器
   */
  removeResponseInterceptor(id: number): void

  /**
   * 创建取消令牌
   */
  createCancelToken(): CancelToken

  /**
   * 取消请求
   */
  cancelRequest(requestId: string, reason?: string): void

  /**
   * 取消所有请求
   */
  cancelAllRequests(reason?: string): void

  /**
   * 获取默认配置
   */
  getDefaults(): RequestConfig

  /**
   * 设置默认配置
   */
  setDefaults(config: Partial<RequestConfig>): void
}

/**
 * API客户端工厂接口
 */
export interface IApiClientFactory {
  /**
   * 创建API客户端实例
   */
  create(config?: RequestConfig): IApiClient

  /**
   * 创建带基础URL的客户端
   */
  createWithBaseURL(baseURL: string, config?: RequestConfig): IApiClient
}
