/**
 * 兼容适配器 - 提供向后兼容支持
 *
 * 用于在新架构中支持旧版API调用,确保平滑迁移
 */

// Logger type - will be provided by the logging module
export type ILogger = {
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

/**
 * 兼容适配器接口
 */
export interface ILegacyAdapter {
  /**
   * 适配器名称
   */
  readonly name: string

  /**
   * 适配器版本
   */
  readonly version: string

  /**
   * 将旧版API调用转换为新版API调用
   */
  adapt<T = any>(legacyCall: LegacyApiCall): Promise<T>

  /**
   * 检查是否支持该旧版API
   */
  supports(apiName: string): boolean

  /**
   * 获取迁移建议
   */
  getMigrationAdvice(apiName: string): MigrationAdvice | null
}

/**
 * 旧版API调用
 */
export interface LegacyApiCall {
  /**
   * API名称
   */
  name: string

  /**
   * API方法
   */
  method?: string

  /**
   * 参数
   */
  args?: any[]

  /**
   * 上下文
   */
  context?: any
}

/**
 * 迁移建议
 */
export interface MigrationAdvice {
  /**
   * 旧版API名称
   */
  oldApi: string

  /**
   * 新版API名称
   */
  newApi: string

  /**
   * 迁移说明
   */
  description: string

  /**
   * 代码示例
   */
  example?: string

  /**
   * 废弃版本
   */
  deprecatedIn?: string

  /**
   * 移除版本
   */
  removedIn?: string

  /**
   * 文档链接
   */
  documentationUrl?: string
}

/**
 * 适配器配置
 */
export interface LegacyAdapterConfig {
  /**
   * 是否启用警告
   */
  enableWarnings?: boolean

  /**
   * 是否记录使用情况
   */
  logUsage?: boolean

  /**
   * 严格模式 - 在严格模式下,使用已废弃的API会抛出错误
   */
  strictMode?: boolean
}

/**
 * 基础兼容适配器
 */
export abstract class BaseLegacyAdapter implements ILegacyAdapter {
  protected logger?: ILogger
  protected config: LegacyAdapterConfig

  constructor(
    public readonly name: string,
    public readonly version: string,
    config: LegacyAdapterConfig = {},
    logger?: ILogger
  ) {
    this.config = {
      enableWarnings: true,
      logUsage: true,
      strictMode: false,
      ...config,
    }
    this.logger = logger
  }

  abstract adapt<T = any>(legacyCall: LegacyApiCall): Promise<T>
  abstract supports(apiName: string): boolean
  abstract getMigrationAdvice(apiName: string): MigrationAdvice | null

  /**
   * 记录旧版API使用
   */
  protected logLegacyUsage(apiName: string): void {
    if (!this.config.logUsage) return

    const advice = this.getMigrationAdvice(apiName)

    if (this.config.strictMode && advice?.removedIn) {
      throw new Error(
        `API "${apiName}" has been removed in version ${advice.removedIn}. ` +
          `Please use "${advice.newApi}" instead. ${advice.description}`
      )
    }

    if (this.config.enableWarnings && advice) {
      const message = this.formatWarningMessage(advice)
      this.logger?.warn(message)
      console.warn(message)
    }
  }

  /**
   * 格式化警告消息
   */
  protected formatWarningMessage(advice: MigrationAdvice): string {
    let message = `[DEPRECATED] API "${advice.oldApi}" is deprecated.`

    if (advice.deprecatedIn) {
      message += ` (since v${advice.deprecatedIn})`
    }

    if (advice.removedIn) {
      message += ` and will be removed in v${advice.removedIn}.`
    }

    message += `\nPlease use "${advice.newApi}" instead.\n${advice.description}`

    if (advice.example) {
      message += `\n\nExample:\n${advice.example}`
    }

    if (advice.documentationUrl) {
      message += `\n\nSee: ${advice.documentationUrl}`
    }

    return message
  }
}

/**
 * 兼容适配器管理器
 */
export class LegacyAdapterManager {
  private adapters = new Map<string, ILegacyAdapter>()
  private logger?: ILogger

  constructor(logger?: ILogger) {
    this.logger = logger
  }

  /**
   * 注册适配器
   */
  registerAdapter(adapter: ILegacyAdapter): void {
    this.adapters.set(adapter.name, adapter)
    this.logger?.info(`Registered legacy adapter: ${adapter.name} v${adapter.version}`)
  }

  /**
   * 注销适配器
   */
  unregisterAdapter(name: string): void {
    this.adapters.delete(name)
    this.logger?.info(`Unregistered legacy adapter: ${name}`)
  }

  /**
   * 获取适配器
   */
  getAdapter(name: string): ILegacyAdapter | undefined {
    return this.adapters.get(name)
  }

  /**
   * 适配旧版API调用
   */
  async adapt<T = any>(legacyCall: LegacyApiCall): Promise<T> {
    // 查找支持该API的适配器
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(legacyCall.name)) {
        return adapter.adapt<T>(legacyCall)
      }
    }

    throw new Error(`No adapter found for legacy API: ${legacyCall.name}. ` + `This API may have been removed or is not supported.`)
  }

  /**
   * 获取所有迁移建议
   */
  getAllMigrationAdvice(): MigrationAdvice[] {
    const adviceList: MigrationAdvice[] = []

    for (const adapter of this.adapters.values()) {
      // 这里需要适配器提供所有支持的API列表
      // 简化实现,实际使用时可以扩展
    }

    return adviceList
  }

  /**
   * 检查API是否已废弃
   */
  isDeprecated(apiName: string): boolean {
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(apiName)) {
        const advice = adapter.getMigrationAdvice(apiName)
        return advice !== null
      }
    }
    return false
  }
}
