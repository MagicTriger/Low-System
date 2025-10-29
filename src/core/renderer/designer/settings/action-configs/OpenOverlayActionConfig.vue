<template>
  <div class="open-overlay-action-config">
    <a-form :model="formData" layout="vertical">
      <a-form-item label="选择浮层" required>
        <a-select
          v-model:value="formData.overlayId"
          placeholder="请选择要打开的浮层"
          :loading="loadingOverlays"
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="overlay in overlays" :key="overlay.id" :value="overlay.id">
            {{ overlay.name || overlay.title || overlay.id }}
          </a-select-option>
        </a-select>
        <template #extra>
          <span class="form-hint">选择要打开的浮层</span>
        </template>
      </a-form-item>

      <a-form-item label="浮层参数">
        <a-textarea v-model:value="paramsText" placeholder='{"key": "value"}' :rows="6" @blur="handleParamsBlur" />
        <template #extra>
          <span class="form-hint">JSON 格式的参数，将传递给浮层</span>
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
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons-vue'
import { overlayApi } from '@/core/api/overlay'
import type { OverlayConfig } from '@/core/api/overlay'

interface Props {
  modelValue: any
  resourceCode?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: any]
}>()

const formData = ref({
  overlayId: '',
  overlayParams: {},
})

const paramsText = ref('')
const paramMappings = ref<Array<{ key: string; value: string }>>([])
const overlays = ref<OverlayConfig[]>([])
const loadingOverlays = ref(false)

// 初始化
onMounted(() => {
  loadOverlays()

  if (props.modelValue) {
    formData.value = { ...props.modelValue }
    if (formData.value.overlayParams) {
      paramsText.value = JSON.stringify(formData.value.overlayParams, null, 2)
    }
  }
})

// 监听表单变化
watch(
  formData,
  newValue => {
    emit('update:modelValue', { ...newValue })
  },
  { deep: true }
)

// 加载浮层列表
async function loadOverlays() {
  if (!props.resourceCode) return

  loadingOverlays.value = true
  try {
    const response = await overlayApi.getList({ resourceCode: props.resourceCode })
    const listData = response.data as any
    overlays.value = listData.list || []
  } catch (error: any) {
    message.error('加载浮层列表失败: ' + error.message)
  } finally {
    loadingOverlays.value = false
  }
}

// 处理参数文本失焦
function handleParamsBlur() {
  if (!paramsText.value.trim()) {
    formData.value.overlayParams = {}
    return
  }

  try {
    formData.value.overlayParams = JSON.parse(paramsText.value)
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
  updateParamsFromMappings()
}

// 从映射更新参数
function updateParamsFromMappings() {
  const params: Record<string, any> = {}
  paramMappings.value.forEach(mapping => {
    if (mapping.key) {
      params[mapping.key] = mapping.value
    }
  })
  formData.value.overlayParams = params
  paramsText.value = JSON.stringify(params, null, 2)
}

// 过滤选项
function filterOption(input: string, option: any) {
  return option.children[0].children.toLowerCase().includes(input.toLowerCase())
}
</script>

<style scoped>
.open-overlay-action-config {
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
