# 数据源插件系统

数据源插件系统提供了一种可扩展的方式来支持不同类型的数据源。通过插件机制,可以轻松添加新的数据源类型而无需修改核心代码。

## 核心概念

### 插件 (Plugin)

插件是实现了 `IDataSourcePlugin` 接口的类,负责创建和管理特定类型的数据源。

### 注册器 (Registry)

注册器负责管理所有已注册的插件,提供插件的注册、查找和生命周期管理。

### 元数据 (Metadata)

每个插件都有元数据,描述插件的基本信息、支持的功能和依赖关系。

## 使用示例

### 1. 注册内置插件

```typescript
import { DataSourcePluginRegistry, HttpDataSourcePlugin, StaticDataSourcePlugin } from '@/core/data/plugins'

// 创建注册器
const registry = new DataSourcePluginRegistry()

// 注册插件
registry.register(new HttpDataSourcePlugin())
registry.register(new StaticDataSourcePlugin())

// 初始化所有插件
await registry.initializeAll()
```

### 2. 使用插件创建数据源

```typescript
// 获取HTTP插件
const httpPlugin = registry.getPluginByType('http')

// 创建HTTP数据源
const dataSource = httpPlugin.createDataSource({
  id: 'users-api',
  type: 'http',
  url: 'https://api.example.com/users',
  method: 'GET',
  headers: {
    Authorization: 'Bearer token',
  },
})

// 加载数据
const data = await dataSource.load()
```

### 3. 创建自定义插件

```typescript
import { BaseDataSourcePlugin } from '@/core/data/plugins'
import type { IDataSource, DataSourceConfig } from '@/core/data/interfaces'

// 定义配置接口
interface MyDataSourceConfig extends DataSourceConfig {
  customOption: string
}

// 实现数据源
class MyDataSource implements IDataSource {
  constructor(private config: MyDataSourceConfig) {}

  // 实现IDataSource接口的所有方法
  // ...
}

// 创建插件
class MyDataSourcePlugin extends BaseDataSourcePlugin {
  constructor() {
    super({
      id: 'my-datasource',
      name: 'My Data Source',
      version: '1.0.0',
      dataSourceType: 'my-type',
      capabilities: ['load', 'refresh'],
    })
  }

  createDataSource<T>(config: DataSourceConfig): IDataSource<T> {
    this.assertInitialized()
    return new MyDataSource(config as MyDataSourceConfig)
  }

  protected onValidateConfig(config: DataSourceConfig): boolean {
    const myConfig = config as MyDataSourceConfig
    return !!myConfig.customOption
  }
}

// 注册自定义插件
registry.register(new MyDataSourcePlugin())
```

### 4. 插件依赖

```typescript
class AdvancedPlugin extends BaseDataSourcePlugin {
  constructor() {
    super({
      id: 'advanced-plugin',
      name: 'Advanced Plugin',
      version: '1.0.0',
      dataSourceType: 'advanced',
      // 声明依赖
      dependencies: ['http-datasource', 'static-datasource'],
    })
  }

  // ...
}

// 注册时会自动检查依赖
registry.register(new AdvancedPlugin())
```

### 5. 插件生命周期钩子

```typescript
const registry = new DataSourcePluginRegistry({
  beforeRegister: async plugin => {
    console.log(`Registering plugin: ${plugin.metadata.id}`)
  },
  afterRegister: async plugin => {
    console.log(`Plugin registered: ${plugin.metadata.id}`)
  },
  beforeCreateDataSource: async config => {
    console.log(`Creating data source: ${config.id}`)
  },
  afterCreateDataSource: async dataSource => {
    console.log(`Data source created: ${dataSource.config.id}`)
  },
})
```

## 内置插件

### HttpDataSourcePlugin

提供基于HTTP/REST API的数据源支持。

**配置选项:**

- `url`: API端点URL (必需)
- `method`: HTTP方法 (GET, POST, PUT, DELETE, PATCH)
- `headers`: HTTP请求头
- `params`: 查询参数
- `body`: 请求体
- `timeout`: 超时时间(毫秒)

### StaticDataSourcePlugin

提供静态数据的数据源支持。

**配置选项:**

- `data`: 静态数据 (必需)

## API参考

### IDataSourcePlugin

```typescript
interface IDataSourcePlugin {
  readonly metadata: DataSourcePluginMetadata
  initialize(config?: DataSourcePluginConfig): Promise<void> | void
  createDataSource<T>(config: DataSourceConfig): IDataSource<T>
  validateConfig(config: DataSourceConfig): boolean
  getConfigSchema?(): Record<string, any>
  dispose(): Promise<void> | void
}
```

### IDataSourcePluginRegistry

```typescript
interface IDataSourcePluginRegistry {
  register(plugin: IDataSourcePlugin): void
  unregister(pluginId: string): void
  getPlugin(pluginId: string): IDataSourcePlugin | undefined
  getPluginByType(dataSourceType: string): IDataSourcePlugin | undefined
  getAllPlugins(): IDataSourcePlugin[]
  hasPlugin(pluginId: string): boolean
  initializeAll(config?: Record<string, DataSourcePluginConfig>): Promise<void>
  disposeAll(): Promise<void>
}
```

### BaseDataSourcePlugin

基础插件抽象类,提供了插件的基础实现。

**钩子方法:**

- `onInitialize`: 初始化钩子
- `onValidateConfig`: 配置验证钩子
- `onGetConfigSchema`: 获取配置模式钩子
- `onDispose`: 销毁钩子

**工具方法:**

- `assertInitialized`: 断言插件已初始化
- `getOption`: 获取配置选项
- `hasOption`: 检查配置选项是否存在

## 最佳实践

1. **继承BaseDataSourcePlugin**: 使用基类可以减少样板代码
2. **验证配置**: 实现 `onValidateConfig` 方法确保配置正确
3. **提供配置模式**: 实现 `onGetConfigSchema` 方法提供配置文档
4. **处理依赖**: 正确声明插件依赖关系
5. **清理资源**: 在 `onDispose` 中清理所有资源
6. **错误处理**: 妥善处理初始化和运行时错误
7. **日志记录**: 使用统一的日志格式记录关键操作

## 错误处理

插件系统提供了以下错误类型:

- `DataSourcePluginError`: 通用插件错误
- `PluginValidationError`: 插件验证错误
- `PluginDependencyError`: 插件依赖错误

```typescript
try {
  registry.register(plugin)
} catch (error) {
  if (error instanceof PluginValidationError) {
    console.error('Plugin validation failed:', error.message)
  } else if (error instanceof PluginDependencyError) {
    console.error('Missing dependencies:', error.missingDependencies)
  }
}
```

## 扩展阅读

- [数据源接口文档](../interfaces/README.md)
- [响应式数据源](../reactive/README.md)
- [数据流管道](../pipeline/README.md)
