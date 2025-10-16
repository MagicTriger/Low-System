# 任务 2 完成报告 - 数据源配置模态框

## 完成时间

2025-10-11

## 任务描述

创建数据源配置模态框组件，包括数据源配置面板、数据流配置面板、数据操作配置面板和预览组件。

## 已完成的子任务

### ✅ 2.1 创建 DataSourceConfigModal 主组件

**文件：** `src/core/renderer/designer/communication/DataSourceConfigModal.vue`

**功能：**

- 全屏模态框布局
- 左侧 Tabs 导航（数据源、数据流、数据操作）
- 右侧预览面板
- 底部操作栏（保存、取消、导入、导出）
- 支持配置的导入导出（JSON 格式）

**特性：**

- 使用 Ant Design Modal 组件（全屏模式）
- 响应式布局（左侧 600px，右侧 400px）
- 支持拖拽上传配置文件
- 自动保存到本地状态

---

### ✅ 2.2 创建 DataSourcePanel 数据源配置面板

**文件：** `src/core/renderer/designer/communication/DataSourcePanel.vue`

**功能：**

- 数据源列表显示（卡片式）
- 添加数据源功能
- 编辑数据源功能（点击卡片）
- 删除数据源功能（带确认）
- 搜索数据源功能
- 测试连接功能

**支持的数据源类型：**

1. **API 接口**

   - URL 配置
   - 请求方法（GET/POST/PUT/DELETE）
   - 请求头（JSON 格式）
   - 请求参数（JSON 格式）

2. **静态数据**

   - JSON 数据编辑器
   - 数据格式验证

3. **Mock 数据**
   - Mock 模板编辑器
   - 支持 Mock.js 语法

**UI 特性：**

- 类型图标和颜色标识
- 悬停高亮效果
- 选中状态显示
- 抽屉式编辑表单
- 表单验证

---

### ✅ 2.3 创建 DataFlowPanel 数据流配置面板

**文件：** `src/core/renderer/designer/communication/DataFlowPanel.vue`

**状态：** 占位组件（功能开发中）

**计划功能：**

- 数据流列表显示
- 添加数据流功能
- 数据源选择
- 数据转换配置（过滤、映射、聚合、排序）
- 可视化数据流图

---

### ✅ 2.4 创建 DataOperationPanel 数据操作配置面板

**文件：** `src/core/renderer/designer/communication/DataOperationPanel.vue`

**状态：** 占位组件（功能开发中）

**计划功能：**

- 数据操作列表显示
- 添加操作功能
- CRUD 操作类型选择
- 操作参数配置
- 操作前后钩子配置
- 操作权限控制配置

---

### ✅ 2.5 创建 DataPreview 预览组件

**文件：** `src/core/renderer/designer/communication/DataPreview.vue`

**功能：**

- 数据源统计（总数、类型分布）
- 数据流统计
- 数据操作统计
- 根据当前 Tab 显示不同内容

**显示内容：**

- 数据源：总数、API 类型数、静态数据数、Mock 数据数
- 数据流：总数
- 数据操作：总数

---

### ✅ 3.3 连接工具栏按钮到配置弹框

**修改文件：**

1. `src/core/renderer/designer/canvas/CanvasToolbar.vue`

   - 添加数据源按钮（数据库图标）
   - 添加 `data-source` 事件

2. `src/modules/designer/views/DesignerNew.vue`
   - 导入 DataSourceConfigModal 组件
   - 添加 showDataSourceModal 状态
   - 添加 dataConfig 状态（存储配置）
   - 添加 handleDataSource 函数（打开弹框）
   - 添加 handleDataConfigSave 函数（保存配置）
   - 绑定工具栏的 data-source 事件

---

## 数据模型

### DataSourceConfig

```typescript
interface DataSourceConfig {
  id: string
  name: string
  type: 'api' | 'static' | 'mock'
  config: {
    // API 类型
    url?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    params?: Record<string, any>

    // 静态类型
    data?: any

    // Mock 类型
    mockTemplate?: string
  }
  metadata?: any
  autoLoad?: boolean
}
```

