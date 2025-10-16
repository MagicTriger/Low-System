import { createApp, type App } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import '@core/assets/index.css'
import { global } from './global'
import { bootstrapMigration } from './migration/bootstrap'
import { initializeStateModules } from './state/modules'

// 应用包装器组件
import AppWrapper from './components/AppWrapper.vue'

/**
 * 创建应用路由
 */
function createAppRouter(rootRoutes: RouteRecordRaw[] = [], childrenRoutes: RouteRecordRaw[] = []) {
  const routes: RouteRecordRaw[] = [
    {
      path: '/',
      redirect: '/dashboard',
    },
    ...rootRoutes,
    ...childrenRoutes,
  ]

  return createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      } else {
        return { top: 0 }
      }
    },
  })
}

/**
 * 初始化应用配置
 */
function init(app: App<Element>) {
  // 全局属性
  app.config.globalProperties.$global = global

  // 开发环境配置
  if (import.meta.env.DEV) {
    app.config.performance = true
    ;(app.config as any).devtools = true
  }

  // 错误处理
  app.config.errorHandler = (err, instance, info) => {
    console.error('应用错误:', err)
    console.error('错误信息:', info)
    console.error('组件实例:', instance)
  }

  // 警告处理
  app.config.warnHandler = (msg, instance, trace) => {
    console.warn('应用警告:', msg)
    console.warn('组件实例:', instance)
    console.warn('组件追踪:', trace)
  }
}

/**
 * 注册PWA
 */
function registerPWA() {
  if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then(registration => {
          console.log('SW registered: ', registration)
        })
        .catch(registrationError => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

/**
 * 应用初始化函数
 * @param mountpoint 挂载点选择器
 * @param rootRoutes 根路由配置
 * @param childrenRoutes 子路由配置
 * @param beforeMount 挂载前回调
 */
export async function AppInit(
  mountpoint: string,
  rootRoutes: RouteRecordRaw[] = [],
  childrenRoutes: RouteRecordRaw[] = [],
  beforeMount?: (app: App<Element>) => void
) {
  // 初始化迁移系统
  try {
    await bootstrapMigration()
  } catch (error) {
    console.error('Failed to bootstrap migration system:', error)
    // 继续应用启动,不阻塞
  }

  // 设置页面标题
  document.title = global.title

  // 创建应用实例
  const app = createApp(AppWrapper)

  // 状态管理 (Pinia - 保留用于PiniaAdapter兼容性)
  // 注意：主要状态管理已迁移到StateManager
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)

  // UI组件库
  app.use(Antd)

  // 路由配置
  const router = createAppRouter(rootRoutes, childrenRoutes)
  app.use(router)

  // 初始化配置
  init(app)

  // 初始化状态模块（新的StateManager）
  try {
    await initializeStateModules()
    console.log('✅ State modules initialized')
  } catch (error) {
    console.error('Failed to initialize state modules:', error)
  }

  // 自定义初始化
  if (beforeMount) {
    await beforeMount(app)
  }

  // PWA注册
  registerPWA()

  // 挂载应用
  app.mount(mountpoint)

  return { app, router, pinia }
}

// 导出核心模块
export * from './global'
export * from './utils'
export * from './state/modules' // 新的状态模块
export * from './api'
export * from './engines'
export * from './renderer'
