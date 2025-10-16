# 自定义图标库后端API设计文档

## 更新时间

2025-10-16

## 概述

本文档定义了自定义图标库的完整后端API设计，支持用户上传、管理和共享自定义图标。

## 目录

1. [API端点列表](#api端点列表)
2. [数据模型](#数据模型)
3. [API详细说明](#api详细说明)
4. [错误处理](#错误处理)
5. [数据库设计](#数据库设计)
6. [前端集成](#前端集成)
7. [安全考虑](#安全考虑)

---

## API端点列表

### 基础路径

```
/api/icons
```

### 端点概览

| 方法   | 端点                          | 描述                     | 认证 |
| ------ | ----------------------------- | ------------------------ | ---- |
| GET    | `/api/icons/custom`           | 获取用户的自定义图标列表 | 必需 |
| GET    | `/api/icons/custom/:id`       | 获取单个自定义图标详情   | 必需 |
| POST   | `/api/icons/custom`           | 创建新的自定义图标       | 必需 |
| PUT    | `/api/icons/custom/:id`       | 更新自定义图标           | 必需 |
| DELETE | `/api/icons/custom/:id`       | 删除自定义图标           | 必需 |
| POST   | `/api/icons/custom/batch`     | 批量导入图标             | 必需 |
| GET    | `/api/icons/custom/export`    | 导出所有图标             | 必需 |
| POST   | `/api/icons/custom/:id/share` | 分享图标给其他用户       | 必需 |
| GET    | `/api/icons/shared`           | 获取共享给我的图标       | 必需 |
| POST   | `/api/icons/custom/:id/copy`  | 复制共享图标到我的图标库 | 必需 |

---

## 数据模型

### CustomIcon 模型

```typescript
interface CustomIcon {
  id: string // 图标唯一ID
  userId: string // 所属用户ID
  name: string // 图标名称
  svg: string // SVG内容
  category: string // 分类
  tags: string[] // 标签数组
  description?: string // 图标描述
  isPublic: boolean // 是否公开
  createdAt: number // 创建时间戳
  updatedAt: number // 更新时间戳
}
```

### IconShare 模型

```typescript
interface IconShare {
  id: string // 分享记录ID
  iconId: string // 图标ID
  ownerId: string // 图标所有者ID
  sharedWithUserId: string // 被分享用户ID
  permission: 'view' | 'copy' // 权限类型
  createdAt: number // 分享时间戳
}
```

---

## API详细说明

### 1. 获取自定义图标列表

获取当前用户的所有自定义图标。

**请求**

```http
GET /api/icons/custom
Authorization: Bearer {token}
```

**查询参数**

| 参数      | 类型   | 必需 | 描述                                 |
| --------- | ------ | ---- | ------------------------------------ |
| page      | number | 否   | 页码，默认1                          |
| pageSize  | number | 否   | 每页数量，默认20                     |
| category  | string | 否   | 按分类筛选                           |
| search    | string | 否   | 搜索关键词                           |
| sortBy    | string | 否   | 排序字段：name, createdAt, updatedAt |
| sortOrder | string | 否   | 排序方向：asc, desc                  |

**响应**

```json
{
  "success": true,
  "data": {
    "icons": [
      {
        "id": "custom_1697123456789_abc123",
        "userId": "user_123",
        "name": "my-custom-icon",
        "svg": "<svg>...</svg>",
        "category": "自定义",
        "tags": ["custom", "ui"],
        "description": "我的自定义图标",
        "isPublic": false,
        "createdAt": 1697123456789,
        "updatedAt": 1697123456789
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 45,
      "totalPages": 3
    }
  }
}
```

---

### 2. 获取单个图标详情

获取指定图标的详细信息。

**请求**

```http
GET /api/icons/custom/:id
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "custom_1697123456789_abc123",
    "userId": "user_123",
    "name": "my-custom-icon",
    "svg": "<svg>...</svg>",
    "category": "自定义",
    "tags": ["custom", "ui"],
    "description": "我的自定义图标",
    "isPublic": false,
    "createdAt": 1697123456789,
    "updatedAt": 1697123456789
  }
}
```

---

### 3. 创建自定义图标

上传新的自定义图标。

**请求**

```http
POST /api/icons/custom
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**

```json
{
  "name": "my-custom-icon",
  "svg": "<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\"><path d=\"M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z\"/></svg>",
  "category": "自定义",
  "tags": ["custom", "ui", "shield"],
  "description": "盾牌图标",
  "isPublic": false
}
```

**字段验证**

| 字段        | 类型     | 必需 | 验证规则                 |
| ----------- | -------- | ---- | ------------------------ |
| name        | string   | 是   | 1-50字符，唯一           |
| svg         | string   | 是   | 有效的SVG格式，最大100KB |
| category    | string   | 否   | 默认"自定义"             |
| tags        | string[] | 否   | 最多10个标签             |
| description | string   | 否   | 最多200字符              |
| isPublic    | boolean  | 否   | 默认false                |

**响应**

```json
{
  "success": true,
  "data": {
    "id": "custom_1697123456789_abc123",
    "userId": "user_123",
    "name": "my-custom-icon",
    "svg": "<svg>...</svg>",
    "category": "自定义",
    "tags": ["custom", "ui", "shield"],
    "description": "盾牌图标",
    "isPublic": false,
    "createdAt": 1697123456789,
    "updatedAt": 1697123456789
  },
  "message": "图标创建成功"
}
```

---

### 4. 更新自定义图标

更新已存在的自定义图标。

**请求**

```http
PUT /api/icons/custom/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**

```json
{
  "name": "updated-icon-name",
  "svg": "<svg>...</svg>",
  "category": "UI组件",
  "tags": ["custom", "ui", "updated"],
  "description": "更新后的描述",
  "isPublic": true
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "custom_1697123456789_abc123",
    "userId": "user_123",
    "name": "updated-icon-name",
    "svg": "<svg>...</svg>",
    "category": "UI组件",
    "tags": ["custom", "ui", "updated"],
    "description": "更新后的描述",
    "isPublic": true,
    "createdAt": 1697123456789,
    "updatedAt": 1697123999999
  },
  "message": "图标更新成功"
}
```

---

### 5. 删除自定义图标

删除指定的自定义图标。

**请求**

```http
DELETE /api/icons/custom/:id
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "message": "图标删除成功"
}
```

---

### 6. 批量导入图标

批量上传多个图标。

**请求**

```http
POST /api/icons/custom/batch
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**

```json
{
  "icons": [
    {
      "name": "icon-1",
      "svg": "<svg>...</svg>",
      "category": "自定义",
      "tags": ["custom"]
    },
    {
      "name": "icon-2",
      "svg": "<svg>...</svg>",
      "category": "自定义",
      "tags": ["custom"]
    }
  ]
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "imported": [
      {
        "id": "custom_1697123456789_abc123",
        "name": "icon-1",
        "status": "success"
      },
      {
        "id": "custom_1697123456790_def456",
        "name": "icon-2",
        "status": "success"
      }
    ],
    "failed": [],
    "summary": {
      "total": 2,
      "success": 2,
      "failed": 0
    }
  },
  "message": "批量导入完成"
}
```

---

### 7. 导出所有图标

导出用户的所有自定义图标为JSON格式。

**请求**

```http
GET /api/icons/custom/export
Authorization: Bearer {token}
```

**查询参数**

| 参数     | 类型   | 必需 | 描述                       |
| -------- | ------ | ---- | -------------------------- |
| format   | string | 否   | 导出格式：json, svg-sprite |
| category | string | 否   | 只导出指定分类             |

**响应**

```json
{
  "success": true,
  "data": {
    "icons": [
      {
        "id": "custom_1697123456789_abc123",
        "name": "my-custom-icon",
        "svg": "<svg>...</svg>",
        "category": "自定义",
        "tags": ["custom", "ui"],
        "description": "我的自定义图标",
        "createdAt": 1697123456789,
        "updatedAt": 1697123456789
      }
    ],
    "exportedAt": 1697123999999,
    "version": "1.0.0"
  }
}
```

---

### 8. 分享图标

将图标分享给其他用户。

**请求**

```http
POST /api/icons/custom/:id/share
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体**

```json
{
  "sharedWithUserId": "user_456",
  "permission": "copy"
}
```

**响应**

```json
{
  "success": true,
  "data": {
    "shareId": "share_123",
    "iconId": "custom_1697123456789_abc123",
    "sharedWithUserId": "user_456",
    "permission": "copy",
    "createdAt": 1697123999999
  },
  "message": "图标分享成功"
}
```

---

### 9. 获取共享图标

获取其他用户分享给我的图标列表。

**请求**

```http
GET /api/icons/shared
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "icons": [
      {
        "id": "custom_1697123456789_abc123",
        "name": "shared-icon",
        "svg": "<svg>...</svg>",
        "category": "共享",
        "tags": ["shared"],
        "ownerId": "user_789",
        "ownerName": "张三",
        "permission": "copy",
        "sharedAt": 1697123999999
      }
    ]
  }
}
```

---

### 10. 复制共享图标

将共享的图标复制到自己的图标库。

**请求**

```http
POST /api/icons/custom/:id/copy
Authorization: Bearer {token}
```

**响应**

```json
{
  "success": true,
  "data": {
    "id": "custom_1697124000000_xyz789",
    "name": "shared-icon-copy",
    "svg": "<svg>...</svg>",
    "category": "自定义",
    "tags": ["copied", "shared"],
    "originalIconId": "custom_1697123456789_abc123",
    "createdAt": 1697124000000,
    "updatedAt": 1697124000000
  },
  "message": "图标复制成功"
}
```

---

## 错误处理

### 错误响应格式

所有错误响应遵循统一格式：

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述",
    "details": {}
  }
}
```

### 错误代码

| HTTP状态码 | 错误代码          | 描述           |
| ---------- | ----------------- | -------------- |
| 400        | INVALID_REQUEST   | 请求参数无效   |
| 400        | INVALID_SVG       | SVG格式无效    |
| 400        | ICON_NAME_EXISTS  | 图标名称已存在 |
| 400        | SVG_TOO_LARGE     | SVG文件过大    |
| 401        | UNAUTHORIZED      | 未授权访问     |
| 403        | FORBIDDEN         | 无权限操作     |
| 404        | ICON_NOT_FOUND    | 图标不存在     |
| 409        | CONFLICT          | 资源冲突       |
| 413        | PAYLOAD_TOO_LARGE | 请求体过大     |
| 429        | TOO_MANY_REQUESTS | 请求过于频繁   |
| 500        | INTERNAL_ERROR    | 服务器内部错误 |

### 错误示例

**图标名称已存在**

```json
{
  "success": false,
  "error": {
    "code": "ICON_NAME_EXISTS",
    "message": "图标名称 'my-icon' 已存在",
    "details": {
      "field": "name",
      "value": "my-icon",
      "existingIconId": "custom_1697123456789_abc123"
    }
  }
}
```

**SVG格式无效**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_SVG",
    "message": "SVG格式无效",
    "details": {
      "field": "svg",
      "reason": "Missing xmlns attribute"
    }
  }
}
```

---

## 数据库设计

### custom_icons 表

```sql
CREATE TABLE custom_icons (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  svg TEXT NOT NULL,
  category VARCHAR(50) DEFAULT '自定义',
  tags JSON,
  description VARCHAR(200),
  is_public BOOLEAN DEFAULT FALSE,
  created_at BIGINT NOT NULL,
  updated_at BIGINT NOT NULL,

  INDEX idx_user_id (user_id),
  INDEX idx_name (name),
  INDEX idx_category (category),
  INDEX idx_created_at (created_at),
  INDEX idx_is_public (is_public),
  UNIQUE KEY uk_user_name (user_id, name),

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### icon_shares 表

```sql
CREATE TABLE icon_shares (
  id VARCHAR(50) PRIMARY KEY,
  icon_id VARCHAR(50) NOT NULL,
  owner_id VARCHAR(50) NOT NULL,
  shared_with_user_id VARCHAR(50) NOT NULL,
  permission ENUM('view', 'copy') DEFAULT 'view',
  created_at BIGINT NOT NULL,

  INDEX idx_icon_id (icon_id),
  INDEX idx_shared_with (shared_with_user_id),
  INDEX idx_owner_id (owner_id),
  UNIQUE KEY uk_icon_user (icon_id, shared_with_user_id),

  FOREIGN KEY (icon_id) REFERENCES custom_icons(id) ON DELETE CASCADE,
  FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (shared_with_user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### icon_usage_stats 表（可选）

用于统计图标使用情况。

```sql
CREATE TABLE icon_usage_stats (
  id VARCHAR(50) PRIMARY KEY,
  icon_id VARCHAR(50) NOT NULL,
  user_id VARCHAR(50) NOT NULL,
  usage_count INT DEFAULT 0,
  last_used_at BIGINT,

  INDEX idx_icon_id (icon_id),
  INDEX idx_user_id (user_id),
  UNIQUE KEY uk_icon_user (icon_id, user_id),

  FOREIGN KEY (icon_id) REFERENCES custom_icons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 前端集成

### 更新 CustomIconManager

修改 `src/core/renderer/icons/CustomIconManager.ts` 以支持后端API：

```typescript
import { apiClient } from '@/core/api'

export class CustomIconManager {
  private static STORAGE_KEY = 'custom_icons'
  private customIcons: Map<string, CustomIcon> = new Map()
  private useBackend: boolean = true // 是否使用后端

  constructor(useBackend: boolean = true) {
    this.useBackend = useBackend
    this.loadIcons()
  }

  /**
   * 加载图标（从后端或本地存储）
   */
  private async loadIcons(): Promise<void> {
    if (this.useBackend) {
      await this.loadFromBackend()
    } else {
      this.loadFromStorage()
    }
  }

  /**
   * 从后端加载图标
   */
  private async loadFromBackend(): Promise<void> {
    try {
      const response = await apiClient.get('/api/icons/custom')
      if (response.success && response.data.icons) {
        response.data.icons.forEach((icon: CustomIcon) => {
          this.customIcons.set(icon.id, icon)
        })
      }
    } catch (error) {
      console.error('Failed to load icons from backend:', error)
      // 降级到本地存储
      this.loadFromStorage()
    }
  }

  /**
   * 添加自定义图标
   */
  async addIcon(icon: Omit<CustomIcon, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomIcon> {
    if (this.useBackend) {
      return await this.addIconToBackend(icon)
    } else {
      return this.addIconToStorage(icon)
    }
  }

  /**
   * 添加图标到后端
   */
  private async addIconToBackend(icon: Omit<CustomIcon, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomIcon> {
    try {
      const response = await apiClient.post('/api/icons/custom', icon)
      if (response.success && response.data) {
        const customIcon = response.data
        this.customIcons.set(customIcon.id, customIcon)
        return customIcon
      }
      throw new Error('Failed to add icon')
    } catch (error) {
      console.error('Failed to add icon to backend:', error)
      throw error
    }
  }

  /**
   * 更新自定义图标
   */
  async updateIcon(id: string, updates: Partial<Omit<CustomIcon, 'id' | 'createdAt'>>): Promise<CustomIcon | null> {
    if (this.useBackend) {
      return await this.updateIconOnBackend(id, updates)
    } else {
      return this.updateIconInStorage(id, updates)
    }
  }

  /**
   * 删除自定义图标
   */
  async deleteIcon(id: string): Promise<boolean> {
    if (this.useBackend) {
      return await this.deleteIconFromBackend(id)
    } else {
      return this.deleteIconFromStorage(id)
    }
  }

  /**
   * 批量导入图标
   */
  async importIcons(icons: Array<Omit<CustomIcon, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomIcon[]> {
    if (this.useBackend) {
      try {
        const response = await apiClient.post('/api/icons/custom/batch', { icons })
        if (response.success && response.data.imported) {
          // 重新加载图标列表
          await this.loadFromBackend()
          return response.data.imported
        }
      } catch (error) {
        console.error('Failed to import icons:', error)
      }
    }

    // 降级到本地导入
    const imported: CustomIcon[] = []
    for (const icon of icons) {
      try {
        const customIcon = await this.addIcon(icon)
        imported.push(customIcon)
      } catch (error) {
        console.error(`Failed to import icon ${icon.name}:`, error)
      }
    }
    return imported
  }

  /**
   * 导出所有图标
   */
  async exportIcons(): Promise<CustomIcon[]> {
    if (this.useBackend) {
      try {
        const response = await apiClient.get('/api/icons/custom/export')
        if (response.success && response.data.icons) {
          return response.data.icons
        }
      } catch (error) {
        console.error('Failed to export icons:', error)
      }
    }

    return this.getAllIcons()
  }

  // ... 其他方法保持不变
}
```

### API客户端配置

在 `src/core/api/icons.ts` 中创建图标API客户端：

```typescript
import { apiClient } from './ApiClient'
import type { CustomIcon } from '@/core/renderer/icons/CustomIconManager'

export interface IconListResponse {
  icons: CustomIcon[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export interface IconBatchImportResponse {
  imported: Array<{
    id: string
    name: string
    status: 'success' | 'failed'
  }>
  failed: Array<{
    name: string
    error: string
  }>
  summary: {
    total: number
    success: number
    failed: number
  }
}

/**
 * 图标API客户端
 */
export const iconApi = {
  /**
   * 获取自定义图标列表
   */
  async getCustomIcons(params?: {
    page?: number
    pageSize?: number
    category?: string
    search?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
  }): Promise<IconListResponse> {
    const response = await apiClient.get('/api/icons/custom', { params })
    return response.data
  },

  /**
   * 获取单个图标
   */
  async getIcon(id: string): Promise<CustomIcon> {
    const response = await apiClient.get(`/api/icons/custom/${id}`)
    return response.data
  },

  /**
   * 创建图标
   */
  async createIcon(icon: Omit<CustomIcon, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<CustomIcon> {
    const response = await apiClient.post('/api/icons/custom', icon)
    return response.data
  },

  /**
   * 更新图标
   */
  async updateIcon(id: string, updates: Partial<Omit<CustomIcon, 'id' | 'userId' | 'createdAt'>>): Promise<CustomIcon> {
    const response = await apiClient.put(`/api/icons/custom/${id}`, updates)
    return response.data
  },

  /**
   * 删除图标
   */
  async deleteIcon(id: string): Promise<void> {
    await apiClient.delete(`/api/icons/custom/${id}`)
  },

  /**
   * 批量导入图标
   */
  async batchImport(icons: Array<Omit<CustomIcon, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>): Promise<IconBatchImportResponse> {
    const response = await apiClient.post('/api/icons/custom/batch', { icons })
    return response.data
  },

  /**
   * 导出图标
   */
  async exportIcons(params?: {
    format?: 'json' | 'svg-sprite'
    category?: string
  }): Promise<{ icons: CustomIcon[]; exportedAt: number; version: string }> {
    const response = await apiClient.get('/api/icons/custom/export', { params })
    return response.data
  },

  /**
   * 分享图标
   */
  async shareIcon(id: string, sharedWithUserId: string, permission: 'view' | 'copy'): Promise<any> {
    const response = await apiClient.post(`/api/icons/custom/${id}/share`, {
      sharedWithUserId,
      permission,
    })
    return response.data
  },

  /**
   * 获取共享图标
   */
  async getSharedIcons(): Promise<CustomIcon[]> {
    const response = await apiClient.get('/api/icons/shared')
    return response.data.icons
  },

  /**
   * 复制共享图标
   */
  async copySharedIcon(id: string): Promise<CustomIcon> {
    const response = await apiClient.post(`/api/icons/custom/${id}/copy`)
    return response.data
  },
}
```

---

## 安全考虑

### 1. 认证与授权

- 所有API端点都需要JWT认证
- 用户只能访问和修改自己的图标
- 分享功能需要验证目标用户是否存在

### 2. 输入验证

**SVG验证**

```typescript
function validateSvg(svg: string): boolean {
  // 检查是否包含<svg>标签
  if (!svg.includes('<svg')) {
    return false
  }

  // 检查是否包含危险脚本
  const dangerousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // onclick, onload等
    /<iframe/i,
    /<object/i,
    /<embed/i,
  ]

  for (const pattern of dangerousPatterns) {
    if (pattern.test(svg)) {
      return false
    }
  }

  return true
}
```

**文件大小限制**

```typescript
const MAX_SVG_SIZE = 100 * 1024 // 100KB
const MAX_BATCH_SIZE = 50 // 批量导入最多50个

function validateIconSize(svg: string): boolean {
  const size = new Blob([svg]).size
  return size <= MAX_SVG_SIZE
}
```

### 3. 速率限制

使用Redis实现速率限制：

```typescript
// 每个用户每分钟最多创建10个图标
const RATE_LIMIT = {
  create: { max: 10, window: 60 },
  update: { max: 20, window: 60 },
  delete: { max: 10, window: 60 },
  batch: { max: 3, window: 60 },
}
```

### 4. XSS防护

- 对SVG内容进行严格过滤
- 移除所有脚本标签和事件处理器
- 使用DOMPurify库清理SVG内容

```typescript
import DOMPurify from 'dompurify'

function sanitizeSvg(svg: string): string {
  return DOMPurify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['use'],
    ADD_ATTR: ['xlink:href'],
  })
}
```

### 5. CORS配置

```typescript
// 后端CORS配置
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
```

---

## 性能优化

### 1. 缓存策略

**Redis缓存**

```typescript
// 缓存用户的图标列表
const CACHE_TTL = 300 // 5分钟

async function getCachedIcons(userId: string): Promise<CustomIcon[] | null> {
  const cacheKey = `icons:user:${userId}`
  const cached = await redis.get(cacheKey)
  return cached ? JSON.parse(cached) : null
}

async function setCachedIcons(userId: string, icons: CustomIcon[]): Promise<void> {
  const cacheKey = `icons:user:${userId}`
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(icons))
}
```

### 2. 分页优化

使用游标分页提高大数据集性能：

```sql
-- 使用created_at作为游标
SELECT * FROM custom_icons
WHERE user_id = ? AND created_at < ?
ORDER BY created_at DESC
LIMIT 20
```

### 3. CDN加速

将常用的公共图标缓存到CDN：

```typescript
// 生成CDN URL
function getIconCdnUrl(iconId: string): string {
  return `${process.env.CDN_BASE_URL}/icons/${iconId}.svg`
}
```

### 4. 批量操作优化

使用事务处理批量导入：

```typescript
async function batchImportIcons(userId: string, icons: any[]): Promise<void> {
  const connection = await db.getConnection()
  await connection.beginTransaction()

  try {
    for (const icon of icons) {
      await connection.query(
        'INSERT INTO custom_icons (id, user_id, name, svg, ...) VALUES (?, ?, ?, ?, ...)',
        [generateId(), userId, icon.name, icon.svg, ...]
      )
    }
    await connection.commit()
  } catch (error) {
    await connection.rollback()
    throw error
  } finally {
    connection.release()
  }
}
```

---

## 监控与日志

### 1. API监控

记录关键指标：

```typescript
// 记录API调用
logger.info('Icon API called', {
  endpoint: '/api/icons/custom',
  method: 'POST',
  userId: req.user.id,
  duration: Date.now() - startTime,
  status: 200,
})
```

### 2. 错误追踪

使用Sentry追踪错误：

```typescript
import * as Sentry from '@sentry/node'

app.use((err, req, res, next) => {
  Sentry.captureException(err, {
    user: { id: req.user?.id },
    tags: { endpoint: req.path },
  })

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: '服务器内部错误',
    },
  })
})
```

---

## 测试

### 单元测试示例

```typescript
describe('Icon API', () => {
  describe('POST /api/icons/custom', () => {
    it('should create a new icon', async () => {
      const response = await request(app)
        .post('/api/icons/custom')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'test-icon',
          svg: '<svg>...</svg>',
          category: '测试',
          tags: ['test'],
        })

      expect(response.status).toBe(200)
      expect(response.body.success).toBe(true)
      expect(response.body.data.name).toBe('test-icon')
    })

    it('should reject invalid SVG', async () => {
      const response = await request(app).post('/api/icons/custom').set('Authorization', `Bearer ${token}`).send({
        name: 'test-icon',
        svg: '<script>alert("xss")</script>',
        category: '测试',
      })

      expect(response.status).toBe(400)
      expect(response.body.error.code).toBe('INVALID_SVG')
    })
  })
})
```

---

## 部署建议

### 环境变量

```bash
# .env
DATABASE_URL=mysql://user:password@localhost:3306/icons_db
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
CDN_BASE_URL=https://cdn.example.com
MAX_ICONS_PER_USER=1000
ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com
```

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

---

## 总结

本文档提供了完整的自定义图标库后端API设计，包括：

✅ 10个核心API端点
✅ 完整的数据模型定义
✅ 数据库表结构设计
✅ 前端集成示例代码
✅ 安全防护措施
✅ 性能优化方案
✅ 监控和测试策略

现在你可以根据这个文档实现后端API，实现图标的云端存储和跨设备同步功能！
