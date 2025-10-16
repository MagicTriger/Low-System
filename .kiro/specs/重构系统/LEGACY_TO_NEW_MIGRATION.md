# 旧系统到新系统迁移指南

## 概述

本指南帮助开发者从旧的Pinia stores迁移到新的StateManager系统。

## 为什么迁移？

- ✅ **统一架构** - 所有状态管理使用同一套API
- ✅ **更好的类型支持** - 完整的TypeScript类型定义
- ✅ **更强大的功能** - 时间旅行、持久化、事件系统
- ✅ **更好的性能** - 优化的状态更新机制
- ✅ **更易维护** - 清晰的模块化结构

## API对照表

### 1. 导入方式

```typescript
// 旧API (Pinia)
import { useAppStore } from '@/core/stores'
import { useAuthStore } from '@/core/stores/auth'

// 新API (StateManager)
import { useModule, useState, useCommit, useDispatch } from '@/core/state/helpers'
```

### 2. 获取状态

```typescript
// 旧API
const appStore = useAppStore()
const loading = appStore.loading
const isLoading = appStore.isLoading // getter

// 新API - 方式1：使用useState
import { useState } from '@/core/state/helpers'
import type { AppState } from '@/core/state/modules/app'

const appState = useState<AppState>('app')
const loading = appState.loading

// 新API - 方式2：使用useModule (推荐)
import { useModule } from '@/core/state/helpers'

const app = useModule('app')
const loading = app.state.loading
const isLoading = app.getter('isLoading')
```

### 3. 修改状态 (Mutations)

```typescript
// 旧API
const appStore = useAppStore()
appStore.setLoading(true)
appStore.toggleSidebar()

// 新API - 方式1：使用useCommit
import { useCommit } from '@/core/state/helpers'

const commit = useCommit('app')
commit('setLoading', true)
commit('toggleSidebar')

// 新API - 方式2：使用useModule (推荐)
const app = useModule('app')
app.commit('setLoading', true)
app.commit('toggleSidebar')
```

### 4. 异步操作 (Actions)

```typescript
// 旧API
const authStore = useAuthStore()
await authStore.login(credentials)
await authStore.logout()

// 新API - 方式1：使用useDispatch
import { useDispatch } from '@/core/state/helpers'

const dispatch = useDispatch('auth')
await dispatch('login', credentials)
await dispatch('logout')

// 新API - 方式2：使用useModule (推荐)
const auth = useModule('auth')
await auth.dispatch('login', credentials)
await auth.dispatch('logout')
```

## 完整迁移示例

### 示例1：登录组件

```vue
<script setup lang="ts">
// ❌ 旧代码
import { useAuthStore } from '@/core/stores/auth'

const authStore = useAuthStore()

const handleLogin = async () => {
  await authStore.login({
    username: form.username,
    password: form.password,
  })
}

// ✅ 新代码
import { useModule } from '@/core/state/helpers'
import type { LoginCredentials } from '@/core/state/modules/auth'

const auth = useModule('auth')

const handleLogin = async () => {
  const credentials: LoginCredentials = {
    username: form.username,
    password: form.password,
  }

  const result = await auth.dispatch('login', credentials)

  if (result.success) {
    // 登录成功
  } else {
    // 登录失败
    console.error(result.message)
  }
}
</script>
```

### 示例2：主题切换

```vue
<script setup lang="ts">
// ❌ 旧代码
import { useThemeStore } from '@/core/stores/theme'

const themeStore = useThemeStore()

const toggleDark = () => {
  themeStore.toggleDarkMode()
}

// ✅ 新代码
import { useModule } from '@/core/state/helpers'

const theme = useModule('theme')

const toggleDark = async () => {
  await theme.dispatch('toggleDarkMode')
}
</script>
```

### 示例3：API请求中获取token

```typescript
// ❌ 旧代码
import { useUserStore } from '@/core/stores/user'

request.interceptors.request.use(config => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

// ✅ 新代码
import { useState } from '@/core/state/helpers'
import type { UserState } from '@/core/state/modules/user'

request.interceptors.request.use(config => {
  try {
    const userState = useState<UserState>('user')
    if (userState.token) {
      config.headers.Authorization = `Bearer ${userState.token}`
    }
  } catch (error) {
    // StateManager可能还未初始化
    console.debug('StateManager not yet initialized')
  }
  return config
})
```

## 模块对照

### App模块

