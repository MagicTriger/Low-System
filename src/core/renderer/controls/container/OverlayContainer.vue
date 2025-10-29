<template>
  <!-- 
    ⚠️ DEPRECATED: This component is deprecated and will be removed in a future version.
    Please use the new Modal component (src/core/renderer/controls/basic/Modal.vue) instead.
    
    Migration: Use the convertOverlayToModal utility from src/core/utils/overlay-to-modal-converter.ts
    to automatically convert existing overlay-container instances to Modal components.
  -->
  <div v-if="isDesignMode" class="overlay-container-designer deprecated-component" :class="designerClasses">
    <!-- 设计器模式：显示浮层结构预览 -->
    <div class="overlay-header">
      <div class="overlay-title">
        <span class="overlay-icon">{{ overlayTypeIcon }}</span>
        <span class="overlay-name">{{ overlayName || '未命名浮层' }}</span>
        <a-tag :color="overlayTypeColor" size="small">{{ overlayTypeLabel }}</a-tag>
      </div>
      <div class="overlay-meta">
        <span class="overlay-size">{{ displayWidth }} × {{ displayHeight }}</span>
      </div>
    </div>

    <div class="overlay-body">
      <!-- 视图容器区域 -->
      <div class="view-container-section" :class="`container-${containerType}`" :style="containerStyles">
        <div class="section-label">视图容器 ({{ containerTypeLabel }})</div>
        <div class="container-content" :style="containerContentStyles">
          <slot>
            <!-- 渲染子控件 - 使用设计器控件渲染器以支持完整的设计器功能 -->
            <template v-if="children && children.length">
              <component
                v-for="child in children"
                :key="child.id"
                :is="designerControlRenderer || controlRenderer"
                :control="child"
                :selected-id="selectedControlId"
                :hovered-id="hoveredControlId"
                :zoom="zoom"
                @select="handleControlSelect"
                @hover="handleControlHover"
                @drop="handleControlDrop"
                @resize-start="handleResizeStart"
              />
            </template>
            <div v-else class="empty-placeholder">
              <span class="empty-icon">📄</span>
              <p>拖拽组件到此处</p>
            </div>
          </slot>
        </div>
      </div>

      <!-- 目标视图区域 -->
      <div v-if="targetView" class="target-view-section">
        <div class="section-label">目标视图: {{ targetView }}</div>
        <div class="target-view-preview">👁️ 视图预览</div>
      </div>
    </div>
  </div>

  <!-- 运行时模式：根据浮层类型渲染实际组件 -->
  <component
    v-else
    :is="overlayComponent"
    v-model:open="isVisible"
    v-bind="overlayProps"
    :class="['overlay-container-runtime', className]"
    @ok="handleOk"
    @cancel="handleCancel"
    @after-close="handleAfterClose"
  >
    <!-- 视图容器 -->
    <div class="overlay-view-container" :class="`container-${containerType}`" :style="containerStyles">
      <slot>
        <!-- 渲染子控件 -->
        <template v-if="children && children.length">
          <component v-for="child in children" :key="child.id" :is="controlRenderer" :control="child" />
        </template>
      </slot>
    </div>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, watch, inject, provide } from 'vue'
import { Modal, Drawer } from 'ant-design-vue'
import { useControlMembers } from '../../control-members'
import { RootViewContext } from '../../root-view-context'
import type { Control } from '../../base'

/**
 * 浮层容器属性接口
 *
 * @deprecated This interface is deprecated. Use ModalProps from Modal.vue instead.
 */
interface OverlayContainerProps {
  // 基础信息
  overlayId?: string
  overlayName?: string
  overlayType?: 'modal' | 'drawer' | 'fullscreen'

  // 视图容器配置
  containerType?: 'flex' | 'grid' | 'custom'
  containerProps?: {
    // Flex容器属性
    direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse'
    justify?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around' | 'space-evenly'
    align?: 'flex-start' | 'center' | 'flex-end' | 'baseline' | 'stretch'
    gap?: number

    // Grid容器属性
    columns?: number
    rows?: number
    columnGap?: number
    rowGap?: number

    // 自定义容器属性
    customClass?: string
    customStyle?: Record<string, any>
  }

  // 目标视图配置
  targetView?: string

  // 显示配置
  title?: string
  width?: string | number
  height?: string | number
  position?: 'center' | 'top' | 'right' | 'bottom' | 'left'

