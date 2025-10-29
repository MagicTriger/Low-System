# 数据源系统使用指南

## 概述

数据源系统已经重构为使用插件架构，提供统一的数据源创建和管理机制。

## 主要组件

### 1. DataSourceFactory (数据源工厂)

工厂类负责创建和管理数据源实例，现在通过插件系统获取数据源创建器。

```typescript
import { getGlobalDataSourceFactory } from '@/core/data'

const factory = getGlobalDataSourceFactory()

// 创建HTTP数据源
const dataSource = factory.create({
  id: 'user-api',
  name: 'User API',
  type: 'http',
  options: {
    url: '/api/users',
    method: 'GET',
  },
})

// 加载数据
const data = await dataSource.load()
```

### 2. IDataSource 接口

所有数据源都实现统一的 `IDataSource` 接口：

```typescript
interface IDataSource<T = any> {
  readonly config: DataSourceConfig
  readonly metadata: DataSourceMetadata
  readonly state: DataSourceState
  readonly data: T | null
  readonly isLoading: boolean
  readonly hasError: boolean
  readonly error: Error | null

  load(options?: LoadOptions): Promise<T>
  refresh(options?: LoadOptions): Promise<T>
  reload(options?: LoadOptions): Promise<T>
  clear(): void
  setData(data: T): void
  getData(): T | null
  on<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): () => void
  off<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): void
  dispose(): void
}
```

### 3. 插件系统

#### 内置插件

- **HttpDataSourcePlugin**: 提供基于 HTTP/REST API 的数据源
- **StaticDataSourcePlugin**: 提供静态数据的数据源

#### 注册自定义插件

```typescript
import { DataSourcePluginRegistry, BaseDataSourcePlugin } from '@/core/data'

// 创建自定义插件
class MyCustomPlugin extends BaseDataSourcePlugin {
  constructor() {
    super({
      id: 'my-custom-plugin',
      name: 'My Custom Plugin',
      version: '1.0.0',
      dataSourceType: 'custom',
    })
  }

  createDataSource(config) {
    return new MyCustomDataSource(config)
  }

  protected onValidateConfig(config) {
    return !!config.customOption
  }
}

// 注册插件
const registry = new DataSourcePluginRegistry()
registry.register(new MyCustomPlugin())
```

## 使用示例

### 创建 HTTP 数据源

```typescript
import { getGlobalDataSourceFactory } from '@/core/data'

const factory = getGlobalDataSourceFactory()

const userDataSource = factory.create({
  id: 'users',
  name: 'Users',
  type: 'http',
  options: {
    url: '/api/users',
    method: 'GET',
    headers: {
      Authorization: 'Bearer token',
    },
  },
})

// 订阅事件
userDataSource.on('data-change', (newData, oldData) => {
  console.log('Data changed:', newData)
})

userDataSource.on('error', error => {
  console.error('Error:', error)
})

// 加载数据
try {
  const data = await userDataSource.load()
  console.log('Loaded data:', data)
} catch (error) {
  console.error('Failed to load:', error)
}
```

### 创建静态数据源

```typescript
const staticDataSource = factory.create({
  id: 'static-users',
  name: 'Static Users',
  type: 'static',
  options: {
    data: [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
    ],
  },
})

const data = await staticDataSource.load()
```

### 使用现有的 DataSource 类

现有的 `DataSource` 类（在 `engines/data-source.ts` 中）已经更新为完整实现 `IDataSource` 接口，可以继续使用：

```typescript
import { DataSource } from '@/core/engines/data-source'

const dataSource = new DataSource({
  id: 'my-data',
  type: 'api',
  url: '/api/data',
  autoLoad: true,
})

// 使用 IDataSource 接口方法
await dataSource.load()
await dataSource.refresh()
dataSource.on('data-change', data => {
  console.log('Data updated:', data)
})
```

## 迁移指南

### 从旧的工厂模式迁移

**旧代码:**

```typescript
const factory = new DataSourceFactory()
factory.register('custom', customCreator)
const ds = factory.create(config)
```

**新代码:**

```typescript
import { getGlobalDataSourceFactory, DataSourcePluginRegistry } from '@/core/data'

const registry = new DataSourcePluginRegistry()
registry.register(new CustomPlugin())

const factory = new DataSourceFactory(registry)
const ds = factory.create(config)
```

### 向后兼容性

- 工厂仍然支持通过 `register()` 方法注册传统的创建器函数
- 如果插件系统中没有找到对应类型，会回退到传统的创建器
- 现有代码无需修改即可继续工作

## 最佳实践

1. **使用全局工厂**: 使用 `getGlobalDataSourceFactory()` 获取全局工厂实例
2. **启用缓存**: 工厂默认启用缓存，相同 ID 的数据源会复用实例
3. **订阅事件**: 使用事件系统监听数据变化和错误
4. **错误处理**: 始终使用 try-catch 处理 load/refresh 操作
5. **清理资源**: 不再使用时调用 `dispose()` 清理资源

## 事件系统

数据源支持以下事件：

- `state-change`: 状态变更
- `before-load`: 加载前
- `after-load`: 加载后
- `data-change`: 数据变更
- `error`: 错误
- `refresh`: 刷新

```typescript
const unsubscribe = dataSource.on('data-change', (newData, oldData) => {
  console.log('Data changed')
})

// 取消订阅
unsubscribe()
```

## 配置选项

### DataSourceConfig

```typescript
interface DataSourceConfig {
  id: string // 数据源ID
  name: string // 数据源名称
  type: DataSourceType // 数据源类型
  description?: string // 描述
  autoLoad?: boolean // 是否自动加载
  cacheDuration?: number // 缓存时间(毫秒)
  retryCount?: number // 重试次数
  retryDelay?: number // 重试延迟(毫秒)
  timeout?: number // 超时时间(毫秒)
  options?: Record<string, any> // 额外配置
}
```

### LoadOptions

```typescript
interface LoadOptions {
  forceRefresh?: boolean // 强制刷新(忽略缓存)
  params?: Record<string, any> // 加载参数
  timeout?: number // 超时时间
  signal?: AbortSignal // 取消信号
}
```
