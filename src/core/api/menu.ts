/**
 * 菜单管理 API 服务
 *
 * 提供菜单资源的 CRUD 操作接口
 */

import type { IApiClient } from './IApiClient'
import { ApiClient } from './ApiClient'
import type { StandardApiResponse, MenuTreeNode as SharedMenuTreeNode } from './shared-types'

/**
 * 菜单类型枚举
 */
export enum MenuType {
  /** 目录 */
  DIRECTORY = 'DIRECTORY',
  /** 客户端 */
  CLIENT = 'CLIENT',
  /** 菜单 */
  MENU = 'MENU',
  /** 自定义界面 */
  CUSTOM_PAGE = 'CUSTOM_PAGE',
  /** 模型页面 */
  MODEL_PAGE = 'MODEL_PAGE',
  /** 按钮 */
  BUTTON = 'BUTTON',
}

/**
 * 菜单资源数据模型
 */
export interface MenuResource {
  id: number
  code: string
  name: string
  type: MenuType // 菜单类型
  url?: string
  path?: string
  icon?: string
  sortOrder: number
  parentId: number | null
  modelId?: number
  modelActionId?: number
  mountedToAdmin?: boolean
  createTime?: string
  remark?: string
  children?: MenuResource[]
}

/**
 * 菜单树节点（扩展版本）
 *
 * 扩展自 MenuResource，添加了树形结构支持
 */
export interface MenuTreeNode extends MenuResource {
  children?: MenuTreeNode[]
}

/**
 * @deprecated 使用 MenuTreeNode 替代
 * 为了向后兼容，保留此类型别名
 */
export type MenuApiTreeNode = MenuTreeNode

/**
 * 挂载/取消挂载菜单响应
 */
export interface MenuMountResponse {
  id: number
  menuCode: string
  name: string
  mountedToAdmin: boolean
  sortOrder: number
  updatedAt: string
}

/**
 * 菜单查询参数
 */
export interface MenuQueryParams {
  name?: string
  code?: string
  type?: MenuType
  parentId?: number
  path?: string
  mountedToAdmin?: boolean
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
  code: string
  name: string
  type: MenuType // 菜单类型
  url?: string
  path?: string
  icon?: string
  sortOrder?: number
  parentId?: number | null
  modelId?: number
  modelActionId?: number
  mountedToAdmin?: boolean
  remark?: string
}

/**
 * 更新菜单请求
 */
export interface MenuUpdateRequest {
  id: number
  code?: string
  name?: string
  type?: MenuType // 菜单类型
  url?: string
  path?: string
  icon?: string
  sortOrder?: number
  parentId?: number | null
  modelId?: number
  modelActionId?: number
  mountedToAdmin?: boolean
  remark?: string
}

// StandardApiResponse 已从 shared-types 导入，不再重复定义

/**
 * 菜单管理 API 服务类
 */
export class MenuApiService {
  private apiClient: IApiClient

  constructor(apiClient?: IApiClient) {
    if (apiClient) {
      this.apiClient = apiClient
    } else {
      // 创建带 /api 前缀的 ApiClient
      const baseURL = import.meta.env.DEV
        ? '/api' // 开发环境：使用代理
        : (import.meta.env.VITE_SERVICE_URL || 'http://localhost:8090') + '/api' // 生产环境：完整URL

      this.apiClient = new ApiClient({
        url: baseURL,
        headers: {
          'Content-Type': 'application/json',
        },
      })
    }
  }

