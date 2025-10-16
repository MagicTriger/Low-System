<template>
  <div class="resource-tree">
    <a-spin :spinning="loading" tip="加载中...">
      <a-tree
        v-if="treeData.length > 0"
        :tree-data="treeData"
        :expanded-keys="expandedKeys"
        :selected-keys="selectedKeys"
        :show-icon="true"
        :draggable="false"
        @select="handleSelect"
        @expand="handleExpand"
      >
        <template #icon="{ nodeType }">
          <FolderOutlined v-if="nodeType === 1" style="color: #faad14" />
          <FileOutlined v-else-if="nodeType === 2" style="color: #1890ff" />
          <ApiOutlined v-else style="color: #52c41a" />
        </template>

        <template #title="{ name, menuCode, module }">
          <span class="tree-node-title">
            <span class="node-name">{{ name }}</span>
            <span class="node-code">{{ menuCode }}</span>
            <a-tag v-if="module" size="small" color="blue">{{ module }}</a-tag>
          </span>
        </template>
      </a-tree>

      <a-empty v-else description="暂无数据" />
    </a-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useModule } from '@/core/state/helpers'
import { FolderOutlined, FileOutlined, ApiOutlined } from '@ant-design/icons-vue'
import type { TreeProps } from 'ant-design-vue'

interface ResourceTreeNode {
  key: string
  title: string
  name: string
  menuCode: string
  module?: string
  nodeType: number
  sortOrder: number
  children?: ResourceTreeNode[]
}

const resourceModule = useModule('resource')
const loading = ref(false)
const expandedKeys = ref<string[]>([])
const selectedKeys = ref<string[]>([])

// 从 store 获取树形数据
const resourceTree = computed(() => resourceModule.state.resourceTree || [])

// 转换树形数据为 Ant Design Tree 格式
const treeData = computed<TreeProps['treeData']>(() => {
  return convertToTreeData(resourceTree.value)
})

// 递归转换数据格式
function convertToTreeData(nodes: any[]): ResourceTreeNode[] {
  if (!nodes || nodes.length === 0) return []

  return nodes
    .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map(node => ({
      key: node.id.toString(),
      title: node.name,
      name: node.name,
      menuCode: node.menuCode,
      module: node.module,
      nodeType: node.nodeType,
      sortOrder: node.sortOrder,
      children: node.children ? convertToTreeData(node.children) : undefined,
    }))
}

// 加载树形数据
async function loadTreeData() {
  loading.value = true
  try {
    await resourceModule.dispatch('fetchResourceTree')
    // 默认展开第一层
    if (treeData.value && treeData.value.length > 0) {
      expandedKeys.value = treeData.value.map(node => node.key as string)
    }
  } catch (error) {
    console.error('加载树形数据失败:', error)
  } finally {
    loading.value = false
  }
}

// 处理节点选择
function handleSelect(keys: string[]) {
  selectedKeys.value = keys
}

// 处理节点展开/折叠
function handleExpand(keys: string[]) {
  expandedKeys.value = keys
}

// 暴露方法供父组件调用
defineExpose({
  loadTreeData,
  expandedKeys,
  selectedKeys,
})

onMounted(() => {
  loadTreeData()
})
</script>

<style scoped>
.resource-tree {
  padding: 16px;
  background: #fff;
  border-radius: 4px;
}

.tree-node-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.node-name {
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}

.node-code {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

:deep(.ant-tree-node-content-wrapper) {
  flex: 1;
  min-width: 0;
}

:deep(.ant-tree-title) {
  flex: 1;
  min-width: 0;
}
</style>
