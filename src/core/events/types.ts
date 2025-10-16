/**
 * 事件总线类型定义
 * 提供类型安全的事件发布订阅机制
 */

// 事件处理器类型
export type EventHandler<T = any> = (data: T, context: EventContext) => void | Promise<void>

// 取消订阅函数
export type Unsubscribe = () => void

// 事件过滤器
export type EventFilter<T = any> = (data: T, context: EventContext) => boolean

// 事件上下文
export interface EventContext {
  /** 事件名称 */
  readonly event: string
  /** 事件时间戳 */
  readonly timestamp: number
  /** 事件来源 */
  readonly source?: string
  /** 是否已停止传播 */
  readonly isPropagationStopped: boolean
  /** 是否已阻止默认行为 */
  readonly isDefaultPrevented: boolean
  /** 停止事件传播 */
  stopPropagation(): void
  /** 阻止默认行为 */
  preventDefault(): void
}

// 订阅选项
export interface SubscribeOptions<T = any> {
  /** 优先级 (数字越大优先级越高) */
  priority?: number
  /** 是否只执行一次 */
  once?: boolean
  /** 是否异步执行 */
  async?: boolean
  /** 事件过滤器 */
  filter?: EventFilter<T>
  /** 超时时间(毫秒) */
  timeout?: number
}

// 事件订阅信息
export interface EventSubscription<T = any> {
  handler: EventHandler<T>
  priority: number
  once: boolean
  async: boolean
  filter?: EventFilter<T>
  timeout?: number
}

// 事件记录
export interface EventRecord {
  event: string
  data: any
  timestamp: number
  source?: string
}

// 事件总线接口
export interface IEventBus {
  /**
   * 发布事件(同步)
   * @param event 事件名称
   * @param data 事件数据
   * @param source 事件来源
   */
  emit(event: string, data?: any, source?: string): void

  /**
   * 发布事件(异步)
   * @param event 事件名称
   * @param data 事件数据
   * @param source 事件来源
   */
  emitAsync(event: string, data?: any, source?: string): Promise<void>

  /**
   * 订阅事件
   * @param event 事件名称或模式
   * @param handler 事件处理器
   * @param options 订阅选项
   */
  on<T = any>(event: string, handler: EventHandler<T>, options?: SubscribeOptions<T>): Unsubscribe

  /**
   * 订阅一次性事件
   * @param event 事件名称
   * @param handler 事件处理器
   */
  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe

  /**
   * 取消订阅
   * @param event 事件名称
   * @param handler 事件处理器(可选,不传则取消该事件的所有订阅)
   */
  off(event: string, handler?: EventHandler): void

  /**
   * 清空所有订阅
   */
  clear(): void

  /**
   * 获取事件历史记录
   * @param limit 限制数量
   */
  getHistory(limit?: number): EventRecord[]

  /**
   * 获取订阅数量
   * @param event 事件名称(可选)
   */
  getSubscriptionCount(event?: string): number

  /**
   * 检查是否有订阅
   * @param event 事件名称
   */
  hasSubscription(event: string): boolean
}

// 事件总线错误
export class EventBusError extends Error {
  constructor(
    message: string,
    public event?: string
  ) {
    super(message)
    this.name = 'EventBusError'
  }
}

// 事件处理超时错误
export class EventHandlerTimeoutError extends EventBusError {
  constructor(event: string, timeout: number) {
    super(`Event handler timeout after ${timeout}ms for event: ${event}`, event)
    this.name = 'EventHandlerTimeoutError'
  }
}