  // 交互配置
  visible?: boolean
  closable?: boolean
  maskClosable?: boolean
  keyboard?: boolean
  destroyOnClose?: boolean
  mask?: boolean
  centered?: boolean
  zIndex?: number

  // 抽屉特有配置
  placement?: 'top' | 'right' | 'bottom' | 'left'

  // 样式
  className?: string

  // 子控件
  children?: Control[]
}

interface OverlayControl extends Control {
  props?: OverlayContainerProps
}

const props = defineProps<{ control: OverlayControl }>()

const emit = defineEmits<{
  ok: []
  cancel: []
  afterClose: []
  open: []
  close: []
}>()

const { control, eventHandler } = useControlMembers(props)

// 注入控件渲染器和设计器状态
const controlRenderer = inject(RootViewContext.RendererKey, null)
const designerControlRenderer = inject('designerControlRenderer', null)
const selectedControlId = inject('selectedControlId', ref(null))
const hoveredControlId = inject('hoveredControlId', ref(null))
const zoom = inject('zoom', ref(1))

// 提供浮层容器上下文，让子组件知道它们在浮层内
provide('isInOverlay', true)
provide(
  'overlayId',
  computed(() => overlayId.value)
)

// 检查是否在设计器模式
const isDesignMode = computed(() => {
  // 通过全局标记或上下文判断
  return (window as any).__DESIGNER_MODE__ === true || inject('isDesignerMode', false)
})

// 控件属性
const overlayId = computed(() => control.value.props?.overlayId || control.value.id)
const overlayName = computed(() => control.value.props?.overlayName || control.value.name || '浮层容器')
const overlayType = computed(() => control.value.props?.overlayType || 'modal')
const containerType = computed(() => control.value.props?.containerType || 'flex')
const containerProps = computed(() => control.value.props?.containerProps || {})
const targetView = computed(() => control.value.props?.targetView)
const children = computed(() => control.value.children || [])
const className = computed(() => control.value.props?.className || '')

// 显示配置
const title = computed(() => control.value.props?.title || overlayName.value)
const width = computed(() => control.value.props?.width || 520)
const height = computed(() => control.value.props?.height)
const position = computed(() => control.value.props?.position || 'center')
const closable = computed(() => control.value.props?.closable !== false)
const maskClosable = computed(() => control.value.props?.maskClosable !== false)
const keyboard = computed(() => control.value.props?.keyboard !== false)
const destroyOnClose = computed(() => control.value.props?.destroyOnClose || false)
const mask = computed(() => control.value.props?.mask !== false)
const centered = computed(() => control.value.props?.centered || position.value === 'center')
const zIndex = computed(() => control.value.props?.zIndex || 1000)
const placement = computed(() => control.value.props?.placement || 'right')

// 可见性状态
const isVisible = ref(control.value.props?.visible || false)

// 监听外部 visible 变化
watch(
  () => control.value.props?.visible,
  newValue => {
    if (newValue !== undefined) {
      isVisible.value = newValue
    }
  }
)

// 设计器模式样式类
const designerClasses = computed(() => {
  return [`overlay-type-${overlayType.value}`, `container-type-${containerType.value}`]
})

// 浮层类型图标
const overlayTypeIcon = computed(() => {
  switch (overlayType.value) {
    case 'modal':
      return '🪟'
    case 'drawer':
      return '📋'
    case 'fullscreen':
      return '🖥️'
    default:
      return '🪟'
  }
})

// 浮层类型颜色
const overlayTypeColor = computed(() => {
  switch (overlayType.value) {
    case 'modal':
      return 'blue'
    case 'drawer':
      return 'green'
    case 'fullscreen':
      return 'purple'
    default:
      return 'default'
  }
})

// 浮层类型标签
const overlayTypeLabel = computed(() => {
  switch (overlayType.value) {
    case 'modal':
      return '模态框'
    case 'drawer':
      return '抽屉'
    case 'fullscreen':
      return '全屏'
    default:
      return '未知'
  }
})

// 容器类型标签
const containerTypeLabel = computed(() => {
  switch (containerType.value) {
    case 'flex':
      return 'Flex布局'
    case 'grid':
      return 'Grid布局'
    case 'custom':
      return '自定义'
    default:
      return '未知'
  }
})

// 显示尺寸
const displayWidth = computed(() => {
  const w = width.value
  return typeof w === 'number' ? `${w}px` : w
})

