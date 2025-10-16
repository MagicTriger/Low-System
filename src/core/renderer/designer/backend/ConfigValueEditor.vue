<template>
  <div class="config-value-editor" :class="{ compact }">
    <!-- 字符串类型 -->
    <div v-if="config.type === 'string'" class="editor-wrapper">
      <input
        v-if="!isTextarea"
        v-model="localValue"
        type="text"
        class="value-input"
        :placeholder="placeholder"
        :readonly="config.readonly"
        @input="handleInput"
        @blur="handleBlur"
      />
      <textarea
        v-else
        v-model="localValue"
        class="value-textarea"
        :placeholder="placeholder"
        :readonly="config.readonly"
        :rows="textareaRows"
        @input="handleInput"
        @blur="handleBlur"
      ></textarea>
      
      <div v-if="hasStringOptions" class="string-options">
        <button
          v-for="option in stringOptions"
          :key="option"
          :class="['option-btn', { active: localValue === option }]"
          @click="selectOption(option)"
          :disabled="config.readonly"
        >
          {{ option }}
        </button>
      </div>
    </div>

    <!-- 数字类型 -->
    <div v-else-if="config.type === 'number'" class="editor-wrapper">
      <div class="number-input-wrapper">
        <input
          v-model.number="localValue"
          type="number"
          class="value-input"
          :min="numberMin"
          :max="numberMax"
          :step="numberStep"
          :placeholder="placeholder"
          :readonly="config.readonly"
          @input="handleInput"
          @blur="handleBlur"
        />
        
        <div v-if="showNumberControls" class="number-controls">
          <button
            class="number-btn"
            @click="incrementNumber"
            :disabled="config.readonly || (numberMax !== undefined && localValue >= numberMax)"
          >
            <i class="icon-plus"></i>
          </button>
          <button
            class="number-btn"
            @click="decrementNumber"
            :disabled="config.readonly || (numberMin !== undefined && localValue <= numberMin)"
          >
            <i class="icon-minus"></i>
          </button>
        </div>
      </div>
      
      <div v-if="showNumberSlider" class="number-slider">
        <input
          v-model.number="localValue"
          type="range"
          class="slider"
          :min="numberMin"
          :max="numberMax"
          :step="numberStep"
          :disabled="config.readonly"
          @input="handleInput"
        />
        <div class="slider-labels">
          <span>{{ numberMin }}</span>
          <span>{{ localValue }}</span>
          <span>{{ numberMax }}</span>
        </div>
      </div>
    </div>

    <!-- 布尔类型 -->
    <div v-else-if="config.type === 'boolean'" class="editor-wrapper">
      <div class="boolean-controls">
        <label class="switch" :class="{ disabled: config.readonly }">
          <input
            v-model="localValue"
            type="checkbox"
            :disabled="config.readonly"
            @change="handleInput"
          />
          <span class="slider-switch"></span>
        </label>
        
        <span class="boolean-label">
          {{ localValue ? '是' : '否' }}
        </span>
      </div>
      
      <div v-if="showBooleanButtons" class="boolean-buttons">
        <button
          :class="['bool-btn', { active: localValue === true }]"
          @click="setBooleanValue(true)"
          :disabled="config.readonly"
        >
          <i class="icon-check"></i>
          是
        </button>
        <button
          :class="['bool-btn', { active: localValue === false }]"
          @click="setBooleanValue(false)"
          :disabled="config.readonly"
        >
          <i class="icon-close"></i>
          否
        </button>
      </div>
    </div>

    <!-- 对象类型 -->
    <div v-else-if="config.type === 'object'" class="editor-wrapper">
      <div class="object-editor">
        <div class="editor-tabs">
          <button
            :class="['tab-btn', { active: objectViewMode === 'form' }]"
            @click="objectViewMode = 'form'"
          >
            <i class="icon-form"></i>
            表单
          </button>
          <button
            :class="['tab-btn', { active: objectViewMode === 'json' }]"
            @click="objectViewMode = 'json'"
          >
            <i class="icon-code"></i>
            JSON
          </button>
        </div>
        
        <!-- 表单视图 -->
        <div v-if="objectViewMode === 'form'" class="object-form">
          <div
            v-for="(value, key) in objectValue"
            :key="key"
            class="object-field"
          >
            <div class="field-header">
              <input
                v-model="key"
                type="text"
                class="field-key"
                placeholder="键名"
                :readonly="config.readonly"
                @blur="updateObjectKey(key, $event.target.value)"
              />
              <button
                class="remove-field-btn"
                @click="removeObjectField(key)"
                :disabled="config.readonly"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
            
            <input
              v-model="objectValue[key]"
              type="text"
              class="field-value"
              placeholder="值"
              :readonly="config.readonly"
              @input="updateObjectValue"
            />
          </div>
          
          <button
            class="add-field-btn"
            @click="addObjectField"
            :disabled="config.readonly"
          >
            <i class="icon-plus"></i>
            添加字段
          </button>
        </div>
        
        <!-- JSON 视图 -->
        <div v-else class="object-json">
          <textarea
            v-model="objectJsonValue"
            class="json-textarea"
            :readonly="config.readonly"
            @input="handleObjectJsonInput"
            @blur="handleBlur"
            placeholder="输入 JSON 对象..."
          ></textarea>
          
          <div v-if="objectJsonError" class="json-error">
            <i class="icon-warning"></i>
            {{ objectJsonError }}
          </div>
        </div>
      </div>
    </div>

    <!-- 数组类型 -->
    <div v-else-if="config.type === 'array'" class="editor-wrapper">
      <div class="array-editor">
        <div class="editor-tabs">
          <button
            :class="['tab-btn', { active: arrayViewMode === 'list' }]"
            @click="arrayViewMode = 'list'"
          >
            <i class="icon-list"></i>
            列表
          </button>
          <button
            :class="['tab-btn', { active: arrayViewMode === 'json' }]"
            @click="arrayViewMode = 'json'"
          >
            <i class="icon-code"></i>
            JSON
          </button>
        </div>
        
        <!-- 列表视图 -->
        <div v-if="arrayViewMode === 'list'" class="array-list">
          <div
            v-for="(item, index) in arrayValue"
            :key="index"
            class="array-item"
          >
            <div class="item-index">{{ index }}</div>
            <input
              v-model="arrayValue[index]"
              type="text"
              class="item-value"
              placeholder="值"
              :readonly="config.readonly"
              @input="updateArrayValue"
            />
            <div class="item-actions">
              <button
                class="action-btn"
                @click="moveArrayItem(index, -1)"
                :disabled="config.readonly || index === 0"
              >
                <i class="icon-arrow-up"></i>
              </button>
              <button
                class="action-btn"
                @click="moveArrayItem(index, 1)"
                :disabled="config.readonly || index === arrayValue.length - 1"
              >
                <i class="icon-arrow-down"></i>
              </button>
              <button
                class="action-btn danger"
                @click="removeArrayItem(index)"
                :disabled="config.readonly"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
          </div>
          
          <button
            class="add-item-btn"
            @click="addArrayItem"
            :disabled="config.readonly"
          >
            <i class="icon-plus"></i>
            添加项目
          </button>
        </div>
        
        <!-- JSON 视图 -->
        <div v-else class="array-json">
          <textarea
            v-model="arrayJsonValue"
            class="json-textarea"
            :readonly="config.readonly"
            @input="handleArrayJsonInput"
            @blur="handleBlur"
            placeholder="输入 JSON 数组..."
          ></textarea>
          
          <div v-if="arrayJsonError" class="json-error">
            <i class="icon-warning"></i>
            {{ arrayJsonError }}
          </div>
        </div>
      </div>
    </div>

    <!-- 颜色选择器（特殊字符串类型） -->
    <div v-if="isColorType" class="color-picker">
      <input
        v-model="localValue"
        type="color"
        class="color-input"
        :disabled="config.readonly"
        @input="handleInput"
      />
      <input
        v-model="localValue"
        type="text"
        class="color-text"
        :readonly="config.readonly"
        @input="handleInput"
        @blur="handleBlur"
      />
    </div>

    <!-- 文件选择器（特殊字符串类型） -->
    <div v-if="isFileType" class="file-picker">
      <input
        v-model="localValue"
        type="text"
        class="file-path"
        placeholder="选择文件..."
        :readonly="config.readonly"
        @input="handleInput"
        @blur="handleBlur"
      />
      <button
        class="file-browse-btn"
        @click="browseFile"
        :disabled="config.readonly"
      >
        <i class="icon-folder"></i>
        浏览
      </button>
    </div>

    <!-- 验证错误 -->
    <div v-if="validationError" class="validation-error">
      <i class="icon-warning"></i>
      {{ validationError }}
    </div>

    <!-- 帮助文本 -->
    <div v-if="config.help && !compact" class="help-text">
      <i class="icon-info"></i>
      {{ config.help }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'

// 接口定义
interface ConfigItem {
  key?: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  readonly?: boolean
  help?: string
  validation?: {
    min?: number
    max?: number
    step?: number
    pattern?: string
    options?: any[]
    required?: boolean
  }
  ui?: {
    widget?: 'textarea' | 'color' | 'file' | 'slider' | 'switch'
    rows?: number
    showControls?: boolean
    showSlider?: boolean
    showButtons?: boolean
  }
}

// Props
interface Props {
  config: ConfigItem
  value: any
  compact?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  compact: false
})

