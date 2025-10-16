<template>
  <div class="data-flow-panel">
    <!-- 工具栏 -->
    <div class="panel-toolbar">
      <a-button type="primary" size="small" @click="handleAdd">
        <template #icon>
          <PlusOutlined />
        </template>
        新建数据流
      </a-button>
      <a-input-search v-model:value="searchKeyword" placeholder="搜索数据流" size="small" style="width: 180px" allow-clear />
    </div>

    <!-- 数据流列表 -->
    <div class="data-flow-list">
      <a-empty v-if="filteredDataFlows.length === 0" description="暂无数据流" :image="Empty.PRESENTED_IMAGE_SIMPLE" />

      <div
        v-for="flow in filteredDataFlows"
        :key="flow.id"
        class="flow-item"
        :class="{ active: selectedId === flow.id }"
        @click="handleSelect(flow.id)"
      >
        <div class="item-header">
          <div class="item-title">
            <BranchesOutlined class="type-icon" />
            <span>{{ flow.name }}</span>
          </div>
          <a-space size="small">
            <a-tag :color="flow.enabled ? 'success' : 'default'" size="small">
              {{ flow.enabled ? '启用' : '禁用' }}
            </a-tag>
            <a-button type="text" size="small" danger @click.stop="handleDelete(flow.id)">
              <template #icon>
                <DeleteOutlined />
              </template>
            </a-button>
          </a-space>
        </div>
        <div class="item-meta">
          <span class="meta-label">数据源:</span>
          <span class="meta-value">{{ getSourceName(flow.sourceId) }}</span>
          <span class="meta-label">转换:</span>
          <span class="meta-value">{{ flow.transforms.length }} 步</span>
        </div>
      </div>
    </div>

    <!-- 编辑抽屉 -->
    <a-drawer v-model:open="drawerVisible" :title="editingId ? '编辑数据流' : '新建数据流'" width="600" :destroyOnClose="true">
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item label="数据流名称" name="name" :rules="[{ required: true, message: '请输入数据流名称' }]">
          <a-input v-model:value="formData.name" placeholder="请输入数据流名称" />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" placeholder="请输入描述" :rows="2" />
        </a-form-item>

        <a-form-item label="数据源" name="sourceId" :rules="[{ required: true, message: '请选择数据源' }]">
          <a-select v-model:value="formData.sourceId" placeholder="请选择数据源">
            <a-select-option v-for="ds in dataSources" :key="ds.id" :value="ds.id">
              {{ ds.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="启用">
          <a-switch v-model:checked="formData.enabled" />
        </a-form-item>
      </a-form>

      <template #footer>
        <a-space>
          <a-button @click="drawerVisible = false">取消</a-button>
          <a-button type="primary" @click="handleSubmit" :loading="submitting">保存</a-button>
        </a-space>
      </template>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { message, Modal, Empty } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined, BranchesOutlined } from '@ant-design/icons-vue'
import type { DataFlow } from '@/types'

interface Props {
  dataFlows?: Record<string, DataFlow>
  dataSources?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  dataFlows: () => ({}),
  dataSources: () => [],
})

const emit = defineEmits<{
  'update:dataFlows': [value: Record<string, DataFlow>]
}>()

const searchKeyword = ref('')
const selectedId = ref<string>()
const drawerVisible = ref(false)
const editingId = ref<string>()
const submitting = ref(false)
const formRef = ref()

const formData = ref<Partial<DataFlow>>({
  name: '',
  description: '',
  sourceId: '',
  enabled: true,
  transforms: [],
})

const dataFlowsList = computed(() => Object.values(props.dataFlows))

const filteredDataFlows = computed(() => {
  if (!searchKeyword.value) return dataFlowsList.value
  return dataFlowsList.value.filter(flow => flow.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

function getSourceName(sourceId: string): string {
  const source = props.dataSources.find(ds => ds.id === sourceId)
  return source?.name || sourceId
}

function handleAdd() {
  editingId.value = undefined
  formData.value = {
    name: '',
    description: '',
    sourceId: '',
    enabled: true,
    transforms: [],
  }
  drawerVisible.value = true
}

function handleSelect(id: string) {
  selectedId.value = id
  const flow = props.dataFlows[id]
  if (flow) {
    editingId.value = id
    formData.value = JSON.parse(JSON.stringify(flow))
    drawerVisible.value = true
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    const newDataFlows = { ...props.dataFlows }
    const now = Date.now()

    if (editingId.value) {
      newDataFlows[editingId.value] = {
        ...newDataFlows[editingId.value],
        ...formData.value,
        updatedAt: now,
      } as DataFlow
    } else {
      const id = `flow_${now}_${Math.random().toString(36).substr(2, 9)}`
      newDataFlows[id] = {
        id,
        ...formData.value,
        transforms: [],
        enabled: formData.value.enabled !== undefined ? formData.value.enabled : true,
        createdAt: now,
        updatedAt: now,
      } as DataFlow
    }

    emit('update:dataFlows', newDataFlows)
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
    content: '确定要删除这个数据流吗？',
    onOk: () => {
      const newDataFlows = { ...props.dataFlows }
      delete newDataFlows[id]
      emit('update:dataFlows', newDataFlows)
      message.success('删除成功')
      if (selectedId.value === id) {
        selectedId.value = undefined
      }
    },
  })
}
</script>

<style scoped>
.data-flow-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.panel-toolbar {
  padding: 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
}

.data-flow-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.flow-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.flow-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.flow-item.active {
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
  color: #1890ff;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #999;
}

.meta-label {
  color: #999;
}

.meta-value {
  color: #666;
  font-weight: 500;
}
</style>
