# 数据绑定功能测试指南

## 🧪 测试概述

本指南提供了测试数据绑定功能的详细步骤和检查清单。

## ✅ 测试清单

### 1. 数据源配置弹框测试

#### 1.1 打开弹框

- [ ] 点击"数据配置"按钮，弹框正常打开
- [ ] 弹框全屏显示
- [ ] 显示三个标签页：数据源、数据流、数据操作

#### 1.2 数据源面板

- [ ] 点击"添加数据源"按钮，抽屉打开
- [ ] 填写数据源信息（名称、类型、配置）
- [ ] 保存数据源，列表中显示新数据源
- [ ] 点击数据源项，可以编辑
- [ ] 点击删除按钮，数据源被删除
- [ ] 搜索功能正常工作

**测试数据**:

```json
{
  "name": "测试API",
  "type": "api",
  "config": {
    "url": "https://jsonplaceholder.typicode.com/users",
    "method": "GET"
  }
}
```

#### 1.3 数据流面板

- [ ] 切换到"数据流"标签页
- [ ] 点击"新建数据流"按钮
- [ ] 选择数据源
- [ ] 填写数据流名称和描述
- [ ] 保存数据流
- [ ] 数据流显示在列表中
- [ ] 可以编辑和删除数据流

**测试数据**:

```json
{
  "name": "用户过滤",
  "description": "过滤活跃用户",
  "sourceId": "测试API的ID",
  "enabled": true
}
```

#### 1.4 数据操作面板

- [ ] 切换到"数据操作"标签页
- [ ] 点击"新建操作"按钮
- [ ] 选择操作类型（Create/Read/Update/Delete）
- [ ] 选择数据源
- [ ] 填写操作名称
- [ ] 保存数据操作
- [ ] 操作显示在列表中
- [ ] 可以编辑和删除操作

**测试数据**:

```json
{
  "name": "读取用户",
  "type": "read",
  "sourceId": "测试API的ID",
  "enabled": true
}
```

#### 1.5 导入导出

- [ ] 点击"导出配置"按钮
- [ ] 配置文件下载成功
- [ ] 点击"导入配置"按钮
- [ ] 选择配置文件
- [ ] 配置导入成功

#### 1.6 保存功能

- [ ] 点击"保存"按钮
- [ ] 显示成功提示
- [ ] 弹框关闭
- [ ] 配置已保存

### 2. 属性面板数据绑定测试

#### 2.1 打开数据绑定选项卡

- [ ] 选择一个组件
- [ ] 属性面板显示
- [ ] 点击"数据绑定"选项卡
- [ ] 显示数据绑定配置表单

#### 2.2 直接绑定配置

- [ ] 绑定类型选择"直接绑定"
- [ ] 数据源下拉框显示所有数据源
- [ ] 选择一个数据源
- [ ] 填写属性路径（如：data）
- [ ] 开启自动加载
- [ ] 点击"保存绑定"
- [ ] 显示成功提示

**测试配置**:

```json
{
  "bindingType": "direct",
  "source": "测试API的ID",
  "propertyPath": "data",
  "autoLoad": true
}
```

#### 2.3 数据流绑定配置

- [ ] 绑定类型选择"数据流绑定"
- [ ] 数据源下拉框显示
- [ ] 数据流下拉框显示（条件显示）
- [ ] 选择数据源和数据流
- [ ] 填写属性路径
- [ ] 设置刷新间隔（如：30000）
- [ ] 点击"保存绑定"
- [ ] 显示成功提示

**测试配置**:

```json
{
  "bindingType": "dataflow",
  "source": "测试API的ID",
  "dataFlowId": "数据流ID",
  "propertyPath": "data",
  "autoLoad": true,
  "refreshInterval": 30000
}
```

#### 2.4 手动绑定配置

- [ ] 绑定类型选择"手动绑定"
- [ ] 选择数据源
- [ ] 自动加载关闭
- [ ] 点击"保存绑定"
- [ ] 显示成功提示

#### 2.5 转换表达式

- [ ] 填写转换表达式（如：value.toUpperCase()）
- [ ] 保存绑定
- [ ] 表达式已保存

#### 2.6 清除绑定

- [ ] 点击"清除绑定"按钮
- [ ] 显示成功提示
- [ ] 绑定配置被清空

#### 2.7 测试绑定

