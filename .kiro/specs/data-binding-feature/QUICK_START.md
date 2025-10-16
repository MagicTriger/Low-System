# 数据绑定功能快速开始指南

## 🚀 快速开始

### 1. 导入管理器

```typescript
import { DataBindingManager, DataFlowManager, DataActionManager } from '@/core/renderer/designer/managers'
```

### 2. 创建管理器实例

```typescript
// 在设计器初始化时创建
const dataBindingManager = new DataBindingManager()
const dataFlowManager = new DataFlowManager()
const dataActionManager = new DataActionManager()
```

### 3. 使用数据流

#### 创建数据流

```typescript
const dataFlow = dataFlowManager.createDataFlow({
  name: '用户数据过滤',
  sourceId: 'users_api',
  transforms: [
    {
      id: 'filter_1',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [
          { field: 'age', operator: 'gte', value: 18 },
          { field: 'status', operator: 'eq', value: 'active' },
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
})
```

#### 执行数据流

```typescript
import { DataFlowEngine } from '@/core/runtime/DataFlowEngine'

const engine = new DataFlowEngine()
const sourceData = [
  { id: 1, name: 'Alice', age: 25, status: 'active' },
  { id: 2, name: 'Bob', age: 17, status: 'active' },
  { id: 3, name: 'Charlie', age: 30, status: 'inactive' },
]

const result = await engine.execute(dataFlow, sourceData)
// 结果: [{ id: 1, name: 'Alice', age: 25, status: 'active' }]
```

### 4. 使用数据操作

#### 创建数据操作

```typescript
const createAction = dataActionManager.createDataAction({
  name: '创建用户',
  type: 'create',
  sourceId: 'users_api',
  config: {
    type: 'create',
    dataMapping: {
      name: 'form.name',
      email: 'form.email',
      age: 'form.age',
    },
    onSuccess: [
      {
        type: 'control',
        target: 'userTable',
        method: 'refresh',
        params: {},
      },
    ],
  },
})
```

#### 执行数据操作

```typescript
import { DataActionExecutor } from '@/core/runtime/DataActionExecutor'

const executor = new DataActionExecutor()
const context = {
  form: {
    name: 'Alice',
    email: 'alice@example.com',
    age: 25,
  },
}

const result = await executor.execute(createAction, context)
```

### 5. 使用数据绑定

#### 创建绑定

```typescript
// 直接绑定到数据源
dataBindingManager.createBinding('table_1', '用户表格', 'Table', {
  source: 'users_api',
  bindingType: 'direct',
  propertyPath: 'data',
  autoLoad: true,
})

// 绑定到数据流
dataBindingManager.createBinding('table_2', '过滤后的用户', 'Table', {
  source: 'users_api',
  bindingType: 'dataflow',
  dataFlowId: dataFlow.id,
  propertyPath: 'data',
  autoLoad: true,
  refreshInterval: 30000, // 30秒自动刷新
})
```

#### 执行绑定

```typescript
import { DataBindingExecutor } from '@/core/runtime/DataBindingExecutor'

const executor = new DataBindingExecutor(dataSourceManager, dataFlowManager)

// 绑定组件
await executor.bindControl(control, binding)

// 刷新绑定
await executor.refreshBinding(control.id, control, binding)

// 解绑组件
executor.unbindControl(control.id)
```

## 📦 在Vue组件中使用

### 数据流面板

```vue
<template>
  <DataFlowPanel :dataFlows="dataFlows" :dataSources="dataSources" @update:dataFlows="handleDataFlowsUpdate" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataFlowPanel from '@/core/renderer/designer/communication/DataFlowPanel.vue'

const dataFlows = ref({})
const dataSources = ref([
  { id: 'users_api', name: '用户API' },
  { id: 'products_api', name: '产品API' },
])

function handleDataFlowsUpdate(newDataFlows) {
  dataFlows.value = newDataFlows
}
</script>
```

### 数据操作面板

```vue
<template>
  <DataActionPanel :dataActions="dataActions" :dataSources="dataSources" @update:dataActions="handleDataActionsUpdate" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataActionPanel from '@/core/renderer/designer/communication/DataActionPanel.vue'

const dataActions = ref({})
const dataSources = ref([
  { id: 'users_api', name: '用户API' },
  { id: 'products_api', name: '产品API' },
])

function handleDataActionsUpdate(newDataActions) {
  dataActions.value = newDataActions
}
</script>
```

## 🔧 高级用法

### 自定义转换

#### 映射转换with表达式

