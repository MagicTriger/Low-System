<template>
  <BaseLayout
    :config="layoutConfig"
    :menu-data="adminMenuTree"
    :user-info="userInfo"
    @menu-click="handleMenuClick"
    @icon-library-click="handleIconLibraryClick"
    @notification-click="handleNotificationClick"
    @settings-click="handleSettingsClick"
    @user-action="handleUserAction"
    @avatar-updated="handleAvatarUpdated"
  >
    <!-- 内容区 -->
    <router-view v-slot="{ Component }">
      <transition name="fade" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useModule } from '@/core/state/helpers'
import type { MenuTreeNode } from '@/core/api/menu'
import type { UserInfo } from '@/core/layout/types'

// 导入统一布局组件和配置
import { BaseLayout } from '@/core/layout/ui'
import { getAdminLayoutConfig } from '../config/layout'

// 响应式数据
const adminMenuTree = ref<MenuTreeNode[]>([])
const loading = ref(false)

// 路由
const router = useRouter()

// 状态管理
const resourceModule = useModule('resource')
const authModule = useModule('auth')

// 布局配置
const layoutConfig = computed(() => {
  const config = getAdminLayoutConfig()
  // 动态更新用户信息
  if (config.sidebar.userInfo && authModule.state.user) {
    config.sidebar.userInfo = {
      name: authModule.state.user.username || '管理员',
      avatar: authModule.state.user.avatar || '',
      role: authModule.state.user.role || '系统管理员',
    }
  }
  return config
})

// 用户信息
const userInfo = computed<UserInfo | undefined>(() => {
  if (!authModule.state.user) return undefined
  return {
    name: authModule.state.user.username || '管理员',
    avatar: authModule.state.user.avatar || '',
    role: authModule.state.user.role || '系统管理员',
  }
})

// 加载管理端菜单树
const loadAdminMenuTree = async () => {
  try {
    loading.value = true
    await resourceModule.dispatch('fetchAdminMenuTree')
    adminMenuTree.value = resourceModule.state.adminMenuTree
  } catch (error) {
    console.error('加载管理端菜单失败:', error)
    message.error('加载菜单失败')
    adminMenuTree.value = []
  } finally {
    loading.value = false
  }
}

// 处理菜单点击
const handleMenuClick = (menuItem: MenuTreeNode) => {
  if (menuItem.path) {
    router.push(menuItem.path)
  }
}

// 处理图标库点击
const handleIconLibraryClick = () => {
  // 管理端不显示图标库
}

// 处理通知点击
const handleNotificationClick = () => {
  message.info('通知功能开发中')
}

// 处理设置点击
const handleSettingsClick = () => {
  router.push('/admin/settings')
}

// 处理用户操作
const handleUserAction = async (action: string) => {
  switch (action) {
    case 'profile':
      router.push('/admin/profile')
      break
    case 'avatar':
      // 头像管理由 UserDropdown 内部处理
      break
    case 'settings':
      router.push('/admin/settings')
      break
    case 'logout':
      try {
        await authModule.dispatch('logout')
        message.success('退出登录成功')
        router.push('/admin/login')
      } catch (error) {
        console.error('退出登录失败:', error)
        message.error('退出登录失败')
      }
      break
  }
}

// 处理头像更新
const handleAvatarUpdated = async (avatarUrl: string) => {
  try {
    // 更新状态管理
    await authModule.dispatch('updateUserAvatar', avatarUrl)

    // 显示成功提示 - 优化反馈时机
    message.success({
      content: '头像更新成功',
      duration: 2,
    })
  } catch (error) {
    console.error('更新头像失败:', error)
    handleAvatarError(error)
  }
}

// 统一错误处理函数
const handleAvatarError = (error: any) => {
  console.error('头像操作失败:', error)

  let errorMessage = '操作失败'
  let duration = 3

  if (error.response) {
    const { status, data } = error.response

    switch (status) {
      case 400:
        errorMessage = data.message || '请求参数错误'
        break
      case 401:
        errorMessage = '认证失败，请重新登录'
        duration = 4
        setTimeout(() => {
          router.push('/admin/login')
        }, 2000)
        break
      case 403:
        errorMessage = '权限不足'
        break
      case 413:
        errorMessage = '文件大小超过限制（最大2MB）'
        break
      case 415:
        errorMessage = '不支持的文件类型，请上传 JPG、PNG 或 GIF 格式'
        duration = 4
        break
      case 500:
        errorMessage = '服务器错误，请稍后重试'
        break
      default:
        errorMessage = data.message || '操作失败，请稍后重试'
    }
  } else if (error.request) {
    errorMessage = '网络连接失败，请检查网络设置'
    duration = 4
  } else {
    errorMessage = error.message || '操作失败'
  }

  message.error({
    content: errorMessage,
    duration,
  })
}

// 组件挂载时加载菜单
onMounted(() => {
  loadAdminMenuTree()
})
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
</style>
