/**
 * 网格系统实现
 * 负责网格配置、列计算、响应式工具和CSS生成
 */

import type { IGridSystem, GridConfig, ResponsiveConfig, Breakpoint } from './index'

// 避免循环依赖，定义本地工具类
class LayoutUtils {
  static getViewportWidth(): number {
    return typeof window !== 'undefined' ? window.innerWidth : 0
  }

  static getBreakpointName(width: number, breakpoints: Breakpoint[]): string {
    for (const breakpoint of breakpoints) {
      if (width >= breakpoint.minWidth && (!breakpoint.maxWidth || width <= breakpoint.maxWidth)) {
        return breakpoint.name
      }
    }
    return breakpoints[breakpoints.length - 1]?.name || 'xl'
  }

  static generateResponsiveClass(prefix: string, breakpoint: string, value: string | number): string {
    return breakpoint === 'xs' ? `${prefix}-${value}` : `${prefix}-${breakpoint}-${value}`
  }

  static matchMedia(query: string): boolean {
    if (typeof window === 'undefined') {
      return false
    }
    return window.matchMedia(query).matches
  }
}

class CSSGenerator {
  static generateGridCSS(config: GridConfig): string {
    const { columns, gutter, margin, breakpoints } = config
    let css = ''

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

    breakpoints.forEach(breakpoint => {
      const mediaQuery = breakpoint.maxWidth
        ? `@media (min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px)`
        : `@media (min-width: ${breakpoint.minWidth}px)`

      css += `\n${mediaQuery} {\n`

      if (config.maxWidth) {
        css += `  .container { max-width: ${config.maxWidth}px; }\n`
      }

      for (let i = 1; i <= breakpoint.columns; i++) {
        const width = (100 / breakpoint.columns) * i
        css += `  .col-${breakpoint.name}-${i} { flex: 0 0 ${width}%; max-width: ${width}%; }\n`
      }

      for (let i = 0; i < breakpoint.columns; i++) {
        const offset = (100 / breakpoint.columns) * i
        css += `  .offset-${breakpoint.name}-${i} { margin-left: ${offset}%; }\n`
      }

      css += '}\n'
    })

    return css
  }

