<template>
  <div class="state-manager" :class="{ 'dark': isDark }">
    <!-- 状态管理工具栏 -->
    <div class="state-toolbar">
      <div class="toolbar-left">
        <h3 class="toolbar-title">
          <i class="icon-state"></i>
          状态管理器
        </h3>
        <div class="state-stats">
          <span class="stat-item">
            <i class="icon-component"></i>
            {{ Object.keys(states).length }} 个状态
          </span>
          <span class="stat-item">
            <i class="icon-history"></i>
            {{ historyStack.length }} 个历史
          </span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <button 
          class="btn btn-icon" 
          @click="toggleAutoSave"
          :class="{ active: autoSave }"
          title="自动保存"
        >
          <i class="icon-auto-save"></i>
        </button>
        
        <button 
          class="btn btn-icon" 
          @click="saveSnapshot"
          title="保存快照"
        >
          <i class="icon-snapshot"></i>
        </button>
        
        <button 
          class="btn btn-icon" 
          @click="loadSnapshot"
          title="加载快照"
        >
          <i class="icon-load"></i>
        </button>
        
        <button 
          class="btn btn-icon" 
          @click="clearStates"
          title="清空状态"
        >
          <i class="icon-clear"></i>
        </button>
        
        <div class="divider"></div>
        
        <button 
          class="btn btn-icon" 
          @click="undo"
          :disabled="!canUndo"
          title="撤销"
        >
          <i class="icon-undo"></i>
        </button>
        
        <button 
          class="btn btn-icon" 
          @click="redo"
          :disabled="!canRedo"
          title="重做"
        >
          <i class="icon-redo"></i>
        </button>
      </div>
    </div>

    <!-- 状态列表 -->
    <div class="state-content">
      <div class="state-search">
        <div class="search-input">
          <i class="icon-search"></i>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="搜索状态..."
            @input="handleSearch"
          >
          <button 
            v-if="searchQuery" 
            class="clear-search"
            @click="clearSearch"
          >
            <i class="icon-close"></i>
          </button>
        </div>
        
        <div class="search-filters">
          <select v-model="filterType" @change="handleFilter">
            <option value="">所有类型</option>
            <option value="component">组件状态</option>
            <option value="global">全局状态</option>
            <option value="user">用户状态</option>
            <option value="system">系统状态</option>
          </select>
          
          <select v-model="sortBy" @change="handleSort">
            <option value="name">按名称</option>
            <option value="type">按类型</option>
            <option value="updated">按更新时间</option>
            <option value="size">按大小</option>
          </select>
        </div>
      </div>

      <div class="state-list" v-if="filteredStates.length > 0">
        <div 
          v-for="state in filteredStates" 
          :key="state.key"
          class="state-item"
          :class="{ 
            selected: selectedStates.includes(state.key),
            modified: state.modified,
            readonly: state.readonly
          }"
          @click="selectState(state.key)"
        >
          <div class="state-header">
            <div class="state-info">
              <i :class="getStateIcon(state.type)"></i>
              <span class="state-name">{{ state.name }}</span>
              <span class="state-type">{{ state.type }}</span>
            </div>
            
            <div class="state-actions">
              <button 
                class="btn-action" 
                @click.stop="editState(state.key)"
                title="编辑"
              >
                <i class="icon-edit"></i>
              </button>
              
              <button 
                class="btn-action" 
                @click.stop="duplicateState(state.key)"
                title="复制"
              >
                <i class="icon-copy"></i>
              </button>
              
              <button 
                class="btn-action" 
                @click.stop="deleteState(state.key)"
                title="删除"
                :disabled="state.readonly"
              >
                <i class="icon-delete"></i>
              </button>
            </div>
          </div>
          
          <div class="state-meta">
            <span class="meta-item">
              <i class="icon-size"></i>
              {{ formatSize(state.size) }}
            </span>
            <span class="meta-item">
              <i class="icon-time"></i>
              {{ formatTime(state.updatedAt) }}
            </span>
            <span v-if="state.watchers > 0" class="meta-item">
              <i class="icon-watch"></i>
              {{ state.watchers }} 个监听器
            </span>
          </div>
          
          <div class="state-preview" v-if="state.preview">
            <pre>{{ state.preview }}</pre>
          </div>
        </div>
      </div>

      <div v-else class="empty-state">
        <div class="empty-icon">
          <i class="icon-empty-state"></i>
        </div>
        <h4>{{ searchQuery ? '未找到匹配的状态' : '暂无状态数据' }}</h4>
        <p>{{ searchQuery ? '尝试调整搜索条件' : '开始创建你的第一个状态' }}</p>
        <button v-if="!searchQuery" class="btn btn-primary" @click="createState">
          <i class="icon-add"></i>
          创建状态
        </button>
      </div>
    </div>

    <!-- 状态编辑器 -->
    <div v-if="editingState" class="state-editor-overlay" @click="closeEditor">
      <div class="state-editor" @click.stop>
        <div class="editor-header">
          <h4>{{ editingState.isNew ? '创建状态' : '编辑状态' }}</h4>
          <button class="btn-close" @click="closeEditor">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <div class="editor-content">
          <div class="form-group">
            <label>状态名称</label>
            <input 
              v-model="editingState.name"
              type="text" 
              placeholder="输入状态名称"
              :disabled="!editingState.isNew && editingState.readonly"
            >
          </div>
          
          <div class="form-group">
            <label>状态类型</label>
            <select 
              v-model="editingState.type"
              :disabled="!editingState.isNew"
            >
              <option value="component">组件状态</option>
              <option value="global">全局状态</option>
              <option value="user">用户状态</option>
              <option value="system">系统状态</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>状态描述</label>
            <textarea 
              v-model="editingState.description"
              placeholder="输入状态描述"
              rows="3"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>状态值</label>
            <div class="value-editor">
              <div class="editor-tabs">
                <button 
                  class="tab-btn"
                  :class="{ active: valueEditorMode === 'visual' }"
                  @click="valueEditorMode = 'visual'"
                >
                  可视化
                </button>
                <button 
                  class="tab-btn"
                  :class="{ active: valueEditorMode === 'json' }"
                  @click="valueEditorMode = 'json'"
                >
                  JSON
                </button>
              </div>
              
              <div v-if="valueEditorMode === 'visual'" class="visual-editor">
                <div v-if="editingState.type === 'component'" class="component-editor">
                  <!-- 组件状态编辑器 -->
                  <div class="form-row">
                    <div class="form-col">
                      <label>组件ID</label>
                      <input v-model="editingState.value.id" type="text">
                    </div>
                    <div class="form-col">
                      <label>组件类型</label>
                      <input v-model="editingState.value.type" type="text">
                    </div>
                  </div>
                  
                  <div class="form-group">
                    <label>可见性</label>
                    <label class="checkbox">
                      <input 
                        v-model="editingState.value.visible" 
                        type="checkbox"
                      >
                      <span>可见</span>
                    </label>
                  </div>
                  
                  <div class="form-group">
                    <label>锁定状态</label>
                    <label class="checkbox">
                      <input 
                        v-model="editingState.value.locked" 
                        type="checkbox"
                      >
                      <span>锁定</span>
                    </label>
                  </div>
                </div>
                
                <div v-else class="generic-editor">
                  <div class="key-value-editor">
                    <div 
                      v-for="(value, key, index) in editingState.value" 
                      :key="index"
                      class="kv-row"
                    >
                      <input 
                        v-model="editingState.value[key]"
                        :placeholder="`${key} 的值`"
                        class="value-input"
                      >
                      <button 
                        class="btn-remove"
                        @click="removeValueKey(key)"
                      >
                        <i class="icon-remove"></i>
                      </button>
                    </div>
                    
                    <button class="btn btn-secondary" @click="addValueKey">
                      <i class="icon-add"></i>
                      添加属性
                    </button>
                  </div>
                </div>
              </div>
              
              <div v-else class="json-editor">
                <textarea 
                  v-model="jsonValue"
                  class="json-textarea"
                  rows="10"
                  @input="validateJson"
                ></textarea>
                <div v-if="jsonError" class="json-error">
                  {{ jsonError }}
                </div>
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label class="checkbox">
              <input 
                v-model="editingState.persistent" 
                type="checkbox"
              >
              <span>持久化存储</span>
            </label>
          </div>
          
          <div class="form-group">
            <label class="checkbox">
              <input 
                v-model="editingState.readonly" 
                type="checkbox"
              >
              <span>只读状态</span>
            </label>
          </div>
        </div>
        
        <div class="editor-footer">
          <button class="btn btn-secondary" @click="closeEditor">
            取消
          </button>
          <button 
            class="btn btn-primary" 
            @click="saveState"
            :disabled="!isValidState"
          >
            {{ editingState.isNew ? '创建' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 快照管理器 -->
    <div v-if="showSnapshotManager" class="snapshot-overlay" @click="closeSnapshotManager">
      <div class="snapshot-manager" @click.stop>
        <div class="manager-header">
          <h4>快照管理</h4>
          <button class="btn-close" @click="closeSnapshotManager">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <div class="manager-content">
          <div class="snapshot-list">
            <div 
              v-for="snapshot in snapshots" 
              :key="snapshot.id"
              class="snapshot-item"
              @click="selectSnapshot(snapshot.id)"
              :class="{ selected: selectedSnapshot === snapshot.id }"
            >
              <div class="snapshot-info">
                <h5>{{ snapshot.name }}</h5>
                <p>{{ snapshot.description }}</p>
                <div class="snapshot-meta">
                  <span>{{ formatTime(snapshot.createdAt) }}</span>
                  <span>{{ snapshot.stateCount }} 个状态</span>
                  <span>{{ formatSize(snapshot.size) }}</span>
                </div>
              </div>
              
              <div class="snapshot-actions">
                <button 
                  class="btn-action"
                  @click.stop="loadSnapshotById(snapshot.id)"
                  title="加载快照"
                >
                  <i class="icon-load"></i>
                </button>
                
                <button 
                  class="btn-action"
                  @click.stop="deleteSnapshot(snapshot.id)"
                  title="删除快照"
                >
                  <i class="icon-delete"></i>
                </button>
              </div>
            </div>
          </div>
          
          <div v-if="snapshots.length === 0" class="empty-snapshots">
            <i class="icon-empty"></i>
            <p>暂无快照</p>
          </div>
        </div>
        
        <div class="manager-footer">
          <button class="btn btn-secondary" @click="closeSnapshotManager">
            关闭
          </button>
          <button 
            class="btn btn-primary" 
            @click="createSnapshot"
          >
            <i class="icon-add"></i>
            创建快照
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useEventBus, EventTypes } from './EventBus'

// Props
interface Props {
  isDark?: boolean
  autoSave?: boolean
  maxHistory?: number
}

const props = withDefaults(defineProps<Props>(), {
  isDark: false,
  autoSave: true,
  maxHistory: 50
})

// Emits
const emit = defineEmits<{
  'state-changed': [key: string, value: any]
  'state-created': [key: string, state: StateItem]
  'state-deleted': [key: string]
  'snapshot-created': [snapshot: Snapshot]
  'snapshot-loaded': [snapshot: Snapshot]
}>()

// 状态接口定义
interface StateItem {
  key: string
  name: string
  type: 'component' | 'global' | 'user' | 'system'
  value: any
  description?: string
  persistent: boolean
  readonly: boolean
  size: number
  createdAt: number
  updatedAt: number
  watchers: number
  modified: boolean
  preview?: string
}

interface Snapshot {
  id: string
  name: string
  description: string
  states: Record<string, StateItem>
  createdAt: number
  size: number
  stateCount: number
}

interface HistoryItem {
  action: 'create' | 'update' | 'delete'
  key: string
  oldValue?: any
  newValue?: any
  timestamp: number
}

// 响应式数据
const states = reactive<Record<string, StateItem>>({})
const historyStack = ref<HistoryItem[]>([])
const historyIndex = ref(-1)
const snapshots = ref<Snapshot[]>([])

const searchQuery = ref('')
const filterType = ref('')
const sortBy = ref('name')
const selectedStates = ref<string[]>([])
const autoSave = ref(props.autoSave)

const editingState = ref<StateItem & { isNew?: boolean } | null>(null)
const valueEditorMode = ref<'visual' | 'json'>('visual')
const jsonValue = ref('')
const jsonError = ref('')

const showSnapshotManager = ref(false)
const selectedSnapshot = ref('')

// 事件总线
const { eventBus, useEventListener } = useEventBus()

// 计算属性
const filteredStates = computed(() => {
  let result = Object.values(states)
  
  // 搜索过滤
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(state => 
      state.name.toLowerCase().includes(query) ||
      state.description?.toLowerCase().includes(query) ||
      state.type.toLowerCase().includes(query)
    )
  }
  
  // 类型过滤
  if (filterType.value) {
    result = result.filter(state => state.type === filterType.value)
  }
  
  // 排序
  result.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'type':
        return a.type.localeCompare(b.type)
      case 'updated':
        return b.updatedAt - a.updatedAt
      case 'size':
        return b.size - a.size
      default:
        return 0
    }
  })
  
  return result
})

