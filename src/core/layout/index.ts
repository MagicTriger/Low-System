/**
 * 响应式布局系统核心
 * 提供多端适配、移动端支持、自适应设计和断点管理
 */

/**
 * 布局管理器配置
 */
export interface LayoutManagerConfig {
  breakpoints?: Breakpoint[]
  gridConfig?: Partial<GridConfig>
  containerConfig?: Partial<ContainerConfig>
  enableResponsive?: boolean
  enableTouch?: boolean
  debounceDelay?: number
}

/**
 * 断点定义
 */
export interface Breakpoint {
  name: string
  minWidth: number
  maxWidth?: number
  columns: number
  gutter: number
  margin: number
}

/**
 * 设备类型
 */
export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
  LARGE_DESKTOP = 'large-desktop'
}

/**
 * 屏幕方向
 */
export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape'
}

/**
 * 布局模式
 */
export enum LayoutMode {
  FIXED = 'fixed',
  FLUID = 'fluid',
  RESPONSIVE = 'responsive',
  ADAPTIVE = 'adaptive'
}

/**
 * 网格系统配置
 */
export interface GridConfig {
  columns: number
  gutter: number
  margin: number
  maxWidth?: number
  breakpoints: Breakpoint[]
}

/**
 * 响应式配置
 */
export interface ResponsiveConfig<T = any> {
  xs?: T
  sm?: T
  md?: T
  lg?: T
  xl?: T
  xxl?: T
}

/**
 * 布局容器配置
 */
export interface ContainerConfig {
  fluid: boolean
  maxWidth?: number | string
  padding?: number | string
  margin?: number | string
  breakpoints?: Record<string, {
    maxWidth?: number | string
    padding?: number | string
    margin?: number | string
  }>
}

/**
 * 媒体查询配置
 */
export interface MediaQuery {
  name: string
  query: string
  matches: boolean
}

/**
 * 视口信息
 */
export interface ViewportInfo {
  width: number
  height: number
  deviceType: DeviceType
  orientation: Orientation
  pixelRatio: number
  isTouch: boolean
  isRetina: boolean
}

/**
 * 布局事件类型
 */
export enum LayoutEventType {
  BREAKPOINT_CHANGE = 'breakpointChange',
  ORIENTATION_CHANGE = 'orientationChange',
  VIEWPORT_CHANGE = 'viewportChange',
  RESIZE = 'resize',
  DEVICE_CHANGE = 'deviceChange'
}

/**
 * 布局事件
 */
export interface LayoutEvent {
  type: LayoutEventType
  data: any
  timestamp: number
}

/**
 * 布局监听器
 */
export type LayoutListener = (event: LayoutEvent) => void

/**
 * 布局管理器接口
 */
export interface ILayoutManager {
  // 断点管理
  getCurrentBreakpoint(): Breakpoint
  getBreakpoints(): Breakpoint[]
  addBreakpoint(breakpoint: Breakpoint): void
  removeBreakpoint(name: string): void
  
  // 设备检测
  getDeviceType(): DeviceType
  getOrientation(): Orientation
  getViewportInfo(): ViewportInfo
  
  // 媒体查询
  matchMedia(query: string): boolean
  getMediaQueries(): MediaQuery[]
  addMediaQuery(name: string, query: string): void
  removeMediaQuery(name: string): void
  
  // 事件监听
  addEventListener(type: LayoutEventType, listener: LayoutListener): void
  removeEventListener(type: LayoutEventType, listener: LayoutListener): void
  
  // 工具方法
  isDesktop(): boolean
  isMobile(): boolean
  isTablet(): boolean
  isTouch(): boolean
  isRetina(): boolean
}

/**
 * 网格系统接口
 */
export interface IGridSystem {
  // 网格配置
  getConfig(): GridConfig
  setConfig(config: Partial<GridConfig>): void
  
  // 列计算
  getColumnWidth(columns: number, totalColumns?: number): string
  getColumnOffset(offset: number, totalColumns?: number): string
  
  // 响应式工具
  getResponsiveValue<T>(config: ResponsiveConfig, defaultValue: T): T
  generateResponsiveClasses(prefix: string, config: ResponsiveConfig): string[]
  