// Emits
const emit = defineEmits<{
  'update': [value: any]
  'blur': []
  'focus': []
}>()

// 响应式数据
const localValue = ref(props.value)
const objectViewMode = ref<'form' | 'json'>('form')
const arrayViewMode = ref<'list' | 'json'>('list')
const objectJsonValue = ref('')
const arrayJsonValue = ref('')
const objectJsonError = ref('')
const arrayJsonError = ref('')
const validationError = ref('')

// 计算属性
const placeholder = computed(() => {
  switch (props.config.type) {
    case 'string':
      return '输入文本...'
    case 'number':
      return '输入数字...'
    case 'boolean':
      return ''
    case 'object':
      return '输入对象...'
    case 'array':
      return '输入数组...'
    default:
      return ''
  }
})

const isTextarea = computed(() => {
  return props.config.ui?.widget === 'textarea'
})

const textareaRows = computed(() => {
  return props.config.ui?.rows || 3
})

const isColorType = computed(() => {
  return props.config.ui?.widget === 'color'
})

const isFileType = computed(() => {
  return props.config.ui?.widget === 'file'
})

const hasStringOptions = computed(() => {
  return props.config.validation?.options && props.config.type === 'string'
})

const stringOptions = computed(() => {
  return props.config.validation?.options || []
})

