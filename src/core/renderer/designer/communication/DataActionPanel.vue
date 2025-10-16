<template>
  <div class="data-action-panel">
    <!-- 工具栏 -->
    <div class="panel-toolbar">
      <a-button type="primary" size="small" @click="handleAdd">
        <template #icon>
          <PlusOutlined />
        </template>
        新建操作
      </a-button>
      <a-input-search v-model:value="searchKeyword" placeholder="搜索操作" size="small" style="width: 180px" allow-clear />
    </div>

    <!-- 操作列表 -->
    <div class="action-list">
      <a-empty v-if="filteredActions.length === 0" description="暂无数据操作" :image="Empty.PRESENTED_IMAGE_SIMPLE" />

      <div
        v-for="action in filteredActions"
        :key="action.id"
        class="action-item"
        :class="{ active: selectedId === action.id }"
        @click="handleSelect(action.id)"
      >
        <div class="item-header">
          <div class="item-title">
            <component :is="getActionIcon(action.type)" class="type-icon" />
            <span>{{ action.name }}</span>
          </div>
          <a-space size="small">
            <a-tag :color="getActionColor(action.type)" size="small">
              {{ getActionLabel(action.type) }}
            </a-tag>
            <a-button type="text" size="small" danger @click.stop="handleDelete(action.id)">
              <template #icon>
                <DeleteOutlined />
              </template>
            </a-button>
          </a-space>
        </div>
        <div class="item-meta">
          <span class="meta-label">数据源:</span>
          <span class="meta-value">{{ getSourceName(action.sourceId) }}</span>
        </div>
      </div>
    </div>

    <!-- 编辑抽屉 -->
    <a-drawer v-model:open="drawerVisible" :title="editingId ? '编辑数据操作' : '新建数据操作'" width="600" :destroyOnClose="true">
      <a-form ref="formRef" :model="formData" layout="vertical">
        <a-form-item label="操作名称" name="name" :rules="[{ required: true, message: '请输入操作名称' }]">
          <a-input v-model:value="formData.name" placeholder="请输入操作名称" />
        </a-form-item>

        <a-form-item label="描述">
          <a-textarea v-model:value="formData.description" placeholder="请输入描述" :rows="2" />
        </a-form-item>

        <a-form-item label="操作类型" name="type" :rules="[{ required: true, message: '请选择操作类型' }]">
          <a-select v-model:value="formData.type" placeholder="请选择操作类型">
            <a-select-option value="create">创建 (Create)</a-select-option>
            <a-select-option value="read">读取 (Read)</a-select-option>
            <a-select-option value="update">更新 (Update)</a-select-option>
            <a-select-option value="delete">删除 (Delete)</a-select-option>
            <a-select-option value="custom">自定义 (Custom)</a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="数据源" name="sourceId" :rules="[{ required: true, message: '请选择数据源' }]">
          <a-select v-model:value="formData.sourceId" placeholder="请选择数据源">
            <a-select-option v-for="ds in dataSources" :key="ds.id" :value="ds.id">
              {{ ds.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="操作参数">
          <a-textarea v-model:value="formData.params" placeholder='JSON格式的操作参数，例如: {"page": 1, "size": 10}' :rows="3" />
        </a-form-item>

        <a-form-item label="执行条件">
          <a-textarea v-model:value="formData.conditions" placeholder='JSON格式的执行条件，例如: {"status": "active"}' :rows="2" />
        </a-form-item>

        <a-form-item label="数据转换(执行前)">
          <a-textarea
            v-model:value="formData.transformBefore"
            placeholder="执行前的数据转换函数，例如: data => ({ ...data, timestamp: Date.now() })"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="数据转换(执行后)">
          <a-textarea
            v-model:value="formData.transformAfter"
            placeholder="执行后的数据转换函数，例如: response => response.data"
            :rows="3"
          />
        </a-form-item>

        <a-form-item label="成功提示">
          <a-input v-model:value="formData.successMessage" placeholder="操作成功时的提示信息" />
        </a-form-item>

        <a-form-item label="错误提示">
          <a-input v-model:value="formData.errorMessage" placeholder="操作失败时的提示信息" />
        </a-form-item>

        <a-form-item label="超时时间(毫秒)">
          <a-input-number
            v-model:value="formData.timeout"
            :min="1000"
            :max="60000"
            :step="1000"
            style="width: 100%"
            placeholder="默认5000毫秒"
          />
        </a-form-item>

        <a-form-item label="重试配置">
          <a-space style="width: 100%">
            <a-input-number v-model:value="formData.retryTimes" :min="0" :max="5" placeholder="重试次数" style="width: 120px" />
            <a-input-number
              v-model:value="formData.retryDelay"
              :min="100"
              :max="5000"
              :step="100"
              placeholder="重试延迟(ms)"
              style="width: 150px"
            />
          </a-space>
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
import { PlusOutlined, DeleteOutlined, PlusCircleOutlined, SearchOutlined, EditOutlined, MinusCircleOutlined } from '@ant-design/icons-vue'
import type { DataAction } from '@/types'

interface Props {
  dataActions?: Record<string, DataAction>
  dataSources?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  dataActions: () => ({}),
  dataSources: () => [],
})

const emit = defineEmits<{
  'update:dataActions': [value: Record<string, DataAction>]
}>()

const searchKeyword = ref('')
const selectedId = ref<string>()
const drawerVisible = ref(false)
const editingId = ref<string>()
const submitting = ref(false)
const formRef = ref()

const formData = ref<Partial<DataAction>>({
  name: '',
  description: '',
  type: 'read',
  sourceId: '',
  enabled: true,
  params: '',
  conditions: '',
  transformBefore: '',
  transformAfter: '',
  successMessage: '',
  errorMessage: '',
  timeout: 5000,
  retryTimes: 0,
  retryDelay: 1000,
})

const actionsList = computed(() => Object.values(props.dataActions))

const filteredActions = computed(() => {
  if (!searchKeyword.value) return actionsList.value
  return actionsList.value.filter(action => action.name.toLowerCase().includes(searchKeyword.value.toLowerCase()))
})

function getActionIcon(type: string) {
  const icons = {
    create: PlusCircleOutlined,
    read: SearchOutlined,
    update: EditOutlined,
    delete: MinusCircleOutlined,
  }
  return icons[type as keyof typeof icons] || SearchOutlined
}

function getActionColor(type: string) {
  const colors = {
    create: 'green',
    read: 'blue',
    update: 'orange',
    delete: 'red',
  }
  return colors[type as keyof typeof colors] || 'default'
}

function getActionLabel(type: string) {
  const labels = {
    create: '创建',
    read: '读取',
    update: '更新',
    delete: '删除',
  }
  return labels[type as keyof typeof labels] || type
}

function getSourceName(sourceId: string): string {
  const source = props.dataSources.find(ds => ds.id === sourceId)
  return source?.name || sourceId
}

function handleAdd() {
  editingId.value = undefined
  formData.value = {
    name: '',
    description: '',
    type: 'read',
    sourceId: '',
    enabled: true,
  }
  drawerVisible.value = true
}

function handleSelect(id: string) {
  selectedId.value = id
  const action = props.dataActions[id]
  if (action) {
    editingId.value = id
    formData.value = JSON.parse(JSON.stringify(action))
    drawerVisible.value = true
  }
}

async function handleSubmit() {
  try {
    await formRef.value.validate()
    submitting.value = true

    const newDataActions = { ...props.dataActions }
    const now = Date.now()

    if (editingId.value) {
      newDataActions[editingId.value] = {
        ...newDataActions[editingId.value],
        ...formData.value,
        updatedAt: now,
      } as DataAction
    } else {
      const id = `action_${now}_${Math.random().toString(36).substr(2, 9)}`
      const type = formData.value.type || 'read'
      newDataActions[id] = {
        id,
        ...formData.value,
        type,
        config: { type } as any,
        enabled: formData.value.enabled !== undefined ? formData.value.enabled : true,
        createdAt: now,
        updatedAt: now,
      } as DataAction
    }

    emit('update:dataActions', newDataActions)
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
    content: '确定要删除这个数据操作吗？',
    onOk: () => {
      const newDataActions = { ...props.dataActions }
      delete newDataActions[id]
      emit('update:dataActions', newDataActions)
      message.success('删除成功')
      if (selectedId.value === id) {
        selectedId.value = undefined
      }
    },
  })
}
</script>

<style scoped>
.data-action-panel {
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

.action-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.action-item {
  padding: 12px;
  margin-bottom: 8px;
  background: #fafafa;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.action-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.action-item.active {
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

.meta-label {
  color: #999;
}

.meta-value {
  color: #666;
  font-weight: 500;
}
</style>
