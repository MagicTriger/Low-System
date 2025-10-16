import { ref, reactive, computed, inject, provide, InjectionKey } from 'vue'

// 依赖注入接口
export interface ServiceDescriptor {
  id: string
  name: string
  factory: ServiceFactory
  dependencies: string[]
  singleton: boolean
  lazy: boolean
  scope: 'global' | 'component' | 'request'
  metadata?: Record<string, any>
}

export interface ServiceFactory {
  (...dependencies: any[]): any | Promise<any>
}

export interface ServiceInstance {
  id: string
  instance: any
  created: number
  accessed: number
  scope: string
  dependencies: string[]
}

export interface ServiceConfig {
  autoRegister: boolean
  enableCircularDetection: boolean
  enableLifecycleHooks: boolean
  maxResolutionDepth: number
  cacheInstances: boolean
}

export interface LifecycleHooks {
  onBeforeCreate?: (descriptor: ServiceDescriptor) => void | Promise<void>
  onAfterCreate?: (instance: any, descriptor: ServiceDescriptor) => void | Promise<void>
  onBeforeDestroy?: (instance: any, descriptor: ServiceDescriptor) => void | Promise<void>
  onAfterDestroy?: (descriptor: ServiceDescriptor) => void | Promise<void>
}

export interface ResolutionContext {
  requestId: string
  stack: string[]
  depth: number
  timestamp: number
  scope: string
}

