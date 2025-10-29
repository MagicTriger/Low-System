<template>
  <div class="close-overlay-action-config">
    <a-form :model="formData" layout="vertical">
      <a-form-item label="关闭方式">
        <a-radio-group v-model:value="closeMode">
          <a-radio value="current">关闭当前浮层</a-radio>
          <a-radio value="specific">关闭指定浮层</a-radio>
        </a-radio-group>
      </a-form-item>

      <a-form-item v-if="closeMode === 'specific'" label="选择浮层" required>
        <a-select
          v-model:value="formData.overlayId"
          placeholder="请选择要关闭的浮层"
          :loading="loadingOverlays"
          show-search
          :filter-option="filterOption"
        >
          <a-select-option v-for="overlay in overlays" :key="overlay.id" :value="overlay.id">
            {{ overlay.name || overlay.title || overlay.id }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="返回数据">
        <a-textarea v-model:value="returnDataText" placeholder='{"result": "success"}' :rows="6" @blur="handleReturnDataBlur" />
        <template #extra>
          <span class="form-hint">JSON 格式的返回数据，将传递给父页面</span>
        </template>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { message } from 'ant-design-vue'
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
  overlayId: undefined as string | undefined,
  returnData: {},
})

const closeMode = ref<'current' | 'specific'>('current')
const returnDataText = ref('')
const overlays = ref<OverlayConfig[]>([])
const loadingOverlays = ref(false)

// 初始化
onMounted(() => {
  loadOverlays()

  if (props.modelValue) {
    formData.value = { ...props.modelValue }
    closeMode.value = formData.value.overlayId ? 'specific' : 'current'
    if (formData.value.returnData) {
      returnDataText.value = JSON.stringify(formData.value.returnData, null, 2)
    }
  }
})

// 监听关闭模式变化
watch(closeMode, newMode => {
  if (newMode === 'current') {
    formData.value.overlayId = undefined
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

// 处理返回数据文本失焦
function handleReturnDataBlur() {
  if (!returnDataText.value.trim()) {
    formData.value.returnData = {}
    return
  }

  try {
    formData.value.returnData = JSON.parse(returnDataText.value)
  } catch (error) {
    message.error('JSON 格式错误')
  }
}

// 过滤选项
function filterOption(input: string, option: any) {
  return option.children[0].children.toLowerCase().includes(input.toLowerCase())
}
</script>

<style scoped>
.close-overlay-action-config {
  padding: 16px 0;
}

.form-hint {
  font-size: 12px;
  color: #999;
}
</style>
