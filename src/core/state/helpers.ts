/**
 * StateManager辅助函数
 *
 * 提供简化的API来使用StateManager，类似于Pinia的组合式API
 */

import type { StateManager } from './StateManager'

/**
 * 获取全局StateManager实例
 * 从迁移系统中获取
 */
function getGlobalStateManager(): StateManager {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  throw new Error('StateManager not initialized. Please ensure migration system is bootstrapped.')
}

/**
 * 获取状态
 *
 * @example
 * ```ts
 * const appState = useState<AppState>('app')
 * console.log(appState.loading)
 * ```
 */
export function useState<T = any>(moduleName: string, stateManager?: StateManager): T {
  const sm = stateManager || getGlobalStateManager()
  return sm.getState(moduleName)
}

/**
 * 提交mutation
 *
 * @example
 * ```ts
 * const commit = useCommit('app')
 * commit('setLoading', true)
 * ```
 */
export function useCommit(moduleName: string, stateManager?: StateManager) {
  return (mutation: string, payload?: any) => {
    const sm = stateManager || getGlobalStateManager()
    sm.commit(`${moduleName}.${mutation}`, payload)
  }
}

/**
 * 分发action
 *
 * @example
 * ```ts
 * const dispatch = useDispatch('auth')
 * await dispatch('login', credentials)
 * ```
 */
export function useDispatch(moduleName: string, stateManager?: StateManager) {
  return async (action: string, payload?: any) => {
    const sm = stateManager || getGlobalStateManager()
    return sm.dispatch(`${moduleName}.${action}`, payload)
  }
}

/**
 * 获取getter
 *
 * @example
 * ```ts
 * const isLoading = useGetter('app', 'isLoading')
 * ```
 */
export function useGetter<T = any>(moduleName: string, getterName: string, stateManager?: StateManager): T {
  const sm = stateManager || getGlobalStateManager()
  const state = sm.getState(moduleName)
  const module = (sm as any).modules.get(moduleName)

  if (module?.getters?.[getterName]) {
    return module.getters[getterName](state)
  }

  return state
}

/**
 * 组合式API - 使用模块
 *
 * 提供类似Pinia的使用体验
 *
 * @example
 * ```ts
 * const app = useModule('app')
 *
 * // 访问状态
 * console.log(app.state.loading)
 *
 * // 提交mutation
 * app.commit('setLoading', true)
 *
 * // 分发action
 * await app.dispatch('initLanguage')
 *
 * // 获取getter
 * const isLoading = app.getter('isLoading')
 * ```
 */
export function useModule<TState = any>(moduleName: string, stateManager?: StateManager) {
  const sm = stateManager || getGlobalStateManager()

  return {
    /**
     * 模块状态
     */
    get state(): TState {
      return useState<TState>(moduleName, sm)
    },

    /**
     * 提交mutation
     */
    commit(mutation: string, payload?: any) {
      return useCommit(moduleName, sm)(mutation, payload)
    },

    /**
     * 分发action
     */
    async dispatch(action: string, payload?: any) {
      return useDispatch(moduleName, sm)(action, payload)
    },

    /**
     * 获取getter
     */
    getter<T = any>(name: string): T {
      return useGetter<T>(moduleName, name, sm)
    },
  }
}

/**
 * 批量提交mutations
 *
 * @example
 * ```ts
 * useBatchCommit('app', [
 *   { mutation: 'setLoading', payload: true },
 *   { mutation: 'setPageTitle', payload: 'Home' }
 * ])
 * ```
 */
export function useBatchCommit(moduleName: string, mutations: Array<{ mutation: string; payload?: any }>, stateManager?: StateManager) {
  const commit = useCommit(moduleName, stateManager)
  mutations.forEach(({ mutation, payload }) => {
    commit(mutation, payload)
  })
}

/**
 * 批量分发actions
 *
 * @example
 * ```ts
 * await useBatchDispatch('app', [
 *   { action: 'initLanguage' },
 *   { action: 'loadConfig' }
 * ])
 * ```
 */
export async function useBatchDispatch(moduleName: string, actions: Array<{ action: string; payload?: any }>, stateManager?: StateManager) {
  const dispatch = useDispatch(moduleName, stateManager)
  return Promise.all(actions.map(({ action, payload }) => dispatch(action, payload)))
}

/**
 * 获取所有模块名称
 */
export function useModuleNames(stateManager?: StateManager): string[] {
  const sm = stateManager || getGlobalStateManager()
  return Array.from((sm as any).modules.keys())
}

/**
 * 检查模块是否已注册
 */
export function useHasModule(moduleName: string, stateManager?: StateManager): boolean {
  const sm = stateManager || getGlobalStateManager()
  return (sm as any).modules.has(moduleName)
}
