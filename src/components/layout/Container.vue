<template>
  <component 
    :is="props.tag"
    :class="containerClasses"
    :style="containerStyles"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, type PropType } from 'vue'
import { useContainerManager, type ContainerConfig, type ResponsiveConfig } from '@/core/layout'

/**
 * 容器组件属性
 */
interface ContainerProps {
  /** 是否为流式容器 */
  fluid?: boolean | ResponsiveConfig
  /** 最大宽度 */
  maxWidth?: number | string | ResponsiveConfig
  /** 内边距 */
  padding?: number | string | ResponsiveConfig
  /** 外边距 */
  margin?: number | string | ResponsiveConfig
  /** 自定义类名 */
  class?: string | string[] | Record<string, boolean>
  /** 容器配置 */
  config?: Partial<ContainerConfig>
  /** 是否启用响应式 */
  responsive?: boolean
  /** 标签名 */
  tag?: string
}

const props = withDefaults(defineProps<ContainerProps>(), {
  fluid: false,
  responsive: true,
  tag: 'div'
})

// 响应式窗口宽度
const windowWidth = ref(window.innerWidth)

// 监听窗口大小变化
const handleResize = () => {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// 构建容器配置
const containerConfig = computed(() => {
  const config: Partial<ContainerConfig> = {
    ...props.config
  }

  // 处理fluid属性
  if (typeof props.fluid === 'boolean') {
    config.fluid = props.fluid
  } else if (props.fluid && typeof props.fluid === 'object') {
    // 响应式fluid配置暂时使用默认值，实际应该根据当前断点计算
    config.fluid = false
  }

  // 处理maxWidth属性
  if (props.maxWidth !== undefined) {
    if (typeof props.maxWidth === 'object') {
      // 响应式maxWidth配置暂时使用默认值
      config.maxWidth = '100%'
    } else {
      config.maxWidth = props.maxWidth
    }
  }

  // 处理padding属性
  if (props.padding !== undefined) {
    if (typeof props.padding === 'object') {
      // 响应式padding配置暂时使用默认值
      config.padding = 16
    } else {
      config.padding = props.padding
    }
  }

  // 处理margin属性
  if (props.margin !== undefined) {
    if (typeof props.margin === 'object') {
      // 响应式margin配置暂时使用默认值
      config.margin = 'auto'
    } else {
      config.margin = props.margin
    }
  }

  return config
})

// 使用容器管理器
const { containerStyles: managedStyles } = useContainerManager(containerConfig.value)

// 容器样式
const containerStyles = computed(() => {
  if (!props.responsive) {
    // 非响应式模式，使用静态样式
    const styles: Record<string, any> = {
      width: '100%',
      marginLeft: 'auto',
      marginRight: 'auto'
    }

    if (props.padding) {
      if (typeof props.padding === 'string') {
        styles.padding = props.padding
      } else {
        styles.paddingLeft = typeof props.padding === 'number' ? `${props.padding}px` : props.padding
        styles.paddingRight = typeof props.padding === 'number' ? `${props.padding}px` : props.padding
      }
    }

    if (props.margin) {
      if (typeof props.margin === 'string') {
        styles.margin = props.margin
      } else {
        styles.marginLeft = typeof props.margin === 'number' ? `${props.margin}px` : props.margin
        styles.marginRight = typeof props.margin === 'number' ? `${props.margin}px` : props.margin
      }
    }

    if (!props.fluid && props.maxWidth) {
      if (typeof props.maxWidth === 'object') {
        // 响应式maxWidth配置
        const width = windowWidth.value
        if (width < 768 && 'xs' in props.maxWidth) {
          styles.maxWidth = props.maxWidth.xs
        } else if (width >= 768 && 'md' in props.maxWidth) {
          styles.maxWidth = props.maxWidth.md
        } else if (width >= 992 && 'lg' in props.maxWidth) {
          styles.maxWidth = props.maxWidth.lg
        } else {
          styles.maxWidth = '100%'
        }
      } else {
        styles.maxWidth = typeof props.maxWidth === 'number' ? `${props.maxWidth}px` : props.maxWidth
      }
    }

    return styles
  }

  return managedStyles.value
})

// 容器类名
const containerClasses = computed(() => {
  const classes: string[] = []

  // 基础类名
  const isFluid = typeof props.fluid === 'boolean' ? props.fluid : false
  classes.push(isFluid ? 'container-fluid' : 'container')

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

// 暴露计算属性供测试使用
const isFluid = computed(() => {
  if (typeof props.fluid === 'boolean') {
    return props.fluid
  }
  if (props.fluid && typeof props.fluid === 'object') {
    // 对于响应式配置，根据当前窗口宽度判断
    const width = windowWidth.value
    
    // 从大到小检查断点，找到第一个匹配的配置
    if (width >= 1200 && 'xl' in props.fluid) {
      return props.fluid.xl
    } else if (width >= 992 && 'lg' in props.fluid) {
      return props.fluid.lg
    } else if (width >= 768 && 'md' in props.fluid) {
      return props.fluid.md
    } else if (width >= 576 && 'sm' in props.fluid) {
      return props.fluid.sm
    } else if ('xs' in props.fluid) {
      return props.fluid.xs
    }
    
    // 如果没有匹配的断点配置，返回false
    return false
  }
  return false
})

// 当前最大宽度
const currentMaxWidth = computed(() => {
  if (!props.responsive || typeof props.maxWidth !== 'object' || !props.maxWidth) {
    return props.maxWidth === null ? undefined : props.maxWidth
  }
  
  // 响应式模式下根据窗口宽度判断
  const width = windowWidth.value
  
  // 从大到小检查断点，找到第一个匹配的配置
  if (width >= 1200 && 'xl' in props.maxWidth) {
    return props.maxWidth.xl
  } else if (width >= 992 && 'lg' in props.maxWidth) {
    return props.maxWidth.lg
  } else if (width >= 768 && 'md' in props.maxWidth) {
    return props.maxWidth.md
  } else if (width >= 576 && 'sm' in props.maxWidth) {
    return props.maxWidth.sm
  } else if ('xs' in props.maxWidth) {
    return props.maxWidth.xs
  }
  
  return undefined
})

// 当前padding值
const currentPadding = computed(() => {
  if (!props.responsive || typeof props.padding !== 'object' || !props.padding) {
    return props.padding
  }
  
  // 响应式模式下根据窗口宽度判断
  const width = windowWidth.value
  
  // 从大到小检查断点，找到第一个匹配的配置
  if (width >= 1200 && 'xl' in props.padding) {
    return props.padding.xl
  } else if (width >= 992 && 'lg' in props.padding) {
    return props.padding.lg
  } else if (width >= 768 && 'md' in props.padding) {
    return props.padding.md
  } else if (width >= 576 && 'sm' in props.padding) {
    return props.padding.sm
  } else if ('xs' in props.padding) {
    return props.padding.xs
  }
  
  return undefined
})

// 当前margin值
const currentMargin = computed(() => {
  if (!props.responsive || typeof props.margin !== 'object' || !props.margin) {
    return props.margin || ''
  }
  
  // 响应式模式下根据窗口宽度判断
  const width = windowWidth.value
  
  // 从大到小检查断点，找到第一个匹配的配置
  if (width >= 1200 && 'xl' in props.margin) {
    return props.margin.xl
  } else if (width >= 992 && 'lg' in props.margin) {
    return props.margin.lg
  } else if (width >= 768 && 'md' in props.margin) {
    return props.margin.md
  } else if (width >= 576 && 'sm' in props.margin) {
    return props.margin.sm
  } else if ('xs' in props.margin) {
    return props.margin.xs
  }
  
  return ''
})

// 暴露给测试
defineExpose({
  isFluid,
  currentMaxWidth,
  currentPadding,
  currentMargin,
  containerStyles
})
</script>

<style scoped>
.container {
  width: 100%;
  margin-left: auto;
  margin-right: auto;
  padding-left: 15px;
  padding-right: 15px;
}

.container-fluid {
  width: 100%;
  padding-left: 15px;
  padding-right: 15px;
}

/* 响应式断点 */
@media (min-width: 576px) {
  .container {
    max-width: 540px;
  }
}

@media (min-width: 768px) {
  .container {
    max-width: 720px;
  }
}

@media (min-width: 992px) {
  .container {
    max-width: 960px;
  }
}

@media (min-width: 1200px) {
  .container {
    max-width: 1140px;
  }
}

@media (min-width: 1400px) {
  .container {
    max-width: 1320px;
  }
}
</style>