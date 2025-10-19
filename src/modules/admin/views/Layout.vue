<template>
  <BaseLayout
    :config="layoutConfig"
    :user-info="userInfo"
    :notification-count="notificationCount"
    @icon-library-click="handleIconLibraryClick"
    @notification-click="handleNotificationClick"
    @settings-click="handleSettingsClick"
    @user-action="handleUserAction"
    @avatar-updated="handleAvatarUpdated"
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
            <div class="user-name">{{ userInfo?.name }}</div>
            <div class="user-role">{{ userInfo?.role }}</div>
          </div>
        </div>

        <!-- 菜单区域 -->
        <a-menu v-model:selectedKeys="selectedKeys" mode="inline" theme="dark" :inline-collapsed="collapsed" class="sidebar-menu">
          <a-menu-item v-for="item in adminMenuTree" :key="item.url" @click="handleMenuClick(item)">
            <template #icon>
              <component :is="getMenuIcon(item.icon)" />
            </template>
            <span>{{ item.name }}</span>
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
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { FolderOutlined, DashboardOutlined, TeamOutlined, FileTextOutlined } from '@ant-design/icons-vue'

// 导入统一布局组件和配置
import { BaseLayout } from '@/core/layout/ui'
import { getAdminLayoutConfig } from '../config/layout'
import { useModule } from '@/core/state/helpers'
import type { MenuTreeNode } from '@/core/api/menu'

const router = useRouter()
const route = useRoute()
const notificationCount = ref(3)
const selectedKeys = ref<string[]>([])

// 状态管理
const resourceModule = useModule('resource')
const authModule = useModule('auth')

// 响应式数据
const adminMenuTree = ref<MenuTreeNode[]>([])
const loading = ref(false)

// 用户信息
const userInfo = computed(() => {
  const user = authModule.state.userInfo
  const permissionInfo = authModule.state.permissionInfo

  // 调试日志
  console.log('🔍 [Layout] 用户信息:', user)
  console.log('🔍 [Layout] 权限信息:', permissionInfo)

  if (user) {
    // 从permissionInfo获取角色名称
    const roleNames = permissionInfo?.roleNames || []
    const roleName = roleNames.length > 0 ? roleNames.join(', ') : '管理员'

    console.log('🔍 [Layout] 角色名称数组:', roleNames)
    console.log('🔍 [Layout] 最终角色:', roleName)
    console.log('🔍 [Layout] 最终用户名:', user.displayName || user.username || '用户')

    return {
      name: user.displayName || user.username || '用户',
      avatar: user.avatar,
      role: roleName,
    }
  }

  console.warn('⚠️ [Layout] 用户信息为空，使用默认值')
  return {
    name: '用户',
    avatar: undefined,
    role: '管理员',
  }
})

// 用户名首字母
const userInitial = computed(() => {
  const name = userInfo.value.name
  if (/[\u4e00-\u9fa5]/.test(name)) {
    return name.charAt(0)
  }
  return name.charAt(0).toUpperCase()
})

// 布局配置
const layoutConfig = computed(() => getAdminLayoutConfig())

// 加载管理端菜单树
const loadAdminMenuTree = async () => {
  try {
    loading.value = true
    await resourceModule.dispatch('fetchAdminMenuTree')

    // 获取菜单数据并验证类型
    const menuData = resourceModule.state.adminMenuTree

    // 确保是数组
    if (Array.isArray(menuData)) {
      adminMenuTree.value = menuData
      console.log('📋 管理端菜单数据:', adminMenuTree.value)
      console.log('📊 菜单数量:', adminMenuTree.value.length)

      // 过滤掉无效的菜单项（没有名称的）
      adminMenuTree.value = adminMenuTree.value.filter(item => item.name && item.name.trim() !== '')
      console.log('✅ 过滤后的菜单数量:', adminMenuTree.value.length)

      // 注册动态路由
      if (adminMenuTree.value.length > 0) {
        const { registerDynamicRoutes } = await import('../router')
        registerDynamicRoutes(router, adminMenuTree.value)
        console.log('✅ 动态路由已注册')
      }
    } else {
      console.warn('⚠️ 菜单数据不是数组格式:', menuData)
      adminMenuTree.value = []
    }
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
  console.log('[Layout] 菜单点击:', menuItem)

  // 使用 url 或 path 作为路由路径
  const routeUrl = menuItem.url || menuItem.path

  if (routeUrl) {
    // 确保路径以 /admin 开头
    let targetPath = routeUrl
    if (!targetPath.startsWith('/admin')) {
      targetPath = `/admin/${targetPath.startsWith('/') ? targetPath.slice(1) : targetPath}`
    }

    console.log('[Layout] 跳转到:', targetPath)
    router.push(targetPath)
  } else {
    console.warn('[Layout] 菜单项没有URL:', menuItem)
  }
}

// 根据当前路由更新选中的菜单
const updateSelectedKeys = () => {
  const currentPath = route.path
  console.log('[Layout] 当前路由:', currentPath)

  // 查找匹配的菜单项
  const findMatchingMenu = (menus: MenuTreeNode[], path: string): string | null => {
    for (const menu of menus) {
      // 使用 url 或 path
      const routeUrl = menu.url || menu.path
      if (!routeUrl) continue

      // 构建完整路径
      let menuPath = routeUrl
      if (!menuPath.startsWith('/admin')) {
        menuPath = `/admin/${menuPath.startsWith('/') ? menuPath.slice(1) : menuPath}`
      }

      console.log('[Layout] 比较菜单路径:', menuPath, '当前路径:', path)

      if (menuPath === path) {
        return routeUrl
      }

      // 递归查找子菜单
      if (menu.children && menu.children.length > 0) {
        const found = findMatchingMenu(menu.children, path)
        if (found) return found
      }
    }
    return null
  }

  const matchedKey = findMatchingMenu(adminMenuTree.value, currentPath)
  if (matchedKey) {
    selectedKeys.value = [matchedKey]
    console.log('[Layout] 更新选中菜单:', selectedKeys.value)
  } else {
    selectedKeys.value = []
    console.log('[Layout] 没有匹配的菜单')
  }
}

// 监听路由变化
watch(
  () => route.path,
  () => {
    updateSelectedKeys()
  },
  { immediate: true }
)

// 获取菜单图标
const getMenuIcon = (iconName?: string) => {
  const iconMap: Record<string, any> = {
    dashboard: DashboardOutlined,
    folder: FolderOutlined,
    team: TeamOutlined,
    file: FileTextOutlined,
  }
  return iconMap[iconName || 'folder'] || FolderOutlined
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
    await authModule.dispatch('updateUserAvatar', avatarUrl)
    message.success('头像更新成功')
  } catch (error) {
    console.error('更新头像失败:', error)
    message.error('更新头像失败')
  }
}

// 组件挂载时加载菜单
onMounted(async () => {
  await loadAdminMenuTree()
  // 加载完菜单后更新选中状态
  updateSelectedKeys()
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
