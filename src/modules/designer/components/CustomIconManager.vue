<template>
  <a-modal v-model:visible="modalVisible" title="自定义图标管理" :width="900" :footer="null">
    <a-tabs v-model:activeKey="activeTab">
      <!-- 图标列表 -->
      <a-tab-pane key="list" tab="图标列表">
        <div class="icon-list-container">
          <a-space direction="vertical" style="width: 100%" :size="16">
            <a-input-search v-model:value="searchQuery" placeholder="搜索图标..." allow-clear @search="handleSearch" />

            <a-empty v-if="filteredIcons.length === 0" description="暂无自定义图标" />

            <div v-else class="icon-grid">
              <div v-for="icon in filteredIcons" :key="icon.id" class="icon-item">
                <div class="icon-preview" v-html="icon.svg"></div>
                <div class="icon-info">
                  <div class="icon-name">{{ icon.name }}</div>
                  <div class="icon-category">{{ icon.category }}</div>
                </div>
                <div class="icon-actions">
                  <a-button type="link" size="small" @click="handleEdit(icon)"> 编辑 </a-button>
                  <a-popconfirm title="确定删除此图标?" @confirm="handleDelete(icon.id)">
                    <a-button type="link" danger size="small">删除</a-button>
                  </a-popconfirm>
                </div>
              </div>
            </div>
          </a-space>
        </div>
      </a-tab-pane>

      <!-- 添加图标 -->
      <a-tab-pane key="add" tab="添加图标">
        <a-form :model="formData" :label-col="{ span: 4 }" :wrapper-col="{ span: 20 }">
          <a-form-item label="图标名称" required>
            <a-input v-model:value="formData.name" placeholder="请输入图标名称" />
          </a-form-item>

          <a-form-item label="分类">
            <a-input v-model:value="formData.category" placeholder="请输入分类" />
          </a-form-item>

          <a-form-item label="标签">
            <a-select v-model:value="formData.tags" mode="tags" placeholder="请输入标签" style="width: 100%" />
          </a-form-item>

          <a-form-item label="添加方式">
            <a-radio-group v-model:value="addMethod">
              <a-radio value="svg">SVG代码</a-radio>
              <a-radio value="url">URL导入</a-radio>
            </a-radio-group>
          </a-form-item>

          <a-form-item v-if="addMethod === 'svg'" label="SVG代码" required>
            <a-textarea v-model:value="formData.svg" placeholder="请粘贴SVG代码" :rows="8" @change="handleSvgChange" />
          </a-form-item>

          <a-form-item v-if="addMethod === 'url'" label="图标URL" required>
            <a-input v-model:value="iconUrl" placeholder="请输入SVG图标的URL" />
          </a-form-item>

          <a-form-item v-if="formData.svg" label="预览">
            <div class="icon-preview-large" v-html="formData.svg"></div>
          </a-form-item>

          <a-form-item :wrapper-col="{ offset: 4, span: 20 }">
            <a-space>
              <a-button type="primary" @click="handleAdd" :loading="adding">
                {{ editingIcon ? '更新' : '添加' }}
              </a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </a-form-item>
        </a-form>
      </a-tab-pane>

      <!-- 批量导入 -->
      <a-tab-pane key="import" tab="批量导入">
        <a-space direction="vertical" style="width: 100%" :size="16">
          <a-alert
            message="导入说明"
            description="支持导入JSON格式的图标数据。可以从其他系统导出的图标数据进行导入。"
            type="info"
            show-icon
          />

          <a-textarea v-model:value="importData" placeholder="请粘贴JSON格式的图标数据" :rows="10" />

          <a-space>
            <a-button type="primary" @click="handleImport" :loading="importing"> 导入 </a-button>
            <a-button @click="handleExport">导出当前图标</a-button>
          </a-space>
        </a-space>
      </a-tab-pane>
    </a-tabs>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { getCustomIconManager } from '@/core/renderer/icons'
import type { CustomIcon } from '@/core/renderer/icons/CustomIconManager'

interface Props {
  visible: boolean
}

const props = withDefaults(defineProps<Props>(), {
  visible: false,
})

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

// 状态
const customIconManager = getCustomIconManager()
const activeTab = ref('list')
const searchQuery = ref('')
const addMethod = ref<'svg' | 'url'>('svg')
const iconUrl = ref('')
const adding = ref(false)
const importing = ref(false)
const importData = ref('')
const editingIcon = ref<CustomIcon | null>(null)

