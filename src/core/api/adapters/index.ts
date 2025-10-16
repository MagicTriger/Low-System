/**
 * API适配器模块导出
 */

export * from './IApiAdapter'
export * from './HttpAdapter'
export * from './GraphQLAdapter'
export * from './WebSocketAdapter'
export * from './AdapterRegistry'

// 便捷导出
export { HttpAdapter } from './HttpAdapter'
export { GraphQLAdapter, GraphQLQueryBuilder } from './GraphQLAdapter'
export { WebSocketAdapter } from './WebSocketAdapter'
export { AdapterRegistry, globalAdapterRegistry } from './AdapterRegistry'
