/**
 * 菜单管理 API 服务
 *
 * 提供菜单资源的 CRUD 操作接口
 */

import type { IApiClient } from './IApiClient'
import { ApiClient } from './ApiClient'

/**
 * 菜单资源数据模型
 */
export interface MenuResource {
  id: number
  parentId: number | null
  menuCode: string
  name: string
  module: string
  nodeType: 1 | 2 | 3 // 1=文件夹, 2=页面, 3=按钮
  nodeTypeText: string
  sortOrder: number
  url?: string
  icon?: string
  path?: string
  meta?: string
  createdAt: string
}

/**
 * 菜单树节点
 */
export interface MenuTreeNode extends MenuResource {
  children?: MenuTreeNode[]
  mountedToAdmin?: boolean // 是否挂载到管理端
}

/**
 * 菜单查询参数
 */
export interface MenuQueryParams {
  name?: string
  menuCode?: string
  module?: string
  nodeType?: number
  parentId?: number
  icon?: string
  path?: string
  meta?: string
  page?: number
  size?: number
}

/**
 * 菜单分页结果
 */
export interface MenuPageResult {
  data: MenuResource[]
  total: number
  page: number
  size: number
  totalPages: number
  hasNext: boolean
  hasPrevious: boolean
}

/**
 * 创建菜单请求
 */
export interface MenuCreateRequest {
  parentId?: number | null
  menuCode: string
  name: string
  module: string
  nodeType?: number
  sortOrder?: number
  url?: string
  icon?: string
  path?: string
  meta?: string
}

/**
 * 更新菜单请求
 */
export interface MenuUpdateRequest {
  id: number
  parentId?: number | null
  menuCode: string
  name: string
  module: string
  nodeType: number
  sortOrder: number
  url?: string
  icon?: string
  path?: string
  meta?: string
}

/**
 * 标准 API 响应格式
 */
export interface StandardApiResponse<T = any> {
  success: boolean
  code: number
  message: string
  data: T
}

/**
 * 菜单管理 API 服务类
 */
export class MenuApiService {
  private apiClient: IApiClient

  constructor(apiClient?: IApiClient) {
    this.apiClient = apiClient || new ApiClient()
  }

  /**
   * 查询菜单列表（分页）
   */
  async getMenuList(params: MenuQueryParams = {}): Promise<StandardApiResponse<MenuPageResult>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuPageResult>>('/api/permissions/menus/list', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取菜单树结构
   */
  async getMenuTree(): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>('/api/permissions/menus/tree')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 创建菜单
   */
  async createMenu(data: MenuCreateRequest): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<void>>('/api/permissions/menus/create', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 更新菜单
   */
  async updateMenu(data: MenuUpdateRequest): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.put<StandardApiResponse<void>>('/api/permissions/menus/update', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 删除菜单
   */
  async deleteMenu(id: number): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<StandardApiResponse<void>>(`/api/permissions/menus/delete/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取已挂载到管理端的菜单树
   */
  async getAdminMenuTree(): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>('/api/permissions/menus/admin-tree')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 挂载菜单到管理端
   */
  async mountMenuToAdmin(menuCode: string): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<void>>('/api/permissions/menus/mount-to-admin', { menuCode })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 取消菜单挂载
   */
  async unmountMenuFromAdmin(menuCode: string): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<void>>('/api/permissions/menus/unmount-from-admin', { menuCode })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 检查菜单是否已挂载到管理端
   */
  async isMenuMountedToAdmin(menuCode: string): Promise<StandardApiResponse<boolean>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<boolean>>(`/api/permissions/menus/is-mounted/${menuCode}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    // 如果是 API 响应错误
    if (error.response) {
      const { status, data } = error.response

      switch (status) {
        case 400:
          return new Error(data?.message || '请求参数错误')
        case 401:
          // 未授权，需要跳转到登录页
          return new Error('未授权，请重新登录')
        case 403:
          return new Error('权限不足')
        case 404:
          return new Error('资源不存在')
        case 409:
          return new Error(data?.message || '资源冲突')
        case 500:
          return new Error('服务器内部错误')
        default:
          return new Error(data?.message || '未知错误')
      }
    }

    // 网络错误
    if (error.isNetworkError) {
      return new Error('网络请求失败，请检查网络连接')
    }

    // 超时错误
    if (error.isTimeoutError) {
      return new Error('请求超时，请稍后重试')
    }

    // 取消错误
    if (error.isCancelError) {
      return new Error('请求已取消')
    }

    // 其他错误
    return new Error(error.message || '请求配置错误')
  }
}

/**
 * 创建菜单 API 服务实例
 */
export function createMenuApiService(apiClient?: IApiClient): MenuApiService {
  return new MenuApiService(apiClient)
}

/**
 * 默认菜单 API 服务实例
 */
export const menuApiService = new MenuApiService()
