# 虚拟滚动系统

虚拟滚动系统提供高性能的大列表渲染能力,只渲染可见区域的项,大幅提升性能。

## 核心特性

1. **高性能**: 只渲染可见项,支持百万级数据
2. **动态高度**: 支持不同高度的项
3. **平滑滚动**: 优化的滚动体验
4. **缓冲区**: 预渲染上下缓冲区,避免白屏
5. **二分查找**: 快速定位可见项
6. **批量更新**: 优化的高度更新机制

## 快速开始

### 基础使用

```vue
<template>
  <VirtualList :items="items" :item-height="50" #default="{ item, index }">
    <div class="list-item">{{ index }}: {{ item.name }}</div>
  </VirtualList>
</template>

<script setup>
import { VirtualList } from '@/core/renderer/virtual'

const items = ref(
  Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    name: `Item ${i}`,
  }))
)
</script>
```

### 动态高度

```vue
<template>
  <VirtualList :items="items" :item-height="50" :dynamic-height="true" #default="{ item }">
    <div class="list-item" :style="{ height: item.height + 'px' }">
      {{ item.content }}
    </div>
  </VirtualList>
</template>
```

### 滚动到指定项

```vue
<template>
  <VirtualList ref="listRef" :items="items" :item-height="50" #default="{ item }">
    <div class="list-item">{{ item.name }}</div>
  </VirtualList>
  <button @click="scrollToItem(100)">滚动到第100项</button>
</template>

<script setup>
import { ref } from 'vue'
import { VirtualList } from '@/core/renderer/virtual'

const listRef = ref()

function scrollToItem(index) {
  listRef.value?.scrollToItem(index, 'center')
}
</script>
```

## API参考

### VirtualList Props

| 属性          | 类型                                        | 默认值 | 说明             |
| ------------- | ------------------------------------------- | ------ | ---------------- |
| items         | any[]                                       | -      | 数据列表         |
| itemHeight    | number                                      | 50     | 默认项高度       |
| bufferSize    | number                                      | 3      | 缓冲区大小       |
| dynamicHeight | boolean                                     | false  | 是否启用动态高度 |
| itemKey       | string \| ((item: any) => string \| number) | 'id'   | 项的唯一键       |

### VirtualList Events

| 事件               | 参数                                                       | 说明         |
| ------------------ | ---------------------------------------------------------- | ------------ |
| scroll             | { scrollTop: number, direction: 'up' \| 'down' \| 'none' } | 滚动事件     |
| visibleRangeChange | VisibleRange                                               | 可见范围变化 |

### VirtualList Methods

| 方法              | 参数                                                  | 说明         |
| ----------------- | ----------------------------------------------------- | ------------ |
| scrollToItem      | (index: number, align?: 'start' \| 'center' \| 'end') | 滚动到指定项 |
| reset             | ()                                                    | 重置         |
| updateItemHeights | ()                                                    | 更新项高度   |

### VirtualScroller

底层虚拟滚动器类,可以独立使用:

```typescript
import { VirtualScroller } from '@/core/renderer/virtual'

const scroller = new VirtualScroller(
  {
    itemCount: 10000,
    defaultItemHeight: 50,
    bufferSize: 3,
  },
  {
    onVisibleRangeChange: range => {
      console.log('Visible range:', range)
    },
  }
)

// 获取可见范围
const range = scroller.getVisibleRange(scrollTop, containerHeight)

// 更新项高度
scroller.updateItemHeight(10, 80)

// 滚动到指定项
const scrollTop = scroller.scrollToItem(100, 'center')
```

## 性能优化

### 1. 固定高度

如果所有项高度相同,使用固定高度模式性能最佳:

```vue
<VirtualList :items="items" :item-height="50" :dynamic-height="false" />
```

### 2. 合理的缓冲区

缓冲区太小会导致滚动时出现白屏,太大会影响性能:

```vue
<VirtualList :items="items" :buffer-size="5" />
```

### 3. 使用唯一键

提供稳定的唯一键可以提升性能:

```vue
<VirtualList :items="items" :item-key="item => item.id" />
```

### 4. 避免频繁更新

批量更新数据而不是逐个更新:

```typescript
// 不推荐
items.value.forEach((item, i) => {
  item.name = `Updated ${i}`
})

// 推荐
items.value = items.value.map((item, i) => ({
  ...item,
  name: `Updated ${i}`,
}))
```

## 高级用法

### 自定义滚动行为

```vue
<template>
  <VirtualList :items="items" :item-height="50" @scroll="handleScroll" @visible-range-change="handleRangeChange">
    <template #default="{ item, index }">
      <div class="list-item">{{ item.name }}</div>
    </template>
  </VirtualList>
</template>

<script setup>
function handleScroll({ scrollTop, direction }) {
  console.log('Scroll:', scrollTop, direction)
}

function handleRangeChange(range) {
  console.log('Visible range:', range)
  // 可以在这里加载更多数据
}
</script>
```

### 无限滚动

```vue
<template>
  <VirtualList :items="items" :item-height="50" @visible-range-change="handleRangeChange">
    <template #default="{ item }">
      <div class="list-item">{{ item.name }}</div>
    </template>
  </VirtualList>
</template>

<script setup>
import { ref } from 'vue'

const items = ref([])
const loading = ref(false)

async function loadMore() {
  if (loading.value) return
  loading.value = true

  // 加载更多数据
  const newItems = await fetchItems()
  items.value.push(...newItems)

  loading.value = false
}

function handleRangeChange(range) {
  // 当滚动到底部时加载更多
  if (range.endIndex >= items.value.length - 10) {
    loadMore()
  }
}
</script>
```

### 分组列表

```vue
<template>
  <VirtualList :items="flatItems" :item-height="50" :dynamic-height="true">
    <template #default="{ item }">
      <div v-if="item.type === 'group'" class="group-header">
        {{ item.title }}
      </div>
      <div v-else class="list-item">
        {{ item.name }}
      </div>
    </template>
  </VirtualList>
</template>

<script setup>
import { computed } from 'vue'

const groups = ref([
  {
    title: 'Group 1',
    items: [{ name: 'Item 1' }, { name: 'Item 2' }],
  },
  {
    title: 'Group 2',
    items: [{ name: 'Item 3' }, { name: 'Item 4' }],
  },
])

const flatItems = computed(() => {
  const result = []
  groups.value.forEach(group => {
    result.push({ type: 'group', title: group.title })
    result.push(...group.items.map(item => ({ type: 'item', ...item })))
  })
  return result
})
</script>
```

## 性能指标

| 场景     | 项数    | 渲染时间 | 内存占用 |
| -------- | ------- | -------- | -------- |
| 固定高度 | 10,000  | < 16ms   | ~2MB     |
| 固定高度 | 100,000 | < 16ms   | ~5MB     |
| 动态高度 | 10,000  | < 20ms   | ~3MB     |
| 动态高度 | 100,000 | < 25ms   | ~8MB     |

## 故障排查

### 滚动卡顿

1. 检查项内容是否过于复杂
2. 使用固定高度模式
3. 减少缓冲区大小
4. 优化项组件性能

### 白屏问题

1. 增加缓冲区大小
2. 检查项高度是否正确
3. 确保动态高度模式正常工作

### 高度计算错误

1. 确保项有明确的高度
2. 使用动态高度模式
3. 手动调用 `updateItemHeights()`

## 相关文档

- [架构设计文档](../../../.kiro/specs/architecture-refactoring/design.md)
- [渲染引擎文档](../adapters/README.md)
