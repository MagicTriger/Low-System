/**
 * 服务访问辅助函数
 *
 * 提供统一的服务访问接口
 */

import type { Container } from '../di/Container'

/**
 * 获取全局容器实例
 */
function getGlobalContainer(): Container {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.coreServices.container
  }
  throw new Error('Container not initialized. Please ensure migration system is bootstrapped.')
}

/**
 * 获取服务实例
 *
 * @example
 * ```ts
 * const pluginManager = useService<PluginManager>('PluginManager')
 * ```
 */
export function useService<T>(serviceName: string, container?: Container): T {
  const c = container || getGlobalContainer()
  return c.resolve<T>(serviceName)
}

/**
 * 获取插件管理器
 *
 * @example
 * ```ts
 * const pluginManager = usePluginManager()
 * pluginManager.register(myPlugin)
 * ```
 */
export function usePluginManager(container?: Container): any {
  return useService('PluginManager', container)
}

/**
 * 获取布局管理器
 *
 * @example
 * ```ts
 * const layoutManager = useLayoutManager()
 * layoutManager.setLayout(layout)
 * ```
 */
export function useLayoutManager(container?: Container): any {
  return useService('LayoutManager', container)
}

/**
 * 获取网格系统
 *
 * @example
 * ```ts
 * const gridSystem = useGridSystem()
 * gridSystem.calculateGrid(container)
 * ```
 */
export function useGridSystem(container?: Container): any {
  return useService('GridSystem', container)
}

/**
 * 获取容器管理器
 *
 * @example
 * ```ts
 * const containerManager = useContainerManager()
 * containerManager.createContainer(config)
 * ```
 */
export function useContainerManager(container?: Container): any {
  return useService('ContainerManager', container)
}

/**
 * 获取运行时管理器
 *
 * @example
 * ```ts
 * const runtimeManager = useRuntimeManager()
 * runtimeManager.execute(action)
 * ```
 */
export function useRuntimeManager(container?: Container): any {
  return useService('RuntimeManager', container)
}

/**
 * 获取数据流引擎
 *
 * @example
 * ```ts
 * const dataFlowEngine = useDataFlowEngine()
 * dataFlowEngine.process(data)
 * ```
 */
export function useDataFlowEngine(container?: Container): any {
  return useService('DataFlowEngine', container)
}

/**
 * 获取设计持久化服务
 *
 * @example
 * ```ts
 * const designService = useDesignPersistenceService()
 * await designService.save(design)
 * ```
 */
export function useDesignPersistenceService(container?: Container): any {
  return useService('DesignPersistenceService', container)
}

/**
 * 获取数据源服务
 *
 * @example
 * ```ts
 * const dataSourceService = useDataSourceService()
 * const dataSource = await dataSourceService.get(id)
 * ```
 */
export function useDataSourceService(container?: Container): any {
  return useService('DataSourceService', container)
}

/**
 * 获取控制注册表
 *
 * @example
 * ```ts
 * const controlRegistry = useControlRegistry()
 * controlRegistry.register(control)
 * ```
 */
export function useControlRegistry(container?: Container): any {
  return useService('ControlRegistry', container)
}

/**
 * 获取设置渲染器注册表
 *
 * @example
 * ```ts
 * const settingRegistry = useSettingRendererRegistry()
 * settingRegistry.register(renderer)
 * ```
 */
export function useSettingRendererRegistry(container?: Container): any {
  return useService('SettingRendererRegistry', container)
}

/**
 * 获取属性服务
 *
 * @example
 * ```ts
 * const propertyService = usePropertyService()
 * const fieldManager = propertyService.getFieldManager()
 * ```
 */
export function usePropertyService(container?: Container): any {
  return useService('PropertyService', container)
}

/**
 * 获取属性面板服务
 *
 * @example
 * ```ts
 * const propertyPanelService = usePropertyPanelService()
 * const panels = propertyPanelService.getPanelsForComponent('Button')
 * ```
 */
export function usePropertyPanelService(container?: Container): any {
  return useService('PropertyPanelService', container)
}

/**
 * 检查服务是否已注册
 *
 * @example
 * ```ts
 * if (hasService('PluginManager')) {
 *   const pluginManager = useService('PluginManager')
 * }
 * ```
 */
export function hasService(serviceName: string, container?: Container): boolean {
  try {
    const c = container || getGlobalContainer()
    const registrations = (c as any).registrations
    return registrations && registrations.has(serviceName)
  } catch (error) {
    return false
  }
}

/**
 * 获取所有已注册的服务名称
 *
 * @example
 * ```ts
 * const services = getRegisteredServices()
 * console.log('Registered services:', services)
 * ```
 */
export function getRegisteredServices(container?: Container): string[] {
  try {
    const c = container || getGlobalContainer()
    const registrations = (c as any).registrations
    if (registrations && registrations instanceof Map) {
      return Array.from(registrations.keys())
    }
  } catch (error) {
    console.debug('Failed to get registered services', error)
  }
  return []
}

/**
 * 获取 Logger 服务
 *
 * @example
 * ```ts
 * const logger = useLogger()
 * logger.info('Application started')
 * logger.error('Error occurred', error)
 * ```
 */
export function useLogger(source?: string): any {
  try {
    if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
      const logger = (window as any).__MIGRATION_SYSTEM__.coreServices.logger
      if (source) {
        return logger.child(source)
      }
      return logger
    }
  } catch (error) {
    // Fallback to console
    console.warn('Logger not available, falling back to console')
  }

  // Fallback logger
  const fallbackLogger = {
    debug: console.debug.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    fatal: console.error.bind(console),
    child: () => fallbackLogger,
  }
  return fallbackLogger
}
