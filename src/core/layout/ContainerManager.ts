/**
 * 容器管理器实现
 * 负责容器配置、样式计算和CSS生成
 */

import type { IContainerManager, ContainerConfig, Breakpoint } from './index'

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

  static convertSize(value: number | string, unit: string = 'px'): string {
    if (typeof value === 'string') {
      return value
    }
    return `${value}${unit}`
  }
}

class CSSGenerator {
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

const DEFAULT_CONTAINER_CONFIG: ContainerConfig = {
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
    xxl: { maxWidth: 1320, padding: 32 },
  },
}

/**
 * 容器管理器实现
 */
export class ContainerManager implements IContainerManager {
  private config: ContainerConfig
  private breakpoints: Breakpoint[]

  constructor(config: Partial<ContainerConfig> = {}, breakpoints: Breakpoint[] = DEFAULT_BREAKPOINTS) {
    this.config = { ...DEFAULT_CONTAINER_CONFIG, ...config }
    this.breakpoints = [...breakpoints]
  }

  /**
   * 获取容器配置
   */
  getConfig(): ContainerConfig {
    return { ...this.config }
  }

  /**
   * 设置容器配置
   */
  setConfig(config: Partial<ContainerConfig>): void {
    this.config = { ...this.config, ...config }
  }

  /**
   * 获取容器样式
   */
  getContainerStyles(): Record<string, any> {
    const styles: Record<string, any> = {
      width: '100%',
      marginLeft: LayoutUtils.convertSize(this.config.margin || 'auto'),
      marginRight: LayoutUtils.convertSize(this.config.margin || 'auto'),
      paddingLeft: LayoutUtils.convertSize(this.config.padding || 15),
      paddingRight: LayoutUtils.convertSize(this.config.padding || 15),
    }

    if (!this.config.fluid && this.config.maxWidth) {
      styles.maxWidth = LayoutUtils.convertSize(this.config.maxWidth)
    }

    return styles
  }

  /**
   * 获取响应式样式
   */
  getResponsiveStyles(): Record<string, Record<string, any>> {
    const responsiveStyles: Record<string, Record<string, any>> = {}

    if (this.config.breakpoints) {
      Object.entries(this.config.breakpoints).forEach(([breakpointName, breakpointConfig]) => {
        const styles: Record<string, any> = {}

        if (breakpointConfig.maxWidth !== undefined) {
          styles.maxWidth = LayoutUtils.convertSize(breakpointConfig.maxWidth)
        }

        if (breakpointConfig.padding !== undefined) {
          styles.paddingLeft = LayoutUtils.convertSize(breakpointConfig.padding)
          styles.paddingRight = LayoutUtils.convertSize(breakpointConfig.padding)
        }

        if (breakpointConfig.margin !== undefined) {
          styles.marginLeft = LayoutUtils.convertSize(breakpointConfig.margin)
          styles.marginRight = LayoutUtils.convertSize(breakpointConfig.margin)
        }

        if (Object.keys(styles).length > 0) {
          responsiveStyles[breakpointName] = styles
        }
      })
    }

    return responsiveStyles
  }

  /**
   * 生成容器CSS
   */
  generateContainerCSS(): string {
    return CSSGenerator.generateContainerCSS(this.config)
  }

  /**
   * 获取当前断点的容器样式
   */
  getCurrentBreakpointStyles(): Record<string, any> {
    if (typeof window === 'undefined') {
      return this.getContainerStyles()
    }

    const width = LayoutUtils.getViewportWidth()
    const breakpointName = LayoutUtils.getBreakpointName(width, this.breakpoints)

    const baseStyles = this.getContainerStyles()
    const responsiveStyles = this.getResponsiveStyles()

    if (responsiveStyles[breakpointName]) {
      return { ...baseStyles, ...responsiveStyles[breakpointName] }
    }

    return baseStyles
  }

  /**
   * 检查是否为流式容器
   */
  isFluid(): boolean {
    return this.config.fluid
  }

  /**
   * 设置流式模式
   */
  setFluid(fluid: boolean): void {
    this.config.fluid = fluid
  }

  /**
   * 获取最大宽度
   */
  getMaxWidth(): number | string | undefined {
    return this.config.maxWidth
  }