const numberMin = computed(() => {
  return props.config.validation?.min
})

const numberMax = computed(() => {
  return props.config.validation?.max
})

const numberStep = computed(() => {
  return props.config.validation?.step || 1
})

const showNumberControls = computed(() => {
  return props.config.ui?.showControls !== false && !props.compact
})

const showNumberSlider = computed(() => {
  return props.config.ui?.showSlider === true && 
         numberMin.value !== undefined && 
         numberMax.value !== undefined &&
         !props.compact
})

const showBooleanButtons = computed(() => {
  return props.config.ui?.showButtons === true && !props.compact
})

const objectValue = computed({
  get: () => {
    if (typeof localValue.value === 'object' && localValue.value !== null) {
      return localValue.value
    }
    return {}
  },
  set: (value) => {
    localValue.value = value
  }
})

const arrayValue = computed({
  get: () => {
    if (Array.isArray(localValue.value)) {
      return localValue.value
    }
    return []
  },
  set: (value) => {
    localValue.value = value
  }
})

// 方法
const handleInput = () => {
  validateValue()
  emit('update', localValue.value)
}

const handleBlur = () => {
  emit('blur')
}

const validateValue = () => {
  validationError.value = ''
  
  if (!props.config.validation) return true
  
  const validation = props.config.validation
  const value = localValue.value
  
  // 必需验证
  if (validation.required && (value === null || value === undefined || value === '')) {
    validationError.value = '此字段为必填项'
    return false
  }
  
  // 数字类型验证
  if (props.config.type === 'number' && typeof value === 'number') {
    if (validation.min !== undefined && value < validation.min) {
      validationError.value = `值不能小于 ${validation.min}`
      return false
    }
    
    if (validation.max !== undefined && value > validation.max) {
      validationError.value = `值不能大于 ${validation.max}`
      return false
    }
  }
  
  // 字符串类型验证
  if (props.config.type === 'string' && typeof value === 'string') {
    if (validation.pattern) {
      const regex = new RegExp(validation.pattern)
      if (!regex.test(value)) {
        validationError.value = '格式不正确'
        return false
      }
    }
    
    if (validation.options && !validation.options.includes(value)) {
      validationError.value = '请选择有效的选项'
      return false
    }
  }
  
  return true
}

