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
        </div>
      </div>

      <!-- 搜索和筛选 -->
      <div class="filter-section">
        <a-form layout="inline" :model="filterForm" @keyup.enter="handleSearch">
          <a-form-item label="资源名称">
            <a-input v-model:value="filterForm.name" placeholder="请输入资源名称" allow-clear @press-enter="handleSearch" />
          </a-form-item>
          <a-form-item label="菜单编码">
            <a-input v-model:value="filterForm.code" placeholder="请输入菜单编码" allow-clear @press-enter="handleSearch" />
          </a-form-item>
          <a-form-item label="权限路径">
            <a-input v-model:value="filterForm.path" placeholder="请输入权限路径" allow-clear @press-enter="handleSearch" />
          </a-form-item>
          <a-form-item label="菜单类型">
            <a-select v-model:value="filterForm.type" placeholder="请选择菜单类型" allow-clear style="width: 150px">
              <a-select-option value="CLIENT">客户端</a-select-option>
              <a-select-option value="DIRECTORY">目录</a-select-option>
              <a-select-option value="MENU">菜单</a-select-option>
              <a-select-option value="CUSTOM_PAGE">自定义界面</a-select-option>
              <a-select-option value="MODEL_PAGE">模型页面</a-select-option>
              <a-select-option value="BUTTON">按钮</a-select-option>
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
        :resources="flatDataSource"
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
        :row-selection="{
          type: 'radio',
          selectedRowKeys: selectedRowKeys,
          onChange: handleSelectionChange,
          getCheckboxProps: (record: any) => ({
            disabled: record.type === 'BUTTON',
          }),
          checkStrictly: false,
        }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getMenuTypeColor(record.type)">
              {{ getMenuTypeText(record.type) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'icon'">
            <component :is="getIconComponent(record.icon)" v-if="record.icon" />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'action'">
            <a-space>
              <a-tooltip :title="record.type === 'CLIENT' ? '客户端类型不支持挂载' : record.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
                <a-button
                  type="link"
                  size="small"
                  :disabled="record.type === 'CLIENT'"
                  :loading="mountingId === record.id"
                  @click="handleToggleMount(record as MenuResource)"
                >
                  <template #icon>
                    <ApiOutlined v-if="!record.mountedToAdmin" :style="{ color: record.type === 'CLIENT' ? '#d9d9d9' : undefined }" />
                    <ApiOutlined v-else :style="{ color: record.type === 'CLIENT' ? '#d9d9d9' : '#52c41a' }" />
                  </template>
                </a-button>
              </a-tooltip>
              <a-tooltip title="进入设计器">
                <a-button type="link" size="small" @click="handleDesigner(record as MenuResource)" :disabled="record.type === 'CLIENT'">
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
} from '@ant-design/icons-vue'
import { useModule } from '@/core/state/helpers'
import { useLogger } from '@/core/services/helpers'
import { notificationService } from '@/core/notification'
import type { MenuResource, MenuTreeNode } from '@/core/api/menu'
import ResourceForm from '../components/ResourceForm.vue'
import ResourceCardView from '../components/ResourceCardView.vue'
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
const dataSource = ref<(MenuResource | MenuTreeNode)[]>([])
const viewMode = ref<'card' | 'table'>('card')
const selectedRowKeys = ref<number[]>([]) // 选中的行
const selectedParentNode = ref<MenuResource | MenuTreeNode | null>(null) // 选中的父节点
const filterForm = reactive({
  name: '',
  code: '',
  path: '',
  type: undefined as string | undefined,
})

// 为卡片视图提供扁平化的数据
const flatDataSource = computed(() => {
  // 递归扁平化树形结构
  const flatten = (nodes: (MenuResource | MenuTreeNode)[]): MenuResource[] => {
    const result: MenuResource[] = []
    for (const node of nodes) {
      const { children, ...resource } = node as MenuTreeNode
      result.push(resource as MenuResource)
      if (children && children.length > 0) {
        result.push(...flatten(children))
      }
    }
    return result
  }
  return flatten(dataSource.value)
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
    title: '资源名称',
    dataIndex: 'name',
    key: 'name',
    width: 100,
  },
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
    width: 180,
  },
  {
    title: '菜单编码',
    dataIndex: 'code',
    key: 'code',
    width: 150,
  },
  {
    title: '菜单类型',
    dataIndex: 'type',
    key: 'type',
    width: 120,
  },
  {
    title: 'URL',
    dataIndex: 'url',
    key: 'url',
    width: 150,
  },
  {
    title: '权限路径',
    dataIndex: 'path',
    key: 'path',
    width: 120,
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
    title: '创建时间',
    dataIndex: 'createTime',
    key: 'createTime',
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

    // 直接使用后端返回的数据，不再合并内置客户端
    dataSource.value = resourceModule.state.resources
    pagination.total = resourceModule.state.pagination.total

    logger.info('资源数据加载成功', { count: dataSource.value.length })
  } catch (error: any) {
    notify.error('加载数据失败', error.message || '请检查网络连接后重试')
    logger.error('加载资源数据失败', error, { filterForm })
    dataSource.value = []
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
  filterForm.code = ''
  filterForm.path = ''
  filterForm.type = undefined
  pagination.current = 1
  fetchData()
  notify.info('已重置搜索条件')
}

const handleRefresh = () => {
  fetchData()
}

// 表单相关
const formVisible = ref(false)
const editData = ref<MenuResource | null>(null)

// 处理表格行选择变化
const handleSelectionChange = (selectedKeys: number[], selectedRows: any[]) => {
  selectedRowKeys.value = selectedKeys
  selectedParentNode.value = selectedRows[0] || null

  if (selectedParentNode.value) {
    console.log('📌 [ResourceManagement] 选中父节点:', selectedParentNode.value)
    notify.info('已选择父节点', `父节点: ${selectedParentNode.value.name}`)
  }
}

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

    // 使用完整路径跳转，确保name参数被正确传递
    const encodedName = encodeURIComponent(resource.name)
    const path = `/designer/resource/${resource.url}/${encodedName}`

    logger.debug('跳转到设计器', { path, url: resource.url, name: resource.name })

    // 使用Vue Router跳转到设计器编辑页面
    router
      .push(path)
      .then(() => {
        notify.info('正在进入设计器', resource.name)
      })
      .catch(error => {
        logger.error('路由跳转失败', error)
        // 如果路由跳转失败，尝试直接跳转
        window.location.href = path
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

const handleToggleMount = async (record: MenuTreeNode | MenuResource) => {
  // 确保record有mountedToAdmin属性，如果没有则默认为false
  const currentMountStatus = record.mountedToAdmin ?? false
  const action = currentMountStatus ? '取消挂载' : '挂载'
  const newMountStatus = !currentMountStatus

  logger.debug(`准备${action}资源`, { menuId: record.id, resourceName: record.name, currentMountStatus })

  mountingId.value = record.id
  try {
    // 使用updateResource接口，发送完整的菜单对象
    await resourceModule.dispatch('updateResource', {
      id: record.id,
      code: record.code,
      name: record.name,
      type: record.type,
      url: record.url,
      path: record.path,
      icon: record.icon,
      sortOrder: record.sortOrder,
      parentId: record.parentId,
      modelId: record.modelId,
      modelActionId: record.modelActionId,
      mountedToAdmin: newMountStatus,
      remark: record.remark,
    })

    logger.info(`${action}成功`, { menuId: record.id, resourceName: record.name, newMountStatus })
    notify.success(`${action}成功`, newMountStatus ? `资源"${record.name}"已挂载到管理端` : `资源"${record.name}"已从管理端移除`)

    // 立即更新本地数据，提供即时反馈
    record.mountedToAdmin = newMountStatus

    // 刷新数据以确保与后端同步
    await fetchData()
  } catch (error: any) {
    logger.error(`${action}失败`, error, { menuId: record.id })
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

const getIconComponent = (iconName?: string) => {
  if (!iconName) return null

  // 检查是否是自定义图标 (格式: custom/iconName)
  if (iconName.startsWith('custom/')) {
    const customIconName = iconName.replace('custom/', '')
    const iconManager = getIconLibraryManager()
    const customIcon = iconManager.getIcon('custom', customIconName)
    if (customIcon) {
      return customIcon.component
    }
  }

  // 尝试从图标库获取
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
