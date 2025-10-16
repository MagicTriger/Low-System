# 事件总线系统

高性能、类型安全的事件发布订阅系统。

## 核心特性

- ✅ 类型安全的事件处理
- ✅ 优先级排序
- ✅ 事件过滤器
- ✅ 异步/同步处理
- ✅ 超时控制
- ✅ 一次性订阅
- ✅ 领域事件支持
- ✅ 处理器增强函数

## 快速开始

### 基础使用

```typescript
import { EventBus } from '@/core/events'

// 创建事件总线实例
const eventBus = new EventBus()

// 订阅事件
eventBus.on('user.login', (data, context) => {
  console.log('User logged in:', data)
})

// 发布事件(同步)
eventBus.emit('user.login', { userId: '123', username: 'john' })

// 发布事件(异步)
await eventBus.emitAsync('user.login', { userId: '123', username: 'john' })
```

### 使用全局事件总线

```typescript
import { globalEventBus } from '@/core/events'

// 直接使用全局实例
globalEventBus.on('app.ready', data => {
  console.log('App is ready!')
})

globalEventBus.emit('app.ready')
```

## 高级特性

### 1. 订阅选项

```typescript
eventBus.on('data.loaded', handler, {
  priority: 10, // 优先级(数字越大越先执行)
  once: true, // 只执行一次
  async: true, // 异步执行
  timeout: 5000, // 超时时间(毫秒)
  filter: data => data.important, // 事件过滤器
})
```

### 2. 事件过滤器

```typescript
// 只处理重要的事件
eventBus.on('notification', handler, {
  filter: data => data.priority === 'high',
})

// 只处理特定用户的事件
eventBus.on('user.action', handler, {
  filter: data => data.userId === currentUserId,
})
```

### 3. 优先级控制

```typescript
// 高优先级处理器先执行
eventBus.on('data.process', highPriorityHandler, { priority: 100 })
eventBus.on('data.process', normalHandler, { priority: 50 })
eventBus.on('data.process', lowPriorityHandler, { priority: 10 })
```

### 4. 一次性订阅

```typescript
// 方式1: 使用 once 方法
eventBus.once('app.initialized', data => {
  console.log('App initialized once')
})

// 方式2: 使用 once 选项
eventBus.on('app.initialized', handler, { once: true })
```

### 5. 取消订阅

```typescript
// 方式1: 使用返回的取消函数
const unsubscribe = eventBus.on('event', handler)
unsubscribe()

// 方式2: 使用 off 方法
eventBus.off('event', handler)

// 方式3: 取消所有订阅
eventBus.off('event')

// 方式4: 清空所有订阅
eventBus.clear()
```

## 处理器增强

### 内置增强函数

#### 1. 日志增强

```typescript
import { withLogging } from '@/core/events'

const handler = withLogging(
  (data, context) => {
    console.log('Processing:', data)
  },
  console,
  'info'
)

eventBus.on('user.login', handler)
```

#### 2. 性能监控

```typescript
import { withPerformance, PerformanceCollector } from '@/core/events'

const collector = new PerformanceCollector()

const handler = withPerformance(
  (data, context) => {
    // 处理逻辑
  },
  (eventType, duration) => collector.record(eventType, duration)
)

eventBus.on('data.process', handler)

// 查看性能报告
console.log(collector.getReport())
```

#### 3. 数据验证

```typescript
import { withValidation } from '@/core/events'

const handler = withValidation(
  (data, context) => {
    // 处理逻辑
  },
  data => {
    if (!data.email) {
      return { valid: false, error: 'Email is required' }
    }
    return { valid: true }
  }
)

eventBus.on('user.create', handler)
```

#### 4. 自动重试

```typescript
import { withRetry } from '@/core/events'

const handler = withRetry(
  async (data, context) => {
    // 可能失败的操作
    await apiCall(data)
  },
  3, // 最多重试3次
  1000 // 每次间隔1秒
)

eventBus.on('api.call', handler)
```

#### 5. 超时控制

```typescript
import { withTimeout } from '@/core/events'

const handler = withTimeout(
  async (data, context) => {
    // 可能耗时的操作
    await longRunningTask(data)
  },
  5000 // 5秒超时
)

eventBus.on('long.task', handler)
```

#### 6. 错误处理

```typescript
import { withErrorHandler } from '@/core/events'

const handler = withErrorHandler(
  (data, context) => {
    // 可能抛出错误的逻辑
    throw new Error('Something went wrong')
  },
  (error, data, context) => {
    console.error('Handled error:', error.message)
    // 发送错误报告等
  }
)

eventBus.on('risky.operation', handler)
```

#### 7. 组合多个增强

```typescript
import { compose, withLogging, withRetry, withTimeout } from '@/core/events'

const handler = compose(
  (data, context) => {
    // 核心逻辑
  },
  withLogging,
  h => withRetry(h, 3, 1000),
  h => withTimeout(h, 5000)
)

eventBus.on('complex.task', handler)
```

