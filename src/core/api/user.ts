/**
 * 用户管理 API 服务
 */

import { ApiClient } from './ApiClient'

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
export interface UserQueryParams {
  username?: string
  displayName?: string
  email?: string
  enabled?: boolean
  page?: number
  size?: number
}

/**
 * 分页响应
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
 * 获取用户分页列表
 */
export async function getUserPage(params: UserQueryParams): Promise<UnifiedResponse<PageResponse<User>>> {
  const client = getApiClient()
  const response = await client.get<UnifiedResponse<PageResponse<User>>>('/system/user/page', { params })
  return response.data
}

/**
 * 获取用户详情
 */
export async function getUserById(id: number): Promise<UnifiedResponse<User>> {
  const client = getApiClient()
  const response = await client.get<UnifiedResponse<User>>(`/system/user/${id}`)
  return response.data
}

/**
 * 创建用户
 */
export async function createUser(user: User): Promise<UnifiedResponse<User>> {
  const client = getApiClient()
  const response = await client.post<UnifiedResponse<User>>('/system/user', user)
  return response.data
}

/**
 * 更新用户
 */
export async function updateUser(id: number, user: Partial<User>): Promise<UnifiedResponse<User>> {
  const client = getApiClient()
  const response = await client.put<UnifiedResponse<User>>(`/system/user/${id}`, user)
  return response.data
}

/**
 * 删除用户
 */
export async function deleteUser(id: number): Promise<UnifiedResponse<void>> {
  const client = getApiClient()
  const response = await client.delete<UnifiedResponse<void>>(`/system/user/${id}`)
  return response.data
}