const canUndo = computed(() => historyIndex.value >= 0)
const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

const isValidState = computed(() => {
  if (!editingState.value) return false
  
  return editingState.value.name.trim() !== '' && 
         editingState.value.type !== '' &&
         !jsonError.value
})

// 方法
const createState = () => {
  editingState.value = {
    key: generateStateKey(),
    name: '',
    type: 'global',
    value: {},
    description: '',
    persistent: false,
    readonly: false,
    size: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    watchers: 0,
    modified: false,
    isNew: true
  }
  valueEditorMode.value = 'visual'
  updateJsonValue()
}

const editState = (key: string) => {
  const state = states[key]
  if (state) {
    editingState.value = { ...state, isNew: false }
    valueEditorMode.value = 'visual'
    updateJsonValue()
  }
}

const saveState = () => {
  if (!editingState.value || !isValidState.value) return
  
  const state = editingState.value
  
  // 解析 JSON 值
  if (valueEditorMode.value === 'json') {
    try {
      state.value = JSON.parse(jsonValue.value)
    } catch (error) {
      jsonError.value = '无效的 JSON 格式'
      return
    }
  }
  
  // 计算状态大小
  state.size = calculateStateSize(state.value)
  state.updatedAt = Date.now()
  state.preview = generatePreview(state.value)
  
  if (state.isNew) {
    // 创建新状态
    delete state.isNew
    states[state.key] = state as StateItem
    addToHistory('create', state.key, undefined, state.value)
    emit('state-created', state.key, state as StateItem)
  } else {
    // 更新现有状态
    const oldValue = states[state.key]?.value
    states[state.key] = state as StateItem
    addToHistory('update', state.key, oldValue, state.value)
    emit('state-changed', state.key, state.value)
  }
  
  // 触发事件
  eventBus.emit(EventTypes.DATA_UPDATED, {
    key: state.key,
    value: state.value,
    type: state.type
  })
  
  // 自动保存
  if (autoSave.value && state.persistent) {
    saveToStorage(state.key, state as StateItem)
  }
  
  closeEditor()
}

