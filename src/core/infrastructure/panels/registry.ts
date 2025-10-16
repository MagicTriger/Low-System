/**
 * 面板注册表
 * 管理通用面板和组件特定面板的注册与获取
 */

import type { PanelGroup, PanelConfig, ComponentPanelConfig } from './types'

/**
 * 面板注册表类
 */
export class PanelRegistry {
  private commonPanels: Map<PanelGroup, PanelConfig> = new Map()
  private componentPanels: Map<string, ComponentPanelConfig> = new Map()

  /**
   * 注册通用面板
   * @param panel 面板配置
   */
  registerCommonPanel(panel: PanelConfig): void {
    if (this.commonPanels.has(panel.group)) {
      console.warn(`[PanelRegistry] Common panel for group "${panel.group}" is already registered. Overwriting.`)
    }
    this.commonPanels.set(panel.group, panel)
  }

  /**
   * 批量注册通用面板
   * @param panels 面板配置数组
   */
  registerCommonPanelBatch(panels: PanelConfig[]): void {
    panels.forEach(panel => this.registerCommonPanel(panel))
  }

  /**
   * 注册组件特定面板
   * @param config 组件面板配置
   */
  registerComponentPanel(config: ComponentPanelConfig): void {
    if (this.componentPanels.has(config.componentType)) {
      console.warn(`[PanelRegistry] Component panel for "${config.componentType}" is already registered. Overwriting.`)
    }
    this.componentPanels.set(config.componentType, config)
  }

  /**
   * 获取组件的所有面板配置
   * @param componentType 组件类型
   * @returns 面板配置数组
   */
  getPanelsForComponent(componentType: string): PanelConfig[] {
    return this.mergePanels(componentType)
  }

  /**
   * 合并通用面板和组件特定面板
   * @param componentType 组件类型
   * @returns 合并后的面板配置数组
   */
  mergePanels(componentType: string): PanelConfig[] {
    const componentConfig = this.componentPanels.get(componentType)
    const panels: PanelConfig[] = []

    // 如果组件配置存在且指定了继承的通用面板
    if (componentConfig?.extends) {
      componentConfig.extends.forEach(group => {
        const commonPanel = this.commonPanels.get(group)
        if (commonPanel) {
          panels.push(commonPanel)
        } else {
          console.warn(`[PanelRegistry] Common panel "${group}" not found for component "${componentType}"`)
        }
      })
    } else {
      // 如果没有指定继承,默认继承所有通用面板
      this.commonPanels.forEach(panel => {
        panels.push(panel)
      })
    }

    // 添加组件特定面板
    if (componentConfig?.panels) {
      panels.push(...componentConfig.panels)
    }

    // 按order排序
    return panels.sort((a, b) => (a.order || 999) - (b.order || 999))
  }

  /**
   * 获取通用面板
   * @param group 面板分组
   * @returns 面板配置或undefined
   */
  getCommonPanel(group: PanelGroup): PanelConfig | undefined {
    return this.commonPanels.get(group)
  }

  /**
   * 获取组件面板配置
   * @param componentType 组件类型
   * @returns 组件面板配置或undefined
   */
  getComponentPanelConfig(componentType: string): ComponentPanelConfig | undefined {
    return this.componentPanels.get(componentType)
  }

  /**
   * 检查组件是否已注册面板
   * @param componentType 组件类型
   * @returns 是否已注册
   */
  hasComponentPanel(componentType: string): boolean {
    return this.componentPanels.has(componentType)
  }

  /**
   * 获取所有已注册的组件类型
   * @returns 组件类型数组
   */
  getRegisteredComponents(): string[] {
    return Array.from(this.componentPanels.keys())
  }

  /**
   * 获取所有已注册的通用面板分组
   * @returns 面板分组数组
   */
  getRegisteredCommonPanels(): PanelGroup[] {
    return Array.from(this.commonPanels.keys())
  }
}
