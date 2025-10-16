/**
 * 依赖注入装饰器
 * 提供声明式的服务注册和依赖注入
 */

import type { Token, Constructor } from './types'
import { ServiceLifetime } from './types'
import { globalContainer } from './Container'

// 元数据键
const INJECTABLE_METADATA_KEY = Symbol('injectable')
const INJECT_METADATA_KEY = Symbol('inject')

// Injectable装饰器选项
export interface InjectableOptions {
  lifetime?: ServiceLifetime
  token?: Token
  tags?: string[]
}

/**
 * Injectable装饰器
 * 标记类为可注入服务
 */
export function Injectable(options: InjectableOptions = {}) {
  return function <T extends Constructor>(target: T): T {
    // 保存元数据
    Reflect.defineMetadata(INJECTABLE_METADATA_KEY, options, target)

    // 自动注册到全局容器
    const token = options.token || target
    globalContainer.register(
      token,
      { useClass: target },
      {
        lifetime: options.lifetime || ServiceLifetime.Singleton,
        tags: options.tags,
      }
    )

    return target
  }
}

/**
 * Inject装饰器
 * 标记构造函数参数的依赖注入
 */
export function Inject(token: Token) {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    const existingInjections = Reflect.getMetadata(INJECT_METADATA_KEY, target) || []
    existingInjections[parameterIndex] = token
    Reflect.defineMetadata(INJECT_METADATA_KEY, existingInjections, target)
  }
}

/**
 * 获取类的注入依赖
 */
export function getInjections(target: Constructor): Token[] {
  return Reflect.getMetadata(INJECT_METADATA_KEY, target) || []
}

/**
 * 检查类是否可注入
 */
export function isInjectable(target: Constructor): boolean {
  return Reflect.hasMetadata(INJECTABLE_METADATA_KEY, target)
}

/**
 * 获取Injectable选项
 */
export function getInjectableOptions(target: Constructor): InjectableOptions | undefined {
  return Reflect.getMetadata(INJECTABLE_METADATA_KEY, target)
}
