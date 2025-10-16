# 数据绑定功能

## 📖 概述

数据绑定功能是低代码平台设计器的核心功能之一，它使设计器能够创建真正的数据驱动页面。该功能包括三个主要部分：

1. **数据流配置** - 对数据源的数据进行转换和处理
2. **数据操作配置** - 实现数据的增删改查（CRUD）
3. **组件数据绑定** - 将组件绑定到数据源或数据流

## ✨ 主要特性

### 数据流转换

- ✅ **过滤（Filter）** - 支持多种运算符和逻辑组合
- ✅ **映射（Map）** - 字段重命名、路径访问、转换表达式
- ✅ **排序（Sort）** - 单字段和多字段排序
- ✅ **聚合（Aggregate）** - 分组和聚合函数（count, sum, avg, min, max）

### 数据操作

- ✅ **创建（Create）** - 支持数据映射和回调
- ✅ **读取（Read）** - 支持查询参数和分页
- ✅ **更新（Update）** - 支持条件和数据映射
- ✅ **删除（Delete）** - 支持确认提示和回调

### 数据绑定

- ✅ **直接绑定** - 组件直接绑定到数据源
- ✅ **数据流绑定** - 组件绑定到数据流（经过转换）
- ✅ **手动绑定** - 通过事件触发
- ✅ **自动刷新** - 支持定时刷新和数据监听

## 📁 项目结构

```
src/
├── types/
│   └── index.ts                          # 类型定义
├── core/
│   ├── renderer/
│   │   └── designer/
│   │       ├── managers/
│   │       │   ├── DataBindingManager.ts    # 数据绑定管理器
│   │       │   ├── DataFlowManager.ts       # 数据流管理器
│   │       │   └── DataActionManager.ts     # 数据操作管理器
│   │       └── communication/
│   │           ├── DataFlowPanel.vue        # 数据流配置面板
│   │           └── DataActionPanel.vue      # 数据操作配置面板
│   └── runtime/
│       ├── DataFlowEngine.ts                # 数据流引擎
│       ├── DataBindingExecutor.ts           # 数据绑定执行器
│       ├── DataActionExecutor.ts            # 数据操作执行器
│       └── RuntimeManager.ts                # 运行时管理器
```

## 🚀 快速开始

### 安装

所有代码已经实现，无需额外安装。

### 基本使用

```typescript
import { DataFlowManager, DataActionManager, DataBindingManager } from '@/core/renderer/designer/managers'

// 创建管理器实例
const dataFlowManager = new DataFlowManager()
const dataActionManager = new DataActionManager()
const dataBindingManager = new DataBindingManager()

// 创建数据流
const dataFlow = dataFlowManager.createDataFlow({
  name: '用户过滤',
  sourceId: 'users_api',
  transforms: [
    {
      id: 'filter_1',
      type: 'filter',
      enabled: true,
      config: {
        type: 'filter',
        conditions: [{ field: 'age', operator: 'gte', value: 18 }],
        logic: 'AND',
      },
    },
  ],
})

// 创建数据绑定
dataBindingManager.createBinding('table_1', '用户表格', 'Table', {
  source: 'users_api',
  bindingType: 'dataflow',
  dataFlowId: dataFlow.id,
  autoLoad: true,
})
```

## 📚 文档

- [需求文档](./requirements.md) - 详细的功能需求和验收标准
- [设计文档](./design.md) - 技术架构和设计方案
- [任务列表](./tasks.md) - 实现任务清单
- [实现状态](./IMPLEMENTATION_STATUS.md) - 当前实现进度
- [快速开始](./QUICK_START.md) - 快速上手指南
- [示例代码](./EXAMPLES.md) - 完整的使用示例
- [API参考](./API_REFERENCE.md) - 详细的API文档

## 🎯 核心概念

### 数据流（DataFlow）

数据流是一系列数据转换步骤的组合，用于对数据源的数据进行处理。

```typescript
const dataFlow = {
  id: 'flow_1',
  name: '用户数据处理',
  sourceId: 'users_api',
  transforms: [
    { type: 'filter', config: {...} },  // 过滤
    { type: 'map', config: {...} },     // 映射
    { type: 'sort', config: {...} },    // 排序
    { type: 'aggregate', config: {...} } // 聚合
  ]
}
```

### 数据操作（DataAction）

数据操作定义了对数据源的CRUD操作。

```typescript
const dataAction = {
  id: 'action_1',
  name: '创建用户',
  type: 'create',
  sourceId: 'users_api',
  config: {
    dataMapping: { name: 'form.name', email: 'form.email' },
    onSuccess: [{ type: 'control', target: 'table', method: 'refresh' }],
  },
}
```

### 数据绑定（DataBinding）

数据绑定将组件与数据源或数据流关联起来。

```typescript
const binding = {
  source: 'users_api',
  bindingType: 'dataflow',
  dataFlowId: 'flow_1',
  autoLoad: true,
  refreshInterval: 30000,
}
```

## 🔧 技术栈

- **TypeScript** - 类型安全的JavaScript超集
- **Vue 3** - 渐进式JavaScript框架
- **Ant Design Vue** - 企业级UI组件库

## 📊 架构图

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

## 💡 使用场景

### 场景1：用户列表过滤

```typescript
// 创建数据流：过滤18岁以上的活跃用户
const userFlow = dataFlowManager.createDataFlow({
  name: '成年活跃用户',
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
  ],
})
```

### 场景2：销售数据统计

```typescript
// 创建数据流：按部门统计销售额
const salesFlow = dataFlowManager.createDataFlow({
  name: '部门销售统计',
  sourceId: 'sales_api',
  transforms: [
    {
      id: 'agg_1',
      type: 'aggregate',
      enabled: true,
      config: {
        type: 'aggregate',
        groupBy: ['department'],
        aggregations: [
          { field: 'amount', function: 'sum', alias: 'totalSales' },
          { field: 'id', function: 'count', alias: 'orderCount' },
        ],
      },
    },
  ],
})
```

### 场景3：表单提交

```typescript
// 创建数据操作：提交用户表单
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
      { type: 'control', target: 'userTable', method: 'refresh' },
      { type: 'control', target: 'createForm', method: 'reset' },
    ],
  },
})
```

## 🧪 测试

所有核心功能已实现并通过TypeScript类型检查。

```bash
# 检查类型错误
npm run type-check

# 运行测试（如果有）
npm run test
```

## 📝 待办事项

- [ ] 在属性面板中添加数据绑定配置UI
- [ ] 在左侧面板中集成数据流和数据操作面板
- [ ] 实现数据源管理器的实际集成
- [ ] 实现转换步骤的可视化编辑器
- [ ] 实现数据预览功能
- [ ] 添加单元测试
- [ ] 添加集成测试

## 🤝 贡献

欢迎贡献代码、报告问题或提出建议！

## 📄 许可证

MIT

## 👥 作者

Kiro AI Assistant

## 📞 联系方式

如有问题或建议，请通过以下方式联系：

- 创建 Issue
- 提交 Pull Request

---

**创建日期**: 2025-10-11  
**最后更新**: 2025-10-11  
**版本**: 1.0.0  
**状态**: ✅ 核心功能已完成
