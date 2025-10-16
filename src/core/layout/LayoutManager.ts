/**
 * 布局管理器实现
 * 负责断点管理、设备检测、媒体查询和事件监听
 */

import type { ILayoutManager, Breakpoint, Orientation, ViewportInfo, MediaQuery, LayoutEvent, LayoutListener } from './index'

import { DeviceType, LayoutEventType } from './index'

// 避免循环依赖，直接定义默认断点
const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  {
    name: 'xs',
    minWidth: 0,
    maxWidth: 575,
    columns: 12,
    gutter: 16,
    margin: 16,
  },
  {
    name: 'sm',
    minWidth: 576,
    maxWidth: 767,
    columns: 12,
    gutter: 16,
    margin: 24,
  },
  {
    name: 'md',
    minWidth: 768,
    maxWidth: 991,
    columns: 12,
    gutter: 24,
    margin: 32,
  },
  {
    name: 'lg',
    minWidth: 992,
    maxWidth: 1199,
    columns: 12,
    gutter: 24,
    margin: 32,
  },
  {
    name: 'xl',
    minWidth: 1200,
    maxWidth: 1599,
    columns: 12,
    gutter: 32,
    margin: 40,
  },
  {
    name: 'xxl',
    minWidth: 1600,
    columns: 12,
    gutter: 32,
    margin: 40,
  },
]

// 布局工具类（避免循环依赖）
class LayoutUtils {
  static getViewportWidth(): number {
    return typeof window !== 'undefined' ? window.innerWidth : 0
  }

  static getViewportHeight(): number {
    return typeof window !== 'undefined' ? window.innerHeight : 0
  }

  static detectDeviceType(width: number = this.getViewportWidth()): DeviceType {
    if (width < 768) {
      return 'mobile' as DeviceType
    } else if (width < 1024) {
      return 'tablet' as DeviceType
    } else if (width < 1440) {
      return 'desktop' as DeviceType
    } else {
      return 'large-desktop' as DeviceType
    }
  }

  static detectOrientation(): Orientation {
    if (typeof window === 'undefined') {
      return 'landscape' as Orientation
    }

    return window.innerWidth > window.innerHeight ? ('landscape' as Orientation) : ('portrait' as Orientation)
  }

  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  static isRetinaDisplay(): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    return window.devicePixelRatio > 1
  }

  static getPixelRatio(): number {
    return typeof window !== 'undefined' ? window.devicePixelRatio : 1
  }

  static matchMedia(query: string): boolean {
    if (typeof window === 'undefined') {
      return false
    }

    return window.matchMedia(query).matches
  }

  static debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout | null = null

    return (...args: Parameters<T>) => {
      if (timeout) {
        clearTimeout(timeout)
      }

      timeout = setTimeout(() => {
        func.apply(null, args)
      }, wait)
    }
  }

  static throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void {
    let inThrottle = false

    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  }
}

/**
 * 布局管理器配置
 */
export interface LayoutManagerConfig {
  breakpoints?: Breakpoint[]
  debounceDelay?: number
  throttleDelay?: number
  enableAutoUpdate?: boolean
  enableMediaQueryPolyfill?: boolean
}

/**
 * 默认配置
 */
const DEFAULT_CONFIG: Required<LayoutManagerConfig> = {
  breakpoints: DEFAULT_BREAKPOINTS,
  debounceDelay: 100,
  throttleDelay: 16,
  enableAutoUpdate: true,
  enableMediaQueryPolyfill: true,
}

/**
 * 布局管理器实现
 */
export class LayoutManager implements ILayoutManager {
  private config: Required<LayoutManagerConfig>
  private breakpoints: Breakpoint[]
  private mediaQueries: Map<string, MediaQueryList> = new Map()
  private listeners: Map<LayoutEventType, Set<LayoutListener>> = new Map()
  private currentBreakpoint: Breakpoint
  private currentViewportInfo: ViewportInfo
  private resizeObserver?: ResizeObserver
  private mediaQueryListeners: Map<string, (e: MediaQueryListEvent) => void> = new Map()

  constructor(config: LayoutManagerConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.breakpoints = [...this.config.breakpoints]

    // 初始化当前断点和视口信息
    this.currentBreakpoint = this.calculateCurrentBreakpoint()
    this.currentViewportInfo = this.calculateViewportInfo()

    // 初始化事件监听器映射
    Object.values(LayoutEventType).forEach(type => {
      this.listeners.set(type, new Set())
    })

    if (typeof window !== 'undefined' && this.config.enableAutoUpdate) {
      this.initializeEventListeners()
    }
  }

