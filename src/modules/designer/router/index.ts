import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'
import { notifyWarning, notifyPermissionError } from '@/core/notification'

// 获取StateManager实例
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  throw new Error('StateManager not initialized')
}

// 使用完整的设计器组件
const Layout = () => import('../views/Layout.vue')
const ResourceManagement = () => import('../views/ResourceManagement.vue')

export const routes: RouteRecordRaw[] = [
  // 设计端根路径重定向
  {
    path: '/',
    redirect: () => {
      // 检查是否已登录
      const token = localStorage.getItem('token')
      return token ? '/designer/resource' : '/designer/login'
    },
  },
  // 设计端登录页 (独立路由)
  {
    path: '/designer/login',
    name: 'DesignerLogin',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '设计端登录',
      requiresAuth: false,
    },
  },
  // 设计端主布局
  {
    path: '/designer',
    component: Layout,
    redirect: '/designer/resource',
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'resource',
        name: 'DesignerResourceManagement',
        component: ResourceManagement,
        meta: {
          title: '资源管理',
          requiresAuth: true,
        },
      },
    ],
  },
  // 设计器页面 (独立路由,不在布局内)
  {
    path: '/designer/resource/:url',
    name: 'DesignerEditor',
    component: () => import('../views/DesignerNew.vue'),
    meta: {
      title: '设计器',
      requiresAuth: true,
    },
  },
  // 预览页面 (独立路由)
  {
    path: '/preview/:id',
    name: 'DesignerPreview',
    component: () => import('../views/Preview.vue'),
    meta: {
      title: '预览页面',
      requiresAuth: false,
    },
  },
  // 设计端 404 页面
  {
    path: '/designer/:pathMatch(.*)*',
    name: 'DesignerNotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面不存在',
    },
  },
]

// 创建路由实例
export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 定义错误类型
class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

class PermissionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PermissionError'
  }
}

// 路由守卫
router.beforeEach(async (to, _from, next) => {
  try {
    const stateManager = getStateManager()

    // 恢复认证状态（如果需要）
    const authState = stateManager.getState('auth')
    if (!authState.isAuthenticated) {
      try {
        await stateManager.dispatch('auth/restoreAuth')
      } catch (error) {
        // 恢复认证失败，清除可能损坏的认证数据
        localStorage.removeItem('token')
        localStorage.removeItem('username')
        throw new AuthError('认证状态恢复失败')
      }
    }

    const isAuthenticated = stateManager.getState('auth').isAuthenticated
    const requiresAuth = to.meta?.requiresAuth !== false // 默认需要认证

    // 如果需要认证但未登录，跳转到登录页
    if (requiresAuth && !isAuthenticated) {
      if (to.path !== '/designer/login') {
        notifyWarning('请先登录', '您需要登录后才能访问该页面')
        next('/designer/login')
        return
      }
    }

    // 如果已登录但访问登录页，跳转到首页
    if (isAuthenticated && to.path === '/designer/login') {
      next('/designer/resource')
      return
    }

    // 权限检查
    if (to.meta?.permissions && Array.isArray(to.meta.permissions)) {
      const permissionInfo = stateManager.getState('auth').permissionInfo
      const hasPermission = to.meta.permissions.some(p => permissionInfo?.permissions.includes(p))
      if (!hasPermission) {
        notifyPermissionError(to.meta.title as string)
        throw new PermissionError(`缺少访问 ${to.path} 的权限`)
      }
    }

    next()
  } catch (error) {
    // 根据错误类型进行不同处理
    if (error instanceof AuthError) {
      // 认证错误，跳转到登录页
      if (to.path !== '/designer/login') {
        next('/designer/login')
      } else {
        next()
      }
    } else if (error instanceof PermissionError) {
      // 权限错误，阻止导航
      next(false)
    } else {
      // 其他未知错误，允许继续导航
      next()
    }
  }
})

// 设置页面标题
router.afterEach(to => {
  document.title = (to.meta.title as string) || '低代码平台'
})

export default router
