/**
 * 控件插件系统
 * 提供控件的插件化注册、管理和懒加载机制
 */

import type { IPlugin, PluginContext, PluginMetadata, PluginState } from './IPlugin'
import { PluginState as State } from './IPlugin'
import type { ControlDefinition, ControlType } from '../../types'
import type { Component } from 'vue'

/**
 * 控件分类
 */
export enum ControlCategory {
  Common = 'common',
  Input = 'input',
  Container = 'container',
  Collection = 'collection',
  Chart = 'chart',
  BI = 'bi',
  SVG = 'svg',
  Mobile = 'mobile',
  Custom = 'custom',
  Dashboard = 'dashboard',
}

/**
 * 属性定义
 */
export interface PropertyDefinition {
  /** 属性键 */
  key: string
  /** 属性名称 */
  name: string
  /** 属性类型 */
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'function'
  /** 默认值 */
  defaultValue?: any
  /** 是否必需 */
  required?: boolean
  /** 描述 */
  description?: string
  /** 验证函数 */
  validate?: (value: any) => boolean | string
}

/**
 * 事件定义
 */
export interface EventDefinition {
  /** 事件名称 */
  name: string
  /** 事件描述 */
  description?: string
  /** 事件参数 */
  params?: Record<string, PropertyDefinition>
}

/**
 * 方法定义
 */
export interface MethodDefinition {
  /** 方法名称 */
  name: string
  /** 方法描述 */
  description?: string
  /** 方法参数 */
  params?: PropertyDefinition[]
  /** 返回值类型 */
  returnType?: string
}

/**
 * 数据绑定配置
 */
export interface DataBindingConfig {
  /** 是否支持数据绑定 */
  enabled: boolean
  /** 绑定属性 */
  property?: string
  /** 绑定模式 */
  mode?: 'one-way' | 'two-way'
  /** 支持的数据类型 */
  dataTypes?: string[]
}

/**
 * 组件适配器接口
 */
export interface ComponentAdapter {
  /** 框架类型 */
  type: 'vue' | 'react' | 'angular' | 'web-component'
  /** 组件 */
  component: any
  /** 挂载方法 */
  mount?(container: HTMLElement, props: any): void
  /** 卸载方法 */
  unmount?(container: HTMLElement): void
  /** 更新方法 */
  update?(props: any): void
}

/**
 * 标准化的控件定义
 */
export interface StandardControlDefinition {
  /** 控件类型标识 */
  kind: string
  /** 控件显示名称 */
  kindName: string
  /** 控件分类 */
  category: ControlCategory
  /** 控件图标 */
  icon?: string
  /** 组件适配器 */
  component: ComponentAdapter
  /** 属性定义 */
  properties?: PropertyDefinition[]
  /** 事件定义 */
  events?: EventDefinition[]
  /** 方法定义 */
  methods?: MethodDefinition[]
  /** 数据绑定配置 */
  dataBinding?: DataBindingConfig
  /** 创建默认实例 */
  createDefault?: () => Partial<any>
  /** 是否隐藏 */
  hidden?: boolean
  /** 自定义设置渲染器 */
  customSettingRenderer?: Component
}

/**
 * 控件插件接口
 */
export interface IControlPlugin extends IPlugin {
  /**
   * 注册控件定义
   */
  registerControls(): StandardControlDefinition[]

  /**
   * 注册设置渲染器
   */
  registerSettingRenderers?(): Record<string, Component>

  /**
   * 注册事件处理器
   */
  registerEventHandlers?(): Record<string, EventHandler>
}

/**
 * 事件处理器类型
 */
export type EventHandler = (event: any, context: any) => void | Promise<void>

/**
 * 控件注册器
 * 管理所有控件的注册和查询
 */
export class ControlRegistry {
  private controls = new Map<string, StandardControlDefinition>()
  private plugins = new Map<string, IControlPlugin>()
  private settingRenderers = new Map<string, Component>()
  private eventHandlers = new Map<string, EventHandler>()
  private lazyLoadedControls = new Map<string, Promise<StandardControlDefinition>>()

  /**
   * 注册控件插件
   */
  registerPlugin(plugin: IControlPlugin): void {
    const controls = plugin.registerControls()

    controls.forEach(ctrl => {
      if (this.controls.has(ctrl.kind)) {
        console.warn(`Control "${ctrl.kind}" is already registered, overwriting...`)
      }
      this.controls.set(ctrl.kind, ctrl)
    })

    // 注册设置渲染器
    if (plugin.registerSettingRenderers) {
      const renderers = plugin.registerSettingRenderers()
      Object.entries(renderers).forEach(([key, renderer]) => {
        this.settingRenderers.set(key, renderer)
      })
    }

    // 注册事件处理器
    if (plugin.registerEventHandlers) {
      const handlers = plugin.registerEventHandlers()
      Object.entries(handlers).forEach(([key, handler]) => {
        this.eventHandlers.set(key, handler)
      })
    }

    this.plugins.set(plugin.metadata.id, plugin)
  }