  /**
   * 设置最大宽度
   */
  setMaxWidth(maxWidth: number | string | undefined): void {
    this.config.maxWidth = maxWidth
  }

  /**
   * 获取内边距
   */
  getPadding(): number | string | undefined {
    return this.config.padding
  }

  /**
   * 设置内边距
   */
  setPadding(padding: number | string | undefined): void {
    this.config.padding = padding
  }

  /**
   * 获取外边距
   */
  getMargin(): number | string | undefined {
    return this.config.margin
  }

  /**
   * 设置外边距
   */
  setMargin(margin: number | string | undefined): void {
    this.config.margin = margin
  }

  /**
   * 添加断点配置
   */
  addBreakpointConfig(
    breakpointName: string,
    config: {
      maxWidth?: number | string
      padding?: number | string
      margin?: number | string
    }
  ): void {
    if (!this.config.breakpoints) {
      this.config.breakpoints = {}
    }
    this.config.breakpoints[breakpointName] = config
  }

  /**
   * 移除断点配置
   */
  removeBreakpointConfig(breakpointName: string): void {
    if (this.config.breakpoints) {
      delete this.config.breakpoints[breakpointName]
    }
  }

  /**
   * 获取断点配置
   */
  getBreakpointConfig(breakpointName: string):
    | {
        maxWidth?: number | string
        padding?: number | string
        margin?: number | string
      }
    | undefined {
    return this.config.breakpoints?.[breakpointName]
  }

  /**
   * 计算容器的实际宽度
   */
  calculateActualWidth(): number {
    if (typeof window === 'undefined') {
      return 0
    }

    const viewportWidth = LayoutUtils.getViewportWidth()

    if (this.config.fluid) {
      return viewportWidth
    }

    const maxWidth = this.getEffectiveMaxWidth()
    if (typeof maxWidth === 'number') {
      return Math.min(viewportWidth, maxWidth)
    }

    return viewportWidth
  }

  /**
   * 获取有效的最大宽度
   */
  private getEffectiveMaxWidth(): number | string | undefined {
    if (typeof window === 'undefined') {
      return this.config.maxWidth
    }

    const width = LayoutUtils.getViewportWidth()
    const breakpointName = LayoutUtils.getBreakpointName(width, this.breakpoints)

    const breakpointConfig = this.getBreakpointConfig(breakpointName)
    if (breakpointConfig?.maxWidth !== undefined) {
      return breakpointConfig.maxWidth
    }

    return this.config.maxWidth
  }

  /**
   * 验证容器配置
   */
  validateConfig(config: Partial<ContainerConfig>): string[] {
    const errors: string[] = []

    if (config.maxWidth !== undefined) {
      if (typeof config.maxWidth === 'number' && config.maxWidth <= 0) {
        errors.push('MaxWidth must be a positive number')
      }
    }

    if (config.padding !== undefined) {
      if (typeof config.padding === 'number' && config.padding < 0) {
        errors.push('Padding must be a non-negative number')
      }
    }

    if (config.breakpoints) {
      Object.entries(config.breakpoints).forEach(([breakpointName, breakpointConfig]) => {
        if (breakpointConfig.maxWidth !== undefined) {
          if (typeof breakpointConfig.maxWidth === 'number' && breakpointConfig.maxWidth <= 0) {
            errors.push(`Breakpoint "${breakpointName}" maxWidth must be a positive number`)
          }
        }

        if (breakpointConfig.padding !== undefined) {
          if (typeof breakpointConfig.padding === 'number' && breakpointConfig.padding < 0) {
            errors.push(`Breakpoint "${breakpointName}" padding must be a non-negative number`)
          }
        }
      })
    }

    return errors
  }

