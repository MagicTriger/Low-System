<template>
  <div class="data-source-panel">
    <!-- 工具栏 -->
    <div class="panel-toolbar">
      <a-button type="primary" @click="handleAdd">
        <template #icon>
          <PlusOutlined />
        </template>
        添加数据源
      </a-button>
      <a-input-search v-model:value="searchKeyword" placeholder="搜索数据源" style="width: 200px" allow-clear />
    </div>

    <!-- 数据源列表 -->
    <div class="data-source-list">
      <a-empty v-if="filteredDataSources.length === 0" description="暂无数据源" />

      <div
        v-for="ds in filteredDataSources"
        :key="ds.id"
        class="data-source-item"
        :class="{ active: selectedId === ds.id }"
        @click="handleSelect(ds.id)"
      >
        <div class="item-header">
          <div class="item-title">
            <component :is="getTypeIcon(ds.type)" class="type-icon" />
            <span>{{ ds.name }}</span>
          </div>
          <a-space>
            <a-button type="text" size="small" @click.stop="handleTest(ds)" :loading="testingId === ds.id">
              <template #icon>
                <ThunderboltOutlined />
              </template>
            </a-button>
            <a-button type="text" size="small" danger @click.stop="handleDelete(ds.id)">
              <template #icon>
                <DeleteOutlined />
              </template>
            </a-button>
          </a-space>
        </div>
        <div class="item-meta">
          <a-tag :color="getTypeColor(ds.type)">{{ getTypeLabel(ds.type) }}</a-tag>
          <span class="item-url">{{ getDisplayUrl(ds) }}</span>
        </div>
      </div>
    </div>

    <!-- 编辑抽屉 -->
    <a-drawer v-model:open="drawerVisible" :title="editingId ? '编辑数据源' : '新建数据源'" width="600" :destroyOnClose="true">
      <a-form ref="formRef" :model="formData" :rules="formRules" layout="vertical">
        <a-form-item label="数据源名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入数据源名称" />
        </a-form-item>

        <a-form-item label="数据源类型" name="type">
          <a-select v-model:value="formData.type" @change="handleTypeChange">
            <a-select-option value="api">API 接口</a-select-option>
            <a-select-option value="static">静态数据</a-select-option>
            <a-select-option value="mock">Mock 数据</a-select-option>
          </a-select>
        </a-form-item>

        <!-- API 类型配置 -->
        <template v-if="formData.type === 'api'">
          <a-form-item label="API 地址" name="url">
            <a-input v-model:value="formData.config.url" placeholder="https://api.example.com/data" />
          </a-form-item>

          <a-form-item label="请求方法" name="method">
            <a-select v-model:value="formData.config.method">
              <a-select-option value="GET">GET</a-select-option>
              <a-select-option value="POST">POST</a-select-option>
              <a-select-option value="PUT">PUT</a-select-option>
              <a-select-option value="DELETE">DELETE</a-select-option>
            </a-select>
          </a-form-item>

          <a-form-item label="请求头">
            <a-textarea v-model:value="headersText" placeholder='{"Content-Type": "application/json"}' :rows="3" />
          </a-form-item>

          <a-form-item label="请求参数">
            <a-textarea v-model:value="paramsText" placeholder='{"page": 1, "size": 10}' :rows="3" />
          </a-form-item>
        </template>

        <!-- 静态数据配置 -->
        <template v-if="formData.type === 'static'">
          <a-form-item label="静态数据" name="data">
            <a-textarea v-model:value="staticDataText" placeholder='[{"id": 1, "name": "示例"}]' :rows="10" />
          </a-form-item>
        </template>

        <!-- Mock 数据配置 -->
        <template v-if="formData.type === 'mock'">
          <a-form-item label="Mock 模板" name="mockTemplate">
            <a-textarea v-model:value="formData.config.mockTemplate" placeholder='{"id": "@id", "name": "@name"}' :rows="10" />
          </a-form-item>
        </template>

        <a-form-item label="自动加载">
          <a-switch v-model:checked="formData.autoLoad" />
          <span style="margin-left: 8px; color: #999">页面加载时自动获取数据</span>
        </a-form-item>
      </a-form>

      <template #footer>
        <a-space>
          <a-button @click="drawerVisible = false">取消</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitting"> 保存 </a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, ThunderboltOutlined, ApiOutlined, DatabaseOutlined, ExperimentOutlined } from '@ant-design/icons-vue'

interface DataSourceConfig {
  id: string
  name: string
  type: 'api' | 'static' | 'mock'
  config: {
    url?: string
    method?: string
    headers?: Record<string, string>
    params?: Record<string, any>
    data?: any
    mockTemplate?: string
  }
  metadata?: any
  autoLoad?: boolean
}

interface Props {
  dataSources?: Record<string, DataSourceConfig>
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => ({}),
})

