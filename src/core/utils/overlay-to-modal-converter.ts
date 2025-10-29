/**
 * 浮层到Modal组件转换工具
 *
 * 用于将旧版的OverlayContainer组件转换为新版的Modal组件
 */

import type { Control, EventExecution } from '@/types'

/**
 * 旧版浮层容器属性接口
 */
interface OverlayContainerProps {
  // 基础信息
  overlayId?: string
  overlayName?: string
  overlayType?: 'modal' | 'drawer' | 'fullscreen'

  // 视图容器配置
  containerType?: 'flex' | 'grid' | 'custom'
  containerProps?: {
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
    align?: 'flex-start' | 'center' | 'flex-end' | 'baseline' | 'stretch'
    gap?: number
    columns?: number
    rows?: number
    columnGap?: number
    rowGap?: number
    customClass?: string
    customStyle?: Record<string, any>
  }

  // 目标视图配置
  targetView?: string

  // 显示配置
  title?: string
  width?: string | number
  height?: string | number
  position?: 'center' | 'top' | 'right' | 'bottom' | 'left'

  // 交互配置
  visible?: boolean
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  destroyOnClose?: boolean
  mask?: boolean
  centered?: boolean
  zIndex?: number

  // 抽屉特有配置
  placement?: 'top' | 'right' | 'bottom' | 'left'

  // 样式
  className?: string
}

/**
 * 新版Modal组件属性接口
 */
interface ModalProps {
  // 基础属性
  title?: string
  width?: number | string
  visible?: boolean

  // 行为属性
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean

  // 底部按钮
  footer?: boolean
  okText?: string
  cancelText?: string

  // 其他属性
  className?: string
}

/**
 * 转换选项
 */
interface ConversionOptions {
  /**
   * 是否保留原始ID
   * @default true
   */
  preserveId?: boolean

  /**
   * 是否记录转换日志
   * @default true
   */
  logConversion?: boolean

  /**
   * 是否严格模式（遇到无法转换的配置时抛出错误）
   * @default false
   */
  strictMode?: boolean

  /**
   * 自定义属性映射函数
   */
  customPropertyMapper?: (props: OverlayContainerProps) => Partial<ModalProps>

  /**
   * 自定义事件映射函数
   */
  customEventMapper?: (events: Record<string, EventExecution[]>) => Record<string, EventExecution[]>
}

/**
 * 转换结果
 */
interface ConversionResult {
  /**
   * 转换后的Modal控件
   */
  modal: Control

  /**
   * 转换警告信息
   */
  warnings: string[]

  /**
   * 是否成功转换
   */
  success: boolean
}

/**
 * 检查控件是否为旧版浮层容器
 */
export function isOverlayContainer(control: Control): boolean {
  return control.kind === 'overlay-container' || control.kind === 'OverlayContainer'
}

/**
 * 转换浮层容器到Modal组件
 *
 * @param overlay 旧版浮层容器控件
 * @param options 转换选项
 * @returns 转换结果
 */
