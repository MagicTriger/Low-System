<template>
  <div>
    <a-dropdown placement="bottomRight" :trigger="['click']">
      <div class="unified-layout-user-info">
        <a-avatar
          :size="32"
          :src="userInfo.avatar"
          :style="{ backgroundColor: userInfo.avatar ? 'transparent' : '#f6bb42' }"
          class="user-avatar"
        >
          <template v-if="!userInfo.avatar">
            {{ getUserInitial(userInfo.name) }}
          </template>
        </a-avatar>
        <span class="unified-layout-user-name">
          {{ userInfo.name }}
        </span>
        <DownOutlined class="unified-layout-user-arrow" />
      </div>
      <template #overlay>
        <a-menu @click="handleMenuClick">
          <template v-for="item in computedMenuItems" :key="item.key">
            <a-menu-divider v-if="item.divider" />
            <a-menu-item v-else :key="item.key" :disabled="loading">
              <template #icon>
                <UserOutlined v-if="item.icon === 'UserOutlined'" />
                <CameraOutlined v-else-if="item.icon === 'CameraOutlined'" />
                <SettingOutlined v-else-if="item.icon === 'SettingOutlined'" />
                <LogoutOutlined v-else-if="item.icon === 'LogoutOutlined'" />
              </template>
              {{ item.label }}
            </a-menu-item>
          </template>
        </a-menu>
      </template>
    </a-dropdown>

    <!-- 头像管理弹窗 -->
    <transition name="avatar-modal">
      <a-modal
        v-if="showAvatarManager"
        v-model:open="showAvatarManager"
        title="头像管理"
        :footer="null"
        :width="600"
        :maskClosable="!loading"
        :closable="!loading"
        @cancel="handleModalClose"
      >
        <a-spin :spinning="loading" tip="处理中...">
          <AvatarManager
            :current-avatar="userInfo.avatar"
            @upload-success="handleAvatarUploadSuccess"
            @upload-error="handleAvatarUploadError"
            @delete-success="handleAvatarDeleteSuccess"
            @delete-error="handleAvatarDeleteError"
          />
        </a-spin>
      </a-modal>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message } from 'ant-design-vue'
import { DownOutlined, UserOutlined, CameraOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons-vue'
import AvatarManager from '@/core/components/AvatarManager.vue'
import type { UserInfo, UserMenuItem } from '../types'

interface Props {
  userInfo: UserInfo
  menuItems?: UserMenuItem[]
}

const props = withDefaults(defineProps<Props>(), {
  menuItems: () => [
    {
      key: 'profile',
      label: '个人中心',
      icon: 'UserOutlined',
    },
    {
      key: 'settings',
      label: '个人设置',
      icon: 'SettingOutlined',
    },
    {
      key: 'divider-1',
      label: '',
      divider: true,
    },
    {
      key: 'logout',
      label: '退出登录',
      icon: 'LogoutOutlined',
    },
  ],
})

const emit = defineEmits<{
  'menu-click': [action: string]
  'avatar-updated': [avatarUrl: string]
}>()

// 状态管理
const showAvatarManager = ref(false)
const loading = ref(false)

// 直接使用传入的菜单项
const computedMenuItems = computed(() => props.menuItems || [])

const getUserInitial = (name: string): string => {
  if (!name) return 'U'
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.charAt(0)
  }
  return name.charAt(0).toUpperCase()
}

const handleMenuClick = (info: any) => {
  const key = String(info.key)

  if (key === 'avatar') {
    showAvatarManager.value = true
  } else {
    emit('menu-click', key)
  }
}

const handleModalClose = () => {
  if (!loading.value) {
    showAvatarManager.value = false
  }
}

const handleAvatarUploadSuccess = (data: { avatarUrl: string; thumbnailUrl: string }) => {
  loading.value = false
  emit('avatar-updated', data.avatarUrl)
  showAvatarManager.value = false
  message.success('头像上传成功', 2)
}

const handleAvatarUploadError = (error: string) => {
  loading.value = false
  console.error('头像上传错误:', error)
  message.error(error || '头像上传失败，请重试', 3)
}

const handleAvatarDeleteSuccess = () => {
  loading.value = false
  emit('avatar-updated', '')
  showAvatarManager.value = false
  message.success('头像删除成功', 2)
}

const handleAvatarDeleteError = (error: string) => {
  loading.value = false
  message.error(error || '头像删除失败，请重试', 3)
}
</script>

<style scoped>
.unified-layout-user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: background var(--layout-transition-duration);
  min-width: 0;
}

.unified-layout-user-info:hover {
  background: var(--layout-bg-hover);
}

.unified-layout-user-name {
  color: var(--layout-text-primary);
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 120px;
}

.unified-layout-user-arrow {
  color: var(--layout-text-secondary);
  font-size: 12px;
  transition: transform var(--layout-transition-duration);
}

.unified-layout-user-info:hover .unified-layout-user-arrow {
  transform: rotate(180deg);
}

/* 头像更新动画 */
.user-avatar {
  transition: all 0.5s ease;
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* 弹窗动画 */
.avatar-modal-enter-active,
.avatar-modal-leave-active {
  transition: opacity 0.3s ease;
}

.avatar-modal-enter-from,
.avatar-modal-leave-to {
  opacity: 0;
}

.avatar-modal-enter-active :deep(.ant-modal),
.avatar-modal-leave-active :deep(.ant-modal) {
  transition:
    transform 0.3s ease,
    opacity 0.3s ease;
}

.avatar-modal-enter-from :deep(.ant-modal),
.avatar-modal-leave-to :deep(.ant-modal) {
  transform: scale(0.9);
  opacity: 0;
}

@media (max-width: 768px) {
  .unified-layout-user-name {
    display: none;
  }

  .unified-layout-user-info {
    padding: 4px 8px;
    gap: 4px;
  }
}

:deep(.ant-dropdown-menu) {
  min-width: 160px;
}

:deep(.ant-dropdown-menu-item) {
  padding: 8px 16px;
  transition: background 0.2s ease;
}

:deep(.ant-dropdown-menu-item:hover) {
  background: var(--layout-bg-hover);
}

:deep(.ant-dropdown-menu-item-icon) {
  margin-right: 8px;
}

:deep(.ant-dropdown-menu-item-disabled) {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 加载状态优化 */
:deep(.ant-spin-nested-loading) {
  min-height: 200px;
}

:deep(.ant-spin-container) {
  transition: opacity 0.3s ease;
}

:deep(.ant-spin-blur) {
  opacity: 0.5;
  pointer-events: none;
}
</style>
