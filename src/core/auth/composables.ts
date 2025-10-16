/**
 * 权限管理系统的 Vue 组合式 API
 * 方便在组件中使用权限功能
 */

import { ref, computed, reactive, watch, onUnmounted, readonly } from 'vue'
import type { Ref, ComputedRef } from 'vue'
import type {
  User,
  AuthToken,
  LoginCredentials,
  LoginResult,
  IAuthManager,
  IPermissionManager
} from './index'
import { AuthStatus } from './index'
import { AuthManager } from './AuthManager'
import { PermissionService } from './PermissionService'
import type { UserInfo } from '../../types/index'

/**
 * 认证状态组合式API
 */
export function useAuth(authManager: AuthManager) {
  const user = ref<User | UserInfo | null>(null)
  const status = ref<AuthStatus>(AuthStatus.UNAUTHENTICATED)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 监听认证状态变化
  const unsubscribe = authManager.onAuthStateChange((newStatus, newUser) => {
    status.value = newStatus
    user.value = newUser || null
  })

  // 初始化状态
  user.value = authManager.getCurrentUser()
  status.value = authManager.getAuthStatus()

  /**
   * 登录
   */
  const login = async (credentials: LoginCredentials): Promise<LoginResult> => {
    loading.value = true
    error.value = null

    try {
      const result = await authManager.login(credentials)
      if (result.success) {
        user.value = result.user || null
        status.value = AuthStatus.AUTHENTICATED
      } else {
        error.value = result.message || 'Login failed'
      }
      return result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Login failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 登出
   */
  const logout = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      await authManager.logout()
      user.value = null
      status.value = AuthStatus.UNAUTHENTICATED
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Logout failed'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新令牌
   */
  const refreshToken = async (): Promise<boolean> => {
    loading.value = true
    error.value = null

    try {
      const token = await authManager.refreshToken()
      const success = !!token
      if (!success) {
        error.value = 'Token refresh failed'
      }
      return success
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Token refresh failed'
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null
  }

  // 计算属性
  const isAuthenticated = computed(() => status.value === 'authenticated')
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)

  // 清理函数
  onUnmounted(() => {
    unsubscribe()
  })

  return {
    // 状态
    user: readonly(user),
    status: readonly(status),
    loading: readonly(loading),
    error: readonly(error),

    // 计算属性
    isAuthenticated,
    isLoading,
    hasError,

    // 方法
    login,
    logout,
    refreshToken,
    clearError
  }
}

/**
 * 权限检查组合式API
 */
export function usePermissions(permissionService: PermissionService) {
  const permissions = ref<string[]>([])
  const roles = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * 检查单个权限
   */
  const hasPermission = async (permission: string, context?: any): Promise<boolean> => {
    try {
      return await permissionService.checkCurrentUserPermission(permission, context)
    } catch (err) {
      console.error('Permission check failed:', err)
      return false
    }
  }

  /**
   * 检查多个权限
   */
  const hasPermissions = async (permissionList: string[], context?: any): Promise<Record<string, boolean>> => {
    const results: Record<string, boolean> = {}
    
    try {
      const promises = permissionList.map(async (permission) => {
        const result = await hasPermission(permission, context)
        return { permission, result }
      })

      const resolvedResults = await Promise.all(promises)
      resolvedResults.forEach(({ permission, result }) => {
        results[permission] = result
      })
    } catch (err) {
      console.error('Permissions check failed:', err)
      permissionList.forEach(permission => {
        results[permission] = false
      })
    }

    return results
  }

  /**
   * 检查角色
   */
  const hasRole = async (roleCode: string): Promise<boolean> => {
    try {
      const currentUser = await permissionService.getCurrentUserPermissions()
      return currentUser.length > 0 // 简化实现
    } catch (err) {
      console.error('Role check failed:', err)
      return false
    }
  }

  /**
   * 检查资源访问权限
   */
  const canAccess = async (resource: string, action: string = 'read', context?: any): Promise<boolean> => {
    try {
      return await permissionService.checkResourceAccess('current', resource, action, context)
    } catch (err) {
      console.error('Resource access check failed:', err)
      return false
    }
  }

  /**
   * 加载用户权限
   */
  const loadPermissions = async (): Promise<void> => {
    loading.value = true
    error.value = null

    try {
      const userPermissions = await permissionService.getCurrentUserPermissions()
      permissions.value = userPermissions
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load permissions'
      permissions.value = []
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误
   */
  const clearError = () => {
    error.value = null
  }

  // 计算属性
  const isLoading = computed(() => loading.value)
  const hasError = computed(() => error.value !== null)
  const permissionCount = computed(() => permissions.value.length)

  return {
    // 状态
    permissions: readonly(permissions),
    roles: readonly(roles),
    loading: readonly(loading),
    error: readonly(error),

    // 计算属性
    isLoading,
    hasError,
    permissionCount,

    // 方法
    hasPermission,
    hasPermissions,
    hasRole,
    canAccess,
    loadPermissions,
    clearError
  }
}

/**
 * 响应式权限检查组合式API
 */
export function useReactivePermission(
  permissionService: PermissionService,
  permission: Ref<string> | string,
  context?: Ref<any> | any
) {
  const hasPermission = ref(false)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const permissionRef = typeof permission === 'string' ? ref(permission) : permission
  const contextRef = typeof context === 'object' && 'value' in context ? context : ref(context)

  /**
   * 检查权限
   */
  const checkPermission = async () => {
    loading.value = true
    error.value = null

    try {
      const result = await permissionService.checkCurrentUserPermission(
        permissionRef.value,
        contextRef.value
      )
      hasPermission.value = result
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Permission check failed'
      hasPermission.value = false
    } finally {
      loading.value = false
    }
  }

  // 监听权限和上下文变化
  watch([permissionRef, contextRef], checkPermission, { immediate: true })

  return {
    hasPermission: readonly(hasPermission),
    loading: readonly(loading),
    error: readonly(error),
    checkPermission
  }
}

/**
 * 权限守卫组合式API
 */
export function usePermissionGuard(permissionService: PermissionService) {
  /**
   * 权限守卫函数
   */
  const guard = async (
    permission: string,
    context?: any,
    options: {
      redirect?: string
      fallback?: () => void
      throwError?: boolean
    } = {}
  ): Promise<boolean> => {
    const { redirect, fallback, throwError = false } = options

    try {
      const hasPermission = await permissionService.checkCurrentUserPermission(permission, context)

      if (!hasPermission) {
        if (redirect && typeof window !== 'undefined') {
          window.location.href = redirect
          return false
        }

        if (fallback) {
          fallback()
          return false
        }

        if (throwError) {
          throw new Error(`Permission denied: ${permission}`)
        }

        return false
      }

      return true
    } catch (err) {
      if (throwError) {
        throw err
      }
      console.error('Permission guard failed:', err)
      return false
    }
  }

  /**
   * 路由守卫
   */
  const routeGuard = (permission: string, context?: any) => {
    return async (to: any, from: any, next: any) => {
      const hasPermission = await guard(permission, context)
      
      if (hasPermission) {
        next()
      } else {
        next('/unauthorized')
      }
    }
  }

  return {
    guard,
    routeGuard
  }
}

/**
 * 权限缓存组合式API
 */
export function usePermissionCache() {
  const cache = reactive<Record<string, {
    result: boolean
    timestamp: number
    ttl: number
  }>>({})

  /**
   * 生成缓存键
   */
  const generateKey = (permission: string, context?: any): string => {
    const contextStr = context ? JSON.stringify(context) : ''
    return `${permission}:${contextStr}`
  }

  /**
   * 获取缓存结果
   */
  const get = (permission: string, context?: any): boolean | null => {
    const key = generateKey(permission, context)
    const item = cache[key]

    if (!item) {
      return null
    }

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      delete cache[key]
      return null
    }

    return item.result
  }

  /**
   * 设置缓存结果
   */
  const set = (permission: string, result: boolean, context?: any, ttl: number = 300000) => {
    const key = generateKey(permission, context)
    cache[key] = {
      result,
      timestamp: Date.now(),
      ttl
    }
  }

  /**
   * 清除缓存
   */
  const clear = (permission?: string, context?: any) => {
    if (permission) {
      const key = generateKey(permission, context)
      delete cache[key]
    } else {
      Object.keys(cache).forEach(key => delete cache[key])
    }
  }

  /**
   * 清理过期缓存
   */
  const cleanup = () => {
    const now = Date.now()
    Object.keys(cache).forEach(key => {
      const item = cache[key]
      if (now - item.timestamp > item.ttl) {
        delete cache[key]
      }
    })
  }

  // 定期清理过期缓存
  const cleanupInterval = setInterval(cleanup, 60000) // 每分钟清理一次

  onUnmounted(() => {
    clearInterval(cleanupInterval)
  })

  return {
    get,
    set,
    clear,
    cleanup
  }
}

/**
 * 权限状态管理组合式API
 */
export function usePermissionState() {
  const state = reactive({
    permissions: [] as string[],
    roles: [] as string[],
    user: null as User | null,
    loading: false,
    error: null as string | null
  })

  /**
   * 设置用户信息
   */
  const setUser = (user: User | null) => {
    state.user = user
  }

  /**
   * 设置权限列表
   */
  const setPermissions = (permissions: string[]) => {
    state.permissions = permissions
  }

  /**
   * 设置角色列表
   */
  const setRoles = (roles: string[]) => {
    state.roles = roles
  }

  /**
   * 设置加载状态
   */
  const setLoading = (loading: boolean) => {
    state.loading = loading
  }

  /**
   * 设置错误信息
   */
  const setError = (error: string | null) => {
    state.error = error
  }

  /**
   * 重置状态
   */
  const reset = () => {
    state.permissions = []
    state.roles = []
    state.user = null
    state.loading = false
    state.error = null
  }

  return {
    state: readonly(state) as any,
    setUser,
    setPermissions,
    setRoles,
    setLoading,
    setError,
    reset
  }
}

// 工具函数已从 Vue 导入，删除本地定义