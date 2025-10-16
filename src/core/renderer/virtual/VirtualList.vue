<template>
  <div ref="containerRef" class="virtual-list" @scroll="handleScroll">
    <div class="virtual-list-phantom" :style="{ height: `${totalHeight}px` }"></div>
    <div class="virtual-list-content" :style="{ transform: `translateY(${offsetY}px)` }">
      <div v-for="item in visibleItems" :key="getItemKey(item)" :ref="el => setItemRef(el, item.index)" class="virtual-list-item">
        <slot :item="item.data" :index="item.index"></slot>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { VirtualScroller } from './VirtualScroller'
import type { VisibleRange } from './IVirtualScroller'

interface Props {
  /** 数据列表 */
  items: any[]
  /** 默认项高度 */
  itemHeight?: number
  /** 缓冲区大小 */
  bufferSize?: number
  /** 是否启用动态高度 */
  dynamicHeight?: boolean
  /** 项的唯一键 */
  itemKey?: string | ((item: any) => string | number)
}

const props = withDefaults(defineProps<Props>(), {
  itemHeight: 50,
  bufferSize: 3,
  dynamicHeight: false,
  itemKey: 'id',
})

const emit = defineEmits<{
  scroll: [event: { scrollTop: number; direction: 'up' | 'down' | 'none' }]
  visibleRangeChange: [range: VisibleRange]
}>()

// Refs
const containerRef = ref<HTMLElement>()
const itemRefs = new Map<number, HTMLElement>()

// 虚拟滚动器
let scroller: VirtualScroller | null = null

// 状态
const visibleRange = ref<VisibleRange>({
  startIndex: 0,
  endIndex: 0,
  offsetY: 0,
  totalHeight: 0,
  visibleCount: 0,
})

// 计算属性
const totalHeight = computed(() => visibleRange.value.totalHeight)
const offsetY = computed(() => visibleRange.value.offsetY)

const visibleItems = computed(() => {
  const { startIndex, endIndex } = visibleRange.value
  return props.items.slice(startIndex, endIndex).map((data, i) => ({
    data,
    index: startIndex + i,
  }))
})

// 方法
function getItemKey(item: { data: any; index: number }): string | number {
  if (typeof props.itemKey === 'function') {
    return props.itemKey(item.data)
  }
  return item.data[props.itemKey] ?? item.index
}

function setItemRef(el: any, index: number) {
  if (el) {
    itemRefs.set(index, el as HTMLElement)
  } else {
    itemRefs.delete(index)
  }
}

function handleScroll() {
  if (!containerRef.value || !scroller) return

  const scrollTop = containerRef.value.scrollTop
  const containerHeight = containerRef.value.clientHeight

  const range = scroller.getVisibleRange(scrollTop, containerHeight)
  visibleRange.value = range

  // 更新动态高度
  if (props.dynamicHeight) {
    nextTick(() => {
      updateItemHeights()
    })
  }
}

function updateItemHeights() {
  if (!scroller) return

  const updates: Array<{ index: number; height: number; offsetY: number }> = []

  itemRefs.forEach((el, index) => {
    const height = el.offsetHeight
    if (height > 0 && height !== scroller!.getItemHeight(index)) {
      updates.push({ index, height, offsetY: 0 })
    }
  })

  if (updates.length > 0) {
    scroller.batchUpdateItemHeights(updates)
    // 重新计算可见范围
    handleScroll()
  }
}

function scrollToItem(index: number, align: 'start' | 'center' | 'end' = 'start') {
  if (!containerRef.value || !scroller) return

  const scrollTop = scroller.scrollToItem(index, align)
  containerRef.value.scrollTop = scrollTop
}

function reset() {
  if (scroller) {
    scroller.reset()
    handleScroll()
  }
}

// 生命周期
onMounted(() => {
  if (!containerRef.value) return

  scroller = new VirtualScroller(
    {
      itemCount: props.items.length,
      defaultItemHeight: props.itemHeight,
      bufferSize: props.bufferSize,
      dynamicHeight: props.dynamicHeight,
      containerHeight: containerRef.value.clientHeight,
    },
    {
      onVisibleRangeChange: range => {
        emit('visibleRangeChange', range)
      },
      onScroll: event => {
        emit('scroll', {
          scrollTop: event.scrollTop,
          direction: event.direction,
        })
      },
    }
  )

  handleScroll()
})

onBeforeUnmount(() => {
  itemRefs.clear()
  scroller = null
})

// 监听数据变化
watch(
  () => props.items.length,
  newCount => {
    if (scroller) {
      scroller.updateConfig({ itemCount: newCount })
      handleScroll()
    }
  }
)

watch(
  () => props.itemHeight,
  newHeight => {
    if (scroller) {
      scroller.updateConfig({ defaultItemHeight: newHeight })
      handleScroll()
    }
  }
)

// 暴露方法
defineExpose({
  scrollToItem,
  reset,
  updateItemHeights,
})
</script>

<style scoped>
.virtual-list {
  position: relative;
  overflow-y: auto;
  height: 100%;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
}

.virtual-list-item {
  box-sizing: border-box;
}
</style>
