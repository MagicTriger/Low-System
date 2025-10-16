/**
 * 属性面板服务
 * 统一管理字段渲染器、可视化组件和面板配置
 */

import { FieldRegistry } from '../fields/registry'
import { PanelRegistry } from '../panels/registry'
import type { FieldType, FieldConfig, VisualizerType, ValidationRule, DependencyRule } from '../fields/types'
import type { PanelGroup, PanelConfig, ComponentPanelConfig } from '../panels/types'
import type { Component } from 'vue'

/**
 * 属性面板服务类
 */
export class PropertyPanelService {
  private fieldRegistry: FieldRegistry
  private panelRegistry: PanelRegistry
  private initialized: boolean = false
  private eventBus: any = null
  private cache: any = null
  private panelCache: Map<string, PanelConfig[]> = new Map()

  constructor() {
    this.fieldRegistry = new FieldRegistry()
    this.panelRegistry = new PanelRegistry()

    // 尝试获取全局EventBus和Cache
    try {
      if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
        this.eventBus = (window as any).__MIGRATION_SYSTEM__.coreServices.eventBus
        console.log('[PropertyPanelService] EventBus connected')

        // 尝试获取缓存系统
        if ((window as any).__MIGRATION_SYSTEM__.cache) {
          this.cache = (window as any).__MIGRATION_SYSTEM__.cache
          console.log('[PropertyPanelService] Cache system connected')
        }
      }
    } catch (error) {
      console.debug('[PropertyPanelService] EventBus/Cache not available:', error)
    }
  }

  /**
   * 初始化服务
   * 注册所有内置字段渲染器、可视化组件和通用面板
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.warn('[PropertyPanelService] Service already initialized')
      return
    }

    try {
      // 注册字段渲染器和可视化组件
      await this.registerBuiltInFields()
      await this.registerBuiltInVisualizers()

      // 注册通用面板
      await this.registerCommonPanels()

      this.initialized = true
      console.log('[PropertyPanelService] Service initialized successfully')
    } catch (error) {
      console.error('[PropertyPanelService] Failed to initialize service:', error)
      throw error
    }
  }

  /**
   * 检查服务是否已初始化
   */
  isInitialized(): boolean {
    return this.initialized
  }

  /**
   * 获取字段注册表
   */
  getFieldRegistry(): FieldRegistry {
    return this.fieldRegistry
  }

  /**
   * 获取面板注册表
   */
  getPanelRegistry(): PanelRegistry {
    return this.panelRegistry
  }

  // ==================== 字段管理功能 ====================

  /**
   * 注册字段渲染器
   * @param type 字段类型
   * @param renderer 渲染器组件
   */
  registerField(type: FieldType, renderer: Component): void {
    this.fieldRegistry.register(type, renderer)
  }

  /**
   * 批量注册字段渲染器
   * @param renderers 渲染器映射对象
   */
  registerFieldBatch(renderers: Partial<Record<FieldType, Component>>): void {
    this.fieldRegistry.registerBatch(renderers)
  }

  /**
   * 获取字段渲染器
   * @param type 字段类型
   * @returns 渲染器组件或null
   */
  getFieldRenderer(type: FieldType): Component | null {
    return this.fieldRegistry.getRenderer(type)
  }

  /**
   * 注册可视化组件
   * @param type 可视化类型
   * @param visualizer 可视化组件
   */
  registerVisualizer(type: VisualizerType, visualizer: Component): void {
    this.fieldRegistry.registerVisualizer(type, visualizer)
  }

  /**
   * 批量注册可视化组件
   * @param visualizers 可视化组件映射对象
   */
  registerVisualizerBatch(visualizers: Partial<Record<VisualizerType, Component>>): void {
    this.fieldRegistry.registerVisualizerBatch(visualizers)
  }

  /**
   * 获取可视化组件
   * @param type 可视化类型
   * @returns 可视化组件或null
   */
  getVisualizer(type: VisualizerType): Component | null {
    return this.fieldRegistry.getVisualizer(type)
  }

  /**
   * 验证字段配置
   * @param config 字段配置
   * @returns 错误信息数组
   */
  validateFieldConfig(config: FieldConfig): string[] {
    return this.fieldRegistry.validateConfig(config)
  }

  // ==================== 面板管理功能 ====================

  /**
   * 注册通用面板
   * @param panel 面板配置
   */
  registerCommonPanel(panel: PanelConfig): void {
    this.panelRegistry.registerCommonPanel(panel)
  }

  /**
   * 批量注册通用面板
   * @param panels 面板配置数组
   */
  registerCommonPanelBatch(panels: PanelConfig[]): void {
    this.panelRegistry.registerCommonPanelBatch(panels)
  }

  /**
   * 注册组件特定面板
   * @param config 组件面板配置
   */
  registerComponentPanel(config: ComponentPanelConfig): void {
    this.panelRegistry.registerComponentPanel(config)
  }

  /**
   * 获取组件的所有面板配置
   * @param componentType 组件类型
   * @returns 面板配置数组
   */
  getPanelsForComponent(componentType: string): PanelConfig[] {
    // 检查内存缓存
    if (this.panelCache.has(componentType)) {
      return this.panelCache.get(componentType)!
    }

    // 从注册表获取
    const panels = this.panelRegistry.getPanelsForComponent(componentType)

    // 缓存结果(30分钟过期)
    this.panelCache.set(componentType, panels)

    // 如果有外部缓存系统,也缓存到那里
    if (this.cache) {
      try {
        this.cache.set(`property-panels:${componentType}`, panels, { ttl: 1800000 }) // 30分钟
      } catch (error) {
        console.debug('[PropertyPanelService] Failed to cache panels:', error)
      }
    }

    return panels
  }

  /**
   * 清除面板缓存
   * @param componentType 组件类型,如果不提供则清除所有缓存
   */
  clearPanelCache(componentType?: string): void {
    if (componentType) {
      this.panelCache.delete(componentType)
      if (this.cache) {
        try {
          this.cache.delete(`property-panels:${componentType}`)
        } catch (error) {
          console.debug('[PropertyPanelService] Failed to clear cache:', error)
        }
      }
    } else {
      this.panelCache.clear()
      if (this.cache) {
        try {
          // 清除所有property-panels相关的缓存
          this.cache.clear('property-panels:*')
        } catch (error) {
          console.debug('[PropertyPanelService] Failed to clear all cache:', error)
        }
      }
    }
  }

  /**
   * 获取通用面板
   * @param group 面板分组
   * @returns 面板配置或undefined
   */
  getCommonPanel(group: PanelGroup): PanelConfig | undefined {
    return this.panelRegistry.getCommonPanel(group)
  }

  /**
   * 检查组件是否已注册面板
   * @param componentType 组件类型
   * @returns 是否已注册
   */
  hasComponentPanel(componentType: string): boolean {
    return this.panelRegistry.hasComponentPanel(componentType)
  }

  // ==================== 验证功能 ====================

  /**
   * 验证字段值
   * @param config 字段配置
   * @param value 字段值
   * @returns 错误信息数组,如果为空则验证通过
   */
  validateFieldValue(config: FieldConfig, value: any): string[] {
    const errors: string[] = []

    if (!config.validation || config.validation.length === 0) {
      return errors
    }

    for (const rule of config.validation) {
      const error = this.validateRule(rule, value, config)
      if (error) {
        errors.push(error)
      }
    }

    return errors
  }

  /**
   * 验证单个规则
   * @param rule 验证规则
   * @param value 字段值
   * @param config 字段配置
   * @returns 错误信息或null
   */
  private validateRule(rule: ValidationRule, value: any, config: FieldConfig): string | null {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return rule.message
        }
        break

      case 'min':
        if (typeof value === 'number' && value < (rule.value as number)) {
          return rule.message
        }
        if (typeof value === 'string' && value.length < (rule.value as number)) {
          return rule.message
        }
        break

      case 'max':
        if (typeof value === 'number' && value > (rule.value as number)) {
          return rule.message
        }
        if (typeof value === 'string' && value.length > (rule.value as number)) {
          return rule.message
        }
        break

      case 'pattern':
        if (typeof value === 'string') {
          const pattern = new RegExp(rule.value as string)
          if (!pattern.test(value)) {
            return rule.message
          }
        }
        break

      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return rule.message
        }
        break
    }

    return null
  }

  /**
   * 检查依赖条件
   * @param rule 依赖规则
   * @param fieldValue 依赖字段的值
   * @returns 是否满足依赖条件
   */
  checkDependency(rule: DependencyRule, fieldValue: any): boolean {
    switch (rule.condition) {
      case 'equals':
        return fieldValue === rule.value

      case 'notEquals':
        return fieldValue !== rule.value

      case 'includes':
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(rule.value)
        }
        if (typeof fieldValue === 'string') {
          return fieldValue.includes(rule.value as string)
        }
        return false

      case 'custom':
        if (rule.validator) {
          return rule.validator(fieldValue)
        }
        return true

      default:
        return true
    }
  }

  // ==================== 服务初始化 ====================

  /**
   * 注册所有内置字段渲染器
   */
  private async registerBuiltInFields(): Promise<void> {
    const { TextField, NumberField, SelectField, SwitchField, TextareaField, ColorField, SliderField, IconField, FieldType } = await import(
      '../fields'
    )

    // 导入DomSizeRenderer
    const DomSizeRenderer = (await import('@/core/renderer/designer/settings/renderers/DomSizeRenderer.vue')).default

    this.registerFieldBatch({
      [FieldType.TEXT]: TextField,
      [FieldType.NUMBER]: NumberField,
      [FieldType.SELECT]: SelectField,
      [FieldType.SWITCH]: SwitchField,
      [FieldType.TEXTAREA]: TextareaField,
      [FieldType.COLOR]: ColorField,
      [FieldType.SLIDER]: SliderField,
      [FieldType.ICON]: IconField,
      [FieldType.SIZE]: DomSizeRenderer, // 注册尺寸渲染器
    })

    console.log('[PropertyPanelService] Built-in field renderers registered')
  }

  /**
   * 注册所有内置可视化组件
   */
  private async registerBuiltInVisualizers(): Promise<void> {
    const { visualizerComponents } = await import('../fields/visualizers')

    this.registerVisualizerBatch(visualizerComponents)

    console.log('[PropertyPanelService] Built-in visualizers registered')
  }

  /**
   * 注册所有通用面板
   */
  private async registerCommonPanels(): Promise<void> {
    const { BasicPanel, LayoutPanel, StylePanel, EventPanel } = await import('../panels')

    this.registerCommonPanelBatch([BasicPanel, LayoutPanel, StylePanel, EventPanel])

    console.log('[PropertyPanelService] Common panels registered')
  }
}
