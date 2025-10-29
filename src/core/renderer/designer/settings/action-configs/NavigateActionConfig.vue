<template>
  <div class="navigate-action-config">
    <a-form :model="formData" layout="vertical">
      <a-form-item label="导航路径" required>
        <a-input v-model:value="formData.path" placeholder="/admin/users" />
        <template #extra>
          <span class="form-hint">输入要导航到的页面路径</span>
        </template>
      </a-form-item>

      <a-form-item label="查询参数">
        <a-textarea v-model:value="queryText" placeholder='{"id": "123", "tab": "detail"}' :rows="6" @blur="handleQueryBlur" />
        <template #extra>
          <span class="form-hint">JSON 格式的 URL 查询参数</span>
        </template>
      </a-form-item>

      <a-divider>参数映射</a-divider>

      <div class="param-mapping">
        <div v-for="(param, index) in paramMappings" :key="index" class="param-mapping-item">
          <a-input v-model:value="param.key" placeholder="参数名" style="width: 40%" />
          <span class="mapping-arrow">→</span>
          <a-input v-model:value="param.value" placeholder="值或表达式" style="width: 40%" />
          <a-button type="text" danger size="small" @click="removeParamMapping(index)">
            <template #icon><DeleteOutlined /></template>
          </a-button>
        </div>

        <a-button type="dashed" block @click="addParamMapping">
          <template #icon><PlusOutlined /></template>
          添加参数映射
        </a-button>
      </div>

      <a-form-item label="打开方式">
        <a-radio-group v-model:value="openMode">
          <a-radio value="push">当前窗口</a-radio>
          <a-radio value="replace">替换当前页</a-radio>
          <a-radio value="newTab">新标签页</a-radio>
        </a-radio-group>
      </a-form-item>
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
  path: '',
  query: {},
})

const queryText = ref('')
const paramMappings = ref<Array<{ key: string; value: string }>>([])
const openMode = ref('push')

// 初始化
onMounted(() => {
  if (props.modelValue) {
    formData.value = { ...props.modelValue }
    if (formData.value.query) {
      queryText.value = JSON.stringify(formData.value.query, null, 2)
    }
  }
})

// 监听表单变化
watch(
  formData,
  newValue => {
    emit('update:modelValue', { ...newValue, openMode: openMode.value })
  },
  { deep: true }
)

watch(openMode, newValue => {
  emit('update:modelValue', { ...formData.value, openMode: newValue })
})

// 处理查询参数文本失焦
function handleQueryBlur() {
  if (!queryText.value.trim()) {
    formData.value.query = {}
    return
  }

  try {
    formData.value.query = JSON.parse(queryText.value)
  } catch (error) {
    message.error('JSON 格式错误')
  }
}

// 添加参数映射
function addParamMapping() {
  paramMappings.value.push({ key: '', value: '' })
}

// 删除参数映射
function removeParamMapping(index: number) {
  paramMappings.value.splice(index, 1)
  updateQueryFromMappings()
}

// 从映射更新查询参数
function updateQueryFromMappings() {
  const query: Record<string, any> = {}
  paramMappings.value.forEach(mapping => {
    if (mapping.key) {
      query[mapping.key] = mapping.value
    }
  })
  formData.value.query = query
  queryText.value = JSON.stringify(query, null, 2)
}
</script>

<style scoped>
.navigate-action-config {
  padding: 16px 0;
}

.form-hint {
  font-size: 12px;
  color: #999;
}

.param-mapping {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.param-mapping-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mapping-arrow {
  color: #999;
  font-size: 16px;
}
</style>
