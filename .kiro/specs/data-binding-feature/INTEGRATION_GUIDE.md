# 数据绑定功能集成指南

## 🎯 集成概述

本指南说明如何将数据绑定功能集成到设计器中。

## ✅ 已完成的集成

### 1. 数据源配置弹框集成

**文件**: `src/core/renderer/designer/communication/DataSourceConfigModal.vue`

数据源配置弹框已经集成了三个面板：

- ✅ 数据源面板 (DataSourcePanel)
- ✅ 数据流面板 (DataFlowPanel)
- ✅ 数据操作面板 (DataOperationPanel/DataActionPanel)

**使用方式**:

```vue
<template>
  <DataSourceConfigModal
    v-model="showModal"
    :dataSources="dataSources"
    :dataFlows="dataFlows"
    :operations="dataActions"
    @save="handleSave"
  />
</template>

<script setup>
import DataSourceConfigModal from '@/core/renderer/designer/communication/DataSourceConfigModal.vue'

const showModal = ref(false)
const dataSources = ref({})
const dataFlows = ref({})
const dataActions = ref({})

function handleSave(data) {
  dataSources.value = data.dataSources
  dataFlows.value = data.dataFlows
  dataActions.value = data.operations
}
</script>
```

### 2. 属性面板数据绑定选项卡

**文件**: `src/core/renderer/designer/settings/PropertiesPanel.vue`

属性面板已添加"数据绑定"选项卡，包含以下功能：

- ✅ 绑定类型选择（直接绑定/数据流绑定/手动绑定）
- ✅ 数据源选择
- ✅ 数据流选择（数据流绑定时）
- ✅ 属性路径配置
- ✅ 自动加载开关
- ✅ 刷新间隔设置
- ✅ 转换表达式
- ✅ 保存/清除/测试按钮

**使用方式**:

```vue
<template>
  <PropertiesPanel
    :control="selectedControl"
    :dataSources="dataSourcesList"
    :dataFlows="dataFlowsList"
    @update="handlePropertyUpdate"
    @updateBinding="handleBindingUpdate"
  />
</template>

<script setup>
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'

const selectedControl = ref(null)
const dataSourcesList = ref([])
const dataFlowsList = ref([])

function handlePropertyUpdate(property, value) {
  if (selectedControl.value) {
    selectedControl.value[property] = value
  }
}

function handleBindingUpdate(binding) {
  if (selectedControl.value) {
    selectedControl.value.dataBinding = binding
  }
}
</script>
```

## 📋 待完成的集成任务

### 3. 设计器状态管理集成

需要在 `useDesignerState.ts` 中添加数据流和数据操作的状态管理。

**建议实现**:

