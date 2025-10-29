/**
 * API模块入口
 *
 * 统一导出所有API相关模块
 */

// ========== 共享类型 ==========
// 优先导出共享类型，避免命名冲突
export * from './shared-types'

// ========== 核心API客户端 ==========
// 从 IApiClient 导出，但排除与 types 冲突的 ApiResponse
export type {
  RequestConfig,
  RetryConfig,
  CacheConfig,
  ApiError,
  RequestInterceptor,
  ResponseInterceptor,
  ErrorInterceptor,
  InterceptorConfig,
  CancelToken,
  IApiClient,
  IApiClientFactory,
} from './IApiClient'

export * from './ApiClient'

// ========== 统一 API 类型 ==========
// 从 types 导出统一的 API 类型（优先使用这些类型）
export type {
  // 统一响应类型
  ApiResponse,
  ApiListResponse,
  // 统一请求参数类型
  ApiPaginationParams,
  ApiQueryParams,
  ApiListParams,
  // CRUD 参数类型
  ApiCreateParams,
  ApiUpdateParams,
  ApiDeleteParams,
  ApiBatchParams,
  // 业务类型
  ResourceDTO,
  DesignDTO,
  // 向后兼容的类型别名
  ListResponse,
  PaginationParams,
  QueryParams,
  // 其他类型
  ProgressEvent,
  DedupeConfig,
  CircuitBreakerConfig,
  CircuitBreakerState,
  RequestPriority,
  RequestState,
  RequestMetadata,
  BatchRequestConfig,
  BatchRequestResult,
} from './types'

// ========== 适配器 ==========
export * from './adapters'

// ========== 缓存 ==========
export * from './cache'

// ========== 重试 ==========
export { RetryManager } from './retry/RetryManager'

// ========== 去重 ==========
export { RequestDeduplicator, globalRequestDeduplicator } from './deduplication/RequestDeduplicator'

// ========== 拦截器 ==========
export * from './interceptors'

// ========== 兼容层 ==========
export { LegacyApiAdapter } from './compat/LegacyApiAdapter'

// ========== 遗留API(向后兼容) ==========
export { default as request } from './request'
export * from './designer'

// 从 common-query 导出，但排除与 types 冲突的 QueryParams
export { commonQueryApi } from './common-query'
// 为 common-query 的 QueryParams 提供别名
export type { QueryParams as CommonQueryParams } from './common-query'

// ========== 认证API ==========
// 从 auth 模块导出，但排除与 shared-types 冲突的类型
export type { UserInfo, PermissionInfo, LoginStatusInfo, LoginResponseData, LoginRequest } from './auth'
export { AuthApiService, createAuthApiService, authApiService } from './auth'

// ========== 菜单管理API ==========
// 从 menu 模块导出，使用 MenuTreeNode 作为主要类型
export type {
  MenuResource,
  MenuTreeNode,
  MenuMountResponse,
  MenuQueryParams,
  MenuPageResult,
  MenuCreateRequest,
  MenuUpdateRequest,
} from './menu'
export { MenuType, MenuApiService, createMenuApiService, menuApiService } from './menu'

// ========== 事件配置API ==========
// 从新的 event-config 模块导出
export * from './event-config'

// ========== 浮层管理API ==========
export * from './overlay'

// ========== 向后兼容的类型别名 ==========
/**
 * @deprecated 使用 MenuTreeNode 替代
 * 为了向后兼容，从 auth 模块导出的 MenuTreeNode 使用别名
 */
export type { MenuTreeNode as AuthMenuTreeNode } from './shared-types'

/**
 * @deprecated 使用 eventConfigApi 替代
 * 为了向后兼容，保留 eventApi 别名
 */
export { eventConfigApi as eventApi } from './event-config'

// ========== 便捷导出 ==========
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
