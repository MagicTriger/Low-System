<template>
  <div
    :class="wrapperClasses"
    :style="wrapperStyles"
    :data-control-id="control.id"
    :data-control-name="control.name || control.kind"
    @click.stop="handleSelect"
    @mouseenter="handleMouseEnter"
    @mouseleave="handleMouseLeave"
  >
    <!-- 控件内容 -->
    <component
      ref="controlRef"
      :is="controlComponent"
      :control="control"
      :zoom="zoom"
      @click.stop
    />
    
    <!-- 选中状态指示器 -->
    <div v-if="isSelected" class="selection-indicator">
      <div class="selection-border"></div>
      <div class="selection-label">{{ control.name || control.kind }}</div>
      <div class="selection-actions">
        <a-button size="small" type="text" @click.stop="handleCopy">
          <copy-outlined />
        </a-button>
        <a-button size="small" type="text" danger @click.stop="handleDelete">
          <delete-outlined />
        </a-button>
      </div>
    </div>
    
    <!-- 悬停状态指示器 -->
    <div v-else-if="isHovered" class="hover-indicator">
      <div class="hover-border"></div>
      <div class="hover-label">{{ control.name || control.kind }}</div>
    </div>
    
    <!-- 拖拽放置区域 -->
    <div
      v-if="canDrop"
      class="drop-zone"
      @dragover.prevent="handleDragOver"
      @drop.prevent="handleDrop"
      @dragleave="handleDragLeave"
    >
      <div class="drop-indicator">
        <plus-outlined />
        <span>放置组件到此处</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { CopyOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue'
import { useControlMembers } from '../control-members'
import { RootViewContext } from '../root-view-context'
import { ControlDefinitions } from '../definitions'
import type { Control } from '../base'

interface Props {
  control: Control
  viewId: string
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1
})

// 注入上下文
const ctx = inject<RootViewContext>(RootViewContext.ProvideKey)

// 状态管理
const isHovered = ref(false)
const canDrop = ref(false)

// 控件引用
const controlRef = ref()

// 计算属性
const controlComponent = computed(() => {
  const def = ControlDefinitions[props.control.kind]
  return def?.component || 'div'
})

const isSelected = computed(() => {
  return ctx?.activeCtrls.value[props.viewId]?.id === props.control.id
})

const wrapperClasses = computed(() => [
  'designer-control-wrapper',
  `control-${props.control.kind}`,
  {
    'is-selected': isSelected.value,
    'is-hovered': isHovered.value,
    'can-drop': canDrop.value
  }
])

const wrapperStyles = computed(() => {
  const styles: Record<string, any> = {
    position: 'relative'
  }
  
  if (props.zoom !== 1) {
    styles.zoom = props.zoom
  }
  
  return styles
})

// 事件处理
const handleSelect = () => {
  ctx?.setActiveControl(props.viewId, props.control.id)
}

const handleMouseEnter = () => {
  if (!isSelected.value) {
    isHovered.value = true
  }
}

const handleMouseLeave = () => {
  isHovered.value = false
}

const handleCopy = () => {
  ctx?.copyControl(props.control)
}

const handleDelete = () => {
  ctx?.deleteControl(props.viewId, props.control.id)
}

const handleDragOver = (event: DragEvent) => {
  event.preventDefault()
  canDrop.value = true
}

const handleDrop = (event: DragEvent) => {
  event.preventDefault()
  canDrop.value = false
  
  const controlKind = event.dataTransfer?.getData('text/plain')
  if (controlKind && ctx) {
    // 计算放置位置
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    
    ctx.addControl(props.viewId, controlKind, { x, y })
  }
}

const handleDragLeave = () => {
  canDrop.value = false
}

// 暴露方法
defineExpose({
  control: props.control,
  controlRef,
  select: handleSelect,
  copy: handleCopy,
  delete: handleDelete
})
</script>

<style scoped>
.designer-control-wrapper {
  position: relative;
  min-height: 20px;
  transition: all 0.2s ease;
}

.designer-control-wrapper:hover {
  z-index: 10;
}

.designer-control-wrapper.is-selected {
  z-index: 20;
}

/* 选中状态指示器 */
.selection-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 1000;
}

.selection-border {
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  border: 2px solid #1890ff;
  border-radius: 4px;
  background: rgba(24, 144, 255, 0.1);
}

.selection-label {
  position: absolute;
  top: -24px;
  left: -2px;
  background: #1890ff;
  color: white;
  padding: 2px 8px;
  font-size: 12px;
  border-radius: 2px;
  white-space: nowrap;
  z-index: 1001;
}

.selection-actions {
  position: absolute;
  top: -24px;
  right: -2px;
  display: flex;
  gap: 2px;
  pointer-events: auto;
  z-index: 1001;
}

.selection-actions .ant-btn {
  height: 20px;
  width: 20px;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #d9d9d9;
}

/* 悬停状态指示器 */
.hover-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}

.hover-border {
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border: 1px dashed #1890ff;
  border-radius: 4px;
}

.hover-label {
  position: absolute;
  top: -20px;
  left: -1px;
  background: rgba(24, 144, 255, 0.8);
  color: white;
  padding: 1px 6px;
  font-size: 11px;
  border-radius: 2px;
  white-space: nowrap;
}

/* 拖拽放置区域 */
.drop-zone {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(24, 144, 255, 0.1);
  border: 2px dashed #1890ff;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 500;
}

.drop-indicator {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #1890ff;
  font-size: 14px;
}

.drop-indicator .anticon {
  font-size: 24px;
}

/* 容器控件特殊样式 */
.control-flex:empty::after,
.control-grid:empty::after,
.control-view:empty::after {
  content: '拖拽组件到此处';
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 12px;
  min-height: 40px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  background-color: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .selection-label,
  .hover-label {
    font-size: 10px;
    padding: 1px 4px;
  }
  
  .selection-actions .ant-btn {
    height: 18px;
    width: 18px;
  }
}
</style>