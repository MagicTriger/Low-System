# 属性面板系统重新设计 - 设计文档

## 概述

本设计文档描述了全新的属性面板系统架构,该系统将:

- 清理所有旧的属性配置代码
- 在基础设施层建立统一的字段系统
- 实现通用配置面板和组件特定配置面板的分离
- 提供清晰、可维护、可扩展的架构

## 架构设计

### 整体架构

```
src/core/infrastructure/
├── fields/                    # 字段基础设施
│   ├── types.ts              # 字段类型定义
│   ├── registry.ts           # 字段注册表
│   ├── renderers/            # 字段渲染器
│   │   ├── TextField.vue
│   │   ├── NumberField.vue
│   │   ├── SelectField.vue
│   │   ├── SwitchField.vue
│   │   ├── TextareaField.vue
│   │   ├── ColorField.vue
│   │   ├── SliderField.vue
│   │   └── IconField.vue
│   └── index.ts
├── panels/                    # 面板配置
│   ├── types.ts              # 面板类型定义
│   ├── common/               # 通用面板配置
│   │   ├── BasicPanel.ts     # 基础属性
│   │   ├── LayoutPanel.ts    # 布局属性
│   │   ├── StylePanel.ts     # 样式属性
│   │   └── EventPanel.ts     # 事件属性
│   ├── registry.ts           # 面板注册表
│   └── index.ts
└── services/
    └── PropertyPanelService.ts  # 属性面板服务
```

## 核心组件设计

### 1. 字段系统 (Fields Infrastructure)

#### 1.1 字段类型定义 (`infrastructure/fields/types.ts`)

```typescript
// 字段类型枚举
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  SWITCH = 'switch',
  TEXTAREA = 'textarea',
  COLOR = 'color',
  SLIDER = 'slider',
  ICON = 'icon',
}

// 字段配置接口
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
}

// 字段选项
export interface FieldOption {
  label: string
  value: any
  disabled?: boolean
}

// 验证规则
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
  validator?: (value: any) => boolean
}

// 依赖规则
export interface DependencyRule {
  field: string // 依赖的字段
  condition: 'equals' | 'notEquals' | 'includes' | 'custom'
  value?: any
  validator?: (fieldValue: any) => boolean
}
```

#### 1.2 字段注册表 (`infrastructure/fields/registry.ts`)

```typescript
// 字段渲染器注册表
class FieldRegistry {
  private renderers: Map<FieldType, Component> = new Map()

  // 注册字段渲染器
  register(type: FieldType, renderer: Component): void

  // 获取字段渲染器
  getRenderer(type: FieldType): Component | null

  // 批量注册
  registerBatch(renderers: Record<FieldType, Component>): void

  // 验证字段配置
  validateConfig(config: FieldConfig): string[]
}
```

#### 1.3 字段渲染器组件

所有字段渲染器遵循统一接口:

```typescript
// 字段渲染器Props
interface FieldRendererProps {
  config: FieldConfig // 字段配置
  modelValue: any // 字段值
  errors?: string[] // 验证错误
}

// 字段渲染器Emits
interface FieldRendererEmits {
  'update:modelValue': (value: any) => void
  validate: (errors: string[]) => void
}
```

### 2. 面板系统 (Panels Infrastructure)

#### 2.1 面板类型定义 (`infrastructure/panels/types.ts`)

```typescript
// 面板分组
export enum PanelGroup {
  BASIC = 'basic', // 基础属性
  LAYOUT = 'layout', // 布局属性
  STYLE = 'style', // 样式属性
  EVENT = 'event', // 事件属性
  COMPONENT = 'component', // 组件特定属性
}

// 面板配置
export interface PanelConfig {
  group: PanelGroup // 面板分组
  title: string // 面板标题
  icon?: string // 面板图标
  collapsible?: boolean // 是否可折叠
  defaultExpanded?: boolean // 默认展开
  fields: FieldConfig[] // 字段列表
  order?: number // 显示顺序
}

// 组件面板配置
export interface ComponentPanelConfig {
  componentType: string // 组件类型
  panels: PanelConfig[] // 面板列表
  extends?: string[] // 继承的通用面板
}
```

#### 2.2 通用面板配置

##### BasicPanel - 基础属性面板

