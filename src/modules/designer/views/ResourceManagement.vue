<template>
  <div class="resource-management">
    <a-card :bordered="false" class="page-card">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">资源管理</h2>
        <div class="page-actions">
          <a-button type="primary" @click="handleCreate">
            <template #icon>
              <plus-outlined />
            </template>
            新建资源
          </a-button>
          <a-segmented v-model:value="viewMode" :options="viewOptions" />
          <a-button @click="handleRefresh">
            <template #icon>
              <reload-outlined />
            </template>
            刷新
          </a-button>

          <!-- 用户头像下拉菜单 -->
          <a-dropdown :trigger="['click']" placement="bottomRight">
            <div class="user-avatar-wrapper">
              <a-avatar :size="32" :src="userAvatar" style="cursor: pointer">
                <template #icon><user-outlined /></template>
              </a-avatar>
            </div>
            <template #overlay>
              <a-menu>
                <a-menu-item key="profile" @click="handleUserProfile">
                  <user-outlined />
                  <span style="margin-left: 8px">个人中心</span>
                </a-menu-item>
                <a-menu-item key="settings" @click="handleUserSettings">
                  <setting-outlined />
                  <span style="margin-left: 8px">账号设置</span>
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="logout" @click="handleLogout">
                  <logout-outlined />
                  <span style="margin-left: 8px">退出登录</span>
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <a-form layout="inline" :model="filterForm" @keyup.enter="handleSearch">
          <a-form-item label="资源名称">
            <a-input v-model:value="filterForm.name" placeholder="请输入资源名称" allow-clear @press-enter="handleSearch" />
          </a-form-item>
          <a-form-item label="菜单编码">
            <a-input v-model:value="filterForm.menuCode" placeholder="请输入菜单编码" allow-clear @press-enter="handleSearch" />
          </a-form-item>
          <a-form-item label="业务模块">
            <a-input v-model:value="filterForm.module" placeholder="请输入业务模块" allow-clear @press-enter="handleSearch" />
          </a-form-item>
          <a-form-item label="节点类型">
            <a-select v-model:value="filterForm.nodeType" placeholder="请选择节点类型" allow-clear style="width: 120px">
              <a-select-option :value="1">文件夹</a-select-option>
              <a-select-option :value="2">页面</a-select-option>
              <a-select-option :value="3">按钮</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-space>
              <a-button type="primary" :loading="searching" @click="handleSearch">
                <template #icon>
                  <search-outlined />
                </template>
                搜索
              </a-button>
              <a-button @click="handleReset">重置</a-button>
              <a-tooltip title="快捷键：Ctrl+F 聚焦搜索">
                <QuestionCircleOutlined style="color: #999" />
              </a-tooltip>
            </a-space>
          </a-form-item>
        </a-form>
      </div>

      <!-- 卡片视图 -->
      <ResourceCardView
        v-if="viewMode === 'card'"
        :resources="dataSource"
        @edit="handleEdit"
        @delete="handleDelete"
        @designer="handleDesigner"
        @mount="handleToggleMount"
      />

      <!-- 表格树视图 -->
      <a-table
        v-else-if="viewMode === 'table'"
        :columns="columns"
        :data-source="dataSource"
        :loading="{
          spinning: loading,
          tip: '加载中...',
        }"
        :pagination="false"
        :row-key="record => record.id"
        :scroll="{ x: 1200 }"
        :default-expand-all-rows="true"
        :child-children-column-name="'children'"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'nodeType'">
            <a-tag :color="getNodeTypeColor(record.nodeType)">
              {{ getNodeTypeText(record.nodeType) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'icon'">
            <component :is="getIconComponent(record.icon)" v-if="record.icon" />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-tooltip :title="record.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
                <a-button type="link" size="small" :loading="mountingId === record.id" @click="handleToggleMount(record as MenuTreeNode)">
                  <template #icon>
                    <ApiOutlined v-if="!record.mountedToAdmin" />
                    <ApiOutlined v-else style="color: #52c41a" />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="进入设计器">
                <a-button type="link" size="small" @click="handleDesigner(record as MenuResource)">
                  <template #icon>
                    <DesktopOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="编辑资源">
                <a-button type="link" size="small" @click="handleEdit(record)">
                  <template #icon>
                    <EditOutlined />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="删除资源">
                <a-button type="link" size="small" danger :loading="deletingId === record.id" @click="handleDelete(record)">
                  <template #icon>
                    <DeleteOutlined />
                  </template>
                </a-button>
              </a-tooltip>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 资源表单 -->
    <ResourceForm v-model:visible="formVisible" :edit-data="editData" @success="handleFormSuccess" />

    <!-- 用户设置弹窗 -->
    <UserSettingsModal v-model:visible="userSettingsVisible" @success="handleUserSettingsSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Modal } from 'ant-design-vue'
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  FolderOutlined,
  FileOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  AppstoreAddOutlined,
  TableOutlined,
  ApiOutlined,
  DesktopOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'
import { useModule } from '@/core/state/helpers'
import { useLogger } from '@/core/services/helpers'
import { notificationService } from '@/core/notification'
import type { MenuResource, MenuTreeNode } from '@/core/api/menu'
import { getDefaultClients } from '@/config/clients'
import ResourceForm from '../components/ResourceForm.vue'
import ResourceCardView from '../components/ResourceCardView.vue'
import UserSettingsModal from '../components/UserSettingsModal.vue'
import { getIconLibraryManager } from '@/core/renderer/icons/IconLibraryManager'

// 初始化服务
const router = useRouter()
const logger = useLogger('ResourceManagement')
const notify = notificationService

// 状态管理
const resourceModule = useModule('resource')

// 响应式数据
const loading = ref(false)
const searching = ref(false)
const deletingId = ref<number | null>(null)
const mountingId = ref<number | null>(null)
const dataSource = ref<MenuTreeNode[]>([])
const viewMode = ref<'card' | 'table'>('card')
const filterForm = reactive({
  name: '',
  menuCode: '',
  module: '',
  nodeType: undefined as number | undefined,
})

// 视图切换选项
const viewOptions = [
  {
    label: '卡片视图',
    value: 'card',
    icon: AppstoreAddOutlined,
  },
  {
    label: '表格树视图',
    value: 'table',
    icon: TableOutlined,
  },
]

// 从配置文件获取默认客户端数据
const defaultClients = getDefaultClients()

const pagination = reactive({
  current: 1,
  pageSize: 10,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total} 条`,
})

// 表格列定义
const columns = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 80,
  },
  {
    title: '资源名称',
    dataIndex: 'name',
    key: 'name',
    width: 150,
  },
  {
    title: '菜单编码',
    dataIndex: 'menuCode',
    key: 'menuCode',
    width: 150,
  },
  {
    title: '业务模块',
    dataIndex: 'module',
    key: 'module',
    width: 120,
  },
  {
    title: '节点类型',
    dataIndex: 'nodeType',
    key: 'nodeType',
    width: 100,
  },
  {
    title: '排序',
    dataIndex: 'sortOrder',
    key: 'sortOrder',
    width: 80,
  },
  {
    title: '图标',
    dataIndex: 'icon',
    key: 'icon',
    width: 80,
  },
  {
    title: '路径',
    dataIndex: 'path',
    key: 'path',
    width: 150,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
    width: 180,
  },
  {
    title: '操作',
    key: 'action',
    width: 150,
    fixed: 'right' as const,
  },
]

// 方法
const fetchData = async () => {
  try {
    loading.value = true
    await resourceModule.dispatch('fetchResources', {
      ...filterForm,
      page: pagination.current,
      size: pagination.pageSize,
    })

    // 合并默认客户端数据和API返回的数据
    const apiResources = resourceModule.state.resources

    // 将API返回的资源按parentId分组
    const resourcesByParent = new Map<number, MenuResource[]>()
    apiResources.forEach((resource: MenuResource) => {
      const parentId = resource.parentId || 0
      if (!resourcesByParent.has(parentId)) {
        resourcesByParent.set(parentId, [])
      }
      resourcesByParent.get(parentId)!.push(resource)
    })

    // 为默认客户端添加子资源
    const clientsWithChildren = defaultClients.map(client => ({
      ...client,
      children: resourcesByParent.get(client.id) || [],
    }))

    dataSource.value = clientsWithChildren
    pagination.total = resourceModule.state.pagination.total

    dataSource.value = clientsWithChildren
    logger.info('资源数据加载成功', { count: clientsWithChildren.length })
  } catch (error: any) {
    notify.error('加载数据失败', error.message || '请检查网络连接后重试')
    logger.error('加载资源数据失败', error, { filterForm })
    // 即使API失败，也显示默认客户端
    dataSource.value = defaultClients.map(client => ({ ...client, children: [] }))
  } finally {
    loading.value = false
  }
}

const handleSearch = async () => {
  searching.value = true
  pagination.current = 1
  try {
    await fetchData()
    notify.success('搜索完成')
  } finally {
    searching.value = false
  }
}

const handleReset = () => {
  filterForm.name = ''
  filterForm.menuCode = ''
  filterForm.module = ''
  filterForm.nodeType = undefined
  pagination.current = 1
  fetchData()
  notify.info('已重置搜索条件')
}

const handleRefresh = () => {
  fetchData()
}

// 用户相关
// 获取状态管理器
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

// 用户头像
const userAvatar = computed(() => {
  const stateManager = getStateManager()
  if (!stateManager) return undefined
  const authState = stateManager.getState('auth')
  return authState?.userInfo?.avatar
})

// 用户设置弹窗
const userSettingsVisible = ref(false)

// 个人中心
function handleUserProfile() {
  notify.info('个人中心功能开发中...')
}

// 账号设置
function handleUserSettings() {
  userSettingsVisible.value = true
}

// 用户设置成功回调
function handleUserSettingsSuccess() {
  notify.success('用户信息已更新')
}

// 退出登录
function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const stateManager = getStateManager()
        if (stateManager) {
          // 调用登出 action
          await stateManager.dispatch('auth/logout')
          notify.success('已退出登录')
          // 跳转到登录页
          router.push('/designer/login')
        }
      } catch (error: any) {
        notify.error('退出登录失败', error.message || '未知错误')
      }
    },
  })
}

// 表单相关
const formVisible = ref(false)
const editData = ref<MenuResource | null>(null)

const handleCreate = () => {
  editData.value = null
  formVisible.value = true
}

const handleDesigner = (resource: MenuResource) => {
  logger.info('进入设计器', { resourceId: resource.id, resourceName: resource.name })

  try {
    // 检查资源是否有URL
    if (!resource.url) {
      notify.warning('无法进入设计器', '该资源没有配置URL路径')
      return
    }

    // 使用Vue Router跳转到设计器编辑页面
    router
      .push({
        name: 'DesignerEditor',
        params: {
          url: resource.url,
        },
      })
      .then(() => {
        notify.info('正在进入设计器', resource.name)
      })
      .catch(error => {
        logger.error('路由跳转失败', error)
        // 如果路由跳转失败，尝试直接跳转
        window.location.href = `/designer/resource/${resource.url}`
      })
  } catch (error: any) {
    notify.error('跳转失败', error.message || '无法访问该页面')
    logger.error('设计器跳转失败', error)
  }
}

const handleEdit = (record: any) => {
  editData.value = record as MenuResource
  formVisible.value = true
}

const handleToggleMount = async (record: MenuTreeNode) => {
  const action = record.mountedToAdmin ? '取消挂载' : '挂载'
  logger.debug(`准备${action}资源`, { menuCode: record.menuCode, resourceName: record.name })

  mountingId.value = record.id
  try {
    if (record.mountedToAdmin) {
      await resourceModule.dispatch('unmountMenuFromAdmin', record.menuCode)
      logger.info('取消挂载成功', { menuCode: record.menuCode, resourceName: record.name })
      notify.success('取消挂载成功', `资源"${record.name}"已从管理端移除`)
    } else {
      await resourceModule.dispatch('mountMenuToAdmin', record.menuCode)
      logger.info('挂载成功', { menuCode: record.menuCode, resourceName: record.name })
      notify.success('挂载成功', `资源"${record.name}"已挂载到管理端`)
    }
    // 刷新数据
    fetchData()
  } catch (error: any) {
    logger.error(`${action}失败`, error, { menuCode: record.menuCode })
    notify.error(`${action}失败`, error.message || '请重试')
  } finally {
    mountingId.value = null
  }
}

const handleDelete = (record: any) => {
  logger.debug('准备删除资源', { resourceId: record.id, resourceName: record.name })

  Modal.confirm({
    title: '确认删除',
    content: `确定要删除资源"${record.name}"吗？${record.nodeType === 1 ? '注意：删除文件夹将同时删除其下所有子资源！' : '此操作不可恢复。'}`,
    okText: '确定',
    okType: 'danger',
    cancelText: '取消',
    onOk: async () => {
      deletingId.value = record.id
      try {
        await resourceModule.dispatch('deleteResource', record.id)
        logger.info('资源删除成功', { resourceId: record.id, resourceName: record.name })
        notify.success('删除成功', `资源"${record.name}"已删除`)
        fetchData()
      } catch (error: any) {
        logger.error('资源删除失败', error, { resourceId: record.id })
        notify.error('删除失败', error.message || '请重试')
      } finally {
        deletingId.value = null
      }
    },
  })
}

// 键盘快捷键
const handleKeyboard = (e: KeyboardEvent) => {
  // Ctrl+F 聚焦搜索
  if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
    e.preventDefault()
    const firstInput = document.querySelector('.filter-section input') as HTMLInputElement
    firstInput?.focus()
  }
  // Ctrl+N 新建资源
  if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
    e.preventDefault()
    handleCreate()
  }
  // Ctrl+R 刷新
  if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
    e.preventDefault()
    handleRefresh()
  }
}

const handleFormSuccess = () => {
  fetchData()
}

const getNodeTypeText = (nodeType: number) => {
  const map: Record<number, string> = {
    1: '文件夹',
    2: '页面',
    3: '按钮',
  }
  return map[nodeType] || '未知'
}

const getNodeTypeColor = (nodeType: number) => {
  const map: Record<number, string> = {
    1: 'blue',
    2: 'green',
    3: 'orange',
  }
  return map[nodeType] || 'default'
}

const getIconComponent = (iconName?: string) => {
  if (!iconName) return null

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
  }
  return iconMap[iconName] || null
}

// 生命周期
onMounted(() => {
  fetchData()
  // 注册键盘快捷键
  window.addEventListener('keydown', handleKeyboard)
})

onUnmounted(() => {
  // 移除键盘快捷键
  window.removeEventListener('keydown', handleKeyboard)
})
</script>

<style scoped>
.resource-management {
  padding: 0;
}

.page-card {
  border-radius: 8px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0;
  color: #262626;
}

.page-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar-wrapper {
  margin-left: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }
}

.filter-section {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
}

.filter-section :deep(.ant-form-item) {
  margin-bottom: 0;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .filter-section :deep(.ant-form) {
    flex-direction: column;
  }

  .filter-section :deep(.ant-form-item) {
    width: 100%;
    margin-bottom: 16px;
  }
}
</style>
