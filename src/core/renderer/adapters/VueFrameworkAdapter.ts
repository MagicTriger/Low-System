/**
 * Vue框架适配器
 *
 * 为Vue 3提供框架适配器实现
 */

import {
  createApp,
  h,
  reactive,
  computed,
  watch,
  onMounted,
  onUnmounted,
  type App,
  type Component,
  type VNode,
  type Slots,
  type Directive,
} from 'vue'
import { BaseFrameworkAdapter } from './BaseFrameworkAdapter'
import type { ComponentDefinition, ComponentInstance, RenderOptions, UpdateOptions } from './IFrameworkAdapter'

/**
 * Vue插槽定义
 */
export interface VueSlotDefinition {
  name: string
  content: VNode | Component | string
  props?: Record<string, any>
}

/**
 * Vue指令定义
 */
export interface VueDirectiveDefinition {
  name: string
  directive: Directive
}

/**
 * Vue组件实例扩展
 */
interface VueComponentInstance extends ComponentInstance {
  /** Vue应用实例 */
  app: App
  /** 响应式属性 */
  reactiveProps: any
  /** 插槽 */
  slots?: Record<string, any>
  /** 事件处理器 */
  eventHandlers: Map<string, Function[]>
  /** 计算属性 */
  computedProps?: Record<string, any>
  /** 监听器清理函数 */
  watchers: Array<() => void>
}

/**
 * Vue适配器选项
 */
export interface VueAdapterOptions {
  /** 全局指令 */
  directives?: VueDirectiveDefinition[]
  /** 全局组件 */
  globalComponents?: Record<string, Component>
  /** 全局混入 */
  mixins?: any[]
  /** 全局属性 */
  globalProperties?: Record<string, any>
}

/**
 * Vue框架适配器
 */
export class VueFrameworkAdapter extends BaseFrameworkAdapter {
  readonly name = 'vue' as const
  readonly version = '3.x'

  /** 全局指令 */
  private globalDirectives = new Map<string, Directive>()

  /** 全局组件 */
  private globalComponents = new Map<string, Component>()

  /** 全局混入 */
  private globalMixins: any[] = []

  /** 全局属性 */
  private globalProperties: Record<string, any> = {}

  constructor(options?: VueAdapterOptions) {
    super()

    // 注册全局指令
    if (options?.directives) {
      options.directives.forEach(({ name, directive }) => {
        this.registerDirective(name, directive)
      })
    }

    // 注册全局组件
    if (options?.globalComponents) {
      Object.entries(options.globalComponents).forEach(([name, component]) => {
        this.registerGlobalComponent(name, component)
      })
    }

    // 注册全局混入
    if (options?.mixins) {
      this.globalMixins = options.mixins
    }

    // 注册全局属性
    if (options?.globalProperties) {
      this.globalProperties = options.globalProperties
    }
  }

  /**
   * 注册全局指令
   */
  registerDirective(name: string, directive: Directive): void {
    this.globalDirectives.set(name, directive)
  }

  /**
   * 注册全局组件
   */
  registerGlobalComponent(name: string, component: Component): void {
    this.globalComponents.set(name, component)
  }

  /**
   * 创建Vue组件实例
   */
  protected createComponentInstance(definition: ComponentDefinition, props: any, options?: RenderOptions): ComponentInstance {
    const id = this.generateId()

    // 创建响应式属性
    const reactiveProps = reactive({ ...props })

    // 事件处理器映射
    const eventHandlers = new Map<string, Function[]>()

    // 监听器清理函数
    const watchers: Array<() => void> = []

    // 创建插槽
    const slots = this.createSlots(props.slots)

    // 创建包装组件
    const WrapperComponent: Component = {
      setup() {
        // 创建计算属性
        const computedProps: Record<string, any> = {}
        if (props.computed) {
          Object.entries(props.computed).forEach(([key, getter]) => {
            computedProps[key] = computed(getter as any)
          })
        }

        // 设置监听器
        if (props.watch) {
          Object.entries(props.watch).forEach(([key, handler]) => {
            const stopWatch = watch(() => reactiveProps[key], handler as any, { deep: true })
            watchers.push(stopWatch)
          })
        }

        // 生命周期钩子
        onMounted(() => {
          props.onMounted?.()
        })

        onUnmounted(() => {
          props.onUnmounted?.()
          // 清理监听器
          watchers.forEach(stop => stop())
        })

        // 渲染函数
        return () => {
          const componentProps = {
            ...reactiveProps,
            ...computedProps,
          }

          // 绑定事件处理器
          eventHandlers.forEach((handlers, event) => {
            const eventKey = `on${event.charAt(0).toUpperCase()}${event.slice(1)}`
            componentProps[eventKey] = (...args: any[]) => {
              handlers.forEach(handler => handler(...args))
            }
          })

          return h(definition.component as Component, componentProps, slots)
        }
      },
    }

    // 创建Vue应用实例
    const app = createApp(WrapperComponent)

    // 配置应用
    this.configureApp(app, options)

    const instance: VueComponentInstance = {
      id,
      type: definition.type,
      instance: app,
      container: null as any,
      props: reactiveProps,
      app,
      reactiveProps,
      slots,
      eventHandlers,
      watchers,
    }

    return instance
  }