```typescript
export const BasicPanel: PanelConfig = {
  group: PanelGroup.BASIC,
  title: '基础属性',
  icon: 'InfoCircleOutlined',
  defaultExpanded: true,
  fields: [
    {
      key: 'id',
      label: 'ID',
      type: FieldType.TEXT,
      readonly: true,
    },
    {
      key: 'name',
      label: '名称',
      type: FieldType.TEXT,
      placeholder: '请输入组件名称',
    },
    {
      key: 'visible',
      label: '可见',
      type: FieldType.SWITCH,
      defaultValue: true,
    },
    {
      key: 'disabled',
      label: '禁用',
      type: FieldType.SWITCH,
      defaultValue: false,
    },
  ],
}
```

##### LayoutPanel - 布局属性面板

```typescript
export const LayoutPanel: PanelConfig = {
  group: PanelGroup.LAYOUT,
  title: '布局属性',
  icon: 'LayoutOutlined',
  fields: [
    {
      key: 'width',
      label: '宽度',
      type: FieldType.TEXT,
      placeholder: 'auto, 100px, 50%',
    },
    {
      key: 'height',
      label: '高度',
      type: FieldType.TEXT,
      placeholder: 'auto, 100px, 50%',
    },
    {
      key: 'margin',
      label: '外边距',
      type: FieldType.TEXT,
      placeholder: '0, 10px, 10px 20px',
    },
    {
      key: 'padding',
      label: '内边距',
      type: FieldType.TEXT,
      placeholder: '0, 10px, 10px 20px',
    },
    {
      key: 'position',
      label: '定位',
      type: FieldType.SELECT,
      options: [
        { label: '静态', value: 'static' },
        { label: '相对', value: 'relative' },
        { label: '绝对', value: 'absolute' },
        { label: '固定', value: 'fixed' },
        { label: '粘性', value: 'sticky' },
      ],
    },
  ],
}
```

##### StylePanel - 样式属性面板

```typescript
export const StylePanel: PanelConfig = {
  group: PanelGroup.STYLE,
  title: '样式属性',
  icon: 'BgColorsOutlined',
  fields: [
    {
      key: 'backgroundColor',
      label: '背景颜色',
      type: FieldType.COLOR,
    },
    {
      key: 'color',
      label: '文字颜色',
      type: FieldType.COLOR,
    },
    {
      key: 'fontSize',
      label: '字体大小',
      type: FieldType.NUMBER,
      min: 12,
      max: 72,
      defaultValue: 14,
    },
    {
      key: 'border',
      label: '边框',
      type: FieldType.TEXT,
      placeholder: '1px solid #ccc',
    },
    {
      key: 'borderRadius',
      label: '圆角',
      type: FieldType.TEXT,
      placeholder: '0, 4px, 50%',
    },
    {
      key: 'opacity',
      label: '透明度',
      type: FieldType.SLIDER,
      min: 0,
      max: 1,
      step: 0.1,
      defaultValue: 1,
    },
  ],
}
```

##### EventPanel - 事件属性面板

```typescript
export const EventPanel: PanelConfig = {
  group: PanelGroup.EVENT,
  title: '事件配置',
  icon: 'ThunderboltOutlined',
  fields: [
    {
      key: 'onClick',
      label: '点击事件',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 点击时执行的代码',
    },
    {
      key: 'onMouseEnter',
      label: '鼠标进入',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 鼠标进入时执行的代码',
    },
    {
      key: 'onMouseLeave',
      label: '鼠标离开',
      type: FieldType.TEXTAREA,
      rows: 3,
      placeholder: '// 鼠标离开时执行的代码',
    },
  ],
}
```

#### 2.3 面板注册表 (`infrastructure/panels/registry.ts`)

```typescript
class PanelRegistry {
  private commonPanels: Map<PanelGroup, PanelConfig> = new Map()
  private componentPanels: Map<string, ComponentPanelConfig> = new Map()

  // 注册通用面板
  registerCommonPanel(panel: PanelConfig): void

  // 注册组件特定面板
  registerComponentPanel(config: ComponentPanelConfig): void

  // 获取组件的所有面板配置
  getPanelsForComponent(componentType: string): PanelConfig[]

  // 合并通用面板和组件特定面板
  mergePanels(componentType: string): PanelConfig[]
}
```

### 3. 属性面板服务 (PropertyPanelService)

#### 3.1 服务接口