  /**
   * 获取当前断点
   */
  getCurrentBreakpoint(): Breakpoint {
    return this.currentBreakpoint
  }

  /**
   * 获取所有断点
   */
  getBreakpoints(): Breakpoint[] {
    return [...this.breakpoints]
  }

  /**
   * 获取断点映射（用于测试兼容性）
   */
  getBreakpointsMap(): Record<string, number> {
    const map: Record<string, number> = {}
    this.breakpoints.forEach(bp => {
      map[bp.name] = bp.minWidth
    })
    return map
  }

  /**
   * 添加断点
   */
  addBreakpoint(name: string, minWidth: number): void
  addBreakpoint(breakpoint: Breakpoint): void
  addBreakpoint(nameOrBreakpoint: string | Breakpoint, minWidth?: number): void {
    let breakpoint: Breakpoint

    if (typeof nameOrBreakpoint === 'string') {
      breakpoint = {
        name: nameOrBreakpoint,
        minWidth: minWidth!,
        columns: 12,
        gutter: 16,
        margin: 16,
      }
    } else {
      breakpoint = nameOrBreakpoint
    }

    // 检查是否已存在同名断点
    const existingIndex = this.breakpoints.findIndex(bp => bp.name === breakpoint.name)

    if (existingIndex >= 0) {
      this.breakpoints[existingIndex] = breakpoint
    } else {
      // 按最小宽度排序插入
      const insertIndex = this.breakpoints.findIndex(bp => bp.minWidth > breakpoint.minWidth)
      if (insertIndex >= 0) {
        this.breakpoints.splice(insertIndex, 0, breakpoint)
      } else {
        this.breakpoints.push(breakpoint)
      }
    }

    // 重新计算当前断点
    this.updateCurrentBreakpoint()
  }

  /**
   * 移除断点
   */
  removeBreakpoint(name: string): void {
    const index = this.breakpoints.findIndex(bp => bp.name === name)
    if (index >= 0) {
      this.breakpoints.splice(index, 1)
      this.updateCurrentBreakpoint()
    }
  }

  /**
   * 获取设备类型
   */
  getDeviceType(): DeviceType {
    return this.currentViewportInfo.deviceType
  }

  /**
   * 获取屏幕方向
   */
  getOrientation(): Orientation {
    return this.currentViewportInfo.orientation
  }

  /**
   * 获取视口信息
   */
  getViewportInfo(): ViewportInfo {
    return { ...this.currentViewportInfo }
  }

  /**
   * 匹配断点
   */
  matchBreakpoint(name: string): boolean {
    const currentBp = this.getCurrentBreakpoint()
    return currentBp.name === name
  }

  /**
   * 匹配断点范围
   */
  matchBreakpointRange(min: string, max: string): boolean {
    const currentBp = this.getCurrentBreakpoint()
    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']

    const currentIndex = breakpointOrder.indexOf(currentBp.name)
    const minIndex = breakpointOrder.indexOf(min)
    const maxIndex = breakpointOrder.indexOf(max)

    return currentIndex >= minIndex && currentIndex <= maxIndex
  }

  /**
   * 匹配媒体查询
   */
  matchMedia(query: string): boolean {
    return LayoutUtils.matchMedia(query)
  }

  /**
   * 匹配媒体查询（别名方法）
   */
  matchMediaQuery(query: string): boolean {
    return this.matchMedia(query)
  }

  /**
   * 获取媒体查询列表
   */
  getMediaQueries(): MediaQuery[] {
    const queries: MediaQuery[] = []
    this.mediaQueries.forEach((mql, name) => {
      queries.push({
        name,
        query: mql.media,
        matches: mql.matches,
      })
    })

    return queries
  }

