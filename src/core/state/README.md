# 状态管理系统

新的模块化状态管理系统,提供更好的类型安全、时间旅行调试和持久化支持。

## 特性

- ✅ 模块化状态管理
- ✅ Getter/Action/Mutation模式
- ✅ 时间旅行调试
- ✅ 状态持久化 (LocalStorage/IndexedDB)
- ✅ 类型安全
- ✅ Pinia兼容层

## 快速开始

### 1. 创建状态模块

```typescript
import type { IStateModule } from '@/core/state/IStateModule'

interface AppState {
  loading: boolean
  sidebarCollapsed: boolean
  pageTitle: string
}

export const appModule: IStateModule<AppState> = {
  name: 'app',

  state: () => ({
    loading: false,
    sidebarCollapsed: false,
    pageTitle: '',
  }),

  getters: {
    isLoading: state => state.loading,
    isSidebarCollapsed: state => state.sidebarCollapsed,
  },

  mutations: {
    setLoading(state, payload: boolean) {
      state.loading = payload
    },

    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    setPageTitle(state, payload: string) {
      state.pageTitle = payload
    },
  },

  actions: {
    async initApp(context) {
      context.commit('setLoading', true)
      try {
        // 初始化逻辑
        await loadConfig()
      } finally {
        context.commit('setLoading', false)
      }
    },
  },

  namespaced: true,
}
```

### 2. 注册模块

```typescript
import { StateManager } from '@/core/state/StateManager'
import { appModule } from './modules/app'

const stateManager = new StateManager({
  strict: true,
  enableTimeTrave: true,
  maxHistorySize: 50,
})

stateManager.registerModule(appModule)
```

### 3. 使用状态

```typescript
// 获取状态
const appState = stateManager.getState('app')
console.log(appState.loading)

// 提交mutation
stateManager.commit('app/setLoading', true)

// 分发action
await stateManager.dispatch('app/initApp')

// 订阅状态变更
stateManager.subscribeState(
  state => state.app.loading,
  (newValue, oldValue) => {
    console.log('Loading changed:', oldValue, '->', newValue)
  }
)
```

## 状态持久化

### LocalStorage策略

```typescript
import { LocalStorageStrategy } from '@/core/state/persistence'
import { PersistenceManager } from '@/core/state/persistence'

const strategy = new LocalStorageStrategy({
  prefix: 'myapp:',
})

const persistence = new PersistenceManager(stateManager, strategy, {
  paths: ['app.*', 'user.*'], // 只持久化这些路径
  excludePaths: ['app.loading'], // 排除这些路径
  throttle: 1000, // 节流1秒
})

// 手动持久化
await persistence.persistModule('app')

// 恢复状态
await persistence.restoreModule('app')
```

### IndexedDB策略

```typescript
import { IndexedDBStrategy } from '@/core/state/persistence'

const strategy = new IndexedDBStrategy({
  dbName: 'MyAppDB',
  storeName: 'state',
  version: 1,
})

const persistence = new PersistenceManager(stateManager, strategy, {
  encrypt: true,
  encryptionKey: 'your-secret-key',
})
```

## 时间旅行调试

```typescript
// 撤销
stateManager.undo()

// 重做
stateManager.redo()

// 获取历史记录
const history = stateManager.getHistory()
console.log(history)
```

## 从Pinia迁移

### 方式1: 使用适配器 (推荐)

```typescript
import { PiniaAdapter } from '@/core/state/adapters/PiniaAdapter'
import { useAppStore } from '@/core/stores/app'

const adapter = new PiniaAdapter(stateManager, {
  autoSync: true, // 启用双向同步
  keepPiniaStore: true, // 保留Pinia store
})

// 注册现有Pinia store
const appStore = useAppStore()
adapter.registerPiniaStore(appStore)

// 现在可以同时使用两种方式访问状态
console.log(appStore.loading) // Pinia方式
console.log(stateManager.getState('app').loading) // 新方式
```

### 方式2: 使用迁移助手

