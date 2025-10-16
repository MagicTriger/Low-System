/**
 * 框架适配器接口
 *
 * 提供框架无关的渲染引擎抽象,支持多种前端框架
 */

import type { Control } from '@/types'

/**
 * 框架类型
 */
export type FrameworkType = 'vue' | 'react' | 'angular' | 'web-component'

/**
 * 组件实例
 */
export interface ComponentInstance {
  /** 组件唯一标识 */
  id: string
  /** 组件类型 */
  type: string
  /** 组件实例引用 */
  instance: any
  /** 挂载的容器 */
  container: HTMLElement
  /** 组件属性 */
  props: Record<string, any>
}

/**
 * 组件生命周期钩子
 */
export interface ComponentLifecycleHooks {
  /** 组件挂载前 */
  beforeMount?: (props: any) => void | Promise<void>
  /** 组件挂载后 */
  mounted?: (instance: ComponentInstance) => void | Promise<void>
  /** 组件更新前 */
  beforeUpdate?: (props: any, oldProps: any) => void | Promise<void>
  /** 组件更新后 */
  updated?: (instance: ComponentInstance) => void | Promise<void>
  /** 组件卸载前 */
  beforeUnmount?: (instance: ComponentInstance) => void | Promise<void>
  /** 组件卸载后 */
  unmounted?: () => void | Promise<void>
}

/**
 * 组件定义
 */
export interface ComponentDefinition {
  /** 组件类型 */
  type: string
  /** 组件实现 */
  component: any
  /** 生命周期钩子 */
  hooks?: ComponentLifecycleHooks
  /** 默认属性 */
  defaultProps?: Record<string, any>
}

/**
 * 渲染选项
 */
export interface RenderOptions {
  /** 是否立即挂载 */
  immediate?: boolean
  /** 是否保留容器内容 */
  preserveContent?: boolean
  /** 自定义生命周期钩子 */
  hooks?: ComponentLifecycleHooks
  /** 渲染上下文 */
  context?: Record<string, any>
}

/**
 * 更新选项
 */
export interface UpdateOptions {
  /** 是否强制更新 */
  force?: boolean
  /** 是否批量更新 */
  batch?: boolean
  /** 更新策略 */
  strategy?: 'merge' | 'replace'
}

/**
 * 批量更新项
 */
export interface BatchUpdateItem {
  /** 组件ID */
  componentId: string
  /** 新属性 */
  props: Record<string, any>
  /** 更新选项 */
  options?: UpdateOptions
}

/**
 * 框架适配器接口
 *
 * 定义了框架无关的渲染引擎接口,支持多种前端框架
 */
export interface IFrameworkAdapter {
  /** 框架名称 */
  readonly name: FrameworkType

  /** 框架版本 */
  readonly version: string

  /**
   * 注册组件定义
   * @param definition 组件定义
   */
  registerComponent(definition: ComponentDefinition): void

  /**
   * 获取组件定义
   * @param type 组件类型
   */
  getComponent(type: string): ComponentDefinition | undefined

  /**
   * 创建组件实例
   * @param type 组件类型
   * @param props 组件属性
   * @param options 渲染选项
   */
  createComponent(type: string, props: any, options?: RenderOptions): ComponentInstance

  /**
   * 挂载组件到容器
   * @param component 组件实例
   * @param container 容器元素
   */
  mount(component: ComponentInstance, container: HTMLElement): void

  /**
   * 更新组件属性
   * @param componentId 组件ID
   * @param props 新属性
   * @param options 更新选项
   */
  update(componentId: string, props: any, options?: UpdateOptions): void

  /**
   * 批量更新组件
   * @param updates 更新列表
   */
  batchUpdate(updates: BatchUpdateItem[]): void

  /**
   * 卸载组件
   * @param componentId 组件ID
   */
  unmount(componentId: string): void

  /**
   * 获取组件实例
   * @param componentId 组件ID
   */
  getInstance(componentId: string): ComponentInstance | undefined

  /**
   * 检查组件是否已挂载
   * @param componentId 组件ID
   */
  isMounted(componentId: string): boolean

  /**
   * 销毁适配器
   */
  destroy(): void
}

/**
 * 属性更新接口
 */
export interface IPropertyUpdater {
  /**
   * 更新单个属性
   * @param componentId 组件ID
   * @param key 属性键
   * @param value 属性值
   */
  updateProperty(componentId: string, key: string, value: any): void

  /**
   * 更新多个属性
   * @param componentId 组件ID
   * @param props 属性对象
   */
  updateProperties(componentId: string, props: Record<string, any>): void

  /**
   * 删除属性
   * @param componentId 组件ID
   * @param key 属性键
   */
  removeProperty(componentId: string, key: string): void
}

/**
 * 事件绑定接口
 */
export interface IEventBinder {
  /**
   * 绑定事件
   * @param componentId 组件ID
   * @param event 事件名称
   * @param handler 事件处理器
   */
  on(componentId: string, event: string, handler: (...args: any[]) => void): void

  /**
   * 解绑事件
   * @param componentId 组件ID
   * @param event 事件名称
   * @param handler 事件处理器
   */
  off(componentId: string, event: string, handler?: (...args: any[]) => void): void

  /**
   * 触发事件
   * @param componentId 组件ID
   * @param event 事件名称
   * @param args 事件参数
   */
  emit(componentId: string, event: string, ...args: any[]): void
}

/**
 * 渲染引擎接口
 *
 * 提供高层次的渲染API,基于框架适配器实现
 */
export interface IRenderEngine {
  /** 当前使用的适配器 */
  readonly adapter: IFrameworkAdapter

  /**
   * 渲染控件
   * @param control 控件定义
   * @param container 容器元素
   * @param options 渲染选项
   */
  render(control: Control, container: HTMLElement, options?: RenderOptions): ComponentInstance

  /**
   * 更新控件
   * @param controlId 控件ID
   * @param props 新属性
   * @param options 更新选项
   */
  update(controlId: string, props: Partial<Control>, options?: UpdateOptions): void

  /**
   * 批量更新控件
   * @param updates 更新列表
   */
  batchUpdate(updates: Array<{ controlId: string; props: Partial<Control> }>): void

  /**
   * 卸载控件
   * @param controlId 控件ID
   */
  unmount(controlId: string): void

  /**
   * 获取控件实例
   * @param controlId 控件ID
   */
  getControlInstance(controlId: string): ComponentInstance | undefined

  /**
   * 销毁渲染引擎
   */
  destroy(): void
}

/**
 * 渲染结果
 */
export interface RenderResult {
  /** 组件实例 */
  instance: ComponentInstance
  /** 渲染耗时(ms) */
  duration: number
  /** 是否成功 */
  success: boolean
  /** 错误信息 */
  error?: Error
}

/**
 * 渲染统计
 */
export interface RenderStats {
  /** 总渲染次数 */
  totalRenders: number
  /** 总更新次数 */
  totalUpdates: number
  /** 平均渲染时间(ms) */
  averageRenderTime: number
  /** 平均更新时间(ms) */
  averageUpdateTime: number
  /** 当前挂载的组件数 */
  mountedComponents: number
}
