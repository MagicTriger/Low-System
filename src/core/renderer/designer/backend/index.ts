// 后端集成模块索引文件
export { ApiManager, createApiManager, useApiManager } from './ApiManager'
export { DIContainer, createContainer, globalContainer, useDI } from './DependencyInjection'
export { default as ConfigValueEditor } from './ConfigValueEditor.vue'

// 类型定义
export interface BackendConfig {
  api: {
    baseURL: string
    timeout: number
    retries: number
    headers: Record<string, string>
  }
  di: {
    autoRegister: boolean
    lazyLoading: boolean
    singletonByDefault: boolean
  }
  cache: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  logging: {
    enabled: boolean
    level: 'debug' | 'info' | 'warn' | 'error'
    console: boolean
    remote: boolean
  }
}

export interface ServiceConfig {
  name: string
  type: 'singleton' | 'transient' | 'scoped'
  factory?: () => any
  dependencies?: string[]
  config?: Record<string, any>
}

export interface ApiEndpointConfig {
  name: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  url: string
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  timeout?: number
  retries?: number
  cache?: boolean
  cacheTTL?: number
}

export interface BackendIntegration {
  api: ApiManager
  di: DIContainer
  config: BackendConfig
  services: Map<string, any>
  endpoints: Map<string, ApiEndpointConfig>
}

// 默认配置
export const defaultBackendConfig: BackendConfig = {
  api: {
    baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api',
    timeout: 10000,
    retries: 3,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  },
  di: {
    autoRegister: true,
    lazyLoading: true,
    singletonByDefault: true
  },
  cache: {
    enabled: true,
    ttl: 300000, // 5分钟
    maxSize: 100
  },
  logging: {
    enabled: true,
    level: 'info',
    console: true,
    remote: false
  }
}

// 预定义服务配置
export const defaultServices: ServiceConfig[] = [
  {
    name: 'httpClient',
    type: 'singleton',
    factory: () => new ApiManager(defaultBackendConfig.api)
  },
  {
    name: 'logger',
    type: 'singleton',
    factory: () => ({
      debug: (msg: string, ...args: any[]) => console.debug(`[DEBUG] ${msg}`, ...args),
      info: (msg: string, ...args: any[]) => console.info(`[INFO] ${msg}`, ...args),
      warn: (msg: string, ...args: any[]) => console.warn(`[WARN] ${msg}`, ...args),
      error: (msg: string, ...args: any[]) => console.error(`[ERROR] ${msg}`, ...args)
    })
  },
  {
    name: 'storage',
    type: 'singleton',
    factory: () => ({
      get: (key: string) => localStorage.getItem(key),
      set: (key: string, value: string) => localStorage.setItem(key, value),
      remove: (key: string) => localStorage.removeItem(key),
      clear: () => localStorage.clear()
    })
  },
  {
    name: 'cache',
    type: 'singleton',
    factory: () => {
      const cache = new Map()
      return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any, ttl?: number) => {
          cache.set(key, { value, expires: ttl ? Date.now() + ttl : null })
        },
        has: (key: string) => {
          const item = cache.get(key)
          if (!item) return false
          if (item.expires && Date.now() > item.expires) {
            cache.delete(key)
            return false
          }
          return true
        },
        delete: (key: string) => cache.delete(key),
        clear: () => cache.clear(),
        size: () => cache.size
      }
    }
  }
]

// 预定义 API 端点
export const defaultEndpoints: ApiEndpointConfig[] = [
  // 用户相关
  {
    name: 'login',
    method: 'POST',
    url: '/auth/login'
  },
  {
    name: 'logout',
    method: 'POST',
    url: '/auth/logout'
  },
  {
    name: 'getUserInfo',
    method: 'GET',
    url: '/user/info',
    cache: true,
    cacheTTL: 300000
  },
  {
    name: 'updateUserInfo',
    method: 'PUT',
    url: '/user/info'
  },
  
  // 项目相关
  {
    name: 'getProjects',
    method: 'GET',
    url: '/projects',
    cache: true,
    cacheTTL: 60000
  },
  {
    name: 'createProject',
    method: 'POST',
    url: '/projects'
  },
  {
    name: 'updateProject',
    method: 'PUT',
    url: '/projects/:id'
  },
  {
    name: 'deleteProject',
    method: 'DELETE',
    url: '/projects/:id'
  },
  {
    name: 'getProject',
    method: 'GET',
    url: '/projects/:id',
    cache: true,
    cacheTTL: 30000
  },
  
  // 页面相关
  {
    name: 'getPages',
    method: 'GET',
    url: '/projects/:projectId/pages',
    cache: true,
    cacheTTL: 30000
  },
  {
    name: 'createPage',
    method: 'POST',
    url: '/projects/:projectId/pages'
  },
  {
    name: 'updatePage',
    method: 'PUT',
    url: '/projects/:projectId/pages/:id'
  },
  {
    name: 'deletePage',
    method: 'DELETE',
    url: '/projects/:projectId/pages/:id'
  },
  {
    name: 'getPage',
    method: 'GET',
    url: '/projects/:projectId/pages/:id',
    cache: true,
    cacheTTL: 30000
  },
  
  // 组件相关
  {
    name: 'getComponents',
    method: 'GET',
    url: '/components',
    cache: true,
    cacheTTL: 300000
  },
  {
    name: 'createComponent',
    method: 'POST',
    url: '/components'
  },
  {
    name: 'updateComponent',
    method: 'PUT',
    url: '/components/:id'
  },
  {
    name: 'deleteComponent',
    method: 'DELETE',
    url: '/components/:id'
  },
  
  // 资源相关
  {
    name: 'uploadFile',
    method: 'POST',
    url: '/upload',
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  },
  {
    name: 'getFiles',
    method: 'GET',
    url: '/files',
    cache: true,
    cacheTTL: 60000
  },
  {
    name: 'deleteFile',
    method: 'DELETE',
    url: '/files/:id'
  }
]

