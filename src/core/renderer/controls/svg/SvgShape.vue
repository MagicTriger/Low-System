<template>
  <div class="svg-shape-control" :style="containerStyle" @click="handleClick">
    <svg
      :width="width"
      :height="height"
      :viewBox="viewBox"
      :class="shapeClasses"
      :style="svgStyle"
    >
      <defs v-if="hasGradient || hasPattern">
        <!-- 渐变定义 -->
        <linearGradient
          v-if="gradientType === 'linear'"
          :id="gradientId"
          :x1="gradientStart.x"
          :y1="gradientStart.y"
          :x2="gradientEnd.x"
          :y2="gradientEnd.y"
        >
          <stop
            v-for="(stop, index) in gradientStops"
            :key="index"
            :offset="stop.offset"
            :stop-color="stop.color"
            :stop-opacity="stop.opacity || 1"
          />
        </linearGradient>
        
        <radialGradient
          v-if="gradientType === 'radial'"
          :id="gradientId"
          :cx="gradientCenter.x"
          :cy="gradientCenter.y"
          :r="gradientRadius"
        >
          <stop
            v-for="(stop, index) in gradientStops"
            :key="index"
            :offset="stop.offset"
            :stop-color="stop.color"
            :stop-opacity="stop.opacity || 1"
          />
        </radialGradient>
        
        <!-- 图案定义 -->
        <pattern
          v-if="hasPattern"
          :id="patternId"
          :patternUnits="patternUnits"
          :width="patternSize.width"
          :height="patternSize.height"
        >
          <component :is="patternContent" />
        </pattern>
      </defs>
      
      <!-- 形状渲染 -->
      <component
        :is="shapeComponent"
        v-bind="shapeProps"
        :style="shapeStyle"
        @click="handleShapeClick"
        @mouseenter="handleMouseEnter"
        @mouseleave="handleMouseLeave"
      />
      
      <!-- 文本标签 -->
      <text
        v-if="showText && text"
        :x="textPosition.x"
        :y="textPosition.y"
        :text-anchor="textAnchor"
        :dominant-baseline="textBaseline"
        :style="textStyle"
      >
        {{ text }}
      </text>
    </svg>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface Props {
  control: Control
}

const props = defineProps<Props>()

// 使用控件成员
const { value, eventHandler } = useControlMembers(props)

// 组件状态
const isHovered = ref(false)
const gradientId = ref(`gradient-${Math.random().toString(36).substr(2, 9)}`)
const patternId = ref(`pattern-${Math.random().toString(36).substr(2, 9)}`)

// 控件属性
const shapeType = computed(() => value.value?.shapeType || 'rectangle')
const width = computed(() => value.value?.width || props.control.width || '100')
const height = computed(() => value.value?.height || props.control.height || '100')
const fillColor = computed(() => value.value?.fillColor || '#1890ff')
const strokeColor = computed(() => value.value?.strokeColor || 'none')
const strokeWidth = computed(() => value.value?.strokeWidth || 1)
const strokeDasharray = computed(() => value.value?.strokeDasharray || 'none')
const opacity = computed(() => value.value?.opacity || 1)
const rotation = computed(() => value.value?.rotation || 0)
const scaleX = computed(() => value.value?.scaleX || 1)
const scaleY = computed(() => value.value?.scaleY || 1)

// 渐变属性
const gradientType = computed(() => value.value?.gradientType || 'none') // none | linear | radial
const gradientStops = computed(() => value.value?.gradientStops || [])
const gradientStart = computed(() => value.value?.gradientStart || { x: '0%', y: '0%' })
const gradientEnd = computed(() => value.value?.gradientEnd || { x: '100%', y: '0%' })
const gradientCenter = computed(() => value.value?.gradientCenter || { x: '50%', y: '50%' })
const gradientRadius = computed(() => value.value?.gradientRadius || '50%')

// 图案属性
const patternType = computed(() => value.value?.patternType || 'none')
const patternSize = computed(() => value.value?.patternSize || { width: 10, height: 10 })
const patternUnits = computed(() => value.value?.patternUnits || 'userSpaceOnUse')

// 文本属性
const text = computed(() => value.value?.text || '')
const showText = computed(() => value.value?.showText || false)
const textColor = computed(() => value.value?.textColor || '#333333')
const fontSize = computed(() => value.value?.fontSize || '14')
const fontFamily = computed(() => value.value?.fontFamily || 'Arial, sans-serif')
const textAnchor = computed(() => value.value?.textAnchor || 'middle')
const textBaseline = computed(() => value.value?.textBaseline || 'middle')

// 交互属性
const hoverFillColor = computed(() => value.value?.hoverFillColor || fillColor.value)
const hoverStrokeColor = computed(() => value.value?.hoverStrokeColor || strokeColor.value)
const cursor = computed(() => value.value?.cursor || 'default')

// 计算属性
const hasGradient = computed(() => gradientType.value !== 'none' && gradientStops.value.length > 0)
const hasPattern = computed(() => patternType.value !== 'none')

const viewBox = computed(() => {
  return value.value?.viewBox || `0 0 ${width.value} ${height.value}`
})

const containerStyle = computed(() => ({
  display: 'inline-block',
  cursor: cursor.value
}))

const shapeClasses = computed(() => [
  'svg-shape',
  `shape-${shapeType.value}`,
  {
    'interactive': cursor.value === 'pointer',
    'hovered': isHovered.value
  }
])

