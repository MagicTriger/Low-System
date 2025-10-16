# 数据绑定功能示例

## 📝 完整示例

### 示例1：用户列表过滤和排序

```typescript
import { DataFlowManager } from '@/core/renderer/designer/managers'
import { DataFlowEngine } from '@/core/runtime/DataFlowEngine'

// 1. 创建数据流管理器
const manager = new DataFlowManager()

// 2. 创建数据流
const userFlow = manager.createDataFlow({
  name: '成年用户列表',
  description: '过滤出18岁以上的活跃用户，按姓名排序',
  sourceId: 'users_api',
  transforms: [
    // 过滤：年龄>=18且状态为active
    {
      id: 'filter_age_status',
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
    // 排序：按姓名升序
    {
      id: 'sort_by_name',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'name', order: 'asc' }],
      },
    },
  ],
})

// 3. 准备测试数据
const users = [
  { id: 1, name: 'Charlie', age: 25, status: 'active' },
  { id: 2, name: 'Alice', age: 17, status: 'active' },
  { id: 3, name: 'Bob', age: 30, status: 'inactive' },
  { id: 4, name: 'David', age: 22, status: 'active' },
]

// 4. 执行数据流
const engine = new DataFlowEngine()
const result = await engine.execute(userFlow, users)

console.log(result)
// 输出: [
//   { id: 4, name: 'David', age: 22, status: 'active' },
//   { id: 1, name: 'Charlie', age: 25, status: 'active' }
// ]
```

### 示例2：销售数据聚合分析

```typescript
// 1. 创建数据流
const salesFlow = manager.createDataFlow({
  name: '部门销售统计',
  description: '按部门统计销售额和订单数',
  sourceId: 'sales_api',
  transforms: [
    // 过滤：只要已完成的订单
    {
      id: 'filter_completed',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [{ field: 'status', operator: 'eq', value: 'completed' }],
        logic: 'AND',
      },
    },
    // 聚合：按部门统计
    {
      id: 'aggregate_by_dept',
      type: 'aggregate',
      enabled: true,
      config: {
        type: 'aggregate',
        groupBy: ['department'],
        aggregations: [
          { field: 'amount', function: 'sum', alias: 'totalSales' },
          { field: 'id', function: 'count', alias: 'orderCount' },
          { field: 'amount', function: 'avg', alias: 'avgOrderValue' },
        ],
      },
    },
    // 排序：按总销售额降序
    {
      id: 'sort_by_sales',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'totalSales', order: 'desc' }],
      },
    },
  ],
})

// 2. 测试数据
const sales = [
  { id: 1, department: 'Sales', amount: 1000, status: 'completed' },
  { id: 2, department: 'Marketing', amount: 500, status: 'completed' },
  { id: 3, department: 'Sales', amount: 1500, status: 'completed' },
  { id: 4, department: 'Sales', amount: 800, status: 'pending' },
  { id: 5, department: 'Marketing', amount: 700, status: 'completed' },
]

// 3. 执行
const result = await engine.execute(salesFlow, sales)

console.log(result)
// 输出: [
//   { department: 'Sales', totalSales: 2500, orderCount: 2, avgOrderValue: 1250 },
//   { department: 'Marketing', totalSales: 1200, orderCount: 2, avgOrderValue: 600 }
// ]
```

### 示例3：数据映射和转换

```typescript
// 1. 创建数据流
const transformFlow = manager.createDataFlow({
  name: '用户数据转换',
  description: '将原始用户数据转换为显示格式',
  sourceId: 'raw_users_api',
  transforms: [
    // 映射：重命名和计算字段
    {
      id: 'map_fields',
      type: 'map',
      enabled: true,
      config: {
        type: 'map',
        mappings: [
          { source: 'first_name', target: 'firstName' },
          { source: 'last_name', target: 'lastName' },
          { source: 'email', target: 'email', transform: 'value.toLowerCase()' },
          { source: 'birth_year', target: 'age', transform: '2025 - value' },
          { source: 'salary', target: 'monthlySalary', transform: 'value / 12' },
        ],
      },
    },
  ],
})

// 2. 测试数据
const rawUsers = [
  { first_name: 'John', last_name: 'Doe', email: 'JOHN@EXAMPLE.COM', birth_year: 1990, salary: 60000 },
  { first_name: 'Jane', last_name: 'Smith', email: 'JANE@EXAMPLE.COM', birth_year: 1985, salary: 72000 },
]

// 3. 执行
const result = await engine.execute(transformFlow, rawUsers)

console.log(result)
// 输出: [
//   { firstName: 'John', lastName: 'Doe', email: 'john@example.com', age: 35, monthlySalary: 5000 },
//   { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', age: 40, monthlySalary: 6000 }
// ]
```