const displayHeight = computed(() => {
  const h = height.value
  if (!h) return 'auto'
  return typeof h === 'number' ? `${h}px` : h
})

// 运行时浮层组件
const overlayComponent = computed(() => {
  switch (overlayType.value) {
    case 'drawer':
      return Drawer
    case 'modal':
    case 'fullscreen':
    default:
      return Modal
  }
})

// 运行时浮层属性
const overlayProps = computed(() => {
  const baseProps = {
    title: title.value,
    closable: closable.value,
    maskClosable: maskClosable.value,
    keyboard: keyboard.value,
    destroyOnClose: destroyOnClose.value,
    mask: mask.value,
    zIndex: zIndex.value,
  }

  if (overlayType.value === 'drawer') {
    return {
      ...baseProps,
      width: width.value,
      height: height.value,
      placement: placement.value,
    }
  }

  if (overlayType.value === 'fullscreen') {
    return {
      ...baseProps,
      width: '100vw',
      style: { top: 0, paddingBottom: 0, maxWidth: '100vw' },
      bodyStyle: { height: 'calc(100vh - 110px)' },
      centered: true,
    }
  }

  // modal
  return {
    ...baseProps,
    width: width.value,
    centered: centered.value,
  }
})

// 容器样式 - 应用于外层section
const containerStyles = computed(() => {
  const styles: Record<string, any> = {}
  return styles
})

// 容器内容样式 - 应用于实际的内容区域
const containerContentStyles = computed(() => {
  const styles: Record<string, any> = {
    position: 'relative',
    width: '100%',
    minHeight: '120px',
  }

  const props = containerProps.value

  if (containerType.value === 'flex') {
    styles.display = 'flex'
    styles.flexDirection = props.direction || 'column'
    styles.justifyContent = props.justify || 'flex-start'
    styles.alignItems = props.align || 'stretch'
    if (props.gap !== undefined) {
      styles.gap = `${props.gap}px`
    }
  } else if (containerType.value === 'grid') {
    styles.display = 'grid'
    if (props.columns) {
      styles.gridTemplateColumns = `repeat(${props.columns}, 1fr)`
    }
    if (props.rows) {
      styles.gridTemplateRows = `repeat(${props.rows}, 1fr)`
    }
    if (props.columnGap !== undefined) {
      styles.columnGap = `${props.columnGap}px`
    }
    if (props.rowGap !== undefined) {
      styles.rowGap = `${props.rowGap}px`
    }
  } else if (containerType.value === 'custom') {
    if (props.customStyle) {
      Object.assign(styles, props.customStyle)
    }
  }

  return styles
})

// 事件处理
const handleOk = async () => {
  await eventHandler?.('ok')
  emit('ok')
}

const handleCancel = async () => {
  await eventHandler?.('cancel')
  emit('cancel')
}

const handleAfterClose = async () => {
  await eventHandler?.('afterClose')
  emit('afterClose')
}

// 设计器模式下的控件交互事件
const handleControlSelect = (controlId: string) => {
  // 向上传递选择事件到设计器
  const designerState = inject<any>('designerState', null)
  if (designerState?.selectControl) {
    designerState.selectControl(controlId)
  }
}

const handleControlHover = (controlId: string | null) => {
  // 向上传递悬停事件到设计器
  const designerState = inject<any>('designerState', null)
  if (designerState?.hoverControl) {
    designerState.hoverControl(controlId)
  }
}

const handleControlDrop = (data: any) => {
  // 向上传递拖放事件到设计器
  const designerState = inject<any>('designerState', null)
  if (designerState?.handleDrop) {
    designerState.handleDrop(data)
  }
}

const handleResizeStart = (data: any) => {
  // 向上传递调整大小事件到设计器
  const designerState = inject<any>('designerState', null)
  if (designerState?.handleResizeStart) {
    designerState.handleResizeStart(data)
  }
}

// 暴露方法供外部调用
defineExpose({
  show: () => {
    isVisible.value = true
    emit('open')
  },
  hide: () => {
    isVisible.value = false
    emit('close')
  },
  toggle: () => {
    isVisible.value = !isVisible.value
    if (isVisible.value) {
      emit('open')
    } else {
      emit('close')
    }
  },
  getOverlayId: () => overlayId.value,
  getChildren: () => children.value,
})
</script>

<style scoped>
/* ============================================================================
   设计器模式样式
   ============================================================================ */
