<template>
  <component
    :is="tag"
    :class="colClasses"
    :style="colStyles"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, inject, type PropType } from 'vue'
import { useGridSystem, useBreakpoints, type ResponsiveConfig } from '@/core/layout'

/**
 * 列组件属性
 */
interface ColProps {
  /** 列宽度 */
  span?: number
  /** 列偏移 */
  offset?: number
  /** 列排序 */
  order?: number
  /** 列拉取 */
  pull?: number
  /** 列推送 */
  push?: number
  /** 超小屏幕 (<576px) */
  xs?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  /** 小屏幕 (≥576px) */
  sm?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  /** 中等屏幕 (≥768px) */
  md?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  /** 大屏幕 (≥992px) */
  lg?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  /** 超大屏幕 (≥1200px) */
  xl?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  /** 超超大屏幕 (≥1400px) */
  xxl?: number | { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  /** 自定义类名 */
  class?: string | string[] | Record<string, boolean>
  /** 标签名 */
  tag?: string
  /** flex属性 */
  flex?: string | number
}

const props = withDefaults(defineProps<ColProps>(), {
  tag: 'div'
})

// 从父组件注入间距信息
const gutterValue = inject<[number, number]>('gutterValue', [24, 0])

// 使用网格系统和断点
const { calculateGridItemStyles } = useGridSystem()
const { currentBreakpoint } = useBreakpoints()

// 解析响应式配置
function parseResponsiveConfig(value: ColProps[keyof ColProps]): {
  span?: number
  offset?: number
  order?: number
  pull?: number
  push?: number
} {
  if (typeof value === 'number') {
    return { span: value }
  }
  if (typeof value === 'object' && value !== null) {
    return value as { span?: number; offset?: number; order?: number; pull?: number; push?: number }
  }
  return {}
}

// 获取当前断点的配置
const currentConfig = computed(() => {
  const breakpoint = currentBreakpoint.value?.name || 'xs'
  
  // 按优先级获取配置
  const configs = [
    parseResponsiveConfig(props[breakpoint as keyof ColProps]),
    parseResponsiveConfig(props.xl),
    parseResponsiveConfig(props.lg),
    parseResponsiveConfig(props.md),
    parseResponsiveConfig(props.sm),
    parseResponsiveConfig(props.xs),
    {
      span: props.span,
      offset: props.offset,
      order: props.order,
      pull: props.pull,
      push: props.push
    }
  ]

  // 合并配置，优先使用第一个有值的配置
  const result: { span?: number; offset?: number; order?: number; pull?: number; push?: number } = {}
  for (const key of ['span', 'offset', 'order', 'pull', 'push'] as const) {
    for (const config of configs) {
      if (config[key] !== undefined) {
        result[key] = config[key]
        break
      }
    }
  }

  return result
})

// 列样式
const colStyles = computed(() => {
  const [horizontalGutter, verticalGutter] = gutterValue
  const config = currentConfig.value
  
  const styles: Record<string, any> = {
    position: 'relative',
    width: '100%',
    paddingLeft: `${horizontalGutter / 2}px`,
    paddingRight: `${horizontalGutter / 2}px`
  }

  // 垂直间距
  if (verticalGutter > 0) {
    styles.paddingTop = `${verticalGutter / 2}px`
    styles.paddingBottom = `${verticalGutter / 2}px`
  }

  // 列宽度
  if (config.span !== undefined) {
    const percentage = (100 / 24) * config.span
    styles.flex = `0 0 ${percentage}%`
    styles.maxWidth = `${percentage}%`
  } else if (props.flex !== undefined) {
    styles.flex = props.flex
  } else {
    styles.flex = '1'
  }

  // 偏移
  if (config.offset) {
    const percentage = (100 / 24) * config.offset
    styles.marginLeft = `${percentage}%`
  }

  // 排序
  if (config.order !== undefined) {
    styles.order = config.order
  }

  // 推拉
  if (config.push) {
    const percentage = (100 / 24) * config.push
    styles.left = `${percentage}%`
  }

  if (config.pull) {
    const percentage = (100 / 24) * config.pull
    styles.right = `${percentage}%`
  }

  return styles
})

// 列类名
const colClasses = computed(() => {
  const classes: string[] = ['col']
  const config = currentConfig.value
  const breakpoint = currentBreakpoint.value?.name || 'xs'

  // 基础span类名
  if (config.span !== undefined) {
    if (breakpoint === 'xs') {
      classes.push(`col-${config.span}`)
    } else {
      classes.push(`col-${breakpoint}-${config.span}`)
    }
  }

  // 偏移类名
  if (config.offset) {
    if (breakpoint === 'xs') {
      classes.push(`offset-${config.offset}`)
    } else {
      classes.push(`offset-${breakpoint}-${config.offset}`)
    }
  }

  // 排序类名
  if (config.order !== undefined) {
    if (breakpoint === 'xs') {
      classes.push(`order-${config.order}`)
    } else {
      classes.push(`order-${breakpoint}-${config.order}`)
    }
  }

  // 推拉类名
  if (config.push) {
    if (breakpoint === 'xs') {
      classes.push(`push-${config.push}`)
    } else {
      classes.push(`push-${breakpoint}-${config.push}`)
    }
  }

  if (config.pull) {
    if (breakpoint === 'xs') {
      classes.push(`pull-${config.pull}`)
    } else {
      classes.push(`pull-${breakpoint}-${config.pull}`)
    }
  }

  // 自定义类名
  if (props.class) {
    if (typeof props.class === 'string') {
      classes.push(props.class)
    } else if (Array.isArray(props.class)) {
      classes.push(...props.class)
    } else {
      Object.entries(props.class).forEach(([className, condition]) => {
        if (condition) {
          classes.push(className)
        }
      })
    }
  }

  return classes
})
</script>

<style scoped>
.col {
  position: relative;
  width: 100%;
  padding-left: 12px;
  padding-right: 12px;
  flex: 1;
}

/* 基础列宽度 */
.col-1 { flex: 0 0 4.166667%; max-width: 4.166667%; }
.col-2 { flex: 0 0 8.333333%; max-width: 8.333333%; }
.col-3 { flex: 0 0 12.5%; max-width: 12.5%; }
.col-4 { flex: 0 0 16.666667%; max-width: 16.666667%; }
.col-5 { flex: 0 0 20.833333%; max-width: 20.833333%; }
.col-6 { flex: 0 0 25%; max-width: 25%; }
.col-7 { flex: 0 0 29.166667%; max-width: 29.166667%; }
.col-8 { flex: 0 0 33.333333%; max-width: 33.333333%; }
.col-9 { flex: 0 0 37.5%; max-width: 37.5%; }
.col-10 { flex: 0 0 41.666667%; max-width: 41.666667%; }
.col-11 { flex: 0 0 45.833333%; max-width: 45.833333%; }
.col-12 { flex: 0 0 50%; max-width: 50%; }
.col-13 { flex: 0 0 54.166667%; max-width: 54.166667%; }
.col-14 { flex: 0 0 58.333333%; max-width: 58.333333%; }
.col-15 { flex: 0 0 62.5%; max-width: 62.5%; }
.col-16 { flex: 0 0 66.666667%; max-width: 66.666667%; }
.col-17 { flex: 0 0 70.833333%; max-width: 70.833333%; }
.col-18 { flex: 0 0 75%; max-width: 75%; }
.col-19 { flex: 0 0 79.166667%; max-width: 79.166667%; }
.col-20 { flex: 0 0 83.333333%; max-width: 83.333333%; }
.col-21 { flex: 0 0 87.5%; max-width: 87.5%; }
.col-22 { flex: 0 0 91.666667%; max-width: 91.666667%; }
.col-23 { flex: 0 0 95.833333%; max-width: 95.833333%; }
.col-24 { flex: 0 0 100%; max-width: 100%; }

/* 偏移类 */
.offset-1 { margin-left: 4.166667%; }
.offset-2 { margin-left: 8.333333%; }
.offset-3 { margin-left: 12.5%; }
.offset-4 { margin-left: 16.666667%; }
.offset-5 { margin-left: 20.833333%; }
.offset-6 { margin-left: 25%; }
.offset-7 { margin-left: 29.166667%; }
.offset-8 { margin-left: 33.333333%; }
.offset-9 { margin-left: 37.5%; }
.offset-10 { margin-left: 41.666667%; }
.offset-11 { margin-left: 45.833333%; }
.offset-12 { margin-left: 50%; }
.offset-13 { margin-left: 54.166667%; }
.offset-14 { margin-left: 58.333333%; }
.offset-15 { margin-left: 62.5%; }
.offset-16 { margin-left: 66.666667%; }
.offset-17 { margin-left: 70.833333%; }
.offset-18 { margin-left: 75%; }
.offset-19 { margin-left: 79.166667%; }
.offset-20 { margin-left: 83.333333%; }
.offset-21 { margin-left: 87.5%; }
.offset-22 { margin-left: 91.666667%; }
.offset-23 { margin-left: 95.833333%; }

/* 排序类 */
.order-1 { order: 1; }
.order-2 { order: 2; }
.order-3 { order: 3; }
.order-4 { order: 4; }
.order-5 { order: 5; }
.order-6 { order: 6; }
.order-7 { order: 7; }
.order-8 { order: 8; }
.order-9 { order: 9; }
.order-10 { order: 10; }
.order-11 { order: 11; }
.order-12 { order: 12; }

/* 推拉类 */
.push-1 { left: 4.166667%; }
.push-2 { left: 8.333333%; }
.push-3 { left: 12.5%; }
.push-4 { left: 16.666667%; }
.push-5 { left: 20.833333%; }
.push-6 { left: 25%; }
.push-7 { left: 29.166667%; }
.push-8 { left: 33.333333%; }
.push-9 { left: 37.5%; }
.push-10 { left: 41.666667%; }
.push-11 { left: 45.833333%; }
.push-12 { left: 50%; }

.pull-1 { right: 4.166667%; }
.pull-2 { right: 8.333333%; }
.pull-3 { right: 12.5%; }
.pull-4 { right: 16.666667%; }
.pull-5 { right: 20.833333%; }
.pull-6 { right: 25%; }
.pull-7 { right: 29.166667%; }
.pull-8 { right: 33.333333%; }
.pull-9 { right: 37.5%; }
.pull-10 { right: 41.666667%; }
.pull-11 { right: 45.833333%; }
.pull-12 { right: 50%; }
</style>