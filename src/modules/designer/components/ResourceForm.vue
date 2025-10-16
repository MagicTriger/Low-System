<template>
  <a-modal
    v-model:visible="modalVisible"
    :title="isEdit ? '编辑资源' : '新建资源'"
    :width="800"
    :confirm-loading="loading"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form ref="formRef" :model="formData" :rules="rules" :label-col="{ span: 6 }" :wrapper-col="{ span: 16 }">
      <a-form-item label="父级资源" name="parentId">
        <a-tree-select
          v-model:value="formData.parentId"
          :tree-data="treeData"
          placeholder="请选择父级资源（不选则为根节点）"
          allow-clear
          tree-default-expand-all
        />
      </a-form-item>

      <a-form-item label="资源名称" name="name">
        <a-input v-model:value="formData.name" placeholder="请输入资源名称" />
      </a-form-item>

      <a-form-item label="菜单编码" name="menuCode">
        <a-input v-model:value="formData.menuCode" placeholder="请输入菜单编码（唯一）" />
      </a-form-item>

      <a-form-item label="业务模块" name="module">
        <a-input v-model:value="formData.module" placeholder="请输入业务模块" />
      </a-form-item>

      <a-form-item label="节点类型" name="nodeType">
        <a-select v-model:value="formData.nodeType" placeholder="请选择节点类型">
          <a-select-option :value="1">文件夹</a-select-option>
          <a-select-option :value="2">页面</a-select-option>
          <a-select-option :value="3">按钮</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="排序序号" name="sortOrder">
        <a-input-number v-model:value="formData.sortOrder" :min="0" placeholder="请输入排序序号" style="width: 100%" />
      </a-form-item>

      <a-form-item label="路由路径" name="path">
        <a-input v-model:value="formData.path" placeholder="请输入路由路径（如：/system/user）" />
      </a-form-item>

      <a-form-item label="图标" name="icon">
        <a-space direction="vertical" style="width: 100%" :size="8">
          <a-space>
            <a-select v-model:value="selectedLibrary" placeholder="选择图标库" style="width: 150px" @change="handleLibraryChange">
              <a-select-option value="all">全部图标库</a-select-option>
              <a-select-option v-for="lib in availableLibraries" :key="lib.id" :value="lib.id">
                {{ lib.name }}
              </a-select-option>
            </a-select>
            <a-button type="link" @click="showCustomIconManager"> 管理自定义图标 </a-button>
          </a-space>

          <a-input-group compact style="display: flex">
            <a-input
              :value="formData.icon"
              placeholder="请输入关键词搜索图标（支持模糊查询）"
              readonly
              style="flex: 1; cursor: pointer"
              @click="showIconSelector = true"
            >
              <template #prefix>
                <component
                  :is="getSelectedIconComponent()"
                  v-if="formData.icon && getSelectedIconComponent()"
                  class="selected-icon-preview"
                />
              </template>
            </a-input>
            <a-button v-if="formData.icon" @click="formData.icon = ''" style="border-left: 0">
              <template #icon>
                <CloseOutlined />
              </template>
            </a-button>
          </a-input-group>

          <!-- 图标选择器弹框 -->
          <a-modal v-model:visible="showIconSelector" title="选择图标" :width="800" @ok="showIconSelector = false">
            <a-input
              v-model:value="iconSearchQuery"
              placeholder="搜索图标..."
              allow-clear
              @change="(e: any) => handleIconSearch(e.target.value)"
              style="margin-bottom: 16px"
            >
              <template #prefix>
                <SearchOutlined />
              </template>
            </a-input>
            <div class="icon-grid">
              <div
                v-for="icon in iconList"
                :key="icon.name"
                class="icon-grid-item"
                :class="{ 'icon-grid-item-selected': formData.icon === icon.name }"
                @click="selectIcon(icon.name)"
              >
                <component :is="icon.component" class="icon-grid-icon" />
                <div class="icon-grid-name">{{ icon.name }}</div>
              </div>
            </div>
            <a-empty v-if="iconList.length === 0" description="未找到匹配的图标" />
          </a-modal>
        </a-space>
      </a-form-item>

      <a-form-item label="URL地址" name="url">
        <a-input v-model:value="formData.url" placeholder="请输入URL地址" />
      </a-form-item>

      <a-form-item label="元数据" name="meta">
        <a-textarea v-model:value="formData.meta" placeholder="请输入元数据（JSON格式）" :rows="3" />
      </a-form-item>
    </a-form>

    <!-- 自定义图标管理器 -->
    <CustomIconManager v-model:visible="customIconManagerVisible" @success="handleCustomIconSuccess" />
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch, h } from 'vue'
import { message } from 'ant-design-vue'
import type { FormInstance } from 'ant-design-vue'
import { CloseOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { useModule } from '@/core/state/helpers'
import type { MenuResource, MenuTreeNode } from '@/core/api/menu'
import { getIconLibraryManager, getCustomIconManager } from '@/core/renderer/icons'
import type { IconDefinition, IconLibrary } from '@/core/renderer/icons/types'
import CustomIconManager from './CustomIconManager.vue'

interface Props {
  visible: boolean
  editData?: MenuResource | null
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
  editData: null,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

// 状态管理
const resourceModule = useModule('resource')
const iconManager = getIconLibraryManager()
const customIconManager = getCustomIconManager()

// 响应式数据
const formRef = ref<FormInstance>()
const loading = ref(false)
const iconList = ref<IconDefinition[]>([])
const iconSearchQuery = ref('')
const iconLoading = ref(false)
const searchDebounceTimer = ref<number | null>(null)
const selectedLibrary = ref<string>('all')
const customIconManagerVisible = ref(false)
const showIconSelector = ref(false)
const formData = ref({
  id: undefined as number | undefined,
  parentId: undefined as number | undefined,
  name: '',
  menuCode: '',
  module: '',
  nodeType: 2 as number,
  sortOrder: 0,
  path: '',
  icon: '',
  url: '',
  meta: '',
})

// 表单验证规则
const rules = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  menuCode: [{ required: true, message: '请输入菜单编码', trigger: 'blur' }],
  module: [{ required: true, message: '请输入业务模块', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
}

// 计算属性
const modalVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const isEdit = computed(() => !!props.editData)

const treeData = computed(() => {
  return convertToTreeSelect(resourceModule.state.resourceTree)
})

const availableLibraries = computed(() => {
  return iconManager.getAllLibraries()
})

// 方法
const convertToTreeSelect = (nodes: MenuTreeNode[]): any[] => {
  return nodes
    .filter(node => node.nodeType === 1) // 只显示文件夹类型
    .map(node => ({
      value: node.id,
      title: node.name,
      children: node.children ? convertToTreeSelect(node.children) : [],
    }))
}

const resetForm = () => {
  formData.value = {
    id: undefined,
    parentId: undefined,
    name: '',
    menuCode: '',
    module: '',
    nodeType: 2,
    sortOrder: 0,
    path: '',
    icon: '',
    url: '',
    meta: '',
  }
  formRef.value?.clearValidate()
}

const loadFormData = () => {
  if (props.editData) {
    formData.value = {
      id: props.editData.id,
      parentId: props.editData.parentId || undefined,
      name: props.editData.name,
      menuCode: props.editData.menuCode,
      module: props.editData.module,
      nodeType: props.editData.nodeType,
      sortOrder: props.editData.sortOrder,
      path: props.editData.path || '',
      icon: props.editData.icon || '',
      url: props.editData.url || '',
      meta: props.editData.meta || '',
    }
  } else {
    resetForm()
  }
}

const handleSubmit = async () => {
  try {
    await formRef.value?.validate()

    loading.value = true

    const data = {
      ...formData.value,
      parentId: formData.value.parentId || null,
    }

    if (isEdit.value) {
      await resourceModule.dispatch('updateResource', data)
      message.success('更新成功')
    } else {
      await resourceModule.dispatch('createResource', data)
      message.success('创建成功')
    }

    emit('success')
    handleCancel()
  } catch (error: any) {
    if (error.errorFields) {
      // 表单验证错误
      return
    }
    message.error(error.message || '操作失败')
  } finally {
    loading.value = false
  }
}

const handleCancel = () => {
  resetForm()
  emit('update:visible', false)
}

// 图标相关方法
const loadIcons = (searchQuery = '') => {
  try {
    iconLoading.value = true
    const result = iconManager.searchIcons({
      libraryId: selectedLibrary.value === 'all' ? undefined : selectedLibrary.value,
      query: searchQuery,
      pageSize: searchQuery ? 200 : 100, // 搜索时加载更多
    })
    iconList.value = result.icons
  } catch (error) {
    console.error('加载图标失败:', error)
    iconList.value = []
  } finally {
    iconLoading.value = false
  }
}

const handleLibraryChange = () => {
  loadIcons(iconSearchQuery.value)
}

const showCustomIconManager = () => {
  customIconManagerVisible.value = true
}

const handleCustomIconSuccess = () => {
  // 重新加载自定义图标库
  const customLibrary = customIconManager.createCustomLibrary()
  iconManager.registerLibrary(customLibrary)
  loadIcons(iconSearchQuery.value)
}

// 模糊匹配算法 - 支持多种匹配策略
const fuzzyMatch = (text: string, query: string): boolean => {
  if (!query) return true

  const textLower = text.toLowerCase()
  const queryLower = query.toLowerCase()

  // 1. 精确匹配
  if (textLower === queryLower) return true

  // 2. 包含匹配
  if (textLower.includes(queryLower)) return true

  // 3. 开头匹配
  if (textLower.startsWith(queryLower)) return true

  // 4. 忽略分隔符匹配 (user-add -> useradd)
  const textNormalized = textLower.replace(/[-_]/g, '')
  const queryNormalized = queryLower.replace(/[-_]/g, '')
  if (textNormalized.includes(queryNormalized)) return true

  // 5. 驼峰匹配 (UserAdd -> ua)
  const camelMatches = text.match(/[A-Z]/g)
  if (camelMatches) {
    const camelStr = camelMatches.join('').toLowerCase()
    if (camelStr.includes(queryLower)) return true
  }

  // 6. 首字母匹配 (user-add-outlined -> uao)
  const parts = textLower.split(/[-_]/)
  const initials = parts.map(p => p[0]).join('')
  if (initials.includes(queryLower)) return true

  // 7. 模糊序列匹配 (允许跳过字符)
  let queryIndex = 0
  for (let i = 0; i < textLower.length && queryIndex < queryLower.length; i++) {
    if (textLower[i] === queryLower[queryIndex]) {
      queryIndex++
    }
  }
  if (queryIndex === queryLower.length) return true

  return false
}

const filterIconOption = (input: string, option: any) => {
  if (!input) return true
  return fuzzyMatch(option.value, input)
}

// 防抖搜索
const handleIconSearch = (value: string) => {
  iconSearchQuery.value = value

  // 清除之前的定时器
  if (searchDebounceTimer.value) {
    clearTimeout(searchDebounceTimer.value)
  }

  // 设置新的定时器
  searchDebounceTimer.value = window.setTimeout(() => {
    loadIcons(value)
  }, 300) // 300ms 防抖
}

const dropdownRender = ({ menuNode }: any) => {
  return h('div', { class: 'icon-dropdown' }, [menuNode])
}

// 选择图标
const selectIcon = (iconName: string) => {
  formData.value.icon = iconName
  showIconSelector.value = false
}

// 获取选中图标的组件
const getSelectedIconComponent = () => {
  if (!formData.value.icon) return null

  // 检查是否是自定义图标 (格式: custom/iconName)
  if (formData.value.icon.startsWith('custom/')) {
    const customIconName = formData.value.icon.replace('custom/', '')
    const customIcon = iconManager.getIcon('custom', customIconName)
    if (customIcon) {
      return customIcon.component
    }
  }

  // 尝试从所有图标库中查找
  const allLibraries = iconManager.getAllLibraries()
  for (const library of allLibraries) {
    const icon = iconManager.getIcon(library.id, formData.value.icon)
    if (icon) {
      return icon.component
    }
  }

  return null
}

// 监听
watch(
  () => props.visible,
  val => {
    if (val) {
      loadFormData()
      loadIcons() // 加载图标列表
      iconSearchQuery.value = '' // 重置搜索
      // 加载资源树用于父级选择
      if (resourceModule.state.resourceTree.length === 0) {
        resourceModule.dispatch('fetchResourceTree')
      }
    } else {
      // 清理定时器
      if (searchDebounceTimer.value) {
        clearTimeout(searchDebounceTimer.value)
        searchDebounceTimer.value = null
      }
    }
  }
)
</script>

<style scoped>
.icon-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-preview {
  font-size: 16px;
  color: #1890ff;
}

.icon-name {
  font-size: 13px;
  color: #666;
}

:deep(.icon-dropdown) {
  max-height: 400px;
  overflow-y: auto;
}

:deep(.ant-select-item-option-content) {
  display: flex;
  align-items: center;
}

:deep(.ant-select-selection-search-input) {
  height: auto !important;
}

:deep(.ant-select-selector) {
  min-height: 32px;
}

/* 高亮激活的选项 */
:deep(.ant-select-item-option-active) .icon-option {
  background-color: #f5f5f5;
  border-radius: 4px;
  padding: 2px 4px;
  margin: -2px -4px;
}

/* 搜索时的加载状态 */
:deep(.ant-select-selection-placeholder) {
  font-size: 13px;
}

/* 选中图标的显示容器 */
.selected-icon-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 选中图标的预览样式 */
.selected-icon-preview {
  font-size: 16px;
  color: #1890ff;
  flex-shrink: 0;
}

/* 选中图标的名称 */
.selected-icon-name {
  font-size: 14px;
  color: #262626;
}

/* 确保选中的值也显示图标 */
:deep(.ant-select-selection-item) {
  display: flex;
  align-items: center;
}

/* 输入框中的图标预览 */
.input-icon-preview {
  font-size: 16px;
  color: #1890ff;
}

/* 图标网格 */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.icon-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-grid-item:hover {
  border-color: #1890ff;
  background-color: #f0f5ff;
}

.icon-grid-item-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.icon-grid-icon {
  font-size: 24px;
  color: #1890ff;
  margin-bottom: 8px;
}

.icon-grid-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
}
</style>
