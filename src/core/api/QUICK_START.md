# API客户端快速入门

## 5分钟上手

### 1. 基本使用

```typescript
import { createApiClient } from '@/core/api'

// 创建客户端
const client = createApiClient()

// 发送GET请求
const users = await client.get('/api/users')
console.log(users.data)

// 发送POST请求
const newUser = await client.post('/api/users', {
  name: 'John Doe',
  email: 'john@example.com',
})
```

### 2. 使用现有API(无需修改代码)

```typescript
// 继续使用现有的api对象
import { api } from '@/core/api'

const response = await api.get('/api/users')
// 完全兼容,无需修改
```

### 3. 添加认证

```typescript
import { createApiClient, authInterceptor } from '@/core/api'

const client = createApiClient()

// 添加认证拦截器
client.addRequestInterceptor(authInterceptor)

// 所有请求都会自动添加Authorization头
const response = await client.get('/api/protected')
```

### 4. 启用缓存

```typescript
// 缓存配置数据
const config = await client.get('/api/config', {
  cache: {
    enabled: true,
    ttl: 60 * 60 * 1000, // 1小时
  },
})

// 第二次请求会从缓存返回
const cachedConfig = await client.get('/api/config', {
  cache: { enabled: true },
})
```

### 5. 自动重试

```typescript
// 失败时自动重试
const data = await client.get('/api/unstable-endpoint', {
  retry: {
    times: 3,
    delay: 1000,
    backoff: 'exponential',
  },
})
```

### 6. 使用GraphQL

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

console.log(response.data)
```

### 7. 使用WebSocket

```typescript
import { WebSocketAdapter } from '@/core/api/adapters'

const adapter = new WebSocketAdapter()

await adapter.request({
  url: 'wss://api.example.com/ws',
  data: { type: 'subscribe', channel: 'updates' },
  metadata: {
    onMessage: data => {
      console.log('Received:', data)
    },
  },
  reconnect: {
    enabled: true,
    maxAttempts: 5,
    delay: 1000,
  },
})
```

### 8. 错误处理

```typescript
try {
  const response = await client.get('/api/users')
} catch (error) {
  if (error.status === 401) {
    console.log('未授权,请登录')
  } else if (error.isNetworkError) {
    console.log('网络错误')
  } else if (error.isTimeoutError) {
    console.log('请求超时')
  } else {
    console.log('未知错误:', error.message)
  }
}
```

### 9. 取消请求

```typescript
const cancelToken = client.createCancelToken()

// 发送请求
const promise = client.get('/api/large-data', { cancelToken })

// 5秒后取消
setTimeout(() => {
  cancelToken.cancel('用户取消')
}, 5000)

try {
  await promise
} catch (error) {
  if (error.isCancelError) {
    console.log('请求已取消')
  }
}
```

### 10. 自定义拦截器

```typescript
// 添加请求拦截器
client.addRequestInterceptor(config => {
  console.log('发送请求:', config.url)
  config.headers = {
    ...config.headers,
    'X-Custom-Header': 'value',
  }
  return config
})

// 添加响应拦截器
client.addResponseInterceptor(
  response => {
    console.log('收到响应:', response.status)
    return response
  },
  error => {
    console.error('请求失败:', error.message)
    throw error
  }
)
```

## 常用场景

### 场景1: 用户登录

```typescript
import { createApiClient } from '@/core/api'

const client = createApiClient()

async function login(username: string, password: string) {
  try {
    const response = await client.post('/api/auth/login', {
      username,
      password,
    })

    // 保存token
    localStorage.setItem('auth_token', response.data.token)

    return response.data
  } catch (error) {
    if (error.status === 401) {
      throw new Error('用户名或密码错误')
    }
    throw error
  }
}
```

### 场景2: 文件上传

```typescript
async function uploadFile(file: File) {
  const formData = new FormData()
  formData.append('file', file)

  const response = await client.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: progress => {
      console.log(`上传进度: ${progress.progress}%`)
    },
  })

  return response.data
}
```

### 场景3: 分页加载

```typescript
async function loadUsers(page: number, pageSize: number) {
  const response = await client.get('/api/users', {
    params: {
      page,
      pageSize,
    },
    cache: {
      enabled: true,
      ttl: 5 * 60 * 1000, // 5分钟
    },
  })

  return response.data
}
```

### 场景4: 实时通知

```typescript
import { WebSocketAdapter } from '@/core/api/adapters'

const wsAdapter = new WebSocketAdapter()

async function subscribeToNotifications(userId: string) {
  await wsAdapter.request({
    url: `wss://api.example.com/notifications/${userId}`,
    messageType: 'json',
    metadata: {
      onMessage: notification => {
        console.log('新通知:', notification)
        // 显示通知
        showNotification(notification)
      },
    },
    reconnect: {
      enabled: true,
      maxAttempts: 10,
      delay: 2000,
    },
    heartbeat: {
      enabled: true,
      interval: 30000,
      message: { type: 'ping' },
    },
  })
}
```

## 下一步

- 查看[完整文档](./README.md)了解所有功能
- 查看[迁移指南](./MIGRATION_GUIDE.md)了解如何迁移现有代码
- 查看[示例代码](./examples/)了解更多使用场景

## 获取帮助

如有问题,请:

1. 查看文档
2. 查看示例代码
3. 提交Issue
4. 联系开发团队
