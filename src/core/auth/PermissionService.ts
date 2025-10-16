/**
 * 权限服务实现
 * 整合各个管理器，提供统一的权限服务接口
 */

import type {
  IPermissionService,
  User,
  Role,
  Permission,
  PermissionContext,
  PermissionCheckResult
} from './index'
import { AuthError, PermissionError } from './index'
import { AuthManager } from './AuthManager'
import { PermissionManager } from './PermissionManager'
import { UserManager } from './UserManager'
import { RoleManager } from './RoleManager'

/**
 * 权限服务配置
 */
export interface PermissionServiceConfig {
  enableCache: boolean
  cacheTimeout: number
  enableAuditLog: boolean
  strictMode: boolean
  enableMiddleware: boolean
}

/**
 * 默认权限服务配置
 */
const DEFAULT_SERVICE_CONFIG: PermissionServiceConfig = {
  enableCache: true,
  cacheTimeout: 300000, // 5分钟
  enableAuditLog: true,
  strictMode: true,
  enableMiddleware: true
}

/**
 * 权限中间件函数类型
 */
export type PermissionMiddleware = (
  context: PermissionContext,
  next: () => Promise<boolean>
) => Promise<boolean>

/**
 * 权限服务实现
 */
export class PermissionService implements IPermissionService {
  private config: PermissionServiceConfig
  private authManager: AuthManager
  private permissionManager: PermissionManager
  private userManager: UserManager
  private roleManager: RoleManager
  private middlewares: PermissionMiddleware[] = []
  private auditLogs: Array<{
    userId: string
    action: string
    resource: string
    result: boolean
    timestamp: number
    details?: any
  }> = []

  constructor(
    authManager: AuthManager,
    permissionManager: PermissionManager,
    userManager: UserManager,
    roleManager: RoleManager,
    config: Partial<PermissionServiceConfig> = {}
  ) {
    this.config = { ...DEFAULT_SERVICE_CONFIG, ...config }
    this.authManager = authManager
    this.permissionManager = permissionManager
    this.userManager = userManager
    this.roleManager = roleManager
  }

  /**
   * 记录审计日志
   */
  private logAudit(
    userId: string,
    action: string,
    resource: string,
    result: boolean,
    details?: any
  ) {
    if (this.config.enableAuditLog) {
      this.auditLogs.push({
        userId,
        action,
        resource,
        result,
        timestamp: Date.now(),
        details
      })
    }
  }

  /**
   * 执行中间件链
   */
  private async executeMiddlewares(
    context: PermissionContext,
    finalHandler: () => Promise<boolean>
  ): Promise<boolean> {
    if (!this.config.enableMiddleware || this.middlewares.length === 0) {
      return finalHandler()
    }

    let index = 0

    const next = async (): Promise<boolean> => {
      if (index >= this.middlewares.length) {
        return finalHandler()
      }

      const middleware = this.middlewares[index++]
      return middleware(context, next)
    }

    return next()
  }

  /**
   * 添加权限中间件
   */
  addMiddleware(middleware: PermissionMiddleware): void {
    this.middlewares.push(middleware)
  }

  /**
   * 移除权限中间件
   */
  removeMiddleware(middleware: PermissionMiddleware): void {
    const index = this.middlewares.indexOf(middleware)
    if (index > -1) {
      this.middlewares.splice(index, 1)
    }
  }

  /**
   * 清除所有中间件
   */
  clearMiddlewares(): void {
    this.middlewares.length = 0
  }

