# 头像组件使用文档

## 组件概述

提供了一套完整的用户头像管理组件,包括上传、裁剪、显示和管理功能。

## 组件列表

### 1. AvatarManager (推荐使用)

完整的头像管理组件,集成了上传、裁剪和删除功能。

#### 基础用法

```vue
<template>
  <AvatarManager :current-avatar="userAvatar" @upload-success="handleUploadSuccess" @delete-success="handleDeleteSuccess" />
</template>

<script setup>
import { ref } from 'vue'
import AvatarManager from '@/core/components/AvatarManager.vue'

const userAvatar = ref('https://example.com/avatar.jpg')

function handleUploadSuccess(data) {
  userAvatar.value = data.avatarUrl
  console.log('头像上传成功:', data)
}

function handleDeleteSuccess() {
  userAvatar.value = ''
  console.log('头像删除成功')
}
</script>
```

#### Props

| 参数          | 类型     | 默认值                                   | 说明                       |
| ------------- | -------- | ---------------------------------------- | -------------------------- |
| currentAvatar | string   | ''                                       | 当前头像URL                |
| size          | number   | 100                                      | 头像显示大小(px)           |
| maxSize       | number   | 2097152                                  | 最大文件大小(字节),默认2MB |
| allowedTypes  | string[] | ['image/jpeg', 'image/png', 'image/gif'] | 允许的文件类型             |
| showActions   | boolean  | true                                     | 是否显示操作按钮           |
| aspectRatio   | number   | 1                                        | 裁剪比例                   |
| cropSize      | number   | 200                                      | 裁剪输出尺寸               |
| uploadUrl     | string   | '/api/user/avatar/upload'                | 上传接口URL                |
| deleteUrl     | string   | '/api/user/avatar'                       | 删除接口URL                |

#### Events

| 事件名         | 参数                        | 说明     |
| -------------- | --------------------------- | -------- |
| upload-success | { avatarUrl, thumbnailUrl } | 上传成功 |
| upload-error   | error: string               | 上传失败 |
| delete-success | -                           | 删除成功 |
| delete-error   | error: string               | 删除失败 |

### 2. AvatarUpload

头像上传组件,提供文件选择和验证功能。

#### 基础用法

```vue
<template>
  <AvatarUpload :current-avatar="avatar" @file-selected="handleFileSelected" />
</template>

<script setup>
import AvatarUpload from '@/core/components/AvatarUpload.vue'

function handleFileSelected(file) {
  console.log('选择的文件:', file)
  // 处理文件上传
}
</script>
```

### 3. AvatarCropper

图片裁剪组件,提供图片裁剪和预览功能。

#### 基础用法

```vue
<template>
  <AvatarCropper v-if="showCropper" :image-url="imageUrl" @crop-complete="handleCropComplete" @crop-cancel="showCropper = false" />
</template>

<script setup>
import { ref } from 'vue'
import AvatarCropper from '@/core/components/AvatarCropper.vue'

const showCropper = ref(false)
const imageUrl = ref('')

function handleCropComplete(data) {
  console.log('裁剪完成:', data.blob, data.dataUrl)
  // 上传裁剪后的图片
}
</script>
```

### 4. AvatarDisplay

头像显示组件,提供头像展示和加载状态。

#### 基础用法

```vue
<template>
  <AvatarDisplay :src="avatar" size="large" badge="online" />
</template>

<script setup>
import AvatarDisplay from '@/core/components/AvatarDisplay.vue'

const avatar = 'https://example.com/avatar.jpg'
</script>
```

#### Props

| 参数         | 类型                                     | 默认值     | 说明        |
| ------------ | ---------------------------------------- | ---------- | ----------- |
| src          | string                                   | ''         | 头像URL     |
| size         | 'small' \| 'medium' \| 'large' \| number | 'medium'   | 头像大小    |
| alt          | string                                   | '用户头像' | 图片alt文本 |
| lazy         | boolean                                  | false      | 是否懒加载  |
| badge        | 'dot' \| 'online' \| 'offline' \| 'busy' | -          | 徽章类型    |
| badgeContent | string \| number                         | -          | 徽章内容    |
| shape        | 'circle' \| 'square'                     | 'circle'   | 头像形状    |

