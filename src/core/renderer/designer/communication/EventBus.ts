import { ref, reactive, computed, watch, type Ref } from 'vue'

// 事件类型定义
export interface EventPayload {
  type: string
  source: string
  target?: string
  data?: any
  timestamp: number
  id: string
}

export interface EventListener {
  id: string
  event: string
  handler: (payload: EventPayload) => void
  once?: boolean
  priority?: number
}

export interface EventSubscription {
  unsubscribe: () => void
}

export interface ComponentState {
  id: string
  type: string
  data: any
  visible: boolean
  locked: boolean
  selected: boolean
}

export interface DataBinding {
  sourceId: string
  targetId: string
  sourcePath: string
  targetPath: string
  transform?: (data: any) => any
  bidirectional?: boolean
}

// 事件总线类
export class EventBus {
  private listeners: Map<string, EventListener[]> = new Map()
  private componentStates: Map<string, ComponentState> = new Map()
  private dataBindings: Map<string, DataBinding> = new Map()
  private eventHistory: EventPayload[] = []
  private maxHistorySize = 1000

  // 订阅事件
  on(event: string, handler: (payload: EventPayload) => void, options?: {
    once?: boolean
    priority?: number
    id?: string
  }): EventSubscription {
    const listener: EventListener = {
      id: options?.id || this.generateId(),
      event,
      handler,
      once: options?.once || false,
      priority: options?.priority || 0
    }

    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }

    const eventListeners = this.listeners.get(event)!
    eventListeners.push(listener)
    
    // 按优先级排序
    eventListeners.sort((a, b) => (b.priority || 0) - (a.priority || 0))

