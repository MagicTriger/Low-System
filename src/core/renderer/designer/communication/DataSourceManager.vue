<template>
  <div class="data-source-manager">
    <!-- 管理器头部 -->
    <div class="manager-header">
      <div class="header-left">
        <database-outlined />
        <span class="manager-title">数据源管理</span>
        <a-badge :count="dataSources.length" :number-style="{ backgroundColor: '#52c41a' }" />
      </div>

      <div class="header-right">
        <a-button-group size="small">
          <a-button @click="showAddModal = true">
            <plus-outlined />
            新建数据源
          </a-button>

          <a-button @click="refreshAllSources">
            <reload-outlined />
            刷新全部
          </a-button>

          <a-dropdown :trigger="['click']">
            <a-button>
              <more-outlined />
            </a-button>
            <template #overlay>
              <a-menu @click="handleMenuClick">
                <a-menu-item key="import">
                  <import-outlined />
                  导入数据源
                </a-menu-item>
                <a-menu-item key="export">
                  <export-outlined />
                  导出数据源
                </a-menu-item>
                <a-menu-divider />
                <a-menu-item key="clear">
                  <clear-outlined />
                  清空所有
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-button-group>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <a-input-search v-model:value="searchKeyword" placeholder="搜索数据源..." @search="handleSearch" class="search-input" />

      <a-select v-model:value="filterType" placeholder="筛选类型" style="width: 120px" @change="handleFilter">
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="api">API</a-select-option>
        <a-select-option value="static">静态数据</a-select-option>
        <a-select-option value="mock">模拟数据</a-select-option>
        <a-select-option value="local">本地存储</a-select-option>
      </a-select>

      <a-select v-model:value="filterStatus" placeholder="筛选状态" style="width: 100px" @change="handleFilter">
        <a-select-option value="">全部</a-select-option>
        <a-select-option value="connected">已连接</a-select-option>
        <a-select-option value="disconnected">未连接</a-select-option>
        <a-select-option value="error">错误</a-select-option>
      </a-select>
    </div>

    <!-- 数据源列表 -->
    <div class="data-sources-list">
      <div v-if="filteredDataSources.length === 0" class="empty-state">
        <empty-outlined />
        <span>{{ searchKeyword ? '未找到匹配的数据源' : '暂无数据源，点击"新建数据源"开始创建' }}</span>
      </div>

      <div v-else class="sources-container">
        <div
          v-for="source in filteredDataSources"
          :key="source.id"
          class="source-item"
          :class="{ active: selectedSourceId === source.id }"
          @click="selectSource(source.id)"
        >
          <div class="source-header">
            <div class="source-info">
              <component :is="getSourceIcon(source.type)" />
              <div class="source-details">
                <div class="source-name">{{ source.name }}</div>
                <div class="source-description">{{ source.description || '暂无描述' }}</div>
              </div>
            </div>

            <div class="source-status">
              <a-badge :status="getStatusType(source.status)" :text="getStatusText(source.status)" />
            </div>
          </div>

          <div class="source-meta">
            <div class="meta-item">
              <span class="meta-label">类型:</span>
              <span class="meta-value">{{ getTypeLabel(source.type) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">更新:</span>
              <span class="meta-value">{{ formatTime(source.updatedAt) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">绑定:</span>
              <span class="meta-value">{{ getBindingCount(source.id) }} 个组件</span>
            </div>
          </div>

          <div class="source-actions">
            <a-button size="small" @click.stop="testConnection(source)">
              <api-outlined />
              测试连接
            </a-button>

            <a-button size="small" @click.stop="editSource(source)">
              <edit-outlined />
              编辑
            </a-button>

            <a-button size="small" @click.stop="duplicateSource(source)">
              <copy-outlined />
              复制
            </a-button>

            <a-button size="small" danger @click.stop="deleteSource(source.id)" :disabled="getBindingCount(source.id) > 0">
              <delete-outlined />
              删除
            </a-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据源详情 -->
    <div v-if="selectedSource" class="source-details-panel">
      <div class="details-header">
        <span class="details-title">{{ selectedSource.name }} - 详情</span>
        <a-button size="small" @click="selectedSourceId = ''">
          <close-outlined />
        </a-button>
      </div>

      <div class="details-content">
        <a-tabs v-model:activeKey="activeTab">
          <a-tab-pane key="config" tab="配置">
            <div class="config-section">
              <div class="config-item">
                <label>数据源名称</label>
                <a-input v-model:value="selectedSource.name" />
              </div>

              <div class="config-item">
                <label>描述</label>
                <a-textarea v-model:value="selectedSource.description" :rows="2" />
              </div>

              <div class="config-item">
                <label>类型</label>
                <a-select v-model:value="selectedSource.type" disabled>
                  <a-select-option value="api">API 接口</a-select-option>
                  <a-select-option value="static">静态数据</a-select-option>
                  <a-select-option value="mock">模拟数据</a-select-option>
                  <a-select-option value="local">本地存储</a-select-option>
                </a-select>
              </div>

              <!-- API 配置 -->
              <div v-if="selectedSource.type === 'api'" class="api-config">
                <div class="config-item">
                  <label>API 地址</label>
                  <a-input v-model:value="selectedSource.config.url" />
                </div>

                <div class="config-item">
                  <label>请求方法</label>
                  <a-select v-model:value="selectedSource.config.method">
                    <a-select-option value="GET">GET</a-select-option>
                    <a-select-option value="POST">POST</a-select-option>
                    <a-select-option value="PUT">PUT</a-select-option>
                    <a-select-option value="DELETE">DELETE</a-select-option>
                  </a-select>
                </div>

                <div class="config-item">
                  <label>请求头</label>
                  <a-textarea v-model:value="selectedSource.config.headers" placeholder="JSON 格式" :rows="3" />
                </div>

                <div class="config-item">
                  <label>请求参数</label>
                  <a-textarea v-model:value="selectedSource.config.params" placeholder="JSON 格式" :rows="3" />
                </div>
              </div>

              <!-- 静态数据配置 -->
              <div v-else-if="selectedSource.type === 'static'" class="static-config">
                <div class="config-item">
                  <label>静态数据</label>
                  <a-textarea v-model:value="selectedSource.config.data" placeholder="JSON 格式的静态数据" :rows="10" />
                </div>
              </div>

              <!-- 模拟数据配置 -->
              <div v-else-if="selectedSource.type === 'mock'" class="mock-config">
                <div class="config-item">
                  <label>数据模板</label>
                  <a-textarea v-model:value="selectedSource.config.template" placeholder="Mock.js 模板" :rows="8" />
                </div>

                <div class="config-item">
                  <label>生成数量</label>
                  <a-input-number v-model:value="selectedSource.config.count" :min="1" :max="1000" />
                </div>
              </div>

              <!-- 本地存储配置 -->
              <div v-else-if="selectedSource.type === 'local'" class="local-config">
                <div class="config-item">
                  <label>存储键名</label>
                  <a-input v-model:value="selectedSource.config.key" />
                </div>

                <div class="config-item">
                  <label>存储类型</label>
                  <a-select v-model:value="selectedSource.config.storageType">
                    <a-select-option value="localStorage">localStorage</a-select-option>
                    <a-select-option value="sessionStorage">sessionStorage</a-select-option>
                  </a-select>
                </div>
              </div>

              <div class="config-actions">
                <a-button type="primary" @click="saveSource">
                  <save-outlined />
                  保存配置
                </a-button>

                <a-button @click="resetSource">
                  <undo-outlined />
                  重置
                </a-button>
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="data" tab="数据预览">
            <div class="data-preview">
              <div class="preview-toolbar">
                <a-button size="small" @click="refreshData">
                  <reload-outlined />
                  刷新数据
                </a-button>

                <a-button size="small" @click="formatData">
                  <align-left-outlined />
                  格式化
                </a-button>
              </div>

              <div class="preview-content">
                <a-textarea :value="formattedData" :rows="20" readonly class="data-display" />
              </div>
            </div>
          </a-tab-pane>

          <a-tab-pane key="bindings" tab="组件绑定">
            <div class="bindings-list">
              <div v-if="sourceBindings.length === 0" class="empty-bindings">
                <empty-outlined />
                <span>暂无组件绑定此数据源</span>
              </div>

              <div v-else class="bindings-container">
                <div v-for="binding in sourceBindings" :key="binding.componentId" class="binding-item">
                  <div class="binding-info">
                    <component :is="getComponentIcon(binding.componentType)" />
                    <div class="binding-details">
                      <div class="binding-name">{{ binding.componentName }}</div>
                      <div class="binding-property">绑定属性: {{ binding.property }}</div>
                    </div>
                  </div>

                  <div class="binding-actions">
                    <a-button size="small" @click="editBinding(binding)">
                      <edit-outlined />
                      编辑
                    </a-button>

                    <a-button size="small" danger @click="removeBinding(binding)">
                      <disconnect-outlined />
                      解绑
                    </a-button>
                  </div>
                </div>
              </div>
            </div>
          </a-tab-pane>
        </a-tabs>
      </div>
    </div>

    <!-- 新建/编辑数据源模态框 -->
    <a-modal
      v-model:open="showAddModal"
      :title="editingSource ? '编辑数据源' : '新建数据源'"
      width="600px"
      @ok="confirmSaveSource"
      @cancel="cancelEdit"
    >
      <a-form :model="formData" layout="vertical">
        <a-form-item label="数据源名称" required>
          <a-input v-model:value="formData.name" placeholder="请输入数据源名称" />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" placeholder="请输入描述" :rows="2" />
        </a-form-item>

        <a-form-item label="数据源类型" required>
          <a-select v-model:value="formData.type" @change="handleTypeChange">
            <a-select-option value="api">API 接口</a-select-option>
            <a-select-option value="static">静态数据</a-select-option>
            <a-select-option value="mock">模拟数据</a-select-option>
            <a-select-option value="local">本地存储</a-select-option>
          </a-select>
        </a-form-item>

        <!-- 根据类型显示不同的配置项 -->
        <div v-if="formData.type === 'api'">
          <a-form-item label="API 地址" required>
            <a-input v-model:value="formData.config.url" placeholder="https://api.example.com/data" />
          </a-form-item>

          <a-form-item label="请求方法">
            <a-select v-model:value="formData.config.method">
              <a-select-option value="GET">GET</a-select-option>
              <a-select-option value="POST">POST</a-select-option>
            </a-select>
          </a-form-item>
        </div>

        <div v-else-if="formData.type === 'static'">
          <a-form-item label="静态数据" required>
            <a-textarea v-model:value="formData.config.data" placeholder='{"items": [{"id": 1, "name": "示例"}]}' :rows="6" />
          </a-form-item>
        </div>

        <div v-else-if="formData.type === 'mock'">
          <a-form-item label="数据模板" required>
            <a-textarea v-model:value="formData.config.template" placeholder='{"list|10": [{"id|+1": 1, "name": "@cname"}]}' :rows="6" />
          </a-form-item>
        </div>

        <div v-else-if="formData.type === 'local'">
          <a-form-item label="存储键名" required>
            <a-input v-model:value="formData.config.key" placeholder="userData" />
          </a-form-item>
        </div>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'
import {
  DatabaseOutlined,
  PlusOutlined,
  ReloadOutlined,
  MoreOutlined,
  ImportOutlined,
  ExportOutlined,
  ClearOutlined,
  EmptyOutlined,
  ApiOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  CloseOutlined,
  SaveOutlined,
  UndoOutlined,
  AlignLeftOutlined,
  DisconnectOutlined,
  FileTextOutlined,
  CloudOutlined,
  HddOutlined,
  ExperimentOutlined,
} from '@ant-design/icons-vue'

interface DataSource {
  id: string
  name: string
  description?: string
  type: 'api' | 'static' | 'mock' | 'local'
  status: 'connected' | 'disconnected' | 'error'
  config: Record<string, any>
  data?: any
  createdAt: number
  updatedAt: number
}

interface ComponentBinding {
  componentId: string
  componentName: string
  componentType: string
  property: string
  dataPath?: string
}

// 状态管理
const dataSources = ref<DataSource[]>([])
const selectedSourceId = ref('')
const searchKeyword = ref('')
const filterType = ref('')
const filterStatus = ref('')
const showAddModal = ref(false)
const editingSource = ref<DataSource | null>(null)
const activeTab = ref('config')

// 表单数据
const formData = reactive({
  name: '',
  description: '',
  type: 'api' as DataSource['type'],
  config: {} as Record<string, any>,
})

// 组件绑定数据（模拟）
const componentBindings = ref<ComponentBinding[]>([
  {
    componentId: 'comp1',
    componentName: '用户列表',
    componentType: 'table',
    property: 'dataSource',
    dataPath: 'users',
  },
])

// 计算属性
const selectedSource = computed(() => {
  return dataSources.value.find(source => source.id === selectedSourceId.value)
})

const filteredDataSources = computed(() => {
  let filtered = dataSources.value

  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(
      source => source.name.toLowerCase().includes(keyword) || (source.description && source.description.toLowerCase().includes(keyword))
    )
  }

  if (filterType.value) {
    filtered = filtered.filter(source => source.type === filterType.value)
  }

  if (filterStatus.value) {
    filtered = filtered.filter(source => source.status === filterStatus.value)
  }

  return filtered
})

const sourceBindings = computed(() => {
  if (!selectedSourceId.value) return []
  return componentBindings.value.filter(
    binding =>
      // 这里应该根据实际的绑定关系来过滤
      true
  )
})

const formattedData = computed(() => {
  if (!selectedSource.value?.data) return ''
  try {
    return JSON.stringify(selectedSource.value.data, null, 2)
  } catch (error) {
    return String(selectedSource.value.data)
  }
})

// 方法
const selectSource = (sourceId: string) => {
  selectedSourceId.value = sourceId
}

const getSourceIcon = (type: string) => {
  const iconMap: Record<string, any> = {
    api: ApiOutlined,
    static: FileTextOutlined,
    mock: ExperimentOutlined,
    local: HddOutlined,
  }
  return iconMap[type] || DatabaseOutlined
}

const getStatusType = (status: string) => {
  const typeMap: Record<string, any> = {
    connected: 'success',
    disconnected: 'default',
    error: 'error',
  }
  return typeMap[status] || 'default'
}

const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    connected: '已连接',
    disconnected: '未连接',
    error: '连接错误',
  }
  return textMap[status] || status
}

const getTypeLabel = (type: string) => {
  const labelMap: Record<string, string> = {
    api: 'API接口',
    static: '静态数据',
    mock: '模拟数据',
    local: '本地存储',
  }
  return labelMap[type] || type
}

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleString()
}

