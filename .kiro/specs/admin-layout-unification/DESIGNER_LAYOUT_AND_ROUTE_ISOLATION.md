# 设计端布局更新和路由隔离

## 🎯 更新内容

根据用户需求,完成以下修改:

1. ✅ **设计端侧边栏标题改为"资源管理"**
2. ✅ **侧边栏和顶部导航栏改为管理端背景色** (#2f4050)
3. ✅ **侧边栏添加用户头像显示**
4. ✅ **设计端和管理端路由完全隔离**

---

## 📝 详细修改

### 1. 设计端布局配置更新

**文件**: `src/modules/designer/config/layout.ts`

#### 修改内容:

```typescript
// 头部标题
header: {
  title: '资源管理',  // 从 '低代码设计平台' 改为 '资源管理'
  // ...
}

// 侧边栏配置
sidebar: {
  showUserInfo: true,  // 从 false 改为 true,显示用户头像
  userInfo: {
    name: '',
    avatar: '',
    role: '',
  },
  // ...
}

// 主题配置
theme: {
  sidebarBg: '#2f4050',  // 从 '#001529' 改为 '#2f4050' (管理端背景色)
  headerBg: '#2f4050',   // 从 '#ffffff' 改为 '#2f4050' (管理端背景色)
  // ...
}
```

---

### 2. 路由隔离配置

#### 2.1 设计端路由 (Designer)

**文件**: `src/modules/designer/router/index.ts`

**路由前缀**: `/designer`

**路由列表**:

| 路径                      | 路由名称                     | 组件               | 说明                                               |
| ------------------------- | ---------------------------- | ------------------ | -------------------------------------------------- |
| `/`                       | -                            | Redirect           | 重定向到 `/designer/resource` 或 `/designer/login` |
| `/designer/login`         | `DesignerLogin`              | Login              | 设计端登录页                                       |
| `/designer`               | -                            | Layout             | 设计端主布局                                       |
| `/designer/resource`      | `DesignerResourceManagement` | ResourceManagement | 资源管理页                                         |
| `/designer/resource/:url` | `DesignerEditor`             | DesignerNew        | 设计器编辑页                                       |
| `/preview/:id`            | `DesignerPreview`            | Preview            | 预览页面                                           |
| `/designer/*`             | `DesignerNotFound`           | NotFound           | 设计端 404                                         |

**关键特性**:

- 所有路由名称添加 `Designer` 前缀
- 登录页路径: `/designer/login`
- 默认首页: `/designer/resource`
- 独立的 404 处理

#### 2.2 管理端路由 (Admin)

**文件**: `src/modules/admin/router/index.ts`

**路由前缀**: `/admin`

**路由列表**:

| 路径               | 路由名称         | 组件      | 说明         |
| ------------------ | ---------------- | --------- | ------------ |
| `/admin/login`     | `AdminLogin`     | Login     | 管理端登录页 |
| `/admin`           | `AdminLayout`    | Layout    | 管理端主布局 |
| `/admin/dashboard` | `AdminDashboard` | Dashboard | 仪表板       |
| `/admin/*`         | `AdminNotFound`  | NotFound  | 管理端 404   |

**关键特性**:

- 所有路由名称添加 `Admin` 前缀
- 登录页路径: `/admin/login`
- 默认首页: `/admin/dashboard`
- 独立的 404 处理
- 动态路由通过 `registerDynamicRoutes` 添加

---

## 🎨 视觉效果对比

### 修改前

**设计端**:

- 标题: "低代码设计平台"
- 头部背景: 白色 (#ffffff)
- 侧边栏背景: 深蓝色 (#001529)
- 用户头像: 不显示

### 修改后

**设计端**:

- 标题: "资源管理"
- 头部背景: 深灰蓝色 (#2f4050) - 与管理端一致
- 侧边栏背景: 深灰蓝色 (#2f4050) - 与管理端一致
- 用户头像: 显示在侧边栏顶部

---

## 🔒 路由隔离架构

### 隔离策略

```
应用根路径 (/)
├── 设计端 (/designer/*)
│   ├── /designer/login          → 设计端登录
│   ├── /designer/resource       → 资源管理
│   ├── /designer/resource/:url  → 设计器
│   └── /preview/:id             → 预览页面
│
└── 管理端 (/admin/*)
    ├── /admin/login             → 管理端登录
    ├── /admin/dashboard         → 仪表板
    └── /admin/*                 → 动态路由
```

### 隔离优势

1. **命名空间隔离**:

   - 设计端路由名称: `Designer*`
   - 管理端路由名称: `Admin*`
   - 避免路由名称冲突

2. **路径隔离**:

   - 设计端: `/designer/*`
   - 管理端: `/admin/*`
   - 清晰的 URL 结构

3. **认证隔离**:

   - 设计端使用 `token` (localStorage)
   - 管理端使用 `access_token` (localStorage)
   - 独立的认证状态

4. **404 处理隔离**:
   - 设计端: `/designer/*` → `DesignerNotFound`
   - 管理端: `/admin/*` → `AdminNotFound`
   - 各自处理未匹配路由

---

## 🧪 测试指南

### 1. 布局测试

#### 设计端布局

```bash
# 访问设计端
http://localhost:5173/designer/resource
```

**检查项**:

- ✅ 头部标题显示 "资源管理"
- ✅ 头部背景色为 #2f4050 (深灰蓝色)
- ✅ 侧边栏背景色为 #2f4050 (深灰蓝色)
- ✅ 侧边栏顶部显示用户头像
- ✅ 用户头像在展开/折叠状态下正常显示

#### 管理端布局

```bash
# 访问管理端
http://localhost:5173/admin/dashboard
```

**检查项**:

- ✅ 头部标题显示 "管理后台"
- ✅ 头部背景色为 #ffffff (白色)
- ✅ 侧边栏背景色为 #2f4050 (深灰蓝色)
- ✅ 侧边栏顶部显示用户头像

### 2. 路由隔离测试

#### 设计端路由

```bash
# 1. 访问根路径
http://localhost:5173/
# 预期: 重定向到 /designer/resource 或 /designer/login

# 2. 访问设计端登录
http://localhost:5173/designer/login
# 预期: 显示设计端登录页

# 3. 访问资源管理
http://localhost:5173/designer/resource
# 预期: 显示资源管理页 (需要登录)

# 4. 访问设计器
http://localhost:5173/designer/resource/test-page
# 预期: 显示设计器页面 (需要登录)

# 5. 访问预览
http://localhost:5173/preview/123
# 预期: 显示预览页面 (无需登录)

# 6. 访问不存在的设计端路由
http://localhost:5173/designer/not-exist
# 预期: 显示设计端 404 页面
```

#### 管理端路由

```bash
# 1. 访问管理端登录
http://localhost:5173/admin/login
# 预期: 显示管理端登录页

# 2. 访问仪表板
http://localhost:5173/admin/dashboard
# 预期: 显示仪表板 (需要登录)

# 3. 访问不存在的管理端路由
http://localhost:5173/admin/not-exist
# 预期: 显示管理端 404 页面
```

### 3. 认证隔离测试

```javascript
// 设计端认证
localStorage.setItem('token', 'designer-token')

// 管理端认证
localStorage.setItem('access_token', 'admin-token')

// 验证两个系统使用不同的 token
```

### 4. 路由守卫测试

#### 设计端守卫

- 未登录访问 `/designer/resource` → 重定向到 `/designer/login`
- 已登录访问 `/designer/login` → 重定向到 `/designer/resource`

#### 管理端守卫

- 未登录访问 `/admin/dashboard` → 重定向到 `/admin/login`
- 已登录访问 `/admin/login` → 保持在登录页 (需要手动跳转)

---

## 📋 配置对比

### 设计端 vs 管理端

| 配置项           | 设计端             | 管理端           |
| ---------------- | ------------------ | ---------------- |
| **标题**         | 资源管理           | 管理后台         |
| **头部背景**     | #2f4050            | #ffffff          |
| **侧边栏背景**   | #2f4050            | #2f4050          |
| **显示用户头像** | ✅ 是              | ✅ 是            |
| **显示图标库**   | ✅ 是              | ❌ 否            |
| **路由前缀**     | /designer          | /admin           |
| **登录页**       | /designer/login    | /admin/login     |
| **默认首页**     | /designer/resource | /admin/dashboard |
| **Token 键名**   | token              | access_token     |

---

## ✅ 完成状态

### 已完成功能

- ✅ 设计端标题改为 "资源管理"
- ✅ 设计端头部背景色改为 #2f4050
- ✅ 设计端侧边栏背景色改为 #2f4050
- ✅ 设计端侧边栏显示用户头像
- ✅ 设计端路由添加 `/designer` 前缀
- ✅ 管理端路由添加 `/admin` 前缀
- ✅ 所有路由名称添加模块前缀
- ✅ 独立的 404 处理
- ✅ 独立的登录页路径
- ✅ 独立的认证 token

### 视觉特点

- 🎨 统一的深灰蓝色主题 (#2f4050)
- 👤 清晰的用户头像显示
- 📱 完整的响应式支持
- ⚡ 流畅的动画效果
- 🎯 突出的资源管理主题

### 架构特点

- 🔒 完全的路由隔离
- 🏗️ 清晰的命名空间
- 🔐 独立的认证系统
- 🎯 精确的路由匹配
- 🚀 易于维护和扩展

---

## 🔧 后续优化建议

### 1. 用户信息同步

当前用户信息配置为空对象,建议:

```typescript
// 在登录成功后更新用户信息
const userInfo = {
  name: '用户名',
  avatar: '头像URL',
  role: '角色',
}

// 更新到布局配置
designerLayoutConfig.sidebar.userInfo = userInfo
```

### 2. 路由守卫增强

建议添加:

- Token 有效性验证
- 权限检查
- 路由切换日志
- 错误边界处理

### 3. 动态路由支持

设计端可能需要动态路由功能:

```typescript
// 类似管理端的动态路由注册
export function registerDesignerDynamicRoutes(router: Router, routes: RouteRecordRaw[]): void {
  routes.forEach(route => {
    router.addRoute('DesignerLayout', route)
  })
}
```

### 4. 路由过渡动画

添加路由切换动画:

```vue
<router-view v-slot="{ Component }">
  <transition name="fade" mode="out-in">
    <component :is="Component" />
  </transition>
</router-view>
```

---

## 📚 相关文档

- [统一布局系统文档](./README.md)
- [设计端路由配置](../../src/modules/designer/router/index.ts)
- [管理端路由配置](../../src/modules/admin/router/index.ts)
- [布局类型定义](../../src/core/layout/types.ts)

---

**更新时间**: 2025-10-15  
**更新状态**: ✅ 完成  
**测试状态**: 待测试