```typescript
export class PropertyPanelService {
  private fieldRegistry: FieldRegistry
  private panelRegistry: PanelRegistry

  constructor() {
    this.fieldRegistry = new FieldRegistry()
    this.panelRegistry = new PanelRegistry()
  }

  // 初始化服务
  async initialize(): Promise<void>

  // 字段相关
  registerField(type: FieldType, renderer: Component): void
  getFieldRenderer(type: FieldType): Component | null

  // 面板相关
  registerCommonPanel(panel: PanelConfig): void
  registerComponentPanel(config: ComponentPanelConfig): void
  getPanelsForComponent(componentType: string): PanelConfig[]

  // 验证
  validateFieldValue(config: FieldConfig, value: any): string[]
  checkDependency(rule: DependencyRule, fieldValue: any): boolean
}
```

#### 3.2 服务集成

服务将注册到DI容器:

```typescript
// 在 src/core/index.ts 中
import { PropertyPanelService } from '@core/infrastructure/services/PropertyPanelService'

export async function AppInit(...) {
  // ... 其他初始化代码

  // 初始化属性面板服务
  const propertyPanelService = new PropertyPanelService()
  await propertyPanelService.initialize()

  // 注册到全局
  app.provide('propertyPanelService', propertyPanelService)
}
```

### 4. 属性面板UI组件

#### 4.1 PropertiesPanel.vue

```vue
<template>
  <div class="properties-panel">
    <div v-if="!selectedComponent" class="empty-state">
      <EmptyOutlined />
      <p>请选择一个组件</p>
    </div>

    <div v-else class="panel-content">
      <PanelGroup v-for="panel in panels" :key="panel.group" :config="panel" :values="componentProps" @update="handleUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PropertyPanelService } from '@core/infrastructure/services/PropertyPanelService'

const propertyPanelService = inject<PropertyPanelService>('propertyPanelService')
const selectedComponent = computed(() => /* 从状态获取 */)

const panels = computed(() => {
  if (!selectedComponent.value) return []
  return propertyPanelService.getPanelsForComponent(selectedComponent.value.type)
})

const componentProps = computed(() => selectedComponent.value?.props || {})

function handleUpdate(key: string, value: any) {
  // 更新组件属性
}
</script>
```

#### 4.2 PanelGroup.vue

```vue
<template>
  <div class="panel-group" :class="{ collapsed: !expanded }">
    <div class="panel-header" @click="toggleExpanded">
      <component :is="config.icon" v-if="config.icon" class="panel-icon" />
      <span class="panel-title">{{ config.title }}</span>
      <DownOutlined class="collapse-icon" :class="{ rotated: expanded }" />
    </div>

    <div v-show="expanded" class="panel-body">
      <FieldRenderer
        v-for="field in visibleFields"
        :key="field.key"
        :config="field"
        :model-value="values[field.key]"
        @update:model-value="handleFieldUpdate(field.key, $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { PanelConfig, FieldConfig } from '@core/infrastructure/panels/types'

const props = defineProps<{
  config: PanelConfig
  values: Record<string, any>
}>()

const emit = defineEmits<{
  update: [key: string, value: any]
}>()

const expanded = ref(props.config.defaultExpanded ?? true)

const visibleFields = computed(() => {
  return props.config.fields.filter(field => {
    if (!field.dependency) return true
    return checkDependency(field.dependency, props.values[field.dependency.field])
  })
})

function toggleExpanded() {
  if (props.config.collapsible !== false) {
    expanded.value = !expanded.value
  }
}

function handleFieldUpdate(key: string, value: any) {
  emit('update', key, value)
}

function checkDependency(rule: DependencyRule, fieldValue: any): boolean {
  // 依赖检查逻辑
}
</script>
```

#### 4.3 FieldRenderer.vue

```vue
<template>
  <div class="field-renderer" :class="{ error: hasError, disabled: config.disabled }">
    <label class="field-label">
      {{ config.label }}
      <QuestionCircleOutlined v-if="config.tooltip" :title="config.tooltip" />
    </label>

    <component :is="rendererComponent" v-model="fieldValue" :config="config" :errors="errors" @validate="handleValidate" />

    <div v-if="hasError" class="field-error">
      {{ errors[0] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import type { PropertyPanelService } from '@core/infrastructure/services/PropertyPanelService'
import type { FieldConfig } from '@core/infrastructure/fields/types'

const props = defineProps<{
  config: FieldConfig
  modelValue: any
  errors?: string[]
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
  validate: [errors: string[]]
}>()

const propertyPanelService = inject<PropertyPanelService>('propertyPanelService')

const rendererComponent = computed(() => {
  return propertyPanelService.getFieldRenderer(props.config.type)
})

const fieldValue = computed({
  get: () => props.modelValue,
  set: value => {
    emit('update:modelValue', value)
    validate(value)
  },
})

const errors = ref<string[]>(props.errors || [])
const hasError = computed(() => errors.value.length > 0)

function validate(value: any) {
  if (!props.config.validation) {
    errors.value = []
    return
  }

  errors.value = propertyPanelService.validateFieldValue(props.config, value)
  emit('validate', errors.value)
}

function handleValidate(validationErrors: string[]) {
  errors.value = validationErrors
  emit('validate', validationErrors)
}
</script>
```