const emit = defineEmits<{
  'update:dataSources': [value: Record<string, DataSourceConfig>]
  test: [config: DataSourceConfig]
}>()

const searchKeyword = ref('')
const selectedId = ref<string>()
const drawerVisible = ref(false)
const editingId = ref<string>()
const testingId = ref<string>()
const submitting = ref(false)
const formRef = ref()

const formData = ref<DataSourceConfig>({
  id: '',
  name: '',
  type: 'api',
  config: {
    method: 'GET',
  },
  autoLoad: false,
})

const headersText = ref('')
const paramsText = ref('')
const staticDataText = ref('')

const formRules = {
  name: [{ required: true, message: '请输入数据源名称' }],
  type: [{ required: true, message: '请选择数据源类型' }],
  url: [{ required: true, message: '请输入API地址' }],
  method: [{ required: true, message: '请选择请求方法' }],
  data: [{ required: true, message: '请输入静态数据' }],
  mockTemplate: [{ required: true, message: '请输入Mock模板' }],
}

const dataSourcesList = computed(() => Object.values(props.dataSources))

const filteredDataSources = computed(() => {
  if (!searchKeyword.value) return dataSourcesList.value
  return dataSourcesList.value.filter(ds => ds.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

function getTypeIcon(type: string) {
  const icons = {
    api: ApiOutlined,
    static: DatabaseOutlined,
    mock: ExperimentOutlined,
  }
  return icons[type as keyof typeof icons] || ApiOutlined
}

function getTypeColor(type: string) {
  const colors = {
    api: 'blue',
    static: 'green',
    mock: 'orange',
  }
  return colors[type as keyof typeof colors] || 'default'
}

function getTypeLabel(type: string) {
  const labels = {
    api: 'API',
    static: '静态',
    mock: 'Mock',
  }
  return labels[type as keyof typeof labels] || type
}

function getDisplayUrl(ds: DataSourceConfig) {
  if (ds.type === 'api') return ds.config.url || ''
  if (ds.type === 'static') return '静态数据'
  if (ds.type === 'mock') return 'Mock 数据'
  return ''
}

function handleAdd() {
  editingId.value = undefined
  formData.value = {
    id: `ds_${Date.now()}`,
    name: '',
    type: 'api',
    config: {
      method: 'GET',
    },
    autoLoad: false,
  }
  headersText.value = ''
  paramsText.value = ''
  staticDataText.value = ''
  drawerVisible.value = true
}

function handleSelect(id: string) {
  selectedId.value = id
  const ds = props.dataSources[id]
  if (ds) {
    editingId.value = id
    formData.value = JSON.parse(JSON.stringify(ds))

    // 转换为文本
    if (ds.config.headers) {
      headersText.value = JSON.stringify(ds.config.headers, null, 2)
    }
    if (ds.config.params) {
      paramsText.value = JSON.stringify(ds.config.params, null, 2)
    }
    if (ds.config.data) {
      staticDataText.value = JSON.stringify(ds.config.data, null, 2)
    }

    drawerVisible.value = true
  }
}

function handleTypeChange() {
  formData.value.config = {
    method: 'GET',
  }
  headersText.value = ''
  paramsText.value = ''
  staticDataText.value = ''
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    // 解析 JSON 文本
    try {
      if (headersText.value) {
        formData.value.config.headers = JSON.parse(headersText.value)
      }
      if (paramsText.value) {
        formData.value.config.params = JSON.parse(paramsText.value)
      }
      if (staticDataText.value) {
        formData.value.config.data = JSON.parse(staticDataText.value)
      }
    } catch (error) {
      message.error('JSON 格式错误，请检查')
      return
    }

    const newDataSources = { ...props.dataSources }
    newDataSources[formData.value.id] = { ...formData.value }

    emit('update:dataSources', newDataSources)
    message.success('保存成功')
    drawerVisible.value = false
  } catch (error) {
    // 验证失败
  } finally {
    submitting.value = false
  }
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个数据源吗？',
    onOk: () => {
      const newDataSources = { ...props.dataSources }
      delete newDataSources[id]
      emit('update:dataSources', newDataSources)
      message.success('删除成功')
      if (selectedId.value === id) {
        selectedId.value = undefined
      }
    },
  })
}

async function handleTest(ds: DataSourceConfig) {
  testingId.value = ds.id
  try {
    emit('test', ds)
  } finally {
    setTimeout(() => {
      testingId.value = undefined
    }, 1000)
  }
}
</script>

<style scoped>
.data-source-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-toolbar {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.data-source-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.data-source-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.data-source-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.data-source-item.active {
  border-color: #1890ff;
  background: #e6f7ff;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.item-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 500;
}

.type-icon {
  font-size: 16px;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.item-url {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
