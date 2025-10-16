<template>
  <div class="text-input-control" :class="{ 'has-error': hasError, 'is-disabled': disabled }">
    <label v-if="label" class="control-label" :class="{ required: required }">
      {{ label }}
    </label>
    
    <div class="input-wrapper">
      <input
        ref="inputRef"
        v-model="inputValue"
        :type="inputType"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxLength"
        :minlength="minLength"
        :class="[
          'text-input',
          `size-${size}`,
          {
            'has-prefix': $slots.prefix || prefixIcon,
            'has-suffix': $slots.suffix || suffixIcon || showClear,
            'is-focused': isFocused
          }
        ]"
        @input="handleInput"
        @change="handleChange"
        @focus="handleFocus"
        @blur="handleBlur"
        @keydown="handleKeydown"
        @keyup="handleKeyup"
      />
      
      <!-- 前缀图标 -->
      <span v-if="prefixIcon || $slots.prefix" class="input-prefix">
        <slot name="prefix">
          <Icon v-if="prefixIcon" :name="prefixIcon" />
        </slot>
      </span>
      
      <!-- 后缀图标 -->
      <span v-if="suffixIcon || $slots.suffix || showClear" class="input-suffix">
        <Icon
          v-if="showClear && inputValue && !disabled"
          name="close-circle"
          class="clear-icon"
          @click="handleClear"
        />
        <slot name="suffix">
          <Icon v-if="suffixIcon" :name="suffixIcon" />
        </slot>
      </span>
      
      <!-- 字数统计 -->
      <div v-if="showCount && maxLength" class="input-count">
        {{ inputValue?.length || 0 }}/{{ maxLength }}
      </div>
    </div>
    
    <!-- 错误信息 -->
    <div v-if="hasError && errorMessage" class="error-message">
      {{ errorMessage }}
    </div>
    
    <!-- 帮助文本 -->
    <div v-if="helpText && !hasError" class="help-text">
      {{ helpText }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@/core/components'
import { useControlMembers } from '../../control-members'

// Props
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  size?: 'small' | 'medium' | 'large'
  type?: 'text' | 'email' | 'url' | 'tel' | 'search'
  maxLength?: number
  minLength?: number
  prefixIcon?: string
  suffixIcon?: string
  showClear?: boolean
  showCount?: boolean
  helpText?: string
  errorMessage?: string
  validateTrigger?: 'input' | 'change' | 'blur'
  formatter?: (value: string) => string
  parser?: (value: string) => string
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  size: 'medium',
  type: 'text',
  showClear: false,
  showCount: false,
  validateTrigger: 'change'
})

// Emits
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'input': [value: string, event: Event]
  'change': [value: string, event: Event]
  'focus': [event: FocusEvent]
  'blur': [event: FocusEvent]
  'clear': []
  'keydown': [event: KeyboardEvent]
  'keyup': [event: KeyboardEvent]
}>()

// 使用控件成员
const { validate, hasError } = useControlMembers()

// 响应式数据
const inputRef = ref<HTMLInputElement>()
const isFocused = ref(false)

// 计算属性
const inputValue = computed({
  get: () => props.modelValue,
  set: (value: string) => {
    emit('update:modelValue', value)
  }
})

const inputType = computed(() => {
  return props.type || 'text'
})

// 方法
const handleInput = (event: Event) => {
  const target = event.target as HTMLInputElement
  let value = target.value
  
  // 应用解析器
  if (props.parser) {
    value = props.parser(value)
  }
  
  // 应用格式化器
  if (props.formatter) {
    value = props.formatter(value)
    // 如果格式化后的值与输入值不同，需要更新输入框
    if (value !== target.value) {
      nextTick(() => {
        if (inputRef.value) {
          inputRef.value.value = value
        }
      })
    }
  }
  
  inputValue.value = value
  emit('input', value, event)
  
  // 输入时验证
  if (props.validateTrigger === 'input') {
    validate()
  }
}

const handleChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const value = target.value
  
  emit('change', value, event)
  
  // 改变时验证
  if (props.validateTrigger === 'change') {
    validate()
  }
}

const handleFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const handleBlur = (event: FocusEvent) => {
  isFocused.value = false
  emit('blur', event)
  
  // 失焦时验证
  if (props.validateTrigger === 'blur') {
    validate()
  }
}

const handleClear = () => {
  inputValue.value = ''
  emit('clear')
  
  // 清空后聚焦
  nextTick(() => {
    if (inputRef.value) {
      inputRef.value.focus()
    }
  })
}

