/**
 * 特性开关系统 (Feature Flags)
 *
 * 用于控制新旧功能的切换,支持渐进式重构和A/B测试
 */

// Logger type - will be provided by the logging module
export type ILogger = {
  info(message: string, ...args: any[]): void
  warn(message: string, ...args: any[]): void
  error(message: string, ...args: any[]): void
}

// EventBus type - will be provided by the events module
export type IEventBus = {
  emit(event: string, data?: any): void
  on(event: string, handler: (data: any) => void): () => void
}

/**
 * 特性标志
 */
export interface FeatureFlag {
  /**
   * 特性名称
   */
  name: string

  /**
   * 特性描述
   */
  description?: string

  /**
   * 是否启用
   */
  enabled: boolean

  /**
   * 启用条件
   */
  conditions?: FeatureCondition[]

  /**
   * 元数据
   */
  metadata?: Record<string, any>

  /**
   * 创建时间
   */
  createdAt?: Date

  /**
   * 更新时间
   */
  updatedAt?: Date
}

/**
 * 特性条件
 */
export interface FeatureCondition {
  /**
   * 条件类型
   */
  type: 'user' | 'environment' | 'percentage' | 'date' | 'custom'

  /**
   * 条件参数
   */
  params: any
}

/**
 * 特性上下文
 */
export interface FeatureContext {
  /**
   * 用户ID
   */
  userId?: string

  /**
   * 用户属性
   */
  userAttributes?: Record<string, any>

  /**
   * 环境
   */
  environment?: string

  /**
   * 自定义属性
   */
  customAttributes?: Record<string, any>
}

/**
 * 特性开关配置
 */
export interface FeatureFlagsConfig {
  /**
   * 默认启用状态
   */
  defaultEnabled?: boolean

  /**
   * 是否启用事件通知
   */
  enableEvents?: boolean

  /**
   * 是否启用持久化
   */
  enablePersistence?: boolean

  /**
   * 持久化键
   */
  persistenceKey?: string
}

/**
 * 特性开关管理器接口
 */
export interface IFeatureFlags {
  /**
   * 注册特性
   */
  register(flag: FeatureFlag): void

  /**
   * 注销特性
   */
  unregister(name: string): void

  /**
   * 检查特性是否启用
   */
  isEnabled(name: string, context?: FeatureContext): boolean

  /**
   * 启用特性
   */
  enable(name: string): void

  /**
   * 禁用特性
   */
  disable(name: string): void

  /**
   * 切换特性状态
   */
  toggle(name: string): void

  /**
   * 获取特性
   */
  getFlag(name: string): FeatureFlag | undefined

  /**
   * 获取所有特性
   */
  getAllFlags(): FeatureFlag[]

  /**
   * 批量更新特性
   */
  updateFlags(flags: Partial<Record<string, boolean>>): void
}

/**
 * 特性开关管理器实现
 */
export class FeatureFlags implements IFeatureFlags {
  private flags = new Map<string, FeatureFlag>()
  private config: Required<FeatureFlagsConfig>
  private logger?: ILogger
  private eventBus?: IEventBus

  constructor(config: FeatureFlagsConfig = {}, logger?: ILogger, eventBus?: IEventBus) {
    this.config = {
      defaultEnabled: false,
      enableEvents: true,
      enablePersistence: true,
      persistenceKey: 'feature_flags',
      ...config,
    }
    this.logger = logger
    this.eventBus = eventBus

    // 从持久化存储加载
    if (this.config.enablePersistence) {
      this.loadFromStorage()
    }
  }

