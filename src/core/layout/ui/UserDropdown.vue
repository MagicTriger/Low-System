<template>
  <a-dropdown placement="bottomRight" :trigger="['click']">
    <div class="unified-layout-user-info">
      <a-avatar :size="32" :src="userInfo.avatar" :style="{ backgroundColor: userInfo.avatar ? 'transparent' : '#f6bb42' }">
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
        <template v-for="item in menuItems" :key="item.key">
          <a-menu-divider v-if="item.divider" />
          <a-menu-item v-else :key="item.key">
            <template #icon>
              <component :is="item.icon" v-if="item.icon" />
            </template>
            {{ item.label }}
          </a-menu-item>
        </template>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { DownOutlined, UserOutlined, SettingOutlined, LogoutOutlined } from '@ant-design/icons-vue'
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
}>()

const getUserInitial = (name: string): string => {
  if (!name) return 'U'
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.charAt(0)
  }
  return name.charAt(0).toUpperCase()
}

const handleMenuClick = (info: any) => {
  emit('menu-click', String(info.key))
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
}

:deep(.ant-dropdown-menu-item:hover) {
  background: var(--layout-bg-hover);
}

:deep(.ant-dropdown-menu-item-icon) {
  margin-right: 8px;
}
</style>