// 后端集成管理器
export class BackendIntegrationManager {
  private config: BackendConfig
  private api: ApiManager
  private di: DIContainer
  private services: Map<string, any>
  private endpoints: Map<string, ApiEndpointConfig>
  private initialized: boolean = false

  constructor(config: Partial<BackendConfig> = {}) {
    this.config = { ...defaultBackendConfig, ...config }
    this.api = new ApiManager(this.config.api)
    this.di = createContainer()
    this.services = new Map()
    this.endpoints = new Map()
  }

  // 初始化
  async initialize(): Promise<void> {
    if (this.initialized) return

    try {
      // 注册默认服务
      await this.registerServices(defaultServices)
      
      // 注册默认端点
      this.registerEndpoints(defaultEndpoints)
      
      // 设置 API 拦截器
      this.setupApiInterceptors()
      
      this.initialized = true
      this.log('info', 'Backend integration initialized successfully')
    } catch (error) {
      this.log('error', 'Failed to initialize backend integration:', error)
      throw error
    }
  }

  // 注册服务
  async registerServices(services: ServiceConfig[]): Promise<void> {
    for (const service of services) {
      try {
        if (service.factory) {
          this.di.register(service.name, service.factory, service.type)
        }
        this.services.set(service.name, service)
        this.log('debug', `Service registered: ${service.name}`)
      } catch (error) {
        this.log('error', `Failed to register service ${service.name}:`, error)
      }
    }
  }

  // 注册端点
  registerEndpoints(endpoints: ApiEndpointConfig[]): void {
    for (const endpoint of endpoints) {
      this.endpoints.set(endpoint.name, endpoint)
      this.api.addEndpoint(endpoint.name, {
        method: endpoint.method,
        url: endpoint.url,
        headers: endpoint.headers,
        timeout: endpoint.timeout,
        retries: endpoint.retries
      })
      this.log('debug', `Endpoint registered: ${endpoint.name}`)
    }
  }

  // 设置 API 拦截器
  private setupApiInterceptors(): void {
    // 请求拦截器 - 添加认证头
    this.api.addRequestInterceptor((config) => {
      const token = this.getService('storage')?.get('auth_token')
      if (token) {
        config.headers = {
          ...config.headers,
          'Authorization': `Bearer ${token}`
        }
      }
      return config
    })

    // 请求拦截器 - 日志记录
    this.api.addRequestInterceptor((config) => {
      this.log('debug', `API Request: ${config.method?.toUpperCase()} ${config.url}`)
      return config
    })

    // 响应拦截器 - 错误处理
    this.api.addResponseInterceptor(
      (response) => {
        this.log('debug', `API Response: ${response.status} ${response.config.url}`)
        return response
      },
      (error) => {
        this.log('error', `API Error: ${error.message}`, error)
        
        // 处理认证错误
        if (error.response?.status === 401) {
          this.getService('storage')?.remove('auth_token')
          // 可以触发登录页面跳转
        }
        
        return Promise.reject(error)
      }
    )
  }

  // 获取服务
  getService<T = any>(name: string): T | null {
    try {
      return this.di.resolve<T>(name)
    } catch (error) {
      this.log('error', `Failed to resolve service ${name}:`, error)
      return null
    }
  }

  // 调用 API
  async callApi(endpointName: string, params?: Record<string, any>, data?: any): Promise<any> {
    const endpoint = this.endpoints.get(endpointName)
    if (!endpoint) {
      throw new Error(`Endpoint not found: ${endpointName}`)
    }

    try {
      let url = endpoint.url
      
      // 替换 URL 参数
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          url = url.replace(`:${key}`, String(value))
        }
      }

      const response = await this.api.request({
        method: endpoint.method,
        url,
        data,
        headers: endpoint.headers,
        timeout: endpoint.timeout
      })

