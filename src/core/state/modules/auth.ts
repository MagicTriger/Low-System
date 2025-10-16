import type { IStateModule } from '../IStateModule'
import { authApiService, type LoginRequest, type UserInfo, type PermissionInfo, type LoginStatusInfo } from '@/core/api/auth'

export interface AuthState {
  accessToken: string | null
  tokenType: string
  isAuthenticated: boolean
  userInfo: UserInfo | null
  permissionInfo: PermissionInfo | null
  loginStatusInfo: LoginStatusInfo | null
}

export const authModule: IStateModule<AuthState> = {
  name: 'auth',

  state: {
    accessToken: localStorage.getItem('accessToken'),
    tokenType: localStorage.getItem('tokenType') || 'Bearer',
    isAuthenticated: !!localStorage.getItem('accessToken'),
    userInfo: null,
    permissionInfo: null,
    loginStatusInfo: null,
  },

  mutations: {
    SET_AUTH_DATA(
      state,
      payload: {
        accessToken: string
        tokenType: string
        userInfo: UserInfo
        permissionInfo: PermissionInfo
        loginStatusInfo: LoginStatusInfo
      }
    ) {
      state.accessToken = payload.accessToken
      state.tokenType = payload.tokenType
      state.userInfo = payload.userInfo
      state.permissionInfo = payload.permissionInfo
      state.loginStatusInfo = payload.loginStatusInfo
      state.isAuthenticated = true

      // 保存到localStorage
      localStorage.setItem('accessToken', payload.accessToken)
      localStorage.setItem('tokenType', payload.tokenType)
      localStorage.setItem('userInfo', JSON.stringify(payload.userInfo))
      localStorage.setItem('permissionInfo', JSON.stringify(payload.permissionInfo))
    },

    CLEAR_AUTH_DATA(state) {
      state.accessToken = null
      state.tokenType = 'Bearer'
      state.userInfo = null
      state.permissionInfo = null
      state.loginStatusInfo = null
      state.isAuthenticated = false

      // 清除localStorage
      localStorage.removeItem('accessToken')
      localStorage.removeItem('tokenType')
      localStorage.removeItem('userInfo')
      localStorage.removeItem('permissionInfo')
    },

    RESTORE_AUTH_DATA(state) {
      const accessToken = localStorage.getItem('accessToken')
      const tokenType = localStorage.getItem('tokenType')
      const userInfoStr = localStorage.getItem('userInfo')
      const permissionInfoStr = localStorage.getItem('permissionInfo')

      if (accessToken && userInfoStr && permissionInfoStr) {
        state.accessToken = accessToken
        state.tokenType = tokenType || 'Bearer'
        state.userInfo = JSON.parse(userInfoStr)
        state.permissionInfo = JSON.parse(permissionInfoStr)
        state.isAuthenticated = true
      }
    },
  },

  actions: {
    async login({ commit }, credentials: LoginRequest) {
      try {
        const response = await authApiService.login(credentials)

        if (response.success && response.data) {
          commit('SET_AUTH_DATA', {
            accessToken: response.data.accessToken,
            tokenType: response.data.tokenType,
            userInfo: response.data.userInfo,
            permissionInfo: response.data.permissionInfo,
            loginStatusInfo: response.data.loginStatusInfo,
          })

          return response
        } else {
          throw new Error(response.message || '登录失败')
        }
      } catch (error: any) {
        commit('CLEAR_AUTH_DATA')
        throw error
      }
    },

    async logout({ commit }) {
      try {
        await authApiService.logout()
      } catch (error) {
        console.error('登出失败:', error)
      } finally {
        commit('CLEAR_AUTH_DATA')
      }
    },

    async restoreAuth({ commit }) {
      commit('RESTORE_AUTH_DATA')
    },

    async checkAuth({ commit }) {
      // 从localStorage恢复认证状态
      commit('RESTORE_AUTH_DATA')
    },
  },

  getters: {
    isAuthenticated: state => state.isAuthenticated,
    accessToken: state => state.accessToken,
    authHeader: state => (state.accessToken ? `${state.tokenType} ${state.accessToken}` : null),
    userInfo: state => state.userInfo,
    userId: state => state.userInfo?.userId,
    username: state => state.userInfo?.username,
    displayName: state => state.userInfo?.displayName || state.userInfo?.username,
    avatar: state => state.userInfo?.avatar,

    // 权限相关
    permissions: state => state.permissionInfo?.permissions || [],
    roles: state => state.permissionInfo?.roleNames || [],
    roleIds: state => state.permissionInfo?.roleIds || [],
    menus: state => state.permissionInfo?.menus || [],

    // 权限检查
    hasPermission: state => (permission: string) => {
      return state.permissionInfo?.permissions.includes(permission) || false
    },
    hasRole: state => (roleName: string) => {
      return state.permissionInfo?.roleNames.includes(roleName) || false
    },
    hasAnyPermission: state => (permissions: string[]) => {
      return permissions.some(p => state.permissionInfo?.permissions.includes(p)) || false
    },
    hasAllPermissions: state => (permissions: string[]) => {
      return permissions.every(p => state.permissionInfo?.permissions.includes(p)) || false
    },

    // 登录状态信息
    loginStatusInfo: state => state.loginStatusInfo,
    loginTime: state => state.loginStatusInfo?.loginTime,
    loginIp: state => state.loginStatusInfo?.loginIp,
  },
}
