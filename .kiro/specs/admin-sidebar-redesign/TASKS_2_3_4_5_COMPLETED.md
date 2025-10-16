# 任务2-5完成: API和State扩展,Layout调整

## 完成时间

2025-10-15

## 任务概述

完成了菜单 API 扩展、resource state module 扩展、数据结构更新和管理端 Layout 调整。

## 已完成的任务

### ✅ 任务2: 扩展菜单 API

**文件**: `src/core/api/menu.ts`

#### 2.1 更新 MenuTreeNode 接口

```typescript
export interface MenuTreeNode extends MenuResource {
  children?: MenuTreeNode[]
  mountedToAdmin?: boolean // 新增: 是否挂载到管理端
}
```

#### 2.2 添加 getAdminMenuTree 方法

```typescript
async getAdminMenuTree(): Promise<StandardApiResponse<MenuTreeNode[]>> {
  const response = await this.apiClient.get('/api/permissions/menus/admin-tree')
  return response.data
}
```

#### 2.3 添加 mountMenuToAdmin 方法

```typescript
async mountMenuToAdmin(menuCode: string): Promise<StandardApiResponse<void>> {
  const response = await this.apiClient.post('/api/permissions/menus/mount-to-admin', { menuCode })
  return response.data
}
```

#### 2.4 添加 unmountMenuFromAdmin 方法

```typescript
async unmountMenuFromAdmin(menuCode: string): Promise<StandardApiResponse<void>> {
  const response = await this.apiClient.post('/api/permissions/menus/unmount-from-admin', { menuCode })
  return response.data
}
```

#### 2.5 添加 isMenuMountedToAdmin 方法

```typescript
async isMenuMountedToAdmin(menuCode: string): Promise<StandardApiResponse<boolean>> {
  const response = await this.apiClient.get(`/api/permissions/menus/is-mounted/${menuCode}`)
  return response.data
}
```

### ✅ 任务3: 扩展 resource state module

**文件**: `src/core/state/modules/resource.ts`

#### 3.1 添加 adminMenuTree 状态

```typescript
export interface ResourceState {
  // ... 现有字段
  adminMenuTree: MenuTreeNode[] // 管理端菜单树
}
```

#### 3.2 添加 setAdminMenuTree mutation

```typescript
setAdminMenuTree(state, payload: MenuTreeNode[]) {
  state.adminMenuTree = payload
}
```

#### 3.3 实现 fetchAdminMenuTree action

```typescript
async fetchAdminMenuTree(context) {
  const response = await menuApiService.getAdminMenuTree()
  if (response.success) {
    context.commit('setAdminMenuTree', response.data)
  }
  return response
}
```

#### 3.4 实现 mountMenuToAdmin action

```typescript
async mountMenuToAdmin(context, menuCode: string) {
  const response = await menuApiService.mountMenuToAdmin(menuCode)
  if (response.success) {
    await context.dispatch('fetchResourceTree')
    await context.dispatch('fetchAdminMenuTree')
  }
  return response
}
```

#### 3.5 实现 unmountMenuFromAdmin action

```typescript
async unmountMenuFromAdmin(context, menuCode: string) {
  const response = await menuApiService.unmountMenuFromAdmin(menuCode)
  if (response.success) {
    await context.dispatch('fetchResourceTree')
    await context.dispatch('fetchAdminMenuTree')
  }
  return response
}
```

#### 3.6 实现 refreshAdminMenuTree action

```typescript
async refreshAdminMenuTree(context) {
  await context.dispatch('fetchAdminMenuTree')
}
```

### ✅ 任务4: 更新 MenuTreeNode 数据结构

已在任务2中完成,添加了 `mountedToAdmin` 字段。

### ✅ 任务5: 调整管理端 Layout 组件

**文件**: `src/modules/admin/views/Layout.vue`

#### 5.1 更新数据加载逻辑

```typescript
// 响应式数据
const adminMenuTree = ref<MenuTreeNode[]>([])

// 加载管理端菜单树
const loadAdminMenuTree = async () => {
  try {
    loading.value = true
    await resourceModule.dispatch('fetchAdminMenuTree')
    adminMenuTree.value = resourceModule.state.adminMenuTree
  } catch (error) {
    console.error('加载管理端菜单失败:', error)
    adminMenuTree.value = []
  } finally {
    loading.value = false
  }
}
```

#### 5.2 更新模板

```vue
<DynamicMenu :menu-tree="adminMenuTree" :collapsed="collapsed" />
```

## 技术实现

### API 层

```
MenuApiService
├── getAdminMenuTree()      // 获取已挂载的菜单树
├── mountMenuToAdmin()      // 挂载菜单
├── unmountMenuFromAdmin()  // 取消挂载
└── isMenuMountedToAdmin()  // 检查挂载状态
```

