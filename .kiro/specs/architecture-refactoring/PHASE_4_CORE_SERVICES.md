# 阶段4: 核心服务迁移

## 概述

阶段4将核心服务(依赖注入容器、事件总线、配置管理器、日志系统)集成到迁移系统中。

## 已完成的工作

### 1. 核心服务检查 ✅

检查了现有的核心服务实现:

- ✅ **依赖注入容器** (`src/core/di/Container.ts`)

  - 支持单例、瞬态、作用域三种生命周期
  - 支持循环依赖检测
  - 支持标签查询
  - 支持父子容器

- ✅ **事件总线** (`src/core/events/EventBus.ts`)

  - 支持同步/异步事件
  - 支持优先级
  - 支持过滤器
  - 支持事件历史
  - 支持超时控制

- ✅ **配置管理器** (`src/core/config/ConfigManager.ts`)

  - 支持多环境
  - 支持多配置源
  - 支持热更新
  - 支持验证
  - 支持监听变更

- ✅ **日志系统** (`src/core/logging/Logger.ts`)
  - 支持多级别日志
  - 支持多传输器
  - 支持过滤器
  - 支持子日志器
  - 支持上下文

### 2. 核心服务集成 ✅

创建了 `CoreServicesIntegration.ts`:

```typescript
// 集成核心服务
const coreServices = await integrateCoreServices(compatLayer, featureFlags, {
  useGlobalInstances: true,
  registerToCompatLayer: true,
  verbose: true,
})
```

**功能**:

- 注册服务到DI容器
- 注册服务到兼容层
- 配置服务间依赖关系
- 初始化服务

### 3. 更新启动流程 ✅

更新了 `bootstrap.ts`:

- 在迁移系统初始化后集成核心服务
- 暴露核心服务到全局对象(开发环境)
- 添加详细日志

## 核心服务API

### 依赖注入容器

```typescript
// 获取容器
const container = window.__MIGRATION_SYSTEM__.coreServices.container

// 注册服务
container.register(
  'MyService',
  {
    useClass: MyService,
    deps: ['Logger', 'EventBus'],
  },
  { lifetime: 'singleton' }
)

// 解析服务
const myService = container.resolve('MyService')

// 检查服务
const has = container.has('MyService')

// 按标签查询
const services = container.getByTag('plugin')
```

### 事件总线

```typescript
// 获取事件总线
const eventBus = window.__MIGRATION_SYSTEM__.coreServices.eventBus

// 订阅事件
const unsubscribe = eventBus.on(
  'user.login',
  (data, context) => {
    console.log('User logged in:', data)
  },
  {
    priority: 10,
    async: true,
    filter: data => data.userId !== 'admin',
  }
)

// 发布事件
eventBus.emit('user.login', { userId: '123', name: 'John' })

// 异步发布
await eventBus.emitAsync('user.login', { userId: '123' })

// 一次性订阅
eventBus.once('app.ready', () => {
  console.log('App is ready')
})

// 取消订阅
unsubscribe()

// 查看历史
const history = eventBus.getHistory(10)
```

### 配置管理器

```typescript
// 获取配置管理器
const config = window.__MIGRATION_SYSTEM__.coreServices.config

// 获取配置
const apiUrl = config.get('api.url', 'http://localhost:3000')

// 设置配置
config.set('api.timeout', 5000)

// 监听配置变更
const unwatch = config.watch('api.url', event => {
  console.log('API URL changed:', event.oldValue, '->', event.newValue)
})

// 监听所有变更
config.watchAll(event => {
  console.log('Config changed:', event.key)
})

// 合并配置
config.merge({
  api: {
    url: 'https://api.example.com',
    timeout: 10000,
  },
})

// 重新加载
await config.reload()

// 验证配置
const result = config.validate()
if (!result.valid) {
  console.error('Config validation failed:', result.errors)
}
```

### 日志系统

```typescript
// 获取日志器
const logger = window.__MIGRATION_SYSTEM__.coreServices.logger

// 记录日志
logger.debug('Debug message', { userId: '123' })
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message', new Error('Something went wrong'))
logger.fatal('Fatal error', new Error('Critical failure'))

// 创建子日志器
const childLogger = logger.child('MyModule', { moduleId: 'mod-123' })
childLogger.info('Module initialized')

// 设置日志级别
logger.setLevel(LogLevel.Debug)

// 添加传输器
logger.addTransport({
  name: 'console',
  level: LogLevel.Info,
  log: record => {
    console.log(`[${record.level}] ${record.message}`)
  },
})

// 刷新日志
await logger.flush()
```

## 兼容层映射

核心服务已注册到兼容层,支持以下旧版API:

### 容器相关

