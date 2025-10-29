<template>
  <a-modal
    v-model:open="isOpen"
    :title="overlayTitle"
    :width="overlayWidth"
    :closable="overlayClosable"
    :mask-closable="overlayMaskClosable"
    :footer="null"
    :destroy-on-close="true"
    @cancel="handleClose"
    @after-close="handleAfterClose"
  >
    <!-- 浮层内容 -->
    <div class="overlay-content" v-if="overlayInstance">
      <!-- 提供浮层上下文 -->
      <component :is="OverlayContextProvider" :overlay-id="overlayId" :overlay-context="overlayContext" :parent-context="parentContext">
        <!-- 渲染浮层控件 -->
        <template v-for="control in overlayControls" :key="control.id">
          <component :is="controlRenderer" :control="control" />
        </template>
      </component>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, provide, watch, ref, inject } from 'vue'
import type { StateManager } from '@/core/state/StateManager'
import type { OverlayInstance } from '@/core/state/modules/overlay'
import type { Control } from '../types'
import ControlRenderer from './control-renderer.vue'

/**
 * Props
 */
interface Props {
  /** 浮层ID */
  overlayId: string
}

const props = defineProps<Props>()

/**
 * 状态管理
 */
const stateManager = inject<StateManager>('stateManager')!

if (!stateManager) {
  console.error('❌ [OverlayRenderer] StateManager not provided')
}

/**
 * 浮层实例
 */
const overlayInstance = computed<OverlayInstance | undefined>(() => {
  const getters = stateManager.getGetters()
  return getters['overlay/getOverlayInstance'](props.overlayId)
})

/**
 * 浮层是否打开
 */
const isOpen = computed({
  get: () => {
    const getters = stateManager.getGetters()
    return getters['overlay/isOverlayOpen'](props.overlayId)
  },
  set: (value: boolean) => {
    if (!value) {
      handleClose()
    }
  },
})

/**
 * 浮层配置
 */
const overlayConfig = computed(() => overlayInstance.value?.config)

/**
 * 浮层标题
 */
const overlayTitle = computed(() => {
  return overlayConfig.value?.title || overlayConfig.value?.name || '浮层'
})

/**
 * 浮层宽度
 */
const overlayWidth = computed(() => {
  return overlayConfig.value?.width || 600
})

/**
 * 是否可关闭
 */
const overlayClosable = computed(() => {
  return overlayConfig.value?.closable !== false
})

/**
 * 点击遮罩是否可关闭
 */
const overlayMaskClosable = computed(() => {
  return overlayConfig.value?.maskClosable !== false
})

/**
 * 浮层控件列表
 */
const overlayControls = computed<Control[]>(() => {
  return overlayConfig.value?.controls || []
})

/**
 * 浮层上下文（传入的参数）
 */
const overlayContext = computed(() => {
  return overlayInstance.value?.context || {}
})

/**
 * 父页面上下文引用
 */
const parentContext = computed(() => {
  return overlayInstance.value?.parentContext || {}
})

/**
 * 控件渲染器
 */
const controlRenderer = ControlRenderer

/**
 * 浮层上下文提供器
 */
const OverlayContextProvider = {
  props: ['overlayId', 'overlayContext', 'parentContext'],
  setup(props: any, { slots }: any) {
    // 提供浮层上下文给子组件
    provide('overlayId', props.overlayId)
    provide('overlayContext', props.overlayContext)
    provide('parentContext', props.parentContext)

    // 提供数据返回方法
    provide('returnData', (data: any) => {
      stateManager.dispatch('overlay/setOverlayReturnData', {
        id: props.overlayId,
        data,
      })
    })

    // 提供关闭浮层方法
    provide('closeOverlay', (returnData?: any) => {
      stateManager.dispatch('overlay/closeOverlay', {
        id: props.overlayId,
        returnData,
      })
    })

    return () => slots.default?.()
  },
}

/**
 * 处理关闭
 */
const handleClose = async () => {
  try {
    await stateManager.dispatch('overlay/closeOverlay', {
      id: props.overlayId,
    })
  } catch (error: any) {
    console.error(`❌ [OverlayRenderer] 关闭浮层失败: ${props.overlayId}`, error)
  }
}

/**
 * 关闭后回调
 */
const handleAfterClose = () => {
  console.log(`✅ [OverlayRenderer] 浮层已完全关闭: ${props.overlayId}`)
}

/**
 * 监听浮层实例变化
 */
watch(
  overlayInstance,
  (newInstance, oldInstance) => {
    if (newInstance && !oldInstance) {
      console.log(`✅ [OverlayRenderer] 浮层已挂载: ${props.overlayId}`, newInstance)
    }
  },
  { immediate: true }
)
</script>

<style scoped>
.overlay-content {
  padding: 16px 0;
}

/* 浮层内容样式 */
:deep(.ant-modal-body) {
  max-height: 70vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  :deep(.ant-modal) {
    max-width: 90vw;
    margin: 16px auto;
  }

  :deep(.ant-modal-body) {
    max-height: 60vh;
  }
}
</style>
