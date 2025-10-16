import type { RootView, DataSourceOption, DataFlow, DataAction } from '@/types'
import { RuntimeManager } from './RuntimeManager'
import { DataBindingExecutor } from './DataBindingExecutor'
import { EventBinder, createEventBinder } from './EventBinder'

/**
 * 运行时初始化器
 * 负责初始化运行时环境并执行数据绑定
 */
export class RuntimeInitializer {
  private runtimeManager: RuntimeManager | null = null
  private eventBinder: EventBinder | null = null
  private dataSourceManager: any
  private dataFlowManager: any

  constructor(dataSourceManager: any, dataFlowManager: any) {
    this.dataSourceManager = dataSourceManager
    this.dataFlowManager = dataFlowManager
  }

  /**
   * 初始化运行时
   */
  async initialize(rootView: RootView): Promise<RuntimeManager> {
    // 创建运行时管理器
    this.runtimeManager = new RuntimeManager(this.dataSourceManager, this.dataFlowManager)

    // 创建事件绑定器
    this.eventBinder = createEventBinder(this.runtimeManager)

    // 初始化运行时
    await this.runtimeManager.initialize()

    // 执行所有数据绑定
    await this.initializeDataBindings(rootView)

    return this.runtimeManager
  }

  /**
   * 初始化所有数据绑定
   */
  private async initializeDataBindings(rootView: RootView): Promise<void> {
    if (!this.runtimeManager) {
      throw new Error('运行时管理器未初始化')
    }

    const bindingExecutor = this.runtimeManager.getDataBindingExecutor()

    // 递归处理所有控件
    const processControls = async (controls: any[]) => {
      for (const control of controls) {
        // 如果控件有数据绑定配置
        if (control.dataBinding) {
          try {
            await bindingExecutor.bindControl(control, control.dataBinding)
            console.log(`已绑定控件: ${control.id}`)
          } catch (error) {
            console.error(`绑定控件失败: ${control.id}`, error)
          }
        }

        // 递归处理子控件
        if (control.children && control.children.length > 0) {
          await processControls(control.children)
        }
      }
    }

    await processControls(rootView.controls)
  }

  /**
   * 清理运行时
   */
  cleanup(): void {
    if (this.runtimeManager) {
      this.runtimeManager.cleanup()
      this.runtimeManager = null
    }
  }

  /**
   * 获取运行时管理器
   */
  getRuntimeManager(): RuntimeManager | null {
    return this.runtimeManager
  }

  /**
   * 获取事件绑定器
   */
  getEventBinder(): EventBinder | null {
    return this.eventBinder
  }

  /**
   * 初始化组件事件绑定
   */
  initializeComponentEvents(controlsEvents: Record<string, Record<string, string>>): void {
    if (!this.runtimeManager) {
      throw new Error('运行时管理器未初始化')
    }
    this.runtimeManager.registerMultipleEventHandlers(controlsEvents)
  }

  /**
   * 为单个组件绑定事件
   */
  bindComponentEvents(element: HTMLElement, controlId: string, events: Record<string, string>): void {
    if (!this.eventBinder) {
      throw new Error('事件绑定器未初始化')
    }
    this.eventBinder.bindEvents(element, controlId, events)
  }

  /**
   * 为Vue组件绑定事件
   */
  bindVueComponentEvents(controlId: string, events: Record<string, string>): Record<string, Function> {
    if (!this.eventBinder) {
      throw new Error('事件绑定器未初始化')
    }
    return this.eventBinder.bindVueEvents(controlId, events)
  }
}

/**
 * 创建运行时初始化器
 */
export function createRuntimeInitializer(dataSourceManager: any, dataFlowManager: any): RuntimeInitializer {
  return new RuntimeInitializer(dataSourceManager, dataFlowManager)
}
