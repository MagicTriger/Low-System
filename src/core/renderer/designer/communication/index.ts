// 组件导出
export { default as DataSourceManager } from './DataSourceManager.vue'
export { default as StateManager } from './StateManager.vue'

// 事件总线导出
export {
  EventBus,
  globalEventBus,
  useEventBus,
  EventTypes,
  createEventPayload,
  isEventType,
  filterEventsByType,
  filterEventsBySource,
  filterEventsByTimeRange,
  createEventDebugger
} from './EventBus'

// 类型定义
export interface CommunicationConfig {
  enableEventBus: boolean
  enableStateManager: boolean
  enableDataSource: boolean
  maxEventHistory: number
  maxStateHistory: number
  autoSave: boolean
  persistentStorage: boolean
}

export interface DataSourceConfig {
  type: 'api' | 'static' | 'mock' | 'localStorage'
  name: string
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  transform?: (data: any) => any
  cache?: boolean
  cacheDuration?: number
  retryCount?: number
  timeout?: number
}

export interface StateConfig {
  key: string
  name: string
  type: 'component' | 'global' | 'user' | 'system'
  defaultValue: any
  persistent: boolean
  readonly: boolean
  validation?: (value: any) => boolean
  transform?: (value: any) => any
}

export interface EventConfig {
  type: string
  source: string
  target?: string
  priority: number
  once: boolean
  async: boolean
  condition?: (payload: any) => boolean
  transform?: (payload: any) => any
}

export interface ComponentCommunication {
  id: string
  type: string
  events: {
    emit: string[]
    listen: string[]
  }
  states: {
    provide: string[]
    consume: string[]
  }
  dataBindings: {
    input: string[]
    output: string[]
  }
}

// 默认配置
export const defaultCommunicationConfig: CommunicationConfig = {
  enableEventBus: true,
  enableStateManager: true,
  enableDataSource: true,
  maxEventHistory: 1000,
  maxStateHistory: 50,
  autoSave: true,
  persistentStorage: true
}

export const defaultDataSourceConfig: Partial<DataSourceConfig> = {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  },
  cache: true,
  cacheDuration: 300000, // 5分钟
  retryCount: 3,
  timeout: 10000 // 10秒
}

export const defaultStateConfig: Partial<StateConfig> = {
  type: 'global',
  persistent: false,
  readonly: false
}

export const defaultEventConfig: Partial<EventConfig> = {
  priority: 0,
  once: false,
  async: false
}

// 通信管理器类
export class CommunicationManager {
  private config: CommunicationConfig
  private dataSources: Map<string, DataSourceConfig> = new Map()
  private states: Map<string, StateConfig> = new Map()
  private events: Map<string, EventConfig> = new Map()
  private components: Map<string, ComponentCommunication> = new Map()

  constructor(config: Partial<CommunicationConfig> = {}) {
    this.config = { ...defaultCommunicationConfig, ...config }
  }

  // 数据源管理
  registerDataSource(id: string, config: DataSourceConfig): void {
    this.dataSources.set(id, { ...defaultDataSourceConfig, ...config })
  }

  unregisterDataSource(id: string): void {
    this.dataSources.delete(id)
  }

  getDataSource(id: string): DataSourceConfig | undefined {
    return this.dataSources.get(id)
  }

  getAllDataSources(): DataSourceConfig[] {
    return Array.from(this.dataSources.values())
  }

  // 状态管理
  registerState(config: StateConfig): void {
    this.states.set(config.key, { ...defaultStateConfig, ...config })
  }

  unregisterState(key: string): void {
    this.states.delete(key)
  }

  getState(key: string): StateConfig | undefined {
    return this.states.get(key)
  }

  getAllStates(): StateConfig[] {
    return Array.from(this.states.values())
  }

  // 事件管理
  registerEvent(id: string, config: EventConfig): void {
    this.events.set(id, { ...defaultEventConfig, ...config })
  }

  unregisterEvent(id: string): void {
    this.events.delete(id)
  }

  getEvent(id: string): EventConfig | undefined {
    return this.events.get(id)
  }

  getAllEvents(): EventConfig[] {
    return Array.from(this.events.values())
  }

  // 组件通信管理
  registerComponent(component: ComponentCommunication): void {
    this.components.set(component.id, component)
    
    // 自动注册组件相关的状态和事件
    this.autoRegisterComponentCommunication(component)
  }

