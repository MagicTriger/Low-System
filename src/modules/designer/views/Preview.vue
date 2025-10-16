<template>
  <div class="preview-container">
    <!-- 预览头部 -->
    <div class="preview-header">
      <div class="header-left">
        <h1 class="preview-title">页面预览</h1>
        <span class="preview-id">ID: {{ pageId }}</span>
      </div>
      <div class="header-right">
        <button @click="toggleFullscreen" class="btn-fullscreen">
          <FullscreenExitOutlined v-if="isFullscreen" />
          <FullscreenOutlined v-else />
          {{ isFullscreen ? '退出全屏' : '全屏预览' }}
        </button>
        <button @click="goBack" class="btn-back">
          <ArrowLeftOutlined />
          返回编辑
        </button>
      </div>
    </div>

    <!-- 预览内容区域 -->
    <div class="preview-content" :class="{ fullscreen: isFullscreen }">
      <div class="preview-viewport" :style="viewportStyle">
        <!-- 页面渲染器 - 简化版本 -->
        <div v-if="pageData" class="page-renderer">
          <div class="page-info">
            <h2>{{ pageData.title || pageData.meta?.title || '未命名页面' }}</h2>
            <p v-if="pageData.meta?.description" class="page-description">{{ pageData.meta.description }}</p>
            <div class="components-info">
              <p class="component-count">组件数量: {{ pageData.components?.length || 0 }}</p>
              <div v-if="pageData.components?.length" class="components-list">
                <div v-for="(component, index) in pageData.components" :key="index" class="component-item">
                  <span class="component-type">{{ component.type || '未知组件' }}</span>
                  <span class="component-id">ID: {{ component.id }}</span>
                </div>
              </div>
            </div>
          </div>
          <!-- 渲染占位符 -->
          <div class="render-placeholder">
            <p>🚧 渲染器正在开发中...</p>
            <p>当前显示的是预览数据结构</p>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else-if="loading" class="loading-container">
          <LoadingOutlined class="loading-spinner" />
          <p>正在加载页面...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error-container">
          <ExclamationCircleOutlined class="error-icon" />
          <h3>加载失败</h3>
          <p>{{ error }}</p>
          <button @click="loadPageData" class="btn-retry">重试</button>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-container">
          <p>暂无预览数据</p>
        </div>
      </div>
    </div>

    <!-- 预览工具栏 -->
    <div class="preview-toolbar" v-if="!isFullscreen">
      <div class="toolbar-section">
        <label>设备预览:</label>
        <select v-model="selectedDevice" @change="changeDevice">
          <option value="desktop">桌面端</option>
          <option value="tablet">平板</option>
          <option value="mobile">手机</option>
          <option value="custom">自定义</option>
        </select>
      </div>

      <div class="toolbar-section" v-if="selectedDevice === 'custom'">
        <label>宽度:</label>
        <input v-model.number="customWidth" type="number" min="320" max="1920" @change="updateViewport" />
        <label>高度:</label>
        <input v-model.number="customHeight" type="number" min="480" max="1080" @change="updateViewport" />
      </div>

      <div class="toolbar-section">
        <button @click="toggleOrientation" class="btn-orientation">
          <RotateRightOutlined />
          {{ orientation === 'portrait' ? '横屏' : '竖屏' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  RotateRightOutlined,
} from '@ant-design/icons-vue'

// 类型定义
interface PageData {
  id: string
  title: string
  components: any[]
  meta?: {
    title?: string
    description?: string
  }
}

// 路由和参数
const route = useRoute()
const router = useRouter()
const pageId = computed(() => route.params.id as string)

// 响应式数据
const pageData = ref<PageData | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const isFullscreen = ref(false)
const selectedDevice = ref('desktop')
const orientation = ref<'portrait' | 'landscape'>('portrait')
const customWidth = ref(1200)
const customHeight = ref(800)

// 设备预设
const devicePresets = {
  desktop: { width: 1200, height: 800 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 },
}

// 计算视口样式
const viewportStyle = computed(() => {
  let width: number
  let height: number

  if (selectedDevice.value === 'custom') {
    width = customWidth.value
    height = customHeight.value
  } else {
    const preset = devicePresets[selectedDevice.value as keyof typeof devicePresets]
    width = preset.width
    height = preset.height
  }

  // 处理横竖屏切换
  if (orientation.value === 'landscape' && selectedDevice.value !== 'desktop') {
    ;[width, height] = [height, width]
  }

  return {
    width: `${width}px`,
    height: `${height}px`,
    maxWidth: isFullscreen.value ? '100vw' : '100%',
    maxHeight: isFullscreen.value ? '100vh' : '100%',
  }
})

// 加载页面数据
const loadPageData = async () => {
  try {
    loading.value = true
    error.value = null

    // 从 sessionStorage 读取预览数据
    const previewDataStr = sessionStorage.getItem('preview-data')
    if (previewDataStr) {
      try {
        pageData.value = JSON.parse(previewDataStr)
        console.log('✅ 预览数据加载成功:', pageData.value)
      } catch (parseError) {
        console.error('❌ 预览数据解析失败:', parseError)
        error.value = '预览数据格式错误'
      }
    } else {
      // 如果没有预览数据，使用示例数据
      console.warn('⚠️ 未找到预览数据，使用示例数据')
      pageData.value = {
        id: pageId.value,
        title: `页面 ${pageId.value}`,
        components: [
          {
            id: 'root',
            type: 'Container',
            props: {
              style: {
                minHeight: '100vh',
                background: '#f0f2f5',
                padding: '20px',
              },
            },
            children: [
              {
                id: 'header',
                type: 'Text',
                props: {
                  content: '预览页面',
                  style: {
                    fontSize: '24px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                  },
                },
              },
              {
                id: 'content',
                type: 'Container',
                props: {
                  style: {
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                    gap: '20px',
                  },
                },
                children: [
                  {
                    id: 'card1',
                    type: 'Container',
                    props: {
                      style: {
                        background: '#fff',
                        padding: '20px',
                        borderRadius: '8px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      },
                    },
                    children: [
                      {
                        id: 'card1-title',
                        type: 'Text',
                        props: {
                          content: '卡片 1',
                          style: { fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' },
                        },
                      },
                      {
                        id: 'card1-content',
                        type: 'Text',
                        props: {
                          content: '这是第一个卡片的内容',
                          style: { color: '#666' },
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
        meta: {
          title: `页面 ${pageId.value}`,
          description: '预览页面',
        },
      }
    }
  } catch (err) {
    console.error('❌ 加载页面数据失败:', err)
    error.value = err instanceof Error ? err.message : '加载页面数据失败'
  } finally {
    loading.value = false
  }
}

// 切换全屏
const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value

  if (isFullscreen.value) {
    document.documentElement.requestFullscreen?.()
  } else {
    document.exitFullscreen?.()
  }
}

// 返回编辑
const goBack = () => {
  router.push(`/designer/${pageId.value}`)
}

// 切换设备
const changeDevice = () => {
  if (selectedDevice.value !== 'desktop') {
    orientation.value = 'portrait'
  }
}

// 切换横竖屏
const toggleOrientation = () => {
  if (selectedDevice.value === 'desktop') return

  orientation.value = orientation.value === 'portrait' ? 'landscape' : 'portrait'
}

// 更新自定义视口
const updateViewport = () => {
  // 触发重新计算
}

// 处理组件点击
const handleComponentClick = (componentId: string) => {
  console.log('Preview component clicked:', componentId)
}

// 监听全屏变化
const handleFullscreenChange = () => {
  if (!document.fullscreenElement) {
    isFullscreen.value = false
  }
}

// 生命周期
onMounted(() => {
  loadPageData()
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onUnmounted(() => {
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})
</script>

<style scoped>
.preview-container {
  @apply flex h-screen flex-col bg-gray-100;
}

.preview-header {
  @apply flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm;
}

.header-left {
  @apply flex items-center space-x-4;
}

.preview-title {
  @apply text-xl font-semibold text-gray-900;
}

.preview-id {
  @apply rounded bg-gray-100 px-2 py-1 text-sm text-gray-500;
}

.header-right {
  @apply flex items-center space-x-3;
}

.btn-fullscreen,
.btn-back {
  @apply flex items-center space-x-2 rounded-md px-4 py-2 text-sm font-medium transition-colors;
}

.btn-fullscreen {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-back {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}

.preview-content {
  @apply flex flex-1 items-center justify-center overflow-auto p-6;
}

.preview-content.fullscreen {
  @apply p-0;
}

.preview-viewport {
  @apply overflow-hidden rounded-lg bg-white shadow-lg transition-all duration-300;
  min-width: 320px;
  min-height: 480px;
}

.fullscreen .preview-viewport {
  @apply rounded-none shadow-none;
}

.loading-container,
.error-container {
  @apply flex h-full flex-col items-center justify-center text-center;
}

.loading-spinner {
  @apply mb-4 text-4xl text-blue-600;
}

.error-icon {
  @apply mb-4 text-5xl text-red-500;
}

.btn-retry {
  @apply mt-4 rounded-md bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700;
}

.preview-toolbar {
  @apply flex items-center justify-between border-t border-gray-200 bg-white px-6 py-3;
}

.toolbar-section {
  @apply flex items-center space-x-2;
}

.toolbar-section label {
  @apply text-sm font-medium text-gray-700;
}

.toolbar-section select,
.toolbar-section input {
  @apply rounded-md border border-gray-300 px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.btn-orientation {
  @apply flex items-center space-x-2 rounded-md bg-gray-100 px-3 py-1 text-sm transition-colors hover:bg-gray-200;
}

/* 页面渲染器样式 */
.page-renderer {
  @apply h-full w-full overflow-auto bg-white p-6;
}

.page-info {
  @apply mb-6;
}

.page-info h2 {
  @apply mb-2 text-2xl font-bold text-gray-800;
}

.page-description {
  @apply mb-4 text-gray-600;
}

.components-info {
  @apply border-t pt-4;
}

.component-count {
  @apply mb-4 font-medium text-gray-700;
}

.components-list {
  @apply space-y-2;
}

.component-item {
  @apply flex items-center justify-between rounded-lg bg-gray-50 p-3;
}

.component-type {
  @apply font-medium text-blue-600;
}

.component-id {
  @apply text-sm text-gray-500;
}

.render-placeholder {
  @apply mt-8 rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center;
}

.render-placeholder p {
  @apply mb-2 text-yellow-700;
}

.render-placeholder p:last-child {
  @apply mb-0;
}

.empty-container {
  @apply flex h-full items-center justify-center text-gray-500;
}
</style>
