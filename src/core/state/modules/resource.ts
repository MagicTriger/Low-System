/**
 * Resource 状态模块
 *
 * 管理菜单资源的状态和操作
 */

import type { IStateModule } from '../IStateModule'
import type { MenuResource, MenuTreeNode, MenuQueryParams, MenuCreateRequest, MenuUpdateRequest } from '@/core/api/menu'
import { menuApiService } from '@/core/api/menu'

/**
 * Resource 状态接口
 */
export interface ResourceState {
  resources: MenuResource[]
  resourceTree: MenuTreeNode[]
  adminMenuTree: MenuTreeNode[] // 管理端菜单树
  userMenuTree: MenuTreeNode[] // 用户菜单树
  pathMap: Record<string, string> // url -> path 映射表
  currentResource: MenuResource | null
  loading: boolean
  query: MenuQueryParams
  pagination: {
    total: number
    page: number
    size: number
    totalPages: number
  }
}

/**
 * Resource 状态模块
 */
export const resourceModule: IStateModule<ResourceState> = {
  name: 'resource',

  state: {
    resources: [],
    resourceTree: [],
    adminMenuTree: [], // 初始化管理端菜单树
    userMenuTree: [], // 初始化用户菜单树
    pathMap: {}, // 初始化路由映射表
    currentResource: null,
    loading: false,
    query: {
      page: 1,
      size: 10,
      name: '',
      code: '',
      type: undefined,
      path: '',
      mountedToAdmin: undefined,
    },
    pagination: {
      total: 0,
      page: 1,
      size: 10,
      totalPages: 0,
    },
  },

  getters: {
    filteredResources: state => state.resources,
    resourceById: state => (id: number) => state.resources.find(r => r.id === id),
    resourcesByType: state => (type: string) => state.resources.filter(r => r.type === type),
    clientResources: state => state.resources.filter(r => r.type === 'CLIENT'),
    directoryResources: state => state.resources.filter(r => r.type === 'DIRECTORY'),
    menuResources: state => state.resources.filter(r => r.type === 'MENU'),
    buttonResources: state => state.resources.filter(r => r.type === 'BUTTON'),
    // 根据 URL 获取 path
    getPathByUrl: state => (url: string) => state.pathMap[url],
    // 根据当前路由获取 path（支持模糊匹配）
    getCurrentPath: state => (currentRoute: string) => {
      // 精确匹配
      if (state.pathMap[currentRoute]) {
        return state.pathMap[currentRoute]
      }
      // 模糊匹配：找到最长的匹配前缀
      let longestMatch = ''
      let matchedPath = null
      for (const [url, path] of Object.entries(state.pathMap)) {
        if (currentRoute.startsWith(url) && url.length > longestMatch.length) {
          longestMatch = url
          matchedPath = path
        }
      }
      return matchedPath
    },
  },

  mutations: {
    setResources(state, payload: MenuResource[]) {
      state.resources = payload
    },

    setResourceTree(state, payload: MenuTreeNode[]) {
      state.resourceTree = payload
    },

    setAdminMenuTree(state, payload: MenuTreeNode[]) {
      state.adminMenuTree = payload
    },

    setUserMenuTree(state, payload: MenuTreeNode[]) {
      state.userMenuTree = payload
      // 自动构建映射表
      state.pathMap = buildPathMap(payload)
    },

    setPathMap(state, payload: Record<string, string>) {
      state.pathMap = payload
    },

    setCurrentResource(state, payload: MenuResource | null) {
      state.currentResource = payload
    },

    setLoading(state, payload: boolean) {
      state.loading = payload
    },

    setQuery(state, payload: Partial<MenuQueryParams>) {
      state.query = { ...state.query, ...payload }
    },

    setPagination(state, payload: Partial<ResourceState['pagination']>) {
      state.pagination = { ...state.pagination, ...payload }
    },

    resetQuery(state) {
      state.query = {
        page: 1,
        size: 10,
        name: '',
        code: '',
        type: undefined,
        path: '',
        mountedToAdmin: undefined,
      }
    },

    addResource(state, payload: MenuResource) {
      state.resources.push(payload)
    },

    updateResourceInList(state, payload: MenuResource) {
      const index = state.resources.findIndex(r => r.id === payload.id)
      if (index !== -1) {
        state.resources[index] = payload
      }
    },

    removeResource(state, payload: number) {
      state.resources = state.resources.filter(r => r.id !== payload)
    },
  },

  actions: {
    /**
     * 获取资源列表
     */
    async fetchResources(context, params?: Partial<MenuQueryParams>) {
      context.commit('setLoading', true)
      try {
        // 使用 getAllMenus 获取所有菜单（回退到扁平列表）
        const response = await menuApiService.getAllMenus()

        if (response.success) {
          // 检查数据是否为空
          if (!response.data || response.data.length === 0) {
            console.warn('⚠️ 菜单数据为空')
            context.commit('setResources', [])
            context.commit('setPagination', {
              total: 0,
              page: 1,
              size: params?.size || 10,
              totalPages: 0,
            })
            return response
          }

          let resources = response.data

          // 客户端过滤
          if (params?.name) {
            resources = resources.filter(r => r.name.includes(params.name!))
          }
          if (params?.code) {
            resources = resources.filter(r => r.code.includes(params.code!))
          }
          if (params?.type) {
            resources = resources.filter(r => r.type === params.type)
          }
          if (params?.path) {
            resources = resources.filter(r => r.path && r.path.includes(params.path!))
          }
          if (params?.mountedToAdmin !== undefined) {
            resources = resources.filter(r => r.mountedToAdmin === params.mountedToAdmin)
          }

          // 客户端分页
          const page = params?.page || 1
          const size = params?.size || 10
          const total = resources.length
          const totalPages = Math.ceil(total / size)

          // 将扁平列表构建为树形结构（用于表格树视图）
          const resourceTree = buildTree(resources)

          context.commit('setResources', resourceTree)
          context.commit('setPagination', {
            total,
            page,
            size,
            totalPages,
          })
        } else {
          throw new Error(response.message || '获取资源列表失败')
        }

        return response
      } catch (error: any) {
        console.error('获取资源列表失败:', error)
        // 设置空数据，避免页面崩溃
        context.commit('setResources', [])
        context.commit('setPagination', {
          total: 0,
          page: 1,
          size: params?.size || 10,
          totalPages: 0,
        })
        throw error
      } finally {
        context.commit('setLoading', false)
      }
    },

    /**
     * 获取资源树
     */
    async fetchResourceTree(context) {
      try {
        const response = await menuApiService.getMenuTree()

        if (response.success) {
          context.commit('setResourceTree', response.data)
        } else {
          throw new Error(response.message || '获取资源树失败')
        }

        return response
      } catch (error: any) {
        console.error('获取资源树失败:', error)
        throw error
      }
    },

    /**
     * 创建资源
     */
    async createResource(context, data: MenuCreateRequest) {
      try {
        const response = await menuApiService.createMenu(data)

        if (response.success) {
          // 重新获取资源列表
          await context.dispatch('fetchResources')
        } else {
          throw new Error(response.message || '创建资源失败')
        }

        return response
      } catch (error: any) {
        console.error('创建资源失败:', error)
        throw error
      }
    },

    /**
     * 更新资源
     */
    async updateResource(context, data: MenuUpdateRequest) {
      try {
        const response = await menuApiService.updateMenu(data.id, data)

        if (response.success) {
          // 重新获取资源列表
          await context.dispatch('fetchResources')
        } else {
          throw new Error(response.message || '更新资源失败')
        }

        return response
      } catch (error: any) {
        console.error('更新资源失败:', error)
        throw error
      }
    },

    /**
     * 删除资源
     */
    async deleteResource(context, id: number) {
      try {
        const response = await menuApiService.deleteMenu(id)

        if (response.success) {
          // 从列表中移除
          context.commit('removeResource', id)
          // 重新获取资源列表以确保数据一致性
          await context.dispatch('fetchResources')
        } else {
          throw new Error(response.message || '删除资源失败')
        }

        return response
      } catch (error: any) {
        console.error('删除资源失败:', error)
        throw error
      }
    },

    /**
     * 设置查询参数
     */
    setQueryParams(context, params: Partial<MenuQueryParams>) {
      context.commit('setQuery', params)
    },

    /**
     * 重置查询参数
     */
    resetQueryParams(context) {
      context.commit('resetQuery')
    },

    /**
     * 设置当前资源
     */
    selectResource(context, resource: MenuResource | null) {
      context.commit('setCurrentResource', resource)
    },

    /**
     * 刷新资源列表
     */
    async refreshResources(context) {
      await context.dispatch('fetchResources')
    },

    /**
     * 刷新资源树
     */
    async refreshResourceTree(context) {
      await context.dispatch('fetchResourceTree')
    },

    /**
     * 获取管理端菜单树
     */
    async fetchAdminMenuTree(context) {
      try {
        const response = await menuApiService.getAdminMenuTree()

        if (response.success) {
          // 处理可能的分页格式
          let menuData: MenuTreeNode[] = []

          if (Array.isArray(response.data)) {
            // 直接是数组
            menuData = response.data
          } else if (response.data && typeof response.data === 'object' && 'records' in response.data) {
            // 分页对象格式
            menuData = (response.data as any).records || []
          }

          context.commit('setAdminMenuTree', menuData)
        } else {
          throw new Error(response.message || '获取管理端菜单树失败')
        }

        return response
      } catch (error: any) {
        console.error('获取管理端菜单树失败:', error)
        // 失败时设置空数组
        context.commit('setAdminMenuTree', [])
        throw error
      }
    },

    /**
     * 挂载菜单到管理端（新API - 使用menuId）
     */
    async mountMenu(context, menuId: number) {
      try {
        const response = await menuApiService.mountMenu(menuId)

        if (response.success) {
          // 刷新菜单树
          await context.dispatch('fetchResourceTree')
          await context.dispatch('fetchAdminMenuTree')
        } else {
          throw new Error(response.message || '挂载菜单失败')
        }

        return response
      } catch (error: any) {
        console.error('挂载菜单失败:', error)
        throw error
      }
    },

    /**
     * 取消菜单挂载（新API - 使用menuId）
     */
    async unmountMenu(context, menuId: number) {
      try {
        const response = await menuApiService.unmountMenu(menuId)

        if (response.success) {
          // 刷新菜单树
          await context.dispatch('fetchResourceTree')
          await context.dispatch('fetchAdminMenuTree')
        } else {
          throw new Error(response.message || '取消挂载失败')
        }

        return response
      } catch (error: any) {
        console.error('取消挂载失败:', error)
        throw error
      }
    },

    /**
     * 批量挂载菜单
     */
    async mountMenuBatch(context, menuIds: number[]) {
      try {
        const response = await menuApiService.mountMenuBatch(menuIds)

        if (response.success) {
          // 刷新菜单树
          await context.dispatch('fetchResourceTree')
          await context.dispatch('fetchAdminMenuTree')
        } else {
          throw new Error(response.message || '批量挂载失败')
        }

        return response
      } catch (error: any) {
        console.error('批量挂载失败:', error)
        throw error
      }
    },

    /**
     * 更新挂载菜单排序（单个）
     */
    async updateMountSort(context, payload: { menuId: number; sortOrder: number }) {
      try {
        const response = await menuApiService.updateMountSort(payload.menuId, payload.sortOrder)

        if (response.success) {
          // 刷新管理端菜单树
          await context.dispatch('fetchAdminMenuTree')
        } else {
          throw new Error(response.message || '更新排序失败')
        }

        return response
      } catch (error: any) {
        console.error('更新排序失败:', error)
        throw error
      }
    },

    /**
     * 批量更新挂载菜单排序
     */
    async updateMountSortBatch(context, sortData: Array<{ menuId: number; sortOrder: number }>) {
      try {
        const response = await menuApiService.updateMountSortBatch(sortData)

        if (response.success) {
          // 刷新管理端菜单树
          await context.dispatch('fetchAdminMenuTree')
        } else {
          throw new Error(response.message || '批量更新排序失败')
        }

        return response
      } catch (error: any) {
        console.error('批量更新排序失败:', error)
        throw error
      }
    },

    /**
     * 获取已挂载菜单列表
     */
    async fetchMountedMenus(context) {
      try {
        const response = await menuApiService.getMountedMenus()

        if (response.success) {
          context.commit('setAdminMenuTree', response.data)
        } else {
          throw new Error(response.message || '获取已挂载菜单失败')
        }

        return response
      } catch (error: any) {
        console.error('获取已挂载菜单失败:', error)
        throw error
      }
    },

    /**
     * @deprecated 使用 mountMenu 替代
     */
    async mountMenuToAdmin(context, menuCode: string) {
      console.warn('mountMenuToAdmin is deprecated, use mountMenu instead')
      throw new Error('This method is deprecated. Please use mountMenu(menuId) instead.')
    },

    /**
     * @deprecated 使用 unmountMenu 替代
     */
    async unmountMenuFromAdmin(context, menuCode: string) {
      console.warn('unmountMenuFromAdmin is deprecated, use unmountMenu instead')
      throw new Error('This method is deprecated. Please use unmountMenu(menuId) instead.')
    },

    /**
     * 刷新管理端菜单树
     */
    async refreshAdminMenuTree(context) {
      await context.dispatch('fetchAdminMenuTree')
    },

    /**
     * 获取当前用户菜单
     */
    async fetchCurrentUserMenus(context) {
      try {
        const response = await menuApiService.getCurrentUserMenus()

        if (response.success) {
          context.commit('setUserMenuTree', response.data)
        } else {
          throw new Error(response.message || '获取用户菜单失败')
        }

        return response
      } catch (error: any) {
        console.error('获取用户菜单失败:', error)
        throw error
      }
    },

    /**
     * 刷新用户菜单
     */
    async refreshUserMenus(context) {
      await context.dispatch('fetchCurrentUserMenus')
    },
  },
}

