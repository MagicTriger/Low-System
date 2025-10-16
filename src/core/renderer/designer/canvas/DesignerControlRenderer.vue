<template>
  <div
    ref="wrapperRef"
    class="designer-control-wrapper"
    :class="{
      'is-selected': isSelected,
      'is-hovered': isHovered,
      'is-container': isContainer,
    }"
    :style="wrapperStyle"
    :data-control-id="control.id"
    @click.stop="handleClick"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <!-- 实际控件渲染 -->
    <component
      ref="controlRef"
      :is="controlComponent"
      :control="control"
      :class="controlClasses"
      :style="controlStyles"
      v-bind="controlProps"
    >
      <!-- 子控件渲染在容器内部 -->
      <template v-if="isContainer && control.children && control.children.length > 0">
        <DesignerControlRenderer
          v-for="child in control.children"
          :key="child.id"
          :control="child"
          :selected-id="selectedId"
          :hovered-id="hoveredId"
          :zoom="zoom"
          @select="$emit('select', $event)"
          @hover="$emit('hover', $event)"
          @drop="$emit('drop', $event)"
        />
      </template>
    </component>

    <!-- 选择覆盖层 - 使用 Teleport 传送到画布容器 -->
    <Teleport to=".canvas" :disabled="!isSelected || !controlRect">
      <SelectionOverlay
        v-if="isSelected && controlRect"
        :visible="true"
        :control-name="controlName"
        :rect="controlRect"
        :is-hovered="false"
        :show-resize-handles="true"
        @resize-start="handleResizeStart"
      />
    </Teleport>

    <!-- 悬停覆盖层 - 使用 Teleport 传送到画布容器 -->
    <Teleport to=".canvas" :disabled="!isHovered || isSelected || !controlRect">
      <SelectionOverlay
        v-if="isHovered && !isSelected && controlRect"
        :visible="true"
        :control-name="controlName"
        :rect="controlRect"
        :is-hovered="true"
        :show-resize-handles="false"
      />
    </Teleport>

    <!-- 容器放置提示 -->
    <div v-if="isContainer && isDragOver" class="drop-hint">
      <svg class="drop-hint-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
      </svg>
      <span>放置到这里</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick, Teleport } from 'vue'
import { debounce } from 'lodash-es'
import type { Control } from '@/core/types'
import { ControlType } from '@/core/types'
import { ControlDefinitions } from '../../definitions'
import { GenerateControlCommonStyle } from '../../style-generate'
import { controlToStyles } from '../utils/styleConverter'
import SelectionOverlay from './SelectionOverlay.vue'

interface Props {
  control: Control
  selectedId?: string | null
  hoveredId?: string | null
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  selectedId: null,
  hoveredId: null,
  zoom: 1,
})

const emit = defineEmits<{
  select: [controlId: string]
  hover: [controlId: string | null]
  drop: [data: { controlId: string; event: DragEvent }]
  'resize-start': [data: { controlId: string; handle: string; event: MouseEvent }]
}>()

// 引用
const wrapperRef = ref<HTMLElement>()
const controlRef = ref()
const controlRect = ref<DOMRect>()
const isDragOver = ref(false)

// 循环检测
let updateCount = 0
let lastUpdateTime = 0
const isUpdating = ref(false)

// 控件定义
const controlDef = computed(() => ControlDefinitions[props.control.kind])
const controlComponent = computed(() => controlDef.value?.component || 'div')

// 控件名称
const controlName = computed(() => {
  return props.control.name || controlDef.value?.kindName || props.control.kind
})

// 是否为容器
const isContainer = computed(() => {
  // 只有类型为 container 的组件才是容器
  return controlDef.value?.type === ControlType.Container
})

// 选中和悬停状态
const isSelected = computed(() => props.selectedId === props.control.id)
const isHovered = computed(() => props.hoveredId === props.control.id)

// 包装器样式
const wrapperStyle = computed(() => {
  const styles: Record<string, any> = {
    position: 'relative',
    minHeight: isContainer.value ? '50px' : 'auto',
  }

  return styles
})

// 控件类名
const controlClasses = computed(() => {
  const classes = [...(props.control.classes || [])]
  classes.push(`ctrl-${props.control.kind}`)

  if (isSelected.value) {
    classes.push('ctrl-selected')
  }

  if (isHovered.value) {
    classes.push('ctrl-hovered')
  }

  return classes
})

// 控件样式
const controlStyles = computed(() => {
  // 合并旧的样式系统和新的配置系统
  const oldStyles = GenerateControlCommonStyle(props.control)
  const newStyles = controlToStyles(props.control)

  // 新样式优先级更高
  const styles = { ...oldStyles, ...newStyles }

  // 在设计模式下，确保容器可见
  if (!styles.minHeight && isContainer.value) {
    styles.minHeight = '50px'
  }

  // 不设置 pointer-events，让组件正常渲染和交互
  // 选择和拖拽由包装器处理

  return styles
})

