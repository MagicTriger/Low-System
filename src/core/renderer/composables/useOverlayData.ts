/**
 * 浮层数据传递 Composable
 *
 * 提供浮层内部组件访问和操作浮层数据的能力
 */

import { inject, computed, type ComputedRef } from 'vue'
import type { StateManager } from '@/core/state/StateManager'

/**
 * 浮层数据传递接口
 */
export interface OverlayDataAPI {
  /** 浮层ID */
  overlayId: string | undefined
  /** 浮层上下文（传入的参数） */
  overlayContext: ComputedRef<any>
  /** 父页面上下文引用 */
  parentContext: ComputedRef<any>
  /** 返回数据给父页面 */
  returnData: (data: any) => void
  /** 关闭浮层并返回数据 */
  closeOverlay: (returnData?: any) => void
  /** 更新浮层上下文 */
  updateContext: (context: any) => void
  /** 获取浮层参数 */
  getParam: <T = any>(key: string, defaultValue?: T) => T
  /** 设置浮层参数 */
  setParam: (key: string, value: any) => void
  /** 获取父页面数据 */
  getParentData: <T = any>(path: string, defaultValue?: T) => T
}

/**
 * 使用浮层数据传递
 *
 * @returns 浮层数据API
 *
 * @example
 * ```vue
 * <script setup>
 * import { useOverlayData } from '@/core/renderer/composables/useOverlayData'
 *
 * const overlayData = useOverlayData()
 *
 * // 获取传入的参数
 * const userId = overlayData.getParam('userId')
 *
 * // 返回数据给父页面
 * const handleSubmit = () => {
 *   overlayData.returnData({ success: true, data: formData })
 * }
 *
 * // 关闭浮层并返回数据
 * const handleSave = () => {
 *   overlayData.closeOverlay({ saved: true })
 * }
 * </script>
 * ```
 */
export function useOverlayData(): OverlayDataAPI {
  const stateManager = inject<StateManager>('stateManager')!

  if (!stateManager) {
    console.error('❌ [useOverlayData] StateManager not provided')
  }

  // 从上下文注入浮层信息
  const overlayId = inject<string>('overlayId', undefined)
  const injectedOverlayContext = inject<any>('overlayContext', {})
  const injectedParentContext = inject<any>('parentContext', {})
  const injectedReturnData = inject<(data: any) => void>('returnData', () => {
    console.warn('⚠️ [useOverlayData] returnData 方法未注入，可能不在浮层上下文中')
  })
  const injectedCloseOverlay = inject<(returnData?: any) => void>('closeOverlay', () => {
    console.warn('⚠️ [useOverlayData] closeOverlay 方法未注入，可能不在浮层上下文中')
  })

  /**
   * 浮层上下文
   */
  const overlayContext = computed(() => {
    if (!overlayId) return injectedOverlayContext

    // 从状态管理器获取最新的上下文
    const getters = stateManager.getGetters()
    const context = getters['overlay/getOverlayContext'](overlayId)
    return context || injectedOverlayContext
  })

  /**
   * 父页面上下文
   */
  const parentContext = computed(() => {
    if (!overlayId) return injectedParentContext

    // 从状态管理器获取浮层实例
    const getters = stateManager.getGetters()
    const instance = getters['overlay/getOverlayInstance'](overlayId)
    return instance?.parentContext || injectedParentContext
  })

  /**
   * 返回数据给父页面
   */
  const returnData = (data: any) => {
    try {
      if (!overlayId) {
        console.error('❌ [useOverlayData] 无法返回数据：overlayId 未定义')
        throw new Error('浮层ID未定义，无法返回数据')
      }

      console.log(`✅ [useOverlayData] 返回数据: ${overlayId}`, data)
      injectedReturnData(data)
    } catch (error: any) {
      console.error(`❌ [useOverlayData] 返回数据失败: ${overlayId}`, error)
      throw new Error(`返回数据失败: ${error.message}`)
    }
  }

  /**
   * 关闭浮层并返回数据
   */
  const closeOverlay = (returnData?: any) => {
    try {
      if (!overlayId) {
        console.error('❌ [useOverlayData] 无法关闭浮层：overlayId 未定义')
        throw new Error('浮层ID未定义，无法关闭浮层')
      }

      console.log(`✅ [useOverlayData] 关闭浮层: ${overlayId}`, returnData)
      injectedCloseOverlay(returnData)
    } catch (error: any) {
      console.error(`❌ [useOverlayData] 关闭浮层失败: ${overlayId}`, error)
      throw new Error(`关闭浮层失败: ${error.message}`)
    }
  }

  /**
   * 更新浮层上下文
   */
  const updateContext = (context: any) => {
    try {
      if (!overlayId) {
        console.error('❌ [useOverlayData] 无法更新上下文：overlayId 未定义')
        throw new Error('浮层ID未定义，无法更新上下文')
      }

      stateManager.dispatch('overlay/updateOverlayContext', {
        id: overlayId,
        context,
      })

      console.log(`✅ [useOverlayData] 上下文已更新: ${overlayId}`, context)
    } catch (error: any) {
      console.error(`❌ [useOverlayData] 更新上下文失败: ${overlayId}`, error)
      throw new Error(`更新上下文失败: ${error.message}`)
    }
  }

  /**
   * 获取浮层参数
   */
  const getParam = <T = any>(key: string, defaultValue?: T): T => {
    try {
      const value = overlayContext.value?.[key]
      return value !== undefined ? value : defaultValue
    } catch (error: any) {
      console.error(`❌ [useOverlayData] 获取参数失败: ${key}`, error)
      return defaultValue as T
    }
  }

  /**
   * 设置浮层参数
   */
  const setParam = (key: string, value: any) => {
    try {
      updateContext({
        [key]: value,
      })
    } catch (error: any) {
      console.error(`❌ [useOverlayData] 设置参数失败: ${key}`, error)
      throw new Error(`设置参数失败: ${error.message}`)
    }
  }

  /**
   * 获取父页面数据
   */
  const getParentData = <T = any>(path: string, defaultValue?: T): T => {
    try {
      if (!path) return defaultValue as T

      const keys = path.split('.')
      let current = parentContext.value

      for (const key of keys) {
        if (current === null || current === undefined) {
          return defaultValue as T
        }
        current = current[key]
      }

      return current !== undefined ? current : defaultValue
    } catch (error: any) {
      console.error(`❌ [useOverlayData] 获取父页面数据失败: ${path}`, error)
      return defaultValue as T
    }
  }

  return {
    overlayId,
    overlayContext,
    parentContext,
    returnData,
    closeOverlay,
    updateContext,
    getParam,
    setParam,
    getParentData,
  }
}

/**
 * 检查是否在浮层上下文中
 *
 * @returns 是否在浮层上下文中
 */
export function isInOverlayContext(): boolean {
  const overlayId = inject<string>('overlayId', undefined)
  return overlayId !== undefined
}

/**
 * 获取当前浮层ID
 *
 * @returns 浮层ID，如果不在浮层上下文中则返回 undefined
 */
export function getCurrentOverlayId(): string | undefined {
  return inject<string>('overlayId', undefined)
}
