# 网络错误修复指南

## 问题描述

登录时出现 `500 Internal Server Error` 错误,请求地址为 `http://localhost:5174/api/auth/login`

## 问题分析

从截图和代码分析,问题可能有以下几个原因:

### 1. 后端服务未启动

- 前端配置的后端地址是 `http://localhost:8080`
- 但实际请求被 Vite 代理到了 `http://localhost:5174/api`
- 后端服务可能没有运行

### 2. Vite 代理配置问题

- 需要检查 `vite.config.ts` 中的代理配置
- 确保代理正确转发到后端服务

### 3. 后端 API 路径不匹配

- 前端请求: `/api/auth/login`
- 需要确认后端实际的 API 路径

## 解决方案

### 方案 1: 检查并启动后端服务

1. 确认后端服务是否运行在 `http://localhost:8080`
2. 检查后端日志,查看是否有错误信息
3. 确认后端 API 路径是否为 `/api/auth/login`

### 方案 2: 配置 Vite 代理

检查 `vite.config.ts` 文件,确保代理配置正确:

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '/api'),
      },
    },
  },
})
```

### 方案 3: 使用 Mock 数据进行开发

如果后端服务暂时不可用,可以使用 Mock 数据:

1. 修改 `src/core/api/auth.ts`,添加 Mock 模式
2. 在开发环境返回模拟的登录数据

## 临时解决方案 - 添加 Mock 登录

为了让你能继续开发,我将添加一个 Mock 登录功能:

### 修改登录页面,添加 Mock 模式

在登录组件中添加一个开发模式的快速登录:

```typescript
// 开发环境下的 Mock 登录
const handleMockLogin = () => {
  const mockResponse = {
    success: true,
    code: 200,
    message: '登录成功',
    data: {
      accessToken: 'mock-token-' + Date.now(),
      tokenType: 'Bearer',
      expiresIn: 7200,
      userInfo: {
        userId: 1,
        username: loginForm.username,
        enabled: true,
        createdAt: new Date().toISOString(),
        displayName: '管理员',
        avatar: '',
        email: 'admin@example.com',
      },
      permissionInfo: {
        roleIds: [1],
        roleNames: ['管理员'],
        permissions: ['*'],
        menus: [],
      },
      loginStatusInfo: {
        loginTime: new Date().toISOString(),
        loginIp: '127.0.0.1',
        clientInfo: 'Mock Client',
        sessionId: 'mock-session-' + Date.now(),
      },
    },
  }

  // 保存到 localStorage
  localStorage.setItem('accessToken', mockResponse.data.accessToken)
  localStorage.setItem('tokenType', mockResponse.data.tokenType)
  localStorage.setItem('userInfo', JSON.stringify(mockResponse.data.userInfo))

  notify.success('登录成功', '使用 Mock 数据登录')
  router.push('/admin/dashboard')
}
```

## 检查清单

- [ ] 后端服务是否运行在 `http://localhost:8080`
- [ ] 后端 API 路径是否为 `/api/auth/login`
- [ ] Vite 代理配置是否正确
- [ ] 后端是否支持 CORS
- [ ] 后端日志中是否有错误信息
- [ ] 网络请求的 Headers 是否正确

## 调试步骤

### 1. 检查 Vite 代理配置

```bash
# 查看 vite.config.ts
cat vite.config.ts
```

### 2. 测试后端服务

```bash
# 使用 curl 测试后端 API
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}'
```

### 3. 查看浏览器控制台

- 打开浏览器开发者工具 (F12)
- 查看 Network 标签
- 检查请求的详细信息
- 查看响应的错误信息

### 4. 检查后端日志

查看后端服务的日志输出,找到具体的错误原因

## 常见错误及解决方法

### 错误 1: CORS 跨域问题

**症状**: 浏览器控制台显示 CORS 错误

**解决**: 后端需要配置 CORS 允许前端域名

```java
// Spring Boot 示例
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:5174");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
```

### 错误 2: 后端 API 路径不匹配

**症状**: 404 Not Found

**解决**: 确认后端 Controller 的路径映射

```java
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        // 登录逻辑
    }
}
```

### 错误 3: 请求参数格式错误

**症状**: 400 Bad Request

**解决**: 检查请求体格式是否与后端期望一致

## 下一步

1. 我将为你添加一个 Mock 登录功能,让你可以先测试前端功能
2. 同时需要检查后端服务的状态
3. 配置正确的 Vite 代理

你想让我先添加 Mock 登录功能吗?这样你就可以先测试前端的其他功能了。
