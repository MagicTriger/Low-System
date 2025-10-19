import type { Router, RouteRecordRaw } from 'vue-router'
import type { MenuTreeNode } from '@/core/api/menu'

const Layout = () => import('../views/Layout.vue')
const Login = () => import('../views/Login.vue')
const NotFound = () => import('../views/NotFound.vue')
const DynamicPage = () => import('../views/DynamicPage.vue')

/**
 * 基础路由配置 (管理端专用)
 * 只包含登录页和布局，所有业务页面都通过动态路由从设计端资源生成
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
    meta: { requiresAuth: true },
    children: [
      // 404 页面作为 admin 的子路由，这样只会匹配 /admin 下未定义的路由
      {
        path: ':pathMatch(.*)*',
        name: 'AdminNotFound',
        component: NotFound,
        meta: { title: '页面不存在' },
      },
    ],
  },
]

/**
 * 从菜单树生成路由配置
 * 根据设计端资源管理中的菜单数据动态生成所有业务路由
 */
export function generateRoutesFromMenu(nodes: MenuTreeNode[]): RouteRecordRaw[] {
  const routes: RouteRecordRaw[] = []

  for (const node of nodes) {
    console.log('[Router] 处理菜单节点:', {
      id: node.id,
      code: node.code,
      name: node.name,
      type: node.type,
      url: node.url,
      path: node.path,
      hasChildren: !!node.children?.length,
    })

    // 只处理页面类型的节点（CUSTOM_PAGE 和 MODEL_PAGE）
    const isPageType = node.type === 'CUSTOM_PAGE' || node.type === 'MODEL_PAGE' || node.type === 'MENU'

    // 使用 url 或 path 作为路由路径
    const routeUrl = node.url || node.path

    if (isPageType && routeUrl) {
      // 生成路由路径（移除开头的 /admin/，因为是 /admin 的子路由）
      let routePath = routeUrl
      if (routePath.startsWith('/admin/')) {
        routePath = routePath.slice(7) // 移除 '/admin/' -> 'manager_user'
      } else if (routePath.startsWith('/admin')) {
        routePath = routePath.slice(6) // 移除 '/admin' -> 'manager_user'
      } else if (routePath.startsWith('/')) {
        routePath = routePath.slice(1) // 移除开头的 '/' -> 'manager_user'
      }
      // 如果路径为空，跳过
      if (!routePath) {
        console.log('[Router] ⏭️ 跳过节点: 路径为空')
        continue
      }

      // 生成路由名称（使用 code 作为唯一标识）
      const routeName = `Admin_${node.code}`

      console.log('[Router] ✅ 生成动态路由:', {
        name: routeName,
        path: routePath,
        fullPath: `/admin/${routePath}`,
        title: node.name,
        type: node.type,
        originalUrl: routeUrl,
      })

      const route: RouteRecordRaw = {
        path: routePath,
        name: routeName,
        component: DynamicPage, // 使用统一的动态页面组件
        meta: {
          title: node.name,
          icon: node.icon,
          type: node.type,
          code: node.code,
          menuId: node.id,
          url: node.url,
          path: node.path,
          // 传递资源元数据给动态页面
          resourceData: {
            id: node.id,
            code: node.code,
            name: node.name,
            type: node.type,
            url: node.url,
            path: node.path,
            icon: node.icon,
            sortOrder: node.sortOrder,
            parentId: node.parentId,
            modelId: node.modelId,
            modelActionId: node.modelActionId,
          },
        },
      }

      routes.push(route)
    } else {
      console.log('[Router] ⏭️ 跳过节点:', {
        reason: !isPageType ? '不是页面类型' : '没有URL',
        type: node.type,
        hasUrl: !!routeUrl,
      })
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
 * 从后端获取的菜单树生成路由并注册到 Vue Router
 */
export function registerDynamicRoutes(router: Router, menuTree: MenuTreeNode[]): void {
  try {
    console.log('[Router] 开始注册动态路由，菜单树:', menuTree)

    const dynamicRoutes = generateRoutesFromMenu(menuTree)

    console.log('[Router] 生成的动态路由:', dynamicRoutes)

    // 先移除 AdminLayout 的 404 子路由（如果存在）
    const notFoundRoute = router.getRoutes().find(r => r.name === 'AdminNotFound')
    if (notFoundRoute) {
      console.log('[Router] 临时移除 404 路由，以便添加动态路由')
      router.removeRoute('AdminNotFound')
    }

    // 将动态路由添加到 AdminLayout 的 children 中
    dynamicRoutes.forEach(route => {
      console.log('[Router] 添加子路由:', route.path, '到 AdminLayout')
      router.addRoute('AdminLayout', route)
    })

    // 重新添加 404 路由，确保它是最后一个
    if (notFoundRoute) {
      console.log('[Router] 重新添加 404 路由作为最后一个子路由')
      router.addRoute('AdminLayout', {
        path: ':pathMatch(.*)*',
        name: 'AdminNotFound',
        component: NotFound,
        meta: { title: '页面不存在' },
      })
    }

    if (import.meta.env.DEV) {
      console.log('✅ 动态路由注册成功:', dynamicRoutes.length, '个路由')
      console.log(
        '📋 路由列表:',
        dynamicRoutes.map(r => ({ name: r.name, path: r.path, title: r.meta?.title }))
      )

      // 打印所有已注册的路由
      const allRoutes = router.getRoutes()
      console.log('📋 所有路由:')
      allRoutes.forEach(r => {
        console.log(`  - ${String(r.name)}: ${r.path}`)
      })

      // 特别打印 AdminLayout 的子路由
      const adminLayout = allRoutes.find(r => r.name === 'AdminLayout')
      if (adminLayout && adminLayout.children) {
        console.log('📋 AdminLayout 的子路由:')
        adminLayout.children.forEach(child => {
          console.log(`  - ${String(child.name)}: ${child.path} (完整路径: ${adminLayout.path}/${child.path})`)
        })
      }
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
      const token = localStorage.getItem('accessToken')

      if (!token) {
        // 未登录，跳转到管理端登录页
        next({
          path: '/admin/login',
          query: { redirect: to.fullPath },
        })
        return
      }
    }

    next()
  })

  // 全局后置钩子
  router.afterEach(to => {
    // 页面切换后的处理
    if (import.meta.env.DEV) {
      console.log('[Router] 路由切换到:', to.path, to.meta)
    }
  })

  // 全局错误处理
  router.onError(error => {
    console.error('[Router] 路由错误:', error)
  })
}
