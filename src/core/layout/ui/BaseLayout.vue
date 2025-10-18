<template>
  <div class="unified-layout" :class="{ 'unified-layout-collapsed': collapsed }" :style="cssVariables">
    <!-- 头部 -->
    <header v-if="showHeader" class="unified-layout-header">
      <AppHeader
        :config="config.header"
        :collapsed="collapsed"
        :user-info="userInfo"
        :notification-count="notificationCount"
        @toggle-sidebar="handleToggleSidebar"
        @icon-library-click="handleIconLibraryClick"
        @notification-click="handleNotificationClick"
        @settings-click="handleSettingsClick"
        @user-action="handleUserAction"
        @avatar-updated="handleAvatarUpdated"
      >
        <template #left>
          <slot name="header-left" />
        </template>
        <template #right>
          <slot name="header-right" />
        </template>
      </AppHeader>
    </header>

    <!-- 侧边栏 -->
    <aside
      v-if="showSidebar"
      class="unified-layout-sidebar"
      :class="{
        'unified-layout-sidebar-collapsed': collapsed,
        'mobile-open': mobileMenuOpen,
      }"
    >
      <slot name="sidebar" :collapsed="collapsed" />
    </aside>

    <!-- 主内容区 -->
    <main class="unified-layout-content">
      <div class="unified-layout-content-inner">
        <slot />
      </div>
    </main>

    <!-- 移动端遮罩层 -->
    <div v-if="isMobile && mobileMenuOpen" class="unified-layout-mask" @click="handleMaskClick" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import type { LayoutConfig, UserInfo } from '../types'
import AppHeader from './AppHeader.vue'

/**
 * BaseLayout Props
 */
interface Props {
  /** 布局配置 */
  config: LayoutConfig
  /** 是否显示侧边栏 */
  showSidebar?: boolean
  /** 是否显示头部 */
  showHeader?: boolean
  /** 初始折叠状态 */
  defaultCollapsed?: boolean
  /** 用户信息 */
  userInfo?: UserInfo
  /** 通知数量 */
  notificationCount?: number
}

const props = withDefaults(defineProps<Props>(), {
  showSidebar: true,
  showHeader: true,
  defaultCollapsed: false,
  notificationCount: 0,
})

/**
 * Emits
 */
const emit = defineEmits<{
  'toggle-sidebar': [collapsed: boolean]
  'icon-library-click': []
  'notification-click': []
  'settings-click': []
  'user-action': [action: string]
  'avatar-updated': [avatarUrl: string]
}>()

// 路由
const route = useRoute()

// 响应式状态
const collapsed = ref(props.defaultCollapsed)
const mobileMenuOpen = ref(false)
const isMobile = ref(false)

/**
 * 动态 CSS 变量
 */
const cssVariables = computed(() => {
  const theme = props.config.theme
  const sidebar = props.config.sidebar

  return {
    '--layout-primary-color': theme?.primaryColor || '#1890ff',
    '--layout-header-bg': theme?.headerBg || '#ffffff',
    '--layout-sidebar-bg': theme?.sidebarBg || '#001529',
    '--layout-content-bg': theme?.contentBg || '#f5f5f5',
    '--layout-text-primary': theme?.textPrimary || '#ffffff',
    '--layout-text-secondary': theme?.textSecondary || 'rgba(255, 255, 255, 0.65)',
    '--layout-text-color': theme?.textColor || '#333333',
    '--layout-bg-hover': theme?.bgHover || 'rgba(255, 255, 255, 0.08)',
    '--layout-border-color': theme?.borderColor || 'rgba(0, 0, 0, 0.06)',
    '--layout-transition-duration': theme?.transitionDuration || '0.3s',
    '--layout-transition-timing': theme?.transitionTiming || 'cubic-bezier(0.4, 0, 0.2, 1)',
    '--layout-sidebar-width': `${sidebar?.width || 240}px`,
    '--layout-sidebar-collapsed-width': `${sidebar?.collapsedWidth || 64}px`,
  }
})

/**
 * 检测是否为移动端
 */
const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  if (isMobile.value) {
    collapsed.value = true
  }
}

/**
 * 处理侧边栏切换
 */
const handleToggleSidebar = () => {
  collapsed.value = !collapsed.value

  if (isMobile.value) {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }

  emit('toggle-sidebar', collapsed.value)
}

/**
 * 处理图标库点击
 */
const handleIconLibraryClick = () => {
  emit('icon-library-click')
}

/**
 * 处理通知点击
 */
const handleNotificationClick = () => {
  emit('notification-click')
}

/**
 * 处理设置点击
 */
const handleSettingsClick = () => {
  emit('settings-click')
}

/**
 * 处理用户操作
 */
const handleUserAction = (action: string) => {
  emit('user-action', action)
}

/**
 * 处理头像更新
 */
const handleAvatarUpdated = (avatarUrl: string) => {
  emit('avatar-updated', avatarUrl)
}

/**
 * 处理遮罩层点击 (移动端)
 */
const handleMaskClick = () => {
  mobileMenuOpen.value = false
}

/**
 * 监听窗口大小变化
 */
const handleResize = () => {
  checkMobile()
}

/**
 * 组件挂载
 */
onMounted(() => {
  checkMobile()
  window.addEventListener('resize', handleResize)
})

/**
 * 组件卸载
 */
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

/**
 * 暴露给父组件的方法和状态
 */
defineExpose({
  collapsed,
  toggleSidebar: handleToggleSidebar,
})
</script>

<style scoped>
.unified-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--layout-content-bg, #f5f5f5);
  overflow: hidden;
}

.unified-layout-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  height: 64px;
  background: var(--layout-header-bg);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all var(--layout-transition-duration);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.unified-layout-sidebar {
  position: fixed;
  top: 64px;
  left: 0;
  bottom: 0;
  width: var(--layout-sidebar-width, 240px);
  z-index: 999;
  background: var(--layout-sidebar-bg);
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.06);
  transition: width var(--layout-transition-duration);
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.unified-layout.unified-layout-collapsed .unified-layout-sidebar {
  width: var(--layout-sidebar-collapsed-width, 64px);
}

.unified-layout-content {
  margin-top: 64px;
  margin-left: var(--layout-sidebar-width, 240px);
  min-height: calc(100vh - 64px);
  transition: margin-left var(--layout-transition-duration);
  background: var(--layout-content-bg, #f5f5f5);
  overflow-y: auto;
}

.unified-layout-content-inner {
  padding: 24px;
  min-height: 100%;
  background: transparent;
}

.unified-layout.unified-layout-collapsed .unified-layout-content {
  margin-left: var(--layout-sidebar-collapsed-width, 64px);
}

/* 移动端遮罩层 */
.unified-layout-mask {
  position: fixed;
  top: 64px;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 998;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-layout-sidebar {
    transform: translateX(-100%);
    box-shadow: 4px 0 12px rgba(0, 0, 0, 0.15);
  }

  .unified-layout-sidebar.mobile-open {
    transform: translateX(0);
  }

  .unified-layout-content {
    margin-left: 0;
  }

  .unified-layout-content-inner {
    padding: 16px;
  }
}

/* 滚动条样式 */
.unified-layout-content::-webkit-scrollbar {
  width: 6px;
}

.unified-layout-content::-webkit-scrollbar-track {
  background: transparent;
}

.unified-layout-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.unified-layout-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