/**
 * 辅助函数：构建路由映射表
 */
function buildPathMap(menuTree: MenuTreeNode[]): Record<string, string> {
  const map: Record<string, string> = {}

  function traverse(nodes: MenuTreeNode[]) {
    for (const node of nodes) {
      if (node.url && node.path) {
        map[node.url] = node.path
      }
      if (node.children) {
        traverse(node.children)
      }
    }
  }

  traverse(menuTree)
  return map
}

/**
 * 资源辅助函数
 */

/**
 * 根据 nodeType 获取节点类型文本
 */
export function getNodeTypeText(nodeType: number): string {
  switch (nodeType) {
    case 1:
      return '文件夹'
    case 2:
      return '页面'
    case 3:
      return '按钮'
    default:
      return '未知'
  }
}

/**
 * 检查资源是否可以作为父节点
 */
export function canBeParent(resource: MenuResource): boolean {
  return resource.type === 'DIRECTORY' || resource.type === 'CLIENT' // 目录和客户端可以作为父节点
}

/**
 * 在树中查找资源
 */
export function findResourceInTree(tree: MenuTreeNode[], id: number): MenuTreeNode | null {
  for (const node of tree) {
    if (node.id === id) {
      return node
    }
    if (node.children) {
      const found = findResourceInTree(node.children, id)
      if (found) return found
    }
  }
  return null
}