### 5. 组件定义集成

#### 5.1 组件定义扩展

组件定义中添加 `panels` 配置:

```typescript
// 示例: Button组件定义
export const ButtonDefinition: BaseControlDefinition = {
  kind: 'button',
  kindName: '按钮',
  type: ControlType.Common,
  icon: 'button',
  component: ButtonControl,

  // 组件特定面板配置
  panels: {
    extends: ['basic', 'layout', 'style', 'event'], // 继承通用面板
    custom: [
      {
        group: PanelGroup.COMPONENT,
        title: '按钮属性',
        icon: 'SettingOutlined',
        fields: [
          {
            key: 'text',
            label: '按钮文本',
            type: FieldType.TEXT,
            defaultValue: '按钮',
            validation: [{ type: 'required', message: '按钮文本不能为空' }],
          },
          {
            key: 'type',
            label: '按钮类型',
            type: FieldType.SELECT,
            defaultValue: 'primary',
            options: [
              { label: '主要', value: 'primary' },
              { label: '默认', value: 'default' },
              { label: '虚线', value: 'dashed' },
              { label: '文本', value: 'text' },
              { label: '链接', value: 'link' },
            ],
          },
          {
            key: 'size',
            label: '按钮大小',
            type: FieldType.SELECT,
            defaultValue: 'middle',
            options: [
              { label: '大', value: 'large' },
              { label: '中', value: 'middle' },
              { label: '小', value: 'small' },
            ],
          },
          {
            key: 'icon',
            label: '图标',
            type: FieldType.ICON,
          },
          {
            key: 'danger',
            label: '危险按钮',
            type: FieldType.SWITCH,
            defaultValue: false,
          },
          {
            key: 'ghost',
            label: '幽灵按钮',
            type: FieldType.SWITCH,
            defaultValue: false,
            dependency: {
              field: 'type',
              condition: 'notEquals',
              value: 'text',
            },
          },
        ],
      },
    ],
  },
}
```

#### 5.2 注册流程

```typescript
// 在控件注册时自动注册面板配置
export function registerControlDefinition(definition: BaseControlDefinition): void {
  // 注册控件定义
  ControlDefinitions[definition.kind] = definition

  // 如果有面板配置,注册到PropertyPanelService
  if (definition.panels) {
    const propertyPanelService = getPropertyPanelService()
    propertyPanelService.registerComponentPanel({
      componentType: definition.kind,
      panels: definition.panels.custom || [],
      extends: definition.panels.extends || [],
    })
  }
}
```

## 数据流设计

### 1. 属性读取流程

```
用户选中组件
  ↓
PropertiesPanel 获取组件类型
  ↓
PropertyPanelService.getPanelsForComponent(type)
  ↓
PanelRegistry 合并通用面板和组件特定面板
  ↓
返回完整的面板配置列表
  ↓
PropertiesPanel 渲染面板
  ↓
PanelGroup 渲染字段
  ↓
FieldRenderer 加载对应的字段渲染器
  ↓
显示当前属性值
```

### 2. 属性更新流程

```
用户修改字段值
  ↓
字段渲染器触发 update:modelValue
  ↓
FieldRenderer 接收并验证
  ↓
PropertyPanelService.validateFieldValue()
  ↓
验证通过 → PanelGroup 接收更新
  ↓
PropertiesPanel 触发 update 事件
  ↓
更新状态管理中的组件属性
  ↓
组件重新渲染
```

### 3. 依赖检查流程

```
字段值变化
  ↓
PanelGroup 重新计算 visibleFields
  ↓
遍历所有字段的 dependency 配置
  ↓
PropertyPanelService.checkDependency()
  ↓
根据依赖字段的值判断是否显示
  ↓
更新字段可见性
```

## 错误处理

### 1. 字段验证错误

- 在字段渲染器中显示错误提示
- 错误信息显示在字段下方
- 字段边框变红表示错误状态
- 阻止无效值提交

### 2. 渲染器缺失错误

- 如果字段类型没有对应的渲染器,显示警告
- 降级为文本输入框
- 记录错误日志

