# API 文档

## 概述

本目录包含低代码平台的完整API文档，使用OpenAPI 3.0.3规范编写。

## 目录结构

```
docs/api/
├── openapi.yaml              # OpenAPI主文件
├── schemas/                  # 数据模型定义
│   ├── auth.yaml            # 认证模型
│   ├── menu.yaml            # 菜单模型
│   ├── resource.yaml        # 资源模型
│   ├── designer.yaml        # 设计器模型
│   └── common.yaml          # 通用模型
├── paths/                    # API路径定义
│   ├── auth/                # 认证接口
│   ├── menu/                # 菜单接口
│   └── resource/            # 资源接口
├── components/               # 可复用组件
│   ├── parameters.yaml      # 通用参数
│   ├── responses.yaml       # 通用响应
│   ├── examples.yaml        # 示例数据
│   └── schemas.yaml         # Schema引用
└── versions/                 # 历史版本
    └── v1.0/                # v1.0版本
        └── CHANGELOG.md     # 变更日志
```

## 快速开始

### 1. 查看文档

使用Swagger UI查看交互式文档：

```bash
npm run docs:serve
```

然后访问 http://localhost:8080

### 2. 验证规范

验证OpenAPI规范文件：

```bash
npm run docs:validate
```

### 3. 生成文档

生成静态HTML文档：

```bash
npm run docs:generate
```

## API概览

### 认证与授权

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新Token

### 菜单管理

- `GET /api/permissions/menus/tree` - 获取菜单树
- `POST /api/permissions/menus/create` - 创建菜单
- `PUT /api/permissions/menus/update` - 更新菜单
- `DELETE /api/permissions/menus/delete/{id}` - 删除菜单

### 资源管理

- `GET /api/resources` - 获取资源列表
- `POST /api/resources` - 创建资源
- `GET /api/resources/{id}` - 获取资源详情
- `PUT /api/resources/{id}` - 更新资源
- `DELETE /api/resources/{id}` - 删除资源

## 认证方式

大部分API需要使用Bearer Token认证：

```
Authorization: Bearer {accessToken}
```

## 响应格式

### 成功响应

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": {}
}
```

### 错误响应

```json
{
  "success": false,
  "code": 400,
  "message": "请求参数错误",
  "errors": [
    {
      "field": "username",
      "message": "用户名不能为空"
    }
  ]
}
```

## 错误码

| 错误码 | 说明           |
| ------ | -------------- |
| 200    | 成功           |
| 400    | 请求参数错误   |
| 401    | 未授权         |
| 403    | 权限不足       |
| 404    | 资源不存在     |
| 409    | 资源冲突       |
| 422    | 验证失败       |
| 429    | 请求过于频繁   |
| 500    | 服务器内部错误 |

## 限流策略

- 登录接口: 5次/分钟
- 文件上传: 10次/分钟
- 其他接口: 100次/分钟

## 版本管理

当前版本: v1.0.0

查看[变更日志](./versions/v1.0/CHANGELOG.md)了解版本历史。

## 贡献指南

### 添加新的API

1. 在 `schemas/` 目录下定义数据模型
2. 在 `paths/` 目录下定义API路径
3. 在 `openapi.yaml` 中引用新的路径
4. 更新 `CHANGELOG.md`

### 修改现有API

1. 更新对应的YAML文件
2. 运行验证: `npm run docs:validate`
3. 更新 `CHANGELOG.md`
4. 如果是破坏性变更，需要升级版本号

## 相关链接

- [OpenAPI规范](https://swagger.io/specification/)
- [Swagger UI](https://swagger.io/tools/swagger-ui/)
- [Redoc](https://redocly.com/)
