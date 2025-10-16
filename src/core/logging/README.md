# 日志系统

统一的日志记录系统,支持多级别、多传输器、格式化等功能。

## 核心特性

- ✅ 多日志级别 (Debug, Info, Warn, Error, Fatal)
- ✅ 多传输器支持 (Console, Memory, File, HTTP, LocalStorage)
- ✅ 灵活的格式化器
- ✅ 日志过滤
- ✅ 子日志器
- ✅ 异步刷新
- ✅ 类型安全

## 快速开始

### 基础使用

```typescript
import { globalLogger } from '@/core/logging'

// 记录不同级别的日志
globalLogger.debug('Debug message')
globalLogger.info('Info message')
globalLogger.warn('Warning message')
globalLogger.error('Error message', new Error('Something went wrong'))
globalLogger.fatal('Fatal error', new Error('Critical failure'))
```

### 带上下文的日志

```typescript
globalLogger.info('User logged in', {
  userId: '123',
  username: 'john',
  ip: '192.168.1.1',
})
```

### 创建自定义日志器

```typescript
import { Logger, ConsoleTransport, LogLevel } from '@/core/logging'

const logger = new Logger({
  source: 'my-app',
  level: LogLevel.Info,
  transports: [new ConsoleTransport(LogLevel.Debug)],
})

logger.info('Application started')
```

## 日志级别

```typescript
import { LogLevel } from '@/core/logging'

LogLevel.Debug // 0 - 调试信息
LogLevel.Info // 1 - 一般信息
LogLevel.Warn // 2 - 警告信息
LogLevel.Error // 3 - 错误信息
LogLevel.Fatal // 4 - 致命错误
```

## 传输器

### 1. 控制台传输器

```typescript
import { ConsoleTransport, ColoredFormatter } from '@/core/logging'

const transport = new ConsoleTransport(LogLevel.Debug, new ColoredFormatter())

logger.addTransport(transport)
```

### 2. 内存传输器

```typescript
import { MemoryTransport } from '@/core/logging'

const transport = new MemoryTransport(LogLevel.Debug, 1000)
logger.addTransport(transport)

// 获取日志记录
const records = transport.getRecords()

// 清空日志
transport.clear()
```

### 3. HTTP传输器

```typescript
import { HttpTransport } from '@/core/logging'

const transport = new HttpTransport(
  'https://api.example.com/logs',
  LogLevel.Warn,
  10, // 缓冲区大小
  10000 // 刷新间隔(毫秒)
)

logger.addTransport(transport)
```

### 4. LocalStorage传输器

```typescript
import { LocalStorageTransport } from '@/core/logging'

const transport = new LocalStorageTransport(
  'app-logs',
  LogLevel.Warn,
  new SimpleFormatter(),
  1000 // 最大日志数
)

logger.addTransport(transport)

// 获取存储的日志
const logs = transport.getLogs()
```

### 5. 多传输器

```typescript
import { MultiTransport, ConsoleTransport, HttpTransport } from '@/core/logging'

const transport = new MultiTransport([
  new ConsoleTransport(LogLevel.Debug),
  new HttpTransport('https://api.example.com/logs', LogLevel.Error),
])

logger.addTransport(transport)
```

## 格式化器

### 1. 简单格式化器

```typescript
import { SimpleFormatter } from '@/core/logging'

const formatter = new SimpleFormatter()
// 输出: 2025-10-12T10:30:00.000Z INFO [app] User logged in {"userId":"123"}
```

### 2. JSON格式化器

```typescript
import { JsonFormatter } from '@/core/logging'

const formatter = new JsonFormatter(true) // pretty print
// 输出: {"level":"INFO","message":"User logged in","timestamp":"2025-10-12T10:30:00.000Z",...}
```

### 3. 彩色格式化器

```typescript
import { ColoredFormatter } from '@/core/logging'

const formatter = new ColoredFormatter()
// 输出带颜色的日志
```

### 4. 自定义格式化器

```typescript
import { CustomFormatter } from '@/core/logging'

const formatter = new CustomFormatter(record => {
  return `[${record.level}] ${record.message}`
})
```

## 子日志器

```typescript
const apiLogger = logger.child('api', { service: 'user-service' })
const dbLogger = logger.child('database', { connection: 'main' })

apiLogger.info('API request') // [app.api] API request {"service":"user-service"}
dbLogger.info('Query executed') // [app.database] Query executed {"connection":"main"}
```

