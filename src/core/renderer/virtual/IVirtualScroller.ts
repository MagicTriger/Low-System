/**
 * 虚拟滚动接口
 *
 * 提供虚拟滚动的核心接口定义
 */

/**
 * 可见范围
 */
export interface VisibleRange {
  /** 起始索引 */
  startIndex: number
  /** 结束索引 */
  endIndex: number
  /** Y轴偏移量 */
  offsetY: number
  /** 总高度 */
  totalHeight: number
  /** 可见项数量 */
  visibleCount: number
}

/**
 * 虚拟滚动配置
 */
export interface VirtualScrollerConfig {
  /** 项总数 */
  itemCount: number
  /** 默认项高度 */
  defaultItemHeight: number
  /** 缓冲区大小(项数) */
  bufferSize?: number
  /** 是否启用动态高度 */
  dynamicHeight?: boolean
  /** 容器高度 */
  containerHeight?: number
}

/**
 * 项尺寸信息
 */
export interface ItemSize {
  /** 项索引 */
  index: number
  /** 项高度 */
  height: number
  /** Y轴偏移量 */
  offsetY: number
}

/**
 * 滚动事件
 */
export interface ScrollEvent {
  /** 滚动位置 */
  scrollTop: number
  /** 容器高度 */
  containerHeight: number
  /** 可见范围 */
  visibleRange: VisibleRange
  /** 滚动方向 */
  direction: 'up' | 'down' | 'none'
}

/**
 * 虚拟滚动器接口
 */
export interface IVirtualScroller {
  /** 配置 */
  readonly config: VirtualScrollerConfig

  /**
   * 计算可见项范围
   * @param scrollTop 滚动位置
   * @param containerHeight 容器高度
   */
  getVisibleRange(scrollTop: number, containerHeight: number): VisibleRange

  /**
   * 更新项高度
   * @param index 项索引
   * @param height 项高度
   */
  updateItemHeight(index: number, height: number): void

  /**
   * 批量更新项高度
   * @param items 项尺寸数组
   */
  batchUpdateItemHeights(items: ItemSize[]): void

  /**
   * 获取项高度
   * @param index 项索引
   */
  getItemHeight(index: number): number

  /**
   * 获取项偏移量
   * @param index 项索引
   */
  getItemOffset(index: number): number

  /**
   * 滚动到指定项
   * @param index 项索引
   * @param align 对齐方式
   */
  scrollToItem(index: number, align?: 'start' | 'center' | 'end'): number

  /**
   * 获取总高度
   */
  getTotalHeight(): number

  /**
   * 重置
   */
  reset(): void

  /**
   * 更新配置
   * @param config 新配置
   */
  updateConfig(config: Partial<VirtualScrollerConfig>): void
}

/**
 * 虚拟滚动器事件
 */
export interface VirtualScrollerEvents {
  /** 可见范围变化 */
  onVisibleRangeChange?: (range: VisibleRange) => void
  /** 滚动事件 */
  onScroll?: (event: ScrollEvent) => void
  /** 项高度变化 */
  onItemHeightChange?: (index: number, height: number) => void
}
