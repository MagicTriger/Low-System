/**
 * 设置渲染器插件系统
 * 提供属性面板渲染器的插件化注册和管理
 */

import type { IPlugin, PluginContext, PluginMetadata, PluginState } from './IPlugin'
import { PluginState as State } from './IPlugin'
import type { Component } from 'vue'

/**
 * 设置渲染器类型
 */
export enum SettingRendererType {
  /** 文本输入 */
  Text = 'text',
  /** 数字输入 */
  Number = 'number',
  /** 布尔值 */
  Boolean = 'boolean',
  /** 选择器 */
  Select = 'select',
  /** 颜色选择器 */
  Color = 'color',
  /** 图标选择器 */
  Icon = 'icon',
  /** 图片上传 */
  Image = 'image',
  /** 代码编辑器 */
  Code = 'code',
  /** 日期选择器 */
  Date = 'date',
  /** 时间选择器 */
  Time = 'time',
  /** 滑块 */
  Slider = 'slider',
  /** 开关 */
  Switch = 'switch',
  /** 多选框 */
  Checkbox = 'checkbox',
  /** 单选框 */
  Radio = 'radio',
  /** 文本域 */
  Textarea = 'textarea',
  /** 自定义 */
  Custom = 'custom',
}

/**
 * 设置渲染器定义
 */
export interface SettingRendererDefinition {
  /** 渲染器类型 */
  type: SettingRendererType | string
  /** 渲染器名称 */
  name: string
  /** 渲染器组件 */
  component: Component
  /** 渲染器描述 */
  description?: string
  /** 渲染器图标 */
  icon?: string
  /** 支持的数据类型 */
  supportedTypes?: string[]
  /** 默认配置 */
  defaultConfig?: Record<string, any>
}

/**
 * 设置字段定义
 */
export interface SettingFieldDefinition {
  /** 字段键 */
  key: string
  /** 字段标签 */
  label: string
  /** 渲染器类型 */
  renderer: SettingRendererType | string
  /** 默认值 */
  defaultValue?: any
  /** 字段描述 */
  description?: string
  /** 是否必需 */
  required?: boolean
  /** 渲染器配置 */
  config?: Record<string, any>
  /** 分组 */
  group?: string
  /** 排序 */
  order?: number
  /** 条件显示 */
  visible?: (values: Record<string, any>) => boolean
  /** 验证函数 */
  validate?: (value: any) => boolean | string
}

/**
 * 设置分组定义
 */
export interface SettingGroupDefinition {
  /** 分组键 */
  key: string
  /** 分组标签 */
  label: string
  /** 分组图标 */
  icon?: string
  /** 分组描述 */
  description?: string
  /** 排序 */
  order?: number
  /** 是否可折叠 */
  collapsible?: boolean
  /** 默认是否展开 */
  defaultExpanded?: boolean
}

/**
 * 设置面板定义
 */
export interface SettingPanelDefinition {
  /** 面板ID */
  id: string
  /** 面板标题 */
  title: string
  /** 面板图标 */
  icon?: string
  /** 字段列表 */
  fields: SettingFieldDefinition[]
  /** 分组列表 */
  groups?: SettingGroupDefinition[]
  /** 面板配置 */
  config?: {
    /** 是否显示搜索 */
    searchable?: boolean
    /** 是否显示重置按钮 */
    resettable?: boolean
    /** 布局模式 */
    layout?: 'vertical' | 'horizontal' | 'grid'
  }
}

/**
 * 设置渲染器插件接口
 */
export interface ISettingRendererPlugin extends IPlugin {
  /**
   * 注册设置渲染器
   */
  registerRenderers(): SettingRendererDefinition[]

  /**
   * 注册设置面板
   */
  registerPanels?(): SettingPanelDefinition[]
}

/**
 * 设置渲染器注册表
 * 管理所有设置渲染器的注册和查询
 */
export class SettingRendererRegistry {
  private renderers = new Map<string, SettingRendererDefinition>()
  private panels = new Map<string, SettingPanelDefinition>()
  private plugins = new Map<string, ISettingRendererPlugin>()

