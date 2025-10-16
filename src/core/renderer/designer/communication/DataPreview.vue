<template>
  <div class="data-preview">
    <div class="preview-header">
      <h3>预览</h3>
    </div>

    <div class="preview-content">
      <template v-if="activeTab === 'datasource'">
        <div v-if="dataSourcesCount > 0" class="preview-section">
          <h4>数据源统计</h4>
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="总数">{{ dataSourcesCount }}</a-descriptions-item>
            <a-descriptions-item label="API 类型">{{ apiCount }}</a-descriptions-item>
            <a-descriptions-item label="静态数据">{{ staticCount }}</a-descriptions-item>
            <a-descriptions-item label="Mock 数据">{{ mockCount }}</a-descriptions-item>
          </a-descriptions>
        </div>
        <a-empty v-else description="暂无数据源" />
      </template>

      <template v-else-if="activeTab === 'dataflow'">
        <div v-if="dataFlowsCount > 0" class="preview-section">
          <h4>数据流统计</h4>
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="总数">{{ dataFlowsCount }}</a-descriptions-item>
          </a-descriptions>
        </div>
        <a-empty v-else description="暂无数据流" />
      </template>

      <template v-else-if="activeTab === 'operation'">
        <div v-if="operationsCount > 0" class="preview-section">
          <h4>数据操作统计</h4>
          <a-descriptions :column="1" size="small">
            <a-descriptions-item label="总数">{{ operationsCount }}</a-descriptions-item>
          </a-descriptions>
        </div>
        <a-empty v-else description="暂无数据操作" />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  activeTab: string
  dataSources?: Record<string, any>
  dataFlows?: Record<string, any>
  operations?: Record<string, any>
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => ({}),
  dataFlows: () => ({}),
  operations: () => ({}),
})

const dataSourcesCount = computed(() => Object.keys(props.dataSources).length)
const dataFlowsCount = computed(() => Object.keys(props.dataFlows).length)
const operationsCount = computed(() => Object.keys(props.operations).length)

const apiCount = computed(() => {
  return Object.values(props.dataSources).filter(ds => ds.type === 'api').length
})

const staticCount = computed(() => {
  return Object.values(props.dataSources).filter(ds => ds.type === 'static').length
})

const mockCount = computed(() => {
  return Object.values(props.dataSources).filter(ds => ds.type === 'mock').length
})
</script>

<style scoped>
.data-preview {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.preview-header {
  padding: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.preview-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.preview-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
}

.preview-section {
  margin-bottom: 24px;
}

.preview-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
}
</style>