## API接口

### 上传头像

```typescript
import { uploadAvatar } from '@/core/api/avatar';

const file = /* 文件对象 */;
const result = await uploadAvatar(file);
console.log(result.avatarUrl, result.thumbnailUrl);
```

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
const userInfo = await getAvatarInfo('user123')
```

## 完整示例

### 用户设置页面

```vue
<template>
  <div class="user-settings">
    <h2>个人设置</h2>

    <div class="avatar-section">
      <h3>头像设置</h3>
      <AvatarManager
        :current-avatar="userInfo.avatar"
        :size="120"
        @upload-success="handleAvatarUpdate"
        @upload-error="handleError"
        @delete-success="handleAvatarDelete"
      />
    </div>

    <div class="info-section">
      <h3>基本信息</h3>
      <div class="info-item">
        <label>用户名:</label>
        <span>{{ userInfo.username }}</span>
      </div>
      <div class="info-item">
        <label>邮箱:</label>
        <span>{{ userInfo.email }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AvatarManager from '@/core/components/AvatarManager.vue'
import { getAvatarInfo } from '@/core/api/avatar'

const userInfo = ref({
  username: '',
  email: '',
  avatar: '',
})

onMounted(async () => {
  try {
    const info = await getAvatarInfo()
    userInfo.value.avatar = info.avatarUrl
  } catch (error) {
    console.error('获取用户信息失败:', error)
  }
})

function handleAvatarUpdate(data) {
  userInfo.value.avatar = data.avatarUrl
  // 显示成功提示
  alert('头像更新成功!')
}

function handleAvatarDelete() {
  userInfo.value.avatar = ''
  alert('头像删除成功!')
}

function handleError(error) {
  alert('操作失败: ' + error)
}
</script>

<style scoped>
.user-settings {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.avatar-section,
.info-section {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-top: 0;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  padding: 10px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-item label {
  width: 100px;
  font-weight: 500;
  color: #606266;
}
</style>
```

### 导航栏头像

```vue
<template>
  <div class="navbar">
    <div class="navbar-brand">My App</div>

    <div class="navbar-user">
      <AvatarDisplay :src="userAvatar" size="small" badge="online" @click="showUserMenu = !showUserMenu" />

      <div v-if="showUserMenu" class="user-menu">
        <a href="/settings">个人设置</a>
        <a href="/logout">退出登录</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AvatarDisplay from '@/core/components/AvatarDisplay.vue'

const userAvatar = ref('https://example.com/avatar.jpg')
const showUserMenu = ref(false)
</script>
```

## 注意事项

1. **文件大小限制**: 默认限制2MB,可通过`maxSize`属性调整
2. **文件类型**: 默认支持jpg、png、gif,可通过`allowedTypes`属性调整
3. **依赖**: AvatarCropper组件依赖cropperjs库,需要安装: `npm install cropperjs`
4. **图标**: 组件中使用了图标类名(如icon-camera),需要配置图标库或自定义图标
5. **认证**: 上传和删除接口需要Bearer Token认证
6. **默认头像**: 需要在`/assets/default-avatar.png`放置默认头像图片

## 自定义样式

所有组件都支持通过CSS变量自定义样式:

```css
.avatar-upload {
  --avatar-border-color: #dcdfe6;
  --avatar-hover-scale: 1.05;
  --overlay-bg: rgba(0, 0, 0, 0.5);
}
```

## 浏览器兼容性

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 更新日志

### v1.0.0 (2025-10-17)

- 初始版本
- 支持头像上传、裁剪、显示和删除
- 支持文件验证和错误处理
- 支持响应式设计
