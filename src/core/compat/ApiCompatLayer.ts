/**
 * API兼容层 - 提供旧版API到新版API的映射
 *
 * 确保现有代码在架构重构后仍能正常工作
 */

import { BaseLegacyAdapter, type LegacyApiCall, type MigrationAdvice } from './LegacyAdapter'

/**
 * API兼容层配置
 */
export interface ApiCompatConfig {
  /**
   * 是否启用兼容层
   */
  enabled?: boolean

  /**
   * 兼容层版本
   */
  version?: string

  /**
   * 是否自动迁移
   */
  autoMigrate?: boolean
}

/**
 * API映射规则
 */
export interface ApiMappingRule {
  /**
   * 旧版API模式 (支持通配符)
   */
  pattern: string | RegExp

  /**
   * 新版API名称或转换函数
   */
  target: string | ((call: LegacyApiCall) => Promise<any>)

  /**
   * 参数转换函数
   */
  transformArgs?: (args: any[]) => any[]

  /**
   * 结果转换函数
   */
  transformResult?: (result: any) => any

  /**
   * 迁移建议
   */
  advice?: MigrationAdvice
}

/**
 * API兼容层适配器
 */
export class ApiCompatLayer extends BaseLegacyAdapter {
  private mappingRules: ApiMappingRule[] = []
  private apiRegistry: Map<string, any> = new Map()

  constructor(config: ApiCompatConfig = {}) {
    super('ApiCompatLayer', config.version || '1.0.0', {
      enableWarnings: true,
      logUsage: true,
      strictMode: false,
    })

    this.initializeDefaultMappings()
  }

