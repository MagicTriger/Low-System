/**
 * 字段系统导出文件
 * 导出所有字段类型定义、注册表和渲染器
 */

// 导出类型定义
export * from './types'

// 导出注册表
export { FieldRegistry } from './registry'

// 导出字段渲染器
export { default as TextField } from './renderers/TextField.vue'
export { default as NumberField } from './renderers/NumberField.vue'
export { default as SelectField } from './renderers/SelectField.vue'
export { default as SwitchField } from './renderers/SwitchField.vue'
export { default as TextareaField } from './renderers/TextareaField.vue'
export { default as ColorField } from './renderers/ColorField.vue'
export { default as SliderField } from './renderers/SliderField.vue'
export { default as IconField } from './renderers/IconField.vue'
