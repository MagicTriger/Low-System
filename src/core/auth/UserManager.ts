/**
 * 用户管理器实现
 * 处理用户信息管理、用户状态等功能
 */

import type {
  IUserManager,
  User,
  UserProfile,
  Role,
  Permission
} from './index'
import { AuthError } from './index'

/**
 * 用户查询选项
 */
export interface UserQueryOptions {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  filters?: Record<string, any>
  includeRoles?: boolean
  includePermissions?: boolean
  includeProfile?: boolean
}

/**
 * 用户查询结果
 */
export interface UserQueryResult {
  users: User[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

/**
 * 用户创建数据
 */
export interface CreateUserData {
  username: string
  email: string
  password?: string
  profile?: Partial<UserProfile>
  roles?: string[]
  permissions?: string[]
  status?: 'active' | 'inactive' | 'banned'
}

/**
 * 用户更新数据
 */
export interface UpdateUserData {
  username?: string
  email?: string
  profile?: Partial<UserProfile>
  roles?: string[]
  permissions?: string[]
  status?: 'active' | 'inactive' | 'banned'
}

/**
 * 用户管理器配置
 */
export interface UserManagerConfig {
  enableCache: boolean
  cacheTimeout: number
  enableAuditLog: boolean
  passwordPolicy?: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
  }
}

/**
 * 默认用户管理器配置
 */
const DEFAULT_USER_CONFIG: UserManagerConfig = {
  enableCache: true,
  cacheTimeout: 300000, // 5分钟
  enableAuditLog: true,
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: false
  }
}

/**
 * 用户管理器实现
 */
export class UserManager implements IUserManager {
  private config: UserManagerConfig
  private users: Map<string, User> = new Map()
  private usersByEmail: Map<string, User> = new Map()
  private usersByUsername: Map<string, User> = new Map()
  private userCache: Map<string, { user: User; timestamp: number }> = new Map()
  private auditLogs: Array<{
    userId: string
    action: string
    timestamp: number
    details?: any
  }> = []

  constructor(config: Partial<UserManagerConfig> = {}) {
    this.config = { ...DEFAULT_USER_CONFIG, ...config }
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
    for (const [key, item] of this.userCache) {
      if (now - item.timestamp > this.config.cacheTimeout) {
        this.userCache.delete(key)
      }
    }
  }

  /**
   * 记录审计日志
   */
  private logAudit(userId: string, action: string, details?: any) {
    if (this.config.enableAuditLog) {
      this.auditLogs.push({
        userId,
        action,
        timestamp: Date.now(),
        details
      })
    }
  }

  /**
   * 验证密码策略
   */
  private validatePassword(password: string): boolean {
    const policy = this.config.passwordPolicy
    if (!policy) return true

    if (password.length < policy.minLength) {
      return false
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return false
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return false
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      return false
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return false
    }

    return true
  }

