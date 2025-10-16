# 🧪 阶段4测试指南 - 核心服务

## 快速测试

刷新浏览器后,在控制台执行以下命令测试核心服务。

### 1. 验证核心服务可用

```javascript
// 检查核心服务是否已集成
console.log('Core Services:', window.__MIGRATION_SYSTEM__.coreServices)

// 应该看到:
// {
//   container: Container,
//   eventBus: EventBus,
//   config: ConfigManager,
//   logger: Logger
// }
```

### 2. 测试依赖注入容器

```javascript
const { container } = window.__MIGRATION_SYSTEM__.coreServices

// 测试1: 注册和解析服务
container.register(
  'TestService',
  {
    useFactory: () => ({
      name: 'TestService',
      greet: name => `Hello, ${name}!`,
    }),
  },
  { lifetime: 'singleton' }
)

const testService = container.resolve('TestService')
console.log(testService.greet('World')) // "Hello, World!"

// 测试2: 检查服务
console.log('Has TestService:', container.has('TestService')) // true
console.log('Has UnknownService:', container.has('UnknownService')) // false

// 测试3: 查看所有服务
const descriptors = container.getDescriptors()
console.log('Registered services:', descriptors.length)
console.table(
  descriptors.map(d => ({
    token: String(d.token),
    lifetime: d.lifetime,
  }))
)
```

### 3. 测试事件总线

```javascript
const { eventBus } = window.__MIGRATION_SYSTEM__.coreServices

// 测试1: 订阅和发布
let receivedData = null
eventBus.on('test.event', data => {
  receivedData = data
  console.log('Event received:', data)
})

eventBus.emit('test.event', { message: 'Hello from event bus!' })
console.log('Received data:', receivedData)

// 测试2: 优先级
eventBus.on('priority.test', () => console.log('Priority 0'), { priority: 0 })
eventBus.on('priority.test', () => console.log('Priority 10'), { priority: 10 })
eventBus.on('priority.test', () => console.log('Priority 5'), { priority: 5 })

eventBus.emit('priority.test')
// 应该按顺序输出: Priority 10, Priority 5, Priority 0

// 测试3: 一次性订阅
let onceCount = 0
eventBus.once('once.test', () => {
  onceCount++
  console.log('Once event triggered, count:', onceCount)
})

eventBus.emit('once.test')
eventBus.emit('once.test')
console.log('Final count:', onceCount) // 应该是 1

// 测试4: 查看订阅数量
console.log('test.event subscriptions:', eventBus.getSubscriptionCount('test.event'))

// 测试5: 查看历史
console.log('Event history:', eventBus.getHistory(5))
```

### 4. 测试配置管理器

```javascript
const { config } = window.__MIGRATION_SYSTEM__.coreServices

// 测试1: 设置和获取配置
config.set('app.name', 'My App')
config.set('app.version', '2.0.0')
config.set('api.url', 'https://api.example.com')
config.set('api.timeout', 5000)

console.log('App name:', config.get('app.name'))
console.log('API URL:', config.get('api.url'))
console.log('API timeout:', config.get('api.timeout'))

// 测试2: 默认值
console.log('Unknown key:', config.get('unknown.key', 'default value'))

// 测试3: 嵌套配置
config.set('database.host', 'localhost')
config.set('database.port', 5432)
config.set('database.name', 'mydb')

console.log('Database config:', {
  host: config.get('database.host'),
  port: config.get('database.port'),
  name: config.get('database.name'),
})

// 测试4: 监听配置变更
const unwatch = config.watch('api.url', event => {
  console.log('API URL changed:')
  console.log('  Old:', event.oldValue)
  console.log('  New:', event.newValue)
  console.log('  Source:', event.source)
})

config.set('api.url', 'https://api.newdomain.com')

// 测试5: 合并配置
config.merge({
  app: {
    name: 'Updated App',
    description: 'This is a test app',
  },
  features: {
    darkMode: true,
    notifications: false,
  },
})

console.log('Merged config:', config.getAll())

// 测试6: 检查配置存在
console.log('Has app.name:', config.has('app.name'))
console.log('Has unknown.key:', config.has('unknown.key'))
```

