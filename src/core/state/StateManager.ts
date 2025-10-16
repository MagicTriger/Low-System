/**
 * 状态管理器实现
 *
 * 核心功能:
 * - 模块注册和隔离
 * - 状态变更追踪
 * - 时间旅行调试
 * - 订阅机制
 */

import { reactive, computed, watch } from 'vue'
import type {
  IStateModule,
  IStateSubscription,
  ActionContext,
  CommitFunction,
  DispatchFunction,
  MutationSubscriber,
  ActionSubscriber,
  StateChangeCallback,
  MutationPayload,
  ActionPayload,
  StateSnapshot,
  StateModuleDescriptor,
  Unsubscribe,
  CommitOptions,
  DispatchOptions,
  SubscribeStateOptions,
} from './IStateModule'

/**
 * 状态管理器配置
 */
export interface StateManagerOptions {
  /** 是否启用严格模式 (只能通过mutation修改状态) */
  strict?: boolean

  /** 是否启用时间旅行 */
  enableTimeTrave?: boolean

  /** 历史记录最大数量 */
  maxHistorySize?: number

  /** 是否启用开发工具 */
  devtools?: boolean
}

/**
 * 状态管理器
 */
export class StateManager implements IStateSubscription {
  private modules = new Map<string, StateModuleDescriptor>()
  private state: any
  private getters: any = {}
  private mutationSubscribers: MutationSubscriber[] = []
  private actionSubscribers: ActionSubscriber[] = []
  private history: StateSnapshot[] = []
  private historyIndex = -1
  private options: Required<StateManagerOptions>

  constructor(options: StateManagerOptions = {}) {
    this.options = {
      strict: options.strict ?? false,
      enableTimeTrave: options.enableTimeTrave ?? true,
      maxHistorySize: options.maxHistorySize ?? 50,
      devtools: options.devtools ?? true,
    }

    this.state = reactive({})
  }

  /**
   * 注册状态模块
   */
  registerModule<S>(module: IStateModule<S>, path: string[] = []): void {
    const modulePath = path.length > 0 ? path : [module.name]
    const pathKey = modulePath.join('/')

    if (this.modules.has(pathKey)) {
      console.warn(`Module "${pathKey}" already registered`)
      return
    }

    // 初始化模块状态
    const moduleState = typeof module.state === 'function' ? (module.state as () => S)() : module.state

    // 设置状态到响应式对象
    this.setNestedState(this.state, modulePath, reactive(moduleState as object))

    // 创建模块描述符
    const descriptor: StateModuleDescriptor<S> = {
      module,
      path: modulePath,
      runtime: {
        state: this.getNestedState(this.state, modulePath),
        getters: {},
        context: this.createActionContext(modulePath),
      },
    }

    // 编译getters
    if (module.getters) {
      this.compileGetters(descriptor)
    }

    // 注册模块
    this.modules.set(pathKey, descriptor)

    // 注册子模块
    if (module.modules) {
      Object.entries(module.modules).forEach(([name, subModule]) => {
        this.registerModule(subModule, [...modulePath, name])
      })
    }
  }

  /**
   * 卸载模块
   */
  unregisterModule(path: string[]): void {
    const pathKey = path.join('/')
    const descriptor = this.modules.get(pathKey)

    if (!descriptor) {
      console.warn(`Module "${pathKey}" not found`)
      return
    }

    // 卸载子模块
    const childModules = Array.from(this.modules.keys()).filter(key => key.startsWith(pathKey + '/'))
    childModules.forEach(key => this.modules.delete(key))

    // 删除状态
    this.deleteNestedState(this.state, path)

    // 删除模块
    this.modules.delete(pathKey)
  }

  /**
   * 获取状态
   */
  getState<S = any>(moduleName?: string): S {
    if (!moduleName) {
      return this.state as S
    }

    const path = moduleName.split('/')
    return this.getNestedState(this.state, path)
  }

  /**
   * 提交mutation
   */
  commit: CommitFunction = (type, payload, options = {}) => {
    const { mutation, descriptor } = this.resolveMutation(type, options.root)

    if (!mutation) {
      console.error(`Mutation "${type}" not found`)
      return
    }

    // 记录快照 (在mutation之前)
    if (this.options.enableTimeTrave && !options.silent) {
      this.recordSnapshot({
        type,
        payload,
        timestamp: Date.now(),
      })
    }

    // 执行mutation
    mutation(descriptor.runtime.state, payload)

    // 通知订阅者
    if (!options.silent) {
      const mutationPayload: MutationPayload = {
        type,
        payload,
        timestamp: Date.now(),
      }
      this.notifyMutationSubscribers(mutationPayload)
    }
  }

