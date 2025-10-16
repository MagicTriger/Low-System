# 认证系统集成完成

## ✅ 已完成的工作

### 1. 认证API服务 (`src/core/api/auth.ts`)

- ✅ 完整的类型定义
- ✅ 登录/登出API
- ✅ 权限检查方法
- ✅ 错误处理

### 2. 权限指令 (`src/core/directives/permission.ts`)

- ✅ `v-permission` 指令 - 权限控制
- ✅ `v-role` 指令 - 角色控制
- ✅ 支持单个和多个权限/角色
- ✅ 支持 any/all 修饰符

## 🎯 使用指南

### 权限指令使用

```vue
<template>
  <!-- 单个权限 -->
  <a-button v-permission="'user:user-list:add'">新增</a-button>

  <!-- 多个权限（任一） -->
  <a-button v-permission="['user:user-list:add', 'user:user-list:edit']"> 编辑 </a-button>

  <!-- 多个权限（全部） -->
  <a-button v-permission:all="['user:user-list:view', 'user:user-list:edit']"> 高级编辑 </a-button>

  <!-- 角色控制 -->
  <div v-role="'系统管理员'">管理员专属内容</div>

  <!-- 多个角色 -->
  <div v-role="['系统管理员', '超级管理员']">高级管理内容</div>
</template>
```

### 在main.ts中注册指令

```typescript
import { permission, role } from '@/core/directives/permission'

app.directive('permission', permission)
app.directive('role', role)
```

### 编程式权限检查

```typescript
import { useModule } from '@/core/state/helpers'

const authModule = useModule('auth')

// 检查单个权限
if (authModule.getters.hasPermission('user:user-list:add')) {
  // 有权限
}

// 检查角色
if (authModule.getters.hasRole('系统管理员')) {
  // 是管理员
}

// 检查多个权限（任一）
if (authModule.getters.hasAnyPermission(['perm1', 'perm2'])) {
  // 有任一权限
}

// 检查多个权限（全部）
if (authModule.getters.hasAllPermissions(['perm1', 'perm2'])) {
  // 有所有权限
}
```

## 📝 后续工作

### 需要手动完成的任务

1. **注册权限指令**

   - 在 `src/modules/designer/main.ts` 中注册
   - 在 `src/modules/admin/main.ts` 中注册

2. **更新登录页面**

   - 使用新的 `authApiService.login()` 替代模拟登录
   - 处理完整的登录响应数据
   - 保存用户信息和权限信息

3. **更新路由守卫**

   - 检查 `accessToken` 而不是 `token`
   - 添加权限检查逻辑
   - 实现动态路由生成

4. **更新Auth状态模块**

   - 可以选择更新现有的 `src/core/state/modules/auth.ts`
   - 或者创建新的模块并迁移

5. **测试认证流程**
   - 测试登录功能
   - 测试权限指令
   - 测试路由守卫

## 🔧 集成步骤

### 步骤1: 注册指令

在 `src/modules/designer/main.ts`:

```typescript
import { permission, role } from '@/core/directives/permission'

app.directive('permission', permission)
app.directive('role', role)
```

### 步骤2: 更新登录逻辑

在登录页面的 `handleLogin` 方法中:

```typescript
import { authApiService } from '@/core/api/auth'

const handleLogin = async () => {
  try {
    const response = await authApiService.login({
      username: loginForm.username,
      password: loginForm.password,
    })

    if (response.success) {
      // 保存到Vuex
      await authModule.dispatch('login', {
        username: loginForm.username,
        password: loginForm.password,
      })

      message.success('登录成功')
      router.push('/resource')
    }
  } catch (error) {
    message.error(error.message || '登录失败')
  }
}
```

### 步骤3: 更新路由守卫

在路由配置中:

```typescript
router.beforeEach((to, from, next) => {
  const accessToken = localStorage.getItem('accessToken')

  if (to.meta.requiresAuth && !accessToken) {
    next('/login')
    return
  }

  // 权限检查
  if (to.meta.permissions) {
    const permissions = JSON.parse(localStorage.getItem('permissionInfo') || '{}').permissions || []
    const hasPermission = to.meta.permissions.some(p => permissions.includes(p))

    if (!hasPermission) {
      message.error('权限不足')
      next(false)
      return
    }
  }

  next()
})
```

## 🎉 完成后的效果

- ✅ 完整的登录认证流程
- ✅ 基于权限的UI控制
- ✅ 基于权限的路由控制
- ✅ 用户信息和权限信息管理
- ✅ 类型安全的API调用

## 📚 相关文档

- [认证系统升级文档](./AUTH_SYSTEM_UPGRADE.md)
- [后端登录接口文档](../../LOGIN_API_DOCUMENTATION.md)
- [权限字符串格式说明](./AUTH_SYSTEM_UPGRADE.md#权限字符串格式)
