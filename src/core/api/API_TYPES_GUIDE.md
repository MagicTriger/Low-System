# 统一 API 类型使用指南

本指南说明如何使用统一的 API 类型定义，确保所有 API 模块遵循一致的命名约定和响应格式。

## 概述

为了提高代码的一致性和可维护性，我们定义了一套统一的 API 类型系统。所有 API 模块都应该使用这些类型。

## 核心类型

### 1. ApiResponse<T>

统一的 API 响应格式，所有 API 方法都应该返回此格式。

```typescript
interface ApiResponse<T = any> {
  data: T // 响应数据
  code: number // 业务状态码
  message: string // 响应消息
  success: boolean // 请求是否成功
  timestamp?: number // 时间戳
  traceId?: string // 请求追踪ID
}
```

**使用示例：**

```typescript
import type { ApiResponse } from './types'

// 返回单个对象
export const userApi = {
  get(id: number) {
    return api.get<User>(`/user/${id}`)
  },
}
```

### 2. ApiListResponse<T>

统一的列表响应格式，用于返回列表数据的 API。

```typescript
interface ApiListResponse<T = any> {
  list: T[] // 数据列表
  total: number // 总记录数
  page?: number // 当前页码
  pageSize?: number // 每页数量
  totalPages?: number // 总页数
  hasNext?: boolean // 是否有下一页
  hasPrevious?: boolean // 是否有上一页
}
```

**使用示例：**

```typescript
import type { ApiListResponse } from './types'

export const userApi = {
  getList(params: UserQueryParams) {
    return api.get<ApiListResponse<User>>('/users', { params })
  },
}
```

### 3. ApiPaginationParams

统一的分页参数。

```typescript
interface ApiPaginationParams {
  page?: number // 页码（从1开始）
  pageSize?: number // 每页数量
  sortBy?: string // 排序字段
  sortOrder?: 'asc' | 'desc' | 'ascend' | 'descend' // 排序方向
}
```

**使用示例：**

```typescript
import type { ApiPaginationParams } from './types'

interface UserQueryParams extends ApiPaginationParams {
  username?: string
  email?: string
}
```

### 4. ApiQueryParams

统一的查询参数，包含分页、搜索和过滤功能。

```typescript
interface ApiQueryParams extends ApiPaginationParams {
  keyword?: string // 搜索关键词
  filters?: Record<string, any> // 过滤条件
  sorter?: {
    // 排序器配置
    field: string
    order: 'ascend' | 'descend'
  }
  dateRange?: {
    // 时间范围
    start?: string
    end?: string
  }
}
```

**使用示例：**

```typescript
import type { ApiQueryParams } from './types'

interface ProductQueryParams extends ApiQueryParams {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
}
```

### 5. ApiListParams

结合分页和查询功能的列表参数。

```typescript
interface ApiListParams extends ApiQueryParams {
  resourceCode?: string // 资源代码
  includeDeleted?: boolean // 是否包含已删除的记录
}
```

## 统一的命名约定

### API 方法命名

所有 API 模块应该使用以下统一的方法名：

| 操作     | 方法名     | HTTP 方法 | 说明         |
| -------- | ---------- | --------- | ------------ |
| 获取列表 | `getList`  | GET       | 获取资源列表 |
| 获取单个 | `get`      | GET       | 获取单个资源 |
| 创建     | `create`   | POST      | 创建新资源   |
| 更新     | `update`   | PUT       | 更新资源     |
| 删除     | `delete`   | DELETE    | 删除资源     |
| 复制     | `copy`     | POST      | 复制资源     |
| 批量操作 | `batchXxx` | POST      | 批量操作     |

**示例：**

```typescript
export const resourceApi = {
  // 获取列表
  getList(params: ResourceQueryParams) {
    return api.get<ApiListResponse<Resource>>('/resources', { params })
  },

  // 获取单个
  get(id: string) {
    return api.get<Resource>(`/resources/${id}`)
  },

  // 创建
  create(data: CreateResourceParams) {
    return api.post<Resource>('/resources', data)
  },

  // 更新
  update(id: string, data: Partial<Resource>) {
    return api.put<Resource>(`/resources/${id}`, data)
  },

  // 删除
  delete(id: string) {
    return api.delete<boolean>(`/resources/${id}`)
  },

  // 复制
  copy(params: CopyResourceParams) {
    return api.post<Resource>(`/resources/${params.id}/copy`, { name: params.name })
  },
}
```

### 参数类型命名

参数类型应该使用以下命名模式：

- 查询参数：`XxxQueryParams` 或 `XxxListParams`
- 创建参数：`CreateXxxParams`
- 更新参数：`UpdateXxxParams`
- 删除参数：`DeleteXxxParams`
- 批量操作参数：`BatchXxxParams`

**示例：**

```typescript
// 查询参数
interface UserQueryParams extends ApiQueryParams {
  username?: string
  email?: string
}

// 创建参数
interface CreateUserParams {
  username: string
  password: string
  email?: string
}

// 更新参数
interface UpdateUserParams {
  id: number
  data: Partial<User>
}

// 批量操作参数
interface BatchUpdateUserParams {
  ids: number[]
  data: Partial<User>
}
```

### 响应类型命名

响应类型应该使用以下命名模式：

- 单个对象响应：直接使用实体类型（如 `User`, `Product`）
- 列表响应：使用 `ApiListResponse<T>`
- 特殊响应：`XxxResponse`（如 `ValidationResponse`, `UploadResponse`）

