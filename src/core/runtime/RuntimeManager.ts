import { DataFlowEngine } from './DataFlowEngine'
import { DataActionExecutor } from './DataActionExecutor'
import { DataBindingExecutor } from './DataBindingExecutor'

/**
 * 运行时管理器
 * 负责管理运行时的各种执行器
 */
export class RuntimeManager {
  private dataFlowEngine: DataFlowEngine
  private dataActionExecutor: DataActionExecutor
  private dataBindingExecutor: DataBindingExecutor
  private eventHandlers: Map<string, Map<string, string>> = new Map()

  constructor(dataSourceManager?: any, dataFlowManager?: any) {
    this.dataFlowEngine = new DataFlowEngine()
    this.dataActionExecutor = new DataActionExecutor(dataSourceManager)
    this.dataBindingExecutor = new DataBindingExecutor(dataSourceManager, dataFlowManager)
  }

  /**
   * 获取数据流引擎
   */
  getDataFlowEngine(): DataFlowEngine {
    return this.dataFlowEngine
  }

  /**
   * 获取数据操作执行器
   */
  getDataActionExecutor(): DataActionExecutor {
    return this.dataActionExecutor
  }

  /**
   * 获取数据绑定执行器
   */
  getDataBindingExecutor(): DataBindingExecutor {
    return this.dataBindingExecutor
  }

  /**
   * 初始化运行时
   */
  async initialize(): Promise<void> {
    // 执行初始化逻辑
    console.log('Runtime initialized')
  }

  /**
   * 清理运行时
   */
  cleanup(): void {
    // 清理所有订阅和定时器
    console.log('Runtime cleanup')
  }

  /**
   * 注册组件事件处理器
   */
  registerEventHandlers(controlId: string, events: Record<string, string>): void {
    this.eventHandlers.set(controlId, new Map(Object.entries(events)))
  }

  /**
   * 执行事件
   * @param controlId 组件ID
   * @param eventType 事件类型
   * @param eventData 事件数据
   * @param dataAction 数据操作对象(可选,如果不提供则从eventHandlers中查找actionId)
   */
  async executeEvent(controlId: string, eventType: string, eventData?: any, dataAction?: any): Promise<any> {
    try {
      // 如果直接提供了dataAction对象,则直接执行
      if (dataAction) {
        console.log(`Executing event: ${eventType} -> action: ${dataAction.id}`)
        return await this.dataActionExecutor.execute(dataAction, {
          controlId,
          eventType,
          eventData,
          timestamp: Date.now(),
        })
      }

      // 否则从eventHandlers中查找actionId
      const controlEvents = this.eventHandlers.get(controlId)
      if (!controlEvents) {
        console.warn(`No event handlers registered for control: ${controlId}`)
        return
      }

      const actionId = controlEvents.get(eventType)
      if (!actionId) {
        console.warn(`No handler registered for event: ${eventType} on control: ${controlId}`)
        return
      }

      // 注意: 这里需要从某个地方获取DataAction对象
      // 实际使用时需要传入dataAction对象或者从dataActionManager中获取
      console.log(`Event ${eventType} mapped to action ${actionId}, but DataAction object is required`)
      console.warn(`Please provide DataAction object when calling executeEvent`)
      return
    } catch (error) {
      console.error(`Error executing event ${eventType}:`, error)
      throw error
    }
  }

  /**
   * 批量注册事件处理器
   */
  registerMultipleEventHandlers(controlsEvents: Record<string, Record<string, string>>): void {
    Object.entries(controlsEvents).forEach(([controlId, events]) => {
      this.registerEventHandlers(controlId, events)
    })
  }

  /**
   * 清除组件事件处理器
   */
  clearEventHandlers(controlId: string): void {
    this.eventHandlers.delete(controlId)
  }

  /**
   * 获取所有注册的事件处理器
   */
  getAllEventHandlers(): Record<string, Record<string, string>> {
    const result: Record<string, Record<string, string>> = {}
    this.eventHandlers.forEach((events, controlId) => {
      result[controlId] = Object.fromEntries(events)
    })
    return result
  }
}
