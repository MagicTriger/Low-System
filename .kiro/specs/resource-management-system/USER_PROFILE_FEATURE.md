# 用户头像和账号设置功能

## 完成时间

2025-10-16

## 功能概述

在设计器顶部导航栏添加了用户头像和下拉菜单，实现了用户登出和账号设置功能。

## 实现内容

### 1. 顶部导航栏用户头像

**位置：** `src/modules/designer/views/DesignerNew.vue`

#### 添加的UI元素

```vue
<!-- 用户头像下拉菜单 -->
<a-dropdown :trigger="['click']" placement="bottomRight">
  <div class="user-avatar-wrapper">
    <a-avatar :size="32" :src="userAvatar" style="cursor: pointer">
      <template #icon><user-outlined /></template>
    </a-avatar>
  </div>
  <template #overlay>
    <a-menu>
      <a-menu-item key="profile" @click="handleUserProfile">
        <user-outlined />
        <span style="margin-left: 8px">个人中心</span>
      </a-menu-item>
      <a-menu-item key="settings" @click="handleUserSettings">
        <setting-outlined />
        <span style="margin-left: 8px">账号设置</span>
      </a-menu-item>
      <a-menu-divider />
      <a-menu-item key="logout" @click="handleLogout">
        <logout-outlined />
        <span style="margin-left: 8px">退出登录</span>
      </a-menu-item>
    </a-menu>
  </template>
</a-dropdown>
```

#### 功能特性

1. **用户头像显示**

   - 从状态管理器读取用户头像
   - 如果没有头像，显示默认用户图标
   - 头像大小：32px

2. **下拉菜单**
   - 个人中心（开发中）
   - 账号设置
   - 退出登录

### 2. 用户相关功能

#### 获取用户信息

```typescript
// 获取状态管理器
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

// 用户头像
const userAvatar = computed(() => {
  const stateManager = getStateManager()
  if (!stateManager) return undefined
  const authState = stateManager.getState('auth')
  return authState?.userInfo?.avatar
})

// 用户名
const username = computed(() => {
  const stateManager = getStateManager()
  if (!stateManager) return '未登录'
  const authState = stateManager.getState('auth')
  return authState?.userInfo?.displayName || authState?.userInfo?.username || '未登录'
})
```

#### 退出登录

```typescript
function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const stateManager = getStateManager()
        if (stateManager) {
          // 调用登出 action
          await stateManager.dispatch('auth/logout')
          message.success('已退出登录')
          // 跳转到登录页
          router.push('/designer/login')
        }
      } catch (error: any) {
        message.error('退出登录失败: ' + (error.message || '未知错误'))
      }
    },
  })
}
```

### 3. 用户设置弹窗

**文件：** `src/modules/designer/components/UserSettingsModal.vue`

#### 功能模块

##### 基本信息标签页

1. **头像管理**

   - 显示当前头像（80px）
   - 上传新头像（支持图片格式，最大2MB）
   - 移除头像
   - 头像预览

2. **个人信息**

   - 用户名（只读）
   - 显示名称（可编辑）
   - 邮箱（可编辑）

3. **保存功能**
   - 更新本地状态
   - 同步到 localStorage
   - TODO: 调用后端 API

##### 修改密码标签页

1. **密码表单**

   - 当前密码
   - 新密码
   - 确认密码

2. **验证规则**

   - 当前密码必填
   - 新密码必填且长度≥6位
   - 两次密码输入必须一致

3. **修改流程**
   - 验证表单
   - 调用 API（TODO）
   - 修改成功后自动退出登录

#### 头像上传处理

```typescript
const handleAvatarUpload: UploadProps['beforeUpload'] = file => {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    message.error('只能上传图片文件！')
    return false
  }

  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    message.error('图片大小不能超过 2MB！')
    return false
  }

  // 读取文件并转换为 base64
  const reader = new FileReader()
  reader.onload = e => {
    formData.value.avatar = e.target?.result as string
    message.success('头像已更新，请点击保存按钮')
  }
  reader.readAsDataURL(file)

  return false // 阻止自动上传
}
```

#### 保存用户信息

