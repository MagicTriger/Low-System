import type { Router, RouteRecordRaw } from 'vue-router'
import type { MenuTreeNode } from '@/core/api/menu'

const Layout = () => import('../views/Layout.vue')
const Dashboard = () => import('../views/Dashboard.vue')
const Login = () => import('../views/Login.vue')
const NotFound = () => import('../views/NotFound.vue')

/**
 * 基础路由配置 (管理端专用)
 */
export const routes: RouteRecordRaw[] = [
  // 根路径重定向到管理端登录页
  {
    path: '/',
    redirect: '/admin/login',
  },
  // 管理端登录页
  {
    path: '/admin/login',
    name: 'AdminLogin',
    component: Login,
    meta: { title: '管理端登录', requiresAuth: false },
  },
  // 管理端主布局
  {
    path: '/admin',
    name: 'AdminLayout',
    component: Layout,
    redirect: '/admin/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: Dashboard,
        meta: { title: '仪表板', icon: 'dashboard' },
      },
    ],
  },
  // 管理端 404 页面
  {
    path: '/admin/:pathMatch(.*)*',
    name: 'AdminNotFound',
    component: NotFound,
    meta: { title: '页面不存在' },
  },
]

/**
 * 从菜单树生成路由配置
 */
export function generateRoutesFromMenu(nodes: MenuTreeNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const node of nodes) {
    // 只处理页面类型的节点
    if (node.nodeType === 2 && node.path) {
      const route: RouteRecordRaw = {
        path: node.path.startsWith('/') ? node.path.slice(1) : node.path,
        name: node.menuCode,
        component: () => import(`../views/${node.meta || 'Default'}.vue`).catch(() => import('../views/NotFound.vue')),
        meta: {
          title: node.name,
          icon: node.icon,
          menuCode: node.menuCode,
          module: node.module,
        },
      }
      routes.push(route)
    }

    // 递归处理子节点
    if (node.children && node.children.length > 0) {
      routes.push(...generateRoutesFromMenu(node.children))
    }
  }

  return routes
}

/**
 * 注册动态路由
 */
export function registerDynamicRoutes(router: Router, menuTree: MenuTreeNode[]): void {
  try {
    const dynamicRoutes = generateRoutesFromMenu(menuTree)

    // 将动态路由添加到 AdminLayout 的 children 中
    dynamicRoutes.forEach(route => {
      router.addRoute('AdminLayout', route)
    })

    if (import.meta.env.DEV) {
      console.log('✅ 动态路由注册成功:', dynamicRoutes.length, '个路由')
    }
  } catch (error) {
    console.error('❌ 动态路由注册失败:', error)
  }
}

/**
 * 设置路由守卫
 */
export function setupRouterGuards(router: Router): void {
  // 全局前置守卫
  router.beforeEach((to, from, next) => {
    // 设置页面标题
    if (to.meta.title) {
      document.title = `${to.meta.title} - 资源管理系统`
    }

    // 检查是否需要认证
    const requiresAuth = to.meta.requiresAuth !== false

    if (requiresAuth) {
      // 检查是否已登录
      const token = localStorage.getItem('access_token')

      if (!token) {
        // 未登录，跳转到管理端登录页
        next({
          path: '/admin/login',
          query: { redirect: to.fullPath },
        })
        return
      }

      // TODO: 验证 token 有效性
      // 这里可以调用 API 验证 token
    }

    next()
  })

  // 全局后置钩子
  router.afterEach((to, from) => {
    // 页面切换后的处理
    if (import.meta.env.DEV) {
      console.log('路由切换:', from.path, '->', to.path)
    }
  })

  // 全局错误处理
  router.onError(error => {
    console.error('路由错误:', error)
  })
}