### 3. 配置错误

- 验证面板配置的完整性
- 验证字段配置的有效性
- 在开发环境显示详细错误信息
- 在生产环境记录错误日志

## 性能优化

### 1. 懒加载

- 字段渲染器按需加载
- 使用动态import加载渲染器组件
- 面板折叠时不渲染内部字段

### 2. 缓存

- 缓存面板配置合并结果
- 缓存字段验证结果
- 使用computed缓存计算结果

### 3. 防抖

- 文本输入字段使用防抖
- 滑块字段使用防抖
- 减少频繁的状态更新

### 4. 虚拟滚动

- 当字段数量超过50个时启用虚拟滚动
- 只渲染可见区域的字段
- 提升大量字段时的性能

## 测试策略

### 1. 单元测试

- 测试FieldRegistry的注册和获取
- 测试PanelRegistry的合并逻辑
- 测试验证规则的执行
- 测试依赖规则的判断

### 2. 组件测试

- 测试字段渲染器的输入输出
- 测试PanelGroup的展开折叠
- 测试FieldRenderer的验证显示
- 测试PropertiesPanel的整体功能

### 3. 集成测试

- 测试完整的属性编辑流程
- 测试组件定义的注册流程
- 测试面板配置的合并
- 测试与状态管理的集成

## 迁移策略

### 1. 清理阶段

- 删除旧的properties目录
- 删除旧的PropertyService
- 删除旧的PropertyPlugin
- 删除控件定义中的settings字段

### 2. 实现阶段

- 创建新的infrastructure目录结构
- 实现字段系统
- 实现面板系统
- 实现PropertyPanelService

### 3. 集成阶段

- 更新PropertiesPanel组件
- 更新控件定义
- 注册通用面板
- 注册字段渲染器

### 4. 测试阶段

- 验证所有组件的属性面板
- 验证字段验证功能
- 验证依赖显示功能
- 性能测试

## 扩展性设计

### 1. 自定义字段类型

开发者可以注册自定义字段类型:

```typescript
// 注册自定义字段
propertyPanelService.registerField(
  'custom-field' as FieldType,
  CustomFieldRenderer
)

// 在组件定义中使用
{
  key: 'customProp',
  label: '自定义属性',
  type: 'custom-field' as FieldType,
}
```

### 2. 自定义验证规则

```typescript
{
  key: 'email',
  label: '邮箱',
  type: FieldType.TEXT,
  validation: [
    {
      type: 'custom',
      message: '请输入有效的邮箱地址',
      validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }
  ]
}
```

### 3. 自定义依赖规则

```typescript
{
  key: 'advancedOptions',
  label: '高级选项',
  type: FieldType.TEXTAREA,
  dependency: {
    field: 'mode',
    condition: 'custom',
    validator: (modeValue) => modeValue === 'advanced' || modeValue === 'expert'
  }
}
```

## 文档要求

### 1. API文档

- 所有公共接口的TypeScript类型定义
- 详细的参数说明和返回值说明
- 使用示例

### 2. 使用指南

- 如何定义组件面板配置
- 如何使用内置字段类型
- 如何创建自定义字段类型
- 如何配置验证和依赖规则

### 3. 迁移指南

- 从旧系统迁移到新系统的步骤
- 配置转换对照表
- 常见问题解答

## UI/UX 增强设计

### 1. 可视化配置图案

为样式相关的配置字段添加可视化图案,提升用户体验:

#### 1.1 字段可视化配置

```typescript
export interface FieldConfig {
  // ... 现有配置
  visualizer?: FieldVisualizer // 可视化配置
}

export interface FieldVisualizer {
  type: 'margin' | 'padding' | 'flex' | 'border' | 'font' | 'position' | 'size'
  interactive?: boolean // 是否支持交互式编辑
  preview?: boolean // 是否显示实时预览
}
```

#### 1.2 内外边距可视化 (Margin/Padding Visualizer)

```
┌─────────────────────────────┐
│  Margin (外边距)             │
│  ┌───┬───────────┬───┐      │
│  │ T │    10px   │   │      │
│  ├───┼───────────┼───┤      │
│  │ L │  Padding  │ R │      │
│  │10 │  ┌─────┐  │10 │      │
│  │px │  │     │  │px │      │
│  │   │  └─────┘  │   │      │
│  ├───┼───────────┼───┤      │
│  │   │    10px   │ B │      │
│  └───┴───────────┴───┘      │
└─────────────────────────────┘
```