const deleteState = (key: string) => {
  const state = states[key]
  if (state && !state.readonly) {
    if (confirm(`确定要删除状态 "${state.name}" 吗？`)) {
      addToHistory('delete', key, state.value, undefined)
      delete states[key]
      
      // 从选择中移除
      const index = selectedStates.value.indexOf(key)
      if (index > -1) {
        selectedStates.value.splice(index, 1)
      }
      
      // 从存储中删除
      if (state.persistent) {
        removeFromStorage(key)
      }
      
      emit('state-deleted', key)
      eventBus.emit(EventTypes.DATA_UPDATED, { key, deleted: true })
    }
  }
}

const duplicateState = (key: string) => {
  const state = states[key]
  if (state) {
    const newKey = generateStateKey()
    const newState: StateItem = {
      ...state,
      key: newKey,
      name: `${state.name} 副本`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      modified: false
    }
    
    states[newKey] = newState
    addToHistory('create', newKey, undefined, newState.value)
    emit('state-created', newKey, newState)
  }
}

const selectState = (key: string) => {
  const index = selectedStates.value.indexOf(key)
  if (index > -1) {
    selectedStates.value.splice(index, 1)
  } else {
    selectedStates.value.push(key)
  }
}

const clearStates = () => {
  if (confirm('确定要清空所有状态吗？此操作不可撤销。')) {
    Object.keys(states).forEach(key => {
      if (!states[key].readonly) {
        delete states[key]
      }
    })
    selectedStates.value = []
    historyStack.value = []
    historyIndex.value = -1
  }
}

