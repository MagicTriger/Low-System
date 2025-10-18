<template>
  <div class="unified-layout-header-content">
    <!-- 左侧区域 -->
    <div class="unified-layout-header-left">
      <!-- 侧边栏切换按钮 -->
      <div v-if="config.showSidebarToggle" class="unified-layout-sidebar-toggle" @click="handleToggleSidebar">
        <MenuUnfoldOutlined v-if="collapsed" />
        <MenuFoldOutlined v-else />
      </div>
      <!-- 标题 -->
      <div class="unified-layout-header-title">
        {{ config.title }}
      </div>
      <!-- 左侧插槽 -->
      <slot name="left" />
    </div>
    <!-- 右侧区域 -->
    <div class="unified-layout-header-right">
      <!-- 右侧插槽 -->
      <slot name="right" />
      <!-- 图标库按钮 -->
      <a-tooltip v-if="config.showIconLibrary" title="图标库">
        <a-button type="text" class="unified-layout-header-icon" @click="handleIconLibraryClick">
          <AppstoreOutlined />
        </a-button>
      </a-tooltip>
      <!-- 通知按钮 -->
      <a-tooltip v-if="config.showNotifications" title="通知">
        <a-badge :count="notificationCount" :offset="[10, 0]">
          <a-button type="text" class="unified-layout-header-icon" @click="handleNotificationClick">
            <BellOutlined />
          </a-button>
        </a-badge>
      </a-tooltip>
      <!-- 设置按钮 -->
      <a-tooltip v-if="config.showSettings" title="设置">
        <a-button type="text" class="unified-layout-header-icon" @click="handleSettingsClick">
          <SettingOutlined />
        </a-button>
      </a-tooltip>
      <!-- 自定义操作按钮 -->
      <template v-if="config.actions && config.actions.length > 0">
        <a-tooltip v-for="action in config.actions" :key="action.key" :title="action.title">
          <a-button type="text" class="unified-layout-header-icon" @click="action.onClick">
            <component :is="action.icon" v-if="action.icon" />
          </a-button>
        </a-tooltip>
      </template>
      <!-- 用户信息下拉菜单 -->
      <UserDropdown
        v-if="userInfo"
        :user-info="userInfo"
        :menu-items="userMenuItems"
        @menu-click="handleUserAction"
        @avatar-updated="handleAvatarUpdated"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MenuFoldOutlined, MenuUnfoldOutlined, AppstoreOutlined, BellOutlined, SettingOutlined } from '@ant-design/icons-vue'
import type { HeaderConfig, UserInfo, UserMenuItem } from '../types'
import UserDropdown from './UserDropdown.vue'

interface Props {
  config: HeaderConfig
  collapsed: boolean
  userInfo?: UserInfo
  notificationCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  notificationCount: 0,
})

const emit = defineEmits<{
  'toggle-sidebar': []
  'icon-library-click': []
  'notification-click': []
  'settings-click': []
  'user-action': [action: string]
  'avatar-updated': [avatarUrl: string]
}>()

const userMenuItems = computed<UserMenuItem[]>(() => [
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
])

const handleToggleSidebar = () => {
  emit('toggle-sidebar')
}

const handleIconLibraryClick = () => {
  emit('icon-library-click')
}

const handleNotificationClick = () => {
  emit('notification-click')
}

const handleSettingsClick = () => {
  emit('settings-click')
}

const handleUserAction = (action: string) => {
  emit('user-action', action)
}

const handleAvatarUpdated = (avatarUrl: string) => {
  emit('avatar-updated', avatarUrl)
}
</script>

<style scoped>
.unified-layout-header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 20px;
}

.unified-layout-header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.unified-layout-header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.unified-layout-header-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--layout-text-primary);
  white-space: nowrap;
}

.unified-layout-header-icon {
  color: var(--layout-text-primary) !important;
  border: none !important;
  box-shadow: none !important;
}

.unified-layout-header-icon:hover {
  background: var(--layout-bg-hover) !important;
}

.unified-layout-sidebar-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  color: var(--layout-text-primary);
  font-size: 18px;
  cursor: pointer;
  border-radius: 4px;
  transition: background var(--layout-transition-duration);
}

.unified-layout-sidebar-toggle:hover {
  background: var(--layout-bg-hover);
}

@media (max-width: 768px) {
  .unified-layout-header-content {
    padding: 0 12px;
  }

  .unified-layout-header-title {
    display: none;
  }

  .unified-layout-header-left {
    gap: 8px;
  }

  .unified-layout-header-right {
    gap: 4px;
  }
}
</style>
