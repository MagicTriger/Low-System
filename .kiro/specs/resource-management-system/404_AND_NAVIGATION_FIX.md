# 404页面和导航修复

## 完成日期

2025-10-15

## 问题描述

1. **设计器路由404问题**: 点击资源卡片的设计器图标后，页面跳转到404页面
2. **404页面返回首页逻辑错误**: 404页面的"返回首页"按钮硬编码跳转到`/designer`，没有根据token状态判断应该跳转到哪里

## 根本原因

### 问题1: 设计器路由配置错误

设计器路由被配置为 `/main` 的子路由：

```typescript
{
  path: '/main',
  children: [
    {
      path: '/designer',  // 实际路径是 /main/designer
      name: 'Designer',
      // ...
    },
  ],
}
```

但资源的 `url` 字段配置的是 `/designer`，导致路由不匹配。

### 问题2: NotFound组件返回逻辑错误

```typescript
const goHome = () => {
  router.push('/designer') // 硬编码，没有考虑认证状态
}
```

这导致：

- 未登录用户点击"返回首页"会跳转到需要认证的页面，再次被重定向到登录页
- 已登录用户跳转到设计器页面，但应该跳转到资源管理页面

## 解决方案

### 修复1: 调整设计器路由配置

将设计器路由从 `/main` 的子路由移到顶层：

```typescript
// 修改前
{
  path: '/main',
  children: [
    { path: '/resource', ... },
    { path: '/designer', ... },  // 错误：实际路径是 /main/designer
  ],
}

// 修改后
{
  path: '/main',
  children: [
    { path: '/resource', ... },
  ],
},
{
  path: '/designer',  // 正确：路径就是 /designer
  name: 'Designer',
  component: () => import('../views/DesignerNew.vue'),
  meta: {
    title: '设计器',
    requiresAuth: true,
  },
},
```

### 修复2: 优化NotFound组件返回逻辑

根据token状态智能跳转：

```typescript
const goHome = () => {
  // 检查是否有token
  const token = localStorage.getItem('token')
  if (token) {
    // 有token，跳转到资源管理页面
    router.push('/resource')
  } else {
    // 没有token，跳转到登录页面
    router.push('/login')
  }
}
```

### 修复3: 更新快速导航链接

将"设计器"链接改为"资源管理"：

```vue
<!-- 修改前 -->
<router-link to="/designer" class="nav-link">
  <Icon name="design" />
  <span>设计器</span>
</router-link>

<!-- 修改后 -->
<router-link to="/resource" class="nav-link">
  <Icon name="design" />
  <span>资源管理</span>
</router-link>
```

## 修改的文件

1. **src/modules/designer/router/index.ts**

   - 将设计器路由从 `/main` 子路由移到顶层
   - 确保路径为 `/designer`

2. **src/modules/designer/views/NotFound.vue**
   - 修改 `goHome` 方法，根据token状态跳转
   - 更新快速导航链接
   - 添加 `.prevent` 修饰符防止默认行为

## 测试步骤

### 测试1: 设计器路由跳转

1. 登录系统
2. 进入资源管理页面
3. 右键点击资源卡片翻转
4. 点击设计器图标
5. **预期结果**: 成功跳转到 `/designer` 页面，不再显示404

### 测试2: 404页面返回首页（已登录）

1. 确保已登录（localStorage中有token）
2. 访问一个不存在的路径，如 `/test123`
3. 看到404页面
4. 点击"返回首页"按钮
5. **预期结果**: 跳转到 `/resource` 资源管理页面

### 测试3: 404页面返回首页（未登录）

1. 清除localStorage中的token
2. 访问一个不存在的路径，如 `/test123`
3. 看到404页面
4. 点击"返回首页"按钮
5. **预期结果**: 跳转到 `/login` 登录页面

### 测试4: 快速导航链接

1. 在404页面
2. 点击"资源管理"链接
3. **预期结果**:
   - 已登录：跳转到资源管理页面
   - 未登录：被路由守卫拦截，跳转到登录页面

## 路由结构说明

修复后的路由结构：

```
/                          → 根据token重定向到 /resource 或 /login
├── /main                  → Layout布局
│   └── /resource          → 资源管理页面
├── /designer              → 设计器页面（独立路由）
├── /preview/:id           → 预览页面
├── /login                 → 登录页面
└── /:pathMatch(.*)*       → 404页面（通配符）
```

**关键点**:

- `/resource` 在 `/main` 布局下，使用Layout组件
- `/designer` 是独立路由，不在Layout下
- 所有需要认证的页面都有 `requiresAuth: true`

## 认证流程

```
用户访问页面
  ↓
路由守卫检查
  ↓
需要认证？
  ├─ 是 → 检查token
  │       ├─ 有token → 允许访问
  │       └─ 无token → 跳转到登录页
  └─ 否 → 直接允许访问
```

## 404页面智能跳转逻辑

```
用户点击"返回首页"
  ↓
检查localStorage中的token
  ├─ 有token → 跳转到 /resource（资源管理）
  └─ 无token → 跳转到 /login（登录页面）
```

