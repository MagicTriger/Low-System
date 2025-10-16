/**
 * 依赖注入容器类型定义
 * 提供类型安全的服务注册和解析机制
 */

// 服务标识符类型
export type Token<T = any> = string | symbol | Constructor<T>

// 构造函数类型
export type Constructor<T = any> = new (...args: any[]) => T

// 服务生命周期
export enum ServiceLifetime {
  /** 单例模式 - 整个应用生命周期内只创建一次 */
  Singleton = 'singleton',
  /** 瞬态模式 - 每次解析都创建新实例 */
  Transient = 'transient',
  /** 作用域模式 - 在同一作用域内共享实例 */
  Scoped = 'scoped',
}

// 服务提供者类型
export type Provider<T> = ClassProvider<T> | FactoryProvider<T> | ValueProvider<T> | AliasProvider<T>

// 类提供者
export interface ClassProvider<T> {
  useClass: Constructor<T>
  deps?: Token[]
}

// 工厂提供者
export interface FactoryProvider<T> {
  useFactory: (...args: any[]) => T
  deps?: Token[]
}

// 值提供者
export interface ValueProvider<T> {
  useValue: T
}

// 别名提供者
export interface AliasProvider<T> {
  useAlias: Token<T>
}

// 注册选项
export interface RegisterOptions {
  /** 服务生命周期 */
  lifetime?: ServiceLifetime
  /** 服务标签,用于批量操作 */
  tags?: string[]
  /** 是否覆盖已存在的服务 */
  override?: boolean
}

// 服务描述符
export interface ServiceDescriptor<T = any> {
  token: Token<T>
  provider: Provider<T>
  lifetime: ServiceLifetime
  tags: string[]
}

// 依赖注入容器接口
export interface IContainer {
  /**
   * 注册服务
   * @param token 服务标识符
   * @param provider 服务提供者
   * @param options 注册选项
   */
  register<T>(token: Token<T>, provider: Provider<T>, options?: RegisterOptions): void

  /**
   * 解析服务
   * @param token 服务标识符
   * @returns 服务实例
   */
  resolve<T>(token: Token<T>): T

  /**
   * 尝试解析服务
   * @param token 服务标识符
   * @returns 服务实例或undefined
   */
  tryResolve<T>(token: Token<T>): T | undefined

  /**
   * 检查服务是否已注册
   * @param token 服务标识符
   */
  has(token: Token): boolean

  /**
   * 创建子容器
   * @returns 新的容器实例
   */
  createChild(): IContainer

  /**
   * 获取所有服务描述符
   */
  getDescriptors(): ServiceDescriptor[]

  /**
   * 根据标签获取服务
   * @param tag 标签名称
   */
  getByTag<T>(tag: string): T[]

  /**
   * 清空容器
   */
  clear(): void

  /**
   * 销毁容器
   */
  dispose(): void
}

// 循环依赖错误
export class CircularDependencyError extends Error {
  constructor(token: Token) {
    super(`Circular dependency detected for token: ${String(token)}`)
    this.name = 'CircularDependencyError'
  }
}

// 服务未找到错误
export class ServiceNotFoundError extends Error {
  constructor(token: Token) {
    super(`Service not found for token: ${String(token)}`)
    this.name = 'ServiceNotFoundError'
  }
}

// 服务注册错误
export class ServiceRegistrationError extends Error {
  constructor(token: Token, message: string) {
    super(`Failed to register service for token ${String(token)}: ${message}`)
    this.name = 'ServiceRegistrationError'
  }
}
