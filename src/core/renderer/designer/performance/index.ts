// 性能优化模块索引文件
export { default as VirtualScroll } from './VirtualScroll.vue'
export { default as LazyLoader } from './LazyLoader.vue'
export { default as PerformanceMonitor } from './PerformanceMonitor.vue'

export {
  CacheManager,
  createCacheManager,
  validateCacheConfig,
  globalCacheManager,
  useCacheManager,
  type CacheEntry,
  type CacheConfig,
  type CacheStats,
  type CacheLayer,
  defaultCacheConfig,
  defaultCacheLayers
} from './CacheManager'

// 性能配置接口
export interface PerformanceConfig {
  virtualScroll: {
    enabled: boolean
    itemHeight: number
    overscan: number
    threshold: number
  }
  lazyLoading: {
    enabled: boolean
    rootMargin: string
    threshold: number
    delay: number
  }
  caching: {
    enabled: boolean
    maxSize: number
    maxMemory: number
    defaultTTL: number
  }
  monitoring: {
    enabled: boolean
    updateInterval: number
    maxHistorySize: number
    autoStart: boolean
  }
}

// 性能指标接口
export interface PerformanceMetrics {
  fps: number
  memory: {
    used: number
    total: number
    available: number
  }
  network: {
    requests: number
    latency: number
    bandwidth: number
  }
  cache: {
    hitRate: number
    size: number
    entries: number
  }
  errors: {
    count: number
    rate: number
  }
}

// 性能优化建议接口
export interface PerformanceOptimization {
  id: string
  type: 'memory' | 'render' | 'network' | 'cache'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  impact: string
  action?: () => void
}

// 默认性能配置
export const defaultPerformanceConfig: PerformanceConfig = {
  virtualScroll: {
    enabled: true,
    itemHeight: 50,
    overscan: 5,
    threshold: 100
  },
  lazyLoading: {
    enabled: true,
    rootMargin: '50px',
    threshold: 0.1,
    delay: 100
  },
  caching: {
    enabled: true,
    maxSize: 1000,
    maxMemory: 50 * 1024 * 1024, // 50MB
    defaultTTL: 300000 // 5分钟
  },
  monitoring: {
    enabled: true,
    updateInterval: 1000,
    maxHistorySize: 100,
    autoStart: true
  }
}

