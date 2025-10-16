# 属性面板系统 - 架构集成说明

## 概述

本文档说明新的属性面板系统如何与现有的项目架构和基础设施集成。

## 现有基础设施

### 1. DI容器系统

项目已有完善的DI容器系统:

- 位置: `src/core/di/Container.ts`
- 全局访问: `window.__MIGRATION_SYSTEM__.coreServices.container`
- 服务注册: 在 `src/core/migration/CoreServicesIntegration.ts` 中统一注册

### 2. 状态管理系统

项目已有StateManager系统:

- 位置: `src/core/state/StateManager.ts`
- 全局访问: `window.__MIGRATION_SYSTEM__.stateManagement.stateManager`
- Designer模块: `src/core/state/modules/designer.ts` (已包含属性面板状态)

### 3. 事件总线系统

项目已有EventBus系统:

- 全局访问: `window.__MIGRATION_SYSTEM__.coreServices.eventBus`
- 用于组件间通信

### 4. 服务访问辅助函数

项目已有统一的服务访问接口:

- 位置: `src/core/services/helpers.ts`
- 提供 `useService()`, `usePluginManager()` 等辅助函数

## 集成方案

### 1. PropertyPanelService 注册到DI容器

```typescript
// 在 src/core/migration/CoreServicesIntegration.ts 中添加

import { PropertyPanelService } from '@core/infrastructure/services/PropertyPanelService'

export async function initializeCoreServices(container: Container) {
  // ... 现有服务注册代码

  // 注册PropertyPanelService
  console.log('🔧 Registering PropertyPanelService...')
  const propertyPanelService = new PropertyPanelService()
  await propertyPanelService.initialize()
  container.register('PropertyPanelService', propertyPanelService)
  console.log('✅ PropertyPanelService registered')

  // ... 其他服务注册代码
}
```

### 2. 添加服务访问辅助函数

````typescript
// 在 src/core/services/helpers.ts 中添加

/**
 * 获取属性面板服务
 *
 * @example
 * ```ts
 * const propertyPanelService = usePropertyPanelService()
 * const panels = propertyPanelService.getPanelsForComponent('button')
 * ```
 */
export function usePropertyPanelService(container?: Container): any {
  return useService('PropertyPanelService', container)
}
````

### 3. 使用现有的Designer状态模块

新系统将直接使用现有的 `designer` 状态模块,无需创建新的状态:

```typescript
// 在 PropertiesPanel.vue 中
import { useStateManager } from '@core/state/helpers'

const stateManager = useStateManager()

// 获取选中的控件
const selectedControl = computed(() => {
  return stateManager.getState('designer').selectedControl
})

// 更新属性
function updateProperty(key: string, value: any) {
  stateManager.dispatch('designer/updateProperty', { key, value })
}
```

### 4. 使用现有的EventBus

```typescript
// 在 PropertyPanelService 中
export class PropertyPanelService {
  private eventBus: any

  constructor() {
    // 获取全局EventBus
    this.eventBus = (window as any).__MIGRATION_SYSTEM__?.coreServices?.eventBus
  }

  // 触发属性更新事件
  emitPropertyUpdate(controlId: string, key: string, value: any) {
    if (this.eventBus) {
      this.eventBus.emit('control.property.updated', {
        controlId,
        key,
        value,
      })
    }
  }
}
```

## 数据流集成

### 1. 属性读取流程(集成现有状态)

```
用户选中组件
  ↓
StateManager.dispatch('designer/loadPropertyPanel', control)
  ↓
Designer模块 action 获取 PropertyPanelService
  ↓
PropertyPanelService.getPanelsForComponent(control.kind)
  ↓
返回面板配置并存储到 designer.propertyPanelConfig
  ↓
PropertiesPanel 从 designer 状态读取配置
  ↓
渲染面板
```

### 2. 属性更新流程(集成现有状态和事件)

```
用户修改字段值
  ↓
FieldRenderer 触发 update:modelValue
  ↓
PropertiesPanel 调用 StateManager.dispatch('designer/updateProperty', { key, value })
  ↓
Designer模块 action 使用 PropertyPanelService 验证
  ↓
验证通过 → 更新 designer.propertyValues
  ↓
触发 EventBus.emit('control.property.updated')
  ↓
组件监听事件并重新渲染
```