```typescript
import { createMigrationHelper } from '@/core/state/migration/MigrationHelper'
import { useAppStore, useUserStore } from '@/core/stores'

const helper = createMigrationHelper(stateManager)

// 执行迁移
await helper.migrate({
  stores: [
    { store: useAppStore(), keepPinia: true },
    { store: useUserStore(), keepPinia: true },
  ],
  enableSync: true,
  onComplete: () => {
    console.log('Migration completed')
  },
  onError: error => {
    console.error('Migration failed:', error)
  },
})

// 生成迁移报告
const report = helper.generateReport([useAppStore(), useUserStore()])
console.log(report)

// 验证迁移
const validation = helper.validateMigration(useAppStore())
if (!validation.valid) {
  console.error('Validation errors:', validation.errors)
}
```

### 方式3: 手动重写 (最佳实践)

将Pinia store重写为新的状态模块格式:

```typescript
// 旧的Pinia store (app.ts)
export const useAppStore = defineStore('app', () => {
  const loading = ref(false)
  const setLoading = (value: boolean) => {
    loading.value = value
  }
  return { loading, setLoading }
})

// 新的状态模块 (modules/app.ts)
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

## 最佳实践

### 1. 模块命名

使用清晰的命名空间:

```typescript
// ✅ 好
const userModule: IStateModule = { name: 'user', ... }
const authModule: IStateModule = { name: 'auth', ... }

// ❌ 不好
const module1: IStateModule = { name: 'm1', ... }
```

### 2. 状态结构

保持状态扁平化:

```typescript
// ✅ 好
interface UserState {
  id: string
  name: string
  email: string
}

// ❌ 不好
interface UserState {
  user: {
    profile: {
      personal: {
        name: string
      }
    }
  }
}
```

### 3. Mutation命名

使用动词+名词的格式:

```typescript
mutations: {
  setUser(state, user) { ... },
  updateProfile(state, profile) { ... },
  deleteItem(state, id) { ... },
}
```

### 4. Action命名

使用动词描述操作:

```typescript
actions: {
  async fetchUser(context, id) { ... },
  async saveProfile(context, profile) { ... },
  async deleteAccount(context) { ... },
}
```

### 5. 类型安全

始终定义状态类型:

```typescript
interface AppState {
  loading: boolean
  error: Error | null
}

const appModule: IStateModule<AppState> = {
  name: 'app',
  state: (): AppState => ({
    loading: false,
    error: null,
  }),
}
```

## API参考

详见各模块的TypeScript类型定义:

- `IStateModule.ts` - 状态模块接口
- `StateManager.ts` - 状态管理器
- `persistence/` - 持久化策略
- `adapters/` - 适配器
- `migration/` - 迁移工具

## 故障排查

### 问题: 状态未更新

确保通过mutation修改状态:

```typescript
// ❌ 错误
state.loading = true

// ✅ 正确
stateManager.commit('app/setLoading', true)
```

### 问题: 持久化失败

检查存储配额和权限:

```typescript
try {
  await persistence.persistModule('app')
} catch (error) {
  if (error instanceof PersistenceError) {
    console.error('Persistence failed:', error.message)
  }
}
```

### 问题: 迁移后状态不同步

确保启用了双向同步:

```typescript
const adapter = new PiniaAdapter(stateManager, {
  autoSync: true, // 必须为true
})
```

## 性能优化

### 1. 使用状态分片

将大状态拆分为多个小模块:

```typescript
// 而不是一个大的appModule
const uiModule = { name: 'ui', ... }
const dataModule = { name: 'data', ... }
const settingsModule = { name: 'settings', ... }
```

### 2. 选择性持久化

只持久化必要的状态:

```typescript
const persistence = new PersistenceManager(stateManager, strategy, {
  paths: ['user.profile', 'settings.theme'],
  excludePaths: ['*.loading', '*.error'],
})
```

### 3. 节流保存

使用节流避免频繁写入:

```typescript
const persistence = new PersistenceManager(stateManager, strategy, {
  throttle: 2000, // 2秒节流
})
```

## 下一步

- 查看 [示例项目](./examples/)
- 阅读 [架构设计文档](../../docs/architecture.md)
- 参与 [贡献指南](../../CONTRIBUTING.md)
