/**
 * 状态模块注册
 *
 * 集中管理所有状态模块的注册和导出
 */

import type { StateManager } from '../StateManager'
import { appModule } from './app'
import { authModule } from './auth'
import { themeModule } from './theme'
import { userModule } from './user'
import { designerModule } from './designer'
import { resourceModule } from './resource'
import { overlayModule } from './overlay'
import modalModule from './modal'

/**
 * 获取全局StateManager实例
 */
function getGlobalStateManager(): StateManager {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  throw new Error('StateManager not initialized. Please ensure migration system is bootstrapped.')
}

/**
 * 扩展StateManager，添加getModule方法
 */
declare module '../StateManager' {
  interface StateManager {
    getModule(name: string): any
  }
}

// 为StateManager添加getModule方法
if (typeof window !== 'undefined') {
  const originalGetGlobalStateManager = getGlobalStateManager
  try {
    const sm = originalGetGlobalStateManager()
    if (sm && !(sm as any).getModule) {
      ;(sm as any).getModule = function (name: string) {
        return {
          state: this.getState(name),
          getters: this.getGetters(),
          commit: this.commit.bind(this),
          dispatch: this.dispatch.bind(this),
        }
      }
    }
  } catch (e) {
    // StateManager尚未初始化
  }
}

/**
 * 注册所有状态模块
 *
 * @param stateManager - StateManager实例，默认使用全局实例
 */
export function registerStateModules(stateManager?: StateManager): void {
  const sm = stateManager || getGlobalStateManager()

  // 检查模块是否已注册，避免重复注册
  const registeredModules = new Set<string>()

  try {
    // 尝试获取已注册的模块
    if (sm.getState('app')) registeredModules.add('app')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('auth')) registeredModules.add('auth')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('theme')) registeredModules.add('theme')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('user')) registeredModules.add('user')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('designer')) registeredModules.add('designer')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('resource')) registeredModules.add('resource')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('overlay')) registeredModules.add('overlay')
  } catch (e) {
    /* 模块未注册 */
  }

  try {
    if (sm.getState('modal')) registeredModules.add('modal')
  } catch (e) {
    /* 模块未注册 */
  }

  // 只注册未注册的模块
  if (!registeredModules.has('app')) {
    sm.registerModule(appModule)
  }

  if (!registeredModules.has('auth')) {
    sm.registerModule(authModule)
  }

  if (!registeredModules.has('theme')) {
    sm.registerModule(themeModule)
  }

  if (!registeredModules.has('user')) {
    sm.registerModule(userModule)
  }

  if (!registeredModules.has('designer')) {
    sm.registerModule(designerModule)
  }

  if (!registeredModules.has('resource')) {
    sm.registerModule(resourceModule)
  }

  if (!registeredModules.has('overlay')) {
    sm.registerModule(overlayModule)
  }

  if (!registeredModules.has('modal')) {
    sm.registerModule(modalModule)
  }

  console.log('✅ All state modules registered successfully')
}

/**
 * 初始化状态模块
 *
 * 注册模块并执行初始化操作
 */
export async function initializeStateModules(stateManager?: StateManager): Promise<void> {
  const sm = stateManager || getGlobalStateManager()

  // 注册模块（如果尚未注册）
  registerStateModules(sm)

  // 初始化Auth模块（检查认证状态）
  try {
    const authState = sm.getState('auth')
    if (authState) {
      await sm.dispatch('auth/checkAuth')
    }
  } catch (error) {
    console.warn('Auth initialization failed:', error)
  }

  // 初始化Theme模块
  try {
    const themeState = sm.getState('theme')
    if (themeState) {
      await sm.dispatch('theme/init')
    }
  } catch (error) {
    console.warn('Theme initialization failed:', error)
  }

  // 初始化App模块（语言设置）
  try {
    const appState = sm.getState('app')
    if (appState) {
      await sm.dispatch('app/initLanguage')
    }
  } catch (error) {
    console.warn('App initialization failed:', error)
  }

  // 初始化User模块（从存储恢复）
  try {
    const userState = sm.getState('user')
    if (userState) {
      await sm.dispatch('user/initFromStorage')
    }
  } catch (error) {
    console.warn('User initialization failed:', error)
  }

  // 初始化Resource模块（获取用户菜单）
  try {
    const accessToken = localStorage.getItem('accessToken')
    if (accessToken) {
      // 如果已登录，获取用户菜单
      await sm.dispatch('resource/fetchCurrentUserMenus')
      console.log('✅ User menus loaded successfully')
    }
  } catch (error) {
    console.warn('Resource initialization failed:', error)
  }

  // 将StateManager挂载到全局，供拦截器使用
  if (typeof window !== 'undefined') {
    ;(window as any).__STATE_MANAGER__ = sm
  }

  console.log('✅ All state modules initialized successfully')
}

// 导出所有模块
export * from './app'
export * from './auth'
export * from './theme'
export * from './user'
export * from './designer'
export * from './resource'
export * from './overlay'
export { default as modalModule } from './modal'

// 导出辅助函数
export * from '../helpers'
