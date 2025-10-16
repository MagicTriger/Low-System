# 数据绑定功能实现任务列表

## 任务概述

本任务列表将指导实现低代码平台设计器中的数据流配置、数据操作配置和组件数据绑定功能。任务按照优先级和依赖关系组织，确保增量开发和早期测试。

---

## 阶段1：基础数据绑定

### 1. 扩展数据绑定类型定义

- 在 `src/types/index.ts` 中扩展 `DataBinding` 接口
- 添加 `bindingType`、`dataFlowId`、`propertyPath`、`autoLoad`、`refreshInterval`、`transform` 等字段
- 定义 `ComponentBinding` 接口用于管理器
- _需求: 3.1, 3.2, 3.3_

### 2. 实现数据绑定管理器

- [ ] 2.1 创建 `DataBindingManager` 类文件

  - 创建 `src/core/renderer/designer/managers/DataBindingManager.ts`
  - 实现基础的 Map 数据结构存储绑定关系
  - _需求: 3.1, 3.2_

- [ ] 2.2 实现绑定CRUD方法

  - 实现 `createBinding()` 方法
  - 实现 `updateBinding()` 方法
  - 实现 `removeBinding()` 方法
  - 实现 `getBinding()` 方法
  - _需求: 3.1, 3.2, 3.3_

- [ ] 2.3 实现查询方法
  - 实现 `getBindingsBySource()` 方法
  - 实现 `getBindingsByDataFlow()` 方法
  - 实现 `getAllBindings()` 方法
  - _需求: 3.1, 3.2_

### 3. 实现数据绑定执行器（运行时）

- [ ] 3.1 创建 `DataBindingExecutor` 类文件

  - 创建 `src/core/runtime/DataBindingExecutor.ts`
  - 初始化依赖（DataSourceManager、DataFlowEngine）
  - 创建订阅管理 Map
  - _需求: 3.3, 3.4, 3.5_

- [ ] 3.2 实现直接绑定功能

  - 实现 `bindControl()` 方法处理直接绑定
  - 从数据源获取数据
  - 实现 `applyDataToControl()` 方法应用数据到组件
  - _需求: 3.2, 3.3, 3.4_

- [ ] 3.3 实现数据监听和自动更新

  - 实现 `watchDataSource()` 方法监听数据源变化
  - 实现 `setupAutoRefresh()` 方法设置定时刷新
  - 实现 `unbindControl()` 方法清理订阅
  - _需求: 3.5, 3.6_

- [ ] 3.4 实现刷新和解绑功能
  - 实现 `refreshBinding()` 方法手动刷新数据
  - 完善 `unbindControl()` 清理逻辑
  - _需求: 3.5, 3.6_

### 4. 在属性面板中添加数据绑定UI

- [ ] 4.1 扩展 PropertiesPanel 组件

  - 在 `src/core/renderer/designer/settings/PropertiesPanel.vue` 中添加"数据绑定"标签页
  - 添加数据绑定配置区域
  - _需求: 3.1_

- [ ] 4.2 实现数据源选择器

  - 创建数据源下拉选择组件
  - 显示可用的数据源列表
  - 支持搜索和筛选
  - _需求: 3.2_

- [ ] 4.3 实现绑定类型选择

  - 添加绑定类型单选按钮（直接/数据流/手动）
  - 根据类型显示不同的配置选项
  - _需求: 3.2, 3.3_

- [ ] 4.4 实现属性路径配置

  - 添加属性路径输入框
  - 提供常用路径的快捷选择
  - 添加路径验证
  - _需求: 3.2, 3.4_

- [ ] 4.5 实现自动加载和刷新配置

  - 添加自动加载开关
  - 添加刷新间隔输入框
  - 添加立即刷新按钮
  - _需求: 3.6_

- [ ] 4.6 集成数据绑定管理器
  - 连接UI与 DataBindingManager
  - 实现保存绑定配置
  - 实现删除绑定功能
  - _需求: 3.1, 3.2, 3.3_

---

## 阶段2：数据流配置

### 5. 定义数据流类型

- 在 `src/types/index.ts` 中添加数据流相关类型
- 定义 `DataFlow`、`DataTransform`、`TransformConfig` 接口
- 定义 `FilterConfig`、`MapConfig`、`SortConfig`、`AggregateConfig` 接口
- 定义 `FilterCondition`、`FieldMapping`、`SortField`、`Aggregation` 接口
- _需求: 1.1, 1.2, 1.3_

### 6. 实现数据流管理器