const undo = () => {
  if (!canUndo.value) return
  
  const historyItem = historyStack.value[historyIndex.value]
  
  switch (historyItem.action) {
    case 'create':
      delete states[historyItem.key]
      break
    case 'update':
      if (historyItem.oldValue !== undefined) {
        states[historyItem.key].value = historyItem.oldValue
        states[historyItem.key].updatedAt = Date.now()
      }
      break
    case 'delete':
      if (historyItem.oldValue !== undefined) {
        // 重新创建已删除的状态
        const restoredState: StateItem = {
          key: historyItem.key,
          name: `恢复的状态 ${historyItem.key}`,
          type: 'global',
          value: historyItem.oldValue,
          persistent: false,
          readonly: false,
          size: calculateStateSize(historyItem.oldValue),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          watchers: 0,
          modified: false
        }
        states[historyItem.key] = restoredState
      }
      break
  }
  
  historyIndex.value--
}

const redo = () => {
  if (!canRedo.value) return
  
  historyIndex.value++
  const historyItem = historyStack.value[historyIndex.value]
  
  switch (historyItem.action) {
    case 'create':
      if (historyItem.newValue !== undefined) {
        const newState: StateItem = {
          key: historyItem.key,
          name: `重做的状态 ${historyItem.key}`,
          type: 'global',
          value: historyItem.newValue,
          persistent: false,
          readonly: false,
          size: calculateStateSize(historyItem.newValue),
          createdAt: Date.now(),
          updatedAt: Date.now(),
          watchers: 0,
          modified: false
        }
        states[historyItem.key] = newState
      }
      break
    case 'update':
      if (historyItem.newValue !== undefined) {
        states[historyItem.key].value = historyItem.newValue
        states[historyItem.key].updatedAt = Date.now()
      }
      break
    case 'delete':
      delete states[historyItem.key]
      break
  }
}

