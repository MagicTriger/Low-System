# 任务 2.1 完成总结 - 设计数据源抽象接口

## 完成时间

2025-10-12

## 实现内容

### 核心接口文件

#### src/core/data/interfaces/IDataSource.ts

- 定义了数据源状态枚举 `DataSourceState`
- 定义了数据源类型枚举 `DataSourceType`
- 定义了数据源配置接口 `DataSourceConfig`
- 定义了数据源元数据接口 `DataSourceMetadata`
- 定义了加载选项接口 `LoadOptions`
- 定义了数据源事件接口 `DataSourceEvents`
- 定义了核心数据源接口 `IDataSource`
- 定义了数据源工厂接口 `IDataSourceFactory`
- 定义了错误类 `DataSourceError`, `DataSourceLoadError`, `DataSourceTimeoutError`

#### src/core/data/interfaces/IDataSourceState.ts

- 定义了状态变更记录接口 `StateChangeRecord`
- 定义了状态管理器接口 `IDataSourceStateManager`
- 定义了状态转换规则接口 `StateTransitionRule`
- 提供了默认状态转换规则 `DEFAULT_STATE_TRANSITIONS`

#### src/core/data/interfaces/IDataSourceEvents.ts

- 定义了事件类型枚举 `DataSourceEventType`
- 定义了各种事件数据接口
- 定义了事件处理器类型 `DataSourceEventHandler`
- 定义了事件发射器接口 `IDataSourceEventEmitter`

#### src/core/data/interfaces/IDataSourceFactory.ts

- 定义了数据源创建器接口 `IDataSourceCreator`
- 定义了数据源注册信息接口 `DataSourceRegistration`
- 定义了工厂接口 `IDataSourceFactory`
- 定义了工厂相关错误类

#### src/core/data/interfaces/index.ts

- 统一导出所有接口

#### src/core/data/interfaces/README.md

- 完整的接口文档
- 使用示例
- 最佳实践

## 核心设计

### 1. 数据源状态机

```
Idle → Loading → Loaded → Refreshing → Loaded
  ↓       ↓         ↓          ↓
  ←─── Error ←──────┴──────────┘
```

状态转换规则:

- `Idle` → `Loading`
- `Loading` → `Loaded` | `Error`
- `Loaded` → `Refreshing` | `Loading` | `Idle`
- `Error` → `Loading` | `Idle`
- `Refreshing` → `Loaded` | `Error`

### 2. 数据源类型

- `Static`: 静态数据
- `API`: REST API
- `Database`: 数据库
- `WebSocket`: WebSocket连接
- `Custom`: 自定义类型

### 3. 事件系统

- `state-change`: 状态变更
- `before-load`: 加载前
- `after-load`: 加载后
- `data-change`: 数据变更
- `error`: 错误
- `refresh`: 刷新
- `dispose`: 销毁

### 4. 工厂模式

支持注册和创建不同类型的数据源,实现可扩展性。

## 接口特性

### IDataSource

核心数据源接口,提供:

- 数据加载和刷新
- 状态管理
- 事件订阅
- 数据访问
- 资源清理

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

工厂接口,提供:

- 数据源创建
- 类型注册
- 配置验证
- 类型查询

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

状态管理接口,提供:

- 状态获取和设置
- 状态转换验证
- 状态历史记录
- 状态变更订阅

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

事件发射器接口,提供:

- 事件发射
- 事件订阅
- 一次性订阅
- 事件历史

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

## 设计原则

### 1. 接口隔离原则 (ISP)

每个接口只定义必要的方法,职责单一:

- `IDataSource`: 数据操作
- `IDataSourceStateManager`: 状态管理
- `IDataSourceEventEmitter`: 事件管理
- `IDataSourceFactory`: 数据源创建

### 2. 依赖倒置原则 (DIP)

依赖抽象接口而不是具体实现,便于测试和替换。

### 3. 开闭原则 (OCP)

对扩展开放,对修改关闭:

- 通过工厂模式支持自定义数据源类型
- 通过事件系统支持自定义事件处理
- 通过配置选项支持自定义行为

### 4. 单一职责原则 (SRP)

每个接口只负责一个职责,便于理解和维护。

### 5. 里氏替换原则 (LSP)

所有数据源实现都可以互相替换,不影响使用方。

## 使用示例

### 基础使用

```typescript
// 创建数据源配置
const config: DataSourceConfig = {
  id: 'users-api',
  name: 'Users API',
  type: DataSourceType.API,
  autoLoad: true,
  cacheDuration: 60000,
  options: {
    url: 'https://api.example.com/users',
  },
}

// 创建数据源
const dataSource = factory.create<User[]>(config)

// 订阅事件
dataSource.on('data-change', (data, prevData) => {
  console.log('Data updated:', data)
})

// 加载数据
const users = await dataSource.load()

// 刷新数据
await dataSource.refresh()

// 清理
dataSource.dispose()
```

### 自定义数据源

```typescript
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

// 注册
factory.register('graphql' as DataSourceType, new GraphQLDataSourceCreator(), 'GraphQL data source')
```

## 架构优势

1. **统一接口**: 所有数据源使用相同的接口,简化使用
2. **类型安全**: 完整的TypeScript类型支持
3. **可扩展**: 通过工厂模式轻松扩展新的数据源类型
4. **可测试**: 接口抽象便于单元测试和Mock
5. **可维护**: 清晰的职责划分,易于理解和维护
6. **灵活配置**: 丰富的配置选项,支持各种场景

## 下一步

任务 2.1 已完成,可以继续执行:

- **任务 2.2** - 实现响应式数据源
- **任务 2.3** - 实现数据流转换管道
- **任务 2.4** - 实现数据源插件系统

## 文件清单

- ✅ src/core/data/interfaces/IDataSource.ts
- ✅ src/core/data/interfaces/IDataSourceState.ts
- ✅ src/core/data/interfaces/IDataSourceEvents.ts
- ✅ src/core/data/interfaces/IDataSourceFactory.ts
- ✅ src/core/data/interfaces/index.ts
- ✅ src/core/data/interfaces/README.md

## 总结

任务 2.1 已成功完成,设计了一套完整、清晰、可扩展的数据源抽象接口。这些接口为后续实现具体的数据源提供了清晰的契约和指导,是数据流引擎重构的重要基础。
