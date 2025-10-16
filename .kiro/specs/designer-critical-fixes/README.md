# 设计器关键问题修复规范

## 📋 规范概述

本规范定义了修复设计器中两个关键问题的完整方案：

1. **大屏组件拖拽崩溃问题**（无限循环导致浏览器崩溃）
2. **数据源配置功能完善**（全屏弹框配置数据源、数据流、数据操作）

## 📁 文档结构

```
.kiro/specs/designer-critical-fixes/
├── README.md           # 本文件 - 规范概述
├── requirements.md     # 需求文档 - 用户故事和验收标准
├── design.md          # 设计文档 - 技术方案和架构
└── tasks.md           # 任务列表 - 实现步骤
```

## 🎯 问题分析

### 问题 1: 大屏组件拖拽崩溃

**现象：**

- 拖拽大屏组件（数据面板或大屏容器）到画布时浏览器崩溃
- 控制台出现递增的"组件在画布注册"消息
- 浏览器变得无响应

**根本原因：**

```
MutationObserver 监听 DOM 变化
  ↓
触发 updateControlRect()
  ↓
console.log() 输出日志（某些浏览器视为 DOM 变化）
  ↓
MutationObserver 再次触发
  ↓
无限循环 → 浏览器崩溃
```

**影响范围：**

- 所有大屏组件（数据面板、大屏容器）
- 可能影响其他复杂组件
- 严重影响用户体验

### 问题 2: 数据源配置功能缺失

**现状：**

- 只有一个简单的"数据源"按钮
- 点击后打开的是简单的 DataSourceManager 组件
- 缺少完整的配置界面

**需求：**

- 全屏配置弹框
- 支持数据源配置（API、静态、Mock）
- 支持数据流配置（转换、过滤、映射）
- 支持数据操作配置（CRUD）
- 为组件数据绑定提供基础

## 🔧 解决方案

### 方案 1: 修复无限循环（组合方案）

1. **移除 console.log** - 移除所有可能触发 DOM 变化的日志
2. **添加防抖** - 限制 updateControlRect 调用频率（16ms，约60fps）
3. **优化 MutationObserver** - 只监听必要的属性（style、class）
4. **优化 watch** - 移除 deep: true，只监听特定属性
5. **添加循环检测** - 检测并阻止意外的无限循环

### 方案 2: 数据源配置（全屏弹框）

**UI 布局：**

```
┌─────────────────────────────────────────────────────┐
│  数据源配置                                    [X]   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────┬──────────────────┬──────────────┐   │
│  │ 数据源   │                  │              │   │
│  │ 数据流   │  配置表单区域    │  预览区域    │   │
│  │ 数据操作 │                  │              │   │
│  └──────────┴──────────────────┴──────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│  [取消] [导入] [导出]                    [保存]     │
└─────────────────────────────────────────────────────┘
```

**功能模块：**

- **数据源配置：** 添加、编辑、删除数据源，支持多种类型
- **数据流配置：** 配置数据转换管道（过滤、映射、聚合）
- **数据操作配置：** 配置 CRUD 操作和钩子
- **预览功能：** 实时预览配置效果
- **导入导出：** 支持配置的导入导出

## 📊 数据模型

### 数据源配置

```typescript
interface DataSourceConfig {
  id: string
  name: string
  type: 'api' | 'static' | 'mock'
  config: {
    url?: string
    method?: string
    headers?: Record<string, string>
    params?: Record<string, any>
    data?: any
  }
  metadata: {
    fields: Record<string, FieldMetadata>
  }
  autoLoad: boolean
}
```

### 数据流配置

```typescript
interface DataFlowConfig {
  id: string
  name: string
  sourceId: string
  transforms: DataTransform[]
}
```

### 数据操作配置

```typescript
interface DataOperationConfig {
  id: string
  name: string
  type: 'create' | 'read' | 'update' | 'delete'
  dataSourceId: string
  config: any
  hooks: {
    before?: string
    after?: string
  }
}
```

## 📝 任务概览

### 阶段 1: 紧急修复（P0）

- [x] 任务 1: 修复 DesignerControlRenderer 无限循环

### 阶段 2: 核心功能（P1）

- [ ] 任务 2: 创建数据源配置模态框（5个子任务）
- [ ] 任务 3: 集成到设计器状态（3个子任务）
- [ ] 任务 4: 实现验证和测试（2个子任务）
- [ ] 任务 5: 实现导入导出（2个子任务）

### 阶段 3: 优化（P2）

- [ ] 任务 6: 优化性能和用户体验（3个子任务）

### 阶段 4: 完善（P3）

- [ ] 任务 7: 编写测试用例（可选，3个子任务）
- [ ] 任务 8: 更新文档和示例（2个子任务）

## 🚀 开始实现

### 推荐执行顺序

1. **立即执行：** 任务 1（修复崩溃问题）
2. **核心功能：** 任务 2 → 3 → 4 → 5
3. **优化完善：** 任务 6 → 8
4. **可选：** 任务 7（测试用例）

### 执行任务

要开始执行任务，请告诉 Kiro：

```
开始执行任务 1
```

或者：

```
执行任务 2.1
```

## ✅ 验收标准

### 问题 1 修复验收

- [x] 大屏组件可以正常拖拽到画布
- [x] 控制台没有无限递增的日志
- [x] 浏览器保持响应，不会崩溃
- [x] 组件选择和悬停功能正常

### 问题 2 功能验收

- [ ] 可以打开全屏配置弹框
- [ ] 可以添加、编辑、删除数据源
- [ ] 可以配置数据流和数据操作
- [ ] 配置可以正确保存和加载
- [ ] 组件可以绑定到配置的数据源

## 📚 相关文档

- [需求文档](./requirements.md) - 详细的用户故事和验收标准
- [设计文档](./design.md) - 技术方案和架构设计
- [任务列表](./tasks.md) - 详细的实现步骤

## 🔗 相关资源

- [Ant Design Vue Modal](https://antdv.com/components/modal-cn)
- [Ant Design Vue Tabs](https://antdv.com/components/tabs-cn)
- [Ant Design Vue Form](https://antdv.com/components/form-cn)
- [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- [Lodash Debounce](https://lodash.com/docs/#debounce)

## 📞 支持

如有问题或需要帮助，请：

1. 查看相关文档
2. 检查任务列表中的详细说明
3. 向 Kiro 提问

---

**创建日期：** 2025-10-11  
**创建人：** Kiro AI Assistant  
**状态：** ✅ 已完成规范定义，准备开始实现  
**下一步：** 执行任务 1 - 修复无限循环问题
