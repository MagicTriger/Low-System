<template>
  <div
    ref="containerRef"
    class="virtual-scroll-container"
    :style="containerStyle"
    @scroll="handleScroll"
  >
    <!-- 占位元素，用于撑开滚动条 -->
    <div
      class="virtual-scroll-spacer"
      :style="spacerStyle"
    ></div>
    
    <!-- 可视区域内容 -->
    <div
      class="virtual-scroll-content"
      :style="contentStyle"
    >
      <div
        v-for="(item, index) in visibleItems"
        :key="getItemKey(item, startIndex + index)"
        class="virtual-scroll-item"
        :style="getItemStyle(startIndex + index)"
        :data-index="startIndex + index"
      >
        <slot
          :item="item"
          :index="startIndex + index"
          :isVisible="true"
        >
          {{ item }}
        </slot>
      </div>
    </div>
    
    <!-- 加载指示器 -->
    <div
      v-if="loading"
      class="virtual-scroll-loading"
      :style="loadingStyle"
    >
      <slot name="loading">
        <div class="loading-spinner">
          <i class="icon-loading"></i>
          加载中...
        </div>
      </slot>
    </div>
    
    <!-- 空状态 -->
    <div
      v-if="!loading && items.length === 0"
      class="virtual-scroll-empty"
    >
      <slot name="empty">
        <div class="empty-state">
          <i class="icon-empty"></i>
          <p>暂无数据</p>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'

// 接口定义
interface VirtualScrollProps {
  items: any[]
  itemHeight?: number | ((item: any, index: number) => number)
  containerHeight?: number
  overscan?: number
  horizontal?: boolean
  loading?: boolean
  loadMore?: boolean
  threshold?: number
  keyField?: string
  estimatedItemHeight?: number
  bufferSize?: number
  scrollToIndex?: number
  scrollToAlignment?: 'start' | 'center' | 'end' | 'auto'
}

// Props
const props = withDefaults(defineProps<VirtualScrollProps>(), {
  itemHeight: 50,
  containerHeight: 400,
  overscan: 5,
  horizontal: false,
  loading: false,
  loadMore: false,
  threshold: 100,
  keyField: 'id',
  estimatedItemHeight: 50,
  bufferSize: 10,
  scrollToAlignment: 'auto'
})

// Emits
const emit = defineEmits<{
  'scroll': [event: Event, scrollTop: number, scrollLeft: number]
  'load-more': []
  'item-rendered': [item: any, index: number]
  'visible-range-changed': [startIndex: number, endIndex: number]
}>()

// 响应式数据
const containerRef = ref<HTMLElement>()
const scrollTop = ref(0)
const scrollLeft = ref(0)
const containerSize = ref({ width: 0, height: 0 })
const itemSizes = ref<Map<number, number>>(new Map())
const itemPositions = ref<Map<number, number>>(new Map())
const isScrolling = ref(false)
const scrollTimer = ref<number>()
const resizeObserver = ref<ResizeObserver>()
const intersectionObserver = ref<IntersectionObserver>()

// 计算属性
const isHorizontal = computed(() => props.horizontal)

const scrollDirection = computed(() => isHorizontal.value ? 'horizontal' : 'vertical')

const containerStyle = computed(() => ({
  height: isHorizontal.value ? 'auto' : `${props.containerHeight}px`,
  width: isHorizontal.value ? `${props.containerHeight}px` : 'auto',
  overflow: 'auto',
  position: 'relative'
}))

const totalSize = computed(() => {
  if (props.items.length === 0) return 0
  
  let total = 0
  for (let i = 0; i < props.items.length; i++) {
    total += getItemSize(i)
  }
  return total
})

const spacerStyle = computed(() => ({
  [isHorizontal.value ? 'width' : 'height']: `${totalSize.value}px`,
  [isHorizontal.value ? 'height' : 'width']: '1px',
  position: 'absolute',
  top: 0,
  left: 0,
  pointerEvents: 'none'
}))

const visibleRange = computed(() => {
  const scrollOffset = isHorizontal.value ? scrollLeft.value : scrollTop.value
  const containerLength = isHorizontal.value ? containerSize.value.width : containerSize.value.height
  
  let startIndex = 0
  let endIndex = props.items.length - 1
  
  // 查找开始索引
  let offset = 0
  for (let i = 0; i < props.items.length; i++) {
    const itemSize = getItemSize(i)
    if (offset + itemSize > scrollOffset) {
      startIndex = Math.max(0, i - props.overscan)
      break
    }
    offset += itemSize
  }
  
  // 查找结束索引
  offset = getItemOffset(startIndex)
  for (let i = startIndex; i < props.items.length; i++) {
    if (offset > scrollOffset + containerLength) {
      endIndex = Math.min(props.items.length - 1, i + props.overscan)
      break
    }
    offset += getItemSize(i)
  }
  
  return { startIndex, endIndex }
})

