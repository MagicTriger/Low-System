<template>
  <div class="field-renderer" :class="fieldClasses">
    <div v-if="isSwitchField" class="field-switch-row">
      <label v-if="config.label" class="field-label">
        {{ config.label }}
        <a-tooltip v-if="config.tooltip" :title="config.tooltip">
          <QuestionCircleOutlined class="field-tooltip-icon" />
        </a-tooltip>
      </label>

      <component
        :is="rendererComponent"
        v-if="rendererComponent"
        v-model="fieldValue"
        :config="config"
        :errors="fieldErrors"
        class="field-input"
        @validate="handleValidate"
      />
    </div>

    <template v-else>
      <label v-if="config.label" class="field-label">
        {{ config.label }}
        <a-tooltip v-if="config.tooltip" :title="config.tooltip">
          <QuestionCircleOutlined class="field-tooltip-icon" />
        </a-tooltip>
      </label>

      <div class="field-content">
        <!-- 字段渲染器 -->
        <component
          :is="rendererComponent"
          v-if="rendererComponent"
          v-model="fieldValue"
          :config="config"
          :errors="fieldErrors"
          class="field-input"
          @validate="handleValidate"
        />

        <!-- 可视化组件 -->
        <component
          :is="visualizerComponent"
          v-if="visualizerComponent && config.visualizer"
          v-model="fieldValue"
          :config="config"
          class="field-visualizer"
        />
      </div>
    </template>

    <!-- 错误提示 -->
    <div v-if="hasError" class="field-error">
      {{ fieldErrors[0] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import { getPropertyPanelService } from '@core/infrastructure/services'
import type { FieldConfig } from './types'

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

const service = getPropertyPanelService()

// 获取字段渲染器组件
const rendererComponent = computed(() => {
  console.log(`[FieldRenderer] Getting renderer for field "${props.config.key}" with type "${props.config.type}"`)
  const renderer = service.getFieldRenderer(props.config.type)
  if (!renderer) {
    console.error(`[FieldRenderer] No renderer found for type "${props.config.type}"`)
  }
  return renderer
})

// 获取可视化组件
const visualizerComponent = computed(() => {
  if (!props.config.visualizer) return null
  return service.getVisualizer(props.config.visualizer.type)
})

// 字段值双向绑定
const fieldValue = computed({
  get: () => props.modelValue ?? props.config.defaultValue,
  set: value => {
    console.log('[FieldRenderer] Field value updated:', props.config.key, '=', value)
    emit('update:modelValue', value)
    // 自动验证
    if (props.config.validation) {
      validateField(value)
    }
  },
})

// 错误状态
const fieldErrors = ref<string[]>(props.errors || [])
const hasError = computed(() => fieldErrors.value.length > 0)

// 判断是否是开关字段
const isSwitchField = computed(() => props.config.type === 'switch')

// 字段样式类
const fieldClasses = computed(() => ({
  'field-error-state': hasError.value,
  'field-disabled': props.config.disabled,
  'field-readonly': props.config.readonly,
  'field-switch': isSwitchField.value,
  [`field-span-${props.config.layout?.span || 1}`]: true,
}))

// 监听外部错误变化
watch(
  () => props.errors,
  newErrors => {
    if (newErrors) {
      fieldErrors.value = newErrors
    }
  },
  { immediate: true }
)

// 验证字段
function validateField(value: any) {
  if (!props.config.validation) {
    fieldErrors.value = []
    return
  }

  const errors = service.validateFieldValue(props.config, value)
  fieldErrors.value = errors
  emit('validate', errors)
}

// 处理验证事件
function handleValidate(errors: string[]) {
  fieldErrors.value = errors
  emit('validate', errors)
}
</script>

<style scoped>
.field-renderer {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.field-label {
  font-size: 14px;
  color: #262626;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 4px;
}

.field-tooltip-icon {
  font-size: 12px;
  color: #8c8c8c;
  cursor: help;
}

.field-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-input {
  flex: 1;
  min-width: 0;
}

.field-visualizer {
  width: 100%;
}

.field-error {
  font-size: 12px;
  color: #ff4d4f;
  line-height: 1.5;
}

.field-error-state .field-input :deep(input),
.field-error-state .field-input :deep(textarea),
.field-error-state .field-input :deep(.ant-select-selector) {
  border-color: #ff4d4f !important;
}

.field-error-state .field-input :deep(input:focus),
.field-error-state .field-input :deep(textarea:focus),
.field-error-state .field-input :deep(.ant-select-focused .ant-select-selector) {
  border-color: #ff4d4f !important;
  box-shadow: 0 0 0 2px rgba(255, 77, 79, 0.2) !important;
}

.field-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.field-readonly .field-input :deep(input),
.field-readonly .field-input :deep(textarea) {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

/* 开关字段特殊布局 */
.field-switch-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
}

.field-switch-row .field-label {
  margin-bottom: 0;
  flex: 1;
}

.field-switch-row .field-input {
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .field-label {
    font-size: 13px;
  }

  .field-error {
    font-size: 11px;
  }
}
</style>
