/**
 * 面板类型定义
 * 定义属性面板的分组、配置接口和相关类型
 */

import type { FieldConfig } from '../fields/types'

/**
 * 面板分组枚举
 */
export enum PanelGroup {
  BASIC = 'basic', // 基础属性
  LAYOUT = 'layout', // 布局属性
  STYLE = 'style', // 样式属性
  EVENT = 'event', // 事件属性
  COMPONENT = 'component', // 组件特定属性
}

/**
 * 面板配置接口
 */
export interface PanelConfig {
  group: PanelGroup // 面板分组
  title: string // 面板标题
  icon?: string // 面板图标(Ant Design图标名称)
  collapsible?: boolean // 是否可折叠(默认true)
  defaultExpanded?: boolean // 默认是否展开(默认true)
  fields: FieldConfig[] // 字段列表
  order?: number // 显示顺序(数字越小越靠前)
}

/**
 * 组件面板配置接口
 */
export interface ComponentPanelConfig {
  componentType: string // 组件类型(对应控件的kind)
  panels: PanelConfig[] // 组件特定的面板列表
  extends?: PanelGroup[] // 继承的通用面板分组
}

/**
 * 面板定义接口(用于组件定义中)
 */
export interface PanelDefinition {
  extends?: PanelGroup[] // 继承的通用面板
  custom?: PanelConfig[] // 自定义面板
}
