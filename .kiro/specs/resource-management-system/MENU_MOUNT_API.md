# 菜单挂载到管理端 API 文档

## 概述

本文档描述了将资源管理界面中搜索出来的菜单挂载到管理端所需的API接口。

## API 端点

### 1. 挂载菜单到管理端

**接口名称**: 挂载菜单

**请求方式**: `POST`

**请求路径**: `/api/permissions/menus/mount`

**接口描述**: 将指定的菜单资源挂载到管理端,使其在管理端侧边栏中显示

#### 请求参数

**Content-Type**: `application/json`

**请求体 (Body)**:

```json
{
  "menuId": "string", // 必填,菜单ID
  "mountToAdmin": true, // 必填,是否挂载到管理端,true=挂载,false=取消挂载
  "sortOrder": 0 // 可选,在管理端的排序顺序,默认为0
}
```

**参数说明**:

| 参数名       | 类型    | 必填 | 说明                                      |
| ------------ | ------- | ---- | ----------------------------------------- |
| menuId       | string  | 是   | 要挂载的菜单ID                            |
| mountToAdmin | boolean | 是   | 是否挂载到管理端,true=挂载,false=取消挂载 |
| sortOrder    | number  | 否   | 在管理端的排序顺序,数字越小越靠前,默认为0 |

#### 响应结果

**成功响应** (HTTP 200):

```json
{
  "success": true,
  "message": "菜单挂载成功",
  "data": {
    "id": "menu_001",
    "menuCode": "RESOURCE_MGMT",
    "name": "资源管理",
    "mountedToAdmin": true,
    "sortOrder": 10,
    "updatedAt": "2025-10-16T10:30:00Z"
  }
}
```

**失败响应** (HTTP 400/404/500):

```json
{
  "success": false,
  "message": "错误信息描述",
  "errorCode": "MENU_NOT_FOUND",
  "data": null
}
```

**错误码说明**:

| 错误码            | HTTP状态码 | 说明               |
| ----------------- | ---------- | ------------------ |
| MENU_NOT_FOUND    | 404        | 菜单不存在         |
| INVALID_PARAMS    | 400        | 参数错误           |
| ALREADY_MOUNTED   | 409        | 菜单已经挂载       |
| PERMISSION_DENIED | 403        | 没有权限执行此操作 |
| SERVER_ERROR      | 500        | 服务器内部错误     |

---

### 2. 批量挂载菜单

**接口名称**: 批量挂载菜单

**请求方式**: `POST`

**请求路径**: `/api/permissions/menus/mount/batch`

**接口描述**: 批量将多个菜单资源挂载到管理端

#### 请求参数

**Content-Type**: `application/json`

**请求体 (Body)**:

```json
{
  "menuIds": ["string"], // 必填,菜单ID数组
  "mountToAdmin": true // 必填,是否挂载到管理端
}
```

**参数说明**:

| 参数名       | 类型     | 必填 | 说明                                      |
| ------------ | -------- | ---- | ----------------------------------------- |
| menuIds      | string[] | 是   | 要挂载的菜单ID数组                        |
| mountToAdmin | boolean  | 是   | 是否挂载到管理端,true=挂载,false=取消挂载 |

#### 响应结果

**成功响应** (HTTP 200):

```json
{
  "success": true,
  "message": "批量挂载完成",
  "data": {
    "total": 5,
    "success": 4,
    "failed": 1,
    "results": [
      {
        "menuId": "menu_001",
        "success": true,
        "message": "挂载成功"
      },
      {
        "menuId": "menu_002",
        "success": false,
        "message": "菜单不存在",
        "errorCode": "MENU_NOT_FOUND"
      }
    ]
  }
}
```

---

### 3. 获取已挂载菜单列表

**接口名称**: 获取已挂载菜单列表

**请求方式**: `GET`

**请求路径**: `/api/permissions/menus/mounted`

**接口描述**: 获取所有已挂载到管理端的菜单列表

#### 请求参数

**Query 参数**:

| 参数名    | 类型   | 必填 | 说明                                             |
| --------- | ------ | ---- | ------------------------------------------------ |
| page      | number | 否   | 页码,默认1                                       |
| pageSize  | number | 否   | 每页数量,默认20                                  |
| sortBy    | string | 否   | 排序字段,可选值: sortOrder, createdAt, updatedAt |
| sortOrder | string | 否   | 排序方向,可选值: asc, desc                       |

#### 响应结果

**成功响应** (HTTP 200):