    return {
      unsubscribe: () => this.off(event, listener.id)
    }
  }

  // 取消订阅
  off(event: string, listenerId?: string): void {
    if (!this.listeners.has(event)) return

    const eventListeners = this.listeners.get(event)!
    
    if (listenerId) {
      const index = eventListeners.findIndex(l => l.id === listenerId)
      if (index > -1) {
        eventListeners.splice(index, 1)
      }
    } else {
      this.listeners.delete(event)
    }

    if (eventListeners.length === 0) {
      this.listeners.delete(event)
    }
  }

  // 发布事件
  emit(type: string, data?: any, options?: {
    source?: string
    target?: string
    async?: boolean
  }): void {
    const payload: EventPayload = {
      type,
      source: options?.source || 'system',
      target: options?.target,
      data,
      timestamp: Date.now(),
      id: this.generateId()
    }

    // 记录事件历史
    this.addToHistory(payload)

    // 触发监听器
    if (options?.async) {
      setTimeout(() => this.triggerListeners(payload), 0)
    } else {
      this.triggerListeners(payload)
    }
  }

  // 一次性事件监听
  once(event: string, handler: (payload: EventPayload) => void): EventSubscription {
    return this.on(event, handler, { once: true })
  }

  // 等待事件
  waitFor(event: string, timeout?: number): Promise<EventPayload> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | undefined

      const subscription = this.once(event, (payload) => {
        if (timeoutId) clearTimeout(timeoutId)
        resolve(payload)
      })

      if (timeout) {
        timeoutId = setTimeout(() => {
          subscription.unsubscribe()
          reject(new Error(`Event '${event}' timeout after ${timeout}ms`))
        }, timeout)
      }
    })
  }

  // 注册组件状态
  registerComponent(component: ComponentState): void {
    this.componentStates.set(component.id, component)
    this.emit('component:registered', component, { source: 'eventbus' })
  }

  // 注销组件状态
  unregisterComponent(componentId: string): void {
    const component = this.componentStates.get(componentId)
    if (component) {
      this.componentStates.delete(componentId)
      this.emit('component:unregistered', component, { source: 'eventbus' })
    }
  }

  // 更新组件状态
  updateComponentState(componentId: string, updates: Partial<ComponentState>): void {
    const component = this.componentStates.get(componentId)
    if (component) {
      Object.assign(component, updates)
      this.emit('component:updated', { id: componentId, updates }, { source: 'eventbus' })
      
      // 触发数据绑定更新
      this.updateDataBindings(componentId)
    }
  }

  // 获取组件状态
  getComponentState(componentId: string): ComponentState | undefined {
    return this.componentStates.get(componentId)
  }

  // 获取所有组件状态
  getAllComponentStates(): ComponentState[] {
    return Array.from(this.componentStates.values())
  }

  // 创建数据绑定
  createDataBinding(binding: DataBinding): void {
    const bindingId = `${binding.sourceId}-${binding.targetId}-${binding.sourcePath}-${binding.targetPath}`
    this.dataBindings.set(bindingId, binding)
    
    // 立即同步数据
    this.syncDataBinding(binding)
    
    this.emit('binding:created', binding, { source: 'eventbus' })
  }

  // 移除数据绑定
  removeDataBinding(sourceId: string, targetId: string, sourcePath: string, targetPath: string): void {
    const bindingId = `${sourceId}-${targetId}-${sourcePath}-${targetPath}`
    const binding = this.dataBindings.get(bindingId)
    
    if (binding) {
      this.dataBindings.delete(bindingId)
      this.emit('binding:removed', binding, { source: 'eventbus' })
    }
  }

  // 获取组件的数据绑定
  getComponentBindings(componentId: string): DataBinding[] {
    return Array.from(this.dataBindings.values()).filter(
      binding => binding.sourceId === componentId || binding.targetId === componentId
    )
  }

  // 获取事件历史
  getEventHistory(filter?: {
    type?: string
    source?: string
    target?: string
    limit?: number
  }): EventPayload[] {
    let history = [...this.eventHistory]

    if (filter) {
      if (filter.type) {
        history = history.filter(event => event.type === filter.type)
      }
      if (filter.source) {
        history = history.filter(event => event.source === filter.source)
      }
      if (filter.target) {
        history = history.filter(event => event.target === filter.target)
      }
      if (filter.limit) {
        history = history.slice(-filter.limit)
      }
    }

    return history.reverse() // 最新的在前
  }

  // 清空事件历史
  clearHistory(): void {
    this.eventHistory = []
    this.emit('history:cleared', null, { source: 'eventbus' })
  }

  // 获取监听器统计
  getListenerStats(): Record<string, number> {
    const stats: Record<string, number> = {}
    
    for (const [event, listeners] of this.listeners) {
      stats[event] = listeners.length
    }
    
    return stats
  }

  // 销毁事件总线
  destroy(): void {
    this.listeners.clear()
    this.componentStates.clear()
    this.dataBindings.clear()
    this.eventHistory = []
    this.emit('eventbus:destroyed', null, { source: 'eventbus' })
  }

  // 私有方法
  private triggerListeners(payload: EventPayload): void {
    const eventListeners = this.listeners.get(payload.type)
    if (!eventListeners) return

    const listenersToRemove: string[] = []

    for (const listener of eventListeners) {
      try {
        // 检查目标过滤
        if (payload.target && payload.target !== listener.id) {
          continue
        }

        listener.handler(payload)

        // 标记一次性监听器待移除
        if (listener.once) {
          listenersToRemove.push(listener.id)
        }
      } catch (error) {
        console.error(`Error in event listener for '${payload.type}':`, error)
      }
    }

    // 移除一次性监听器
    for (const listenerId of listenersToRemove) {
      this.off(payload.type, listenerId)
    }
  }

  private addToHistory(payload: EventPayload): void {
    this.eventHistory.push(payload)
    
    // 限制历史记录大小
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize)
    }
  }

  private updateDataBindings(componentId: string): void {
    const bindings = this.getComponentBindings(componentId)
    
    for (const binding of bindings) {
      if (binding.sourceId === componentId) {
        this.syncDataBinding(binding)
      }
    }
  }

  private syncDataBinding(binding: DataBinding): void {
    const sourceComponent = this.componentStates.get(binding.sourceId)
    const targetComponent = this.componentStates.get(binding.targetId)
    
    if (!sourceComponent || !targetComponent) return

    try {
      // 获取源数据
      let sourceData = this.getNestedValue(sourceComponent.data, binding.sourcePath)
      
      // 应用转换函数
      if (binding.transform) {
        sourceData = binding.transform(sourceData)
      }
      
      // 设置目标数据
      this.setNestedValue(targetComponent.data, binding.targetPath, sourceData)
      
      // 触发目标组件更新事件
      this.emit('component:data-updated', {
        componentId: binding.targetId,
        path: binding.targetPath,
        value: sourceData
      }, { source: 'databinding' })
      
    } catch (error) {
      console.error('Error syncing data binding:', error)
    }
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  private generateId(): string {
    return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
  }
}

// 全局事件总线实例
export const globalEventBus = new EventBus()

