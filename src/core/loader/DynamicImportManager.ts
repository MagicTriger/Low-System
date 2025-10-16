/**
 * 动态导入管理器
 * 提供模块、控件和路由的懒加载功能
 */

export interface LoadOptions {
  /** 加载超时时间(ms) */
  timeout?: number
  /** 重试次数 */
  retries?: number
  /** 预加载 */
  preload?: boolean
  /** 缓存结果 */
  cache?: boolean
}

export interface LoadResult<T = any> {
  module: T
  loadTime: number
  fromCache: boolean
}

export interface ModuleMetadata {
  id: string
  path: string
  loaded: boolean
  loading: boolean
  error?: Error
  loadTime?: number
}

/**
 * 动态导入管理器
 */
export class DynamicImportManager {
  private moduleCache = new Map<string, any>()
  private loadingPromises = new Map<string, Promise<any>>()
  private metadata = new Map<string, ModuleMetadata>()
  private preloadQueue: string[] = []

  /**
   * 动态导入模块
   */
  async import<T = any>(path: string, options: LoadOptions = {}): Promise<LoadResult<T>> {
    const { timeout = 30000, retries = 3, cache = true } = options

    // 检查缓存
    if (cache && this.moduleCache.has(path)) {
      return {
        module: this.moduleCache.get(path),
        loadTime: 0,
        fromCache: true,
      }
    }

    // 检查是否正在加载
    if (this.loadingPromises.has(path)) {
      const module = await this.loadingPromises.get(path)
      return {
        module,
        loadTime: 0,
        fromCache: false,
      }
    }

    // 创建加载Promise
    const loadPromise = this.loadWithRetry<T>(path, retries, timeout)
    this.loadingPromises.set(path, loadPromise)

    try {
      const startTime = performance.now()
      const module = await loadPromise
      const loadTime = performance.now() - startTime

      // 更新元数据
      this.updateMetadata(path, {
        loaded: true,
        loading: false,
        loadTime,
      })

      // 缓存模块
      if (cache) {
        this.moduleCache.set(path, module)
      }

      return {
        module,
        loadTime,
        fromCache: false,
      }
    } catch (error) {
      this.updateMetadata(path, {
        loaded: false,
        loading: false,
        error: error as Error,
      })
      throw error
    } finally {
      this.loadingPromises.delete(path)
    }
  }

  /**
   * 带重试的加载
   */
  private async loadWithRetry<T>(path: string, retries: number, timeout: number): Promise<T> {
    let lastError: Error | undefined

    for (let i = 0; i <= retries; i++) {
      try {
        return await this.loadWithTimeout<T>(path, timeout)
      } catch (error) {
        lastError = error as Error
        if (i < retries) {
          // 指数退避
          await this.delay(Math.pow(2, i) * 1000)
        }
      }
    }

    throw lastError || new Error(`Failed to load module: ${path}`)
  }

  /**
   * 带超时的加载
   */
  private async loadWithTimeout<T>(path: string, timeout: number): Promise<T> {
    return Promise.race([
      import(/* @vite-ignore */ path),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Load timeout: ${path}`)), timeout)),
    ])
  }

  /**
   * 预加载模块
   */
  async preload(paths: string[]): Promise<void> {
    this.preloadQueue.push(...paths)
    await this.processPreloadQueue()
  }

  /**
   * 处理预加载队列
   */
  private async processPreloadQueue(): Promise<void> {
    while (this.preloadQueue.length > 0) {
      const path = this.preloadQueue.shift()!
      try {
        await this.import(path, { cache: true })
      } catch (error) {
        console.warn(`Preload failed for ${path}:`, error)
      }
    }
  }

  /**
   * 清除缓存
   */
  clearCache(path?: string): void {
    if (path) {
      this.moduleCache.delete(path)
      this.metadata.delete(path)
    } else {
      this.moduleCache.clear()
      this.metadata.clear()
    }
  }

  /**
   * 获取模块元数据
   */
  getMetadata(path: string): ModuleMetadata | undefined {
    return this.metadata.get(path)
  }

  /**
   * 获取所有元数据
   */
  getAllMetadata(): ModuleMetadata[] {
    return Array.from(this.metadata.values())
  }

  /**
   * 更新元数据
   */
  private updateMetadata(path: string, updates: Partial<ModuleMetadata>): void {
    const existing = this.metadata.get(path) || {
      id: path,
      path,
      loaded: false,
      loading: false,
    }

    this.metadata.set(path, { ...existing, ...updates })
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * 控件懒加载管理器
 */
export class ControlLazyLoader {
  constructor(private importManager: DynamicImportManager) {}

  /**
   * 懒加载控件
   */
  async loadControl(kind: string): Promise<any> {
    const path = this.getControlPath(kind)
    const result = await this.importManager.import(path)
    return result.module.default || result.module
  }

  /**
   * 批量预加载控件
   */
  async preloadControls(kinds: string[]): Promise<void> {
    const paths = kinds.map(kind => this.getControlPath(kind))
    await this.importManager.preload(paths)
  }

  /**
   * 获取控件路径
   */
  private getControlPath(kind: string): string {
    // 根据控件类型映射到实际路径
    return `/src/components/controls/${kind}.vue`
  }
}

/**
 * 路由懒加载管理器
 */
export class RouteLazyLoader {
  constructor(private importManager: DynamicImportManager) {}

  /**
   * 懒加载路由组件
   */
  async loadRoute(routeName: string): Promise<any> {
    const path = this.getRoutePath(routeName)
    const result = await this.importManager.import(path)
    return result.module.default || result.module
  }

  /**
   * 预加载路由
   */
  async preloadRoutes(routeNames: string[]): Promise<void> {
    const paths = routeNames.map(name => this.getRoutePath(name))
    await this.importManager.preload(paths)
  }

  /**
   * 获取路由路径
   */
  private getRoutePath(routeName: string): string {
    return `/src/views/${routeName}.vue`
  }
}

// 导出单例实例
export const dynamicImportManager = new DynamicImportManager()
export const controlLazyLoader = new ControlLazyLoader(dynamicImportManager)
export const routeLazyLoader = new RouteLazyLoader(dynamicImportManager)