// 字符串选项方法
const selectOption = (option: string) => {
  localValue.value = option
  handleInput()
}

// 数字控制方法
const incrementNumber = () => {
  const step = numberStep.value
  const newValue = (localValue.value || 0) + step
  
  if (numberMax.value === undefined || newValue <= numberMax.value) {
    localValue.value = newValue
    handleInput()
  }
}

const decrementNumber = () => {
  const step = numberStep.value
  const newValue = (localValue.value || 0) - step
  
  if (numberMin.value === undefined || newValue >= numberMin.value) {
    localValue.value = newValue
    handleInput()
  }
}

// 布尔值方法
const setBooleanValue = (value: boolean) => {
  localValue.value = value
  handleInput()
}

// 对象编辑方法
const updateObjectValue = () => {
  handleInput()
}

const addObjectField = () => {
  const newKey = `field_${Date.now()}`
  objectValue.value[newKey] = ''
  updateObjectValue()
}

const removeObjectField = (key: string) => {
  delete objectValue.value[key]
  updateObjectValue()
}

const updateObjectKey = (oldKey: string, newKey: string) => {
  if (oldKey !== newKey && newKey) {
    const value = objectValue.value[oldKey]
    delete objectValue.value[oldKey]
    objectValue.value[newKey] = value
    updateObjectValue()
  }
}

const handleObjectJsonInput = () => {
  try {
    const parsed = JSON.parse(objectJsonValue.value)
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      localValue.value = parsed
      objectJsonError.value = ''
      handleInput()
    } else {
      objectJsonError.value = '必须是有效的 JSON 对象'
    }
  } catch (error) {
    objectJsonError.value = '无效的 JSON 格式'
  }
}

// 数组编辑方法
const updateArrayValue = () => {
  handleInput()
}

const addArrayItem = () => {
  arrayValue.value.push('')
  updateArrayValue()
}

const removeArrayItem = (index: number) => {
  arrayValue.value.splice(index, 1)
  updateArrayValue()
}

const moveArrayItem = (index: number, direction: number) => {
  const newIndex = index + direction
  if (newIndex >= 0 && newIndex < arrayValue.value.length) {
    const item = arrayValue.value.splice(index, 1)[0]
    arrayValue.value.splice(newIndex, 0, item)
    updateArrayValue()
  }
}

const handleArrayJsonInput = () => {
  try {
    const parsed = JSON.parse(arrayJsonValue.value)
    if (Array.isArray(parsed)) {
      localValue.value = parsed
      arrayJsonError.value = ''
      handleInput()
    } else {
      arrayJsonError.value = '必须是有效的 JSON 数组'
    }
  } catch (error) {
    arrayJsonError.value = '无效的 JSON 格式'
  }
}

// 文件选择方法
const browseFile = () => {
  const input = document.createElement('input')
  input.type = 'file'
  
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (file) {
      localValue.value = file.name
      handleInput()
    }
  }
  
  input.click()
}

// 监听器
watch(() => props.value, (newValue) => {
  localValue.value = newValue
  
  // 更新 JSON 视图
  if (props.config.type === 'object') {
    objectJsonValue.value = JSON.stringify(newValue, null, 2)
  } else if (props.config.type === 'array') {
    arrayJsonValue.value = JSON.stringify(newValue, null, 2)
  }
}, { immediate: true })

watch(objectValue, () => {
  objectJsonValue.value = JSON.stringify(objectValue.value, null, 2)
}, { deep: true })

watch(arrayValue, () => {
  arrayJsonValue.value = JSON.stringify(arrayValue.value, null, 2)
}, { deep: true })
</script>

<style scoped>
.config-value-editor {
  width: 100%;
}

.config-value-editor.compact {
  font-size: 14px;
}

.editor-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 基础输入样式 */
.value-input,
.value-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
  transition: border-color 0.2s;
}

