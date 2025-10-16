# 资源管理页面用户头像功能

## 完成时间

2025-10-16

## 功能概述

在资源管理页面的顶部导航栏添加了用户头像和下拉菜单，实现了用户登出和账号设置功能。

## 实现位置

**文件：** `src/modules/designer/views/ResourceManagement.vue`

## 实现内容

### 1. 顶部导航栏用户头像

#### UI 位置

在页面标题栏的右侧操作区域（page-actions）添加用户头像：

```vue
<div class="page-header">
  <h2 class="page-title">资源管理</h2>
  <div class="page-actions">
    <!-- 新建资源按钮 -->
    <a-button type="primary" @click="handleCreate">
      <template #icon><plus-outlined /></template>
      新建资源
    </a-button>

    <!-- 视图切换 -->
    <a-segmented v-model:value="viewMode" :options="viewOptions" />

    <!-- 刷新按钮 -->
    <a-button @click="handleRefresh">
      <template #icon><reload-outlined /></template>
      刷新
    </a-button>

    <!-- 用户头像下拉菜单 ✅ 新增 -->
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
  </div>
</div>
```

### 2. 导入依赖

#### 图标导入

```typescript
import {
  // ... 原有图标
  UserOutlined, // ✅ 新增
  SettingOutlined, // ✅ 新增
  LogoutOutlined, // ✅ 新增
} from '@ant-design/icons-vue'
```

#### 组件导入

```typescript
import UserSettingsModal from '../components/UserSettingsModal.vue' // ✅ 新增
```

#### Vue API 导入

```typescript
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue' // ✅ 添加 computed
```

### 3. 用户相关功能

#### 获取状态管理器

```typescript
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}
```

#### 用户头像计算属性

```typescript
const userAvatar = computed(() => {
  const stateManager = getStateManager()
  if (!stateManager) return undefined
  const authState = stateManager.getState('auth')
  return authState?.userInfo?.avatar
})
```

#### 用户设置弹窗状态

```typescript
const userSettingsVisible = ref(false)
```

#### 个人中心

```typescript
function handleUserProfile() {
  notify.info('个人中心功能开发中...')
}
```

#### 账号设置

```typescript
function handleUserSettings() {
  userSettingsVisible.value = true
}

function handleUserSettingsSuccess() {
  notify.success('用户信息已更新')
}
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
          notify.success('已退出登录')
          // 跳转到登录页
          router.push('/designer/login')
        }
      } catch (error: any) {
        notify.error('退出登录失败', error.message || '未知错误')
      }
    },
  })
}
```

### 4. 用户设置弹窗组件

在模板末尾添加：

```vue
<!-- 用户设置弹窗 -->
<UserSettingsModal v-model:visible="userSettingsVisible" @success="handleUserSettingsSuccess" />
```

### 5. 样式

```scss
.page-actions {
  display: flex;
  align-items: center; // ✅ 添加垂直居中
  gap: 8px;
}

// ✅ 新增用户头像样式
.user-avatar-wrapper {
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }
}
```

## 页面布局

### 资源管理页面顶部

```
┌─────────────────────────────────────────────────────────────────┐
│ 资源管理                                                          │
│                                                                  │
│  [+ 新建资源] [卡片视图|表格视图] [刷新] [👤]                      │
│                                                      ↓           │
│                                            ┌──────────────┐     │
│                                            │ 👤 个人中心   │     │
│                                            │ ⚙️ 账号设置   │     │
│                                            │ ──────────── │     │
│                                            │ 🚪 退出登录   │     │
│                                            └──────────────┘     │
├─────────────────────────────────────────────────────────────────┤
│ [搜索和筛选区域]                                                  │
├─────────────────────────────────────────────────────────────────┤
│ [资源列表/卡片视图]                                               │
└─────────────────────────────────────────────────────────────────┘
```

## 功能特性

### ✅ 已实现

1. **用户头像显示**

   - 从状态管理器读取用户头像
   - 默认图标支持（UserOutlined）
   - 32px 圆形头像
   - 响应式更新

2. **下拉菜单**

   - 个人中心入口（开发中提示）
   - 账号设置入口
   - 退出登录功能
   - 右下角弹出位置

3. **退出登录**

   - 确认对话框
   - 清除认证状态
   - 跳转到登录页
   - 错误处理

4. **账号设置**

   - 打开用户设置弹窗
   - 头像上传和管理
   - 个人信息编辑
   - 修改密码功能

5. **通知反馈**
   - 使用 notificationService
   - 成功、错误、信息提示
   - 用户友好的提示信息

## 与设计器页面的区别

| 特性     | 资源管理页面        | 设计器页面              |
| -------- | ------------------- | ----------------------- |
| 位置     | 页面标题栏右侧      | 顶部工具栏右侧          |
| 布局     | 与操作按钮并列      | 独立区域                |
| 通知方式 | notificationService | message                 |
| 路由     | /designer/resource  | /designer/resource/:url |
| 用途     | 资源列表管理        | 页面设计编辑            |

## 数据流程

### 1. 用户信息读取

