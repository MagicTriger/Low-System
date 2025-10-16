<template>
  <div class="icon-picker">
    <!-- 工具栏 -->
    <div class="icon-picker-toolbar">
      <a-space>
        <a-select v-model:value="selectedLibrary" placeholder="选择图标库" style="width: 180px" @change="handleLibraryChange">
          <a-select-option value="all">全部图标库</a-select-option>
          <a-select-option v-for="lib in availableLibraries" :key="lib.id" :value="lib.id">
            {{ lib.name }}
          </a-select-option>
        </a-select>

        <a-button type="link" @click="showCustomIconManager">
          <template #icon><SettingOutlined /></template>
          管理自定义图标
        </a-button>
      </a-space>
    </div>

    <!-- 搜索框 -->
    <div class="icon-picker-search">
      <a-input-search v-model:value="searchQuery" placeholder="搜索图标(支持模糊查询)..." allow-clear @search="handleSearch">
        <template #prefix>
          <SearchOutlined />
        </template>
      </a-input-search>
    </div>

    <!-- 分类标签 -->
    <div class="icon-picker-categories">
      <a-tag :checked="!selectedCategory" checkable @click="selectCategory(null)"> 全部 </a-tag>
      <a-tag
        v-for="category in categories"
        :key="category"
        :checked="selectedCategory === category"
        checkable
        @click="selectCategory(category)"
      >
        {{ category }}
      </a-tag>
    </div>

    <!-- 图标网格 - 虚拟滚动 -->
    <div class="icon-picker-grid" ref="gridRef" @scroll="handleScroll">
      <div
        v-for="icon in displayedIcons"
        :key="icon.name"
        class="icon-item"
        :class="{ selected: selectedIcon === icon.name }"
        :title="icon.name"
        @click="selectIcon(icon)"
      >
        <component :is="icon.component" class="icon-component" />
        <span class="icon-name">{{ formatIconName(icon.name) }}</span>
      </div>
    </div>

    <!-- 加载指示器 -->
    <div v-if="isLoading" class="icon-picker-loading">
      <a-spin size="small" />
      <span style="margin-left: 8px">加载中...</span>
    </div>

    <!-- 空状态 -->
    <a-empty v-if="!isLoading && displayedIcons.length === 0" description="未找到匹配的图标" />

    <!-- 自定义图标管理器 -->
    <CustomIconManager v-model:visible="customIconManagerVisible" @success="handleCustomIconSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { SearchOutlined, SettingOutlined } from '@ant-design/icons-vue'
import { getIconLibraryManager } from './IconLibraryManager'
import { getCustomIconManager } from './CustomIconManager'
import type { IconDefinition } from './types'
import CustomIconManager from '@/modules/designer/components/CustomIconManager.vue'

interface Props {
  modelValue?: string
  libraryId?: string
}

interface Emits {
  (e: 'update:modelValue', value: string): void
  (e: 'select', icon: IconDefinition): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  libraryId: undefined,
})

const emit = defineEmits<Emits>()

const iconManager = getIconLibraryManager()
const customIconManager = getCustomIconManager()

// 状态
const searchQuery = ref('')
const selectedCategory = ref<string | null>(null)
const selectedIcon = ref(props.modelValue)
const selectedLibrary = ref<string>(props.libraryId || 'all')
const customIconManagerVisible = ref(false)
const isLoading = ref(false)
const loadedCount = ref(100) // 初始加载100个

// 计算属性
const availableLibraries = computed(() => {
  return iconManager.getAllLibraries()
})

const categories = computed(() => {
  const libId = selectedLibrary.value === 'all' ? undefined : selectedLibrary.value
  return iconManager.getCategories(libId)
})

const allIcons = computed(() => {
  const libId = selectedLibrary.value === 'all' ? undefined : selectedLibrary.value
  const result = iconManager.searchIcons({
    query: searchQuery.value,
    category: selectedCategory.value || undefined,
    libraryId: libId,
    page: 1,
    pageSize: 10000, // 获取所有图标
  })
  return result.icons
})