  /**
   * 注册特性
   */
  register(flag: FeatureFlag): void {
    const now = new Date()
    const existingFlag = this.flags.get(flag.name)

    const newFlag: FeatureFlag = {
      ...flag,
      createdAt: existingFlag?.createdAt || now,
      updatedAt: now,
    }

    this.flags.set(flag.name, newFlag)
    this.logger?.info(`Feature flag registered: ${flag.name}`, { flag: newFlag })

    // 触发事件
    if (this.config.enableEvents) {
      this.eventBus?.emit('feature.registered', { flag: newFlag })
    }

    // 持久化
    if (this.config.enablePersistence) {
      this.saveToStorage()
    }
  }

  /**
   * 注销特性
   */
  unregister(name: string): void {
    const flag = this.flags.get(name)
    if (!flag) return

    this.flags.delete(name)
    this.logger?.info(`Feature flag unregistered: ${name}`)

    // 触发事件
    if (this.config.enableEvents) {
      this.eventBus?.emit('feature.unregistered', { name })
    }

    // 持久化
    if (this.config.enablePersistence) {
      this.saveToStorage()
    }
  }

  /**
   * 检查特性是否启用
   */
  isEnabled(name: string, context?: FeatureContext): boolean {
    const flag = this.flags.get(name)

    // 如果特性不存在,使用默认值
    if (!flag) {
      this.logger?.warn(`Feature flag not found: ${name}, using default: ${this.config.defaultEnabled}`)
      return this.config.defaultEnabled
    }

    // 如果没有条件,直接返回启用状态
    if (!flag.conditions || flag.conditions.length === 0) {
      return flag.enabled
    }

    // 如果特性被禁用,直接返回false
    if (!flag.enabled) {
      return false
    }

    // 评估所有条件 (AND逻辑)
    return flag.conditions.every(condition => this.evaluateCondition(condition, context))
  }

  /**
   * 启用特性
   */
  enable(name: string): void {
    const flag = this.flags.get(name)
    if (!flag) {
      this.logger?.warn(`Cannot enable non-existent feature: ${name}`)
      return
    }

    if (flag.enabled) return

    flag.enabled = true
    flag.updatedAt = new Date()
    this.logger?.info(`Feature enabled: ${name}`)

    // 触发事件
    if (this.config.enableEvents) {
      this.eventBus?.emit('feature.enabled', { name, flag })
    }

    // 持久化
    if (this.config.enablePersistence) {
      this.saveToStorage()
    }
  }

  /**
   * 禁用特性
   */
  disable(name: string): void {
    const flag = this.flags.get(name)
    if (!flag) {
      this.logger?.warn(`Cannot disable non-existent feature: ${name}`)
      return
    }

    if (!flag.enabled) return

    flag.enabled = false
    flag.updatedAt = new Date()
    this.logger?.info(`Feature disabled: ${name}`)

    // 触发事件
    if (this.config.enableEvents) {
      this.eventBus?.emit('feature.disabled', { name, flag })
    }

    // 持久化
    if (this.config.enablePersistence) {
      this.saveToStorage()
    }
  }

  /**
   * 切换特性状态
   */
  toggle(name: string): void {
    const flag = this.flags.get(name)
    if (!flag) {
      this.logger?.warn(`Cannot toggle non-existent feature: ${name}`)
      return
    }

    if (flag.enabled) {
      this.disable(name)
    } else {
      this.enable(name)
    }
  }

  /**
   * 获取特性
   */
  getFlag(name: string): FeatureFlag | undefined {
    return this.flags.get(name)
  }