  unregisterComponent(id: string): void {
    const component = this.components.get(id)
    if (component) {
      // 清理相关的状态和事件
      this.cleanupComponentCommunication(component)
      this.components.delete(id)
    }
  }

  getComponent(id: string): ComponentCommunication | undefined {
    return this.components.get(id)
  }

  getAllComponents(): ComponentCommunication[] {
    return Array.from(this.components.values())
  }

  // 通信分析
  analyzeComponentDependencies(): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {}
    
    for (const component of this.components.values()) {
      dependencies[component.id] = []
      
      // 分析状态依赖
      for (const stateKey of component.states.consume) {
        const providers = this.findStateProviders(stateKey)
        dependencies[component.id].push(...providers)
      }
      
      // 分析事件依赖
      for (const eventType of component.events.listen) {
        const emitters = this.findEventEmitters(eventType)
        dependencies[component.id].push(...emitters)
      }
    }
    
    return dependencies
  }

  analyzeDataFlow(): Array<{
    from: string
    to: string
    type: 'state' | 'event' | 'data'
    key: string
  }> {
    const flows: Array<{
      from: string
      to: string
      type: 'state' | 'event' | 'data'
      key: string
    }> = []
    
    // 分析状态流
    for (const component of this.components.values()) {
      for (const stateKey of component.states.provide) {
        const consumers = this.findStateConsumers(stateKey)
        for (const consumer of consumers) {
          flows.push({
            from: component.id,
            to: consumer,
            type: 'state',
            key: stateKey
          })
        }
      }
      
      // 分析事件流
      for (const eventType of component.events.emit) {
        const listeners = this.findEventListeners(eventType)
        for (const listener of listeners) {
          flows.push({
            from: component.id,
            to: listener,
            type: 'event',
            key: eventType
          })
        }
      }
    }
    
    return flows
  }

  // 验证通信配置
  validateCommunication(): {
    valid: boolean
    errors: string[]
    warnings: string[]
  } {
    const errors: string[] = []
    const warnings: string[] = []
    
    // 检查循环依赖
    const dependencies = this.analyzeComponentDependencies()
    const cycles = this.detectCycles(dependencies)
    if (cycles.length > 0) {
      errors.push(`检测到循环依赖: ${cycles.join(', ')}`)
    }
    
    // 检查未满足的依赖
    for (const component of this.components.values()) {
      // 检查状态依赖
      for (const stateKey of component.states.consume) {
        const providers = this.findStateProviders(stateKey)
        if (providers.length === 0) {
          errors.push(`组件 ${component.id} 依赖的状态 ${stateKey} 没有提供者`)
        }
      }
      
      // 检查事件监听
      for (const eventType of component.events.listen) {
        const emitters = this.findEventEmitters(eventType)
        if (emitters.length === 0) {
          warnings.push(`组件 ${component.id} 监听的事件 ${eventType} 没有发射者`)
        }
      }
    }
    
    // 检查孤立的状态和事件
    for (const state of this.states.values()) {
      const providers = this.findStateProviders(state.key)
      const consumers = this.findStateConsumers(state.key)
      if (providers.length === 0 && consumers.length === 0) {
        warnings.push(`状态 ${state.key} 没有被使用`)
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  // 导出配置
  exportConfig(): {
    dataSources: DataSourceConfig[]
    states: StateConfig[]
    events: EventConfig[]
    components: ComponentCommunication[]
  } {
    return {
      dataSources: this.getAllDataSources(),
      states: this.getAllStates(),
      events: this.getAllEvents(),
      components: this.getAllComponents()
    }
  }

  // 导入配置
  importConfig(config: {
    dataSources?: DataSourceConfig[]
    states?: StateConfig[]
    events?: EventConfig[]
    components?: ComponentCommunication[]
  }): void {
    if (config.dataSources) {
      this.dataSources.clear()
      config.dataSources.forEach((ds, index) => {
        this.dataSources.set(ds.name || `datasource_${index}`, ds)
      })
    }
    
    if (config.states) {
      this.states.clear()
      config.states.forEach(state => {
        this.states.set(state.key, state)
      })
    }
    
    if (config.events) {
      this.events.clear()
      config.events.forEach((event, index) => {
        this.events.set(`event_${index}`, event)
      })
    }
    
    if (config.components) {
      this.components.clear()
      config.components.forEach(component => {
        this.components.set(component.id, component)
      })
    }
  }

  // 私有方法
  private autoRegisterComponentCommunication(component: ComponentCommunication): void {
    // 自动注册组件提供的状态
    for (const stateKey of component.states.provide) {
      if (!this.states.has(stateKey)) {
        this.registerState({
          key: stateKey,
          name: `${component.type} 状态 - ${stateKey}`,
          type: 'component',
          defaultValue: null,
          persistent: false,
          readonly: false
        })
      }
    }
    
    // 自动注册组件发射的事件
    for (const eventType of component.events.emit) {
      const eventId = `${component.id}_${eventType}`
      if (!this.events.has(eventId)) {
        this.registerEvent(eventId, {
          type: eventType,
          source: component.id,
          priority: 0,
          once: false,
          async: false
        })
      }
    }
  }

  private cleanupComponentCommunication(component: ComponentCommunication): void {
    // 清理组件相关的事件
    for (const eventType of component.events.emit) {
      const eventId = `${component.id}_${eventType}`
      this.events.delete(eventId)
    }
    
    // 注意：不清理状态，因为可能被其他组件使用
  }

  private findStateProviders(stateKey: string): string[] {
    const providers: string[] = []
    
    for (const component of this.components.values()) {
      if (component.states.provide.includes(stateKey)) {
        providers.push(component.id)
      }
    }
    
    return providers
  }

  private findStateConsumers(stateKey: string): string[] {
    const consumers: string[] = []
    
    for (const component of this.components.values()) {
      if (component.states.consume.includes(stateKey)) {
        consumers.push(component.id)
      }
    }
    
    return consumers
  }

  private findEventEmitters(eventType: string): string[] {
    const emitters: string[] = []
    
    for (const component of this.components.values()) {
      if (component.events.emit.includes(eventType)) {
        emitters.push(component.id)
      }
    }
    
    return emitters
  }

  private findEventListeners(eventType: string): string[] {
    const listeners: string[] = []
    
    for (const component of this.components.values()) {
      if (component.events.listen.includes(eventType)) {
        listeners.push(component.id)
      }
    }
    
    return listeners
  }

  private detectCycles(dependencies: Record<string, string[]>): string[] {
    const cycles: string[] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()
    
    const dfs = (node: string, path: string[]): void => {
      if (recursionStack.has(node)) {
        const cycleStart = path.indexOf(node)
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart).concat(node).join(' -> '))
        }
        return
      }
      
      if (visited.has(node)) return
      
      visited.add(node)
      recursionStack.add(node)
      
      const deps = dependencies[node] || []
      for (const dep of deps) {
        dfs(dep, [...path, node])
      }
      
      recursionStack.delete(node)
    }
    
    for (const node of Object.keys(dependencies)) {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    }
    
    return cycles
  }
}

