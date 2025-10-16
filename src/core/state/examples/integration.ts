/**
 * 集成示例
 *
 * 展示如何将新状态管理系统集成到现有应用中
 */

import { createStateManager } from '../factory'
import { PiniaAdapter } from '../adapters/PiniaAdapter'
import { createMigrationHelper } from '../migration/MigrationHelper'
import type { IStateModule } from '../IStateModule'

// ========== 示例1: 创建新的状态模块 ==========

interface AppState {
  loading: boolean
  sidebarCollapsed: boolean
  pageTitle: string
  language: string
}

export const appModule: IStateModule<AppState> = {
  name: 'app',
  namespaced: true,

  state: () => ({
    loading: false,
    sidebarCollapsed: false,
    pageTitle: '',
    language: 'zh-CN',
  }),

  getters: {
    isLoading: state => state.loading,
    isSidebarCollapsed: state => state.sidebarCollapsed,
    currentLanguage: state => state.language,
  },

  mutations: {
    setLoading(state, payload: boolean) {
      state.loading = payload
    },

    toggleSidebar(state) {
      state.sidebarCollapsed = !state.sidebarCollapsed
    },

    setSidebarCollapsed(state, payload: boolean) {
      state.sidebarCollapsed = payload
    },

    setPageTitle(state, payload: string) {
      state.pageTitle = payload
      if (typeof document !== 'undefined') {
        document.title = payload ? `${payload} - 企业级低代码平台` : '企业级低代码平台'
      }
    },

    setLanguage(state, payload: string) {
      state.language = payload
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('language', payload)
      }
    },
  },

  actions: {
    async initLanguage(context) {
      if (typeof localStorage === 'undefined') return

      const savedLanguage = localStorage.getItem('language')
      if (savedLanguage) {
        context.commit('setLanguage', savedLanguage)
      } else {
        // 检测浏览器语言
        const browserLang = typeof navigator !== 'undefined' ? navigator.language || (navigator as any).languages?.[0] : 'zh-CN'
        const lang = browserLang.startsWith('zh') ? 'zh-CN' : 'en-US'
        context.commit('setLanguage', lang)
      }
    },

    showLoading(context) {
      context.commit('setLoading', true)
    },

    hideLoading(context) {
      context.commit('setLoading', false)
    },
  },
}

// ========== 示例2: 初始化状态管理器 ==========

export function initializeStateManager() {
  // 创建状态管理器
  const { stateManager, persistence } = createStateManager({
    strict: import.meta.env.DEV,
    enableTimeTrave: import.meta.env.DEV,
    maxHistorySize: 50,
    devtools: import.meta.env.DEV,
    persistence: {
      options: {
        keyPrefix: 'lowcode:state:',
        paths: ['app.language', 'app.sidebarCollapsed'],
        excludePaths: ['*.loading', '*.error'],
        throttle: 1000,
        saveOnUnload: true,
      },
    },
  })

  // 注册模块
  stateManager.registerModule(appModule)

  // 恢复持久化状态
  if (persistence) {
    persistence.restoreAll().catch(error => {
      console.error('Failed to restore state:', error)
    })
  }

  return { stateManager, persistence }
}

// ========== 示例3: 与Pinia集成 ==========

export function integrateWithPinia(stateManager: any, piniaStores: any[]) {
  const adapter = new PiniaAdapter(stateManager, {
    autoSync: true,
    keepPiniaStore: true,
  })

  // 注册所有Pinia stores
  piniaStores.forEach(store => {
    adapter.registerPiniaStore(store)
  })

  console.log('Pinia stores integrated with new state manager')
}

// ========== 示例4: 迁移现有stores ==========

export async function migrateExistingStores(stateManager: any, piniaStores: any[]) {
  const helper = createMigrationHelper(stateManager)

  // 生成迁移报告
  const report = helper.generateReport(piniaStores)
  console.log('Migration Report:', report)

  // 执行迁移
  await helper.migrate({
    stores: piniaStores.map(store => ({
      store,
      keepPinia: true,
    })),
    enableSync: true,
    onComplete: () => {
      console.log('Migration completed successfully')

      // 验证迁移
      piniaStores.forEach(store => {
        const validation = helper.validateMigration(store)
        if (!validation.valid) {
          console.error(`Validation failed for ${store.$id}:`, validation.errors)
        } else if (validation.warnings.length > 0) {
          console.warn(`Warnings for ${store.$id}:`, validation.warnings)
        }
      })
    },
    onError: error => {
      console.error('Migration failed:', error)
    },
  })
}

// ========== 示例5: 在Vue组件中使用 ==========

/**
 * 在Vue组件中使用新状态管理器
 *
 * ```vue
 * <script setup lang="ts">
 * import { inject } from 'vue'
 * import type { StateManager } from '@/core/state'
 *
 * const stateManager = inject<StateManager>('stateManager')!
 *
 * // 获取状态
 * const appState = stateManager.getState('app')
 *
 * // 提交mutation
 * const toggleSidebar = () => {
 *   stateManager.commit('app/toggleSidebar')
 * }
 *
 * // 分发action
 * const init = async () => {
 *   await stateManager.dispatch('app/initLanguage')
 * }
 *
 * // 订阅状态变更
 * stateManager.subscribeState(
 *   state => state.app.loading,
 *   (newValue, oldValue) => {
 *     console.log('Loading changed:', oldValue, '->', newValue)
 *   }
 * )
 * </script>
 * ```
 */

// ========== 示例6: 创建Composable ==========

/**
 * 创建状态管理Composable
 */
export function createStateComposable(stateManager: any) {
  return {
    useState: <T = any>(moduleName: string) => {
      return stateManager.getState<T>(moduleName)
    },

    useCommit: () => {
      return (type: string, payload?: any) => {
        stateManager.commit(type, payload)
      }
    },

    useDispatch: () => {
      return (type: string, payload?: any) => {
        return stateManager.dispatch(type, payload)
      }
    },

    useSubscribe: <T = any>(getter: (state: any) => T, callback: (newValue: T, oldValue: T) => void) => {
      return stateManager.subscribeState(getter, callback)
    },
  }
}

// ========== 示例7: 在main.ts中设置 ==========

/**
 * 在应用入口设置状态管理器
 *
 * ```typescript
 * // main.ts
 * import { createApp } from 'vue'
 * import { createPinia } from 'pinia'
 * import App from './App.vue'
 * import { initializeStateManager, integrateWithPinia } from '@/core/state/examples/integration'
 * import { useAppStore, useUserStore } from '@/core/stores'
 *
 * const app = createApp(App)
 * const pinia = createPinia()
 * app.use(pinia)
 *
 * // 初始化新状态管理器
 * const { stateManager, persistence } = initializeStateManager()
 *
 * // 提供给全局
 * app.provide('stateManager', stateManager)
 * app.provide('persistence', persistence)
 *
 * // 与Pinia集成 (可选)
 * integrateWithPinia(stateManager, [
 *   useAppStore(),
 *   useUserStore(),
 * ])
 *
 * app.mount('#app')
 * ```
 */