  /**
   * 添加媒体查询
   */
  addMediaQuery(name: string, query: string, callback?: (matches: boolean) => void): void {
    if (typeof window === 'undefined') {
      return
    }

    // 移除已存在的查询
    this.removeMediaQuery(name)

    const mql = window.matchMedia(query)
    this.mediaQueries.set(name, mql)

    // 添加监听器
    const listener = (e: MediaQueryListEvent) => {
      // 如果提供了回调函数，直接调用
      if (callback) {
        callback(e.matches)
      }

      this.emitEvent({
        type: LayoutEventType.BREAKPOINT_CHANGE,
        data: {
          name,
          query,
          matches: e.matches,
          previous: !e.matches,
        },
        timestamp: Date.now(),
      })
    }

    this.mediaQueryListeners.set(name, listener)
    mql.addEventListener('change', listener)
  }

  /**
   * 移除媒体查询
   */
  removeMediaQuery(name: string): void {
    const mql = this.mediaQueries.get(name)
    const listener = this.mediaQueryListeners.get(name)

    if (mql && listener) {
      mql.removeEventListener('change', listener)
      this.mediaQueries.delete(name)
      this.mediaQueryListeners.delete(name)
    }
  }

  /**
   * 添加事件监听器
   */
  addEventListener(type: LayoutEventType, listener: LayoutListener): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.add(listener)
    }
  }

  /**
   * 添加事件监听器（别名方法）
   */
  on(type: LayoutEventType, listener: LayoutListener): void {
    this.addEventListener(type, listener)
  }

  /**
   * 移除事件监听器
   */
  removeEventListener(type: LayoutEventType, listener: LayoutListener): void {
    const listeners = this.listeners.get(type)
    if (listeners) {
      listeners.delete(listener)
    }
  }

  /**
   * 移除事件监听器（别名方法）
   */
  off(type: LayoutEventType, listener: LayoutListener): void {
    this.removeEventListener(type, listener)
  }

  /**
   * 触发事件（别名方法）
   */
  emit(type: LayoutEventType, data: any): void {
    this.emitEvent({
      type,
      data,
      timestamp: Date.now(),
    })
  }

  /**
   * 是否为桌面设备
   */
  isDesktop(): boolean {
    return this.currentViewportInfo.deviceType === DeviceType.DESKTOP || this.currentViewportInfo.deviceType === DeviceType.LARGE_DESKTOP
  }

  /**
   * 是否为移动设备
   */
  isMobile(): boolean {
    return this.currentViewportInfo.deviceType === DeviceType.MOBILE
  }

  /**
   * 是否为平板设备
   */
  isTablet(): boolean {
    return this.currentViewportInfo.deviceType === DeviceType.TABLET
  }

  /**
   * 是否为触摸设备
   */
  isTouch(): boolean {
    return this.currentViewportInfo.isTouch
  }

  /**
   * 是否为Retina屏幕
   */
  isRetina(): boolean {
    return this.currentViewportInfo.isRetina
  }

  /**
   * 销毁管理器
   */
  destroy(): void {
    // 移除窗口事件监听器
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize)
      window.removeEventListener('orientationchange', this.handleOrientationChange)
    }

    // 移除媒体查询监听器
    this.mediaQueryListeners.forEach((listener, name) => {
      const mql = this.mediaQueries.get(name)
      if (mql) {
        mql.removeEventListener('change', listener)
      }
    })

    // 断开ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect()
    }

    // 清空所有监听器
    this.listeners.clear()
    this.mediaQueries.clear()
    this.mediaQueryListeners.clear()
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 窗口大小变化监听
    const debouncedResize = LayoutUtils.debounce(this.handleResize.bind(this), this.config.debounceDelay)
    window.addEventListener('resize', debouncedResize)

    // 屏幕方向变化监听
    const throttledOrientationChange = LayoutUtils.throttle(this.handleOrientationChange.bind(this), this.config.throttleDelay)
    window.addEventListener('orientationchange', throttledOrientationChange)

    // 使用ResizeObserver监听文档元素变化
    if ('ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver(LayoutUtils.throttle(this.handleElementResize.bind(this), this.config.throttleDelay))
      this.resizeObserver.observe(document.documentElement)
    }
  }

  /**
   * 处理窗口大小变化
   */
  private handleResize = (): void => {
    const previousBreakpoint = this.currentBreakpoint
    const previousViewportInfo = this.currentViewportInfo

    this.updateCurrentBreakpoint()
    this.updateViewportInfo()

    // 发送视口变化事件
    this.emitEvent({
      type: LayoutEventType.VIEWPORT_CHANGE,
      data: {
        current: this.currentViewportInfo,
        previous: previousViewportInfo,
      },
      timestamp: Date.now(),
    })

    // 检查断点是否变化
    if (previousBreakpoint.name !== this.currentBreakpoint.name) {
      this.emitEvent({
        type: LayoutEventType.BREAKPOINT_CHANGE,
        data: {
          current: this.currentBreakpoint,
          previous: previousBreakpoint,
        },
        timestamp: Date.now(),
      })
    }

    // 检查设备类型是否变化
    if (previousViewportInfo.deviceType !== this.currentViewportInfo.deviceType) {
      this.emitEvent({
        type: LayoutEventType.DEVICE_CHANGE,
        data: {
          current: this.currentViewportInfo.deviceType,
          previous: previousViewportInfo.deviceType,
        },
        timestamp: Date.now(),
      })
    }
  }

  /**
   * 处理屏幕方向变化
   */
  private handleOrientationChange = (): void => {
    const previousOrientation = this.currentViewportInfo.orientation

    // 延迟更新，等待浏览器完成方向变化
    setTimeout(() => {
      this.updateViewportInfo()

      if (previousOrientation !== this.currentViewportInfo.orientation) {
        this.emitEvent({
          type: LayoutEventType.ORIENTATION_CHANGE,
          data: {
            current: this.currentViewportInfo.orientation,
            previous: previousOrientation,
          },
          timestamp: Date.now(),
        })
      }
    }, 100)
  }

  /**
   * 处理元素大小变化
   */
  private handleElementResize(entries: ResizeObserverEntry[]): void {
    for (const entry of entries) {
      if (entry.target === document.documentElement) {
        this.handleResize()
        break
      }
    }
  }

  /**
   * 计算当前断点
   */
  private calculateCurrentBreakpoint(): Breakpoint {
    const width = LayoutUtils.getViewportWidth()

    // 按断点顺序从大到小检查，确保正确匹配
    const sortedBreakpoints = [...this.breakpoints].sort((a, b) => b.minWidth - a.minWidth)

    for (const breakpoint of sortedBreakpoints) {
      if (width >= breakpoint.minWidth && (!breakpoint.maxWidth || width <= breakpoint.maxWidth)) {
        return breakpoint
      }
    }

    // 如果没有匹配的断点，返回最小的断点
    return this.breakpoints[0] || DEFAULT_BREAKPOINTS[0]
  }

  /**
   * 计算视口信息
   */
  private calculateViewportInfo(): ViewportInfo {
    const width = LayoutUtils.getViewportWidth()
    const height = LayoutUtils.getViewportHeight()

    return {
      width,
      height,
      deviceType: LayoutUtils.detectDeviceType(width),
      orientation: LayoutUtils.detectOrientation(),
      pixelRatio: LayoutUtils.getPixelRatio(),
      isTouch: LayoutUtils.isTouchDevice(),
      isRetina: LayoutUtils.isRetinaDisplay(),
    }
  }

  /**
   * 更新当前断点
   */
  private updateCurrentBreakpoint(): void {
    this.currentBreakpoint = this.calculateCurrentBreakpoint()
  }

  /**
   * 更新视口信息
   */
  private updateViewportInfo(): void {
    this.currentViewportInfo = this.calculateViewportInfo()
  }

  /**
   * 发送事件
   */
  private emitEvent(event: LayoutEvent): void {
    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in layout event listener:`, error)
        }
      })
    }
  }
}

/**
 * 创建布局管理器实例
 */
export function createLayoutManager(config?: LayoutManagerConfig): LayoutManager {
  return new LayoutManager(config)
}

/**
 * 全局布局管理器实例
 */
let globalLayoutManager: LayoutManager | null = null

/**
 * 获取全局布局管理器实例
 */
export function getGlobalLayoutManager(): LayoutManager {
  if (!globalLayoutManager) {
    globalLayoutManager = createLayoutManager()
  }
  return globalLayoutManager
}

/**
 * 设置全局布局管理器实例
 */
export function setGlobalLayoutManager(manager: LayoutManager): void {
  if (globalLayoutManager) {
    globalLayoutManager.destroy()
  }
  globalLayoutManager = manager
}

/**
 * 销毁全局布局管理器实例
 */
export function destroyGlobalLayoutManager(): void {
  if (globalLayoutManager) {
    globalLayoutManager.destroy()
    globalLayoutManager = null
  }
}
