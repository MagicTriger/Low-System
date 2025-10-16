# 微服务架构导航问题诊断

## 问题描述

点击资源卡片的"设计器"按钮后，跳转到404页面。

## 根本原因

项目采用**微服务架构**，有多个独立的应用运行在不同端口：

- **designer端**: `localhost:5173` - 设计器 + 资源管理界面
- **admin端**: `localhost:5174` - 管理端（中后台管理系统）
- **mobile端**: `localhost:5175` - 移动端

当前问题：

1. 用户在 designer端（5173）的资源管理页面
2. 点击"用户管理"资源的设计器按钮
3. 代码尝试跳转到相对路径（如 `/user-management`）
4. 但这个路径可能属于 admin端（5174），在 designer端不存在
5. 结果显示404页面

## 数据库资源配置问题

资源表中的 `url` 字段应该包含：

- **跨端资源**: 完整URL（如 `http://localhost:5174/user-management`）
- **同端资源**: 相对路径（如 `/designer/page1`）

当前可能所有资源都只存储了相对路径，导致跨端跳转失败。

## 解决方案

### 方案1：修改资源数据（推荐）

在数据库中为跨端资源配置完整URL：

```sql
-- 示例：用户管理属于admin端
UPDATE menu_resources
SET url = 'http://localhost:5174/user-management'
WHERE menu_code = 'user-management';

-- 或者使用环境变量
UPDATE menu_resources
SET url = '${ADMIN_URL}/user-management'
WHERE menu_code = 'user-management';
```

### 方案2：前端智能路由（临时方案）

修改 `handleDesigner` 方法，根据资源类型判断目标端口：

```typescript
const handleDesigner = (resource: MenuResource) => {
  let targetUrl = resource.url || resource.path

  // 如果是相对路径，根据资源模块判断目标端口
  if (targetUrl && !targetUrl.startsWith('http')) {
    const portMap: Record<string, number> = {
      designer: 5173,
      admin: 5174,
      mobile: 5175,
    }

    const targetPort = portMap[resource.module] || 5173
    const currentPort = window.location.port

    // 如果目标端口与当前端口不同，使用完整URL
    if (targetPort.toString() !== currentPort) {
      targetUrl = `http://localhost:${targetPort}${targetUrl}`
    }
  }

  // 跳转
  window.location.href = targetUrl
}
```

### 方案3：配置路由映射表

创建一个配置文件，映射资源到对应的端：

```typescript
// src/config/resource-routes.ts
export const resourceRouteMap: Record<string, string> = {
  'user-management': 'http://localhost:5174/user-management',
  'role-management': 'http://localhost:5174/role-management',
  'designer-page1': '/designer/page1', // 同端资源用相对路径
}
```

## 调试步骤

1. **查看资源数据**

   ```typescript
   console.log('资源对象:', resource)
   console.log('URL:', resource.url)
   console.log('Path:', resource.path)
   console.log('Module:', resource.module)
   ```

2. **确认目标端口**

   - 用户管理应该在哪个端？designer(5173) 还是 admin(5174)?

3. **测试跨端跳转**
   - 手动访问 `http://localhost:5174/user-management`
   - 确认该路由是否存在

## 下一步行动

1. **立即行动**: 在控制台查看资源对象的完整数据
2. **确认架构**: 明确每个资源属于哪个端
3. **选择方案**: 根据实际情况选择上述解决方案之一
4. **更新数据**: 修改数据库或代码配置

## 相关文件

- `vite.config.ts` - 端口配置
- `src/modules/designer/views/ResourceManagement.vue` - 资源管理页面
- `src/modules/designer/router/index.ts` - designer端路由配置
- `src/modules/admin/router/index.ts` - admin端路由配置
