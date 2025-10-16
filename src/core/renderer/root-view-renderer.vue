<template>
  <div 
    class="root-view-renderer" 
    :class="rootViewClasses"
    :style="rootViewStyles"
  >
    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <a-spin size="large" tip="加载中..." />
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="error-container">
      <a-result
        status="error"
        title="加载失败"
        :sub-title="error"
      >
        <template #extra>
          <a-button type="primary" @click="retry">重试</a-button>
        </template>
      </a-result>
    </div>
    
    <!-- 正常渲染 -->
    <template v-else-if="context">
      <!-- 提供上下文 -->
      <component
        :is="ContextProvider"
        :context="context"
        :view-id="currentViewId"
      >
        <!-- 当前视图内容 -->
        <div class="view-content" v-if="currentView">
          <template v-for="control in currentView.controls" :key="control.id">
            <component
              :is="controlRenderer"
              :control="control"
              :zoom="zoom"
            />
          </template>
        </div>
        
        <!-- 浮层内容 -->
        <div class="overlay-content" v-if="isRootView && rootView.overlays">
          <template v-for="overlay in rootView.overlays" :key="overlay.id">
            <component
              :is="controlRenderer"
              :control="overlay"
              :zoom="zoom"
            />
          </template>
        </div>
      </component>
    </template>
    
    <!-- 空状态 -->
    <div v-else class="empty-container">
      <a-empty description="暂无内容" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import type { RootViewRendererProps } from './base'
import { RootViewContext } from './root-view-context'
import { RootViewMode } from '../types'
import ControlRenderer from './control-renderer.vue'

// 定义Props
const props = withDefaults(defineProps<RootViewRendererProps>(), {
  mode: RootViewMode.Runtime
})

// 状态管理
const loading = ref(true)
const error = ref<string | null>(null)
const context = ref<RootViewContext | null>(null)
const currentViewId = ref<string>('')
const zoom = ref(1)

// 计算属性
const rootView = computed(() => context.value?.rootView)
const currentView = computed(() => {
  if (!context.value || !currentViewId.value) return null
  return context.value.viewIdMap.value[currentViewId.value]
})

const isRootView = computed(() => {
  return currentView.value?.id === rootView.value?.id
})

const rootViewClasses = computed(() => [
  'root-view-renderer',
  `mode-${props.mode}`,
  {
    'is-loading': loading.value,
    'has-error': !!error.value,
    'is-root-view': isRootView.value
  }
])

const rootViewStyles = computed(() => {
  const styles: Record<string, any> = {}
  
  if (zoom.value !== 1) {
    styles.zoom = zoom.value
  }
  
  return styles
})

// 控件渲染器
const controlRenderer = computed(() => {
  // 可以根据模式返回不同的渲染器
  return ControlRenderer
})

// 上下文提供器组件
const ContextProvider = {
  props: ['context', 'viewId'],
  setup(props: any, { slots }: any) {
    // 提供根视图上下文
    provide(RootViewContext.ProvideKey, props.context)
    provide(RootViewContext.ViewIdKey, props.viewId)
    provide(RootViewContext.RendererKey, controlRenderer.value)
    
    return () => slots.default?.()
  }
}

// 方法
const initContext = async () => {
  loading.value = true
  error.value = null
  
  try {
    // 创建根视图上下文
    const ctx = new RootViewContext(props.page, props.mode, props.data)
    context.value = ctx
    
    // 设置当前视图
    if (ctx.views.value.length > 0) {
      currentViewId.value = ctx.views.value[0].id
    }
    
    loading.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : '初始化失败'
    loading.value = false
    console.error('根视图渲染器初始化失败:', err)
  }
}

const retry = () => {
  initContext()
}

const switchView = (viewId: string) => {
  if (context.value?.viewIdMap.value[viewId]) {
    currentViewId.value = viewId
  }
}

const setZoom = (newZoom: number) => {
  zoom.value = Math.max(0.1, Math.min(5, newZoom))
}

// 监听属性变化
watch(() => props.page, initContext, { immediate: false })
watch(() => props.data, initContext, { immediate: false })

// 生命周期
onMounted(() => {
  initContext()
})

onUnmounted(() => {
  if (context.value) {
    context.value.destroy()
  }
})

// 暴露方法
defineExpose({
  context: computed(() => context.value),
  currentView,
  currentViewId: computed(() => currentViewId.value),
  loading: computed(() => loading.value),
  error: computed(() => error.value),
  switchView,
  setZoom,
  retry
})
</script>

<style scoped>
.root-view-renderer {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.loading-container,
.error-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: 200px;
}

.view-content {
  position: relative;
  width: 100%;
  height: 100%;
}

.overlay-content {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1000;
}

.overlay-content > * {
  pointer-events: auto;
}

/* 模式样式 */
.mode-runtime {
  /* 运行时模式样式 */
}

.mode-designer {
  /* 设计器模式样式 */
  background-image: 
    linear-gradient(rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,0,0,0.05) 1px, transparent 1px);
  background-size: 20px 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .root-view-renderer {
    font-size: 14px;
  }
}

/* 打印样式 */
@media print {
  .root-view-renderer {
    background: none !important;
  }
  
  .overlay-content {
    display: none;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .mode-designer {
    background-image: 
      linear-gradient(rgba(0,0,0,0.3) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0,0,0,0.3) 1px, transparent 1px);
  }
}

/* 暗色主题 */
.dark .mode-designer {
  background-image: 
    linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px);
}
</style>