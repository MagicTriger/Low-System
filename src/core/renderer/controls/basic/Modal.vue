<template>
  <!-- 设计器模式 -->
  <div
    v-if="isDesignMode"
    class="modal-design-container"
    :style="containerStyle"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <div class="modal-design-header">
      <span class="modal-design-title">{{ title || '模态框标题' }}</span>
      <span class="modal-design-badge">Modal</span>
    </div>
    <div class="modal-design-body" :class="{ 'is-drag-over': isDragOver }">
      <div v-if="!children || children.length === 0" class="modal-design-empty">
        <inbox-outlined style="font-size: 48px; color: #d9d9d9" />
        <p>拖拽组件到这里</p>
      </div>
      <template v-else>
        <designer-control-renderer
          v-for="child in children"
          :key="child.id"
          :control="child"
          :selected-id="selectedId"
          :hovered-id="hoveredId"
          :zoom="zoom"
          @select="handleChildSelect"
          @hover="handleChildHover"
          @drop="handleChildDrop"
        />
      </template>
    </div>
    <div v-if="footer" class="modal-design-footer">
      <a-button>{{ cancelText || '取消' }}</a-button>
      <a-button type="primary">{{ okText || '确定' }}</a-button>
    </div>
  </div>

  <!-- 运行时模式 -->
  <a-modal
    v-else
    v-model:open="modalVisible"
    :title="title"
    :width="width"
    :closable="closable"
    :mask-closable="maskClosable"
    :keyboard="keyboard"
    :footer="footer ? undefined : null"
    @ok="handleOk"
    @cancel="handleCancel"
    @close="handleClose"
  >
    <!-- 渲染子组件 - 使用control-renderer确保数据绑定和事件处理正常工作 -->
    <template v-if="children && children.length > 0">
      <control-renderer v-for="child in children" :key="child.id" :control="child" />
    </template>

    <template v-if="footer" #footer>
      <a-button @click="handleCancel">{{ cancelText || '取消' }}</a-button>
      <a-button type="primary" @click="handleOk">{{ okText || '确定' }}</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, watch, inject, ref, provide } from 'vue'
import { InboxOutlined } from '@ant-design/icons-vue'
import type { Control } from '@/types'
import type { StateManager } from '@/core/state/StateManager'
import { useControlMembers } from '@/core/renderer/control-members'
import DesignerControlRenderer from '@/core/renderer/designer/canvas/DesignerControlRenderer.vue'
import ControlRenderer from '@/core/renderer/control-renderer.vue'

interface Props {
  control: Control
  isDesignMode?: boolean
  selectedId?: string | null
  hoveredId?: string | null
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  isDesignMode: false,
  selectedId: null,
  hoveredId: null,
  zoom: 1,
})

const emit = defineEmits<{
  select: [controlId: string]
  hover: [controlId: string | null]
  drop: [data: { controlId: string; event: DragEvent }]
  ok: []
  cancel: []
  close: []
}>()

// 使用控件成员钩子获取事件处理器
const { eventHandler } = useControlMembers(props, provide)

// 从control中提取属性
const title = computed(() => props.control.props?.title || '模态框标题')
const width = computed(() => props.control.props?.width || 600)
const visible = computed(() => props.control.props?.visible || false)
const closable = computed(() => props.control.props?.closable !== false)
const maskClosable = computed(() => props.control.props?.maskClosable !== false)
const keyboard = computed(() => props.control.props?.keyboard !== false)
const footer = computed(() => props.control.props?.footer !== false)
const okText = computed(() => props.control.props?.okText || '确定')
const cancelText = computed(() => props.control.props?.cancelText || '取消')
const children = computed(() => props.control.children || [])

// 获取StateManager
const stateManager = inject<StateManager>('stateManager')

// Modal可见状态 - 优先使用状态管理
const modalVisible = computed({
  get: () => {
    if (!props.isDesignMode && stateManager) {
      try {
        const modalState = stateManager.getState('modal')
        return modalState?.modalStates?.[props.control.id]?.visible || visible.value
      } catch (e) {
        return visible.value
      }
    }
    return visible.value
  },
  set: value => {
    if (!props.isDesignMode && stateManager) {
      try {
        if (value) {
          stateManager.dispatch('modal/openModal', { modalId: props.control.id })
        } else {
          stateManager.dispatch('modal/closeModal', props.control.id)
        }
      } catch (e) {
        console.warn('Failed to update modal state:', e)
      }
    }
  },
})

