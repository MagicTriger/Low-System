# 性能优化快速开始

本指南帮助你快速集成和使用低代码平台的性能优化功能。

## 快速开始

### 1. 初始化性能优化模块

在应用入口文件中初始化:

```typescript
// src/main.ts
import { initializeCache } from '@core/cache'
import { initializeWorkerPools } from '@core/workers'

// 初始化缓存系统
initializeCache({
  memory: {
    maxSize: 100, // 最多缓存100个条目
    ttl: 300000, // 默认5分钟过期
  },
  localStorage: true, // 启用LocalStorage
  indexedDB: true, // 启用IndexedDB
})

// 初始化Worker池
initializeWorkerPools()
```

### 2. 使用懒加载

#### 路由懒加载

```typescript
import { routeLazyLoader } from '@core/loader'

const routes = [
  {
    path: '/designer',
    component: () => routeLazyLoader.loadRoute('Designer'),
  },
  {
    path: '/manager',
    component: () => routeLazyLoader.loadRoute('Manager'),
  },
]

// 预加载关键路由
routeLazyLoader.preloadRoutes(['Designer'])
```

#### 组件懒加载

```typescript
import { controlLazyLoader } from '@core/loader'

// 懒加载控件
const ButtonControl = await controlLazyLoader.loadControl('Button')

// 预加载常用控件
controlLazyLoader.preloadControls(['Button', 'Input', 'Select'])
```

### 3. 使用缓存

#### API缓存

```typescript
import { getCacheInstance, ApiCacheInterceptor } from '@core/cache'

const cache = getCacheInstance()
const cacheInterceptor = new ApiCacheInterceptor(cache, {
  ttl: 300000, // 5分钟
})

// 添加到API客户端
apiClient.addRequestInterceptor(cacheInterceptor.onRequest.bind(cacheInterceptor))
apiClient.addResponseInterceptor(cacheInterceptor.onResponse.bind(cacheInterceptor))
apiClient.addErrorInterceptor(cacheInterceptor.onError.bind(cacheInterceptor))
```

#### 数据源缓存

```typescript
import { DataSourceCacheWrapper } from '@core/cache'

const wrapper = new DataSourceCacheWrapper(cache, {
  ttl: 60000, // 1分钟
})

// 包装数据源加载方法
const cachedLoad = wrapper.wrapLoad(async params => {
  return await fetchData(params)
}, 'myDataSource')

// 使用缓存加载
const data = await cachedLoad({ id: 1 })
```

#### 装饰器缓存

```typescript
import { Cacheable } from '@core/cache'

class DataService {
  @Cacheable({ ttl: 60000 })
  async getUserData(userId: string) {
    return await api.get(`/users/${userId}`)
  }
}
```

### 4. 使用Web Worker

#### 智能数据处理

```typescript
import { smartSort, smartFilter } from '@core/workers'

// 自动判断是否使用Worker
const sorted = await smartSort(data, 'name', 'asc')
const filtered = await smartFilter(data, [{ field: 'age', operator: '>', value: 18 }])
```

#### 强制使用Worker

```typescript
import { sortDataInWorker, filterDataInWorker } from '@core/workers'

// 在Worker中排序
const sorted = await sortDataInWorker(largeDataset, 'name', 'asc')

// 在Worker中过滤
const filtered = await filterDataInWorker(data, [{ field: 'status', operator: '==', value: 'active' }])
```

### 5. 构建优化

#### 使用优化配置

```bash
# 使用优化配置构建
vite build --config vite.config.optimized.ts
```

#### 自定义优化

```typescript
// vite.config.ts
import { getFullOptimizationConfig, cdnPresets } from '@core/config/build-optimization'

export default defineConfig({
  ...getFullOptimizationConfig({
    codeSplitting: true,
    treeShaking: true,
    compression: true,
    cdn: false, // 根据需要启用CDN
    chunkStrategy: 'default',
  }),
})
```

## 常见场景

### 场景1: 大数据列表