```json
{
  "success": true,
  "message": "获取成功",
  "data": {
    "list": [
      {
        "id": "menu_001",
        "menuCode": "RESOURCE_MGMT",
        "name": "资源管理",
        "icon": "folder",
        "path": "/admin/resources",
        "nodeType": 2,
        "sortOrder": 10,
        "mountedToAdmin": true,
        "parentId": null,
        "module": "admin",
        "createdAt": "2025-10-15T10:00:00Z",
        "updatedAt": "2025-10-16T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 15,
      "totalPages": 1
    }
  }
}
```

---

### 4. 更新挂载菜单排序

**接口名称**: 更新挂载菜单排序

**请求方式**: `PUT`

**请求路径**: `/api/permissions/menus/mount/sort`

**接口描述**: 更新已挂载菜单在管理端的排序顺序

#### 请求参数

**Content-Type**: `application/json`

**请求体 (Body)**:

```json
{
  "menuId": "string", // 必填,菜单ID
  "sortOrder": 0 // 必填,新的排序顺序
}
```

**参数说明**:

| 参数名    | 类型   | 必填 | 说明                        |
| --------- | ------ | ---- | --------------------------- |
| menuId    | string | 是   | 菜单ID                      |
| sortOrder | number | 是   | 新的排序顺序,数字越小越靠前 |

#### 响应结果

**成功响应** (HTTP 200):

```json
{
  "success": true,
  "message": "排序更新成功",
  "data": {
    "menuId": "menu_001",
    "sortOrder": 5,
    "updatedAt": "2025-10-16T10:35:00Z"
  }
}
```

---

### 5. 取消挂载菜单

**接口名称**: 取消挂载菜单

**请求方式**: `DELETE`

**请求路径**: `/api/permissions/menus/mount/{menuId}`

**接口描述**: 取消指定菜单在管理端的挂载

#### 请求参数

**路径参数**:

| 参数名 | 类型   | 必填 | 说明               |
| ------ | ------ | ---- | ------------------ |
| menuId | string | 是   | 要取消挂载的菜单ID |

#### 响应结果

**成功响应** (HTTP 200):

```json
{
  "success": true,
  "message": "取消挂载成功",
  "data": {
    "menuId": "menu_001",
    "mountedToAdmin": false,
    "updatedAt": "2025-10-16T10:40:00Z"
  }
}
```

---

## 前端集成示例

### 1. 挂载单个菜单

```typescript
import { menuApiService } from '@/core/api/menu'

// 挂载菜单
async function mountMenu(menuId: string) {
  try {
    const response = await menuApiService.mountMenu({
      menuId,
      mountToAdmin: true,
      sortOrder: 10,
    })

    if (response.success) {
      message.success('菜单挂载成功')
      // 刷新菜单列表
      await refreshMenuList()
    } else {
      message.error(response.message || '挂载失败')
    }
  } catch (error) {
    console.error('挂载菜单失败:', error)
    message.error('挂载菜单失败')
  }
}
```

### 2. 批量挂载菜单

```typescript
// 批量挂载
async function batchMountMenus(menuIds: string[]) {
  try {
    const response = await menuApiService.batchMountMenus({
      menuIds,
      mountToAdmin: true,
    })

    if (response.success) {
      const { success, failed, total } = response.data
      message.success(`批量挂载完成: 成功 ${success}/${total}`)

      if (failed > 0) {
        // 显示失败详情
        console.warn('部分菜单挂载失败:', response.data.results)
      }

      // 刷新菜单列表
      await refreshMenuList()
    }
  } catch (error) {
    console.error('批量挂载失败:', error)
    message.error('批量挂载失败')
  }
}
```

### 3. 取消挂载

```typescript
// 取消挂载
async function unmountMenu(menuId: string) {
  try {
    const response = await menuApiService.unmountMenu(menuId)

    if (response.success) {
      message.success('取消挂载成功')
      // 刷新菜单列表
      await refreshMenuList()
    } else {
      message.error(response.message || '取消挂载失败')
    }
  } catch (error) {
    console.error('取消挂载失败:', error)
    message.error('取消挂载失败')
  }
}
```

### 4. 获取已挂载菜单

```typescript
// 获取已挂载菜单列表
async function getMountedMenus() {
  try {
    const response = await menuApiService.getMountedMenus({
      page: 1,
      pageSize: 20,
      sortBy: 'sortOrder',
      sortOrder: 'asc',
    })

    if (response.success) {
      return response.data.list
    }
  } catch (error) {
    console.error('获取已挂载菜单失败:', error)
    return []
  }
}
```

---

## API Service 实现

在 `src/core/api/menu.ts` 中添加以下方法:

```typescript
/**
 * 挂载菜单到管理端
 */
async mountMenu(params: {
  menuId: string
  mountToAdmin: boolean
  sortOrder?: number
}): Promise<ApiResponse<MenuTreeNode>> {
  try {
    const response = await this.client.post('/api/permissions/menus/mount', params)
    return this.handleResponse(response)
  } catch (error) {
    return this.handleError(error)
  }
}

/**
 * 批量挂载菜单
 */
async batchMountMenus(params: {
  menuIds: string[]
  mountToAdmin: boolean
}): Promise<ApiResponse<{
  total: number
  success: number
  failed: number
  results: Array<{
    menuId: string
    success: boolean
    message: string
    errorCode?: string
  }>
}>> {
  try {
    const response = await this.client.post('/api/permissions/menus/mount/batch', params)
    return this.handleResponse(response)
  } catch (error) {
    return this.handleError(error)
  }
}

/**
 * 获取已挂载菜单列表
 */
async getMountedMenus(params?: {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ApiResponse<{
  list: MenuTreeNode[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}>> {
  try {
    const response = await this.client.get('/api/permissions/menus/mounted', { params })
    return this.handleResponse(response)
  } catch (error) {
    return this.handleError(error)
  }
}

/**
 * 更新挂载菜单排序
 */
async updateMountSort(params: {
  menuId: string
  sortOrder: number
}): Promise<ApiResponse<{
  menuId: string
  sortOrder: number
  updatedAt: string
}>> {
  try {
    const response = await this.client.put('/api/permissions/menus/mount/sort', params)
    return this.handleResponse(response)
  } catch (error) {
    return this.handleError(error)
  }
}

/**
 * 取消挂载菜单
 */
async unmountMenu(menuId: string): Promise<ApiResponse<{
  menuId: string
  mountedToAdmin: boolean
  updatedAt: string
}>> {
  try {
    const response = await this.client.delete(`/api/permissions/menus/mount/${menuId}`)
    return this.handleResponse(response)
  } catch (error) {
    return this.handleError(error)
  }
}
```

---

## 数据库字段

菜单表需要添加以下字段:

```sql
ALTER TABLE menus ADD COLUMN mounted_to_admin BOOLEAN DEFAULT FALSE COMMENT '是否挂载到管理端';
ALTER TABLE menus ADD COLUMN admin_sort_order INT DEFAULT 0 COMMENT '在管理端的排序顺序';
ALTER TABLE menus ADD COLUMN mounted_at TIMESTAMP NULL COMMENT '挂载时间';
```

---

## 权限控制

建议为菜单挂载功能添加权限控制:

- **权限码**: `menu:mount`
- **权限名称**: 挂载菜单到管理端
- **权限描述**: 允许用户将菜单挂载到管理端侧边栏

在前端使用权限指令:

```vue
<a-button v-permission="'menu:mount'" @click="handleMount(record)">
  {{ record.mountedToAdmin ? '取消挂载' : '挂载' }}
</a-button>
```

---

## 注意事项

1. **权限验证**: 所有API都应该验证用户是否有 `menu:mount` 权限
2. **数据验证**:
   - 验证菜单ID是否存在
   - 验证菜单类型是否允许挂载(通常只有页面类型 nodeType=2 可以挂载)
   - 验证排序顺序是否为有效数字
3. **级联处理**:
   - 挂载父菜单时,可以选择是否同时挂载子菜单
   - 取消挂载父菜单时,应该同时取消子菜单的挂载
4. **缓存更新**: 挂载/取消挂载后,应该清除管理端的菜单缓存
5. **日志记录**: 记录所有挂载操作的审计日志
6. **实时更新**: 挂载后,管理端应该能够实时或通过刷新看到新菜单

---

## 测试用例

### 1. 挂载菜单测试

```bash
# 挂载菜单
curl -X POST http://localhost:3000/api/permissions/menus/mount \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "menuId": "menu_001",
    "mountToAdmin": true,
    "sortOrder": 10
  }'
```

### 2. 批量挂载测试

```bash
# 批量挂载
curl -X POST http://localhost:3000/api/permissions/menus/mount/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "menuIds": ["menu_001", "menu_002", "menu_003"],
    "mountToAdmin": true
  }'
```

### 3. 获取已挂载菜单测试

```bash
# 获取已挂载菜单
curl -X GET "http://localhost:3000/api/permissions/menus/mounted?page=1&pageSize=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. 取消挂载测试

```bash
# 取消挂载
curl -X DELETE http://localhost:3000/api/permissions/menus/mount/menu_001 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 总结

本API文档提供了完整的菜单挂载功能接口定义,包括:

- ✅ 单个菜单挂载
- ✅ 批量菜单挂载
- ✅ 获取已挂载菜单列表
- ✅ 更新挂载菜单排序
- ✅ 取消菜单挂载

后端开发人员可以根据此文档实现相应的API接口,前端开发人员可以根据此文档进行集成开发。