.overlay-container-designer {
  position: relative;
  border: 2px solid #d9d9d9;
  border-radius: 8px;
  background: #ffffff;
  min-height: 200px;
  overflow: hidden;
}

/* Deprecated component visual indicator */
.overlay-container-designer.deprecated-component {
  border-color: #faad14;
  background: #fffbe6;
}

.overlay-container-designer.deprecated-component::before {
  content: '⚠️ DEPRECATED: Use Modal component instead';
  display: block;
  padding: 4px 8px;
  background: #faad14;
  color: #fff;
  font-size: 11px;
  font-weight: 500;
  text-align: center;
}

.overlay-container-designer:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.overlay-container-designer.deprecated-component:hover {
  border-color: #faad14;
  box-shadow: 0 2px 8px rgba(250, 173, 20, 0.3);
}

.overlay-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e8ecf1 100%);
  border-bottom: 1px solid #e8e8e8;
}

.overlay-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
  color: #262626;
}

.overlay-icon {
  font-size: 16px;
  color: #1890ff;
}

.overlay-name {
  font-size: 14px;
}

.overlay-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #8c8c8c;
}

.overlay-size {
  padding: 2px 8px;
  background: #fff;
  border-radius: 4px;
  border: 1px solid #e8e8e8;
}

.overlay-body {
  padding: 16px;
}

.view-container-section,
.target-view-section {
  margin-bottom: 16px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background: #fafafa;
}

.view-container-section:last-child,
.target-view-section:last-child {
  margin-bottom: 0;
}

.section-label {
  padding: 8px 12px;
  background: #f0f0f0;
  border-bottom: 1px dashed #d9d9d9;
  font-size: 12px;
  font-weight: 500;
  color: #595959;
}

.container-content {
  padding: 16px;
  min-height: 120px;
  position: relative;
  /* 确保子组件可以正常定位和布局 */
  box-sizing: border-box;
}

/* 容器类型样式 - 由 containerContentStyles 动态应用 */
/* 这里不再需要静态样式，因为已经通过 :style 绑定动态应用 */

.empty-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  color: #bfbfbf;
  font-size: 14px;
}

.empty-icon {
  font-size: 32px;
  margin-bottom: 8px;
  color: #d9d9d9;
}

.target-view-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  color: #8c8c8c;
  font-size: 14px;
  gap: 8px;
}

/* 浮层类型特定样式 */
.overlay-type-modal {
  border-color: #1890ff;
}

.overlay-type-drawer {
  border-color: #52c41a;
}

.overlay-type-fullscreen {
  border-color: #722ed1;
}

/* ============================================================================
   运行时模式样式
   ============================================================================ */
.overlay-view-container {
  width: 100%;
  min-height: 100px;
}

/* 容器类型样式 */
.overlay-view-container.container-flex {
  display: flex;
  flex-direction: column;
}

.overlay-view-container.container-grid {
  display: grid;
}

/* ============================================================================
   浮层内组件样式确保
   ============================================================================ */

/* 确保浮层内的组件正常渲染和交互 */
.container-content :deep(.designer-control-wrapper) {
  position: relative;
  box-sizing: border-box;
}

/* 确保浮层内组件的样式与页面画布一致 */
.container-content :deep(.ctrl-button),
.container-content :deep(.ctrl-input),
.container-content :deep(.ctrl-text),
.container-content :deep(.ctrl-image),
.container-content :deep(.ctrl-container) {
  box-sizing: border-box;
}

/* 确保浮层内的容器组件可以正常布局 */
.container-content :deep(.ctrl-flex),
.container-content :deep(.ctrl-grid) {
  position: relative;
}

/* 确保绝对定位的组件在浮层内正确显示 */
.container-content :deep([style*='position: absolute']),
.container-content :deep([style*='position:absolute']) {
  position: absolute !important;
}

/* 确保相对定位的组件在浮层内正确显示 */
.container-content :deep([style*='position: relative']),
.container-content :deep([style*='position:relative']) {
  position: relative !important;
}

/* 确保flex布局在浮层内正常工作 */
.container-content :deep([style*='display: flex']),
.container-content :deep([style*='display:flex']) {
  display: flex !important;
}

/* 确保grid布局在浮层内正常工作 */
.container-content :deep([style*='display: grid']),
.container-content :deep([style*='display:grid']) {
  display: grid !important;
}
</style>
