/**
 * 框架适配器基类
 *
 * 提供框架适配器的通用实现
 */

import type {
  IFrameworkAdapter,
  FrameworkType,
  ComponentDefinition,
  ComponentInstance,
  RenderOptions,
  UpdateOptions,
  BatchUpdateItem,
  ComponentLifecycleHooks,
} from './IFrameworkAdapter'

/**
 * 框架适配器基类
 */
export abstract class BaseFrameworkAdapter implements IFrameworkAdapter {
  /** 框架名称 */
  abstract readonly name: FrameworkType

  /** 框架版本 */
  abstract readonly version: string

  /** 组件定义注册表 */
  protected components = new Map<string, ComponentDefinition>()

  /** 组件实例注册表 */
  protected instances = new Map<string, ComponentInstance>()

  /** 批量更新队列 */
  protected updateQueue: BatchUpdateItem[] = []

  /** 批量更新定时器 */
  protected updateTimer: any = null

  /** 是否已销毁 */
  protected destroyed = false

  /**
   * 注册组件定义
   */
  registerComponent(definition: ComponentDefinition): void {
    if (this.destroyed) {
      throw new Error('Adapter has been destroyed')
    }

    this.components.set(definition.type, definition)
  }

  /**
   * 获取组件定义
   */
  getComponent(type: string): ComponentDefinition | undefined {
    return this.components.get(type)
  }

  /**
   * 创建组件实例
   */
  createComponent(type: string, props: any, options?: RenderOptions): ComponentInstance {
    if (this.destroyed) {
      throw new Error('Adapter has been destroyed')
    }

    const definition = this.components.get(type)
    if (!definition) {
      throw new Error(`Component type "${type}" not registered`)
    }

    // 合并默认属性
    const mergedProps = {
      ...definition.defaultProps,
      ...props,
    }

    // 合并生命周期钩子
    const hooks: ComponentLifecycleHooks = {
      ...definition.hooks,
      ...options?.hooks,
    }

    // 调用 beforeMount 钩子
    hooks.beforeMount?.(mergedProps)

    // 创建组件实例(由子类实现)
    const instance = this.createComponentInstance(definition, mergedProps, options)

    // 保存实例
    this.instances.set(instance.id, instance)

    return instance
  }

  /**
   * 挂载组件到容器
   */
  mount(component: ComponentInstance, container: HTMLElement): void {
    if (this.destroyed) {
      throw new Error('Adapter has been destroyed')
    }

    // 执行挂载(由子类实现)
    this.mountComponent(component, container)

    // 更新实例信息
    component.container = container

    // 调用 mounted 钩子
    const definition = this.components.get(component.type)
    definition?.hooks?.mounted?.(component)
  }

  /**
   * 更新组件属性
   */
  update(componentId: string, props: any, options?: UpdateOptions): void {
    if (this.destroyed) {
      throw new Error('Adapter has been destroyed')
    }

    const instance = this.instances.get(componentId)
    if (!instance) {
      throw new Error(`Component "${componentId}" not found`)
    }

    // 如果是批量更新,加入队列
    if (options?.batch) {
      this.queueUpdate({ componentId, props, options })
      return
    }

    // 立即更新
    this.performUpdate(instance, props, options)
  }

  /**
   * 批量更新组件
   */
  batchUpdate(updates: BatchUpdateItem[]): void {
    if (this.destroyed) {
      throw new Error('Adapter has been destroyed')
    }

    // 执行所有更新
    for (const update of updates) {
      const instance = this.instances.get(update.componentId)
      if (instance) {
        this.performUpdate(instance, update.props, update.options)
      }
    }
  }

  /**
   * 卸载组件
   */
  unmount(componentId: string): void {
    if (this.destroyed) {
      throw new Error('Adapter has been destroyed')
    }

    const instance = this.instances.get(componentId)
    if (!instance) {
      return
    }

    // 调用 beforeUnmount 钩子
    const definition = this.components.get(instance.type)
    definition?.hooks?.beforeUnmount?.(instance)

    // 执行卸载(由子类实现)
    this.unmountComponent(instance)

    // 移除实例
    this.instances.delete(componentId)

    // 调用 unmounted 钩子
    definition?.hooks?.unmounted?.()
  }

  /**
   * 获取组件实例
   */
  getInstance(componentId: string): ComponentInstance | undefined {
    return this.instances.get(componentId)
  }

  /**
   * 检查组件是否已挂载
   */
  isMounted(componentId: string): boolean {
    return this.instances.has(componentId)
  }

  /**
   * 销毁适配器
   */
  destroy(): void {
    if (this.destroyed) {
      return
    }

    // 清除更新定时器
    if (this.updateTimer) {
      clearTimeout(this.updateTimer)
      this.updateTimer = null
    }

    // 卸载所有组件
    const componentIds = Array.from(this.instances.keys())
    for (const id of componentIds) {
      this.unmount(id)
    }

    // 清空注册表
    this.components.clear()
    this.instances.clear()
    this.updateQueue = []

    this.destroyed = true
  }

  /**
   * 将更新加入队列
   */
  protected queueUpdate(update: BatchUpdateItem): void {
    this.updateQueue.push(update)

    // 延迟执行批量更新
    if (!this.updateTimer) {
      this.updateTimer = setTimeout(() => {
        this.flushUpdateQueue()
      }, 0)
    }
  }

  /**
   * 刷新更新队列
   */
  protected flushUpdateQueue(): void {
    if (this.updateQueue.length === 0) {
      return
    }

    const updates = [...this.updateQueue]
    this.updateQueue = []
    this.updateTimer = null

    this.batchUpdate(updates)
  }

  /**
   * 执行更新
   */
  protected performUpdate(instance: ComponentInstance, props: any, options?: UpdateOptions): void {
    const oldProps = { ...instance.props }

    // 调用 beforeUpdate 钩子
    const definition = this.components.get(instance.type)
    definition?.hooks?.beforeUpdate?.(props, oldProps)

    // 合并或替换属性
    if (options?.strategy === 'replace') {
      instance.props = props
    } else {
      instance.props = { ...instance.props, ...props }
    }

    // 执行更新(由子类实现)
    this.updateComponent(instance, instance.props, options)

    // 调用 updated 钩子
    definition?.hooks?.updated?.(instance)
  }

  /**
   * 创建组件实例(由子类实现)
   */
  protected abstract createComponentInstance(definition: ComponentDefinition, props: any, options?: RenderOptions): ComponentInstance

  /**
   * 挂载组件(由子类实现)
   */
  protected abstract mountComponent(component: ComponentInstance, container: HTMLElement): void

  /**
   * 更新组件(由子类实现)
   */
  protected abstract updateComponent(instance: ComponentInstance, props: any, options?: UpdateOptions): void

  /**
   * 卸载组件(由子类实现)
   */
  protected abstract unmountComponent(instance: ComponentInstance): void

  /**
   * 生成唯一ID
   */
  protected generateId(): string {
    return `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
