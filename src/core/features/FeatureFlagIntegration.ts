/**
 * 特性开关集成 - 将特性开关集成到关键模块
 */

import type { IFeatureFlags, FeatureContext } from './FeatureFlags'

/**
 * 特性开关集成配置
 */
export interface FeatureFlagIntegrationConfig {
  /**
   * 特性开关实例
   */
  featureFlags: IFeatureFlags

  /**
   * 默认上下文
   */
  defaultContext?: FeatureContext
}

/**
 * 特性开关集成类
 *
 * 提供便捷的方法在各个模块中使用特性开关
 */
export class FeatureFlagIntegration {
  private featureFlags: IFeatureFlags
  private defaultContext?: FeatureContext

  constructor(config: FeatureFlagIntegrationConfig) {
    this.featureFlags = config.featureFlags
    this.defaultContext = config.defaultContext
  }

  /**
   * 根据特性开关执行不同的代码路径
   */
  async branch<T>(
    flagName: string,
    enabledFn: () => T | Promise<T>,
    disabledFn: () => T | Promise<T>,
    context?: FeatureContext
  ): Promise<T> {
    const ctx = context || this.defaultContext
    const isEnabled = this.featureFlags.isEnabled(flagName, ctx)

    if (isEnabled) {
      return enabledFn()
    } else {
      return disabledFn()
    }
  }

  /**
   * 仅在特性启用时执行
   */
  async whenEnabled<T>(flagName: string, fn: () => T | Promise<T>, context?: FeatureContext): Promise<T | undefined> {
    const ctx = context || this.defaultContext
    const isEnabled = this.featureFlags.isEnabled(flagName, ctx)

    if (isEnabled) {
      return fn()
    }
    return undefined
  }

  /**
   * 仅在特性禁用时执行
   */
  async whenDisabled<T>(flagName: string, fn: () => T | Promise<T>, context?: FeatureContext): Promise<T | undefined> {
    const ctx = context || this.defaultContext
    const isEnabled = this.featureFlags.isEnabled(flagName, ctx)

    if (!isEnabled) {
      return fn()
    }
    return undefined
  }

  /**
   * 根据特性开关选择值
   */
  select<T>(flagName: string, enabledValue: T, disabledValue: T, context?: FeatureContext): T {
    const ctx = context || this.defaultContext
    const isEnabled = this.featureFlags.isEnabled(flagName, ctx)
    return isEnabled ? enabledValue : disabledValue
  }

  /**
   * 检查特性是否启用
   */
  isEnabled(flagName: string, context?: FeatureContext): boolean {
    const ctx = context || this.defaultContext
    return this.featureFlags.isEnabled(flagName, ctx)
  }

  /**
   * 设置默认上下文
   */
  setDefaultContext(context: FeatureContext): void {
    this.defaultContext = context
  }
}

/**
 * 预定义的特性标志名称
 *
 * 集中管理所有特性标志,避免字符串硬编码
 */
