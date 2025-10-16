<template>
  <component
    :is="tag"
    :class="flexClasses"
    :style="flexStyles"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useGridSystem, type ResponsiveConfig } from '@/core/layout'

/**
 * Flex方向类型
 */
type FlexDirection = 'row' | 'row-reverse' | 'column' | 'column-reverse'

/**
 * Flex换行类型
 */
type FlexWrap = 'nowrap' | 'wrap' | 'wrap-reverse'

/**
 * Flex主轴对齐类型
 */
type JustifyContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'

/**
 * Flex交叉轴对齐类型
 */
type AlignItems = 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'

/**
 * Flex多行对齐类型
 */
type AlignContent = 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'

/**
 * Flex组件属性
 */
interface FlexProps {
  /** flex方向 */
  direction?: FlexDirection | ResponsiveConfig<FlexDirection>
  /** 是否换行 */
  wrap?: FlexWrap | ResponsiveConfig<FlexWrap>
  /** 主轴对齐方式 */
  justify?: JustifyContent | ResponsiveConfig<JustifyContent>
  /** 交叉轴对齐方式 */
  align?: AlignItems | ResponsiveConfig<AlignItems>
  /** 多行对齐方式 */
  alignContent?: AlignContent | ResponsiveConfig<AlignContent>
  /** 间距 */
  gap?: number | string | [number | string, number | string] | ResponsiveConfig<number | string | [number | string, number | string]>
  /** flex属性 */
  flex?: string | number
  /** 是否为内联flex */
  inline?: boolean
  /** 自定义类名 */
  class?: string | string[] | Record<string, boolean>
  /** 标签名 */
  tag?: string
}

const props = withDefaults(defineProps<FlexProps>(), {
  direction: 'row',
  wrap: 'nowrap',
  justify: 'flex-start',
  align: 'stretch',
  alignContent: 'stretch',
  inline: false,
  tag: 'div'
})

// 使用网格系统
const { getResponsiveValue } = useGridSystem()

// 辅助函数：将联合类型转换为 ResponsiveConfig 或直接返回值
function getResponsiveValueSafe<T>(
  value: T | ResponsiveConfig<T> | undefined,
  defaultValue: T
): T {
  if (value === undefined) {
    return defaultValue
  }
  
  // 如果是基础类型，直接返回
  if (typeof value === 'string' || typeof value === 'number' || Array.isArray(value)) {
    return value as T
  }
  
  // 如果是 ResponsiveConfig 对象，使用 getResponsiveValue
  if (typeof value === 'object' && value !== null) {
    return getResponsiveValue(value as ResponsiveConfig<T>, defaultValue)
  }
  
  return defaultValue
}

// 当前配置
const currentDirection = computed(() => 
  getResponsiveValueSafe(props.direction, 'row')
)

const currentWrap = computed(() => 
  getResponsiveValueSafe(props.wrap, 'nowrap')
)

const currentJustify = computed(() => 
  getResponsiveValueSafe(props.justify, 'flex-start')
)

const currentAlign = computed(() => 
  getResponsiveValueSafe(props.align, 'stretch')
)

const currentAlignContent = computed(() => 
  getResponsiveValueSafe(props.alignContent, 'stretch')
)

const currentGap = computed(() => 
  getResponsiveValueSafe(props.gap, undefined)
)

// 格式化间距值
function formatGapValue(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value
}

// Flex样式
const flexStyles = computed(() => {
  const styles: Record<string, any> = {
    display: props.inline ? 'inline-flex' : 'flex',
    flexDirection: currentDirection.value,
    flexWrap: currentWrap.value,
    justifyContent: currentJustify.value,
    alignItems: currentAlign.value,
    alignContent: currentAlignContent.value
  }

  // 间距
  const gap = currentGap.value
  if (gap !== undefined) {
    if (Array.isArray(gap)) {
      styles.gap = `${formatGapValue(gap[0])} ${formatGapValue(gap[1])}`
    } else {
      styles.gap = formatGapValue(gap)
    }
  }

  // flex属性
  if (props.flex !== undefined) {
    styles.flex = props.flex
  }

  return styles
})

