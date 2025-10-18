# API文档生成脚本

本目录包含用于生成和管理API文档的脚本工具。

## 脚本说明

### generate-docs.js

生成完整的API文档，包括验证、打包等步骤。

**使用方法:**

```bash
npm run docs:generate
```

**功能:**

1. 验证OpenAPI规范文件
2. 生成打包后的YAML和JSON文件
3. 准备输出目录

### extract-comments.js

从源代码中提取JSDoc/TSDoc注释，自动生成API文档。

**使用方法:**

```bash
npm run docs:extract
# 或
node docs/api/scripts/extract-comments.js <source-dir> <output-file>
```

**示例:**

```bash
# 从src目录提取注释
node docs/api/scripts/extract-comments.js src docs/api/generated-api.json
```

**支持的注释格式:**

```typescript
/**
 * 用户登录
 * @route POST /api/auth/login
 * @param {LoginRequest} credentials - 登录凭证
 * @returns {Promise<LoginResponse>} 登录响应
 * @throws {UnauthorizedError} 用户名或密码错误
 */
async login(credentials: LoginRequest): Promise<LoginResponse>
```

## 工作流程

### 1. 开发阶段

在代码中添加JSDoc注释：

```typescript
/**
 * @route POST /api/resources
 * @summary 创建资源
 * @param {ResourceCreateRequest} data - 资源数据
 * @returns {Resource} 创建的资源
 */
```

### 2. 提取注释

运行提取脚本：

```bash
npm run docs:extract
```

### 3. 合并到OpenAPI规范

将生成的JSON合并到主OpenAPI文件中。

### 4. 验证和生成

```bash
npm run docs:validate  # 验证规范
npm run docs:generate  # 生成文档
```

### 5. 查看文档

```bash
npm run docs:serve     # 启动文档服务器
```

## 自动化

可以将这些脚本集成到CI/CD流程中：

```yaml
# .github/workflows/docs.yml
name: Generate API Docs
on:
  push:
    branches: [main]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
      - name: Install dependencies
        run: npm install
      - name: Extract comments
        run: npm run docs:extract
      - name: Generate docs
        run: npm run docs:generate
      - name: Deploy
        # 部署到GitHub Pages或其他平台
```

## 配置

### 支持的文件类型

默认扫描以下文件类型：

- `.ts` - TypeScript
- `.js` - JavaScript
- `.vue` - Vue组件

可以在脚本中修改 `extensions` 参数来支持更多类型。

### 忽略目录

默认忽略以下目录：

- `node_modules`
- `dist`

可以在脚本中修改忽略规则。

## 最佳实践

1. **保持注释更新**: 代码变更时同步更新注释
2. **使用标准标签**: 使用标准的JSDoc标签
3. **提供示例**: 在注释中包含使用示例
4. **定期验证**: 定期运行验证脚本确保规范正确
5. **版本管理**: 为重大变更创建新版本

## 故障排除

### 验证失败

如果OpenAPI验证失败：

1. 检查YAML语法
2. 确保所有引用都存在
3. 验证数据类型定义

### 提取失败

如果注释提取失败：

1. 检查注释格式是否正确
2. 确保使用了正确的标签
3. 查看控制台错误信息

## 相关资源

- [OpenAPI规范](https://swagger.io/specification/)
- [JSDoc文档](https://jsdoc.app/)
- [TSDoc文档](https://tsdoc.org/)