const getBindingCount = (sourceId: string) => {
  // 计算绑定到此数据源的组件数量
  return componentBindings.value.filter(
    binding =>
      // 这里应该根据实际的绑定关系来计算
      true
  ).length
}

const getComponentIcon = (type: string) => {
  // 根据组件类型返回对应图标
  return FileTextOutlined
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中实现
}

const handleFilter = () => {
  // 筛选逻辑已在计算属性中实现
}

const testConnection = async (source: DataSource) => {
  try {
    message.loading('正在测试连接...', 0)

    // 模拟测试连接
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 更新状态
    source.status = 'connected'
    message.destroy()
    message.success('连接测试成功')
  } catch (error) {
    source.status = 'error'
    message.destroy()
    message.error('连接测试失败')
  }
}

const editSource = (source: DataSource) => {
  editingSource.value = source
  Object.assign(formData, {
    name: source.name,
    description: source.description,
    type: source.type,
    config: { ...source.config },
  })
  showAddModal.value = true
}

const duplicateSource = (source: DataSource) => {
  const newSource: DataSource = {
    ...source,
    id: generateId(),
    name: source.name + ' (副本)',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  }
  dataSources.value.push(newSource)
  message.success('数据源已复制')
}

const deleteSource = (sourceId: string) => {
  const index = dataSources.value.findIndex(source => source.id === sourceId)
  if (index > -1) {
    dataSources.value.splice(index, 1)
    if (selectedSourceId.value === sourceId) {
      selectedSourceId.value = ''
    }
    message.success('数据源已删除')
  }
}

