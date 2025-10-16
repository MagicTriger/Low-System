# 属性面板重构设计文档

## 概述

本文档描述如何将PropertiesPanel.vue中的字段配置提取到基础设施层，实现配置驱动的属性面板系统。

## 架构设计

### 整体架构

```
src/core/renderer/designer/
├── settings/
│   ├── PropertiesPanel.vue          # 属性面板主组件（简化）
│   ├── fields/                      # 字段渲染器（新增）
│   │   ├── FieldRenderer.vue       # 字段渲染器入口
│   │   ├── TextField.vue           # 文本字段
│   │   ├── NumberField.vue         # 数字字段
│   │   ├── ColorField.vue          # 颜色字段
│   │   ├── SelectField.vue         # 选择字段
│   │   ├── SwitchField.vue         # 开关字段
│   │   ├── TextareaField.vue       # 文本域字段
│   │   ├── IconField.vue           # 图标字段
│   │   ├── SizeField.vue           # 尺寸字段
│   │   └── index.ts                # 字段渲染器注册
│   ├── config/                      # 配置系统（新增）
│   │   ├── FieldConfigManager.ts   # 字段配置管理器
│   │   ├── PanelConfigManager.ts   # 面板配置管理器
│   │   ├── types.ts                # 配置类型定义
│   │   └── index.ts                # 配置系统导出
│   └── panels/                      # 面板配置（新增）
│       ├── BasicPanel.ts           # 基础面板配置
│       ├── StylePanel.ts           # 样式面板配置
│       ├── EventPanel.ts           # 事件面板配置
│       └── index.ts                # 面板配置导出
```

## 核心设计

### 1. 字段配置类型定义

```typescript
/**
 * 字段类型
 */
export type FieldType =
  | 'text' // 文本输入
  | 'number' // 数字输入
  | 'color' // 颜色选择器
  | 'select' // 下拉选择
  | 'switch' // 开关
  | 'textarea' // 文本域
  | 'icon' // 图标选择器
  | 'size' // 尺寸编辑器
  | 'slider' // 滑块
  | 'date' // 日期选择器
  | 'custom' // 自定义

/**
 * 字段配置
 */
export interface FieldConfig {
  /** 字段键 */
  key: string
  /** 字段标签 */
  label: string
  /** 字段类型 */
  type: FieldType
  /** 默认值 */
  defaultValue?: any
  /** 占位符 */
  placeholder?: string
  /** 是否必填 */
  required?: boolean
  /** 是否只读 */
  readonly?: boolean
  /** 是否禁用 */
  disabled?: boolean
  /** 验证规则 */
  validation?: ValidationRule[]
  /** 选项（用于select类型） */
  options?: Array<{ label: string; value: any }>
  /** 最小值（用于number类型） */
  min?: number
  /** 最大值（用于number类型） */
  max?: number
  /** 步进值（用于number类型） */
  step?: number
  /** 行数（用于textarea类型） */
  rows?: number
  /** 提示信息 */
  tooltip?: string
  /** 依赖条件 */
  dependsOn?: DependencyCondition
  /** 自定义渲染器组件 */
  customRenderer?: Component
  /** 自定义属性 */
  props?: Record<string, any>
}

/**
 * 验证规则
 */
export interface ValidationRule {
  /** 规则类型 */
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  /** 规则值 */
  value?: any
  /** 错误消息 */
  message: string
  /** 自定义验证函数 */
  validator?: (value: any) => boolean
}

/**
 * 依赖条件
 */
export interface DependencyCondition {
  /** 依赖的字段键 */
  field: string
  /** 条件操作符 */
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'in' | 'notIn'
  /** 条件值 */
  value: any
}

/**
 * 字段分组
 */
export interface FieldGroup {
  /** 分组键 */
  key: string
  /** 分组标题 */
  title: string
  /** 分组图标 */
  icon?: string
  /** 字段列表 */
  fields: FieldConfig[]
  /** 是否可折叠 */
  collapsible?: boolean
  /** 默认是否展开 */
  defaultExpanded?: boolean
}

/**
 * 面板标签页
 */
export interface PanelTab {
  /** 标签页键 */
  key: string
  /** 标签页标题 */
  title: string
  /** 标签页图标 */
  icon?: string
  /** 字段分组 */
  groups: FieldGroup[]
}

/**
 * 面板配置
 */
export interface PanelConfig {
  /** 面板ID */
  id: string
  /** 面板标题 */
  title?: string
  /** 标签页列表 */
  tabs: PanelTab[]
}
```

