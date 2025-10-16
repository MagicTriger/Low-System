/**
 * 权限管理系统核心
 * 定义用户、角色、权限等基础接口和类型
 */

// 首先导入管理器实现
import { AuthManager, createAuthManager } from './AuthManager'
import { PermissionManager, createPermissionManager } from './PermissionManager'
import { UserManager, createUserManager } from './UserManager'
import { RoleManager, createRoleManager } from './RoleManager'
import { PermissionService, createPermissionService } from './PermissionService'

// 导出管理器实现
export { AuthManager, createAuthManager } from './AuthManager'
export { PermissionManager, createPermissionManager } from './PermissionManager'
export { UserManager, createUserManager } from './UserManager'
export { RoleManager, createRoleManager } from './RoleManager'
export { PermissionService, createPermissionService } from './PermissionService'

// 导出组合式API
export * from './composables'

/**
 * 用户信息接口
 */
export interface User {
  id: string
  username: string
  email: string
  avatar?: string
  status: 'active' | 'inactive' | 'banned'
  roles: Role[]
  permissions: Permission[]
  profile?: UserProfile
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

/**
 * 用户资料接口
 */
export interface UserProfile {
  firstName?: string
  lastName?: string
  displayName?: string
  phone?: string
  department?: string
  position?: string
  bio?: string
  preferences?: Record<string, any>
}

/**
 * 角色接口
 */
export interface Role {
  id: string
  name: string
  code: string
  description?: string
  permissions: Permission[]
  isSystem: boolean
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}

/**
 * 权限接口
 */
export interface Permission {
  id: string
  name: string
  code: string
  resource: string
  action: string
  description?: string
  isSystem: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * 资源接口
 */
export interface Resource {
  id: string
  name: string
  code: string
  type: 'page' | 'component' | 'api' | 'data' | 'file'
  path?: string
  parent?: string
  children?: Resource[]
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

/**
 * 认证令牌接口
 */
export interface AuthToken {
  accessToken: string
  refreshToken: string
  tokenType: 'Bearer'
  expiresIn: number
  expiresAt: Date
  scope?: string[]
}

/**
 * 登录凭据接口
 */
export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
  captcha?: string
  captchaId?: string
}

/**
 * 登录结果接口
 */
export interface LoginResult {
  success: boolean
  user?: User
  token?: AuthToken
  message?: string
  requiresTwoFactor?: boolean
  twoFactorToken?: string
}

/**
 * 权限检查结果接口
 */
export interface PermissionCheckResult {
  allowed: boolean
  reason?: string
  requiredPermissions?: string[]
  userPermissions?: string[]
}

/**
 * 权限上下文接口
 */
export interface PermissionContext {
  user: User
  resource?: string
  action?: string
  data?: any
  environment?: Record<string, any>
}

/**
 * 权限策略接口
 */
export interface PermissionPolicy {
  name: string
  description?: string
  evaluate: (context: PermissionContext) => boolean | Promise<boolean>
}

/**
 * 认证状态枚举
 */
export enum AuthStatus {
  AUTHENTICATED = 'authenticated',
  UNAUTHENTICATED = 'unauthenticated',
  EXPIRED = 'expired',
  INVALID = 'invalid',
  LOADING = 'loading'
}

/**
 * 权限动作枚举
 */
export enum PermissionAction {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXECUTE = 'execute',
  MANAGE = 'manage',
  VIEW = 'view',
  EDIT = 'edit',
  PUBLISH = 'publish',
  APPROVE = 'approve'
}

/**
 * 资源类型枚举
 */
export enum ResourceType {
  PAGE = 'page',
  COMPONENT = 'component',
  API = 'api',
  DATA = 'data',
  FILE = 'file',
  SYSTEM = 'system'
}

/**
 * 权限管理器接口
 */
export interface IPermissionManager {
  /**
   * 检查用户是否有指定权限
   */
  hasPermission(user: User, permission: string): boolean
  
