<template>
  <div class="mobile-list-control" :style="containerStyle">
    <div v-if="showSearch" class="list-search">
      <a-input
        v-model:value="searchValue"
        placeholder="搜索..."
        :prefix="searchIcon"
        @input="handleSearch"
        @pressEnter="handleSearchEnter"
      />
    </div>
    
    <div class="list-content" :style="contentStyle">
      <div
        v-for="(item, index) in filteredData"
        :key="getItemKey(item, index)"
        class="list-item"
        :class="getItemClasses(item, index)"
        :style="getItemStyle(item, index)"
        @click="handleItemClick(item, index)"
        @touchstart="handleTouchStart(item, index)"
        @touchend="handleTouchEnd(item, index)"
      >
        <div v-if="showAvatar" class="item-avatar">
          <a-avatar
            :src="getItemAvatar(item)"
            :size="avatarSize"
            :shape="avatarShape"
          >
            {{ getItemAvatarText(item) }}
          </a-avatar>
        </div>
        
        <div class="item-content">
          <div class="item-title">
            {{ getItemTitle(item) }}
          </div>
          <div v-if="showDescription" class="item-description">
            {{ getItemDescription(item) }}
          </div>
          <div v-if="showExtra" class="item-extra">
            {{ getItemExtra(item) }}
          </div>
        </div>
        
        <div v-if="showArrow" class="item-arrow">
          <RightOutlined />
        </div>
        
        <div v-if="showActions" class="item-actions">
          <a-button
            v-for="action in getItemActions(item)"
            :key="action.key"
            :type="action.type || 'text'"
            :size="action.size || 'small'"
            @click.stop="handleActionClick(action, item, index)"
          >
            {{ action.text }}
          </a-button>
        </div>
      </div>
      
      <div v-if="loading" class="list-loading">
        <a-spin size="large" />
      </div>
      
      <div v-if="!loading && filteredData.length === 0" class="list-empty">
        <a-empty :description="emptyText" />
      </div>
      
      <div v-if="showLoadMore && hasMore" class="list-load-more">
        <a-button
          type="text"
          :loading="loadingMore"
          @click="handleLoadMore"
        >
          {{ loadMoreText }}
        </a-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { RightOutlined, SearchOutlined } from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface Props {
  control: Control
}

const props = defineProps<Props>()

// 使用控件成员
const { value, eventHandler } = useControlMembers(props)

// 组件状态
const searchValue = ref('')
const loading = ref(false)
const loadingMore = ref(false)
const touchStartTime = ref(0)

// 控件属性
const listData = computed(() => value.value?.data || [])
const showSearch = computed(() => value.value?.showSearch || false)
const showAvatar = computed(() => value.value?.showAvatar || false)
const showDescription = computed(() => value.value?.showDescription !== false)
const showExtra = computed(() => value.value?.showExtra || false)
const showArrow = computed(() => value.value?.showArrow !== false)
const showActions = computed(() => value.value?.showActions || false)
const showLoadMore = computed(() => value.value?.showLoadMore || false)
const hasMore = computed(() => value.value?.hasMore || false)
const emptyText = computed(() => value.value?.emptyText || '暂无数据')
const loadMoreText = computed(() => value.value?.loadMoreText || '加载更多')
const avatarSize = computed(() => value.value?.avatarSize || 'default')
const avatarShape = computed(() => value.value?.avatarShape || 'circle')
const itemHeight = computed(() => value.value?.itemHeight || 'auto')
const divider = computed(() => value.value?.divider !== false)
const searchIcon = computed(() => value.value?.searchIcon || h(SearchOutlined))

// 样式计算
const containerStyle = computed(() => ({
  width: props.control.width || '100%',
  height: props.control.height || 'auto',
  backgroundColor: value.value?.backgroundColor || '#ffffff'
}))

const contentStyle = computed(() => ({
  maxHeight: value.value?.maxHeight || 'none',
  overflowY: value.value?.maxHeight ? 'auto' : 'visible'
}))

// 过滤数据
const filteredData = computed(() => {
  if (!searchValue.value) {
    return listData.value
  }
  
  const keyword = searchValue.value.toLowerCase()
  return listData.value.filter((item: any) => {
    const title = getItemTitle(item).toLowerCase()
    const description = getItemDescription(item).toLowerCase()
    return title.includes(keyword) || description.includes(keyword)
  })
})

