/**
 * Overlay 状态模块
 *
 * 管理浮层组件的状态，包括：
 * - 浮层打开/关闭状态
 * - 浮层参数注入
 * - 浮层数据返回回调
 * - 多个浮层同时打开的独立状态管理
 */

import type { IStateModule } from '../IStateModule'
import type { OverlayConfig } from '@/core/api/overlay'

/**
 * 浮层实例接口
 */
export interface OverlayInstance {
  /** 浮层ID */
  id: string
  /** 浮层配置 */
  config: OverlayConfig
  /** 浮层上下文数据（传入的参数） */
  context: any
  /** 创建时间戳 */
  createdAt: number
  /** 父页面上下文引用 */
  parentContext?: any
  /** 数据返回回调函数 */
  onReturn?: (data: any) => void
  /** 关闭回调函数 */
  onClose?: (data?: any) => void
}

/**
 * Overlay 状态接口
 */
export interface OverlayState {
  /** 已打开的浮层实例映射表 (overlayId -> OverlayInstance) */
  openOverlays: Map<string, OverlayInstance>
  /** 浮层参数映射表 (overlayId -> params) */
  overlayParams: Map<string, any>
  /** 浮层返回数据映射表 (overlayId -> returnData) */
  overlayReturnData: Map<string, any>
  /** 浮层栈（用于管理多层浮层的顺序） */
  overlayStack: string[]
}

/**
 * 打开浮层参数
 */
export interface OpenOverlayParams {
  /** 浮层ID */
  id: string
  /** 浮层配置 */
  config: OverlayConfig
  /** 传递给浮层的参数 */
  params?: any
  /** 父页面上下文 */
  parentContext?: any
  /** 数据返回回调 */
  onReturn?: (data: any) => void
  /** 关闭回调 */
  onClose?: (data?: any) => void
}

/**
 * 关闭浮层参数
 */
export interface CloseOverlayParams {
  /** 浮层ID，如果不指定则关闭当前浮层 */
  id?: string
  /** 返回数据 */
  returnData?: any
}

/**
 * 更新浮层上下文参数
 */
export interface UpdateOverlayContextParams {
  /** 浮层ID */
  id: string
  /** 要更新的上下文数据 */
  context: any
}

/**
 * Overlay 状态模块
 */
