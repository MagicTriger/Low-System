/**
 * 事件总线实现
 * 支持同步/异步事件发布、优先级、过滤器、事件历史等功能
 */

import type { IEventBus, EventHandler, EventContext, SubscribeOptions, EventSubscription, EventRecord, Unsubscribe } from './types'
import { EventBusError, EventHandlerTimeoutError } from './types'

export class EventBus implements IEventBus {
  // 事件订阅映射
  private subscriptions = new Map<string, EventSubscription[]>()

  // 事件历史记录
  private history: EventRecord[] = []

  // 最大历史记录数
  private maxHistorySize: number

  // 是否启用历史记录
  private enableHistory: boolean

  constructor(options: { maxHistorySize?: number; enableHistory?: boolean } = {}) {
    this.maxHistorySize = options.maxHistorySize || 1000
    this.enableHistory = options.enableHistory !== false
  }

  emit(event: string, data?: any, source?: string): void {
    const subscriptions = this.getSubscriptions(event)
    if (subscriptions.length === 0) return

    const context = this.createContext(event, source)

    // 按优先级排序
    const sorted = this.sortByPriority(subscriptions)

    // 执行处理器
    for (const sub of sorted) {
      if (context.isPropagationStopped) break

      try {
        // 应用过滤器
        if (sub.filter && !sub.filter(data, context)) {
          continue
        }

        // 执行处理器
        sub.handler(data, context)

        // 一次性订阅
        if (sub.once) {
          this.off(event, sub.handler)
        }
      } catch (error) {
        this.handleError(error, event, sub)
      }
    }

    // 记录历史
    this.recordEvent(event, data, source)
  }

  async emitAsync(event: string, data?: any, source?: string): Promise<void> {
    const subscriptions = this.getSubscriptions(event)
    if (subscriptions.length === 0) return

    const context = this.createContext(event, source)

    // 按优先级排序
    const sorted = this.sortByPriority(subscriptions)

    // 执行处理器
    for (const sub of sorted) {
      if (context.isPropagationStopped) break

      try {
        // 应用过滤器
        if (sub.filter && !sub.filter(data, context)) {
          continue
        }

        // 执行处理器(支持超时)
        if (sub.timeout) {
          await this.executeWithTimeout(sub.handler, data, context, sub.timeout)
        } else {
          await sub.handler(data, context)
        }

        // 一次性订阅
        if (sub.once) {
          this.off(event, sub.handler)
        }
      } catch (error) {
        this.handleError(error, event, sub)
      }
    }

    // 记录历史
    this.recordEvent(event, data, source)
  }

  on<T = any>(event: string, handler: EventHandler<T>, options: SubscribeOptions<T> = {}): Unsubscribe {
    const subscription: EventSubscription<T> = {
      handler,
      priority: options.priority || 0,
      once: options.once || false,
      async: options.async || false,
      filter: options.filter,
      timeout: options.timeout,
    }

    if (!this.subscriptions.has(event)) {
      this.subscriptions.set(event, [])
    }

    this.subscriptions.get(event)!.push(subscription)

    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  once<T = any>(event: string, handler: EventHandler<T>): Unsubscribe {
    return this.on(event, handler, { once: true })
  }

  off(event: string, handler?: EventHandler): void {
    if (!handler) {
      // 取消该事件的所有订阅
      this.subscriptions.delete(event)
      return
    }

    const subscriptions = this.subscriptions.get(event)
    if (!subscriptions) return

    // 移除指定处理器
    const index = subscriptions.findIndex(sub => sub.handler === handler)
    if (index > -1) {
      subscriptions.splice(index, 1)
    }

    // 如果没有订阅了,删除事件
    if (subscriptions.length === 0) {
      this.subscriptions.delete(event)
    }
  }

  clear(): void {
    this.subscriptions.clear()
    this.history = []
  }

  getHistory(limit?: number): EventRecord[] {
    if (!limit) return [...this.history]
    return this.history.slice(-limit)
  }

  getSubscriptionCount(event?: string): number {
    if (event) {
      return this.subscriptions.get(event)?.length || 0
    }

    let total = 0
    for (const subs of this.subscriptions.values()) {
      total += subs.length
    }
    return total
  }

  hasSubscription(event: string): boolean {
    return this.subscriptions.has(event) && this.subscriptions.get(event)!.length > 0
  }

  // 获取订阅列表
  private getSubscriptions(event: string): EventSubscription[] {
    return this.subscriptions.get(event) || []
  }

  // 按优先级排序
  private sortByPriority(subscriptions: EventSubscription[]): EventSubscription[] {
    return [...subscriptions].sort((a, b) => b.priority - a.priority)
  }

  // 创建事件上下文
  private createContext(event: string, source?: string): EventContext {
    let propagationStopped = false
    let defaultPrevented = false

    return {
      event,
      timestamp: Date.now(),
      source,
      get isPropagationStopped() {
        return propagationStopped
      },
      get isDefaultPrevented() {
        return defaultPrevented
      },
      stopPropagation() {
        propagationStopped = true
      },
      preventDefault() {
        defaultPrevented = true
      },
    }
  }

  // 记录事件历史
  private recordEvent(event: string, data: any, source?: string): void {
    if (!this.enableHistory) return

    this.history.push({
      event,
      data,
      timestamp: Date.now(),
      source,
    })

    // 限制历史记录大小
    if (this.history.length > this.maxHistorySize) {
      this.history.shift()
    }
  }

  // 处理错误
  private handleError(error: any, event: string, subscription: EventSubscription): void {
    console.error(`Error in event handler for "${event}":`, error)

    // 发布错误事件
    try {
      this.emit('eventbus.error', {
        error,
        event,
        subscription,
      })
    } catch (e) {
      // 避免错误处理器本身出错导致的无限循环
      console.error('Error in error handler:', e)
    }
  }

  // 带超时的执行
  private async executeWithTimeout(handler: EventHandler, data: any, context: EventContext, timeout: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new EventHandlerTimeoutError(context.event, timeout))
      }, timeout)

      Promise.resolve(handler(data, context))
        .then(() => {
          clearTimeout(timer)
          resolve()
        })
        .catch(error => {
          clearTimeout(timer)
          reject(error)
        })
    })
  }
}

// 导出全局事件总线实例
export const globalEventBus = new EventBus()
