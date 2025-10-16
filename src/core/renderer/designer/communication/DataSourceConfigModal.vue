<template>
  <a-modal
    v-model:open="visible"
    title="数据源配置"
    width="100%"
    :style="{ top: 0, paddingBottom: 0 }"
    :body-style="{ height: 'calc(100vh - 110px)', padding: 0 }"
    :footer="null"
    :destroyOnClose="true"
    wrapClassName="data-config-modal"
  >
    <div class="data-config-container">
      <!-- 左侧导航 -->
      <div class="data-config-sidebar">
        <a-tabs v-model:activeKey="activeTab" tab-position="left" class="config-tabs">
          <a-tab-pane key="datasource" tab="数据源">
            <DataSourcePanel v-model:dataSources="localDataSources" @test="handleTestDataSource" />
          </a-tab-pane>
          <a-tab-pane key="dataflow" tab="数据流">
            <DataFlowPanel v-model:dataFlows="localDataFlows" :dataSources="dataSourcesList" />
          </a-tab-pane>
          <a-tab-pane key="operation" tab="数据操作">
            <DataOperationPanel v-model:dataActions="localOperations" :dataSources="dataSourcesList" />
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 右侧预览 -->
      <div class="data-config-preview">
        <DataPreview :activeTab="activeTab" :dataSources="localDataSources" :dataFlows="localDataFlows" :operations="localOperations" />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="data-config-footer">
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleImport">
          <template #icon>
            <ImportOutlined />
          </template>
          导入配置
        </a-button>
        <a-button @click="handleExport">
          <template #icon>
            <ExportOutlined />
          </template>
          导出配置
        </a-button>
        <a-button type="primary" @click="handleSave" :loading="saving">
          <template #icon>
            <SaveOutlined />
          </template>
          保存
        </a-button>
      </a-space>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { message } from 'ant-design-vue'
import { ImportOutlined, ExportOutlined, SaveOutlined } from '@ant-design/icons-vue'
import DataSourcePanel from './DataSourcePanel.vue'
import DataFlowPanel from './DataFlowPanel.vue'
import DataOperationPanel from './DataOperationPanel.vue'
import DataPreview from './DataPreview.vue'

interface DataSourceConfig {
  id: string
  name: string
  type: 'api' | 'static' | 'mock'
  config: any
  metadata?: any
  autoLoad?: boolean
}

interface DataFlowConfig {
  id: string
  name: string
  description?: string
  sourceId: string
  transforms: any[]
  enabled: boolean
  createdAt: number
  updatedAt: number
}

interface DataOperationConfig {
  id: string
  name: string
  type: 'create' | 'read' | 'update' | 'delete'
  dataSourceId: string
  config: any
  hooks?: any
}

interface Props {
  modelValue: boolean
  dataSources?: Record<string, DataSourceConfig>
  dataFlows?: Record<string, DataFlowConfig>
  operations?: Record<string, DataOperationConfig>
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: false,
  dataSources: () => ({}),
  dataFlows: () => ({}),
  operations: () => ({}),
})

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:dataSources': [value: Record<string, DataSourceConfig>]
  'update:dataFlows': [value: Record<string, DataFlowConfig>]
  'update:operations': [value: Record<string, DataOperationConfig>]
  save: [
    data: {
      dataSources: Record<string, DataSourceConfig>
      dataFlows: Record<string, DataFlowConfig>
      operations: Record<string, DataOperationConfig>
    },
  ]
}>()

const visible = ref(props.modelValue)
const activeTab = ref('datasource')
const saving = ref(false)

// 本地副本
const localDataSources = ref<Record<string, DataSourceConfig>>({ ...props.dataSources })
const localDataFlows = ref<Record<string, DataFlowConfig>>({ ...props.dataFlows })
const localOperations = ref<Record<string, DataOperationConfig>>({ ...props.operations })

// 数据源列表（用于传递给子组件）
const dataSourcesList = computed(() => Object.values(localDataSources.value))

// 监听外部变化
watch(
  () => props.modelValue,
  val => {
    visible.value = val
    if (val) {
      // 打开时重新加载数据
      localDataSources.value = { ...props.dataSources }
      localDataFlows.value = { ...props.dataFlows }
      localOperations.value = { ...props.operations }
    }
  }
)

watch(visible, val => {
  emit('update:modelValue', val)
})

// 测试数据源
async function handleTestDataSource(config: DataSourceConfig) {
  try {
    message.loading({ content: '正在测试连接...', key: 'test' })

    // TODO: 实现实际的测试逻辑
    await new Promise(resolve => setTimeout(resolve, 1000))

    message.success({ content: '连接成功！', key: 'test' })
  } catch (error: any) {
    message.error({ content: `连接失败: ${error.message}`, key: 'test' })
  }
}

// 保存配置
async function handleSave() {
  try {
    saving.value = true

    // 验证配置
    // TODO: 添加验证逻辑

    // 触发保存事件
    emit('save', {
      dataSources: localDataSources.value,
      dataFlows: localDataFlows.value,
      operations: localOperations.value,
    })

    emit('update:dataSources', localDataSources.value)
    emit('update:dataFlows', localDataFlows.value)
    emit('update:operations', localOperations.value)

    message.success('配置已保存')
    visible.value = false
  } catch (error: any) {
    message.error(`保存失败: ${error.message}`)
  } finally {
    saving.value = false
  }
}

// 取消
function handleCancel() {
  visible.value = false
}

// 导入配置
function handleImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e: any) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const text = await file.text()
      const config = JSON.parse(text)

      if (config.dataSources) {
        localDataSources.value = { ...localDataSources.value, ...config.dataSources }
      }
      if (config.dataFlows) {
        localDataFlows.value = { ...localDataFlows.value, ...config.dataFlows }
      }
      if (config.operations) {
        localOperations.value = { ...localOperations.value, ...config.operations }
      }

      message.success('配置导入成功')
    } catch (error: any) {
      message.error(`导入失败: ${error.message}`)
    }
  }
  input.click()
}

// 导出配置
function handleExport() {
  try {
    const config = {
      dataSources: localDataSources.value,
      dataFlows: localDataFlows.value,
      operations: localOperations.value,
    }

    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `data-config-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    message.success('配置导出成功')
  } catch (error: any) {
    message.error(`导出失败: ${error.message}`)
  }
}
</script>

<style scoped>
.data-config-container {
  display: flex;
  height: 100%;
  background: #f5f5f5;
}

.data-config-sidebar {
  flex: 1;
  min-width: 600px;
  background: white;
  border-right: 1px solid #e8e8e8;
}

.config-tabs {
  height: 100%;
}

.config-tabs :deep(.ant-tabs-content) {
  height: 100%;
}

.config-tabs :deep(.ant-tabs-tabpane) {
  height: 100%;
  overflow-y: auto;
}

.data-config-preview {
  flex: 0 0 400px;
  background: white;
  overflow-y: auto;
}

.data-config-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e8e8e8;
  display: flex;
  justify-content: flex-end;
}
</style>

<style>
.data-config-modal .ant-modal {
  max-width: 100%;
  top: 0;
  padding-bottom: 0;
  margin: 0;
}

.data-config-modal .ant-modal-content {
  height: 100vh;
  border-radius: 0;
}

.data-config-modal .ant-modal-body {
  height: calc(100vh - 110px);
  padding: 0;
}
</style>
