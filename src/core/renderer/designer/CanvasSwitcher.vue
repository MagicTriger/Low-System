<template>
  <div class="canvas-switcher">
    <!-- 画布类型切换 -->
    <a-segmented v-model:value="currentCanvasType" :options="canvasOptions" @change="handleCanvasTypeChange">
      <template #label="{ value, title }">
        <div class="canvas-option">
          <component :is="getCanvasIcon(value)" />
          <span>{{ title }}</span>
        </div>
      </template>
    </a-segmented>

    <!-- 浮层选择器 -->
    <a-select
      v-if="currentCanvasType === 'overlay' && overlayOptions.length > 0"
      v-model:value="currentOverlayId"
      :options="overlayOptions"
      placeholder="选择浮层"
      style="margin-left: 12px; min-width: 180px"
      @change="handleOverlaySelect"
    >
      <template #suffixIcon>
        <appstore-outlined />
      </template>
    </a-select>

    <!-- 无浮层提示 -->
    <a-tooltip v-else-if="currentCanvasType === 'overlay' && overlayOptions.length === 0" title="请先创建浮层">
      <a-button type="dashed" size="small" style="margin-left: 12px" disabled>
        <template #icon><plus-outlined /></template>
        暂无浮层
      </a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { FileOutlined, AppstoreOutlined, PlusOutlined } from '@ant-design/icons-vue'
import type { OverlayConfig } from '@/core/api/overlay'

/**
 * Props
 */
interface Props {
  /** 当前画布类型 */
  activeCanvas: 'page' | 'overlay'
  /** 当前浮层ID */
  activeOverlayId: string | null
  /** 可用的浮层列表 */
  overlays: OverlayConfig[]
}

const props = withDefaults(defineProps<Props>(), {
  activeCanvas: 'page',
  activeOverlayId: null,
  overlays: () => [],
})

/**
 * Emits
 */
interface Emits {
  (e: 'canvas-switch', canvasType: 'page' | 'overlay', overlayId?: string): void
}

const emit = defineEmits<Emits>()

/**
 * 画布类型选项
 */
const canvasOptions = [
  { label: '页面画布', value: 'page', title: '页面画布' },
  { label: '浮层画布', value: 'overlay', title: '浮层画布' },
]

/**
 * 当前画布类型（本地状态）
 */
const currentCanvasType = computed({
  get: () => props.activeCanvas,
  set: (value: 'page' | 'overlay') => {
    // 通过事件通知父组件
    if (value === 'page') {
      emit('canvas-switch', 'page')
    } else if (value === 'overlay' && overlayOptions.value.length > 0) {
      // 切换到浮层时，默认选择第一个浮层
      const firstOverlayId = overlayOptions.value[0].value
      emit('canvas-switch', 'overlay', firstOverlayId)
    }
  },
})

/**
 * 当前浮层ID（本地状态）
 */
const currentOverlayId = computed({
  get: () => props.activeOverlayId,
  set: (value: string | null) => {
    if (value) {
      emit('canvas-switch', 'overlay', value)
    }
  },
})

/**
 * 浮层选项列表
 */
const overlayOptions = computed(() => {
  return props.overlays.map(overlay => ({
    label: overlay.name || overlay.id,
    value: overlay.id,
  }))
})

/**
 * 获取画布图标
 */
function getCanvasIcon(value: string | number) {
  const strValue = String(value)
  switch (strValue) {
    case 'page':
      return FileOutlined
    case 'overlay':
      return AppstoreOutlined
    default:
      return FileOutlined
  }
}

/**
 * 处理画布类型切换
 */
function handleCanvasTypeChange(value: 'page' | 'overlay') {
  console.log('[CanvasSwitcher] Canvas type changed:', value)

  if (value === 'page') {
    emit('canvas-switch', 'page')
  } else if (value === 'overlay') {
    // 如果有浮层，选择第一个或当前选中的浮层
    if (overlayOptions.value.length > 0) {
      const targetOverlayId = props.activeOverlayId || overlayOptions.value[0].value
      emit('canvas-switch', 'overlay', targetOverlayId)
    } else {
      console.warn('[CanvasSwitcher] No overlays available, cannot switch to overlay canvas')
    }
  }
}

/**
 * 处理浮层选择
 */
function handleOverlaySelect(overlayId: string) {
  console.log('[CanvasSwitcher] Overlay selected:', overlayId)
  emit('canvas-switch', 'overlay', overlayId)
}

/**
 * 监听浮层列表变化
 * 如果当前选中的浮层被删除，自动切换到页面画布
 */
watch(
  () => props.overlays,
  newOverlays => {
    if (props.activeCanvas === 'overlay' && props.activeOverlayId) {
      const overlayExists = newOverlays.some(overlay => overlay.id === props.activeOverlayId)
      if (!overlayExists) {
        console.warn('[CanvasSwitcher] Active overlay was deleted, switching to page canvas')
        emit('canvas-switch', 'page')
      }
    }
  },
  { deep: true }
)

/**
 * 监听浮层列表变化
 * 如果在浮层画布模式但没有浮层，自动切换到页面画布
 */
watch(
  () => [props.activeCanvas, overlayOptions.value.length] as const,
  ([canvas, overlayCount]) => {
    if (canvas === 'overlay' && overlayCount === 0) {
      console.warn('[CanvasSwitcher] No overlays available in overlay mode, switching to page canvas')
      emit('canvas-switch', 'page')
    }
  }
)
</script>

<style scoped lang="less">
.canvas-switcher {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;

  .canvas-option {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;

    span {
      line-height: 1;
    }
  }

  :deep(.ant-segmented) {
    background: #f5f5f5;
  }

  :deep(.ant-select) {
    .ant-select-selector {
      border-radius: 6px;
    }
  }
}
</style>