### 示例4：复杂的多步骤转换

```typescript
// 1. 创建数据流
const complexFlow = manager.createDataFlow({
  name: '产品销售分析',
  description: '分析产品销售情况，包括过滤、映射、聚合和排序',
  sourceId: 'product_sales_api',
  transforms: [
    // 步骤1：过滤 - 只要今年的销售记录
    {
      id: 'filter_year',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [{ field: 'year', operator: 'eq', value: 2025 }],
        logic: 'AND',
      },
    },
    // 步骤2：映射 - 计算利润
    {
      id: 'map_profit',
      type: 'map',
      enabled: true,
      config: {
        type: 'map',
        mappings: [
          { source: 'product', target: 'product' },
          { source: 'category', target: 'category' },
          { source: 'revenue', target: 'revenue' },
          { source: 'cost', target: 'cost' },
          { source: 'revenue', target: 'profit', transform: 'value - obj.cost' },
        ],
      },
    },
    // 步骤3：聚合 - 按类别统计
    {
      id: 'aggregate_category',
      type: 'aggregate',
      enabled: true,
      config: {
        type: 'aggregate',
        groupBy: ['category'],
        aggregations: [
          { field: 'revenue', function: 'sum', alias: 'totalRevenue' },
          { field: 'profit', function: 'sum', alias: 'totalProfit' },
          { field: 'product', function: 'count', alias: 'productCount' },
        ],
      },
    },
    // 步骤4：排序 - 按利润降序
    {
      id: 'sort_profit',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'totalProfit', order: 'desc' }],
      },
    },
  ],
})
```

### 示例5：数据操作 - CRUD

```typescript
import { DataActionManager } from '@/core/renderer/designer/managers'
import { DataActionExecutor } from '@/core/runtime/DataActionExecutor'

const actionManager = new DataActionManager()
const executor = new DataActionExecutor()

// 1. 创建操作
const createUserAction = actionManager.createDataAction({
  name: '创建用户',
  type: 'create',
  sourceId: 'users_api',
  config: {
    type: 'create',
    dataMapping: {
      name: 'form.name',
      email: 'form.email',
      age: 'form.age',
      department: 'form.department',
    },
    onSuccess: [
      {
        type: 'control',
        target: 'userTable',
        method: 'refresh',
        params: {},
      },
      {
        type: 'control',
        target: 'createForm',
        method: 'reset',
        params: {},
      },
    ],
    onError: [
      {
        type: 'global',
        target: 'notification',
        method: 'error',
        params: { message: '创建用户失败' },
      },
    ],
  },
})

// 2. 读取操作
const readUsersAction = actionManager.createDataAction({
  name: '读取用户列表',
  type: 'read',
  sourceId: 'users_api',
  config: {
    type: 'read',
    params: {
      status: 'active',
      department: 'Sales',
    },
    pagination: {
      enabled: true,
      pageSize: 20,
    },
    onSuccess: [
      {
        type: 'control',
        target: 'userTable',
        method: 'setData',
        params: {},
      },
    ],
  },
})

// 3. 更新操作
const updateUserAction = actionManager.createDataAction({
  name: '更新用户',
  type: 'update',
  sourceId: 'users_api',
  config: {
    type: 'update',
    condition: {
      id: 'selectedUser.id',
    },
    dataMapping: {
      name: 'form.name',
      email: 'form.email',
      department: 'form.department',
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

// 4. 删除操作
const deleteUserAction = actionManager.createDataAction({
  name: '删除用户',
  type: 'delete',
  sourceId: 'users_api',
  config: {
    type: 'delete',
    condition: {
      id: 'selectedUser.id',
    },
    confirmMessage: '确定要删除这个用户吗？',
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

// 5. 执行操作
const context = {
  form: {
    name: 'Alice',
    email: 'alice@example.com',
    age: 25,
    department: 'Sales',
  },
}

await executor.execute(createUserAction, context)
```

### 示例6：数据绑定

