import type { Control, ControlNode, View, RootView, DataBinding, EventExecution, ControlNodeType, RootViewMode } from '../types'
import { ControlType } from '../types'

// 导出类型定义
export type { Control, ControlNode, View, RootView, DataBinding, EventExecution, ControlNodeType, RootViewMode }

export { ControlType }

// 控件尺寸类型
export enum ControlSizeType {
  None = 'none',
  Percent = '%',
  Rem = 'rem',
  Pixel = 'px',
}

// 控件尺寸
export interface ControlSize {
  type?: ControlSizeType
  value?: number
}

// 控件溢出类型
export enum ControlOverflowType {
  Auto = 'auto',
  Scroll = 'scroll',
  Hidden = 'hidden',
  Visible = 'visible',
}

// 控件定位配置
export interface ControlPosition {
  position?: 'absolute' | 'relative' | 'fixed' | 'sticky'
  left?: ControlSize
  right?: ControlSize
  top?: ControlSize
  bottom?: ControlSize
  zIndex?: number
}

// 控件布局配置
export interface ControlLayout {
  width?: ControlSize
  minWidth?: ControlSize
  maxWidth?: ControlSize
  height?: ControlSize
  minHeight?: ControlSize
  maxHeight?: ControlSize
  overflowX?: ControlOverflowType
  overflowY?: ControlOverflowType
  padding?: string
  paddingTop?: ControlSize
  paddingRight?: ControlSize
  paddingBottom?: ControlSize
  paddingLeft?: ControlSize
  margin?: string
  marginTop?: ControlSize
  marginRight?: ControlSize
  marginBottom?: ControlSize
  marginLeft?: ControlSize
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
  columnGap?: ControlSize
  rowGap?: ControlSize
  verticalAlign?: 'baseline' | 'top' | 'middle' | 'bottom' | 'text-top' | 'text-bottom'
  textAlign?: 'left' | 'center' | 'right' | 'justify'
  display?: 'block' | 'inline' | 'inline-block' | 'flex' | 'grid' | 'none'
}

// 控件字体配置
export interface ControlFont {
  fontSize?: ControlSize
  color?: string
  fontFamily?: string
  fontStyle?: 'normal' | 'italic'
  fontWeight?: number | string
  lineHeight?: ControlSize
  textAlign?: 'left' | 'center' | 'right' | 'justify'
}

// 控件边框配置
export interface ControlBorder {
  position?: 'top' | 'left' | 'right' | 'bottom' | 'all'
  style?: 'none' | 'solid' | 'dashed' | 'dotted' | 'double'
  width?: ControlSize
  color?: string
  image?: string
}

// 控件圆角配置
export interface ControlBorderRadius {
  borderRadius?: ControlSize
  borderTopLeftRadius?: ControlSize
  borderTopRightRadius?: ControlSize
  borderBottomLeftRadius?: ControlSize
  borderBottomRightRadius?: ControlSize
}

// 控件背景配置
export interface ControlBackground {
  color?: string
  darkColor?: string
  image?: string
  position?: string
  size?: string
  repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' | 'round' | 'space'
  attachment?: string
  origin?: string
}

// 控件渲染器属性接口
export interface ControlRendererProps<T extends Control = Control> {
  control: T
}

// 根视图渲染器属性接口
export interface RootViewRendererProps {
  page: any
  mode?: RootViewMode
  data?: any
}

// 面板配置接口
export interface ComponentPanelDefinition {
  /**
   * 继承的通用面板组
   * 可选值: 'basic', 'layout', 'style', 'event'
   */
  extends?: string[]

  /**
   * 组件特定的自定义面板配置
   */
  custom?: any[]
}

// 控件定义基础接口
export interface BaseControlDefinition {
  kind: string
  kindName: string
  type: ControlType
  icon?: string
  component: any
  dataBindable?: boolean
  canHaveChildren?: boolean // 标记组件是否可以包含子组件
  events?: Record<string, any>
  hidden?: boolean
  isOverlay?: boolean // 标记为浮层专用组件

  /**
   * 属性面板配置
   * 定义组件在属性面板中显示的字段和面板
   */
  panels?: ComponentPanelDefinition
}

// 样式生成函数类型
export type StyleGenerator = (control: Control) => Record<string, any>

// 事件处理函数类型
export type EventHandler = (event: string, ...args: any[]) => Promise<boolean>

// 控件实例方法接口
export interface ControlMethods {
  focus?: () => void
  blur?: () => void
  validate?: () => Promise<boolean>
  reset?: () => void
  getValue?: () => any
  setValue?: (value: any) => void
  [key: string]: any
}

// 控件实例引用接口
export interface ControlRef {
  id: string
  control: Control
  methods?: ControlMethods
  element?: HTMLElement
}

// 渲染上下文接口
export interface RenderContext {
  mode: RootViewMode
  zoom?: number
  readonly?: boolean
  preview?: boolean
}

