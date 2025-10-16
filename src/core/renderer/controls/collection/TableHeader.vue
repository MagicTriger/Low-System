<template>
  <!-- 有子组件时使用div容器支持Flex布局 -->
  <div v-if="hasChildren" class="table-header-flex-container">
    <slot></slot>
  </div>
  <!-- 无子组件时使用table标签 -->
  <table v-else class="table-header-wrapper">
    <thead class="table-header">
      <!-- 有数据配置时渲染数据 -->
      <tr v-if="columns.length > 0">
        <th v-for="(column, index) in columns" :key="index" :style="getColumnStyle(column)" class="table-header-cell">
          {{ column.title || column.dataIndex }}
        </th>
      </tr>
      <!-- 空状态显示占位符 -->
      <tr v-else>
        <th class="table-header-cell empty-placeholder">表头容器 - 可通过数据绑定或拖拽组件填充</th>
      </tr>
    </thead>
  </table>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Column {
  title?: string
  dataIndex: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
}

interface Props {
  control: {
    columns?: Column[]
    children?: any[]
    [key: string]: any
  }
}

const props = defineProps<Props>()
const slots = useSlots()

// 检查是否有子组件
const hasChildren = computed(() => {
  return (props.control.children && props.control.children.length > 0) || slots.default
})

const columns = computed(() => {
  // 纯容器组件,不提供默认数据
  return props.control.columns || []
})

const getColumnStyle = (column: Column) => {
  const style: Record<string, any> = {}

  if (column.width) {
    style.width = typeof column.width === 'number' ? `${column.width}px` : column.width
  }

  if (column.align) {
    style.textAlign = column.align
  }

  return style
}
</script>

<style scoped>
.table-header-wrapper {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #f0f0f0;
}

.table-header {
  background-color: #fafafa;
}

.table-header-cell {
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
  text-align: left;
}

.table-header-cell:not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

.empty-placeholder {
  color: #999;
  font-style: italic;
  text-align: center;
}

.table-header-flex-container {
  display: flex;
  width: 100%;
  min-height: 40px;
  padding: 0;
  background-color: #fafafa;
  border-bottom: 2px solid #e8e8e8;
  box-sizing: border-box;
}

/* 为子组件添加竖向分隔线 */
.table-header-flex-container :deep(> *) {
  padding: 12px 16px;
  border-right: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.table-header-flex-container :deep(> *:last-child) {
  border-right: none;
}
</style>