### 5. 测试日志系统

```javascript
const { logger } = window.__MIGRATION_SYSTEM__.coreServices

// 测试1: 不同级别的日志
logger.debug('This is a debug message', { userId: '123' })
logger.info('This is an info message')
logger.warn('This is a warning message')
logger.error('This is an error message', new Error('Test error'))

// 测试2: 创建子日志器
const moduleLogger = logger.child('TestModule', { moduleId: 'mod-123' })
moduleLogger.info('Module initialized')
moduleLogger.debug('Module debug info')

// 测试3: 带上下文的日志
logger.info('User action', {
  userId: '123',
  action: 'login',
  timestamp: new Date().toISOString(),
})

// 测试4: 错误日志
try {
  throw new Error('Something went wrong')
} catch (error) {
  logger.error('Caught an error', error, {
    context: 'test',
    severity: 'high',
  })
}
```

### 6. 测试服务间集成

```javascript
const { config, eventBus, logger } = window.__MIGRATION_SYSTEM__.coreServices

// 测试1: 配置变更事件
eventBus.on('config.changed', event => {
  logger.info('Config changed', {
    key: event.key,
    oldValue: event.oldValue,
    newValue: event.newValue,
  })
})

config.set('test.integration', 'value1')
config.set('test.integration', 'value2')

// 测试2: 核心服务初始化事件
eventBus.on('core.services.initialized', data => {
  logger.info('Core services initialized', {
    services: Object.keys(data),
  })
})
```

### 7. 测试兼容层集成

```javascript
const { compatLayer } = window.__MIGRATION_SYSTEM__

// 测试1: 检查核心服务是否已注册
console.log('Container registered:', compatLayer.supports('Container'))
console.log('EventBus registered:', compatLayer.supports('EventBus'))
console.log('ConfigManager registered:', compatLayer.supports('ConfigManager'))
console.log('Logger registered:', compatLayer.supports('Logger'))

// 测试2: 通过兼容层访问服务
// (需要先配置API映射)
```

## 集成测试

### 场景1: 使用DI容器管理服务

```javascript
const { container, eventBus, config, logger } = window.__MIGRATION_SYSTEM__.coreServices

// 创建一个需要依赖的服务
class UserService {
  constructor(eventBus, config, logger) {
    this.eventBus = eventBus
    this.config = config
    this.logger = logger
  }

  login(username, password) {
    this.logger.info('User login attempt', { username })

    // 模拟登录
    const success = username && password

    if (success) {
      this.eventBus.emit('user.login', { username })
      this.logger.info('User logged in successfully', { username })
    } else {
      this.logger.warn('User login failed', { username })
    }

    return success
  }
}

// 注册服务
container.register(
  'UserService',
  {
    useFactory: (eventBus, config, logger) => {
      return new UserService(eventBus, config, logger)
    },
    deps: ['EventBus', 'ConfigManager', 'Logger'],
  },
  { lifetime: 'singleton' }
)

// 使用服务
const userService = container.resolve('UserService')
userService.login('testuser', 'password123')
```

### 场景2: 事件驱动架构

```javascript
const { eventBus, logger } = window.__MIGRATION_SYSTEM__.coreServices

// 设置事件监听器
eventBus.on('user.login', data => {
  logger.info('User login event received', data)
})

eventBus.on('user.logout', data => {
  logger.info('User logout event received', data)
})

eventBus.on('data.updated', data => {
  logger.info('Data updated event received', data)
})

// 触发事件
eventBus.emit('user.login', { userId: '123', username: 'john' })
eventBus.emit('data.updated', { entity: 'user', id: '123' })
eventBus.emit('user.logout', { userId: '123' })
```

### 场景3: 配置驱动行为

