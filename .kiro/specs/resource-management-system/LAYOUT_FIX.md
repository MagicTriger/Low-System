# Layout.vue 错误修复

## 问题描述

在运行管理端时出现以下错误：

```
SyntaxError: The requested module '/@fs/D:/vueproject/dangan/client/src/core/state/index.ts'
does not provide an export named 'useStateManager' (at Layout.vue:38:10)
```

## 根本原因

`src/core/state/index.ts` 没有导出 `useStateManager` 函数。实际上，这个函数根本不存在。

## 解决方案

使用正确的状态管理 API：`useModule` 从 `@/core/state/helpers`

### 修改前

```typescript
import { useStateManager } from '@/core/state'

const stateManager = useStateManager()

await stateManager.dispatch('resource/fetchResourceTree')
const resourceState = stateManager.getState('resource')
menuTree.value = resourceState.resourceTree
```

### 修改后

```typescript
import { useModule } from '@/core/state/helpers'

const resourceModule = useModule('resource')

await resourceModule.dispatch('fetchResourceTree')
menuTree.value = resourceModule.state.resourceTree
```

## 可用的状态管理 API

根据 `src/core/state/helpers.ts`，以下是可用的 API：

### 1. `useModule(moduleName)` - 推荐使用

提供类似 Pinia 的组合式 API 体验：

```typescript
const app = useModule('app')

// 访问状态
console.log(app.state.loading)

// 提交 mutation
app.commit('setLoading', true)

// 分发 action
await app.dispatch('initLanguage')

// 获取 getter
const isLoading = app.getter('isLoading')
```

### 2. `useState(moduleName)`

获取模块状态：

```typescript
const appState = useState<AppState>('app')
console.log(appState.loading)
```

### 3. `useCommit(moduleName)`

提交 mutation：

```typescript
const commit = useCommit('app')
commit('setLoading', true)
```

### 4. `useDispatch(moduleName)`

分发 action：

```typescript
const dispatch = useDispatch('auth')
await dispatch('login', credentials)
```

### 5. `useGetter(moduleName, getterName)`

获取 getter：

```typescript
const isLoading = useGetter('app', 'isLoading')
```

## 其他辅助函数

- `useBatchCommit` - 批量提交 mutations
- `useBatchDispatch` - 批量分发 actions
- `useModuleNames` - 获取所有模块名称
- `useHasModule` - 检查模块是否已注册

## 修复状态

✅ 已修复 - Layout.vue 现在使用正确的 `useModule` API

## 测试建议

1. 重新启动开发服务器
2. 访问管理端页面
3. 检查控制台是否还有错误
4. 验证菜单树是否正确加载

## 相关文件

- `src/modules/admin/views/Layout.vue` - 已修复
- `src/core/state/helpers.ts` - 状态管理辅助函数
- `src/core/state/index.ts` - 状态管理导出