export function convertOverlayToModal(overlay: Control, options: ConversionOptions = {}): ConversionResult {
  const { preserveId = true, logConversion = true, strictMode = false, customPropertyMapper, customEventMapper } = options

  const warnings: string[] = []

  try {
    // 验证输入
    if (!isOverlayContainer(overlay)) {
      const error = `控件类型不是浮层容器: ${overlay.kind}`
      if (strictMode) {
        throw new Error(error)
      }
      warnings.push(error)
      return {
        modal: overlay,
        warnings,
        success: false,
      }
    }

    const overlayProps = (overlay.props as OverlayContainerProps) || {}

    // 1. 映射基础属性
    const modalProps: ModalProps = mapProperties(overlayProps, warnings, strictMode)

    // 2. 应用自定义属性映射
    if (customPropertyMapper) {
      const customProps = customPropertyMapper(overlayProps)
      Object.assign(modalProps, customProps)
    }

    // 3. 迁移子组件
    const children = migrateChildren(overlay.children || [], warnings)

    // 4. 迁移事件配置
    const eventExection = migrateEvents(overlay.eventExection || {}, warnings, customEventMapper)

    // 5. 创建新的Modal控件
    const modal: Control = {
      id: preserveId ? overlay.id : generateModalId(),
      kind: 'Modal',
      name: overlay.name || overlayProps.overlayName || '模态框',
      props: modalProps,
      children,
      eventExection,
      classes: overlay.classes || [],
      styles: overlay.styles || {},
      layout: overlay.layout,
      dataBinding: overlay.dataBinding,
    }

    // 6. 记录转换日志
    if (logConversion) {
      console.log(`[OverlayConverter] 成功转换浮层容器 "${overlay.name}" (${overlay.id}) 到 Modal 组件`, {
        originalType: overlayProps.overlayType,
        warnings: warnings.length > 0 ? warnings : '无',
      })
    }

    return {
      modal,
      warnings,
      success: true,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    warnings.push(`转换失败: ${errorMessage}`)

    if (logConversion) {
      console.error(`[OverlayConverter] 转换失败:`, error)
    }

    return {
      modal: overlay,
      warnings,
      success: false,
    }
  }
}

/**
 * 映射属性
 */
function mapProperties(overlayProps: OverlayContainerProps, warnings: string[], strictMode: boolean): ModalProps {
  const modalProps: ModalProps = {}

  // 基础属性映射
  if (overlayProps.title !== undefined) {
    modalProps.title = overlayProps.title
  } else if (overlayProps.overlayName !== undefined) {
    modalProps.title = overlayProps.overlayName
  }

  // 宽度映射
  if (overlayProps.width !== undefined) {
    modalProps.width = overlayProps.width
  }

  // 可见性映射
  if (overlayProps.visible !== undefined) {
    modalProps.visible = overlayProps.visible
  }

  // 行为属性映射
  if (overlayProps.closable !== undefined) {
    modalProps.closable = overlayProps.closable
  }

  if (overlayProps.maskClosable !== undefined) {
    modalProps.maskClosable = overlayProps.maskClosable
  }

  if (overlayProps.keyboard !== undefined) {
    modalProps.keyboard = overlayProps.keyboard
  }

  // 样式类名映射
  if (overlayProps.className !== undefined) {
    modalProps.className = overlayProps.className
  }

  // 底部按钮默认显示
  modalProps.footer = true
  modalProps.okText = '确定'
  modalProps.cancelText = '取消'

  // 处理不支持的属性
  const unsupportedProps: string[] = []

  // Drawer特有属性
  if (overlayProps.overlayType === 'drawer') {
    unsupportedProps.push('overlayType: drawer (Modal不支持抽屉模式)')
    if (overlayProps.placement) {
      unsupportedProps.push(`placement: ${overlayProps.placement}`)
    }
  }

  // Fullscreen特有属性
  if (overlayProps.overlayType === 'fullscreen') {
    unsupportedProps.push('overlayType: fullscreen (Modal不支持全屏模式)')
    // 全屏模式可以通过设置宽度为100vw来模拟
    modalProps.width = '100vw'
    warnings.push('全屏模式已转换为宽度100vw的Modal')
  }

  // 高度属性
  if (overlayProps.height !== undefined) {
    unsupportedProps.push(`height: ${overlayProps.height} (Modal不直接支持height属性)`)
  }

  // 位置属性
  if (overlayProps.position && overlayProps.position !== 'center') {
    unsupportedProps.push(`position: ${overlayProps.position} (Modal仅支持居中显示)`)
  }

  // 容器类型配置
  if (overlayProps.containerType && overlayProps.containerType !== 'flex') {
    warnings.push(`容器类型 "${overlayProps.containerType}" 将由子组件的布局属性控制`)
  }

  // 目标视图配置
  if (overlayProps.targetView) {
    warnings.push(`目标视图配置 "${overlayProps.targetView}" 在Modal中不再使用`)
  }

  // 记录不支持的属性
  if (unsupportedProps.length > 0) {
    const message = `以下属性在Modal中不支持: ${unsupportedProps.join(', ')}`
    warnings.push(message)

    if (strictMode) {
      throw new Error(message)
    }
  }

  return modalProps
}

/**
 * 迁移子组件
 */
function migrateChildren(children: Control[], warnings: string[]): Control[] {
  if (!children || children.length === 0) {
    return []
  }

  // 递归转换子组件中的浮层容器
  return children.map(child => {
    if (isOverlayContainer(child)) {
      const result = convertOverlayToModal(child, { logConversion: false })
      warnings.push(...result.warnings)
      return result.modal
    }

    // 递归处理子组件的子组件
    if (child.children && child.children.length > 0) {
      return {
        ...child,
        children: migrateChildren(child.children, warnings),
      }
    }

    return child
  })
}

/**
 * 迁移事件配置
 */
function migrateEvents(
  eventExection: Record<string, EventExecution[]>,
  warnings: string[],
  customEventMapper?: (events: Record<string, EventExecution[]>) => Record<string, EventExecution[]>
): Record<string, EventExecution[]> {
  if (!eventExection || Object.keys(eventExection).length === 0) {
    return {}
  }

  const migratedEvents: Record<string, EventExecution[]> = {}

  // 事件名称映射
  const eventNameMap: Record<string, string> = {
    ok: 'ok',
    cancel: 'cancel',
    close: 'close',
    afterClose: 'close', // afterClose映射到close
    open: 'ok', // open事件在Modal中不存在，映射到ok
  }

  // 迁移事件
  for (const [eventName, executions] of Object.entries(eventExection)) {
    const mappedEventName = eventNameMap[eventName] || eventName

    if (!eventNameMap[eventName]) {
      warnings.push(`未知的事件类型 "${eventName}"，将保持原样`)
    }

    // 复制事件执行配置
    migratedEvents[mappedEventName] = executions.map(execution => ({
      ...execution,
    }))

    // 如果事件名称发生了变化，记录警告
    if (mappedEventName !== eventName) {
      warnings.push(`事件 "${eventName}" 已映射到 "${mappedEventName}"`)
    }
  }

  // 应用自定义事件映射
  if (customEventMapper) {
    return customEventMapper(migratedEvents)
  }

  return migratedEvents
}

/**
 * 生成Modal ID
 */
function generateModalId(): string {
  return `Modal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 批量转换控件树中的所有浮层容器
 *
 * @param controls 控件列表
 * @param options 转换选项
 * @returns 转换后的控件列表和所有警告
 */
export function convertAllOverlaysInTree(
  controls: Control[],
  options: ConversionOptions = {}
): { controls: Control[]; warnings: string[] } {
  const allWarnings: string[] = []

  const convertRecursive = (controlList: Control[]): Control[] => {
    return controlList.map(control => {
      // 如果是浮层容器，转换它
      if (isOverlayContainer(control)) {
        const result = convertOverlayToModal(control, options)
        allWarnings.push(...result.warnings)
        return result.modal
      }

      // 递归处理子组件
      if (control.children && control.children.length > 0) {
        return {
          ...control,
          children: convertRecursive(control.children),
        }
      }

      return control
    })
  }

  const convertedControls = convertRecursive(controls)

  return {
    controls: convertedControls,
    warnings: allWarnings,
  }
}

/**
 * 转换RootView中的所有浮层容器
 *
 * @param rootView 根视图
 * @param options 转换选项
 * @returns 转换后的根视图和所有警告
 */
export function convertOverlaysInRootView(rootView: any, options: ConversionOptions = {}): { rootView: any; warnings: string[] } {
  const allWarnings: string[] = []

  // 转换主控件树
  const mainResult = convertAllOverlaysInTree(rootView.controls || [], options)
  allWarnings.push(...mainResult.warnings)

  // 转换overlays数组（如果存在）
  let convertedOverlays: Control[] = []
  if (rootView.overlays && rootView.overlays.length > 0) {
    const overlaysResult = convertAllOverlaysInTree(rootView.overlays, options)
    allWarnings.push(...overlaysResult.warnings)
    convertedOverlays = overlaysResult.controls
  }

  // 转换views数组中的控件（如果存在）
  let convertedViews = rootView.views || []
  if (rootView.views && rootView.views.length > 0) {
    convertedViews = rootView.views.map((view: any) => {
      const viewResult = convertAllOverlaysInTree(view.controls || [], options)
      allWarnings.push(...viewResult.warnings)
      return {
        ...view,
        controls: viewResult.controls,
      }
    })
  }

  return {
    rootView: {
      ...rootView,
      controls: mainResult.controls,
      overlays: convertedOverlays,
      views: convertedViews,
    },
    warnings: allWarnings,
  }
}

/**
 * 获取转换统计信息
 */
export function getConversionStats(controls: Control[]): {
  totalOverlays: number
  overlayTypes: Record<string, number>
} {
  let totalOverlays = 0
  const overlayTypes: Record<string, number> = {}

  const countRecursive = (controlList: Control[]) => {
    for (const control of controlList) {
      if (isOverlayContainer(control)) {
        totalOverlays++
        const overlayType = (control.props as OverlayContainerProps)?.overlayType || 'modal'
        overlayTypes[overlayType] = (overlayTypes[overlayType] || 0) + 1
      }

      if (control.children && control.children.length > 0) {
        countRecursive(control.children)
      }
    }
  }

  countRecursive(controls)

  return {
    totalOverlays,
    overlayTypes,
  }
}
