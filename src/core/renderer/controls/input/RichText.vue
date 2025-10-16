<template>
  <div class="control-rich-text" :class="{ 'control-disabled': disabled }">
    <div class="rich-text-toolbar" v-if="showToolbar">
      <a-space>
        <a-button-group size="small">
          <a-button @click="execCommand('bold')" :type="isActive('bold') ? 'primary' : 'default'">
            <bold-outlined />
          </a-button>
          <a-button @click="execCommand('italic')" :type="isActive('italic') ? 'primary' : 'default'">
            <italic-outlined />
          </a-button>
          <a-button @click="execCommand('underline')" :type="isActive('underline') ? 'primary' : 'default'">
            <underline-outlined />
          </a-button>
        </a-button-group>
        
        <a-button-group size="small">
          <a-button @click="execCommand('justifyLeft')" :type="isActive('justifyLeft') ? 'primary' : 'default'">
            <align-left-outlined />
          </a-button>
          <a-button @click="execCommand('justifyCenter')" :type="isActive('justifyCenter') ? 'primary' : 'default'">
            <align-center-outlined />
          </a-button>
          <a-button @click="execCommand('justifyRight')" :type="isActive('justifyRight') ? 'primary' : 'default'">
            <align-right-outlined />
          </a-button>
        </a-button-group>
        
        <a-button-group size="small">
          <a-button @click="execCommand('insertUnorderedList')">
            <unordered-list-outlined />
          </a-button>
          <a-button @click="execCommand('insertOrderedList')">
            <ordered-list-outlined />
          </a-button>
        </a-button-group>
        
        <a-select
          v-model:value="currentFontSize"
          size="small"
          style="width: 80px"
          @change="changeFontSize"
        >
          <a-select-option value="12px">12px</a-select-option>
          <a-select-option value="14px">14px</a-select-option>
          <a-select-option value="16px">16px</a-select-option>
          <a-select-option value="18px">18px</a-select-option>
          <a-select-option value="20px">20px</a-select-option>
          <a-select-option value="24px">24px</a-select-option>
        </a-select>
        
        <input
          type="color"
          v-model="currentColor"
          @change="changeColor"
          class="color-picker"
        />
      </a-space>
    </div>
    
    <div
      ref="editorRef"
      class="rich-text-editor"
      :class="{
        'editor-disabled': disabled,
        'editor-readonly': readOnly,
        [`editor-${size}`]: size
      }"
      :contenteditable="!disabled && !readOnly"
      :style="editorStyle"
      @input="handleInput"
      @focus="handleFocus"
      @blur="handleBlur"
      @keydown="handleKeydown"
      @paste="handlePaste"
    ></div>
    
    <div class="rich-text-footer" v-if="showWordCount">
      <span class="word-count">字数: {{ wordCount }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import {
  BoldOutlined,
  ItalicOutlined,
  UnderlineOutlined,
  AlignLeftOutlined,
  AlignCenterOutlined,
  AlignRightOutlined,
  UnorderedListOutlined,
  OrderedListOutlined
} from '@ant-design/icons-vue'
import { useControlMembers } from '../../control-members'

type SizeType = 'large' | 'middle' | 'small'

interface Props {
  // 基础属性
  modelValue?: string
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  
  // 显示属性
  size?: SizeType
  height?: string | number
  showToolbar?: boolean
  showWordCount?: boolean
  
  // 编辑器配置
  maxLength?: number
  autoFocus?: boolean
  
  // 控件通用属性
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'middle',
  height: '200px',
  showToolbar: true,
  showWordCount: false,
  autoFocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  change: [value: string]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  input: [event: Event]
}>()

// 使用控件成员钩子
const { emitEvent } = useControlMembers(props, emit)

// 编辑器引用
const editorRef = ref<HTMLElement>()

// 内部状态
const currentFontSize = ref('14px')
const currentColor = ref('#000000')

// 编辑器样式
const editorStyle = computed(() => ({
  height: typeof props.height === 'number' ? `${props.height}px` : props.height,
  minHeight: '100px'
}))

// 字数统计
const wordCount = computed(() => {
  if (!editorRef.value) return 0
  const text = editorRef.value.innerText || ''
  return text.length
})

// 监听外部值变化
watch(() => props.modelValue, (newValue) => {
  if (editorRef.value && editorRef.value.innerHTML !== newValue) {
    editorRef.value.innerHTML = newValue || ''
  }
}, { immediate: true })

// 组件挂载后处理
onMounted(() => {
  if (props.autoFocus && editorRef.value) {
    nextTick(() => {
      editorRef.value?.focus()
    })
  }
  
  // 设置占位符
  if (props.placeholder && editorRef.value) {
    editorRef.value.setAttribute('data-placeholder', props.placeholder)
  }
})

// 事件处理
const handleInput = (event: Event) => {
  const target = event.target as HTMLElement
  const value = target.innerHTML
  
  emit('update:modelValue', value)
  emit('change', value)
  emit('input', event)
  emitEvent('input', { value, event })
}

const handleFocus = (event: FocusEvent) => {
  emit('focus', event)
  emitEvent('focus', { event })
}

const handleBlur = (event: FocusEvent) => {
  emit('blur', event)
  emitEvent('blur', { event })
}

const handleKeydown = (event: KeyboardEvent) => {
  // 处理快捷键
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 'b':
        event.preventDefault()
        execCommand('bold')
        break
      case 'i':
        event.preventDefault()
        execCommand('italic')
        break
      case 'u':
        event.preventDefault()
        execCommand('underline')
        break
    }
  }
  
  // 检查最大长度
  if (props.maxLength && wordCount.value >= props.maxLength) {
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
      event.preventDefault()
    }
  }
}

