# 错误处理方案

## 🎯 错误处理目标

- 优雅的错误提示
- 完整的错误日志
- 自动错误恢复
- 用户友好的体验

---

## 🚨 错误类型

### 1. 菜单加载错误

```typescript
// 菜单加载失败处理
async function loadMenuData() {
  try {
    const data = await fetchMenuData()
    return data
  } catch (error) {
    console.error('菜单加载失败:', error)

    // 显示错误提示
    message.error('菜单加载失败,请刷新页面重试')

    // 返回默认菜单
    return getDefaultMenu()
  }
}
```

### 2. 路由跳转错误

```typescript
// 路由跳转失败处理
function handleMenuClick(menuItem: MenuTreeNode) {
  if (!menuItem.path) {
    message.warning('该菜单项暂无页面')
    return
  }

  try {
    router.push(menuItem.path)
  } catch (error) {
    console.error('路由跳转失败:', error)
    message.error('页面跳转失败')
  }
}
```

### 3. 用户操作错误

```typescript
// 用户操作失败处理
async function handleUserAction(action: string) {
  try {
    switch (action) {
      case 'logout':
        await authModule.dispatch('logout')
        message.success('退出登录成功')
        router.push('/login')
        break
      default:
        message.warning('功能开发中')
    }
  } catch (error) {
    console.error('用户操作失败:', error)
    message.error('操作失败,请重试')
  }
}
```

---

## 🛡️ 错误边界

### Vue 错误处理

```typescript
// main.ts
app.config.errorHandler = (err, instance, info) => {
  console.error('Vue Error:', err)
  console.error('Component:', instance)
  console.error('Error Info:', info)

  // 上报错误
  reportError({
    type: 'vue-error',
    error: err,
    component: instance?.$options.name,
    info,
  })

  // 显示错误提示
  message.error('页面出现错误,请刷新重试')
}
```

### 全局错误捕获

```typescript
// 捕获未处理的 Promise 错误
window.addEventListener('unhandledrejection', event => {
  console.error('Unhandled Promise Rejection:', event.reason)

  reportError({
    type: 'promise-rejection',
    error: event.reason,
  })

  event.preventDefault()
})

// 捕获全局错误
window.addEventListener('error', event => {
  console.error('Global Error:', event.error)

  reportError({
    type: 'global-error',
    error: event.error,
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  })
})
```

---

## 📝 错误日志

### 错误日志服务

```typescript
// ErrorLogger.ts
class ErrorLogger {
  private logs: ErrorLog[] = []

  // 记录错误
  log(error: Error, context?: any) {
    const log: ErrorLog = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    }

    this.logs.push(log)

    // 持久化到 localStorage
    this.persist()

    // 上报到服务器
    this.report(log)
  }

  // 持久化日志
  private persist() {
    try {
      localStorage.setItem('error-logs', JSON.stringify(this.logs))
    } catch (e) {
      console.error('Failed to persist error logs:', e)
    }
  }

  // 上报错误
  private async report(log: ErrorLog) {
    try {
      await fetch('/api/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(log),
      })
    } catch (e) {
      console.error('Failed to report error:', e)
    }
  }

  // 获取日志
  getLogs() {
    return this.logs
  }

  // 清除日志
  clear() {
    this.logs = []
    localStorage.removeItem('error-logs')
  }
}

export const errorLogger = new ErrorLogger()
```

---

## 🔄 错误恢复

### 自动重试

```typescript
// 自动重试机制
async function fetchWithRetry<T>(fn: () => Promise<T>, maxRetries = 3, delay = 1000): Promise<T> {
  let lastError: Error

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      console.warn(`Retry ${i + 1}/${maxRetries} failed:`, error)

      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }

  throw lastError!
}

// 使用示例
const menuData = await fetchWithRetry(() => fetchMenuData())
```

### 降级方案

```typescript
// 降级到默认配置
function getLayoutConfigWithFallback() {
  try {
    return getLayoutConfig()
  } catch (error) {
    console.error('Failed to load layout config:', error)
    return getDefaultLayoutConfig()
  }
}

// 降级到缓存数据
async function getMenuDataWithFallback() {
  try {
    const data = await fetchMenuData()
    // 缓存成功的数据
    localStorage.setItem('menu-cache', JSON.stringify(data))
    return data
  } catch (error) {
    console.error('Failed to fetch menu data:', error)

    // 使用缓存数据
    const cached = localStorage.getItem('menu-cache')
    if (cached) {
      message.warning('使用缓存的菜单数据')
      return JSON.parse(cached)
    }

    // 使用默认菜单
    return getDefaultMenu()
  }
}
```

