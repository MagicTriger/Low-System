/**
 * 数据源插件系统模块
 * 提供数据源的插件化扩展能力
 */

// 导出接口
export type {
  IDataSourcePlugin,
  IDataSourcePluginRegistry,
  IDataSourcePluginLoader,
  DataSourcePluginMetadata,
  DataSourcePluginConfig,
  DataSourcePluginHooks,
} from './IDataSourcePlugin'

export { DataSourcePluginError, PluginValidationError, PluginDependencyError } from './IDataSourcePlugin'

// 导出实现
export { DataSourcePluginRegistry } from './DataSourcePluginRegistry'
export { BaseDataSourcePlugin } from './BaseDataSourcePlugin'

// 导出内置插件
export { HttpDataSourcePlugin } from './builtin/HttpDataSourcePlugin'
export type { HttpDataSourceConfig } from './builtin/HttpDataSourcePlugin'

export { StaticDataSourcePlugin } from './builtin/StaticDataSourcePlugin'
export type { StaticDataSourceConfig } from './builtin/StaticDataSourcePlugin'