  /**
   * 创建菜单
   * POST /system/menu
   */
  async createMenu(data: MenuCreateRequest): Promise<StandardApiResponse<MenuResource>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<MenuResource>>('/system/menu', data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 查询菜单详情
   * GET /system/menu/[id]
   */
  async getMenuDetail(id: number): Promise<StandardApiResponse<MenuResource>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuResource>>(`/system/menu/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 更新菜单
   * PUT /system/menu/[id]
   */
  async updateMenu(id: number, data: MenuUpdateRequest): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.put<StandardApiResponse<void>>(`/system/menu/${id}`, data)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 删除菜单
   * DELETE /system/menu/[id]
   */
  async deleteMenu(id: number): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.delete<StandardApiResponse<void>>(`/system/menu/${id}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 查询所有菜单
   * GET /system/menu/all
   */
  async getAllMenus(): Promise<StandardApiResponse<MenuResource[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuResource[]>>('/system/menu/all')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 挂载菜单到管理端
   * POST /system/menu/mount
   */
  async mountMenu(menuId: number): Promise<StandardApiResponse<MenuMountResponse>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<MenuMountResponse>>('/system/menu/mount', { menuId })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 取消挂载菜单
   * DELETE /system/menu/mount/[menuId]
   */
  async unmountMenu(menuId: number): Promise<StandardApiResponse<MenuMountResponse>> {
    try {
      const response = await this.apiClient.delete<StandardApiResponse<MenuMountResponse>>(`/system/menu/mount/${menuId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 批量挂载菜单
   * POST /system/menu/mount/batch
   */
  async mountMenuBatch(menuIds: number[], mountToAdmin: boolean = true): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.post<StandardApiResponse<void>>('/system/menu/mount/batch', {
        menuIds,
        mountToAdmin,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 更新挂载菜单排序（单个）
   * PUT /system/menu/mount/sort
   */
  async updateMountSort(menuId: number, sortOrder: number): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.put<StandardApiResponse<void>>('/system/menu/mount/sort', {
        menuId,
        sortOrder,
      })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 批量更新挂载菜单排序
   * PUT /system/menu/mount/sort/batch
   */
  async updateMountSortBatch(sortData: Array<{ menuId: number; sortOrder: number }>): Promise<StandardApiResponse<void>> {
    try {
      const response = await this.apiClient.put<StandardApiResponse<void>>('/system/menu/mount/sort/batch', { items: sortData })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取已挂载菜单列表
   * GET /system/menu/mounted
   */
  async getMountedMenus(): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>('/system/menu/mounted')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 分页查询菜单
   * GET /system/menu/page
   */
  async getMenuPage(params: MenuQueryParams = {}): Promise<StandardApiResponse<MenuPageResult>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuPageResult>>('/system/menu/page', { params })
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 查询角色的菜单
   * GET /system/menu/role/[roleId]
   */
  async getRoleMenus(roleId: number): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>(`/system/menu/role/${roleId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 查询菜单树
   * GET /system/menu/tree
   */
  async getMenuTree(): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>('/system/menu/tree')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 查询用户菜单树
   * GET /system/menu/tree/user/[userId]
   */
  async getUserMenuTree(userId: number): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>(`/system/menu/tree/user/${userId}`)
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  /**
   * 获取当前用户的菜单列表直接用
   * GET /system/menu/user-menus
   */
  async getCurrentUserMenus(): Promise<StandardApiResponse<MenuTreeNode[]>> {
    try {
      const response = await this.apiClient.get<StandardApiResponse<MenuTreeNode[]>>('/system/menu/user-menus')
      return response.data
    } catch (error) {
      throw this.handleError(error)
    }
  }

  // ========== 兼容旧接口（保留用于向后兼容）==========

  /**
   * @deprecated 使用 getMenuPage 替代
   */
  async getMenuList(params: MenuQueryParams = {}): Promise<StandardApiResponse<MenuPageResult>> {
    return this.getMenuPage(params)
  }

  /**
   * @deprecated 使用 getMountedMenus 替代
   */
  async getAdminMenuTree(): Promise<StandardApiResponse<MenuTreeNode[]>> {
    return this.getMountedMenus()
  }

  /**
   * @deprecated 使用 mountMenu 替代
   */
  async mountMenuToAdmin(menuCode: string): Promise<StandardApiResponse<void>> {
    console.warn('mountMenuToAdmin is deprecated, use mountMenu instead')
    // 需要先通过 menuCode 查找 menuId
    throw new Error('This method is deprecated. Please use mountMenu(menuId) instead.')
  }

  /**
   * @deprecated 使用 unmountMenu 替代
   */
  async unmountMenuFromAdmin(menuCode: string): Promise<StandardApiResponse<void>> {
    console.warn('unmountMenuFromAdmin is deprecated, use unmountMenu instead')
    throw new Error('This method is deprecated. Please use unmountMenu(menuId) instead.')
  }

  /**
   * @deprecated 使用 getMountedMenus 替代
   */
  async isMenuMountedToAdmin(menuCode: string): Promise<StandardApiResponse<boolean>> {
    console.warn('isMenuMountedToAdmin is deprecated')
    throw new Error('This method is deprecated. Please use getMountedMenus() to check mount status.')
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
