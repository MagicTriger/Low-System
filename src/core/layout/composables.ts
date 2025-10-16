/**
 * 响应式布局系统的Vue组合式API
 * 提供响应式的布局管理功能
 */

import { ref, reactive, computed, onMounted, onUnmounted, watch, readonly, type Ref } from 'vue'
import {
  LayoutManager,
  GridSystem,
  ContainerManager,
  createLayoutManager,
  createGridSystem,
  createContainerManager,
  getGlobalLayoutManager,
  getGlobalGridSystem,
  getGlobalContainerManager,
  LayoutEventType
} from './index'
import type {
  Breakpoint,
  DeviceType,
  Orientation,
  ViewportInfo,
  LayoutEvent,
  LayoutListener,
  GridConfig,
  ContainerConfig,
  ResponsiveConfig,
  LayoutManagerConfig
} from './index'

/**
 * 使用布局管理器
 */
export function useLayoutManager(config?: LayoutManagerConfig) {
  const layoutManager = ref<LayoutManager>()
  const currentBreakpoint = ref<Breakpoint>()
  const viewportInfo = ref<ViewportInfo>()
  const isReady = ref(false)

  // 响应式状态
  const deviceType = computed(() => viewportInfo.value?.deviceType)
  const orientation = computed(() => viewportInfo.value?.orientation)
  const isDesktop = computed(() => layoutManager.value?.isDesktop() ?? false)
  const isMobile = computed(() => layoutManager.value?.isMobile() ?? false)
  const isTablet = computed(() => layoutManager.value?.isTablet() ?? false)
  const isTouch = computed(() => layoutManager.value?.isTouch() ?? false)
  const isRetina = computed(() => layoutManager.value?.isRetina() ?? false)

  // 事件监听器
  const listeners = new Map<LayoutEventType, Set<LayoutListener>>()

  // 初始化
  onMounted(() => {
    layoutManager.value = config ? createLayoutManager(config) : getGlobalLayoutManager()
    
    // 更新初始状态
    updateState()
    
    // 添加事件监听
    setupEventListeners()
    
    isReady.value = true
  })

  // 清理
  onUnmounted(() => {
    if (config && layoutManager.value) {
      layoutManager.value.destroy()
    }
    listeners.clear()
  })

  // 更新状态
  function updateState() {
    if (layoutManager.value) {
      currentBreakpoint.value = layoutManager.value.getCurrentBreakpoint()
      viewportInfo.value = layoutManager.value.getViewportInfo()
    }
  }

  // 设置事件监听器
  function setupEventListeners() {
    if (!layoutManager.value) return

    const handleLayoutEvent: LayoutListener = (event) => {
      updateState()
      
      // 触发用户注册的监听器
      const eventListeners = listeners.get(event.type)
      if (eventListeners) {
        eventListeners.forEach(listener => listener(event))
      }
    }

    // 监听所有布局事件
    Object.values(LayoutEventType).forEach(eventType => {
      layoutManager.value!.addEventListener(eventType, handleLayoutEvent)
    })
  }

  // 添加事件监听器
  function addEventListener(type: LayoutEventType, listener: LayoutListener) {
    if (!listeners.has(type)) {
      listeners.set(type, new Set())
    }
    listeners.get(type)!.add(listener)
  }

  // 移除事件监听器
  function removeEventListener(type: LayoutEventType, listener: LayoutListener) {
    const eventListeners = listeners.get(type)
    if (eventListeners) {
      eventListeners.delete(listener)
    }
  }

  // 匹配媒体查询
  function matchMedia(query: string): boolean {
    return layoutManager.value?.matchMedia(query) ?? false
  }

  // 添加断点
  function addBreakpoint(breakpoint: Breakpoint) {
    layoutManager.value?.addBreakpoint(breakpoint)
  }

  // 移除断点
  function removeBreakpoint(name: string) {
    layoutManager.value?.removeBreakpoint(name)
  }

  return {
    // 状态
    layoutManager: readonly(layoutManager),
    currentBreakpoint: readonly(currentBreakpoint),
    viewportInfo: readonly(viewportInfo),
    isReady: readonly(isReady),
    
    // 计算属性
    deviceType,
    orientation,
    isDesktop,
    isMobile,
    isTablet,
    isTouch,
    isRetina,
    
    // 方法
    addEventListener,
    removeEventListener,
    matchMedia,
    addBreakpoint,
    removeBreakpoint
  }
}