### 2. 字段配置管理器

```typescript
/**
 * 字段配置管理器
 */
export class FieldConfigManager {
  private fieldConfigs: Map<string, FieldConfig> = new Map()
  private fieldRenderers: Map<FieldType, Component> = new Map()

  /**
   * 注册字段配置
   */
  registerField(config: FieldConfig): void {
    this.fieldConfigs.set(config.key, config)
  }

  /**
   * 批量注册字段配置
   */
  registerFields(configs: FieldConfig[]): void {
    configs.forEach(config => this.registerField(config))
  }

  /**
   * 获取字段配置
   */
  getField(key: string): FieldConfig | null {
    return this.fieldConfigs.get(key) || null
  }

  /**
   * 注册字段渲染器
   */
  registerRenderer(type: FieldType, component: Component): void {
    this.fieldRenderers.set(type, component)
  }

  /**
   * 获取字段渲染器
   */
  getRenderer(type: FieldType): Component | null {
    return this.fieldRenderers.get(type) || null
  }

  /**
   * 验证字段值
   */
  validateField(config: FieldConfig, value: any): ValidationResult {
    if (!config.validation) {
      return { valid: true }
    }

    for (const rule of config.validation) {
      const result = this.validateRule(rule, value)
      if (!result.valid) {
        return result
      }
    }

    return { valid: true }
  }

  /**
   * 验证单个规则
   */
  private validateRule(rule: ValidationRule, value: any): ValidationResult {
    switch (rule.type) {
      case 'required':
        if (!value && value !== 0 && value !== false) {
          return { valid: false, message: rule.message }
        }
        break
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return { valid: false, message: rule.message }
        }
        break
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return { valid: false, message: rule.message }
        }
        break
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return { valid: false, message: rule.message }
        }
        break
      case 'custom':
        if (rule.validator && !rule.validator(value)) {
          return { valid: false, message: rule.message }
        }
        break
    }

    return { valid: true }
  }

  /**
   * 检查依赖条件
   */
  checkDependency(condition: DependencyCondition, values: Record<string, any>): boolean {
    const fieldValue = values[condition.field]

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value
      case 'ne':
        return fieldValue !== condition.value
      case 'gt':
        return fieldValue > condition.value
      case 'lt':
        return fieldValue < condition.value
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue)
      case 'notIn':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue)
      default:
        return true
    }
  }
}

interface ValidationResult {
  valid: boolean
  message?: string
}
```

### 3. 面板配置管理器

```typescript
/**
 * 面板配置管理器
 */
export class PanelConfigManager {
  private panelConfigs: Map<string, PanelConfig> = new Map()

  /**
   * 注册面板配置
   */
  registerPanel(config: PanelConfig): void {
    this.panelConfigs.set(config.id, config)
  }

  /**
   * 获取面板配置
   */
  getPanel(id: string): PanelConfig | null {
    return this.panelConfigs.get(id) || null
  }

  /**
   * 根据组件类型获取面板配置
   */
  getPanelForControl(controlKind: string): PanelConfig | null {
    // 优先查找组件特定配置
    const specificConfig = this.panelConfigs.get(`control-${controlKind}`)
    if (specificConfig) {
      return specificConfig
    }

    // 返回默认配置
    return this.panelConfigs.get('default') || null
  }

  /**
   * 合并面板配置
   */
  mergeConfigs(base: PanelConfig, override: Partial<PanelConfig>): PanelConfig {
    return {
      ...base,
      ...override,
      tabs: override.tabs || base.tabs,
    }
  }
}
```

### 4. 字段渲染器组件