// 依赖注入容器类
export class DIContainer {
  private services: Map<string, ServiceDescriptor> = new Map()
  private instances: Map<string, ServiceInstance> = new Map()
  private singletons: Map<string, any> = new Map()
  private scoped: Map<string, Map<string, any>> = new Map()
  private config: ServiceConfig
  private hooks: LifecycleHooks = {}
  private resolutionStack: string[] = []

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = {
      autoRegister: true,
      enableCircularDetection: true,
      enableLifecycleHooks: true,
      maxResolutionDepth: 10,
      cacheInstances: true,
      ...config
    }
  }

  // 服务注册
  register<T = any>(descriptor: ServiceDescriptor): void {
    // 验证服务描述符
    this.validateDescriptor(descriptor)

    // 检查循环依赖
    if (this.config.enableCircularDetection) {
      this.detectCircularDependencies(descriptor)
    }

    this.services.set(descriptor.id, descriptor)
  }

  // 批量注册
  registerMany(descriptors: ServiceDescriptor[]): void {
    descriptors.forEach(descriptor => this.register(descriptor))
  }

  // 注册单例
  registerSingleton<T = any>(
    id: string,
    factory: ServiceFactory,
    dependencies: string[] = []
  ): void {
    this.register({
      id,
      name: id,
      factory,
      dependencies,
      singleton: true,
      lazy: false,
      scope: 'global'
    })
  }

  // 注册瞬态服务
  registerTransient<T = any>(
    id: string,
    factory: ServiceFactory,
    dependencies: string[] = []
  ): void {
    this.register({
      id,
      name: id,
      factory,
      dependencies,
      singleton: false,
      lazy: true,
      scope: 'request'
    })
  }

  // 注册实例
  registerInstance<T = any>(id: string, instance: T): void {
    this.singletons.set(id, instance)
    
    this.register({
      id,
      name: id,
      factory: () => instance,
      dependencies: [],
      singleton: true,
      lazy: false,
      scope: 'global'
    })
  }

  // 服务解析
  async resolve<T = any>(id: string, context?: Partial<ResolutionContext>): Promise<T> {
    const resolutionContext: ResolutionContext = {
      requestId: this.generateRequestId(),
      stack: [...this.resolutionStack],
      depth: this.resolutionStack.length,
      timestamp: Date.now(),
      scope: 'global',
      ...context
    }

    // 检查解析深度
    if (resolutionContext.depth >= this.config.maxResolutionDepth) {
      throw new Error(`Maximum resolution depth (${this.config.maxResolutionDepth}) exceeded`)
    }

    // 检查循环依赖
    if (this.config.enableCircularDetection && resolutionContext.stack.includes(id)) {
      throw new Error(`Circular dependency detected: ${resolutionContext.stack.join(' -> ')} -> ${id}`)
    }

    try {
      this.resolutionStack.push(id)
      return await this.resolveService<T>(id, resolutionContext)
    } finally {
      this.resolutionStack.pop()
    }
  }

  // 批量解析
  async resolveMany<T = any>(ids: string[]): Promise<T[]> {
    const promises = ids.map(id => this.resolve<T>(id))
    return Promise.all(promises)
  }

  // 尝试解析（不抛出异常）
  async tryResolve<T = any>(id: string): Promise<T | null> {
    try {
      return await this.resolve<T>(id)
    } catch {
      return null
    }
  }

  // 检查服务是否已注册
  isRegistered(id: string): boolean {
    return this.services.has(id)
  }

  // 获取服务描述符
  getDescriptor(id: string): ServiceDescriptor | undefined {
    return this.services.get(id)
  }

  // 获取所有服务
  getAllServices(): ServiceDescriptor[] {
    return Array.from(this.services.values())
  }

  // 获取服务依赖图
  getDependencyGraph(): Record<string, string[]> {
    const graph: Record<string, string[]> = {}
    
    for (const [id, descriptor] of this.services) {
      graph[id] = descriptor.dependencies
    }
    
    return graph
  }

  // 获取服务统计信息
  getStats(): {
    totalServices: number
    singletons: number
    transients: number
    instances: number
    resolutions: number
  } {
    const services = Array.from(this.services.values())
    
    return {
      totalServices: services.length,
      singletons: services.filter(s => s.singleton).length,
      transients: services.filter(s => !s.singleton).length,
      instances: this.instances.size,
      resolutions: Array.from(this.instances.values())
        .reduce((sum, instance) => sum + (instance.accessed || 0), 0)
    }
  }

  // 生命周期钩子管理
  setLifecycleHooks(hooks: LifecycleHooks): void {
    this.hooks = { ...this.hooks, ...hooks }
  }

  // 作用域管理
  createScope(scopeId: string): void {
    if (!this.scoped.has(scopeId)) {
      this.scoped.set(scopeId, new Map())
    }
  }

  destroyScope(scopeId: string): void {
    const scope = this.scoped.get(scopeId)
    if (scope) {
      // 销毁作用域内的所有实例
      for (const [serviceId, instance] of scope) {
        this.destroyInstance(serviceId, instance)
      }
      this.scoped.delete(scopeId)
    }
  }

  // 清理容器
  clear(): void {
    // 销毁所有实例
    for (const [id, instance] of this.instances) {
      this.destroyInstance(id, instance.instance)
    }

    this.services.clear()
    this.instances.clear()
    this.singletons.clear()
    this.scoped.clear()
    this.resolutionStack = []
  }

  // 配置管理
  updateConfig(config: Partial<ServiceConfig>): void {
    Object.assign(this.config, config)
  }

  getConfig(): ServiceConfig {
    return { ...this.config }
  }

  // 导出配置
  exportConfig(): {
    services: ServiceDescriptor[]
    config: ServiceConfig
  } {
    return {
      services: this.getAllServices(),
      config: this.getConfig()
    }
  }

  // 导入配置
  importConfig(data: {
    services?: ServiceDescriptor[]
    config?: Partial<ServiceConfig>
  }): void {
    if (data.config) {
      this.updateConfig(data.config)
    }
    
    if (data.services) {
      this.clear()
      data.services.forEach(service => this.register(service))
    }
  }

  // 私有方法
  private async resolveService<T>(id: string, context: ResolutionContext): Promise<T> {
    // 检查是否已有实例
    const existingInstance = this.getInstance<T>(id, context.scope)
    if (existingInstance !== null) {
      this.updateInstanceAccess(id)
      return existingInstance
    }

    // 获取服务描述符
    const descriptor = this.services.get(id)
    if (!descriptor) {
      throw new Error(`Service '${id}' is not registered`)
    }

    // 执行生命周期钩子
    if (this.config.enableLifecycleHooks && this.hooks.onBeforeCreate) {
      await this.hooks.onBeforeCreate(descriptor)
    }

    // 解析依赖
    const dependencies = await this.resolveDependencies(descriptor.dependencies, context)

    // 创建实例
    const instance = await descriptor.factory(...dependencies)

    // 执行生命周期钩子
    if (this.config.enableLifecycleHooks && this.hooks.onAfterCreate) {
      await this.hooks.onAfterCreate(instance, descriptor)
    }

    // 缓存实例
    this.cacheInstance(id, instance, descriptor, context.scope)

    return instance
  }

  private async resolveDependencies(
    dependencies: string[], 
    context: ResolutionContext
  ): Promise<any[]> {
    const resolved: any[] = []
    
    for (const depId of dependencies) {
      const dependency = await this.resolve(depId, {
        ...context,
        depth: context.depth + 1
      })
      resolved.push(dependency)
    }
    
    return resolved
  }

  private getInstance<T>(id: string, scope: string): T | null {
    // 检查单例
    if (this.singletons.has(id)) {
      return this.singletons.get(id)
    }

    // 检查作用域实例
    const scopedInstances = this.scoped.get(scope)
    if (scopedInstances && scopedInstances.has(id)) {
      return scopedInstances.get(id)
    }

    return null
  }

  private cacheInstance(
    id: string, 
    instance: any, 
    descriptor: ServiceDescriptor, 
    scope: string
  ): void {
    if (!this.config.cacheInstances) return

    const serviceInstance: ServiceInstance = {
      id,
      instance,
      created: Date.now(),
      accessed: Date.now(),
      scope,
      dependencies: descriptor.dependencies
    }

    this.instances.set(id, serviceInstance)

    if (descriptor.singleton) {
      this.singletons.set(id, instance)
    } else if (descriptor.scope === 'component' || descriptor.scope === 'request') {
      if (!this.scoped.has(scope)) {
        this.scoped.set(scope, new Map())
      }
      this.scoped.get(scope)!.set(id, instance)
    }
  }

  private updateInstanceAccess(id: string): void {
    const instance = this.instances.get(id)
    if (instance) {
      instance.accessed = Date.now()
    }
  }

  private destroyInstance(id: string, instance: any): void {
    const descriptor = this.services.get(id)
    
    if (this.config.enableLifecycleHooks && this.hooks.onBeforeDestroy && descriptor) {
      this.hooks.onBeforeDestroy(instance, descriptor)
    }

    // 如果实例有 dispose 方法，调用它
    if (instance && typeof instance.dispose === 'function') {
      instance.dispose()
    }

    if (this.config.enableLifecycleHooks && this.hooks.onAfterDestroy && descriptor) {
      this.hooks.onAfterDestroy(descriptor)
    }
  }

  private validateDescriptor(descriptor: ServiceDescriptor): void {
    if (!descriptor.id) {
      throw new Error('Service descriptor must have an id')
    }
    
    if (!descriptor.factory) {
      throw new Error('Service descriptor must have a factory function')
    }
    
    if (!Array.isArray(descriptor.dependencies)) {
      throw new Error('Service descriptor dependencies must be an array')
    }
  }

  private detectCircularDependencies(descriptor: ServiceDescriptor): void {
    const visited = new Set<string>()
    const stack = new Set<string>()

    const visit = (id: string): void => {
      if (stack.has(id)) {
        throw new Error(`Circular dependency detected involving service '${id}'`)
      }
      
      if (visited.has(id)) return

      visited.add(id)
      stack.add(id)

      const service = this.services.get(id)
      if (service) {
        service.dependencies.forEach(depId => visit(depId))
      }

      stack.delete(id)
    }

    visit(descriptor.id)
  }

  private generateRequestId(): string {
    return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

// 默认配置
export const defaultDIConfig: ServiceConfig = {
  autoRegister: true,
  enableCircularDetection: true,
  enableLifecycleHooks: true,
  maxResolutionDepth: 10,
  cacheInstances: true
}

// 全局容器实例
export const globalContainer = new DIContainer(defaultDIConfig)

// 注入键
export const DIContainerKey: InjectionKey<DIContainer> = Symbol('DIContainer')

// 工具函数
export const createContainer = (config?: Partial<ServiceConfig>) => {
  return new DIContainer(config)
}

export const createService = (
  id: string,
  factory: ServiceFactory,
  options: Partial<Omit<ServiceDescriptor, 'id' | 'factory'>> = {}
): ServiceDescriptor => ({
  id,
  name: options.name || id,
  factory,
  dependencies: options.dependencies || [],
  singleton: options.singleton || false,
  lazy: options.lazy || true,
  scope: options.scope || 'global',
  metadata: options.metadata
})

// 装饰器工厂
export const Injectable = (options: {
  id?: string
  singleton?: boolean
  dependencies?: string[]
  scope?: ServiceDescriptor['scope']
} = {}) => {
  return function <T extends new (...args: any[]) => any>(constructor: T) {
    const id = options.id || constructor.name
    
    globalContainer.register({
      id,
      name: constructor.name,
      factory: (...deps) => new constructor(...deps),
      dependencies: options.dependencies || [],
      singleton: options.singleton || false,
      lazy: true,
      scope: options.scope || 'global'
    })

    return constructor
  }
}

export const Inject = (serviceId: string) => {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // 这里可以添加参数注入的元数据
    // 实际实现需要配合反射库如 reflect-metadata
  }
}