  /**
   * 生成用户ID
   */
  private generateUserId(): string {
    return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 创建用户
   */
  async createUser(userData: Partial<User>): Promise<User> {
    // 验证必需字段
    if (!userData.username) {
      throw new AuthError('Username is required')
    }
    if (!userData.email) {
      throw new AuthError('Email is required')
    }

    // 验证用户名和邮箱唯一性
    if (this.usersByUsername.has(userData.username)) {
      throw new AuthError('Username already exists')
    }

    if (this.usersByEmail.has(userData.email)) {
      throw new AuthError('Email already exists')
    }

    const userId = this.generateUserId()
    const now = new Date()

    const user: User = {
      id: userId,
      username: userData.username,
      email: userData.email,
      status: userData.status || 'active',
      roles: userData.roles || [],
      permissions: userData.permissions || [],
      profile: userData.profile || {
        firstName: '',
        lastName: '',
        phone: '',
        department: '',
        position: '',
        bio: '',
        preferences: {}
      },
      createdAt: now,
      updatedAt: now,
      lastLoginAt: userData.lastLoginAt || undefined
    }

    // 存储用户
    this.users.set(userId, user)
    this.usersByEmail.set(userData.email, user)
    this.usersByUsername.set(userData.username, user)

    // 记录审计日志
    this.logAudit(userId, 'USER_CREATED', { username: userData.username, email: userData.email })

    return user
  }

  /**
   * 根据ID获取用户
   */
  async getUserById(id: string): Promise<User | null> {
    // 检查缓存
    if (this.config.enableCache) {
      const cached = this.userCache.get(id)
      if (cached && Date.now() - cached.timestamp < this.config.cacheTimeout) {
        return cached.user
      }
    }

    const user = this.users.get(id) || null

    // 更新缓存
    if (user && this.config.enableCache) {
      this.userCache.set(id, { user, timestamp: Date.now() })
    }

    return user
  }

  /**
   * 根据用户名获取用户
   */
  async getUserByUsername(username: string): Promise<User | null> {
    return this.usersByUsername.get(username) || null
  }

  /**
   * 根据邮箱获取用户
   */
  async getUserByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email) || null
  }

  /**
   * 更新用户信息
   */
  async updateUser(id: string, userData: Partial<User>): Promise<User> {
    const user = await this.getUserById(id)
    if (!user) {
      throw new AuthError('User not found')
    }

    // 检查用户名唯一性
    if (userData.username && userData.username !== user.username) {
      if (this.usersByUsername.has(userData.username)) {
        throw new AuthError('Username already exists')
      }
    }

    // 检查邮箱唯一性
    if (userData.email && userData.email !== user.email) {
      if (this.usersByEmail.has(userData.email)) {
        throw new AuthError('Email already exists')
      }
    }

    // 更新索引
    if (userData.username && userData.username !== user.username) {
      this.usersByUsername.delete(user.username)
      this.usersByUsername.set(userData.username, user)
    }

    if (userData.email && userData.email !== user.email) {
      this.usersByEmail.delete(user.email)
      this.usersByEmail.set(userData.email, user)
    }

    // 更新用户信息
    const updatedUser: User = {
      ...user,
      ...userData,
      id: user.id, // 保持原有ID
      createdAt: user.createdAt, // 保持原有创建时间
      updatedAt: new Date()
    }

    this.users.set(id, updatedUser)

    // 清除缓存
    this.userCache.delete(id)

    // 记录审计日志
    this.logAudit(id, 'USER_UPDATED', userData)

    return updatedUser
  }

  /**
   * 删除用户
   */
  async deleteUser(id: string): Promise<void> {
    const user = await this.getUserById(id)
    if (!user) {
      throw new AuthError('User not found')
    }

    // 删除用户
    this.users.delete(id)
    this.usersByEmail.delete(user.email)
    this.usersByUsername.delete(user.username)

    // 清除缓存
    this.userCache.delete(id)

    // 记录审计日志
    this.logAudit(id, 'USER_DELETED', { username: user.username, email: user.email })
  }

  /**
   * 查询用户列表（内部方法）
   */
  async getUsersInternal(options: UserQueryOptions = {}): Promise<UserQueryResult> {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      filters = {}
    } = options

    let users = Array.from(this.users.values())

    // 应用过滤器
    if (Object.keys(filters).length > 0) {
      users = users.filter(user => {
        return Object.entries(filters).every(([key, value]) => {
          if (key === 'status') {
            return user.status === value
          }
          if (key === 'search') {
            const searchTerm = value.toLowerCase()
            return user.username.toLowerCase().includes(searchTerm) ||
                   user.email.toLowerCase().includes(searchTerm) ||
                   (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(searchTerm)) ||
                   (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(searchTerm))
          }
          return true
        })
      })
    }

    // 排序
    users.sort((a, b) => {
      let aValue: any = a[sortBy as keyof User]
      let bValue: any = b[sortBy as keyof User]

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
    const total = users.length
    const totalPages = Math.ceil(total / pageSize)
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedUsers = users.slice(startIndex, endIndex)

    return {
      users: paginatedUsers,
      total,
      page,
      pageSize,
      totalPages
    }
  }

  /**
   * 更新用户状态
   */
  async updateUserStatus(id: string, status: 'active' | 'inactive' | 'banned'): Promise<User> {
    return this.updateUser(id, { status })
  }

  /**
   * 为用户分配角色
   */
  async assignRoles(id: string, roleIds: string[]): Promise<User> {
    const user = await this.getUserById(id)
    if (!user) {
      throw new AuthError('User not found')
    }

    // 这里需要根据实际情况获取角色对象
    // 简化处理，假设角色已经存在
    const roles: Role[] = roleIds.map(roleId => ({
      id: roleId,
      code: roleId,
      name: roleId,
      description: '',
      permissions: [],
      isSystem: false,
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const updatedUser: User = {
      ...user,
      roles,
      updatedAt: new Date()
    }

    this.users.set(id, updatedUser)
    this.userCache.delete(id)

    // 记录审计日志
    this.logAudit(id, 'ROLES_ASSIGNED', { roleIds })

    return updatedUser
  }

  /**
   * 为用户分配权限
   */
  async assignPermissions(id: string, permissionIds: string[]): Promise<User> {
    const user = await this.getUserById(id)
    if (!user) {
      throw new AuthError('User not found')
    }

    // 这里需要根据实际情况获取权限对象
    // 简化处理，假设权限已经存在
    const permissions: Permission[] = permissionIds.map(permissionId => ({
      id: permissionId,
      code: permissionId,
      name: permissionId,
      description: '',
      resource: '',
      action: '',
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }))

    const updatedUser: User = {
      ...user,
      permissions,
      updatedAt: new Date()
    }

    this.users.set(id, updatedUser)
    this.userCache.delete(id)

    // 记录审计日志
    this.logAudit(id, 'PERMISSIONS_ASSIGNED', { permissionIds })

    return updatedUser
  }

  /**
   * 更新用户最后登录时间
   */
  async updateLastLogin(id: string): Promise<void> {
    const user = await this.getUserById(id)
    if (user) {
      user.lastLoginAt = new Date()
      this.users.set(id, user)
      this.userCache.delete(id)
      
      // 记录审计日志
      this.logAudit(id, 'USER_LOGIN')
    }
  }

  /**
   * 获取用户统计信息
   */
  async getUserStats(): Promise<{
    total: number
    active: number
    inactive: number
    banned: number
  }> {
    const users = Array.from(this.users.values())
    
    return {
      total: users.length,
      active: users.filter(u => u.status === 'active').length,
      inactive: users.filter(u => u.status === 'inactive').length,
      banned: users.filter(u => u.status === 'banned').length
    }
  }

  /**
   * 获取用户（接口方法）
   */
  async getUser(id: string): Promise<User | null> {
    return this.getUserById(id)
  }

  /**
   * 获取用户列表（接口方法）
   */
  async getUsers(options?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }): Promise<{ users: User[]; total: number }> {
    let users = Array.from(this.users.values())

    // 应用过滤器
    if (options?.search) {
      const search = options.search.toLowerCase()
      users = users.filter(user => 
        user.username.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search) ||
        (user.profile?.firstName && user.profile.firstName.toLowerCase().includes(search)) ||
        (user.profile?.lastName && user.profile.lastName.toLowerCase().includes(search))
      )
    }

    if (options?.status) {
      users = users.filter(user => user.status === options.status)
    }

    if (options?.role) {
      users = users.filter(user => 
        user.roles.some(role => role.code === options.role)
      )
    }

    const total = users.length

    // 应用分页
    if (options?.page && options?.limit) {
      const startIndex = (options.page - 1) * options.limit
      users = users.slice(startIndex, startIndex + options.limit)
    }

    return { users, total }
  }

  /**
   * 分配角色（接口方法）
   */
  async assignRole(userId: string, roleId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new AuthError('User not found')
    }

    // 检查用户是否已有此角色
    const hasRole = user.roles.some(role => role.id === roleId)
    if (hasRole) {
      return
    }

    // 创建角色对象（简化处理）
    const role: Role = {
      id: roleId,
      code: roleId,
      name: roleId,
      description: '',
      permissions: [],
      isSystem: false,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedUser: User = {
      ...user,
      roles: [...user.roles, role],
      updatedAt: new Date()
    }

    this.users.set(userId, updatedUser)
    this.usersByEmail.set(user.email, updatedUser)
    this.usersByUsername.set(user.username, updatedUser)
    this.userCache.delete(userId)

    // 记录审计日志
    this.logAudit(userId, 'ROLE_ASSIGNED', { roleId })
  }

  /**
   * 移除角色（接口方法）
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new AuthError('User not found')
    }

    const updatedUser: User = {
      ...user,
      roles: user.roles.filter(role => role.id !== roleId),
      updatedAt: new Date()
    }

    this.users.set(userId, updatedUser)
    this.usersByEmail.set(user.email, updatedUser)
    this.usersByUsername.set(user.username, updatedUser)
    this.userCache.delete(userId)

    // 记录审计日志
    this.logAudit(userId, 'ROLE_REMOVED', { roleId })
  }

  /**
   * 分配权限（接口方法）
   */
  async assignPermission(userId: string, permissionId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new AuthError('User not found')
    }

    // 检查用户是否已有此权限
    const hasPermission = user.permissions.some(permission => permission.id === permissionId)
    if (hasPermission) {
      return
    }

    // 创建权限对象（简化处理）
    const permission: Permission = {
      id: permissionId,
      code: permissionId,
      name: permissionId,
      description: '',
      resource: permissionId.split(':')[0] || '',
      action: permissionId.split(':')[1] || 'read',
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const updatedUser: User = {
      ...user,
      permissions: [...user.permissions, permission],
      updatedAt: new Date()
    }

    this.users.set(userId, updatedUser)
    this.usersByEmail.set(user.email, updatedUser)
    this.usersByUsername.set(user.username, updatedUser)
    this.userCache.delete(userId)

    // 记录审计日志
    this.logAudit(userId, 'PERMISSION_ASSIGNED', { permissionId })
  }

  /**
   * 移除权限（接口方法）
   */
  async removePermission(userId: string, permissionId: string): Promise<void> {
    const user = await this.getUserById(userId)
    if (!user) {
      throw new AuthError('User not found')
    }

    const updatedUser: User = {
      ...user,
      permissions: user.permissions.filter(permission => permission.id !== permissionId),
      updatedAt: new Date()
    }

    this.users.set(userId, updatedUser)
    this.usersByEmail.set(user.email, updatedUser)
    this.usersByUsername.set(user.username, updatedUser)
    this.userCache.delete(userId)

    // 记录审计日志
    this.logAudit(userId, 'PERMISSION_REMOVED', { permissionId })
  }

  /**
   * 获取审计日志
   */
  getAuditLogs(userId?: string, limit: number = 100): Array<{
    userId: string
    action: string
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
  clearCache(userId?: string) {
    if (userId) {
      this.userCache.delete(userId)
    } else {
      this.userCache.clear()
    }
  }

  /**
   * 销毁用户管理器
   */
  destroy() {
    this.users.clear()
    this.usersByEmail.clear()
    this.usersByUsername.clear()
    this.userCache.clear()
    this.auditLogs.length = 0
  }
}

/**
 * 创建用户管理器实例
 */
export function createUserManager(config?: Partial<UserManagerConfig>): UserManager {
  return new UserManager(config)
}

/**
 * 全局用户管理器实例
 */
export const userManager = createUserManager()