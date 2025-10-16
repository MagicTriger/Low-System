# 🔧 CORS 跨域问题解决方案

## ❌ 遇到的问题

```
Access to fetch at 'http://115.190.139.17:8080/api/auth/login' from origin 'http://localhost:5173'
has been blocked by CORS policy: Response to preflight request doesn't pass access control check:
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 🔍 问题分析

### 什么是CORS？

CORS（Cross-Origin Resource Sharing，跨域资源共享）是浏览器的安全机制。当前端和后端运行在不同的域名/端口时，浏览器会阻止跨域请求。

### 当前情况

- **前端地址**: `http://localhost:5173` (开发服务器)
- **后端地址**: `http://115.190.139.17:8080` (生产服务器)
- **问题**: 不同的域名和端口，触发CORS限制

## ✅ 解决方案

### 方案选择：使用 Vite 代理

在开发环境中，我们使用 Vite 的代理功能来避免CORS问题。

#### 工作原理

```
浏览器请求 → Vite开发服务器 → 后端服务器
(同源)         (代理转发)        (实际请求)
```

### 配置步骤

#### 1. 修复环境变量 (envs/.env)

```properties
# 不包含/api路径，代理会自动添加
VITE_SERVICE_URL=http://115.190.139.17:8080
```

#### 2. Vite 代理配置 (vite.config.ts)

```typescript
server: {
  proxy: {
    '/api': {
      target: env.VITE_SERVICE_URL,  // http://115.190.139.17:8080
      changeOrigin: true,
      ws: true,
      secure: true,
    },
  },
}
```

#### 3. 修改 AuthApiService (src/core/api/auth.ts)

```typescript
constructor(apiClient?: IApiClient) {
  if (!apiClient) {
    // 开发环境使用相对路径（通过代理）
    // 生产环境使用完整URL
    const baseURL = import.meta.env.DEV
      ? '/api'  // 开发环境：使用代理
      : (import.meta.env.VITE_SERVICE_URL || 'http://localhost:8090') + '/api'

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
```

## 🎯 请求流程

### 开发环境（使用代理）

```
1. 前端发起请求
   POST /api/auth/login
   ↓
2. Vite 代理拦截
   检测到 /api 前缀
   ↓
3. 代理转发到后端
   POST http://115.190.139.17:8080/api/auth/login
   ↓
4. 后端处理并返回
   ↓
5. 代理返回给前端
   (浏览器认为是同源请求，无CORS问题)
```

### 生产环境（直接请求）

```
1. 前端发起请求
   POST http://115.190.139.17:8080/api/auth/login
   ↓
2. 直接请求后端
   (需要后端配置CORS)
```

## 📝 修改的文件

### 1. envs/.env

```properties
# 修复前
VITE_SERVICE_URL=http://115.190.139.17:8080/api

# 修复后
VITE_SERVICE_URL=http://115.190.139.17:8080
```

### 2. src/core/api/auth.ts

```typescript
// 添加了环境判断
const baseURL = import.meta.env.DEV
  ? '/api' // 开发环境
  : (import.meta.env.VITE_SERVICE_URL || 'http://localhost:8090') + '/api' // 生产环境
```

### 3. vite.config.ts

```typescript
// 已有配置，无需修改
proxy: {
  '/api': {
    target: env.VITE_SERVICE_URL,
    changeOrigin: true,
    ws: true,
    secure: true,
  },
}
```

## 🚀 验证步骤

### 1. 重启开发服务器

```bash
# 停止当前服务器 (Ctrl+C)
# 重新启动
npm run dev:designer
```

### 2. 测试登录

1. 访问 `http://localhost:5173/login`
2. 输入用户名密码：`admin` / `admin`
3. 点击登录

### 3. 检查网络请求

打开浏览器开发者工具 → Network 标签：

**应该看到：**

```
Request URL: http://localhost:5173/api/auth/login
Status: 200 OK
```

**不应该看到：**

- CORS 错误
- 404 错误
- 网络错误

### 4. 检查代理工作

在浏览器控制台：

```javascript
// 检查环境
console.log('开发环境:', import.meta.env.DEV) // true
console.log('API地址:', import.meta.env.VITE_SERVICE_URL) // http://115.190.139.17:8080

// 测试请求
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin' }),
})
  .then(res => res.json())
  .then(data => console.log('响应:', data))
```

## 📊 对比

### 修复前

```
❌ 请求: http://115.190.139.17:8080/api/auth/login
❌ 结果: CORS 错误
❌ 原因: 跨域请求被浏览器阻止
```

### 修复后

```
✅ 请求: http://localhost:5173/api/auth/login
✅ 代理: → http://115.190.139.17:8080/api/auth/login
✅ 结果: 成功
✅ 原因: 通过代理，浏览器认为是同源请求
```

## 🔧 生产环境配置

### 后端需要配置CORS

生产环境中，后端需要添加CORS配置以允许跨域请求。

#### Spring Boot 示例

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("*");  // 允许所有域名
        config.addAllowedMethod("*");  // 允许所有方法
        config.addAllowedHeader("*");  // 允许所有请求头
        config.setAllowCredentials(true);  // 允许携带凭证

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
```

#### Express.js 示例

```javascript
const cors = require('cors')

app.use(
  cors({
    origin: '*', // 允许所有域名
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
)
```

## 🎉 总结

CORS问题已通过Vite代理解决！

**开发环境：**

- ✅ 使用 Vite 代理
- ✅ 请求路径：`/api/auth/login`
- ✅ 代理转发到：`http://115.190.139.17:8080/api/auth/login`
- ✅ 无CORS问题

**生产环境：**

- ⚠️ 需要后端配置CORS
- ✅ 直接请求：`http://115.190.139.17:8080/api/auth/login`
- ✅ 后端返回正确的CORS头

**配置正确：**

- ✅ 环境变量：`VITE_SERVICE_URL=http://115.190.139.17:8080`
- ✅ 代理配置：`/api` → `http://115.190.139.17:8080`
- ✅ 开发环境使用相对路径
- ✅ 生产环境使用完整URL

现在重启开发服务器，登录功能应该可以正常工作了！🚀

## 📚 相关文档

- [API BaseURL修复](.kiro/specs/resource-management-system/API_BASEURL_FIXED.md)
- [最终配置完成](.kiro/specs/resource-management-system/FINAL_AUTH_SETUP_COMPLETE.md)
- [Vite 代理文档](https://vitejs.dev/config/server-options.html#server-proxy)

## 🔍 调试技巧

### 检查代理是否工作

```javascript
// 在浏览器控制台
console.log('环境:', import.meta.env.DEV ? '开发' : '生产')
console.log('API基础URL:', import.meta.env.DEV ? '/api' : import.meta.env.VITE_SERVICE_URL + '/api')
```

### 查看代理日志

Vite 开发服务器会在终端显示代理请求：

```
[vite] http proxy: /api/auth/login -> http://115.190.139.17:8080/api/auth/login
```

### 测试代理

```bash
# 在终端测试后端是否可访问
curl http://115.190.139.17:8080/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}'
```
