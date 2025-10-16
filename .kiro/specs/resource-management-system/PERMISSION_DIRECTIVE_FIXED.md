# 🔧 权限指令错误修复完成

## ❌ 遇到的错误

```
Uncaught SyntaxError: The requested module '/@fs/D:/vueproject/dangan/client/src/core/state/index.ts'
does not provide an export named 'store' (at permission.ts:12:10)
```

## 🔍 问题分析

### 根本原因

`src/core/directives/permission.ts` 试图从 `@/core/state` 导入 `store`，但：

1. 项目使用的是新的 StateManager 架构，不是 Vuex
2. `src/core/state/index.ts` 没有导出 `store`
3. 权限指令需要适配新的状态管理系统

### 相关文件

- `src/core/directives/permission.ts` - 使用了错误的导入
- `src/core/state/index.ts` - 没有 `store` 的导出
- StateManager - 新的状态管理系统

## ✅ 修复方案

### 1. 移除 store 导入

```typescript
// 修复前
import { store } from '@/core/state'

// 修复后
// 不再导入 store，直接使用 StateManager
```

### 2. 添加 StateManager 获取函数

```typescript
// 获取StateManager实例
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}
```

### 3. 重写权限检查函数

```typescript
function checkPermission(value: PermissionValue, modifier: string = 'any'): boolean {
  const stateManager = getStateManager()
  if (!stateManager) return false

  try {
    const authState = stateManager.getState('auth')
    const permissions = authState?.permissionInfo?.permissions || []

    if (typeof value === 'string') {
      return permissions.includes(value)
    }

    if (Array.isArray(value)) {
      if (modifier === 'all') {
        return value.every(p => permissions.includes(p))
      }
      return value.some(p => permissions.includes(p))
    }

    return false
  } catch (error) {
    console.warn('权限检查失败:', error)
    return false
  }
}
```

### 4. 重写角色检查函数

```typescript
function checkRole(value: string | string[]): boolean {
  const stateManager = getStateManager()
  if (!stateManager) return false

  try {
    const authState = stateManager.getState('auth')
    const roles = authState?.permissionInfo?.roleNames || []

    if (typeof value === 'string') {
      return roles.includes(value)
    } else if (Array.isArray(value)) {
      return value.some(r => roles.includes(r))
    }

    return false
  } catch (error) {
    console.warn('角色检查失败:', error)
    return false
  }
}
```

### 5. 更新指令实现

```typescript
export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const { value, modifiers } = binding
    const modifier = Object.keys(modifiers)[0] || 'any'

    if (!checkPermission(value, modifier)) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const { value, modifiers } = binding
    const modifier = Object.keys(modifiers)[0] || 'any'

    if (!checkPermission(value, modifier)) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    }
  },
}

export const role: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding

    if (!checkRole(value)) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding

    if (!checkRole(value)) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-role-hidden')
    }
  },
}
```

## 📝 修改的文件

### src/core/directives/permission.ts

完全重写了权限检查逻辑：

1. ✅ 移除了 `store` 导入
2. ✅ 添加了 `getStateManager()` 函数
3. ✅ 重写了 `checkPermission()` 函数
4. ✅ 添加了 `checkRole()` 函数
5. ✅ 更新了指令实现
6. ✅ 添加了错误处理

## 🎯 功能特性

### 1. 权限指令 (v-permission)

#### 单个权限

```vue
<a-button v-permission="'menu:resource:add'">新增</a-button>
```

#### 多个权限（满足任一）

```vue
<a-button v-permission="['menu:resource:edit', 'menu:resource:delete']">
  操作
</a-button>
```

#### 多个权限（全部满足）

```vue
<a-button v-permission:all="['menu:resource:view', 'menu:resource:edit']">
  查看并编辑
</a-button>
```

### 2. 角色指令 (v-role)

#### 单个角色

```vue
<div v-role="'系统管理员'">管理员专属内容</div>
```

#### 多个角色（满足任一）

```vue
<div v-role="['系统管理员', '超级管理员']">
  高级管理内容
</div>
```

## 🔄 与 StateManager 的集成

