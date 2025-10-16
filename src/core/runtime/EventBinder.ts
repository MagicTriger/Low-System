import { RuntimeManager } from './RuntimeManager'

/**
 * 事件绑定器 - 用于在运行时组件中绑定事件处理器
 */
export class EventBinder {
  private runtimeManager: RuntimeManager

  constructor(runtimeManager: RuntimeManager) {
    this.runtimeManager = runtimeManager
  }

  /**
   * 为DOM元素绑定事件
   */
  bindEvents(element: HTMLElement, controlId: string, events: Record<string, string>): void {
    // 注册事件处理器
    this.runtimeManager.registerEventHandlers(controlId, events)

    // 绑定DOM事件
    Object.entries(events).forEach(([eventType, actionId]) => {
      if (actionId) {
        element.addEventListener(eventType, async event => {
          try {
            await this.runtimeManager.executeEvent(controlId, eventType, {
              originalEvent: event,
              target: event.target,
              currentTarget: event.currentTarget,
              timestamp: Date.now(),
            })
          } catch (error) {
            console.error(`Event execution failed:`, error)
          }
        })
      }
    })
  }

  /**
   * 为Vue组件绑定事件
   */
  bindVueEvents(controlId: string, events: Record<string, string>): Record<string, Function> {
    // 注册事件处理器
    this.runtimeManager.registerEventHandlers(controlId, events)

    // 返回事件处理函数映射
    const eventHandlers: Record<string, Function> = {}

    Object.entries(events).forEach(([eventType, actionId]) => {
      if (actionId) {
        eventHandlers[eventType] = async (...args: any[]) => {
          try {
            await this.runtimeManager.executeEvent(controlId, eventType, {
              args,
              timestamp: Date.now(),
            })
          } catch (error) {
            console.error(`Event execution failed:`, error)
          }
        }
      }
    })

    return eventHandlers
  }

  /**
   * 生命周期事件处理
   */
  async executeLifecycleEvent(controlId: string, lifecycle: 'mounted' | 'beforeUnmount' | 'updated', data?: any): Promise<void> {
    try {
      await this.runtimeManager.executeEvent(controlId, lifecycle, {
        lifecycle,
        data,
        timestamp: Date.now(),
      })
    } catch (error) {
      console.error(`Lifecycle event execution failed:`, error)
    }
  }

  /**
   * 清除组件事件绑定
   */
  unbindEvents(controlId: string): void {
    this.runtimeManager.clearEventHandlers(controlId)
  }
}

/**
 * 创建事件绑定器实例
 */
export function createEventBinder(runtimeManager: RuntimeManager): EventBinder {
  return new EventBinder(runtimeManager)
}
