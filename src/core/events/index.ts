/**
 * 事件总线模块
 * 提供类型安全的事件发布订阅机制
 *
 * @example
 * ```typescript
 * // 订阅事件
 * eventBus.on('user.login', (data, context) => {
 *   console.log('User logged in:', data)
 * }, { priority: 10 })
 *
 * // 发布事件
 * eventBus.emit('user.login', { userId: '123', username: 'john' })
 *
 * // 异步发布
 * await eventBus.emitAsync('data.loaded', { records: [...] })
 *
 * // 使用领域事件
 * const event = new DataSourceLoadedEvent('ds1', data)
 * publisher.publish(event)
 * ```
 */

// 导出类型
export type {
  EventHandler,
  Unsubscribe,
  EventFilter,
  EventContext,
  SubscribeOptions,
  EventSubscription,
  EventRecord,
  IEventBus,
} from './types'

// 导出错误类
export { EventBusError, EventHandlerTimeoutError } from './types'

// 导出事件总线
export { EventBus, globalEventBus } from './EventBus'

// 导出领域事件
export {
  DomainEvent,
  DomainEventPublisher,
  DataSourceLoadedEvent,
  ControlSelectedEvent,
  ControlUpdatedEvent,
  ViewChangedEvent,
} from './DomainEvent'

// 导出中间件和工具函数
export {
  withLogging,
  withPerformance,
  withValidation,
  withRetry,
  withTimeout,
  withErrorHandler,
  compose,
  PerformanceCollector,
  Throttler,
  Debouncer,
  EventBatcher,
} from './middlewares'
