# 路由结构重构

## 更新时间

2025-10-15

## 更新内容

### 路由路径调整

将路由结构调整为更符合语义的层级结构：

**旧路由结构：**

- 资源管理器：`/resource`
- 设计器：`/designer/:pathMatch(.*)*`

**新路由结构：**

- 资源管理器：`/designer/resource`
- 设计器：`/designer/resource/:id`

### 修改的文件

#### 1. src/modules/designer/router/index.ts

**修改内容：**

- 更新根路径重定向：`/` → `/designer/resource`
- 更新资源管理路由：`/resource` → `/designer/resource`
- 更新设计器路由：`/designer/:pathMatch(.*)*` → `/designer/resource/:id`
- 更新登录后重定向：`/resource` → `/designer/resource`
- 更新 Layout 组件重定向：`/resource` → `/designer/resource`

**路由配置：**

```typescript
{
  path: '/designer/resource',
  name: 'ResourceManagement',
  component: ResourceManagement,
  meta: {
    title: '资源管理',
    requiresAuth: true,
  },
},
{
  path: '/designer/resource/:id',
  name: 'Designer',
  component: () => import('../views/DesignerNew.vue'),
  meta: {
    title: '设计器',
    requiresAuth: true,
  },
}
```

#### 2. src/modules/designer/views/ResourceManagement.vue

**修改内容：**

- 更新设计器路径构造：`/designer/${id}` → `/designer/resource/${id}`
- 更新路由参数：`pathMatch` → `id`

**导航代码：**

```typescript
const designerPath = `/designer/resource/${resource.id}`
router.push({
  name: 'Designer',
  params: {
    id: resource.id.toString(),
  },
})
```

#### 3. src/modules/designer/views/DesignerNew.vue

**修改内容：**

- 更新返回按钮路由：`/resource` → `/designer/resource`

**返回代码：**

```typescript
function handleBack() {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认返回',
      content: '当前有未保存的更改，确定要返回吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        router.push('/designer/resource')
      },
    })
  } else {
    router.push('/designer/resource')
  }
}
```

## 路由结构优势

### 1. 语义化更清晰

- `/designer/resource` - 明确表示这是设计器模块下的资源管理
- `/designer/resource/:id` - 明确表示这是设计器模块下的资源编辑

### 2. 层级结构更合理

- 所有设计器相关的路由都在 `/designer` 命名空间下
- 资源管理和资源编辑形成父子关系
- 便于后续扩展其他设计器相关功能

### 3. URL 更具可读性

- 旧：`localhost:5173/designer/2`
- 新：`localhost:5173/designer/resource/2`
- 新的 URL 更容易理解是在编辑哪个资源

### 4. 便于权限控制

- 可以基于 `/designer/*` 统一管理设计器模块的权限
- 可以针对 `/designer/resource` 和 `/designer/resource/:id` 设置不同的权限级别

## 兼容性说明

### 旧链接处理

如果有用户收藏了旧的路由地址，可以考虑添加重定向规则：

```typescript
{
  path: '/resource',
  redirect: '/designer/resource'
},
{
  path: '/designer/:id',
  redirect: to => `/designer/resource/${to.params.id}`
}
```

### 浏览器历史记录

- 用户的浏览器历史记录中的旧链接会失效
- 建议在应用启动时清理或更新历史记录

## 测试建议

1. 测试从资源管理页面跳转到设计器
2. 测试设计器返回按钮功能
3. 测试直接访问设计器 URL
4. 测试登录后的重定向
5. 测试未登录时的路由守卫
6. 测试浏览器前进/后退按钮
7. 测试刷新页面后的路由状态

## 后续优化建议

1. 添加面包屑导航显示完整路径
2. 考虑添加路由过渡动画
3. 优化路由参数验证
4. 添加路由错误处理
5. 考虑添加路由懒加载优化
