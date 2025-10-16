/**
 * 持久化策略接口
 *
 * 定义状态持久化的标准接口,支持多种存储策略
 */

/**
 * 持久化策略接口
 */
export interface IPersistenceStrategy {
  /** 策略名称 */
  readonly name: string

  /**
   * 保存状态
   * @param key 存储键
   * @param state 状态数据
   */
  save(key: string, state: any): Promise<void>

  /**
   * 加载状态
   * @param key 存储键
   * @returns 状态数据,不存在返回null
   */
  load(key: string): Promise<any>

  /**
   * 删除状态
   * @param key 存储键
   */
  remove(key: string): Promise<void>

  /**
   * 清空所有状态
   */
  clear(): Promise<void>

  /**
   * 检查键是否存在
   * @param key 存储键
   */
  has(key: string): Promise<boolean>

  /**
   * 获取所有键
   */
  keys(): Promise<string[]>
}

/**
 * 持久化选项
 */
export interface PersistenceOptions {
  /** 存储键前缀 */
  keyPrefix?: string

  /** 需要持久化的路径 (支持点号路径) */
  paths?: string[]

  /** 需要排除的路径 */
  excludePaths?: string[]

  /** 序列化函数 */
  serializer?: (state: any) => string

  /** 反序列化函数 */
  deserializer?: (data: string) => any

  /** 是否启用加密 */
  encrypt?: boolean

  /** 加密密钥 */
  encryptionKey?: string

  /** 节流延迟 (ms) */
  throttle?: number

  /** 是否在页面卸载时保存 */
  saveOnUnload?: boolean
}

/**
 * 持久化错误
 */
export class PersistenceError extends Error {
  constructor(
    message: string,
    public readonly strategy: string,
    public readonly operation: string,
    public readonly cause?: Error
  ) {
    super(message)
    this.name = 'PersistenceError'
  }
}