### 工具类

#### 限流器 (Throttler)

```typescript
import { Throttler } from '@/core/events'

const throttler = new Throttler(1000) // 每秒最多执行一次

const handler = throttler.wrap((data, context) => {
  console.log('Throttled handler:', data)
})

eventBus.on('frequent.event', handler)
```

#### 防抖器 (Debouncer)

```typescript
import { Debouncer } from '@/core/events'

const debouncer = new Debouncer(300) // 延迟300ms

const handler = debouncer.wrap((data, context) => {
  console.log('Debounced handler:', data)
})

eventBus.on('input.change', handler)

// 清理防抖器
debouncer.clear('input.change')
```

#### 批处理器 (EventBatcher)

```typescript
import { EventBatcher } from '@/core/events'

const batcher = new EventBatcher<any>(10, 1000) // 10个或1秒

const batchHandler = batcher.wrap((batch, context) => {
  console.log('Processing batch:', batch.length, 'items')
  // 批量处理
})

eventBus.on('data.item', batchHandler)

// 手动刷新所有批次
await batcher.flushAll(handler, context)
```

## 领域事件

### 使用预定义的领域事件

```typescript
import {
  DataSourceLoadedEvent,
  ControlSelectedEvent,
  ControlUpdatedEvent,
  ViewChangedEvent,
  DomainEventPublisher
} from '@/core/events'

// 创建发布器
const publisher = new DomainEventPublisher(eventBus)

// 发布数据源加载事件
const dataEvent = new DataSourceLoadedEvent('datasource-1', { records: [...] })
publisher.publish(dataEvent)

// 发布控件选中事件
const selectEvent = new ControlSelectedEvent('control-1')
publisher.publish(selectEvent)

// 发布控件更新事件
const updateEvent = new ControlUpdatedEvent('control-1', {
  property: 'text',
  oldValue: 'old',
  newValue: 'new'
})
publisher.publish(updateEvent)

// 发布视图切换事件
const viewEvent = new ViewChangedEvent('design', 'preview')
publisher.publish(viewEvent)
```

### 创建自定义领域事件

```typescript
import { DomainEvent } from '@/core/events'

class UserCreatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly userData: any
  ) {
    super('user.created', userData)
  }
}

// 使用自定义事件
const event = new UserCreatedEvent('user-123', { name: 'John', email: 'john@example.com' })
publisher.publish(event)
```

## 最佳实践

### 1. 使用类型安全的事件

```typescript
// 定义事件数据类型
interface UserLoginData {
  userId: string
  username: string
  timestamp: Date
}

// 使用类型化的处理器
eventBus.on<UserLoginData>('user.login', (data, context) => {
  // data 是类型安全的
  console.log(data.userId)
})
```

### 2. 合理使用优先级

```typescript
// 验证处理器应该有最高优先级
eventBus.on('data.save', validateHandler, { priority: 100 })

// 业务逻辑处理器使用中等优先级
eventBus.on('data.save', businessHandler, { priority: 50 })

// 日志记录使用低优先级
eventBus.on('data.save', loggingHandler, { priority: 10 })
```

### 3. 使用过滤器减少不必要的处理

```typescript
// 只处理需要的事件
eventBus.on('notification', handler, {
  filter: data => {
    return data.userId === currentUserId && data.priority === 'high'
  },
})
```

### 4. 清理订阅避免内存泄漏

```typescript
class MyComponent {
  private unsubscribers: Array<() => void> = []

  mounted() {
    this.unsubscribers.push(eventBus.on('event1', this.handler1), eventBus.on('event2', this.handler2))
  }

  unmounted() {
    // 清理所有订阅
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []
  }
}
```

## API 参考

### EventBus

#### 方法

- `emit(event, data?, source?): void` - 发布事件(同步)
- `emitAsync(event, data?, source?): Promise<void>` - 发布事件(异步)
- `on<T>(event, handler, options?): Unsubscribe` - 订阅事件
- `once<T>(event, handler): Unsubscribe` - 订阅事件(一次)
- `off(event, handler?): void` - 取消订阅
- `clear(): void` - 清空所有订阅
- `getHistory(limit?): EventRecord[]` - 获取事件历史
- `getSubscriptionCount(event?): number` - 获取订阅数量
- `hasSubscription(event): boolean` - 检查是否有订阅

## 性能考虑

1. **异步处理**: 默认使用异步处理,避免阻塞主线程
2. **优先级排序**: 只在发布时排序一次,不影响订阅性能
3. **过滤器**: 在处理器执行前过滤,减少不必要的调用
4. **批处理**: 使用 EventBatcher 批量处理高频事件
5. **限流/防抖**: 使用 Throttler/Debouncer 控制执行频率

## 示例

完整示例请参考项目中的使用场景。
