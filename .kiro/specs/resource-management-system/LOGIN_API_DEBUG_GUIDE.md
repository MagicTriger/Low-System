# 登录API 500错误调试指南

## 当前状态

- Mock登录已移除 ✅
- 前端配置正常 ✅
- 后端返回500错误 ❌

## 前端配置检查

### 1. API地址配置

当前配置 (envs/.env):

```
VITE_SERVICE_URL=http://115.190.139.17:8080
```

前端实际请求地址:

- 开发环境: `/api/auth/login` (通过Vite代理转发到后端)
- 生产环境: `http://115.190.139.17:8080/api/auth/login`

### 2. 请求格式

前端发送的请求:

```json
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "123456"
}
```

### 3. 期望的响应格式

后端应该返回:

```json
{
  "success": true,
  "code": 200,
  "message": "登录成功",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenType": "Bearer",
    "expiresIn": 7200,
    "userInfo": {
      "userId": 1,
      "username": "admin",
      "enabled": true,
      "createdAt": "2025-01-01T00:00:00Z",
      "displayName": "管理员",
      "avatar": "",
      "email": "admin@example.com"
    },
    "permissionInfo": {
      "roleIds": [1],
      "roleNames": ["ADMIN"],
      "permissions": ["*"],
      "menus": []
    },
    "loginStatusInfo": {
      "loginTime": "2025-01-01T00:00:00Z",
      "loginIp": "127.0.0.1",
      "clientInfo": "Chrome",
      "sessionId": "xxx"
    }
  }
}
```

## 后端排查步骤

### 步骤1: 检查后端服务状态

```bash
# 检查服务是否运行
curl http://115.190.139.17:8080/api/health

# 或者检查根路径
curl http://115.190.139.17:8080
```

### 步骤2: 直接测试登录接口

```bash
# 使用curl测试登录
curl -X POST http://115.190.139.17:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"123456"}' \
  -v
```

参数说明:

- `-X POST`: 使用POST方法
- `-H`: 设置请求头
- `-d`: 发送JSON数据
- `-v`: 显示详细信息(包括响应头)

### 步骤3: 查看后端日志

500错误通常是后端代码异常,需要查看后端日志:

1. 找到后端日志文件位置
2. 查看最新的错误日志
3. 关注以下关键信息:
   - 异常堆栈信息
   - 数据库连接错误
   - 空指针异常
   - 配置错误

常见日志位置:

- Spring Boot: `logs/application.log`
- 控制台输出
- Docker容器日志: `docker logs <container_id>`

## 常见500错误原因

### 1. 数据库连接问题

症状:

```
java.sql.SQLException: Unable to connect to database
```

解决方案:

- 检查数据库是否启动
- 验证数据库连接配置(host, port, username, password)
- 检查数据库用户权限

### 2. 空指针异常

症状:

```
java.lang.NullPointerException
```

解决方案:

- 检查用户表是否存在数据
- 验证必填字段是否有默认值
- 检查关联查询是否正确

### 3. 密码加密问题

症状:

```
BCryptPasswordEncoder error
```

解决方案:

- 确认数据库中的密码是否已加密
- 检查密码加密算法配置
- 验证密码字段长度是否足够

### 4. 权限查询失败

症状:

```
Error querying permissions
```

解决方案:

- 检查权限表是否存在
- 验证用户-角色-权限关联表
- 确认SQL查询语句正确

### 5. 菜单树构建失败

症状:

```
Error building menu tree
```

解决方案:

- 检查菜单表数据完整性
- 验证父子关系是否正确
- 确认递归查询逻辑

## 调试建议

### 1. 简化登录逻辑

临时修改后端代码,简化登录流程:

```java
@PostMapping("/login")
public ResponseEntity<?> login(@RequestBody LoginRequest request) {
    try {
        // 第一步: 只验证用户存在
        User user = userService.findByUsername(request.getUsername());
        if (user == null) {
            return ResponseEntity.ok(ApiResponse.error("用户不存在"));
        }

        // 第二步: 验证密码
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.ok(ApiResponse.error("密码错误"));
        }

        // 第三步: 生成token
        String token = jwtService.generateToken(user);

        // 第四步: 查询权限(可能出错的地方)
        PermissionInfo permissions = permissionService.getUserPermissions(user.getId());

        // 第五步: 构建响应
        LoginResponseData data = new LoginResponseData();
        data.setAccessToken(token);
        data.setTokenType("Bearer");
        data.setUserInfo(user);
        data.setPermissionInfo(permissions);

        return ResponseEntity.ok(ApiResponse.success(data));

    } catch (Exception e) {
        // 打印详细错误信息
        e.printStackTrace();
        return ResponseEntity.status(500).body(ApiResponse.error("登录失败: " + e.getMessage()));
    }
}
```

### 2. 添加详细日志

在关键位置添加日志:

```java
log.info("开始登录: username={}", request.getUsername());
log.info("查询用户完成: user={}", user);
log.info("密码验证完成");
log.info("生成token完成: token={}", token);
log.info("查询权限完成: permissions={}", permissions);
log.info("登录成功");
```

### 3. 使用Postman测试

1. 创建新请求
2. 设置URL: `http://115.190.139.17:8080/api/auth/login`
3. 设置Method: POST
4. 设置Headers: `Content-Type: application/json`
5. 设置Body (raw JSON):

```json
{
  "username": "admin",
  "password": "123456"
}
```

6. 点击Send
7. 查看响应状态码和响应体

## 快速验证清单

- [ ] 后端服务正常运行
- [ ] 数据库连接正常
- [ ] 用户表有测试数据
- [ ] 密码已正确加密
- [ ] 权限表数据完整
- [ ] 菜单表数据完整
- [ ] JWT配置正确
- [ ] 跨域配置正确

## 临时解决方案

如果需要快速验证前端功能,可以:

1. 使用Postman等工具模拟成功响应
2. 使用Mock Server (json-server)
3. 修改后端返回固定的测试数据

## 下一步

1. 查看后端日志,找到具体错误信息
2. 根据错误信息定位问题
3. 修复后端代码
4. 重新测试登录功能

## 联系后端开发

如果无法解决,请提供以下信息给后端开发:

1. 完整的错误日志
2. 请求的详细信息(URL, Headers, Body)
3. 数据库表结构和数据
4. 后端配置文件
5. 使用的框架和版本

---

更新时间: 2025-10-17