/**
 * 使用网格系统
 */
export function useGridSystem(config?: Partial<GridConfig>) {
  const gridSystem = ref<GridSystem>()
  const gridConfig = ref<GridConfig>()

  onMounted(() => {
    gridSystem.value = config ? createGridSystem(config) : getGlobalGridSystem()
    gridConfig.value = gridSystem.value.getConfig()
  })

  // 获取列宽度
  function getColumnWidth(columns: number, totalColumns?: number): string {
    return gridSystem.value?.getColumnWidth(columns, totalColumns) ?? '100%'
  }

  // 获取列偏移
  function getColumnOffset(offset: number, totalColumns?: number): string {
    return gridSystem.value?.getColumnOffset(offset, totalColumns) ?? '0%'
  }

  // 获取响应式值
  function getResponsiveValue<T>(config: ResponsiveConfig, defaultValue: T): T {
    return gridSystem.value?.getResponsiveValue(config, defaultValue) ?? defaultValue
  }

  // 生成响应式类名
  function generateResponsiveClasses(prefix: string, config: ResponsiveConfig): string[] {
    return gridSystem.value?.generateResponsiveClasses(prefix, config) ?? []
  }

  // 计算网格项样式
  function calculateGridItemStyles(
    columns: number,
    offset: number = 0,
    breakpoint?: string
  ): Record<string, any> {
    return gridSystem.value?.calculateGridItemStyles(columns, offset, breakpoint) ?? {}
  }

  // 计算容器样式
  function calculateContainerStyles(): Record<string, any> {
    return gridSystem.value?.calculateContainerStyles() ?? {}
  }

  // 计算行样式
  function calculateRowStyles(): Record<string, any> {
    return gridSystem.value?.calculateRowStyles() ?? {}
  }

  // 生成网格CSS
  function generateGridCSS(): string {
    return gridSystem.value?.generateGridCSS() ?? ''
  }

  // 生成工具类CSS
  function generateUtilityCSS(): string {
    return gridSystem.value?.generateUtilityCSS() ?? ''
  }

  // 更新配置
  function updateConfig(newConfig: Partial<GridConfig>) {
    if (gridSystem.value) {
      gridSystem.value.setConfig(newConfig)
      gridConfig.value = gridSystem.value.getConfig()
    }
  }

  return {
    // 状态
    gridSystem: readonly(gridSystem),
    gridConfig: readonly(gridConfig),
    
    // 方法
    getColumnWidth,
    getColumnOffset,
    getResponsiveValue,
    generateResponsiveClasses,
    calculateGridItemStyles,
    calculateContainerStyles,
    calculateRowStyles,
    generateGridCSS,
    generateUtilityCSS,
    updateConfig
  }
}

/**
 * 使用容器管理器
 */
