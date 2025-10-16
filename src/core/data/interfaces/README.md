# 数据源抽象接口

定义统一的数据源接口,支持多种数据源类型的抽象和扩展。

## 核心接口

### IDataSource

数据源的核心接口,定义了数据源的基本操作。

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

### IDataSourceFactory

数据源工厂接口,负责创建和管理数据源实例。

```typescript
interface IDataSourceFactory {
  create<T = any>(config: DataSourceConfig): IDataSource<T>
  register(type: DataSourceType, creator: IDataSourceCreator, description?: string): void
  unregister(type: DataSourceType): void
  supports(type: DataSourceType): boolean
  getRegisteredTypes(): DataSourceType[]
  getRegistration(type: DataSourceType): DataSourceRegistration | undefined
  getAllRegistrations(): DataSourceRegistration[]
  validateConfig(config: DataSourceConfig): boolean
}
```

### IDataSourceStateManager

数据源状态管理接口,管理数据源的状态转换。

```typescript
interface IDataSourceStateManager {
  getState(): DataSourceState
  setState(state: DataSourceState, reason?: string): void
  isState(state: DataSourceState): boolean
  canTransitionTo(state: DataSourceState): boolean
  getHistory(): StateChangeRecord[]
  clearHistory(): void
  onStateChange(handler: (state: DataSourceState, prevState: DataSourceState) => void): () => void
}
```

### IDataSourceEventEmitter

数据源事件发射器接口,管理数据源的事件系统。

```typescript
interface IDataSourceEventEmitter {
  emit<T extends DataSourceEventData>(event: T): void
  on<T extends DataSourceEventData>(type: DataSourceEventType, handler: DataSourceEventHandler<T>): () => void
  once<T extends DataSourceEventData>(type: DataSourceEventType, handler: DataSourceEventHandler<T>): () => void
  off<T extends DataSourceEventData>(type: DataSourceEventType, handler: DataSourceEventHandler<T>): void
  offAll(type?: DataSourceEventType): void
  getEventHistory(type?: DataSourceEventType): DataSourceEventData[]
  clearEventHistory(): void
}
```

## 数据源状态

```typescript
enum DataSourceState {
  Idle = 'idle', // 空闲
  Loading = 'loading', // 加载中
  Loaded = 'loaded', // 已加载
  Error = 'error', // 错误
  Refreshing = 'refreshing', // 刷新中
}
```

### 状态转换规则

- `Idle` → `Loading`
- `Loading` → `Loaded` | `Error`
- `Loaded` → `Refreshing` | `Loading` | `Idle`
- `Error` → `Loading` | `Idle`
- `Refreshing` → `Loaded` | `Error`

## 数据源类型

```typescript
enum DataSourceType {
  Static = 'static', // 静态数据
  API = 'api', // API接口
  Database = 'database', // 数据库
  WebSocket = 'websocket', // WebSocket
  Custom = 'custom', // 自定义
}
```

## 数据源事件

```typescript
enum DataSourceEventType {
  StateChange = 'state-change', // 状态变更
  BeforeLoad = 'before-load', // 加载前
  AfterLoad = 'after-load', // 加载后
  DataChange = 'data-change', // 数据变更
  Error = 'error', // 错误
  Refresh = 'refresh', // 刷新
  Dispose = 'dispose', // 销毁
}
```

## 使用示例

### 定义数据源配置

```typescript
const config: DataSourceConfig = {
  id: 'users-api',
  name: 'Users API',
  type: DataSourceType.API,
  description: 'Fetch users from API',
  autoLoad: true,
  cacheDuration: 60000, // 1分钟
  retryCount: 3,
  retryDelay: 1000,
  timeout: 5000,
  options: {
    url: 'https://api.example.com/users',
    method: 'GET',
  },
}
```

### 使用数据源

```typescript
// 创建数据源
const dataSource = factory.create<User[]>(config)

// 订阅事件
dataSource.on('state-change', (state, prevState) => {
  console.log(`State changed: ${prevState} -> ${state}`)
})

dataSource.on('data-change', (data, prevData) => {
  console.log('Data updated:', data)
})

dataSource.on('error', error => {
  console.error('Data source error:', error)
})

// 加载数据
const data = await dataSource.load()

// 刷新数据
await dataSource.refresh()

// 获取数据
const currentData = dataSource.getData()

// 检查状态
if (dataSource.isLoading) {
  console.log('Loading...')
}

if (dataSource.hasError) {
  console.error('Error:', dataSource.error)
}

// 清理
dataSource.dispose()
```

### 创建自定义数据源

```typescript
class CustomDataSourceCreator implements IDataSourceCreator<MyData> {
  create(config: DataSourceConfig): IDataSource<MyData> {
    return new CustomDataSource(config)
  }

  validateConfig(config: DataSourceConfig): boolean {
    return config.options?.customField !== undefined
  }

  getDefaultConfig(): Partial<DataSourceConfig> {
    return {
      autoLoad: false,
      cacheDuration: 0,
      retryCount: 0,
    }
  }
}

// 注册自定义数据源
factory.register(DataSourceType.Custom, new CustomDataSourceCreator(), 'Custom data source implementation')
```

