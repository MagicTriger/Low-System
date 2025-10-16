# API层重构文档

## 概述

本模块实现了统一的API客户端,支持多种协议、请求缓存、自动重试、请求去重等功能。

## 架构设计

```
src/core/api/
├── IApiClient.ts           # API客户端接口定义
├── ApiClient.ts            # API客户端实现
├── types.ts                # 类型定义
├── adapters/               # 协议适配器
│   ├── IApiAdapter.ts      # 适配器接口
│   ├── HttpAdapter.ts      # HTTP适配器
│   ├── GraphQLAdapter.ts   # GraphQL适配器
│   ├── WebSocketAdapter.ts # WebSocket适配器
│   └── AdapterRegistry.ts  # 适配器注册表
├── cache/                  # 缓存策略
│   ├── ICacheStrategy.ts   # 缓存接口
│   ├── MemoryCacheStrategy.ts      # 内存缓存
│   ├── LocalStorageCacheStrategy.ts # LocalStorage缓存
│   └── CacheManager.ts     # 缓存管理器
├── retry/                  # 重试机制
│   └── RetryManager.ts     # 重试管理器
├── deduplication/          # 请求去重
│   └── RequestDeduplicator.ts # 去重器
├── interceptors/           # 拦截器
│   └── index.ts            # 内置拦截器
└── compat/                 # 兼容层
    └── LegacyApiAdapter.ts # 遗留API适配器
```

## 核心功能

### 1. 统一的API接口

```typescript
import { ApiClient } from '@/core/api/ApiClient'

const client = new ApiClient({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// GET请求
const response = await client.get('/api/users')

// POST请求
const response = await client.post('/api/users', {
  name: 'John',
  email: 'john@example.com',
})
```

### 2. 拦截器

```typescript
// 添加请求拦截器
client.addRequestInterceptor(config => {
  config.headers.Authorization = `Bearer ${token}`
  return config
})

// 添加响应拦截器
client.addResponseInterceptor(
  response => {
    console.log('Response:', response)
    return response
  },
  error => {
    console.error('Error:', error)
    throw error
  }
)
```

### 3. 请求缓存

```typescript
// 启用缓存
const response = await client.get('/api/users', {
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000, // 5分钟
    strategy: 'memory', // 或 'localStorage'
  },
})
```

### 4. 自动重试

```typescript
// 配置重试
const response = await client.get('/api/users', {
  retry: {
    times: 3,
    delay: 1000,
    backoff: 'exponential',
    shouldRetry: error => error.status >= 500,
  },
})
```

### 5. 请求取消

```typescript
// 创建取消令牌
const cancelToken = client.createCancelToken()

// 发送请求
const promise = client.get('/api/users', { cancelToken })

// 取消请求
cancelToken.cancel('User cancelled')
```

### 6. 多协议支持

#### HTTP/HTTPS

```typescript
import { HttpAdapter } from '@/core/api/adapters'

const adapter = new HttpAdapter()
const response = await adapter.request({
  url: 'https://api.example.com/users',
  method: 'GET',
})
```

#### GraphQL

```typescript
import { GraphQLAdapter, GraphQLQueryBuilder } from '@/core/api/adapters'

const adapter = new GraphQLAdapter()

const query = new GraphQLQueryBuilder()
  .setQuery(
    `
    query GetUser($id: ID!) {
      user(id: $id) {
        id
        name
        email
      }
    }
  `
  )
  .setVariables({ id: '123' })
  .build()

const response = await adapter.request({
  url: 'https://api.example.com/graphql',
  ...query,
})
```

#### WebSocket

```typescript
import { WebSocketAdapter } from '@/core/api/adapters'

const adapter = new WebSocketAdapter()

const response = await adapter.request({
  url: 'wss://api.example.com/ws',
  data: { type: 'subscribe', channel: 'updates' },
  messageType: 'json',
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 1000,
  },
  heartbeat: {
    enabled: true,
    interval: 30000,
    message: { type: 'ping' },
  },
})
```

## 向后兼容

为了保持向后兼容,提供了遗留API适配器:

```typescript
import { LegacyApiAdapter } from '@/core/api/compat/LegacyApiAdapter'

// 创建适配器
const api = new LegacyApiAdapter()

// 使用方式与原来的axios实例相同
const response = await api.get('/api/users')
```

## 迁移指南

### 1. 更新导入

**之前:**

```typescript
import { api } from '@/core/api/request'
```

**之后:**

```typescript
import { api } from '@/core/api'
// 或使用新的API客户端
import { ApiClient } from '@/core/api/ApiClient'
```

### 2. 使用新的API客户端

**之前:**

```typescript
const response = await api.get('/api/users')
const data = response.data.data
```

**之后:**

```typescript
const client = new ApiClient()
const response = await client.get('/api/users')
const data = response.data
```

### 3. 配置拦截器

**之前:**

```typescript
request.interceptors.request.use(config => {
  // ...
  return config
})
```

**之后:**

```typescript
client.addRequestInterceptor(config => {
  // ...
  return config
})
```

## 最佳实践

### 1. 使用依赖注入

```typescript
import { Container } from '@/core/di'
import { ApiClient } from '@/core/api/ApiClient'

// 注册API客户端
Container.register('ApiClient', {
  useFactory: () =>
    new ApiClient({
      timeout: 30000,
    }),
})

// 在服务中使用
class UserService {
  constructor(private apiClient: ApiClient) {}

  async getUsers() {
    return this.apiClient.get('/api/users')
  }
}
```

### 2. 创建专用客户端

```typescript
// 为不同的API创建专用客户端
const authClient = new ApiClient({
  url: 'https://auth.example.com',
  timeout: 10000,
})

const dataClient = new ApiClient({
  url: 'https://api.example.com',
  timeout: 30000,
  cache: {
    enabled: true,
    ttl: 5 * 60 * 1000,
  },
})
```

### 3. 使用拦截器处理通用逻辑

```typescript
import { authInterceptor, requestIdInterceptor, loggingInterceptor } from '@/core/api/interceptors'

// 添加通用拦截器
client.addRequestInterceptor(authInterceptor)
client.addRequestInterceptor(requestIdInterceptor)
client.addResponseInterceptor(loggingInterceptor.response, loggingInterceptor.error)
```

## 性能优化

### 1. 启用缓存

对于不经常变化的数据,启用缓存可以显著提高性能:

```typescript
const response = await client.get('/api/config', {
  cache: {
    enabled: true,
    ttl: 60 * 60 * 1000, // 1小时
  },
})
```

### 2. 请求去重

防止重复请求:

```typescript
import { globalRequestDeduplicator } from '@/core/api/deduplication/RequestDeduplicator'

// 自动去重相同的请求
const response = await globalRequestDeduplicator.deduplicate(config, () => client.request(config))
```

### 3. 批量请求

```typescript
// 并行发送多个请求
const [users, posts, comments] = await Promise.all([client.get('/api/users'), client.get('/api/posts'), client.get('/api/comments')])
```

## 错误处理

```typescript
try {
  const response = await client.get('/api/users')
} catch (error) {
  if (error.isNetworkError) {
    console.error('Network error')
  } else if (error.isTimeoutError) {
    console.error('Request timeout')
  } else if (error.status === 401) {
    console.error('Unauthorized')
  } else {
    console.error('Unknown error:', error.message)
  }
}
```

## 测试

```typescript
import { ApiClient } from '@/core/api/ApiClient'

describe('ApiClient', () => {
  let client: ApiClient

  beforeEach(() => {
    client = new ApiClient()
  })

  it('should send GET request', async () => {
    const response = await client.get('/api/users')
    expect(response.status).toBe(200)
  })

  it('should retry on failure', async () => {
    const response = await client.get('/api/users', {
      retry: {
        times: 3,
        delay: 100,
      },
    })
    expect(response.status).toBe(200)
  })
})
```

## 相关需求

- 需求 8.1: 统一的请求/响应接口 ✅
- 需求 8.2: 通过适配器模式扩展新协议 ✅
- 需求 8.3: 重试、降级和熔断机制 ✅
- 需求 8.4: Mock数据支持 ✅
- 需求 8.5: API版本管理 ✅
- 需求 15.1-15.5: 向后兼容性 ✅