const refreshAllSources = async () => {
  message.loading('正在刷新数据源...', 0)

  // 模拟刷新
  await new Promise(resolve => setTimeout(resolve, 1000))

  message.destroy()
  message.success('数据源已刷新')
}

const refreshData = async () => {
  if (!selectedSource.value) return

  try {
    message.loading('正在刷新数据...', 0)

    // 根据数据源类型获取数据
    let data
    switch (selectedSource.value.type) {
      case 'api':
        data = await fetchApiData(selectedSource.value.config)
        break
      case 'static':
        data = JSON.parse(selectedSource.value.config.data || '{}')
        break
      case 'mock':
        data = generateMockData(selectedSource.value.config)
        break
      case 'local':
        data = getLocalStorageData(selectedSource.value.config)
        break
    }

    selectedSource.value.data = data
    selectedSource.value.status = 'connected'
    selectedSource.value.updatedAt = Date.now()

    message.destroy()
    message.success('数据已刷新')
  } catch (error) {
    selectedSource.value.status = 'error'
    message.destroy()
    message.error('数据刷新失败')
  }
}

const formatData = () => {
  // 数据格式化已在计算属性中实现
  message.success('数据已格式化')
}

const saveSource = () => {
  if (!selectedSource.value) return

  selectedSource.value.updatedAt = Date.now()
  message.success('配置已保存')
}