const saveSnapshot = () => {
  const snapshot: Snapshot = {
    id: generateSnapshotId(),
    name: `快照 ${new Date().toLocaleString()}`,
    description: `包含 ${Object.keys(states).length} 个状态的快照`,
    states: { ...states },
    createdAt: Date.now(),
    size: calculateSnapshotSize(states),
    stateCount: Object.keys(states).length
  }
  
  snapshots.value.push(snapshot)
  saveSnapshotsToStorage()
  emit('snapshot-created', snapshot)
}

const loadSnapshot = () => {
  showSnapshotManager.value = true
}

const loadSnapshotById = (id: string) => {
  const snapshot = snapshots.value.find(s => s.id === id)
  if (snapshot) {
    // 清空当前状态
    Object.keys(states).forEach(key => {
      delete states[key]
    })
    
    // 加载快照状态
    Object.assign(states, snapshot.states)
    
    // 清空历史
    historyStack.value = []
    historyIndex.value = -1
    
    emit('snapshot-loaded', snapshot)
    closeSnapshotManager()
  }
}

const createSnapshot = () => {
  const name = prompt('请输入快照名称：')
  if (name) {
    const snapshot: Snapshot = {
      id: generateSnapshotId(),
      name,
      description: prompt('请输入快照描述（可选）：') || '',
      states: { ...states },
      createdAt: Date.now(),
      size: calculateSnapshotSize(states),
      stateCount: Object.keys(states).length
    }
    
    snapshots.value.push(snapshot)
    saveSnapshotsToStorage()
    emit('snapshot-created', snapshot)
  }
}

const deleteSnapshot = (id: string) => {
  const index = snapshots.value.findIndex(s => s.id === id)
  if (index > -1) {
    if (confirm('确定要删除此快照吗？')) {
      snapshots.value.splice(index, 1)
      saveSnapshotsToStorage()
    }
  }
}

const selectSnapshot = (id: string) => {
  selectedSnapshot.value = selectedSnapshot.value === id ? '' : id
}

const closeSnapshotManager = () => {
  showSnapshotManager.value = false
  selectedSnapshot.value = ''
}

const toggleAutoSave = () => {
  autoSave.value = !autoSave.value
}

const handleSearch = () => {
  // 搜索逻辑已在计算属性中处理
}

const clearSearch = () => {
  searchQuery.value = ''
}

const handleFilter = () => {
  // 过滤逻辑已在计算属性中处理
}

const handleSort = () => {
  // 排序逻辑已在计算属性中处理
}

const closeEditor = () => {
  editingState.value = null
  jsonError.value = ''
}

const updateJsonValue = () => {
  if (editingState.value) {
    try {
      jsonValue.value = JSON.stringify(editingState.value.value, null, 2)
      jsonError.value = ''
    } catch (error) {
      jsonError.value = '无法序列化状态值'
    }
  }
}

const validateJson = () => {
  try {
    JSON.parse(jsonValue.value)
    jsonError.value = ''
  } catch (error) {
    jsonError.value = '无效的 JSON 格式'
  }
}

const addValueKey = () => {
  if (editingState.value) {
    const key = prompt('请输入属性名：')
    if (key && !editingState.value.value.hasOwnProperty(key)) {
      editingState.value.value[key] = ''
    }
  }
}

