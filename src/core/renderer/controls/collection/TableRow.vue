<template>
  <!-- 有子组件时使用div容器支持Flex布局 -->
  <div v-if="hasChildren" class="table-row-flex-container" :class="{ 'table-row-selected': selected, 'table-row-hover': hoverable }">
    <slot></slot>
  </div>
  <!-- 无子组件时使用table标签 -->
  <table v-else class="table-row-wrapper">
    <tbody>
      <!-- 有数据配置时渲染数据 -->
      <tr v-if="columns.length > 0" class="table-row" :class="{ 'table-row-selected': selected, 'table-row-hover': hoverable }">
        <td v-for="(column, index) in columns" :key="index" :style="getColumnStyle(column)" class="table-row-cell">
          {{ getCellValue(column) }}
        </td>
      </tr>
      <!-- 空状态显示占位符 -->
      <tr v-else class="table-row">
        <td class="table-row-cell empty-placeholder">表格行容器 - 可通过数据绑定或拖拽组件填充</td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'

interface Column {
  title?: string
  dataIndex: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: any) => string
}

interface Props {
  control: {
    columns?: Column[]
    record?: Record<string, any>
    selected?: boolean
    hoverable?: boolean
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

const record = computed(() => {
  // 纯容器组件,不提供默认数据
  return props.control.record || {}
})
const selected = computed(() => props.control.selected || false)
const hoverable = computed(() => props.control.hoverable !== false)

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

const getCellValue = (column: Column) => {
  const value = record.value[column.dataIndex]

  if (column.render) {
    return column.render(value, record.value)
  }

  return value !== undefined && value !== null ? String(value) : '-'
}
</script>

<style scoped>
.table-row-wrapper {
  width: 100%;
  border-collapse: collapse;
  border: 1px solid #f0f0f0;
}

.table-row {
  transition: background-color 0.2s;
}

.table-row.table-row-hover:hover {
  background-color: #fafafa;
  cursor: pointer;
}

.table-row.table-row-selected {
  background-color: #e6f7ff;
}

.table-row-cell {
  padding: 12px 16px;
  font-size: 14px;
  color: #262626;
  border-bottom: 1px solid #f0f0f0;
}

.table-row-cell:not(:last-child) {
  border-right: 1px solid #f0f0f0;
}

.empty-placeholder {
  color: #999;
  font-style: italic;
  text-align: center;
  padding: 20px 16px;
}

.table-row-flex-container {
  display: flex;
  width: 100%;
  min-height: 40px;
  padding: 0;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
  transition: background-color 0.2s;
}

.table-row-flex-container.table-row-hover:hover {
  background-color: #fafafa;
  cursor: pointer;
}

.table-row-flex-container.table-row-selected {
  background-color: #e6f7ff;
}

/* 为子组件添加竖向分隔线 */
.table-row-flex-container :deep(> *) {
  padding: 12px 16px;
  border-right: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.table-row-flex-container :deep(> *:last-child) {
  border-right: none;
}
</style>