  /**
   * 获取所有特性
   */
  getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values())
  }

  /**
   * 批量更新特性
   */
  updateFlags(flags: Partial<Record<string, boolean>>): void {
    for (const [name, enabled] of Object.entries(flags)) {
      if (enabled) {
        this.enable(name)
      } else {
        this.disable(name)
      }
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(condition: FeatureCondition, context?: FeatureContext): boolean {
    if (!context) return true

    switch (condition.type) {
      case 'user':
        return this.evaluateUserCondition(condition.params, context)

      case 'environment':
        return this.evaluateEnvironmentCondition(condition.params, context)

      case 'percentage':
        return this.evaluatePercentageCondition(condition.params, context)

      case 'date':
        return this.evaluateDateCondition(condition.params)

      case 'custom':
        return this.evaluateCustomCondition(condition.params, context)

      default:
        this.logger?.warn(`Unknown condition type: ${condition.type}`)
        return true
    }
  }

  /**
   * 评估用户条件
   */
  private evaluateUserCondition(params: any, context: FeatureContext): boolean {
    if (params.userIds && context.userId) {
      return params.userIds.includes(context.userId)
    }

    if (params.userAttributes && context.userAttributes) {
      return Object.entries(params.userAttributes).every(([key, value]) => {
        return context.userAttributes?.[key] === value
      })
    }

    return true
  }

  /**
   * 评估环境条件
   */
  private evaluateEnvironmentCondition(params: any, context: FeatureContext): boolean {
    if (params.environments && context.environment) {
      return params.environments.includes(context.environment)
    }
    return true
  }

  /**
   * 评估百分比条件 (用于灰度发布)
   */
  private evaluatePercentageCondition(params: any, context: FeatureContext): boolean {
    const percentage = params.percentage || 0
    if (percentage >= 100) return true
    if (percentage <= 0) return false

    // 使用用户ID生成一致的随机数
    const userId = context.userId || 'anonymous'
    const hash = this.hashString(userId)
    const userPercentage = (hash % 100) + 1

    return userPercentage <= percentage
  }

  /**
   * 评估日期条件
   */
  private evaluateDateCondition(params: any): boolean {
    const now = new Date()

    if (params.startDate) {
      const startDate = new Date(params.startDate)
      if (now < startDate) return false
    }

    if (params.endDate) {
      const endDate = new Date(params.endDate)
      if (now > endDate) return false
    }

    return true
  }

  /**
   * 评估自定义条件
   */
  private evaluateCustomCondition(params: any, context: FeatureContext): boolean {
    if (typeof params.evaluator === 'function') {
      return params.evaluator(context)
    }
    return true
  }

  /**
   * 字符串哈希函数
   */
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * 从存储加载
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.persistenceKey)
      if (stored) {
        const data = JSON.parse(stored)
        for (const [name, flag] of Object.entries(data)) {
          this.flags.set(name, flag as FeatureFlag)
        }
        this.logger?.info(`Loaded ${this.flags.size} feature flags from storage`)
      }
    } catch (error) {
      this.logger?.error('Failed to load feature flags from storage', error)
    }
  }

  /**
   * 保存到存储
   */
  private saveToStorage(): void {
    try {
      const data: Record<string, FeatureFlag> = {}
      for (const [name, flag] of this.flags.entries()) {
        data[name] = flag
      }
      localStorage.setItem(this.config.persistenceKey, JSON.stringify(data))
    } catch (error) {
      this.logger?.error('Failed to save feature flags to storage', error)
    }
  }
}

/**
 * 特性开关装饰器
 */
export function featureFlag(flagName: string, defaultValue = false) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = function (this: any, ...args: any[]) {
      // 获取特性开关实例 (需要从容器中获取)
      const featureFlags = (this as any).featureFlags as IFeatureFlags

      if (!featureFlags) {
        console.warn(`FeatureFlags not available, using default: ${defaultValue}`)
        if (!defaultValue) return
        return originalMethod.apply(this, args)
      }

      if (featureFlags.isEnabled(flagName)) {
        return originalMethod.apply(this, args)
      }
    }

    return descriptor
  }
}

/**
 * 创建全局特性开关实例
 */
let globalFeatureFlags: FeatureFlags | null = null

export function getGlobalFeatureFlags(): FeatureFlags {
  if (!globalFeatureFlags) {
    globalFeatureFlags = new FeatureFlags()
  }
  return globalFeatureFlags
}

export function setGlobalFeatureFlags(flags: FeatureFlags): void {
  globalFeatureFlags = flags
}