// 控件属性
const controlProps = computed(() => {
  const result: Record<string, any> = {}

  // settings 是数组格式，需要转换
  if (Array.isArray(controlDef.value?.settings)) {
    controlDef.value.settings.forEach(setting => {
      if (props.control[setting.key] !== undefined) {
        result[setting.key] = props.control[setting.key]
      } else if (setting.defaultValue !== undefined) {
        result[setting.key] = setting.defaultValue
      }
    })
  }

  return result
})

// 更新控件矩形（带防抖和循环检测）
const updateControlRect = debounce(() => {
  // 循环检测
  const now = Date.now()
  if (now - lastUpdateTime < 100) {
    updateCount++
    if (updateCount > 10) {
      // 检测到无限循环，停止更新
      return
    }
  } else {
    updateCount = 0
  }
  lastUpdateTime = now

  // 防止重入
  if (isUpdating.value) return
  isUpdating.value = true

  try {
    if (wrapperRef.value) {
      // 获取组件相对于视口的位置
      const rect = wrapperRef.value.getBoundingClientRect()

      // 获取画布元素（.canvas）的位置
      const canvas = document.querySelector('.canvas')
      if (!canvas) {
        // 移除 console.warn 避免触发 DOM 变化
        return
      }

      const canvasRect = canvas.getBoundingClientRect()

      // 计算相对于画布的位置
      controlRect.value = {
        left: rect.left - canvasRect.left,
        top: rect.top - canvasRect.top,
        width: rect.width,
        height: rect.height,
        right: rect.right - canvasRect.left,
        bottom: rect.bottom - canvasRect.top,
        x: rect.x - canvasRect.left,
        y: rect.y - canvasRect.top,
      } as DOMRect

      // 移除 console.log 避免触发 DOM 变化
    }
  } finally {
    nextTick(() => {
      isUpdating.value = false
    })
  }
}, 16) // 约 60fps

// 点击处理
function handleClick(event: MouseEvent) {
  event.stopPropagation()
  emit('select', props.control.id)
}

// 鼠标进入
function handleMouseEnter() {
  emit('hover', props.control.id)
  updateControlRect()
}

// 鼠标离开
function handleMouseLeave() {
  emit('hover', null)
}

// 拖拽处理
function handleDragOver(event: DragEvent) {
  if (!isContainer.value) return

  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  if (!isContainer.value) return

  event.stopPropagation()
  isDragOver.value = false
}

function handleDrop(event: DragEvent) {
  if (!isContainer.value) return

  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  emit('drop', {
    controlId: props.control.id,
    event,
  })
}

// 调整大小开始
function handleResizeStart(event: MouseEvent, handle: string) {
  emit('resize-start', {
    controlId: props.control.id,
    handle,
    event,
  })
}

// 监听 control 的特定属性变化，避免 deep: true 导致的过度更新
watch(
  () => [props.control.styles, props.control.classes, props.control.children?.length],
  () => {
    nextTick(() => {
      updateControlRect()
    })
  }
)

// 监听选中状态变化
watch(
  () => isSelected.value,
  selected => {
    if (selected) {
      nextTick(() => {
        updateControlRect()
      })
    }
  }
)

// 生命周期
onMounted(() => {
  updateControlRect()

  // 监听窗口大小变化
  window.addEventListener('resize', updateControlRect)

  // 使用 MutationObserver 监听 DOM 变化（优化配置）
  if (wrapperRef.value) {
    const observer = new MutationObserver(
      debounce(() => {
        updateControlRect()
      }, 16)
    )

    observer.observe(wrapperRef.value, {
      attributes: true,
      attributeFilter: ['style', 'class'], // 只监听特定属性
      childList: true,
      subtree: false, // 不监听子树，避免过度触发
    })

    // 清理
    onUnmounted(() => {
      observer.disconnect()
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('resize', updateControlRect)
})

// 暴露方法
defineExpose({
  updateRect: updateControlRect,
  wrapperRef,
  controlRef,
})
</script>

<style scoped>
.designer-control-wrapper {
  position: relative;
  box-sizing: border-box;
  transition: all 0.2s ease;
}

.designer-control-wrapper.is-container {
  min-height: 50px;
  border: 1px dashed transparent;
}

.designer-control-wrapper.is-container:hover {
  border-color: #e5e7eb;
}

/* 选中状态由 SelectionOverlay 组件显示 */

/* 悬停状态由 SelectionOverlay 组件显示 */

/* 容器放置提示 */
.drop-hint {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: rgba(59, 130, 246, 0.05);
  border: 2px dashed #3b82f6;
  border-radius: 4px;
  color: #3b82f6;
  font-size: 14px;
  font-weight: 500;
  pointer-events: none;
  z-index: 10;
}

.drop-hint-icon {
  width: 32px;
  height: 32px;
  stroke-width: 2;
}

/* 组件内容正常显示和渲染，不禁用指针事件 */
/* 选择和拖拽由包装器的事件处理 */
</style>
