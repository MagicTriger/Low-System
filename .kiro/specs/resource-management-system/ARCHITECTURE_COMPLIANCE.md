# 架构符合性快速参考

## ✅ 架构检查结果：通过

**总体评分：8.2/10**

---

## 核心符合性检查

### 1. 状态管理 ✅

- [x] 使用 StateManager 而非 Vuex/Pinia
- [x] 通过 `useModule()` helper 访问状态
- [x] 使用 `dispatch()` 调用 actions
- [x] 使用 `commit()` 提交 mutations
- [x] 模块化设计（auth, resource）

### 2. 路由配置 ✅

- [x] 从 `window.__MIGRATION_SYSTEM__` 获取 StateManager
- [x] 实现认证守卫
- [x] 自动恢复认证状态
- [x] 权限检查机制
- [x] 懒加载组件

### 3. API 集成 ✅

- [x] 通过 StateManager actions 调用 API
- [x] 统一的错误处理
- [x] 加载状态管理
- [x] Token 认证集成

### 4. 基建集成 ✅

- [x] Migration System 初始化
- [x] DI Container 服务注入
- [x] Event Bus 可用
- [x] Config Manager 配置管理
- [x] Feature Flags 特性开关
- [x] Compat Layer 兼容层

---

## 已修复的问题

### ✅ 代码清理

- [x] 移除未使用的 `ApartmentOutlined` 导入
- [x] 移除未使用的 `ResourceTree` 导入
- [x] 移除未使用的 `handleTableChange` 函数
- [x] 修复 `ticket` 参数未使用警告

### ✅ 类型安全

- [x] 为 `apiResources.forEach` 添加明确类型
- [x] 所有诊断错误已清除

---

## 架构模式使用示例

### 状态管理模式

```typescript
// ✅ 正确使用
import { useModule } from '@/core/state/helpers'

const authModule = useModule('auth')
const resourceModule = useModule('resource')

// 访问状态
console.log(authModule.state.isAuthenticated)

// 提交 mutation
authModule.commit('setUser', user)

// 分发 action
await authModule.dispatch('login', credentials)
```

### 路由守卫模式

```typescript
// ✅ 正确使用
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  throw new Error('StateManager not initialized')
}

router.beforeEach(async (to, _from, next) => {
  const stateManager = getStateManager()
  const authState = stateManager.getState('auth')
  // ... 认证逻辑
})
```

### API 调用模式

```typescript
// ✅ 正确使用 - 通过 StateManager action
await resourceModule.dispatch('fetchResources', {
  page: 1,
  size: 10,
})

// ❌ 错误使用 - 直接调用 API
// import { getMenuTree } from '@/core/api/menu'
// const data = await getMenuTree()
```

---

## 组件设计模式

### 资源管理组件结构

```
ResourceManagement.vue (容器组件)
├── ResourceCardView.vue (展示组件)
│   └── 卡片视图逻辑
├── ResourceForm.vue (表单组件)
│   └── 创建/编辑表单
└── ResourceTree.vue (树形组件)
    └── 树形视图逻辑
```

### 状态流转

```
用户操作 → 组件事件 → dispatch action → API 调用 → commit mutation → 状态更新 → 视图刷新
```

---

## 最佳实践清单

### ✅ 必须遵守

- [ ] 所有状态操作通过 StateManager
- [ ] 所有 API 调用通过 actions
- [ ] 组件使用 Composition API
- [ ] 类型定义完整
- [ ] 错误处理完善

### ✅ 强烈推荐

- [ ] 使用 Logger 服务而非 console.log
- [ ] 配置数据外部化
- [ ] 组件职责单一
- [ ] 代码复用性高
- [ ] 注释清晰完整

### ✅ 建议优化

- [ ] 使用 Event Bus 解耦组件通信
- [ ] 使用 Feature Flags 控制功能
- [ ] 性能优化（虚拟滚动、懒加载）
- [ ] 单元测试覆盖
- [ ] E2E 测试覆盖

---

## 常见问题

### Q: 如何访问 StateManager？

```typescript
// 在组件中
import { useModule } from '@/core/state/helpers'
const module = useModule('moduleName')

// 在路由守卫中
const stateManager = (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
```

### Q: 如何调用 API？

```typescript
// 通过 StateManager action
await resourceModule.dispatch('fetchResources', params)

// 不要直接导入 API 函数
```

### Q: 如何处理错误？

```typescript
try {
  await module.dispatch('action', payload)
  message.success('操作成功')
} catch (error: any) {
  message.error(error.message || '操作失败')
  console.error(error)
}
```

### Q: 如何添加新的状态模块？

```typescript
// 1. 在 src/core/state/modules/ 创建模块文件
// 2. 实现 IStateModule 接口
// 3. 在 index.ts 中注册模块
// 4. 使用 useModule('moduleName') 访问
```

---

## 架构决策记录 (ADR)

### ADR-001: 使用 StateManager 替代 Vuex

**决策**：使用自研的 StateManager 作为状态管理方案  
**理由**：

- 更好的 TypeScript 支持
- 更灵活的模块化设计
- 支持时间旅行调试
- 与迁移系统深度集成

### ADR-002: 路由守卫从全局获取 StateManager

**决策**：路由守卫从 `window.__MIGRATION_SYSTEM__` 获取 StateManager  
**理由**：

- 避免循环依赖
- 确保单例模式
- 便于调试和测试

### ADR-003: API 调用通过 StateManager actions

**决策**：所有 API 调用必须通过 StateManager 的 actions  
**理由**：

- 统一的错误处理
- 状态管理集中化
- 便于测试和 mock
- 支持中间件和拦截器

---

## 下一步行动

### 立即执行 ✅

- [x] 移除未使用的导入和变量
- [x] 添加类型定义
- [x] 修复所有诊断错误

### 短期计划 (1-2 天)

- [ ] 使用 Logger 服务替代 console.log
- [ ] 将客户端配置移到配置文件
- [ ] 优化路由守卫错误处理

### 长期规划 (1-2 周)

- [ ] 实现完整的注册流程
- [ ] 添加安全增强（密码加密、CSRF 防护）
- [ ] 性能优化（虚拟滚动、缓存）
- [ ] 添加单元测试和 E2E 测试

---

**文档版本**：1.0  
**最后更新**：2025-10-15  
**维护者**：开发团队
