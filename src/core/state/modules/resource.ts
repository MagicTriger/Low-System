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
    currentResource: null,
    loading: false,
    query: {
      page: 1,
      size: 10,
      name: '',
      menuCode: '',
      module: '',
      nodeType: undefined,
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
    resourcesByModule: state => (module: string) => state.resources.filter(r => r.module === module),
    resourcesByNodeType: state => (nodeType: number) => state.resources.filter(r => r.nodeType === nodeType),
    folderResources: state => state.resources.filter(r => r.nodeType === 1),
    pageResources: state => state.resources.filter(r => r.nodeType === 2),
    buttonResources: state => state.resources.filter(r => r.nodeType === 3),
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
        menuCode: '',
        module: '',
        nodeType: undefined,
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
        // 使用传入的参数，如果没有则使用默认值
        const queryParams: MenuQueryParams = {
          page: params?.page || 1,
          size: params?.size || 10,
          name: params?.name || '',
          menuCode: params?.menuCode || '',
          module: params?.module || '',
          nodeType: params?.nodeType,
        }

        const response = await menuApiService.getMenuList(queryParams)

        if (response.success) {
          context.commit('setResources', response.data.data)
          context.commit('setPagination', {
            total: response.data.total,
            page: response.data.page,
            size: response.data.size,
            totalPages: response.data.totalPages,
          })
        } else {
          throw new Error(response.message || '获取资源列表失败')
        }

        return response
      } catch (error: any) {
        console.error('获取资源列表失败:', error)
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
        const response = await menuApiService.updateMenu(data)

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
          context.commit('setAdminMenuTree', response.data)
        } else {
          throw new Error(response.message || '获取管理端菜单树失败')
        }

        return response
      } catch (error: any) {
        console.error('获取管理端菜单树失败:', error)
        throw error
      }
    },

    /**
     * 挂载菜单到管理端
     */
    async mountMenuToAdmin(context, menuCode: string) {
      try {
        const response = await menuApiService.mountMenuToAdmin(menuCode)

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
     * 取消菜单挂载
     */
    async unmountMenuFromAdmin(context, menuCode: string) {
      try {
        const response = await menuApiService.unmountMenuFromAdmin(menuCode)

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
     * 刷新管理端菜单树
     */
    async refreshAdminMenuTree(context) {
      await context.dispatch('fetchAdminMenuTree')
    },
  },
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
  return resource.nodeType === 1 // 只有文件夹类型可以作为父节点
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
