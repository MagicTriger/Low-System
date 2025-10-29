/**
 * 用户管理 API 模块
 *
 * 提供用户管理相关的 API 接口
 * 使用统一的命名约定和响应格式
 */

import { ApiClient } from './ApiClient'
import type { ApiResponse, ApiListResponse, ApiQueryParams } from './types'

/**
 * 用户信息
 */
export interface User {
  id?: number
  username: string
  password?: string
  displayName?: string
  email?: string
  phone?: string
  enabled?: boolean
  createdAt?: string
  updatedAt?: string
}

/**
 * 用户查询参数
 */
export interface UserQueryParams extends ApiQueryParams {
  username?: string
  displayName?: string
  email?: string
  enabled?: boolean
}

/**
 * 创建用户参数
 */
export interface CreateUserParams {
  username: string
  password: string
  displayName?: string
  email?: string
  phone?: string
  enabled?: boolean
}

/**
 * 更新用户参数
 */
export interface UpdateUserParams {
  id: number
  data: Partial<User>
}

/**
 * 分页响应（Spring Boot 格式）
 */
export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

/**
 * 统一响应格式
 */
export interface UnifiedResponse<T = any> {
  code: number
  message: string
  data: T
}

// 创建共享的 API 客户端实例
let apiClient: ApiClient | null = null

function getApiClient(): ApiClient {
  if (!apiClient) {
    // 从环境变量或全局配置获取 baseURL
    const baseURL = import.meta.env.VITE_API_BASE_URL || ''
    apiClient = new ApiClient({ url: baseURL })
  }
  return apiClient
}

/**
 * 用户 API 服务
 */
export const userApi = {
  /**
   * 获取用户分页列表
   * GET /system/user/page
   */
  async getList(params: UserQueryParams): Promise<UnifiedResponse<PageResponse<User>>> {
    const client = getApiClient()
    const response = await client.get<UnifiedResponse<PageResponse<User>>>('/system/user/page', { params })
    return response.data
  },

  /**
   * 获取用户详情
   * GET /system/user/:id
   */
  async get(id: number): Promise<UnifiedResponse<User>> {
    const client = getApiClient()
    const response = await client.get<UnifiedResponse<User>>(`/system/user/${id}`)
    return response.data
  },

  /**
   * 创建用户
   * POST /system/user
   */
  async create(user: CreateUserParams): Promise<UnifiedResponse<User>> {
    const client = getApiClient()
    const response = await client.post<UnifiedResponse<User>>('/system/user', user)
    return response.data
  },

  /**
   * 更新用户
   * PUT /system/user/:id
   */
  async update(id: number, user: Partial<User>): Promise<UnifiedResponse<User>> {
    const client = getApiClient()
    const response = await client.put<UnifiedResponse<User>>(`/system/user/${id}`, user)
    return response.data
  },

  /**
   * 删除用户
   * DELETE /system/user/:id
   */
  async delete(id: number): Promise<UnifiedResponse<void>> {
    const client = getApiClient()
    const response = await client.delete<UnifiedResponse<void>>(`/system/user/${id}`)
    return response.data
  },
}

// ============================================================================
// 向后兼容的函数导出
// ============================================================================

/**
 * @deprecated 使用 userApi.getList 替代
 */
export async function getUserPage(params: UserQueryParams): Promise<UnifiedResponse<PageResponse<User>>> {
  return userApi.getList(params)
}

/**
 * @deprecated 使用 userApi.get 替代
 */
export async function getUserById(id: number): Promise<UnifiedResponse<User>> {
  return userApi.get(id)
}

/**
 * @deprecated 使用 userApi.create 替代
 */
export async function createUser(user: CreateUserParams): Promise<UnifiedResponse<User>> {
  return userApi.create(user)
}

/**
 * @deprecated 使用 userApi.update 替代
 */
export async function updateUser(id: number, user: Partial<User>): Promise<UnifiedResponse<User>> {
  return userApi.update(id, user)
}

/**
 * @deprecated 使用 userApi.delete 替代
 */
export async function deleteUser(id: number): Promise<UnifiedResponse<void>> {
  return userApi.delete(id)
}
