<template>
  <div class="panel-group" :class="{ collapsed: !expanded }">
    <div class="panel-header" @click="toggleExpanded">
      <component :is="iconComponent" v-if="iconComponent" class="panel-icon" />
      <span class="panel-title">{{ config.title }}</span>
      <DownOutlined class="collapse-icon" :class="{ rotated: expanded }" />
    </div>

    <div v-show="expanded" class="panel-body">
      <div class="fields-grid">
        <div v-for="field in visibleFields" :key="field.key" :class="getFieldClass(field)">
          <FieldRenderer
            :config="field"
            :model-value="values[field.key]"
            @update:model-value="handleFieldUpdate(field.key, $event)"
            @validate="handleFieldValidate(field.key, $event)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DownOutlined } from '@ant-design/icons-vue'
import * as AntIcons from '@ant-design/icons-vue'
import { getPropertyPanelService } from '@core/infrastructure/services'
import FieldRenderer from '@core/infrastructure/fields/FieldRenderer.vue'
import type { PanelConfig, FieldConfig } from '@core/infrastructure/panels/types'

interface Props {
  config: PanelConfig
  values: Record<string, any>
}

interface Emits {
  (e: 'update', key: string, value: any): void
  (e: 'validate', key: string, errors: string[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const service = getPropertyPanelService()

// 面板展开状态
const expanded = ref(props.config.defaultExpanded ?? true)

// 面板图标组件
const iconComponent = computed(() => {
  if (!props.config.icon) return null
  return (AntIcons as any)[props.config.icon] || null
})

// 可见字段(根据依赖规则过滤)
const visibleFields = computed(() => {
  return props.config.fields.filter(field => {
    if (!field.dependency) return true

    const dependencyFieldValue = props.values[field.dependency.field]
    return service.checkDependency(field.dependency, dependencyFieldValue)
  })
})

// 切换展开/折叠
function toggleExpanded() {
  if (props.config.collapsible !== false) {
    expanded.value = !expanded.value
  }
}

// 获取字段样式类
function getFieldClass(field: FieldConfig) {
  const span = field.layout?.span || 1
  return {
    'field-wrapper': true,
    'span-1': span === 1,
    'span-2': span === 2,
  }
}

// 处理字段值更新
function handleFieldUpdate(key: string, value: any) {
  console.log('[PanelGroup] Field updated:', key, '=', value)
  emit('update', key, value)
}

// 处理字段验证
function handleFieldValidate(key: string, errors: string[]) {
  emit('validate', key, errors)
}
</script>

<style scoped>
.panel-group {
  margin-bottom: 16px;
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background: #fff;
  overflow: hidden;
  transition: all 0.3s;
}

.panel-group:hover {
  border-color: #d9d9d9;
}

.panel-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #e8e8e8;
  cursor: pointer;
  user-select: none;
  transition: all 0.3s;
}

.panel-header:hover {
  background: #f0f0f0;
}

.panel-group.collapsed .panel-header {
  border-bottom: none;
}

.panel-icon {
  font-size: 16px;
  color: #1890ff;
}

.panel-title {
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #262626;
}

.collapse-icon {
  font-size: 12px;
  color: #8c8c8c;
  transition: transform 0.3s;
}

.collapse-icon.rotated {
  transform: rotate(180deg);
}

.panel-body {
  padding: 16px;
}

.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 12px;
}

.field-wrapper {
  min-width: 0;
}

.field-wrapper.span-1 {
  grid-column: span 1;
}

.field-wrapper.span-2 {
  grid-column: span 2;
}

/* 响应式 */
@media (max-width: 768px) {
  .fields-grid {
    grid-template-columns: 1fr;
  }

  .field-wrapper.span-1,
  .field-wrapper.span-2 {
    grid-column: span 1;
  }

  .panel-header {
    padding: 10px 12px;
  }

  .panel-body {
    padding: 12px;
  }
}
</style>
