<template>
  <div class="unified-layout-sidebar">
    <div v-if="$slots.top" class="unified-layout-sidebar-slot">
      <slot name="top" />
    </div>
    <div v-if="config.showUserInfo && config.userInfo" class="unified-layout-sider-user">
      <transition name="fade" mode="out-in">
        <div v-if="!collapsed" class="unified-layout-sider-user-info">
          <a-avatar
            :size="48"
            :src="config.userInfo.avatar"
            :style="{ backgroundColor: config.userInfo.avatar ? 'transparent' : '#f6bb42' }"
          >
            <template v-if="!config.userInfo.avatar">
              {{ getUserInitial(config.userInfo.name || '') }}
            </template>
          </a-avatar>
          <div class="unified-layout-sider-user-name">
            {{ config.userInfo.name }}
          </div>
          <div v-if="config.userInfo.role" class="unified-layout-sider-user-role">
            {{ config.userInfo.role }}
          </div>
        </div>
        <div v-else class="unified-layout-sider-user-collapsed">
          <a-avatar
            :size="32"
            :src="config.userInfo.avatar"
            :style="{ backgroundColor: config.userInfo.avatar ? 'transparent' : '#f6bb42' }"
          >
            <template v-if="!config.userInfo.avatar">
              {{ getUserInitial(config.userInfo.name || '') }}
            </template>
          </a-avatar>
        </div>
      </transition>
    </div>
    <div class="unified-layout-sidebar-menu">
      <DynamicMenu
        :menu-tree="menuData"
        :collapsed="collapsed"
        :selected-keys="selectedKeys"
        :mode="config.menuMode"
        :theme="config.theme"
        @menu-click="handleMenuClick"
      />
    </div>
    <div v-if="$slots.bottom" class="unified-layout-sidebar-slot">
      <slot name="bottom" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { SidebarConfig } from '../types'
import type { MenuTreeNode } from '@/core/api/menu'
import AppLogo from './AppLogo.vue'
import DynamicMenu from './DynamicMenu.vue'

interface Props {
  config: SidebarConfig
  collapsed: boolean
  menuData: MenuTreeNode[]
  selectedKeys?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  selectedKeys: () => [],
})

const emit = defineEmits<{
  'menu-click': [menuItem: MenuTreeNode]
  'menu-select': [keys: string[]]
}>()

const getUserInitial = (name: string): string => {
  if (!name) return 'U'
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.charAt(0)
  }
  return name.charAt(0).toUpperCase()
}

const handleMenuClick = (menuItem: MenuTreeNode) => {
  emit('menu-click', menuItem)
}
</script>

<style scoped>
.unified-layout-sidebar {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--layout-sidebar-bg);
}

.unified-layout-sidebar-slot {
  flex-shrink: 0;
}

.unified-layout-sidebar-menu {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.unified-layout-sidebar-menu::-webkit-scrollbar {
  width: 6px;
}

.unified-layout-sidebar-menu::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}

.unified-layout-sidebar-menu::-webkit-scrollbar-track {
  background: transparent;
}

.unified-layout-sider-user {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
}

.unified-layout-sider-user-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  width: 100%;
}

.unified-layout-sider-user-collapsed {
  display: flex;
  align-items: center;
  justify-content: center;
}

.unified-layout-sider-user-name {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 500;
  color: var(--layout-text-primary);
  text-align: center;
  word-break: break-all;
  line-height: 1.4;
}

.unified-layout-sider-user-role {
  margin-top: 4px;
  font-size: 12px;
  color: var(--layout-text-secondary);
  text-align: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--layout-transition-duration) var(--layout-transition-timing);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .unified-layout-sider-user {
    padding: 16px 12px;
  }

  .unified-layout-sider-user-name {
    font-size: 13px;
  }

  .unified-layout-sider-user-role {
    font-size: 11px;
  }
}
</style>
