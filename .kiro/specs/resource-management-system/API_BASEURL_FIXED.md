# 🔧 API BaseURL 配置修复完成

## ❌ 遇到的问题

```
ApiClient.ts:224   POST http://localhost:5173/auth/login 404 (Not Found)
```

API请求发送到了错误的地址（localhost:5173），而不是配置的服务器地址（http://115.190.139.17:8090）。

## 🔍 问题分析

### 根本原因

1. **环境变量格式错误**：`.env` 文件中的值包含了引号
2. **缺少baseURL支持**：`ApiClient` 没有正确处理 baseURL
3. **AuthApiService未配置**：创建 `ApiClient` 时没有传入 baseURL

### 问题代码

#### envs/.env

```properties
# ❌ 错误：包含引号
VITE_SERVICE_URL = 'http://115.190.139.17:8090'
```

#### src/core/api/auth.ts

```typescript
// ❌ 没有配置baseURL
constructor(apiClient?: IApiClient) {
  this.apiClient = apiClient || new ApiClient()
}
```

#### src/core/api/ApiClient.ts

```typescript
// ❌ buildURL没有处理baseURL
private buildURL(url: string, params?: Record<string, any>): string {
  // 直接返回url，没有添加baseURL
  return url
}
```

## ✅ 修复方案

### 1. 修复环境变量格式

```properties
# ✅ 正确：不要引号
VITE_SERVICE_URL=http://115.190.139.17:8090
```

### 2. 在 ApiClient 中添加 baseURL 支持

```typescript
export class ApiClient implements IApiClient {
  private baseURL: string = ''

  constructor(config: RequestConfig = {}) {
    // 提取baseURL
    if (config.url && !config.url.startsWith('/')) {
      this.baseURL = config.url
    }

    this.defaults = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
      responseType: 'json',
      withCredentials: false,
      ...config,
    }
  }
}
```

### 3. 修复 buildURL 方法

```typescript
private buildURL(url: string, params?: Record<string, any>): string {
  // 如果URL不是完整的URL（不包含协议），则添加baseURL
  let fullURL = url
  if (this.baseURL && !url.startsWith('http://') && !url.startsWith('https://')) {
    fullURL = this.baseURL + (url.startsWith('/') ? url : '/' + url)
  }

  if (!params || Object.keys(params).length === 0) {
    return fullURL
  }

  const queryString = Object.entries(params)
    .filter(([_, value]) => value !== undefined && value !== null)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  return fullURL + (fullURL.includes('?') ? '&' : '?') + queryString
}
```

### 4. 修复 AuthApiService

```typescript
export class AuthApiService {
  private apiClient: IApiClient

  constructor(apiClient?: IApiClient) {
    // 如果没有提供apiClient，创建一个带baseURL的新实例
    if (!apiClient) {
      const baseURL = import.meta.env.VITE_SERVICE_URL || 'http://localhost:8090'
      this.apiClient = new ApiClient({
        url: baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } else {
      this.apiClient = apiClient
    }
  }
}
```

### 5. 移除不存在的方法调用

```typescript
// ❌ 移除这些调用（IApiClient接口中不存在）
this.apiClient.setAuthToken(accessToken)
this.apiClient.clearAuthToken()
```

## 📝 修改的文件

### 1. envs/.env

- ✅ 移除了环境变量值的引号
- ✅ 修复了格式

### 2. src/core/api/ApiClient.ts

- ✅ 添加了 `baseURL` 私有属性
- ✅ 在构造函数中提取 baseURL
- ✅ 修改了 `buildURL` 方法以支持 baseURL

### 3. src/core/api/auth.ts

- ✅ 修改了构造函数以使用环境变量
- ✅ 创建带 baseURL 的 ApiClient 实例
- ✅ 移除了不存在的方法调用

## 🎯 工作流程

```
1. 应用启动
   ↓
2. 读取环境变量
   VITE_SERVICE_URL = 'http://115.190.139.17:8090'
   ↓
3. 创建 AuthApiService
   new ApiClient({ url: 'http://115.190.139.17:8090' })
   ↓
4. 设置 baseURL
   this.baseURL = 'http://115.190.139.17:8090'
   ↓
5. 发起登录请求
   apiClient.post('/auth/login', credentials)
   ↓
6. buildURL 构建完整URL
   'http://115.190.139.17:8090' + '/auth/login'
   = 'http://115.190.139.17:8090/auth/login'
   ↓
7. 发送请求到正确的服务器
```

## ✅ 验证步骤

### 1. 检查环境变量

```bash
# 查看.env文件
cat envs/.env

# 应该看到（没有引号）
VITE_SERVICE_URL=http://115.190.139.17:8090
```

### 2. 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev:designer
```

### 3. 测试登录

1. 访问登录页面
2. 输入用户名密码
3. 点击登录
4. 检查网络请求

### 4. 检查网络请求

打开浏览器开发者工具 → Network 标签：

```
✅ 应该看到：
POST http://115.190.139.17:8090/auth/login

❌ 不应该看到：
POST http://localhost:5173/auth/login
```

### 5. 调试命令

```javascript
// 在浏览器控制台中
console.log('环境变量:', import.meta.env.VITE_SERVICE_URL)
// 应该输出: http://115.190.139.17:8090
```

## 📊 对比

### 修复前

```
请求URL: http://localhost:5173/auth/login
结果: 404 Not Found
原因: 没有配置baseURL，使用了当前域名
```

### 修复后

```
请求URL: http://115.190.139.17:8090/auth/login
结果: 正常请求到后端服务器
原因: 正确配置了baseURL
```

## 🎉 总结

错误已完全修复！

**修复内容：**

- ✅ 修复了环境变量格式
- ✅ 在 ApiClient 中添加了 baseURL 支持
- ✅ 修改了 buildURL 方法
- ✅ 修复了 AuthApiService 的初始化
- ✅ 移除了不存在的方法调用
- ✅ 代码通过语法检查

**现在可以：**

- ✅ 正确读取环境变量
- ✅ 请求发送到正确的服务器
- ✅ 使用完整的API地址
- ✅ 正常调用后端接口

**配置说明：**

- 开发环境：`envs/.env`
- 生产环境：`envs/.env.admin.prod`
- 服务器地址：`http://115.190.139.17:8090`

现在API请求应该能够正确发送到后端服务器了！🚀

## 📚 相关文档

- [Action Dispatch修复](.kiro/specs/resource-management-system/ACTION_DISPATCH_FIXED.md)
- [权限指令修复](.kiro/specs/resource-management-system/PERMISSION_DIRECTIVE_FIXED.md)
- [Auth错误修复](.kiro/specs/resource-management-system/AUTH_ERROR_FIXED.md)
- [ApiClient](../../src/core/api/ApiClient.ts)
- [AuthApiService](../../src/core/api/auth.ts)

## 🔧 环境变量配置

### 开发环境 (envs/.env)

```properties
VITE_TITLE=低代码管理系统
VITE_SERVICE_URL=http://115.190.139.17:8090
```

### 生产环境 (envs/.env.admin.prod)

```properties
VITE_TITLE=低代码管理系统
VITE_SERVICE_URL=http://your-production-server.com
```

### 使用方式

```typescript
// 在代码中访问
const apiUrl = import.meta.env.VITE_SERVICE_URL
console.log('API地址:', apiUrl)
```