const startIndex = computed(() => visibleRange.value.startIndex)
const endIndex = computed(() => visibleRange.value.endIndex)

const visibleItems = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1)
})

const contentStyle = computed(() => {
  const offset = getItemOffset(startIndex.value)
  
  return {
    position: 'absolute',
    top: isHorizontal.value ? 0 : `${offset}px`,
    left: isHorizontal.value ? `${offset}px` : 0,
    [isHorizontal.value ? 'height' : 'width']: '100%'
  }
})

const loadingStyle = computed(() => ({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  padding: '16px',
  textAlign: 'center',
  background: 'var(--bg-color)',
  borderTop: '1px solid var(--border-color)'
}))

// 方法
const getItemSize = (index: number): number => {
  if (itemSizes.value.has(index)) {
    return itemSizes.value.get(index)!
  }
  
  if (typeof props.itemHeight === 'function') {
    return props.itemHeight(props.items[index], index)
  }
  
  return props.itemHeight || props.estimatedItemHeight
}

const getItemOffset = (index: number): number => {
  if (itemPositions.value.has(index)) {
    return itemPositions.value.get(index)!
  }
  
  let offset = 0
  for (let i = 0; i < index; i++) {
    offset += getItemSize(i)
  }
  
  itemPositions.value.set(index, offset)
  return offset
}

const getItemKey = (item: any, index: number): string | number => {
  if (props.keyField && typeof item === 'object' && item[props.keyField]) {
    return item[props.keyField]
  }
  return index
}

const getItemStyle = (index: number) => {
  const size = getItemSize(index)
  
  return {
    [isHorizontal.value ? 'width' : 'height']: `${size}px`,
    [isHorizontal.value ? 'height' : 'width']: '100%',
    position: 'relative'
  }
}

const handleScroll = (event: Event) => {
  const target = event.target as HTMLElement
  const newScrollTop = target.scrollTop
  const newScrollLeft = target.scrollLeft
  
  scrollTop.value = newScrollTop
  scrollLeft.value = newScrollLeft
  
  isScrolling.value = true
  
  // 清除之前的定时器
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  
  // 设置新的定时器
  scrollTimer.value = window.setTimeout(() => {
    isScrolling.value = false
  }, 150)
  
  emit('scroll', event, newScrollTop, newScrollLeft)
  
  // 检查是否需要加载更多
  if (props.loadMore && !props.loading) {
    const scrollOffset = isHorizontal.value ? newScrollLeft : newScrollTop
    const containerLength = isHorizontal.value ? containerSize.value.width : containerSize.value.height
    const totalLength = totalSize.value
    
    if (scrollOffset + containerLength >= totalLength - props.threshold) {
      emit('load-more')
    }
  }
}

const updateContainerSize = () => {
  if (!containerRef.value) return
  
  const rect = containerRef.value.getBoundingClientRect()
  containerSize.value = {
    width: rect.width,
    height: rect.height
  }
}

const measureItem = (element: HTMLElement, index: number) => {
  const size = isHorizontal.value ? element.offsetWidth : element.offsetHeight
  
  if (size !== getItemSize(index)) {
    itemSizes.value.set(index, size)
    
    // 重新计算后续项目的位置
    itemPositions.value.clear()
    for (let i = 0; i <= index; i++) {
      getItemOffset(i)
    }
  }
}

const scrollToItem = (index: number, alignment: 'start' | 'center' | 'end' | 'auto' = 'auto') => {
  if (!containerRef.value || index < 0 || index >= props.items.length) return
  
  const itemOffset = getItemOffset(index)
  const itemSize = getItemSize(index)
  const containerLength = isHorizontal.value ? containerSize.value.width : containerSize.value.height
  const scrollOffset = isHorizontal.value ? scrollLeft.value : scrollTop.value
  
  let targetOffset = itemOffset
  
  switch (alignment) {
    case 'start':
      targetOffset = itemOffset
      break
    case 'center':
      targetOffset = itemOffset - (containerLength - itemSize) / 2
      break
    case 'end':
      targetOffset = itemOffset - containerLength + itemSize
      break
    case 'auto':
      if (itemOffset < scrollOffset) {
        targetOffset = itemOffset
      } else if (itemOffset + itemSize > scrollOffset + containerLength) {
        targetOffset = itemOffset - containerLength + itemSize
      } else {
        return // 已经在可视区域内
      }
      break
  }
  
  targetOffset = Math.max(0, Math.min(targetOffset, totalSize.value - containerLength))
  
  containerRef.value.scrollTo({
    [isHorizontal.value ? 'left' : 'top']: targetOffset,
    behavior: 'smooth'
  })
}

