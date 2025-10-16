# Design Document - 旧系统清理

## Overview

本设计文档描述了如何系统化地清理旧的Pinia stores代码，并将所有状态管理迁移到新的StateManager系统。清理过程将分阶段进行，确保每一步都可以验证和回滚。

### 目标

1. 移除所有旧的Pinia stores文件
2. 将状态管理迁移到新的StateManager
3. 更新所有代码引用
4. 保持功能完整性
5. 提升代码一致性

### 非目标

- 不改变现有功能行为
- 不进行UI/UX改进
- 暂时保留Pinia依赖（PiniaAdapter可能需要）

## Architecture

### 当前架构

```
旧系统 (Pinia)
├── src/core/stores/
│   ├── app.ts       - 应用状态
│   ├── auth.ts      - 认证状态
│   ├── theme.ts     - 主题状态
│   ├── user.ts      - 用户状态
│   └── index.ts     - 导出
│
└── 使用位置
    ├── src/core/index.ts           - 初始化主题
    ├── src/modules/designer/App.vue - 设置页面标题
    ├── src/modules/designer/views/Login.vue - 认证
    ├── src/core/api/request.ts     - 获取token
    └── src/core/components/AppWrapper.vue - 主题类
```

### 目标架构

```
新系统 (StateManager)
├── src/core/state/
│   └── modules/          - 新建目录
│       ├── app.ts        - App状态模块
│       ├── auth.ts       - Auth状态模块
│       ├── theme.ts      - Theme状态模块
│       └── user.ts       - User状态模块
│
└── 使用位置
    ├── src/core/index.ts           - 使用StateManager
    ├── src/modules/designer/App.vue - 使用StateManager
    ├── src/modules/designer/views/Login.vue - 使用StateManager
    ├── src/core/api/request.ts     - 使用StateManager
    └── src/core/components/AppWrapper.vue - 使用StateManager
```

## Components and Interfaces

### 1. StateManager模块定义

每个旧的Pinia store将转换为StateManager模块：

```typescript
// src/core/state/modules/app.ts
import type { IStateModule } from '../IStateModule'

export interface AppState {
  loading: boolean
  sidebarCollapsed: boolean
  breadcrumbs: Array<{ name: string; path?: string }>
  pageTitle: string
  language: string
}

export const appModule: IStateModule<AppState> = {
  name: 'app',

  state: {
    loading: false,
    sidebarCollapsed: false,
    breadcrumbs: [],
    pageTitle: '',
    language: 'zh-CN',
  },

  getters: {
    isLoading: state => state.loading,
    isSidebarCollapsed: state => state.sidebarCollapsed,
    currentLanguage: state => state.language,
  },

  mutations: {
    setLoading(state, payload: boolean) {
      state.loading = payload
    },
    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },
    setSidebarCollapsed(state, payload: boolean) {
      state.sidebarCollapsed = payload
    },
    setBreadcrumbs(state, payload: Array<{ name: string; path?: string }>) {
      state.breadcrumbs = payload
    },
    addBreadcrumb(state, payload: { name: string; path?: string }) {
      state.breadcrumbs.push(payload)
    },
    setPageTitle(state, payload: string) {
      state.pageTitle = payload
      document.title = payload ? `${payload} - 企业级低代码平台` : '企业级低代码平台'
    },
    setLanguage(state, payload: string) {
      state.language = payload
      localStorage.setItem('language', payload)
    },
  },

  actions: {
    async initLanguage(context) {
      const savedLanguage = localStorage.getItem('language')
      if (savedLanguage) {
        context.commit('setLanguage', savedLanguage)
      } else {
        const browserLang = navigator.language || navigator.languages[0]
        const lang = browserLang.startsWith('zh') ? 'zh-CN' : 'en-US'
        context.commit('setLanguage', lang)
      }
    },
  },
}
```

### 2. 辅助函数

创建辅助函数简化StateManager的使用：

