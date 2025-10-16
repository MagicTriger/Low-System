<template>
  <a-modal :open="visible" title="账号设置" width="600px" :footer="null" @cancel="handleCancel">
    <a-tabs v-model:activeKey="activeTab">
      <!-- 基本信息 -->
      <a-tab-pane key="profile" tab="基本信息">
        <a-form :model="formData" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <!-- 头像 -->
          <a-form-item label="头像">
            <div class="avatar-upload">
              <a-avatar :size="80" :src="formData.avatar">
                <template #icon><user-outlined /></template>
              </a-avatar>
              <div class="avatar-actions">
                <a-upload :show-upload-list="false" :before-upload="handleAvatarUpload" accept="image/*">
                  <a-button type="link" size="small">
                    <upload-outlined />
                    上传头像
                  </a-button>
                </a-upload>
                <a-button type="link" size="small" danger @click="handleRemoveAvatar">
                  <delete-outlined />
                  移除头像
                </a-button>
              </div>
            </div>
          </a-form-item>

          <!-- 用户名 -->
          <a-form-item label="用户名">
            <a-input v-model:value="formData.username" disabled />
          </a-form-item>

          <!-- 显示名称 -->
          <a-form-item label="显示名称">
            <a-input v-model:value="formData.displayName" placeholder="请输入显示名称" />
          </a-form-item>

          <!-- 邮箱 -->
          <a-form-item label="邮箱">
            <a-input v-model:value="formData.email" placeholder="请输入邮箱" />
          </a-form-item>

          <!-- 操作按钮 -->
          <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
            <a-space>
              <a-button type="primary" @click="handleSave" :loading="saving"> 保存 </a-button>
              <a-button @click="handleCancel"> 取消 </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-tab-pane>

      <!-- 修改密码 -->
      <a-tab-pane key="password" tab="修改密码">
        <a-form :model="passwordForm" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <!-- 当前密码 -->
          <a-form-item label="当前密码">
            <a-input-password v-model:value="passwordForm.oldPassword" placeholder="请输入当前密码" />
          </a-form-item>

          <!-- 新密码 -->
          <a-form-item label="新密码">
            <a-input-password v-model:value="passwordForm.newPassword" placeholder="请输入新密码" />
          </a-form-item>

          <!-- 确认密码 -->
          <a-form-item label="确认密码">
            <a-input-password v-model:value="passwordForm.confirmPassword" placeholder="请再次输入新密码" />
          </a-form-item>

          <!-- 操作按钮 -->
          <a-form-item :wrapper-col="{ offset: 6, span: 18 }">
            <a-space>
              <a-button type="primary" @click="handleChangePassword" :loading="changingPassword"> 修改密码 </a-button>
              <a-button @click="handleResetPasswordForm"> 重置 </a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { UserOutlined, UploadOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import type { UploadProps } from 'ant-design-vue'

interface Props {
  visible: boolean
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// 状态
const activeTab = ref('profile')
const saving = ref(false)
const changingPassword = ref(false)

// 表单数据
const formData = ref({
  username: '',
  displayName: '',
  email: '',
  avatar: '',
})

const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

// 获取状态管理器
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

// 加载用户信息
function loadUserInfo() {
  const stateManager = getStateManager()
  if (!stateManager) return

  const authState = stateManager.getState('auth')
  if (authState?.userInfo) {
    formData.value = {
      username: authState.userInfo.username || '',
      displayName: authState.userInfo.displayName || '',
      email: authState.userInfo.email || '',
      avatar: authState.userInfo.avatar || '',
    }
  }
}

// 监听弹窗打开
watch(
  () => props.visible,
  newValue => {
    if (newValue) {
      loadUserInfo()
    }
  }
)

// 处理头像上传
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

// 移除头像
function handleRemoveAvatar() {
  formData.value.avatar = ''
  message.success('头像已移除，请点击保存按钮')
}

// 保存用户信息
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

// 修改密码
async function handleChangePassword() {
  // 验证
  if (!passwordForm.value.oldPassword) {
    message.error('请输入当前密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    message.error('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    message.error('新密码长度不能少于6位')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    message.error('两次输入的密码不一致')
    return
  }

  changingPassword.value = true
  try {
    // TODO: 调用 API 修改密码
    // await changePassword({
    //   oldPassword: passwordForm.value.oldPassword,
    //   newPassword: passwordForm.value.newPassword,
    // })

    message.success('密码修改成功，请重新登录')
    handleResetPasswordForm()

    // 延迟后退出登录
    setTimeout(() => {
      const stateManager = getStateManager()
      if (stateManager) {
        stateManager.dispatch('auth/logout')
      }
      handleCancel()
    }, 1500)
  } catch (error: any) {
    message.error('修改密码失败: ' + (error.message || '未知错误'))
  } finally {
    changingPassword.value = false
  }
}

// 重置密码表单
function handleResetPasswordForm() {
  passwordForm.value = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  }
}

// 关闭弹窗
function handleCancel() {
  emit('update:visible', false)
  activeTab.value = 'profile'
  handleResetPasswordForm()
}
</script>

<style scoped lang="scss">
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
</style>
