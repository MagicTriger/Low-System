# 监控系统

强大的性能监控和指标收集系统。

## 核心特性

- ✅ 多种指标类型 (Counter, Gauge, Histogram)
- ✅ 性能追踪
- ✅ 统计分析
- ✅ 标签支持
- ✅ 类型安全

## 快速开始

### 基础使用

```typescript
import { globalMonitor } from '@/core/monitoring'

// 创建计数器
const requestCounter = globalMonitor.counter('http_requests_total')
requestCounter.inc() // 增加1
requestCounter.inc(5) // 增加5

// 创建仪表
const activeUsers = globalMonitor.gauge('active_users')
activeUsers.set(100)
activeUsers.inc(10)
activeUsers.dec(5)

// 创建直方图
const responseTime = globalMonitor.histogram('http_response_time_seconds')
responseTime.observe(0.5)
responseTime.observe(1.2)
```

### 性能追踪

```typescript
// 方式1: 手动追踪
const trace = globalMonitor.startTrace('api_call')
try {
  await apiCall()
  trace.end(true)
} catch (error) {
  trace.end(false, error.message)
}

// 方式2: 使用装饰器(需要配合DI)
@Trace('processData')
async function processData() {
  // 处理逻辑
}
```

## 指标类型

### 1. 计数器 (Counter)

只能增加的指标,用于计数。

```typescript
const counter = globalMonitor.counter('requests_total')

// 增加计数
counter.inc()
counter.inc(5)

// 带标签
counter.inc(1, { method: 'GET', path: '/api/users' })

// 获取当前值
const value = counter.get()
const valueWithLabels = counter.get({ method: 'GET' })

// 重置
counter.reset()
```

### 2. 仪表 (Gauge)

可以增加或减少的指标,用于测量当前值。

```typescript
const gauge = globalMonitor.gauge('memory_usage_bytes')

// 设置值
gauge.set(1024000)

// 增加/减少
gauge.inc(1000)
gauge.dec(500)

// 带标签
gauge.set(2048000, { type: 'heap' })

// 获取当前值
const value = gauge.get()
```

### 3. 直方图 (Histogram)

观察值的分布,用于统计分析。

```typescript
const histogram = globalMonitor.histogram('response_time_seconds')

// 观察值
histogram.observe(0.5)
histogram.observe(1.2)
histogram.observe(0.8)

// 带标签
histogram.observe(0.3, { endpoint: '/api/users' })

// 获取统计信息
const stats = histogram.getStats()
console.log(stats)
// {
//   count: 3,
//   sum: 2.5,
//   min: 0.5,
//   max: 1.2,
//   mean: 0.833,
//   p50: 0.8,
//   p95: 1.2,
//   p99: 1.2
// }
```

## 性能追踪

### 基础追踪

```typescript
const trace = globalMonitor.startTrace('database_query', {
  query: 'SELECT * FROM users',
  database: 'main',
})

try {
  const result = await db.query('SELECT * FROM users')
  trace.end(true)
  return result
} catch (error) {
  trace.end(false, error.message)
  throw error
}
```

### 函数包装

```typescript
async function withTrace<T>(operation: string, fn: () => Promise<T>): Promise<T> {
  const trace = globalMonitor.startTrace(operation)
  try {
    const result = await fn()
    trace.end(true)
    return result
  } catch (error) {
    trace.end(false, error.message)
    throw error
  }
}

// 使用
const result = await withTrace('api_call', async () => {
  return await fetch('/api/data')
})
```

## 标签使用

标签用于区分同一指标的不同维度。

```typescript
const requestCounter = globalMonitor.counter('http_requests_total')

// 按方法和路径统计
requestCounter.inc(1, { method: 'GET', path: '/api/users' })
requestCounter.inc(1, { method: 'POST', path: '/api/users' })
requestCounter.inc(1, { method: 'GET', path: '/api/posts' })

// 获取特定标签的值
const getRequests = requestCounter.get({ method: 'GET' })
```

## 获取指标

```typescript
// 获取所有指标
const metrics = globalMonitor.getMetrics()

// 获取性能指标
const perfMetrics = globalMonitor.getPerformanceMetrics()

// 清空指标
globalMonitor.clear()
```

## 完整示例