### DataFlowConfig

```typescript
interface DataFlowConfig {
  id: string
  name: string
  sourceId: string
  transforms: any[]
}
```

### DataOperationConfig

```typescript
interface DataOperationConfig {
  id: string
  name: string
  type: 'create' | 'read' | 'update' | 'delete'
  dataSourceId: string
  config: any
  hooks?: any
}
```

---

## UI 布局

```
┌─────────────────────────────────────────────────────────────┐
│  数据源配置                                          [X]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┬────────────────────────┬──────────────────┐  │
│  │ 数据源   │                        │                  │  │
│  │ 数据流   │  配置表单区域          │  预览区域        │  │
│  │ 数据操作 │  (600px)               │  (400px)         │  │
│  │          │                        │                  │  │
│  │          │                        │                  │  │
│  └──────────┴────────────────────────┴──────────────────┘  │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [取消] [导入配置] [导出配置]                    [保存]     │
└─────────────────────────────────────────────────────────────┘
```

---

## 功能特性

### 1. 数据源管理

**添加数据源：**

1. 点击"添加数据源"按钮
2. 填写数据源信息
3. 选择数据源类型
4. 配置类型特定的参数
5. 保存

**编辑数据源：**

1. 点击数据源卡片
2. 修改配置
3. 保存

**删除数据源：**

1. 点击删除按钮
2. 确认删除
3. 从列表中移除

**测试连接：**

1. 点击测试按钮（闪电图标）
2. 显示加载状态
3. 显示测试结果

### 2. 配置导入导出

**导出配置：**

1. 点击"导出配置"按钮
2. 生成 JSON 文件
3. 自动下载（文件名：data-config-{timestamp}.json）

**导入配置：**

1. 点击"导入配置"按钮
2. 选择 JSON 文件
3. 解析并合并配置
4. 显示导入结果

### 3. 数据验证

**表单验证：**

- 数据源名称：必填
- 数据源类型：必填
- API 地址：API 类型时必填
- 请求方法：API 类型时必填
- 静态数据：静态类型时必填
- Mock 模板：Mock 类型时必填

**JSON 验证：**

- 请求头：必须是有效的 JSON
- 请求参数：必须是有效的 JSON
- 静态数据：必须是有效的 JSON

---

## 技术实现

### 组件通信

```
DesignerNew.vue
  ↓ v-model
DataSourceConfigModal.vue
  ↓ v-model:dataSources
DataSourcePanel.vue
  ↓ emit('update:dataSources')
DataSourceConfigModal.vue
  ↓ emit('save')
DesignerNew.vue
```

### 状态管理

```typescript
// DesignerNew.vue
const dataConfig = ref({
  dataSources: {},
  dataFlows: {},
  operations: {},
})

// 保存到设计器状态
function handleDataConfigSave(data) {
  dataConfig.value = data
  hasUnsavedChanges.value = true
}
```

### 文件操作

**导出：**

```typescript
const blob = new Blob([JSON.stringify(config, null, 2)], {
  type: 'application/json',
})
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = `data-config-${Date.now()}.json`
a.click()
URL.revokeObjectURL(url)
```

**导入：**

```typescript
const input = document.createElement('input')
input.type = 'file'
input.accept = '.json'
input.onchange = async e => {
  const file = e.target.files[0]
  const text = await file.text()
  const config = JSON.parse(text)
  // 合并配置
}
input.click()
```

---

## 使用示例

### 添加 API 数据源

```json
{
  "id": "ds_1234567890",
  "name": "用户列表 API",
  "type": "api",
  "config": {
    "url": "https://api.example.com/users",
    "method": "GET",
    "headers": {
      "Content-Type": "application/json",
      "Authorization": "Bearer token123"
    },
    "params": {
      "page": 1,
      "size": 10
    }
  },
  "autoLoad": true
}
```