// 控件树节点构建器
export class ControlTreeBuilder {
  static build(controls: Control[], parent?: ControlNode): Record<string, ControlNode> {
    const tree: Record<string, ControlNode> = {}

    const processControl = (control: Control, parentNode?: ControlNode): ControlNode => {
      const node: ControlNode = {
        id: control.id,
        control,
        parent: parentNode,
        children: [],
        type: 'control' as ControlNodeType,
      }

      tree[control.id] = node

      if (control.children) {
        control.children.forEach(child => {
          const childNode = processControl(child, node)
          node.children.push(childNode)
        })
      }

      return node
    }

    controls.forEach(control => processControl(control, parent))

    return tree
  }
}

// 控件工厂
export class ControlFactory {
  static create(kind: string, options: Partial<Control> = {}): Control {
    const id = options.id || `${kind}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // 为不同类型的组件设置默认layout
    let defaultLayout: any = options.layout || {}
    if (!options.layout) {
      // Table组件默认占满容器
      if (kind === 'Table') {
        defaultLayout = {
          width: { type: '%', value: 100 },
          height: { type: '%', value: 100 },
        }
      }
      // Flex和Grid容器默认占满父容器宽度,设置合理的最小高度
      else if (kind === 'Flex' || kind === 'Grid' || kind === 'Container') {
        defaultLayout = {
          width: { type: '%', value: 100 },
          minHeight: { type: 'px', value: 100 },
        }
      }
    }

    return {
      id,
      kind,
      name: options.name || kind,
      classes: options.classes || [],
      styles: options.styles || {},
      layout: defaultLayout,
      dataBinding: options.dataBinding,
      eventExection: options.eventExection || {},
      children: options.children || [],
      ...options,
    }
  }

  static clone(control: Control): Control {
    const cloned = JSON.parse(JSON.stringify(control))

    // 重新生成ID
    const regenerateIds = (ctrl: Control) => {
      ctrl.id = `${ctrl.kind}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      if (ctrl.children) {
        ctrl.children.forEach(regenerateIds)
      }
    }

    regenerateIds(cloned)
    return cloned
  }
}

// 数据绑定工具
export class DataBindingUtils {
  static createBinding(source: string, objectCode?: string, propertyCode?: string): DataBinding {
    return {
      source,
      objectCode,
      propertyCode,
      inherit: !objectCode && !propertyCode,
    }
  }

  static isValidBinding(binding?: DataBinding): boolean {
    if (!binding) return false
    return !!(binding.source && (binding.inherit || (binding.objectCode && binding.propertyCode)))
  }

  static getBindingPath(binding: DataBinding): string {
    if (binding.inherit) {
      return binding.source
    }
    return `${binding.source}.${binding.objectCode}.${binding.propertyCode}`
  }
}

// 事件执行工具
export class EventExecutionUtils {
  static createExecution(
    type: 'control' | 'dataSource' | 'dataTransfer' | 'global',
    target: string,
    method: string,
    params?: Record<string, any>
  ): EventExecution {
    return {
      type,
      target,
      method,
      params: params || {},
    }
  }

  static validateExecution(execution: EventExecution): boolean {
    return !!(execution.type && execution.target && execution.method)
  }
}

// 样式工具
export class StyleUtils {
  static toCssString(styles: Record<string, any>): string {
    return Object.entries(styles)
      .map(([key, value]) => `${this.kebabCase(key)}: ${value}`)
      .join('; ')
  }

  static fromCssString(cssString: string): Record<string, any> {
    const styles: Record<string, any> = {}

    cssString.split(';').forEach(rule => {
      const [property, value] = rule.split(':').map(s => s.trim())
      if (property && value) {
        styles[this.camelCase(property)] = value
      }
    })

    return styles
  }

  private static kebabCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)
  }

  private static camelCase(str: string): string {
    return str.replace(/-([a-z])/g, (match, letter) => letter.toUpperCase())
  }
}

// 验证工具
export class ValidationUtils {
  static validateControl(control: Control): string[] {
    const errors: string[] = []

    if (!control.id) {
      errors.push('控件ID不能为空')
    }

    if (!control.kind) {
      errors.push('控件类型不能为空')
    }

    if (control.dataBinding && !DataBindingUtils.isValidBinding(control.dataBinding)) {
      errors.push('数据绑定配置无效')
    }

    if (control.eventExection) {
      Object.entries(control.eventExection).forEach(([event, executions]) => {
        executions.forEach((execution, index) => {
          if (!EventExecutionUtils.validateExecution(execution)) {
            errors.push(`事件 ${event} 的第 ${index + 1} 个执行配置无效`)
          }
        })
      })
    }

    return errors
  }

  static validateView(view: View): string[] {
    const errors: string[] = []

    if (!view.id) {
      errors.push('视图ID不能为空')
    }

    if (!view.name) {
      errors.push('视图名称不能为空')
    }

    view.controls.forEach((control, index) => {
      const controlErrors = this.validateControl(control)
      controlErrors.forEach(error => {
        errors.push(`控件 ${index + 1}: ${error}`)
      })
    })

    return errors
  }
}