// Vue 组合式 API 钩子
export function useEventBus() {
  return {
    eventBus: globalEventBus,
    
    // 响应式事件监听
    useEventListener: (event: string, handler: (payload: EventPayload) => void, options?: {
      once?: boolean
      priority?: number
    }) => {
      const subscription = globalEventBus.on(event, handler, options)
      
      // 在组件卸载时自动取消订阅
      if (typeof window !== 'undefined' && 'onBeforeUnmount' in window) {
        const { onBeforeUnmount } = require('vue')
        onBeforeUnmount(() => {
          subscription.unsubscribe()
        })
      }
      
      return subscription
    },
    
    // 响应式组件状态
    useComponentState: (componentId: string) => {
      const state = ref(globalEventBus.getComponentState(componentId))
      
      const subscription = globalEventBus.on('component:updated', (payload) => {
        if (payload.data.id === componentId) {
          state.value = globalEventBus.getComponentState(componentId)
        }
      })
      
      if (typeof window !== 'undefined' && 'onBeforeUnmount' in window) {
        const { onBeforeUnmount } = require('vue')
        onBeforeUnmount(() => {
          subscription.unsubscribe()
        })
      }
      
      return {
        state: state as Ref<ComponentState | undefined>,
        updateState: (updates: Partial<ComponentState>) => {
          globalEventBus.updateComponentState(componentId, updates)
        }
      }
    },
    
    // 响应式事件历史
    useEventHistory: (filter?: {
      type?: string
      source?: string
      target?: string
      limit?: number
    }) => {
      const history = ref(globalEventBus.getEventHistory(filter))
      
      const subscription = globalEventBus.on('*', () => {
        history.value = globalEventBus.getEventHistory(filter)
      })
      
      if (typeof window !== 'undefined' && 'onBeforeUnmount' in window) {
        const { onBeforeUnmount } = require('vue')
        onBeforeUnmount(() => {
          subscription.unsubscribe()
        })
      }
      
      return history
    }
  }
}

// 事件类型常量
export const EventTypes = {
  // 组件事件
  COMPONENT_CREATED: 'component:created',
  COMPONENT_UPDATED: 'component:updated',
  COMPONENT_DELETED: 'component:deleted',
  COMPONENT_SELECTED: 'component:selected',
  COMPONENT_DESELECTED: 'component:deselected',
  
  // 数据事件
  DATA_LOADED: 'data:loaded',
  DATA_UPDATED: 'data:updated',
  DATA_ERROR: 'data:error',
  
  // 界面事件
  UI_RESIZE: 'ui:resize',
  UI_SCROLL: 'ui:scroll',
  UI_ZOOM: 'ui:zoom',
  
  // 用户交互事件
  USER_CLICK: 'user:click',
  USER_DRAG: 'user:drag',
  USER_DROP: 'user:drop',
  
  // 系统事件
  SYSTEM_READY: 'system:ready',
  SYSTEM_ERROR: 'system:error',
  SYSTEM_WARNING: 'system:warning'
} as const

// 工具函数
export const createEventPayload = (
  type: string,
  data?: any,
  source = 'unknown'
): EventPayload => ({
  type,
  source,
  data,
  timestamp: Date.now(),
  id: 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
})

export const isEventType = (payload: EventPayload, type: string): boolean => {
  return payload.type === type
}

export const filterEventsByType = (events: EventPayload[], type: string): EventPayload[] => {
  return events.filter(event => event.type === type)
}

export const filterEventsBySource = (events: EventPayload[], source: string): EventPayload[] => {
  return events.filter(event => event.source === source)
}

export const filterEventsByTimeRange = (
  events: EventPayload[],
  startTime: number,
  endTime: number
): EventPayload[] => {
  return events.filter(event => 
    event.timestamp >= startTime && event.timestamp <= endTime
  )
}

// 调试工具
export const createEventDebugger = () => {
  const debugEvents = ref<EventPayload[]>([])
  const isEnabled = ref(false)
  
  const subscription = globalEventBus.on('*', (payload) => {
    if (isEnabled.value) {
      debugEvents.value.push(payload)
      console.log('Event:', payload)
    }
  })
  
  return {
    events: debugEvents,
    isEnabled,
    enable: () => { isEnabled.value = true },
    disable: () => { isEnabled.value = false },
    clear: () => { debugEvents.value = [] },
    destroy: () => { subscription.unsubscribe() }
  }
}