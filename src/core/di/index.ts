/**
 * 依赖注入模块
 * 提供类型安全的依赖注入容器和装饰器
 *
 * @example
 * ```typescript
 * // 注册服务
 * container.register(MyService, {
 *   useClass: MyServiceImpl,
 *   deps: [HttpClient, Logger]
 * }, { lifetime: ServiceLifetime.Singleton })
 *
 * // 解析服务
 * const service = container.resolve(MyService)
 *
 * // 使用装饰器
 * @Injectable({ lifetime: ServiceLifetime.Singleton })
 * class MyService {
 *   constructor(
 *     @Inject(HttpClient) private http: HttpClient,
 *     @Inject(Logger) private logger: Logger
 *   ) {}
 * }
 * ```
 */

// 导出类型
export type {
  Token,
  Constructor,
  Provider,
  ClassProvider,
  FactoryProvider,
  ValueProvider,
  AliasProvider,
  RegisterOptions,
  ServiceDescriptor,
  IContainer,
} from './types'

// 导出枚举和错误类
export { ServiceLifetime, CircularDependencyError, ServiceNotFoundError, ServiceRegistrationError } from './types'

// 导出容器
export { Container, globalContainer } from './Container'

// 导出装饰器
export { Injectable, Inject, getInjections, isInjectable, getInjectableOptions } from './decorators'

// 导出类型
export type { InjectableOptions } from './decorators'
