<template>
  <component
    :is="tag"
    :class="rowClasses"
    :style="rowStyles"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue'
import { useGridSystem } from '@/core/layout'

/**
 * 行组件属性
 */
interface RowProps {
  /** 列间距 */
  gutter?: number | [number, number]
  /** 水平对齐方式 */
  justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between' | 'space-evenly'
  /** 垂直对齐方式 */
  align?: 'top' | 'middle' | 'bottom' | 'stretch'
  /** 是否换行 */
  wrap?: boolean
  /** 自定义类名 */
  class?: string | string[] | Record<string, boolean>
  /** 标签名 */
  tag?: string
  /** 是否为无间距行 */
  noGutters?: boolean
}

const props = withDefaults(defineProps<RowProps>(), {
  justify: 'start',
  align: 'top',
  wrap: true,
  tag: 'div',
  noGutters: false
})

// 使用网格系统
const { calculateRowStyles } = useGridSystem()

// 计算间距
const gutterValue = computed(() => {
  if (props.noGutters) {
    return [0, 0]
  }

  if (typeof props.gutter === 'number') {
    return [props.gutter, props.gutter]
  }

  if (Array.isArray(props.gutter)) {
    return props.gutter
  }

  return [24, 0] // 默认水平间距24px，垂直间距0
})

// 行样式
const rowStyles = computed(() => {
  const [horizontalGutter, verticalGutter] = gutterValue.value
  
  const styles: Record<string, any> = {
    display: 'flex',
    flexWrap: props.wrap ? 'wrap' : 'nowrap',
    marginLeft: `-${horizontalGutter / 2}px`,
    marginRight: `-${horizontalGutter / 2}px`
  }

  // 垂直间距
  if (verticalGutter > 0) {
    styles.marginTop = `-${verticalGutter / 2}px`
    styles.marginBottom = `-${verticalGutter / 2}px`
  }

  // 水平对齐
  switch (props.justify) {
    case 'start':
      styles.justifyContent = 'flex-start'
      break
    case 'end':
      styles.justifyContent = 'flex-end'
      break
    case 'center':
      styles.justifyContent = 'center'
      break
    case 'space-around':
      styles.justifyContent = 'space-around'
      break
    case 'space-between':
      styles.justifyContent = 'space-between'
      break
    case 'space-evenly':
      styles.justifyContent = 'space-evenly'
      break
  }

  // 垂直对齐
  switch (props.align) {
    case 'top':
      styles.alignItems = 'flex-start'
      break
    case 'middle':
      styles.alignItems = 'center'
      break
    case 'bottom':
      styles.alignItems = 'flex-end'
      break
    case 'stretch':
      styles.alignItems = 'stretch'
      break
  }

  return styles
})

// 行类名
const rowClasses = computed(() => {
  const classes: string[] = ['row']

  // 对齐类名
  if (props.justify !== 'start') {
    classes.push(`justify-content-${props.justify}`)
  }

  if (props.align !== 'top') {
    classes.push(`align-items-${props.align}`)
  }

  // 无间距类名
  if (props.noGutters) {
    classes.push('no-gutters')
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
.row {
  display: flex;
  flex-wrap: wrap;
  margin-left: -12px;
  margin-right: -12px;
}

.no-gutters {
  margin-left: 0;
  margin-right: 0;
}

.no-gutters > :deep(.col),
.no-gutters > :deep([class*="col-"]) {
  padding-left: 0;
  padding-right: 0;
}

/* 对齐工具类 */
.justify-content-start {
  justify-content: flex-start !important;
}

.justify-content-end {
  justify-content: flex-end !important;
}

.justify-content-center {
  justify-content: center !important;
}

.justify-content-space-between {
  justify-content: space-between !important;
}

.justify-content-space-around {
  justify-content: space-around !important;
}

.justify-content-space-evenly {
  justify-content: space-evenly !important;
}

.align-items-top {
  align-items: flex-start !important;
}

.align-items-middle {
  align-items: center !important;
}

.align-items-bottom {
  align-items: flex-end !important;
}

.align-items-stretch {
  align-items: stretch !important;
}
</style>