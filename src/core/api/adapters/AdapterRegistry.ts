/**
 * 适配器注册表
 *
 * 管理所有API适配器的注册和查找
 * 符合需求 8.2 - 通过适配器模式扩展新协议
 */

import type { IApiAdapter, IAdapterRegistry } from './IApiAdapter'

/**
 * 适配器注册表实现
 */
export class AdapterRegistry implements IAdapterRegistry {
  private adapters = new Map<string, IApiAdapter>()

  /**
   * 注册适配器
   */
  register(adapter: IApiAdapter): void {
    if (this.adapters.has(adapter.name)) {
      console.warn(`Adapter "${adapter.name}" is already registered. Overwriting...`)
    }

    this.adapters.set(adapter.name, adapter)

    // 初始化适配器
    if (adapter.initialize) {
      adapter.initialize().catch(error => {
        console.error(`Failed to initialize adapter "${adapter.name}":`, error)
      })
    }
  }

  /**
   * 注销适配器
   */
  unregister(name: string): void {
    const adapter = this.adapters.get(name)

    if (adapter) {
      // 销毁适配器
      if (adapter.dispose) {
        adapter.dispose().catch(error => {
          console.error(`Failed to dispose adapter "${name}":`, error)
        })
      }

      this.adapters.delete(name)
    }
  }

  /**
   * 获取适配器
   */
  get(protocol: string): IApiAdapter | undefined {
    // 首先尝试直接匹配适配器名称
    if (this.adapters.has(protocol)) {
      return this.adapters.get(protocol)
    }

    // 然后查找支持该协议的适配器
    for (const adapter of this.adapters.values()) {
      if (adapter.supports(protocol)) {
        return adapter
      }
    }

    return undefined
  }

  /**
   * 获取所有适配器
   */
  getAll(): IApiAdapter[] {
    return Array.from(this.adapters.values())
  }

  /**
   * 检查是否支持协议
   */
  supports(protocol: string): boolean {
    return this.get(protocol) !== undefined
  }

  /**
   * 清空所有适配器
   */
  clear(): void {
    // 销毁所有适配器
    this.adapters.forEach(adapter => {
      if (adapter.dispose) {
        adapter.dispose().catch(error => {
          console.error(`Failed to dispose adapter "${adapter.name}":`, error)
        })
      }
    })

    this.adapters.clear()
  }

  /**
   * 获取适配器数量
   */
  get size(): number {
    return this.adapters.size
  }
}

/**
 * 全局适配器注册表实例
 */
export const globalAdapterRegistry = new AdapterRegistry()
