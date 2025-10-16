<template>
  <div class="config-manager">
    <!-- 工具栏 -->
    <div class="config-toolbar">
      <div class="toolbar-left">
        <h3 class="toolbar-title">
          <i class="icon-settings"></i>
          配置管理
        </h3>
        <div class="config-stats">
          <span class="stat-item">
            <i class="icon-folder"></i>
            {{ configGroups.length }} 个分组
          </span>
          <span class="stat-item">
            <i class="icon-file"></i>
            {{ totalConfigs }} 个配置
          </span>
        </div>
      </div>
      
      <div class="toolbar-right">
        <div class="view-modes">
          <button 
            v-for="mode in viewModes"
            :key="mode.value"
            :class="['mode-btn', { active: currentViewMode === mode.value }]"
            @click="currentViewMode = mode.value"
            :title="mode.label"
          >
            <i :class="mode.icon"></i>
          </button>
        </div>
        
        <div class="toolbar-actions">
          <button class="btn btn-outline" @click="importConfig" title="导入配置">
            <i class="icon-upload"></i>
            导入
          </button>
          <button class="btn btn-outline" @click="exportConfig" title="导出配置">
            <i class="icon-download"></i>
            导出
          </button>
          <button class="btn btn-outline" @click="resetToDefaults" title="重置为默认">
            <i class="icon-refresh"></i>
            重置
          </button>
          <button class="btn btn-primary" @click="saveConfigs" title="保存配置">
            <i class="icon-save"></i>
            保存
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索和筛选 -->
    <div class="config-filters">
      <div class="search-box">
        <i class="icon-search"></i>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="搜索配置项..."
          class="search-input"
        />
        <button 
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="clear-btn"
        >
          <i class="icon-close"></i>
        </button>
      </div>
      
      <div class="filter-controls">
        <select v-model="selectedGroup" class="filter-select">
          <option value="">所有分组</option>
          <option 
            v-for="group in configGroups"
            :key="group.id"
            :value="group.id"
          >
            {{ group.name }}
          </option>
        </select>
        
        <select v-model="selectedType" class="filter-select">
          <option value="">所有类型</option>
          <option value="string">字符串</option>
          <option value="number">数字</option>
          <option value="boolean">布尔值</option>
          <option value="object">对象</option>
          <option value="array">数组</option>
        </select>
        
        <button 
          :class="['filter-btn', { active: showModifiedOnly }]"
          @click="showModifiedOnly = !showModifiedOnly"
          title="只显示已修改的配置"
        >
          <i class="icon-edit"></i>
          已修改
        </button>
      </div>
    </div>

    <!-- 配置内容 -->
    <div class="config-content">
      <!-- 树形视图 -->
      <div v-if="currentViewMode === 'tree'" class="config-tree">
        <div 
          v-for="group in filteredGroups"
          :key="group.id"
          class="config-group"
        >
          <div 
            class="group-header"
            @click="toggleGroup(group.id)"
          >
            <i :class="['expand-icon', { expanded: expandedGroups.has(group.id) }]"></i>
            <i :class="group.icon"></i>
            <span class="group-name">{{ group.name }}</span>
            <span class="group-count">({{ group.configs.length }})</span>
            <div class="group-actions">
              <button 
                class="action-btn"
                @click.stop="addConfig(group.id)"
                title="添加配置"
              >
                <i class="icon-plus"></i>
              </button>
              <button 
                class="action-btn"
                @click.stop="editGroup(group)"
                title="编辑分组"
              >
                <i class="icon-edit"></i>
              </button>
            </div>
          </div>
          
          <div 
            v-if="expandedGroups.has(group.id)"
            class="group-configs"
          >
            <div 
              v-for="config in group.configs"
              :key="config.key"
              :class="['config-item', { modified: isModified(config) }]"
            >
              <div class="config-info">
                <div class="config-header">
                  <span class="config-key">{{ config.key }}</span>
                  <span :class="['config-type', config.type]">{{ config.type }}</span>
                  <span v-if="config.required" class="required-badge">必需</span>
                </div>
                <div class="config-description">{{ config.description }}</div>
              </div>
              
              <div class="config-value">
                <ConfigValueEditor
                  :config="config"
                  :value="getConfigValue(config.key)"
                  @update="updateConfigValue(config.key, $event)"
                />
              </div>
              
              <div class="config-actions">
                <button 
                  class="action-btn"
                  @click="resetConfig(config.key)"
                  title="重置为默认值"
                  :disabled="!isModified(config)"
                >
                  <i class="icon-refresh"></i>
                </button>
                <button 
                  class="action-btn"
                  @click="editConfig(config)"
                  title="编辑配置"
                >
                  <i class="icon-edit"></i>
                </button>
                <button 
                  class="action-btn danger"
                  @click="deleteConfig(config.key)"
                  title="删除配置"
                >
                  <i class="icon-delete"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 表格视图 -->
      <div v-else-if="currentViewMode === 'table'" class="config-table">
        <table>
          <thead>
            <tr>
              <th>配置键</th>
              <th>类型</th>
              <th>当前值</th>
              <th>默认值</th>
              <th>描述</th>
              <th>分组</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="config in flattenedConfigs"
              :key="config.key"
              :class="{ modified: isModified(config) }"
            >
              <td class="config-key">{{ config.key }}</td>
              <td>
                <span :class="['config-type', config.type]">{{ config.type }}</span>
              </td>
              <td class="config-value">
                <ConfigValueEditor
                  :config="config"
                  :value="getConfigValue(config.key)"
                  @update="updateConfigValue(config.key, $event)"
                  compact
                />
              </td>
              <td class="default-value">
                <code>{{ formatValue(config.defaultValue) }}</code>
              </td>
              <td class="config-description">{{ config.description }}</td>
              <td class="config-group">{{ getGroupName(config.group) }}</td>
              <td class="config-actions">
                <button 
                  class="action-btn"
                  @click="resetConfig(config.key)"
                  title="重置"
                  :disabled="!isModified(config)"
                >
                  <i class="icon-refresh"></i>
                </button>
                <button 
                  class="action-btn"
                  @click="editConfig(config)"
                  title="编辑"
                >
                  <i class="icon-edit"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- JSON 视图 -->
      <div v-else-if="currentViewMode === 'json'" class="config-json">
        <div class="json-toolbar">
          <button 
            class="btn btn-outline"
            @click="formatJson"
            title="格式化 JSON"
          >
            <i class="icon-format"></i>
            格式化
          </button>
          <button 
            class="btn btn-outline"
            @click="compressJson"
            title="压缩 JSON"
          >
            <i class="icon-compress"></i>
            压缩
          </button>
          <button 
            class="btn btn-outline"
            @click="validateJson"
            title="验证 JSON"
          >
            <i class="icon-check"></i>
            验证
          </button>
        </div>
        
        <div class="json-editor">
          <textarea
            v-model="jsonConfig"
            class="json-textarea"
            :class="{ error: jsonError }"
            @input="onJsonInput"
            placeholder="在此编辑 JSON 配置..."
          ></textarea>
          
          <div v-if="jsonError" class="json-error">
            <i class="icon-warning"></i>
            {{ jsonError }}
          </div>
        </div>
      </div>
    </div>

    <!-- 配置编辑模态框 -->
    <div v-if="showConfigModal" class="modal-overlay" @click="closeConfigModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ editingConfig ? '编辑配置' : '新增配置' }}</h4>
          <button class="close-btn" @click="closeConfigModal">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveConfigItem">
            <div class="form-group">
              <label>配置键</label>
              <input
                v-model="configForm.key"
                type="text"
                class="form-input"
                :disabled="!!editingConfig"
                required
              />
            </div>
            
            <div class="form-group">
              <label>配置名称</label>
              <input
                v-model="configForm.name"
                type="text"
                class="form-input"
                required
              />
            </div>
            
            <div class="form-group">
              <label>数据类型</label>
              <select v-model="configForm.type" class="form-select" required>
                <option value="string">字符串</option>
                <option value="number">数字</option>
                <option value="boolean">布尔值</option>
                <option value="object">对象</option>
                <option value="array">数组</option>
              </select>
            </div>
            
            <div class="form-group">
              <label>默认值</label>
              <ConfigValueEditor
                :config="{ type: configForm.type }"
                :value="configForm.defaultValue"
                @update="configForm.defaultValue = $event"
              />
            </div>
            
            <div class="form-group">
              <label>描述</label>
              <textarea
                v-model="configForm.description"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>分组</label>
              <select v-model="configForm.group" class="form-select" required>
                <option 
                  v-for="group in configGroups"
                  :key="group.id"
                  :value="group.id"
                >
                  {{ group.name }}
                </option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="configForm.required"
                  type="checkbox"
                  class="form-checkbox"
                />
                必需配置
              </label>
            </div>
            
            <div class="form-group">
              <label class="checkbox-label">
                <input
                  v-model="configForm.readonly"
                  type="checkbox"
                  class="form-checkbox"
                />
                只读配置
              </label>
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeConfigModal">
            取消
          </button>
          <button class="btn btn-primary" @click="saveConfigItem">
            {{ editingConfig ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 分组编辑模态框 -->
    <div v-if="showGroupModal" class="modal-overlay" @click="closeGroupModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h4>{{ editingGroup ? '编辑分组' : '新增分组' }}</h4>
          <button class="close-btn" @click="closeGroupModal">
            <i class="icon-close"></i>
          </button>
        </div>
        
        <div class="modal-body">
          <form @submit.prevent="saveGroup">
            <div class="form-group">
              <label>分组 ID</label>
              <input
                v-model="groupForm.id"
                type="text"
                class="form-input"
                :disabled="!!editingGroup"
                required
              />
            </div>
            
            <div class="form-group">
              <label>分组名称</label>
              <input
                v-model="groupForm.name"
                type="text"
                class="form-input"
                required
              />
            </div>
            
            <div class="form-group">
              <label>图标</label>
              <input
                v-model="groupForm.icon"
                type="text"
                class="form-input"
                placeholder="icon-settings"
              />
            </div>
            
            <div class="form-group">
              <label>描述</label>
              <textarea
                v-model="groupForm.description"
                class="form-textarea"
                rows="3"
              ></textarea>
            </div>
            
            <div class="form-group">
              <label>排序</label>
              <input
                v-model.number="groupForm.order"
                type="number"
                class="form-input"
                min="0"
              />
            </div>
          </form>
        </div>
        
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeGroupModal">
            取消
          </button>
          <button class="btn btn-primary" @click="saveGroup">
            {{ editingGroup ? '更新' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import ConfigValueEditor from './ConfigValueEditor.vue'

// 接口定义
interface ConfigItem {
  key: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  defaultValue: any
  currentValue?: any
  description: string
  group: string
  required: boolean
  readonly: boolean
  validation?: {
    min?: number
    max?: number
    pattern?: string
    options?: any[]
  }
}

interface ConfigGroup {
  id: string
  name: string
  icon: string
  description: string
  order: number
  configs: ConfigItem[]
}

// Props
interface Props {
  initialConfigs?: ConfigItem[]
  initialGroups?: ConfigGroup[]
  readonly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  initialConfigs: () => [],
  initialGroups: () => [],
  readonly: false
})

// Emits
const emit = defineEmits<{
  'config-change': [key: string, value: any]
  'config-save': [configs: Record<string, any>]
  'config-reset': [key: string]
  'config-import': [configs: Record<string, any>]
  'config-export': [configs: Record<string, any>]
}>()

// 响应式数据
const searchQuery = ref('')
const selectedGroup = ref('')
const selectedType = ref('')
const showModifiedOnly = ref(false)
const currentViewMode = ref<'tree' | 'table' | 'json'>('tree')
const expandedGroups = ref(new Set<string>())

const configGroups = ref<ConfigGroup[]>([])
const configValues = reactive<Record<string, any>>({})
const modifiedKeys = ref(new Set<string>())

const showConfigModal = ref(false)
const showGroupModal = ref(false)
const editingConfig = ref<ConfigItem | null>(null)
const editingGroup = ref<ConfigGroup | null>(null)

const jsonConfig = ref('')
const jsonError = ref('')

// 表单数据
const configForm = reactive({
  key: '',
  name: '',
  type: 'string' as ConfigItem['type'],
  defaultValue: '',
  description: '',
  group: '',
  required: false,
  readonly: false
})

const groupForm = reactive({
  id: '',
  name: '',
  icon: 'icon-folder',
  description: '',
  order: 0
})

// 视图模式选项
const viewModes = [
  { value: 'tree', label: '树形视图', icon: 'icon-tree' },
  { value: 'table', label: '表格视图', icon: 'icon-table' },
  { value: 'json', label: 'JSON 视图', icon: 'icon-code' }
]

// 计算属性
const totalConfigs = computed(() => {
  return configGroups.value.reduce((sum, group) => sum + group.configs.length, 0)
})

const filteredGroups = computed(() => {
  return configGroups.value
    .filter(group => {
      if (selectedGroup.value && group.id !== selectedGroup.value) {
        return false
      }
      
      const filteredConfigs = group.configs.filter(config => {
        // 搜索过滤
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          if (!config.key.toLowerCase().includes(query) &&
              !config.name.toLowerCase().includes(query) &&
              !config.description.toLowerCase().includes(query)) {
            return false
          }
        }
        
        // 类型过滤
        if (selectedType.value && config.type !== selectedType.value) {
          return false
        }
        
        // 修改状态过滤
        if (showModifiedOnly.value && !isModified(config)) {
          return false
        }
        
        return true
      })
      
      return filteredConfigs.length > 0
    })
    .map(group => ({
      ...group,
      configs: group.configs.filter(config => {
        // 应用相同的过滤逻辑
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase()
          if (!config.key.toLowerCase().includes(query) &&
              !config.name.toLowerCase().includes(query) &&
              !config.description.toLowerCase().includes(query)) {
            return false
          }
        }
        
        if (selectedType.value && config.type !== selectedType.value) {
          return false
        }
        
        if (showModifiedOnly.value && !isModified(config)) {
          return false
        }
        
        return true
      })
    }))
})

const flattenedConfigs = computed(() => {
  const configs: ConfigItem[] = []
  filteredGroups.value.forEach(group => {
    configs.push(...group.configs)
  })
  return configs
})

// 方法
const initializeConfigs = () => {
  // 初始化配置分组
  if (props.initialGroups.length > 0) {
    configGroups.value = [...props.initialGroups]
  } else {
    configGroups.value = getDefaultGroups()
  }
  
  // 初始化配置项
  if (props.initialConfigs.length > 0) {
    // 将配置项分配到对应分组
    props.initialConfigs.forEach(config => {
      const group = configGroups.value.find(g => g.id === config.group)
      if (group) {
        group.configs.push(config)
      }
    })
  } else {
    // 添加默认配置项
    addDefaultConfigs()
  }
  
  // 初始化配置值
  configGroups.value.forEach(group => {
    group.configs.forEach(config => {
      configValues[config.key] = config.currentValue ?? config.defaultValue
    })
  })
  
  // 默认展开所有分组
  configGroups.value.forEach(group => {
    expandedGroups.value.add(group.id)
  })
  
  // 初始化 JSON 视图
  updateJsonConfig()
}

const getDefaultGroups = (): ConfigGroup[] => {
  return [
    {
      id: 'general',
      name: '常规设置',
      icon: 'icon-settings',
      description: '基本的系统配置',
      order: 0,
      configs: []
    },
    {
      id: 'appearance',
      name: '外观设置',
      icon: 'icon-palette',
      description: '界面外观和主题配置',
      order: 1,
      configs: []
    },
    {
      id: 'performance',
      name: '性能设置',
      icon: 'icon-speed',
      description: '性能优化相关配置',
      order: 2,
      configs: []
    },
    {
      id: 'security',
      name: '安全设置',
      icon: 'icon-shield',
      description: '安全和权限配置',
      order: 3,
      configs: []
    }
  ]
}

const addDefaultConfigs = () => {
  const defaultConfigs: ConfigItem[] = [
    {
      key: 'app.name',
      name: '应用名称',
      type: 'string',
      defaultValue: 'Low Code Platform',
      description: '应用程序的显示名称',
      group: 'general',
      required: true,
      readonly: false
    },
    {
      key: 'app.version',
      name: '应用版本',
      type: 'string',
      defaultValue: '1.0.0',
      description: '当前应用程序版本',
      group: 'general',
      required: true,
      readonly: true
    },
    {
      key: 'theme.mode',
      name: '主题模式',
      type: 'string',
      defaultValue: 'light',
      description: '界面主题模式',
      group: 'appearance',
      required: false,
      readonly: false,
      validation: {
        options: ['light', 'dark', 'auto']
      }
    },
    {
      key: 'performance.cacheSize',
      name: '缓存大小',
      type: 'number',
      defaultValue: 100,
      description: '缓存的最大条目数',
      group: 'performance',
      required: false,
      readonly: false,
      validation: {
        min: 10,
        max: 1000
      }
    },
    {
      key: 'security.enableAuth',
      name: '启用认证',
      type: 'boolean',
      defaultValue: true,
      description: '是否启用用户认证',
      group: 'security',
      required: false,
      readonly: false
    }
  ]
  
  defaultConfigs.forEach(config => {
    const group = configGroups.value.find(g => g.id === config.group)
    if (group) {
      group.configs.push(config)
    }
  })
}

const toggleGroup = (groupId: string) => {
  if (expandedGroups.value.has(groupId)) {
    expandedGroups.value.delete(groupId)
  } else {
    expandedGroups.value.add(groupId)
  }
}

const getConfigValue = (key: string) => {
  return configValues[key]
}

const updateConfigValue = (key: string, value: any) => {
  const oldValue = configValues[key]
  configValues[key] = value
  
  // 检查是否修改
  const config = findConfigByKey(key)
  if (config) {
    if (value !== config.defaultValue) {
      modifiedKeys.value.add(key)
    } else {
      modifiedKeys.value.delete(key)
    }
  }
  
  emit('config-change', key, value)
}

const isModified = (config: ConfigItem): boolean => {
  return modifiedKeys.value.has(config.key)
}

const resetConfig = (key: string) => {
  const config = findConfigByKey(key)
  if (config) {
    updateConfigValue(key, config.defaultValue)
    emit('config-reset', key)
  }
}

const resetToDefaults = () => {
  configGroups.value.forEach(group => {
    group.configs.forEach(config => {
      updateConfigValue(config.key, config.defaultValue)
    })
  })
  modifiedKeys.value.clear()
  updateJsonConfig()
}

const saveConfigs = () => {
  const configs: Record<string, any> = {}
  configGroups.value.forEach(group => {
    group.configs.forEach(config => {
      configs[config.key] = configValues[config.key]
    })
  })
  
  emit('config-save', configs)
  modifiedKeys.value.clear()
}

const addConfig = (groupId: string) => {
  resetConfigForm()
  configForm.group = groupId
  editingConfig.value = null
  showConfigModal.value = true
}

const editConfig = (config: ConfigItem) => {
  configForm.key = config.key
  configForm.name = config.name
  configForm.type = config.type
  configForm.defaultValue = config.defaultValue
  configForm.description = config.description
  configForm.group = config.group
  configForm.required = config.required
  configForm.readonly = config.readonly
  
  editingConfig.value = config
  showConfigModal.value = true
}

const deleteConfig = (key: string) => {
  if (confirm('确定要删除这个配置项吗？')) {
    configGroups.value.forEach(group => {
      const index = group.configs.findIndex(c => c.key === key)
      if (index > -1) {
        group.configs.splice(index, 1)
        delete configValues[key]
        modifiedKeys.value.delete(key)
      }
    })
  }
}

const saveConfigItem = () => {
  if (editingConfig.value) {
    // 更新现有配置
    Object.assign(editingConfig.value, {
      name: configForm.name,
      type: configForm.type,
      defaultValue: configForm.defaultValue,
      description: configForm.description,
      group: configForm.group,
      required: configForm.required,
      readonly: configForm.readonly
    })
  } else {
    // 创建新配置
    const newConfig: ConfigItem = {
      key: configForm.key,
      name: configForm.name,
      type: configForm.type,
      defaultValue: configForm.defaultValue,
      description: configForm.description,
      group: configForm.group,
      required: configForm.required,
      readonly: configForm.readonly
    }
    
    const group = configGroups.value.find(g => g.id === configForm.group)
    if (group) {
      group.configs.push(newConfig)
      configValues[newConfig.key] = newConfig.defaultValue
    }
  }
  
  closeConfigModal()
  updateJsonConfig()
}

const closeConfigModal = () => {
  showConfigModal.value = false
  editingConfig.value = null
  resetConfigForm()
}

const resetConfigForm = () => {
  configForm.key = ''
  configForm.name = ''
  configForm.type = 'string'
  configForm.defaultValue = ''
  configForm.description = ''
  configForm.group = ''
  configForm.required = false
  configForm.readonly = false
}

const editGroup = (group: ConfigGroup) => {
  groupForm.id = group.id
  groupForm.name = group.name
  groupForm.icon = group.icon
  groupForm.description = group.description
  groupForm.order = group.order
  
  editingGroup.value = group
  showGroupModal.value = true
}

const saveGroup = () => {
  if (editingGroup.value) {
    // 更新现有分组
    Object.assign(editingGroup.value, {
      name: groupForm.name,
      icon: groupForm.icon,
      description: groupForm.description,
      order: groupForm.order
    })
  } else {
    // 创建新分组
    const newGroup: ConfigGroup = {
      id: groupForm.id,
      name: groupForm.name,
      icon: groupForm.icon,
      description: groupForm.description,
      order: groupForm.order,
      configs: []
    }
    
    configGroups.value.push(newGroup)
    configGroups.value.sort((a, b) => a.order - b.order)
  }
  
  closeGroupModal()
}

const closeGroupModal = () => {
  showGroupModal.value = false
  editingGroup.value = null
  resetGroupForm()
}

const resetGroupForm = () => {
  groupForm.id = ''
  groupForm.name = ''
  groupForm.icon = 'icon-folder'
  groupForm.description = ''
  groupForm.order = 0
}

const findConfigByKey = (key: string): ConfigItem | undefined => {
  for (const group of configGroups.value) {
    const config = group.configs.find(c => c.key === key)
    if (config) return config
  }
  return undefined
}

const getGroupName = (groupId: string): string => {
  const group = configGroups.value.find(g => g.id === groupId)
  return group ? group.name : groupId
}

const formatValue = (value: any): string => {
  if (typeof value === 'string') {
    return `"${value}"`
  }
  return JSON.stringify(value)
}

// JSON 视图相关方法
const updateJsonConfig = () => {
  const configs: Record<string, any> = {}
  configGroups.value.forEach(group => {
    group.configs.forEach(config => {
      configs[config.key] = configValues[config.key]
    })
  })
  
  jsonConfig.value = JSON.stringify(configs, null, 2)
  jsonError.value = ''
}

const onJsonInput = () => {
  try {
    const parsed = JSON.parse(jsonConfig.value)
    
    // 更新配置值
    Object.entries(parsed).forEach(([key, value]) => {
      if (key in configValues) {
        updateConfigValue(key, value)
      }
    })
    
    jsonError.value = ''
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : '无效的 JSON 格式'
  }
}

const formatJson = () => {
  try {
    const parsed = JSON.parse(jsonConfig.value)
    jsonConfig.value = JSON.stringify(parsed, null, 2)
    jsonError.value = ''
  } catch (error) {
    jsonError.value = '无法格式化：JSON 格式无效'
  }
}

const compressJson = () => {
  try {
    const parsed = JSON.parse(jsonConfig.value)
    jsonConfig.value = JSON.stringify(parsed)
    jsonError.value = ''
  } catch (error) {
    jsonError.value = '无法压缩：JSON 格式无效'
  }
}

const validateJson = () => {
  try {
    JSON.parse(jsonConfig.value)
    jsonError.value = ''
    alert('JSON 格式验证通过')
  } catch (error) {
    jsonError.value = error instanceof Error ? error.message : 'JSON 格式无效'
  }
}

// 导入导出
const exportConfig = () => {
  const configs: Record<string, any> = {}
  configGroups.value.forEach(group => {
    group.configs.forEach(config => {
      configs[config.key] = configValues[config.key]
    })
  })
  
  const dataStr = JSON.stringify({
    configs,
    groups: configGroups.value,
    timestamp: new Date().toISOString()
  }, null, 2)
  
  const blob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  
  const a = document.createElement('a')
  a.href = url
  a.download = `config-${Date.now()}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  emit('config-export', configs)
}

const importConfig = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        
        if (data.configs) {
          Object.entries(data.configs).forEach(([key, value]) => {
            if (key in configValues) {
              updateConfigValue(key, value)
            }
          })
        }
        
        if (data.groups) {
          configGroups.value = data.groups
        }
        
        updateJsonConfig()
        emit('config-import', data.configs || {})
        
      } catch (error) {
        alert('导入失败：文件格式无效')
      }
    }
    
    reader.readAsText(file)
  }
  
  input.click()
}

// 监听视图模式变化
watch(currentViewMode, (newMode) => {
  if (newMode === 'json') {
    updateJsonConfig()
  }
})

// 生命周期
onMounted(() => {
  initializeConfigs()
})
</script>

<style scoped>
.config-manager {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg-color);
  color: var(--text-color);
}

.config-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
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
  font-size: 18px;
  font-weight: 600;
}

.config-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: var(--text-secondary);
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.view-modes {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-color);
  border-radius: 6px;
}

.mode-btn {
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
}

.mode-btn.active {
  background: var(--primary-color);
  color: white;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.config-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box .icon-search {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
}

.clear-btn {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  padding: 4px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.clear-btn:hover {
  background: var(--bg-hover);
}

.filter-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  min-width: 120px;
}

.filter-btn {
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
}

.filter-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.config-content {
  flex: 1;
  overflow: auto;
  padding: 16px;
}

/* 树形视图样式 */
.config-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.config-group {
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  background: var(--bg-secondary);
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header:hover {
  background: var(--bg-hover);
}

.expand-icon {
  margin-right: 8px;
  transition: transform 0.2s;
}

.expand-icon.expanded {
  transform: rotate(90deg);
}

.group-name {
  font-weight: 600;
  margin-left: 8px;
}

.group-count {
  margin-left: 8px;
  color: var(--text-secondary);
  font-size: 14px;
}

.group-actions {
  margin-left: auto;
  display: flex;
  gap: 4px;
}

.action-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
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

.group-configs {
  padding: 16px;
}

.config-item {
  display: flex;
  align-items: center;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  margin-bottom: 8px;
  transition: all 0.2s;
}

.config-item:hover {
  border-color: var(--primary-color);
}

.config-item.modified {
  border-color: var(--warning-color);
  background: var(--warning-bg);
}

.config-info {
  flex: 1;
  min-width: 0;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.config-key {
  font-weight: 600;
  font-family: 'Consolas', monospace;
}

.config-type {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.config-type.string { background: #e3f2fd; color: #1976d2; }
.config-type.number { background: #f3e5f5; color: #7b1fa2; }
.config-type.boolean { background: #e8f5e8; color: #388e3c; }
.config-type.object { background: #fff3e0; color: #f57c00; }
.config-type.array { background: #fce4ec; color: #c2185b; }

.required-badge {
  padding: 2px 6px;
  background: var(--error-color);
  color: white;
  border-radius: 4px;
  font-size: 12px;
}

.config-description {
  color: var(--text-secondary);
  font-size: 14px;
}

.config-value {
  flex: 1;
  margin: 0 16px;
}

.config-actions {
  display: flex;
  gap: 4px;
}

/* 表格视图样式 */
.config-table {
  overflow-x: auto;
}

.config-table table {
  width: 100%;
  border-collapse: collapse;
  background: var(--bg-color);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.config-table th,
.config-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.config-table th {
  background: var(--bg-secondary);
  font-weight: 600;
  color: var(--text-color);
}

.config-table tr:hover {
  background: var(--bg-hover);
}

.config-table tr.modified {
  background: var(--warning-bg);
}

/* JSON 视图样式 */
.config-json {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.json-toolbar {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.json-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.json-textarea {
  flex: 1;
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-color);
  color: var(--text-color);
  font-family: 'Consolas', monospace;
  font-size: 14px;
  line-height: 1.5;
  resize: none;
}

.json-textarea.error {
  border-color: var(--error-color);
}

.json-error {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--error-bg);
  color: var(--error-color);
  border-radius: 6px;
  margin-top: 8px;
}

/* 模态框样式 */
.modal-overlay {
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

.modal-content {
  background: var(--bg-color);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-color);
}

.modal-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  padding: 8px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 4px;
}

.close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-color);
}

.modal-body {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid var(--border-color);
}

/* 表单样式 */
.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--text-color);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background: var(--bg-color);
  color: var(--text-color);
  font-size: 14px;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.form-checkbox {
  width: auto !important;
}

/* 按钮样式 */
.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-outline {
  background: transparent;
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-outline:hover {
  background: var(--bg-hover);
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
    --primary-hover: #0052a3;
    --error-color: #ff4444;
    --error-bg: #2d1b1b;
    --warning-color: #ffaa00;
    --warning-bg: #2d2419;
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .config-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .toolbar-left,
  .toolbar-right {
    justify-content: space-between;
  }
  
  .config-filters {
    flex-direction: column;
    gap: 12px;
  }
  
  .filter-controls {
    flex-wrap: wrap;
  }
  
  .config-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .config-actions {
    justify-content: flex-end;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>