/**
 * 扁平化树结构
 */
export function flattenTree(tree: MenuTreeNode[]): MenuResource[] {
  const result: MenuResource[] = []

  function traverse(nodes: MenuTreeNode[]) {
    for (const node of nodes) {
      const { children, ...resource } = node
      result.push(resource as MenuResource)
      if (children) {
        traverse(children)
      }
    }
  }

  traverse(tree)
  return result
}

/**
 * 构建树结构
 */
export function buildTree(resources: MenuResource[]): MenuTreeNode[] {
  const map = new Map<number, MenuTreeNode>()
  const roots: MenuTreeNode[] = []

  // 创建节点映射
  resources.forEach(resource => {
    map.set(resource.id, { ...resource, children: [] })
  })

  // 构建树结构
  resources.forEach(resource => {
    const node = map.get(resource.id)!
    if (resource.parentId === null) {
      roots.push(node)
    } else {
      const parent = map.get(resource.parentId)
      if (parent) {
        if (!parent.children) {
          parent.children = []
        }
        parent.children.push(node)
      }
    }
  })

  // 按 sortOrder 排序
  function sortTree(nodes: MenuTreeNode[]) {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder)
    nodes.forEach(node => {
      if (node.children) {
        sortTree(node.children)
      }
    })
  }

  sortTree(roots)
  return roots
}