- [ ] 配置好绑定
- [ ] 点击"测试绑定"按钮
- [ ] 显示测试结果

### 3. 管理器功能测试

#### 3.1 DataBindingManager

```typescript
import { DataBindingManager } from '@/core/renderer/designer/managers'

const manager = new DataBindingManager()

// 测试创建绑定
manager.createBinding('control_1', '测试组件', 'Table', {
  source: 'ds_1',
  bindingType: 'direct',
  autoLoad: true,
})

// 测试获取绑定
const binding = manager.getBinding('control_1')
console.assert(binding !== undefined, '绑定应该存在')

// 测试更新绑定
manager.updateBinding('control_1', { refreshInterval: 60000 })

// 测试删除绑定
manager.removeBinding('control_1')
console.assert(manager.getBinding('control_1') === undefined, '绑定应该被删除')
```

#### 3.2 DataFlowManager

```typescript
import { DataFlowManager } from '@/core/renderer/designer/managers'

const manager = new DataFlowManager()

// 测试创建数据流
const flow = manager.createDataFlow({
  name: '测试数据流',
  sourceId: 'ds_1',
  transforms: [],
})

console.assert(flow.id !== undefined, '数据流应该有ID')

// 测试添加转换
manager.addTransform(flow.id, {
  id: 'transform_1',
  type: 'filter',
  enabled: true,
  config: {
    type: 'filter',
    conditions: [{ field: 'age', operator: 'gte', value: 18 }],
    logic: 'AND',
  },
})

// 测试获取数据流
const retrieved = manager.getDataFlow(flow.id)
console.assert(retrieved?.transforms.length === 1, '应该有一个转换')

// 测试删除数据流
manager.deleteDataFlow(flow.id)
console.assert(manager.getDataFlow(flow.id) === undefined, '数据流应该被删除')
```

#### 3.3 DataActionManager

```typescript
import { DataActionManager } from '@/core/renderer/designer/managers'

const manager = new DataActionManager()

// 测试创建数据操作
const action = manager.createDataAction({
  name: '测试操作',
  type: 'read',
  sourceId: 'ds_1',
})

console.assert(action.id !== undefined, '操作应该有ID')

// 测试获取操作
const retrieved = manager.getDataAction(action.id)
console.assert(retrieved !== undefined, '操作应该存在')

// 测试按类型获取
const readActions = manager.getDataActionsByType('read')
console.assert(readActions.length > 0, '应该有读取操作')

// 测试删除操作
manager.deleteDataAction(action.id)
console.assert(manager.getDataAction(action.id) === undefined, '操作应该被删除')
```

### 4. 执行器功能测试

#### 4.1 DataFlowEngine

```typescript
import { DataFlowEngine } from '@/core/runtime/DataFlowEngine'

const engine = new DataFlowEngine()

// 测试数据
const testData = [
  { id: 1, name: 'Alice', age: 25, status: 'active' },
  { id: 2, name: 'Bob', age: 17, status: 'active' },
  { id: 3, name: 'Charlie', age: 30, status: 'inactive' },
]

// 测试过滤
const filterFlow = {
  id: 'flow_1',
  name: '过滤测试',
  sourceId: 'ds_1',
  transforms: [
    {
      id: 't1',
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
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const result = await engine.execute(filterFlow, testData)
console.assert(result.length === 1, '应该只有一条记录')
console.assert(result[0].name === 'Alice', '应该是Alice')

// 测试排序
const sortFlow = {
  id: 'flow_2',
  name: '排序测试',
  sourceId: 'ds_1',
  transforms: [
    {
      id: 't1',
      type: 'sort',
      enabled: true,
      config: {
        type: 'sort',
        fields: [{ field: 'name', order: 'asc' }],
      },
    },
  ],
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const sorted = await engine.execute(sortFlow, testData)
console.assert(sorted[0].name === 'Alice', '第一个应该是Alice')
console.assert(sorted[1].name === 'Bob', '第二个应该是Bob')
```

#### 4.2 DataActionExecutor

```typescript
import { DataActionExecutor } from '@/core/runtime/DataActionExecutor'

const executor = new DataActionExecutor()

// 测试创建操作
const createAction = {
  id: 'action_1',
  name: '创建测试',
  type: 'create',
  sourceId: 'ds_1',
  config: {
    type: 'create',
    dataMapping: {
      name: 'form.name',
      email: 'form.email',
    },
  },
  enabled: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
}

const context = {
  form: {
    name: 'Test User',
    email: 'test@example.com',
  },
}

const result = await executor.execute(createAction, context)
console.assert(result.success === true, '操作应该成功')
```

