/**
 * 权限管理器实现
 * 处理权限检查、策略评估等功能
 */

import type {
  IPermissionManager,
  User,
  Permission,
  Role,
  PermissionPolicy,
  PermissionContext,
  PermissionCheckResult
} from './index'
import { PermissionError, PermissionUtils } from './index'

/**
 * 权限缓存项
 */
interface PermissionCacheItem {
  result: boolean
  timestamp: number
  ttl: number
}

/**
 * 权限管理器配置
 */
export interface PermissionManagerConfig {
  cacheEnabled: boolean
  cacheTTL: number // 缓存生存时间（毫秒）
  strictMode: boolean // 严格模式，未定义的权限默认拒绝
  inheritanceEnabled: boolean // 是否启用权限继承
  policyEvaluationTimeout: number // 策略评估超时时间（毫秒）
}

/**
 * 默认权限管理器配置
 */
const DEFAULT_PERMISSION_CONFIG: PermissionManagerConfig = {
  cacheEnabled: true,
  cacheTTL: 300000, // 5分钟
  strictMode: true,
  inheritanceEnabled: true,
  policyEvaluationTimeout: 5000 // 5秒
}

/**
 * 权限管理器实现
 */
export class PermissionManager implements IPermissionManager {
  private config: PermissionManagerConfig
  private policies: Map<string, PermissionPolicy> = new Map()
  private permissionCache: Map<string, PermissionCacheItem> = new Map()
  private roleHierarchy: Map<string, string[]> = new Map() // 角色继承关系
  private resourceHierarchy: Map<string, string[]> = new Map() // 资源继承关系

  constructor(config: Partial<PermissionManagerConfig> = {}) {
    this.config = { ...DEFAULT_PERMISSION_CONFIG, ...config }
    this.setupCacheCleanup()
  }