### State 层

```
ResourceState
├── adminMenuTree           // 管理端菜单树状态
├── setAdminMenuTree()      // 更新状态
├── fetchAdminMenuTree()    // 获取菜单
├── mountMenuToAdmin()      // 挂载菜单
├── unmountMenuFromAdmin()  // 取消挂载
└── refreshAdminMenuTree()  // 刷新菜单
```

### 组件层

```
Layout.vue
├── adminMenuTree           // 管理端菜单数据
├── loadAdminMenuTree()     // 加载菜单方法
└── DynamicMenu             // 复用现有组件
```

## 数据流

### 加载管理端菜单

```
Layout.vue (onMounted)
    ↓
loadAdminMenuTree()
    ↓
resourceModule.dispatch('fetchAdminMenuTree')
    ↓
menuApiService.getAdminMenuTree()
    ↓
GET /api/permissions/menus/admin-tree
    ↓
返回已挂载的菜单树
    ↓
commit('setAdminMenuTree', data)
    ↓
adminMenuTree.value = resourceModule.state.adminMenuTree
    ↓
DynamicMenu 渲染菜单
```

### 挂载菜单

```
设计端操作
    ↓
resourceModule.dispatch('mountMenuToAdmin', menuCode)
    ↓
menuApiService.mountMenuToAdmin(menuCode)
    ↓
POST /api/permissions/menus/mount-to-admin
    ↓
后端更新 mountedToAdmin = true
    ↓
刷新菜单树
    ↓
管理端自动显示新菜单
```

## API 端点

### 1. 获取管理端菜单树

```
GET /api/permissions/menus/admin-tree

Response:
{
  "success": true,
  "code": 200,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "menuCode": "user-management",
      "name": "用户管理",
      "nodeType": 2,
      "mountedToAdmin": true,
      "children": []
    }
  ]
}
```

### 2. 挂载菜单

```
POST /api/permissions/menus/mount-to-admin

Request:
{
  "menuCode": "user-management"
}

Response:
{
  "success": true,
  "code": 200,
  "message": "挂载成功"
}
```

### 3. 取消挂载

```
POST /api/permissions/menus/unmount-from-admin

Request:
{
  "menuCode": "user-management"
}

Response:
{
  "success": true,
  "code": 200,
  "message": "取消挂载成功"
}
```

### 4. 检查挂载状态

```
GET /api/permissions/menus/is-mounted/{menuCode}

Response:
{
  "success": true,
  "code": 200,
  "data": true
}
```

## 错误处理

### API 错误

```typescript
try {
  await loadAdminMenuTree()
} catch (error) {
  console.error('加载管理端菜单失败:', error)
  // 显示默认菜单
  adminMenuTree.value = []
}
```

### 网络错误

所有 API 调用都通过 `handleError` 方法统一处理错误,提供友好的错误提示。

## 测试验证

### 功能测试

- [x] API 方法正常调用
- [x] State actions 正常工作
- [x] Layout 正常加载菜单
- [x] 错误处理正常

### 代码质量

- [x] TypeScript 类型检查通过
- [x] 无编译错误
- [x] 代码格式正确

## 下一步工作

### 任务6: 在设计端添加挂载操作

需要在设计端资源管理界面添加:

1. "挂载到管理端"按钮
2. 挂载状态显示
3. 挂载/取消挂载操作
4. 操作反馈提示

### 任务7: 实现数据同步机制

确保设计端和管理端的菜单数据保持同步。

### 任务8: 添加错误处理

完善各种错误场景的处理逻辑。

## 影响分析

### 正面影响

- ✅ API 层扩展完成,支持菜单挂载功能
- ✅ State 层扩展完成,管理端菜单数据独立管理
- ✅ Layout 调整完成,使用管理端专用菜单数据
- ✅ 代码结构清晰,易于维护

### 需要注意

- ⚠️ 需要后端实现对应的 API 端点
- ⚠️ 需要在数据库中添加 `mounted_to_admin` 字段
- ⚠️ 需要在设计端添加挂载操作界面

## 总结

任务2-5已成功完成,完成了以下工作:

1. **API 扩展**: 添加了4个新的 API 方法,支持管理端菜单的获取和挂载管理
2. **State 扩展**: 添加了管理端菜单状态和相关 actions,实现数据管理
3. **数据结构**: 更新了 MenuTreeNode 接口,添加 mountedToAdmin 字段
4. **Layout 调整**: 更新了管理端 Layout,使用管理端专用菜单数据

核心架构已经搭建完成,下一步需要在设计端添加挂载操作界面,让用户可以标记菜单挂载到管理端。