```typescript
{
  id: 'map_1',
  type: 'map',
  enabled: true,
  config: {
    type: 'map',
    mappings: [
      { source: 'firstName', target: 'name' },
      { source: 'age', target: 'age', transform: 'value * 2' },
      { source: 'email', target: 'contact', transform: 'value.toLowerCase()' }
    ]
  }
}
```

#### 聚合转换

```typescript
{
  id: 'agg_1',
  type: 'aggregate',
  enabled: true,
  config: {
    type: 'aggregate',
    groupBy: ['department'],
    aggregations: [
      { field: 'salary', function: 'avg', alias: 'avgSalary' },
      { field: 'id', function: 'count', alias: 'employeeCount' },
      { field: 'salary', function: 'max', alias: 'maxSalary' }
    ]
  }
}
```

### 链式转换

```typescript
const dataFlow = dataFlowManager.createDataFlow({
  name: '复杂数据处理',
  sourceId: 'employees_api',
  transforms: [
    // 1. 过滤：只要活跃员工
    {
      id: 'filter_1',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [{ field: 'status', operator: 'eq', value: 'active' }],
        logic: 'AND',
      },
    },
    // 2. 映射：重命名字段
    {
      id: 'map_1',
      type: 'map',
      enabled: true,
      config: {
        type: 'map',
        mappings: [
          { source: 'firstName', target: 'name' },
          { source: 'department', target: 'dept' },
          { source: 'salary', target: 'salary' },
        ],
      },
    },
    // 3. 聚合：按部门统计
    {
      id: 'agg_1',
      type: 'aggregate',
      enabled: true,
      config: {
        type: 'aggregate',
        groupBy: ['dept'],
        aggregations: [
          { field: 'salary', function: 'avg', alias: 'avgSalary' },
          { field: 'name', function: 'count', alias: 'count' },
        ],
      },
    },
    // 4. 排序：按平均工资降序
    {
      id: 'sort_1',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'avgSalary', order: 'desc' }],
      },
    },
  ],
})
```

## 🎯 最佳实践

### 1. 错误处理

```typescript
try {
  const result = await engine.execute(dataFlow, sourceData)
} catch (error) {
  if (error instanceof DataError) {
    console.error(`错误类型: ${error.type}`)
    console.error(`错误详情:`, error.details)
  }
}
```

### 2. 性能优化

```typescript
// 禁用不需要的转换步骤
dataFlowManager.updateTransform(flowId, transformId, {
  ...config,
  enabled: false,
})

// 使用缓存
const cachedResult = dataFlow.output
if (cachedResult) {
  return cachedResult
}
```

### 3. 数据验证

```typescript
// 在执行前验证数据
if (!Array.isArray(sourceData)) {
  throw new Error('数据源必须是数组')
}

if (sourceData.length === 0) {
  console.warn('数据源为空')
  return []
}
```

## 📚 API参考

### DataFlowManager

- `createDataFlow(config)` - 创建数据流
- `updateDataFlow(id, updates)` - 更新数据流
- `deleteDataFlow(id)` - 删除数据流
- `getDataFlow(id)` - 获取数据流
- `addTransform(flowId, transform)` - 添加转换步骤
- `removeTransform(flowId, transformId)` - 移除转换步骤

### DataActionManager

- `createDataAction(config)` - 创建数据操作
- `updateDataAction(id, updates)` - 更新数据操作
- `deleteDataAction(id)` - 删除数据操作
- `getDataAction(id)` - 获取数据操作
- `getDataActionsByType(type)` - 按类型获取操作

### DataBindingManager

- `createBinding(controlId, name, kind, binding)` - 创建绑定
- `updateBinding(controlId, updates)` - 更新绑定
- `removeBinding(controlId)` - 删除绑定
- `getBinding(controlId)` - 获取绑定
- `getBindingsBySource(sourceId)` - 获取数据源的所有绑定

## 🐛 故障排除

### 问题：数据流执行失败

**解决方案**：

1. 检查数据源是否存在
2. 验证转换配置是否正确
3. 查看错误详情中的具体信息

### 问题：数据绑定不更新

**解决方案**：

1. 确认 `autoLoad` 设置为 `true`
2. 检查数据源是否有变化
3. 验证 `propertyPath` 是否正确

### 问题：数据操作回调不执行

**解决方案**：

1. 确认回调配置正确
2. 检查目标组件是否存在
3. 验证方法名称是否正确

---

**更新日期**: 2025-10-11  
**版本**: 1.0.0