// Vue 组合式 API 钩子
export const useDI = (container?: DIContainer) => {
  const diContainer = container || inject(DIContainerKey) || globalContainer

  const resolve = async <T = any>(id: string) => {
    return diContainer.resolve<T>(id)
  }

  const register = (descriptor: ServiceDescriptor) => {
    diContainer.register(descriptor)
  }

  const registerSingleton = <T = any>(
    id: string,
    factory: ServiceFactory,
    dependencies: string[] = []
  ) => {
    diContainer.registerSingleton<T>(id, factory, dependencies)
  }

  const registerTransient = <T = any>(
    id: string,
    factory: ServiceFactory,
    dependencies: string[] = []
  ) => {
    diContainer.registerTransient<T>(id, factory, dependencies)
  }

  const registerInstance = <T = any>(id: string, instance: T) => {
    diContainer.registerInstance(id, instance)
  }

  return {
    container: diContainer,
    resolve,
    register,
    registerSingleton,
    registerTransient,
    registerInstance,
    
    // 便捷方法
    isRegistered: (id: string) => diContainer.isRegistered(id),
    getStats: () => diContainer.getStats(),
    createScope: (scopeId: string) => diContainer.createScope(scopeId),
    destroyScope: (scopeId: string) => diContainer.destroyScope(scopeId)
  }
}