  /**
   * 分发action
   */
  dispatch: DispatchFunction = async (type, payload, options = {}) => {
    const { action, descriptor } = this.resolveAction(type, options.root)

    if (!action) {
      console.error(`Action "${type}" not found`)
      return Promise.reject(new Error(`Action "${type}" not found`))
    }

    // 通知订阅者 (before)
    const actionPayload: ActionPayload = {
      type,
      payload,
      timestamp: Date.now(),
    }
    this.notifyActionSubscribers(actionPayload, 'before')

    try {
      // 执行action
      const result = await action(descriptor.runtime.context, payload)

      // 通知订阅者 (after)
      this.notifyActionSubscribers(actionPayload, 'after')

      return result
    } catch (error) {
      // 通知订阅者 (error)
      this.notifyActionSubscribers(actionPayload, 'error', error)
      throw error
    }
  }

  /**
   * 订阅mutation
   */
  subscribeMutation(callback: MutationSubscriber): Unsubscribe {
    this.mutationSubscribers.push(callback)
    return () => {
      const index = this.mutationSubscribers.indexOf(callback)
      if (index > -1) {
        this.mutationSubscribers.splice(index, 1)
      }
    }
  }

  /**
   * 订阅action
   */
  subscribeAction(callback: ActionSubscriber): Unsubscribe {
    this.actionSubscribers.push(callback)
    return () => {
      const index = this.actionSubscribers.indexOf(callback)
      if (index > -1) {
        this.actionSubscribers.splice(index, 1)
      }
    }
  }

  /**
   * 订阅状态变更
   */
  subscribeState<T = any>(getter: (state: any) => T, callback: StateChangeCallback<T>, options: SubscribeStateOptions = {}): Unsubscribe {
    const stop = watch(
      () => getter(this.state),
      (newValue, oldValue) => {
        callback(newValue, oldValue)
      },
      {
        immediate: options.immediate,
        deep: options.deep,
      }
    )

    return stop
  }

  /**
   * 时间旅行 - 撤销
   */
  undo(): void {
    if (!this.options.enableTimeTrave) {
      console.warn('Time travel is not enabled')
      return
    }

    if (this.historyIndex > 0) {
      this.historyIndex--
      this.restoreSnapshot(this.history[this.historyIndex])
    }
  }