  /**
   * 注册设置渲染器插件
   */
  registerPlugin(plugin: ISettingRendererPlugin): void {
    const renderers = plugin.registerRenderers()

    renderers.forEach(renderer => {
      if (this.renderers.has(renderer.type)) {
        console.warn(`Setting renderer "${renderer.type}" is already registered, overwriting...`)
      }
      this.renderers.set(renderer.type, renderer)
    })

    // 注册设置面板
    if (plugin.registerPanels) {
      const panels = plugin.registerPanels()
      panels.forEach(panel => {
        if (this.panels.has(panel.id)) {
          console.warn(`Setting panel "${panel.id}" is already registered, overwriting...`)
        }
        this.panels.set(panel.id, panel)
      })
    }

    this.plugins.set(plugin.metadata.id, plugin)
  }

  /**
   * 卸载设置渲染器插件
   */
  unregisterPlugin(pluginId: string): void {
    const plugin = this.plugins.get(pluginId)
    if (!plugin) {
      return
    }

    // 移除渲染器
    const renderers = plugin.registerRenderers()
    renderers.forEach(renderer => {
      this.renderers.delete(renderer.type)
    })

    // 移除面板
    if (plugin.registerPanels) {
      const panels = plugin.registerPanels()
      panels.forEach(panel => {
        this.panels.delete(panel.id)
      })
    }

    this.plugins.delete(pluginId)
  }

  /**
   * 获取设置渲染器
   */
  getRenderer(type: string): SettingRendererDefinition | undefined {
    return this.renderers.get(type)
  }

  /**
   * 获取所有设置渲染器
   */
  getAllRenderers(): SettingRendererDefinition[] {
    return Array.from(this.renderers.values())
  }

  /**
   * 检查渲染器是否已注册
   */
  hasRenderer(type: string): boolean {
    return this.renderers.has(type)
  }

  /**
   * 获取设置面板
   */
  getPanel(id: string): SettingPanelDefinition | undefined {
    return this.panels.get(id)
  }

  /**
   * 获取所有设置面板
   */
  getAllPanels(): SettingPanelDefinition[] {
    return Array.from(this.panels.values())
  }

  /**
   * 按分组获取字段
   */
  getFieldsByGroup(panelId: string): Map<string, SettingFieldDefinition[]> {
    const panel = this.panels.get(panelId)
    if (!panel) {
      return new Map()
    }

    const grouped = new Map<string, SettingFieldDefinition[]>()

    panel.fields.forEach(field => {
      const group = field.group || 'default'
      if (!grouped.has(group)) {
        grouped.set(group, [])
      }
      grouped.get(group)!.push(field)
    })

    // 按order排序
    grouped.forEach(fields => {
      fields.sort((a, b) => (a.order || 0) - (b.order || 0))
    })

    return grouped
  }

  /**
   * 搜索渲染器
   */
  searchRenderers(query: string): SettingRendererDefinition[] {
    const lowerQuery = query.toLowerCase()
    return Array.from(this.renderers.values()).filter(
      renderer => renderer.type.toLowerCase().includes(lowerQuery) || renderer.name.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * 清空所有注册
   */
  clear(): void {
    this.renderers.clear()
    this.panels.clear()
    this.plugins.clear()
  }
}

/**
 * 基础设置渲染器插件抽象类
 */
export abstract class BaseSettingRendererPlugin implements ISettingRendererPlugin {
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
   * 注册设置渲染器
   */
  abstract registerRenderers(): SettingRendererDefinition[]

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
 * 创建设置渲染器定义的辅助函数
 */
export function defineSettingRenderer(definition: SettingRendererDefinition): SettingRendererDefinition {
  return {
    ...definition,
    defaultConfig: definition.defaultConfig || {},
  }
}

/**
 * 创建设置面板定义的辅助函数
 */
export function defineSettingPanel(definition: SettingPanelDefinition): SettingPanelDefinition {
  return {
    ...definition,
    config: {
      searchable: false,
      resettable: true,
      layout: 'vertical',
      ...definition.config,
    },
  }
}

/**
 * 创建设置字段定义的辅助函数
 */
export function defineSettingField(definition: SettingFieldDefinition): SettingFieldDefinition {
  return {
    ...definition,
    required: definition.required ?? false,
    order: definition.order ?? 0,
    config: definition.config || {},
  }
}
