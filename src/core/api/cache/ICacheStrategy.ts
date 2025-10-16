/**
 * 缓存策略接口
 *
 * 定义缓存的基本操作接口
 * 符合需求 8.3 - 请求缓存机制
 */

/**
 * 缓存项
 */
export interface CacheEntry<T = any> {
  /** 缓存键 */
  key: string
  /** 缓存值 */
  value: T
  /** 创建时间 */
  createdAt: number
  /** 过期时间 */
  expiresAt: number
  /** 元数据 */
  metadata?: Record<string, any>
}

/**
 * 缓存策略接口
 */
export interface ICacheStrategy {
  /** 策略名称 */
  readonly name: string

  /**
   * 获取缓存
   */
  get<T = any>(key: string): Promise<T | null>

  /**
   * 设置缓存
   */
  set<T = any>(key: string, value: T, ttl?: number): Promise<void>

  /**
   * 删除缓存
   */
  delete(key: string): Promise<void>

  /**
   * 清空所有缓存
   */
  clear(): Promise<void>

  /**
   * 检查缓存是否存在
   */
  has(key: string): Promise<boolean>

  /**
   * 获取所有缓存键
   */
  keys(): Promise<string[]>

  /**
   * 获取缓存大小
   */
  size(): Promise<number>
}

/**
 * 缓存管理器接口
 */
export interface ICacheManager {
  /**
   * 注册缓存策略
   */
  registerStrategy(strategy: ICacheStrategy): void

  /**
   * 获取缓存策略
   */
  getStrategy(name: string): ICacheStrategy | undefined

  /**
   * 设置默认策略
   */
  setDefaultStrategy(name: string): void

  /**
   * 获取默认策略
   */
  getDefaultStrategy(): ICacheStrategy

  /**
   * 使用指定策略获取缓存
   */
  get<T = any>(key: string, strategyName?: string): Promise<T | null>

  /**
   * 使用指定策略设置缓存
   */
  set<T = any>(key: string, value: T, ttl?: number, strategyName?: string): Promise<void>

  /**
   * 删除缓存
   */
  delete(key: string, strategyName?: string): Promise<void>

  /**
   * 清空所有缓存
   */
  clearAll(): Promise<void>
}