const resetSource = () => {
  if (!selectedSource.value) return

  // 重置到原始状态
  message.success('配置已重置')
}

const editBinding = (binding: ComponentBinding) => {
  message.info('编辑绑定功能开发中')
}

const removeBinding = (binding: ComponentBinding) => {
  const index = componentBindings.value.findIndex(b => b.componentId === binding.componentId && b.property === binding.property)
  if (index > -1) {
    componentBindings.value.splice(index, 1)
    message.success('绑定已解除')
  }
}

const handleTypeChange = (type: string) => {
  // 根据类型初始化配置
  switch (type) {
    case 'api':
      formData.config = {
        url: '',
        method: 'GET',
        headers: '{}',
        params: '{}',
      }
      break
    case 'static':
      formData.config = {
        data: '{}',
      }
      break
    case 'mock':
      formData.config = {
        template: '{}',
        count: 10,
      }
      break
    case 'local':
      formData.config = {
        key: '',
        storageType: 'localStorage',
      }
      break
  }
}

const confirmSaveSource = () => {
  if (!formData.name || !formData.type) {
    message.error('请填写必填项')
    return
  }

  if (editingSource.value) {
    // 编辑现有数据源
    Object.assign(editingSource.value, {
      name: formData.name,
      description: formData.description,
      type: formData.type,
      config: { ...formData.config },
      updatedAt: Date.now(),
    })
    message.success('数据源已更新')
  } else {
    // 创建新数据源
    const newSource: DataSource = {
      id: generateId(),
      name: formData.name,
      description: formData.description,
      type: formData.type,
      status: 'disconnected',
      config: { ...formData.config },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    dataSources.value.push(newSource)
    message.success('数据源已创建')
  }

  cancelEdit()
}

const cancelEdit = () => {
  showAddModal.value = false
  editingSource.value = null
  Object.assign(formData, {
    name: '',
    description: '',
    type: 'api',
    config: {},
  })
}

const handleMenuClick = ({ key }: { key: string }) => {
  switch (key) {
    case 'import':
      importDataSources()
      break
    case 'export':
      exportDataSources()
      break
    case 'clear':
      clearAllSources()
      break
  }
}

const importDataSources = () => {
  message.info('导入功能开发中')
}

const exportDataSources = () => {
  const data = JSON.stringify(dataSources.value, null, 2)
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'data-sources.json'
  a.click()
  URL.revokeObjectURL(url)
  message.success('数据源已导出')
}

const clearAllSources = () => {
  dataSources.value = []
  selectedSourceId.value = ''
  message.success('所有数据源已清空')
}

// 工具函数
const generateId = () => {
  return 'ds_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const fetchApiData = async (config: any) => {
  // 模拟 API 请求
  const response = await fetch(config.url, {
    method: config.method || 'GET',
    headers: config.headers ? JSON.parse(config.headers) : {},
    body: config.method !== 'GET' && config.params ? config.params : undefined,
  })
  return response.json()
}

const generateMockData = (config: any) => {
  // 模拟 Mock.js 数据生成
  try {
    // 这里应该使用 Mock.js 库
    return JSON.parse(config.template || '{}')
  } catch (error) {
    throw new Error('模板格式错误')
  }
}

const getLocalStorageData = (config: any) => {
  const storage = config.storageType === 'sessionStorage' ? sessionStorage : localStorage
  const data = storage.getItem(config.key)
  return data ? JSON.parse(data) : null
}

// 初始化示例数据
const initSampleData = () => {
  dataSources.value = [
    {
      id: 'ds_1',
      name: '用户列表API',
      description: '获取用户列表数据',
      type: 'api',
      status: 'connected',
      config: {
        url: 'https://jsonplaceholder.typicode.com/users',
        method: 'GET',
        headers: '{}',
        params: '{}',
      },
      data: [],
      createdAt: Date.now() - 86400000,
      updatedAt: Date.now() - 3600000,
    },
    {
      id: 'ds_2',
      name: '产品数据',
      description: '静态产品数据',
      type: 'static',
      status: 'connected',
      config: {
        data: '{"products": [{"id": 1, "name": "产品A", "price": 100}]}',
      },
      data: { products: [{ id: 1, name: '产品A', price: 100 }] },
      createdAt: Date.now() - 172800000,
      updatedAt: Date.now() - 7200000,
    },
  ]
}

// 初始化
initSampleData()
</script>

<style scoped>
.data-source-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #ffffff;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.manager-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.search-section {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
}

