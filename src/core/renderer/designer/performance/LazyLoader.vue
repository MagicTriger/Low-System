<template>
  <div
    ref="containerRef"
    class="lazy-loader"
    :class="{ 
      'is-loading': isLoading,
      'is-loaded': isLoaded,
      'is-error': hasError,
      'is-visible': isVisible
    }"
  >
    <!-- 占位符 -->
    <div
      v-if="showPlaceholder"
      class="lazy-placeholder"
      :style="placeholderStyle"
    >
      <slot name="placeholder" :loading="isLoading">
        <div class="default-placeholder">
          <div v-if="isLoading" class="loading-content">
            <div class="loading-spinner"></div>
            <span class="loading-text">{{ loadingText }}</span>
          </div>
          <div v-else class="skeleton-content">
            <div class="skeleton-line" v-for="n in skeletonLines" :key="n"></div>
          </div>
        </div>
      </slot>
    </div>
    
    <!-- 实际内容 -->
    <div
      v-if="shouldRenderContent"
      class="lazy-content"
      :style="contentStyle"
    >
      <component
        v-if="componentName"
        :is="loadedComponent"
        v-bind="componentProps"
        @error="handleComponentError"
      />
      <slot v-else :loaded="isLoaded" :loading="isLoading" :error="error" />
    </div>
    
    <!-- 错误状态 -->
    <div
      v-if="hasError && showError"
      class="lazy-error"
    >
      <slot name="error" :error="error" :retry="retry">
        <div class="default-error">
          <i class="icon-error"></i>
          <p class="error-message">{{ error?.message || '加载失败' }}</p>
          <button class="retry-btn" @click="retry">重试</button>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { 
  ref, 
  computed, 
  watch, 
  onMounted, 
  onUnmounted, 
  nextTick,
  defineAsyncComponent,
  type Component
} from 'vue'

// 接口定义
interface LazyLoaderProps {
  // 懒加载触发条件
  trigger?: 'visible' | 'hover' | 'click' | 'manual'
  threshold?: number
  rootMargin?: string
  
  // 组件懒加载
  componentName?: string
  componentLoader?: () => Promise<Component>
  componentProps?: Record<string, any>
  
  // 资源懒加载
  src?: string
  srcset?: string
  alt?: string
  
  // 占位符配置
  placeholder?: boolean
  placeholderHeight?: number
  placeholderWidth?: number
  skeletonLines?: number
  loadingText?: string
  
  // 错误处理
  showError?: boolean
  retryCount?: number
  retryDelay?: number
  
  // 性能配置
  preload?: boolean
  priority?: 'high' | 'normal' | 'low'
  timeout?: number
  
  // 缓存配置
  cache?: boolean
  cacheKey?: string
  
  // 动画配置
  fadeIn?: boolean
  fadeInDuration?: number
}

// Props
const props = withDefaults(defineProps<LazyLoaderProps>(), {
  trigger: 'visible',
  threshold: 0.1,
  rootMargin: '50px',
  placeholder: true,
  placeholderHeight: 200,
  placeholderWidth: 300,
  skeletonLines: 3,
  loadingText: '加载中...',
  showError: true,
  retryCount: 3,
  retryDelay: 1000,
  priority: 'normal',
  timeout: 10000,
  cache: true,
  fadeIn: true,
  fadeInDuration: 300
})

// Emits
const emit = defineEmits<{
  'load-start': []
  'load-success': [data: any]
  'load-error': [error: Error]
  'visible': []
  'hidden': []
  'retry': [attempt: number]
}>()

// 响应式数据
const containerRef = ref<HTMLElement>()
const isVisible = ref(false)
const isLoading = ref(false)
const isLoaded = ref(false)
const hasError = ref(false)
const error = ref<Error | null>(null)
const loadedComponent = ref<Component | null>(null)
const loadedData = ref<any>(null)
const retryAttempts = ref(0)
const intersectionObserver = ref<IntersectionObserver>()
const loadTimer = ref<number>()

// 缓存
const componentCache = new Map<string, Component>()
const dataCache = new Map<string, any>()

// 计算属性
const showPlaceholder = computed(() => {
  return props.placeholder && !isLoaded.value && !hasError.value
})

const shouldRenderContent = computed(() => {
  return isLoaded.value && !hasError.value
})

const placeholderStyle = computed(() => ({
  height: props.placeholderHeight ? `${props.placeholderHeight}px` : 'auto',
  width: props.placeholderWidth ? `${props.placeholderWidth}px` : 'auto',
  minHeight: '50px'
}))