```javascript
const { config, logger } = window.__MIGRATION_SYSTEM__.coreServices

// 设置配置
config.set('features.darkMode', true)
config.set('features.notifications', true)
config.set('api.retryCount', 3)
config.set('api.timeout', 5000)

// 根据配置执行不同逻辑
function processRequest() {
  const retryCount = config.get('api.retryCount', 1)
  const timeout = config.get('api.timeout', 3000)

  logger.info('Processing request', { retryCount, timeout })

  // 模拟请求处理
  return { retryCount, timeout }
}

const result = processRequest()
console.log('Request processed:', result)

// 监听配置变更并重新处理
config.watch('api.retryCount', event => {
  logger.info('Retry count changed, reprocessing...')
  processRequest()
})

config.set('api.retryCount', 5)
```

## 性能测试

### 测试1: 容器解析性能

```javascript
const { container } = window.__MIGRATION_SYSTEM__.coreServices

// 注册测试服务
container.register(
  'PerfTestService',
  {
    useFactory: () => ({ test: () => 'test' }),
  },
  { lifetime: 'singleton' }
)

// 测试1000次解析
console.time('Container resolve (1000 times)')
for (let i = 0; i < 1000; i++) {
  container.resolve('PerfTestService')
}
console.timeEnd('Container resolve (1000 times)')
// 应该 < 10ms
```

### 测试2: 事件发布性能

```javascript
const { eventBus } = window.__MIGRATION_SYSTEM__.coreServices

// 注册监听器
eventBus.on('perf.test', () => {})

// 测试1000次发布
console.time('Event emit (1000 times)')
for (let i = 0; i < 1000; i++) {
  eventBus.emit('perf.test', { index: i })
}
console.timeEnd('Event emit (1000 times)')
// 应该 < 50ms
```

### 测试3: 配置读取性能

```javascript
const { config } = window.__MIGRATION_SYSTEM__.coreServices

config.set('perf.test', 'value')

// 测试1000次读取
console.time('Config get (1000 times)')
for (let i = 0; i < 1000; i++) {
  config.get('perf.test')
}
console.timeEnd('Config get (1000 times)')
// 应该 < 5ms
```

## 测试清单

完成以下测试项:

### 依赖注入容器

- [ ] 注册服务
- [ ] 解析服务
- [ ] 检查服务存在
- [ ] 查看所有服务
- [ ] 单例生命周期
- [ ] 瞬态生命周期
- [ ] 依赖注入

### 事件总线

- [ ] 订阅事件
- [ ] 发布事件
- [ ] 优先级排序
- [ ] 一次性订阅
- [ ] 取消订阅
- [ ] 查看订阅数量
- [ ] 查看事件历史

### 配置管理器

- [ ] 设置配置
- [ ] 获取配置
- [ ] 默认值
- [ ] 嵌套配置
- [ ] 监听变更
- [ ] 合并配置
- [ ] 检查存在

### 日志系统

- [ ] 不同级别日志
- [ ] 子日志器
- [ ] 带上下文日志
- [ ] 错误日志

### 集成测试

- [ ] 服务间依赖
- [ ] 配置变更事件
- [ ] 事件驱动架构
- [ ] 配置驱动行为

### 性能测试

- [ ] 容器解析 < 10ms/1000次
- [ ] 事件发布 < 50ms/1000次
- [ ] 配置读取 < 5ms/1000次

## 测试结果

记录测试结果:

```
测试日期: 2025-10-12
测试人员: [你的名字]
测试环境: Chrome/Edge/Firefox [版本]

依赖注入容器: ✅ 通过
事件总线: ✅ 通过
配置管理器: ✅ 通过
日志系统: ✅ 通过
集成测试: ✅ 通过
性能测试: ✅ 通过

总体评价: 🟢 优秀
```

## 下一步

测试通过后:

1. 开始阶段5：迁移数据层
2. 更新现有代码使用新的核心服务
3. 添加更多服务到DI容器
4. 配置生产环境的日志传输器

---

**祝测试顺利！** 🧪