实现组件: `MarginPaddingVisualizer.vue`

#### 1.3 Flex布局可视化 (Flex Visualizer)

```
┌─────────────────────────────┐
│  Flex Direction              │
│  [→] [←] [↓] [↑]            │
│                              │
│  Justify Content             │
│  [⊣  ] [  ⊢] [  ⊣⊢  ]      │
│  [⊣ ⊢] [⊣  ⊢] [⊣   ⊢]      │
│                              │
│  Align Items                 │
│  [⊤] [⊥] [⊣] [⊢] [↕]       │
└─────────────────────────────┘
```

实现组件: `FlexVisualizer.vue`

#### 1.4 字体大小可视化 (Font Size Visualizer)

```
┌─────────────────────────────┐
│  Font Size: 14px             │
│  ────────────────────        │
│  12  Aa                      │
│  14  Aa  ← 当前              │
│  16  Aa                      │
│  18  Aa                      │
│  24  Aa                      │
└─────────────────────────────┘
```

实现组件: `FontSizeVisualizer.vue`

#### 1.5 边框可视化 (Border Visualizer)

```
┌─────────────────────────────┐
│  Border                      │
│  ┌─────────────────┐         │
│  │  Width: 1px     │         │
│  │  Style: ──────  │         │
│  │  Color: ■       │         │
│  │  Radius: ⌜ ⌝    │         │
│  └─────────────────┘         │
│  Preview: ┌────────┐         │
│           │        │         │
│           └────────┘         │
└─────────────────────────────┘
```

实现组件: `BorderVisualizer.vue`

#### 1.6 定位可视化 (Position Visualizer)

```
┌─────────────────────────────┐
│  Position                    │
│  ┌─────────────────┐         │
│  │     ↑ Top       │         │
│  │  ← Left  Right→ │         │
│  │    ↓ Bottom     │         │
│  └─────────────────┘         │
│  [Static] [Relative]         │
│  [Absolute] [Fixed]          │
└─────────────────────────────┘
```

实现组件: `PositionVisualizer.vue`

#### 1.7 尺寸可视化 (Size Visualizer)

```
┌─────────────────────────────┐
│  Size                        │
│  Width:  [100px] [%] [auto]  │
│  Height: [100px] [%] [auto]  │
│                              │
│  Preview:                    │
│  ┌──────────┐                │
│  │  100x100 │                │
│  └──────────┘                │
└─────────────────────────────┘
```

实现组件: `SizeVisualizer.vue`

### 2. 双列布局设计

#### 2.1 布局配置

```typescript
export interface FieldConfig {
  // ... 现有配置
  layout?: FieldLayout // 布局配置
}

export interface FieldLayout {
  span?: 1 | 2 // 占据列数: 1=半行, 2=整行
  order?: number // 显示顺序
}
```

#### 2.2 布局规则

- 默认情况下,字段占据半行(span=1),一行显示两个字段
- 特殊字段(如textarea、可视化编辑器)占据整行(span=2)
- 自动处理奇数个字段的情况

#### 2.3 PanelGroup 布局实现

```vue
<template>
  <div class="panel-body">
    <div class="fields-grid">
      <div
        v-for="field in visibleFields"
        :key="field.key"
        class="field-wrapper"
        :class="{
          'span-1': (field.layout?.span || 1) === 1,
          'span-2': (field.layout?.span || 2) === 2,
        }"
      >
        <FieldRenderer :config="field" :model-value="values[field.key]" @update:model-value="handleFieldUpdate(field.key, $event)" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
  padding: 12px;
}

.field-wrapper.span-1 {
  grid-column: span 1;
}

.field-wrapper.span-2 {
  grid-column: span 2;
}
</style>
```

#### 2.4 字段布局示例

