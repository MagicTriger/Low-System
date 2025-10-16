import type { Control } from './base'

/**
 * 生成控件通用样式
 */
export function GenerateControlCommonStyle(control: Control): Record<string, any> {
  const styles: Record<string, any> = {}
  
  if (!control.styles) {
    return styles
  }
  
  // 基础样式映射
  const styleMapping: Record<string, string> = {
    // 尺寸
    width: 'width',
    height: 'height',
    minWidth: 'min-width',
    minHeight: 'min-height',
    maxWidth: 'max-width',
    maxHeight: 'max-height',
    
    // 定位
    position: 'position',
    top: 'top',
    right: 'right',
    bottom: 'bottom',
    left: 'left',
    zIndex: 'z-index',
    
    // 外边距
    margin: 'margin',
    marginTop: 'margin-top',
    marginRight: 'margin-right',
    marginBottom: 'margin-bottom',
    marginLeft: 'margin-left',
    
    // 内边距
    padding: 'padding',
    paddingTop: 'padding-top',
    paddingRight: 'padding-right',
    paddingBottom: 'padding-bottom',
    paddingLeft: 'padding-left',
    
    // 边框
    border: 'border',
    borderTop: 'border-top',
    borderRight: 'border-right',
    borderBottom: 'border-bottom',
    borderLeft: 'border-left',
    borderWidth: 'border-width',
    borderStyle: 'border-style',
    borderColor: 'border-color',
    borderRadius: 'border-radius',
    
    // 背景
    background: 'background',
    backgroundColor: 'background-color',
    backgroundImage: 'background-image',
    backgroundSize: 'background-size',
    backgroundPosition: 'background-position',
    backgroundRepeat: 'background-repeat',
    
    // 字体
    fontSize: 'font-size',
    fontWeight: 'font-weight',
    fontFamily: 'font-family',
    fontStyle: 'font-style',
    lineHeight: 'line-height',
    textAlign: 'text-align',
    textDecoration: 'text-decoration',
    color: 'color',
    
    // 显示
    display: 'display',
    visibility: 'visibility',
    opacity: 'opacity',
    overflow: 'overflow',
    overflowX: 'overflow-x',
    overflowY: 'overflow-y',
    
    // 弹性布局
    flexDirection: 'flex-direction',
    flexWrap: 'flex-wrap',
    justifyContent: 'justify-content',
    alignItems: 'align-items',
    alignContent: 'align-content',
    flex: 'flex',
    flexGrow: 'flex-grow',
    flexShrink: 'flex-shrink',
    flexBasis: 'flex-basis',
    alignSelf: 'align-self',
    order: 'order',
    
    // 网格布局
    gridTemplateColumns: 'grid-template-columns',
    gridTemplateRows: 'grid-template-rows',
    gridColumn: 'grid-column',
    gridRow: 'grid-row',
    gridArea: 'grid-area',
    gap: 'gap',
    
    // 变换
    transform: 'transform',
    transformOrigin: 'transform-origin',
    
    // 过渡
    transition: 'transition',
    
    // 阴影
    boxShadow: 'box-shadow',
    textShadow: 'text-shadow',
    
    // 其他
    cursor: 'cursor',
    userSelect: 'user-select',
    pointerEvents: 'pointer-events'
  }
  
  // 应用样式映射
  Object.entries(control.styles).forEach(([key, value]) => {
    const cssProperty = styleMapping[key] || key
    
    if (value !== null && value !== undefined && value !== '') {
      styles[cssProperty] = formatStyleValue(key, value)
    }
  })
  
  return styles
}

/**
 * 格式化样式值
 */
function formatStyleValue(property: string, value: any): string {
  if (typeof value === 'number') {
    // 需要单位的数值属性
    const needsUnit = [
      'width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight',
      'top', 'right', 'bottom', 'left',
      'margin', 'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
      'padding', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
      'borderWidth', 'borderRadius',
      'fontSize', 'lineHeight',
      'gap'
    ]
    
    if (needsUnit.includes(property)) {
      return `${value}px`
    }
  }
  
  return String(value)
}

