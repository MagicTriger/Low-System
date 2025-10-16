/**
 * 配置管理系统
 * 提供多环境、多源、热更新的配置管理
 */

// 导出类型
export type {
  ConfigValue,
  ConfigObject,
  ConfigArray,
  Environment,
  IConfigSource,
  ConfigChangeEvent,
  ConfigChangeListener,
  IConfigValidator,
  ValidationResult,
  ValidationError,
  ConfigSchema,
  ConfigFieldSchema,
  IConfigManager,
  ConfigManagerOptions,
} from './types'

// 导出错误类
export { ConfigError, ConfigValidationError } from './types'

// 导出配置管理器
export { ConfigManager, globalConfig } from './ConfigManager'

// 导出配置源
export {
  ObjectConfigSource,
  EnvironmentConfigSource,
  JsonFileConfigSource,
  LocalStorageConfigSource,
  RemoteConfigSource,
  MergedConfigSource,
} from './sources'