```typescript
// src/core/state/helpers.ts
import { globalStateManager } from './StateManager'

/**
 * 获取状态
 */
export function useState<T = any>(moduleName: string): T {
  return globalStateManager.getState(moduleName)
}

/**
 * 提交mutation
 */
export function useCommit(moduleName: string) {
  return (mutation: string, payload?: any) => {
    globalStateManager.commit(`${moduleName}.${mutation}`, payload)
  }
}

/**
 * 分发action
 */
export function useDispatch(moduleName: string) {
  return async (action: string, payload?: any) => {
    return globalStateManager.dispatch(`${moduleName}.${action}`, payload)
  }
}

/**
 * 获取getter
 */
export function useGetter<T = any>(moduleName: string, getterName: string): T {
  const state = globalStateManager.getState(moduleName)
  const module = (globalStateManager as any).modules.get(moduleName)
  if (module?.getters?.[getterName]) {
    return module.getters[getterName](state)
  }
  return state
}

/**
 * 组合式API - 使用模块
 */
export function useModule(moduleName: string) {
  return {
    state: useState(moduleName),
    commit: useCommit(moduleName),
    dispatch: useDispatch(moduleName),
    getter: (name: string) => useGetter(moduleName, name),
  }
}
```

### 3. 模块注册

在应用启动时注册所有模块：

```typescript
// src/core/state/modules/index.ts
import { globalStateManager } from '../StateManager'
import { appModule } from './app'
import { authModule } from './auth'
import { themeModule } from './theme'
import { userModule } from './user'

export function registerStateModules() {
  globalStateManager.registerModule(appModule)
  globalStateManager.registerModule(authModule)
  globalStateManager.registerModule(themeModule)
  globalStateManager.registerModule(userModule)
}

export * from './app'
export * from './auth'
export * from './theme'
export * from './user'
```

## Data Models

### App State

```typescript
interface AppState {
  loading: boolean
  sidebarCollapsed: boolean
  breadcrumbs: Array<{ name: string; path?: string }>
  pageTitle: string
  language: string
}
```

### Auth State

```typescript
interface AuthState {
  user: User | null
  token: string
  loading: boolean
  isAuthenticated: boolean
}
```

### Theme State

```typescript
interface ThemeState {
  primaryColor: string
  theme: 'light' | 'dark' | 'auto'
  fontSize: number
  borderRadius: number
  compactMode: boolean
}
```

### User State

```typescript
interface UserState {
  userInfo: UserInfo | null
  permissions: string[]
  roles: string[]
  preferences: Record<string, any>
}
```

## Migration Strategy

### 阶段1: 创建StateManager模块

1. 创建`src/core/state/modules/`目录
2. 为每个旧store创建对应的StateManager模块
3. 创建辅助函数
4. 创建模块注册函数

### 阶段2: 更新应用初始化

1. 在`src/core/index.ts`中注册StateManager模块
2. 移除Pinia初始化（暂时保留，以防需要回滚）
3. 更新主题初始化代码

### 阶段3: 更新组件引用

按优先级更新：

1. **高优先级** - 核心功能

   - `src/core/index.ts` - 主题初始化
   - `src/core/api/request.ts` - Token获取
   - `src/modules/designer/views/Login.vue` - 认证

2. **中优先级** - UI组件

   - `src/core/components/AppWrapper.vue` - 主题类
   - `src/modules/designer/App.vue` - 页面标题

3. **低优先级** - 文档和示例
   - 文档中的示例代码
   - README中的使用说明

### 阶段4: 验证和测试

每个阶段完成后：

1. 运行应用验证功能
2. 检查控制台错误
3. 测试关键流程
4. 确认无回归问题

### 阶段5: 清理旧代码

1. 删除`src/core/stores/`目录
2. 从`src/core/index.ts`移除stores导出
3. 移除Pinia初始化代码（如果确认不需要）
4. 更新package.json（可选）

## API Migration Guide

### 旧API → 新API对照

#### 1. 获取状态

```typescript
// 旧API
const appStore = useAppStore()
const loading = appStore.loading

// 新API
import { useState } from '@/core/state/helpers'
const appState = useState<AppState>('app')
const loading = appState.loading

// 或使用组合式API
import { useModule } from '@/core/state/helpers'
const app = useModule('app')
const loading = app.state.loading
```

#### 2. 修改状态

```typescript
// 旧API
const appStore = useAppStore()
appStore.setLoading(true)

// 新API
import { useCommit } from '@/core/state/helpers'
const commit = useCommit('app')
commit('setLoading', true)

// 或使用组合式API
const app = useModule('app')
app.commit('setLoading', true)
```

#### 3. 异步操作

```typescript
// 旧API
const authStore = useAuthStore()
await authStore.login(credentials)

// 新API
import { useDispatch } from '@/core/state/helpers'
const dispatch = useDispatch('auth')
await dispatch('login', credentials)

// 或使用组合式API
const auth = useModule('auth')
await auth.dispatch('login', credentials)
```

