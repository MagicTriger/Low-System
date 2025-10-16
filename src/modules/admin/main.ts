import { AppInit } from '@/core/index'
import { routes, setupRouterGuards, registerDynamicRoutes } from './router'
import AdminApp from './App.vue'
import { initializeIconLibraries } from '@/core/renderer/icons'
import { menuApiService } from '@/core/api/menu'
import { permission, role } from '@/core/directives/permission'

// 初始化图标库
initializeIconLibraries()

// 初始化管理端应用
;(async () => {
  const { app, router } = await AppInit('#app', routes, [], async app => {
    app.component('AdminApp', AdminApp)

    // 注册权限指令
    app.directive('permission', permission)
    app.directive('role', role)

    // 开发环境配置
    if (import.meta.env.DEV) {
      console.log('✅ 管理端模块已启动')
      console.log('✅ 图标库已初始化')
      console.log('✅ 认证状态已自动恢复')
    }
  })

  // 设置路由守卫
  setupRouterGuards(router)

  // 加载菜单树并注册动态路由
  try {
    if (import.meta.env.DEV) {
      console.log('🔄 正在加载菜单树...')
    }

    const response = await menuApiService.getMenuTree()

    if (response.success && response.data) {
      // 注册动态路由
      registerDynamicRoutes(router, response.data)

      if (import.meta.env.DEV) {
        console.log('✅ 菜单树加载成功')
        console.log('✅ 动态路由注册完成')
      }
    } else {
      console.warn('⚠️ 菜单树加载失败，使用默认菜单')
    }
  } catch (error) {
    console.error('❌ 菜单树加载失败:', error)
    console.warn('⚠️ 将使用默认菜单')
  }

  // 开发环境配置
  if (import.meta.env.DEV) {
    console.log('📍 当前环境:', import.meta.env.MODE)
    console.log('🌐 API地址:', import.meta.env.VITE_SERVICE_URL)
  }
})()