```vue
<!-- FieldRenderer.vue -->
<template>
  <div class="field-renderer" :class="{ 'field-error': hasError }">
    <label v-if="config.label" class="field-label">
      {{ config.label }}
      <span v-if="config.required" class="field-required">*</span>
      <a-tooltip v-if="config.tooltip" :title="config.tooltip">
        <QuestionCircleOutlined class="field-tooltip-icon" />
      </a-tooltip>
    </label>

    <component
      :is="rendererComponent"
      v-model="fieldValue"
      :config="config"
      :disabled="config.disabled"
      :readonly="config.readonly"
      @change="handleChange"
    />

    <div v-if="errorMessage" class="field-error-message">
      {{ errorMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import type { FieldConfig } from '../config/types'
import { getFieldConfigManager } from '../config'

interface Props {
  config: FieldConfig
  modelValue: any
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'change', value: any): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const fieldConfigManager = getFieldConfigManager()

const fieldValue = ref(props.modelValue)
const errorMessage = ref('')

// 获取渲染器组件
const rendererComponent = computed(() => {
  if (props.config.customRenderer) {
    return props.config.customRenderer
  }
  return fieldConfigManager.getRenderer(props.config.type)
})

// 是否有错误
const hasError = computed(() => !!errorMessage.value)

// 监听modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    fieldValue.value = newValue
    validateField()
  }
)

// 处理值变化
function handleChange(value: any) {
  fieldValue.value = value
  emit('update:modelValue', value)
  emit('change', value)
  validateField()
}

// 验证字段
function validateField() {
  const result = fieldConfigManager.validateField(props.config, fieldValue.value)
  errorMessage.value = result.message || ''
}
</script>
```

### 5. 面板配置示例

```typescript
// panels/BasicPanel.ts
import type { PanelTab } from '../config/types'

export const basicPanelTab: PanelTab = {
  key: 'basic',
  title: '基本',
  icon: 'InfoCircleOutlined',
  groups: [
    {
      key: 'basic-info',
      title: '基本信息',
      collapsible: true,
      defaultExpanded: true,
      fields: [
        {
          key: 'id',
          label: '控件ID',
          type: 'text',
          readonly: true,
        },
        {
          key: 'name',
          label: '控件名称',
          type: 'text',
          placeholder: '输入控件名称',
        },
        {
          key: 'permission',
          label: '权限绑定',
          type: 'select',
          placeholder: '选择权限',
          options: [],
        },
      ],
    },
    {
      key: 'data-binding',
      title: '数据绑定',
      collapsible: true,
      defaultExpanded: false,
      fields: [
        {
          key: 'dataSourceId',
          label: '数据源',
          type: 'select',
          placeholder: '选择数据源',
          options: [],
        },
        {
          key: 'bindingField',
          label: '绑定字段',
          type: 'text',
          placeholder: '例如: data.items',
          dependsOn: {
            field: 'dataSourceId',
            operator: 'ne',
            value: '',
          },
        },
      ],
    },
  ],
}
```

## 数据流

### 配置加载流程

```
组件选中
  ↓
获取组件类型
  ↓
查找面板配置
  ↓
加载字段配置
  ↓
渲染字段
```

### 值更新流程

```
用户修改字段
  ↓
字段渲染器触发change事件
  ↓
FieldRenderer验证值
  ↓
触发update:modelValue
  ↓
PropertiesPanel更新控件属性
  ↓
触发控件重新渲染
```

## 扩展性设计

### 1. 自定义字段类型

```typescript
// 注册自定义字段类型
const fieldConfigManager = getFieldConfigManager()

fieldConfigManager.registerRenderer('gradient', GradientPickerField)

// 使用自定义字段
const fieldConfig: FieldConfig = {
  key: 'background',
  label: '背景渐变',
  type: 'gradient',
}
```

### 2. 自定义面板配置

```typescript
// 为特定组件注册自定义面板
const panelConfigManager = getPanelConfigManager()

panelConfigManager.registerPanel({
  id: 'control-button',
  title: '按钮属性',
  tabs: [
    basicPanelTab,
    {
      key: 'button-specific',
      title: '按钮配置',
      groups: [
        {
          key: 'button-props',
          title: '按钮属性',
          fields: [
            {
              key: 'text',
              label: '按钮文字',
              type: 'text',
            },
            {
              key: 'icon',
              label: '图标',
              type: 'icon',
            },
          ],
        },
      ],
    },
  ],
})
```

## 性能优化

### 1. 字段懒加载

只渲染可见的字段，折叠的分组不渲染内部字段。

### 2. 配置缓存

缓存已加载的面板配置，避免重复计算。

### 3. 验证防抖

字段验证使用防抖，避免频繁验证。

## 迁移策略

### 阶段1: 创建基础设施

1. 创建类型定义
2. 实现配置管理器
3. 创建字段渲染器

### 阶段2: 提取配置

1. 提取现有字段配置
2. 转换为新的配置格式
3. 注册到配置管理器

### 阶段3: 重构PropertiesPanel

1. 简化PropertiesPanel组件
2. 使用配置驱动渲染
3. 移除硬编码的字段

### 阶段4: 测试和优化

1. 测试所有字段类型
2. 性能优化
3. 文档更新
