/**
 * 权限指令
 *
 * 用法：
 * v-permission="'user:user-list:add'"
 * v-permission="['user:user-list:add', 'user:user-list:edit']"
 * v-permission:any="['user:user-list:add', 'user:user-list:edit']"
 * v-permission:all="['user:user-list:view', 'user:user-list:edit']"
 */

import type { Directive, DirectiveBinding } from 'vue'

type PermissionValue = string | string[]

// 获取StateManager实例
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

function checkPermission(value: PermissionValue, modifier: string = 'any'): boolean {
  const stateManager = getStateManager()
  if (!stateManager) return false

  try {
    const authState = stateManager.getState('auth')
    const permissions = authState?.permissionInfo?.permissions || []

    if (typeof value === 'string') {
      return permissions.includes(value)
    }

    if (Array.isArray(value)) {
      if (modifier === 'all') {
        return value.every(p => permissions.includes(p))
      }
      return value.some(p => permissions.includes(p))
    }

    return false
  } catch (error) {
    console.warn('权限检查失败:', error)
    return false
  }
}

export const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const { value, modifiers } = binding
    const modifier = Object.keys(modifiers)[0] || 'any'

    if (!checkPermission(value, modifier)) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<PermissionValue>) {
    const { value, modifiers } = binding
    const modifier = Object.keys(modifiers)[0] || 'any'

    if (!checkPermission(value, modifier)) {
      el.style.display = 'none'
      el.setAttribute('data-permission-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-permission-hidden')
    }
  },
}

/**
 * 角色指令
 *
 * 用法：
 * v-role="'系统管理员'"
 * v-role="['系统管理员', '普通用户']"
 */
function checkRole(value: string | string[]): boolean {
  const stateManager = getStateManager()
  if (!stateManager) return false

  try {
    const authState = stateManager.getState('auth')
    const roles = authState?.permissionInfo?.roleNames || []

    if (typeof value === 'string') {
      return roles.includes(value)
    } else if (Array.isArray(value)) {
      return value.some(r => roles.includes(r))
    }

    return false
  } catch (error) {
    console.warn('角色检查失败:', error)
    return false
  }
}

export const role: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding

    if (!checkRole(value)) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    }
  },

  updated(el: HTMLElement, binding: DirectiveBinding<string | string[]>) {
    const { value } = binding

    if (!checkRole(value)) {
      el.style.display = 'none'
      el.setAttribute('data-role-hidden', 'true')
    } else {
      el.style.display = ''
      el.removeAttribute('data-role-hidden')
    }
  },
}