  static generateUtilityCSS(breakpoints: Breakpoint[]): string {
    let css = ''
    const displayValues = ['none', 'block', 'inline', 'inline-block', 'flex', 'inline-flex', 'grid']

    breakpoints.forEach(breakpoint => {
      const mediaQuery = breakpoint.maxWidth
        ? `@media (min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px)`
        : `@media (min-width: ${breakpoint.minWidth}px)`

      css += `\n${mediaQuery} {\n`

      displayValues.forEach(value => {
        css += `  .d-${breakpoint.name}-${value} { display: ${value} !important; }\n`
      })

      const textAlignValues = ['left', 'center', 'right', 'justify']
      textAlignValues.forEach(value => {
        css += `  .text-${breakpoint.name}-${value} { text-align: ${value} !important; }\n`
      })

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
}

// 避免循环依赖，直接定义默认配置
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

const DEFAULT_GRID_CONFIG: GridConfig = {
  columns: 12,
  gutter: 24,
  margin: 32,
  maxWidth: 1200,
  breakpoints: DEFAULT_BREAKPOINTS,
}

/**
 * 网格系统实现
 */
export class GridSystem implements IGridSystem {
  private config: GridConfig

  constructor(config: Partial<GridConfig> = {}) {
    this.config = { ...DEFAULT_GRID_CONFIG, ...config }
  }

  /**
   * 获取网格配置
   */
  getConfig(): GridConfig {
    return { ...this.config }
  }

  /**
   * 设置网格配置
   */
  setConfig(config: Partial<GridConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取列宽度
   */
  getColumnWidth(columns: number, totalColumns?: number): string {
    const total = totalColumns || this.config.columns
    const percentage = (100 / total) * columns
    return `${percentage}%`
  }

  /**
   * 获取列偏移
   */
  getColumnOffset(offset: number, totalColumns?: number): string {
    const total = totalColumns || this.config.columns
    const percentage = (100 / total) * offset
    return `${percentage}%`
  }

  /**
   * 获取响应式值
   */
  getResponsiveValue<T>(config: ResponsiveConfig, defaultValue: T): T {
    if (typeof window === 'undefined') {
      return defaultValue
    }

    const width = LayoutUtils.getViewportWidth()
    const breakpointName = LayoutUtils.getBreakpointName(width, this.config.breakpoints)

    // 按优先级查找值
    const priorities = ['xxl', 'xl', 'lg', 'md', 'sm', 'xs']
    const currentIndex = priorities.indexOf(breakpointName)

    // 从当前断点开始向下查找
    for (let i = currentIndex; i < priorities.length; i++) {
      const key = priorities[i] as keyof ResponsiveConfig
      if (config[key] !== undefined) {
        return config[key] as T
      }
    }

    return defaultValue
  }

  /**
   * 生成响应式类名
   */
  generateResponsiveClasses(prefix: string, config: ResponsiveConfig): string[] {
    const classes: string[] = []

    Object.entries(config).forEach(([breakpoint, value]) => {
      if (value !== undefined && value !== null) {
        const className = LayoutUtils.generateResponsiveClass(prefix, breakpoint, value)
        classes.push(className)
      }
    })

    return classes
  }

  /**
   * 生成网格CSS
   */
  generateGridCSS(): string {
    return CSSGenerator.generateGridCSS(this.config)
  }

  /**
   * 生成工具类CSS
   */
  generateUtilityCSS(): string {
    return CSSGenerator.generateUtilityCSS(this.config.breakpoints)
  }

  /**
   * 计算网格项样式
   */
  calculateGridItemStyles(columns: number, offset: number = 0, breakpoint?: string): Record<string, any> {
    const totalColumns = this.config.columns
    const gutter = this.config.gutter

    const styles: Record<string, any> = {
      position: 'relative',
      width: '100%',
      paddingLeft: `${gutter / 2}px`,
      paddingRight: `${gutter / 2}px`,
      flex: `0 0 ${this.getColumnWidth(columns, totalColumns)}`,
      maxWidth: this.getColumnWidth(columns, totalColumns),
    }

    if (offset > 0) {
      styles.marginLeft = this.getColumnOffset(offset, totalColumns)
    }

    return styles
  }

  /**
   * 计算容器样式
   */
  calculateContainerStyles(): Record<string, any> {
    return {
      width: '100%',
      paddingLeft: `${this.config.margin}px`,
      paddingRight: `${this.config.margin}px`,
      marginLeft: 'auto',
      marginRight: 'auto',
      maxWidth: this.config.maxWidth ? `${this.config.maxWidth}px` : undefined,
    }
  }

  /**
   * 计算行样式
   */
  calculateRowStyles(): Record<string, any> {
    const gutter = this.config.gutter

    return {
      display: 'flex',
      flexWrap: 'wrap',
      marginLeft: `-${gutter / 2}px`,
      marginRight: `-${gutter / 2}px`,
    }
  }

  /**
   * 获取断点媒体查询
   */
  getBreakpointMediaQuery(breakpoint: Breakpoint): string {
    if (breakpoint.maxWidth) {
      return `(min-width: ${breakpoint.minWidth}px) and (max-width: ${breakpoint.maxWidth}px)`
    } else {
      return `(min-width: ${breakpoint.minWidth}px)`
    }
  }

  /**
   * 检查当前是否匹配断点
   */
  matchesBreakpoint(breakpoint: Breakpoint): boolean {
    const mediaQuery = this.getBreakpointMediaQuery(breakpoint)
    return LayoutUtils.matchMedia(mediaQuery)
  }

  /**
   * 获取当前活跃断点
   */
  getCurrentBreakpoint(): Breakpoint | null {
    for (const breakpoint of this.config.breakpoints) {
      if (this.matchesBreakpoint(breakpoint)) {
        return breakpoint
      }
    }
    return null
  }

  /**
   * 生成响应式网格类
   */
  generateResponsiveGridClasses(columns: ResponsiveConfig, offset?: ResponsiveConfig, order?: ResponsiveConfig): string[] {
    const classes: string[] = []

    // 列宽度类
    classes.push(...this.generateResponsiveClasses('col', columns))

    // 偏移类
    if (offset) {
      classes.push(...this.generateResponsiveClasses('offset', offset))
    }

    // 排序类
    if (order) {
      classes.push(...this.generateResponsiveClasses('order', order))
    }

    return classes
  }

  /**
   * 验证网格配置
   */
  validateConfig(config: Partial<GridConfig>): string[] {
    const errors: string[] = []

    if (config.columns !== undefined) {
      if (!Number.isInteger(config.columns) || config.columns <= 0) {
        errors.push('Columns must be a positive integer')
      }
    }

    if (config.gutter !== undefined) {
      if (typeof config.gutter !== 'number' || config.gutter < 0) {
        errors.push('Gutter must be a non-negative number')
      }
    }

    if (config.margin !== undefined) {
      if (typeof config.margin !== 'number' || config.margin < 0) {
        errors.push('Margin must be a non-negative number')
      }
    }

    if (config.maxWidth !== undefined) {
      if (typeof config.maxWidth !== 'number' || config.maxWidth <= 0) {
        errors.push('MaxWidth must be a positive number')
      }
    }

    if (config.breakpoints) {
      // 验证断点配置
      const sortedBreakpoints = [...config.breakpoints].sort((a, b) => a.minWidth - b.minWidth)

      for (let i = 0; i < sortedBreakpoints.length; i++) {
        const bp = sortedBreakpoints[i]

        if (!bp.name || typeof bp.name !== 'string') {
          errors.push(`Breakpoint at index ${i} must have a valid name`)
        }

        if (typeof bp.minWidth !== 'number' || bp.minWidth < 0) {
          errors.push(`Breakpoint "${bp.name}" must have a valid minWidth`)
        }

        if (bp.maxWidth !== undefined && (typeof bp.maxWidth !== 'number' || bp.maxWidth <= bp.minWidth)) {
          errors.push(`Breakpoint "${bp.name}" maxWidth must be greater than minWidth`)
        }

        // 检查重叠
        if (i > 0) {
          const prevBp = sortedBreakpoints[i - 1]
          if (prevBp.maxWidth && bp.minWidth <= prevBp.maxWidth) {
            errors.push(`Breakpoint "${bp.name}" overlaps with "${prevBp.name}"`)
          }
        }
      }
    }

    return errors
  }

  /**
   * 克隆网格系统
   */
  clone(): GridSystem {
    return new GridSystem(this.config)
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...DEFAULT_GRID_CONFIG }
  }

  /**
   * 获取网格统计信息
   */
  getStats(): {
    totalColumns: number
    breakpointCount: number
    gutterSize: number
    marginSize: number
    maxWidth?: number
    activeBreakpoint?: string
  } {
    const currentBreakpoint = this.getCurrentBreakpoint()

    return {
      totalColumns: this.config.columns,
      breakpointCount: this.config.breakpoints.length,
      gutterSize: this.config.gutter,
      marginSize: this.config.margin,
      maxWidth: this.config.maxWidth,
      activeBreakpoint: currentBreakpoint?.name,
    }
  }
}

/**
 * 网格系统工厂函数
 */
export function createGridSystem(config?: Partial<GridConfig>): GridSystem {
  return new GridSystem(config)
}

/**
 * 预设网格系统
 */
export const PRESET_GRID_SYSTEMS = {
  /**
   * Bootstrap风格网格系统
   */
  bootstrap: createGridSystem({
    columns: 12,
    gutter: 30,
    margin: 15,
    maxWidth: 1140,
  }),

  /**
   * Material Design网格系统
   */
  material: createGridSystem({
    columns: 12,
    gutter: 16,
    margin: 16,
    maxWidth: 1200,
  }),

  /**
   * Ant Design网格系统
   */
  antd: createGridSystem({
    columns: 24,
    gutter: 16,
    margin: 24,
    maxWidth: 1200,
  }),

  /**
   * 紧凑型网格系统
   */
  compact: createGridSystem({
    columns: 12,
    gutter: 8,
    margin: 8,
    maxWidth: 960,
  }),

  /**
   * 宽松型网格系统
   */
  spacious: createGridSystem({
    columns: 12,
    gutter: 40,
    margin: 40,
    maxWidth: 1400,
  }),
}

/**
 * 全局网格系统实例
 */
let globalGridSystem: GridSystem | null = null

/**
 * 获取全局网格系统实例
 */
export function getGlobalGridSystem(): GridSystem {
  if (!globalGridSystem) {
    globalGridSystem = createGridSystem()
  }
  return globalGridSystem
}

/**
 * 设置全局网格系统实例
 */
export function setGlobalGridSystem(gridSystem: GridSystem): void {
  globalGridSystem = gridSystem
}

/**
 * 重置全局网格系统实例
 */
export function resetGlobalGridSystem(): void {
  globalGridSystem = null
}
