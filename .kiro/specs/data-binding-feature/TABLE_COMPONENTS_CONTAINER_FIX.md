# 表格组件容器化修复

## 问题描述

1. **TableHeader组件无法渲染子组件**: TableHeader的type是`Collection`,不是`Container`,导致无法接受拖拽的子组件
2. **TableRow组件不应该是容器**: TableRow应该保持`Collection`类型,用于数据展示,不接受子组件

## 解决方案

### 1. 修改TableHeader为Container类型

**文件**: `src/core/renderer/controls/register.ts`

```typescript
// 之前: type: ControlType.Collection
// 之后: type: ControlType.Container

{
  kind: 'table-header',
  kindName: '表格头',
  type: ControlType.Container,  // ✅ 改为Container
  icon: 'table',
  component: TableHeader,
  dataBindable: false,
  events: {},
  settings: [
    {
      key: 'columns',
      name: '列配置',
      type: 'array',
      defaultValue: [],
      group: 'basic',
    },
  ],
}
```

### 2. TableRow保持Collection类型

```typescript
{
  kind: 'table-row',
  kindName: '表格行',
  type: ControlType.Collection,  // ✅ 保持Collection
  icon: 'table',
  component: TableRow,
  dataBindable: true,
  // ...
}
```

## 组件类型说明

### Container类型

- 可以接受子组件
- 支持拖拽其他组件到内部
- 子组件通过`<slot>`渲染
- 示例: Flex, Grid, TableHeader

### Collection类型

- 用于数据展示
- 不接受子组件
- 通过数据绑定显示内容
- 示例: Table, TableRow

## 渲染逻辑

### TableHeader (Container)

```
1. 有子组件 (control.children.length > 0)
   → 渲染 <th><slot></slot></th>
   → 子组件显示在表头单元格中

2. 有数据配置 (columns.length > 0)
   → 渲染数据列

3. 空状态
   → 显示占位符提示
```

### TableRow (Collection)

```
1. 有数据配置 (columns.length > 0)
   → 渲染数据单元格

2. 空状态
   → 显示占位符提示

❌ 不支持子组件
```

## 使用场景

### TableHeader使用场景

**场景1: 拖拽子组件**

```
Table
├─ TableHeader (Container)
│  └─ Button ✅ 可以拖拽
│  └─ Text ✅ 可以拖拽
└─ TableRow (Collection)
   └─ 数据绑定显示
```

**场景2: 数据配置**

```
Table
├─ TableHeader (columns配置)
│  → 显示: 姓名 | 年龄 | 邮箱
└─ TableRow (columns + record配置)
   → 显示: 张三 | 25 | zhang@example.com
```

### TableRow使用场景

**只支持数据绑定**

```
Table
├─ TableHeader
└─ TableRow
   ├─ columns: [{ dataIndex: 'name' }, { dataIndex: 'age' }]
   └─ record: { name: '张三', age: 25 }
   → 显示: 张三 | 25
```

## 设计理念

### TableHeader作为容器

- **灵活性**: 用户可以自由组合任何组件作为表头
- **可扩展性**: 支持复杂的表头布局(按钮、搜索框等)
- **一致性**: 与其他容器组件(Flex、Grid)行为一致

### TableRow作为集合

- **专注性**: 专注于数据展示
- **性能**: 不需要处理子组件渲染逻辑
- **简洁性**: 通过数据绑定即可完成大部分场景

## 测试步骤

### 测试TableHeader容器功能

1. 创建Table组件
2. 添加TableHeader到Table中
3. 从左侧组件面板拖拽Button到TableHeader
4. ✅ 验证: Button应该显示在表头单元格中,保持表格样式

### 测试TableRow数据展示

1. 创建Table组件
2. 添加TableRow到Table中
3. 配置columns和record属性
4. ✅ 验证: 数据应该正确显示在表格行中
5. ❌ 验证: 不能拖拽组件到TableRow

## 完成状态

✅ TableHeader改为Container类型
✅ TableRow保持Collection类型
✅ TableHeader支持子组件渲染
✅ TableRow专注数据展示
✅ 表格样式保持完整

## 相关文件

- `src/core/renderer/controls/register.ts` - 组件类型定义
- `src/core/renderer/controls/collection/TableHeader.vue` - 表头组件
- `src/core/renderer/controls/collection/TableRow.vue` - 表格行组件
- `src/core/renderer/designer/canvas/DesignerControlRenderer.vue` - 子组件渲染逻辑

---

**修改日期**: 2025-10-11
**修改人**: Kiro AI Assistant