  /**
   * 检查用户是否有指定角色
   */
  hasRole(user: User, role: string): boolean
  
  /**
   * 检查用户是否可以访问资源
   */
  canAccess(user: User, resource: string, action?: string): boolean
  
  /**
   * 获取用户所有权限
   */
  getUserPermissions(user: User): string[]
  
  /**
   * 获取用户所有角色
   */
  getUserRoles(user: User): string[]
  
  /**
   * 添加权限策略
   */
  addPolicy(policy: PermissionPolicy): void
  
  /**
   * 移除权限策略
   */
  removePolicy(name: string): void
  
  /**
   * 评估权限策略
   */
  evaluatePolicy(context: PermissionContext): Promise<boolean>
}

/**
 * 认证管理器接口
 */
export interface IAuthManager {
  /**
   * 用户登录
   */
  login(credentials: LoginCredentials): Promise<LoginResult>
  
  /**
   * 用户登出
   */
  logout(): Promise<void>
  
  /**
   * 刷新令牌
   */
  refreshToken(): Promise<AuthToken>
  
  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null
  
  /**
   * 检查认证状态
   */
  getAuthStatus(): AuthStatus
  
  /**
   * 验证令牌
   */
  validateToken(token: string): Promise<boolean>
  
  /**
   * 设置认证状态监听器
   */
  onAuthStateChange(callback: (status: AuthStatus, user?: User) => void): () => void
}

/**
 * 用户管理器接口
 */
export interface IUserManager {
  /**
   * 创建用户
   */
  createUser(userData: Partial<User>): Promise<User>
  
  /**
   * 更新用户
   */
  updateUser(id: string, userData: Partial<User>): Promise<User>
  
  /**
   * 删除用户
   */
  deleteUser(id: string): Promise<void>
  
  /**
   * 获取用户
   */
  getUser(id: string): Promise<User | null>
  
  /**
   * 获取用户列表
   */
  getUsers(options?: {
    page?: number
    limit?: number
    search?: string
    role?: string
    status?: string
  }): Promise<{ users: User[]; total: number }>
  
  /**
   * 分配角色
   */
  assignRole(userId: string, roleId: string): Promise<void>
  
  /**
   * 移除角色
   */
  removeRole(userId: string, roleId: string): Promise<void>
  
  /**
   * 分配权限
   */
  assignPermission(userId: string, permissionId: string): Promise<void>
  
  /**
   * 移除权限
   */
  removePermission(userId: string, permissionId: string): Promise<void>
}

/**
 * 角色管理器接口
 */
export interface IRoleManager {
  /**
   * 创建角色
   */
  createRole(roleData: Partial<Role>): Promise<Role>
  
  /**
   * 更新角色
   */
  updateRole(id: string, roleData: Partial<Role>): Promise<Role>
  
  /**
   * 删除角色
   */
  deleteRole(id: string): Promise<void>
  
  /**
   * 获取角色
   */
  getRole(id: string): Promise<Role | null>
  
  /**
   * 获取角色列表
   */
  getRoles(): Promise<Role[]>
  
  /**
   * 分配权限
   */
  assignPermission(roleId: string, permissionId: string): Promise<void>
  
  /**
   * 移除权限
   */
  removePermission(roleId: string, permissionId: string): Promise<void>
}

/**
 * 权限管理器接口
 */
export interface IPermissionService {
  /**
   * 创建权限
   */
  createPermission(permissionData: Partial<Permission>): Promise<Permission>
  
  /**
   * 更新权限
   */
  updatePermission(id: string, permissionData: Partial<Permission>): Promise<Permission>
  
  /**
   * 删除权限
   */
  deletePermission(id: string): Promise<void>
  
  /**
   * 获取权限
   */
  getPermission(id: string): Promise<Permission | null>
  
  /**
   * 获取权限列表
   */
  getPermissions(): Promise<Permission[]>
  
