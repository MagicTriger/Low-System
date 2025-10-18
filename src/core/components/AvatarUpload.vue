<template>
  <div class="avatar-upload">
    <div class="avatar-preview">
      <img :src="displayAvatar" :alt="alt" @error="handleImageError" class="avatar-image" />
      <div v-if="uploading" class="upload-progress">
        <div class="progress-bar" :style="{ width: uploadProgress + '%' }"></div>
      </div>
    </div>

    <input ref="fileInput" type="file" :accept="acceptTypes" @change="handleFileSelect" style="display: none" />

    <div v-if="showActions" class="avatar-actions">
      <button @click="selectFile" class="btn-upload" :disabled="uploading || deleting">
        <i v-if="!uploading" class="icon-upload"></i>
        <span v-if="uploading" class="loading-spinner"></span>
        {{ uploading ? '上传中...' : '更换头像' }}
      </button>
      <button
        v-if="currentAvatar && currentAvatar !== defaultAvatar"
        @click="handleDelete"
        class="btn-delete"
        :disabled="uploading || deleting"
      >
        <i v-if="!deleting" class="icon-delete"></i>
        <span v-if="deleting" class="loading-spinner"></span>
        {{ deleting ? '删除中...' : '删除头像' }}
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  currentAvatar?: string
  size?: number
  maxSize?: number
  allowedTypes?: string[]
  showActions?: boolean
  alt?: string
  overlayText?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentAvatar: '',
  size: 100,
  maxSize: 2 * 1024 * 1024, // 2MB
  allowedTypes: () => ['image/jpeg', 'image/png', 'image/gif'],
  showActions: true,
  alt: '用户头像',
  overlayText: '更换头像',
})

interface Emits {
  (e: 'upload-success', data: { avatarUrl: string; thumbnailUrl: string }): void
  (e: 'upload-error', error: string): void
  (e: 'delete-success'): void
  (e: 'delete-error', error: string): void
  (e: 'file-selected', file: File): void
}

const emit = defineEmits<Emits>()

const fileInput = ref<HTMLInputElement>()
const uploading = ref(false)
const deleting = ref(false)
const uploadProgress = ref(0)
const error = ref('')
const imageError = ref(false)

const defaultAvatar = '/assets/default-avatar.png'

const displayAvatar = computed(() => {
  if (imageError.value) {
    return defaultAvatar
  }
  return props.currentAvatar || defaultAvatar
})

const acceptTypes = computed(() => {
  return props.allowedTypes.join(',')
})

watch(
  () => props.currentAvatar,
  () => {
    imageError.value = false
    error.value = ''
  }
)

function selectFile() {
  if (uploading.value || deleting.value) return
  fileInput.value?.click()
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) return

  error.value = ''

  // 验证文件类型
  if (!props.allowedTypes.includes(file.type)) {
    error.value = `不支持的文件类型。请上传 ${props.allowedTypes.map(t => t.split('/')[1]).join(', ')} 格式的图片`
    return
  }

  // 验证文件大小
  if (file.size > props.maxSize) {
    const maxSizeMB = (props.maxSize / (1024 * 1024)).toFixed(1)
    error.value = `文件大小超过限制。最大允许 ${maxSizeMB}MB`
    return
  }

  // 触发文件选择事件
  emit('file-selected', file)

  // 清空input以允许选择相同文件
  if (target) {
    target.value = ''
  }
}

function handleImageError() {
  imageError.value = true
}

async function handleDelete() {
  if (uploading.value || deleting.value) return

  if (!confirm('确定要删除当前头像吗?')) {
    return
  }

  try {
    deleting.value = true
    error.value = ''

    // 调用删除API
    const { deleteAvatar } = await import('@/core/api/avatar')
    await deleteAvatar()

    emit('delete-success')
  } catch (err: any) {
    error.value = err.message || '删除头像失败'
    emit('delete-error', error.value)
  } finally {
    deleting.value = false
  }
}

// 暴露方法供父组件调用
defineExpose({
  selectFile,
  uploading,
  uploadProgress,
})
</script>

<style scoped>
.avatar-upload {
  display: inline-block;
}

.avatar-preview {
  position: relative;
  width: v-bind('props.size + "px"');
  height: v-bind('props.size + "px"');
  border-radius: 50%;
  overflow: hidden;
  transition: all 0.3s ease;
  border: 2px solid #e4e7ed;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(255, 255, 255, 0.3);
}

.progress-bar {
  height: 100%;
  background: #409eff;
  transition: width 0.3s ease;
}

.avatar-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  justify-content: center;
}

.avatar-actions button {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  background: white;
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
  transition: all 0.3s ease;
}

.avatar-actions button:hover {
  border-color: #409eff;
  color: #409eff;
}

.btn-delete:hover {
  border-color: #f56c6c;
  color: #f56c6c;
}

.avatar-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #f5f7fa;
}

.error-message {
  margin-top: 8px;
  color: #f56c6c;
  font-size: 12px;
  text-align: center;
  animation: shake 0.5s ease;
}

/* 加载动画 */
.loading-spinner {
  display: inline-block;
  width: 14px;
  height: 14px;
  border: 2px solid #409eff;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes shake {
  0%,
  100% {
    transform: translateX(0);
  }
  10%,
  30%,
  50%,
  70%,
  90% {
    transform: translateX(-5px);
  }
  20%,
  40%,
  60%,
  80% {
    transform: translateX(5px);
  }
}

/* 头像更新动画 */
.avatar-image {
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
