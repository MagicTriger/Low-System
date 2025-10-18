# 头像上传后端服务

## 功能特性

- ✅ 文件上传和验证
- ✅ 图片处理(压缩、裁剪、缩略图)
- ✅ 多种存储方式(本地、OSS、S3)
- ✅ EXIF信息清除
- ✅ 文件类型和大小验证
- ✅ JWT认证
- ✅ 错误处理和日志

## 安装依赖

```bash
npm install express multer sharp cors dotenv uuid
npm install @types/express @types/multer @types/cors @types/uuid --save-dev

# 可选依赖(根据存储类型)
npm install ali-oss  # 阿里云OSS
npm install aws-sdk  # AWS S3
```

## 环境配置

复制 `.env.example` 到 `.env` 并配置:

```bash
cp .env.example .env
```

### 本地存储配置

```env
STORAGE_TYPE=local
UPLOAD_PATH=./uploads/avatars
```

### 阿里云OSS配置

```env
STORAGE_TYPE=oss
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
CDN_DOMAIN=https://cdn.example.com
```

### AWS S3配置

```env
STORAGE_TYPE=s3
STORAGE_BUCKET=your-bucket-name
STORAGE_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
CDN_DOMAIN=https://cdn.example.com
```

## 启动服务

### 开发模式

```bash
npm run dev
```

### 生产模式

```bash
npm run build
npm start
```

## API接口

### 1. 上传头像

```http
POST /api/user/avatar/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}

Body:
- file: 图片文件
```

**响应:**

```json
{
  "success": true,
  "message": "头像上传成功",
  "data": {
    "avatarUrl": "/uploads/avatars/user123/avatar.jpg",
    "thumbnailUrl": "/uploads/avatars/user123/avatar_thumb.jpg"
  }
}
```

### 2. 删除头像

```http
DELETE /api/user/avatar
Authorization: Bearer {token}
```

**响应:**

```json
{
  "success": true,
  "message": "头像删除成功"
}
```

### 3. 获取头像信息

```http
GET /api/user/avatar/:userId?
Authorization: Bearer {token}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "userId": "user123",
    "avatarUrl": "/uploads/avatars/user123/avatar.jpg",
    "thumbnailUrl": "/uploads/avatars/user123/avatar_thumb.jpg",
    "fileSize": 45678,
    "mimeType": "image/jpeg",
    "uploadedAt": "2024-01-01T12:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z"
  }
}
```

## 文件验证

### 支持的文件类型

- JPEG (.jpg, .jpeg)
- PNG (.png)
- GIF (.gif)

### 文件大小限制

- 最大: 2MB
- 可通过环境变量 `UPLOAD_MAX_SIZE` 配置

### 验证流程

1. MIME类型验证
2. 文件扩展名验证
3. 文件头(Magic Number)验证
4. 图片内容验证(使用sharp)

## 图片处理

### 标准头像

- 尺寸: 200x200px
- 格式: JPEG
- 质量: 90%
- 裁剪: 居中裁剪

### 缩略图

- 尺寸: 50x50px
- 格式: JPEG
- 质量: 80%
- 裁剪: 居中裁剪

### 处理步骤

1. 调整大小
2. 压缩
3. 清除EXIF信息
4. 转换为JPEG格式

## 存储方式

### 本地存储

文件保存在 `./uploads/avatars/{userId}/` 目录下

访问URL: `/uploads/avatars/{userId}/avatar.jpg`

### 阿里云OSS

需要配置OSS访问凭证,文件上传到指定bucket

访问URL: `https://cdn.example.com/avatars/{userId}/avatar.jpg`

### AWS S3

需要配置S3访问凭证,文件上传到指定bucket

访问URL: `https://cdn.example.com/avatars/{userId}/avatar.jpg`

## 安全性

### 文件验证

- 多层验证(MIME、扩展名、文件头、内容)
- 防止恶意文件上传
- 文件大小限制

### 图片处理

- 清除EXIF信息(防止隐私泄露)
- 重新编码(防止恶意代码)
- 统一格式和尺寸

### 认证授权

- JWT Token认证
- 用户只能操作自己的头像
- 管理员可查看所有用户头像

## 错误处理

### 错误码

- 400: 请求参数错误
- 401: 未授权
- 403: 权限不足
- 404: 资源不存在
- 500: 服务器内部错误

### 错误响应格式

```json
{
  "success": false,
  "message": "错误信息"
}
```

## 日志

使用自定义Logger记录:

- 上传操作
- 删除操作
- 错误信息
- 性能指标

## 性能优化

### 图片处理

- 使用sharp库(基于libvips,性能优异)
- 异步处理
- 内存优化

### 存储优化

- CDN加速
- 浏览器缓存
- 压缩传输

### 并发处理

- 支持多文件并发上传
- 请求队列管理

## 测试

### 使用curl测试

```bash
# 上传头像
curl -X POST http://localhost:3000/api/user/avatar/upload \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@/path/to/avatar.jpg"

# 删除头像
curl -X DELETE http://localhost:3000/api/user/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"

# 获取头像信息
curl http://localhost:3000/api/user/avatar \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 使用Postman测试

1. 导入API集合
2. 设置环境变量(token, baseUrl)
3. 执行测试用例

## 部署

### Docker部署

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### PM2部署

```bash
pm2 start server/index.ts --name avatar-service
pm2 save
pm2 startup
```

## 监控

### 健康检查

```http
GET /health
```

### 指标监控

- 上传成功率
- 平均处理时间
- 存储使用量
- 错误率

## 故障排查

### 上传失败

1. 检查文件大小和类型
2. 检查存储空间
3. 检查网络连接
4. 查看错误日志

### 图片处理失败

1. 检查sharp库是否正确安装
2. 检查图片文件是否损坏
3. 检查内存使用情况

### 存储失败

1. 检查存储配置
2. 检查访问凭证
3. 检查网络连接
4. 检查存储空间

## 许可证

MIT