---

## 💬 用户提示

### 错误提示组件

```vue
<!-- ErrorBoundary.vue -->
<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-content">
      <ExclamationCircleOutlined class="error-icon" />
      <h3>页面加载失败</h3>
      <p>{{ errorMessage }}</p>
      <a-space>
        <a-button type="primary" @click="retry">重试</a-button>
        <a-button @click="goHome">返回首页</a-button>
      </a-space>
    </div>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

const hasError = ref(false)
const errorMessage = ref('')
const router = useRouter()

onErrorCaptured(err => {
  hasError.value = true
  errorMessage.value = err.message
  console.error('Component Error:', err)
  return false
})

function retry() {
  hasError.value = false
  errorMessage.value = ''
  window.location.reload()
}

function goHome() {
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 64px;
  color: #ff4d4f;
  margin-bottom: 24px;
}

h3 {
  font-size: 24px;
  margin-bottom: 16px;
}

p {
  color: rgba(0, 0, 0, 0.65);
  margin-bottom: 24px;
}
</style>
```

### 加载状态

```vue
<!-- LoadingState.vue -->
<template>
  <div v-if="loading" class="loading-state">
    <a-spin size="large" />
    <p>{{ message }}</p>
  </div>
  <slot v-else />
</template>

<script setup lang="ts">
interface Props {
  loading: boolean
  message?: string
}

withDefaults(defineProps<Props>(), {
  message: '加载中...',
})
</script>
```

---

## 🔍 错误监控

### 性能监控

```typescript
// PerformanceMonitor.ts
class PerformanceMonitor {
  // 监控页面加载
  monitorPageLoad() {
    window.addEventListener('load', () => {
      const timing = performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart

      if (loadTime > 3000) {
        console.warn('Page load time is too long:', loadTime)
        reportPerformance({
          type: 'slow-load',
          duration: loadTime,
        })
      }
    })
  }

  // 监控路由切换
  monitorRouteChange(router: Router) {
    router.beforeEach((to, from, next) => {
      performance.mark('route-start')
      next()
    })

    router.afterEach(() => {
      performance.mark('route-end')
      performance.measure('route-change', 'route-start', 'route-end')

      const measure = performance.getEntriesByName('route-change')[0]
      if (measure.duration > 500) {
        console.warn('Route change is too slow:', measure.duration)
      }
    })
  }
}
```

---

## 📊 错误统计

### 错误分析

```typescript
// ErrorAnalytics.ts
class ErrorAnalytics {
  private errors: Map<string, number> = new Map()

  // 记录错误
  track(error: Error) {
    const key = `${error.name}:${error.message}`
    const count = this.errors.get(key) || 0
    this.errors.set(key, count + 1)
  }

  // 获取统计
  getStats() {
    return Array.from(this.errors.entries())
      .map(([error, count]) => ({ error, count }))
      .sort((a, b) => b.count - a.count)
  }

  // 获取最常见的错误
  getTopErrors(limit = 10) {
    return this.getStats().slice(0, limit)
  }
}
```

---

## ✅ 错误处理清单

### 已实现 ✅

- [x] 菜单加载错误处理
- [x] 路由跳转错误处理
- [x] 用户操作错误处理
- [x] 全局错误捕获

### 待实现 ⏳

- [ ] 错误边界组件
- [ ] 错误日志服务
- [ ] 自动重试机制
- [ ] 错误监控系统
- [ ] 错误统计分析

---

## 🎯 最佳实践

### 1. 始终捕获错误

```typescript
// 好的做法
try {
  await riskyOperation()
} catch (error) {
  handleError(error)
}

// 不好的做法
await riskyOperation() // 可能抛出未捕获的错误
```

### 2. 提供有意义的错误信息

```typescript
// 好的做法
throw new Error('Failed to load menu data: Network error')

// 不好的做法
throw new Error('Error')
```

### 3. 记录错误上下文

```typescript
// 好的做法
errorLogger.log(error, {
  action: 'loadMenu',
  userId: user.id,
  timestamp: Date.now(),
})

// 不好的做法
console.error(error)
```

### 4. 优雅降级

```typescript
// 好的做法
const data = await fetchData().catch(() => getDefaultData())

// 不好的做法
const data = await fetchData() // 失败后无法继续
```

---

## 📚 参考资源

- [Vue 错误处理](https://vuejs.org/api/application.html#app-config-errorhandler)
- [JavaScript 错误处理](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Control_flow_and_error_handling)
- [错误监控最佳实践](https://web.dev/error-handling/)

---

**良好的错误处理是用户体验的重要组成部分!** 🛡️
