/**
 * Theme状态模块
 *
 * 管理应用主题配置，包括主色调、暗色模式和紧凑模式
 */

import type { IStateModule } from '../IStateModule'
import type { ThemeConfig } from '../../../types/index'
import { CONSTANTS } from '@/core/global'

/**
 * Theme状态接口
 */
export interface ThemeState {
  primaryColor: string
  darkMode: boolean
  compactMode: boolean
}

/**
 * Theme状态模块
 */
export const themeModule: IStateModule<ThemeState> = {
  name: 'theme',

  state: {
    primaryColor: '#1890ff',
    darkMode: false,
    compactMode: false,
  },

  getters: {
    themeConfig: (state): ThemeConfig => ({
      primaryColor: state.primaryColor,
      darkMode: state.darkMode,
      compactMode: state.compactMode,
    }),
  },

  mutations: {
    setPrimaryColor(state, payload: string) {
      state.primaryColor = payload
    },

    setDarkMode(state, payload: boolean) {
      state.darkMode = payload
    },

    setCompactMode(state, payload: boolean) {
      state.compactMode = payload
    },

    toggleDarkMode(state) {
      state.darkMode = !state.darkMode
    },

    toggleCompactMode(state) {
      state.compactMode = !state.compactMode
    },

    resetTheme(state) {
      state.primaryColor = '#1890ff'
      state.darkMode = false
      state.compactMode = false
    },
  },

  actions: {
    /**
     * 初始化主题
     */
    async init(context) {
      // 从本地存储加载主题配置
      const savedTheme = localStorage.getItem(CONSTANTS.STORAGE_KEYS.THEME)
      if (savedTheme) {
        try {
          const config = JSON.parse(savedTheme) as ThemeConfig
          context.commit('setPrimaryColor', config.primaryColor)
          context.commit('setDarkMode', config.darkMode)
          context.commit('setCompactMode', config.compactMode)
        } catch (error) {
          console.warn('主题配置解析失败:', error)
        }
      }

      // 应用主题
      await context.dispatch('applyTheme')
    },

    /**
     * 设置主色调
     */
    async setPrimaryColor(context, payload: string) {
      context.commit('setPrimaryColor', payload)
      await context.dispatch('applyTheme')
      await context.dispatch('saveTheme')
    },

    /**
     * 设置暗色模式
     */
    async setDarkMode(context, payload: boolean) {
      context.commit('setDarkMode', payload)
      await context.dispatch('applyTheme')
      await context.dispatch('saveTheme')
    },

    /**
     * 设置紧凑模式
     */
    async setCompactMode(context, payload: boolean) {
      context.commit('setCompactMode', payload)
      await context.dispatch('applyTheme')
      await context.dispatch('saveTheme')
    },

    /**
     * 切换暗色模式
     */
    async toggleDarkMode(context) {
      context.commit('toggleDarkMode')
      await context.dispatch('applyTheme')
      await context.dispatch('saveTheme')
    },

    /**
     * 切换紧凑模式
     */
    async toggleCompactMode(context) {
      context.commit('toggleCompactMode')
      await context.dispatch('applyTheme')
      await context.dispatch('saveTheme')
    },

    /**
     * 应用主题
     */
    async applyTheme(context) {
      const state = context.state

      // 确保state存在
      if (!state) {
        console.warn('Theme state is undefined')
        return
      }

      const root = document.documentElement

      // 设置主色调
      root.style.setProperty('--primary-color', state.primaryColor)

      // 设置暗色模式
      if (state.darkMode) {
        root.setAttribute('data-theme', 'dark')
        document.body.classList.add('dark')
      } else {
        root.removeAttribute('data-theme')
        document.body.classList.remove('dark')
      }

      // 设置紧凑模式
      if (state.compactMode) {
        root.setAttribute('data-size', 'compact')
        document.body.classList.add('compact')
      } else {
        root.removeAttribute('data-size')
        document.body.classList.remove('compact')
      }
    },

    /**
     * 保存主题
     */
    async saveTheme(context) {
      const state = context.state
      const config: ThemeConfig = {
        primaryColor: state.primaryColor,
        darkMode: state.darkMode,
        compactMode: state.compactMode,
      }
      localStorage.setItem(CONSTANTS.STORAGE_KEYS.THEME, JSON.stringify(config))
    },

    /**
     * 重置主题
     */
    async resetTheme(context) {
      context.commit('resetTheme')
      await context.dispatch('applyTheme')
      await context.dispatch('saveTheme')
    },
  },
}