      return response.data
    } catch (error) {
      this.log('error', `API call failed for ${endpointName}:`, error)
      throw error
    }
  }

  // 批量调用 API
  async callApiBatch(calls: Array<{
    endpoint: string
    params?: Record<string, any>
    data?: any
  }>): Promise<any[]> {
    const promises = calls.map(call => 
      this.callApi(call.endpoint, call.params, call.data)
    )
    
    return Promise.all(promises)
  }

  // 获取配置
  getConfig(): BackendConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(config: Partial<BackendConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 更新 API 配置
    if (config.api) {
      this.api.updateConfig(config.api)
    }
  }

  // 健康检查
  async healthCheck(): Promise<{
    api: boolean
    services: Record<string, boolean>
    endpoints: Record<string, boolean>
  }> {
    const result = {
      api: false,
      services: {} as Record<string, boolean>,
      endpoints: {} as Record<string, boolean>
    }

    // 检查 API 连接
    try {
      await this.api.healthCheck()
      result.api = true
    } catch (error) {
      this.log('warn', 'API health check failed:', error)
    }

    // 检查服务
    for (const [name] of this.services) {
      try {
        const service = this.getService(name)
        result.services[name] = service !== null
      } catch (error) {
        result.services[name] = false
      }
    }

    // 检查端点（简单的配置检查）
    for (const [name, endpoint] of this.endpoints) {
      result.endpoints[name] = !!(endpoint.method && endpoint.url)
    }

    return result
  }

  // 导出配置
  exportConfig(): {
    config: BackendConfig
    services: ServiceConfig[]
    endpoints: ApiEndpointConfig[]
  } {
    return {
      config: this.getConfig(),
      services: Array.from(this.services.values()),
      endpoints: Array.from(this.endpoints.values())
    }
  }

  // 导入配置
  async importConfig(data: {
    config?: Partial<BackendConfig>
    services?: ServiceConfig[]
    endpoints?: ApiEndpointConfig[]
  }): Promise<void> {
    if (data.config) {
      this.updateConfig(data.config)
    }

    if (data.services) {
      await this.registerServices(data.services)
    }

    if (data.endpoints) {
      this.registerEndpoints(data.endpoints)
    }
  }

  // 日志记录
  private log(level: string, message: string, ...args: any[]): void {
    if (!this.config.logging.enabled) return

    const logger = this.getService('logger')
    if (logger && typeof logger[level] === 'function') {
      logger[level](message, ...args)
    } else if (this.config.logging.console) {
      console[level as keyof Console](`[Backend] ${message}`, ...args)
    }
  }

  // 销毁
  destroy(): void {
    this.api.destroy()
    this.di.clear()
    this.services.clear()
    this.endpoints.clear()
    this.initialized = false
    this.log('info', 'Backend integration destroyed')
  }
}

// 工具函数
export function createBackendIntegration(config?: Partial<BackendConfig>): BackendIntegrationManager {
  return new BackendIntegrationManager(config)
}

export function validateBackendConfig(config: Partial<BackendConfig>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.api) {
    if (!config.api.baseURL) {
      errors.push('API baseURL is required')
    }
    
    if (config.api.timeout && config.api.timeout < 1000) {
      errors.push('API timeout should be at least 1000ms')
    }
    
    if (config.api.retries && (config.api.retries < 0 || config.api.retries > 10)) {
      errors.push('API retries should be between 0 and 10')
    }
  }

  if (config.cache) {
    if (config.cache.ttl && config.cache.ttl < 1000) {
      errors.push('Cache TTL should be at least 1000ms')
    }
    
    if (config.cache.maxSize && config.cache.maxSize < 1) {
      errors.push('Cache maxSize should be at least 1')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateServiceConfig(config: ServiceConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.name) {
    errors.push('Service name is required')
  }

  if (!['singleton', 'transient', 'scoped'].includes(config.type)) {
    errors.push('Service type must be singleton, transient, or scoped')
  }

  if (!config.factory && !config.dependencies) {
    errors.push('Service must have either factory or dependencies')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

export function validateEndpointConfig(config: ApiEndpointConfig): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!config.name) {
    errors.push('Endpoint name is required')
  }

  if (!config.method) {
    errors.push('Endpoint method is required')
  }

  if (!['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].includes(config.method)) {
    errors.push('Endpoint method must be GET, POST, PUT, DELETE, or PATCH')
  }

  if (!config.url) {
    errors.push('Endpoint URL is required')
  }

  if (config.timeout && config.timeout < 1000) {
    errors.push('Endpoint timeout should be at least 1000ms')
  }

  if (config.retries && (config.retries < 0 || config.retries > 10)) {
    errors.push('Endpoint retries should be between 0 and 10')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 全局实例
export const globalBackendIntegration = createBackendIntegration()

// Vue 组合式 API
export function useBackendIntegration() {
  return {
    backend: globalBackendIntegration,
    api: globalBackendIntegration.api,
    di: globalBackendIntegration.di,
    getService: globalBackendIntegration.getService.bind(globalBackendIntegration),
    callApi: globalBackendIntegration.callApi.bind(globalBackendIntegration),
    callApiBatch: globalBackendIntegration.callApiBatch.bind(globalBackendIntegration)
  }
}

// 初始化全局实例
globalBackendIntegration.initialize().catch(error => {
  console.error('Failed to initialize global backend integration:', error)
})