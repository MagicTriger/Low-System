/**
 * 依赖注入容器实现
 * 支持单例、瞬态和作用域三种生命周期
 * 支持循环依赖检测
 */

import type {
  IContainer,
  Token,
  Provider,
  RegisterOptions,
  ServiceDescriptor,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
  AliasProvider,
} from './types'
import { ServiceLifetime, CircularDependencyError, ServiceNotFoundError, ServiceRegistrationError } from './types'

export class Container implements IContainer {
  // 服务描述符映射
  private services = new Map<Token, ServiceDescriptor>()

  // 单例实例缓存
  private singletons = new Map<Token, any>()

  // 作用域实例缓存
  private scoped = new Map<Token, any>()

  // 正在解析的服务(用于循环依赖检测)
  private resolving = new Set<Token>()

  // 父容器
  private parent?: IContainer

  constructor(parent?: IContainer) {
    this.parent = parent
  }

  register<T>(token: Token<T>, provider: Provider<T>, options: RegisterOptions = {}): void {
    // 检查是否已注册
    if (this.services.has(token) && !options.override) {
      throw new ServiceRegistrationError(token, 'Service already registered. Use override option to replace.')
    }

    // 验证提供者
    this.validateProvider(token, provider)

    // 创建服务描述符
    const descriptor: ServiceDescriptor<T> = {
      token,
      provider,
      lifetime: options.lifetime || ServiceLifetime.Singleton,
      tags: options.tags || [],
    }

    this.services.set(token, descriptor)
  }

  resolve<T>(token: Token<T>): T {
    const instance = this.tryResolve(token)
    if (instance === undefined) {
      throw new ServiceNotFoundError(token)
    }
    return instance
  }

  tryResolve<T>(token: Token<T>): T | undefined {
    // 检查循环依赖
    if (this.resolving.has(token)) {
      throw new CircularDependencyError(token)
    }

    // 获取服务描述符
    const descriptor = this.services.get(token)

    // 如果当前容器没有,尝试从父容器解析
    if (!descriptor) {
      return this.parent?.tryResolve(token)
    }

    // 根据生命周期返回实例
    switch (descriptor.lifetime) {
      case ServiceLifetime.Singleton:
        return this.resolveSingleton(token, descriptor)

      case ServiceLifetime.Scoped:
        return this.resolveScoped(token, descriptor)

      case ServiceLifetime.Transient:
        return this.resolveTransient(descriptor)

      default:
        throw new Error(`Unknown service lifetime: ${descriptor.lifetime}`)
    }
  }

  has(token: Token): boolean {
    return this.services.has(token) || (this.parent?.has(token) ?? false)
  }

  createChild(): IContainer {
    return new Container(this)
  }

  getDescriptors(): ServiceDescriptor[] {
    return Array.from(this.services.values())
  }

  getByTag<T>(tag: string): T[] {
    const instances: T[] = []

    for (const descriptor of this.services.values()) {
      if (descriptor.tags.includes(tag)) {
        const instance = this.resolve(descriptor.token)
        instances.push(instance)
      }
    }

    return instances
  }

  clear(): void {
    this.services.clear()
    this.singletons.clear()
    this.scoped.clear()
    this.resolving.clear()
  }

  dispose(): void {
    // 销毁所有单例实例
    for (const instance of this.singletons.values()) {
      this.disposeInstance(instance)
    }

    // 销毁所有作用域实例
    for (const instance of this.scoped.values()) {
      this.disposeInstance(instance)
    }

    this.clear()
  }

  // 解析单例
  private resolveSingleton<T>(token: Token<T>, descriptor: ServiceDescriptor<T>): T {
    if (this.singletons.has(token)) {
      return this.singletons.get(token)
    }

    const instance = this.createInstance(descriptor)
    this.singletons.set(token, instance)
    return instance
  }

  // 解析作用域实例
  private resolveScoped<T>(token: Token<T>, descriptor: ServiceDescriptor<T>): T {
    if (this.scoped.has(token)) {
      return this.scoped.get(token)
    }

    const instance = this.createInstance(descriptor)
    this.scoped.set(token, instance)
    return instance
  }

  // 解析瞬态实例
  private resolveTransient<T>(descriptor: ServiceDescriptor<T>): T {
    return this.createInstance(descriptor)
  }

  // 创建实例
  private createInstance<T>(descriptor: ServiceDescriptor<T>): T {
    const { token, provider } = descriptor

    // 标记正在解析
    this.resolving.add(token)

    try {
      if (this.isClassProvider(provider)) {
        return this.createFromClass(provider)
      }

      if (this.isFactoryProvider(provider)) {
        return this.createFromFactory(provider)
      }

      if (this.isValueProvider(provider)) {
        return provider.useValue
      }

      if (this.isAliasProvider(provider)) {
        return this.resolve(provider.useAlias)
      }

      throw new Error(`Unknown provider type for token: ${String(token)}`)
    } finally {
      // 解析完成,移除标记
      this.resolving.delete(token)
    }
  }

  // 从类创建实例
  private createFromClass<T>(provider: ClassProvider<T>): T {
    const { useClass, deps = [] } = provider

    // 解析依赖
    const resolvedDeps = deps.map(dep => this.resolve(dep))

    // 创建实例
    return new useClass(...resolvedDeps)
  }

  // 从工厂创建实例
  private createFromFactory<T>(provider: FactoryProvider<T>): T {
    const { useFactory, deps = [] } = provider

    // 解析依赖
    const resolvedDeps = deps.map(dep => this.resolve(dep))

    // 调用工厂函数
    return useFactory(...resolvedDeps)
  }

  // 验证提供者
  private validateProvider<T>(token: Token<T>, provider: Provider<T>): void {
    if (!provider) {
      throw new ServiceRegistrationError(token, 'Provider cannot be null or undefined')
    }

    const providerKeys = Object.keys(provider)
    const validKeys = ['useClass', 'useFactory', 'useValue', 'useAlias', 'deps']
    const hasValidKey = providerKeys.some(key => validKeys.includes(key))

    if (!hasValidKey) {
      throw new ServiceRegistrationError(token, 'Provider must have one of: useClass, useFactory, useValue, or useAlias')
    }
  }

  // 类型守卫
  private isClassProvider<T>(provider: Provider<T>): provider is ClassProvider<T> {
    return 'useClass' in provider
  }

  private isFactoryProvider<T>(provider: Provider<T>): provider is FactoryProvider<T> {
    return 'useFactory' in provider
  }

  private isValueProvider<T>(provider: Provider<T>): provider is ValueProvider<T> {
    return 'useValue' in provider
  }

  private isAliasProvider<T>(provider: Provider<T>): provider is AliasProvider<T> {
    return 'useAlias' in provider
  }

  // 销毁实例
  private disposeInstance(instance: any): void {
    if (instance && typeof instance.dispose === 'function') {
      try {
        instance.dispose()
      } catch (error) {
        console.error('Error disposing instance:', error)
      }
    }
  }
}

// 导出全局容器实例
export const globalContainer = new Container()