const removeValueKey = (key: string) => {
  if (editingState.value && editingState.value.value.hasOwnProperty(key)) {
    delete editingState.value.value[key]
  }
}

// 工具函数
const getStateIcon = (type: string): string => {
  const icons = {
    component: 'icon-component',
    global: 'icon-global',
    user: 'icon-user',
    system: 'icon-system'
  }
  return icons[type as keyof typeof icons] || 'icon-state'
}

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleString()
}

const calculateStateSize = (value: any): number => {
  return new Blob([JSON.stringify(value)]).size
}

const calculateSnapshotSize = (states: Record<string, StateItem>): number => {
  return new Blob([JSON.stringify(states)]).size
}

const generatePreview = (value: any): string => {
  const str = JSON.stringify(value, null, 2)
  return str.length > 100 ? str.substring(0, 100) + '...' : str
}

const generateStateKey = (): string => {
  return 'state_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const generateSnapshotId = (): string => {
  return 'snapshot_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const addToHistory = (action: HistoryItem['action'], key: string, oldValue?: any, newValue?: any) => {
  // 移除当前位置之后的历史
  if (historyIndex.value < historyStack.value.length - 1) {
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
  }
  
  // 添加新的历史项
  historyStack.value.push({
    action,
    key,
    oldValue,
    newValue,
    timestamp: Date.now()
  })
  
  // 限制历史大小
  if (historyStack.value.length > props.maxHistory) {
    historyStack.value = historyStack.value.slice(-props.maxHistory)
  }
  
  historyIndex.value = historyStack.value.length - 1
}

const saveToStorage = (key: string, state: StateItem) => {
  try {
    localStorage.setItem(`state_${key}`, JSON.stringify(state))
  } catch (error) {
    console.error('Failed to save state to storage:', error)
  }
}

const removeFromStorage = (key: string) => {
  try {
    localStorage.removeItem(`state_${key}`)
  } catch (error) {
    console.error('Failed to remove state from storage:', error)
  }
}

const loadFromStorage = () => {
  try {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('state_'))
    
    for (const storageKey of keys) {
      const stateKey = storageKey.replace('state_', '')
      const stateData = localStorage.getItem(storageKey)
      
      if (stateData) {
        const state = JSON.parse(stateData) as StateItem
        states[stateKey] = state
      }
    }
  } catch (error) {
    console.error('Failed to load states from storage:', error)
  }
}

const saveSnapshotsToStorage = () => {
  try {
    localStorage.setItem('state_snapshots', JSON.stringify(snapshots.value))
  } catch (error) {
    console.error('Failed to save snapshots to storage:', error)
  }
}

const loadSnapshotsFromStorage = () => {
  try {
    const snapshotsData = localStorage.getItem('state_snapshots')
    if (snapshotsData) {
      snapshots.value = JSON.parse(snapshotsData)
    }
  } catch (error) {
    console.error('Failed to load snapshots from storage:', error)
  }
}

// 公共 API
const getState = (key: string) => {
  return states[key]?.value
}

const setState = (key: string, value: any) => {
  if (states[key]) {
    const oldValue = states[key].value
    states[key].value = value
    states[key].updatedAt = Date.now()
    states[key].modified = true
    states[key].size = calculateStateSize(value)
    states[key].preview = generatePreview(value)
    
    addToHistory('update', key, oldValue, value)
    emit('state-changed', key, value)
    
    eventBus.emit(EventTypes.DATA_UPDATED, {
      key,
      value,
      type: states[key].type
    })
    
    if (autoSave.value && states[key].persistent) {
      saveToStorage(key, states[key])
    }
  }
}

const watchState = (key: string, callback: (value: any) => void) => {
  if (states[key]) {
    states[key].watchers++
  }
  
  return watch(
    () => states[key]?.value,
    callback,
    { deep: true }
  )
}

// 暴露给父组件
defineExpose({
  getState,
  setState,
  watchState,
  createState,
  deleteState,
  saveSnapshot,
  loadSnapshot,
  undo,
  redo,
  clearStates
})

// 生命周期
onMounted(() => {
  loadFromStorage()
  loadSnapshotsFromStorage()
  
  // 监听事件总线
  useEventListener(EventTypes.COMPONENT_UPDATED, (payload) => {
    const { id, updates } = payload.data
    if (states[id]) {
      Object.assign(states[id].value, updates)
      states[id].updatedAt = Date.now()
      states[id].modified = true
    }
  })
  
  useEventListener(EventTypes.SYSTEM_READY, () => {
    // 系统就绪后的初始化
  })
})