  /**
   * 创建权限
   */
  async createPermission(permissionData: Partial<Permission>): Promise<Permission> {
    // 生成权限ID
    const id = `perm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const permission: Permission = {
      id,
      name: permissionData.name || '',
      code: permissionData.code || '',
      resource: permissionData.resource || '',
      action: permissionData.action || '',
      description: permissionData.description,
      isSystem: permissionData.isSystem || false,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // 这里应该调用数据库或存储服务来保存权限
    // 暂时返回创建的权限对象
    return permission
  }

  /**
   * 更新权限
   */
  async updatePermission(id: string, permissionData: Partial<Permission>): Promise<Permission> {
    // 这里应该从数据库获取现有权限并更新
    const existingPermission = await this.getPermission(id)
    if (!existingPermission) {
      throw new PermissionError(`Permission with id ${id} not found`, 'PERMISSION_NOT_FOUND')
    }
    
    const updatedPermission: Permission = {
      ...existingPermission,
      ...permissionData,
      id, // 确保ID不被更改
      updatedAt: new Date()
    }
    
    // 这里应该调用数据库或存储服务来更新权限
    return updatedPermission
  }

  /**
   * 删除权限
   */
  async deletePermission(id: string): Promise<void> {
    const permission = await this.getPermission(id)
    if (!permission) {
      throw new PermissionError(`Permission with id ${id} not found`, 'PERMISSION_NOT_FOUND')
    }
    
    if (permission.isSystem) {
      throw new PermissionError('Cannot delete system permission', 'SYSTEM_PERMISSION_DELETE_DENIED')
    }
    
    // 这里应该调用数据库或存储服务来删除权限
  }

  /**
   * 获取权限
   */
  async getPermission(id: string): Promise<Permission | null> {
    // 这里应该从数据库获取权限
    // 暂时返回null，实际实现需要连接数据库
    return null
  }

  /**
   * 获取权限列表
   */
  async getPermissions(): Promise<Permission[]> {
    // 这里应该从数据库获取所有权限
    // 暂时返回空数组，实际实现需要连接数据库
    return []
  }

  /**
   * 根据资源获取权限列表
   */
  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    const allPermissions = await this.getPermissions()
    return allPermissions.filter(permission => permission.resource === resource)
  }

  /**
   * 检查用户权限
   */
  async checkPermission(
    userId: string,
    permission: string,
    context?: any
  ): Promise<PermissionCheckResult> {
    try {
      // 获取用户信息
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        throw new AuthError('User not found')
      }

      // 检查用户状态
      if (user.status !== 'active') {
        return {
          allowed: false,
          reason: 'User account is not active',
          requiredPermissions: [permission],
          userPermissions: []
        }
      }

      // 创建权限上下文
      const permissionContext: PermissionContext = {
        user,
        resource: permission.split(':')[0] || '',
        action: permission.split(':')[1] || 'read',
        data: context
      }

      // 执行中间件和权限检查
      const result = await this.executeMiddlewares(permissionContext, async () => {
        return this.permissionManager.checkPermission(user, permission, context)
          .then(result => result.allowed)
      })

      // 记录审计日志
      this.logAudit(userId, permissionContext.action || 'unknown', permissionContext.resource || 'unknown', result, context)

      if (result) {
        return {
          allowed: true,
          userPermissions: this.permissionManager.getUserPermissions(user)
        }
      } else {
        return {
          allowed: false,
          reason: 'Insufficient permissions',
          requiredPermissions: [permission],
          userPermissions: this.permissionManager.getUserPermissions(user)
        }
      }
    } catch (error: any) {
      // 记录错误日志
      this.logAudit(userId, 'ERROR', permission, false, { error: error.message })

      return {
        allowed: false,
        reason: error.message || 'Permission check failed',
        requiredPermissions: [permission],
        userPermissions: []
      }
    }
  }

  /**
   * 批量检查权限
   */
  async checkPermissions(
    userId: string,
    permissions: string[],
    context?: any
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {}

    // 并行检查所有权限
    const promises = permissions.map(async (permission) => {
      const result = await this.checkPermission(userId, permission, context)
      return { permission, result }
    })

    const resolvedResults = await Promise.all(promises)

    resolvedResults.forEach(({ permission, result }) => {
      results[permission] = result
    })

    return results
  }

  /**
   * 检查用户是否有指定角色
   */
  async checkRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        return false
      }

      const hasRole = this.permissionManager.hasRole(user, roleCode)

      // 记录审计日志
      this.logAudit(userId, 'ROLE_CHECK', roleCode, hasRole)

      return hasRole
    } catch (error: any) {
      // 记录错误日志
      this.logAudit(userId, 'ROLE_CHECK_ERROR', roleCode, false, { error: error.message })
      return false
    }
  }

  /**
   * 检查资源访问权限
   */
  async checkResourceAccess(
    userId: string,
    resource: string,
    action: string = 'read',
    context?: any
  ): Promise<boolean> {
    const permission = `${resource}:${action}`
    const result = await this.checkPermission(userId, permission, context)
    return result.allowed
  }

  /**
   * 获取用户所有权限
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        return []
      }

      return this.permissionManager.getUserPermissions(user)
    } catch (error) {
      console.error('Failed to get user permissions:', error)
      return []
    }
  }

  /**
   * 获取用户所有角色
   */
  async getUserRoles(userId: string): Promise<string[]> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        return []
      }

      return this.permissionManager.getUserRoles(user)
    } catch (error) {
      console.error('Failed to get user roles:', error)
      return []
    }
  }

  /**
   * 为用户分配角色
   */
  async assignUserRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        throw new AuthError('User not found')
      }

      const role = await this.roleManager.getRoleByCode(roleCode)
      if (!role) {
        throw new AuthError('Role not found')
      }

      // 检查用户是否已有此角色
      const hasRole = user.roles.some(r => r.code === roleCode)
      if (hasRole) {
        return true
      }

      // 添加角色
      const updatedRoles = [...user.roles, role]
      await this.userManager.assignRoles(userId, updatedRoles.map(r => r.id))

      // 记录审计日志
      this.logAudit(userId, 'ROLE_ASSIGNED', roleCode, true)

      return true
    } catch (error: any) {
      // 记录错误日志
      this.logAudit(userId, 'ROLE_ASSIGN_ERROR', roleCode, false, { error: error.message })
      throw error
    }
  }

  /**
   * 移除用户角色
   */
  async removeUserRole(userId: string, roleCode: string): Promise<boolean> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        throw new AuthError('User not found')
      }

      // 移除角色
      const updatedRoles = user.roles.filter(r => r.code !== roleCode)
      await this.userManager.assignRoles(userId, updatedRoles.map(r => r.id))

      // 记录审计日志
      this.logAudit(userId, 'ROLE_REMOVED', roleCode, true)

      return true
    } catch (error: any) {
      // 记录错误日志
      this.logAudit(userId, 'ROLE_REMOVE_ERROR', roleCode, false, { error: error.message })
      throw error
    }
  }

  /**
   * 为用户分配权限
   */
  async assignUserPermission(userId: string, permissionCode: string): Promise<boolean> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        throw new AuthError('User not found')
      }

      // 检查用户是否已有此权限
      const hasPermission = user.permissions.some(p => p.code === permissionCode)
      if (hasPermission) {
        return true
      }

      // 添加权限
      const newPermission: Permission = {
        id: `perm_${Date.now()}`,
        code: permissionCode,
        name: permissionCode,
        description: '',
        resource: permissionCode.split(':')[0] || '',
        action: permissionCode.split(':')[1] || 'read',
        isSystem: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const updatedPermissions = [...user.permissions, newPermission]
      await this.userManager.assignPermissions(userId, updatedPermissions.map(p => p.id))

      // 记录审计日志
      this.logAudit(userId, 'PERMISSION_ASSIGNED', permissionCode, true)

      return true
    } catch (error: any) {
      // 记录错误日志
      this.logAudit(userId, 'PERMISSION_ASSIGN_ERROR', permissionCode, false, { error: error.message })
      throw error
    }
  }

  /**
   * 移除用户权限
   */
  async removeUserPermission(userId: string, permissionCode: string): Promise<boolean> {
    try {
      const user = await this.userManager.getUserById(userId)
      if (!user) {
        throw new AuthError('User not found')
      }

      // 移除权限
      const updatedPermissions = user.permissions.filter(p => p.code !== permissionCode)
      await this.userManager.assignPermissions(userId, updatedPermissions.map(p => p.id))

      // 记录审计日志
      this.logAudit(userId, 'PERMISSION_REMOVED', permissionCode, true)

      return true
    } catch (error: any) {
      // 记录错误日志
      this.logAudit(userId, 'PERMISSION_REMOVE_ERROR', permissionCode, false, { error: error.message })
      throw error
    }
  }

  /**
   * 获取当前认证用户的权限
   */
  async getCurrentUserPermissions(): Promise<string[]> {
    const currentUser = this.authManager.getCurrentUser()
    if (!currentUser) {
      return []
    }

    return this.getUserPermissions(currentUser.id)
  }

  /**
   * 检查当前用户权限
   */
  async checkCurrentUserPermission(permission: string, context?: any): Promise<boolean> {
    const currentUser = this.authManager.getCurrentUser()
    if (!currentUser) {
      return false
    }

    const result = await this.checkPermission(currentUser.id, permission, context)
    return result.allowed
  }

  /**
   * 权限装饰器工厂
   */
  requirePermission(permission: string) {
    const permissionService = this
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const currentUser = permissionService.authManager?.getCurrentUser()
        if (!currentUser) {
          throw new PermissionError('Authentication required')
        }

        const hasPermission = await permissionService.checkCurrentUserPermission(permission)
        if (!hasPermission) {
          throw new PermissionError(`Permission required: ${permission}`)
        }

        return originalMethod.apply(this, args)
      }

      return descriptor
    }
  }

  /**
   * 角色装饰器工厂
   */
  requireRole(roleCode: string) {
    const permissionService = this
    return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
      const originalMethod = descriptor.value

      descriptor.value = async function (...args: any[]) {
        const currentUser = permissionService.authManager?.getCurrentUser()
        if (!currentUser) {
          throw new PermissionError('Authentication required')
        }

        const hasRole = await permissionService.checkRole(currentUser.id, roleCode)
        if (!hasRole) {
          throw new PermissionError(`Role required: ${roleCode}`)
        }

        return originalMethod.apply(this, args)
      }

      return descriptor
    }
  }

  /**
   * 获取权限统计信息
   */
  async getPermissionStats(): Promise<{
    totalUsers: number
    totalRoles: number
    totalPermissions: number
    activeUsers: number
    auditLogCount: number
  }> {
    const userStats = await this.userManager.getUserStats()
    const roleStats = await this.roleManager.getRoleStats()

    return {
      totalUsers: userStats.total,
      totalRoles: roleStats.total,
      totalPermissions: 0, // 需要实现权限统计
      activeUsers: userStats.active,
      auditLogCount: this.auditLogs.length
    }
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(userId?: string, limit: number = 100): Array<{
    userId: string
    action: string
    resource: string
    result: boolean
    timestamp: number
    details?: any
  }> {
    let logs = this.auditLogs

    if (userId) {
      logs = logs.filter(log => log.userId === userId)
    }

    return logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * 清除缓存
   */
  clearCache(userId?: string): void {
    this.permissionManager.clearCache(userId)
    this.userManager.clearCache(userId)
    this.roleManager.clearCache()
  }

  /**
   * 销毁权限服务
   */
  destroy(): void {
    this.middlewares.length = 0
    this.auditLogs.length = 0
    this.permissionManager.destroy()
    this.userManager.destroy()
    this.roleManager.destroy()
  }
}

/**
 * 创建权限服务实例
 */
export function createPermissionService(
  authManager: AuthManager,
  permissionManager: PermissionManager,
  userManager: UserManager,
  roleManager: RoleManager,
  config?: Partial<PermissionServiceConfig>
): PermissionService {
  return new PermissionService(authManager, permissionManager, userManager, roleManager, config)
}