```typescript
// src/core/renderer/designer/composables/useDesignerState.ts

import { ref } from 'vue'
import { DataBindingManager, DataFlowManager, DataActionManager } from '@/core/renderer/designer/managers'

export function useDesignerState() {
  // ... 现有代码 ...

  // 数据管理器
  const dataBindingManager = new DataBindingManager()
  const dataFlowManager = new DataFlowManager()
  const dataActionManager = new DataActionManager()

  // 数据状态
  const dataSources = ref<Record<string, any>>({})
  const dataFlows = ref<Record<string, any>>({})
  const dataActions = ref<Record<string, any>>({})

  // 数据源操作
  function addDataSource(config: any) {
    const id = config.id || `ds_${Date.now()}`
    dataSources.value[id] = { ...config, id }
    return id
  }

  function updateDataSource(id: string, updates: any) {
    if (dataSources.value[id]) {
      dataSources.value[id] = { ...dataSources.value[id], ...updates }
    }
  }

  function removeDataSource(id: string) {
    delete dataSources.value[id]
  }

  // 数据流操作
  function addDataFlow(config: any) {
    const flow = dataFlowManager.createDataFlow(config)
    dataFlows.value[flow.id] = flow
    return flow.id
  }

  function updateDataFlow(id: string, updates: any) {
    dataFlowManager.updateDataFlow(id, updates)
    const flow = dataFlowManager.getDataFlow(id)
    if (flow) {
      dataFlows.value[id] = flow
    }
  }

  function removeDataFlow(id: string) {
    dataFlowManager.deleteDataFlow(id)
    delete dataFlows.value[id]
  }

  // 数据操作
  function addDataAction(config: any) {
    const action = dataActionManager.createDataAction(config)
    dataActions.value[action.id] = action
    return action.id
  }

  function updateDataAction(id: string, updates: any) {
    dataActionManager.updateDataAction(id, updates)
    const action = dataActionManager.getDataAction(id)
    if (action) {
      dataActions.value[id] = action
    }
  }

  function removeDataAction(id: string) {
    dataActionManager.deleteDataAction(id)
    delete dataActions.value[id]
  }

  // 数据绑定操作
  function bindControl(controlId: string, controlName: string, controlKind: string, binding: any) {
    dataBindingManager.createBinding(controlId, controlName, controlKind, binding)
  }

  function unbindControl(controlId: string) {
    dataBindingManager.removeBinding(controlId)
  }

  return {
    // ... 现有返回值 ...

    // 数据管理器
    dataBindingManager,
    dataFlowManager,
    dataActionManager,

    // 数据状态
    dataSources,
    dataFlows,
    dataActions,

    // 数据操作方法
    addDataSource,
    updateDataSource,
    removeDataSource,
    addDataFlow,
    updateDataFlow,
    removeDataFlow,
    addDataAction,
    updateDataAction,
    removeDataAction,
    bindControl,
    unbindControl,
  }
}
```

### 4. 数据持久化

需要在保存和加载设计时包含数据配置。

**建议实现**:

```typescript
// 保存设计
async function saveDesign() {
  const design = {
    rootView: currentView.value,
    dataSources: dataSources.value,
    dataFlows: dataFlows.value,
    dataActions: dataActions.value,
  }

  await api.saveDesign(design)
}

// 加载设计
async function loadDesign(id: string) {
  const design = await api.loadDesign(id)

  currentView.value = design.rootView
  dataSources.value = design.dataSources || {}
  dataFlows.value = design.dataFlows || {}
  dataActions.value = design.dataActions || {}

  // 恢复管理器状态
  Object.values(dataFlows.value).forEach(flow => {
    dataFlowManager.createDataFlow(flow)
  })

  Object.values(dataActions.value).forEach(action => {
    dataActionManager.createDataAction(action)
  })
}
```

### 5. 运行时集成

需要在运行时初始化数据绑定执行器。

**建议实现**:

```typescript
// src/core/runtime/index.ts

import { RuntimeManager } from './RuntimeManager'
import { DataBindingExecutor } from './DataBindingExecutor'

export function initializeRuntime(design: any) {
  const runtimeManager = new RuntimeManager(dataSourceManager, dataFlowManager)

  const bindingExecutor = runtimeManager.getDataBindingExecutor()

  // 初始化所有数据绑定
  design.rootView.controls.forEach((control: any) => {
    if (control.dataBinding) {
      bindingExecutor.bindControl(control, control.dataBinding)
    }
  })

  return runtimeManager
}
```

## 🔧 使用示例

### 完整的设计器集成示例