```typescript
import { DataBindingManager } from '@/core/renderer/designer/managers'
import { DataBindingExecutor } from '@/core/runtime/DataBindingExecutor'

const bindingManager = new DataBindingManager()
const bindingExecutor = new DataBindingExecutor(dataSourceManager, dataFlowManager)

// 1. 直接绑定 - 表格绑定到数据源
bindingManager.createBinding('userTable', '用户表格', 'Table', {
  source: 'users_api',
  bindingType: 'direct',
  propertyPath: 'data',
  autoLoad: true,
})

// 2. 数据流绑定 - 表格绑定到过滤后的数据
bindingManager.createBinding('filteredTable', '过滤表格', 'Table', {
  source: 'users_api',
  bindingType: 'dataflow',
  dataFlowId: userFlow.id,
  propertyPath: 'data',
  autoLoad: true,
  refreshInterval: 30000, // 30秒刷新一次
})

// 3. 手动绑定 - 通过按钮点击加载
bindingManager.createBinding('manualTable', '手动表格', 'Table', {
  source: 'users_api',
  bindingType: 'manual',
  propertyPath: 'data',
  autoLoad: false,
})

// 4. 执行绑定
const control = {
  id: 'userTable',
  kind: 'Table',
  dataSource: [],
}

const binding = bindingManager.getBinding('userTable')
if (binding) {
  await bindingExecutor.bindControl(control, binding)
}

// 5. 刷新绑定
await bindingExecutor.refreshBinding('userTable', control, binding)

// 6. 解绑
bindingExecutor.unbindControl('userTable')
```

### 示例7：在Vue组件中使用

```vue
<template>
  <div class="data-binding-demo">
    <!-- 数据流面板 -->
    <div class="panel">
      <h3>数据流配置</h3>
      <DataFlowPanel :dataFlows="dataFlows" :dataSources="dataSources" @update:dataFlows="handleDataFlowsUpdate" />
    </div>

    <!-- 数据操作面板 -->
    <div class="panel">
      <h3>数据操作配置</h3>
      <DataActionPanel :dataActions="dataActions" :dataSources="dataSources" @update:dataActions="handleDataActionsUpdate" />
    </div>

    <!-- 数据展示 -->
    <div class="panel">
      <h3>数据展示</h3>
      <a-button @click="executeDataFlow">执行数据流</a-button>
      <a-table :dataSource="tableData" :columns="columns" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DataFlowPanel from '@/core/renderer/designer/communication/DataFlowPanel.vue'
import DataActionPanel from '@/core/renderer/designer/communication/DataActionPanel.vue'
import { DataFlowEngine } from '@/core/runtime/DataFlowEngine'

const dataFlows = ref({})
const dataActions = ref({})
const tableData = ref([])

const dataSources = ref([
  { id: 'users_api', name: '用户API' },
  { id: 'products_api', name: '产品API' },
])

const columns = [
  { title: '姓名', dataIndex: 'name', key: 'name' },
  { title: '年龄', dataIndex: 'age', key: 'age' },
  { title: '状态', dataIndex: 'status', key: 'status' },
]

function handleDataFlowsUpdate(newDataFlows) {
  dataFlows.value = newDataFlows
}

function handleDataActionsUpdate(newDataActions) {
  dataActions.value = newDataActions
}

async function executeDataFlow() {
  const engine = new DataFlowEngine()
  const sourceData = [
    { id: 1, name: 'Alice', age: 25, status: 'active' },
    { id: 2, name: 'Bob', age: 17, status: 'active' },
    { id: 3, name: 'Charlie', age: 30, status: 'inactive' },
  ]

  // 获取第一个数据流
  const firstFlow = Object.values(dataFlows.value)[0]
  if (firstFlow) {
    const result = await engine.execute(firstFlow, sourceData)
    tableData.value = result
  }
}
</script>

<style scoped>
.data-binding-demo {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
}

.panel {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  padding: 16px;
}
</style>
```

## 🎯 实际应用场景

### 场景1：电商订单管理

```typescript
// 创建订单数据流：过滤待处理订单，按时间排序
const orderFlow = manager.createDataFlow({
  name: '待处理订单',
  sourceId: 'orders_api',
  transforms: [
    {
      id: 'filter_pending',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [{ field: 'status', operator: 'eq', value: 'pending' }],
        logic: 'AND',
      },
    },
    {
      id: 'sort_time',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'createdAt', order: 'desc' }],
      },
    },
  ],
})
```

### 场景2：数据报表

```typescript
// 创建销售报表数据流：按月份聚合销售数据
const reportFlow = manager.createDataFlow({
  name: '月度销售报表',
  sourceId: 'sales_api',
  transforms: [
    {
      id: 'aggregate_monthly',
      type: 'aggregate',
      enabled: true,
      config: {
        type: 'aggregate',
        groupBy: ['month'],
        aggregations: [
          { field: 'amount', function: 'sum', alias: 'totalSales' },
          { field: 'id', function: 'count', alias: 'orderCount' },
        ],
      },
    },
  ],
})
```

---

**更新日期**: 2025-10-11  
**版本**: 1.0.0
