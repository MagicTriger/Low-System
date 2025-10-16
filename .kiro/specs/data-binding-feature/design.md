# 数据绑定功能设计文档

## 概述

本设计文档描述了低代码平台设计器中数据流配置、数据操作配置和组件数据绑定功能的技术实现方案。该功能将使设计器能够创建真正的数据驱动页面，支持数据的转换、操作和自动绑定。

### 设计目标

1. 提供直观的数据流配置界面，支持数据转换
2. 实现完整的CRUD数据操作配置
3. 支持组件与数据源的灵活绑定
4. 确保数据变化时UI自动更新
5. 保持与现有架构的兼容性

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                    设计器层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 数据流面板   │  │ 数据操作面板 │  │ 属性面板     │  │
│  │ DataFlowPanel│  │ DataActionPanel│ │ (数据绑定)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    管理层                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ DataFlowMgr  │  │ DataActionMgr│  │ DataBindingMgr│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                    运行时层                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ DataFlowEngine│ │ DataActionExec│ │ DataBindingExec│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                  数据源层                                │
│              DataSourceManager                           │
└─────────────────────────────────────────────────────────┘
```

## 组件和接口

### 1. 数据流配置

#### 1.1 数据流类型定义

```typescript
// 数据流配置接口
export interface DataFlow {
  id: string
  name: string
  description?: string
  sourceId: string // 数据源ID
  transforms: DataTransform[] // 转换步骤
  output?: any // 输出数据（缓存）
  enabled: boolean
  createdAt: number
  updatedAt: number
}

// 数据转换接口
export interface DataTransform {
  id: string
  type: 'filter' | 'map' | 'sort' | 'aggregate'
  config: TransformConfig
  enabled: boolean
}

// 转换配置联合类型
export type TransformConfig = FilterConfig | MapConfig | SortConfig | AggregateConfig

// 过滤配置
export interface FilterConfig {
  conditions: FilterCondition[]
  logic: 'AND' | 'OR'
}

export interface FilterCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'startsWith' | 'endsWith'
  value: any
}

// 映射配置
export interface MapConfig {
  mappings: FieldMapping[]
}

export interface FieldMapping {
  source: string // 源字段路径
  target: string // 目标字段名
  transform?: string // 转换表达式（可选）
}

// 排序配置
export interface SortConfig {
  fields: SortField[]
}

export interface SortField {
  field: string
  order: 'asc' | 'desc'
}

// 聚合配置
export interface AggregateConfig {
  groupBy: string[]
  aggregations: Aggregation[]
}

export interface Aggregation {
  field: string
  function: 'count' | 'sum' | 'avg' | 'min' | 'max'
  alias: string
}
```

#### 1.2 数据流管理器

```typescript
// src/core/renderer/designer/managers/DataFlowManager.ts
export class DataFlowManager {
  private dataFlows: Map<string, DataFlow>
  private dataSourceManager: DataSourceManager

  // 创建数据流
  createDataFlow(config: Partial<DataFlow>): DataFlow

  // 更新数据流
  updateDataFlow(id: string, updates: Partial<DataFlow>): void

  // 删除数据流
  deleteDataFlow(id: string): void

  // 执行数据流
  async executeDataFlow(id: string): Promise<any>

  // 添加转换步骤
  addTransform(flowId: string, transform: DataTransform): void

  // 移除转换步骤
  removeTransform(flowId: string, transformId: string): void

  // 更新转换步骤
  updateTransform(flowId: string, transformId: string, config: TransformConfig): void
}
```

#### 1.3 数据流引擎

```typescript
// src/core/runtime/DataFlowEngine.ts
export class DataFlowEngine {
  // 执行数据流
  async execute(flow: DataFlow, sourceData: any): Promise<any>

  // 执行单个转换
  private executeTransform(transform: DataTransform, data: any): any

  // 过滤数据
  private filter(data: any[], config: FilterConfig): any[]

  // 映射数据
  private map(data: any[], config: MapConfig): any[]

  // 排序数据
  private sort(data: any[], config: SortConfig): any[]

  // 聚合数据
  private aggregate(data: any[], config: AggregateConfig): any[]
}
```

### 2. 数据操作配置

#### 2.1 数据操作类型定义

```typescript
// 数据操作接口
export interface DataAction {
  id: string
  name: string
  description?: string
  type: 'create' | 'read' | 'update' | 'delete'
  sourceId: string // 数据源ID
  config: ActionConfig
  enabled: boolean
  createdAt: number
  updatedAt: number
}

// 操作配置联合类型
export type ActionConfig = CreateActionConfig | ReadActionConfig | UpdateActionConfig | DeleteActionConfig

