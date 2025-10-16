/**
 * App状态模块
 *
 * 管理应用级别的状态，包括加载状态、侧边栏、面包屑、页面标题和语言设置
 */

import type { IStateModule } from '../IStateModule'

/**
 * App状态接口
 */
export interface AppState {
  loading: boolean
  sidebarCollapsed: boolean
  breadcrumbs: Array<{ name: string; path?: string }>
  pageTitle: string
  language: string
}

/**
 * App状态模块
 */
export const appModule: IStateModule<AppState> = {
  name: 'app',

  state: {
    loading: false,
    sidebarCollapsed: false,
    breadcrumbs: [],
    pageTitle: '',
    language: 'zh-CN',
  },

  getters: {
    isLoading: state => state.loading,
    isSidebarCollapsed: state => state.sidebarCollapsed,
    currentLanguage: state => state.language,
  },

  mutations: {
    setLoading(state, payload: boolean) {
      state.loading = payload
    },

    showLoading(state) {
      state.loading = true
    },

    hideLoading(state) {
      state.loading = false
    },

    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    setSidebarCollapsed(state, payload: boolean) {
      state.sidebarCollapsed = payload
    },

    setBreadcrumbs(state, payload: Array<{ name: string; path?: string }>) {
      state.breadcrumbs = payload
    },

    addBreadcrumb(state, payload: { name: string; path?: string }) {
      state.breadcrumbs.push(payload)
    },

    setPageTitle(state, payload: string) {
      state.pageTitle = payload
      document.title = payload ? `${payload} - 企业级低代码平台` : '企业级低代码平台'
    },

    setLanguage(state, payload: string) {
      state.language = payload
      localStorage.setItem('language', payload)
    },
  },

  actions: {
    async initLanguage(context) {
      const savedLanguage = localStorage.getItem('language')
      if (savedLanguage) {
        context.commit('setLanguage', savedLanguage)
      } else {
        // 检测浏览器语言
        const browserLang = navigator.language || (navigator.languages && navigator.languages[0])
        const lang = browserLang && browserLang.startsWith('zh') ? 'zh-CN' : 'en-US'
        context.commit('setLanguage', lang)
      }
    },
  },
}