#### 4. 计算属性

```typescript
// 旧API
const appStore = useAppStore()
const isLoading = appStore.isLoading

// 新API
import { useGetter } from '@/core/state/helpers'
const isLoading = useGetter('app', 'isLoading')

// 或使用组合式API
const app = useModule('app')
const isLoading = app.getter('isLoading')
```

## Error Handling

### 迁移错误处理

1. **模块未注册**

   - 错误：`Module 'xxx' not found`
   - 解决：确保在应用启动时调用`registerStateModules()`

2. **Mutation不存在**

   - 错误：`Mutation 'xxx' not found in module 'yyy'`
   - 解决：检查模块定义中的mutations

3. **Action失败**

   - 错误：Action执行异常
   - 解决：检查action实现，确保错误处理正确

4. **状态访问错误**
   - 错误：`Cannot read property 'xxx' of undefined`
   - 解决：确保模块已注册且状态已初始化

## Testing Strategy

### 单元测试

为每个StateManager模块创建测试：

```typescript
// src/core/state/modules/__tests__/app.spec.ts
import { describe, it, expect, beforeEach } from 'vitest'
import { StateManager } from '../../StateManager'
import { appModule } from '../app'

describe('App Module', () => {
  let stateManager: StateManager

  beforeEach(() => {
    stateManager = new StateManager()
    stateManager.registerModule(appModule)
  })

  it('should set loading state', () => {
    stateManager.commit('app.setLoading', true)
    const state = stateManager.getState('app')
    expect(state.loading).toBe(true)
  })

  it('should toggle sidebar', () => {
    const initialState = stateManager.getState('app').sidebarCollapsed
    stateManager.commit('app.toggleSidebar')
    const newState = stateManager.getState('app').sidebarCollapsed
    expect(newState).toBe(!initialState)
  })

  it('should set page title', () => {
    stateManager.commit('app.setPageTitle', '测试页面')
    const state = stateManager.getState('app')
    expect(state.pageTitle).toBe('测试页面')
    expect(document.title).toContain('测试页面')
  })
})
```

### 集成测试

测试组件与StateManager的集成：

```typescript
// 测试Login组件
import { mount } from '@vue/test-utils'
import Login from '@/modules/designer/views/Login.vue'
import { registerStateModules } from '@/core/state/modules'

describe('Login Component', () => {
  beforeEach(() => {
    registerStateModules()
  })

  it('should login successfully', async () => {
    const wrapper = mount(Login)
    // 测试登录流程
  })
})
```

### 手动测试清单

- [ ] 应用启动无错误
- [ ] 主题切换正常
- [ ] 登录登出正常
- [ ] 侧边栏折叠正常
- [ ] 页面标题更新正常
- [ ] 语言切换正常
- [ ] API请求带token
- [ ] 状态持久化正常

## Performance Considerations

### 优化点

1. **懒加载模块**

   - 按需注册StateManager模块
   - 减少初始化时间

2. **状态订阅优化**

   - 使用computed避免不必要的重新计算
   - 精确订阅需要的状态

3. **内存管理**
   - 及时清理不需要的状态
   - 避免状态泄漏

## Rollback Plan

如果迁移出现问题，回滚步骤：

1. **恢复旧代码**

   - Git回滚到迁移前的commit
   - 或手动恢复备份的文件

2. **切换特性标志**

   - 禁用`NEW_STATE_MANAGER`特性
   - 启用Pinia兼容模式

3. **验证功能**
   - 确认应用正常运行
   - 检查关键功能

## Documentation Updates

需要更新的文档：

1. **README.md**

   - 更新状态管理说明
   - 添加新API示例

2. **开发指南**

   - 状态管理最佳实践
   - API迁移指南

3. **API文档**

   - StateManager API
   - 辅助函数API

4. **示例代码**
   - 更新所有示例使用新API
   - 添加迁移示例

## Timeline

预计时间：2-3小时

- 阶段1: 创建StateManager模块 (30分钟)
- 阶段2: 更新应用初始化 (15分钟)
- 阶段3: 更新组件引用 (60分钟)
- 阶段4: 验证和测试 (30分钟)
- 阶段5: 清理旧代码 (15分钟)
- 文档更新 (30分钟)

## Success Metrics

- ✅ 所有旧stores已移除
- ✅ 所有功能测试通过
- ✅ 无TypeScript错误
- ✅ 无运行时错误
- ✅ 代码覆盖率保持或提升
- ✅ 文档已更新
