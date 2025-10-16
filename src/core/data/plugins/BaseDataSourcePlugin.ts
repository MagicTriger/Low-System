/**
 * 数据源插件基类
 * 提供插件的基础实现和通用功能
 */

import type { IDataSourcePlugin, DataSourcePluginMetadata, DataSourcePluginConfig } from './IDataSourcePlugin'
import type { IDataSource, DataSourceConfig } from '../interfaces'

export abstract class BaseDataSourcePlugin implements IDataSourcePlugin {
  protected config?: DataSourcePluginConfig
  protected initialized = false

  constructor(public readonly metadata: DataSourcePluginMetadata) {}

  async initialize(config?: DataSourcePluginConfig): Promise<void> {
    if (this.initialized) {
      console.warn(`[Plugin:${this.metadata.id}] Already initialized`)
      return
    }

    this.config = config

    // 执行子类的初始化逻辑
    await this.onInitialize(config)

    this.initialized = true
    console.log(`[Plugin:${this.metadata.id}] Initialized`)
  }

  abstract createDataSource<T = any>(config: DataSourceConfig): IDataSource<T>

  validateConfig(config: DataSourceConfig): boolean {
    // 基础验证
    if (!config || !config.id || !config.type) {
      return false
    }

    // 检查类型是否匹配
    if (config.type !== this.metadata.dataSourceType) {
      return false
    }

    // 执行子类的验证逻辑
    return this.onValidateConfig(config)
  }

  getConfigSchema?(): Record<string, any> {
    return this.onGetConfigSchema()
  }

  async dispose(): Promise<void> {
    if (!this.initialized) {
      return
    }

    // 执行子类的清理逻辑
    await this.onDispose()

    this.initialized = false
    console.log(`[Plugin:${this.metadata.id}] Disposed`)
  }

  // 子类需要实现的钩子方法

  /**
   * 初始化钩子
   */
  protected async onInitialize(config?: DataSourcePluginConfig): Promise<void> {
    // 子类可以覆盖此方法
  }

  /**
   * 配置验证钩子
   */
  protected onValidateConfig(config: DataSourceConfig): boolean {
    // 子类可以覆盖此方法
    return true
  }

  /**
   * 获取配置模式钩子
   */
  protected onGetConfigSchema(): Record<string, any> {
    // 子类可以覆盖此方法
    return {}
  }

  /**
   * 销毁钩子
   */
  protected async onDispose(): Promise<void> {
    // 子类可以覆盖此方法
  }

  // 工具方法

  protected assertInitialized(): void {
    if (!this.initialized) {
      throw new Error(`Plugin ${this.metadata.id} is not initialized`)
    }
  }

  protected getOption<T = any>(key: string, defaultValue?: T): T | undefined {
    return this.config?.options?.[key] ?? defaultValue
  }

  protected hasOption(key: string): boolean {
    return this.config?.options?.[key] !== undefined
  }
}
