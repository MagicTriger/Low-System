# 状态管理快速开始

## 5分钟上手

### 1. 安装和初始化

```typescript
// main.ts
import { createStateManager } from '@/core/state'

const { stateManager, persistence } = createStateManager({
  strict: import.meta.env.DEV,
  enableTimeTrave: import.meta.env.DEV,
  persistence: {
    options: {
      paths: ['app.*', 'user.*'],
      throttle: 1000,
    },
  },
})

// 提供给全局
app.provide('stateManager', stateManager)
app.provide('persistence', persistence)
```

### 2. 创建状态模块

```typescript
// modules/app.ts
import type { IStateModule } from '@/core/state'

interface AppState {
  loading: boolean
  title: string
}

export const appModule: IStateModule<AppState> = {
  name: 'app',

  state: () => ({
    loading: false,
    title: '',
  }),

  getters: {
    isLoading: state => state.loading,
  },

  mutations: {
    setLoading(state, payload: boolean) {
      state.loading = payload
    },
    setTitle(state, payload: string) {
      state.title = payload
    },
  },

  actions: {
    async init(context) {
      context.commit('setLoading', true)
      try {
        // 初始化逻辑
      } finally {
        context.commit('setLoading', false)
      }
    },
  },
}
```

### 3. 注册模块

```typescript
// main.ts (续)
import { appModule } from './modules/app'

stateManager.registerModule(appModule)

// 恢复持久化状态
persistence?.restoreAll()
```

### 4. 在组件中使用

```vue
<script setup lang="ts">
import { inject } from 'vue'
import type { StateManager } from '@/core/state'

const stateManager = inject<StateManager>('stateManager')!

// 获取状态
const appState = stateManager.getState('app')

// 提交 mutation
const setLoading = (value: boolean) => {
  stateManager.commit('app/setLoading', value)
}

// 分发 action
const init = async () => {
  await stateManager.dispatch('app/init')
}

// 订阅状态变更
stateManager.subscribeState(
  state => state.app.loading,
  (newValue, oldValue) => {
    console.log('Loading changed:', oldValue, '->', newValue)
  }
)
</script>

<template>
  <div>
    <div v-if="appState.loading">Loading...</div>
    <button @click="setLoading(true)">Start Loading</button>
    <button @click="init">Initialize</button>
  </div>
</template>
```

## 常用操作

### 获取状态

```typescript
const state = stateManager.getState('app')
const allState = stateManager.getState()
```

### 提交 Mutation

```typescript
stateManager.commit('app/setLoading', true)
stateManager.commit('app/setTitle', 'New Title')
```

### 分发 Action

```typescript
await stateManager.dispatch('app/init')
await stateManager.dispatch('user/login', { username, password })
```

### 订阅变更

```typescript
// 订阅 mutation
const unsubscribe = stateManager.subscribeMutation((mutation, state) => {
  console.log('Mutation:', mutation.type, mutation.payload)
})

// 订阅 action
stateManager.subscribeAction((action, state) => {
  console.log('Action:', action.type, action.payload)
})

// 订阅状态变更
stateManager.subscribeState(
  state => state.app.loading,
  (newValue, oldValue) => {
    console.log('Changed:', oldValue, '->', newValue)
  },
  { immediate: true, deep: true }
)

// 取消订阅
unsubscribe()
```

### 时间旅行

```typescript
// 撤销
stateManager.undo()

// 重做
stateManager.redo()

// 查看历史
const history = stateManager.getHistory()
console.log(history)
```

### 持久化

```typescript
// 手动保存
await persistence.persistModule('app')
await persistence.persistAll()

// 手动恢复
await persistence.restoreModule('app')
await persistence.restoreAll()

// 清空
await persistence.clearAll()
```

## 从 Pinia 迁移

### 方式1: 适配器 (最简单)

```typescript
import { PiniaAdapter } from '@/core/state'
import { useAppStore } from '@/core/stores/app'

const adapter = new PiniaAdapter(stateManager, {
  autoSync: true,
  keepPiniaStore: true,
})

adapter.registerPiniaStore(useAppStore())

// 现在可以同时使用两种方式
const appStore = useAppStore()
console.log(appStore.loading) // Pinia 方式
console.log(stateManager.getState('app').loading) // 新方式
```

### 方式2: 迁移助手 (批量迁移)

```typescript
import { createMigrationHelper } from '@/core/state'

const helper = createMigrationHelper(stateManager)

await helper.migrate({
  stores: [{ store: useAppStore() }, { store: useUserStore() }],
  enableSync: true,
})
```

### 方式3: 手动重写 (推荐)

```typescript
// 旧的 Pinia store
export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  return { loading, setLoading }
})

// 新的状态模块
export const appModule: IStateModule<AppState> = {
  name: 'app',
  state: () => ({ loading: false }),
  mutations: {
    setLoading(state, payload: boolean) {
      state.loading = payload
    },
  },
}
```

## 创建 Composable

```typescript
// composables/useState.ts
import { inject } from 'vue'
import type { StateManager } from '@/core/state'

export function useState<T = any>(moduleName: string) {
  const stateManager = inject<StateManager>('stateManager')!
  return stateManager.getState<T>(moduleName)
}

export function useCommit() {
  const stateManager = inject<StateManager>('stateManager')!
  return (type: string, payload?: any) => {
    stateManager.commit(type, payload)
  }
}

export function useDispatch() {
  const stateManager = inject<StateManager>('stateManager')!
  return (type: string, payload?: any) => {
    return stateManager.dispatch(type, payload)
  }
}

// 使用
const appState = useState('app')
const commit = useCommit()
const dispatch = useDispatch()

commit('app/setLoading', true)
await dispatch('app/init')
```

## 常见问题

### Q: 如何在非 Vue 组件中使用?

```typescript
// 直接导入实例
import { stateManager } from '@/core/state/instance'

stateManager.commit('app/setLoading', true)
```

### Q: 如何实现模块懒加载?

```typescript
// 动态注册模块
const loadUserModule = async () => {
  const { userModule } = await import('./modules/user')
  stateManager.registerModule(userModule)
}
```

### Q: 如何处理异步 action 错误?

```typescript
actions: {
  async fetchData(context) {
    try {
      context.commit('setLoading', true)
      const data = await api.fetchData()
      context.commit('setData', data)
    } catch (error) {
      context.commit('setError', error)
      throw error
    } finally {
      context.commit('setLoading', false)
    }
  },
}
```

### Q: 如何实现跨模块通信?

```typescript
actions: {
  async login(context, credentials) {
    // 调用其他模块的 action
    await context.dispatch('auth/authenticate', credentials, { root: true })

    // 提交其他模块的 mutation
    context.commit('user/setUser', user, { root: true })
  },
}
```

## 下一步

- 查看 [完整文档](./README.md)
- 查看 [集成示例](./examples/integration.ts)
- 查看 [API 参考](./IStateModule.ts)
