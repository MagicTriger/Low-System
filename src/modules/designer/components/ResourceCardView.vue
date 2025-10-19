<template>
  <div class="resource-card-view">
    <!-- 面包屑导航 -->
    <div v-if="navigationStack.length > 0" class="breadcrumb-nav">
      <a-breadcrumb>
        <a-breadcrumb-item>
          <a @click="navigateToRoot">
            <HomeOutlined />
            根目录
          </a>
        </a-breadcrumb-item>
        <a-breadcrumb-item v-for="(item, index) in navigationStack" :key="item.id">
          <a v-if="index < navigationStack.length - 1" @click="navigateTo(index)">
            {{ item.name }}
          </a>
          <span v-else>{{ item.name }}</span>
        </a-breadcrumb-item>
      </a-breadcrumb>
    </div>

    <!-- 数据量提示 -->
    <div v-if="displayResources.length > 100" class="performance-tip">
      <a-alert
        message="大数据量模式"
        :description="`当前显示 ${displayResources.length} 个资源，已启用虚拟滚动优化性能`"
        type="info"
        show-icon
        closable
      />
    </div>

    <!-- 虚拟滚动卡片网格（大数据量场景 > 100） -->
    <div v-if="useVirtualScroll" class="card-grid-virtual">
      <RecycleScroller
        :items="displayResources"
        :item-size="340"
        :grid-items="gridColumns"
        key-field="id"
        v-slot="{ item: resource }"
        class="scroller"
      >
        <div
          class="resource-card"
          :class="[getCardClass(resource), { 'is-flipped': flippedCards.has(resource.id) }]"
          @click="handleCardClick(resource)"
          @contextmenu.prevent="handleCardRightClick(resource)"
        >
          <!-- 卡片内容容器 -->
          <div class="card-inner">
            <!-- 卡片正面 -->
            <div class="card-front">
              <div class="card-icon-wrapper">
                <component :is="getIconComponent(resource.icon)" class="card-icon" />
              </div>
              <h3 class="card-title">{{ resource.name }}</h3>
              <p class="card-subtitle">{{ resource.code }}</p>
              <div class="card-meta">
                <a-tag :color="getMenuTypeColor(resource.type)" size="small">
                  {{ getMenuTypeText(resource.type) }}
                </a-tag>
                <span v-if="hasChildren(resource)" class="card-count"> {{ resource.children?.length || 0 }} 个子菜单 </span>
              </div>
            </div>

            <!-- 卡片背面 -->
            <div class="card-back">
              <div class="card-info">
                <div class="info-header">
                  <div class="info-header-left">
                    <component :is="getIconComponent(resource.icon)" class="info-icon" />
                    <h4>{{ resource.name }}</h4>
                  </div>
                  <!-- 功能按钮：只对非客户端类型显示 -->
                  <div v-if="!isClientType(resource)" class="info-header-actions">
                    <a-tooltip :title="resource.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
                      <a-button type="text" size="small" @click.stop="handleMount(resource)">
                        <ApiOutlined v-if="!resource.mountedToAdmin" />
                        <ApiOutlined v-else style="color: #52c41a" />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="进入设计器">
                      <a-button type="text" size="small" @click.stop="handleDesigner(resource)">
                        <DesktopOutlined />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="编辑">
                      <a-button type="text" size="small" @click.stop="handleEdit(resource)">
                        <EditOutlined />
                      </a-button>
                    </a-tooltip>
                    <a-tooltip title="删除">
                      <a-button type="text" size="small" danger @click.stop="handleDelete(resource)">
                        <DeleteOutlined />
                      </a-button>
                    </a-tooltip>
                  </div>
                </div>
                <div class="info-content">
                  <div class="info-grid">
                    <div class="info-item">
                      <span class="info-label">ID</span>
                      <span class="info-value">{{ resource.id }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">编码</span>
                      <span class="info-value">{{ resource.code }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">类型</span>
                      <span class="info-value">{{ getMenuTypeText(resource.type) }}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">排序</span>
                      <span class="info-value">{{ resource.sortOrder }}</span>
                    </div>
                    <div v-if="resource.url" class="info-item">
                      <span class="info-label">路径</span>
                      <span class="info-value">{{ resource.url }}</span>
                    </div>
                    <div v-if="resource.path" class="info-item">
                      <span class="info-label">权限路径</span>
                      <span class="info-value">{{ resource.path }}</span>
                    </div>
                    <div class="info-item info-item-full">
                      <span class="info-label">创建时间</span>
                      <span class="info-value">{{ formatDate(resource.createTime) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </RecycleScroller>
    </div>

    <!-- 普通卡片网格（小数据量场景 <= 100） -->
    <div v-else class="card-grid">
      <div
        v-for="resource in displayResources"
        :key="resource.id"
        class="resource-card"
        :class="[getCardClass(resource), { 'is-flipped': flippedCards.has(resource.id) }]"
        @click="handleCardClick(resource)"
        @contextmenu.prevent="handleCardRightClick(resource)"
      >
        <!-- 卡片内容容器 -->
        <div class="card-inner">
          <!-- 卡片正面 -->
          <div class="card-front">
            <div class="card-icon-wrapper">
              <component :is="getIconComponent(resource.icon)" class="card-icon" />
            </div>
            <h3 class="card-title">{{ resource.name }}</h3>
            <p class="card-subtitle">{{ resource.code }}</p>
            <div class="card-meta">
              <a-tag :color="getMenuTypeColor(resource.type)" size="small">
                {{ getMenuTypeText(resource.type) }}
              </a-tag>
              <span v-if="hasChildren(resource)" class="card-count"> {{ resource.children?.length || 0 }} 个子菜单 </span>
            </div>
          </div>

          <!-- 卡片背面 -->
          <div class="card-back">
            <div class="card-info">
              <div class="info-header">
                <div class="info-header-left">
                  <component :is="getIconComponent(resource.icon)" class="info-icon" />
                  <h4>{{ resource.name }}</h4>
                </div>
                <!-- 功能按钮：只对非客户端类型显示 -->
                <div v-if="!isClientType(resource)" class="info-header-actions">
                  <a-tooltip :title="resource.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
                    <a-button type="text" size="small" @click.stop="handleMount(resource)">
                      <ApiOutlined v-if="!resource.mountedToAdmin" />
                      <ApiOutlined v-else style="color: #52c41a" />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="进入设计器">
                    <a-button type="text" size="small" @click.stop="handleDesigner(resource)">
                      <DesktopOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="编辑">
                    <a-button type="text" size="small" @click.stop="handleEdit(resource)">
                      <EditOutlined />
                    </a-button>
                  </a-tooltip>
                  <a-tooltip title="删除">
                    <a-button type="text" size="small" danger @click.stop="handleDelete(resource)">
                      <DeleteOutlined />
                    </a-button>
                  </a-tooltip>
                </div>
              </div>
              <div class="info-content">
                <div class="info-grid">
                  <div class="info-item">
                    <span class="info-label">ID</span>
                    <span class="info-value">{{ resource.id }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">编码</span>
                    <span class="info-value">{{ resource.code }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">类型</span>
                    <span class="info-value">{{ getMenuTypeText(resource.type) }}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">排序</span>
                    <span class="info-value">{{ resource.sortOrder }}</span>
                  </div>
                  <div v-if="resource.url" class="info-item">
                    <span class="info-label">路径</span>
                    <span class="info-value">{{ resource.url }}</span>
                  </div>
                  <div v-if="resource.path" class="info-item">
                    <span class="info-label">权限路径</span>
                    <span class="info-value">{{ resource.path }}</span>
                  </div>
                  <div class="info-item info-item-full">
                    <span class="info-label">创建时间</span>
                    <span class="info-value">{{ formatDate(resource.createTime) }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="displayResources.length === 0" class="empty-state">
      <a-empty description="暂无数据">
        <a-button v-if="navigationStack.length > 0" type="primary" @click="navigateToRoot"> 返回根目录 </a-button>
      </a-empty>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { RecycleScroller } from 'vue3-virtual-scroller'
import 'vue3-virtual-scroller/dist/vue3-virtual-scroller.css'
import {
  FolderOutlined,
  FileOutlined,
  AppstoreOutlined,
  DesktopOutlined,
  MobileOutlined,
  EditOutlined,
  DeleteOutlined,
  HomeOutlined,
  ApiOutlined,
} from '@ant-design/icons-vue'
import type { MenuTreeNode } from '@/core/api/menu'
import { getIconLibraryManager } from '@/core/renderer/icons/IconLibraryManager'

interface Props {
  resources: MenuTreeNode[]
  virtualScrollThreshold?: number // 启用虚拟滚动的阈值，默认100
}

const props = withDefaults(defineProps<Props>(), {
  virtualScrollThreshold: 100,
})

const emit = defineEmits<{
  edit: [resource: MenuTreeNode]
  delete: [resource: MenuTreeNode]
  designer: [resource: MenuTreeNode]
  mount: [resource: MenuTreeNode]
}>()

// 导航栈：记录当前浏览路径
const navigationStack = ref<MenuTreeNode[]>([])

// 翻转的卡片集合
const flippedCards = ref<Set<number>>(new Set())

// 网格列数（响应式）
const gridColumns = ref(4)

// 当前显示的资源
const displayResources = computed(() => {
  console.log('📊 [ResourceCardView] props.resources:', props.resources)
  console.log('📊 [ResourceCardView] navigationStack:', navigationStack.value)

  if (navigationStack.value.length === 0) {
    // 根目录：显示所有顶级资源（parentId 为 null 或 0）
    const topLevel = props.resources.filter(r => !r.parentId || r.parentId === 0 || r.parentId === null)
    console.log('📊 [ResourceCardView] 顶级资源:', topLevel)
    return topLevel
  } else {
    // 子目录：显示当前节点的子节点
    const current = navigationStack.value[navigationStack.value.length - 1]
    console.log('📊 [ResourceCardView] 当前节点:', current)
    console.log('📊 [ResourceCardView] 子节点:', current.children)
    return current.children || []
  }
})

// 是否使用虚拟滚动
const useVirtualScroll = computed(() => {
  return displayResources.value.length > props.virtualScrollThreshold
})

// 计算网格列数
const calculateGridColumns = () => {
  const width = window.innerWidth
  if (width >= 1600) {
    gridColumns.value = 5
  } else if (width >= 1200) {
    gridColumns.value = 4
  } else if (width >= 768) {
    gridColumns.value = 3
  } else if (width >= 480) {
    gridColumns.value = 2
  } else {
    gridColumns.value = 1
  }
}

// 监听窗口大小变化
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  calculateGridColumns()

  // 使用 ResizeObserver 监听窗口大小变化
  resizeObserver = new ResizeObserver(() => {
    calculateGridColumns()
  })

  if (document.body) {
    resizeObserver.observe(document.body)
  }
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
})

// 获取卡片样式类
const getCardClass = (resource: MenuTreeNode) => {
  const level = navigationStack.value.length
  return {
    'card-level-0': level === 0, // 父卡片
    'card-level-1': level === 1, // 一级子卡片
    'card-level-2': level >= 2, // 二级及以上子卡片
    [`card-type-${resource.type}`]: true,
  }
}

// 判断是否有子节点
const hasChildren = (resource: MenuTreeNode) => {
  return resource.children && resource.children.length > 0
}

// 处理卡片点击
const handleCardClick = (resource: MenuTreeNode) => {
  // 如果是目录类型（DIRECTORY 或 CLIENT）且有子节点，进入下一层
  const isDirectory = resource.type === 'DIRECTORY' || resource.type === 'CLIENT'
  if (isDirectory && hasChildren(resource)) {
    navigationStack.value.push(resource)
    // 清除所有翻转状态
    flippedCards.value.clear()
  }
}

// 处理卡片右键点击（翻转卡片）
const handleCardRightClick = (resource: MenuTreeNode) => {
  if (flippedCards.value.has(resource.id)) {
    flippedCards.value.delete(resource.id)
  } else {
    flippedCards.value.add(resource.id)
  }
  // 触发响应式更新
  flippedCards.value = new Set(flippedCards.value)
}

// 导航到指定层级
const navigateTo = (index: number) => {
  navigationStack.value = navigationStack.value.slice(0, index + 1)
  flippedCards.value.clear()
}

// 返回根目录
const navigateToRoot = () => {
  navigationStack.value = []
  flippedCards.value.clear()
}

// 获取图标组件
const getIconComponent = (iconName?: string) => {
  if (!iconName) return AppstoreOutlined

  // 先尝试从图标库获取
  const iconManager = getIconLibraryManager()
  const icon = iconManager.getIcon('antd', iconName)
  if (icon) {
    return icon.component
  }

  // 降级到固定映射
  const iconMap: Record<string, any> = {
    folder: FolderOutlined,
    file: FileOutlined,
    app: AppstoreOutlined,
    desktop: DesktopOutlined,
    mobile: MobileOutlined,
  }
  return iconMap[iconName] || AppstoreOutlined
}

// 获取菜单类型文本
const getMenuTypeText = (type: string) => {
  const map: Record<string, string> = {
    CLIENT: '客户端',
    DIRECTORY: '目录',
    MENU: '菜单',
    CUSTOM_PAGE: '自定义界面',
    MODEL_PAGE: '模型页面',
    BUTTON: '按钮',
  }
  return map[type] || type
}

// 获取菜单类型颜色
const getMenuTypeColor = (type: string) => {
  const map: Record<string, string> = {
    CLIENT: 'purple',
    DIRECTORY: 'blue',
    MENU: 'green',
    CUSTOM_PAGE: 'cyan',
    MODEL_PAGE: 'geekblue',
    BUTTON: 'orange',
  }
  return map[type] || 'default'
}

// 格式化日期 - 格式: YYYY-MM-DD HH:mm
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}`
}

// 处理编辑
const handleEdit = (resource: MenuTreeNode) => {
  emit('edit', resource)
}

// 处理挂载
const handleMount = (resource: MenuTreeNode) => {
  emit('mount', resource)
}

// 处理删除
const handleDelete = (resource: MenuTreeNode) => {
  emit('delete', resource)
}

// 处理进入设计器
const handleDesigner = (resource: MenuTreeNode) => {
  emit('designer', resource)
}

// 判断是否为客户端类型（设计端和管理端）
const isClientType = (resource: MenuTreeNode) => {
  // 客户端类型的特征：type 为 CLIENT
  return resource.type === 'CLIENT'
}
</script>

<style scoped>
.resource-card-view {
  padding: 24px;
  min-height: 500px;
}

/* 面包屑导航 */
.breadcrumb-nav {
  margin-bottom: 24px;
  padding: 12px 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.breadcrumb-nav a {
  color: #1890ff;
  transition: color 0.3s;
}

.breadcrumb-nav a:hover {
  color: #40a9ff;
}

/* 性能提示 */
.performance-tip {
  margin-bottom: 16px;
}

/* 虚拟滚动容器 */
.card-grid-virtual {
  height: calc(100vh - 300px);
  min-height: 500px;
}

.card-grid-virtual .scroller {
  height: 100%;
}

/* 卡片网格 */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  perspective: 1000px;
}

/* 资源卡片 */
.resource-card {
  position: relative;
  height: 320px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

/* 虚拟滚动模式下的卡片需要额外的边距 */
.card-grid-virtual .resource-card {
  margin: 10px;
}

.resource-card:hover {
  transform: translateY(-4px);
}

/* 卡片内容容器 */
.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.6s;
  transform-style: preserve-3d;
}

.resource-card.is-flipped .card-inner {
  transform: rotateY(180deg);
}

/* 卡片正面和背面共同样式 */
.card-front,
.card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 卡片正面 */
.card-front {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

/* 父卡片（level 0）- 蓝色系 */
.card-level-0 .card-front {
  background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%);
  border: 2px solid rgba(59, 130, 246, 0.3);
}

/* 一级子卡片（level 1）- 绿色系 */
.card-level-1 .card-front {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  border: 2px solid rgba(16, 185, 129, 0.3);
}

/* 二级及以上子卡片（level 2+）- 紫色系 */
.card-level-2 .card-front {
  background: linear-gradient(135deg, #e9d5ff 0%, #d8b4fe 100%);
  border: 2px solid rgba(168, 85, 247, 0.3);
}

.card-icon-wrapper {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 40px;
}

.card-level-0 .card-icon {
  color: #1e40af;
}

.card-level-1 .card-icon {
  color: #047857;
}

.card-level-2 .card-icon {
  color: #7c3aed;
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #1f2937;
}

.card-subtitle {
  font-size: 14px;
  color: #6b7280;
  margin: 0 0 16px 0;
  font-family: 'Courier New', monospace;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.card-count {
  font-size: 13px;
  color: #4b5563;
  padding: 4px 12px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 12px;
}

/* 卡片背面 */
.card-back {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  border: 2px solid #d1d5db;
  transform: rotateY(180deg);
  display: flex;
  flex-direction: column;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.info-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #d1d5db;
}

.info-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.info-icon {
  font-size: 24px;
  color: #1890ff;
}

.info-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.info-header-actions {
  display: flex;
  gap: 4px;
}

.info-header-actions .ant-btn {
  padding: 4px 8px;
  height: auto;
  line-height: 1;
  border: none;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.info-header-actions .ant-btn:hover {
  background: rgba(255, 255, 255, 1);
  transform: scale(1.1);
}

.info-content {
  flex: 1;
  overflow-y: auto;
}

/* 两列网格布局 */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

/* 创建时间占满整行 */
.info-item-full {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 11px;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 13px;
  color: #1f2937;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
}

/* 响应式 */
@media (max-width: 768px) {
  .card-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 16px;
  }

  .resource-card {
    height: 280px;
  }

  .card-icon-wrapper {
    width: 60px;
    height: 60px;
  }

  .card-icon {
    font-size: 30px;
  }
}
</style>
