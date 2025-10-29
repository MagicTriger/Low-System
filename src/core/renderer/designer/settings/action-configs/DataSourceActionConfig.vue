<template>
  <div class="data-source-action-config">
    <a-form :model="formData" layout="vertical">
      <a-form-item label="选择数据源" required>
        <a-select v-model:value="formData.dataSourceId" placeholder="请选择数据源" show-search :filter-option="filterOption">
          <a-select-option v-for="ds in dataSources" :key="ds.id" :value="ds.id">
            {{ ds.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="操作类型" required>
        <a-select v-model:value="formData.operationType" placeholder="请选择操作类型">
          <a-select-option value="create">
            <div class="operation-option">
              <span class="operation-label">CREATE</span>
              <span class="operation-desc">创建新数据</span>
            </div>
          </a-select-option>
          <a-select-option value="read">
            <div class="operation-option">
              <span class="operation-label">READ</span>
              <span class="operation-desc">读取单条数据</span>
            </div>
          </a-select-option>
          <a-select-option value="update">
            <div class="operation-option">
              <span class="operation-label">UPDATE</span>
              <span class="operation-desc">更新数据</span>
            </div>
          </a-select-option>
          <a-select-option value="delete">
            <div class="operation-option">
              <span class="operation-label">DELETE</span>
              <span class="operation-desc">删除数据</span>
            </div>
          </a-select-option>
          <a-select-option value="query">
            <div class="operation-option">
              <span class="operation-label">QUERY</span>
              <span class="operation-desc">查询数据列表</span>
            </div>
          </a-select-option>
        </a-select>
      </a-form-item>

      <!-- CREATE 操作参数 -->
      <template v-if="formData.operationType === 'create'">
        <a-divider>字段映射</a-divider>
        <a-alert
          message="提示"
          description="可以使用 ${context.xxx} 格式从数据上下文中获取值，例如：${context.userId}"
          type="info"
          show-icon
          closable
          style="margin-bottom: 12px"
        />
        <div class="field-mapping">
          <div v-for="(field, index) in createFields" :key="index" class="field-mapping-item">
            <a-input v-model:value="field.name" placeholder="字段名" style="width: 35%" />
            <a-select v-model:value="field.type" style="width: 25%">
              <a-select-option value="string">文本</a-select-option>
              <a-select-option value="number">数字</a-select-option>
              <a-select-option value="boolean">布尔</a-select-option>
              <a-select-option value="expression">表达式</a-select-option>
            </a-select>
            <a-input v-model:value="field.value" :placeholder="field.type === 'expression' ? '${context.xxx}' : '值'" style="width: 30%" />
            <a-button type="text" danger size="small" @click="removeCreateField(index)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </div>
          <a-button type="dashed" block @click="addCreateField">
            <template #icon><PlusOutlined /></template>
            添加字段
          </a-button>
        </div>
      </template>

      <!-- UPDATE 操作参数 -->
      <template v-if="formData.operationType === 'update'">
        <a-form-item label="更新条件">
          <a-textarea
            v-model:value="updateConditionText"
            placeholder='{"id": "${context.selectedId}"}'
            :rows="4"
            @blur="handleUpdateConditionBlur"
          />
          <template #extra>
            <span class="form-hint">JSON 格式的查询条件，支持 ${context.xxx} 表达式</span>
          </template>
        </a-form-item>

        <a-divider>更新字段</a-divider>
        <a-alert
          message="提示"
          description="字段值支持使用 ${context.xxx} 格式从数据上下文中获取值"
          type="info"
          show-icon
          closable
          style="margin-bottom: 12px"
        />
        <div class="field-mapping">
          <div v-for="(field, index) in updateFields" :key="index" class="field-mapping-item">
            <a-input v-model:value="field.name" placeholder="字段名" style="width: 40%" />
            <a-input v-model:value="field.value" placeholder="新值或 ${context.xxx}" style="width: 45%" />
            <a-button type="text" danger size="small" @click="removeUpdateField(index)">
              <template #icon><DeleteOutlined /></template>
            </a-button>
          </div>
          <a-button type="dashed" block @click="addUpdateField">
            <template #icon><PlusOutlined /></template>
            添加字段
          </a-button>
        </div>
      </template>

      <!-- DELETE 操作参数 -->
      <template v-if="formData.operationType === 'delete'">
        <a-form-item label="删除条件" required>
          <a-textarea
            v-model:value="deleteConditionText"
            placeholder='{"id": "${context.selectedId}"}'
            :rows="4"
            @blur="handleDeleteConditionBlur"
          />
          <template #extra>
            <span class="form-hint">JSON 格式的查询条件，支持 ${context.xxx} 表达式</span>
          </template>
        </a-form-item>
      </template>

      <!-- QUERY 操作参数 -->
      <template v-if="formData.operationType === 'query'">
        <a-form-item label="查询条件">
          <a-textarea
            v-model:value="queryConditionText"
            placeholder='{"status": "active", "userId": "${context.userId}"}'
            :rows="4"
            @blur="handleQueryConditionBlur"
          />
          <template #extra>
            <span class="form-hint">JSON 格式的查询条件，支持 ${context.xxx} 表达式</span>
          </template>
        </a-form-item>

        <a-form-item label="返回字段">
          <a-select v-model:value="queryFields" mode="tags" placeholder="输入字段名，回车添加" style="width: 100%" />
          <template #extra>
            <span class="form-hint">留空表示返回所有字段</span>
          </template>
        </a-form-item>

        <a-form-item label="排序">
          <a-input v-model:value="querySortField" placeholder="字段名" style="width: 60%; margin-right: 8px" />
          <a-select v-model:value="querySortOrder" style="width: 38%">
            <a-select-option value="asc">升序</a-select-option>
            <a-select-option value="desc">降序</a-select-option>
          </a-select>
        </a-form-item>
      </template>

      <!-- READ 操作参数 -->
      <template v-if="formData.operationType === 'read'">
        <a-form-item label="查询条件" required>
          <a-textarea
            v-model:value="readConditionText"
            placeholder='{"id": "${context.selectedId}"}'
            :rows="4"
            @blur="handleReadConditionBlur"
          />
          <template #extra>
            <span class="form-hint">JSON 格式的查询条件，支持 ${context.xxx} 表达式</span>
          </template>
        </a-form-item>
      </template>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'

interface Props {
  modelValue: any
  resourceCode?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const formData = ref({
  dataSourceId: '',
  operationType: '',
  operationParams: {} as Record<string, any>,
})

// CREATE 字段
const createFields = ref<Array<{ name: string; type: string; value: string }>>([])

// UPDATE 字段
const updateFields = ref<Array<{ name: string; value: string }>>([])
const updateConditionText = ref('')

// DELETE 条件
const deleteConditionText = ref('')

// QUERY 参数
const queryConditionText = ref('')
const queryFields = ref<string[]>([])
const querySortField = ref('')
const querySortOrder = ref('asc')

// READ 条件
const readConditionText = ref('')

// 模拟数据源列表（实际应该从 API 获取）
const dataSources = ref([
  { id: 'users-api', name: '用户数据源' },
  { id: 'products-api', name: '产品数据源' },
  { id: 'orders-api', name: '订单数据源' },
])

// 初始化
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...props.modelValue }

    // 恢复操作参数
    if (formData.value.operationParams) {
      const params = formData.value.operationParams

      if (formData.value.operationType === 'create' && params.fields) {
        createFields.value = params.fields
      }

      if (formData.value.operationType === 'update') {
        if (params.condition) {
          updateConditionText.value = JSON.stringify(params.condition, null, 2)
        }
        if (params.fields) {
          updateFields.value = params.fields
        }
      }

      if (formData.value.operationType === 'delete' && params.condition) {
        deleteConditionText.value = JSON.stringify(params.condition, null, 2)
      }

      if (formData.value.operationType === 'query') {
        if (params.condition) {
          queryConditionText.value = JSON.stringify(params.condition, null, 2)
        }
        if (params.fields) {
          queryFields.value = params.fields
        }
        if (params.sort) {
          querySortField.value = params.sort.field
          querySortOrder.value = params.sort.order
        }
      }

      if (formData.value.operationType === 'read' && params.condition) {
        readConditionText.value = JSON.stringify(params.condition, null, 2)
      }
    }
  }
})