// 创建操作配置
export interface CreateActionConfig {
  dataMapping: Record<string, string> // 参数映射
  onSuccess?: EventExecution[] // 成功回调
  onError?: EventExecution[] // 失败回调
}

// 读取操作配置
export interface ReadActionConfig {
  params?: Record<string, any> // 查询参数
  pagination?: {
    enabled: boolean
    pageSize: number
  }
  onSuccess?: EventExecution[]
  onError?: EventExecution[]
}

// 更新操作配置
export interface UpdateActionConfig {
  condition: Record<string, any> // 更新条件
  dataMapping: Record<string, string> // 数据映射
  onSuccess?: EventExecution[]
  onError?: EventExecution[]
}

// 删除操作配置
export interface DeleteActionConfig {
  condition: Record<string, any> // 删除条件
  confirmMessage?: string // 确认提示
  onSuccess?: EventExecution[]
  onError?: EventExecution[]
}
```

#### 2.2 数据操作管理器

```typescript
// src/core/renderer/designer/managers/DataActionManager.ts
export class DataActionManager {
  private dataActions: Map<string, DataAction>
  private dataSourceManager: DataSourceManager

  // 创建数据操作
  createDataAction(config: Partial<DataAction>): DataAction

  // 更新数据操作
  updateDataAction(id: string, updates: Partial<DataAction>): void

  // 删除数据操作
  deleteDataAction(id: string): void

  // 获取数据操作
  getDataAction(id: string): DataAction | undefined

  // 获取所有数据操作
  getAllDataActions(): DataAction[]
}
```

#### 2.3 数据操作执行器

```typescript
// src/core/runtime/DataActionExecutor.ts
export class DataActionExecutor {
  private dataSourceManager: DataSourceManager

  // 执行数据操作
  async execute(action: DataAction, context?: any): Promise<any>

  // 执行创建操作
  private async executeCreate(action: DataAction, context: any): Promise<any>

  // 执行读取操作
  private async executeRead(action: DataAction, context: any): Promise<any>

  // 执行更新操作
  private async executeUpdate(action: DataAction, context: any): Promise<any>

  // 执行删除操作
  private async executeDelete(action: DataAction, context: any): Promise<any>

  // 执行回调
  private async executeCallbacks(callbacks: EventExecution[], result: any): Promise<void>
}
```

### 3. 组件数据绑定

#### 3.1 数据绑定类型扩展

```typescript
// 扩展现有的 DataBinding 接口
export interface DataBinding {
  source: string // 数据源ID或数据流ID
  bindingType: 'direct' | 'dataflow' | 'manual' // 绑定类型
  dataFlowId?: string // 数据流ID（当bindingType为dataflow时）
  propertyPath?: string // 属性路径（如 'items', 'user.name'）
  autoLoad?: boolean // 是否自动加载
  refreshInterval?: number // 自动刷新间隔（毫秒）
  transform?: string // 自定义转换表达式
}
```

#### 3.2 数据绑定管理器

```typescript
// src/core/renderer/designer/managers/DataBindingManager.ts
export class DataBindingManager {
  private bindings: Map<string, ComponentBinding> // controlId -> binding
  private dataSourceManager: DataSourceManager
  private dataFlowManager: DataFlowManager

  // 创建绑定
  createBinding(controlId: string, binding: DataBinding): void

  // 更新绑定
  updateBinding(controlId: string, updates: Partial<DataBinding>): void

  // 删除绑定
  removeBinding(controlId: string): void

  // 获取绑定
  getBinding(controlId: string): DataBinding | undefined

  // 获取数据源的所有绑定
  getBindingsBySource(sourceId: string): ComponentBinding[]

  // 获取数据流的所有绑定
  getBindingsByDataFlow(flowId: string): ComponentBinding[]
}

export interface ComponentBinding {
  controlId: string
  controlName: string
  controlKind: string
  binding: DataBinding
}
```

#### 3.3 数据绑定执行器

```typescript
// src/core/runtime/DataBindingExecutor.ts
export class DataBindingExecutor {
  private dataSourceManager: DataSourceManager
  private dataFlowEngine: DataFlowEngine
  private subscriptions: Map<string, () => void> // 订阅清理函数

  // 绑定组件
  async bindControl(control: Control, binding: DataBinding): Promise<void>

  // 解绑组件
  unbindControl(controlId: string): void

  // 刷新绑定数据
  async refreshBinding(controlId: string): Promise<void>

  // 设置自动刷新
  private setupAutoRefresh(controlId: string, interval: number): void

  // 应用数据到组件
  private applyDataToControl(control: Control, data: any, propertyPath?: string): void