/**
 * 生成响应式样式
 */
export function GenerateResponsiveStyle(control: Control, breakpoint: 'mobile' | 'tablet' | 'desktop' = 'desktop'): Record<string, any> {
  const baseStyles = GenerateControlCommonStyle(control)
  
  // 根据断点调整样式
  switch (breakpoint) {
    case 'mobile':
      return {
        ...baseStyles,
        ...generateMobileStyles(control)
      }
    case 'tablet':
      return {
        ...baseStyles,
        ...generateTabletStyles(control)
      }
    default:
      return baseStyles
  }
}

/**
 * 生成移动端样式
 */
function generateMobileStyles(control: Control): Record<string, any> {
  const styles: Record<string, any> = {}
  
  // 移动端适配
  if (control.styles?.fontSize) {
    const fontSize = parseInt(String(control.styles.fontSize))
    if (fontSize < 14) {
      styles['font-size'] = '14px' // 最小字体大小
    }
  }
  
  // 触摸友好的最小尺寸
  if (control.kind === 'button') {
    styles['min-height'] = '44px'
    styles['min-width'] = '44px'
  }
  
  return styles
}

/**
 * 生成平板样式
 */
function generateTabletStyles(control: Control): Record<string, any> {
  const styles: Record<string, any> = {}
  
  // 平板适配逻辑
  // 可以根据需要添加特定的平板样式调整
  
  return styles
}

/**
 * 生成打印样式
 */
export function GeneratePrintStyle(control: Control): Record<string, any> {
  const styles = GenerateControlCommonStyle(control)
  
  // 打印样式调整
  const printStyles: Record<string, any> = {
    ...styles,
    'color': '#000',
    'background': 'transparent',
    'box-shadow': 'none'
  }
  
  // 隐藏交互元素
  if (['button', 'input'].includes(control.kind)) {
    printStyles['display'] = 'none'
  }
  
  return printStyles
}

/**
 * 生成主题样式
 */
export function GenerateThemedStyle(control: Control, theme: 'light' | 'dark' = 'light'): Record<string, any> {
  const baseStyles = GenerateControlCommonStyle(control)
  
  if (theme === 'dark') {
    return {
      ...baseStyles,
      ...generateDarkThemeStyles(control)
    }
  }
  
  return baseStyles
}

/**
 * 生成暗色主题样式
 */
function generateDarkThemeStyles(control: Control): Record<string, any> {
  const styles: Record<string, any> = {}
  
  // 暗色主题适配
  if (!control.styles?.color) {
    styles['color'] = '#ffffff'
  }
  
  if (!control.styles?.backgroundColor) {
    styles['background-color'] = '#1f1f1f'
  }
  
  if (!control.styles?.borderColor) {
    styles['border-color'] = '#434343'
  }
  
  return styles
}

/**
 * 样式工具函数
 */
export const StyleUtils = {
  /**
   * 合并样式对象
   */
  mergeStyles(...styles: Record<string, any>[]): Record<string, any> {
    return Object.assign({}, ...styles)
  },
  
  /**
   * 转换为CSS字符串
   */
  toCssString(styles: Record<string, any>): string {
    return Object.entries(styles)
      .map(([property, value]) => `${this.kebabCase(property)}: ${value}`)
      .join('; ')
  },
  
  /**
   * 从CSS字符串解析
   */
  fromCssString(cssString: string): Record<string, any> {
    const styles: Record<string, any> = {}
    
    cssString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim())
      if (property && value) {
        styles[this.camelCase(property)] = value
      }
    })
    
    return styles
  },
  
  /**
   * 转换为kebab-case
   */
  kebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  },
  
  /**
   * 转换为camelCase
   */
  camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
  },
  
  /**
   * 检查是否为有效的CSS值
   */
  isValidCssValue(value: any): boolean {
    return value !== null && value !== undefined && value !== ''
  },
  
  /**
   * 标准化CSS值
   */
  normalizeCssValue(property: string, value: any): string {
    return formatStyleValue(property, value)
  }
}