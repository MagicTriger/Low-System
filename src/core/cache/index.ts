/**
 * 缓存系统导出
 */

export { LRUCache, type CacheOptions, type CacheEntry, type CacheStats } from './LRUCache'

export { MultiLevelCache, type CacheLevel, type MultiLevelCacheOptions, type CacheProvider } from './MultiLevelCache'

export {
  Cacheable,
  ApiCacheInterceptor,
  DataSourceCacheWrapper,
  initializeCache,
  getCacheInstance,
  type CacheKeyGenerator,
  type CacheableOptions,
} from './CacheIntegration'