.value-input:focus,
.value-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.value-input:readonly,
.value-textarea:readonly {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.value-textarea {
  resize: vertical;
  min-height: 60px;
}

/* 字符串选项 */
.string-options {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.option-btn {
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.option-btn:hover {
  background: var(--bg-hover);
}

.option-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.option-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 数字输入 */
.number-input-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.number-controls {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.number-btn {
  padding: 4px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.number-btn:hover {
  background: var(--bg-hover);
}

.number-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.number-slider {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.slider {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-secondary);
  outline: none;
  cursor: pointer;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

/* 布尔值控件 */
.boolean-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider-switch {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--bg-secondary);
  transition: 0.2s;
  border-radius: 24px;
}

.slider-switch:before {
  position: absolute;
  content: "";
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
}

input:checked + .slider-switch {
  background-color: var(--primary-color);
}

input:checked + .slider-switch:before {
  transform: translateX(20px);
}

.switch.disabled {
  opacity: 0.5;
  pointer-events: none;
}

.boolean-label {
  font-weight: 500;
  color: var(--text-color);
}

.boolean-buttons {
  display: flex;
  gap: 8px;
}

.bool-btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.bool-btn:hover {
  background: var(--bg-hover);
}

.bool-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.bool-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 对象和数组编辑器 */
.object-editor,
.array-editor {
  border: 1px solid var(--border-color);
  border-radius: 6px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.tab-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
}

.tab-btn.active {
  background: var(--bg-color);
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

/* 对象表单 */
.object-form {
  padding: 12px;
}

.object-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.field-header {
  display: flex;
  gap: 8px;
  align-items: center;
}

.field-key {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 12px;
  font-weight: 500;
}

.remove-field-btn {
  padding: 4px;
  border: none;
  background: var(--error-color);
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.field-value {
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
}

.add-field-btn {
  padding: 8px 12px;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.add-field-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
  border-style: solid;
}

/* 数组列表 */
.array-list {
  padding: 12px;
}

.array-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  padding: 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.item-index {
  min-width: 24px;
  padding: 4px 8px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.item-value {
  flex: 1;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
}

.item-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 4px;
  border: none;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
}

.action-btn.danger:hover {
  background: var(--error-color);
  color: white;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.add-item-btn {
  padding: 8px 12px;
  border: 1px dashed var(--border-color);
  border-radius: 4px;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.add-item-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
  border-style: solid;
}

/* JSON 编辑器 */
.object-json,
.array-json {
  padding: 12px;
}

.json-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.4;
  resize: vertical;
}

.json-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: var(--error-bg);
  color: var(--error-color);
  border-radius: 4px;
  margin-top: 8px;
  font-size: 12px;
}

/* 颜色选择器 */
.color-picker {
  display: flex;
  gap: 8px;
  align-items: center;
}

.color-input {
  width: 40px;
  height: 32px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
}

.color-text {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: 'Consolas', monospace;
}

/* 文件选择器 */
.file-picker {
  display: flex;
  gap: 8px;
  align-items: center;
}

.file-path {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
}

.file-browse-btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-secondary);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.file-browse-btn:hover {
  background: var(--bg-hover);
}

.file-browse-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 验证错误 */
.validation-error {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--error-bg);
  color: var(--error-color);
  border-radius: 4px;
  font-size: 12px;
}

/* 帮助文本 */
.help-text {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--info-bg);
  color: var(--info-color);
  border-radius: 4px;
  font-size: 12px;
}

/* 深色主题 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #1a1a1a;
    --bg-secondary: #2d2d2d;
    --bg-hover: #3d3d3d;
    --text-color: #ffffff;
    --text-secondary: #b3b3b3;
    --border-color: #404040;
    --primary-color: #0066cc;
    --error-color: #ff4444;
    --error-bg: #2d1b1b;
    --info-color: #4da6ff;
    --info-bg: #1b2a3d;
  }
}

/* 紧凑模式 */
.config-value-editor.compact .value-input,
.config-value-editor.compact .value-textarea {
  padding: 6px 8px;
  font-size: 13px;
}

.config-value-editor.compact .editor-tabs {
  display: none;
}

.config-value-editor.compact .object-form,
.config-value-editor.compact .array-list {
  padding: 8px;
}

.config-value-editor.compact .object-field,
.config-value-editor.compact .array-item {
  padding: 6px;
  margin-bottom: 6px;
}
</style>