- [ ] 6.1 创建 `DataFlowManager` 类文件

  - 创建 `src/core/renderer/designer/managers/DataFlowManager.ts`
  - 初始化 Map 存储数据流
  - 注入 DataSourceManager 依赖
  - _需求: 1.1_

- [ ] 6.2 实现数据流CRUD方法

  - 实现 `createDataFlow()` 方法
  - 实现 `updateDataFlow()` 方法
  - 实现 `deleteDataFlow()` 方法
  - 实现 `getDataFlow()` 方法
  - _需求: 1.1, 1.5_

- [ ] 6.3 实现转换步骤管理

  - 实现 `addTransform()` 方法
  - 实现 `removeTransform()` 方法
  - 实现 `updateTransform()` 方法
  - 实现 `reorderTransforms()` 方法
  - _需求: 1.3, 1.5_

- [ ] 6.4 实现数据流执行方法
  - 实现 `executeDataFlow()` 方法
  - 调用 DataFlowEngine 执行转换
  - 缓存执行结果
  - _需求: 1.4_

### 7. 实现数据流引擎（运行时）

- [ ] 7.1 创建 `DataFlowEngine` 类文件

  - 创建 `src/core/runtime/DataFlowEngine.ts`
  - 实现 `execute()` 主方法
  - _需求: 1.4_

- [ ] 7.2 实现过滤转换

  - 实现 `filter()` 方法
  - 支持多种比较运算符（eq, ne, gt, gte, lt, lte, contains, startsWith, endsWith）
  - 支持 AND/OR 逻辑组合
  - _需求: 1.3_

- [ ] 7.3 实现映射转换

  - 实现 `map()` 方法
  - 支持字段重命名
  - 支持字段路径访问（如 'user.name'）
  - 支持简单的转换表达式
  - _需求: 1.3_

- [ ] 7.4 实现排序转换

  - 实现 `sort()` 方法
  - 支持单字段和多字段排序
  - 支持升序和降序
  - _需求: 1.3_

- [ ] 7.5 实现聚合转换

  - 实现 `aggregate()` 方法
  - 支持分组（groupBy）
  - 支持聚合函数（count, sum, avg, min, max）
  - _需求: 1.3_

- [ ] 7.6 实现转换链执行
  - 实现 `executeTransform()` 方法
  - 按顺序执行多个转换步骤
  - 处理转换错误
  - _需求: 1.3, 1.4_

### 8. 创建数据流配置面板UI

- [ ] 8.1 创建 `DataFlowPanel` 组件

  - 创建 `src/core/renderer/designer/communication/DataFlowPanel.vue`
  - 实现基础布局（工具栏、列表、详情）
  - _需求: 1.1_

- [ ] 8.2 实现数据流列表

  - 显示所有数据流
  - 支持搜索和筛选
  - 显示数据流状态
  - _需求: 1.1_

- [ ] 8.3 实现数据流创建/编辑表单

  - 添加数据流名称和描述输入
  - 添加数据源选择器
  - 添加启用/禁用开关
  - _需求: 1.1, 1.2_

- [ ] 8.4 实现转换步骤编辑器

  - 显示转换步骤列表
  - 支持添加/删除/排序转换步骤
  - 为每种转换类型创建配置表单
  - _需求: 1.3, 1.5_

- [ ] 8.5 实现过滤配置表单

  - 添加条件列表
  - 支持添加/删除条件
  - 字段选择、运算符选择、值输入
  - AND/OR 逻辑选择
  - _需求: 1.3_

- [ ] 8.6 实现映射配置表单

  - 添加字段映射列表
  - 源字段选择、目标字段输入
  - 支持添加/删除映射
  - _需求: 1.3_

- [ ] 8.7 实现排序配置表单

  - 添加排序字段列表
  - 字段选择、排序方向选择
  - 支持多字段排序
  - _需求: 1.3_

- [ ] 8.8 实现聚合配置表单

  - 分组字段选择
  - 聚合函数配置
  - 字段选择、函数选择、别名输入
  - _需求: 1.3_

- [ ] 8.9 实现数据预览功能

  - 显示原始数据
  - 显示转换后的数据
  - 支持实时预览
  - 添加刷新按钮
  - _需求: 1.4_

- [ ] 8.10 集成数据流管理器
  - 连接UI与 DataFlowManager
  - 实现保存数据流
  - 实现删除数据流
  - 实现执行数据流
  - _需求: 1.1, 1.4, 1.5_

### 9. 集成数据流到数据绑定