export const FEATURE_FLAGS = {
  // 核心架构特性
  NEW_DI_CONTAINER: 'new_di_container',
  NEW_EVENT_BUS: 'new_event_bus',
  NEW_CONFIG_MANAGER: 'new_config_manager',

  // 数据流引擎特性
  NEW_DATA_FLOW_ENGINE: 'new_data_flow_engine',
  REACTIVE_DATA_SOURCE: 'reactive_data_source',
  DATA_FLOW_PIPELINE: 'data_flow_pipeline',

  // 渲染引擎特性
  NEW_RENDER_ENGINE: 'new_render_engine',
  FRAMEWORK_ADAPTER: 'framework_adapter',
  VIRTUAL_SCROLLER: 'virtual_scroller',

  // 插件系统特性
  PLUGIN_SYSTEM: 'plugin_system',
  CONTROL_PLUGIN: 'control_plugin',
  DATA_SOURCE_PLUGIN: 'data_source_plugin',

  // 状态管理特性
  NEW_STATE_MANAGER: 'new_state_manager',
  STATE_PERSISTENCE: 'state_persistence',
  TIME_TRAVEL_DEBUG: 'time_travel_debug',

  // 服务集成特性
  UNIFIED_SERVICES: 'unified_services',

  // API层特性
  NEW_API_CLIENT: 'new_api_client',
  API_ADAPTER: 'api_adapter',
  REQUEST_CACHE: 'request_cache',
  AUTO_RETRY: 'auto_retry',

  // 性能优化特性
  LAZY_LOADING: 'lazy_loading',
  WEB_WORKER: 'web_worker',
  MULTI_LEVEL_CACHE: 'multi_level_cache',

  // 错误处理特性
  NEW_ERROR_HANDLER: 'new_error_handler',
  ERROR_BOUNDARY: 'error_boundary',
  ERROR_MONITORING: 'error_monitoring',

  // 兼容层特性
  LEGACY_ADAPTER: 'legacy_adapter',
  API_COMPAT_LAYER: 'api_compat_layer',
} as const

/**
 * 初始化默认特性标志
 */
export function initializeDefaultFeatureFlags(featureFlags: IFeatureFlags): void {
  // 核心架构特性 - 默认启用
  featureFlags.register({
    name: FEATURE_FLAGS.NEW_DI_CONTAINER,
    description: '新的依赖注入容器',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.NEW_EVENT_BUS,
    description: '新的事件总线系统',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.NEW_CONFIG_MANAGER,
    description: '新的配置管理器',
    enabled: true,
  })

  // 数据流引擎特性 - 逐步启用
  featureFlags.register({
    name: FEATURE_FLAGS.NEW_DATA_FLOW_ENGINE,
    description: '新的数据流引擎',
    enabled: false, // 待测试完成后启用
  })

  featureFlags.register({
    name: FEATURE_FLAGS.REACTIVE_DATA_SOURCE,
    description: '响应式数据源',
    enabled: false,
  })

  // 渲染引擎特性
  featureFlags.register({
    name: FEATURE_FLAGS.NEW_RENDER_ENGINE,
    description: '新的渲染引擎',
    enabled: false,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.VIRTUAL_SCROLLER,
    description: '虚拟滚动优化',
    enabled: true,
  })

  // 插件系统特性
  featureFlags.register({
    name: FEATURE_FLAGS.PLUGIN_SYSTEM,
    description: '插件系统',
    enabled: true,
  })

  // 状态管理特性
  featureFlags.register({
    name: FEATURE_FLAGS.NEW_STATE_MANAGER,
    description: '新的状态管理器',
    enabled: true, // 已完成迁移，默认启用
  })

  featureFlags.register({
    name: FEATURE_FLAGS.STATE_PERSISTENCE,
    description: '状态持久化',
    enabled: true,
  })

  // 服务集成特性
  featureFlags.register({
    name: FEATURE_FLAGS.UNIFIED_SERVICES,
    description: '统一服务管理',
    enabled: true,
  })

  // API层特性
  featureFlags.register({
    name: FEATURE_FLAGS.NEW_API_CLIENT,
    description: '新的API客户端',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.REQUEST_CACHE,
    description: '请求缓存',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.AUTO_RETRY,
    description: '自动重试',
    enabled: true,
  })

  // 性能优化特性
  featureFlags.register({
    name: FEATURE_FLAGS.LAZY_LOADING,
    description: '懒加载',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.WEB_WORKER,
    description: 'Web Worker支持',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.MULTI_LEVEL_CACHE,
    description: '多级缓存',
    enabled: true,
  })

  // 兼容层特性 - 默认启用
  featureFlags.register({
    name: FEATURE_FLAGS.LEGACY_ADAPTER,
    description: '旧版适配器',
    enabled: true,
  })

  featureFlags.register({
    name: FEATURE_FLAGS.API_COMPAT_LAYER,
    description: 'API兼容层',
    enabled: true,
  })
}