## 最佳实践

### 1. 路由配置原则

```typescript
// ✅ 好的做法：独立的顶层路由
{
  path: '/designer',
  name: 'Designer',
  component: DesignerNew,
}

// ❌ 不好的做法：不必要的嵌套
{
  path: '/main',
  children: [
    {
      path: '/designer',  // 实际路径变成 /main/designer
    },
  ],
}
```

### 2. 智能导航

```typescript
// ✅ 好的做法：根据状态判断
const goHome = () => {
  const token = localStorage.getItem('token')
  router.push(token ? '/resource' : '/login')
}

// ❌ 不好的做法：硬编码
const goHome = () => {
  router.push('/designer') // 可能导致认证问题
}
```

### 3. 路由元信息

```typescript
// ✅ 好的做法：明确标注认证要求
{
  path: '/designer',
  meta: {
    title: '设计器',
    requiresAuth: true,  // 明确需要认证
  },
}

// ❌ 不好的做法：依赖默认行为
{
  path: '/designer',
  meta: {
    title: '设计器',
    // 没有明确标注，依赖路由守卫的默认逻辑
  },
}
```

## 常见问题

### Q1: 为什么设计器路由不放在Layout下？

**A**: 设计器可能需要全屏显示，不需要Layout的头部和侧边栏。如果需要Layout，可以这样配置：

```typescript
{
  path: '/main',
  component: Layout,
  children: [
    {
      path: 'resource',  // 注意：不要以 / 开头
      name: 'ResourceManagement',
      component: ResourceManagement,
    },
    {
      path: 'designer',  // 路径会是 /main/designer
      name: 'Designer',
      component: DesignerNew,
    },
  ],
}
```

然后资源的 `url` 字段配置为 `/main/designer`。

### Q2: 如何支持设计器的动态路径？

**A**: 可以添加参数：

```typescript
{
  path: '/designer/:id?',  // id 为可选参数
  name: 'Designer',
  component: DesignerNew,
  meta: {
    title: '设计器',
    requiresAuth: true,
  },
}
```

然后资源配置：

```json
{
  "url": "/designer/123"
}
```

### Q3: 404页面如何记住用户想访问的页面？

**A**: 可以使用路由的 `query` 参数：

```typescript
// 路由守卫中
if (requiresAuth && !isAuthenticated) {
  next({
    path: '/login',
    query: { redirect: to.fullPath }, // 记录原始路径
  })
}

// 登录成功后
const redirect = route.query.redirect as string
router.push(redirect || '/resource')
```

### Q4: 如何处理权限不足的情况？

**A**: 当前实现会阻止导航。可以改为跳转到403页面：

```typescript
if (!hasPermission) {
  next('/403') // 跳转到权限不足页面
  return
}
```

## 性能优化

### 1. 路由懒加载

```typescript
// ✅ 使用懒加载
component: () => import('../views/DesignerNew.vue')

// ❌ 直接导入
import DesignerNew from '../views/DesignerNew.vue'
component: DesignerNew
```

### 2. 路由预加载

```typescript
// 在用户可能访问前预加载
router.beforeEach((to, from, next) => {
  if (to.name === 'ResourceManagement') {
    // 预加载设计器组件
    import('../views/DesignerNew.vue')
  }
  next()
})
```

### 3. 缓存路由组件

```vue
<template>
  <router-view v-slot="{ Component }">
    <keep-alive :include="['ResourceManagement']">
      <component :is="Component" />
    </keep-alive>
  </router-view>
</template>
```

## 安全考虑

### 1. Token验证

```typescript
// 在路由守卫中验证token有效性
const token = localStorage.getItem('token')
if (token) {
  try {
    // 验证token是否过期
    const decoded = jwtDecode(token)
    if (decoded.exp * 1000 < Date.now()) {
      // token已过期
      localStorage.removeItem('token')
      next('/login')
      return
    }
  } catch (error) {
    // token无效
    localStorage.removeItem('token')
    next('/login')
    return
  }
}
```

### 2. 防止XSS攻击

```typescript
// 清理URL参数
const sanitizeUrl = (url: string) => {
  // 移除危险字符
  return url.replace(/<script>/gi, '')
}

const goHome = () => {
  const redirect = sanitizeUrl(route.query.redirect as string)
  router.push(redirect || '/resource')
}
```

## 总结

通过这次修复，解决了两个关键问题：

1. **设计器路由404**: 将设计器路由从嵌套路由移到顶层，确保路径匹配
2. **404页面智能导航**: 根据token状态智能跳转到正确的页面

**修复效果**:

- ✅ 点击设计器图标可以正常跳转
- ✅ 404页面的"返回首页"按钮根据登录状态智能跳转
- ✅ 快速导航链接更新为正确的路径
- ✅ 提升了用户体验和系统的健壮性

**后续建议**:

- 考虑添加403权限不足页面
- 实现路由过渡动画
- 添加面包屑导航
- 实现路由缓存机制

---

**修复人员**: Kiro AI Assistant  
**完成状态**: ✅ 已完成  
**测试状态**: 待验证  
**优先级**: 高