// 获取项目键值
const getItemKey = (item: any, index: number) => {
  return item.id || item.key || index
}

// 获取项目样式类
const getItemClasses = (item: any, index: number) => [
  'mobile-list-item',
  {
    'with-divider': divider.value && index < filteredData.value.length - 1,
    'with-avatar': showAvatar.value,
    'with-arrow': showArrow.value,
    'with-actions': showActions.value,
    'disabled': item.disabled
  }
]

// 获取项目样式
const getItemStyle = (item: any, index: number) => ({
  height: itemHeight.value,
  backgroundColor: item.backgroundColor || 'transparent'
})

// 获取项目标题
const getItemTitle = (item: any) => {
  return item.title || item.name || item.label || ''
}

// 获取项目描述
const getItemDescription = (item: any) => {
  return item.description || item.subtitle || item.desc || ''
}

// 获取项目额外信息
const getItemExtra = (item: any) => {
  return item.extra || item.time || item.count || ''
}

// 获取项目头像
const getItemAvatar = (item: any) => {
  return item.avatar || item.image || item.icon
}

// 获取项目头像文本
const getItemAvatarText = (item: any) => {
  const title = getItemTitle(item)
  return title ? title.charAt(0).toUpperCase() : ''
}

// 获取项目操作
const getItemActions = (item: any) => {
  return item.actions || []
}

// 事件处理
const handleSearch = (e: Event) => {
  const target = e.target as HTMLInputElement
  eventHandler('search', { keyword: target.value, data: filteredData.value })
}

const handleSearchEnter = () => {
  eventHandler('searchEnter', { keyword: searchValue.value, data: filteredData.value })
}

const handleItemClick = (item: any, index: number) => {
  if (item.disabled) return
  eventHandler('itemClick', { item, index })
}

const handleTouchStart = (item: any, index: number) => {
  touchStartTime.value = Date.now()
}

const handleTouchEnd = (item: any, index: number) => {
  const touchDuration = Date.now() - touchStartTime.value
  if (touchDuration > 500) {
    // 长按事件
    eventHandler('itemLongPress', { item, index })
  }
}

const handleActionClick = (action: any, item: any, index: number) => {
  eventHandler('actionClick', { action, item, index })
}

const handleLoadMore = () => {
  if (loadingMore.value) return
  
  loadingMore.value = true
  eventHandler('loadMore', {
    callback: () => {
      loadingMore.value = false
    }
  })
}

// 监听数据变化
watch(listData, () => {
  loading.value = false
}, { deep: true })
</script>

<style scoped>
.mobile-list-control {
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.list-search {
  padding: 12px 16px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}

.list-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.list-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.list-item:hover {
  background-color: #f5f5f5;
}

.list-item:active {
  background-color: #e6f7ff;
}

.list-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.list-item.disabled:hover {
  background-color: transparent;
}

.list-item.with-divider::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: #f0f0f0;
}

.list-item.with-avatar.with-divider::after {
  left: 72px;
}

.item-avatar {
  margin-right: 12px;
  flex-shrink: 0;
}

.item-content {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 16px;
  color: #333;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
}

.item-description {
  font-size: 14px;
  color: #666;
  line-height: 1.4;
  margin-bottom: 4px;
  word-break: break-word;
}

.item-extra {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
}

.item-arrow {
  margin-left: 8px;
  color: #ccc;
  flex-shrink: 0;
}

.item-actions {
  margin-left: 8px;
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.list-loading {
  padding: 20px;
  text-align: center;
}

.list-empty {
  padding: 40px 20px;
  text-align: center;
}

.list-load-more {
  padding: 16px;
  text-align: center;
  border-top: 1px solid #f0f0f0;
}

/* 滚动条样式 */
.list-content::-webkit-scrollbar {
  width: 4px;
}

.list-content::-webkit-scrollbar-track {
  background: transparent;
}

.list-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.list-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

/* 响应式设计 */
@media (max-width: 480px) {
  .list-item {
    padding: 16px;
  }
  
  .item-title {
    font-size: 15px;
  }
  
  .item-description {
    font-size: 13px;
  }
}
</style>