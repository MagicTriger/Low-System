/**
 * 字段类型定义
 * 定义属性面板中所有字段的类型、配置接口和相关规则
 */

/**
 * 字段类型枚举
 */
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  SWITCH = 'switch',
  TEXTAREA = 'textarea',
  COLOR = 'color',
  SLIDER = 'slider',
  ICON = 'icon',
  SIZE = 'size', // 尺寸字段类型(带单位选择器)
}

/**
 * 字段选项
 * 用于 SELECT 类型字段
 */
export interface FieldOption {
  label: string
  value: any
  disabled?: boolean
}

/**
 * 验证规则类型
 */
export type ValidationRuleType = 'required' | 'min' | 'max' | 'pattern' | 'custom'

/**
 * 验证规则
 */
export interface ValidationRule {
  type: ValidationRuleType
  value?: any
  message: string
  validator?: (value: any) => boolean
}

/**
 * 依赖条件类型
 */
export type DependencyCondition = 'equals' | 'notEquals' | 'includes' | 'custom'

/**
 * 依赖规则
 * 用于控制字段的显示/隐藏
 */
export interface DependencyRule {
  field: string // 依赖的字段键名
  condition: DependencyCondition
  value?: any
  validator?: (fieldValue: any) => boolean
}

/**
 * 字段布局配置
 */
export interface FieldLayout {
  span?: 1 | 2 // 占据列数: 1=半行, 2=整行
  order?: number // 显示顺序
}

/**
 * 可视化组件类型
 */
export type VisualizerType = 'margin' | 'padding' | 'flex' | 'border' | 'font' | 'position' | 'size'

/**
 * 字段可视化配置
 */
export interface FieldVisualizer {
  type: VisualizerType
  interactive?: boolean // 是否支持交互式编辑
  preview?: boolean // 是否显示实时预览
}

/**
 * 字段配置接口
 */
export interface FieldConfig {
  key: string // 字段键名
  label: string // 字段标签
  type: FieldType // 字段类型
  defaultValue?: any // 默认值
  placeholder?: string // 占位符
  options?: FieldOption[] // 选项(用于select)
  min?: number // 最小值(用于number/slider)
  max?: number // 最大值(用于number/slider)
  step?: number // 步长(用于number/slider)
  rows?: number // 行数(用于textarea)
  disabled?: boolean // 是否禁用
  readonly?: boolean // 是否只读
  validation?: ValidationRule[] // 验证规则
  dependency?: DependencyRule // 依赖规则
  tooltip?: string // 提示信息
  layout?: FieldLayout // 布局配置
  visualizer?: FieldVisualizer // 可视化配置
}
