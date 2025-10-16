/**
 * 渲染引擎
 *
 * 提供高层次的渲染API,基于框架适配器实现
 */

import type { Control } from '@/types'
import type {
  IFrameworkAdapter,
  IRenderEngine,
  ComponentInstance,
  RenderOptions,
  UpdateOptions,
  RenderResult,
  RenderStats,
} from './IFrameworkAdapter'

/**
 * 渲染引擎实现
 */
export class RenderEngine implements IRenderEngine {
  /** 当前使用的适配器 */
  readonly adapter: IFrameworkAdapter

  /** 控件ID到组件ID的映射 */
  private controlToComponent = new Map<string, string>()

  /** 渲染统计 */
  private stats: RenderStats = {
    totalRenders: 0,
    totalUpdates: 0,
    averageRenderTime: 0,
    averageUpdateTime: 0,
    mountedComponents: 0,
  }

  /** 渲染时间记录 */
  private renderTimes: number[] = []

  /** 更新时间记录 */
  private updateTimes: number[] = []

  constructor(adapter: IFrameworkAdapter) {
    this.adapter = adapter
  }

  /**
   * 渲染控件
   */
  render(control: Control, container: HTMLElement, options?: RenderOptions): ComponentInstance {
    const startTime = performance.now()

    try {
      // 将控件定义转换为组件属性
      const props = this.controlToProps(control)

      // 创建组件实例
      const instance = this.adapter.createComponent(control.kind, props, options)

      // 挂载组件
      this.adapter.mount(instance, container)

      // 建立映射关系
      this.controlToComponent.set(control.id, instance.id)

      // 更新统计
      const duration = performance.now() - startTime
      this.recordRenderTime(duration)

      return instance
    } catch (error) {
      const duration = performance.now() - startTime
      throw error
    }
  }

  /**
   * 更新控件
   */
  update(controlId: string, props: Partial<Control>, options?: UpdateOptions): void {
    const startTime = performance.now()

    try {
      const componentId = this.controlToComponent.get(controlId)
      if (!componentId) {
        throw new Error(`Control "${controlId}" not found`)
      }

      // 将控件属性转换为组件属性
      const componentProps = this.controlToProps(props as Control)

      // 更新组件
      this.adapter.update(componentId, componentProps, options)

      // 更新统计
      const duration = performance.now() - startTime
      this.recordUpdateTime(duration)
    } catch (error) {
      const duration = performance.now() - startTime
      throw error
    }
  }

  /**
   * 批量更新控件
   */
  batchUpdate(updates: Array<{ controlId: string; props: Partial<Control> }>): void {
    const startTime = performance.now()

    try {
      // 转换为组件更新
      const componentUpdates = updates
        .map(update => {
          const componentId = this.controlToComponent.get(update.controlId)
          if (!componentId) {
            return null
          }

          return {
            componentId,
            props: this.controlToProps(update.props as Control),
          }
        })
        .filter(Boolean) as any[]

      // 批量更新
      this.adapter.batchUpdate(componentUpdates)

      // 更新统计
      const duration = performance.now() - startTime
      this.recordUpdateTime(duration)
    } catch (error) {
      throw error
    }
  }

  /**
   * 卸载控件
   */
  unmount(controlId: string): void {
    const componentId = this.controlToComponent.get(controlId)
    if (!componentId) {
      return
    }

    // 卸载组件
    this.adapter.unmount(componentId)

    // 移除映射
    this.controlToComponent.delete(controlId)

    // 更新统计
    this.stats.mountedComponents = this.controlToComponent.size
  }

  /**
   * 获取控件实例
   */
  getControlInstance(controlId: string): ComponentInstance | undefined {
    const componentId = this.controlToComponent.get(controlId)
    if (!componentId) {
      return undefined
    }

    return this.adapter.getInstance(componentId)
  }

  /**
   * 获取渲染统计
   */
  getStats(): RenderStats {
    return { ...this.stats }
  }

  /**
   * 重置统计
   */
  resetStats(): void {
    this.stats = {
      totalRenders: 0,
      totalUpdates: 0,
      averageRenderTime: 0,
      averageUpdateTime: 0,
      mountedComponents: this.controlToComponent.size,
    }
    this.renderTimes = []
    this.updateTimes = []
  }

  /**
   * 销毁渲染引擎
   */
  destroy(): void {
    // 卸载所有控件
    const controlIds = Array.from(this.controlToComponent.keys())
    for (const id of controlIds) {
      this.unmount(id)
    }

    // 销毁适配器
    this.adapter.destroy()

    // 清空映射
    this.controlToComponent.clear()
  }

  /**
   * 将控件定义转换为组件属性
   */
  private controlToProps(control: Partial<Control>): Record<string, any> {
    // 基本属性映射
    const props: Record<string, any> = {
      id: control.id,
      kind: control.kind,
      ...control.properties,
    }

    // 样式属性
    if (control.styles) {
      props.styles = control.styles
    }

    // 布局属性
    if (control.layout) {
      props.layout = control.layout
    }

    // 数据绑定
    if (control.dataBinding) {
      props.dataBinding = control.dataBinding
    }

    // 事件绑定
    if (control.events) {
      props.events = control.events
    }

    // 子控件
    if (control.children) {
      props.children = control.children
    }

    return props
  }

  /**
   * 记录渲染时间
   */
  private recordRenderTime(duration: number): void {
    this.renderTimes.push(duration)
    this.stats.totalRenders++
    this.stats.averageRenderTime = this.calculateAverage(this.renderTimes)
    this.stats.mountedComponents = this.controlToComponent.size

    // 保持最近100次记录
    if (this.renderTimes.length > 100) {
      this.renderTimes.shift()
    }
  }

  /**
   * 记录更新时间
   */
  private recordUpdateTime(duration: number): void {
    this.updateTimes.push(duration)
    this.stats.totalUpdates++
    this.stats.averageUpdateTime = this.calculateAverage(this.updateTimes)

    // 保持最近100次记录
    if (this.updateTimes.length > 100) {
      this.updateTimes.shift()
    }
  }

  /**
   * 计算平均值
   */
  private calculateAverage(values: number[]): number {
    if (values.length === 0) {
      return 0
    }
    const sum = values.reduce((acc, val) => acc + val, 0)
    return sum / values.length
  }
}