### 添加静态数据源

```json
{
  "id": "ds_1234567891",
  "name": "示例数据",
  "type": "static",
  "config": {
    "data": [
      { "id": 1, "name": "张三", "age": 25 },
      { "id": 2, "name": "李四", "age": 30 }
    ]
  },
  "autoLoad": false
}
```

### 添加 Mock 数据源

```json
{
  "id": "ds_1234567892",
  "name": "Mock 用户数据",
  "type": "mock",
  "config": {
    "mockTemplate": "{\"id\": \"@id\", \"name\": \"@name\", \"email\": \"@email\"}"
  },
  "autoLoad": false
}
```

---

## 测试验证

### 手动测试步骤

1. **打开数据源配置：**

   - 点击画布工具栏的"数据源"按钮（数据库图标）
   - 验证全屏模态框打开

2. **添加 API 数据源：**

   - 点击"添加数据源"
   - 填写名称："测试 API"
   - 选择类型："API 接口"
   - 填写 URL："https://jsonplaceholder.typicode.com/users"
   - 选择方法："GET"
   - 点击"保存"
   - 验证数据源出现在列表中

3. **测试连接：**

   - 点击数据源卡片上的测试按钮（闪电图标）
   - 验证显示加载状态
   - 验证显示测试结果

4. **编辑数据源：**

   - 点击数据源卡片
   - 修改名称
   - 点击"保存"
   - 验证修改生效

5. **删除数据源：**

   - 点击删除按钮
   - 确认删除
   - 验证数据源从列表中移除

6. **导出配置：**

   - 添加几个数据源
   - 点击"导出配置"
   - 验证下载 JSON 文件

7. **导入配置：**

   - 点击"导入配置"
   - 选择之前导出的文件
   - 验证配置导入成功

8. **保存配置：**
   - 点击"保存"按钮
   - 验证显示成功提示
   - 验证模态框关闭

---

## 已知限制

### 1. 数据流和数据操作

**状态：** 占位组件，功能未实现

**影响：** 只能配置数据源，不能配置数据流和数据操作

**计划：** 后续版本实现

### 2. 测试连接

**状态：** 模拟实现

**影响：** 不会发送实际的 HTTP 请求

**计划：** 实现真实的连接测试

### 3. 数据绑定

**状态：** 配置已保存，但组件还不能使用

**影响：** 配置的数据源还不能绑定到组件

**计划：** 任务 3 实现

---

## 下一步

### 任务 3: 集成数据配置到设计器状态

**目标：** 将数据配置保存到设计器状态，支持持久化

**子任务：**

- 3.1 扩展 DesignerState 类型定义
- 3.2 实现数据配置状态管理
- 3.3 连接工具栏按钮到配置弹框 ✅（已完成）

### 任务 4: 实现数据源配置验证和测试

**目标：** 实现配置验证和真实的连接测试

**子任务：**

- 4.1 实现配置验证逻辑
- 4.2 实现数据源连接测试

---

## 总结

### 完成情况

- ✅ 数据源配置模态框（全功能）
- ✅ 数据源配置面板（全功能）
- ✅ 数据流配置面板（占位）
- ✅ 数据操作配置面板（占位）
- ✅ 预览组件（基础功能）
- ✅ 工具栏集成

### 核心功能

- ✅ 添加/编辑/删除数据源
- ✅ 支持 3 种数据源类型（API、静态、Mock）
- ✅ 配置导入导出
- ✅ 表单验证
- ✅ 搜索过滤
- ✅ 测试连接（模拟）

### 用户体验

- ✅ 全屏模态框
- ✅ 响应式布局
- ✅ 卡片式列表
- ✅ 抽屉式编辑
- ✅ 加载状态
- ✅ 成功/错误提示

---

**完成人员：** Kiro AI Assistant  
**完成日期：** 2025-10-11  
**状态：** ✅ 已完成  
**测试状态：** ⏳ 待用户验证  
**下一步：** 测试功能，然后继续任务 3
