<template>
  <div class="dynamic-page-container">
    <a-spin :spinning="loading" tip="加载页面中...">
      <!-- 错误状态 -->
      <a-result v-if="error" status="error" :title="error" :sub-title="errorDetail">
        <template #extra>
          <a-space>
            <a-button type="primary" @click="loadPageContent">
              <template #icon><ReloadOutlined /></template>
              重新加载
            </a-button>
            <a-button @click="goBack">返回</a-button>
          </a-space>
        </template>
      </a-result>

      <!-- 页面内容 - 使用渲染器 -->
      <div v-else-if="!loading && pageData" class="page-content">
        <RootViewRenderer :page="pageData" :mode="RootViewMode.Runtime" :data="pageContext" />
      </div>

      <!-- 空状态 - 页面未设计 -->
      <div v-else-if="!loading && !pageData" class="empty-state">
        <a-empty description="页面尚未设计">
          <template #extra>
            <a-space>
              <a-button type="primary" @click="goToDesigner">
                <template #icon><EditOutlined /></template>
                前往设计端设计页面
              </a-button>
              <a-button @click="showResourceInfo = true">查看资源信息</a-button>
            </a-space>
          </template>
        </a-empty>
      </div>
    </a-spin>

    <!-- 资源信息抽屉 -->
    <a-drawer v-model:open="showResourceInfo" title="资源信息" placement="right" :width="500">
      <a-descriptions bordered :column="1">
        <a-descriptions-item label="资源名称">{{ resourceData?.name }}</a-descriptions-item>
        <a-descriptions-item label="资源代码">{{ resourceData?.code }}</a-descriptions-item>
        <a-descriptions-item label="资源类型">
          <a-tag color="blue">{{ resourceData?.type }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="URL路径">{{ resourceData?.url }}</a-descriptions-item>
        <a-descriptions-item label="权限路径">{{ resourceData?.path || '-' }}</a-descriptions-item>
        <a-descriptions-item label="图标">{{ resourceData?.icon || '-' }}</a-descriptions-item>
        <a-descriptions-item label="排序">{{ resourceData?.sortOrder }}</a-descriptions-item>
        <a-descriptions-item label="父级ID">{{ resourceData?.parentId || '无' }}</a-descriptions-item>
      </a-descriptions>

      <template #footer>
        <a-space>
          <a-button type="primary" @click="goToDesigner">
            <template #icon><EditOutlined /></template>
            在设计端编辑
          </a-button>
          <a-button @click="showResourceInfo = false">关闭</a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { ReloadOutlined, EditOutlined } from '@ant-design/icons-vue'
import RootViewRenderer from '@/core/renderer/root-view-renderer.vue'
import { RootViewMode } from '@/core/types'
import { designerApi } from '@/core/api/designer'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const error = ref('')
const errorDetail = ref('')
const pageData = ref<any>(null)
const pageContext = ref<any>({})
const showResourceInfo = ref(false)

// 从路由元信息获取资源数据
const resourceData = computed(() => route.meta.resourceData as any)

// 加载页面内容
async function loadPageContent() {
  loading.value = true
  error.value = ''
  errorDetail.value = ''
  pageData.value = null

  try {
    console.log('[DynamicPage] 加载页面内容:', {
      path: route.path,
      resourceData: resourceData.value,
    })

    const resourceCode = resourceData.value?.code

    if (!resourceCode) {
      throw new Error('资源代码不存在')
    }

    // 调用API获取页面设计数据
    console.log('[DynamicPage] 获取页面设计数据:', resourceCode)
    const response = await designerApi.get({ resourceCode })

    console.log('[DynamicPage] 页面设计数据:', response)

    if (response.data) {
      pageData.value = response.data
      console.log('[DynamicPage] 页面加载成功')
    } else {
      console.warn('[DynamicPage] 页面尚未设计')
      // 不抛出错误，只是显示空状态
    }
  } catch (err: any) {
    console.error('[DynamicPage] 加载页面内容失败:', err)
    error.value = '页面加载失败'
    errorDetail.value = err.message || '未知错误'
    message.error('页面加载失败: ' + err.message)
  } finally {
    loading.value = false
  }
}

// 前往设计端
function goToDesigner() {
  const resourceCode = resourceData.value?.code

  if (resourceCode) {
    // 打开设计端的设计器页面
    const designerUrl = `/designer?resource=${resourceCode}`
    window.open(designerUrl, '_blank')
  } else {
    message.warning('无法获取资源代码')
  }
}

// 返回上一页
function goBack() {
  router.back()
}

// 组件挂载时加载页面
onMounted(() => {
  loadPageContent()
})
</script>

<style scoped>
.dynamic-page-container {
  width: 100%;
  min-height: calc(100vh - 64px);
  padding: 24px;
  background: #f0f2f5;
}

.page-content {
  width: 100%;
}

:deep(.ant-descriptions-title) {
  font-size: 16px;
  font-weight: 500;
}
</style>