const handleKeydown = (event: KeyboardEvent) => {
  emit('keydown', event)
}

const handleKeyup = (event: KeyboardEvent) => {
  emit('keyup', event)
}

// 公开方法
const focus = () => {
  if (inputRef.value) {
    inputRef.value.focus()
  }
}

const blur = () => {
  if (inputRef.value) {
    inputRef.value.blur()
  }
}

const select = () => {
  if (inputRef.value) {
    inputRef.value.select()
  }
}

// 暴露方法
defineExpose({
  focus,
  blur,
  select,
  inputRef
})

// 监听值变化
watch(() => props.modelValue, (newValue) => {
  if (props.formatter && inputRef.value && inputRef.value.value !== newValue) {
    inputRef.value.value = newValue || ''
  }
})
</script>

<style scoped>
.text-input-control {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.control-label {
  font-size: 14px;
  font-weight: 500;
  color: #374151;
  line-height: 1.4;
}

.control-label.required::after {
  content: ' *';
  color: #ef4444;
}

.input-wrapper {
  position: relative;
  display: inline-block;
}

.text-input {
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  color: #374151;
  font-size: 14px;
  line-height: 1.5;
  transition: all 0.2s ease;
  outline: none;
}

.text-input:hover {
  border-color: #9ca3af;
}

.text-input:focus,
.text-input.is-focused {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.text-input:disabled {
  background: #f9fafb;
  color: #9ca3af;
  cursor: not-allowed;
}

.text-input:disabled:hover {
  border-color: #d1d5db;
}

.text-input::placeholder {
  color: #9ca3af;
}

/* 尺寸变体 */
.text-input.size-small {
  padding: 6px 12px;
  font-size: 12px;
}

.text-input.size-medium {
  padding: 8px 12px;
  font-size: 14px;
}

.text-input.size-large {
  padding: 10px 16px;
  font-size: 16px;
}

/* 带前缀/后缀的输入框 */
.text-input.has-prefix {
  padding-left: 36px;
}

.text-input.has-suffix {
  padding-right: 36px;
}

.text-input.size-small.has-prefix {
  padding-left: 32px;
}

.text-input.size-small.has-suffix {
  padding-right: 32px;
}

.text-input.size-large.has-prefix {
  padding-left: 40px;
}

.text-input.size-large.has-suffix {
  padding-right: 40px;
}

/* 前缀和后缀 */
.input-prefix,
.input-suffix {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  color: #6b7280;
  pointer-events: none;
}

.input-prefix {
  left: 12px;
}

.input-suffix {
  right: 12px;
}

.clear-icon {
  cursor: pointer;
  pointer-events: auto;
  color: #9ca3af;
  transition: color 0.2s;
}

.clear-icon:hover {
  color: #6b7280;
}

/* 字数统计 */
.input-count {
  position: absolute;
  bottom: -20px;
  right: 0;
  font-size: 12px;
  color: #6b7280;
}

/* 错误状态 */
.text-input-control.has-error .text-input {
  border-color: #ef4444;
}

.text-input-control.has-error .text-input:focus {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.error-message {
  font-size: 12px;
  color: #ef4444;
  line-height: 1.4;
}

/* 帮助文本 */
.help-text {
  font-size: 12px;
  color: #6b7280;
  line-height: 1.4;
}

/* 禁用状态 */
.text-input-control.is-disabled {
  opacity: 0.6;
}

.text-input-control.is-disabled .input-prefix,
.text-input-control.is-disabled .input-suffix {
  color: #9ca3af;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .text-input {
    font-size: 16px; /* 防止iOS缩放 */
  }
  
  .text-input.size-small {
    font-size: 14px;
  }
  
  .text-input.size-medium {
    font-size: 16px;
  }
  
  .text-input.size-large {
    font-size: 18px;
  }
}

/* 暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .text-input {
    background: #1f2937;
    border-color: #374151;
    color: #f9fafb;
  }
  
  .text-input:hover {
    border-color: #4b5563;
  }
  
  .text-input:focus {
    border-color: #3b82f6;
  }
  
  .text-input:disabled {
    background: #111827;
    color: #6b7280;
  }
  
  .text-input::placeholder {
    color: #6b7280;
  }
  
  .control-label {
    color: #f9fafb;
  }
  
  .help-text {
    color: #9ca3af;
  }
}
</style>