// 性能管理器类
export class PerformanceManager {
  private config: PerformanceConfig
  private metrics: PerformanceMetrics
  private optimizations: PerformanceOptimization[]
  private observers: Map<string, PerformanceObserver>
  private timers: Map<string, number>
  private cache: CacheManager

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultPerformanceConfig, ...config }
    this.metrics = this.initializeMetrics()
    this.optimizations = []
    this.observers = new Map()
    this.timers = new Map()
    this.cache = createCacheManager(this.config.caching)

    this.initialize()
  }

  // 初始化性能管理器
  private initialize(): void {
    if (this.config.monitoring.enabled) {
      this.startMonitoring()
    }

    // 注册性能观察器
    this.registerPerformanceObservers()

    // 启动优化检查
    this.startOptimizationCheck()
  }

  // 初始化指标
  private initializeMetrics(): PerformanceMetrics {
    return {
      fps: 60,
      memory: {
        used: 0,
        total: 0,
        available: 0
      },
      network: {
        requests: 0,
        latency: 0,
        bandwidth: 0
      },
      cache: {
        hitRate: 0,
        size: 0,
        entries: 0
      },
      errors: {
        count: 0,
        rate: 0
      }
    }
  }

  // 开始监控
  startMonitoring(): void {
    const timer = window.setInterval(() => {
      this.updateMetrics()
      this.checkOptimizations()
    }, this.config.monitoring.updateInterval)

    this.timers.set('monitoring', timer)
  }

  // 停止监控
  stopMonitoring(): void {
    const timer = this.timers.get('monitoring')
    if (timer) {
      clearInterval(timer)
      this.timers.delete('monitoring')
    }

    // 断开性能观察器
    this.observers.forEach(observer => observer.disconnect())
    this.observers.clear()
  }

  // 注册性能观察器
  private registerPerformanceObservers(): void {
    if (!window.PerformanceObserver) return

    // 导航性能观察器
    const navigationObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      this.processNavigationEntries(entries)
    })

    try {
      navigationObserver.observe({ entryTypes: ['navigation'] })
      this.observers.set('navigation', navigationObserver)
    } catch (error) {
      console.warn('Failed to register navigation observer:', error)
    }

    // 资源性能观察器
    const resourceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      this.processResourceEntries(entries)
    })

    try {
      resourceObserver.observe({ entryTypes: ['resource'] })
      this.observers.set('resource', resourceObserver)
    } catch (error) {
      console.warn('Failed to register resource observer:', error)
    }

    // 绘制性能观察器
    const paintObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      this.processPaintEntries(entries)
    })

    try {
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.set('paint', paintObserver)
    } catch (error) {
      console.warn('Failed to register paint observer:', error)
    }

    // 长任务观察器
    const longTaskObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      this.processLongTaskEntries(entries)
    })

    try {
      longTaskObserver.observe({ entryTypes: ['longtask'] })
      this.observers.set('longtask', longTaskObserver)
    } catch (error) {
      console.warn('Failed to register longtask observer:', error)
    }
  }

  // 处理导航性能条目
  private processNavigationEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      const navigationEntry = entry as PerformanceNavigationTiming
      
      // 更新网络指标
      this.metrics.network.latency = navigationEntry.responseEnd - navigationEntry.requestStart
      
      // 检查性能问题
      if (navigationEntry.loadEventEnd - navigationEntry.navigationStart > 3000) {
        this.addOptimization({
          id: 'slow-page-load',
          type: 'network',
          priority: 'high',
          title: '页面加载缓慢',
          description: '页面加载时间超过3秒，建议优化资源加载',
          impact: '减少加载时间50%'
        })
      }
    })
  }

  // 处理资源性能条目
  private processResourceEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      const resourceEntry = entry as PerformanceResourceTiming
      
      // 更新网络指标
      this.metrics.network.requests++
      
      // 检查大资源
      if (resourceEntry.transferSize > 1024 * 1024) { // 1MB
        this.addOptimization({
          id: `large-resource-${Date.now()}`,
          type: 'network',
          priority: 'medium',
          title: '大资源文件',
          description: `资源 ${resourceEntry.name} 大小超过1MB，建议压缩或分割`,
          impact: '减少传输时间30%'
        })
      }

      // 检查慢资源
      if (resourceEntry.duration > 2000) {
        this.addOptimization({
          id: `slow-resource-${Date.now()}`,
          type: 'network',
          priority: 'medium',
          title: '资源加载缓慢',
          description: `资源 ${resourceEntry.name} 加载时间超过2秒`,
          impact: '提升加载速度40%'
        })
      }
    })
  }

  // 处理绘制性能条目
  private processPaintEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.name === 'first-contentful-paint' && entry.startTime > 2000) {
        this.addOptimization({
          id: 'slow-fcp',
          type: 'render',
          priority: 'high',
          title: '首次内容绘制缓慢',
          description: 'FCP 时间超过2秒，建议优化关键渲染路径',
          impact: '提升用户体验50%'
        })
      }

      if (entry.name === 'largest-contentful-paint' && entry.startTime > 2500) {
        this.addOptimization({
          id: 'slow-lcp',
          type: 'render',
          priority: 'high',
          title: '最大内容绘制缓慢',
          description: 'LCP 时间超过2.5秒，建议优化主要内容加载',
          impact: '提升页面性能60%'
        })
      }
    })
  }

  // 处理长任务条目
  private processLongTaskEntries(entries: PerformanceEntry[]): void {
    entries.forEach(entry => {
      if (entry.duration > 50) {
        this.addOptimization({
          id: `long-task-${Date.now()}`,
          type: 'render',
          priority: 'medium',
          title: '长任务阻塞',
          description: `检测到 ${entry.duration.toFixed(0)}ms 的长任务，可能影响用户交互`,
          impact: '提升响应性30%'
        })
      }
    })
  }

  // 更新指标
  private updateMetrics(): void {
    // 更新内存指标
    if (performance.memory) {
      this.metrics.memory.used = performance.memory.usedJSHeapSize
      this.metrics.memory.total = performance.memory.totalJSHeapSize
      this.metrics.memory.available = performance.memory.jsHeapSizeLimit - performance.memory.usedJSHeapSize
    }

    // 更新 FPS
    this.updateFPS()

    // 更新缓存指标
    const cacheStats = this.cache.getStats()
    this.metrics.cache.hitRate = cacheStats.hitRate
    this.metrics.cache.size = cacheStats.totalMemory
    this.metrics.cache.entries = cacheStats.totalSize
  }

  // 更新 FPS
  private updateFPS(): void {
    const now = performance.now()
    const lastTime = (this as any).lastFPSTime || now
    const delta = now - lastTime
    
    if (delta > 0) {
      this.metrics.fps = Math.min(Math.round(1000 / delta), 60)
    }
    
    ;(this as any).lastFPSTime = now
  }

  // 启动优化检查
  private startOptimizationCheck(): void {
    const timer = window.setInterval(() => {
      this.checkOptimizations()
    }, 30000) // 每30秒检查一次

    this.timers.set('optimization', timer)
  }

  // 检查优化建议
  private checkOptimizations(): void {
    // 检查内存使用
    if (this.metrics.memory.total > 0) {
      const memoryUsage = this.metrics.memory.used / this.metrics.memory.total
      
      if (memoryUsage > 0.8) {
        this.addOptimization({
          id: 'high-memory-usage',
          type: 'memory',
          priority: 'high',
          title: '内存使用过高',
          description: '内存使用超过80%，建议清理不必要的对象引用',
          impact: '减少内存使用30%',
          action: () => {
            // 触发垃圾回收（如果可能）
            if (window.gc) {
              window.gc()
            }
          }
        })
      }
    }

    // 检查 FPS
    if (this.metrics.fps < 30) {
      this.addOptimization({
        id: 'low-fps',
        type: 'render',
        priority: 'high',
        title: 'FPS 过低',
        description: '帧率低于30fps，建议优化渲染性能',
        impact: '提升帧率至60fps'
      })
    }

    // 检查缓存命中率
    if (this.metrics.cache.hitRate < 0.7) {
      this.addOptimization({
        id: 'low-cache-hit-rate',
        type: 'cache',
        priority: 'medium',
        title: '缓存命中率低',
        description: '缓存命中率低于70%，建议优化缓存策略',
        impact: '提升响应速度40%'
      })
    }

    // 检查错误率
    if (this.metrics.errors.rate > 0.05) {
      this.addOptimization({
        id: 'high-error-rate',
        type: 'network',
        priority: 'critical',
        title: '错误率过高',
        description: '错误率超过5%，需要立即处理',
        impact: '提升稳定性80%'
      })
    }
  }

  // 添加优化建议
  private addOptimization(optimization: PerformanceOptimization): void {
    // 检查是否已存在相同的优化建议
    const exists = this.optimizations.some(opt => opt.id === optimization.id)
    if (exists) return

    this.optimizations.push(optimization)

    // 限制优化建议数量
    if (this.optimizations.length > 10) {
      this.optimizations.shift()
    }
  }

  // 应用优化建议
  applyOptimization(id: string): boolean {
    const optimization = this.optimizations.find(opt => opt.id === id)
    if (!optimization) return false

    if (optimization.action) {
      try {
        optimization.action()
        
        // 移除已应用的优化建议
        const index = this.optimizations.findIndex(opt => opt.id === id)
        if (index > -1) {
          this.optimizations.splice(index, 1)
        }
        
        return true
      } catch (error) {
        console.error('Failed to apply optimization:', error)
        return false
      }
    }

    return false
  }

  // 忽略优化建议
  dismissOptimization(id: string): boolean {
    const index = this.optimizations.findIndex(opt => opt.id === id)
    if (index > -1) {
      this.optimizations.splice(index, 1)
      return true
    }
    return false
  }

  // 获取当前指标
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  // 获取优化建议
  getOptimizations(): PerformanceOptimization[] {
    return [...this.optimizations]
  }

  // 获取配置
  getConfig(): PerformanceConfig {
    return { ...this.config }
  }

  // 更新配置
  updateConfig(config: Partial<PerformanceConfig>): void {
    this.config = { ...this.config, ...config }
    
    // 重新初始化缓存管理器
    if (config.caching) {
      this.cache.updateConfig(config.caching)
    }
    
    // 重启监控（如果配置改变）
    if (config.monitoring) {
      this.stopMonitoring()
      if (this.config.monitoring.enabled) {
        this.startMonitoring()
      }
    }
  }

  // 导出性能报告
  exportReport(): {
    timestamp: number
    config: PerformanceConfig
    metrics: PerformanceMetrics
    optimizations: PerformanceOptimization[]
    cacheStats: any
  } {
    return {
      timestamp: Date.now(),
      config: this.getConfig(),
      metrics: this.getMetrics(),
      optimizations: this.getOptimizations(),
      cacheStats: this.cache.getStats()
    }
  }

  // 销毁性能管理器
  destroy(): void {
    this.stopMonitoring()
    
    // 清理定时器
    this.timers.forEach(timer => clearInterval(timer))
    this.timers.clear()
    
    // 销毁缓存管理器
    this.cache.destroy()
    
    // 清理数据
    this.optimizations = []
  }
}