  // CSS生成
  generateGridCSS(): string
  generateUtilityCSS(): string
}

/**
 * 容器管理器接口
 */
export interface IContainerManager {
  // 容器配置
  getConfig(): ContainerConfig
  setConfig(config: Partial<ContainerConfig>): void
  
  // 容器样式
  getContainerStyles(): Record<string, any>
  getResponsiveStyles(): Record<string, Record<string, any>>
  
  // CSS生成
  generateContainerCSS(): string
}

/**
 * 默认断点配置
 */
export const DEFAULT_BREAKPOINTS: Breakpoint[] = [
  {
    name: 'xs',
    minWidth: 0,
    maxWidth: 575,
    columns: 12,
    gutter: 16,
    margin: 16
  },
  {
    name: 'sm',
    minWidth: 576,
    maxWidth: 767,
    columns: 12,
    gutter: 16,
    margin: 24
  },
  {
    name: 'md',
    minWidth: 768,
    maxWidth: 991,
    columns: 12,
    gutter: 24,
    margin: 32
  },
  {
    name: 'lg',
    minWidth: 992,
    maxWidth: 1199,
    columns: 12,
    gutter: 24,
    margin: 32
  },
  {
    name: 'xl',
    minWidth: 1200,
    maxWidth: 1599,
    columns: 12,
    gutter: 32,
    margin: 40
  },
  {
    name: 'xxl',
    minWidth: 1600,
    columns: 12,
    gutter: 32,
    margin: 40
  }
]

/**
 * 默认网格配置
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  gutter: 24,
  margin: 32,
  maxWidth: 1200,
  breakpoints: DEFAULT_BREAKPOINTS
}

/**
 * 默认容器配置
 */
export const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
  fluid: false,
  maxWidth: 1200,
  padding: 24,
  margin: 'auto',
  breakpoints: {
    xs: { maxWidth: '100%', padding: 16 },
    sm: { maxWidth: 540, padding: 16 },
    md: { maxWidth: 720, padding: 24 },
    lg: { maxWidth: 960, padding: 24 },
    xl: { maxWidth: 1140, padding: 32 },
    xxl: { maxWidth: 1320, padding: 32 }
  }
}

/**
 * 常用媒体查询
 */
export const COMMON_MEDIA_QUERIES = {
  // 设备类型
  MOBILE: '(max-width: 767px)',
  TABLET: '(min-width: 768px) and (max-width: 1023px)',
  DESKTOP: '(min-width: 1024px)',
  
  // 屏幕方向
  PORTRAIT: '(orientation: portrait)',
  LANDSCAPE: '(orientation: landscape)',
  
  // 特殊特性
  TOUCH: '(pointer: coarse)',
  HOVER: '(hover: hover)',
  RETINA: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // 暗色模式
  DARK_MODE: '(prefers-color-scheme: dark)',
  LIGHT_MODE: '(prefers-color-scheme: light)',
  
  // 动画偏好
  REDUCED_MOTION: '(prefers-reduced-motion: reduce)',
  
  // 对比度偏好
  HIGH_CONTRAST: '(prefers-contrast: high)',
  LOW_CONTRAST: '(prefers-contrast: low)'
} as const

/**
 * 布局工具类
 */
export class LayoutUtils {
  /**
   * 获取当前视口宽度
   */
  static getViewportWidth(): number {
    return typeof window !== 'undefined' ? window.innerWidth : 0
  }

  /**
   * 获取当前视口高度
   */
  static getViewportHeight(): number {
    return typeof window !== 'undefined' ? window.innerHeight : 0
  }

  /**
   * 检测设备类型
   */
  static detectDeviceType(width: number = this.getViewportWidth()): DeviceType {
    if (width < 768) {
      return DeviceType.MOBILE
    } else if (width < 1024) {
      return DeviceType.TABLET
    } else if (width < 1440) {
      return DeviceType.DESKTOP
    } else {
      return DeviceType.LARGE_DESKTOP
    }
  }

  /**
   * 检测屏幕方向
   */
  static detectOrientation(): Orientation {
    if (typeof window === 'undefined') {
      return Orientation.LANDSCAPE
    }
    
    return window.innerWidth > window.innerHeight 
      ? Orientation.LANDSCAPE 
      : Orientation.PORTRAIT
  }