  /**
   * 卸载控件插件
   */
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return
    }

    // 移除控件
    const controls = plugin.registerControls()
    controls.forEach(ctrl => {
      this.controls.delete(ctrl.kind)
    })

    // 移除设置渲染器
    if (plugin.registerSettingRenderers) {
      const renderers = plugin.registerSettingRenderers()
      Object.keys(renderers).forEach(key => {
        this.settingRenderers.delete(key)
      })
    }

    // 移除事件处理器
    if (plugin.registerEventHandlers) {
      const handlers = plugin.registerEventHandlers()
      Object.keys(handlers).forEach(key => {
        this.eventHandlers.delete(key)
      })
    }

    this.plugins.delete(pluginId)
  }

  /**
   * 获取控件定义
   */
  getControl(kind: string): StandardControlDefinition | undefined {
    return this.controls.get(kind)
  }

  /**
   * 获取所有控件
   */
  getAllControls(category?: ControlCategory): StandardControlDefinition[] {
    const controls = Array.from(this.controls.values())
    return category ? controls.filter(c => c.category === category) : controls
  }

  /**
   * 检查控件是否已注册
   */
  hasControl(kind: string): boolean {
    return this.controls.has(kind)
  }

  /**
   * 获取设置渲染器
   */
  getSettingRenderer(key: string): Component | undefined {
    return this.settingRenderers.get(key)
  }

  /**
   * 获取事件处理器
   */
  getEventHandler(key: string): EventHandler | undefined {
    return this.eventHandlers.get(key)
  }

  /**
   * 懒加载控件
   */
  async lazyLoadControl(kind: string, loader: () => Promise<StandardControlDefinition>): Promise<StandardControlDefinition> {
    // 如果已经加载,直接返回
    if (this.controls.has(kind)) {
      return this.controls.get(kind)!
    }

    // 如果正在加载,返回加载Promise
    if (this.lazyLoadedControls.has(kind)) {
      return this.lazyLoadedControls.get(kind)!
    }

    // 开始加载
    const loadPromise = loader().then(control => {
      this.controls.set(kind, control)
      this.lazyLoadedControls.delete(kind)
      return control
    })

    this.lazyLoadedControls.set(kind, loadPromise)
    return loadPromise
  }

  /**
   * 获取控件分类列表
   */
  getCategories(): ControlCategory[] {
    const categories = new Set<ControlCategory>()
    this.controls.forEach(ctrl => {
      categories.add(ctrl.category)
    })
    return Array.from(categories)
  }

  /**
   * 按分类分组控件
   */
  getControlsByCategory(): Map<ControlCategory, StandardControlDefinition[]> {
    const grouped = new Map<ControlCategory, StandardControlDefinition[]>()

    this.controls.forEach(ctrl => {
      if (!grouped.has(ctrl.category)) {
        grouped.set(ctrl.category, [])
      }
      grouped.get(ctrl.category)!.push(ctrl)
    })

    return grouped
  }

  /**
   * 搜索控件
   */
  searchControls(query: string): StandardControlDefinition[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.controls.values()).filter(
      ctrl => ctrl.kind.toLowerCase().includes(lowerQuery) || ctrl.kindName.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 清空所有注册
   */
  clear(): void {
    this.controls.clear()
    this.plugins.clear()
    this.settingRenderers.clear()
    this.eventHandlers.clear()
    this.lazyLoadedControls.clear()
  }
}

/**
 * 基础控件插件抽象类
 * 提供通用的插件实现
 */
export abstract class BaseControlPlugin implements IControlPlugin {
  abstract readonly metadata: PluginMetadata
  private _state: PluginState = State.Uninstalled
  protected context?: PluginContext

  get state(): PluginState {
    return this._state
  }

  async install(context: PluginContext): Promise<void> {
    this.context = context
    this._state = State.Installed
    await this.onInstall(context)
  }

  async uninstall(context: PluginContext): Promise<void> {
    await this.onUninstall(context)
    this._state = State.Uninstalled
    this.context = undefined
  }

  async activate(): Promise<void> {
    this._state = State.Active
    await this.onActivate()
  }

  async deactivate(): Promise<void> {
    this._state = State.Deactivated
    await this.onDeactivate()
  }

  /**
   * 注册控件定义
   */
  abstract registerControls(): StandardControlDefinition[]

  /**
   * 安装钩子
   */
  protected async onInstall(context: PluginContext): Promise<void> {
    // 子类可以重写
  }

  /**
   * 卸载钩子
   */
  protected async onUninstall(context: PluginContext): Promise<void> {
    // 子类可以重写
  }

  /**
   * 激活钩子
   */
  protected async onActivate(): Promise<void> {
    // 子类可以重写
  }

  /**
   * 停用钩子
   */
  protected async onDeactivate(): Promise<void> {
    // 子类可以重写
  }
}

/**
 * 创建Vue组件适配器
 */
export function createVueAdapter(component: Component): ComponentAdapter {
  return {
    type: 'vue',
    component,
  }
}

/**
 * 创建标准控件定义的辅助函数
 */
export function defineControl(definition: StandardControlDefinition): StandardControlDefinition {
  return {
    ...definition,
    dataBinding: definition.dataBinding || {
      enabled: false,
    },
  }
}