  /**
   * 设置缓存清理定时器
   */
  private setupCacheCleanup() {
    if (this.config.cacheEnabled) {
      setInterval(() => {
        this.cleanExpiredCache()
      }, this.config.cacheTTL)
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache() {
    const now = Date.now()
    for (const [key, item] of this.permissionCache) {
      if (now - item.timestamp > item.ttl) {
        this.permissionCache.delete(key)
      }
    }
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(userId: string, permission: string, context?: any): string {
    const contextStr = context ? JSON.stringify(context) : ''
    return `${userId}:${permission}:${contextStr}`
  }

  /**
   * 获取缓存结果
   */
  private getCachedResult(key: string): boolean | null {
    if (!this.config.cacheEnabled) {
      return null
    }

    const item = this.permissionCache.get(key)
    if (!item) {
      return null
    }

    const now = Date.now()
    if (now - item.timestamp > item.ttl) {
      this.permissionCache.delete(key)
      return null
    }

    return item.result
  }

  /**
   * 设置缓存结果
   */
  private setCachedResult(key: string, result: boolean, ttl?: number) {
    if (!this.config.cacheEnabled) {
      return
    }

    this.permissionCache.set(key, {
      result,
      timestamp: Date.now(),
      ttl: ttl || this.config.cacheTTL
    })
  }

  /**
   * 检查用户是否有指定权限
   */
  hasPermission(user: User, permission: string): boolean {
    const cacheKey = this.generateCacheKey(user.id, permission)
    const cachedResult = this.getCachedResult(cacheKey)
    
    if (cachedResult !== null) {
      return cachedResult
    }

    let result = false

    // 检查直接权限
    result = user.permissions.some(p => p.code === permission)

    // 检查角色权限
    if (!result) {
      result = user.roles.some(role => 
        role.permissions.some(p => p.code === permission)
      )
    }

    // 检查权限继承
    if (!result && this.config.inheritanceEnabled) {
      result = this.checkPermissionInheritance(user, permission)
    }

    // 在严格模式下，未定义的权限默认拒绝
    if (!result && this.config.strictMode) {
      result = false
    }

    this.setCachedResult(cacheKey, result)
    return result
  }

  /**
   * 检查权限继承
   */
  private checkPermissionInheritance(user: User, permission: string): boolean {
    const { resource, action } = PermissionUtils.parsePermissionCode(permission)
    
    // 检查资源继承
    const parentResources = this.getParentResources(resource)
    for (const parentResource of parentResources) {
      const parentPermission = PermissionUtils.formatPermissionCode(parentResource, action)
      if (this.hasDirectPermission(user, parentPermission)) {
        return true
      }
    }

    // 检查角色继承
    const allRoles = this.getAllInheritedRoles(user.roles.map(r => r.code))
    for (const roleCode of allRoles) {
      // 这里需要根据实际情况获取角色对象
      // 简化处理，假设可以通过某种方式获取角色权限
    }

    return false
  }

  /**
   * 检查直接权限（不包括继承）
   */
  private hasDirectPermission(user: User, permission: string): boolean {
    return user.permissions.some(p => p.code === permission) ||
           user.roles.some(role => role.permissions.some(p => p.code === permission))
  }

  /**
   * 获取父级资源
   */
  private getParentResources(resource: string): string[] {
    return this.resourceHierarchy.get(resource) || []
  }

  /**
   * 获取所有继承的角色
   */
  private getAllInheritedRoles(roles: string[]): string[] {
    const allRoles = new Set(roles)
    
    for (const role of roles) {
      const parentRoles = this.roleHierarchy.get(role) || []
      parentRoles.forEach(parentRole => allRoles.add(parentRole))
    }
    
    return Array.from(allRoles)
  }

  /**
   * 检查用户是否有指定角色
   */
  hasRole(user: User, role: string): boolean {
    const directRole = user.roles.some(r => r.code === role)
    
    if (directRole) {
      return true
    }

    // 检查角色继承
    if (this.config.inheritanceEnabled) {
      const userRoles = user.roles.map(r => r.code)
      const inheritedRoles = this.getAllInheritedRoles(userRoles)
      return inheritedRoles.includes(role)
    }

    return false
  }

  /**
   * 检查用户是否可以访问资源
   */
  canAccess(user: User, resource: string, action: string = 'read'): boolean {
    const permission = PermissionUtils.formatPermissionCode(resource, action)
    return this.hasPermission(user, permission)
  }

  /**
   * 获取用户所有权限
   */
  getUserPermissions(user: User): string[] {
    const permissions = new Set<string>()

    // 直接权限
    user.permissions.forEach(p => permissions.add(p.code))

    // 角色权限
    user.roles.forEach(role => {
      role.permissions.forEach(p => permissions.add(p.code))
    })

    // 继承权限
    if (this.config.inheritanceEnabled) {
      const inheritedPermissions = this.getInheritedPermissions(user)
      inheritedPermissions.forEach(p => permissions.add(p))
    }

    return Array.from(permissions)
  }

  /**
   * 获取继承的权限
   */
  private getInheritedPermissions(user: User): string[] {
    const permissions = new Set<string>()
    
    // 通过角色继承获取权限
    const userRoles = user.roles.map(r => r.code)
    const allRoles = this.getAllInheritedRoles(userRoles)
    
    // 这里需要根据实际情况获取角色的权限
    // 简化处理
    
    return Array.from(permissions)
  }

  /**
   * 获取用户所有角色
   */
  getUserRoles(user: User): string[] {
    const roles = new Set<string>()

    // 直接角色
    user.roles.forEach(r => roles.add(r.code))

    // 继承角色
    if (this.config.inheritanceEnabled) {
      const userRoles = user.roles.map(r => r.code)
      const inheritedRoles = this.getAllInheritedRoles(userRoles)
      inheritedRoles.forEach(r => roles.add(r))
    }

    return Array.from(roles)
  }

  /**
   * 添加权限策略
   */
  addPolicy(policy: PermissionPolicy): void {
    this.policies.set(policy.name, policy)
  }

  /**
   * 移除权限策略
   */
  removePolicy(name: string): void {
    this.policies.delete(name)
  }

  /**
   * 评估权限策略
   */
  async evaluatePolicy(context: PermissionContext): Promise<boolean> {
    const promises: Promise<boolean>[] = []

    for (const [name, policy] of this.policies) {
      const promise = Promise.resolve(policy.evaluate(context))
        .then(result => result)
        .catch(error => {
          console.error(`Policy evaluation error for ${name}:`, error)
          return false
        })

      promises.push(promise)
    }

    try {
      // 设置超时
      const timeoutPromise = new Promise<boolean>((_, reject) => {
        setTimeout(() => reject(new Error('Policy evaluation timeout')), this.config.policyEvaluationTimeout)
      })

      const results = await Promise.race([
        Promise.all(promises),
        timeoutPromise
      ]) as boolean[]

      // 所有策略都必须通过
      return results.every(result => result)
    } catch (error) {
      console.error('Policy evaluation failed:', error)
      return false
    }
  }

  /**
   * 详细权限检查
   */
  async checkPermission(
    user: User,
    permission: string,
    context?: any
  ): Promise<PermissionCheckResult> {
    const hasBasicPermission = this.hasPermission(user, permission)
    
    if (!hasBasicPermission) {
      return {
        allowed: false,
        reason: 'Insufficient permissions',
        requiredPermissions: [permission],
        userPermissions: this.getUserPermissions(user)
      }
    }

    // 评估策略
    if (this.policies.size > 0) {
      const policyContext: PermissionContext = {
        user,
        resource: PermissionUtils.parsePermissionCode(permission).resource,
        action: PermissionUtils.parsePermissionCode(permission).action,
        data: context
      }

      const policyResult = await this.evaluatePolicy(policyContext)
      
      if (!policyResult) {
        return {
          allowed: false,
          reason: 'Policy evaluation failed',
          requiredPermissions: [permission],
          userPermissions: this.getUserPermissions(user)
        }
      }
    }

    return {
      allowed: true,
      userPermissions: this.getUserPermissions(user)
    }
  }

  /**
   * 批量权限检查
   */
  async checkPermissions(
    user: User,
    permissions: string[],
    context?: any
  ): Promise<Record<string, PermissionCheckResult>> {
    const results: Record<string, PermissionCheckResult> = {}

    for (const permission of permissions) {
      results[permission] = await this.checkPermission(user, permission, context)
    }

    return results
  }

  /**
   * 设置角色继承关系
   */
  setRoleHierarchy(child: string, parents: string[]) {
    this.roleHierarchy.set(child, parents)
  }

  /**
   * 设置资源继承关系
   */
  setResourceHierarchy(child: string, parents: string[]) {
    this.resourceHierarchy.set(child, parents)
  }

  /**
   * 清除权限缓存
   */
  clearCache(userId?: string) {
    if (userId) {
      // 清除特定用户的缓存
      for (const [key] of this.permissionCache) {
        if (key.startsWith(`${userId}:`)) {
          this.permissionCache.delete(key)
        }
      }
    } else {
      // 清除所有缓存
      this.permissionCache.clear()
    }
  }

  /**
   * 获取权限统计信息
   */
  getStats() {
    return {
      policiesCount: this.policies.size,
      cacheSize: this.permissionCache.size,
      roleHierarchySize: this.roleHierarchy.size,
      resourceHierarchySize: this.resourceHierarchy.size,
      config: { ...this.config }
    }
  }

  /**
   * 销毁权限管理器
   */
  destroy() {
    this.policies.clear()
    this.permissionCache.clear()
    this.roleHierarchy.clear()
    this.resourceHierarchy.clear()
  }
}

/**
 * 创建权限管理器实例
 */
export function createPermissionManager(config?: Partial<PermissionManagerConfig>): PermissionManager {
  return new PermissionManager(config)
}

/**
 * 全局权限管理器实例
 */
export const permissionManager = createPermissionManager()