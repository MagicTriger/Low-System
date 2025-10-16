/**
 * 缓存模块导出
 */

export * from './ICacheStrategy'
export * from './MemoryCacheStrategy'
export * from './LocalStorageCacheStrategy'
export * from './CacheManager'

// 便捷导出
export { MemoryCacheStrategy } from './MemoryCacheStrategy'
export { LocalStorageCacheStrategy } from './LocalStorageCacheStrategy'
export { CacheManager, globalCacheManager } from './CacheManager'