// 工具函数
export function createPerformanceManager(config?: Partial<PerformanceConfig>): PerformanceManager {
  return new PerformanceManager(config)
}

export function validatePerformanceConfig(config: Partial<PerformanceConfig>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (config.virtualScroll) {
    if (config.virtualScroll.itemHeight && config.virtualScroll.itemHeight < 1) {
      errors.push('virtualScroll.itemHeight must be at least 1')
    }
    if (config.virtualScroll.overscan && config.virtualScroll.overscan < 0) {
      errors.push('virtualScroll.overscan must be non-negative')
    }
  }

  if (config.lazyLoading) {
    if (config.lazyLoading.threshold && (config.lazyLoading.threshold < 0 || config.lazyLoading.threshold > 1)) {
      errors.push('lazyLoading.threshold must be between 0 and 1')
    }
    if (config.lazyLoading.delay && config.lazyLoading.delay < 0) {
      errors.push('lazyLoading.delay must be non-negative')
    }
  }

  if (config.caching) {
    if (config.caching.maxSize && config.caching.maxSize < 1) {
      errors.push('caching.maxSize must be at least 1')
    }
    if (config.caching.maxMemory && config.caching.maxMemory < 1024) {
      errors.push('caching.maxMemory must be at least 1024 bytes')
    }
  }

  if (config.monitoring) {
    if (config.monitoring.updateInterval && config.monitoring.updateInterval < 100) {
      errors.push('monitoring.updateInterval must be at least 100ms')
    }
    if (config.monitoring.maxHistorySize && config.monitoring.maxHistorySize < 10) {
      errors.push('monitoring.maxHistorySize must be at least 10')
    }
  }

  return {
    valid: errors.length === 0,
    errors
  }
}

