/**
 * 缓存集成工具
 * 为数据源和API层提供缓存支持
 */

import { MultiLevelCache, type MultiLevelCacheOptions } from './MultiLevelCache'

export interface CacheKeyGenerator {
  (params: any): string
}

export interface CacheableOptions {
  /** 缓存键生成器 */
  keyGenerator?: CacheKeyGenerator
  /** TTL(毫秒) */
  ttl?: number
  /** 是否启用缓存 */
  enabled?: boolean
  /** 缓存条件 */
  condition?: (params: any, result: any) => boolean
}

/**
 * 数据源缓存装饰器
 */
export function Cacheable(options: CacheableOptions = {}) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value

    descriptor.value = async function (...args: any[]) {
      const cache = getCacheInstance()

      if (!options.enabled && options.enabled !== undefined) {
        return originalMethod.apply(this, args)
      }

      // 生成缓存键
      const cacheKey = options.keyGenerator ? options.keyGenerator(args[0]) : generateDefaultKey(propertyKey, args[0])

      // 尝试从缓存获取
      const cached = await cache.get(cacheKey)
      if (cached !== undefined) {
        return cached
      }

      // 执行原方法
      const result = await originalMethod.apply(this, args)

      // 检查缓存条件
      if (options.condition && !options.condition(args[0], result)) {
        return result
      }

      // 写入缓存
      await cache.set(cacheKey, result, options.ttl)

      return result
    }

    return descriptor
  }
}

/**
 * API缓存拦截器
 */
export class ApiCacheInterceptor {
  constructor(
    private cache: MultiLevelCache,
    private options: CacheableOptions = {}
  ) {}

  /**
   * 请求拦截器
   */
  async onRequest(config: any): Promise<any> {
    if (!this.shouldCache(config)) {
      return config
    }

    const cacheKey = this.generateCacheKey(config)
    const cached = await this.cache.get(cacheKey)

    if (cached !== undefined) {
      // 返回缓存的响应
      return Promise.reject({
        __cached: true,
        data: cached,
      })
    }

    // 标记需要缓存
    config.__cacheKey = cacheKey
    return config
  }

  /**
   * 响应拦截器
   */
  async onResponse(response: any): Promise<any> {
    const cacheKey = response.config?.__cacheKey

    if (cacheKey && this.shouldCacheResponse(response)) {
      await this.cache.set(cacheKey, response.data, this.options.ttl)
    }

    return response
  }

  /**
   * 错误拦截器
   */
  async onError(error: any): Promise<any> {
    // 如果是缓存命中,返回缓存数据
    if (error.__cached) {
      return {
        data: error.data,
        status: 200,
        statusText: 'OK (Cached)',
        headers: {},
        config: {},
        fromCache: true,
      }
    }

    throw error
  }

  /**
   * 判断是否应该缓存请求
   */
  private shouldCache(config: any): boolean {
    // 只缓存GET请求
    if (config.method && config.method.toUpperCase() !== 'GET') {
      return false
    }

    // 检查配置
    if (config.cache === false) {
      return false
    }

    return true
  }

  /**
   * 判断是否应该缓存响应
   */
  private shouldCacheResponse(response: any): boolean {
    // 只缓存成功响应
    if (response.status < 200 || response.status >= 300) {
      return false
    }

    // 应用自定义条件
    if (this.options.condition) {
      return this.options.condition(response.config, response.data)
    }

    return true
  }

  /**
   * 生成缓存键
   */
  private generateCacheKey(config: any): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(config)
    }

    const url = config.url || ''
    const params = config.params ? JSON.stringify(config.params) : ''
    return `api:${url}:${params}`
  }
}

/**
 * 数据源缓存包装器
 */
export class DataSourceCacheWrapper {
  constructor(
    private cache: MultiLevelCache,
    private options: CacheableOptions = {}
  ) {}

  /**
   * 包装数据源加载方法
   */
  wrapLoad<T>(loadFn: (params?: any) => Promise<T>, keyPrefix: string): (params?: any) => Promise<T> {
    return async (params?: any) => {
      const cacheKey = this.generateKey(keyPrefix, params)

      // 尝试从缓存获取
      const cached = await this.cache.get<T>(cacheKey)
      if (cached !== undefined) {
        return cached
      }

      // 执行加载
      const result = await loadFn(params)

      // 写入缓存
      if (!this.options.condition || this.options.condition(params, result)) {
        await this.cache.set(cacheKey, result, this.options.ttl)
      }

      return result
    }
  }

  /**
   * 使缓存失效
   */
  async invalidate(keyPrefix: string, params?: any): Promise<void> {
    const cacheKey = this.generateKey(keyPrefix, params)
    await this.cache.delete(cacheKey)
  }

  /**
   * 生成缓存键
   */
  private generateKey(prefix: string, params?: any): string {
    if (this.options.keyGenerator) {
      return this.options.keyGenerator(params)
    }

    return generateDefaultKey(prefix, params)
  }
}

/**
 * 默认缓存键生成器
 */
function generateDefaultKey(prefix: string, params?: any): string {
  if (!params) {
    return `${prefix}:default`
  }

  const paramsStr = typeof params === 'object' ? JSON.stringify(params) : String(params)

  return `${prefix}:${hashCode(paramsStr)}`
}

/**
 * 简单哈希函数
 */
function hashCode(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return hash.toString(36)
}

// 全局缓存实例
let globalCache: MultiLevelCache | null = null

/**
 * 初始化全局缓存
 */
export function initializeCache(options?: MultiLevelCacheOptions): MultiLevelCache {
  globalCache = new MultiLevelCache(options)
  return globalCache
}

/**
 * 获取全局缓存实例
 */
export function getCacheInstance(): MultiLevelCache {
  if (!globalCache) {
    globalCache = new MultiLevelCache()
  }
  return globalCache
}
