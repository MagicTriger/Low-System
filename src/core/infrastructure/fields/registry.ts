/**
 * 字段注册表
 * 管理字段渲染器和可视化组件的注册与获取
 */

import type { Component } from 'vue'
import type { FieldType, FieldConfig, VisualizerType } from './types'

/**
 * 字段注册表类
 */
export class FieldRegistry {
  private renderers: Map<FieldType, Component> = new Map()
  private visualizers: Map<VisualizerType, Component> = new Map()

  /**
   * 注册字段渲染器
   * @param type 字段类型
   * @param renderer 渲染器组件
   */
  register(type: FieldType, renderer: Component): void {
    if (this.renderers.has(type)) {
      console.warn(`[FieldRegistry] Field renderer for type "${type}" is already registered. Overwriting.`)
    }
    this.renderers.set(type, renderer)
  }

  /**
   * 获取字段渲染器
   * @param type 字段类型
   * @returns 渲染器组件或null
   */
  getRenderer(type: FieldType): Component | null {
    const renderer = this.renderers.get(type)
    if (!renderer) {
      console.error(`[FieldRegistry] No renderer found for field type "${type}"`)
      return null
    }
    return renderer
  }

  /**
   * 批量注册字段渲染器
   * @param renderers 渲染器映射对象
   */
  registerBatch(renderers: Partial<Record<FieldType, Component>>): void {
    Object.entries(renderers).forEach(([type, renderer]) => {
      if (renderer) {
        this.register(type as FieldType, renderer)
      }
    })
  }

  /**
   * 验证字段配置
   * @param config 字段配置
   * @returns 错误信息数组,如果为空则验证通过
   */
  validateConfig(config: FieldConfig): string[] {
    const errors: string[] = []

    // 验证必填字段
    if (!config.key) {
      errors.push('Field key is required')
    }
    if (!config.label) {
      errors.push('Field label is required')
    }
    if (!config.type) {
      errors.push('Field type is required')
    }

    // 验证字段类型是否已注册
    if (config.type && !this.renderers.has(config.type)) {
      errors.push(`No renderer registered for field type "${config.type}"`)
    }

    // 验证 SELECT 类型必须有 options
    if (config.type === 'select' && (!config.options || config.options.length === 0)) {
      errors.push('SELECT field must have options')
    }

    // 验证数字范围
    if (config.type === 'number' || config.type === 'slider') {
      if (config.min !== undefined && config.max !== undefined && config.min > config.max) {
        errors.push('Min value cannot be greater than max value')
      }
    }

    // 验证可视化组件是否已注册
    if (config.visualizer && !this.visualizers.has(config.visualizer.type)) {
      errors.push(`No visualizer registered for type "${config.visualizer.type}"`)
    }

    return errors
  }

  /**
   * 注册可视化组件
   * @param type 可视化类型
   * @param visualizer 可视化组件
   */
  registerVisualizer(type: VisualizerType, visualizer: Component): void {
    if (this.visualizers.has(type)) {
      console.warn(`[FieldRegistry] Visualizer for type "${type}" is already registered. Overwriting.`)
    }
    this.visualizers.set(type, visualizer)
  }

  /**
   * 获取可视化组件
   * @param type 可视化类型
   * @returns 可视化组件或null
   */
  getVisualizer(type: VisualizerType): Component | null {
    const visualizer = this.visualizers.get(type)
    if (!visualizer) {
      console.warn(`[FieldRegistry] No visualizer found for type "${type}"`)
      return null
    }
    return visualizer
  }

  /**
   * 批量注册可视化组件
   * @param visualizers 可视化组件映射对象
   */
  registerVisualizerBatch(visualizers: Partial<Record<VisualizerType, Component>>): void {
    Object.entries(visualizers).forEach(([type, visualizer]) => {
      if (visualizer) {
        this.registerVisualizer(type as VisualizerType, visualizer)
      }
    })
  }

  /**
   * 检查字段类型是否已注册
   * @param type 字段类型
   * @returns 是否已注册
   */
  hasRenderer(type: FieldType): boolean {
    return this.renderers.has(type)
  }

  /**
   * 检查可视化类型是否已注册
   * @param type 可视化类型
   * @returns 是否已注册
   */
  hasVisualizer(type: VisualizerType): boolean {
    return this.visualizers.has(type)
  }

  /**
   * 获取所有已注册的字段类型
   * @returns 字段类型数组
   */
  getRegisteredTypes(): FieldType[] {
    return Array.from(this.renderers.keys())
  }

  /**
   * 获取所有已注册的可视化类型
   * @returns 可视化类型数组
   */
  getRegisteredVisualizers(): VisualizerType[] {
    return Array.from(this.visualizers.keys())
  }
}
