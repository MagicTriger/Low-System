<template>
  <div class="control-upload" :class="{ 'control-disabled': disabled }">
    <a-upload
      v-model:file-list="fileList"
      :action="action"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      :list-type="listType"
      :show-upload-list="showUploadList"
      :before-upload="beforeUpload"
      :custom-request="customRequest"
      :data="data"
      :headers="headers"
      :name="name"
      :with-credentials="withCredentials"
      :directory="directory"
      :max-count="maxCount"
      :method="method"
      :open-file-dialog-on-click="openFileDialogOnClick"
      :preview-file="previewFile"
      :transform-file="transformFile"
      @change="handleChange"
      @preview="handlePreview"
      @download="handleDownload"
      @remove="handleRemove"
      @drop="handleDrop"
    >
      <template v-if="listType === 'picture-card'">
        <div v-if="fileList.length < maxCount">
          <plus-outlined />
          <div class="ant-upload-text">{{ uploadText || '上传' }}</div>
        </div>
      </template>
      <template v-else>
        <a-button :disabled="disabled">
          <upload-outlined />
          {{ uploadText || '点击上传' }}
        </a-button>
      </template>
    </a-upload>
    
    <!-- 预览模态框 -->
    <a-modal
      v-model:open="previewVisible"
      :title="previewTitle"
      :footer="null"
      :width="800"
    >
      <img
        v-if="previewImage"
        :src="previewImage"
        style="width: 100%"
        alt="preview"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'
import type { UploadFile, UploadProps } from 'ant-design-vue'

interface Props {
  // 基础属性
  action?: string
  accept?: string
  multiple?: boolean
  disabled?: boolean
  directory?: boolean
  
  // 显示属性
  listType?: 'text' | 'picture' | 'picture-card'
  showUploadList?: boolean | object
  uploadText?: string
  
  // 限制属性
  maxCount?: number
  maxSize?: number // MB
  
  // 请求属性
  data?: object | ((file: UploadFile) => object)
  headers?: object
  name?: string
  method?: string
  withCredentials?: boolean
  
  // 自定义属性
  beforeUpload?: (file: UploadFile, fileList: UploadFile[]) => boolean | Promise<boolean>
  customRequest?: (options: any) => void
  previewFile?: (file: File | Blob) => Promise<string>
  transformFile?: (file: UploadFile) => string | Blob | File | Promise<string | Blob | File>
  
  // 其他属性
  openFileDialogOnClick?: boolean
  
  // 控件通用属性
  modelValue?: UploadFile[]
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  listType: 'text',
  showUploadList: true,
  maxCount: 10,
  maxSize: 10,
  method: 'post',
  openFileDialogOnClick: true
})

const emit = defineEmits<{
  'update:modelValue': [value: UploadFile[]]
  change: [info: { file: UploadFile; fileList: UploadFile[] }]
  preview: [file: UploadFile]
  download: [file: UploadFile]
  remove: [file: UploadFile]
  drop: [event: DragEvent]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 文件列表管理
const fileList = ref<UploadFile[]>(props.modelValue || [])

// 预览相关
const previewVisible = ref(false)
const previewImage = ref('')
const previewTitle = ref('')

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    fileList.value = newValue
  }
})

// 监听内部值变化
watch(fileList, (newValue) => {
  emit('update:modelValue', newValue)
}, { deep: true })

// 文件大小验证
const validateFileSize = (file: UploadFile): boolean => {
  if (props.maxSize && file.size) {
    const isLtMaxSize = file.size / 1024 / 1024 < props.maxSize
    if (!isLtMaxSize) {
      console.error(`文件大小不能超过 ${props.maxSize}MB!`)
      return false
    }
  }
  return true
}

// 默认上传前验证
const defaultBeforeUpload = (file: UploadFile, fileList: UploadFile[]): boolean => {
  // 文件大小验证
  if (!validateFileSize(file)) {
    return false
  }
  
  // 文件数量验证
  if (props.maxCount && fileList.length >= props.maxCount) {
    console.error(`最多只能上传 ${props.maxCount} 个文件!`)
    return false
  }
  
  return true
}

// 事件处理
const handleChange = (info: { file: UploadFile; fileList: UploadFile[] }) => {
  fileList.value = info.fileList
  emit('change', info)
  emitEvent('change', info)
}

const handlePreview = async (file: UploadFile) => {
  if (!file.url && !file.preview) {
    if (file.originFileObj && props.previewFile) {
      file.preview = await props.previewFile(file.originFileObj)
    } else if (file.originFileObj) {
      file.preview = await getBase64(file.originFileObj)
    }
  }
  
  previewImage.value = file.url || file.preview || ''
  previewTitle.value = file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1)
  previewVisible.value = true
  
  emit('preview', file)
  emitEvent('preview', { file })
}

const handleDownload = (file: UploadFile) => {
  emit('download', file)
  emitEvent('download', { file })
}

const handleRemove = (file: UploadFile) => {
  emit('remove', file)
  emitEvent('remove', { file })
}

const handleDrop = (event: DragEvent) => {
  emit('drop', event)
  emitEvent('drop', { event })
}

// 工具函数
const getBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

// 暴露的方法
const getFiles = () => {
  return fileList.value
}

const setFiles = (files: UploadFile[]) => {
  fileList.value = files
}

const addFile = (file: UploadFile) => {
  fileList.value.push(file)
}

const removeFile = (uid: string) => {
  const index = fileList.value.findIndex(file => file.uid === uid)
  if (index > -1) {
    fileList.value.splice(index, 1)
  }
}

const clearFiles = () => {
  fileList.value = []
}

const uploadFiles = () => {
  // 触发上传
}

const validate = () => {
  // 验证逻辑
  return fileList.value.length > 0
}

const reset = () => {
  fileList.value = []
}

// 暴露方法给父组件
defineExpose({
  getFiles,
  setFiles,
  addFile,
  removeFile,
  clearFiles,
  uploadFiles,
  validate,
  reset
})
</script>

<style scoped>
.control-upload {
  width: 100%;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

/* 设计器模式样式 */
.designer-mode .control-upload {
  min-height: 32px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
}

.designer-mode .control-upload:hover {
  border-color: #1890ff;
}

/* 上传区域样式 */
:deep(.ant-upload-select-picture-card) {
  width: 104px;
  height: 104px;
}

:deep(.ant-upload-list-picture-card .ant-upload-list-item) {
  width: 104px;
  height: 104px;
}

:deep(.ant-upload-list-picture-card-container) {
  width: 104px;
  height: 104px;
}
</style>