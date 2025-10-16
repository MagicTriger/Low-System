/**
 * 面板系统导出文件
 * 导出所有面板类型定义、注册表和通用面板配置
 */

// 导出类型定义
export * from './types'

// 导出注册表
export { PanelRegistry } from './registry'

// 导出通用面板配置
export { BasicPanel } from './common/BasicPanel'
export { LayoutPanel } from './common/LayoutPanel'
export { StylePanel } from './common/StylePanel'
export { EventPanel } from './common/EventPanel'
