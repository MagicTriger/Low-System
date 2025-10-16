<template>
  <div class="image-wrapper" :style="wrapperStyles">
    <img
      v-if="imageSrc"
      :src="imageSrc"
      :alt="imageAlt"
      :class="imageClasses"
      :style="imageStyles"
      @load="handleLoad"
      @error="handleError"
      @click="handleClick"
    />
    <div v-else class="image-placeholder" @click="handleClick">
      <picture-outlined />
      <span>{{ placeholder }}</span>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="image-loading">
      <a-spin size="small" />
    </div>
    
    <!-- 错误状态 -->
    <div v-if="error" class="image-error">
      <file-image-outlined />
      <span>加载失败</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PictureOutlined, FileImageOutlined } from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface ImageControl extends Control {
  props?: {
    src?: string
    alt?: string
    width?: number | string
    height?: number | string
    fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    placeholder?: string
    preview?: boolean
    fallback?: string
    lazy?: boolean
  }
}

const props = defineProps<{ control: ImageControl }>()

const { control, value, eventHandler } = useControlMembers(props)

// 状态管理
const loading = ref(false)
const error = ref(false)

// 计算属性
const imageSrc = computed(() => {
  // 优先使用数据绑定的值
  if (value.value) {
    return String(value.value)
  }
  return control.value.props?.src || ''
})

const imageAlt = computed(() => control.value.props?.alt || '图片')
const placeholder = computed(() => control.value.props?.placeholder || '点击选择图片')

const wrapperStyles = computed(() => {
  const styles: Record<string, any> = {
    position: 'relative',
    display: 'inline-block'
  }
  
  if (control.value.props?.width) {
    styles.width = typeof control.value.props.width === 'number' 
      ? `${control.value.props.width}px` 
      : control.value.props.width
  }
  
  if (control.value.props?.height) {
    styles.height = typeof control.value.props.height === 'number' 
      ? `${control.value.props.height}px` 
      : control.value.props.height
  }
  
  return styles
})

const imageClasses = computed(() => {
  const classes = ['image-content']
  
  if (control.value.props?.preview) {
    classes.push('image-preview')
  }
  
  return classes
})

const imageStyles = computed(() => {
  const styles: Record<string, any> = {
    width: '100%',
    height: '100%',
    display: 'block'
  }
  
  if (control.value.props?.fit) {
    styles.objectFit = control.value.props.fit
  }
  
  return styles
})

// 事件处理
const handleLoad = async () => {
  loading.value = false
  error.value = false
  await eventHandler?.('load')
}

const handleError = async () => {
  loading.value = false
  error.value = true
  await eventHandler?.('error')
}

const handleClick = async (event: Event) => {
  await eventHandler?.('click', event)
}

// 暴露方法
defineExpose({
  setSrc: (src: string) => {
    if (control.value.props) {
      control.value.props.src = src
    }
    error.value = false
  },
  getSrc: () => imageSrc.value,
  reload: () => {
    loading.value = true
    error.value = false
    // 重新加载图片
    const img = new Image()
    img.onload = handleLoad
    img.onerror = handleError
    img.src = imageSrc.value
  }
})
</script>

<style scoped>
.image-wrapper {
  position: relative;
  overflow: hidden;
  border-radius: 4px;
}

.image-content {
  transition: all 0.3s ease;
}

.image-preview {
  cursor: pointer;
}

.image-preview:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.image-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100px;
  background: #fafafa;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #8c8c8c;
}

.image-placeholder:hover {
  border-color: #1890ff;
  color: #1890ff;
  background: #f6ffed;
}

.image-placeholder .anticon {
  font-size: 24px;
  margin-bottom: 8px;
}

.image-placeholder span {
  font-size: 12px;
}

.image-loading,
.image-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #8c8c8c;
}

.image-error {
  background: rgba(255, 241, 240, 0.9);
  color: #ff4d4f;
}

.image-error .anticon {
  font-size: 24px;
  margin-bottom: 8px;
}

.image-error span {
  font-size: 12px;
}
</style>