### 5. 集成测试

#### 5.1 完整流程测试

1. [ ] 打开设计器
2. [ ] 打开数据配置弹框
3. [ ] 创建数据源
4. [ ] 创建数据流
5. [ ] 创建数据操作
6. [ ] 保存配置
7. [ ] 选择组件
8. [ ] 配置数据绑定
9. [ ] 保存绑定
10. [ ] 保存设计
11. [ ] 重新加载设计
12. [ ] 验证配置已恢复

#### 5.2 数据流转换测试

1. [ ] 创建包含多个转换步骤的数据流
2. [ ] 测试过滤转换
3. [ ] 测试映射转换
4. [ ] 测试排序转换
5. [ ] 测试聚合转换
6. [ ] 验证转换结果正确

#### 5.3 数据绑定测试

1. [ ] 创建直接绑定
2. [ ] 验证数据加载
3. [ ] 创建数据流绑定
4. [ ] 验证数据转换
5. [ ] 测试自动刷新
6. [ ] 验证数据更新

## 🐛 常见问题

### 问题1：数据源列表为空

**原因**: 数据源未正确传递给组件  
**解决**: 检查props传递，确保dataSources有值

### 问题2：数据流选择框不显示

**原因**: 绑定类型不是"dataflow"  
**解决**: 选择"数据流绑定"类型

### 问题3：保存后配置丢失

**原因**: 未实现持久化  
**解决**: 实现保存和加载逻辑

### 问题4：类型错误

**原因**: 类型定义不匹配  
**解决**: 检查src/types/index.ts中的类型定义

## 📊 测试报告模板

```markdown
# 数据绑定功能测试报告

## 测试信息

- 测试日期: YYYY-MM-DD
- 测试人员: [姓名]
- 测试环境: [开发/测试/生产]

## 测试结果

### 数据源配置弹框

- [ ] 通过 / [ ] 失败
- 问题描述:

### 属性面板数据绑定

- [ ] 通过 / [ ] 失败
- 问题描述:

### 管理器功能

- [ ] 通过 / [ ] 失败
- 问题描述:

### 执行器功能

- [ ] 通过 / [ ] 失败
- 问题描述:

### 集成测试

- [ ] 通过 / [ ] 失败
- 问题描述:

## 发现的问题

1.
2.
3.

## 建议

1.
2.
3.

## 总体评价

- [ ] 优秀
- [ ] 良好
- [ ] 一般
- [ ] 需要改进
```

## 🎯 性能测试

### 大数据量测试

```typescript
// 生成测试数据
const largeData = Array.from({ length: 10000 }, (_, i) => ({
  id: i,
  name: `User ${i}`,
  age: Math.floor(Math.random() * 80) + 18,
  status: i % 2 === 0 ? 'active' : 'inactive',
}))

// 测试过滤性能
console.time('filter')
const filtered = await engine.execute(filterFlow, largeData)
console.timeEnd('filter')

// 测试排序性能
console.time('sort')
const sorted = await engine.execute(sortFlow, largeData)
console.timeEnd('sort')

// 测试聚合性能
console.time('aggregate')
const aggregated = await engine.execute(aggregateFlow, largeData)
console.timeEnd('aggregate')
```

### 预期性能指标

- 过滤10000条数据: < 100ms
- 排序10000条数据: < 200ms
- 聚合10000条数据: < 300ms

## ✅ 验收标准

### 功能完整性

- [ ] 所有核心功能正常工作
- [ ] UI界面显示正确
- [ ] 数据流转换正确
- [ ] 数据操作执行成功
- [ ] 数据绑定生效

### 用户体验

- [ ] 界面友好直观
- [ ] 操作流畅无卡顿
- [ ] 错误提示清晰
- [ ] 表单验证完善

### 代码质量

- [ ] 无TypeScript错误
- [ ] 无运行时错误
- [ ] 代码规范统一
- [ ] 注释完整清晰

### 文档完整性

- [ ] API文档完整
- [ ] 使用示例清晰
- [ ] 集成指南详细
- [ ] 测试指南完善

---

**更新日期**: 2025-10-11  
**版本**: 1.0.0  
**状态**: ✅ 测试指南已完成