const svgStyle = computed(() => ({
  overflow: 'visible'
}))

const shapeStyle = computed(() => ({
  fill: getFillValue(),
  stroke: isHovered.value ? hoverStrokeColor.value : strokeColor.value,
  strokeWidth: strokeWidth.value,
  strokeDasharray: strokeDasharray.value === 'none' ? null : strokeDasharray.value,
  opacity: opacity.value,
  transform: getTransform(),
  transition: 'all 0.3s ease'
}))

const textStyle = computed(() => ({
  fill: textColor.value,
  fontSize: `${fontSize.value}px`,
  fontFamily: fontFamily.value,
  pointerEvents: 'none'
}))

const textPosition = computed(() => {
  const w = parseFloat(width.value.toString())
  const h = parseFloat(height.value.toString())
  
  return {
    x: w / 2,
    y: h / 2
  }
})

// 获取形状组件
const shapeComponent = computed(() => {
  const componentMap = {
    rectangle: 'rect',
    circle: 'circle',
    ellipse: 'ellipse',
    triangle: 'polygon',
    polygon: 'polygon',
    line: 'line',
    polyline: 'polyline',
    path: 'path'
  }
  
  return componentMap[shapeType.value] || 'rect'
})

// 获取形状属性
const shapeProps = computed(() => {
  const w = parseFloat(width.value.toString())
  const h = parseFloat(height.value.toString())
  
  switch (shapeType.value) {
    case 'rectangle':
      return {
        x: 0,
        y: 0,
        width: w,
        height: h,
        rx: value.value?.borderRadius || 0,
        ry: value.value?.borderRadius || 0
      }
    
    case 'circle':
      const radius = Math.min(w, h) / 2
      return {
        cx: w / 2,
        cy: h / 2,
        r: radius
      }
    
    case 'ellipse':
      return {
        cx: w / 2,
        cy: h / 2,
        rx: w / 2,
        ry: h / 2
      }
    
    case 'triangle':
      return {
        points: `${w/2},0 ${w},${h} 0,${h}`
      }
    
    case 'polygon':
      return {
        points: value.value?.points || `0,0 ${w},0 ${w},${h} 0,${h}`
      }
    
    case 'line':
      return {
        x1: value.value?.x1 || 0,
        y1: value.value?.y1 || 0,
        x2: value.value?.x2 || w,
        y2: value.value?.y2 || h
      }
    
    case 'polyline':
      return {
        points: value.value?.points || `0,0 ${w/2},${h/2} ${w},0`,
        fill: 'none'
      }
    
    case 'path':
      return {
        d: value.value?.pathData || `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`
      }
    
    default:
      return {}
  }
})

// 获取填充值
const getFillValue = () => {
  if (isHovered.value && hoverFillColor.value !== fillColor.value) {
    return hoverFillColor.value
  }
  
  if (hasGradient.value) {
    return `url(#${gradientId.value})`
  }
  
  if (hasPattern.value) {
    return `url(#${patternId.value})`
  }
  
  return fillColor.value
}

// 获取变换
const getTransform = () => {
  const transforms = []
  const centerX = parseFloat(width.value.toString()) / 2
  const centerY = parseFloat(height.value.toString()) / 2
  
  if (rotation.value) {
    transforms.push(`rotate(${rotation.value} ${centerX} ${centerY})`)
  }
  
  if (scaleX.value !== 1 || scaleY.value !== 1) {
    transforms.push(`scale(${scaleX.value} ${scaleY.value})`)
  }
  
  return transforms.length > 0 ? transforms.join(' ') : null
}

// 获取图案内容
const patternContent = computed(() => {
  switch (patternType.value) {
    case 'dots':
      return h('circle', {
        cx: 5,
        cy: 5,
        r: 2,
        fill: fillColor.value
      })
    
    case 'lines':
      return h('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: 10,
        stroke: fillColor.value,
        strokeWidth: 1
      })
    
    case 'grid':
      return [
        h('line', { x1: 0, y1: 0, x2: 0, y2: 10, stroke: fillColor.value, strokeWidth: 0.5 }),
        h('line', { x1: 0, y1: 0, x2: 10, y2: 0, stroke: fillColor.value, strokeWidth: 0.5 })
      ]
    
    default:
      return null
  }
})

// 事件处理
const handleClick = (event: MouseEvent) => {
  eventHandler('click', { event, shapeType: shapeType.value })
}

const handleShapeClick = (event: MouseEvent) => {
  event.stopPropagation()
  eventHandler('shapeClick', { event, shapeType: shapeType.value })
}

const handleMouseEnter = () => {
  isHovered.value = true
  eventHandler('mouseenter', { shapeType: shapeType.value })
}

const handleMouseLeave = () => {
  isHovered.value = false
  eventHandler('mouseleave', { shapeType: shapeType.value })
}
</script>

<style scoped>
.svg-shape-control {
  display: inline-block;
  user-select: none;
}

.svg-shape {
  display: block;
}

.svg-shape.interactive {
  cursor: pointer;
}

.svg-shape.interactive:hover {
  filter: brightness(1.1);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .svg-shape-control {
    max-width: 100%;
  }
  
  .svg-shape {
    max-width: 100%;
    height: auto;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .svg-shape-control {
    filter: brightness(0.9);
  }
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .svg-shape {
    filter: contrast(1.2);
  }
}

/* 减少动画支持 */
@media (prefers-reduced-motion: reduce) {
  .svg-shape {
    transition: none;
  }
}
</style>