// 监听操作类型变化
watch(
  () => formData.value.operationType,
  () => {
    formData.value.operationParams = {}
    updateOperationParams()
  }
)

// 监听表单变化
watch(
  formData,
  newValue => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)

// CREATE 字段操作
function addCreateField() {
  createFields.value.push({ name: '', type: 'string', value: '' })
}

function removeCreateField(index: number) {
  createFields.value.splice(index, 1)
  updateOperationParams()
}

watch(
  createFields,
  () => {
    updateOperationParams()
  },
  { deep: true }
)

// UPDATE 字段操作
function addUpdateField() {
  updateFields.value.push({ name: '', value: '' })
}

function removeUpdateField(index: number) {
  updateFields.value.splice(index, 1)
  updateOperationParams()
}

watch(
  updateFields,
  () => {
    updateOperationParams()
  },
  { deep: true }
)

// 处理条件文本失焦
function handleUpdateConditionBlur() {
  parseJsonText(updateConditionText.value)
}

function handleDeleteConditionBlur() {
  parseJsonText(deleteConditionText.value)
}

function handleQueryConditionBlur() {
  parseJsonText(queryConditionText.value)
}

function handleReadConditionBlur() {
  parseJsonText(readConditionText.value)
}

function parseJsonText(text: string) {
  if (!text.trim()) {
    return
  }

  try {
    JSON.parse(text)
    updateOperationParams()
  } catch (error) {
    message.error('JSON 格式错误')
  }
}

// 更新操作参数
function updateOperationParams() {
  const params: Record<string, any> = {}

  switch (formData.value.operationType) {
    case 'create':
      params.fields = createFields.value.filter(f => f.name)
      break

    case 'update':
      if (updateConditionText.value.trim()) {
        try {
          params.condition = JSON.parse(updateConditionText.value)
        } catch (e) {}
      }
      params.fields = updateFields.value.filter(f => f.name)
      break

    case 'delete':
      if (deleteConditionText.value.trim()) {
        try {
          params.condition = JSON.parse(deleteConditionText.value)
        } catch (e) {}
      }
      break

    case 'query':
      if (queryConditionText.value.trim()) {
        try {
          params.condition = JSON.parse(queryConditionText.value)
        } catch (e) {}
      }
      if (queryFields.value.length > 0) {
        params.fields = queryFields.value
      }
      if (querySortField.value) {
        params.sort = {
          field: querySortField.value,
          order: querySortOrder.value,
        }
      }
      break

    case 'read':
      if (readConditionText.value.trim()) {
        try {
          params.condition = JSON.parse(readConditionText.value)
        } catch (e) {}
      }
      break
  }

  formData.value.operationParams = params
}

// 过滤选项
function filterOption(input: string, option: any) {
  return option.children[0].children.toLowerCase().includes(input.toLowerCase())
}
</script>

<style scoped>
.data-source-action-config {
  padding: 16px 0;
}

.form-hint {
  font-size: 12px;
  color: #999;
}

.operation-option {
  display: flex;
  flex-direction: column;
}

.operation-label {
  font-weight: 500;
}

.operation-desc {
  font-size: 12px;
  color: #999;
}

.field-mapping {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