// 性能工具函数
export const PerformanceUtils = {
  // 测量函数执行时间
  measureTime: <T>(fn: () => T, name?: string): { result: T; duration: number } => {
    const start = performance.now()
    const result = fn()
    const duration = performance.now() - start
    
    if (name) {
      console.log(`${name} took ${duration.toFixed(2)}ms`)
    }
    
    return { result, duration }
  },

  // 异步测量函数执行时间
  measureTimeAsync: async <T>(fn: () => Promise<T>, name?: string): Promise<{ result: T; duration: number }> => {
    const start = performance.now()
    const result = await fn()
    const duration = performance.now() - start
    
    if (name) {
      console.log(`${name} took ${duration.toFixed(2)}ms`)
    }
    
    return { result, duration }
  },

  // 防抖函数
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number,
    immediate = false
  ): ((...args: Parameters<T>) => void) => {
    let timeout: number | null = null
    
    return function executedFunction(...args: Parameters<T>) {
      const later = () => {
        timeout = null
        if (!immediate) func(...args)
      }
      
      const callNow = immediate && !timeout
      
      if (timeout) clearTimeout(timeout)
      timeout = window.setTimeout(later, wait)
      
      if (callNow) func(...args)
    }
  },

  // 节流函数
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    
    return function executedFunction(...args: Parameters<T>) {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  },

  // 格式化字节大小
  formatBytes: (bytes: number, decimals = 2): string => {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  },

  // 格式化时间
  formatTime: (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }
}

// 全局性能管理器实例
export const globalPerformanceManager = createPerformanceManager()

// Vue 组合式 API
export function usePerformance() {
  return {
    manager: globalPerformanceManager,
    getMetrics: globalPerformanceManager.getMetrics.bind(globalPerformanceManager),
    getOptimizations: globalPerformanceManager.getOptimizations.bind(globalPerformanceManager),
    applyOptimization: globalPerformanceManager.applyOptimization.bind(globalPerformanceManager),
    dismissOptimization: globalPerformanceManager.dismissOptimization.bind(globalPerformanceManager),
    exportReport: globalPerformanceManager.exportReport.bind(globalPerformanceManager),
    utils: PerformanceUtils
  }
}