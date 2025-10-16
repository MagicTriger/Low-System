/**
 * API模块入口
 *
 * 统一导出所有API相关模块
 */

// 核心API客户端
export * from './IApiClient'
export * from './ApiClient'
export * from './types'

// 适配器
export * from './adapters'

// 缓存
export * from './cache'

// 重试
export { RetryManager } from './retry/RetryManager'

// 去重
export { RequestDeduplicator, globalRequestDeduplicator } from './deduplication/RequestDeduplicator'

// 拦截器
export * from './interceptors'

// 兼容层
export { LegacyApiAdapter } from './compat/LegacyApiAdapter'

// 遗留API(向后兼容)
export { default as request } from './request'
export * from './auth'
export * from './designer'
export * from './common-query'

// 菜单管理API
export * from './menu'

// 便捷导出
import { ApiClient, ApiClientFactory } from './ApiClient'
import { LegacyApiAdapter } from './compat/LegacyApiAdapter'

/**
 * 默认API客户端实例(使用遗留适配器保持兼容性)
 */
export const api = new LegacyApiAdapter()

/**
 * 创建新的API客户端
 */
export const createApiClient = ApiClientFactory.create

/**
 * 创建带基础URL的API客户端
 */
export const createApiClientWithBaseURL = ApiClientFactory.createWithBaseURL