const formData = ref({
  name: '',
  category: '自定义',
  tags: [] as string[],
  svg: '',
})

// 计算属性
const modalVisible = computed({
  get: () => props.visible,
  set: val => emit('update:visible', val),
})

const allIcons = computed(() => customIconManager.getAllIcons())

const filteredIcons = computed(() => {
  if (!searchQuery.value) {
    return allIcons.value
  }

  const query = searchQuery.value.toLowerCase()
  return allIcons.value.filter(
    icon =>
      icon.name.toLowerCase().includes(query) ||
      icon.category.toLowerCase().includes(query) ||
      icon.tags.some(tag => tag.toLowerCase().includes(query))
  )
})

// 方法
const handleSearch = () => {
  // 搜索已在computed中处理
}

const handleSvgChange = () => {
  // SVG代码变化时的处理
}

const handleAdd = async () => {
  if (!formData.value.name) {
    message.error('请输入图标名称')
    return
  }

  if (addMethod.value === 'svg' && !formData.value.svg) {
    message.error('请输入SVG代码')
    return
  }

  if (addMethod.value === 'url' && !iconUrl.value) {
    message.error('请输入图标URL')
    return
  }

  try {
    adding.value = true

    if (editingIcon.value) {
      // 更新图标
      customIconManager.updateIcon(editingIcon.value.id, {
        name: formData.value.name,
        category: formData.value.category,
        tags: formData.value.tags,
        svg: formData.value.svg,
      })
      message.success('图标更新成功')
    } else {
      // 添加新图标
      if (addMethod.value === 'url') {
        await customIconManager.addIconFromUrl(formData.value.name, iconUrl.value, formData.value.category, formData.value.tags)
      } else {
        customIconManager.addIconFromSvg(formData.value.name, formData.value.svg, formData.value.category, formData.value.tags)
      }
      message.success('图标添加成功')
    }

    handleReset()
    activeTab.value = 'list'
    emit('success')
  } catch (error: any) {
    message.error(error.message || '操作失败')
  } finally {
    adding.value = false
  }
}

const handleEdit = (icon: CustomIcon) => {
  editingIcon.value = icon
  formData.value = {
    name: icon.name,
    category: icon.category,
    tags: [...icon.tags],
    svg: icon.svg,
  }
  activeTab.value = 'add'
}

const handleDelete = (id: string) => {
  customIconManager.deleteIcon(id)
  message.success('图标删除成功')
  emit('success')
}

const handleReset = () => {
  formData.value = {
    name: '',
    category: '自定义',
    tags: [],
    svg: '',
  }
  iconUrl.value = ''
  editingIcon.value = null
}

const handleImport = async () => {
  if (!importData.value) {
    message.error('请输入导入数据')
    return
  }

  try {
    importing.value = true
    const imported = await customIconManager.importFromJson(importData.value)
    message.success(`成功导入 ${imported.length} 个图标`)
    importData.value = ''
    activeTab.value = 'list'
    emit('success')
  } catch (error: any) {
    message.error(error.message || '导入失败')
  } finally {
    importing.value = false
  }
}

const handleExport = () => {
  const json = customIconManager.exportAsJson()

  // 复制到剪贴板
  navigator.clipboard
    .writeText(json)
    .then(() => {
      message.success('图标数据已复制到剪贴板')
    })
    .catch(() => {
      // 降级方案:下载文件
      const blob = new Blob([json], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `custom-icons-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      message.success('图标数据已下载')
    })
}

// 监听
watch(
  () => props.visible,
  val => {
    if (val) {
      handleReset()
      activeTab.value = 'list'
    }
  }
)
</script>

<style scoped>
.icon-list-container {
  max-height: 500px;
  overflow-y: auto;
}

.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.icon-item {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  transition: all 0.3s;
}

.icon-item:hover {
  border-color: #1890ff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.icon-preview {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.icon-preview :deep(svg) {
  width: 100%;
  height: 100%;
}

.icon-info {
  text-align: center;
}

.icon-name {
  font-weight: 500;
  font-size: 14px;
  margin-bottom: 4px;
}

.icon-category {
  font-size: 12px;
  color: #999;
}

.icon-actions {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.icon-preview-large {
  width: 64px;
  height: 64px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
}

.icon-preview-large :deep(svg) {
  max-width: 100%;
  max-height: 100%;
}
</style>
