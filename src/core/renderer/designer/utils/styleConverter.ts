import type { Control, ControlSize } from '@/core/renderer/base'

/**
 * 将ControlSize转换为CSS值
 */
export function sizeToCSS(size?: ControlSize): string | undefined {
  if (!size || !size.type || size.type === 'none') return undefined
  if (size.value === undefined || size.value === null) return undefined
  return `${size.value}${size.type}`
}

/**
 * 将Control配置转换为CSS样式对象
 */
export function controlToStyles(control: Control): Record<string, any> {
  const styles: Record<string, any> = {}

  // 布局配置
  if (control.layout) {
    const layout = control.layout

    // 尺寸
    if (layout.width) styles.width = sizeToCSS(layout.width)
    if (layout.height) styles.height = sizeToCSS(layout.height)
    if (layout.minWidth) styles.minWidth = sizeToCSS(layout.minWidth)
    if (layout.minHeight) styles.minHeight = sizeToCSS(layout.minHeight)
    if (layout.maxWidth) styles.maxWidth = sizeToCSS(layout.maxWidth)
    if (layout.maxHeight) styles.maxHeight = sizeToCSS(layout.maxHeight)

    // 内边距
    if (layout.padding) styles.padding = layout.padding
    if (layout.paddingTop) styles.paddingTop = sizeToCSS(layout.paddingTop)
    if (layout.paddingRight) styles.paddingRight = sizeToCSS(layout.paddingRight)
    if (layout.paddingBottom) styles.paddingBottom = sizeToCSS(layout.paddingBottom)
    if (layout.paddingLeft) styles.paddingLeft = sizeToCSS(layout.paddingLeft)

    // 外边距
    if (layout.margin) styles.margin = layout.margin
    if (layout.marginTop) styles.marginTop = sizeToCSS(layout.marginTop)
    if (layout.marginRight) styles.marginRight = sizeToCSS(layout.marginRight)
    if (layout.marginBottom) styles.marginBottom = sizeToCSS(layout.marginBottom)
    if (layout.marginLeft) styles.marginLeft = sizeToCSS(layout.marginLeft)

    // Flex布局
    if (layout.flexDirection) styles.flexDirection = layout.flexDirection
    if (layout.flexWrap) styles.flexWrap = layout.flexWrap
    if (layout.justifyContent) styles.justifyContent = layout.justifyContent
    if (layout.alignItems) styles.alignItems = layout.alignItems
    if (layout.alignContent) styles.alignContent = layout.alignContent
    if (layout.columnGap) styles.columnGap = sizeToCSS(layout.columnGap)
    if (layout.rowGap) styles.rowGap = sizeToCSS(layout.rowGap)

    // 溢出
    if (layout.overflowX) styles.overflowX = layout.overflowX
    if (layout.overflowY) styles.overflowY = layout.overflowY

    // 显示
    if (layout.display) styles.display = layout.display
    if (layout.verticalAlign) styles.verticalAlign = layout.verticalAlign
    if (layout.textAlign) styles.textAlign = layout.textAlign
  }

  // 定位配置
  if (control.position) {
    const position = control.position

    if (position.position) styles.position = position.position
    if (position.left) styles.left = sizeToCSS(position.left)
    if (position.right) styles.right = sizeToCSS(position.right)
    if (position.top) styles.top = sizeToCSS(position.top)
    if (position.bottom) styles.bottom = sizeToCSS(position.bottom)
    if (position.zIndex !== undefined) styles.zIndex = position.zIndex
  }

  // 字体配置
  if (control.font) {
    const font = control.font

    if (font.fontSize) styles.fontSize = sizeToCSS(font.fontSize)
    if (font.color) styles.color = font.color
    if (font.fontFamily) styles.fontFamily = font.fontFamily
    if (font.fontStyle) styles.fontStyle = font.fontStyle
    if (font.fontWeight) styles.fontWeight = font.fontWeight
    if (font.lineHeight) styles.lineHeight = sizeToCSS(font.lineHeight)
    if (font.textAlign) styles.textAlign = font.textAlign
  }

  // 边框配置
  if (control.border) {
    const border = control.border

    if (border.style && border.style !== 'none') {
      const borderWidth = sizeToCSS(border.width) || '1px'
      const borderStyle = border.style
      const borderColor = border.color || '#000000'

      if (border.position === 'all' || !border.position) {
        styles.border = `${borderWidth} ${borderStyle} ${borderColor}`
      } else {
        const prop = `border${border.position.charAt(0).toUpperCase()}${border.position.slice(1)}`
        styles[prop] = `${borderWidth} ${borderStyle} ${borderColor}`
      }
    }
  }

  // 圆角配置
  if (control.radius) {
    const radius = control.radius

    if (radius.borderRadius) {
      styles.borderRadius = sizeToCSS(radius.borderRadius)
    } else {
      if (radius.borderTopLeftRadius) styles.borderTopLeftRadius = sizeToCSS(radius.borderTopLeftRadius)
      if (radius.borderTopRightRadius) styles.borderTopRightRadius = sizeToCSS(radius.borderTopRightRadius)
      if (radius.borderBottomLeftRadius) styles.borderBottomLeftRadius = sizeToCSS(radius.borderBottomLeftRadius)
      if (radius.borderBottomRightRadius) styles.borderBottomRightRadius = sizeToCSS(radius.borderBottomRightRadius)
    }
  }

  // 背景配置
  if (control.background) {
    const bg = control.background

    // 优先使用亮色主题背景色
    if (bg.color) styles.backgroundColor = bg.color
    if (bg.image) styles.backgroundImage = `url(${bg.image})`
    if (bg.position) styles.backgroundPosition = bg.position
    if (bg.size) styles.backgroundSize = bg.size
    if (bg.repeat) styles.backgroundRepeat = bg.repeat
    if (bg.attachment) styles.backgroundAttachment = bg.attachment
  }

  // 透明度
  if (control.opacity !== undefined && control.opacity !== 100) {
    styles.opacity = control.opacity / 100
  }

  return styles
}