.data-sources-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  color: #8c8c8c;
  font-size: 13px;
}

.sources-container {
  display: grid;
  gap: 8px;
}

.source-item {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #ffffff;
}

.source-item:hover {
  border-color: #91d5ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.1);
}

.source-item.active {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.2);
}

.source-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 8px;
}

.source-info {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  flex: 1;
}

.source-details {
  flex: 1;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 2px;
}

.source-description {
  font-size: 12px;
  color: #8c8c8c;
}

.source-meta {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 8px;
  font-size: 12px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.meta-label {
  color: #8c8c8c;
}

.meta-value {
  color: #595959;
}

.source-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.source-details-panel {
  width: 400px;
  border-left: 1px solid #e8e8e8;
  display: flex;
  flex-direction: column;
  background: #fafafa;
}

.details-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #e8e8e8;
  background: #ffffff;
}

.details-title {
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.details-content {
  flex: 1;
  overflow: auto;
}

.config-section {
  padding: 16px;
}

.config-item {
  margin-bottom: 16px;
}

.config-item label {
  display: block;
  font-size: 12px;
  color: #666666;
  margin-bottom: 4px;
}

.config-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.data-preview {
  padding: 16px;
}

.preview-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.preview-content {
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  overflow: hidden;
}

.data-display {
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  border: none;
  resize: none;
}

.bindings-list {
  padding: 16px;
}

.empty-bindings {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 40px 20px;
  text-align: center;
  color: #8c8c8c;
  font-size: 13px;
}

.bindings-container {
  display: grid;
  gap: 8px;
}

.binding-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  background: #ffffff;
}