  /**
   * 检测是否为触摸设备
   */
  static isTouchDevice(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
  }

  /**
   * 检测是否为Retina屏幕
   */
  static isRetinaDisplay(): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    
    return window.devicePixelRatio > 1
  }

  /**
   * 获取设备像素比
   */
  static getPixelRatio(): number {
    return typeof window !== 'undefined' ? window.devicePixelRatio : 1
  }

  /**
   * 匹配媒体查询
   */
  static matchMedia(query: string): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    
    return window.matchMedia(query).matches
  }

  /**
   * 获取断点名称
   */
  static getBreakpointName(width: number, breakpoints: Breakpoint[]): string {
    for (const breakpoint of breakpoints) {
      if (width >= breakpoint.minWidth && 
          (!breakpoint.maxWidth || width <= breakpoint.maxWidth)) {
        return breakpoint.name
      }
    }
    return breakpoints[breakpoints.length - 1]?.name || 'xl'
  }

  /**
   * 计算列宽度
   */
  static calculateColumnWidth(
    columns: number, 
    totalColumns: number, 
    gutter: number
  ): number {
    const gutterTotal = (totalColumns - 1) * gutter
    const availableWidth = 100 - (gutterTotal / totalColumns * 100)
    return (availableWidth / totalColumns) * columns
  }

  /**
   * 转换尺寸单位
   */
  static convertSize(value: number | string, unit: string = 'px'): string {
    if (typeof value === 'string') {
      return value
    }
    return `${value}${unit}`
  }

  /**
   * 生成响应式类名
   */
  static generateResponsiveClass(
    prefix: string, 
    breakpoint: string, 
    value: string | number
  ): string {
    return breakpoint === 'xs' 
      ? `${prefix}-${value}` 
      : `${prefix}-${breakpoint}-${value}`
  }

  /**
   * 防抖函数
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
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

  /**
   * 节流函数
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func.apply(null, args)
        inThrottle = true
        setTimeout(() => inThrottle = false, limit)
      }
    }
  }
}

// 导出管理器
export { LayoutManager, createLayoutManager, getGlobalLayoutManager, setGlobalLayoutManager, destroyGlobalLayoutManager } from './LayoutManager'
export { GridSystem, createGridSystem, getGlobalGridSystem, setGlobalGridSystem, resetGlobalGridSystem, PRESET_GRID_SYSTEMS } from './GridSystem'
export { ContainerManager, createContainerManager, getGlobalContainerManager, setGlobalContainerManager, resetGlobalContainerManager, PRESET_CONTAINER_CONFIGS } from './ContainerManager'

// 导出组合式API
export * from './composables'

/**
 * CSS生成器
 */
export class CSSGenerator {
  /**
   * 生成网格CSS
   */
  static generateGridCSS(config: GridConfig): string {
    const { columns, gutter, margin, breakpoints } = config
    let css = ''

    // 基础容器样式
    css += `
.container {
  width: 100%;
  padding-left: ${margin}px;
  padding-right: ${margin}px;
  margin-left: auto;
  margin-right: auto;
}

.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -${gutter / 2}px;
  margin-right: -${gutter / 2}px;
}

.col {
  position: relative;
  width: 100%;
  padding-left: ${gutter / 2}px;
  padding-right: ${gutter / 2}px;
}
`

    // 生成各断点的样式
    breakpoints.forEach(breakpoint => {
      const mediaQuery = breakpoint.maxWidth 
        ? `@media (min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px)`
        : `@media (min-width: ${breakpoint.minWidth}px)`

      css += `\n${mediaQuery} {\n`

      // 容器最大宽度
      if (config.maxWidth) {
        css += `  .container { max-width: ${config.maxWidth}px; }\n`
      }

      // 列宽度
      for (let i = 1; i <= breakpoint.columns; i++) {
        const width = (100 / breakpoint.columns) * i
        css += `  .col-${breakpoint.name}-${i} { flex: 0 0 ${width}%; max-width: ${width}%; }\n`
      }

      // 偏移
      for (let i = 0; i < breakpoint.columns; i++) {
        const offset = (100 / breakpoint.columns) * i
        css += `  .offset-${breakpoint.name}-${i} { margin-left: ${offset}%; }\n`
      }

      css += '}\n'
    })

    return css
  }

