<template>
  <div class="mobile-container-control" :class="containerClasses" :style="containerStyle">
    <div v-if="showHeader" class="mobile-header" :style="headerStyle">
      <div class="header-left">
        <slot name="header-left">
          <a-button v-if="showBackButton" type="text" @click="handleBack">
            <template #icon>
              <ArrowLeftOutlined />
            </template>
          </a-button>
        </slot>
      </div>
      <div class="header-center">
        <slot name="header-center">
          <span class="header-title">{{ title }}</span>
        </slot>
      </div>
      <div class="header-right">
        <slot name="header-right">
          <a-button v-if="showMenuButton" type="text" @click="handleMenu">
            <template #icon>
              <MenuOutlined />
            </template>
          </a-button>
        </slot>
      </div>
    </div>
    
    <div class="mobile-content" :style="contentStyle">
      <slot>
        <div class="empty-content">
          <a-empty description="请拖拽组件到此处" />
        </div>
      </slot>
    </div>
    
    <div v-if="showFooter" class="mobile-footer" :style="footerStyle">
      <slot name="footer">
        <div class="footer-content">
          <span>移动端页面</span>
        </div>
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeftOutlined, MenuOutlined } from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface Props {
  control: Control
}

const props = defineProps<Props>()

// 使用控件成员
const { value, eventHandler } = useControlMembers(props)

// 控件属性
const title = computed(() => value.value?.title || '移动端页面')
const showHeader = computed(() => value.value?.showHeader !== false)
const showFooter = computed(() => value.value?.showFooter || false)
const showBackButton = computed(() => value.value?.showBackButton || false)
const showMenuButton = computed(() => value.value?.showMenuButton || false)
const backgroundColor = computed(() => value.value?.backgroundColor || '#f5f5f5')
const headerColor = computed(() => value.value?.headerColor || '#ffffff')
const footerColor = computed(() => value.value?.footerColor || '#ffffff')
const width = computed(() => props.control.width || '375px')
const height = computed(() => props.control.height || '667px')
const borderRadius = computed(() => value.value?.borderRadius || '12px')
const showBorder = computed(() => value.value?.showBorder !== false)
const orientation = computed(() => value.value?.orientation || 'portrait') // portrait | landscape

// 样式计算
const containerClasses = computed(() => [
  'mobile-container',
  `orientation-${orientation.value}`,
  {
    'with-border': showBorder.value,
    'with-header': showHeader.value,
    'with-footer': showFooter.value
  }
])

const containerStyle = computed(() => ({
  width: width.value,
  height: height.value,
  backgroundColor: backgroundColor.value,
  borderRadius: borderRadius.value,
  border: showBorder.value ? '1px solid #d9d9d9' : 'none',
  boxShadow: showBorder.value ? '0 4px 12px rgba(0, 0, 0, 0.1)' : 'none'
}))

const headerStyle = computed(() => ({
  backgroundColor: headerColor.value,
  borderBottom: '1px solid #f0f0f0'
}))

const contentStyle = computed(() => {
  const headerHeight = showHeader.value ? '44px' : '0px'
  const footerHeight = showFooter.value ? '44px' : '0px'
  
  return {
    height: `calc(100% - ${headerHeight} - ${footerHeight})`,
    backgroundColor: backgroundColor.value
  }
})

const footerStyle = computed(() => ({
  backgroundColor: footerColor.value,
  borderTop: '1px solid #f0f0f0'
}))

// 事件处理
const handleBack = () => {
  eventHandler('back', { type: 'back' })
}

const handleMenu = () => {
  eventHandler('menu', { type: 'menu' })
}
</script>

<style scoped>
.mobile-container-control {
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  margin: 0 auto;
}

.mobile-container.orientation-portrait {
  max-width: 414px;
  min-height: 600px;
}

.mobile-container.orientation-landscape {
  max-width: 736px;
  min-height: 414px;
}

.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 16px;
  position: relative;
  z-index: 10;
}

.header-left,
.header-right {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
}

.header-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.header-title {
  font-size: 16px;
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.mobile-content {
  flex: 1;
  position: relative;
  overflow: auto;
  -webkit-overflow-scrolling: touch;
}

.empty-content {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
}

.mobile-footer {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 10;
}

.footer-content {
  font-size: 12px;
  color: #999;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .mobile-container-control {
    width: 100% !important;
    height: 100vh !important;
    border-radius: 0 !important;
    border: none !important;
    box-shadow: none !important;
  }
}

/* 设计时样式 */
.mobile-container-control.design-mode {
  border: 2px dashed #1890ff;
  background: rgba(24, 144, 255, 0.05);
}

.mobile-container-control.design-mode .empty-content {
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  margin: 16px;
  background: #fafafa;
}

/* 拖拽悬停样式 */
.mobile-container-control.drag-over {
  border-color: #52c41a;
  background: rgba(82, 196, 26, 0.05);
}

.mobile-container-control.drag-over .mobile-content {
  background: rgba(82, 196, 26, 0.02);
}

/* 滚动条样式 */
.mobile-content::-webkit-scrollbar {
  width: 4px;
}

.mobile-content::-webkit-scrollbar-track {
  background: transparent;
}

.mobile-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 2px;
}

.mobile-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>