```typescript
async function handleSave() {
  saving.value = true
  try {
    const stateManager = getStateManager()
    if (!stateManager) {
      throw new Error('状态管理器未初始化')
    }

    // TODO: 调用 API 更新用户信息
    // await updateUserProfile(formData.value)

    // 更新本地状态
    const authState = stateManager.getState('auth')
    if (authState?.userInfo) {
      const updatedUserInfo = {
        ...authState.userInfo,
        displayName: formData.value.displayName,
        email: formData.value.email,
        avatar: formData.value.avatar,
      }

      // 更新状态
      stateManager.commit('auth/setAuthData', {
        accessToken: authState.accessToken,
        tokenType: authState.tokenType,
        userInfo: updatedUserInfo,
        permissionInfo: authState.permissionInfo,
        loginStatusInfo: authState.loginStatusInfo,
      })

      message.success('保存成功')
      emit('success')
      handleCancel()
    }
  } catch (error: any) {
    message.error('保存失败: ' + (error.message || '未知错误'))
  } finally {
    saving.value = false
  }
}
```

## 样式设计

### 用户头像样式

```scss
.user-avatar-wrapper {
  margin-left: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }
}
```

### 头像上传样式

```scss
.avatar-upload {
  display: flex;
  align-items: center;
  gap: 16px;

  .avatar-actions {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}
```

## 数据流程

### 1. 用户信息读取

```
用户登录
  ↓
存储到 auth state
  ↓
localStorage 持久化
  ↓
页面读取 userInfo
  ↓
显示头像和用户名
```

### 2. 头像更新流程

```
用户选择图片
  ↓
验证文件类型和大小
  ↓
转换为 base64
  ↓
更新表单数据
  ↓
用户点击保存
  ↓
更新 auth state
  ↓
同步到 localStorage
  ↓
界面自动更新
```

### 3. 退出登录流程

```
用户点击退出
  ↓
显示确认对话框
  ↓
用户确认
  ↓
调用 auth/logout
  ↓
清除 auth state
  ↓
清除 localStorage
  ↓
跳转到登录页
```

## 用户界面

### 顶部导航栏

```
┌─────────────────────────────────────────────────────────┐
│ 页面名称 [编辑]  [保存] [预览]  [撤销] [重做]  已保存  [👤] │
└─────────────────────────────────────────────────────────┘
                                                      ↓
                                            ┌──────────────┐
                                            │ 👤 个人中心   │
                                            │ ⚙️ 账号设置   │
                                            │ ──────────── │
                                            │ 🚪 退出登录   │
                                            └──────────────┘
```

### 账号设置弹窗

```
┌─────────────────────────────────────────┐
│ 账号设置                          [×]    │
├─────────────────────────────────────────┤
│ [基本信息] [修改密码]                     │
├─────────────────────────────────────────┤
│                                         │
│  头像:    [👤]  [上传头像]              │
│                [移除头像]                │
│                                         │
│  用户名:  [admin        ] (只读)        │
│                                         │
│  显示名称: [管理员       ]               │
│                                         │
│  邮箱:    [admin@example.com]           │
│                                         │
│           [保存] [取消]                  │
│                                         │
└─────────────────────────────────────────┘
```

## 功能特性

### ✅ 已实现

1. **用户头像显示**

   - 从状态管理器读取
   - 默认图标支持
   - 响应式更新

2. **下拉菜单**

   - 个人中心入口
   - 账号设置入口
   - 退出登录功能

3. **退出登录**

   - 确认对话框
   - 清除认证状态
   - 跳转到登录页

4. **账号设置**

   - 头像上传和预览
   - 头像移除
   - 显示名称编辑
   - 邮箱编辑
   - 本地状态更新

5. **修改密码**
   - 密码表单
   - 验证规则
   - 修改后自动登出

### 📋 待完善

1. **后端集成**

   - 用户信息更新 API
   - 头像上传 API
   - 修改密码 API

2. **个人中心页面**

   - 完整的个人信息展示
   - 更多设置选项

3. **头像功能增强**

   - 头像裁剪
   - 头像预设
   - 头像历史记录

4. **安全增强**
   - 密码强度检测
   - 二次验证
   - 登录设备管理

## 使用说明

### 查看用户信息

1. 点击顶部导航栏右侧的用户头像
2. 下拉菜单显示当前用户信息

### 修改头像

1. 点击用户头像 → 账号设置
2. 在"基本信息"标签页
3. 点击"上传头像"按钮
4. 选择图片文件（最大2MB）
5. 预览头像
6. 点击"保存"按钮

### 修改个人信息

1. 打开账号设置
2. 修改显示名称或邮箱
3. 点击"保存"按钮

