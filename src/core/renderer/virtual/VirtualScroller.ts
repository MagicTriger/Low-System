/**
 * 虚拟滚动器实现
 */

import type {
  IVirtualScroller,
  VirtualScrollerConfig,
  VisibleRange,
  ItemSize,
  ScrollEvent,
  VirtualScrollerEvents,
} from './IVirtualScroller'

/**
 * 虚拟滚动器
 */
export class VirtualScroller implements IVirtualScroller {
  /** 配置 */
  readonly config: VirtualScrollerConfig

  /** 项高度缓存 */
  private itemHeights: number[]

  /** 项偏移量缓存 */
  private itemOffsets: number[]

  /** 总高度缓存 */
  private cachedTotalHeight: number = 0

  /** 是否需要重新计算 */
  private needsRecalculation: boolean = true

  /** 上次滚动位置 */
  private lastScrollTop: number = 0

  /** 事件处理器 */
  private events: VirtualScrollerEvents

  constructor(config: VirtualScrollerConfig, events?: VirtualScrollerEvents) {
    this.config = { bufferSize: 3, dynamicHeight: false, ...config }
    this.events = events || {}
    this.itemHeights = new Array(config.itemCount).fill(config.defaultItemHeight)
    this.itemOffsets = new Array(config.itemCount).fill(0)
    this.calculateOffsets()
  }

  /**
   * 计算可见项范围
   */
  getVisibleRange(scrollTop: number, containerHeight: number): VisibleRange {
    if (this.needsRecalculation) {
      this.calculateOffsets()
    }

    const bufferSize = this.config.bufferSize || 3

    // 二分查找起始索引
    let startIndex = this.findStartIndex(scrollTop)

    // 计算结束索引
    let endIndex = startIndex
    let visibleHeight = 0
    const viewportBottom = scrollTop + containerHeight

    while (endIndex < this.config.itemCount && this.itemOffsets[endIndex] < viewportBottom) {
      visibleHeight += this.itemHeights[endIndex]
      endIndex++
    }

    // 添加缓冲区
    startIndex = Math.max(0, startIndex - bufferSize)
    endIndex = Math.min(this.config.itemCount, endIndex + bufferSize)

    const offsetY = this.itemOffsets[startIndex]
    const visibleCount = endIndex - startIndex

    // 触发事件
    const range: VisibleRange = {
      startIndex,
      endIndex,
      offsetY,
      totalHeight: this.getTotalHeight(),
      visibleCount,
    }

    this.events.onVisibleRangeChange?.(range)

    // 触发滚动事件
    const direction = scrollTop > this.lastScrollTop ? 'down' : scrollTop < this.lastScrollTop ? 'up' : 'none'
    this.lastScrollTop = scrollTop

    this.events.onScroll?.({
      scrollTop,
      containerHeight,
      visibleRange: range,
      direction,
    })

    return range
  }

  /**
   * 二分查找起始索引
   */
  private findStartIndex(scrollTop: number): number {
    let left = 0
    let right = this.config.itemCount - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const offset = this.itemOffsets[mid]

      if (offset < scrollTop) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    return Math.max(0, left - 1)
  }

  /**
   * 更新项高度
   */
  updateItemHeight(index: number, height: number): void {
    if (index < 0 || index >= this.config.itemCount) {
      return
    }

    if (this.itemHeights[index] !== height) {
      this.itemHeights[index] = height
      this.needsRecalculation = true
      this.events.onItemHeightChange?.(index, height)
    }
  }

  /**
   * 批量更新项高度
   */
  batchUpdateItemHeights(items: ItemSize[]): void {
    let changed = false

    for (const item of items) {
      if (item.index >= 0 && item.index < this.config.itemCount) {
        if (this.itemHeights[item.index] !== item.height) {
          this.itemHeights[item.index] = item.height
          changed = true
        }
      }
    }

    if (changed) {
      this.needsRecalculation = true
    }
  }

  /**
   * 获取项高度
   */
  getItemHeight(index: number): number {
    if (index < 0 || index >= this.config.itemCount) {
      return this.config.defaultItemHeight
    }
    return this.itemHeights[index]
  }

  /**
   * 获取项偏移量
   */
  getItemOffset(index: number): number {
    if (index < 0 || index >= this.config.itemCount) {
      return 0
    }

    if (this.needsRecalculation) {
      this.calculateOffsets()
    }

    return this.itemOffsets[index]
  }

  /**
   * 滚动到指定项
   */
  scrollToItem(index: number, align: 'start' | 'center' | 'end' = 'start'): number {
    if (index < 0 || index >= this.config.itemCount) {
      return 0
    }

    if (this.needsRecalculation) {
      this.calculateOffsets()
    }

    const offset = this.itemOffsets[index]
    const itemHeight = this.itemHeights[index]
    const containerHeight = this.config.containerHeight || 0

    switch (align) {
      case 'start':
        return offset
      case 'center':
        return offset - (containerHeight - itemHeight) / 2
      case 'end':
        return offset - containerHeight + itemHeight
      default:
        return offset
    }
  }

  /**
   * 获取总高度
   */
  getTotalHeight(): number {
    if (this.needsRecalculation) {
      this.calculateOffsets()
    }
    return this.cachedTotalHeight
  }

  /**
   * 计算偏移量
   */
  private calculateOffsets(): void {
    let offset = 0

    for (let i = 0; i < this.config.itemCount; i++) {
      this.itemOffsets[i] = offset
      offset += this.itemHeights[i]
    }

    this.cachedTotalHeight = offset
    this.needsRecalculation = false
  }

  /**
   * 重置
   */
  reset(): void {
    this.itemHeights = new Array(this.config.itemCount).fill(this.config.defaultItemHeight)
    this.itemOffsets = new Array(this.config.itemCount).fill(0)
    this.cachedTotalHeight = 0
    this.needsRecalculation = true
    this.lastScrollTop = 0
    this.calculateOffsets()
  }

  /**
   * 更新配置
   */
  updateConfig(config: Partial<VirtualScrollerConfig>): void {
    Object.assign(this.config, config)

    if (config.itemCount !== undefined) {
      const oldCount = this.itemHeights.length
      const newCount = config.itemCount

      if (newCount > oldCount) {
        // 增加项
        const newItems = new Array(newCount - oldCount).fill(this.config.defaultItemHeight)
        this.itemHeights.push(...newItems)
        this.itemOffsets.push(...new Array(newCount - oldCount).fill(0))
      } else if (newCount < oldCount) {
        // 减少项
        this.itemHeights = this.itemHeights.slice(0, newCount)
        this.itemOffsets = this.itemOffsets.slice(0, newCount)
      }

      this.needsRecalculation = true
    }

    if (config.defaultItemHeight !== undefined) {
      // 更新所有未自定义高度的项
      for (let i = 0; i < this.itemHeights.length; i++) {
        if (this.itemHeights[i] === this.config.defaultItemHeight) {
          this.itemHeights[i] = config.defaultItemHeight
        }
      }
      this.needsRecalculation = true
    }
  }
}