  /**
   * 生成工具类CSS
   */
  static generateUtilityCSS(breakpoints: Breakpoint[]): string {
    let css = ''

    // 显示/隐藏工具类
    const displayValues = ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid']
    
    breakpoints.forEach(breakpoint => {
      const mediaQuery = breakpoint.maxWidth 
        ? `@media (min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px)`
        : `@media (min-width: ${breakpoint.minWidth}px)`

      css += `\n${mediaQuery} {\n`

      displayValues.forEach(value => {
        css += `  .d-${breakpoint.name}-${value} { display: ${value} !important; }\n`
      })

      // 文本对齐
      const textAlignValues = ['left', 'center', 'right', 'justify']
      textAlignValues.forEach(value => {
        css += `  .text-${breakpoint.name}-${value} { text-align: ${value} !important; }\n`
      })

      // Flex工具类
      css += `  .flex-${breakpoint.name}-row { flex-direction: row !important; }\n`
      css += `  .flex-${breakpoint.name}-column { flex-direction: column !important; }\n`
      css += `  .justify-content-${breakpoint.name}-start { justify-content: flex-start !important; }\n`
      css += `  .justify-content-${breakpoint.name}-center { justify-content: center !important; }\n`
      css += `  .justify-content-${breakpoint.name}-end { justify-content: flex-end !important; }\n`
      css += `  .justify-content-${breakpoint.name}-between { justify-content: space-between !important; }\n`
      css += `  .justify-content-${breakpoint.name}-around { justify-content: space-around !important; }\n`

      css += '}\n'
    })

    return css
  }

  /**
   * 生成容器CSS
   */
  static generateContainerCSS(config: ContainerConfig): string {
    let css = ''

    if (config.fluid) {
      css += `
.container-fluid {
  width: 100%;
  padding-left: ${LayoutUtils.convertSize(config.padding || 15)};
  padding-right: ${LayoutUtils.convertSize(config.padding || 15)};
  margin-left: ${LayoutUtils.convertSize(config.margin || 'auto')};
  margin-right: ${LayoutUtils.convertSize(config.margin || 'auto')};
}
`
    } else {
      css += `
.container {
  width: 100%;
  padding-left: ${LayoutUtils.convertSize(config.padding || 15)};
  padding-right: ${LayoutUtils.convertSize(config.padding || 15)};
  margin-left: ${LayoutUtils.convertSize(config.margin || 'auto')};
  margin-right: ${LayoutUtils.convertSize(config.margin || 'auto')};
  max-width: ${LayoutUtils.convertSize(config.maxWidth || 1200)};
}
`
    }

    // 响应式断点样式
    if (config.breakpoints) {
      Object.entries(config.breakpoints).forEach(([breakpoint, breakpointConfig]) => {
        const bp = DEFAULT_BREAKPOINTS.find(b => b.name === breakpoint)
        if (bp) {
          const mediaQuery = bp.maxWidth 
            ? `@media (min-width: ${bp.minWidth}px) and (max-width: ${bp.maxWidth}px)`
            : `@media (min-width: ${bp.minWidth}px)`

          css += `\n${mediaQuery} {\n`
          css += `  .container {\n`
          
          if (breakpointConfig.maxWidth) {
            css += `    max-width: ${LayoutUtils.convertSize(breakpointConfig.maxWidth)};\n`
          }
          if (breakpointConfig.padding) {
            css += `    padding-left: ${LayoutUtils.convertSize(breakpointConfig.padding)};\n`
            css += `    padding-right: ${LayoutUtils.convertSize(breakpointConfig.padding)};\n`
          }
          if (breakpointConfig.margin) {
            css += `    margin-left: ${LayoutUtils.convertSize(breakpointConfig.margin)};\n`
            css += `    margin-right: ${LayoutUtils.convertSize(breakpointConfig.margin)};\n`
          }
          
          css += `  }\n`
          css += '}\n'
        }
      })
    }

    return css
  }
}