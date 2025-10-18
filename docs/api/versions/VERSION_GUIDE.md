# API版本管理指南

## 版本策略

本项目采用语义化版本控制（Semantic Versioning）：

```
v{major}.{minor}.{patch}
```

- **major**: 主版本号，不兼容的API变更
- **minor**: 次版本号，向后兼容的功能新增
- **patch**: 修订号，向后兼容的问题修正

## 版本目录结构

```
docs/api/versions/
├── VERSION_GUIDE.md          # 版本管理指南（本文件）
├── v1.0/                     # v1.0版本
│   ├── CHANGELOG.md          # 变更日志
│   └── openapi.yaml          # 该版本的OpenAPI规范
├── v1.1/                     # v1.1版本
│   ├── CHANGELOG.md
│   └── openapi.yaml
└── v2.0/                     # v2.0版本
    ├── CHANGELOG.md
    └── openapi.yaml
```

## 版本切换

### 在Swagger UI中切换版本

修改 `swagger-ui.html` 中的URL参数：

```javascript
// 当前版本
url: './openapi.yaml'

// 历史版本
url: './versions/v1.0/openapi.yaml'
```

### 通过URL参数切换

```
http://localhost:8080/swagger-ui.html?url=./versions/v1.0/openapi.yaml
```

## 创建新版本

### 1. 创建版本目录

```bash
mkdir -p docs/api/versions/v1.1
```

### 2. 复制当前规范

```bash
cp docs/api/openapi.yaml docs/api/versions/v1.1/openapi.yaml
```

### 3. 创建变更日志

```bash
touch docs/api/versions/v1.1/CHANGELOG.md
```

### 4. 更新变更日志

在 `CHANGELOG.md` 中记录变更：

```markdown
# API 变更日志

## v1.1.0 (2024-02-01)

### 新增功能

- ✨ 添加数据源管理API
- ✨ 添加图标库API

### 改进

- 🔧 优化登录接口响应速度
- 📝 完善错误码说明

### 修复

- 🐛 修复菜单树查询bug
```

### 5. 更新主规范版本号

在 `docs/api/openapi.yaml` 中更新版本号：

```yaml
info:
  version: 1.1.0
```

## 废弃策略

### 标记废弃的API

在OpenAPI规范中使用 `deprecated: true`：

```yaml
paths:
  /api/old-endpoint:
    get:
      deprecated: true
      summary: 旧接口（已废弃）
      description: |
        ⚠️ 此接口已废弃，将在v2.0中移除。
        请使用 /api/new-endpoint 替代。
```

### 废弃通知时间线

1. **提前3个月通知**: 在文档中标记为废弃
2. **提前1个月警告**: 在响应头中添加警告
3. **版本移除**: 在下一个主版本中移除

### 响应头警告

在废弃的API响应中添加：

```
X-API-Deprecated: true
X-API-Deprecated-Version: v2.0
X-API-Deprecated-Date: 2024-05-01
X-API-Replacement: /api/new-endpoint
```

## 迁移指南

### 创建迁移文档

为每个主版本创建迁移指南：

```
docs/api/versions/v2.0/MIGRATION.md
```

### 迁移指南模板

````markdown
# 从 v1.x 迁移到 v2.0

## 破坏性变更

### 1. 认证方式变更

**v1.x:**

```json
{
  "token": "xxx"
}
```
````

**v2.0:**

```json
{
  "accessToken": "xxx",
  "tokenType": "Bearer"
}
```

**迁移步骤:**

1. 更新客户端代码，使用新的响应格式
2. 在请求头中使用 `Authorization: Bearer {token}`

### 2. 移除的端点

- `DELETE /api/old-endpoint` - 已移除，使用 `DELETE /api/new-endpoint`

## 新增功能

- 添加了数据源管理API
- 支持批量操作

## 兼容性

v2.0 不兼容 v1.x，需要完整迁移。

```

## 版本并存

### 支持多版本API

在服务器端支持多版本：

```

/api/v1/resources
/api/v2/resources

````

### URL版本控制

```yaml
servers:
  - url: https://api.example.com/v1
    description: v1.x API
  - url: https://api.example.com/v2
    description: v2.x API
````

## 变更日志格式

### 使用标准格式

遵循 [Keep a Changelog](https://keepachangelog.com/) 规范：

```markdown
# Changelog

## [Unreleased]

### Added

- 新功能

### Changed

- 变更内容

### Deprecated

- 废弃内容

### Removed

- 移除内容

### Fixed

- 修复内容

### Security

- 安全更新

## [1.1.0] - 2024-02-01

### Added

- 添加数据源API

## [1.0.0] - 2024-01-01

### Added

- 初始版本发布
```

## 版本发布流程

### 1. 准备发布

```bash
# 创建发布分支
git checkout -b release/v1.1.0

# 更新版本号
# 编辑 docs/api/openapi.yaml

# 更新变更日志
# 编辑 docs/api/versions/v1.1/CHANGELOG.md
```

### 2. 验证

```bash
# 验证OpenAPI规范
npm run docs:validate

# 生成文档
npm run docs:generate
```

### 3. 提交和标签

```bash
# 提交变更
git add .
git commit -m "chore: release v1.1.0"

# 创建标签
git tag -a v1.1.0 -m "Release v1.1.0"

# 推送
git push origin release/v1.1.0
git push origin v1.1.0
```

### 4. 合并到主分支

```bash
git checkout main
git merge release/v1.1.0
git push origin main
```

### 5. 发布文档

```bash
# 部署到文档服务器
npm run docs:deploy
```

## 版本查询

### 获取当前版本

```bash
GET /api/version
```

响应：

```json
{
  "version": "1.1.0",
  "releaseDate": "2024-02-01",
  "deprecated": false
}
```

### 获取所有版本

```bash
GET /api/versions
```

响应：

```json
{
  "versions": [
    {
      "version": "2.0.0",
      "status": "current",
      "releaseDate": "2024-03-01"
    },
    {
      "version": "1.1.0",
      "status": "supported",
      "releaseDate": "2024-02-01",
      "endOfLife": "2024-09-01"
    },
    {
      "version": "1.0.0",
      "status": "deprecated",
      "releaseDate": "2024-01-01",
      "endOfLife": "2024-06-01"
    }
  ]
}
```

## 最佳实践

1. **向后兼容**: 尽量保持向后兼容，避免频繁的主版本升级
2. **提前通知**: 废弃API时提前至少3个月通知
3. **详细文档**: 为每个版本提供详细的变更日志和迁移指南
4. **版本并存**: 在过渡期支持多个版本并存
5. **自动化**: 使用CI/CD自动化版本发布流程
6. **监控使用**: 监控各版本的使用情况，及时下线无人使用的版本

## 相关资源

- [语义化版本](https://semver.org/lang/zh-CN/)
- [Keep a Changelog](https://keepachangelog.com/)
- [API版本控制最佳实践](https://www.troyhunt.com/your-api-versioning-is-wrong-which-is/)
