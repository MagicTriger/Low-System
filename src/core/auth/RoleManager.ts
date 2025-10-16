/**
 * 角色管理器实现
 * 处理角色管理、权限分配等功能
 */

import type {
  IRoleManager,
  Role,
  Permission
} from './index'
import { AuthError } from './index'

/**
 * 角色查询选项
 */
export interface RoleQueryOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
  includePermissions?: boolean
}

/**
 * 角色查询结果
 */
export interface RoleQueryResult {
  roles: Role[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 角色创建数据
 */
export interface CreateRoleData {
  code: string
  name: string
  description?: string
  permissions?: string[]
  parentRoles?: string[]
  metadata?: Record<string, any>
}

/**
 * 角色更新数据
 */
export interface UpdateRoleData {
  name?: string
  description?: string
  permissions?: string[]
  parentRoles?: string[]
  metadata?: Record<string, any>
}

/**
 * 角色管理器配置
 */
export interface RoleManagerConfig {
  enableCache: boolean
  cacheTimeout: number
  enableAuditLog: boolean
  enableHierarchy: boolean
  maxHierarchyDepth: number
}

/**
 * 默认角色管理器配置
 */
const DEFAULT_ROLE_CONFIG: RoleManagerConfig = {
  enableCache: true,
  cacheTimeout: 300000, // 5分钟
  enableAuditLog: true,
  enableHierarchy: true,
  maxHierarchyDepth: 5
}

/**
 * 角色管理器实现
 */
export class RoleManager implements IRoleManager {
  private config: RoleManagerConfig
  private roles: Map<string, Role> = new Map()
  private rolesByCode: Map<string, Role> = new Map()
  private roleCache: Map<string, { role: Role; timestamp: number }> = new Map()
  private roleHierarchy: Map<string, string[]> = new Map() // 子角色 -> 父角色列表
  private auditLogs: Array<{
    roleId: string
    action: string
    timestamp: number
    details?: any
  }> = []

  constructor(config: Partial<RoleManagerConfig> = {}) {
    this.config = { ...DEFAULT_ROLE_CONFIG, ...config }
    this.setupCacheCleanup()
  }

  /**
   * 设置缓存清理定时器
   */
  private setupCacheCleanup() {
    if (this.config.enableCache) {
      setInterval(() => {
        this.cleanExpiredCache()
      }, this.config.cacheTimeout)
    }
  }

  /**
   * 清理过期缓存
   */
  private cleanExpiredCache() {
    const now = Date.now()
    for (const [key, item] of this.roleCache) {
      if (now - item.timestamp > this.config.cacheTimeout) {
        this.roleCache.delete(key)
      }
    }
  }

  /**
   * 记录审计日志
   */
  private logAudit(roleId: string, action: string, details?: any) {
    if (this.config.enableAuditLog) {
      this.auditLogs.push({
        roleId,
        action,
        timestamp: Date.now(),
        details
      })
    }
  }

  /**
   * 生成角色ID
   */
  private generateRoleId(): string {
    return `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 检查角色层次结构循环依赖
   */
  private checkCircularDependency(roleCode: string, parentRoles: string[]): boolean {
    const visited = new Set<string>()
    const stack = new Set<string>()

    const dfs = (current: string): boolean => {
      if (stack.has(current)) {
        return true // 发现循环
      }
      if (visited.has(current)) {
        return false
      }

      visited.add(current)
      stack.add(current)

      const parents = this.roleHierarchy.get(current) || []
      for (const parent of parents) {
        if (dfs(parent)) {
          return true
        }
      }

      stack.delete(current)
      return false
    }

    // 临时添加新的层次关系进行检查
    const originalParents = this.roleHierarchy.get(roleCode) || []
    this.roleHierarchy.set(roleCode, parentRoles)

    const hasCircular = dfs(roleCode)

    // 恢复原始状态
    this.roleHierarchy.set(roleCode, originalParents)

    return hasCircular
  }

  /**
   * 获取角色的所有父角色（包括间接父角色）
   */
  private getAllParentRoles(roleCode: string): string[] {
    const parents = new Set<string>()
    const visited = new Set<string>()

    const dfs = (current: string) => {
      if (visited.has(current)) {
        return
      }
      visited.add(current)

      const directParents = this.roleHierarchy.get(current) || []
      for (const parent of directParents) {
        parents.add(parent)
        dfs(parent)
      }
    }

    dfs(roleCode)
    return Array.from(parents)
  }

  /**
   * 获取角色的所有子角色（包括间接子角色）
   */
  private getAllChildRoles(roleCode: string): string[] {
    const children = new Set<string>()
    const visited = new Set<string>()

    const dfs = (current: string) => {
      if (visited.has(current)) {
        return
      }
      visited.add(current)

      for (const [child, parents] of this.roleHierarchy) {
        if (parents.includes(current)) {
          children.add(child)
          dfs(child)
        }
      }
    }

    dfs(roleCode)
    return Array.from(children)
  }

  /**
   * 创建角色
   */
  async createRole(roleData: Partial<Role>): Promise<Role> {
    // 验证必需字段
    if (!roleData.code || !roleData.name) {
      throw new AuthError('角色代码和名称是必需的')
    }

    // 检查角色代码是否已存在
    if (this.rolesByCode.has(roleData.code)) {
      throw new AuthError(`角色代码 ${roleData.code} 已存在`)
    }

    const roleId = this.generateRoleId()
    const now = new Date()
    
    const role: Role = {
      id: roleId,
      code: roleData.code,
      name: roleData.name,
      description: roleData.description || '',
      permissions: roleData.permissions || [],
      isSystem: roleData.isSystem || false,
      status: roleData.status || 'active',
      createdAt: now,
      updatedAt: now
    }

    this.roles.set(roleId, role)
    this.rolesByCode.set(role.code, role)

    // 记录审计日志
    this.logAudit(roleId, 'create', { roleData })

    return role
  }

  /**
   * 根据ID获取角色
   */
  async getRoleById(id: string): Promise<Role | null> {
    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.roleCache.get(id)
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.role
      }
    }

    const role = this.roles.get(id) || null

    // 更新缓存
    if (role && this.config.enableCache) {
      this.roleCache.set(id, { role, timestamp: Date.now() })
    }

    return role
  }

  /**
   * 根据代码获取角色
   */
  async getRoleByCode(code: string): Promise<Role | null> {
    return this.rolesByCode.get(code) || null
  }

  /**
   * 更新角色
   */
  async updateRole(id: string, roleData: Partial<Role>): Promise<Role> {
    const role = this.roles.get(id)
    if (!role) {
      throw new AuthError(`角色 ${id} 不存在`)
    }

    // 如果更新代码，检查唯一性
    if (roleData.code && roleData.code !== role.code) {
      if (this.rolesByCode.has(roleData.code)) {
        throw new AuthError(`角色代码 ${roleData.code} 已存在`)
      }
      // 更新代码映射
      this.rolesByCode.delete(role.code)
      this.rolesByCode.set(roleData.code, role)
    }

    // 更新角色属性
    const updatedRole: Role = {
      ...role,
      ...roleData,
      id, // 保持ID不变
      updatedAt: new Date()
    }

    this.roles.set(id, updatedRole)

    // 清除缓存
    this.clearCache(id)

    // 记录审计日志
    this.logAudit(id, 'update', { roleData })

    return updatedRole
  }

  /**
   * 删除角色
   */
  async deleteRole(id: string): Promise<void> {
    const role = this.roles.get(id)
    if (!role) {
      throw new AuthError('Role not found')
    }

    // 检查是否为系统角色
    if (role.isSystem) {
      throw new AuthError('Cannot delete system role')
    }

    // 检查是否有用户使用此角色
    // 这里应该检查用户管理器，但为了简化，我们跳过这个检查

    // 删除角色
    this.roles.delete(id)
    this.rolesByCode.delete(role.code)

    // 清除缓存
    this.clearCache(id)

    // 记录审计日志
    this.logAudit(id, 'ROLE_DELETED', { code: role.code, name: role.name })
  }

  /**
   * 查询角色列表（带分页和过滤）
   */
  async queryRoles(options: RoleQueryOptions = {}): Promise<RoleQueryResult> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {}
    } = options

    let roles = Array.from(this.roles.values())

    // 应用过滤器
    if (Object.keys(filters).length > 0) {
      roles = roles.filter(role => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'search') {
            const searchTerm = value.toLowerCase()
            return role.code.toLowerCase().includes(searchTerm) ||
                   role.name.toLowerCase().includes(searchTerm) ||
                   (role.description && role.description.toLowerCase().includes(searchTerm))
          }
          return true
        })
      })
    }

    // 排序
    roles.sort((a, b) => {
      let aValue: any = a[sortBy as keyof Role]
      let bValue: any = b[sortBy as keyof Role]

      if (aValue instanceof Date) {
        aValue = aValue.getTime()
      }
      if (bValue instanceof Date) {
        bValue = bValue.getTime()
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    // 分页
    const total = roles.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedRoles = roles.slice(startIndex, endIndex)

    return {
      roles: paginatedRoles,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * 为角色分配权限
   */
  async assignPermission(roleId: string, permissionId: string): Promise<void> {
    const role = this.roles.get(roleId)
    if (!role) {
      throw new AuthError(`角色 ${roleId} 不存在`)
    }

    // 检查权限是否已存在
    const hasPermission = role.permissions.some(p => p.id === permissionId)
    if (hasPermission) {
      return // 权限已存在，无需重复添加
    }

    // 这里应该从权限服务获取权限对象，暂时创建一个占位符
    const permission = {
      id: permissionId,
      name: `Permission ${permissionId}`,
      code: `perm_${permissionId}`,
      resource: 'unknown',
      action: 'unknown',
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    role.permissions.push(permission)
    role.updatedAt = new Date()

    this.roles.set(roleId, role)
    this.clearCache(roleId)

    // 记录审计日志
    this.logAudit(roleId, 'assign_permission', { permissionId })
  }

  /**
   * 移除角色权限
   */
  async removePermission(roleId: string, permissionId: string): Promise<void> {
    const role = this.roles.get(roleId)
    if (!role) {
      throw new AuthError(`角色 ${roleId} 不存在`)
    }

    const initialLength = role.permissions.length
    role.permissions = role.permissions.filter(p => p.id !== permissionId)

    if (role.permissions.length < initialLength) {
      role.updatedAt = new Date()
      this.roles.set(roleId, role)
      this.clearCache(roleId)

      // 记录审计日志
      this.logAudit(roleId, 'remove_permission', { permissionId })
    }
  }

  /**
   * 获取角色的所有权限（包括继承的权限）
   */
  async getRolePermissions(roleCode: string): Promise<Permission[]> {
    const role = await this.getRoleByCode(roleCode)
    if (!role) {
      return []
    }

    const permissions = new Map<string, Permission>()

    // 添加直接权限
    role.permissions.forEach(permission => {
      permissions.set(permission.code, permission)
    })

    // 添加继承的权限
    if (this.config.enableHierarchy) {
      const parentRoles = this.getAllParentRoles(roleCode)
      for (const parentRoleCode of parentRoles) {
        const parentRole = await this.getRoleByCode(parentRoleCode)
        if (parentRole) {
          parentRole.permissions.forEach(permission => {
            permissions.set(permission.code, permission)
          })
        }
      }
    }

    return Array.from(permissions.values())
  }

  /**
   * 获取角色层次结构
   */
  getRoleHierarchy(roleCode: string): {
    parents: string[]
    children: string[]
    allParents: string[]
    allChildren: string[]
  } {
    return {
      parents: this.roleHierarchy.get(roleCode) || [],
      children: Array.from(this.roleHierarchy.entries())
        .filter(([_, parents]) => parents.includes(roleCode))
        .map(([child]) => child),
      allParents: this.getAllParentRoles(roleCode),
      allChildren: this.getAllChildRoles(roleCode)
    }
  }

  /**
   * 设置角色层次关系
   */
  async setRoleHierarchy(childRoleCode: string, parentRoleCodes: string[]): Promise<void> {
    // 检查循环依赖
    if (this.checkCircularDependency(childRoleCode, parentRoleCodes)) {
      throw new AuthError('Circular dependency detected in role hierarchy')
    }

    // 验证所有父角色都存在
    for (const parentRoleCode of parentRoleCodes) {
      const parentRole = await this.getRoleByCode(parentRoleCode)
      if (!parentRole) {
        throw new AuthError(`Parent role not found: ${parentRoleCode}`)
      }
    }

    this.roleHierarchy.set(childRoleCode, parentRoleCodes)

    // 记录审计日志
    const childRole = await this.getRoleByCode(childRoleCode)
    if (childRole) {
      this.logAudit(childRole.id, 'HIERARCHY_UPDATED', { parentRoleCodes })
    }
  }

  /**
   * 获取角色统计信息
   */
  async getRoleStats(): Promise<{
    total: number
    withPermissions: number
    withHierarchy: number
    maxDepth: number
  }> {
    const roles = Array.from(this.roles.values())
    
    return {
      total: roles.length,
      withPermissions: roles.filter(r => r.permissions.length > 0).length,
      withHierarchy: this.roleHierarchy.size,
      maxDepth: this.calculateMaxHierarchyDepth()
    }
  }

  /**
   * 计算最大层次深度
   */
  private calculateMaxHierarchyDepth(): number {
    let maxDepth = 0

    const calculateDepth = (roleCode: string, visited: Set<string> = new Set()): number => {
      if (visited.has(roleCode)) {
        return 0 // 避免循环
      }

      visited.add(roleCode)
      const parents = this.roleHierarchy.get(roleCode) || []
      
      if (parents.length === 0) {
        return 1
      }

      let maxParentDepth = 0
      for (const parent of parents) {
        const depth = calculateDepth(parent, new Set(visited))
        maxParentDepth = Math.max(maxParentDepth, depth)
      }

      return maxParentDepth + 1
    }

    for (const roleCode of this.roleHierarchy.keys()) {
      const depth = calculateDepth(roleCode)
      maxDepth = Math.max(maxDepth, depth)
    }

    return maxDepth
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(roleId?: string, limit: number = 100): Array<{
    roleId: string
    action: string
    timestamp: number
    details?: any
  }> {
    let logs = this.auditLogs

    if (roleId) {
      logs = logs.filter(log => log.roleId === roleId)
    }

    return logs
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * 获取角色列表（接口方法）
   */
  async getRoles(): Promise<Role[]> {
    return Array.from(this.roles.values())
  }

  /**
   * 获取角色（接口方法）
   */
  async getRole(id: string): Promise<Role | null> {
    return this.getRoleById(id)
  }

  /**
   * 销毁角色管理器
   */
  destroy() {
    this.roles.clear()
    this.rolesByCode.clear()
    this.roleCache.clear()
    this.roleHierarchy.clear()
    this.auditLogs.length = 0
  }

  /**
   * 清除缓存
   */
  clearCache(roleId?: string) {
    if (roleId) {
      this.roleCache.delete(roleId)
    } else {
      this.roleCache.clear()
    }
  }
}

/**
 * 创建角色管理器实例
 */
export function createRoleManager(config?: Partial<RoleManagerConfig>): RoleManager {
  return new RoleManager(config)
}

/**
 * 全局角色管理器实例
 */
export const roleManager = createRoleManager()