export function useContainerManager(config?: Partial<ContainerConfig>) {
  const containerManager = ref<ContainerManager>()
  const containerConfig = ref<ContainerConfig>()
  const containerStyles = ref<Record<string, any>>({})

  onMounted(() => {
    containerManager.value = config ? createContainerManager(config) : getGlobalContainerManager()
    containerConfig.value = containerManager.value.getConfig()
    updateStyles()
  })

  // 更新样式
  function updateStyles() {
    if (containerManager.value) {
      containerStyles.value = containerManager.value.getCurrentBreakpointStyles()
    }
  }

  // 监听窗口大小变化
  const { addEventListener } = useLayoutManager()
  addEventListener(LayoutEventType.RESIZE, updateStyles)

  // 获取容器样式
  function getContainerStyles(): Record<string, any> {
    return containerManager.value?.getContainerStyles() ?? {}
  }

  // 获取响应式样式
  function getResponsiveStyles(): Record<string, Record<string, any>> {
    return containerManager.value?.getResponsiveStyles() ?? {}
  }

  // 生成容器CSS
  function generateContainerCSS(): string {
    return containerManager.value?.generateContainerCSS() ?? ''
  }

  // 计算实际宽度
  function calculateActualWidth(): number {
    return containerManager.value?.calculateActualWidth() ?? 0
  }

  // 更新配置
  function updateConfig(newConfig: Partial<ContainerConfig>) {
    if (containerManager.value) {
      containerManager.value.setConfig(newConfig)
      containerConfig.value = containerManager.value.getConfig()
      updateStyles()
    }
  }

  // 设置流式模式
  function setFluid(fluid: boolean) {
    if (containerManager.value) {
      containerManager.value.setFluid(fluid)
      updateStyles()
    }
  }

  return {
    // 状态
    containerManager: readonly(containerManager),
    containerConfig: readonly(containerConfig),
    containerStyles: readonly(containerStyles),
    
    // 方法
    getContainerStyles,
    getResponsiveStyles,
    generateContainerCSS,
    calculateActualWidth,
    updateConfig,
    setFluid
  }
}

/**
 * 使用响应式断点
 */
export function useBreakpoints(customBreakpoints?: Breakpoint[]) {
  const { currentBreakpoint, layoutManager } = useLayoutManager()
  
  // 断点匹配状态
  const breakpoints = computed(() => {
    return layoutManager.value?.getBreakpoints() ?? []
  })

  const xs = computed(() => currentBreakpoint.value?.name === 'xs')
  const sm = computed(() => currentBreakpoint.value?.name === 'sm')
  const md = computed(() => currentBreakpoint.value?.name === 'md')
  const lg = computed(() => currentBreakpoint.value?.name === 'lg')
  const xl = computed(() => currentBreakpoint.value?.name === 'xl')
  const xxl = computed(() => currentBreakpoint.value?.name === 'xxl')

  // 范围匹配
  const smAndUp = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['sm', 'md', 'lg', 'xl', 'xxl'].includes(bp.name)
  })

  const mdAndUp = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['md', 'lg', 'xl', 'xxl'].includes(bp.name)
  })

  const lgAndUp = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['lg', 'xl', 'xxl'].includes(bp.name)
  })

  const xlAndUp = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['xl', 'xxl'].includes(bp.name)
  })

  const smAndDown = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['xs', 'sm'].includes(bp.name)
  })

  const mdAndDown = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['xs', 'sm', 'md'].includes(bp.name)
  })

  const lgAndDown = computed(() => {
    const bp = currentBreakpoint.value
    return bp && ['xs', 'sm', 'md', 'lg'].includes(bp.name)
  })

  // 匹配特定断点
  function matches(breakpointName: string): boolean {
    return currentBreakpoint.value?.name === breakpointName
  }

  // 匹配断点范围
  function between(min: string, max: string): boolean {
    const bp = currentBreakpoint.value
    if (!bp) return false

    const breakpointOrder = ['xs', 'sm', 'md', 'lg', 'xl', 'xxl']
    const currentIndex = breakpointOrder.indexOf(bp.name)
    const minIndex = breakpointOrder.indexOf(min)
    const maxIndex = breakpointOrder.indexOf(max)

    return currentIndex >= minIndex && currentIndex <= maxIndex
  }

  return {
    // 状态
    currentBreakpoint,
    breakpoints,
    
    // 具体断点
    xs,
    sm,
    md,
    lg,
    xl,
    xxl,
    
    // 范围断点
    smAndUp,
    mdAndUp,
    lgAndUp,
    xlAndUp,
    smAndDown,
    mdAndDown,
    lgAndDown,
    
    // 方法
    matches,
    between
  }
}

/**
 * 使用响应式值
 */
