# 属性面板系统重新设计 - 快速开始

## 项目概述

本项目旨在彻底重构属性面板系统,创建一个清晰、可维护、可扩展的新架构。

## 核心特性

1. **基础设施层字段系统** - 统一管理所有字段类型和渲染器
2. **可视化配置组件** - 为样式字段提供直观的可视化编辑器
3. **双列布局** - 优化空间利用,提升视觉效果
4. **通用+特定面板** - 分离共享属性和组件特有属性
5. **完全集成现有架构** - 使用现有的DI容器、状态管理、事件总线

## 架构概览

```
src/core/infrastructure/
├── fields/                    # 字段基础设施
│   ├── types.ts              # 字段类型定义
│   ├── registry.ts           # 字段注册表
│   ├── FieldRenderer.vue     # 字段渲染器入口
│   ├── renderers/            # 字段渲染器组件
│   └── visualizers/          # 可视化组件
├── panels/                    # 面板配置
│   ├── types.ts              # 面板类型定义
│   ├── registry.ts           # 面板注册表
│   └── common/               # 通用面板配置
└── services/
    └── PropertyPanelService.ts  # 核心服务
```

## 与现有架构集成

### 1. DI容器集成

```typescript
// 服务注册在 src/core/migration/CoreServicesIntegration.ts
const propertyPanelService = new PropertyPanelService()
await propertyPanelService.initialize()
container.register('PropertyPanelService', propertyPanelService)

// 使用服务
import { usePropertyPanelService } from '@core/services/helpers'
const service = usePropertyPanelService()
```

### 2. 状态管理集成

```typescript
// 使用现有的designer状态模块
import { useStateManager } from '@core/state/helpers'
const stateManager = useStateManager()

// 获取选中组件
const selectedControl = stateManager.getState('designer').selectedControl

// 更新属性
stateManager.dispatch('designer/updateProperty', { key, value })
```

### 3. 事件总线集成

```typescript
// 获取全局EventBus
const eventBus = window.__MIGRATION_SYSTEM__.coreServices.eventBus

// 触发事件
eventBus.emit('control.property.updated', { controlId, key, value })
```

## 实施步骤

### 阶段1: 清理 (0.5天)

- 删除旧的properties目录
- 删除旧的字段渲染器
- 删除旧的服务和插件

### 阶段2: 字段系统 (2天)

- 创建字段类型定义
- 创建字段注册表
- 创建基础和高级字段渲染器

### 阶段3: 可视化组件 (3天)

- 创建7个可视化组件
- 实现交互式编辑
- 实现实时预览

### 阶段4: 面板系统 (1.5天)

- 创建面板类型定义
- 创建通用面板配置
- 创建面板注册表

### 阶段5: 服务层 (2天)

- 创建PropertyPanelService
- 实现字段和面板管理
- 实现验证功能

### 阶段6: UI层 (2.5天)

- 创建FieldRenderer组件
- 创建PanelGroup组件
- 重构PropertiesPanel组件

### 阶段7: 集成 (1天)

- 注册服务到DI容器
- 集成状态管理
- 集成事件总线

### 阶段8: 组件更新 (2天)

- 更新所有组件定义
- 添加panels配置

### 阶段9: 优化 (1.5天)

- 实现懒加载
- 实现缓存
- 实现防抖

### 阶段10: 测试和文档 (4天)

- 功能测试
- 集成测试
- 性能测试
- 编写文档

## 关键文件

### 需要创建的文件

1. `src/core/infrastructure/fields/types.ts` - 字段类型定义
2. `src/core/infrastructure/fields/registry.ts` - 字段注册表
3. `src/core/infrastructure/fields/FieldRenderer.vue` - 字段渲染器
4. `src/core/infrastructure/fields/renderers/*.vue` - 各种字段渲染器
5. `src/core/infrastructure/fields/visualizers/*.vue` - 可视化组件
6. `src/core/infrastructure/panels/types.ts` - 面板类型定义
7. `src/core/infrastructure/panels/registry.ts` - 面板注册表
8. `src/core/infrastructure/panels/common/*.ts` - 通用面板配置
9. `src/core/infrastructure/services/PropertyPanelService.ts` - 核心服务
10. `src/core/renderer/designer/settings/PanelGroup.vue` - 面板组组件

### 需要修改的文件

1. `src/core/migration/CoreServicesIntegration.ts` - 注册服务
2. `src/core/services/helpers.ts` - 添加辅助函数
3. `src/core/renderer/base.ts` - 更新控件定义接口
4. `src/core/renderer/definitions.ts` - 更新注册流程
5. `src/core/renderer/controls/register.ts` - 更新组件定义
6. `src/core/renderer/designer/settings/PropertiesPanel.vue` - 重构UI

### 需要删除的文件

1. `src/core/renderer/properties/` - 整个目录
2. `src/core/renderer/designer/settings/fields/` - 整个目录
3. `src/core/services/PropertyService.ts`
4. `src/core/plugins/PropertyPlugin.ts`

## 开发指南

### 创建自定义字段类型

```typescript
// 1. 创建字段渲染器组件
// src/core/infrastructure/fields/renderers/CustomField.vue
<template>
  <div class="custom-field">
    <input v-model="value" @input="handleInput" />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  config: FieldConfig
  modelValue: any
}>()

const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const value = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
})
</script>

// 2. 注册字段类型
const service = usePropertyPanelService()
service.registerField('custom' as FieldType, CustomField)
```

### 定义组件面板配置

```typescript
// 在组件定义中添加panels配置
export const ButtonDefinition: BaseControlDefinition = {
  kind: 'button',
  kindName: '按钮',
  // ... 其他配置

  panels: {
    extends: ['basic', 'layout', 'style', 'event'], // 继承通用面板
    custom: [
      {
        group: PanelGroup.COMPONENT,
        title: '按钮属性',
        fields: [
          {
            key: 'text',
            label: '按钮文本',
            type: FieldType.TEXT,
            layout: { span: 2 }, // 占整行
          },
          {
            key: 'type',
            label: '按钮类型',
            type: FieldType.SELECT,
            layout: { span: 1 }, // 占半行
            options: [...]
          },
        ]
      }
    ]
  }
}
```

## 注意事项

1. **清理前备份** - 删除旧代码前做好备份
2. **渐进式实施** - 按阶段逐步实施,每个阶段完成后测试
3. **保持兼容** - 确保不影响现有功能
4. **遵循架构** - 使用现有的DI容器、状态管理、事件总线
5. **性能优先** - 实现懒加载、缓存、防抖等优化
6. **文档同步** - 及时更新文档

## 相关文档

- [需求文档](./requirements.md) - 详细的功能需求
- [设计文档](./design.md) - 架构和组件设计
- [任务列表](./tasks.md) - 详细的实施任务
- [架构集成](./ARCHITECTURE_INTEGRATION.md) - 与现有架构的集成说明

## 联系方式

如有问题,请查阅相关文档或联系开发团队。