// 提供容器的组合式函数
export const provideDI = (container?: DIContainer) => {
  const diContainer = container || globalContainer
  provide(DIContainerKey, diContainer)
  return diContainer
}

// 常用服务工厂
export const serviceFactories = {
  // HTTP 客户端服务
  httpClient: (baseURL: string, timeout = 10000) => 
    createService('httpClient', () => ({
      baseURL,
      timeout,
      get: async (url: string) => { /* 实现 */ },
      post: async (url: string, data: any) => { /* 实现 */ },
      put: async (url: string, data: any) => { /* 实现 */ },
      delete: async (url: string) => { /* 实现 */ }
    }), { singleton: true }),

  // 日志服务
  logger: (level = 'info') =>
    createService('logger', () => ({
      level,
      info: (message: string, ...args: any[]) => console.log(message, ...args),
      warn: (message: string, ...args: any[]) => console.warn(message, ...args),
      error: (message: string, ...args: any[]) => console.error(message, ...args),
      debug: (message: string, ...args: any[]) => console.debug(message, ...args)
    }), { singleton: true }),

  // 配置服务
  config: (initialConfig: Record<string, any> = {}) =>
    createService('config', () => ({
      data: reactive(initialConfig),
      get: (key: string) => initialConfig[key],
      set: (key: string, value: any) => { initialConfig[key] = value },
      has: (key: string) => key in initialConfig,
      merge: (config: Record<string, any>) => Object.assign(initialConfig, config)
    }), { singleton: true }),

  // 事件总线服务
  eventBus: () =>
    createService('eventBus', () => {
      const listeners = new Map<string, Function[]>()
      
      return {
        on: (event: string, callback: Function) => {
          if (!listeners.has(event)) {
            listeners.set(event, [])
          }
          listeners.get(event)!.push(callback)
        },
        off: (event: string, callback: Function) => {
          const eventListeners = listeners.get(event)
          if (eventListeners) {
            const index = eventListeners.indexOf(callback)
            if (index > -1) {
              eventListeners.splice(index, 1)
            }
          }
        },
        emit: (event: string, ...args: any[]) => {
          const eventListeners = listeners.get(event)
          if (eventListeners) {
            eventListeners.forEach(callback => callback(...args))
          }
        }
      }
    }, { singleton: true }),

  // 存储服务
  storage: (type: 'localStorage' | 'sessionStorage' = 'localStorage') =>
    createService('storage', () => {
      const storage = type === 'localStorage' ? localStorage : sessionStorage
      
      return {
        get: (key: string) => {
          try {
            const value = storage.getItem(key)
            return value ? JSON.parse(value) : null
          } catch {
            return storage.getItem(key)
          }
        },
        set: (key: string, value: any) => {
          storage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value))
        },
        remove: (key: string) => storage.removeItem(key),
        clear: () => storage.clear(),
        keys: () => Object.keys(storage)
      }
    }, { singleton: true })
}

// 预定义服务注册
export const registerCommonServices = (container: DIContainer = globalContainer) => {
  // 注册常用服务
  container.register(serviceFactories.logger())
  container.register(serviceFactories.config())
  container.register(serviceFactories.eventBus())
  container.register(serviceFactories.storage())
  
  // 注册 HTTP 客户端（需要配置）
  container.register(serviceFactories.httpClient('/api'))
}