export function useResponsiveValue<T>(
  config: ResponsiveConfig | Ref<ResponsiveConfig>,
  defaultValue: T
): Ref<T> {
  const { gridSystem } = useGridSystem()
  
  return computed(() => {
    const configValue = typeof config === 'object' && 'value' in config ? config.value : config
    return gridSystem.value?.getResponsiveValue(configValue, defaultValue) ?? defaultValue
  })
}

/**
 * 使用媒体查询
 */
export function useMediaQuery(query: string | Ref<string>): Ref<boolean> {
  const matches = ref(false)
  let mediaQueryList: MediaQueryList | null = null

  const updateMatches = () => {
    if (mediaQueryList) {
      matches.value = mediaQueryList.matches
    }
  }

  const setupMediaQuery = (queryString: string) => {
    if (typeof window === 'undefined') return

    // 清理之前的监听器
    if (mediaQueryList) {
      mediaQueryList.removeEventListener('change', updateMatches)
    }

    // 创建新的媒体查询
    mediaQueryList = window.matchMedia(queryString)
    mediaQueryList.addEventListener('change', updateMatches)
    updateMatches()
  }

  // 监听查询字符串变化
  watch(
    () => typeof query === 'string' ? query : query.value,
    setupMediaQuery,
    { immediate: true }
  )

  onMounted(() => {
    const queryString = typeof query === 'string' ? query : query.value
    setupMediaQuery(queryString)
  })

  onUnmounted(() => {
    if (mediaQueryList) {
      mediaQueryList.removeEventListener('change', updateMatches)
    }
  })

  return matches
}

/**
 * 使用设备检测
 */
export function useDeviceDetection() {
  const { deviceType, orientation, isDesktop, isMobile, isTablet, isTouch, isRetina } = useLayoutManager()

  // 设备类型检测
  const isPhone = computed(() => isMobile.value && orientation.value === 'portrait')
  const isPhoneLandscape = computed(() => isMobile.value && orientation.value === 'landscape')
  const isTabletPortrait = computed(() => isTablet.value && orientation.value === 'portrait')
  const isTabletLandscape = computed(() => isTablet.value && orientation.value === 'landscape')

  // 特性检测
  const supportsHover = useMediaQuery('(hover: hover)')
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)')
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)')
  const prefersHighContrast = useMediaQuery('(prefers-contrast: high)')

  return {
    // 设备类型
    deviceType,
    orientation,
    isDesktop,
    isMobile,
    isTablet,
    isTouch,
    isRetina,
    
    // 细分设备类型
    isPhone,
    isPhoneLandscape,
    isTabletPortrait,
    isTabletLandscape,
    
    // 特性检测
    supportsHover,
    prefersReducedMotion,
    prefersDarkMode,
    prefersHighContrast
  }
}

/**
 * 使用视口信息
 */
export function useViewport() {
  const { viewportInfo } = useLayoutManager()
  
  const width = computed(() => viewportInfo.value?.width ?? 0)
  const height = computed(() => viewportInfo.value?.height ?? 0)
  const aspectRatio = computed(() => {
    const w = width.value
    const h = height.value
    return h > 0 ? w / h : 0
  })

  return {
    viewportInfo,
    width,
    height,
    aspectRatio
  }
}

/**
 * 使用响应式类名
 */
export function useResponsiveClasses() {
  const { generateResponsiveClasses } = useGridSystem()
  
  function createResponsiveClasses(
    prefix: string,
    config: ResponsiveConfig | Ref<ResponsiveConfig>
  ): Ref<string[]> {
    return computed(() => {
      const configValue = typeof config === 'object' && 'value' in config ? config.value : config
      return generateResponsiveClasses(prefix, configValue)
    })
  }

  function createResponsiveClassName(
    prefix: string,
    config: ResponsiveConfig | Ref<ResponsiveConfig>
  ): Ref<string> {
    return computed(() => {
      const classes = createResponsiveClasses(prefix, config).value
      return classes.join(' ')
    })
  }

  return {
    createResponsiveClasses,
    createResponsiveClassName
  }
}