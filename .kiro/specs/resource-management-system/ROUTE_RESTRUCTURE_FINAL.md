# 路由结构最终调整

## 更新时间

2025-10-15

## 最终路由结构

**资源管理器：** `/resource`
**设计器：** `/designer/resource/:url`

### 设计说明

1. **资源管理器路径简化**

   - 从 `/designer/resource` 简化为 `/resource`
   - 作为应用的主入口页面，路径更简洁
   - 登录后默认跳转到 `/resource`

2. **设计器路径语义化**
   - 使用 `/designer/resource/:url` 格式
   - 参数名从 `id` 改为 `url`，使用资源的 URL 路径而不是 ID
   - 明确表示这是设计器模块下的资源编辑功能

### 修改的文件

#### 1. src/modules/designer/router/index.ts

**路由配置：**

```typescript
{
  path: '/resource',
  name: 'ResourceManagement',
  component: ResourceManagement,
  meta: {
    title: '资源管理',
    requiresAuth: true,
  },
},
{
  path: '/designer/resource/:url',
  name: 'Designer',
  component: () => import('../views/DesignerNew.vue'),
  meta: {
    title: '设计器',
    requiresAuth: true,
  },
}
```

**重定向更新：**

- 根路径 `/` → `/resource`
- Layout 重定向 → `/resource`
- 登录后重定向 → `/resource`

#### 2. src/modules/designer/views/ResourceManagement.vue

**导航代码：**

```typescript
const designerPath = `/designer/resource/${resource.url}`
router.push({
  name: 'Designer',
  params: {
    url: resource.url, // 使用 url 参数而不是 id
  },
})
```

#### 3. src/modules/designer/views/DesignerNew.vue

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
        router.push('/resource')
      },
    })
  } else {
    router.push('/resource')
  }
}
```

## URL 示例

### 资源管理页面

```
http://localhost:5173/resource
```

### 设计器页面

```
http://localhost:5173/designer/resource/home
http://localhost:5173/designer/resource/about
http://localhost:5173/designer/resource/contact
```

## 优势

### 1. 路径更简洁

- 资源管理页面使用简短的 `/resource` 路径
- 作为主要入口，更容易记忆和输入

### 2. 语义化更清晰

- `/designer/resource/:url` 明确表示是在设计器中编辑资源
- 使用 `url` 参数名更符合实际用途（资源的 URL 路径）

### 3. URL 更友好

- 使用资源的 URL 路径而不是数字 ID
- 例如：`/designer/resource/home` 比 `/designer/resource/1` 更易读

### 4. SEO 友好

- 使用有意义的 URL 路径有利于 SEO
- 便于用户理解当前正在编辑的资源

## 数据结构要求

资源对象需要包含 `url` 字段：

```typescript
interface Resource {
  id: number
  name: string
  url: string // 资源的 URL 路径，如 'home', 'about', 'contact'
  // ... 其他字段
}
```

## 测试建议

1. ✅ 测试登录后跳转到 `/resource`
2. ✅ 测试从资源管理页面点击卡片跳转到设计器
3. ✅ 测试设计器返回按钮跳转到 `/resource`
4. ✅ 测试直接访问设计器 URL（如 `/designer/resource/home`）
5. ✅ 测试浏览器前进/后退按钮
6. ✅ 测试刷新页面后的路由状态
7. ✅ 测试未登录时的路由守卫

## 注意事项

1. **资源 URL 唯一性**

   - 确保每个资源的 `url` 字段是唯一的
   - 建议在数据库层面添加唯一约束

2. **URL 格式验证**

   - 资源 URL 应该只包含字母、数字、连字符和下划线
   - 避免使用特殊字符和空格

3. **404 处理**

   - 如果访问不存在的资源 URL，应该显示友好的 404 页面
   - 建议在设计器组件中添加资源存在性检查

4. **URL 编码**
   - 如果资源 URL 包含特殊字符，需要进行 URL 编码
   - Vue Router 会自动处理大部分编码问题