  /**
   * 时间旅行 - 重做
   */
  redo(): void {
    if (!this.options.enableTimeTrave) {
      console.warn('Time travel is not enabled')
      return
    }

    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++
      this.restoreSnapshot(this.history[this.historyIndex])
    }
  }

  /**
   * 获取历史记录
   */
  getHistory(): StateSnapshot[] {
    return [...this.history]
  }

  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.history = []
    this.historyIndex = -1
  }

  /**
   * 获取所有getters
   */
  getGetters(): any {
    return this.getters
  }

  /**
   * 替换整个状态 (用于持久化恢复)
   */
  replaceState(newState: any): void {
    Object.keys(newState).forEach(key => {
      this.state[key] = newState[key]
    })
  }

  // ========== 私有方法 ==========

  /**
   * 创建Action上下文
   */
  private createActionContext<S>(path: string[]): ActionContext<S> {
    const pathKey = path.join('/')
    const descriptor = this.modules.get(pathKey)
    const self = this

    return {
      get state() {
        return descriptor?.runtime.state
      },
      get rootState() {
        return self.state
      },
      get getters() {
        return descriptor?.runtime.getters || {}
      },
      get rootGetters() {
        return self.getters
      },
      commit: self.commit.bind(self),
      dispatch: self.dispatch.bind(self),
    }
  }

  /**
   * 编译getters
   */
  private compileGetters<S>(descriptor: StateModuleDescriptor<S>): void {
    const { module, path, runtime } = descriptor
    const pathKey = path.join('/')

    if (!module.getters) return

    Object.entries(module.getters).forEach(([key, getter]) => {
      const getterKey = module.namespaced ? `${pathKey}/${key}` : key

      // 创建计算属性
      const computedGetter = computed(() => {
        return getter(runtime.state, runtime.getters, this.state, this.getters)
      })

      // 注册到模块getters
      runtime.getters[key] = computedGetter

      // 注册到全局getters
      this.getters[getterKey] = computedGetter
    })
  }

  /**
   * 解析mutation
   */
  private resolveMutation(type: string, root?: boolean): { mutation?: Function; descriptor: StateModuleDescriptor } {
    // 尝试直接查找
    for (const [pathKey, descriptor] of this.modules) {
      const mutations = descriptor.module.mutations
      if (!mutations) continue

      const mutationKey = descriptor.module.namespaced ? `${pathKey}/${type}` : type

      if (mutations[type] || (root && mutations[type])) {
        return {
          mutation: mutations[type],
          descriptor,
        }
      }

      // 命名空间查找
      if (mutationKey === type && mutations[type.split('/').pop()!]) {
        return {
          mutation: mutations[type.split('/').pop()!],
          descriptor,
        }
      }
    }

    return { descriptor: this.modules.values().next().value }
  }

  /**
   * 解析action
   */
  private resolveAction(type: string, root?: boolean): { action?: Function; descriptor: StateModuleDescriptor } {
    // 支持两种格式: 'module/action' 和 'module.action'
    const normalizedType = type.replace('.', '/')

    // 尝试直接查找
    for (const [pathKey, descriptor] of this.modules) {
      const actions = descriptor.module.actions
      if (!actions) continue

      // 尝试匹配 'module/action' 或 'module.action' 格式
      if (normalizedType.includes('/')) {
        const [moduleName, actionName] = normalizedType.split('/')

        // 检查模块名是否匹配
        if (pathKey === moduleName && actions[actionName]) {
          return {
            action: actions[actionName],
            descriptor,
          }
        }
      }

      // 尝试直接匹配（无命名空间）
      if (actions[type] || actions[normalizedType]) {
        return {
          action: actions[type] || actions[normalizedType],
          descriptor,
        }
      }
    }

    console.warn(`Action "${type}" not found in any module`)
    return { descriptor: this.modules.values().next().value }
  }

  /**
   * 记录快照
   */
  private recordSnapshot(mutation: MutationPayload): void {
    // 如果当前不在最新位置,删除后面的历史
    if (this.historyIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyIndex + 1)
    }

    // 添加新快照
    const snapshot: StateSnapshot = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      state: this.cloneState(this.state),
      mutation,
    }

    this.history.push(snapshot)
    this.historyIndex++

    // 限制历史记录大小
    if (this.history.length > this.options.maxHistorySize) {
      this.history.shift()
      this.historyIndex--
    }
  }

  /**
   * 恢复快照
   */
  private restoreSnapshot(snapshot: StateSnapshot): void {
    this.replaceState(snapshot.state)
  }

  /**
   * 克隆状态
   */
  private cloneState(state: any): any {
    return JSON.parse(JSON.stringify(state))
  }

  /**
   * 通知mutation订阅者
   */
  private notifyMutationSubscribers(mutation: MutationPayload): void {
    this.mutationSubscribers.forEach(subscriber => {
      try {
        subscriber(mutation, this.state)
      } catch (error) {
        console.error('Error in mutation subscriber:', error)
      }
    })
  }

  /**
   * 通知action订阅者
   */
  private notifyActionSubscribers(action: ActionPayload, phase: 'before' | 'after' | 'error', error?: any): void {
    this.actionSubscribers.forEach(subscriber => {
      try {
        subscriber(action, this.state)
      } catch (err) {
        console.error('Error in action subscriber:', err)
      }
    })
  }

  /**
   * 获取嵌套状态
   */
  private getNestedState(state: any, path: string[]): any {
    return path.reduce((obj, key) => obj?.[key], state)
  }

  /**
   * 设置嵌套状态
   */
  private setNestedState(state: any, path: string[], value: any): void {
    if (path.length === 0) return

    const lastKey = path[path.length - 1]
    const parent = path.slice(0, -1).reduce((obj, key) => {
      if (!obj[key]) {
        obj[key] = reactive({})
      }
      return obj[key]
    }, state)

    parent[lastKey] = value
  }

  /**
   * 删除嵌套状态
   */
  private deleteNestedState(state: any, path: string[]): void {
    if (path.length === 0) return

    const lastKey = path[path.length - 1]
    const parent = path.slice(0, -1).reduce((obj, key) => obj?.[key], state)

    if (parent) {
      delete parent[lastKey]
    }
  }
}
