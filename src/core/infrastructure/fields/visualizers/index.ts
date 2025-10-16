/**
 * 可视化组件导出文件
 * 导出所有可视化组件和注册映射
 */

import type { VisualizerType } from '../types'
import type { Component } from 'vue'

// 导出可视化组件
export { default as MarginPaddingVisualizer } from './MarginPaddingVisualizer.vue'
export { default as FlexVisualizer } from './FlexVisualizer.vue'
export { default as FontSizeVisualizer } from './FontSizeVisualizer.vue'
export { default as BorderVisualizer } from './BorderVisualizer.vue'
export { default as PositionVisualizer } from './PositionVisualizer.vue'
export { default as SizeVisualizer } from './SizeVisualizer.vue'

// 导入组件用于注册映射
import MarginPaddingVisualizer from './MarginPaddingVisualizer.vue'
import FlexVisualizer from './FlexVisualizer.vue'
import FontSizeVisualizer from './FontSizeVisualizer.vue'
import BorderVisualizer from './BorderVisualizer.vue'
import PositionVisualizer from './PositionVisualizer.vue'
import SizeVisualizer from './SizeVisualizer.vue'

/**
 * 可视化组件注册映射
 * 用于批量注册到FieldRegistry
 */
export const visualizerComponents: Partial<Record<VisualizerType, Component>> = {
  margin: MarginPaddingVisualizer,
  padding: MarginPaddingVisualizer,
  flex: FlexVisualizer,
  font: FontSizeVisualizer,
  border: BorderVisualizer,
  position: PositionVisualizer,
  size: SizeVisualizer,
}

/**
 * 获取可视化组件
 * @param type 可视化类型
 * @returns 可视化组件或undefined
 */
export function getVisualizerComponent(type: VisualizerType): Component | undefined {
  return visualizerComponents[type]
}
