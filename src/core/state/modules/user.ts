/**
 * User状态模块
 *
 * 管理用户信息、权限和角色
 */

import type { IStateModule } from '../IStateModule'
import type { UserInfo, LoginResponse } from '../../../types/index'
import { CONSTANTS } from '@/core/global'
import { authApiService } from '@/core/api/auth'

/**
 * User状态接口
 */
export interface UserState {
  userInfo: UserInfo | null
  token: string
  permissions: string[]
  roles: string[]
}

/**
 * User状态模块
 */
export const userModule: IStateModule<UserState> = {
  name: 'user',

  state: {
    userInfo: null,
    token: '',
    permissions: [],
    roles: [],
  },

  getters: {
    isLoggedIn: state => !!state.token && !!state.userInfo,
    username: state => state.userInfo?.username || '',
    nickname: state => state.userInfo?.nickname || '',
    avatar: state => state.userInfo?.avatar || '',
  },

  mutations: {
    setUserInfo(state, payload: UserInfo | null) {
      state.userInfo = payload
    },

    setToken(state, payload: string) {
      state.token = payload
    },

    setPermissions(state, payload: string[]) {
      state.permissions = payload
    },

    setRoles(state, payload: string[]) {
      state.roles = payload
    },

    clearUser(state) {
      state.userInfo = null
      state.token = ''
      state.permissions = []
      state.roles = []
    },
  },

  actions: {
    /**
     * 用户登录
     */
    async login(context, payload: { username: string; password: string }) {
      try {
        const response = await authApiService.login(payload)
        const { token: accessToken, userInfo: user } = response.data as unknown as LoginResponse

        // 保存用户信息
        context.commit('setToken', accessToken)
        context.commit('setUserInfo', user)
        context.commit('setPermissions', user.permissions || [])
        context.commit('setRoles', user.roles || [])

        // 保存到本地存储
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.TOKEN, accessToken)
        localStorage.setItem(CONSTANTS.STORAGE_KEYS.USER_INFO, JSON.stringify(user))

        return response
      } catch (error) {
        console.error('登录失败:', error)
        throw error
      }
    },

    /**
     * 用户登出
     */
    async logout(context) {
      try {
        if (context.state.token) {
          await authApiService.logout()
        }
      } catch (error) {
        console.warn('登出请求失败:', error)
      } finally {
        // 清除状态
        context.commit('clearUser')

        // 清除本地存储
        localStorage.removeItem(CONSTANTS.STORAGE_KEYS.TOKEN)
        localStorage.removeItem(CONSTANTS.STORAGE_KEYS.USER_INFO)
      }
    },

    /**
     * 获取用户信息
     * 注意：此方法已废弃，请使用 auth 模块
     */
    async getUserInfo(context) {
      console.warn('user/getUserInfo is deprecated, please use auth module instead')
      // 从localStorage恢复用户信息
      const savedUserInfo = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_INFO)
      if (savedUserInfo) {
        try {
          const user = JSON.parse(savedUserInfo) as UserInfo
          context.commit('setUserInfo', user)
          context.commit('setPermissions', user.permissions || [])
          context.commit('setRoles', user.roles || [])
          return user
        } catch (error) {
          console.warn('用户信息解析失败:', error)
        }
      }
    },

    /**
     * 更新用户信息
     * 注意：此方法已废弃，请使用 auth 模块
     */
    async updateUserInfo(context, payload: Partial<UserInfo>) {
      console.warn('user/updateUserInfo is deprecated, please use auth module instead')
      const newUserInfo = { ...context.state.userInfo!, ...payload }
      context.commit('setUserInfo', newUserInfo)
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.USER_INFO, JSON.stringify(newUserInfo))
      return newUserInfo
    },

    /**
     * 从本地存储初始化
     */
    async initFromStorage(context) {
      // 从本地存储恢复用户信息
      const savedToken = localStorage.getItem(CONSTANTS.STORAGE_KEYS.TOKEN)
      const savedUserInfo = localStorage.getItem(CONSTANTS.STORAGE_KEYS.USER_INFO)

      if (savedToken) {
        context.commit('setToken', savedToken)
      }

      if (savedUserInfo) {
        try {
          const user = JSON.parse(savedUserInfo) as UserInfo
          context.commit('setUserInfo', user)
          context.commit('setPermissions', user.permissions || [])
          context.commit('setRoles', user.roles || [])
        } catch (error) {
          console.warn('用户信息解析失败:', error)
          localStorage.removeItem(CONSTANTS.STORAGE_KEYS.USER_INFO)
        }
      }
    },
  },
}

/**
 * 权限检查辅助函数
 */
export function hasPermission(state: UserState, permission: string): boolean {
  return state.permissions.includes(permission) || state.permissions.includes('*')
}

export function hasRole(state: UserState, role: string): boolean {
  return state.roles.includes(role) || state.roles.includes('admin')
}

export function hasAnyPermission(state: UserState, permissionList: string[]): boolean {
  return permissionList.some(permission => hasPermission(state, permission))
}

export function hasAnyRole(state: UserState, roleList: string[]): boolean {
  return roleList.some(role => hasRole(state, role))
}