```typescript
// 旧版
container.get('MyService')

// 新版 (通过兼容层自动转换)
container.resolve('MyService')
```

### 事件相关

```typescript
// 旧版
eventBus.on('event', handler)
eventBus.emit('event', data)

// 新版 (已兼容)
eventBus.on('event', handler)
eventBus.emit('event', data)
```

### 配置相关

```typescript
// 旧版
config.get('key')
config.set('key', value)

// 新版 (已兼容)
config.get('key')
config.set('key', value)
```

## 全局访问

在开发环境中,可以通过全局对象访问核心服务:

```javascript
// 访问核心服务
window.__MIGRATION_SYSTEM__.coreServices

// 访问容器
window.__MIGRATION_SYSTEM__.coreServices.container

// 访问事件总线
window.__MIGRATION_SYSTEM__.coreServices.eventBus

// 访问配置管理器
window.__MIGRATION_SYSTEM__.coreServices.config

// 访问日志器
window.__MIGRATION_SYSTEM__.coreServices.logger
```

## 测试核心服务

### 测试容器

```javascript
const { container } = window.__MIGRATION_SYSTEM__.coreServices

// 注册测试服务
container.register('TestService', {
  useFactory: () => ({
    test: () => 'Hello from TestService',
  }),
})

// 解析服务
const testService = container.resolve('TestService')
console.log(testService.test()) // "Hello from TestService"

// 检查服务
console.log('Has TestService:', container.has('TestService')) // true
```

### 测试事件总线

```javascript
const { eventBus } = window.__MIGRATION_SYSTEM__.coreServices

// 订阅测试事件
eventBus.on('test.event', data => {
  console.log('Test event received:', data)
})

// 发布测试事件
eventBus.emit('test.event', { message: 'Hello' })

// 查看订阅数量
console.log('Subscriptions:', eventBus.getSubscriptionCount('test.event'))

// 查看历史
console.log('History:', eventBus.getHistory(5))
```

### 测试配置管理器

```javascript
const { config } = window.__MIGRATION_SYSTEM__.coreServices

// 设置测试配置
config.set('test.value', 123)

// 获取配置
console.log('Test value:', config.get('test.value')) // 123

// 监听变更
config.watch('test.value', event => {
  console.log('Value changed:', event.oldValue, '->', event.newValue)
})

// 修改配置
config.set('test.value', 456)

// 获取所有配置
console.log('All config:', config.getAll())
```

### 测试日志系统

```javascript
const { logger } = window.__MIGRATION_SYSTEM__.coreServices

// 记录不同级别的日志
logger.debug('Debug message')
logger.info('Info message')
logger.warn('Warning message')
logger.error('Error message', new Error('Test error'))

// 创建子日志器
const childLogger = logger.child('TestModule')
childLogger.info('Child logger message')

// 查看日志级别
console.log('Log level:', logger.getLevel())
```

## 服务间集成

核心服务已配置好相互依赖:

### 配置变更事件

```javascript
// 配置变更会自动发送事件
const { config, eventBus } = window.__MIGRATION_SYSTEM__.coreServices

eventBus.on('config.changed', event => {
  console.log('Config changed:', event.key, event.newValue)
})

config.set('test.key', 'test value')
// 会触发 config.changed 事件
```

### 日志事件

```javascript
// 错误日志会发送事件
const { logger, eventBus } = window.__MIGRATION_SYSTEM__.coreServices

eventBus.on('log.error', data => {
  console.log('Error logged:', data)
})

logger.error('Test error', new Error('Something went wrong'))
```

## 下一步

### 立即可做

1. ✅ 测试核心服务功能
2. ⏳ 更新现有代码使用新的核心服务
3. ⏳ 添加更多服务到DI容器
4. ⏳ 配置生产环境的日志传输器

### 本周计划

1. 迁移现有的服务使用DI容器
2. 统一事件命名规范
3. 完善配置schema
4. 添加日志聚合

## 验证清单

- [x] 依赖注入容器正常工作
- [x] 事件总线正常工作
- [x] 配置管理器正常工作
- [x] 日志系统正常工作
- [x] 服务已注册到兼容层
- [x] 服务间依赖配置正确
- [x] 全局访问接口可用
- [ ] 现有代码已更新使用新服务

## 总结

阶段4成功完成了核心服务的集成:

1. ✅ 检查了现有核心服务实现
2. ✅ 创建了核心服务集成模块
3. ✅ 更新了启动流程
4. ✅ 注册服务到兼容层
5. ✅ 配置服务间依赖
6. ✅ 暴露全局访问接口

所有核心服务现在都可以通过迁移系统访问,并且与兼容层、特性开关完全集成。

---

**状态**: ✅ 完成  
**完成时间**: 2025-10-12