  /**
   * 克隆容器管理器
   */
  clone(): ContainerManager {
    return new ContainerManager(this.config, this.breakpoints)
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...DEFAULT_CONTAINER_CONFIG }
  }

  /**
   * 获取容器统计信息
   */
  getStats(): {
    isFluid: boolean
    maxWidth?: number | string
    padding?: number | string
    margin?: number | string
    breakpointCount: number
    actualWidth: number
    currentBreakpoint?: string
  } {
    const width = typeof window !== 'undefined' ? LayoutUtils.getViewportWidth() : 0
    const breakpointName = typeof window !== 'undefined' ? LayoutUtils.getBreakpointName(width, this.breakpoints) : undefined

    return {
      isFluid: this.config.fluid,
      maxWidth: this.config.maxWidth,
      padding: this.config.padding,
      margin: this.config.margin,
      breakpointCount: Object.keys(this.config.breakpoints || {}).length,
      actualWidth: this.calculateActualWidth(),
      currentBreakpoint: breakpointName,
    }
  }

  /**
   * 生成内联样式字符串
   */
  generateInlineStyles(): string {
    const styles = this.getCurrentBreakpointStyles()

    return Object.entries(styles)
      .map(([property, value]) => {
        const cssProperty = property.replace(/([A-Z])/g, '-$1').toLowerCase()
        return `${cssProperty}: ${value}`
      })
      .join('; ')
  }

  /**
   * 生成CSS变量
   */
  generateCSSVariables(): Record<string, string> {
    const variables: Record<string, string> = {}

    if (this.config.maxWidth) {
      variables['--container-max-width'] = LayoutUtils.convertSize(this.config.maxWidth)
    }

    if (this.config.padding) {
      variables['--container-padding'] = LayoutUtils.convertSize(this.config.padding)
    }

    if (this.config.margin) {
      variables['--container-margin'] = LayoutUtils.convertSize(this.config.margin)
    }

    // 断点变量
    if (this.config.breakpoints) {
      Object.entries(this.config.breakpoints).forEach(([breakpointName, breakpointConfig]) => {
        if (breakpointConfig.maxWidth) {
          variables[`--container-${breakpointName}-max-width`] = LayoutUtils.convertSize(breakpointConfig.maxWidth)
        }

        if (breakpointConfig.padding) {
          variables[`--container-${breakpointName}-padding`] = LayoutUtils.convertSize(breakpointConfig.padding)
        }

        if (breakpointConfig.margin) {
          variables[`--container-${breakpointName}-margin`] = LayoutUtils.convertSize(breakpointConfig.margin)
        }
      })
    }

    return variables
  }
}

/**
 * 创建容器管理器实例
 */
export function createContainerManager(config?: Partial<ContainerConfig>, breakpoints?: Breakpoint[]): ContainerManager {
  return new ContainerManager(config, breakpoints)
}

/**
 * 预设容器配置
 */
export const PRESET_CONTAINER_CONFIGS = {
  /**
   * Bootstrap风格容器
   */
  bootstrap: {
    fluid: false,
    maxWidth: 1140,
    padding: 15,
    margin: 'auto',
    breakpoints: {
      sm: { maxWidth: 540 },
      md: { maxWidth: 720 },
      lg: { maxWidth: 960 },
      xl: { maxWidth: 1140 },
      xxl: { maxWidth: 1320 },
    },
  },

  /**
   * Material Design容器
   */
  material: {
    fluid: false,
    maxWidth: 1200,
    padding: 16,
    margin: 'auto',
    breakpoints: {
      xs: { padding: 16 },
      sm: { padding: 24 },
      md: { padding: 24 },
      lg: { padding: 24 },
      xl: { padding: 24 },
    },
  },

  /**
   * 流式容器
   */
  fluid: {
    fluid: true,
    padding: 20,
    margin: 0,
  },

  /**
   * 紧凑容器
   */
  compact: {
    fluid: false,
    maxWidth: 960,
    padding: 12,
    margin: 'auto',
  },

  /**
   * 宽松容器
   */
  spacious: {
    fluid: false,
    maxWidth: 1400,
    padding: 32,
    margin: 'auto',
  },
}

/**
 * 全局容器管理器实例
 */
let globalContainerManager: ContainerManager | null = null

/**
 * 获取全局容器管理器实例
 */
export function getGlobalContainerManager(): ContainerManager {
  if (!globalContainerManager) {
    globalContainerManager = createContainerManager()
  }
  return globalContainerManager
}

/**
 * 设置全局容器管理器实例
 */
export function setGlobalContainerManager(manager: ContainerManager): void {
  globalContainerManager = manager
}

/**
 * 重置全局容器管理器实例
 */
export function resetGlobalContainerManager(): void {
  globalContainerManager = null
}