```typescript
import { Monitor } from '@/core/monitoring'

// 创建监控器
const monitor = new Monitor({
  enabled: true,
  maxPerformanceMetrics: 1000,
  enableDebug: false,
})

// 创建指标
const httpRequests = monitor.counter('http_requests_total')
const activeConnections = monitor.gauge('active_connections')
const requestDuration = monitor.histogram('http_request_duration_seconds')

// API 请求处理
async function handleRequest(req: Request) {
  // 增加请求计数
  httpRequests.inc(1, {
    method: req.method,
    path: req.url,
  })

  // 增加活跃连接
  activeConnections.inc()

  // 开始性能追踪
  const trace = monitor.startTrace('http_request', {
    method: req.method,
    path: req.url,
  })

  try {
    const response = await processRequest(req)

    // 记录响应时间
    const duration = (Date.now() - trace.startTime.getTime()) / 1000
    requestDuration.observe(duration, {
      method: req.method,
      status: response.status.toString(),
    })

    trace.end(true)
    return response
  } catch (error) {
    trace.end(false, error.message)
    throw error
  } finally {
    // 减少活跃连接
    activeConnections.dec()
  }
}

// 定期输出指标
setInterval(() => {
  const metrics = monitor.getMetrics()
  console.log('Metrics:', metrics)

  const perfMetrics = monitor.getPerformanceMetrics()
  console.log('Performance:', perfMetrics)
}, 60000) // 每分钟
```

## 与日志系统集成

```typescript
import { globalLogger } from '@/core/logging'
import { globalMonitor } from '@/core/monitoring'

// 记录性能指标到日志
const perfMetrics = globalMonitor.getPerformanceMetrics()
perfMetrics.forEach(metric => {
  if (!metric.success) {
    globalLogger.warn('Operation failed', {
      operation: metric.operation,
      duration: metric.duration,
      error: metric.error,
    })
  }
})

// 记录慢操作
const trace = globalMonitor.startTrace('slow_operation')
// ... 操作
trace.end(true)

const duration = Date.now() - trace.startTime.getTime()
if (duration > 1000) {
  globalLogger.warn('Slow operation detected', {
    operation: 'slow_operation',
    duration,
  })
}
```

## API 参考

### Monitor

#### 方法

- `counter(name, help?)` - 创建计数器
- `gauge(name, help?)` - 创建仪表
- `histogram(name, help?, buckets?)` - 创建直方图
- `recordPerformance(metric)` - 记录性能指标
- `startTrace(operation, metadata?)` - 开始性能追踪
- `getMetrics()` - 获取所有指标
- `getPerformanceMetrics()` - 获取性能指标
- `clear()` - 清空指标

### Counter

- `inc(value?, labels?)` - 增加计数
- `get(labels?)` - 获取当前值
- `reset(labels?)` - 重置计数

### Gauge

- `set(value, labels?)` - 设置值
- `inc(value?, labels?)` - 增加值
- `dec(value?, labels?)` - 减少值
- `get(labels?)` - 获取当前值

### Histogram

- `observe(value, labels?)` - 观察值
- `getStats(labels?)` - 获取统计信息

## 最佳实践

### 1. 使用有意义的指标名称

```typescript
// 好的命名
const httpRequestsTotal = monitor.counter('http_requests_total')
const memoryUsageBytes = monitor.gauge('memory_usage_bytes')
const responseTimeSeconds = monitor.histogram('http_response_time_seconds')

// 避免
const counter1 = monitor.counter('c1')
```

### 2. 使用标签区分维度

```typescript
// 使用标签而不是创建多个指标
requestCounter.inc(1, { method: 'GET', status: '200' })
requestCounter.inc(1, { method: 'POST', status: '201' })
```

### 3. 追踪关键操作

```typescript
// 追踪数据库查询
const trace = monitor.startTrace('db_query', { table: 'users' })
// ...
trace.end(true)

// 追踪API调用
const trace = monitor.startTrace('api_call', { endpoint: '/api/data' })
// ...
trace.end(true)
```

### 4. 定期清理旧指标

```typescript
// 定期清理性能指标
setInterval(() => {
  const metrics = monitor.getPerformanceMetrics()
  // 只保留最近的指标
  // ...
}, 3600000) // 每小时
```

## 性能考虑

1. **标签数量**: 避免使用过多的标签组合
2. **直方图桶**: 合理设置直方图的桶数量
3. **指标数量**: 控制指标总数,避免内存占用过大
4. **清理策略**: 定期清理不需要的指标

## 示例

完整示例请参考项目中的使用场景。