```
页面加载
  ↓
computed 计算属性触发
  ↓
获取状态管理器
  ↓
读取 auth state
  ↓
获取 userInfo.avatar
  ↓
显示头像
```

### 2. 退出登录流程

```
用户点击退出
  ↓
显示确认对话框
  ↓
用户确认
  ↓
调用 auth/logout
  ↓
清除认证状态
  ↓
显示成功通知
  ↓
跳转到登录页
```

### 3. 账号设置流程

```
用户点击账号设置
  ↓
设置 userSettingsVisible = true
  ↓
打开 UserSettingsModal
  ↓
用户修改信息
  ↓
保存成功
  ↓
触发 @success 事件
  ↓
显示成功通知
  ↓
关闭弹窗
```

## 使用说明

### 查看用户信息

1. 登录系统后进入资源管理页面
2. 在页面右上角看到用户头像
3. 点击头像查看下拉菜单

### 修改个人信息

1. 点击用户头像
2. 选择"账号设置"
3. 在弹窗中修改信息
4. 点击保存

### 退出登录

1. 点击用户头像
2. 选择"退出登录"
3. 确认退出
4. 自动跳转到登录页

## 技术细节

### 状态管理

使用全局状态管理器读取用户信息：

```typescript
const authState = stateManager.getState('auth')
const avatar = authState?.userInfo?.avatar
```

### 响应式更新

使用 computed 计算属性确保头像自动更新：

```typescript
const userAvatar = computed(() => {
  // 每次 auth state 变化时自动重新计算
  return authState?.userInfo?.avatar
})
```

### 通知服务

使用 notificationService 而不是 message：

```typescript
// 资源管理页面
notify.success('已退出登录')
notify.error('退出登录失败', error.message)

// 设计器页面
message.success('已退出登录')
message.error('退出登录失败')
```

## 修改文件

1. **src/modules/designer/views/ResourceManagement.vue**

   - 添加用户头像和下拉菜单到 page-actions
   - 添加用户相关图标导入
   - 添加 UserSettingsModal 组件导入
   - 添加 computed 导入
   - 添加用户相关方法
   - 添加用户设置弹窗组件
   - 添加用户头像样式

2. **src/modules/designer/components/UserSettingsModal.vue** (复用)
   - 用户设置弹窗组件
   - 已在之前创建

## 测试步骤

### 1. 用户头像显示

1. 登录系统
2. 进入资源管理页面 `/designer/resource`
3. ✅ 验证页面右上角显示用户头像
4. ✅ 如果有头像，显示头像图片
5. ✅ 如果没有头像，显示默认用户图标

### 2. 下拉菜单

1. 点击用户头像
2. ✅ 验证下拉菜单正确显示
3. ✅ 验证菜单项：个人中心、账号设置、退出登录
4. ✅ 验证菜单位置在头像右下方

### 3. 个人中心

1. 点击"个人中心"
2. ✅ 验证显示"个人中心功能开发中..."提示

### 4. 账号设置

1. 点击"账号设置"
2. ✅ 验证弹窗打开
3. ✅ 验证显示当前用户信息
4. 修改信息并保存
5. ✅ 验证保存成功提示
6. ✅ 验证头像更新

### 5. 退出登录

1. 点击"退出登录"
2. ✅ 验证确认对话框
3. 点击确定
4. ✅ 验证退出成功提示
5. ✅ 验证跳转到登录页
6. ✅ 验证认证状态已清除

### 6. 响应式测试

1. 在账号设置中修改头像
2. 保存后关闭弹窗
3. ✅ 验证页面头像立即更新
4. 刷新页面
5. ✅ 验证头像保持更新后的状态

## 注意事项

### 1. 通知方式

资源管理页面使用 `notificationService`，而不是 `message`：

```typescript
// ✅ 正确
notify.success('操作成功')

// ❌ 错误
message.success('操作成功')
```

### 2. 组件复用

UserSettingsModal 组件在资源管理页面和设计器页面都可以使用，无需重复创建。

### 3. 样式隔离

资源管理页面的样式使用 scoped，不会影响其他页面。

### 4. 状态同步

用户信息的修改会自动同步到所有使用该状态的页面。

## 与之前实现的对比

### 设计器页面 (DesignerNew.vue)

- 位置：设计器顶部工具栏
- 用途：页面编辑时的用户操作
- 通知：使用 message
- 布局：独立的用户区域

### 资源管理页面 (ResourceManagement.vue) ✅ 本次实现

- 位置：资源管理页面标题栏
- 用途：资源列表管理时的用户操作
- 通知：使用 notificationService
- 布局：与操作按钮并列

## 总结

这次更新在资源管理页面实现了完整的用户头像和账号管理功能：

1. ✅ 顶部导航栏用户头像显示
2. ✅ 用户下拉菜单
3. ✅ 退出登录功能
4. ✅ 账号设置入口
5. ✅ 个人中心入口（预留）
6. ✅ 响应式头像更新
7. ✅ 统一的用户体验

现在用户在资源管理页面也可以方便地管理自己的账号信息和退出登录了！🎉
