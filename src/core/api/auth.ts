/**
 * 认证 API 服务
 *
 * 提供登录、登出等认证相关接口
 */

import type { IApiClient, ApiResponse } from './IApiClient'
import { ApiClient } from './ApiClient'
import type { StandardApiResponse, MenuTreeNode } from './shared-types'

/**
 * 用户基本信息
 */
export interface UserInfo {
  userId: number
  username: string
  enabled: boolean
  createdAt: string
  displayName?: string
  avatar?: string
  email?: string
}

/**
 * 权限信息
 */
export interface PermissionInfo {
  roleIds: number[]
  roleNames: string[]
  permissions: string[]
  menus: MenuTreeNode[]
}

/**
 * 登录状态信息
 */
export interface LoginStatusInfo {
  loginTime: string
  loginIp: string
  clientInfo: string
  sessionId: string
}

/**
 * 登录响应数据
 */
export interface LoginResponseData {
  accessToken: string
  tokenType: string
  expiresIn: number
  userInfo: UserInfo
  permissionInfo: PermissionInfo
  loginStatusInfo: LoginStatusInfo
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  username: string
  password: string
}

/**
 * 认证 API 服务类
 */
export class AuthApiService {
  private apiClient: IApiClient

  constructor(apiClient?: IApiClient) {
    // 如果没有提供apiClient，创建一个带baseURL的新实例
    if (!apiClient) {
      // 在开发环境使用相对路径（通过Vite代理），生产环境使用完整URL
      const baseURL = import.meta.env.DEV
        ? '/api' // 开发环境：使用代理
        : (import.meta.env.VITE_SERVICE_URL || 'http://localhost:8090') + '/api' // 生产环境：完整URL

      this.apiClient = new ApiClient({
        url: baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } else {
      this.apiClient = apiClient
    }
  }

  /**
   * 用户登录
   */
  async login(credentials: LoginRequest): Promise<StandardApiResponse<LoginResponseData>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<LoginResponseData>>('/auth/login', credentials)

      // 保存token到localStorage
      if (response.data.success && response.data.data) {
        const { accessToken, tokenType } = response.data.data
        localStorage.setItem('accessToken', accessToken)
        localStorage.setItem('tokenType', tokenType)
      }

      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 用户登出
   */
  async logout(): Promise<StandardApiResponse<string>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<string>>('/auth/logout', {})

      // 清除本地存储
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenType')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('permissions')

      return response.data
    } catch (error) {
      // 即使登出失败也清除本地数据
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenType')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('permissions')

      throw this.handleError(error)
    }
  }

  /**
   * 检查权限
   */
  hasPermission(permission: string, permissions: string[]): boolean {
    return permissions.includes(permission)
  }

  /**
   * 检查角色
   */
  hasRole(roleName: string, roleNames: string[]): boolean {
    return roleNames.includes(roleName)
  }

  /**
   * 检查是否有任一权限
   */
  hasAnyPermission(requiredPermissions: string[], userPermissions: string[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission))
  }

  /**
   * 检查是否有所有权限
   */
  hasAllPermissions(requiredPermissions: string[], userPermissions: string[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission))
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          return new Error(data?.message || '请求参数错误')
        case 401:
          return new Error(data?.message || '用户名或密码错误')
        case 403:
          return new Error('权限不足')
        case 500:
          return new Error('服务器内部错误')
        default:
          return new Error(data?.message || '未知错误')
      }
    }

    if (error.isNetworkError) {
      return new Error('网络请求失败，请检查网络连接')
    }

    if (error.isTimeoutError) {
      return new Error('请求超时，请稍后重试')
    }

    return new Error(error.message || '请求失败')
  }
}

/**
 * 创建认证 API 服务实例
 */
export function createAuthApiService(apiClient?: IApiClient): AuthApiService {
  return new AuthApiService(apiClient)
}

/**
 * 默认认证 API 服务实例
 */
export const authApiService = new AuthApiService()
