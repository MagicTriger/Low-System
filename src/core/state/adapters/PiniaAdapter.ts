/**
 * Pinia适配器
 *
 * 提供Pinia store与新状态管理系统的兼容层
 * 允许逐步迁移现有Pinia stores
 */

import type { Store } from 'pinia'
import type { StateManager } from '../StateManager'
import type { IStateModule } from '../IStateModule'

/**
 * Pinia适配器配置
 */
export interface PiniaAdapterOptions {
  /** 是否自动同步到新状态管理器 */
  autoSync?: boolean

  /** 是否保留Pinia store */
  keepPiniaStore?: boolean
}

/**
 * Pinia适配器
 *
 * 将Pinia store适配为新的状态模块格式
 */
export class PiniaAdapter {
  constructor(
    private stateManager: StateManager,
    private options: PiniaAdapterOptions = {}
  ) {
    this.options = {
      autoSync: options.autoSync ?? true,
      keepPiniaStore: options.keepPiniaStore ?? true,
    }
  }

  /**
   * 适配Pinia store到新状态模块
   */
  adaptStore<S extends Record<string, any>>(piniaStore: Store<string, S, any, any>): IStateModule<S> {
    const storeId = piniaStore.$id
    const state = this.extractState(piniaStore)
    const getters = this.extractGetters(piniaStore)
    const mutations = this.extractMutations(piniaStore)
    const actions = this.extractActions(piniaStore)

    const module: IStateModule<S> = {
      name: storeId,
      state: () => ({ ...state }),
      getters,
      mutations,
      actions,
      namespaced: true,
    }

    return module
  }

  /**
   * 注册Pinia store到新状态管理器
   */
  registerPiniaStore<S extends Record<string, any>>(piniaStore: Store<string, S, any, any>): void {
    const module = this.adaptStore(piniaStore)
    this.stateManager.registerModule(module)

    // 设置双向同步
    if (this.options.autoSync) {
      this.setupSync(piniaStore, module.name)
    }
  }

  /**
   * 从Pinia store提取状态
   */
  private extractState<S>(store: Store<string, S, any, any>): S {
    const state: any = {}
    const storeState = store.$state

    // 提取所有状态属性
    for (const key in storeState) {
      if (Object.prototype.hasOwnProperty.call(storeState, key)) {
        state[key] = storeState[key]
      }
    }

    return state
  }

  /**
   * 从Pinia store提取getters
   */
  private extractGetters<S>(store: Store<string, S, any, any>): Record<string, any> {
    const getters: Record<string, any> = {}

    // Pinia的getters通常是computed属性
    // 我们需要将它们转换为函数形式
    for (const key in store) {
      if (key.startsWith('is') || key.startsWith('get') || key.startsWith('current')) {
        const value = (store as any)[key]
        if (typeof value !== 'function') {
          getters[key] = (state: S) => value
        }
      }
    }

    return getters
  }

  /**
   * 从Pinia store提取mutations
   */
  private extractMutations<S>(store: Store<string, S, any, any>): Record<string, any> {
    const mutations: Record<string, any> = {}

    // 查找所有set开头的方法作为mutations
    for (const key in store) {
      if (key.startsWith('set') || key.startsWith('toggle')) {
        const method = (store as any)[key]
        if (typeof method === 'function') {
          mutations[key] = (state: S, payload: any) => {
            // 直接修改状态
            method.call(store, payload)
          }
        }
      }
    }

    return mutations
  }

  /**
   * 从Pinia store提取actions
   */
  private extractActions<S>(store: Store<string, S, any, any>): Record<string, any> {
    const actions: Record<string, any> = {}

    // 查找所有非getter/mutation的方法作为actions
    for (const key in store) {
      const method = (store as any)[key]
      if (
        typeof method === 'function' &&
        !key.startsWith('set') &&
        !key.startsWith('toggle') &&
        !key.startsWith('is') &&
        !key.startsWith('get') &&
        !key.startsWith('$') &&
        !key.startsWith('_')
      ) {
        actions[key] = async (context: any, payload: any) => {
          return method.call(store, payload)
        }
      }
    }

    return actions
  }

  /**
   * 设置Pinia store与新状态管理器的双向同步
   */
  private setupSync<S>(piniaStore: Store<string, S, any, any>, moduleName: string): void {
    // Pinia -> 新状态管理器
    piniaStore.$subscribe((mutation, state) => {
      const newState = this.stateManager.getState(moduleName)
      Object.assign(newState, state)
    })

    // 新状态管理器 -> Pinia
    this.stateManager.subscribeMutation((mutation, state) => {
      if (mutation.type.startsWith(moduleName)) {
        const moduleState = state[moduleName]
        if (moduleState) {
          Object.assign(piniaStore.$state, moduleState)
        }
      }
    })
  }
}

/**
 * 创建Pinia兼容的store包装器
 *
 * 允许使用新状态管理器,但保持Pinia的API
 */
export function createPiniaCompatStore<S>(stateManager: StateManager, moduleName: string): Store<string, S, any, any> {
  const state = stateManager.getState<S>(moduleName)

  // 创建一个类似Pinia store的对象
  const compatStore: any = {
    $id: moduleName,
    $state: state,

    // Pinia的$patch方法
    $patch(partialState: Partial<S> | ((state: S) => void)) {
      if (typeof partialState === 'function') {
        partialState(state)
      } else {
        Object.assign(state, partialState)
      }
    },

    // Pinia的$reset方法
    $reset() {
      // 重置到初始状态
      const module = (stateManager as any).modules.get(moduleName)
      if (module) {
        const initialState = typeof module.module.state === 'function' ? module.module.state() : module.module.state
        Object.assign(state, initialState)
      }
    },

    // Pinia的$subscribe方法
    $subscribe(callback: (mutation: any, state: S) => void) {
      return stateManager.subscribeMutation((mutation, rootState) => {
        if (mutation.type.startsWith(moduleName)) {
          callback(mutation, rootState[moduleName])
        }
      })
    },

    // Pinia的$dispose方法
    $dispose() {
      stateManager.unregisterModule([moduleName])
    },
  }

  // 添加状态属性的代理
  return new Proxy(compatStore, {
    get(target, prop: string) {
      if (prop in target) {
        return target[prop]
      }
      // 从状态中获取
      return state[prop as keyof S]
    },
    set(target, prop: string, value) {
      if (prop in target) {
        target[prop] = value
      } else {
        // 设置到状态
        ;(state as any)[prop] = value
      }
      return true
    },
  })
}
