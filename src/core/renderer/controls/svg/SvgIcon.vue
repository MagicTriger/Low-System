<template>
  <div class="svg-icon-control" :style="containerStyle" @click="handleClick">
    <svg
      v-if="svgContent"
      :width="width"
      :height="height"
      :viewBox="viewBox"
      :class="iconClasses"
      :style="iconStyle"
      v-html="svgContent"
    />
    <div v-else-if="iconName" class="icon-placeholder">
      <component :is="iconComponent" :style="iconStyle" />
    </div>
    <div v-else class="icon-empty">
      <FileImageOutlined :style="iconStyle" />
    </div>
    
    <span v-if="showLabel && label" class="icon-label" :style="labelStyle">
      {{ label }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { FileImageOutlined } from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface Props {
  control: Control
}

const props = defineProps<Props>()

// 使用控件成员
const { value, eventHandler } = useControlMembers(props)

// 组件状态
const svgContent = ref('')
const iconComponent = ref(null)

// 控件属性
const iconName = computed(() => value.value?.iconName || '')
const iconUrl = computed(() => value.value?.iconUrl || '')
const iconData = computed(() => value.value?.iconData || '')
const width = computed(() => value.value?.width || props.control.width || '24')
const height = computed(() => value.value?.height || props.control.height || '24')
const color = computed(() => value.value?.color || '#333333')
const hoverColor = computed(() => value.value?.hoverColor || color.value)
const size = computed(() => value.value?.size || 'default') // small | default | large | custom
const rotation = computed(() => value.value?.rotation || 0)
const flipX = computed(() => value.value?.flipX || false)
const flipY = computed(() => value.value?.flipY || false)
const opacity = computed(() => value.value?.opacity || 1)
const cursor = computed(() => value.value?.cursor || 'default')
const label = computed(() => value.value?.label || '')
const showLabel = computed(() => value.value?.showLabel || false)
const labelPosition = computed(() => value.value?.labelPosition || 'bottom') // top | bottom | left | right
const animation = computed(() => value.value?.animation || 'none') // none | spin | pulse | bounce

// 样式计算
const containerStyle = computed(() => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: getLabelDirection(),
  gap: showLabel.value ? '4px' : '0',
  cursor: cursor.value
}))

const iconClasses = computed(() => [
  'svg-icon',
  `size-${size.value}`,
  `animation-${animation.value}`,
  {
    'flip-x': flipX.value,
    'flip-y': flipY.value,
    'interactive': cursor.value === 'pointer'
  }
])

const iconStyle = computed(() => ({
  width: getIconSize(),
  height: getIconSize(),
  fill: color.value,
  color: color.value,
  transform: getTransform(),
  opacity: opacity.value,
  transition: 'all 0.3s ease'
}))

const labelStyle = computed(() => ({
  fontSize: getLabelFontSize(),
  color: color.value,
  fontWeight: '400',
  lineHeight: '1.2'
}))

const viewBox = computed(() => {
  return value.value?.viewBox || `0 0 ${width.value} ${height.value}`
})

// 获取图标尺寸
const getIconSize = () => {
  if (size.value === 'custom') {
    return typeof width.value === 'number' ? `${width.value}px` : width.value
  }
  
  const sizeMap = {
    small: '16px',
    default: '24px',
    large: '32px'
  }
  
  return sizeMap[size.value] || '24px'
}

// 获取标签方向
const getLabelDirection = () => {
  const directionMap = {
    top: 'column-reverse',
    bottom: 'column',
    left: 'row-reverse',
    right: 'row'
  }
  
  return directionMap[labelPosition.value] || 'column'
}

// 获取标签字体大小
const getLabelFontSize = () => {
  const fontSizeMap = {
    small: '12px',
    default: '14px',
    large: '16px'
  }
  
  return fontSizeMap[size.value] || '14px'
}

// 获取变换样式
const getTransform = () => {
  const transforms = []
  
  if (rotation.value) {
    transforms.push(`rotate(${rotation.value}deg)`)
  }
  
  if (flipX.value) {
    transforms.push('scaleX(-1)')
  }
  
  if (flipY.value) {
    transforms.push('scaleY(-1)')
  }
  
  return transforms.length > 0 ? transforms.join(' ') : 'none'
}

// 加载SVG内容
const loadSvgContent = async () => {
  try {
    if (iconData.value) {
      // 直接使用提供的SVG数据
      svgContent.value = iconData.value
    } else if (iconUrl.value) {
      // 从URL加载SVG
      const response = await fetch(iconUrl.value)
      if (response.ok) {
        const text = await response.text()
        svgContent.value = text.replace(/<svg[^>]*>|<\/svg>/g, '')
      }
    } else if (iconName.value) {
      // 加载内置图标组件
      try {
        const iconModule = await import(`@ant-design/icons-vue`)
        iconComponent.value = iconModule[iconName.value] || null
      } catch (error) {
        console.warn(`Icon ${iconName.value} not found`)
      }
    }
  } catch (error) {
    console.error('Failed to load SVG:', error)
    svgContent.value = ''
  }
}

// 事件处理
const handleClick = (event: MouseEvent) => {
  eventHandler('click', { event, iconName: iconName.value })
}

// 监听属性变化
watch([iconName, iconUrl, iconData], () => {
  loadSvgContent()
}, { immediate: true })

// 生命周期
onMounted(() => {
  loadSvgContent()
})
</script>

<style scoped>
.svg-icon-control {
  display: inline-flex;
  user-select: none;
}

.svg-icon {
  display: block;
  flex-shrink: 0;
}

.svg-icon.interactive:hover {
  opacity: 0.8;
}

.svg-icon.flip-x {
  transform: scaleX(-1);
}

.svg-icon.flip-y {
  transform: scaleY(-1);
}

/* 动画效果 */
.svg-icon.animation-spin {
  animation: svg-spin 1s linear infinite;
}

.svg-icon.animation-pulse {
  animation: svg-pulse 1.5s ease-in-out infinite;
}

.svg-icon.animation-bounce {
  animation: svg-bounce 1s ease-in-out infinite;
}

@keyframes svg-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes svg-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes svg-bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.icon-placeholder,
.icon-empty {
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-label {
  white-space: nowrap;
  text-align: center;
}

/* 尺寸变体 */
.svg-icon.size-small {
  width: 16px;
  height: 16px;
}

.svg-icon.size-default {
  width: 24px;
  height: 24px;
}

.svg-icon.size-large {
  width: 32px;
  height: 32px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .svg-icon.size-large {
    width: 28px;
    height: 28px;
  }
  
  .icon-label {
    font-size: 12px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .svg-icon-control {
    color: #ffffff;
  }
  
  .svg-icon {
    fill: currentColor;
  }
}

/* 高对比度支持 */
@media (prefers-contrast: high) {
  .svg-icon {
    filter: contrast(1.2);
  }
}

/* 减少动画支持 */
@media (prefers-reduced-motion: reduce) {
  .svg-icon.animation-spin,
  .svg-icon.animation-pulse,
  .svg-icon.animation-bounce {
    animation: none;
  }
  
  .svg-icon {
    transition: none;
  }
}
</style>