<template>
  <BaseLayout
    :config="layoutConfig"
    :user-info="userInfo"
    :notification-count="notificationCount"
    @icon-library-click="handleIconLibraryClick"
    @notification-click="handleNotificationClick"
    @settings-click="handleSettingsClick"
    @user-action="handleUserAction"
  >
    <!-- 侧边栏 -->
    <template #sidebar="{ collapsed }">
      <div class="sidebar-container">
        <!-- 用户头像区域 -->
        <div class="user-avatar-section" :class="{ collapsed }">
          <a-avatar :size="collapsed ? 40 : 64" :style="{ backgroundColor: '#f6bb42' }">
            <template v-if="userInfo?.avatar">
              <img :src="userInfo.avatar" alt="用户头像" />
            </template>
            <template v-else>
              {{ userInitial }}
            </template>
          </a-avatar>
          <div v-if="!collapsed" class="user-info">
            <div class="user-name">{{ userInfo?.name || '用户' }}</div>
            <div class="user-role">{{ userInfo?.role || '设计师' }}</div>
          </div>
        </div>

        <!-- 菜单区域 -->
        <a-menu v-model:selectedKeys="selectedKeys" mode="inline" theme="dark" :inline-collapsed="collapsed" class="sidebar-menu">
          <a-menu-item key="/designer/resource" @click="handleMenuClick('/designer/resource')">
            <template #icon>
              <FolderOutlined />
            </template>
            <span>资源管理</span>
          </a-menu-item>
        </a-menu>
      </div>
    </template>

    <!-- 内容区 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </BaseLayout>

  <!-- 图标库模态框 -->
  <a-modal v-model:open="showIconLibrary" title="图标库" width="900px" :footer="null" :destroy-on-close="true">
    <IconPicker library-id="antd" @select="handleIconSelect" />
  </a-modal>

  <!-- 用户设置弹窗 -->
  <UserSettingsModal v-model:visible="userSettingsVisible" @success="handleUserSettingsSuccess" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { FolderOutlined } from '@ant-design/icons-vue'

// 导入统一布局组件和配置
import { BaseLayout } from '@/core/layout/ui'
import { getDesignerLayoutConfig } from '../config/layout'
import IconPicker from '@/core/renderer/icons/IconPicker.vue'
import UserSettingsModal from '../components/UserSettingsModal.vue'

const router = useRouter()
const route = useRoute()
const showIconLibrary = ref(false)
const userSettingsVisible = ref(false)
const notificationCount = ref(3)
const selectedKeys = ref<string[]>([route.path])

// 用户信息
// 获取状态管理器
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

// 用户信息 - 使用 ref 而不是 computed 来确保响应性
const username = ref(localStorage.getItem('username') || '用户')
const userInitial = computed(() => {
  const name = username.value
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.charAt(0)
  }
  return name.charAt(0).toUpperCase()
})

// 用户信息对象 - 传递给BaseLayout
// 使用ref来存储用户信息，确保响应式更新
const userInfo = ref({
  name: '用户',
  avatar: undefined as string | undefined,
  role: '设计师',
})

// 加载用户信息的函数
const loadUserInfo = () => {
  const stateManager = getStateManager()
  if (stateManager) {
    const authState = stateManager.getState('auth')
    if (authState?.userInfo) {
      // 从permissionInfo获取角色名称
      const permissionInfo = authState.permissionInfo
      const roleNames = permissionInfo?.roleNames || []
      const roleName = roleNames.length > 0 ? roleNames.join(', ') : '设计师'

      userInfo.value = {
        name: authState.userInfo.displayName || authState.userInfo.username || '用户',
        avatar: authState.userInfo.avatar,
        role: roleName,
      }

      console.log('🔍 [Designer Layout] 用户信息已加载:', userInfo.value)
    } else {
      console.warn('⚠️ [Designer Layout] 未找到用户信息，使用默认值')
      // 如果没有 userInfo，尝试从 localStorage 获取
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr && userInfoStr !== 'undefined') {
        try {
          const storedUserInfo = JSON.parse(userInfoStr)
          const permissionInfoStr = localStorage.getItem('permissionInfo')
          let roleName = '设计师'

          if (permissionInfoStr && permissionInfoStr !== 'undefined') {
            try {
              const permissionInfo = JSON.parse(permissionInfoStr)
              const roleNames = permissionInfo?.roleNames || []
              roleName = roleNames.length > 0 ? roleNames.join(', ') : '设计师'
            } catch (e) {
              console.warn('⚠️ [Designer Layout] permissionInfo 解析失败')
            }
          }

          userInfo.value = {
            name: storedUserInfo.displayName || storedUserInfo.username || '用户',
            avatar: storedUserInfo.avatar,
            role: roleName,
          }
          console.log('🔍 [Designer Layout] 从 localStorage 加载用户信息:', userInfo.value)
        } catch (error) {
          console.error('❌ [Designer Layout] 解析 localStorage 用户信息失败:', error)
        }
      }
    }
  }
}

