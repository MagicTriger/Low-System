# API 参考文档

## 📚 目录

- [类型定义](#类型定义)
- [管理器API](#管理器api)
- [执行器API](#执行器api)
- [UI组件API](#ui组件api)

---

## 类型定义

### DataBinding

数据绑定配置接口

```typescript
interface DataBinding {
  source: string // 数据源ID
  bindingType?: 'direct' | 'dataflow' | 'manual' // 绑定类型
  dataFlowId?: string // 数据流ID
  propertyPath?: string // 属性路径
  autoLoad?: boolean // 是否自动加载
  refreshInterval?: number // 刷新间隔（毫秒）
  transform?: string // 转换表达式
  objectCode?: string // 对象代码
  propertyCode?: string // 属性代码
  inherit?: boolean // 是否继承
}
```

### DataFlow

数据流配置接口

```typescript
interface DataFlow {
  id: string // 数据流ID
  name: string // 数据流名称
  description?: string // 描述
  sourceId: string // 数据源ID
  transforms: DataTransform[] // 转换步骤
  output?: any // 输出数据（缓存）
  enabled: boolean // 是否启用
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}
```

### DataTransform

数据转换配置接口

```typescript
interface DataTransform {
  id: string // 转换ID
  type: 'filter' | 'map' | 'sort' | 'aggregate' // 转换类型
  config: TransformConfig // 转换配置
  enabled: boolean // 是否启用
}
```

### FilterConfig

过滤配置接口

```typescript
interface FilterConfig {
  type: 'filter'
  conditions: FilterCondition[] // 过滤条件
  logic: 'AND' | 'OR' // 逻辑运算符
}

interface FilterCondition {
  field: string // 字段名
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith' // 运算符
  value: any // 比较值
}
```

### MapConfig

映射配置接口

```typescript
interface MapConfig {
  type: 'map'
  mappings: FieldMapping[] // 字段映射
}

interface FieldMapping {
  source: string // 源字段路径
  target: string // 目标字段名
  transform?: string // 转换表达式
}
```

### SortConfig

排序配置接口

```typescript
interface SortConfig {
  type: 'sort'
  fields: SortField[] // 排序字段
}

interface SortField {
  field: string // 字段名
  order: 'asc' | 'desc' // 排序方向
}
```

### AggregateConfig

聚合配置接口

```typescript
interface AggregateConfig {
  type: 'aggregate'
  groupBy: string[] // 分组字段
  aggregations: Aggregation[] // 聚合函数
}

interface Aggregation {
  field: string // 字段名
  function: 'count' | 'sum' | 'avg' | 'min' | 'max' // 聚合函数
  alias: string // 别名
}
```

### DataAction

数据操作配置接口

```typescript
interface DataAction {
  id: string // 操作ID
  name: string // 操作名称
  description?: string // 描述
  type: 'create' | 'read' | 'update' | 'delete' // 操作类型
  sourceId: string // 数据源ID
  config: ActionConfig // 操作配置
  enabled: boolean // 是否启用
  createdAt: number // 创建时间
  updatedAt: number // 更新时间
}
```

---

## 管理器API

### DataBindingManager

数据绑定管理器

#### 构造函数

```typescript
constructor()
```

#### 方法

##### createBinding

创建数据绑定

```typescript
createBinding(
  controlId: string,
  controlName: string,
  controlKind: string,
  binding: DataBinding
): void
```

**参数**:

- `controlId`: 组件ID
- `controlName`: 组件名称
- `controlKind`: 组件类型
- `binding`: 绑定配置

**示例**:

```typescript
manager.createBinding('table_1', '用户表格', 'Table', {
  source: 'users_api',
  bindingType: 'direct',
  autoLoad: true,
})
```

##### updateBinding

更新数据绑定

```typescript
updateBinding(controlId: string, updates: Partial<DataBinding>): void
```

**参数**:

- `controlId`: 组件ID
- `updates`: 更新的配置

**示例**:

```typescript
manager.updateBinding('table_1', {
  refreshInterval: 60000,
})
```

##### removeBinding

删除数据绑定

```typescript
removeBinding(controlId: string): void
```

##### getBinding

获取数据绑定

```typescript
getBinding(controlId: string): DataBinding | undefined
```

##### getBindingsBySource

获取数据源的所有绑定

```typescript
getBindingsBySource(sourceId: string): ComponentBinding[]
```

##### getBindingsByDataFlow

获取数据流的所有绑定

```typescript
getBindingsByDataFlow(flowId: string): ComponentBinding[]
```

##### getAllBindings

获取所有绑定

```typescript
getAllBindings(): ComponentBinding[]
```

---

### DataFlowManager

数据流管理器

#### 构造函数

```typescript
constructor()
```

#### 方法

##### createDataFlow

创建数据流

```typescript
createDataFlow(config: Partial<DataFlow>): DataFlow
```

**参数**:

- `config`: 数据流配置

**返回**: 创建的数据流对象

**示例**:

```typescript
const flow = manager.createDataFlow({
  name: '用户过滤',
  sourceId: 'users_api',
  transforms: [],
})
```

##### updateDataFlow

更新数据流

```typescript
updateDataFlow(id: string, updates: Partial<DataFlow>): void
```

##### deleteDataFlow

删除数据流

```typescript
deleteDataFlow(id: string): void
```

##### getDataFlow

获取数据流

```typescript
getDataFlow(id: string): DataFlow | undefined
```

##### getAllDataFlows

获取所有数据流

```typescript
getAllDataFlows(): DataFlow[]
```

##### getDataFlowsBySource

获取数据源的所有数据流

```typescript
getDataFlowsBySource(sourceId: string): DataFlow[]
```

##### addTransform

添加转换步骤

```typescript
addTransform(flowId: string, transform: DataTransform): void
```

**示例**:

```typescript
manager.addTransform('flow_1', {
  id: 'filter_1',
  type: 'filter',
  enabled: true,
  config: {
    type: 'filter',
    conditions: [{ field: 'age', operator: 'gte', value: 18 }],
    logic: 'AND',
  },
})
```

##### removeTransform

移除转换步骤

```typescript
removeTransform(flowId: string, transformId: string): void
```

##### updateTransform

更新转换步骤

```typescript
updateTransform(flowId: string, transformId: string, config: TransformConfig): void
```

##### reorderTransforms

重新排序转换步骤

```typescript
reorderTransforms(flowId: string, transformIds: string[]): void
```

---

### DataActionManager

数据操作管理器

#### 构造函数

```typescript
constructor()
```

#### 方法

##### createDataAction

创建数据操作

```typescript
createDataAction(config: Partial<DataAction>): DataAction
```

##### updateDataAction

更新数据操作

```typescript
updateDataAction(id: string, updates: Partial<DataAction>): void
```

##### deleteDataAction

删除数据操作

```typescript
deleteDataAction(id: string): void
```

##### getDataAction

获取数据操作

```typescript
getDataAction(id: string): DataAction | undefined
```

##### getAllDataActions

获取所有数据操作

```typescript
getAllDataActions(): DataAction[]
```

##### getDataActionsByType

按类型获取数据操作

```typescript
getDataActionsByType(type: 'create' | 'read' | 'update' | 'delete'): DataAction[]
```

##### getDataActionsBySource

获取数据源的所有数据操作

```typescript
getDataActionsBySource(sourceId: string): DataAction[]
```

---

## 执行器API

### DataFlowEngine

数据流引擎

#### 构造函数

```typescript
constructor()
```

#### 方法

##### execute

执行数据流

```typescript
async execute(flow: DataFlow, sourceData: any): Promise<any>
```

**参数**:

- `flow`: 数据流配置
- `sourceData`: 源数据

**返回**: 转换后的数据

**抛出**: `DataError` - 执行失败时

**示例**:

```typescript
const engine = new DataFlowEngine()
const result = await engine.execute(flow, sourceData)
```

---

### DataBindingExecutor

数据绑定执行器

#### 构造函数

```typescript
constructor(dataSourceManager?: any, dataFlowManager?: any)
```

**参数**:

- `dataSourceManager`: 数据源管理器实例
- `dataFlowManager`: 数据流管理器实例

#### 方法

##### bindControl

绑定组件

```typescript
async bindControl(control: Control, binding: DataBinding): Promise<void>
```

**参数**:

- `control`: 组件对象
- `binding`: 绑定配置

**示例**:

```typescript
const executor = new DataBindingExecutor(dsManager, dfManager)
await executor.bindControl(control, binding)
```

##### unbindControl

解绑组件

```typescript
unbindControl(controlId: string): void
```

##### refreshBinding

刷新绑定数据

```typescript
async refreshBinding(controlId: string, control: Control, binding: DataBinding): Promise<void>
```

---

### DataActionExecutor

数据操作执行器

#### 构造函数

```typescript
constructor(dataSourceManager?: any)
```

**参数**:

- `dataSourceManager`: 数据源管理器实例

#### 方法

##### execute

执行数据操作

```typescript
async execute(action: DataAction, context?: any): Promise<any>
```

**参数**:

- `action`: 数据操作配置
- `context`: 执行上下文

**返回**: 操作结果

**抛出**: `DataError` - 执行失败时

**示例**:

```typescript
const executor = new DataActionExecutor(dsManager)
const result = await executor.execute(action, context)
```

---

### RuntimeManager

运行时管理器

#### 构造函数

```typescript
constructor(dataSourceManager?: any, dataFlowManager?: any)
```

#### 方法

##### getDataFlowEngine

获取数据流引擎

```typescript
getDataFlowEngine(): DataFlowEngine
```

##### getDataActionExecutor

获取数据操作执行器

```typescript
getDataActionExecutor(): DataActionExecutor
```

##### getDataBindingExecutor

获取数据绑定执行器

```typescript
getDataBindingExecutor(): DataBindingExecutor
```

##### initialize

初始化运行时

```typescript
async initialize(): Promise<void>
```

##### cleanup

清理运行时

```typescript
cleanup(): void
```

---

## UI组件API

### DataFlowPanel

数据流配置面板组件

#### Props

```typescript
interface Props {
  dataFlows?: Record<string, DataFlow> // 数据流配置
  dataSources?: any[] // 数据源列表
}
```

#### Events

```typescript
interface Events {
  'update:dataFlows': (value: Record<string, DataFlow>) => void
}
```

#### 使用示例

```vue
<DataFlowPanel :dataFlows="dataFlows" :dataSources="dataSources" @update:dataFlows="handleUpdate" />
```

---

### DataActionPanel

数据操作配置面板组件

#### Props

```typescript
interface Props {
  dataActions?: Record<string, DataAction> // 数据操作配置
  dataSources?: any[] // 数据源列表
}
```

#### Events

```typescript
interface Events {
  'update:dataActions': (value: Record<string, DataAction>) => void
}
```

#### 使用示例

```vue
<DataActionPanel :dataActions="dataActions" :dataSources="dataSources" @update:dataActions="handleUpdate" />
```

---

## 错误处理

### DataError

数据错误类

```typescript
class DataError extends Error {
  constructor(
    public type: DataErrorType,
    message: string,
    public details?: any
  )
}
```

### DataErrorType

错误类型枚举

```typescript
enum DataErrorType {
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  FLOW_EXECUTION_ERROR = 'FLOW_EXECUTION_ERROR',
  ACTION_EXECUTION_ERROR = 'ACTION_EXECUTION_ERROR',
  BINDING_ERROR = 'BINDING_ERROR',
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}
```

### 错误处理示例

```typescript
try {
  const result = await engine.execute(flow, data)
} catch (error) {
  if (error instanceof DataError) {
    console.error(`错误类型: ${error.type}`)
    console.error(`错误消息: ${error.message}`)
    console.error(`错误详情:`, error.details)
  }
}
```

---

**更新日期**: 2025-10-11  
**版本**: 1.0.0