const contentStyle = computed(() => {
  const style: Record<string, any> = {}
  
  if (props.fadeIn && isLoaded.value) {
    style.animation = `fadeIn ${props.fadeInDuration}ms ease-in-out`
  }
  
  return style
})

const cacheKey = computed(() => {
  return props.cacheKey || props.componentName || props.src || 'default'
})

// 方法
const startLoading = () => {
  if (isLoading.value || isLoaded.value) return
  
  isLoading.value = true
  hasError.value = false
  error.value = null
  
  emit('load-start')
  
  // 设置超时
  if (props.timeout > 0) {
    loadTimer.value = window.setTimeout(() => {
      handleError(new Error('加载超时'))
    }, props.timeout)
  }
}

const finishLoading = (data?: any) => {
  isLoading.value = false
  isLoaded.value = true
  loadedData.value = data
  
  if (loadTimer.value) {
    clearTimeout(loadTimer.value)
    loadTimer.value = undefined
  }
  
  emit('load-success', data)
}

const handleError = (err: Error) => {
  isLoading.value = false
  hasError.value = true
  error.value = err
  
  if (loadTimer.value) {
    clearTimeout(loadTimer.value)
    loadTimer.value = undefined
  }
  
  emit('load-error', err)
}

const handleComponentError = (err: Error) => {
  handleError(err)
}

const loadComponent = async () => {
  if (!props.componentLoader) return
  
  try {
    startLoading()
    
    // 检查缓存
    if (props.cache && componentCache.has(cacheKey.value)) {
      loadedComponent.value = componentCache.get(cacheKey.value)!
      finishLoading(loadedComponent.value)
      return
    }
    
    // 加载组件
    const component = await props.componentLoader()
    loadedComponent.value = component
    
    // 缓存组件
    if (props.cache) {
      componentCache.set(cacheKey.value, component)
    }
    
    finishLoading(component)
  } catch (err) {
    handleError(err as Error)
  }
}

const loadResource = async () => {
  if (!props.src) return
  
  try {
    startLoading()
    
    // 检查缓存
    if (props.cache && dataCache.has(cacheKey.value)) {
      const cachedData = dataCache.get(cacheKey.value)
      loadedData.value = cachedData
      finishLoading(cachedData)
      return
    }
    
    // 加载资源
    const response = await fetch(props.src)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const data = await response.json()
    loadedData.value = data
    
    // 缓存数据
    if (props.cache) {
      dataCache.set(cacheKey.value, data)
    }
    
    finishLoading(data)
  } catch (err) {
    handleError(err as Error)
  }
}

const load = async () => {
  if (props.componentLoader) {
    await loadComponent()
  } else if (props.src) {
    await loadResource()
  } else {
    // 自定义加载逻辑
    finishLoading()
  }
}

const retry = async () => {
  if (retryAttempts.value >= props.retryCount) {
    return
  }
  
  retryAttempts.value++
  hasError.value = false
  error.value = null
  
  emit('retry', retryAttempts.value)
  
  // 延迟重试
  if (props.retryDelay > 0) {
    await new Promise(resolve => setTimeout(resolve, props.retryDelay))
  }
  
  await load()
}

const handleIntersection = (entries: IntersectionObserverEntry[]) => {
  const entry = entries[0]
  const wasVisible = isVisible.value
  isVisible.value = entry.isIntersecting
  
  if (isVisible.value && !wasVisible) {
    emit('visible')
    
    if (props.trigger === 'visible' && !isLoaded.value && !isLoading.value) {
      load()
    }
  } else if (!isVisible.value && wasVisible) {
    emit('hidden')
  }
}

const handleClick = () => {
  if (props.trigger === 'click' && !isLoaded.value && !isLoading.value) {
    load()
  }
}

const handleMouseEnter = () => {
  if (props.trigger === 'hover' && !isLoaded.value && !isLoading.value) {
    load()
  }
}

const manualLoad = () => {
  if (!isLoaded.value && !isLoading.value) {
    load()
  }
}

const reset = () => {
  isLoading.value = false
  isLoaded.value = false
  hasError.value = false
  error.value = null
  loadedComponent.value = null
  loadedData.value = null
  retryAttempts.value = 0
  
  if (loadTimer.value) {
    clearTimeout(loadTimer.value)
    loadTimer.value = undefined
  }
}

const preloadIfNeeded = () => {
  if (props.preload && props.priority === 'high') {
    nextTick(() => {
      load()
    })
  }
}