// 在组件挂载时加载用户信息
onMounted(() => {
  loadUserInfo()

  // 监听 auth state 变化，当 userInfo 更新时重新加载
  const stateManager = getStateManager()
  if (stateManager) {
    // 使用定时器定期检查 auth state 是否更新（简单的响应式方案）
    const checkInterval = setInterval(() => {
      const authState = stateManager.getState('auth')
      if (authState?.userInfo && !userInfo.value.name) {
        loadUserInfo()
        clearInterval(checkInterval)
      }
    }, 100)

    // 5秒后停止检查
    setTimeout(() => clearInterval(checkInterval), 5000)
  }
})

// 布局配置
const layoutConfig = computed(() => getDesignerLayoutConfig())

// 处理菜单点击
const handleMenuClick = (path: string) => {
  router.push(path)
  selectedKeys.value = [path]
}

// 处理图标库点击
const handleIconLibraryClick = () => {
  showIconLibrary.value = true
}

// 处理通知点击
const handleNotificationClick = () => {
  message.info('通知功能开发中')
}

// 处理设置点击
const handleSettingsClick = () => {
  message.info('设置功能开发中')
}

// 处理用户操作
const handleUserAction = (action: string) => {
  switch (action) {
    case 'profile':
      message.info('个人中心功能开发中')
      break
    case 'settings':
      userSettingsVisible.value = true
      break
    case 'logout':
      const stateManager = getStateManager()
      if (stateManager) {
        stateManager
          .dispatch('auth/logout')
          .then(() => {
            message.success('退出登录成功')
            router.push('/designer/login')
          })
          .catch((error: any) => {
            message.error('退出登录失败: ' + (error.message || '未知错误'))
          })
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        message.success('退出登录成功')
        router.push('/designer/login')
      }
      break
  }
}

// 用户设置成功回调
const handleUserSettingsSuccess = () => {
  message.success('用户信息已更新')
}

// 处理图标选择
const handleIconSelect = (icon: any) => {
  // 复制图标名称到剪贴板
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard
      .writeText(icon.name)
      .then(() => {
        message.success(`图标名称已复制: ${icon.name}`)
        showIconLibrary.value = false
      })
      .catch(() => {
        message.warning('复制失败，请手动复制图标名称')
      })
  } else {
    message.warning('您的浏览器不支持自动复制，请手动复制图标名称')
  }
}
</script>

<style scoped>
/* 过渡动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 侧边栏容器 */
.sidebar-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #001529;
}

/* 用户头像区域 */
.user-avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s;
}

.user-avatar-section.collapsed {
  padding: 16px 12px;
}

.user-info {
  margin-top: 12px;
  text-align: center;
  width: 100%;
}

.user-name {
  font-size: 14px;
  font-weight: 500;
  color: #fff;
  margin-bottom: 4px;
}

.user-role {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.65);
}

/* 菜单区域 */
.sidebar-menu {
  flex: 1;
  border-right: 0;
  overflow-y: auto;
}

/* 菜单选中项 - 黄色 */
.sidebar-menu :deep(.ant-menu-item-selected) {
  background-color: #f6bb42 !important;
  color: #000 !important;
}

.sidebar-menu :deep(.ant-menu-item-selected::after) {
  border-right-color: #f6bb42 !important;
}

/* 菜单项 hover 效果 */
.sidebar-menu :deep(.ant-menu-item:hover) {
  background-color: rgba(246, 187, 66, 0.2) !important;
  color: #f6bb42 !important;
}

/* 菜单图标颜色 */
.sidebar-menu :deep(.ant-menu-item-selected .anticon) {
  color: #000 !important;
}

.sidebar-menu :deep(.ant-menu-item:hover .anticon) {
  color: #f6bb42 !important;
}
</style>
