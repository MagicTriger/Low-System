<template>
  <div class="preview-container">
    <!-- 顶部工具栏 -->
    <div class="preview-header">
      <a-button @click="handleBack" type="text">
        <template #icon><arrow-left-outlined /></template>
        返回设计器
      </a-button>
      <h2 class="preview-title">{{ pageName }} - 预览</h2>
      <div class="preview-actions">
        <a-segmented v-model:value="previewDevice" :options="deviceOptions" />
      </div>
    </div>

    <!-- 预览内容 -->
    <div class="preview-content" :class="`device-${previewDevice}`">
      <div class="preview-viewport" :style="viewportStyle">
        <!-- 加载状态 -->
        <div v-if="loading" class="preview-loading">
          <a-spin size="large" tip="加载预览中..." />
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="preview-error">
          <inbox-outlined style="font-size: 64px; color: #ff4d4f" />
          <p class="error-title">预览加载失败</p>
          <p class="error-description">{{ error }}</p>
          <a-button type="primary" @click="loadPreviewData">重新加载</a-button>
        </div>

        <!-- 渲染预览 -->
        <root-view-renderer v-else-if="previewData" :page="previewData.page" :data="previewData.data" :mode="previewMode" />

        <!-- 空状态 -->
        <div v-else class="preview-empty">
          <inbox-outlined style="font-size: 64px; color: #d9d9d9" />
          <p class="empty-title">没有可预览的内容</p>
          <p class="empty-description">请返回设计器添加组件后再预览</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, provide } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeftOutlined, InboxOutlined } from '@ant-design/icons-vue'
import RootViewRenderer from '@/core/renderer/root-view-renderer.vue'
import { RootViewMode } from '@/types'
import type { ResourceDTO, DesignDTO, RootView } from '@/types'

// 获取 StateManager 实例
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

const stateManager = getStateManager()

// 提供 StateManager 给子组件
if (stateManager) {
  provide('stateManager', stateManager)
}

const router = useRouter()

// 预览数据存储键
const PREVIEW_DATA_KEY = '__designer_preview_data__'
const PREVIEW_NAME_KEY = '__designer_preview_name__'

// 状态
const loading = ref(true)
const error = ref<string | null>(null)
const pageName = ref('未命名页面')
const previewData = ref<{ page: ResourceDTO; data: DesignDTO } | null>(null)

// 预览模式
const previewMode = RootViewMode.Runtime

// 设备切换
const previewDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const deviceOptions = [
  { label: '桌面端', value: 'desktop' },
  { label: '平板', value: 'tablet' },
  { label: '手机', value: 'mobile' },
]

// 视口样式
const viewportStyle = computed(() => {
  switch (previewDevice.value) {
    case 'tablet':
      return {
        width: '768px',
        height: '1024px',
        margin: '0 auto',
      }
    case 'mobile':
      return {
        width: '375px',
        height: '667px',
        margin: '0 auto',
      }
    default:
      return {
        width: '100%',
        height: '100%',
      }
  }
})

// 加载预览数据
function loadPreviewData() {
  loading.value = true
  error.value = null

  try {
    console.log('[Preview] Loading preview data from sessionStorage')

    // 从 sessionStorage 读取预览数据
    const storedData = sessionStorage.getItem(PREVIEW_DATA_KEY)
    const storedName = sessionStorage.getItem(PREVIEW_NAME_KEY)

    if (!storedData) {
      throw new Error('未找到预览数据，请从设计器重新进入预览')
    }

    // 解析数据
    const viewData: RootView = JSON.parse(storedData)
    pageName.value = storedName || '未命名页面'

    console.log('[Preview] Loaded view data:', {
      id: viewData.id,
      name: viewData.name,
      controlsCount: viewData.controls?.length || 0,
      overlaysCount: viewData.overlays?.length || 0,
      controls: viewData.controls,
    })

    // 详细日志：检查控件数据
    if (viewData.controls && viewData.controls.length > 0) {
      console.log('[Preview] First control:', viewData.controls[0])
    } else {
      console.warn('[Preview] No controls found in view data!')
    }

    // 验证数据结构
    if (!viewData.id) {
      throw new Error('预览数据缺少必需的 ID 属性')
    }

    if (!Array.isArray(viewData.controls)) {
      throw new Error('预览数据缺少有效的控件列表')
    }

    // 构造 RootView 数据
    const rootView: RootView = {
      ...viewData,
      // 确保有 views 数组
      views: viewData.views || [viewData],
    }

    // 构造 ResourceDTO (page prop)
    const page: ResourceDTO = {
      id: rootView.id,
      code: rootView.id,
      name: pageName.value,
      type: 'page',
      content: rootView,
    }

    // 构造 DesignDTO (data prop)
    const data: DesignDTO = {
      rootView: rootView,
      dataSources: {},
      dataTransfers: {},
    }

    previewData.value = { page, data }

    console.log('[Preview] Preview data prepared successfully:', {
      pageId: page.id,
      pageName: page.name,
      viewsCount: rootView.views.length,
      controlsCount: rootView.controls?.length || 0,
    })

    loading.value = false
  } catch (err: any) {
    console.error('[Preview] Failed to load preview data:', err)
    error.value = err.message || '加载预览数据失败'
    loading.value = false
  }
}

// 返回设计器
function handleBack() {
  // 清理预览数据
  sessionStorage.removeItem(PREVIEW_DATA_KEY)
  sessionStorage.removeItem(PREVIEW_NAME_KEY)
  router.back()
}

// 生命周期
onMounted(() => {
  console.log('[Preview] Component mounted, loading preview data')
  loadPreviewData()
})

onBeforeUnmount(() => {
  // 组件卸载时清理数据
  sessionStorage.removeItem(PREVIEW_DATA_KEY)
  sessionStorage.removeItem(PREVIEW_NAME_KEY)
})
</script>

<style scoped>
.preview-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 16px;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.preview-title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: #262626;
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.preview-content {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.preview-content.device-desktop {
  padding: 0;
}

.preview-content.device-tablet,
.preview-content.device-mobile {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #e8e8e8;
}

.preview-viewport {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

.device-tablet .preview-viewport,
.device-mobile .preview-viewport {
  border-radius: 8px;
}

.preview-loading,
.preview-error,
.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.preview-empty {
  color: #999;
}

.preview-empty .empty-title,
.preview-error .error-title {
  margin-top: 16px;
  font-size: 16px;
  font-weight: 500;
  color: #595959;
}

.preview-error .error-title {
  color: #ff4d4f;
}

.preview-empty .empty-description,
.preview-error .error-description {
  margin-top: 8px;
  margin-bottom: 16px;
  font-size: 14px;
  color: #8c8c8c;
  text-align: center;
}
</style>
