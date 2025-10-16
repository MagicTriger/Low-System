/**
 * 状态模块接口定义
 *
 * 提供模块化状态管理的核心接口,支持:
 * - 模块化状态定义
 * - Getter/Action/Mutation模式
 * - 状态订阅和变更追踪
 * - 类型安全
 */

/**
 * 状态模块接口
 * @template S 状态类型
 */
export interface IStateModule<S = any> {
  /** 模块名称 (唯一标识) */
  name: string

  /** 模块状态 */
  state: S | (() => S)

  /** Getters - 计算属性 */
  getters?: Record<string, Getter<S>>

  /** Actions - 异步操作 */
  actions?: Record<string, Action<S>>

  /** Mutations - 同步状态变更 */
  mutations?: Record<string, Mutation<S>>

  /** 模块是否命名空间隔离 */
  namespaced?: boolean

  /** 子模块 */
  modules?: Record<string, IStateModule<any>>
}

/**
 * Getter类型 - 用于计算派生状态
 * @template S 状态类型
 */
export type Getter<S = any> = (state: S, getters: any, rootState: any, rootGetters: any) => any

/**
 * Action类型 - 用于异步操作和业务逻辑
 * @template S 状态类型
 */
export type Action<S = any> = (context: ActionContext<S>, payload?: any) => any | Promise<any>

/**
 * Mutation类型 - 用于同步修改状态
 * @template S 状态类型
 */
export type Mutation<S = any> = (state: S, payload?: any) => void

/**
 * Action上下文 - 提供给Action的执行环境
 * @template S 状态类型
 */
export interface ActionContext<S = any> {
  /** 当前模块状态 */
  state: S

  /** 根状态 */
  rootState: any

  /** 当前模块getters */
  getters: any

  /** 根getters */
  rootGetters: any

  /** 提交mutation */
  commit: CommitFunction

  /** 分发action */
  dispatch: DispatchFunction
}

/**
 * Commit函数类型 - 用于提交mutation
 */
export type CommitFunction = (type: string, payload?: any, options?: CommitOptions) => void

/**
 * Dispatch函数类型 - 用于分发action
 */
export type DispatchFunction = (type: string, payload?: any, options?: DispatchOptions) => Promise<any>

/**
 * Commit选项
 */
export interface CommitOptions {
  /** 是否为根级别的mutation */
  root?: boolean

  /** 是否静默提交(不触发订阅) */
  silent?: boolean
}

/**
 * Dispatch选项
 */
export interface DispatchOptions {
  /** 是否为根级别的action */
  root?: boolean
}

/**
 * 状态订阅接口
 */
export interface IStateSubscription {
  /** 订阅mutation */
  subscribeMutation(callback: MutationSubscriber): Unsubscribe

  /** 订阅action */
  subscribeAction(callback: ActionSubscriber): Unsubscribe

  /** 订阅状态变更 */
  subscribeState<T = any>(getter: (state: any) => T, callback: StateChangeCallback<T>, options?: SubscribeStateOptions): Unsubscribe
}

/**
 * Mutation订阅回调
 */
export type MutationSubscriber = (mutation: MutationPayload, state: any) => void

/**
 * Action订阅回调
 */
export type ActionSubscriber = (action: ActionPayload, state: any) => void

/**
 * 状态变更回调
 */
export type StateChangeCallback<T = any> = (newValue: T, oldValue: T) => void

/**
 * Mutation负载
 */
export interface MutationPayload {
  /** Mutation类型 */
  type: string

  /** Mutation负载数据 */
  payload?: any

  /** 时间戳 */
  timestamp: number
}

/**
 * Action负载
 */
export interface ActionPayload {
  /** Action类型 */
  type: string

  /** Action负载数据 */
  payload?: any

  /** 时间戳 */
  timestamp: number
}

/**
 * 状态订阅选项
 */
export interface SubscribeStateOptions {
  /** 是否立即执行 */
  immediate?: boolean

  /** 是否深度监听 */
  deep?: boolean
}

/**
 * 取消订阅函数
 */
export type Unsubscribe = () => void

/**
 * 状态快照 - 用于时间旅行调试
 */
export interface StateSnapshot {
  /** 快照ID */
  id: string

  /** 快照时间戳 */
  timestamp: number

  /** 状态数据 */
  state: any

  /** 触发的mutation */
  mutation?: MutationPayload

  /** 触发的action */
  action?: ActionPayload
}

/**
 * 状态模块描述符 - 内部使用
 */
export interface StateModuleDescriptor<S = any> {
  /** 模块定义 */
  module: IStateModule<S>

  /** 模块路径 */
  path: string[]

  /** 父模块 */
  parent?: StateModuleDescriptor<any>

  /** 运行时状态 */
  runtime: {
    /** 实例化的状态 */
    state: S

    /** 编译后的getters */
    getters: Record<string, any>

    /** 上下文 */
    context: ActionContext<S>
  }
}