// 工具函数
export const createCommunicationManager = (config?: Partial<CommunicationConfig>) => {
  return new CommunicationManager(config)
}

export const validateDataSourceConfig = (config: DataSourceConfig): {
  valid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (!config.name || config.name.trim() === '') {
    errors.push('数据源名称不能为空')
  }
  
  if (config.type === 'api') {
    if (!config.url || config.url.trim() === '') {
      errors.push('API 数据源必须提供 URL')
    }
    
    if (config.method && !['GET', 'POST', 'PUT', 'DELETE'].includes(config.method)) {
      errors.push('无效的 HTTP 方法')
    }
  }
  
  if (config.timeout && config.timeout <= 0) {
    errors.push('超时时间必须大于 0')
  }
  
  if (config.retryCount && config.retryCount < 0) {
    errors.push('重试次数不能为负数')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateStateConfig = (config: StateConfig): {
  valid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (!config.key || config.key.trim() === '') {
    errors.push('状态键不能为空')
  }
  
  if (!config.name || config.name.trim() === '') {
    errors.push('状态名称不能为空')
  }
  
  if (!['component', 'global', 'user', 'system'].includes(config.type)) {
    errors.push('无效的状态类型')
  }
  
  if (config.validation && typeof config.validation !== 'function') {
    errors.push('验证函数必须是一个函数')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export const validateEventConfig = (config: EventConfig): {
  valid: boolean
  errors: string[]
} => {
  const errors: string[] = []
  
  if (!config.type || config.type.trim() === '') {
    errors.push('事件类型不能为空')
  }
  
  if (!config.source || config.source.trim() === '') {
    errors.push('事件源不能为空')
  }
  
  if (config.priority < 0) {
    errors.push('事件优先级不能为负数')
  }
  
  if (config.condition && typeof config.condition !== 'function') {
    errors.push('条件函数必须是一个函数')
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

// 常用的通信模式
export const CommunicationPatterns = {
  // 发布-订阅模式
  PubSub: {
    createPublisher: (eventBus: EventBus, topic: string) => ({
      publish: (data: any) => eventBus.emit(topic, data)
    }),
    
    createSubscriber: (eventBus: EventBus, topic: string, handler: (data: any) => void) => 
      eventBus.on(topic, (payload) => handler(payload.data))
  },
  
  // 请求-响应模式
  RequestResponse: {
    createRequester: (eventBus: EventBus) => ({
      request: async (target: string, data: any, timeout = 5000) => {
        const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const responseEvent = `response_${requestId}`
        
        return new Promise((resolve, reject) => {
          const timeoutId = setTimeout(() => {
            reject(new Error('Request timeout'))
          }, timeout)
          
          const subscription = eventBus.once(responseEvent, (payload) => {
            clearTimeout(timeoutId)
            resolve(payload.data)
          })
          
          eventBus.emit('request', {
            id: requestId,
            target,
            data
          })
        })
      }
    }),
    
    createResponder: (eventBus: EventBus, handler: (data: any) => any) => {
      return eventBus.on('request', async (payload) => {
        try {
          const result = await handler(payload.data.data)
          eventBus.emit(`response_${payload.data.id}`, result)
        } catch (error) {
          eventBus.emit(`response_${payload.data.id}`, { error: error.message })
        }
      })
    }
  },
  
  // 状态同步模式
  StateSync: {
    createStateSyncer: (eventBus: EventBus, stateKey: string) => ({
      sync: (value: any) => {
        eventBus.emit('state:sync', { key: stateKey, value })
      },
      
      onSync: (handler: (value: any) => void) => {
        return eventBus.on('state:sync', (payload) => {
          if (payload.data.key === stateKey) {
            handler(payload.data.value)
          }
        })
      }
    })
  }
}

// 调试工具
export const createCommunicationDebugger = () => {
  const logs: Array<{
    timestamp: number
    type: 'event' | 'state' | 'datasource'
    action: string
    data: any
  }> = []
  
  return {
    logs,
    
    logEvent: (action: string, data: any) => {
      logs.push({
        timestamp: Date.now(),
        type: 'event',
        action,
        data
      })
    },
    
    logState: (action: string, data: any) => {
      logs.push({
        timestamp: Date.now(),
        type: 'state',
        action,
        data
      })
    },
    
    logDataSource: (action: string, data: any) => {
      logs.push({
        timestamp: Date.now(),
        type: 'datasource',
        action,
        data
      })
    },
    
    clear: () => {
      logs.length = 0
    },
    
    export: () => {
      return JSON.stringify(logs, null, 2)
    }
  }
}

// 全局通信管理器实例
export const globalCommunicationManager = createCommunicationManager()

// Vue 组合式 API 钩子
export const useCommunication = () => {
  return {
    manager: globalCommunicationManager,
    eventBus: globalEventBus,
    
    // 注册组件通信
    registerComponent: (component: ComponentCommunication) => {
      globalCommunicationManager.registerComponent(component)
    },
    
    // 注销组件通信
    unregisterComponent: (id: string) => {
      globalCommunicationManager.unregisterComponent(id)
    },
    
    // 创建数据源
    createDataSource: (id: string, config: DataSourceConfig) => {
      globalCommunicationManager.registerDataSource(id, config)
    },
    
    // 创建状态
    createState: (config: StateConfig) => {
      globalCommunicationManager.registerState(config)
    },
    
    // 发送事件
    emit: (type: string, data?: any, options?: any) => {
      globalEventBus.emit(type, data, options)
    },
    
    // 监听事件
    on: (event: string, handler: (payload: any) => void, options?: any) => {
      return globalEventBus.on(event, handler, options)
    }
  }
}