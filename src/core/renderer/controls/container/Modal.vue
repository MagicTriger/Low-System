<template>
  <a-modal
    v-model:open="visible"
    :title="title"
    :width="width"
    :closable="closable"
    :mask-closable="maskClosable"
    :footer="showFooter ? undefined : null"
    :ok-text="okText"
    :cancel-text="cancelText"
    :ok-button-props="okButtonProps"
    :cancel-button-props="cancelButtonProps"
    :destroy-on-close="destroyOnClose"
    :mask="mask"
    :keyboard="keyboard"
    :centered="centered"
    :z-index="zIndex"
    @ok="handleOk"
    @cancel="handleCancel"
    @after-close="handleAfterClose"
    :class="['modal-control', className]"
  >
    <!-- 弹窗内容 -->
    <div class="modal-content">
      <slot>
        <!-- 渲染子控件 -->
        <template v-if="children && children.length">
          <component v-for="child in children" :key="child.id" :is="getChildComponent(child)" :control="child" />
        </template>
        <div v-else class="empty-content">
          <p>请添加内容</p>
        </div>
      </slot>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Control } from '../../base'

interface Props {
  control: Control
  // 弹窗属性
  title?: string
  width?: number | string
  closable?: boolean
  maskClosable?: boolean
  showFooter?: boolean
  okText?: string
  cancelText?: string
  okButtonProps?: Record<string, any>
  cancelButtonProps?: Record<string, any>
  destroyOnClose?: boolean
  mask?: boolean
  keyboard?: boolean
  centered?: boolean
  zIndex?: number
  className?: string
  // 子控件
  children?: Control[]
}

const props = withDefaults(defineProps<Props>(), {
  title: '弹窗',
  width: 520,
  closable: true,
  maskClosable: true,
  showFooter: true,
  okText: '确定',
  cancelText: '取消',
  destroyOnClose: false,
  mask: true,
  keyboard: true,
  centered: false,
  zIndex: 1000,
  className: '',
  children: () => [],
})

const emit = defineEmits<{
  ok: []
  cancel: []
  afterClose: []
}>()

// 控制弹窗显示/隐藏
const visible = ref(false)

// 获取子组件
const getChildComponent = (child: Control) => {
  // 这里应该返回对应的控件组件
  // 实际实现中需要从控件注册表中获取
  return 'div'
}

// 事件处理
const handleOk = () => {
  emit('ok')
}

const handleCancel = () => {
  emit('cancel')
}

const handleAfterClose = () => {
  emit('afterClose')
}

// 暴露方法供外部调用
defineExpose({
  show: () => {
    visible.value = true
  },
  hide: () => {
    visible.value = false
  },
  toggle: () => {
    visible.value = !visible.value
  },
})
</script>

<style scoped>
.modal-control {
  /* 自定义样式 */
}

.modal-content {
  min-height: 100px;
}

.empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: #999;
  font-size: 14px;
}
</style>
