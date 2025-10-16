<template>
  <div class="icon-field">
    <a-input
      :value="modelValue"
      :placeholder="config.placeholder || '选择图标'"
      :disabled="config.disabled"
      :readonly="true"
      @click="handlePickerClick"
    >
      <template #prefix>
        <component :is="iconComponent" v-if="iconComponent" class="icon-preview" />
        <span v-else class="icon-placeholder">?</span>
      </template>
      <template #suffix>
        <a-button v-if="modelValue" type="text" size="small" @click.stop="handleClear">
          <CloseCircleOutlined />
        </a-button>
      </template>
    </a-input>

    <a-modal v-model:open="pickerVisible" title="选择图标" width="800px" :footer="null" @cancel="pickerVisible = false">
      <IconPicker v-model="selectedIcon" @select="handleIconSelect" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CloseCircleOutlined } from '@ant-design/icons-vue'
import * as AntIcons from '@ant-design/icons-vue'
import IconPicker from '@core/renderer/icons/IconPicker.vue'
import type { FieldConfig } from '../types'

interface Props {
  config: FieldConfig
  modelValue: any
  errors?: string[]
}

interface Emits {
  (e: 'update:modelValue', value: any): void
  (e: 'validate', errors: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const pickerVisible = ref(false)
const selectedIcon = ref(props.modelValue || '')

const iconComponent = computed(() => {
  if (!props.modelValue) return null
  return (AntIcons as any)[props.modelValue] || null
})

// 监听 modelValue 变化
watch(
  () => props.modelValue,
  newValue => {
    selectedIcon.value = newValue || ''
  },
  { immediate: true }
)

function handlePickerClick() {
  if (props.config.disabled) return
  selectedIcon.value = props.modelValue || ''
  pickerVisible.value = true
}

function handleIconSelect(icon: any) {
  console.log('[IconField] Icon selected:', icon)
  const iconName = icon.name || icon
  console.log('[IconField] Emitting update:modelValue:', iconName)
  selectedIcon.value = iconName
  emit('update:modelValue', iconName)
  pickerVisible.value = false
}

function handleClear() {
  console.log('[IconField] Clearing icon')
  selectedIcon.value = ''
  emit('update:modelValue', '')
}
</script>

<style scoped>
.icon-field {
  width: 100%;
}

.icon-field :deep(.ant-input) {
  cursor: pointer;
}

.icon-preview {
  font-size: 16px;
  color: #1890ff;
}

.icon-placeholder {
  display: inline-block;
  width: 16px;
  height: 16px;
  line-height: 16px;
  text-align: center;
  color: #d9d9d9;
  font-size: 12px;
}
</style>