export const overlayModule: IStateModule<OverlayState> = {
  name: 'overlay',

  state: (): OverlayState => ({
    openOverlays: new Map(),
    overlayParams: new Map(),
    overlayReturnData: new Map(),
    overlayStack: [],
  }),

  mutations: {
    /**
     * 打开浮层
     */
    OPEN_OVERLAY(state, payload: OpenOverlayParams) {
      const instance: OverlayInstance = {
        id: payload.id,
        config: payload.config,
        context: payload.params || {},
        createdAt: Date.now(),
        parentContext: payload.parentContext,
        onReturn: payload.onReturn,
        onClose: payload.onClose,
      }

      // 添加到打开的浮层映射表
      state.openOverlays.set(payload.id, instance)

      // 保存参数
      if (payload.params) {
        state.overlayParams.set(payload.id, payload.params)
      }

      // 添加到浮层栈
      if (!state.overlayStack.includes(payload.id)) {
        state.overlayStack.push(payload.id)
      }

      console.log(`✅ [Overlay] 浮层已打开: ${payload.id}`, instance)
    },

    /**
     * 关闭浮层
     */
    CLOSE_OVERLAY(state, payload: CloseOverlayParams) {
      const overlayId = payload.id || state.overlayStack[state.overlayStack.length - 1]

      if (!overlayId) {
        console.warn('⚠️ [Overlay] 没有可关闭的浮层')
        return
      }

      const instance = state.openOverlays.get(overlayId)

      if (!instance) {
        console.warn(`⚠️ [Overlay] 浮层不存在: ${overlayId}`)
        return
      }

      // 保存返回数据
      if (payload.returnData !== undefined) {
        state.overlayReturnData.set(overlayId, payload.returnData)
      }

      // 执行关闭回调
      if (instance.onClose) {
        try {
          instance.onClose(payload.returnData)
        } catch (error) {
          console.error(`❌ [Overlay] 执行关闭回调失败: ${overlayId}`, error)
        }
      }

      // 从映射表中移除
      state.openOverlays.delete(overlayId)
      state.overlayParams.delete(overlayId)

      // 从浮层栈中移除
      const stackIndex = state.overlayStack.indexOf(overlayId)
      if (stackIndex !== -1) {
        state.overlayStack.splice(stackIndex, 1)
      }

      console.log(`✅ [Overlay] 浮层已关闭: ${overlayId}`)
    },

    /**
     * 更新浮层上下文
     */
    UPDATE_OVERLAY_CONTEXT(state, payload: UpdateOverlayContextParams) {
      const instance = state.openOverlays.get(payload.id)

      if (!instance) {
        console.warn(`⚠️ [Overlay] 浮层不存在: ${payload.id}`)
        return
      }

      // 合并上下文数据
      instance.context = {
        ...instance.context,
        ...payload.context,
      }

      // 更新参数映射表
      state.overlayParams.set(payload.id, instance.context)

      console.log(`✅ [Overlay] 浮层上下文已更新: ${payload.id}`, instance.context)
    },

    /**
     * 设置浮层返回数据
     */
    SET_OVERLAY_RETURN_DATA(state, payload: { id: string; data: any }) {
      state.overlayReturnData.set(payload.id, payload.data)

      const instance = state.openOverlays.get(payload.id)
      if (instance && instance.onReturn) {
        try {
          instance.onReturn(payload.data)
        } catch (error) {
          console.error(`❌ [Overlay] 执行返回回调失败: ${payload.id}`, error)
        }
      }

      console.log(`✅ [Overlay] 浮层返回数据已设置: ${payload.id}`, payload.data)
    },

    /**
     * 清理浮层返回数据
     */
    CLEAR_OVERLAY_RETURN_DATA(state, overlayId: string) {
      state.overlayReturnData.delete(overlayId)
    },

    /**
     * 清理所有浮层状态
     */
    CLEAR_ALL_OVERLAYS(state) {
      // 执行所有浮层的关闭回调
      state.openOverlays.forEach((instance, id) => {
        if (instance.onClose) {
          try {
            instance.onClose()
          } catch (error) {
            console.error(`❌ [Overlay] 执行关闭回调失败: ${id}`, error)
          }
        }
      })

      state.openOverlays.clear()
      state.overlayParams.clear()
      state.overlayReturnData.clear()
      state.overlayStack = []

      console.log('✅ [Overlay] 所有浮层状态已清理')
    },
  },

  actions: {
    /**
     * 打开浮层
     */
    async openOverlay({ commit }, params: OpenOverlayParams) {
      try {
        // 先提交打开浮层的 mutation
        commit('OPEN_OVERLAY', params)

        // 执行 onOpen 生命周期钩子
        if (params.config.onOpen && Array.isArray(params.config.onOpen) && params.config.onOpen.length > 0) {
          console.log(`🔄 [Overlay] 执行 onOpen 钩子: ${params.id}`)

          try {
            // 动态导入 EventExecutor 避免循环依赖
            const { EventExecutor } = await import('@/core/engines/event-executor')
            const { DataSourceFactory } = await import('@/core/data/DataSourceFactory')
            const { DataSourcePluginRegistry } = await import('@/core/data/plugins/DataSourcePluginRegistry')

            // 创建事件执行器
            const pluginRegistry = new DataSourcePluginRegistry()
            const dataSourceFactory = new DataSourceFactory(pluginRegistry)
            const eventExecutor = new EventExecutor(dataSourceFactory)

            // 构建执行上下文
            const context = {
              overlay: {
                id: params.id,
                params: params.params,
                config: params.config,
              },
              ...params.params,
            }

            // 执行 onOpen 事件动作链
            await eventExecutor.execute(params.config.onOpen, context)

            console.log(`✅ [Overlay] onOpen 钩子执行成功: ${params.id}`)
          } catch (hookError: any) {
            // 生命周期钩子执行失败时记录错误但不阻止浮层操作
            console.error(`❌ [Overlay] onOpen 钩子执行失败: ${params.id}`, hookError)
            console.warn(`⚠️ [Overlay] 浮层仍然打开，但 onOpen 钩子执行失败`)
          }
        }

        return { success: true, overlayId: params.id }
      } catch (error: any) {
        console.error(`❌ [Overlay] 打开浮层失败: ${params.id}`, error)
        throw error
      }
    },

    /**
     * 关闭浮层
     */
    async closeOverlay({ commit, state }, params: CloseOverlayParams = {}) {
      try {
        const overlayId = params.id || state.overlayStack[state.overlayStack.length - 1]

        if (!overlayId) {
          console.warn('⚠️ [Overlay] 没有可关闭的浮层')
          return { success: false, message: '没有可关闭的浮层' }
        }

        const instance = state.openOverlays.get(overlayId)

        if (!instance) {
          console.warn(`⚠️ [Overlay] 浮层不存在: ${overlayId}`)
          return { success: false, message: '浮层不存在' }
        }

        // 执行 onClose 生命周期钩子
        if (instance.config.onClose && Array.isArray(instance.config.onClose) && instance.config.onClose.length > 0) {
          console.log(`🔄 [Overlay] 执行 onClose 钩子: ${overlayId}`)

          try {
            // 动态导入 EventExecutor 避免循环依赖
            const { EventExecutor } = await import('@/core/engines/event-executor')
            const { DataSourceFactory } = await import('@/core/data/DataSourceFactory')
            const { DataSourcePluginRegistry } = await import('@/core/data/plugins/DataSourcePluginRegistry')

            // 创建事件执行器
            const pluginRegistry = new DataSourcePluginRegistry()
            const dataSourceFactory = new DataSourceFactory(pluginRegistry)
            const eventExecutor = new EventExecutor(dataSourceFactory)

            // 构建执行上下文
            const context = {
              overlay: {
                id: overlayId,
                params: instance.context,
                config: instance.config,
                returnData: params.returnData,
              },
              returnData: params.returnData,
              ...instance.context,
            }

            // 执行 onClose 事件动作链
            await eventExecutor.execute(instance.config.onClose, context)

            console.log(`✅ [Overlay] onClose 钩子执行成功: ${overlayId}`)
          } catch (hookError: any) {
            // 生命周期钩子执行失败时记录错误但不阻止浮层操作
            console.error(`❌ [Overlay] onClose 钩子执行失败: ${overlayId}`, hookError)
            console.warn(`⚠️ [Overlay] 浮层仍然关闭，但 onClose 钩子执行失败`)
          }
        }

        commit('CLOSE_OVERLAY', { id: overlayId, returnData: params.returnData })

        return { success: true, overlayId }
      } catch (error: any) {
        console.error(`❌ [Overlay] 关闭浮层失败`, error)
        throw error
      }
    },

    /**
     * 更新浮层上下文
     */
    updateOverlayContext({ commit }, params: UpdateOverlayContextParams) {
      commit('UPDATE_OVERLAY_CONTEXT', params)
    },

    /**
     * 设置浮层返回数据
     */
    setOverlayReturnData({ commit }, payload: { id: string; data: any }) {
      commit('SET_OVERLAY_RETURN_DATA', payload)
    },

    /**
     * 获取浮层返回数据
     */
    getOverlayReturnData({ state }, overlayId: string) {
      return state.overlayReturnData.get(overlayId)
    },

    /**
     * 清理浮层返回数据
     */
    clearOverlayReturnData({ commit }, overlayId: string) {
      commit('CLEAR_OVERLAY_RETURN_DATA', overlayId)
    },

    /**
     * 清理所有浮层
     */
    clearAllOverlays({ commit }) {
      commit('CLEAR_ALL_OVERLAYS')
    },
  },

  getters: {
    /**
     * 获取所有打开的浮层
     */
    openOverlays: state => Array.from(state.openOverlays.values()),

    /**
     * 获取打开的浮层数量
     */
    openOverlayCount: state => state.openOverlays.size,

    /**
     * 检查浮层是否打开
     */
    isOverlayOpen: state => (overlayId: string) => state.openOverlays.has(overlayId),

    /**
     * 获取浮层实例
     */
    getOverlayInstance: state => (overlayId: string) => state.openOverlays.get(overlayId),

    /**
     * 获取浮层参数
     */
    getOverlayParams: state => (overlayId: string) => state.overlayParams.get(overlayId),

    /**
     * 获取浮层上下文
     */
    getOverlayContext: state => (overlayId: string) => {
      const instance = state.openOverlays.get(overlayId)
      return instance?.context
    },

    /**
     * 获取当前浮层（栈顶）
     */
    currentOverlay: state => {
      const currentId = state.overlayStack[state.overlayStack.length - 1]
      return currentId ? state.openOverlays.get(currentId) : null
    },

    /**
     * 获取当前浮层ID
     */
    currentOverlayId: state => state.overlayStack[state.overlayStack.length - 1] || null,

    /**
     * 获取浮层栈
     */
    overlayStack: state => state.overlayStack,

    /**
     * 获取浮层返回数据
     */
    getOverlayReturnData: state => (overlayId: string) => state.overlayReturnData.get(overlayId),

    /**
     * 检查是否有打开的浮层
     */
    hasOpenOverlays: state => state.openOverlays.size > 0,
  },
}