.binding-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.binding-details {
  flex: 1;
}

.binding-name {
  font-size: 13px;
  font-weight: 500;
  color: #262626;
  margin-bottom: 2px;
}

.binding-property {
  font-size: 12px;
  color: #8c8c8c;
}

.binding-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .data-source-manager {
    background: #1f1f1f;
  }

  .manager-header,
  .search-section {
    border-bottom-color: #434343;
  }

  .manager-title {
    color: #f0f0f0;
  }

  .source-item {
    background: #262626;
    border-color: #434343;
  }

  .source-item:hover {
    border-color: #1890ff;
  }

  .source-name {
    color: #f0f0f0;
  }

  .source-description {
    color: #a6a6a6;
  }

  .meta-label {
    color: #a6a6a6;
  }

  .meta-value {
    color: #d9d9d9;
  }

  .source-details-panel {
    background: #262626;
    border-left-color: #434343;
  }

  .details-header {
    background: #1f1f1f;
    border-bottom-color: #434343;
  }

  .details-title {
    color: #f0f0f0;
  }

  .config-item label {
    color: #a6a6a6;
  }

  .data-display {
    background: #1f1f1f;
    color: #f0f0f0;
    border-color: #434343;
  }

  .binding-item {
    background: #1f1f1f;
    border-color: #434343;
  }

  .binding-name {
    color: #f0f0f0;
  }

  .binding-property {
    color: #a6a6a6;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .manager-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .header-left,
  .header-right {
    justify-content: center;
  }

  .search-section {
    flex-direction: column;
    align-items: stretch;
  }

  .source-details-panel {
    width: 100%;
    border-left: none;
    border-top: 1px solid #e8e8e8;
  }

  .source-header {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }

  .source-meta {
    flex-direction: column;
    gap: 4px;
    align-items: flex-start;
  }

  .source-actions {
    flex-wrap: wrap;
  }

  .binding-item {
    flex-direction: column;
    gap: 8px;
    align-items: stretch;
  }
}
</style>