```typescript
// 布局面板配置 - 使用双列布局
export const LayoutPanel: PanelConfig = {
  group: PanelGroup.LAYOUT,
  title: '布局属性',
  icon: 'LayoutOutlined',
  fields: [
    {
      key: 'width',
      label: '宽度',
      type: FieldType.TEXT,
      layout: { span: 1 }, // 占半行
    },
    {
      key: 'height',
      label: '高度',
      type: FieldType.TEXT,
      layout: { span: 1 }, // 占半行
    },
    {
      key: 'margin',
      label: '外边距',
      type: FieldType.TEXT,
      layout: { span: 2 }, // 占整行(因为有可视化编辑器)
      visualizer: {
        type: 'margin',
        interactive: true,
        preview: true,
      },
    },
    {
      key: 'padding',
      label: '内边距',
      type: FieldType.TEXT,
      layout: { span: 2 }, // 占整行(因为有可视化编辑器)
      visualizer: {
        type: 'padding',
        interactive: true,
        preview: true,
      },
    },
    {
      key: 'position',
      label: '定位',
      type: FieldType.SELECT,
      layout: { span: 1 }, // 占半行
      options: [
        { label: '静态', value: 'static' },
        { label: '相对', value: 'relative' },
        { label: '绝对', value: 'absolute' },
        { label: '固定', value: 'fixed' },
      ],
    },
    {
      key: 'zIndex',
      label: 'Z轴层级',
      type: FieldType.NUMBER,
      layout: { span: 1 }, // 占半行
    },
  ],
}

// 样式面板配置 - 使用双列布局和可视化
export const StylePanel: PanelConfig = {
  group: PanelGroup.STYLE,
  title: '样式属性',
  icon: 'BgColorsOutlined',
  fields: [
    {
      key: 'backgroundColor',
      label: '背景色',
      type: FieldType.COLOR,
      layout: { span: 1 },
    },
    {
      key: 'color',
      label: '文字色',
      type: FieldType.COLOR,
      layout: { span: 1 },
    },
    {
      key: 'fontSize',
      label: '字体大小',
      type: FieldType.NUMBER,
      layout: { span: 1 },
      visualizer: {
        type: 'font',
        preview: true,
      },
    },
    {
      key: 'fontWeight',
      label: '字体粗细',
      type: FieldType.SELECT,
      layout: { span: 1 },
      options: [
        { label: '正常', value: 'normal' },
        { label: '粗体', value: 'bold' },
        { label: '100', value: '100' },
        { label: '400', value: '400' },
        { label: '700', value: '700' },
      ],
    },
    {
      key: 'border',
      label: '边框',
      type: FieldType.TEXT,
      layout: { span: 2 }, // 占整行(因为有可视化编辑器)
      visualizer: {
        type: 'border',
        interactive: true,
        preview: true,
      },
    },
    {
      key: 'borderRadius',
      label: '圆角',
      type: FieldType.TEXT,
      layout: { span: 1 },
    },
    {
      key: 'opacity',
      label: '透明度',
      type: FieldType.SLIDER,
      layout: { span: 1 },
      min: 0,
      max: 1,
      step: 0.1,
    },
  ],
}
```

### 3. 可视化组件实现

#### 3.1 目录结构

```
src/core/infrastructure/fields/
├── visualizers/
│   ├── MarginPaddingVisualizer.vue
│   ├── FlexVisualizer.vue
│   ├── FontSizeVisualizer.vue
│   ├── BorderVisualizer.vue
│   ├── PositionVisualizer.vue
│   ├── SizeVisualizer.vue
│   └── index.ts
```

#### 3.2 FieldRenderer 集成可视化

```vue
<template>
  <div class="field-renderer" :class="{ error: hasError, disabled: config.disabled }">
    <label class="field-label">
      {{ config.label }}
      <QuestionCircleOutlined v-if="config.tooltip" :title="config.tooltip" />
    </label>

    <div class="field-content">
      <!-- 主输入控件 -->
      <component
        :is="rendererComponent"
        v-model="fieldValue"
        :config="config"
        :errors="errors"
        class="field-input"
        @validate="handleValidate"
      />

      <!-- 可视化组件 -->
      <component v-if="visualizerComponent" :is="visualizerComponent" v-model="fieldValue" :config="config" class="field-visualizer" />
    </div>

    <div v-if="hasError" class="field-error">
      {{ errors[0] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { PropertyPanelService } from '@core/infrastructure/services/PropertyPanelService'

const props = defineProps<{
  config: FieldConfig
  modelValue: any
  errors?: string[]
}>()

const propertyPanelService = inject<PropertyPanelService>('propertyPanelService')

const rendererComponent = computed(() => {
  return propertyPanelService.getFieldRenderer(props.config.type)
})

const visualizerComponent = computed(() => {
  if (!props.config.visualizer) return null
  return propertyPanelService.getVisualizer(props.config.visualizer.type)
})

// ... 其他逻辑
</script>

<style scoped>
.field-content {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.field-input {
  flex: 1;
  min-width: 0;
}

.field-visualizer {
  flex-shrink: 0;
}

/* 当字段占整行时,可视化组件显示在下方 */
.field-wrapper.span-2 .field-content {
  flex-direction: column;
}

.field-wrapper.span-2 .field-visualizer {
  width: 100%;
}
</style>
```

