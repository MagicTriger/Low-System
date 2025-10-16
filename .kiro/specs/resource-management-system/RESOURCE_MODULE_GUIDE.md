# 资源模块归属指南

## 问题说明

在设计端的资源管理界面中创建的菜单资源(用户管理、角色管理、菜单管理、权限管理)应该属于**管理端(admin)**模块,而不是设计端(designer)模块。

## 核心概念

### 模块字段(module)

每个菜单资源都有一个`module`字段,用于标识该资源属于哪个模块:

- `admin` - 管理端模块(系统管理功能)
- `designer` - 设计端模块(页面设计功能)

### 菜单挂载机制

1. 在设计端的资源管理界面中创建菜单资源
2. 设置资源的`module`字段为`admin`
3. 点击"挂载"按钮,将资源挂载到管理端
4. 管理端会自动从后端获取已挂载的菜单资源
5. 管理端的侧边栏会自动显示这些菜单项
6. 管理端会自动注册这些菜单对应的路由

## 正确的资源配置

### 用户管理

```json
{
  "name": "用户管理",
  "menuCode": "user",
  "module": "admin", // ✅ 设置为admin
  "nodeType": 2,
  "path": "user",
  "icon": "user-outlined",
  "sortOrder": 1
}
```

### 角色管理

```json
{
  "name": "角色管理",
  "menuCode": "role",
  "module": "admin", // ✅ 设置为admin
  "nodeType": 2,
  "path": "role",
  "icon": "team-outlined",
  "sortOrder": 2
}
```

### 菜单管理

```json
{
  "name": "菜单管理",
  "menuCode": "menu",
  "module": "admin", // ✅ 设置为admin
  "nodeType": 2,
  "path": "menu",
  "icon": "menu-outlined",
  "sortOrder": 3
}
```

### 权限管理

```json
{
  "name": "权限管理",
  "menuCode": "permission",
  "module": "admin", // ✅ 设置为admin
  "nodeType": 2,
  "path": "permission",
  "icon": "safety-outlined",
  "sortOrder": 4
}
```

## 操作步骤

### 1. 在设计端创建资源

1. 访问设计端资源管理页面: `http://localhost:5173/designer/resource`
2. 点击"新建资源"按钮
3. 填写资源信息:
   - **资源名称**: 用户管理
   - **菜单编码**: user
   - **业务模块**: **admin** (重要!)
   - **节点类型**: 页面
   - **路由路径**: user
   - **图标**: user-outlined
   - **排序序号**: 1
4. 点击"确定"保存

### 2. 挂载资源到管理端

1. 在资源列表中找到刚创建的资源
2. 点击"挂载"按钮
3. 系统会调用API将资源挂载到管理端
4. 挂载成功后,按钮会变成"取消挂载"

### 3. 在管理端查看

1. 访问管理端: `http://localhost:5173/admin`
2. 登录后,侧边栏会自动显示已挂载的菜单项
3. 点击菜单项可以访问对应的页面

## 技术实现

### 动态路由注册

管理端的路由配置中有一个`generateRoutesFromMenu`函数,它会:

1. 从后端获取已挂载的菜单树
2. 遍历菜单树,为每个页面类型的节点生成路由配置
3. 动态注册路由到Vue Router

```typescript
export function generateRoutesFromMenu(nodes: MenuTreeNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const node of nodes) {
    // 只处理页面类型的节点
    if (node.nodeType === 2 && node.path) {
      const route: RouteRecordRaw = {
        path: node.path.startsWith('/') ? node.path.slice(1) : node.path,
        name: node.menuCode,
        component: () => import(`../views/${node.meta || 'Default'}.vue`).catch(() => import('../views/NotFound.vue')),
        meta: {
          title: node.name,
          icon: node.icon,
          menuCode: node.menuCode,
          module: node.module, // 模块信息
        },
      }
      routes.push(route)
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      routes.push(...generateRoutesFromMenu(node.children))
    }
  }

  return routes
}
```

### 页面组件加载

路由配置中使用动态导入:

```typescript
component: () => import(`../views/${node.meta || 'Default'}.vue`)
```

这意味着你需要在`src/modules/admin/views/`目录下创建对应的Vue组件文件。

## 页面组件创建

虽然路由是动态注册的,但页面组件文件仍然需要手动创建。

### 创建用户管理页面

在`src/modules/admin/views/`目录下创建`UserManagement.vue`:

```vue
<template>
  <div class="user-management">
    <a-card :bordered="false">
      <template #title>
        <h2>用户管理</h2>
      </template>
      <!-- 用户管理的具体内容 -->
    </a-card>
  </div>
</template>

<script setup lang="ts">
// 用户管理的逻辑
</script>

<style scoped>
.user-management {
  padding: 24px;
}
</style>
```

### 文件命名规则

页面组件的文件名应该与资源的`meta`字段对应:

- 如果`meta`字段为空,使用`Default.vue`
- 如果`meta`字段为`UserManagement`,使用`UserManagement.vue`
- 文件名使用PascalCase命名法

## 常见问题

### Q1: 为什么要在设计端创建管理端的资源?

A: 设计端的资源管理是一个统一的资源配置中心,所有模块的菜单资源都在这里管理。通过`module`字段来区分资源属于哪个模块。

### Q2: 如果不挂载资源会怎样?

A: 如果不挂载,资源只是存储在数据库中,不会出现在管理端的侧边栏中,也不会注册对应的路由。

### Q3: 可以动态取消挂载吗?

A: 可以。点击"取消挂载"按钮,资源会从管理端移除,侧边栏中的菜单项也会消失。

### Q4: 页面组件必须手动创建吗?

A: 是的。虽然路由是动态注册的,但Vue组件文件仍然需要手动创建。这是因为组件的具体实现逻辑是无法自动生成的。

### Q5: 如果页面组件不存在会怎样?

A: 路由配置中有错误处理,如果找不到对应的组件文件,会自动加载`NotFound.vue`页面。

## 架构优势

### 1. 集中管理

所有模块的菜单资源都在设计端统一管理,便于维护和配置。

### 2. 灵活挂载

可以动态控制哪些资源挂载到哪个模块,无需修改代码。

### 3. 权限控制

可以基于用户角色动态控制菜单的显示和访问权限。

### 4. 多模块支持

支持多个模块(admin、designer等),每个模块有独立的菜单和路由。

## 数据流程

```
1. 设计端创建资源
   ↓
2. 设置module=admin
   ↓
3. 点击挂载按钮
   ↓
4. 调用API: mountMenuToAdmin(menuCode)
   ↓
5. 后端标记资源为已挂载
   ↓
6. 管理端启动时获取已挂载的菜单树
   ↓
7. 生成路由配置
   ↓
8. 注册动态路由
   ↓
9. 侧边栏显示菜单项
   ↓
10. 用户点击菜单项访问页面
```

## 总结

正确的做法是:

1. ✅ 在设计端的资源管理界面创建菜单资源
2. ✅ 设置`module`字段为`admin`
3. ✅ 点击"挂载"按钮将资源挂载到管理端
4. ✅ 在`src/modules/admin/views/`目录下创建对应的Vue组件文件
5. ✅ 管理端会自动显示已挂载的菜单并注册路由

错误的做法是:

1. ❌ 在管理端的路由配置中硬编码菜单路由
2. ❌ 设置`module`字段为`designer`
3. ❌ 不挂载资源就期望它出现在管理端

通过这种方式,实现了菜单资源的动态配置和灵活挂载,提高了系统的可维护性和扩展性。