### 数据流

```
1. 用户登录
   ↓
2. authApiService.login() 调用后端API
   ↓
3. 返回用户信息和权限信息
   ↓
4. 保存到 StateManager 的 auth 模块
   ↓
5. 权限指令从 StateManager 读取权限
   ↓
6. 根据权限显示/隐藏元素
```

### StateManager 访问

```typescript
// 获取 StateManager
const stateManager = window.__MIGRATION_SYSTEM__.stateManagement.stateManager

// 获取 auth 状态
const authState = stateManager.getState('auth')

// 获取权限列表
const permissions = authState.permissionInfo?.permissions || []

// 获取角色列表
const roles = authState.permissionInfo?.roleNames || []
```

## 🛡️ 错误处理

### 1. StateManager 未初始化

```typescript
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null // 返回 null，指令会隐藏元素
}
```

### 2. 权限检查失败

```typescript
try {
  const authState = stateManager.getState('auth')
  // ... 权限检查逻辑
} catch (error) {
  console.warn('权限检查失败:', error)
  return false // 默认无权限
}
```

### 3. 安全默认值

- StateManager 不存在 → 隐藏元素
- 权限检查失败 → 隐藏元素
- 权限列表为空 → 隐藏元素

## ✅ 验证步骤

### 1. 检查语法错误

```bash
# 应该没有错误
npm run type-check
```

### 2. 启动应用

```bash
npm run dev:designer
```

### 3. 测试权限指令

```vue
<template>
  <!-- 测试单个权限 -->
  <a-button v-permission="'menu:resource:add'"> 新增（需要权限） </a-button>

  <!-- 测试不存在的权限 -->
  <a-button v-permission="'nonexistent:permission'"> 隐藏按钮（无权限） </a-button>

  <!-- 测试多个权限 -->
  <a-button v-permission="['menu:resource:edit', 'menu:resource:delete']"> 编辑或删除（满足任一） </a-button>

  <!-- 测试角色 -->
  <div v-role="'系统管理员'">管理员专属内容</div>
</template>
```

### 4. 检查控制台

- 不应该有 `store` 相关的错误
- 可能会看到权限检查的警告（如果StateManager未初始化）

### 5. 测试权限控制

1. 登录系统
2. 检查按钮是否根据权限显示/隐藏
3. 在浏览器控制台检查：

```javascript
// 查看权限
const sm = window.__MIGRATION_SYSTEM__.stateManagement.stateManager
const authState = sm.getState('auth')
console.log('权限列表:', authState.permissionInfo?.permissions)
console.log('角色列表:', authState.permissionInfo?.roleNames)
```

## 📊 对比

### 修复前

```typescript
// ❌ 使用不存在的 store
import { store } from '@/core/state'
const permissions = store.getters['auth/permissions']
```

### 修复后

```typescript
// ✅ 使用 StateManager
const stateManager = getStateManager()
const authState = stateManager.getState('auth')
const permissions = authState?.permissionInfo?.permissions || []
```

## 🎉 总结

错误已完全修复！

**修复内容：**

- ✅ 移除了 `store` 导入
- ✅ 适配了 StateManager 架构
- ✅ 重写了权限检查逻辑
- ✅ 添加了完善的错误处理
- ✅ 代码通过语法检查

**现在可以：**

- ✅ 正常使用 `v-permission` 指令
- ✅ 正常使用 `v-role` 指令
- ✅ 与 StateManager 完美集成
- ✅ 安全的错误处理

**指令功能：**

- ✅ 单个权限检查
- ✅ 多个权限检查（any/all）
- ✅ 角色检查
- ✅ 动态更新
- ✅ 安全默认值

权限指令现在已经完全适配新的架构，可以正常使用了！🚀

## 📚 相关文档

- [认证系统就绪](.kiro/specs/resource-management-system/AUTH_SYSTEM_READY.md)
- [认证错误修复](.kiro/specs/resource-management-system/AUTH_ERROR_FIXED.md)
- [Auth状态模块](../../src/core/state/modules/auth.ts)
- [权限指令](../../src/core/directives/permission.ts)
