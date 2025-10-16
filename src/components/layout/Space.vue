<template>
  <component
    :is="tag"
    :class="spaceClasses"
    :style="spaceStyles"
  >
    <template v-for="(item, index) in items" :key="index">
      <div
        v-if="index > 0"
        :class="separatorClasses"
        :style="separatorStyles"
      />
      <div :class="itemClasses" :style="itemStyles">
        <slot :name="`item-${index}`" :item="item" :index="index">
          <component :is="item" v-if="typeof item === 'object'" />
          <span v-else>{{ item }}</span>
        </slot>
      </div>
    </template>
    <slot v-if="!items.length" />
  </component>
</template>

<script setup lang="ts">
import { computed, useSlots, type PropType } from 'vue'
import { useGridSystem, type ResponsiveConfig } from '../../core/layout'

/**
 * 间距大小类型
 */
type SpaceSize = 'small' | 'medium' | 'large' | number

/**
 * 间距方向类型
 */
type SpaceDirection = 'horizontal' | 'vertical'

/**
 * 对齐方式类型
 */
type SpaceAlign = 'start' | 'end' | 'center' | 'baseline' | 'stretch'

/**
 * 间距组件属性
 */
interface SpaceProps {
  /** 间距大小 */
  size?: SpaceSize | [SpaceSize, SpaceSize] | ResponsiveConfig<SpaceSize | [SpaceSize, SpaceSize]>
  /** 间距方向 */
  direction?: SpaceDirection | ResponsiveConfig<SpaceDirection>
  /** 对齐方式 */
  align?: SpaceAlign | ResponsiveConfig<SpaceAlign>
  /** 是否自动换行 */
  wrap?: boolean
  /** 分割线 */
  split?: boolean | string
  /** 自定义类名 */
  class?: string | string[] | Record<string, boolean>
  /** 标签名 */
  tag?: string
  /** 子项数据 */
  items?: any[]
}

const props = withDefaults(defineProps<SpaceProps>(), {
  size: 'medium',
  direction: 'horizontal',
  align: 'center',
  wrap: false,
  split: false,
  tag: 'div',
  items: () => []
})

// 使用网格系统
const { getResponsiveValue } = useGridSystem()
const slots = useSlots()

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

// 间距大小映射
const sizeMap: Record<string, number> = {
  small: 8,
  medium: 16,
  large: 24
}

// 获取间距值
function getSizeValue(size: SpaceSize): number {
  return typeof size === 'number' ? size : sizeMap[size] || sizeMap.medium
}

// 当前配置
const currentDirection = computed(() => 
  getResponsiveValueSafe(props.direction, 'horizontal')
)

const currentAlign = computed(() => 
  getResponsiveValueSafe(props.align, 'center')
)

const currentSize = computed(() => {
  const size = getResponsiveValueSafe(props.size, 'medium')
  
  if (Array.isArray(size)) {
    return [getSizeValue(size[0]), getSizeValue(size[1])]
  }
  
  const value = getSizeValue(size)
  return [value, value]
})

// 间距样式
const spaceStyles = computed(() => {
  const [horizontalSize, verticalSize] = currentSize.value
  const direction = currentDirection.value
  const align = currentAlign.value
  
  const styles: Record<string, any> = {
    display: 'flex',
    gap: direction === 'horizontal' ? `${verticalSize}px ${horizontalSize}px` : `${horizontalSize}px ${verticalSize}px`,
    flexDirection: direction === 'horizontal' ? 'row' : 'column',
    alignItems: align === 'start' ? 'flex-start' : 
                align === 'end' ? 'flex-end' : 
                align === 'center' ? 'center' :
                align === 'baseline' ? 'baseline' :
                align === 'stretch' ? 'stretch' : 'center'
  }

  if (props.wrap) {
    styles.flexWrap = 'wrap'
  }

  return styles
})

// 间距类名
const spaceClasses = computed(() => {
  const classes: string[] = ['space']
  const direction = currentDirection.value
  const align = currentAlign.value

  classes.push(`space-${direction}`)
  classes.push(`space-align-${align}`)

  if (props.wrap) {
    classes.push('space-wrap')
  }

  if (props.split) {
    classes.push('space-split')
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

// 分割线样式
const separatorStyles = computed(() => {
  const direction = currentDirection.value
  
  return {
    backgroundColor: '#e8e8e8',
    ...(direction === 'horizontal' ? {
      width: '1px',
      height: '100%',
      minHeight: '16px'
    } : {
      width: '100%',
      height: '1px',
      minWidth: '16px'
    })
  }
})

// 分割线类名
const separatorClasses = computed(() => {
  const classes = ['space-separator']
  const direction = currentDirection.value
  
  classes.push(`space-separator-${direction}`)
  
  return classes
})

// 子项样式
const itemStyles = computed(() => ({}))

// 子项类名
const itemClasses = computed(() => ['space-item'])

// 获取子项（从slots或props.items）
const items = computed(() => {
  if (props.items.length > 0) {
    return props.items
  }
  
  // 从默认slot获取子项
  const defaultSlot = slots.default?.()
  return defaultSlot || []
})
</script>

<style scoped>
.space {
  display: flex;
}

.space-horizontal {
  flex-direction: row;
}

.space-vertical {
  flex-direction: column;
}

.space-wrap {
  flex-wrap: wrap;
}

.space-align-start {
  align-items: flex-start;
}

.space-align-end {
  align-items: flex-end;
}

.space-align-center {
  align-items: center;
}

.space-align-baseline {
  align-items: baseline;
}

.space-align-stretch {
  align-items: stretch;
}

.space-item {
  flex-shrink: 0;
}

.space-separator {
  flex-shrink: 0;
  background-color: #e8e8e8;
}

.space-separator-horizontal {
  width: 1px;
  height: 100%;
  min-height: 16px;
}

.space-separator-vertical {
  width: 100%;
  height: 1px;
  min-width: 16px;
}

/* 响应式间距工具类 */
.space-small { gap: 8px; }
.space-medium { gap: 16px; }
.space-large { gap: 24px; }

/* 不同断点的间距 */
@media (max-width: 575.98px) {
  .space-xs-small { gap: 8px; }
  .space-xs-medium { gap: 16px; }
  .space-xs-large { gap: 24px; }
}

@media (min-width: 576px) and (max-width: 767.98px) {
  .space-sm-small { gap: 8px; }
  .space-sm-medium { gap: 16px; }
  .space-sm-large { gap: 24px; }
}

@media (min-width: 768px) and (max-width: 991.98px) {
  .space-md-small { gap: 8px; }
  .space-md-medium { gap: 16px; }
  .space-md-large { gap: 24px; }
}

@media (min-width: 992px) and (max-width: 1199.98px) {
  .space-lg-small { gap: 8px; }
  .space-lg-medium { gap: 16px; }
  .space-lg-large { gap: 24px; }
}

@media (min-width: 1200px) and (max-width: 1399.98px) {
  .space-xl-small { gap: 8px; }
  .space-xl-medium { gap: 16px; }
  .space-xl-large { gap: 24px; }
}

@media (min-width: 1400px) {
  .space-xxl-small { gap: 8px; }
  .space-xxl-medium { gap: 16px; }
  .space-xxl-large { gap: 24px; }
}
</style>