const refresh = () => {
  itemSizes.value.clear()
  itemPositions.value.clear()
  updateContainerSize()
}

const getVisibleRange = () => {
  return {
    startIndex: startIndex.value,
    endIndex: endIndex.value
  }
}

const isItemVisible = (index: number): boolean => {
  return index >= startIndex.value && index <= endIndex.value
}

// 监听器
watch(() => props.items, () => {
  refresh()
}, { deep: true })

watch(() => props.scrollToIndex, (newIndex) => {
  if (newIndex !== undefined && newIndex >= 0) {
    nextTick(() => {
      scrollToItem(newIndex, props.scrollToAlignment)
    })
  }
})

watch(visibleRange, (newRange, oldRange) => {
  if (!oldRange || newRange.startIndex !== oldRange.startIndex || newRange.endIndex !== oldRange.endIndex) {
    emit('visible-range-changed', newRange.startIndex, newRange.endIndex)
  }
})

// 生命周期
onMounted(() => {
  updateContainerSize()
  
  // 设置 ResizeObserver
  if (window.ResizeObserver) {
    resizeObserver.value = new ResizeObserver(() => {
      updateContainerSize()
    })
    
    if (containerRef.value) {
      resizeObserver.value.observe(containerRef.value)
    }
  }
  
  // 设置 IntersectionObserver 来测量项目大小
  if (window.IntersectionObserver) {
    intersectionObserver.value = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target as HTMLElement
          const index = parseInt(element.dataset.index || '0', 10)
          measureItem(element, index)
          emit('item-rendered', props.items[index], index)
        }
      })
    }, {
      root: containerRef.value,
      rootMargin: '50px'
    })
  }
  
  // 观察所有可见项目
  nextTick(() => {
    if (intersectionObserver.value && containerRef.value) {
      const items = containerRef.value.querySelectorAll('.virtual-scroll-item')
      items.forEach(item => {
        intersectionObserver.value!.observe(item)
      })
    }
  })
})

onUnmounted(() => {
  if (scrollTimer.value) {
    clearTimeout(scrollTimer.value)
  }
  
  if (resizeObserver.value) {
    resizeObserver.value.disconnect()
  }
  
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect()
  }
})

// 暴露方法
defineExpose({
  scrollToItem,
  refresh,
  getVisibleRange,
  isItemVisible,
  containerRef
})
</script>

<style scoped>
.virtual-scroll-container {
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.virtual-scroll-container::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

.virtual-scroll-container::-webkit-scrollbar-track {
  background: var(--bg-secondary);
  border-radius: 4px;
}

.virtual-scroll-container::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
  transition: background 0.2s;
}

.virtual-scroll-container::-webkit-scrollbar-thumb:hover {
  background: var(--text-secondary);
}

.virtual-scroll-spacer {
  pointer-events: none;
}

.virtual-scroll-content {
  will-change: transform;
}

.virtual-scroll-item {
  contain: layout style paint;
}

.virtual-scroll-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.loading-spinner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.loading-spinner .icon-loading {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.virtual-scroll-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: var(--text-secondary);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.empty-state .icon-empty {
  font-size: 48px;
  opacity: 0.5;
}

.empty-state p {
  margin: 0;
  font-size: 14px;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --text-color: #ffffff;
    --text-secondary: #b3b3b3;
    --border-color: #404040;
  }
}

/* 性能优化 */
.virtual-scroll-container {
  transform: translateZ(0);
  backface-visibility: hidden;
  perspective: 1000px;
}

.virtual-scroll-item {
  transform: translateZ(0);
  backface-visibility: hidden;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .virtual-scroll-container {
    font-size: 14px;
  }
  
  .virtual-scroll-loading {
    padding: 12px;
    font-size: 13px;
  }
  
  .empty-state .icon-empty {
    font-size: 36px;
  }
  
  .empty-state p {
    font-size: 13px;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .virtual-scroll-container::-webkit-scrollbar-thumb {
    background: var(--text-color);
  }
  
  .virtual-scroll-loading {
    border-top-color: var(--text-color);
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner .icon-loading {
    animation: none;
  }
  
  .virtual-scroll-container {
    scroll-behavior: auto !important;
  }
}
</style>