  /**
   * 初始化默认映射规则
   */
  private initializeDefaultMappings(): void {
    // 数据源相关API映射
    this.addMapping({
      pattern: /^dataSource\.create$/,
      target: 'DataFlowEngine.createDataSource',
      advice: {
        oldApi: 'dataSource.create',
        newApi: 'DataFlowEngine.createDataSource',
        description: '使用新的数据流引擎创建数据源',
        example: `
// 旧版
const ds = dataSource.create({ type: 'api', url: '/api/data' })

// 新版
const ds = container.resolve(DataFlowEngine).createDataSource({
  type: 'api',
  config: { url: '/api/data' }
})`,
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    // 状态管理相关API映射
    this.addMapping({
      pattern: /^store\.register$/,
      target: 'StateManager.registerModule',
      advice: {
        oldApi: 'store.register',
        newApi: 'StateManager.registerModule',
        description: '使用新的状态管理器注册模块',
        example: `
// 旧版
store.register('myModule', { state, mutations, actions })

// 新版
container.resolve(StateManager).registerModule({
  name: 'myModule',
  state,
  mutations,
  actions
})`,
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    // 事件相关API映射
    this.addMapping({
      pattern: /^eventBus\.(on|emit|off)$/,
      target: async (call: LegacyApiCall) => {
        // 直接映射到新的事件总线
        const method = call.method || call.name.split('.')[1]
        return this.callNewApi('EventBus', method, call.args || [])
      },
      advice: {
        oldApi: 'eventBus.*',
        newApi: 'EventBus.*',
        description: '使用依赖注入获取事件总线实例',
        example: `
// 旧版
eventBus.on('event', handler)

// 新版
const eventBus = container.resolve(EventBus)
eventBus.on('event', handler)`,
        deprecatedIn: '2.0.0',
      },
    })

    // 控件注册相关API映射
    this.addMapping({
      pattern: /^controls\.register$/,
      target: 'ControlRegistry.registerPlugin',
      transformArgs: args => {
        // 将旧版控件定义转换为新版插件格式
        const [controlDef] = args
        return [
          {
            metadata: {
              id: controlDef.kind,
              name: controlDef.kindName,
              version: '1.0.0',
            },
            registerControls: () => [controlDef],
          },
        ]
      },
      advice: {
        oldApi: 'controls.register',
        newApi: 'ControlRegistry.registerPlugin',
        description: '使用插件系统注册控件',
        deprecatedIn: '2.0.0',
        removedIn: '3.0.0',
      },
    })

    // API客户端相关映射
    this.addMapping({
      pattern: /^api\.(get|post|put|delete)$/,
      target: async (call: LegacyApiCall) => {
        const method = call.method || call.name.split('.')[1]
        return this.callNewApi('ApiClient', method, call.args || [])
      },
      advice: {
        oldApi: 'api.*',
        newApi: 'ApiClient.*',
        description: '使用新的API客户端',
        example: `
// 旧版
const data = await api.get('/endpoint')

// 新版
const apiClient = container.resolve(ApiClient)
const response = await apiClient.get('/endpoint')
const data = response.data`,
        deprecatedIn: '2.0.0',
      },
    })
  }

  /**
   * 添加映射规则
   */
  addMapping(rule: ApiMappingRule): void {
    this.mappingRules.push(rule)
  }

  /**
   * 注册新版API实例
   */
  registerApi(name: string, instance: any): void {
    this.apiRegistry.set(name, instance)
  }

  /**
   * 适配旧版API调用
   */
  async adapt<T = any>(legacyCall: LegacyApiCall): Promise<T> {
    this.logLegacyUsage(legacyCall.name)

    const rule = this.findMatchingRule(legacyCall.name)
    if (!rule) {
      throw new Error(`No mapping rule found for API: ${legacyCall.name}`)
    }

    // 转换参数
    let args = legacyCall.args || []
    if (rule.transformArgs) {
      args = rule.transformArgs(args)
    }

    // 执行新版API
    let result: any
    if (typeof rule.target === 'function') {
      result = await rule.target({ ...legacyCall, args })
    } else {
      const [serviceName, methodName] = rule.target.split('.')
      result = await this.callNewApi(serviceName, methodName, args)
    }

    // 转换结果
    if (rule.transformResult) {
      result = rule.transformResult(result)
    }

    return result
  }

  /**
   * 检查是否支持该API
   */
  supports(apiName: string): boolean {
    return this.findMatchingRule(apiName) !== null
  }

  /**
   * 获取迁移建议
   */
  getMigrationAdvice(apiName: string): MigrationAdvice | null {
    const rule = this.findMatchingRule(apiName)
    return rule?.advice || null
  }

  /**
   * 查找匹配的映射规则
   */
  private findMatchingRule(apiName: string): ApiMappingRule | null {
    for (const rule of this.mappingRules) {
      if (typeof rule.pattern === 'string') {
        if (rule.pattern === apiName) {
          return rule
        }
      } else if (rule.pattern instanceof RegExp) {
        if (rule.pattern.test(apiName)) {
          return rule
        }
      }
    }
    return null
  }

  /**
   * 调用新版API
   */
  private async callNewApi(serviceName: string, methodName: string, args: any[]): Promise<any> {
    const service = this.apiRegistry.get(serviceName)
    if (!service) {
      throw new Error(`Service "${serviceName}" not registered in API compat layer. ` + `Please register it using registerApi() method.`)
    }

    const method = service[methodName]
    if (typeof method !== 'function') {
      throw new Error(`Method "${methodName}" not found on service "${serviceName}"`)
    }

    return method.apply(service, args)
  }

  /**
   * 创建代理对象,自动适配旧版API
   */
  createProxy<T extends object>(target: T, apiPrefix: string): T {
    return new Proxy(target, {
      get: (obj, prop) => {
        const propName = String(prop)
        const apiName = `${apiPrefix}.${propName}`

        // 如果是已知的旧版API,返回适配后的方法
        if (this.supports(apiName)) {
          return (...args: any[]) => {
            return this.adapt({
              name: apiName,
              method: propName,
              args,
            })
          }
        }

        // 否则返回原始属性
        return obj[prop as keyof T]
      },
    })
  }
}

/**
 * 创建全局兼容层实例
 */
let globalCompatLayer: ApiCompatLayer | null = null

export function getGlobalCompatLayer(): ApiCompatLayer {
  if (!globalCompatLayer) {
    globalCompatLayer = new ApiCompatLayer()
  }
  return globalCompatLayer
}

export function setGlobalCompatLayer(layer: ApiCompatLayer): void {
  globalCompatLayer = layer
}