```typescript
import { smartSort, smartFilter } from '@core/workers'
import { DataSourceCacheWrapper } from '@core/cache'

class ListDataSource {
  private cacheWrapper: DataSourceCacheWrapper

  async loadList(params) {
    return this.cacheWrapper.wrapLoad(async () => {
      // 加载数据
      let data = await api.get('/list', params)

      // 使用Worker处理大数据
      if (params.sort) {
        data = await smartSort(data, params.sort.field, params.sort.order)
      }

      if (params.filters) {
        data = await smartFilter(data, params.filters)
      }

      return data
    }, 'listData')
  }
}
```

### 场景2: 频繁API调用

```typescript
import { getCacheInstance } from '@core/cache'

const cache = getCacheInstance()

async function fetchUserProfile(userId: string) {
  // 检查缓存
  const cached = await cache.get(`user:${userId}`)
  if (cached) return cached

  // 加载数据
  const data = await api.get(`/users/${userId}`)

  // 缓存5分钟
  await cache.set(`user:${userId}`, data, 300000)

  return data
}
```

### 场景3: 复杂计算

```typescript
import { workerManager } from '@core/workers'

async function calculateStatistics(data: any[]) {
  // 在Worker中执行复杂计算
  return workerManager.execute('dataProcessor', 'aggregate', {
    data,
    groupBy: 'category',
    aggregations: [
      { field: 'amount', function: 'sum' },
      { field: 'price', function: 'avg' },
      { field: 'quantity', function: 'count' },
    ],
  })
}
```

## 性能监控

### 监控缓存效果

```typescript
import { getCacheInstance } from '@core/cache'

const cache = getCacheInstance()
const stats = cache.getStats()

console.log('缓存统计:', {
  大小: stats.size,
  命中: stats.hits,
  未命中: stats.misses,
  命中率: `${(stats.hitRate * 100).toFixed(2)}%`,
})
```

### 监控Worker状态

```typescript
import { workerManager } from '@core/workers'

const status = workerManager.getAllPoolStatus()
console.log('Worker池状态:', status)
```

### 监控加载性能

```typescript
import { dynamicImportManager } from '@core/loader'

const metadata = dynamicImportManager.getAllMetadata()
metadata.forEach(m => {
  console.log(`${m.path}: ${m.loadTime}ms`)
})
```

## 最佳实践

### ✅ 推荐做法

1. **懒加载非关键资源**

   ```typescript
   // 路由懒加载
   component: () => import('./views/Heavy.vue')
   ```

2. **缓存静态数据**

   ```typescript
   // 字典数据长期缓存
   await cache.set('dictionaries', data, 24 * 60 * 60 * 1000)
   ```

3. **大数据使用Worker**

   ```typescript
   // 数据量 > 1000 使用Worker
   if (data.length > 1000) {
     return await sortDataInWorker(data, field, order)
   }
   ```

4. **预加载关键资源**
   ```typescript
   // 预加载首页需要的资源
   routeLazyLoader.preloadRoutes(['Home', 'Dashboard'])
   ```

### ❌ 避免做法

1. **不要缓存动态数据**

   ```typescript
   // ❌ 实时数据不应缓存
   await cache.set('realtime-data', data, 60000)
   ```

2. **不要过度使用Worker**

   ```typescript
   // ❌ 小数据集不需要Worker
   if (data.length < 100) {
     // 直接在主线程处理
   }
   ```

3. **不要忘记清理缓存**
   ```typescript
   // ✅ 定期清理过期缓存
   setInterval(() => cache.clear(), 3600000)
   ```

## 故障排查

### 问题1: 缓存不生效

**检查**:

```typescript
// 确认缓存已初始化
const cache = getCacheInstance()
console.log('缓存大小:', cache.getStats().size)
```

### 问题2: Worker报错

**检查**:

```typescript
// 查看Worker状态
const status = workerManager.getPoolStatus('dataProcessor')
console.log('Worker状态:', status)
```

### 问题3: 懒加载失败

**检查**:

```typescript
// 查看加载元数据
const metadata = dynamicImportManager.getMetadata('/path/to/module')
console.log('加载状态:', metadata)
```

## 更多资源

- [构建优化指南](../config/BUILD_OPTIMIZATION_README.md)
- [缓存系统文档](../cache/README.md)
- [Worker管理文档](../workers/README.md)
- [懒加载文档](../loader/README.md)
