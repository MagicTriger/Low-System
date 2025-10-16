<template>
  <div class="icon-picker-field">
    <div class="icon-preview" @click="showPicker">
      <component v-if="selectedIconComponent" :is="selectedIconComponent" class="icon-display" />
      <span v-else class="icon-placeholder">选择图标</span>
      <span class="icon-name-text">{{ displayName }}</span>
      <CloseCircleOutlined v-if="modelValue" class="icon-clear" @click.stop="clearIcon" />
    </div>

    <a-modal v-model:open="pickerVisible" title="选择图标" width="800px" :footer="null" @cancel="pickerVisible = false">
      <IconPicker v-model="selectedIcon" :library-id="libraryId" @select="handleSelect" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { CloseCircleOutlined } from '@ant-design/icons-vue'
import IconPicker from '../../icons/IconPicker.vue'
import { getIconLibraryManager } from '../../icons/IconLibraryManager'
import type { IconDefinition } from '../../icons/types'

interface Props {
  modelValue?: string
  libraryId?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'change', value: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  libraryId: 'antd',
})

const emit = defineEmits<Emits>()

const iconManager = getIconLibraryManager()

// 状态
const pickerVisible = ref(false)
const selectedIcon = ref(props.modelValue)

// 计算属性
const selectedIconComponent = computed(() => {
  if (!selectedIcon.value) return null
  const icon = iconManager.getIcon(props.libraryId, selectedIcon.value)
  return icon?.component || null
})

const displayName = computed(() => {
  if (!selectedIcon.value) return ''
  return selectedIcon.value
    .replace(/Outlined$/, '')
    .replace(/Filled$/, '')
    .replace(/TwoTone$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
})

// 方法
function showPicker() {
  pickerVisible.value = true
}

function handleSelect(icon: IconDefinition) {
  selectedIcon.value = icon.name
  emit('update:modelValue', icon.name)
  emit('change', icon.name)
  pickerVisible.value = false
}

function clearIcon() {
  selectedIcon.value = ''
  emit('update:modelValue', '')
  emit('change', '')
}

// 监听modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    selectedIcon.value = newValue
  }
)
</script>

<style scoped lang="scss">
.icon-picker-field {
  .icon-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    border: 1px solid #d9d9d9;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.3s;
    position: relative;

    &:hover {
      border-color: #1890ff;

      .icon-clear {
        opacity: 1;
      }
    }

    .icon-display {
      font-size: 20px;
      color: #1890ff;
    }

    .icon-placeholder {
      font-size: 20px;
      color: #bfbfbf;
    }

    .icon-name-text {
      flex: 1;
      font-size: 14px;
      color: #666;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .icon-clear {
      font-size: 14px;
      color: #999;
      opacity: 0;
      transition: opacity 0.3s;

      &:hover {
        color: #ff4d4f;
      }
    }
  }
}
</style>