const displayedIcons = computed(() => {
  return allIcons.value.slice(0, loadedCount.value)
})

const totalIcons = computed(() => allIcons.value.length)

// 方法
function handleSearch() {
  loadedCount.value = 100 // 重置加载数量
}

function selectCategory(category: string | null) {
  selectedCategory.value = category
  loadedCount.value = 100 // 重置加载数量
}

function selectIcon(icon: IconDefinition) {
  selectedIcon.value = icon.name
  emit('update:modelValue', icon.name)
  emit('select', icon)
}

function formatIconName(name: string): string {
  // 移除后缀
  return name
    .replace(/Outlined$/, '')
    .replace(/Filled$/, '')
    .replace(/TwoTone$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim()
}

function handleLibraryChange() {
  selectedCategory.value = null
  loadedCount.value = 100 // 重置加载数量
}

function showCustomIconManager() {
  customIconManagerVisible.value = true
}

function handleCustomIconSuccess() {
  // 重新加载自定义图标库
  const customLibrary = customIconManager.createCustomLibrary()
  iconManager.registerLibrary(customLibrary)
  // 如果当前选中的是自定义图标库,刷新显示
  if (selectedLibrary.value === 'custom') {
    loadedCount.value = 100
  }
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  const scrollTop = target.scrollTop
  const scrollHeight = target.scrollHeight
  const clientHeight = target.clientHeight

  // 当滚动到底部附近100px时,加载更多
  if (scrollHeight - scrollTop - clientHeight < 100 && !isLoading.value) {
    loadMore()
  }
}

function loadMore() {
  if (loadedCount.value >= totalIcons.value) {
    return
  }

  isLoading.value = true

  // 模拟异步加载
  setTimeout(() => {
    loadedCount.value = Math.min(loadedCount.value + 100, totalIcons.value)
    isLoading.value = false
  }, 100)
}

// 监听modelValue变化
watch(
  () => props.modelValue,
  newValue => {
    selectedIcon.value = newValue
  }
)

// 监听libraryId变化
watch(
  () => props.libraryId,
  newValue => {
    if (newValue) {
      selectedLibrary.value = newValue
    }
  }
)

onMounted(() => {
  // 初始化
})
</script>

<style scoped lang="scss">
.icon-picker {
  display: flex;
  flex-direction: column;
  height: 500px; // 固定高度
  background: #fff;

  &-toolbar {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
  }

  &-search {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    flex-shrink: 0;
  }

  &-categories {
    padding: 12px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    max-height: 100px;
    overflow-y: auto;
    flex-shrink: 0;

    .ant-tag {
      cursor: pointer;
      user-select: none;
    }
  }

  &-grid {
    flex: 1;
    padding: 12px;
    overflow-y: auto;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
    align-content: start;

    .icon-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 12px 8px;
      border: 1px solid #f0f0f0;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        border-color: #1890ff;
        background: #f0f8ff;
      }

      &.selected {
        border-color: #1890ff;
        background: #e6f7ff;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }

      .icon-component {
        font-size: 24px;
        width: 24px;
        height: 24px;
        margin-bottom: 4px;
        display: flex;
        align-items: center;
        justify-content: center;

        // 确保SVG图标也统一大小
        svg {
          width: 24px;
          height: 24px;
        }
      }

      .icon-name {
        font-size: 12px;
        color: #666;
        text-align: center;
        word-break: break-word;
        line-height: 1.2;
        max-height: 2.4em;
        overflow: hidden;
        text-overflow: ellipsis;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        -webkit-box-orient: vertical;
      }
    }
  }

  &-loading {
    padding: 12px;
    text-align: center;
    color: #999;
    font-size: 14px;
    border-top: 1px solid #f0f0f0;
    flex-shrink: 0;
  }
}
</style>