#### 3.3 MarginPaddingVisualizer 实现示例

```vue
<template>
  <div class="margin-padding-visualizer">
    <div class="visualizer-box">
      <!-- Margin -->
      <div class="margin-layer">
        <input v-model="margins.top" type="number" class="margin-input top" @input="updateValue" />
        <input v-model="margins.right" type="number" class="margin-input right" @input="updateValue" />
        <input v-model="margins.bottom" type="number" class="margin-input bottom" @input="updateValue" />
        <input v-model="margins.left" type="number" class="margin-input left" @input="updateValue" />

        <!-- Padding -->
        <div class="padding-layer">
          <input v-model="paddings.top" type="number" class="padding-input top" @input="updateValue" />
          <input v-model="paddings.right" type="number" class="padding-input right" @input="updateValue" />
          <input v-model="paddings.bottom" type="number" class="padding-input bottom" @input="updateValue" />
          <input v-model="paddings.left" type="number" class="padding-input left" @input="updateValue" />

          <!-- Content -->
          <div class="content-box"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  config: FieldConfig
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const margins = ref({ top: 0, right: 0, bottom: 0, left: 0 })
const paddings = ref({ top: 0, right: 0, bottom: 0, left: 0 })

// 解析值
watch(
  () => props.modelValue,
  value => {
    if (props.config.visualizer?.type === 'margin') {
      parseMargin(value)
    } else {
      parsePadding(value)
    }
  },
  { immediate: true }
)

function parseMargin(value: string) {
  // 解析 margin 值,如 "10px 20px 10px 20px"
  const parts = value.split(' ').map(v => parseInt(v) || 0)
  if (parts.length === 1) {
    margins.value = { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] }
  } else if (parts.length === 2) {
    margins.value = { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] }
  } else if (parts.length === 4) {
    margins.value = { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] }
  }
}

function updateValue() {
  const { top, right, bottom, left } = props.config.visualizer?.type === 'margin' ? margins.value : paddings.value

  // 简化输出
  if (top === right && right === bottom && bottom === left) {
    emit('update:modelValue', `${top}px`)
  } else if (top === bottom && right === left) {
    emit('update:modelValue', `${top}px ${right}px`)
  } else {
    emit('update:modelValue', `${top}px ${right}px ${bottom}px ${left}px`)
  }
}
</script>

<style scoped>
.margin-padding-visualizer {
  width: 200px;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
}

.visualizer-box {
  position: relative;
}

.margin-layer {
  position: relative;
  padding: 24px;
  background: #ffa50080;
  border: 1px dashed #ff8c00;
}

.padding-layer {
  position: relative;
  padding: 24px;
  background: #90ee9080;
  border: 1px dashed #32cd32;
}

.content-box {
  height: 40px;
  background: #87ceeb80;
  border: 1px dashed #4682b4;
}

.margin-input,
.padding-input {
  position: absolute;
  width: 40px;
  height: 20px;
  text-align: center;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  font-size: 12px;
}

.margin-input.top {
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
}
.margin-input.right {
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
}
.margin-input.bottom {
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
}
.margin-input.left {
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
}

.padding-input.top {
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
}
.padding-input.right {
  right: 2px;
  top: 50%;
  transform: translateY(-50%);
}
.padding-input.bottom {
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
}
.padding-input.left {
  left: 2px;
  top: 50%;
  transform: translateY(-50%);
}
</style>
```

### 4. 响应式设计

#### 4.1 移动端适配

```css
/* 在小屏幕上切换为单列布局 */
@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }

  .field-wrapper.span-1,
  .field-wrapper.span-2 {
    grid-column: span 1;
  }
}
```

#### 4.2 可视化组件响应式

```css
/* 可视化组件在小屏幕上自动缩小 */
@media (max-width: 768px) {
  .margin-padding-visualizer {
    width: 100%;
    max-width: 200px;
  }
}
```

### 5. 交互增强

#### 5.1 拖拽调整

- 可视化编辑器支持拖拽调整数值
- 鼠标悬停显示提示信息
- 支持键盘快捷键(↑↓调整数值)

#### 5.2 实时预览

- 修改属性时实时更新画布中的组件
- 可视化编辑器显示实时效果
- 支持撤销/重做操作

#### 5.3 快捷操作

- 双击重置为默认值
- 右键菜单提供常用值选项
- 支持复制/粘贴样式值