## 日志过滤

```typescript
// 只记录包含特定上下文的日志
logger.addFilter(record => {
  return record.context?.important === true
})

// 只记录特定来源的日志
logger.addFilter(record => {
  return record.source?.startsWith('api')
})
```

## 完整示例

```typescript
import { Logger, LogLevel, ConsoleTransport, HttpTransport, MemoryTransport, ColoredFormatter, JsonFormatter } from '@/core/logging'

// 创建日志器
const logger = new Logger({
  source: 'my-app',
  level: LogLevel.Debug,
  context: {
    version: '1.0.0',
    environment: 'production',
  },
})

// 添加控制台传输器(开发环境)
if (process.env.NODE_ENV === 'development') {
  logger.addTransport(new ConsoleTransport(LogLevel.Debug, new ColoredFormatter()))
}

// 添加HTTP传输器(生产环境)
if (process.env.NODE_ENV === 'production') {
  logger.addTransport(new HttpTransport('https://api.example.com/logs', LogLevel.Warn, 10, 10000))
}

// 添加内存传输器(用于调试)
const memoryTransport = new MemoryTransport(LogLevel.Debug, 100)
logger.addTransport(memoryTransport)

// 添加过滤器
logger.addFilter(record => {
  // 过滤敏感信息
  if (record.context?.password) {
    record.context.password = '***'
  }
  return true
})

// 使用日志器
logger.info('Application started')

try {
  // 业务逻辑
  throw new Error('Something went wrong')
} catch (error) {
  logger.error('Operation failed', error as Error, {
    operation: 'processData',
    userId: '123',
  })
}

// 刷新所有传输器
await logger.flush()

// 获取内存中的日志
const logs = memoryTransport.getRecords()
console.log('Recent logs:', logs)
```

## API 参考

### Logger

#### 方法

- `debug(message, context?)` - 记录调试日志
- `info(message, context?)` - 记录信息日志
- `warn(message, context?)` - 记录警告日志
- `error(message, error?, context?)` - 记录错误日志
- `fatal(message, error?, context?)` - 记录致命错误日志
- `log(level, message, context?, error?)` - 记录指定级别的日志
- `child(source, context?)` - 创建子日志器
- `addTransport(transport)` - 添加传输器
- `removeTransport(name)` - 移除传输器
- `setLevel(level)` - 设置日志级别
- `getLevel()` - 获取日志级别
- `addFilter(filter)` - 添加过滤器
- `flush()` - 刷新所有传输器

## 最佳实践

### 1. 使用合适的日志级别

```typescript
logger.debug('Detailed debugging info') // 开发调试
logger.info('Normal operations') // 一般信息
logger.warn('Potential issues') // 潜在问题
logger.error('Errors that need attention') // 需要关注的错误
logger.fatal('Critical failures') // 致命错误
```

### 2. 提供有用的上下文

```typescript
logger.info('User action', {
  action: 'login',
  userId: '123',
  timestamp: new Date(),
  ip: '192.168.1.1',
})
```

### 3. 记录错误时包含错误对象

```typescript
try {
  // 操作
} catch (error) {
  logger.error('Operation failed', error as Error, {
    operation: 'processData',
  })
}
```

### 4. 使用子日志器组织日志

```typescript
const apiLogger = logger.child('api')
const dbLogger = logger.child('db')
const cacheLogger = logger.child('cache')
```

### 5. 在生产环境中使用适当的日志级别

```typescript
const logger = new Logger({
  level: process.env.NODE_ENV === 'production' ? LogLevel.Warn : LogLevel.Debug,
})
```

## 性能考虑

1. **异步传输**: HTTP传输器使用缓冲和批量发送
2. **日志级别**: 设置合适的日志级别避免过多日志
3. **过滤器**: 使用过滤器减少不必要的日志
4. **内存限制**: MemoryTransport 和 LocalStorageTransport 有大小限制

## 故障排查

### 日志未输出

1. 检查日志级别设置
2. 检查传输器配置
3. 检查过滤器是否过滤了日志

### 性能问题

1. 降低日志级别
2. 减少传输器数量
3. 使用异步传输器

## 示例

完整示例请参考项目中的使用场景。
