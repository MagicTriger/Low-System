# Design Document - 核心服务集成

## Overview

本设计文档描述如何将现有的核心服务统一集成到新的迁移系统架构中，通过DI容器实现统一的服务管理和访问。

## Architecture

### 当前架构

```
独立服务
├── PluginManager (单例)
├── LayoutManager (全局实例)
├── GridSystem (全局实例)
├── ContainerManager (全局实例)
├── RuntimeManager (实例)
├── DesignPersistenceService (单例)
└── DataSourceService (单例)
```

### 目标架构

```
统一服务架构
├── DI Container
│   ├── PluginManager (singleton)
│   ├── LayoutManager (singleton)
│   ├── GridSystem (singleton)
│   ├── ContainerManager (singleton)
│   ├── RuntimeManager (singleton)
│   ├── DesignPersistenceService (singleton)
│   └── DataSourceService (singleton)
│
└── ServicesIntegration
    ├── registerServices()
    ├── initializeServices()
    └── getService<T>(name)
```

## Components

### 1. 服务集成模块

```typescript
// src/core/migration/ServicesIntegration.ts

export interface ServicesIntegrationConfig {
  useGlobalInstances?: boolean
  registerToCompatLayer?: boolean
  verbose?: boolean
  services?: {
    plugin?: boolean
    layout?: boolean
    runtime?: boolean
    business?: boolean
  }
}

export class ServicesIntegration {
  private container: Container
  private eventBus?: EventBus
  private logger?: Logger
  private compatLayer?: ApiCompatLayer

  async integrate(): Promise<void> {
    // 1. 注册插件系统
    await this.registerPluginSystem()

    // 2. 注册布局系统
    await this.registerLayoutSystem()

    // 3. 注册运行时系统
    await this.registerRuntimeSystem()

    // 4. 注册业务服务
    await this.registerBusinessServices()

    // 5. 初始化所有服务
    await this.initializeServices()
  }
}
```

### 2. 服务注册

#### 插件系统

```typescript
private async registerPluginSystem(): Promise<void> {
  // 注册PluginManager
  this.container.register('PluginManager', {
    useClass: PluginManager
  }, { lifetime: 'singleton' })

  // 注册ControlRegistry
  this.container.register('ControlRegistry', {
    useClass: ControlRegistry
  }, { lifetime: 'singleton' })

  // 注册SettingRendererRegistry
  this.container.register('SettingRendererRegistry', {
    useClass: SettingRendererRegistry
  }, { lifetime: 'singleton' })
}
```

#### 布局系统

```typescript
private async registerLayoutSystem(): Promise<void> {
  // 注册LayoutManager
  this.container.register('LayoutManager', {
    useFactory: () => createLayoutManager()
  }, { lifetime: 'singleton' })

  // 注册GridSystem
  this.container.register('GridSystem', {
    useFactory: () => createGridSystem()
  }, { lifetime: 'singleton' })

  // 注册ContainerManager
  this.container.register('ContainerManager', {
    useFactory: () => createContainerManager()
  }, { lifetime: 'singleton' })
}
```

#### 运行时系统

```typescript
private async registerRuntimeSystem(): Promise<void> {
  // 注册DataFlowEngine
  this.container.register('DataFlowEngine', {
    useClass: DataFlowEngine
  }, { lifetime: 'singleton' })

  // 注册RuntimeManager
  this.container.register('RuntimeManager', {
    useClass: RuntimeManager,
    deps: ['DataFlowEngine']
  }, { lifetime: 'singleton' })

  // 注册其他执行器
  this.container.register('DataActionExecutor', {
    useClass: DataActionExecutor
  }, { lifetime: 'singleton' })
}
```

#### 业务服务

```typescript
private async registerBusinessServices(): Promise<void> {
  // 注册DesignPersistenceService
  this.container.register('DesignPersistenceService', {
    useClass: DesignPersistenceService
  }, { lifetime: 'singleton' })

  // 注册DataSourceService
  this.container.register('DataSourceService', {
    useClass: DataSourceService
  }, { lifetime: 'singleton' })
}
```

### 3. 服务访问辅助函数

```typescript
// src/core/services/helpers.ts

/**
 * 获取服务实例
 */
export function useService<T>(serviceName: string): T {
  const container = getGlobalContainer()
  return container.resolve<T>(serviceName)
}

/**
 * 获取插件管理器
 */
export function usePluginManager(): PluginManager {
  return useService<PluginManager>('PluginManager')
}

/**
 * 获取布局管理器
 */
export function useLayoutManager(): LayoutManager {
  return useService<LayoutManager>('LayoutManager')
}

/**
 * 获取运行时管理器
 */
export function useRuntimeManager(): RuntimeManager {
  return useService<RuntimeManager>('RuntimeManager')
}
```

## Migration Strategy

### 阶段1: 创建服务集成模块

1. 创建`ServicesIntegration.ts`
2. 实现服务注册逻辑
3. 实现服务初始化逻辑

### 阶段2: 注册服务到DI容器

1. 注册插件系统服务
2. 注册布局系统服务
3. 注册运行时系统服务
4. 注册业务服务

### 阶段3: 更新服务访问方式

1. 创建服务访问辅助函数
2. 更新现有代码使用新的访问方式
3. 测试所有功能

### 阶段4: 集成到bootstrap

1. 在bootstrap中调用服务集成
2. 暴露服务到全局对象
3. 验证集成

## API Migration

### 旧API → 新API

```typescript
// 旧API - 直接导入单例
import { pluginManager } from '@/core/plugins/PluginManager'
pluginManager.register(plugin)

// 新API - 通过DI容器
import { usePluginManager } from '@/core/services/helpers'
const pluginManager = usePluginManager()
pluginManager.register(plugin)

// 或者直接使用DI容器
import { useService } from '@/core/services/helpers'
const pluginManager = useService<PluginManager>('PluginManager')
```

## Benefits

1. **统一管理** - 所有服务通过DI容器统一管理
2. **依赖注入** - 清晰的依赖关系
3. **易于测试** - 可以轻松mock服务
4. **解耦** - 服务之间松耦合
5. **可扩展** - 易于添加新服务

## Implementation Plan

1. 创建ServicesIntegration模块
2. 注册所有核心服务
3. 创建服务访问辅助函数
4. 更新bootstrap集成
5. 更新文档
6. 测试验证

## Timeline

预计时间：2-3小时

- 阶段1: 创建集成模块 (30分钟)
- 阶段2: 注册服务 (60分钟)
- 阶段3: 更新访问方式 (30分钟)
- 阶段4: 集成和测试 (30分钟)
- 文档更新 (30分钟)
