# API层迁移指南

## 概述

本指南帮助开发者从旧的Axios-based API迁移到新的统一API客户端。

## 为什么要迁移?

新的API客户端提供了以下优势:

1. **统一接口**: 支持HTTP、GraphQL、WebSocket等多种协议
2. **更好的类型支持**: 完整的TypeScript类型定义
3. **内置功能**: 缓存、重试、去重等开箱即用
4. **更好的可测试性**: 易于Mock和测试
5. **插件化**: 通过适配器模式轻松扩展

## 迁移策略

### 阶段1: 保持兼容(推荐)

使用遗留适配器,无需修改现有代码:

```typescript
// 之前
import { api } from '@/core/api/request'

// 之后(无需修改)
import { api } from '@/core/api'
```

### 阶段2: 逐步迁移

逐个模块迁移到新的API客户端:

```typescript
// 创建新的API客户端
import { createApiClient } from '@/core/api'

const client = createApiClient({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 使用新客户端
const response = await client.get('/api/users')
```

### 阶段3: 完全迁移

所有代码都使用新的API客户端。

## 详细迁移步骤

### 1. 基本请求

**之前:**

```typescript
import { api } from '@/core/api/request'

const response = await api.get('/api/users')
const users = response.data.data
```

**之后:**

```typescript
import { createApiClient } from '@/core/api'

const client = createApiClient()
const response = await client.get('/api/users')
const users = response.data
```

### 2. 请求配置

**之前:**

```typescript
const response = await api.post('/api/users', userData, {
  headers: {
    'X-Custom-Header': 'value',
  },
  timeout: 5000,
})
```

**之后:**

```typescript
const response = await client.post('/api/users', userData, {
  headers: {
    'X-Custom-Header': 'value',
  },
  timeout: 5000,
})
```

### 3. 拦截器

**之前:**

```typescript
import request from '@/core/api/request'

request.interceptors.request.use(
  config => {
    config.headers.Authorization = `Bearer ${token}`
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

request.interceptors.response.use(
  response => {
    return response
  },
  error => {
    return Promise.reject(error)
  }
)
```

**之后:**

```typescript
import { createApiClient } from '@/core/api'

const client = createApiClient()

client.addRequestInterceptor(config => {
  config.headers = {
    ...config.headers,
    Authorization: `Bearer ${token}`,
  }
  return config
})

client.addResponseInterceptor(
  response => {
    return response
  },
  error => {
    throw error
  }
)
```

### 4. 错误处理

**之前:**

```typescript
try {
  const response = await api.get('/api/users')
} catch (error) {
  if (error.response) {
    console.error('HTTP Error:', error.response.status)
  } else if (error.request) {
    console.error('Network Error')
  } else {
    console.error('Error:', error.message)
  }
}
```

**之后:**

```typescript
try {
  const response = await client.get('/api/users')
} catch (error) {
  if (error.status) {
    console.error('HTTP Error:', error.status)
  } else if (error.isNetworkError) {
    console.error('Network Error')
  } else {
    console.error('Error:', error.message)
  }
}
```

### 5. 取消请求

**之前:**

```typescript
import axios from 'axios'

const source = axios.CancelToken.source()

api.get('/api/users', {
  cancelToken: source.token,
})

// 取消请求
source.cancel('Operation cancelled')
```

**之后:**

```typescript
const cancelToken = client.createCancelToken()

client.get('/api/users', {
  cancelToken,
})

// 取消请求
cancelToken.cancel('Operation cancelled')
```

### 6. 文件上传

**之前:**

```typescript
const formData = new FormData()
formData.append('file', file)

const response = await api.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  onUploadProgress: progressEvent => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100
    console.log(`Upload progress: ${progress}%`)
  },
})
```

**之后:**

```typescript
const formData = new FormData()
formData.append('file', file)

const response = await client.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  onUploadProgress: progressEvent => {
    console.log(`Upload progress: ${progressEvent.progress}%`)
  },
})
```

## 新功能使用

### 1. 请求缓存

```typescript
// 启用缓存
const response = await client.get('/api/config', {
  cache: {
    enabled: true,
    ttl: 60 * 60 * 1000, // 1小时
    strategy: 'memory', // 或 'localStorage'
  },
})
```

### 2. 自动重试

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

### 3. GraphQL支持

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

### 4. WebSocket支持

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
})
```

## 常见问题

### Q: 我需要立即迁移所有代码吗?

A: 不需要。新的API客户端提供了完整的向后兼容性,你可以逐步迁移。

### Q: 如何在迁移期间同时使用新旧API?

A: 可以同时导入两者:

```typescript
import { api as legacyApi } from '@/core/api/request'
import { createApiClient } from '@/core/api'

const newClient = createApiClient()

// 使用旧API
await legacyApi.get('/api/users')

// 使用新API
await newClient.get('/api/users')
```

### Q: 新API客户端的性能如何?

A: 新API客户端使用原生Fetch API,性能与Axios相当,并且提供了缓存和去重功能,在某些场景下性能更好。

### Q: 如何测试使用新API客户端的代码?

A: 新API客户端更容易Mock:

```typescript
import { ApiClient } from '@/core/api/ApiClient'

// Mock API客户端
const mockClient = {
  get: jest.fn().mockResolvedValue({
    data: { users: [] },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: {},
  }),
}

// 使用Mock客户端
const service = new UserService(mockClient as any)
```

### Q: 如何处理全局错误?

A: 使用响应拦截器:

```typescript
client.addResponseInterceptor(
  response => response,
  error => {
    // 全局错误处理
    if (error.status === 401) {
      // 跳转到登录页
      router.push('/login')
    } else if (error.status >= 500) {
      // 显示错误提示
      message.error('服务器错误,请稍后重试')
    }
    throw error
  }
)
```

## 迁移检查清单

- [ ] 了解新API客户端的功能和优势
- [ ] 确定迁移策略(保持兼容/逐步迁移/完全迁移)
- [ ] 更新导入语句
- [ ] 迁移拦截器
- [ ] 更新错误处理逻辑
- [ ] 更新取消请求逻辑
- [ ] 测试迁移后的功能
- [ ] 利用新功能(缓存、重试等)
- [ ] 更新文档和注释

## 获取帮助

如果在迁移过程中遇到问题,请:

1. 查看[API文档](./README.md)
2. 查看[示例代码](./examples/)
3. 提交Issue或联系开发团队

## 相关资源

- [API客户端文档](./README.md)
- [适配器文档](./adapters/README.md)
- [缓存策略文档](./cache/README.md)
- [拦截器文档](./interceptors/README.md)