- [ ] 9.1 扩展数据绑定执行器

  - 在 `DataBindingExecutor` 中添加数据流支持
  - 实现数据流绑定逻辑
  - 调用 DataFlowEngine 处理数据
  - _需求: 3.3_

- [ ] 9.2 更新属性面板UI
  - 在数据绑定配置中添加数据流选择器
  - 显示可用的数据流列表
  - 根据绑定类型显示/隐藏数据流选项
  - _需求: 3.3_

---

## 阶段3：数据操作配置

### 10. 定义数据操作类型

- 在 `src/types/index.ts` 中添加数据操作相关类型
- 定义 `DataAction`、`ActionConfig` 接口
- 定义 `CreateActionConfig`、`ReadActionConfig`、`UpdateActionConfig`、`DeleteActionConfig` 接口
- 扩展 `EventExecution` 接口（如果需要）
- _需求: 2.1, 2.2, 2.3_

### 11. 实现数据操作管理器

- [ ] 11.1 创建 `DataActionManager` 类文件

  - 创建 `src/core/renderer/designer/managers/DataActionManager.ts`
  - 初始化 Map 存储数据操作
  - 注入 DataSourceManager 依赖
  - _需求: 2.1_

- [ ] 11.2 实现数据操作CRUD方法
  - 实现 `createDataAction()` 方法
  - 实现 `updateDataAction()` 方法
  - 实现 `deleteDataAction()` 方法
  - 实现 `getDataAction()` 方法
  - 实现 `getAllDataActions()` 方法
  - _需求: 2.1, 2.5_

### 12. 实现数据操作执行器（运行时）

- [ ] 12.1 创建 `DataActionExecutor` 类文件

  - 创建 `src/core/runtime/DataActionExecutor.ts`
  - 注入 DataSourceManager 依赖
  - 实现 `execute()` 主方法
  - _需求: 2.5_

- [ ] 12.2 实现创建操作

  - 实现 `executeCreate()` 方法
  - 处理数据映射
  - 调用数据源的创建API
  - 执行成功/失败回调
  - _需求: 2.2, 2.3, 2.4_

- [ ] 12.3 实现读取操作

  - 实现 `executeRead()` 方法
  - 处理查询参数
  - 处理分页
  - 调用数据源的读取API
  - 执行成功/失败回调
  - _需求: 2.2, 2.3, 2.4_

- [ ] 12.4 实现更新操作

  - 实现 `executeUpdate()` 方法
  - 处理更新条件
  - 处理数据映射
  - 调用数据源的更新API
  - 执行成功/失败回调
  - _需求: 2.2, 2.3, 2.4_

- [ ] 12.5 实现删除操作

  - 实现 `executeDelete()` 方法
  - 处理删除条件
  - 显示确认对话框（如果配置）
  - 调用数据源的删除API
  - 执行成功/失败回调
  - _需求: 2.2, 2.3, 2.4_

- [ ] 12.6 实现回调执行
  - 实现 `executeCallbacks()` 方法
  - 支持多种回调类型（control、dataSource、dataTransfer、global）
  - 传递操作结果到回调
  - _需求: 2.4, 2.5_

### 13. 创建数据操作配置面板UI

- [ ] 13.1 创建 `DataActionPanel` 组件

  - 创建 `src/core/renderer/designer/communication/DataActionPanel.vue`
  - 实现基础布局（工具栏、列表、详情）
  - _需求: 2.1_

- [ ] 13.2 实现数据操作列表

  - 显示所有数据操作
  - 按类型分组或筛选
  - 显示操作状态
  - _需求: 2.1_

- [ ] 13.3 实现数据操作创建/编辑表单

  - 添加操作名称和描述输入
  - 添加操作类型选择（Create/Read/Update/Delete）
  - 添加数据源选择器
  - 添加启用/禁用开关
  - _需求: 2.1, 2.2, 2.3_

- [ ] 13.4 实现创建操作配置表单

  - 添加数据映射编辑器
  - 支持字段映射配置
  - 添加成功/失败回调配置
  - _需求: 2.3, 2.4_

- [ ] 13.5 实现读取操作配置表单

  - 添加查询参数编辑器
  - 添加分页配置
  - 添加成功/失败回调配置
  - _需求: 2.3, 2.4_

- [ ] 13.6 实现更新操作配置表单

  - 添加更新条件编辑器
  - 添加数据映射编辑器
  - 添加成功/失败回调配置
  - _需求: 2.3, 2.4_

- [ ] 13.7 实现删除操作配置表单

  - 添加删除条件编辑器
  - 添加确认消息输入
  - 添加成功/失败回调配置
  - _需求: 2.3, 2.4_

