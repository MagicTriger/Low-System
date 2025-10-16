# 管理页面迁移到管理端

## 修复时间

2025-10-16

## 问题描述

用户管理、角色管理、菜单管理、权限管理这些页面显示在了设计端(/designer/resource)目录下,但它们应该属于管理端(/admin)的功能模块。

## 解决方案

### 1. 创建管理端页面

在`src/modules/admin/views/`目录下创建了以下页面:

#### 用户管理 (UserManagement.vue)

- 路径: `/admin/user`
- 功能: 用户的增删改查
- 包含: 用户列表、新建用户、编辑用户、删除用户

#### 角色管理 (RoleManagement.vue)

- 路径: `/admin/role`
- 功能: 角色的增删改查和权限分配
- 包含: 角色列表、新建角色、编辑角色、权限配置、删除角色

#### 菜单管理 (MenuManagement.vue)

- 路径: `/admin/menu`
- 功能: 菜单资源的树形管理
- 包含: 菜单树、新建菜单、编辑菜单、删除菜单

#### 权限管理 (PermissionManagement.vue)

- 路径: `/admin/permission`
- 功能: 权限的增删改查
- 包含: 权限列表、新建权限、编辑权限、删除权限

### 2. 更新路由配置

修改`src/modules/admin/router/index.ts`,添加这些页面的路由:

```typescript
const UserManagement = () => import('../views/UserManagement.vue')
const RoleManagement = () => import('../views/RoleManagement.vue')
const MenuManagement = () => import('../views/MenuManagement.vue')
const PermissionManagement = () => import('../views/PermissionManagement.vue')

// 在AdminLayout的children中添加
{
  path: 'user',
  name: 'AdminUserManagement',
  component: UserManagement,
  meta: { title: '用户管理', icon: 'user' },
},
{
  path: 'role',
  name: 'AdminRoleManagement',
  component: RoleManagement,
  meta: { title: '角色管理', icon: 'team' },
},
{
  path: 'menu',
  name: 'AdminMenuManagement',
  component: MenuManagement,
  meta: { title: '菜单管理', icon: 'menu' },
},
{
  path: 'permission',
  name: 'AdminPermissionManagement',
  component: PermissionManagement,
  meta: { title: '权限管理', icon: 'safety' },
},
```

### 3. 目录结构

```
src/modules/
├── admin/                    # 管理端模块
│   ├── views/
│   │   ├── Dashboard.vue           # 仪表板
│   │   ├── UserManagement.vue      # 用户管理 ✅ 新增
│   │   ├── RoleManagement.vue      # 角色管理 ✅ 新增
│   │   ├── MenuManagement.vue      # 菜单管理 ✅ 新增
│   │   ├── PermissionManagement.vue # 权限管理 ✅ 新增
│   │   ├── Layout.vue
│   │   ├── Login.vue
│   │   └── NotFound.vue
│   ├── router/
│   │   └── index.ts                # 路由配置 ✅ 已更新
│   └── ...
└── designer/                 # 设计端模块
    ├── views/
    │   ├── ResourceManagement.vue  # 资源管理(设计端专用)
    │   ├── DesignerNew.vue         # 设计器
    │   └── ...
    └── ...
```

## 功能特性

### 1. 模块隔离

- 管理端(/admin): 系统管理功能(用户、角色、菜单、权限)
- 设计端(/designer): 页面设计功能(资源管理、设计器)

### 2. 路由规范

- 管理端路由: `/admin/*`
- 设计端路由: `/designer/*`

### 3. 页面布局

- 所有管理页面使用统一的AdminLayout布局
- 包含侧边栏导航、顶部栏、内容区域

### 4. 权限控制

- 所有管理页面需要登录认证
- 支持基于角色的权限控制

## 页面功能

### 用户管理

- 用户列表展示
- 新建用户
- 编辑用户信息
- 删除用户
- 用户状态管理(启用/禁用)

### 角色管理

- 角色列表展示
- 新建角色
- 编辑角色信息
- 角色权限配置
- 删除角色
- 角色状态管理

### 菜单管理

- 菜单树形展示
- 新建菜单(文件夹/页面/按钮)
- 编辑菜单信息
- 删除菜单
- 菜单排序
- 图标选择

### 权限管理

- 权限列表展示
- 新建权限
- 编辑权限信息
- 删除权限
- 权限状态管理

## 访问路径

### 管理端

- 仪表板: http://localhost:5173/admin/dashboard
- 用户管理: http://localhost:5173/admin/user
- 角色管理: http://localhost:5173/admin/role
- 菜单管理: http://localhost:5173/admin/menu
- 权限管理: http://localhost:5173/admin/permission

### 设计端

- 资源管理: http://localhost:5173/designer/resource
- 设计器: http://localhost:5173/designer/resource/:url

## 侧边栏菜单

管理端侧边栏将显示:

```
📊 仪表板
👤 用户管理
👥 角色管理
📋 菜单管理
🔒 权限管理
```

设计端侧边栏将显示:

```
📁 资源管理
```

## 后续工作

### 1. 实现完整的CRUD功能

- 连接后端API
- 实现表单验证
- 实现数据提交和更新

### 2. 实现权限控制

- 基于角色的访问控制
- 按钮级权限控制
- 数据权限过滤

### 3. 优化用户体验

- 添加搜索和过滤功能
- 添加批量操作
- 添加导入导出功能

### 4. 数据联动

- 用户-角色关联
- 角色-权限关联
- 菜单-权限关联

## 测试建议

### 1. 测试路由访问

- 访问 http://localhost:5173/admin/user
- 访问 http://localhost:5173/admin/role
- 访问 http://localhost:5173/admin/menu
- 访问 http://localhost:5173/admin/permission

### 2. 测试页面显示

- 确认页面正确渲染
- 确认表格正确显示
- 确认按钮正确显示

### 3. 测试侧边栏导航

- 确认侧边栏显示所有菜单项
- 确认点击菜单项可以正确跳转
- 确认当前页面高亮显示

### 4. 测试权限控制

- 未登录时访问管理页面应跳转到登录页
- 登录后可以正常访问

## 相关文件

### 新增文件

- `src/modules/admin/views/UserManagement.vue` - 用户管理页面
- `src/modules/admin/views/RoleManagement.vue` - 角色管理页面
- `src/modules/admin/views/MenuManagement.vue` - 菜单管理页面
- `src/modules/admin/views/PermissionManagement.vue` - 权限管理页面

### 修改文件

- `src/modules/admin/router/index.ts` - 添加新页面的路由配置

### 保持不变

- `src/modules/designer/views/ResourceManagement.vue` - 设计端资源管理(保留)

## 完成状态

✅ 创建用户管理页面
✅ 创建角色管理页面
✅ 创建菜单管理页面
✅ 创建权限管理页面
✅ 更新路由配置
✅ 文档已编写

⏳ 待实现: 完整的CRUD功能
⏳ 待实现: 权限控制
⏳ 待实现: 数据联动

## 总结

这次修改将系统管理相关的页面(用户、角色、菜单、权限)从设计端迁移到了管理端,实现了功能模块的正确划分:

- **管理端(/admin)**: 负责系统管理,包括用户管理、角色管理、菜单管理、权限管理
- **设计端(/designer)**: 负责页面设计,包括资源管理、页面设计器

这样的划分更符合系统架构的设计原则,也更便于后续的功能扩展和维护。