  // 监听数据源变化
  private watchDataSource(sourceId: string, callback: (data: any) => void): () => void
}
```

## 数据模型

### DesignDTO 扩展

```typescript
export interface DesignDTO {
  rootView: RootView
  dataSources: Record<string, DataSourceOption>
  dataFlows: Record<string, DataFlow> // 新增
  dataActions: Record<string, DataAction> // 新增
  dataTransfers: Record<string, any>
}
```

### Control 扩展

现有的 Control 接口已经包含 `dataBinding` 属性，我们将使用扩展后的 DataBinding 类型。

## 错误处理

### 错误类型定义

```typescript
export enum DataErrorType {
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  FLOW_EXECUTION_ERROR = 'FLOW_EXECUTION_ERROR',
  ACTION_EXECUTION_ERROR = 'ACTION_EXECUTION_ERROR',
  BINDING_ERROR = 'BINDING_ERROR',
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export class DataError extends Error {
  constructor(
    public type: DataErrorType,
    message: string,
    public details?: any
  ) {
    super(message)
    this.name = 'DataError'
  }
}
```

### 错误处理策略

1. **数据源错误**：显示错误提示，保持上次成功的数据
2. **数据流错误**：记录错误日志，返回原始数据
3. **数据操作错误**：显示错误消息，执行错误回调
4. **绑定错误**：显示占位符，记录错误日志

## 测试策略

### 单元测试

1. **数据流引擎测试**

   - 测试各种转换类型（过滤、映射、排序、聚合）
   - 测试转换组合
   - 测试边界情况

2. **数据操作执行器测试**

   - 测试CRUD操作
   - 测试回调执行
   - 测试错误处理

3. **数据绑定执行器测试**
   - 测试直接绑定
   - 测试数据流绑定
   - 测试自动刷新

### 集成测试

1. **端到端数据流测试**
   - 创建数据源 → 配置数据流 → 绑定组件 → 验证显示
2. **数据操作测试**

   - 配置数据操作 → 触发操作 → 验证结果 → 验证回调

3. **实时更新测试**
   - 修改数据源 → 验证组件自动更新

## UI组件设计

### 1. 数据流配置面板 (DataFlowPanel.vue)

**位置**：`src/core/renderer/designer/communication/DataFlowPanel.vue`

**功能**：

- 数据流列表展示
- 创建/编辑数据流
- 配置转换步骤
- 预览转换结果

**主要组件**：

- 数据流列表
- 转换步骤编辑器
- 数据预览区

### 2. 数据操作配置面板 (DataActionPanel.vue)

**位置**：`src/core/renderer/designer/communication/DataActionPanel.vue`

**功能**：

- 数据操作列表展示
- 创建/编辑数据操作
- 配置操作参数
- 测试操作执行

**主要组件**：

- 操作列表
- 操作配置表单
- 参数映射编辑器

### 3. 数据绑定配置 (PropertiesPanel 扩展)

**位置**：`src/core/renderer/designer/settings/PropertiesPanel.vue`

**功能**：

- 在属性面板中添加"数据绑定"选项卡
- 选择数据源或数据流
- 配置绑定属性
- 设置自动加载和刷新

## 实现优先级

### 阶段1：基础数据绑定（高优先级）

1. 扩展 DataBinding 类型
2. 实现 DataBindingManager
3. 实现 DataBindingExecutor
4. 在 PropertiesPanel 中添加数据绑定UI

### 阶段2：数据流配置（中优先级）

1. 定义数据流类型
2. 实现 DataFlowManager
3. 实现 DataFlowEngine
4. 创建 DataFlowPanel UI

### 阶段3：数据操作配置（中优先级）

1. 定义数据操作类型
2. 实现 DataActionManager
3. 实现 DataActionExecutor
4. 创建 DataActionPanel UI

## 性能考虑

1. **数据缓存**：缓存数据流执行结果，避免重复计算
2. **懒加载**：仅在需要时加载和执行数据流
3. **防抖处理**：对频繁的数据更新进行防抖
4. **虚拟滚动**：大数据集使用虚拟滚动
5. **增量更新**：仅更新变化的数据

## 兼容性

1. **向后兼容**：保持现有 DataBinding 接口的兼容性
2. **渐进增强**：新功能作为可选特性添加
3. **降级处理**：不支持的功能优雅降级

## 安全考虑

1. **数据验证**：验证所有用户输入
2. **权限检查**：检查数据源访问权限
3. **XSS防护**：转义用户输入的表达式
4. **CSRF防护**：API请求包含CSRF令牌

---

**创建日期**：2025-10-11  
**创建人**：Kiro AI Assistant  
**状态**：待审核
