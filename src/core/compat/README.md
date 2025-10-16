# 兼容层 (Compatibility Layer)

兼容层提供向后兼容支持,确保在架构重构过程中现有代码能够继续工作,并提供平滑的迁移路径。

## 核心功能

### 1. 旧版API适配

自动将旧版API调用转换为新版API调用,无需修改现有代码。

### 2. 迁移建议

为每个已废弃的API提供详细的迁移建议,包括:

- 新版API名称
- 迁移说明
- 代码示例
- 废弃和移除版本信息
- 文档链接

### 3. 灵活配置

支持多种配置选项:

- 启用/禁用警告
- 记录使用情况
- 严格模式(禁止使用已移除的API)

## 使用方法

### 基础使用

```typescript
import { ApiCompatLayer } from '@/core/compat'

// 创建兼容层实例
const compatLayer = new ApiCompatLayer({
  enabled: true,
  version: '2.0.0',
  autoMigrate: true,
})

// 注册新版API实例
compatLayer.registerApi('DataFlowEngine', dataFlowEngine)
compatLayer.registerApi('StateManager', stateManager)
compatLayer.registerApi('EventBus', eventBus)

// 适配旧版API调用
const result = await compatLayer.adapt({
  name: 'dataSource.create',
  args: [{ type: 'api', url: '/api/data' }],
})
```

### 使用代理模式

```typescript
// 创建代理对象,自动适配旧版API
const legacyApi = compatLayer.createProxy({}, 'api')

// 使用旧版API语法,自动转换为新版API
const data = await legacyApi.get('/endpoint')
```

### 自定义适配器

```typescript
import { BaseLegacyAdapter, LegacyApiCall, MigrationAdvice } from '@/core/compat'

class CustomAdapter extends BaseLegacyAdapter {
  constructor() {
    super('CustomAdapter', '1.0.0')
  }

  async adapt<T>(legacyCall: LegacyApiCall): Promise<T> {
    this.logLegacyUsage(legacyCall.name)

    // 实现自定义适配逻辑
    switch (legacyCall.name) {
      case 'myOldApi':
        return this.adaptMyOldApi(legacyCall.args)
      default:
        throw new Error(`Unsupported API: ${legacyCall.name}`)
    }
  }

  supports(apiName: string): boolean {
    return apiName === 'myOldApi'
  }

  getMigrationAdvice(apiName: string): MigrationAdvice | null {
    if (apiName === 'myOldApi') {
      return {
        oldApi: 'myOldApi',
        newApi: 'myNewApi',
        description: '使用新的API实现',
        example: '// 示例代码',
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      }
    }
    return null
  }

  private async adaptMyOldApi(args?: any[]): Promise<any> {
    // 实现具体的适配逻辑
    return {}
  }
}
```

### 使用适配器管理器

```typescript
import { LegacyAdapterManager } from '@/core/compat'

const manager = new LegacyAdapterManager(logger)

// 注册适配器
manager.registerAdapter(new ApiCompatLayer())
manager.registerAdapter(new CustomAdapter())

// 适配API调用
const result = await manager.adapt({
  name: 'dataSource.create',
  args: [config],
})

// 检查API是否已废弃
if (manager.isDeprecated('myOldApi')) {
  console.warn('This API is deprecated')
}
```

## API映射规则

兼容层支持灵活的API映射规则:

### 1. 简单映射

```typescript
compatLayer.addMapping({
  pattern: 'oldApi',
  target: 'NewService.newMethod',
})
```

### 2. 正则表达式匹配

```typescript
compatLayer.addMapping({
  pattern: /^api\.(get|post|put|delete)$/,
  target: async call => {
    // 自定义转换逻辑
  },
})
```

### 3. 参数转换

```typescript
compatLayer.addMapping({
  pattern: 'oldApi',
  target: 'NewService.newMethod',
  transformArgs: args => {
    // 转换参数格式
    return [{ newFormat: args[0] }]
  },
})
```

### 4. 结果转换

```typescript
compatLayer.addMapping({
  pattern: 'oldApi',
  target: 'NewService.newMethod',
  transformResult: result => {
    // 转换返回值格式
    return result.data
  },
})
```

## 内置映射

兼容层提供以下内置API映射:

### 数据源API

| 旧版API             | 新版API                           | 状态            |
| ------------------- | --------------------------------- | --------------- |
| `dataSource.create` | `DataFlowEngine.createDataSource` | 已废弃 (v2.0.0) |
| `dataSource.load`   | `IDataSource.load`                | 已废弃 (v2.0.0) |

### 状态管理API

| 旧版API          | 新版API                       | 状态            |
| ---------------- | ----------------------------- | --------------- |
| `store.register` | `StateManager.registerModule` | 已废弃 (v2.0.0) |
| `store.commit`   | `StateManager.commit`         | 已废弃 (v2.0.0) |

### 事件API

| 旧版API         | 新版API         | 状态            |
| --------------- | --------------- | --------------- |
| `eventBus.on`   | `EventBus.on`   | 已废弃 (v2.0.0) |
| `eventBus.emit` | `EventBus.emit` | 已废弃 (v2.0.0) |

### 控件API

| 旧版API             | 新版API                          | 状态            |
| ------------------- | -------------------------------- | --------------- |
| `controls.register` | `ControlRegistry.registerPlugin` | 已废弃 (v2.0.0) |

### HTTP API

| 旧版API    | 新版API          | 状态            |
| ---------- | ---------------- | --------------- |
| `api.get`  | `ApiClient.get`  | 已废弃 (v2.0.0) |
| `api.post` | `ApiClient.post` | 已废弃 (v2.0.0) |

## 配置选项

### 启用警告

```typescript
const compatLayer = new ApiCompatLayer({
  enabled: true,
})

// 配置适配器
compatLayer.config.enableWarnings = true
```

### 记录使用情况

```typescript
compatLayer.config.logUsage = true
```

### 严格模式

在严格模式下,使用已移除的API会抛出错误:

```typescript
compatLayer.config.strictMode = true
```

## 迁移策略

### 阶段1: 启用兼容层

在重构初期,启用兼容层确保现有代码继续工作:

```typescript
const compatLayer = new ApiCompatLayer({
  enabled: true,
  autoMigrate: false,
})
```

### 阶段2: 收集使用数据

启用日志记录,收集旧版API的使用情况:

```typescript
compatLayer.config.logUsage = true
```

### 阶段3: 逐步迁移

根据使用数据,逐步迁移高频使用的API。

### 阶段4: 启用严格模式

迁移完成后,启用严格模式,禁止使用已废弃的API:

```typescript
compatLayer.config.strictMode = true
```

### 阶段5: 移除兼容层

所有代码迁移完成后,可以移除兼容层。

## 最佳实践

1. **尽早启用兼容层**: 在重构开始时就启用兼容层,确保平滑过渡
2. **记录使用情况**: 启用日志记录,了解哪些旧版API仍在使用
3. **提供清晰的迁移建议**: 为每个废弃的API提供详细的迁移指南
4. **设置过渡期**: 给开发者足够的时间迁移代码
5. **使用版本标记**: 明确标记API的废弃版本和移除版本
6. **自动化迁移**: 提供自动化工具帮助迁移代码

## 注意事项

1. 兼容层会带来一定的性能开销,应该作为临时方案
2. 不要在新代码中使用旧版API
3. 定期检查和清理不再使用的旧版API
4. 在生产环境中谨慎使用严格模式

## 相关文档

- [迁移指南](../version/MIGRATION_GUIDE.md)
- [版本管理](../version/README.md)
- [特性开关](../features/README.md)