## 组件集成

### 1. PropertiesPanel 组件集成

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { useStateManager } from '@core/state/helpers'
import { usePropertyPanelService } from '@core/services/helpers'

const stateManager = useStateManager()
const propertyPanelService = usePropertyPanelService()

// 从状态管理获取数据
const selectedControl = computed(() => stateManager.getState('designer').selectedControl)

const panels = computed(() => stateManager.getState('designer').propertyPanelConfig?.panels || [])

const propertyValues = computed(() => stateManager.getState('designer').propertyValues)

// 更新属性
function handleUpdate(key: string, value: any) {
  stateManager.dispatch('designer/updateProperty', { key, value })
}
</script>
```

### 2. FieldRenderer 组件集成

```vue
<script setup lang="ts">
import { computed } from 'vue'
import { usePropertyPanelService } from '@core/services/helpers'

const propertyPanelService = usePropertyPanelService()

const rendererComponent = computed(() => {
  return propertyPanelService.getFieldRenderer(props.config.type)
})

const visualizerComponent = computed(() => {
  if (!props.config.visualizer) return null
  return propertyPanelService.getVisualizer(props.config.visualizer.type)
})
</script>
```

## 性能优化集成

### 1. 使用现有的缓存系统

```typescript
// 在 PropertyPanelService 中
import { useCache } from '@core/cache'

export class PropertyPanelService {
  private cache: any

  constructor() {
    this.cache = useCache()
  }

  getPanelsForComponent(componentType: string): PanelConfig[] {
    // 使用缓存
    const cacheKey = `panels:${componentType}`
    const cached = this.cache.get(cacheKey)
    if (cached) return cached

    // 计算面板配置
    const panels = this.panelRegistry.mergePanels(componentType)

    // 缓存结果
    this.cache.set(cacheKey, panels, { ttl: 3600 })

    return panels
  }
}
```

### 2. 使用现有的防抖工具

```typescript
// 在字段渲染器中
import { debounce } from '@core/utils'

const debouncedUpdate = debounce((value: any) => {
  emit('update:modelValue', value)
}, 300)
```

## 初始化顺序

确保服务按正确顺序初始化:

```typescript
// 在 src/core/migration/bootstrap.ts 中

export async function bootstrapMigration() {
  // 1. 初始化DI容器
  const container = new Container()

  // 2. 注册核心服务(包括PropertyPanelService)
  await initializeCoreServices(container)

  // 3. 初始化状态管理
  await initializeStateManagement()

  // 4. 注册状态模块(包括designer模块)
  registerStateModules()

  // 5. 初始化事件总线
  initializeEventBus()

  // 6. 其他初始化...
}
```

## 向后兼容

### 1. 保留现有的designer状态结构

新系统使用现有的designer状态模块,不破坏现有功能:

- `selectedControl` - 保留
- `propertyPanelConfig` - 保留并扩展
- `propertyValues` - 保留
- `validationErrors` - 保留
- `expandedGroups` - 保留

### 2. 渐进式迁移

- 旧的PropertyService可以与新的PropertyPanelService共存
- 逐步迁移组件定义
- 保留旧的API作为兼容层

## 测试集成

### 1. 使用现有的测试工具

```typescript
// 在测试中
import { createTestContainer } from '@core/di/__tests__/helpers'
import { PropertyPanelService } from '@core/infrastructure/services/PropertyPanelService'

describe('PropertyPanelService', () => {
  let container: Container
  let service: PropertyPanelService

  beforeEach(async () => {
    container = createTestContainer()
    service = new PropertyPanelService()
    await service.initialize()
    container.register('PropertyPanelService', service)
  })

  // 测试用例...
})
```

## 总结

新的属性面板系统完全集成到现有架构中:

1. ✅ 使用现有的DI容器系统
2. ✅ 使用现有的StateManager和designer模块
3. ✅ 使用现有的EventBus系统
4. ✅ 遵循现有的服务访问模式
5. ✅ 使用现有的缓存和性能优化工具
6. ✅ 保持向后兼容
7. ✅ 遵循现有的初始化流程

无需创建新的基础设施,只需在现有基础上扩展功能。