### 修改密码

1. 打开账号设置
2. 切换到"修改密码"标签页
3. 输入当前密码
4. 输入新密码（至少6位）
5. 确认新密码
6. 点击"修改密码"按钮
7. 修改成功后会自动退出登录

### 退出登录

1. 点击用户头像
2. 选择"退出登录"
3. 确认退出
4. 自动跳转到登录页

## 技术细节

### 状态管理

使用全局状态管理器 (`__MIGRATION_SYSTEM__`) 管理用户信息：

```typescript
interface AuthState {
  accessToken: string | null
  tokenType: string
  isAuthenticated: boolean
  userInfo: UserInfo | null
  permissionInfo: PermissionInfo | null
  loginStatusInfo: LoginStatusInfo | null
}

interface UserInfo {
  userId: number
  username: string
  enabled: boolean
  createdAt: string
  displayName?: string
  avatar?: string
  email?: string
}
```

### 数据持久化

用户信息存储在 localStorage 中：

```typescript
// 保存
localStorage.setItem('userInfo', JSON.stringify(userInfo))

// 读取
const userInfoStr = localStorage.getItem('userInfo')
const userInfo = JSON.parse(userInfoStr)
```

### 头像处理

头像使用 base64 编码存储：

```typescript
// 读取文件
const reader = new FileReader()
reader.onload = e => {
  const base64 = e.target?.result as string
  // 保存到状态
}
reader.readAsDataURL(file)
```

## 修改文件

1. **src/modules/designer/views/DesignerNew.vue**

   - 添加用户头像和下拉菜单
   - 添加用户相关方法
   - 添加用户头像样式

2. **src/modules/designer/components/UserSettingsModal.vue** (新建)
   - 用户设置弹窗组件
   - 基本信息编辑
   - 修改密码功能

## 测试步骤

### 1. 用户头像显示

1. 登录系统
2. 打开设计器页面
3. ✅ 验证顶部导航栏显示用户头像
4. ✅ 如果有头像，显示头像图片
5. ✅ 如果没有头像，显示默认图标

### 2. 下拉菜单

1. 点击用户头像
2. ✅ 验证下拉菜单正确显示
3. ✅ 验证菜单项：个人中心、账号设置、退出登录

### 3. 账号设置

1. 点击"账号设置"
2. ✅ 验证弹窗打开
3. ✅ 验证显示当前用户信息
4. 修改显示名称
5. 点击保存
6. ✅ 验证保存成功
7. ✅ 验证头像更新

### 4. 头像上传

1. 打开账号设置
2. 点击"上传头像"
3. 选择图片文件
4. ✅ 验证头像预览
5. 点击保存
6. ✅ 验证头像更新
7. ✅ 验证顶部导航栏头像同步更新

### 5. 修改密码

1. 打开账号设置
2. 切换到"修改密码"标签页
3. 输入密码信息
4. 点击"修改密码"
5. ✅ 验证表单验证
6. ✅ 验证修改成功提示
7. ✅ 验证自动退出登录

### 6. 退出登录

1. 点击用户头像
2. 选择"退出登录"
3. ✅ 验证确认对话框
4. 点击确定
5. ✅ 验证退出成功
6. ✅ 验证跳转到登录页
7. ✅ 验证认证状态已清除

## 注意事项

### 1. 头像大小限制

- 文件类型：仅支持图片格式
- 文件大小：最大 2MB
- 建议尺寸：200x200 或更大

### 2. 密码安全

- 最小长度：6位
- 建议使用强密码
- 修改密码后需要重新登录

### 3. 数据同步

- 用户信息更新后会立即同步到界面
- 退出登录会清除所有本地数据
- 重新登录后需要重新加载用户信息

### 4. 后端集成

当前版本仅更新本地状态，需要集成后端 API：

```typescript
// TODO: 实现这些 API
await updateUserProfile(formData)
await uploadAvatar(file)
await changePassword({ oldPassword, newPassword })
```

## 总结

这次更新实现了完整的用户头像和账号设置功能：

1. ✅ 顶部导航栏用户头像显示
2. ✅ 用户下拉菜单
3. ✅ 退出登录功能
4. ✅ 账号设置弹窗
5. ✅ 头像上传和管理
6. ✅ 个人信息编辑
7. ✅ 修改密码功能

用户现在可以方便地管理自己的账号信息和头像，提升了系统的用户体验！🎉