// 监听器
watch(() => props.componentLoader, () => {
  reset()
  preloadIfNeeded()
})

watch(() => props.src, () => {
  reset()
  preloadIfNeeded()
})

// 生命周期
onMounted(() => {
  // 设置 Intersection Observer
  if (props.trigger === 'visible' && window.IntersectionObserver) {
    intersectionObserver.value = new IntersectionObserver(handleIntersection, {
      threshold: props.threshold,
      rootMargin: props.rootMargin
    })
    
    if (containerRef.value) {
      intersectionObserver.value.observe(containerRef.value)
    }
  }
  
  // 预加载
  preloadIfNeeded()
  
  // 手动触发模式下立即加载
  if (props.trigger === 'manual') {
    nextTick(() => {
      manualLoad()
    })
  }
})

onUnmounted(() => {
  if (intersectionObserver.value) {
    intersectionObserver.value.disconnect()
  }
  
  if (loadTimer.value) {
    clearTimeout(loadTimer.value)
  }
})

// 暴露方法
defineExpose({
  load: manualLoad,
  retry,
  reset,
  isLoading: () => isLoading.value,
  isLoaded: () => isLoaded.value,
  hasError: () => hasError.value,
  getError: () => error.value,
  getData: () => loadedData.value
})
</script>

<style scoped>
.lazy-loader {
  position: relative;
  overflow: hidden;
}

.lazy-loader.is-loading {
  pointer-events: none;
}

.lazy-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-secondary);
  border-radius: 6px;
  transition: opacity 0.3s ease;
}

.default-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px;
  width: 100%;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--border-color);
  border-top: 2px solid var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-text {
  color: var(--text-secondary);
  font-size: 14px;
}

.skeleton-content {
  width: 100%;
  max-width: 300px;
}

.skeleton-line {
  height: 16px;
  background: linear-gradient(
    90deg,
    var(--bg-secondary) 25%,
    var(--bg-hover) 50%,
    var(--bg-secondary) 75%
  );
  background-size: 200% 100%;
  border-radius: 4px;
  margin-bottom: 8px;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-line:last-child {
  margin-bottom: 0;
  width: 60%;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.lazy-content {
  width: 100%;
  height: 100%;
}

.lazy-error {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: var(--error-bg);
  border: 1px solid var(--error-color);
  border-radius: 6px;
}

.default-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.default-error .icon-error {
  font-size: 32px;
  color: var(--error-color);
}

.error-message {
  margin: 0;
  color: var(--error-color);
  font-size: 14px;
}

.retry-btn {
  padding: 8px 16px;
  border: 1px solid var(--error-color);
  border-radius: 4px;
  background: transparent;
  color: var(--error-color);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--error-color);
  color: white;
}

/* 动画 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeIn {
  from { 
    opacity: 0;
    transform: translateY(10px);
  }
  to { 
    opacity: 1;
    transform: translateY(0);
  }
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-secondary: #2d2d2d;
    --bg-hover: #3d3d3d;
    --text-secondary: #b3b3b3;
    --border-color: #404040;
    --primary-color: #0066cc;
    --error-color: #ff4444;
    --error-bg: #2d1b1b;
  }
}

/* 高对比度模式 */
@media (prefers-contrast: high) {
  .lazy-placeholder {
    border: 2px solid var(--border-color);
  }
  
  .loading-spinner {
    border-width: 3px;
  }
  
  .retry-btn {
    border-width: 2px;
  }
}

/* 减少动画模式 */
@media (prefers-reduced-motion: reduce) {
  .loading-spinner {
    animation: none;
  }
  
  .skeleton-line {
    animation: none;
    background: var(--bg-hover);
  }
  
  .lazy-content {
    animation: none !important;
  }
  
  .lazy-placeholder {
    transition: none;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .default-placeholder {
    padding: 16px;
  }
  
  .loading-text {
    font-size: 13px;
  }
  
  .error-message {
    font-size: 13px;
  }
  
  .retry-btn {
    padding: 6px 12px;
    font-size: 13px;
  }
}

/* 触摸设备优化 */
@media (hover: none) {
  .retry-btn:hover {
    background: transparent;
    color: var(--error-color);
  }
  
  .retry-btn:active {
    background: var(--error-color);
    color: white;
  }
}

/* 打印样式 */
@media print {
  .lazy-loader {
    break-inside: avoid;
  }
  
  .lazy-placeholder,
  .lazy-error {
    display: none;
  }
  
  .lazy-content {
    display: block !important;
  }
}
</style>