| 旧API (Pinia)               | 新API (StateManager)                 |
| --------------------------- | ------------------------------------ |
| `useAppStore()`             | `useModule('app')`                   |
| `appStore.loading`          | `app.state.loading`                  |
| `appStore.setLoading(true)` | `app.commit('setLoading', true)`     |
| `appStore.initLanguage()`   | `await app.dispatch('initLanguage')` |

### Auth模块

| 旧API (Pinia)                  | 新API (StateManager)                  |
| ------------------------------ | ------------------------------------- |
| `useAuthStore()`               | `useModule('auth')`                   |
| `authStore.user`               | `auth.state.user`                     |
| `authStore.isLoggedIn`         | `auth.getter('isLoggedIn')`           |
| `await authStore.login(creds)` | `await auth.dispatch('login', creds)` |
| `await authStore.logout()`     | `await auth.dispatch('logout')`       |

### Theme模块

| 旧API (Pinia)                       | 新API (StateManager)                             |
| ----------------------------------- | ------------------------------------------------ |
| `useThemeStore()`                   | `useModule('theme')`                             |
| `themeStore.darkMode`               | `theme.state.darkMode`                           |
| `themeStore.setPrimaryColor(color)` | `await theme.dispatch('setPrimaryColor', color)` |
| `themeStore.toggleDarkMode()`       | `await theme.dispatch('toggleDarkMode')`         |

### User模块

| 旧API (Pinia)                   | 新API (StateManager)                 |
| ------------------------------- | ------------------------------------ |
| `useUserStore()`                | `useModule('user')`                  |
| `userStore.userInfo`            | `user.state.userInfo`                |
| `userStore.token`               | `user.state.token`                   |
| `await userStore.getUserInfo()` | `await user.dispatch('getUserInfo')` |

## 高级用法

### 批量操作

```typescript
import { useBatchCommit, useBatchDispatch } from '@/core/state/helpers'

// 批量提交mutations
useBatchCommit('app', [
  { mutation: 'setLoading', payload: true },
  { mutation: 'setPageTitle', payload: 'Home' },
])

// 批量分发actions
await useBatchDispatch('app', [{ action: 'initLanguage' }, { action: 'loadConfig' }])
```

### 状态订阅

```typescript
import { useSubscribe } from '@/core/state/helpers'

// 订阅状态变化
const unsubscribe = useSubscribe('app', state => {
  console.log('App state changed:', state)
})

// 取消订阅
unsubscribe()
```

### 检查模块

```typescript
import { useHasModule, useModuleNames } from '@/core/state/helpers'

// 检查模块是否已注册
if (useHasModule('app')) {
  console.log('App module is registered')
}

// 获取所有模块名称
const modules = useModuleNames()
console.log('Registered modules:', modules)
```

## 常见问题

### Q: 为什么要使用async/await调用actions？

A: 新的StateManager中，所有actions都是异步的，这样可以更好地处理异步操作和错误。

### Q: 旧的Pinia stores还能用吗？

A: 可以，但不推荐。旧的stores已被删除，但Pinia本身仍然保留用于兼容性。建议尽快迁移到新API。

### Q: 如何处理computed属性？

A: 使用Vue的`computed`配合新API：

```typescript
import { computed } from 'vue'
import { useModule } from '@/core/state/helpers'

const app = useModule('app')
const isLoading = computed(() => app.getter('isLoading'))
```

### Q: 状态持久化还支持吗？

A: 是的，新的StateManager内置了持久化支持，会自动保存和恢复状态。

## 迁移检查清单

- [ ] 更新所有`useXxxStore()`导入为`useModule()`
- [ ] 更新状态访问：`store.xxx` → `module.state.xxx`
- [ ] 更新mutations调用：`store.method()` → `module.commit('method', payload)`
- [ ] 更新actions调用：`store.method()` → `await module.dispatch('method', payload)`
- [ ] 更新getters访问：`store.getter` → `module.getter('getter')`
- [ ] 测试所有功能
- [ ] 删除旧的store导入

## 获取帮助

如果遇到问题：

1. 查看[StateManager文档](src/core/state/README.md)
2. 查看[快速开始指南](src/core/state/QUICK_START.md)
3. 查看示例代码
4. 提交Issue

## 总结

新的StateManager提供了更强大、更灵活的状态管理方案。虽然API有所变化，但迁移过程相对简单，而且能获得更好的开发体验和性能。

祝迁移顺利！🎉