onBeforeUnmount(() => {
  // 自动保存持久化状态
  if (autoSave.value) {
    Object.entries(states).forEach(([key, state]) => {
      if (state.persistent) {
        saveToStorage(key, state)
      }
    })
  }
})

// 监听器
watch(
  () => props.autoSave,
  (newValue) => {
    autoSave.value = newValue
  }
)

watch(
  valueEditorMode,
  () => {
    if (valueEditorMode.value === 'json') {
      updateJsonValue()
    }
  }
)
</script>

<style scoped>
.state-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color, #ffffff);
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 8px;
  overflow: hidden;
}

.state-manager.dark {
  --bg-color: #1e1e1e;
  --border-color: #404040;
  --text-color: #ffffff;
  --text-secondary: #b0b0b0;
  --hover-bg: #2d2d2d;
  --active-bg: #404040;
}

.state-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.toolbar-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color, #333333);
}

.state-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--text-secondary, #666666);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn {
  padding: 6px 12px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #333333);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover {
  background: var(--hover-bg, #f5f5f5);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-icon {
  padding: 6px;
  min-width: 32px;
}

.btn-icon.active {
  background: var(--primary-color, #007bff);
  color: white;
  border-color: var(--primary-color, #007bff);
}

.btn-primary {
  background: var(--primary-color, #007bff);
  color: white;
  border-color: var(--primary-color, #007bff);
}

.btn-secondary {
  background: var(--bg-secondary, #f8f9fa);
  color: var(--text-color, #333333);
}

.divider {
  width: 1px;
  height: 20px;
  background: var(--border-color, #e1e5e9);
  margin: 0 4px;
}

.state-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.state-search {
  padding: 16px;
  border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.search-input {
  position: relative;
  margin-bottom: 12px;
}

.search-input input {
  width: 100%;
  padding: 8px 32px 8px 32px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  font-size: 14px;
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #333333);
}

.search-input .icon-search {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #666666);
}

.clear-search {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  border: none;
  background: none;
  color: var(--text-secondary, #666666);
  cursor: pointer;
}

.search-filters {
  display: flex;
  gap: 12px;
}

.search-filters select {
  padding: 6px 8px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #333333);
  font-size: 12px;
}

.state-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.state-item {
  padding: 12px;
  margin-bottom: 8px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 6px;
  background: var(--bg-color, #ffffff);
  cursor: pointer;
  transition: all 0.2s;
}

.state-item:hover {
  background: var(--hover-bg, #f5f5f5);
  border-color: var(--primary-color, #007bff);
}

.state-item.selected {
  background: var(--primary-light, #e3f2fd);
  border-color: var(--primary-color, #007bff);
}

.state-item.modified {
  border-left: 3px solid var(--warning-color, #ffc107);
}

.state-item.readonly {
  opacity: 0.7;
}

.state-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.state-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.state-name {
  font-weight: 500;
  color: var(--text-color, #333333);
}

.state-type {
  padding: 2px 6px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 3px;
  font-size: 11px;
  color: var(--text-secondary, #666666);
}

.state-actions {
  display: flex;
  gap: 4px;
}

.btn-action {
  padding: 4px;
  border: none;
  background: none;
  color: var(--text-secondary, #666666);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--hover-bg, #f5f5f5);
  color: var(--text-color, #333333);
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.state-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-secondary, #666666);
}

.state-preview {
  margin-top: 8px;
  padding: 8px;
  background: var(--bg-secondary, #f8f9fa);
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  color: var(--text-secondary, #666666);
  max-height: 60px;
  overflow: hidden;
}

.state-preview pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
}

.empty-state {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 48px;
  color: var(--text-secondary, #666666);
  margin-bottom: 16px;
}

.empty-state h4 {
  margin: 0 0 8px 0;
  color: var(--text-color, #333333);
}

.empty-state p {
  margin: 0 0 20px 0;
  color: var(--text-secondary, #666666);
}

/* 编辑器样式 */
.state-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.state-editor {
  width: 600px;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--bg-color, #ffffff);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.editor-header h4 {
  margin: 0;
  color: var(--text-color, #333333);
}

.btn-close {
  padding: 4px;
  border: none;
  background: none;
  color: var(--text-secondary, #666666);
  cursor: pointer;
  border-radius: 3px;
}

.btn-close:hover {
  background: var(--hover-bg, #f5f5f5);
}

.editor-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-color, #333333);
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  font-size: 14px;
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #333333);
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: var(--primary-color, #007bff);
}

.form-row {
  display: flex;
  gap: 12px;
}

.form-col {
  flex: 1;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox input {
  width: auto;
}

.value-editor {
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 4px;
  overflow: hidden;
}

.editor-tabs {
  display: flex;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: none;
  color: var(--text-secondary, #666666);
  cursor: pointer;
  font-size: 12px;
}

.tab-btn.active {
  background: var(--bg-color, #ffffff);
  color: var(--text-color, #333333);
}

.visual-editor,
.json-editor {
  padding: 16px;
}

.kv-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.value-input {
  flex: 1;
}

.btn-remove {
  padding: 4px;
  border: none;
  background: var(--danger-color, #dc3545);
  color: white;
  border-radius: 3px;
  cursor: pointer;
}

.json-textarea {
  width: 100%;
  min-height: 200px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  resize: vertical;
}

.json-error {
  margin-top: 8px;
  padding: 8px;
  background: var(--danger-light, #f8d7da);
  color: var(--danger-color, #dc3545);
  border-radius: 4px;
  font-size: 12px;
}

.editor-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-secondary, #f8f9fa);
  border-top: 1px solid var(--border-color, #e1e5e9);
}

/* 快照管理器样式 */
.snapshot-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.snapshot-manager {
  width: 500px;
  max-width: 90vw;
  max-height: 90vh;
  background: var(--bg-color, #ffffff);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: var(--bg-secondary, #f8f9fa);
  border-bottom: 1px solid var(--border-color, #e1e5e9);
}

.manager-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.snapshot-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.snapshot-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  border: 1px solid var(--border-color, #e1e5e9);
  border-radius: 6px;
  background: var(--bg-color, #ffffff);
  cursor: pointer;
  transition: all 0.2s;
}

.snapshot-item:hover {
  background: var(--hover-bg, #f5f5f5);
}

.snapshot-item.selected {
  background: var(--primary-light, #e3f2fd);
  border-color: var(--primary-color, #007bff);
}

.snapshot-info h5 {
  margin: 0 0 4px 0;
  color: var(--text-color, #333333);
}

.snapshot-info p {
  margin: 0 0 8px 0;
  color: var(--text-secondary, #666666);
  font-size: 12px;
}

.snapshot-meta {
  display: flex;
  gap: 12px;
  font-size: 11px;
  color: var(--text-secondary, #666666);
}

.snapshot-actions {
  display: flex;
  gap: 4px;
}

.empty-snapshots {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  color: var(--text-secondary, #666666);
}

.manager-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  background: var(--bg-secondary, #f8f9fa);
  border-top: 1px solid var(--border-color, #e1e5e9);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .state-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: center;
  }
  
  .state-stats {
    justify-content: center;
  }
  
  .search-filters {
    flex-direction: column;
  }
  
  .form-row {
    flex-direction: column;
  }
  
  .state-editor {
    width: 95vw;
  }
  
  .snapshot-manager {
    width: 95vw;
  }
}

/* 深色主题 */
.dark .state-toolbar {
  background: #2d2d2d;
  border-color: #404040;
}

.dark .state-search {
  border-color: #404040;
}

.dark .search-input input,
.dark .search-filters select {
  background: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}

.dark .state-item {
  background: #2d2d2d;
  border-color: #404040;
}

.dark .state-item:hover {
  background: #404040;
}

.dark .state-preview {
  background: #404040;
}

.dark .state-editor,
.dark .snapshot-manager {
  background: #1e1e1e;
}

.dark .editor-header,
.dark .manager-header,
.dark .editor-footer,
.dark .manager-footer {
  background: #2d2d2d;
  border-color: #404040;
}

.dark .value-editor {
  border-color: #404040;
}

.dark .editor-tabs {
  background: #2d2d2d;
  border-color: #404040;
}

.dark .tab-btn.active {
  background: #1e1e1e;
}

.dark .form-group input,
.dark .form-group select,
.dark .form-group textarea {
  background: #2d2d2d;
  border-color: #404040;
  color: #ffffff;
}

.dark .snapshot-item {
  background: #2d2d2d;
  border-color: #404040;
}

.dark .snapshot-item:hover {
  background: #404040;
}
</style>