- [ ] 13.8 实现回调配置编辑器

  - 支持添加多个回调
  - 回调类型选择
  - 目标选择
  - 方法选择
  - 参数配置
  - _需求: 2.4, 2.5_

- [ ] 13.9 实现测试执行功能

  - 添加测试按钮
  - 显示测试参数输入
  - 显示执行结果
  - 显示错误信息
  - _需求: 2.5_

- [ ] 13.10 集成数据操作管理器
  - 连接UI与 DataActionManager
  - 实现保存数据操作
  - 实现删除数据操作
  - _需求: 2.1, 2.5_

### 14. 集成数据操作到事件系统

- [ ] 14.1 扩展事件面板

  - 在 `EventsPanel.vue` 中添加数据操作选项
  - 显示可用的数据操作列表
  - 支持选择数据操作作为事件处理
  - _需求: 2.5_

- [ ] 14.2 实现事件执行集成
  - 在事件执行系统中添加数据操作支持
  - 调用 DataActionExecutor 执行操作
  - 传递事件上下文到操作
  - _需求: 2.5_

---

## 阶段4：集成和完善

### 15. 扩展 DesignDTO

- 在 `src/types/index.ts` 中扩展 `DesignDTO` 接口
- 添加 `dataFlows` 字段
- 添加 `dataActions` 字段
- _需求: 1.1, 2.1_

### 16. 更新设计器状态管理

- [ ] 16.1 扩展 useDesignerState

  - 在 `useDesignerState.ts` 中添加数据流和数据操作状态
  - 添加相关的 ref 和 computed
  - _需求: 1.1, 2.1_

- [ ] 16.2 初始化管理器
  - 在设计器初始化时创建 DataFlowManager、DataActionManager、DataBindingManager 实例
  - 注入必要的依赖
  - _需求: 1.1, 2.1, 3.1_

### 17. 实现数据持久化

- [ ] 17.1 扩展保存功能

  - 在保存设计时包含数据流配置
  - 在保存设计时包含数据操作配置
  - 在保存设计时包含数据绑定配置
  - _需求: 1.1, 2.1, 3.1_

- [ ] 17.2 扩展加载功能
  - 在加载设计时恢复数据流配置
  - 在加载设计时恢复数据操作配置
  - 在加载设计时恢复数据绑定配置
  - _需求: 1.1, 2.1, 3.1_

### 18. 实现错误处理

- 在 `src/types/index.ts` 中定义 `DataErrorType` 枚举和 `DataError` 类
- 在各个执行器中添加错误处理
- 在UI中显示错误消息
- 记录错误日志
- _需求: 1.4, 2.5, 3.4, 3.5_

### 19. 添加数据流和数据操作到左侧面板

- [ ] 19.1 更新左侧面板布局

  - 在设计器左侧面板中添加"数据流"和"数据操作"标签页
  - 或者在"通信"标签页中添加子标签
  - _需求: 1.1, 2.1_

- [ ] 19.2 集成面板组件
  - 将 DataFlowPanel 集成到左侧面板
  - 将 DataActionPanel 集成到左侧面板
  - 处理面板切换和状态管理
  - _需求: 1.1, 2.1_

### 20. 运行时初始化

- [ ] 20.1 创建运行时管理器

  - 创建 `src/core/runtime/RuntimeManager.ts`
  - 初始化 DataFlowEngine、DataActionExecutor、DataBindingExecutor
  - 管理运行时状态
  - _需求: 3.6_

- [ ] 20.2 实现自动加载

  - 在页面加载时自动执行配置了 autoLoad 的数据绑定
  - 按依赖顺序加载数据
  - _需求: 3.6_

- [ ] 20.3 实现数据响应式
  - 使用 Vue 的响应式系统
  - 确保数据变化时UI自动更新
  - _需求: 3.5, 3.6_

---

## 验收标准

完成以上所有任务后，系统应该满足以下标准：

1. ✅ 可以创建和配置数据流，支持过滤、映射、排序、聚合转换
2. ✅ 可以创建和配置数据操作，支持完整的CRUD操作
3. ✅ 可以将组件绑定到数据源或数据流
4. ✅ 绑定的组件可以正确显示数据
5. ✅ 数据变化时组件自动更新
6. ✅ 可以在事件中使用数据操作
7. ✅ 所有配置可以保存和加载
8. ✅ 错误处理完善，用户体验良好

---

**创建日期**：2025-10-11  
**创建人**：Kiro AI Assistant  
**状态**：待审核