  /**
   * 按资源获取权限
   */
  getPermissionsByResource(resource: string): Promise<Permission[]>
}

/**
 * 权限错误类
 */
export class PermissionError extends Error {
  constructor(
    message: string,
    public code: string = 'PERMISSION_DENIED',
    public requiredPermissions?: string[]
  ) {
    super(message)
    this.name = 'PermissionError'
  }
}

/**
 * 认证错误类
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string = 'AUTH_FAILED',
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * 权限工具类
 */
export class PermissionUtils {
  /**
   * 格式化权限代码
   */
  static formatPermissionCode(resource: string, action: string): string {
    return `${resource}:${action}`
  }
  
  /**
   * 解析权限代码
   */
  static parsePermissionCode(code: string): { resource: string; action: string } {
    const [resource, action] = code.split(':')
    return { resource, action }
  }
  
  /**
   * 检查权限代码格式
   */
  static isValidPermissionCode(code: string): boolean {
    return /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_-]+$/.test(code)
  }
  
  /**
   * 合并权限列表
   */
  static mergePermissions(...permissionLists: Permission[][]): Permission[] {
    const permissionMap = new Map<string, Permission>()
    
    permissionLists.flat().forEach(permission => {
      permissionMap.set(permission.code, permission)
    })
    
    return Array.from(permissionMap.values())
  }
  
  /**
   * 过滤权限
   */
  static filterPermissions(
    permissions: Permission[],
    filter: (permission: Permission) => boolean
  ): Permission[] {
    return permissions.filter(filter)
  }
  
  /**
   * 按资源分组权限
   */
  static groupPermissionsByResource(permissions: Permission[]): Record<string, Permission[]> {
    return permissions.reduce((groups, permission) => {
      const resource = permission.resource
      if (!groups[resource]) {
        groups[resource] = []
      }
      groups[resource].push(permission)
      return groups
    }, {} as Record<string, Permission[]>)
  }
}

/**
 * 常用权限常量
 */
export const COMMON_PERMISSIONS = {
  // 系统管理
  SYSTEM_MANAGE: 'system:manage',
  SYSTEM_CONFIG: 'system:config',
  
  // 用户管理
  USER_CREATE: 'user:create',
  USER_READ: 'user:read',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_MANAGE: 'user:manage',
  
  // 角色管理
  ROLE_CREATE: 'role:create',
  ROLE_READ: 'role:read',
  ROLE_UPDATE: 'role:update',
  ROLE_DELETE: 'role:delete',
  ROLE_MANAGE: 'role:manage',
  
  // 权限管理
  PERMISSION_CREATE: 'permission:create',
  PERMISSION_READ: 'permission:read',
  PERMISSION_UPDATE: 'permission:update',
  PERMISSION_DELETE: 'permission:delete',
  PERMISSION_MANAGE: 'permission:manage',
  
  // 内容管理
  CONTENT_CREATE: 'content:create',
  CONTENT_READ: 'content:read',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_PUBLISH: 'content:publish',
  CONTENT_MANAGE: 'content:manage'
} as const

/**
 * 常用角色常量
 */
export const COMMON_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  EDITOR: 'editor',
  USER: 'user',
  GUEST: 'guest'
} as const

// 工厂函数（保持向后兼容）
export function createPermissionManagerInstance(): IPermissionManager {
  return createPermissionManager()
}

export function createAuthManagerInstance(): IAuthManager {
  return createAuthManager()
}

export function createUserManagerInstance(): IUserManager {
  return createUserManager()
}

export function createRoleManagerInstance(): IRoleManager {
  return createRoleManager()
}

export function createPermissionServiceInstance(): IPermissionService {
  const authManager = createAuthManager()
  const permissionManager = createPermissionManager()
  const userManager = createUserManager()
  const roleManager = createRoleManager()
  
  return createPermissionService(authManager, permissionManager, userManager, roleManager)
}