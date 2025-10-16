<template>
  <div class="table-container">
    <!-- 设计器模式：显示子组件 -->
    <div v-if="hasChildren" class="table-designer-mode">
      <slot />
    </div>

    <!-- 运行时模式：显示 Ant Design Table -->
    <a-table
      v-else
      :columns="tableColumns"
      :data-source="tableData"
      :loading="loading"
      :pagination="paginationConfig"
      :size="tableSize"
      :bordered="bordered"
      :show-header="showHeader"
      :scroll="scrollConfig"
      :row-selection="rowSelectionConfig"
      :row-key="rowKey"
      @change="handleTableChange"
      @row-click="handleRowClick"
      @row-dblclick="handleRowDblClick"
    >
      <!-- 自定义列渲染 -->
      <template v-for="column in customColumns" :key="column.key" #[column.key]="{ record, index }">
        <component :is="column.component" :record="record" :index="index" :column="column" @action="handleColumnAction" />
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface TableColumn {
  key: string
  title: string
  dataIndex?: string
  width?: number
  fixed?: 'left' | 'right'
  align?: 'left' | 'center' | 'right'
  sorter?: boolean
  sortOrder?: 'ascend' | 'descend'
  filters?: Array<{ text: string; value: any }>
  filteredValue?: any[]
  customRender?: boolean
  component?: any
}

interface TableControl extends Control {
  props?: {
    columns?: TableColumn[]
    size?: 'large' | 'middle' | 'small'
    bordered?: boolean
    showHeader?: boolean
    rowKey?: string
    pagination?: boolean | object
    scroll?: { x?: number; y?: number }
    rowSelection?: boolean | object
    expandable?: boolean
    loading?: boolean
  }
}

const props = defineProps<{ control: TableControl }>()

const { control, value, eventHandler } = useControlMembers(props)

// 状态管理
const loading = ref(false)
const selectedRowKeys = ref<string[]>([])

// 检查是否有子组件（设计器模式）
const hasChildren = computed(() => {
  return control.value.children && control.value.children.length > 0
})

// 计算属性
const tableData = computed(() => {
  // 优先使用数据绑定的值
  if (Array.isArray(value.value)) {
    return value.value
  }
  return []
})

const tableColumns = computed(() => {
  const columns = control.value.props?.columns || []

  // 添加默认列配置
  return columns.map(col => ({
    ...col,
    key: col.key || col.dataIndex,
    dataIndex: col.dataIndex || col.key,
    title: col.title || col.key,
    width: col.width,
    fixed: col.fixed,
    align: col.align || 'left',
    sorter: col.sorter || false,
    filters: col.filters,
    customRender: col.customRender,
  }))
})

const customColumns = computed(() => {
  return tableColumns.value.filter(col => col.customRender && col.component)
})

const tableSize = computed(() => control.value.props?.size || 'middle')
const bordered = computed(() => control.value.props?.bordered || false)
const showHeader = computed(() => control.value.props?.showHeader !== false)
const rowKey = computed(() => control.value.props?.rowKey || 'id')

const paginationConfig = computed(() => {
  const pagination = control.value.props?.pagination

  if (pagination === false) {
    return false
  }

  if (typeof pagination === 'object') {
    return {
      current: 1,
      pageSize: 10,
      total: tableData.value.length,
      showSizeChanger: true,
      showQuickJumper: true,
      showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
      ...pagination,
    }
  }

  return {
    current: 1,
    pageSize: 10,
    total: tableData.value.length,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total: number, range: [number, number]) => `第 ${range[0]}-${range[1]} 条/共 ${total} 条`,
  }
})

const scrollConfig = computed(() => {
  const scroll = control.value.props?.scroll
  if (scroll) {
    return {
      x: scroll.x || undefined,
      y: scroll.y || undefined,
    }
  }
  return undefined
})

const rowSelectionConfig = computed(() => {
  const rowSelection = control.value.props?.rowSelection

  if (rowSelection === false) {
    return undefined
  }

  if (typeof rowSelection === 'object') {
    return {
      selectedRowKeys: selectedRowKeys.value,
      onChange: (keys: string[]) => {
        selectedRowKeys.value = keys
      },
      ...rowSelection,
    }
  }

  if (rowSelection === true) {
    return {
      selectedRowKeys: selectedRowKeys.value,
      onChange: (keys: string[]) => {
        selectedRowKeys.value = keys
      },
    }
  }

  return undefined
})

// 事件处理
const handleTableChange = async (pagination: any, filters: any, sorter: any, extra: any) => {
  await eventHandler?.('change', { pagination, filters, sorter, extra })
}

const handleRowClick = async (record: any, index: number, event: Event) => {
  await eventHandler?.('rowClick', record, index, event)
}

const handleRowDblClick = async (record: any, index: number, event: Event) => {
  await eventHandler?.('rowDblClick', record, index, event)
}

const handleColumnAction = async (action: string, record: any, column: TableColumn) => {
  await eventHandler?.('columnAction', action, record, column)
}

// 暴露方法
defineExpose({
  getData: () => tableData.value,
  setData: (data: any[]) => {
    value.value = data
  },
  getSelectedRows: () => {
    return tableData.value.filter((_, index) => selectedRowKeys.value.includes(String(index)))
  },
  getSelectedRowKeys: () => selectedRowKeys.value,
  setSelectedRowKeys: (keys: string[]) => {
    selectedRowKeys.value = keys
  },
  clearSelection: () => {
    selectedRowKeys.value = []
  },
  refresh: async () => {
    loading.value = true
    try {
      await eventHandler?.('refresh')
    } finally {
      loading.value = false
    }
  },
  exportData: () => {
    // 导出表格数据
    const data = tableData.value
    const columns = tableColumns.value

    return {
      data,
      columns: columns.map(col => ({
        key: col.key,
        title: col.title,
        dataIndex: col.dataIndex,
      })),
    }
  },
})
</script>

<style scoped>
/* 表格控件样式 */
:deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
}

:deep(.ant-table-tbody > tr:hover > td) {
  background: #f5f5f5;
}

:deep(.ant-table-row-selected) {
  background: #e6f7ff;
}

:deep(.ant-table-row-selected:hover > td) {
  background: #bae7ff;
}
</style>

<style scoped>
.table-container {
  width: 100%;
}

.table-designer-mode {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 2px;
  overflow: hidden;
  background-color: #ffffff;
}

/* 为子组件添加表格线样式 */
.table-designer-mode :deep(.table-header-flex-container),
.table-designer-mode :deep(.table-header-wrapper) {
  border-bottom: 2px solid #f0f0f0;
  background-color: #fafafa;
}

.table-designer-mode :deep(.table-row-flex-container),
.table-designer-mode :deep(.table-row-wrapper) {
  border-bottom: 1px solid #f0f0f0;
}

.table-designer-mode :deep(.table-row-flex-container:last-child),
.table-designer-mode :deep(.table-row-wrapper:last-child) {
  border-bottom: none;
}

/* 表格线样式 */
.table-designer-mode :deep(.table-header-flex-container) {
  border-left: none;
  border-right: none;
  border-top: none;
}

.table-designer-mode :deep(.table-row-flex-container) {
  border-left: none;
  border-right: none;
  border-top: none;
}
</style>