## 完整示例

以下是一个完整的 API 模块示例：

```typescript
/**
 * 产品 API 模块
 *
 * 提供产品管理相关的 API 接口
 * 使用统一的命名约定和响应格式
 */

import { api } from './request'
import type { ApiResponse, ApiListResponse, ApiQueryParams, ApiCreateParams, ApiUpdateParams } from './types'

/**
 * 产品信息
 */
export interface Product {
  id: string
  name: string
  description?: string
  price: number
  category: string
  stock: number
  createdAt: string
  updatedAt: string
}

/**
 * 产品查询参数
 */
export interface ProductQueryParams extends ApiQueryParams {
  category?: string
  priceRange?: {
    min: number
    max: number
  }
  inStock?: boolean
}

/**
 * 创建产品参数
 */
export interface CreateProductParams {
  name: string
  description?: string
  price: number
  category: string
  stock: number
}

/**
 * 更新产品参数
 */
export interface UpdateProductParams {
  id: string
  data: Partial<Product>
}

/**
 * 产品 API 服务
 */
export const productApi = {
  /**
   * 获取产品列表
   * GET /products
   */
  getList(params?: ProductQueryParams) {
    return api.get<ApiListResponse<Product>>('/products', { params })
  },

  /**
   * 获取产品详情
   * GET /products/:id
   */
  get(id: string) {
    return api.get<Product>(`/products/${id}`)
  },

  /**
   * 创建产品
   * POST /products
   */
  create(data: CreateProductParams) {
    return api.post<Product>('/products', data)
  },

  /**
   * 更新产品
   * PUT /products/:id
   */
  update(id: string, data: Partial<Product>) {
    return api.put<Product>(`/products/${id}`, data)
  },

  /**
   * 删除产品
   * DELETE /products/:id
   */
  delete(id: string) {
    return api.delete<boolean>(`/products/${id}`)
  },

  /**
   * 批量更新产品
   * POST /products/batch-update
   */
  batchUpdate(data: { ids: string[]; updates: Partial<Product> }) {
    return api.post<boolean>('/products/batch-update', data)
  },
}
```

## 向后兼容性

为了保持向后兼容性，我们提供了以下策略：

### 1. 类型别名

为旧的类型名称提供别名：

```typescript
/**
 * @deprecated 使用 ApiListResponse 替代
 */
export type ListResponse<T> = ApiListResponse<T>

/**
 * @deprecated 使用 ApiPaginationParams 替代
 */
export type PaginationParams = ApiPaginationParams
```

### 2. 方法别名

为旧的方法名称提供别名：

```typescript
export const userApi = {
  // 新方法
  getList(params: UserQueryParams) {
    return api.get<ApiListResponse<User>>('/users', { params })
  },

  // 向后兼容的方法别名
  /**
   * @deprecated 使用 getList 替代
   */
  getUserList(params: UserQueryParams) {
    return this.getList(params)
  },
}
```

## 迁移指南

### 从旧 API 迁移到新 API

1. **更新导入语句**

```typescript
// 旧代码
import { getUserList } from '@/core/api/user'

// 新代码
import { userApi } from '@/core/api/user'
```

2. **更新方法调用**

```typescript
// 旧代码
const response = await getUserList({ page: 1, size: 10 })

// 新代码
const response = await userApi.getList({ page: 1, pageSize: 10 })
```

3. **更新类型引用**

```typescript
// 旧代码
import type { ListResponse } from '@/core/api/types'

// 新代码
import type { ApiListResponse } from '@/core/api/types'
```

## 最佳实践

1. **始终使用泛型指定响应数据类型**

```typescript
// ✅ 好
return api.get<User>(`/users/${id}`)

// ❌ 不好
return api.get(`/users/${id}`)
```

2. **为复杂参数定义专门的接口**

```typescript
// ✅ 好
interface CreateUserParams {
  username: string
  password: string
  email?: string
}

export const userApi = {
  create(data: CreateUserParams) {
    return api.post<User>('/users', data)
  },
}

// ❌ 不好
export const userApi = {
  create(username: string, password: string, email?: string) {
    return api.post<User>('/users', { username, password, email })
  },
}
```

3. **使用 JSDoc 注释说明 API 方法**

```typescript
/**
 * 获取用户列表
 * GET /users
 *
 * @param params - 查询参数
 * @returns 用户列表响应
 */
getList(params?: UserQueryParams) {
  return api.get<ApiListResponse<User>>('/users', { params })
}
```

4. **保持一致的错误处理**

所有 API 方法应该使用统一的错误处理机制（已在 `request.ts` 中实现）。

## 相关文件

- `src/core/api/types.ts` - 统一类型定义
- `src/core/api/request.ts` - API 请求封装
- `src/core/api/designer.ts` - 设计器 API 示例
- `src/core/api/overlay.ts` - 浮层 API 示例
- `src/core/api/event-config.ts` - 事件配置 API 示例
- `src/core/api/user.ts` - 用户 API 示例

## 总结

通过使用统一的 API 类型和命名约定，我们可以：

1. 提高代码的一致性和可读性
2. 减少类型错误和运行时错误
3. 简化 API 的使用和维护
4. 提供更好的 IDE 智能提示
5. 便于团队协作和代码审查

请在开发新的 API 模块时遵循本指南的规范。
