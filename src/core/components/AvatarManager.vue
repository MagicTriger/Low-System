<template>
  <div class="avatar-manager">
    <AvatarUpload
      :current-avatar="currentAvatar"
      :size="size"
      :max-size="maxSize"
      :allowed-types="allowedTypes"
      :show-actions="showActions"
      @file-selected="handleFileSelected"
      @delete-success="handleDeleteSuccess"
      @delete-error="handleDeleteError"
    />

    <AvatarCropper
      v-if="showCropper"
      :image-url="selectedImageUrl"
      :aspect-ratio="aspectRatio"
      :crop-size="cropSize"
      @crop-complete="handleCropComplete"
      @crop-cancel="handleCropCancel"
    />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import AvatarUpload from './AvatarUpload.vue'
import AvatarCropper from './AvatarCropper.vue'

interface Props {
  currentAvatar?: string
  size?: number
  maxSize?: number
  allowedTypes?: string[]
  showActions?: boolean
  aspectRatio?: number
  cropSize?: number
  uploadUrl?: string
  deleteUrl?: string
}

const props = withDefaults(defineProps<Props>(), {
  currentAvatar: '',
  size: 100,
  maxSize: 2 * 1024 * 1024,
  allowedTypes: () => ['image/jpeg', 'image/png', 'image/gif'],
  showActions: true,
  aspectRatio: 1,
  cropSize: 200,
  uploadUrl: '/api/user/avatar/upload',
  deleteUrl: '/api/user/avatar',
})

interface Emits {
  (e: 'upload-success', data: { avatarUrl: string; thumbnailUrl: string }): void
  (e: 'upload-error', error: string): void
  (e: 'delete-success'): void
  (e: 'delete-error', error: string): void
}

const emit = defineEmits<Emits>()

const showCropper = ref(false)
const selectedImageUrl = ref('')
const selectedFile = ref<File | null>(null)

function handleFileSelected(file: File) {
  selectedFile.value = file

  // 创建预览URL
  const reader = new FileReader()
  reader.onload = e => {
    selectedImageUrl.value = e.target?.result as string
    showCropper.value = true
  }
  reader.readAsDataURL(file)
}

async function handleCropComplete(data: { blob: Blob; dataUrl: string }) {
  try {
    // 创建File对象
    const file = new File([data.blob], 'avatar.jpg', { type: 'image/jpeg' })

    // 使用API上传
    const { uploadAvatar } = await import('@/core/api/avatar')
    const result = await uploadAvatar(file)

    emit('upload-success', result)
    showCropper.value = false
  } catch (error: any) {
    console.error('上传头像失败:', error)
    emit('upload-error', error.message || error.toString() || '上传失败')
    showCropper.value = false
  }
}

function handleCropCancel() {
  showCropper.value = false
  selectedFile.value = null
  selectedImageUrl.value = ''
}

function handleDeleteSuccess() {
  emit('delete-success')
}

function handleDeleteError(error: string) {
  emit('delete-error', error)
}
</script>

<style scoped>
.avatar-manager {
  display: inline-block;
}
</style>