// 监听visible属性变化
watch(visible, newVal => {
  if (!props.isDesignMode && stateManager && newVal !== modalVisible.value) {
    try {
      if (newVal) {
        stateManager.dispatch('modal/openModal', { modalId: props.control.id })
      } else {
        stateManager.dispatch('modal/closeModal', props.control.id)
      }
    } catch (e) {
      console.warn('Failed to sync modal state:', e)
    }
  }
})

// 设计器模式的容器样式
const containerStyle = computed(() => ({
  width: typeof width.value === 'number' ? `${width.value}px` : width.value,
  minHeight: '200px',
}))

// 事件处理
async function handleOk() {
  console.log('Modal handleOk called', props.control.id)

  // 触发control的事件配置
  if (!props.isDesignMode && eventHandler) {
    try {
      // 使用eventHandler触发ok事件
      const success = await eventHandler('ok')

      // 如果事件执行失败，不关闭Modal
      if (!success) {
        console.warn('Modal onOk event execution failed, keeping modal open')
        emit('ok')
        return
      }

      console.log('Modal onOk event executed successfully')
    } catch (error) {
      console.error('Modal onOk event failed:', error)
      // 如果事件执行失败，不关闭Modal
      emit('ok')
      return
    }
  }

  emit('ok')
  modalVisible.value = false
}

async function handleCancel() {
  console.log('Modal handleCancel called', props.control.id)

  // 触发control的事件配置
  if (!props.isDesignMode && eventHandler) {
    try {
      // 使用eventHandler触发cancel事件
      await eventHandler('cancel')
      console.log('Modal onCancel event executed successfully')
    } catch (error) {
      console.error('Modal onCancel event failed:', error)
    }
  }

  emit('cancel')
  modalVisible.value = false
}

async function handleClose() {
  console.log('Modal handleClose called', props.control.id)

  // 触发control的事件配置
  if (!props.isDesignMode && eventHandler) {
    try {
      // 使用eventHandler触发close事件
      await eventHandler('close')
      console.log('Modal onClose event executed successfully')
    } catch (error) {
      console.error('Modal onClose event failed:', error)
    }
  }

  emit('close')
  modalVisible.value = false
}

// 拖拽状态
const isDragOver = ref(false)

// 拖拽处理
function handleDragOver(event: DragEvent) {
  if (!props.isDesignMode) return

  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = true
}

function handleDragLeave(event: DragEvent) {
  if (!props.isDesignMode) return

  event.stopPropagation()
  // 只有当离开的是容器本身时才清除
  if (event.currentTarget === event.target) {
    isDragOver.value = false
  }
}

function handleDrop(event: DragEvent) {
  if (!props.isDesignMode) return

  event.preventDefault()
  event.stopPropagation()
  isDragOver.value = false

  // 发射drop事件，让父组件处理
  emit('drop', {
    controlId: props.control.id,
    event,
  })
}

// 子组件事件处理
function handleChildSelect(controlId: string) {
  emit('select', controlId)
}

function handleChildHover(controlId: string | null) {
  emit('hover', controlId)
}

function handleChildDrop(data: { controlId: string; event: DragEvent }) {
  emit('drop', data)
}

// 暴露方法供外部调用
defineExpose({
  open: () => {
    if (!props.isDesignMode && stateManager) {
      stateManager.dispatch('modal/openModal', { modalId: props.control.id })
    }
  },
  close: () => {
    if (!props.isDesignMode && stateManager) {
      stateManager.dispatch('modal/closeModal', props.control.id)
    }
  },
  updateData: (data: any) => {
    if (!props.isDesignMode && stateManager) {
      stateManager.dispatch('modal/updateModalData', {
        modalId: props.control.id,
        data,
      })
    }
  },
})
</script>

<style scoped>
/* 设计器模式样式 */
.modal-design-container {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 16px auto;
}

.modal-design-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.modal-design-title {
  font-size: 16px;
  font-weight: 500;
  color: #262626;
}

.modal-design-badge {
  padding: 2px 8px;
  background: #1890ff;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
}

.modal-design-body {
  padding: 24px;
  min-height: 120px;
  position: relative;
  transition: background-color 0.2s ease;
}

.modal-design-body.is-drag-over {
  background-color: rgba(24, 144, 255, 0.05);
  border: 2px dashed #1890ff;
  border-radius: 4px;
}

.modal-design-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  color: #999;
  pointer-events: none;
}

.modal-design-empty p {
  margin-top: 16px;
  font-size: 14px;
}

.modal-design-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
  border-top: 1px solid #f0f0f0;
  background: #fafafa;
}
</style>