const handlePaste = (event: ClipboardEvent) => {
  event.preventDefault()
  
  const clipboardData = event.clipboardData
  if (clipboardData) {
    const text = clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
  }
}

// 编辑器命令
const execCommand = (command: string, value?: string) => {
  if (props.disabled || props.readOnly) return
  
  document.execCommand(command, false, value)
  editorRef.value?.focus()
}

const isActive = (command: string): boolean => {
  return document.queryCommandState(command)
}

const changeFontSize = (size: string) => {
  execCommand('fontSize', '3')
  // 手动设置字体大小
  const selection = window.getSelection()
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0)
    const span = document.createElement('span')
    span.style.fontSize = size
    
    try {
      range.surroundContents(span)
    } catch (e) {
      span.appendChild(range.extractContents())
      range.insertNode(span)
    }
  }
}

const changeColor = () => {
  execCommand('foreColor', currentColor.value)
}

// 暴露的方法
const getValue = () => {
  return editorRef.value?.innerHTML || ''
}

const setValue = (value: string) => {
  if (editorRef.value) {
    editorRef.value.innerHTML = value
    emit('update:modelValue', value)
  }
}

const getText = () => {
  return editorRef.value?.innerText || ''
}

const clear = () => {
  if (editorRef.value) {
    editorRef.value.innerHTML = ''
    emit('update:modelValue', '')
  }
}

const focus = () => {
  editorRef.value?.focus()
}

const blur = () => {
  editorRef.value?.blur()
}

const insertText = (text: string) => {
  execCommand('insertText', text)
}

const insertHTML = (html: string) => {
  execCommand('insertHTML', html)
}

const undo = () => {
  execCommand('undo')
}

const redo = () => {
  execCommand('redo')
}

const selectAll = () => {
  execCommand('selectAll')
}

const validate = () => {
  const text = getText()
  
  if (props.maxLength && text.length > props.maxLength) {
    return false
  }
  
  return true
}

const reset = () => {
  clear()
}

// 暴露方法给父组件
defineExpose({
  getValue,
  setValue,
  getText,
  clear,
  focus,
  blur,
  insertText,
  insertHTML,
  undo,
  redo,
  selectAll,
  validate,
  reset,
  execCommand
})
</script>

<style scoped>
.control-rich-text {
  width: 100%;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.control-disabled {
  opacity: 0.6;
  pointer-events: none;
}

.rich-text-toolbar {
  padding: 8px 12px;
  background-color: #fafafa;
  border-bottom: 1px solid #d9d9d9;
}

.rich-text-editor {
  padding: 12px;
  outline: none;
  overflow-y: auto;
  line-height: 1.5;
  font-size: 14px;
  color: rgba(0, 0, 0, 0.85);
  background-color: #fff;
}

.rich-text-editor:empty:before {
  content: attr(data-placeholder);
  color: #bfbfbf;
  pointer-events: none;
}

.editor-disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.editor-readonly {
  background-color: #fafafa;
  cursor: default;
}

.editor-large {
  font-size: 16px;
  padding: 16px;
}

.editor-small {
  font-size: 12px;
  padding: 8px;
}

.rich-text-footer {
  padding: 4px 12px;
  background-color: #fafafa;
  border-top: 1px solid #d9d9d9;
  text-align: right;
}

.word-count {
  font-size: 12px;
  color: #8c8c8c;
}

.color-picker {
  width: 32px;
  height: 24px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
}

/* 设计器模式样式 */
.designer-mode .control-rich-text {
  min-height: 120px;
}

/* 编辑器内容样式 */
:deep(.rich-text-editor h1) {
  font-size: 24px;
  font-weight: bold;
  margin: 16px 0 8px 0;
}

:deep(.rich-text-editor h2) {
  font-size: 20px;
  font-weight: bold;
  margin: 14px 0 7px 0;
}

:deep(.rich-text-editor h3) {
  font-size: 18px;
  font-weight: bold;
  margin: 12px 0 6px 0;
}

:deep(.rich-text-editor p) {
  margin: 8px 0;
}

:deep(.rich-text-editor ul),
:deep(.rich-text-editor ol) {
  margin: 8px 0;
  padding-left: 24px;
}

:deep(.rich-text-editor li) {
  margin: 4px 0;
}

:deep(.rich-text-editor blockquote) {
  margin: 16px 0;
  padding: 8px 16px;
  border-left: 4px solid #1890ff;
  background-color: #f6f8fa;
}

:deep(.rich-text-editor code) {
  padding: 2px 4px;
  background-color: #f5f5f5;
  border-radius: 3px;
  font-family: 'Courier New', monospace;
}

:deep(.rich-text-editor pre) {
  margin: 16px 0;
  padding: 12px;
  background-color: #f5f5f5;
  border-radius: 6px;
  overflow-x: auto;
}

:deep(.rich-text-editor a) {
  color: #1890ff;
  text-decoration: none;
}

:deep(.rich-text-editor a:hover) {
  text-decoration: underline;
}

:deep(.rich-text-editor img) {
  max-width: 100%;
  height: auto;
}

:deep(.rich-text-editor table) {
  border-collapse: collapse;
  width: 100%;
  margin: 16px 0;
}

:deep(.rich-text-editor th),
:deep(.rich-text-editor td) {
  border: 1px solid #d9d9d9;
  padding: 8px 12px;
  text-align: left;
}

:deep(.rich-text-editor th) {
  background-color: #fafafa;
  font-weight: bold;
}
</style>