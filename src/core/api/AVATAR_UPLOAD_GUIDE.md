# 用户头像上传指南

本文档说明如何使用阿里云OSS上传用户头像。

## 方式一：通过后端代理上传（推荐）

这是最简单的方式，前端只需要调用一个API，后端会处理所有OSS相关的逻辑。

```typescript
import { uploadAvatar } from '@/core/api/avatar'

// 上传头像
async function handleAvatarUpload(file: File) {
  try {
    const result = await uploadAvatar(file)
    console.log('头像URL:', result.avatarUrl)
    console.log('缩略图URL:', result.thumbnailUrl)
  } catch (error) {
    console.error('上传失败:', error.message)
  }
}
```

### 后端需要实现

后端的 `/user/avatar/upload` 接口需要：

1. 接收文件
2. 使用阿里云OSS SDK上传文件到OSS
3. 可选：生成缩略图
4. 返回OSS文件URL

**请求：**

```
POST /api/user/avatar/upload
Content-Type: multipart/form-data

file: <binary>
```

**响应：**

```json
{
  "success": true,
  "message": "上传成功",
  "data": {
    "avatarUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/avatars/1234567890_abc123.jpg",
    "thumbnailUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/avatars/1234567890_abc123_thumb.jpg"
  }
}
```

---

## 方式二：前端直传到OSS（高级）

这种方式可以减轻后端压力，前端直接上传到OSS。

```typescript
import { getOSSUploadCredentials, uploadAvatarDirectToOSS, updateAvatarUrl } from '@/core/api/avatar'

// 前端直传到OSS
async function handleDirectUpload(file: File) {
  try {
    // 1. 获取OSS上传凭证
    const credentials = await getOSSUploadCredentials()

    // 2. 直接上传到OSS
    const avatarUrl = await uploadAvatarDirectToOSS(file, credentials)

    // 3. 更新用户头像URL到数据库
    await updateAvatarUrl(avatarUrl)

    console.log('头像上传成功:', avatarUrl)
  } catch (error) {
    console.error('上传失败:', error.message)
  }
}
```

### 后端需要实现

#### 1. 获取OSS上传凭证

**请求：**

```
GET /api/user/avatar/oss/credentials
```

**响应：**

```json
{
  "success": true,
  "data": {
    "accessKeyId": "STS.xxx",
    "accessKeySecret": "xxx",
    "securityToken": "xxx",
    "bucket": "your-bucket",
    "region": "oss-cn-hangzhou",
    "expiration": "2025-10-18T16:00:00Z"
  }
}
```

#### 2. 更新头像URL

**请求：**

```
PUT /api/user/avatar/url
Content-Type: application/json

{
  "avatarUrl": "https://your-bucket.oss-cn-hangzhou.aliyuncs.com/avatars/xxx.jpg"
}
```

**响应：**

```json
{
  "success": true,
  "message": "更新成功"
}
```

---

## 其他API

### 删除头像

```typescript
import { deleteAvatar } from '@/core/api/avatar'

await deleteAvatar()
```

### 获取头像信息

```typescript
import { getAvatarInfo } from '@/core/api/avatar'

// 获取当前用户头像
const info = await getAvatarInfo()

// 获取指定用户头像
const userInfo = await getAvatarInfo('userId123')
```

---

## 文件验证规则

- **最大文件大小：** 2MB
- **支持的格式：** JPG, JPEG, PNG, GIF
- **自动验证：** API会自动验证文件大小和格式

---

## 错误处理

所有API都会抛出友好的错误信息：

```typescript
try {
  await uploadAvatar(file)
} catch (error) {
  // 错误信息示例：
  // - "文件太大，请选择小于2MB的图片"
  // - "不支持的文件格式，请上传JPG、PNG或GIF格式"
  // - "未登录或登录已过期，请重新登录"
  console.error(error.message)
}
```

---

## 完整示例：Vue组件

```vue
<template>
  <div class="avatar-upload">
    <img v-if="avatarUrl" :src="avatarUrl" alt="头像" class="avatar-preview" />
    <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif" @change="handleFileChange" />
    <button @click="handleUpload" :disabled="!selectedFile || uploading">
      {{ uploading ? '上传中...' : '上传头像' }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { uploadAvatar } from '@/core/api/avatar'
import { message } from 'ant-design-vue'

const selectedFile = ref<File | null>(null)
const avatarUrl = ref<string>('')
const uploading = ref(false)

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    selectedFile.value = target.files[0]
  }
}

async function handleUpload() {
  if (!selectedFile.value) return

  uploading.value = true
  try {
    const result = await uploadAvatar(selectedFile.value)
    avatarUrl.value = result.avatarUrl
    message.success('头像上传成功')
  } catch (error: any) {
    message.error(error.message || '上传失败')
  } finally {
    uploading.value = false
  }
}
</script>

<style scoped>
.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}
</style>
```

---

## 阿里云OSS配置建议

### 1. Bucket设置

- 设置为**私有读写**或**公共读**
- 配置CORS规则允许前端域名访问

### 2. STS临时凭证

- 使用STS临时凭证而不是主账号密钥
- 设置合理的过期时间（建议1小时）
- 限制权限范围（只允许上传到特定目录）

### 3. 图片处理

- 使用OSS图片处理服务自动生成缩略图
- 配置水印、压缩等功能

### 4. CDN加速

- 配置CDN加速域名
- 启用HTTPS

---

## 安全建议

1. **文件验证：** 前后端都要验证文件类型和大小
2. **权限控制：** 确保用户只能上传自己的头像
3. **防盗链：** 配置OSS防盗链规则
4. **内容审核：** 接入阿里云内容安全服务
5. **限流：** 限制上传频率，防止滥用