### 状态管理

```typescript
// 获取状态管理器
const stateManager = dataSource.stateManager

// 检查状态
if (stateManager.isState(DataSourceState.Loaded)) {
  console.log('Data is loaded')
}

// 检查是否可以转换状态
if (stateManager.canTransitionTo(DataSourceState.Loading)) {
  stateManager.setState(DataSourceState.Loading, 'Manual refresh')
}

// 获取状态历史
const history = stateManager.getHistory()
history.forEach(record => {
  console.log(`${record.timestamp}: ${record.prevState} -> ${record.currentState}`)
})

// 订阅状态变更
const unsubscribe = stateManager.onStateChange((state, prevState) => {
  console.log(`State: ${prevState} -> ${state}`)
})

// 取消订阅
unsubscribe()
```

### 事件系统

```typescript
// 获取事件发射器
const eventEmitter = dataSource.eventEmitter

// 订阅事件
const unsubscribe = eventEmitter.on(DataSourceEventType.AfterLoad, (event: AfterLoadEventData) => {
  console.log('Data loaded:', event.payload.data)
  console.log('Duration:', event.payload.duration, 'ms')
})

// 订阅一次性事件
eventEmitter.once(DataSourceEventType.Error, (event: ErrorEventData) => {
  console.error('Error occurred:', event.payload.error)
})

// 获取事件历史
const events = eventEmitter.getEventHistory(DataSourceEventType.StateChange)

// 清空事件历史
eventEmitter.clearEventHistory()

// 取消订阅
unsubscribe()
```

## 设计原则

### 1. 接口隔离

每个接口只定义必要的方法,避免接口臃肿。

### 2. 依赖倒置

依赖抽象接口而不是具体实现。

### 3. 开闭原则

对扩展开放,对修改关闭。通过工厂模式支持自定义数据源。

### 4. 单一职责

每个接口只负责一个职责:

- `IDataSource`: 数据操作
- `IDataSourceStateManager`: 状态管理
- `IDataSourceEventEmitter`: 事件管理
- `IDataSourceFactory`: 数据源创建

### 5. 里氏替换

所有数据源实现都可以互相替换,不影响使用方。

## 扩展性

### 支持的扩展点

1. **自定义数据源类型**: 通过工厂注册新的数据源类型
2. **自定义状态转换规则**: 可以定义特定的状态转换逻辑
3. **自定义事件**: 可以扩展事件类型
4. **自定义配置**: 通过 `options` 字段传递自定义配置

### 扩展示例

```typescript
// 1. 定义自定义数据源类型
enum CustomDataSourceType {
  GraphQL = 'graphql',
  gRPC = 'grpc',
}

// 2. 实现数据源创建器
class GraphQLDataSourceCreator implements IDataSourceCreator {
  create(config: DataSourceConfig): IDataSource {
    return new GraphQLDataSource(config)
  }

  validateConfig(config: DataSourceConfig): boolean {
    return config.options?.query !== undefined
  }

  getDefaultConfig(): Partial<DataSourceConfig> {
    return {
      autoLoad: true,
      cacheDuration: 30000,
    }
  }
}

// 3. 注册到工厂
factory.register(CustomDataSourceType.GraphQL as any, new GraphQLDataSourceCreator(), 'GraphQL data source')

// 4. 使用自定义数据源
const dataSource = factory.create({
  id: 'graphql-users',
  name: 'GraphQL Users',
  type: CustomDataSourceType.GraphQL as any,
  options: {
    endpoint: 'https://api.example.com/graphql',
    query: `
      query GetUsers {
        users {
          id
          name
          email
        }
      }
    `,
  },
})
```

## 最佳实践

### 1. 始终处理错误

```typescript
dataSource.on('error', error => {
  logger.error('Data source error:', error)
  // 显示错误提示
  showErrorNotification(error.message)
})
```

### 2. 使用缓存减少请求

```typescript
const config: DataSourceConfig = {
  // ...
  cacheDuration: 60000, // 缓存1分钟
}

// 使用缓存
await dataSource.load() // 从服务器加载

// 强制刷新
await dataSource.load({ forceRefresh: true }) // 忽略缓存
```

### 3. 实现重试机制

```typescript
const config: DataSourceConfig = {
  // ...
  retryCount: 3,
  retryDelay: 1000,
}
```

### 4. 设置超时

```typescript
const config: DataSourceConfig = {
  // ...
  timeout: 5000, // 5秒超时
}
```

### 5. 清理资源

```typescript
// 组件卸载时清理
onUnmounted(() => {
  dataSource.dispose()
})
```

## 总结

数据源抽象接口提供了:

- 统一的数据源操作接口
- 灵活的状态管理
- 完善的事件系统
- 可扩展的工厂模式
- 类型安全的设计

这些接口为后续实现具体的数据源提供了清晰的契约和指导。