  /**
   * 配置Vue应用
   */
  private configureApp(app: App, options?: RenderOptions): void {
    // 注册全局指令
    this.globalDirectives.forEach((directive, name) => {
      app.directive(name, directive)
    })

    // 注册全局组件
    this.globalComponents.forEach((component, name) => {
      app.component(name, component)
    })

    // 应用全局混入
    this.globalMixins.forEach(mixin => {
      app.mixin(mixin)
    })

    // 设置全局属性
    Object.entries(this.globalProperties).forEach(([key, value]) => {
      app.config.globalProperties[key] = value
    })

    // 提供上下文
    if (options?.context) {
      Object.entries(options.context).forEach(([key, value]) => {
        app.provide(key, value)
      })
    }

    // 配置错误处理
    app.config.errorHandler = (err, instance, info) => {
      console.error('Vue Error:', err, info)
    }

    // 配置警告处理
    app.config.warnHandler = (msg, instance, trace) => {
      console.warn('Vue Warning:', msg, trace)
    }
  }

  /**
   * 创建插槽
   */
  private createSlots(slotDefinitions?: VueSlotDefinition[]): Record<string, any> | undefined {
    if (!slotDefinitions || slotDefinitions.length === 0) {
      return undefined
    }

    const slots: Record<string, any> = {}

    slotDefinitions.forEach(slot => {
      slots[slot.name] = (slotProps?: any) => {
        if (typeof slot.content === 'string') {
          return [slot.content]
        }
        if (typeof slot.content === 'object' && 'render' in slot.content) {
          return [h(slot.content as Component, { ...slot.props, ...slotProps })]
        }
        return [slot.content as VNode]
      }
    })

    return slots
  }

  /**
   * 挂载Vue组件
   */
  protected mountComponent(component: ComponentInstance, container: HTMLElement): void {
    const vueInstance = component as VueComponentInstance

    // 清空容器(如果需要)
    if (!vueInstance.props.preserveContent) {
      container.innerHTML = ''
    }

    // 挂载应用
    vueInstance.app.mount(container)
  }

  /**
   * 更新Vue组件
   */
  protected updateComponent(instance: ComponentInstance, props: any, options?: UpdateOptions): void {
    const vueInstance = instance as VueComponentInstance

    // Vue的响应式系统会自动更新
    // 只需要更新响应式属性
    if (options?.strategy === 'replace') {
      // 替换所有属性
      Object.keys(vueInstance.reactiveProps).forEach(key => {
        delete vueInstance.reactiveProps[key]
      })
      Object.assign(vueInstance.reactiveProps, props)
    } else {
      // 合并属性
      Object.assign(vueInstance.reactiveProps, props)
    }
  }

  /**
   * 卸载Vue组件
   */
  protected unmountComponent(instance: ComponentInstance): void {
    const vueInstance = instance as VueComponentInstance

    // 清理监听器
    vueInstance.watchers.forEach(stop => stop())
    vueInstance.watchers = []

    // 清理事件处理器
    vueInstance.eventHandlers.clear()

    // 卸载应用
    vueInstance.app.unmount()
  }

  /**
   * 绑定事件
   */
  on(componentId: string, event: string, handler: Function): void {
    const instance = this.getInstance(componentId) as VueComponentInstance
    if (!instance) {
      throw new Error(`Component "${componentId}" not found`)
    }

    if (!instance.eventHandlers.has(event)) {
      instance.eventHandlers.set(event, [])
    }

    instance.eventHandlers.get(event)!.push(handler)

    // 触发更新以应用新的事件处理器
    this.updateComponent(instance, instance.props)
  }

  /**
   * 解绑事件
   */
  off(componentId: string, event: string, handler?: Function): void {
    const instance = this.getInstance(componentId) as VueComponentInstance
    if (!instance) {
      return
    }

    if (!handler) {
      // 移除所有处理器
      instance.eventHandlers.delete(event)
    } else {
      // 移除特定处理器
      const handlers = instance.eventHandlers.get(event)
      if (handlers) {
        const index = handlers.indexOf(handler)
        if (index > -1) {
          handlers.splice(index, 1)
        }
        if (handlers.length === 0) {
          instance.eventHandlers.delete(event)
        }
      }
    }

    // 触发更新以应用新的事件处理器
    this.updateComponent(instance, instance.props)
  }

  /**
   * 触发事件
   */
  emit(componentId: string, event: string, ...args: any[]): void {
    const instance = this.getInstance(componentId) as VueComponentInstance
    if (!instance) {
      return
    }

    const handlers = instance.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(...args))
    }
  }
}
