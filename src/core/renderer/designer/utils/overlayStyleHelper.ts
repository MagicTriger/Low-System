/**
 * 浮层样式辅助工具
 * 确保浮层内组件的样式正确渲染
 */

import type { Control } from '@/core/types'
import { GenerateControlCommonStyle } from '../../style-generate'

/**
 * 为浮层内的控件生成样式
 * 确保样式与页面画布一致
 */
export function generateOverlayControlStyle(control: Control): Record<string, any> {
  // 使用标准的样式生成函数
  const baseStyles = GenerateControlCommonStyle(control)

  // 确保浮层内的组件有正确的定位上下文
  const overlayStyles: Record<string, any> = {
    ...baseStyles,
  }

  // 如果组件没有明确的position，在浮层内默认使用relative
  if (!overlayStyles.position) {
    overlayStyles.position = 'relative'
  }

  // 确保z-index正确设置
  if (overlayStyles.position === 'absolute' || overlayStyles.position === 'fixed') {
    if (!overlayStyles.zIndex) {
      overlayStyles.zIndex = 1
    }
  }

  return overlayStyles
}

/**
 * 检查控件是否在浮层内
 */
export function isControlInOverlay(controlId: string, overlays: any[]): boolean {
  for (const overlay of overlays) {
    if (findControlInChildren(controlId, overlay.children || [])) {
      return true
    }
  }
  return false
}

/**
 * 在子控件中查找指定ID的控件
 */
function findControlInChildren(controlId: string, children: Control[]): boolean {
  for (const child of children) {
    if (child.id === controlId) {
      return true
    }
    if (child.children && findControlInChildren(controlId, child.children)) {
      return true
    }
  }
  return false
}

/**
 * 获取浮层容器的样式配置
 *
 * @deprecated This function is primarily used by the deprecated OverlayContainer component.
 * For Modal component, use the built-in Ant Design Modal styling instead.
 * Kept for backward compatibility.
 */
export function getOverlayContainerStyles(containerType: string, containerProps: any): Record<string, any> {
  const styles: Record<string, any> = {
    position: 'relative',
    width: '100%',
    minHeight: '100px',
  }

  switch (containerType) {
    case 'flex':
      styles.display = 'flex'
      styles.flexDirection = containerProps.direction || 'column'
      styles.justifyContent = containerProps.justify || 'flex-start'
      styles.alignItems = containerProps.align || 'stretch'
      if (containerProps.gap !== undefined) {
        styles.gap = `${containerProps.gap}px`
      }
      break

    case 'grid':
      styles.display = 'grid'
      if (containerProps.columns) {
        styles.gridTemplateColumns = `repeat(${containerProps.columns}, 1fr)`
      }
      if (containerProps.rows) {
        styles.gridTemplateRows = `repeat(${containerProps.rows}, 1fr)`
      }
      if (containerProps.columnGap !== undefined) {
        styles.columnGap = `${containerProps.columnGap}px`
      }
      if (containerProps.rowGap !== undefined) {
        styles.rowGap = `${containerProps.rowGap}px`
      }
      break

    case 'custom':
      if (containerProps.customStyle) {
        Object.assign(styles, containerProps.customStyle)
      }
      break
  }

  return styles
}

/**
 * 标准化CSS值
 * 确保数值类型的属性有正确的单位
 */
export function normalizeCssValue(property: string, value: any): string {
  if (value === null || value === undefined || value === '') {
    return ''
  }

  if (typeof value === 'number') {
    // 需要单位的属性
    const needsUnit = [
      'width',
      'height',
      'minWidth',
      'minHeight',
      'maxWidth',
      'maxHeight',
      'top',
      'right',
      'bottom',
      'left',
      'margin',
      'marginTop',
      'marginRight',
      'marginBottom',
      'marginLeft',
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'borderWidth',
      'borderRadius',
      'fontSize',
      'lineHeight',
      'gap',
      'columnGap',
      'rowGap',
    ]

    if (needsUnit.includes(property)) {
      return `${value}px`
    }
  }

  return String(value)
}

/**
 * 合并样式对象
 * 后面的样式会覆盖前面的样式
 */
export function mergeStyles(...styleObjects: Record<string, any>[]): Record<string, any> {
  return Object.assign({}, ...styleObjects)
}

/**
 * 确保浮层内组件的拖拽和调整大小功能正常
 */
export function ensureOverlayControlInteractive(control: Control): Control {
  // 确保控件有必要的属性以支持交互
  return {
    ...control,
    // 保持原有属性不变
  }
}

/**
 * 验证浮层内组件的样式是否有效
 */
export function validateOverlayControlStyles(control: Control): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  // 检查必要的样式属性
  if (control.styles) {
    // 检查position值是否有效
    if (control.styles.position) {
      const validPositions = ['static', 'relative', 'absolute', 'fixed', 'sticky']
      if (!validPositions.includes(control.styles.position)) {
        errors.push(`Invalid position value: ${control.styles.position}`)
      }
    }

    // 检查display值是否有效
    if (control.styles.display) {
      const validDisplays = ['block', 'inline', 'inline-block', 'flex', 'grid', 'none']
      if (!validDisplays.includes(control.styles.display)) {
        errors.push(`Invalid display value: ${control.styles.display}`)
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