```vue
<template>
  <div class="designer">
    <!-- 工具栏 -->
    <div class="toolbar">
      <a-button @click="showDataConfig = true">
        <DatabaseOutlined />
        数据配置
      </a-button>
    </div>

    <!-- 画布 -->
    <div class="canvas">
      <!-- 画布内容 -->
    </div>

    <!-- 属性面板 -->
    <div class="properties">
      <PropertiesPanel
        :control="selectedControl"
        :dataSources="dataSourcesList"
        :dataFlows="dataFlowsList"
        @update="handlePropertyUpdate"
        @updateBinding="handleBindingUpdate"
      />
    </div>

    <!-- 数据配置弹框 -->
    <DataSourceConfigModal
      v-model="showDataConfig"
      :dataSources="dataSources"
      :dataFlows="dataFlows"
      :operations="dataActions"
      @save="handleDataConfigSave"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { DatabaseOutlined } from '@ant-design/icons-vue'
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'
import DataSourceConfigModal from '@/core/renderer/designer/communication/DataSourceConfigModal.vue'
import { useDesignerState } from '@/core/renderer/designer/composables/useDesignerState'

const { selectedControl, dataSources, dataFlows, dataActions, updateControl, bindControl, unbindControl } = useDesignerState()

const showDataConfig = ref(false)

// 转换为列表格式
const dataSourcesList = computed(() => Object.values(dataSources.value))
const dataFlowsList = computed(() => Object.values(dataFlows.value))

// 属性更新
function handlePropertyUpdate(property: string, value: any) {
  if (selectedControl.value) {
    updateControl(selectedControl.value.id, { [property]: value })
  }
}

// 数据绑定更新
function handleBindingUpdate(binding: any) {
  if (selectedControl.value) {
    if (binding) {
      bindControl(selectedControl.value.id, selectedControl.value.name || '', selectedControl.value.kind, binding)
      updateControl(selectedControl.value.id, { dataBinding: binding })
    } else {
      unbindControl(selectedControl.value.id)
      updateControl(selectedControl.value.id, { dataBinding: undefined })
    }
  }
}

// 数据配置保存
function handleDataConfigSave(data: any) {
  dataSources.value = data.dataSources
  dataFlows.value = data.dataFlows
  dataActions.value = data.operations
}
</script>

<style scoped>
.designer {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.toolbar {
  padding: 12px;
  border-bottom: 1px solid #e8e8e8;
}

.canvas {
  flex: 1;
  overflow: auto;
}

.properties {
  width: 300px;
  border-left: 1px solid #e8e8e8;
}
</style>
```

## 📊 数据流示例

### 创建和使用数据流

```typescript
// 1. 创建数据源
const userDataSource = {
  id: 'users_api',
  name: '用户API',
  type: 'api',
  config: {
    url: 'https://api.example.com/users',
    method: 'GET',
  },
}

// 2. 创建数据流
const userFlow = {
  name: '活跃用户过滤',
  sourceId: 'users_api',
  transforms: [
    {
      id: 'filter_1',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [
          { field: 'status', operator: 'eq', value: 'active' },
          { field: 'age', operator: 'gte', value: 18 },
        ],
        logic: 'AND',
      },
    },
    {
      id: 'sort_1',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'name', order: 'asc' }],
      },
    },
  ],
}

// 3. 绑定到组件
const tableBinding = {
  source: 'users_api',
  bindingType: 'dataflow',
  dataFlowId: userFlow.id,
  propertyPath: 'data',
  autoLoad: true,
  refreshInterval: 30000, // 30秒刷新一次
}
```

## 🎯 测试清单

- [ ] 数据源配置弹框可以正常打开
- [ ] 可以创建、编辑、删除数据源
- [ ] 可以创建、编辑、删除数据流
- [ ] 可以创建、编辑、删除数据操作
- [ ] 属性面板显示数据绑定选项卡
- [ ] 可以配置数据绑定
- [ ] 可以保存和清除数据绑定
- [ ] 数据绑定配置保存到control对象
- [ ] 设计保存时包含数据配置
- [ ] 设计加载时恢复数据配置

## 📝 注意事项

1. **类型安全**: 确保所有数据类型与 `src/types/index.ts` 中的定义一致
2. **错误处理**: 添加适当的错误处理和用户提示
3. **性能优化**: 大量数据时考虑虚拟滚动和懒加载
4. **数据验证**: 保存前验证数据的完整性和正确性
5. **向后兼容**: 确保旧版本的设计文件可以正常加载

## 🚀 下一步

1. 完成设计器状态管理集成
2. 实现数据持久化
3. 实现运行时数据绑定执行
4. 添加数据预览功能
5. 添加数据操作测试功能
6. 完善错误处理和用户提示

---

**更新日期**: 2025-10-11  
**版本**: 1.0.0  
**状态**: ✅ UI集成已完成，待完成状态管理和运行时集成
