/**
 * Designer状态模块
 *
 * 管理设计器相关的状态，包括：
 * - 选中的控件
 * - 属性面板配置
 * - 属性值
 * - 验证错误
 * - 面板UI状态
 */

import type { IStateModule } from '../IStateModule'
import type { PropertyPanelConfig, PropertyValidationResult } from '../../renderer/properties/types'

/**
 * Designer状态接口
 */
export interface DesignerState {
  // 选中的控件
  selectedControl: any | null
  selectedControlId: string | null

  // 属性面板配置
  propertyPanelConfig: PropertyPanelConfig | null

  // 属性值
  propertyValues: Record<string, any>

  // 验证错误
  validationErrors: Record<string, string>

  // UI状态
  activeTab: string
  expandedGroups: string[]

  // 历史记录
  propertyHistory: Array<{
    controlId: string
    field: string
    oldValue: any
    newValue: any
    timestamp: number
  }>

  // 加载状态
  loading: boolean
}

/**
 * Designer状态模块
 */
export const designerModule: IStateModule<DesignerState> = {
  name: 'designer',

  state: {
    selectedControl: null,
    selectedControlId: null,
    propertyPanelConfig: null,
    propertyValues: {},
    validationErrors: {},
    activeTab: 'basic',
    expandedGroups: [
      'basic-info',
      'extended',
      'common',
      'data-binding',
      'size',
      'spacing',
      'flex',
      'position',
      'font',
      'border',
      'radius',
      'background',
    ],
    propertyHistory: [],
    loading: false,
  },

  getters: {
    // 获取选中的控件
    getSelectedControl: state => state.selectedControl,

    // 获取选中的控件ID
    getSelectedControlId: state => state.selectedControlId,

    // 获取属性面板配置
    getPropertyPanelConfig: state => state.propertyPanelConfig,

    // 获取属性值
    getPropertyValue: state => (key: string) => state.propertyValues[key],

    // 获取所有属性值
    getAllPropertyValues: state => state.propertyValues,

    // 获取验证错误
    getValidationError: state => (key: string) => state.validationErrors[key],

    // 获取所有验证错误
    getAllValidationErrors: state => state.validationErrors,

    // 检查是否有验证错误
    hasValidationErrors: state => Object.keys(state.validationErrors).length > 0,

    // 获取当前激活的标签页
    getActiveTab: state => state.activeTab,

    // 获取展开的分组
    getExpandedGroups: state => state.expandedGroups,

    // 检查分组是否展开
    isGroupExpanded: state => (groupKey: string) => state.expandedGroups.includes(groupKey),

    // 获取属性历史
    getPropertyHistory: state => state.propertyHistory,

    // 获取加载状态
    isLoading: state => state.loading,
  },

  mutations: {
    // 设置选中的控件
    setSelectedControl(state, control: any) {
      state.selectedControl = control
      state.selectedControlId = control?.id || null

      // 清空属性值和验证错误
      if (!control) {
        state.propertyValues = {}
        state.validationErrors = {}
        state.propertyPanelConfig = null
      }
    },

    // 设置属性面板配置
    setPropertyPanelConfig(state, config: PropertyPanelConfig | null) {
      state.propertyPanelConfig = config
    },

    // 设置属性值
    setPropertyValue(state, payload: { key: string; value: any }) {
      state.propertyValues[payload.key] = payload.value
    },

    // 批量设置属性值
    setPropertyValues(state, values: Record<string, any>) {
      state.propertyValues = { ...state.propertyValues, ...values }
    },

    // 清空属性值
    clearPropertyValues(state) {
      state.propertyValues = {}
    },

    // 设置验证错误
    setValidationError(state, payload: { key: string; error: string }) {
      if (payload.error) {
        state.validationErrors[payload.key] = payload.error
      } else {
        delete state.validationErrors[payload.key]
      }
    },

    // 批量设置验证错误
    setValidationErrors(state, errors: Record<string, string>) {
      state.validationErrors = errors
    },

    // 清空验证错误
    clearValidationErrors(state) {
      state.validationErrors = {}
    },

    // 清空单个字段的验证错误
    clearValidationError(state, key: string) {
      delete state.validationErrors[key]
    },

    // 设置激活的标签页
    setActiveTab(state, tab: string) {
      state.activeTab = tab
    },

    // 设置展开的分组
    setExpandedGroups(state, groups: string[]) {
      state.expandedGroups = groups
    },

    // 切换分组展开状态
    toggleGroup(state, groupKey: string) {
      const index = state.expandedGroups.indexOf(groupKey)
      if (index > -1) {
        state.expandedGroups.splice(index, 1)
      } else {
        state.expandedGroups.push(groupKey)
      }
    },

    // 展开分组
    expandGroup(state, groupKey: string) {
      if (!state.expandedGroups.includes(groupKey)) {
        state.expandedGroups.push(groupKey)
      }
    },

    // 折叠分组
    collapseGroup(state, groupKey: string) {
      const index = state.expandedGroups.indexOf(groupKey)
      if (index > -1) {
        state.expandedGroups.splice(index, 1)
      }
    },

    // 添加属性历史记录
    addPropertyHistory(
      state,
      record: {
        controlId: string
        field: string
        oldValue: any
        newValue: any
        timestamp: number
      }
    ) {
      state.propertyHistory.push(record)

      // 限制历史记录数量
      if (state.propertyHistory.length > 100) {
        state.propertyHistory.shift()
      }
    },

    // 清空属性历史
    clearPropertyHistory(state) {
      state.propertyHistory = []
    },

    // 设置加载状态
    setLoading(state, loading: boolean) {
      state.loading = loading
    },
  },

  actions: {
    // 加载属性面板
    async loadPropertyPanel(context, control: any) {
      try {
        context.commit('setLoading', true)

        // 获取PropertyService
        const propertyService = (window as any).__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyService')

        if (!propertyService) {
          console.warn('PropertyService not available')
          return
        }

        // 获取控件的面板配置
        const config = propertyService.getPanelManager().getPanelForControl(control.kind)

        context.commit('setPropertyPanelConfig', config)
        context.commit('setSelectedControl', control)

        // 初始化属性值
        if (control.props) {
          context.commit('setPropertyValues', control.props)
        }

        // 清空验证错误
        context.commit('clearValidationErrors')
      } catch (error) {
        console.error('Failed to load property panel:', error)
      } finally {
        context.commit('setLoading', false)
      }
    },

    // 更新属性
    async updateProperty(context, payload: { key: string; value: any }) {
      try {
        const { key, value } = payload
        const control = context.state.selectedControl

        if (!control) {
          console.warn('No control selected')
          return
        }

        // 获取PropertyService
        const propertyService = (window as any).__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyService')

        if (!propertyService) {
          console.warn('PropertyService not available')
          context.commit('setPropertyValue', { key, value })
          return
        }

        // 获取字段配置
        const fieldManager = propertyService.getFieldManager()
        const field = fieldManager.getField(key)

        // 验证属性值
        if (field) {
          const validation = await fieldManager.validateField(field, value)

          if (validation.valid) {
            // 记录历史
            const oldValue = context.state.propertyValues[key]
            context.commit('addPropertyHistory', {
              controlId: control.id,
              field: key,
              oldValue,
              newValue: value,
              timestamp: Date.now(),
            })

            // 更新属性值
            context.commit('setPropertyValue', { key, value })
            context.commit('clearValidationError', key)

            // 触发控件更新事件
            const eventBus = (window as any).__MIGRATION_SYSTEM__?.coreServices?.eventBus
            if (eventBus) {
              eventBus.emit('control.property.updated', {
                controlId: control.id,
                key,
                value,
              })
            }
          } else {
            // 设置验证错误
            context.commit('setValidationError', {
              key,
              error: validation.message || '验证失败',
            })
          }
        } else {
          // 没有字段配置，直接更新
          context.commit('setPropertyValue', { key, value })
        }
      } catch (error) {
        console.error('Failed to update property:', error)
      }
    },

    // 批量更新属性
    async updateProperties(context, values: Record<string, any>) {
      for (const [key, value] of Object.entries(values)) {
        await context.dispatch('updateProperty', { key, value })
      }
    },

    // 验证所有属性
    async validateAllProperties(context) {
      try {
        const propertyService = (window as any).__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyService')

        if (!propertyService) {
          console.warn('PropertyService not available')
          return true
        }

        const fieldManager = propertyService.getFieldManager()
        const values = context.state.propertyValues
        const errors: Record<string, string> = {}

        // 验证所有字段
        for (const [key, value] of Object.entries(values)) {
          const field = fieldManager.getField(key)
          if (field) {
            const validation = await fieldManager.validateField(field, value)
            if (!validation.valid && validation.message) {
              errors[key] = validation.message
            }
          }
        }

        context.commit('setValidationErrors', errors)

        return Object.keys(errors).length === 0
      } catch (error) {
        console.error('Failed to validate properties:', error)
        return false
      }
    },

    // 重置属性面板
    resetPropertyPanel(context) {
      context.commit('setSelectedControl', null)
      context.commit('setPropertyPanelConfig', null)
      context.commit('clearPropertyValues')
      context.commit('clearValidationErrors')
      context.commit('setActiveTab', 'basic')
    },
  },
}
