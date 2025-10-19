/**
 * Path 拦截器
 * 根据当前路由自动添加 path 到请求头
 */

import type { RequestInterceptor } from './IApiClient'

/**
 * 创建 Path 拦截器
 *
 * 该拦截器会根据当前路由从状态管理中获取对应的 path，
 * 并自动添加到请求头中，用于后端权限校验
 */
export const createPathInterceptor = (): RequestInterceptor => {
  return config => {
    try {
      // 获取当前路由
      const currentRoute = window.location.pathname

      // 从状态管理获取对应的 path
      // 注意：这里需要延迟导入以避免循环依赖
      const stateManager = (window as any).__STATE_MANAGER__
      if (stateManager) {
        const resourceModule = stateManager.getModule('resource')
        if (resourceModule) {
          const path = resourceModule.getters.getCurrentPath(currentRoute)

          if (path) {
            config.headers = config.headers || {}
            config.headers['path'] = path
            console.log('[PathInterceptor] 添加 path 到请求头:', { currentRoute, path })
          }
        }
      }
    } catch (error) {
      console.warn('[PathInterceptor] 执行失败:', error)
    }

    return config
  }
}