// Flex类名
const flexClasses = computed(() => {
  const classes: string[] = ['flex']
  
  if (props.inline) {
    classes.push('inline-flex')
  }

  classes.push(`flex-${currentDirection.value}`)
  classes.push(`flex-${currentWrap.value}`)
  classes.push(`justify-${currentJustify.value}`)
  classes.push(`items-${currentAlign.value}`)
  classes.push(`content-${currentAlignContent.value}`)

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
.flex {
  display: flex;
}

.inline-flex {
  display: inline-flex;
}

/* 方向类 */
.flex-row { flex-direction: row; }
.flex-row-reverse { flex-direction: row-reverse; }
.flex-column { flex-direction: column; }
.flex-column-reverse { flex-direction: column-reverse; }

/* 换行类 */
.flex-nowrap { flex-wrap: nowrap; }
.flex-wrap { flex-wrap: wrap; }
.flex-wrap-reverse { flex-wrap: wrap-reverse; }

/* 主轴对齐类 */
.justify-flex-start { justify-content: flex-start; }
.justify-flex-end { justify-content: flex-end; }
.justify-center { justify-content: center; }
.justify-space-between { justify-content: space-between; }
.justify-space-around { justify-content: space-around; }
.justify-space-evenly { justify-content: space-evenly; }

/* 交叉轴对齐类 */
.items-flex-start { align-items: flex-start; }
.items-flex-end { align-items: flex-end; }
.items-center { align-items: center; }
.items-baseline { align-items: baseline; }
.items-stretch { align-items: stretch; }

/* 多行对齐类 */
.content-flex-start { align-content: flex-start; }
.content-flex-end { align-content: flex-end; }
.content-center { align-content: center; }
.content-space-between { align-content: space-between; }
.content-space-around { align-content: space-around; }
.content-stretch { align-content: stretch; }

/* 响应式类 - 超小屏幕 */
@media (max-width: 575.98px) {
  .xs\:flex-row { flex-direction: row; }
  .xs\:flex-row-reverse { flex-direction: row-reverse; }
  .xs\:flex-column { flex-direction: column; }
  .xs\:flex-column-reverse { flex-direction: column-reverse; }
  
  .xs\:flex-nowrap { flex-wrap: nowrap; }
  .xs\:flex-wrap { flex-wrap: wrap; }
  .xs\:flex-wrap-reverse { flex-wrap: wrap-reverse; }
  
  .xs\:justify-flex-start { justify-content: flex-start; }
  .xs\:justify-flex-end { justify-content: flex-end; }
  .xs\:justify-center { justify-content: center; }
  .xs\:justify-space-between { justify-content: space-between; }
  .xs\:justify-space-around { justify-content: space-around; }
  .xs\:justify-space-evenly { justify-content: space-evenly; }
  
  .xs\:items-flex-start { align-items: flex-start; }
  .xs\:items-flex-end { align-items: flex-end; }
  .xs\:items-center { align-items: center; }
  .xs\:items-baseline { align-items: baseline; }
  .xs\:items-stretch { align-items: stretch; }
}

/* 响应式类 - 小屏幕 */
@media (min-width: 576px) {
  .sm\:flex-row { flex-direction: row; }
  .sm\:flex-row-reverse { flex-direction: row-reverse; }
  .sm\:flex-column { flex-direction: column; }
  .sm\:flex-column-reverse { flex-direction: column-reverse; }
  
  .sm\:flex-nowrap { flex-wrap: nowrap; }
  .sm\:flex-wrap { flex-wrap: wrap; }
  .sm\:flex-wrap-reverse { flex-wrap: wrap-reverse; }
  
  .sm\:justify-flex-start { justify-content: flex-start; }
  .sm\:justify-flex-end { justify-content: flex-end; }
  .sm\:justify-center { justify-content: center; }
  .sm\:justify-space-between { justify-content: space-between; }
  .sm\:justify-space-around { justify-content: space-around; }
  .sm\:justify-space-evenly { justify-content: space-evenly; }
  
  .sm\:items-flex-start { align-items: flex-start; }
  .sm\:items-flex-end { align-items: flex-end; }
  .sm\:items-center { align-items: center; }
  .sm\:items-baseline { align-items: baseline; }
  .sm\:items-stretch { align-items: stretch; }
}

/* 响应式类 - 中等屏幕 */
@media (min-width: 768px) {
  .md\:flex-row { flex-direction: row; }
  .md\:flex-row-reverse { flex-direction: row-reverse; }
  .md\:flex-column { flex-direction: column; }
  .md\:flex-column-reverse { flex-direction: column-reverse; }
  
  .md\:flex-nowrap { flex-wrap: nowrap; }
  .md\:flex-wrap { flex-wrap: wrap; }
  .md\:flex-wrap-reverse { flex-wrap: wrap-reverse; }
  
  .md\:justify-flex-start { justify-content: flex-start; }
  .md\:justify-flex-end { justify-content: flex-end; }
  .md\:justify-center { justify-content: center; }
  .md\:justify-space-between { justify-content: space-between; }
  .md\:justify-space-around { justify-content: space-around; }
  .md\:justify-space-evenly { justify-content: space-evenly; }
  
  .md\:items-flex-start { align-items: flex-start; }
  .md\:items-flex-end { align-items: flex-end; }
  .md\:items-center { align-items: center; }
  .md\:items-baseline { align-items: baseline; }
  .md\:items-stretch { align-items: stretch; }
}

/* 响应式类 - 大屏幕 */
@media (min-width: 992px) {
  .lg\:flex-row { flex-direction: row; }
  .lg\:flex-row-reverse { flex-direction: row-reverse; }
  .lg\:flex-column { flex-direction: column; }
  .lg\:flex-column-reverse { flex-direction: column-reverse; }
  
  .lg\:flex-nowrap { flex-wrap: nowrap; }
  .lg\:flex-wrap { flex-wrap: wrap; }
  .lg\:flex-wrap-reverse { flex-wrap: wrap-reverse; }
  
  .lg\:justify-flex-start { justify-content: flex-start; }
  .lg\:justify-flex-end { justify-content: flex-end; }
  .lg\:justify-center { justify-content: center; }
  .lg\:justify-space-between { justify-content: space-between; }
  .lg\:justify-space-around { justify-content: space-around; }
  .lg\:justify-space-evenly { justify-content: space-evenly; }
  
  .lg\:items-flex-start { align-items: flex-start; }
  .lg\:items-flex-end { align-items: flex-end; }
  .lg\:items-center { align-items: center; }
  .lg\:items-baseline { align-items: baseline; }
  .lg\:items-stretch { align-items: stretch; }
}

/* 响应式类 - 超大屏幕 */
@media (min-width: 1200px) {
  .xl\:flex-row { flex-direction: row; }
  .xl\:flex-row-reverse { flex-direction: row-reverse; }
  .xl\:flex-column { flex-direction: column; }
  .xl\:flex-column-reverse { flex-direction: column-reverse; }
  
  .xl\:flex-nowrap { flex-wrap: nowrap; }
  .xl\:flex-wrap { flex-wrap: wrap; }
  .xl\:flex-wrap-reverse { flex-wrap: wrap-reverse; }
  
  .xl\:justify-flex-start { justify-content: flex-start; }
  .xl\:justify-flex-end { justify-content: flex-end; }
  .xl\:justify-center { justify-content: center; }
  .xl\:justify-space-between { justify-content: space-between; }
  .xl\:justify-space-around { justify-content: space-around; }
  .xl\:justify-space-evenly { justify-content: space-evenly; }
  
  .xl\:items-flex-start { align-items: flex-start; }
  .xl\:items-flex-end { align-items: flex-end; }
  .xl\:items-center { align-items: center; }
  .xl\:items-baseline { align-items: baseline; }
  .xl\:items-stretch { align-items: stretch; }
}

/* 响应式类 - 超超大屏幕 */
@media (min-width: 1400px) {
  .xxl\:flex-row { flex-direction: row; }
  .xxl\:flex-row-reverse { flex-direction: row-reverse; }
  .xxl\:flex-column { flex-direction: column; }
  .xxl\:flex-column-reverse { flex-direction: column-reverse; }
  
  .xxl\:flex-nowrap { flex-wrap: nowrap; }
  .xxl\:flex-wrap { flex-wrap: wrap; }
  .xxl\:flex-wrap-reverse { flex-wrap: wrap-reverse; }
  
  .xxl\:justify-flex-start { justify-content: flex-start; }
  .xxl\:justify-flex-end { justify-content: flex-end; }
  .xxl\:justify-center { justify-content: center; }
  .xxl\:justify-space-between { justify-content: space-between; }
  .xxl\:justify-space-around { justify-content: space-around; }
  .xxl\:justify-space-evenly { justify-content: space-evenly; }
  
  .xxl\:items-flex-start { align-items: flex-start; }
  .xxl\:items-flex-end { align-items: flex-end; }
  .xxl\:items-center { align-items: center; }
  .xxl\:items-baseline { align-items: baseline; }
  .xxl\:items-stretch { align-items: stretch; }
}
</style>