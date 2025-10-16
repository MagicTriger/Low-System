// 全局类型定义

// 基础类型
export type ID = string | number

// 数据值类型
export type DataRawValue = string | number | boolean | Date | null | undefined | object | any[]

// 控件类型枚举
export enum ControlType {
  Common = 'common',
  Input = 'input',
  Container = 'container',
  Collection = 'collection',
  Chart = 'chart',
  BI = 'bi',
  SVG = 'svg',
  Mobile = 'mobile',
  Custom = 'custom',
  Dashboard = 'dashboard',
}

// 控件节点类型
export enum ControlNodeType {
  Control = 'control',
  View = 'view',
  Overlay = 'overlay',
}

// 根视图模式
export enum RootViewMode {
  Runtime = 'runtime',
  Designer = 'designer',
}

// 控件基础接口
export interface Control {
  id: string
  kind: string
  name?: string
  classes?: string[]
  styles?: Record<string, any>
  dataBinding?: DataBinding
  eventExection?: Record<string, EventExecution[]>
  children?: Control[]
  [key: string]: any
}

// 数据绑定接口
export interface DataBinding {
  source: string
  bindingType?: 'direct' | 'dataflow' | 'manual' // 绑定类型
  dataFlowId?: string // 数据流ID（当bindingType为dataflow时）
  propertyPath?: string // 属性路径（如 'items', 'user.name'）
  autoLoad?: boolean // 是否自动加载
  refreshInterval?: number // 自动刷新间隔（毫秒）
  transform?: string // 自定义转换表达式
  objectCode?: string
  propertyCode?: string
  inherit?: boolean
}

// 组件绑定接口（用于管理器）
export interface ComponentBinding {
  controlId: string
  controlName: string
  controlKind: string
  binding: DataBinding
}

// 事件执行接口
export interface EventExecution {
  type: 'control' | 'dataSource' | 'dataTransfer' | 'global'
  target: string
  method: string
  params?: Record<string, any>
}

// 控件节点接口
export interface ControlNode {
  id: string
  control: Control
  parent?: ControlNode
  children: ControlNode[]
  type: ControlNodeType
}

// 视图接口
export interface View {
  id: string
  name: string
  controls: Control[]
  designSize?: { width: number; height: number }
}

// 根视图接口
export interface RootView {
  id: string
  name: string
  controls: Control[]
  overlays?: Control[]
  views?: View[]
}

// 控件定义接口
export interface ControlDefinition {
  kind: string
  kindName: string
  type: ControlType
  icon?: string
  component: any
  dataBindable?: boolean
  events?: Record<string, EventDefinition>
  settings?: SettingDefinition[]
  hidden?: boolean
  customSettingRenerer?: any
}

// 事件定义接口
export interface EventDefinition {
  name: string
  description?: string
  params?: Record<string, any>
}

// 设置定义接口
export interface SettingDefinition {
  key: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'select' | 'color' | 'icon' | 'image' | 'monaco'
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  group?: string
}

// 数据源选项接口
export interface DataSourceOption {
  id: string
  name: string
  type: 'api' | 'static' | 'mock'
  url?: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  headers?: Record<string, string>
  params?: Record<string, any>
  data?: any
  autoLoad?: boolean
  readonly?: boolean
  metadata?: ObjectMetadata
}

// 对象元数据接口
export interface ObjectMetadata {
  code: string
  name: string
  fields: Record<string, FieldMetadata>
}

// 字段元数据接口
export interface FieldMetadata {
  code: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required?: boolean
  defaultValue?: any
  validation?: ValidationRule[]
}

// 验证规则接口
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message?: string
}

// 资源DTO接口
export interface ResourceDTO {
  id: string
  code: string
  name: string
  type: string
  content?: any
  createTime?: string
  updateTime?: string
}

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
  type: 'filter'
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
  type: 'map'
  mappings: FieldMapping[]
}

export interface FieldMapping {
  source: string // 源字段路径
  target: string // 目标字段名
  transform?: string // 转换表达式（可选）
}

// 排序配置
export interface SortConfig {
  type: 'sort'
  fields: SortField[]
}

export interface SortField {
  field: string
  order: 'asc' | 'desc'
}

// 聚合配置
export interface AggregateConfig {
  type: 'aggregate'
  groupBy: string[]
  aggregations: Aggregation[]
}

export interface Aggregation {
  field: string
  function: 'count' | 'sum' | 'avg' | 'min' | 'max'
  alias: string
}

// 数据操作接口
export interface DataAction {
  id: string
  name: string
  description?: string
  type: 'create' | 'read' | 'update' | 'delete' | 'custom'
  sourceId: string // 数据源ID
  config: ActionConfig
  enabled: boolean
  createdAt: number
  updatedAt: number
  // 新增高级配置字段
  params?: string // 操作参数 (JSON格式)
  conditions?: string // 执行条件 (JSON格式)
  transformBefore?: string // 执行前数据转换函数
  transformAfter?: string // 执行后数据转换函数
  successMessage?: string // 成功提示信息
  errorMessage?: string // 错误提示信息
  timeout?: number // 超时时间(毫秒)
  retryTimes?: number // 重试次数
  retryDelay?: number // 重试延迟(毫秒)
}

// 操作配置联合类型
export type ActionConfig = CreateActionConfig | ReadActionConfig | UpdateActionConfig | DeleteActionConfig

// 创建操作配置
export interface CreateActionConfig {
  type: 'create'
  dataMapping: Record<string, string> // 参数映射
  onSuccess?: EventExecution[] // 成功回调
  onError?: EventExecution[] // 失败回调
}

// 读取操作配置
export interface ReadActionConfig {
  type: 'read'
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
  type: 'update'
  condition: Record<string, any> // 更新条件
  dataMapping: Record<string, string> // 数据映射
  onSuccess?: EventExecution[]
  onError?: EventExecution[]
}

// 删除操作配置
export interface DeleteActionConfig {
  type: 'delete'
  condition: Record<string, any> // 删除条件
  confirmMessage?: string // 确认提示
  onSuccess?: EventExecution[]
  onError?: EventExecution[]
}

// 错误类型枚举
export enum DataErrorType {
  SOURCE_NOT_FOUND = 'SOURCE_NOT_FOUND',
  FLOW_EXECUTION_ERROR = 'FLOW_EXECUTION_ERROR',
  ACTION_EXECUTION_ERROR = 'ACTION_EXECUTION_ERROR',
  BINDING_ERROR = 'BINDING_ERROR',
  TRANSFORM_ERROR = 'TRANSFORM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

// 数据错误类
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

// 设计DTO接口
export interface DesignDTO {
  rootView: RootView
  dataSources: Record<string, DataSourceOption>
  dataFlows?: Record<string, DataFlow> // 新增
  dataActions?: Record<string, DataAction> // 新增
  dataTransfers: Record<string, any>
}

// API响应接口
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  success: boolean
}

// 分页接口
export interface Pagination {
  current: number
  pageSize: number
  total: number
}

// 分页响应接口
export interface PageResponse<T = any> {
  list: T[]
  pagination: Pagination
}

// 用户信息接口
// 登录响应接口
export interface LoginResponse {
  token: string
  userInfo: UserInfo
}

// 用户信息接口
export interface UserInfo {
  id: string
  username: string
  nickname: string
  avatar?: string
  roles: string[]
  permissions: string[]
}

// 主题配置接口
export interface ThemeConfig {
  primaryColor: string
  darkMode: boolean
  compactMode: boolean
}

// 系统配置接口
export interface SystemConfig {
  title: string
  logo?: string
  version: string
  apiUrl: string
  theme: ThemeConfig
}
