# 表格组件Flex布局支持

## 问题描述

1. Table、TableHeader、TableRow组件不支持Flex布局配置
2. TableRow组件类型是Collection,应该改为Container并移到容器组件分类

## 解决方案

### 1. 为Table组件添加Flex布局配置

**文件**: `src/core/renderer/controls/register.ts`

添加以下Flex布局配置项:

- `direction`: 主轴方向 (默认: column)
- `justify`: 主轴对齐 (默认: flex-start)
- `align`: 交叉轴对齐 (默认: flex-start)
- `wrap`: 换行方式 (默认: nowrap)
- `gap`: 间距 (默认: 0)

### 2. 为TableHeader组件添加Flex布局配置

添加以下Flex布局配置项:

- `direction`: 主轴方向 (默认: row)
- `justify`: 主轴对齐 (默认: flex-start)
- `align`: 交叉轴对齐 (默认: flex-start)
- `wrap`: 换行方式 (默认: nowrap)
- `gap`: 间距 (默认: 0)

### 3. TableRow改为Container类型并添加Flex布局配置

```typescript
// 之前: type: ControlType.Collection
// 之后: type: ControlType.Container

{
  kind: 'table-row',
  kindName: '表格行',
  type: ControlType.Container,  // ✅ 改为Container
  // ...
  settings: [
    // ... 原有配置
    // ✅ 添加Flex布局配置
    {
      key: 'direction',
      name: '主轴方向',
      type: 'select',
      defaultValue: 'row',
      options: [
        { label: '水平', value: 'row' },
        { label: '水平反向', value: 'row-reverse' },
        { label: '垂直', value: 'column' },
        { label: '垂直反向', value: 'column-reverse' },
      ],
      group: 'layout',
    },
    // ... 其他Flex配置
  ],
}
```

## Flex布局配置详情

### 主轴方向 (direction)

- **row**: 水平排列
- **row-reverse**: 水平反向排列
- **column**: 垂直排列
- **column-reverse**: 垂直反向排列

### 主轴对齐 (justify)

- **flex-start**: 起始对齐
- **flex-end**: 结束对齐
- **center**: 居中对齐
- **space-between**: 两端对齐
- **space-around**: 环绕对齐
- **space-evenly**: 均匀对齐

### 交叉轴对齐 (align)

- **flex-start**: 起始对齐
- **flex-end**: 结束对齐
- **center**: 居中对齐
- **baseline**: 基线对齐
- **stretch**: 拉伸对齐

### 换行方式 (wrap)

- **nowrap**: 不换行
- **wrap**: 换行
- **wrap-reverse**: 反向换行

### 间距 (gap)

- 数字类型,单位为px
- 默认值: 0

## 组件类型变更

### Table

- **类型**: Container (保持不变)
- **默认direction**: column (垂直排列子组件)
- **用途**: 作为表格的主容器

### TableHeader

- **类型**: Container (保持不变)
- **默认direction**: row (水平排列子组件)
- **用途**: 表头容器,可拖拽子组件

### TableRow

- **类型**: Container (从Collection改为Container) ✅
- **默认direction**: row (水平排列子组件)
- **用途**: 表格行容器,可拖拽子组件
- **分类**: 现在显示在容器组件分类中

## 使用场景

### 场景1: Table垂直布局

```
Table (direction: column)
├─ TableHeader
│  └─ Button
├─ TableRow
│  └─ Input
└─ TableRow
   └─ Input
```

### 场景2: TableHeader水平布局

```
TableHeader (direction: row, justify: space-between)
├─ Text (姓名)
├─ Text (年龄)
└─ Text (操作)
```

### 场景3: TableRow水平布局

```
TableRow (direction: row, gap: 10)
├─ Input (姓名输入框)
├─ NumberInput (年龄输入框)
└─ Button (删除按钮)
```

### 场景4: 响应式布局

```
TableRow (direction: row, wrap: wrap)
├─ Card (宽度50%)
├─ Card (宽度50%)
├─ Card (宽度50%)  → 自动换行
└─ Card (宽度50%)
```

## 配置示例

### Table配置

```json
{
  "direction": "column",
  "justify": "flex-start",
  "align": "stretch",
  "gap": 0
}
```

### TableHeader配置

```json
{
  "direction": "row",
  "justify": "space-between",
  "align": "center",
  "gap": 10
}
```

### TableRow配置

```json
{
  "direction": "row",
  "justify": "flex-start",
  "align": "center",
  "gap": 8,
  "wrap": "nowrap"
}
```

## 样式应用

Flex布局配置会通过`styleConverter.ts`转换为CSS样式:

```typescript
// direction → flex-direction
// justify → justify-content
// align → align-items
// wrap → flex-wrap
// gap → gap
```

最终生成的CSS:

```css
.table {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: stretch;
  gap: 0px;
}

.table-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.table-row {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}
```

## 测试步骤

### 测试Table Flex布局

1. 创建Table组件
2. 添加多个TableHeader和TableRow子组件
3. 配置direction为column
4. ✅ 验证: 子组件应该垂直排列

### 测试TableHeader Flex布局

1. 创建TableHeader组件
2. 拖拽多个Button到TableHeader
3. 配置direction为row, justify为space-between
4. ✅ 验证: Button应该水平排列,两端对齐

### 测试TableRow Flex布局

1. 创建TableRow组件
2. 拖拽Input、NumberInput、Button到TableRow
3. 配置direction为row, gap为10
4. ✅ 验证: 组件应该水平排列,间距10px

### 测试TableRow在容器分类中

1. 打开组件面板
2. 切换到"容器组件"分类
3. ✅ 验证: TableRow应该显示在容器组件列表中

## 完成状态

✅ Table组件添加Flex布局配置
✅ TableHeader组件添加Flex布局配置
✅ TableRow改为Container类型
✅ TableRow添加Flex布局配置
✅ TableRow移到容器组件分类
✅ 所有容器组件统一支持Flex布局

## 相关文件

- `src/core/renderer/controls/register.ts` - 组件定义和配置
- `src/core/renderer/controls/collection/Table.vue` - Table组件
- `src/core/renderer/controls/collection/TableHeader.vue` - TableHeader组件
- `src/core/renderer/controls/collection/TableRow.vue` - TableRow组件
- `src/core/renderer/designer/utils/styleConverter.ts` - 样式转换器

## 设计理念

### 统一的容器行为

所有Container类型的组件都应该支持Flex布局配置,包括:

- Flex
- Grid
- Table
- TableHeader
- TableRow

### 灵活的布局控制

用户可以通过Flex布局配置实现:

- 子组件排列方向
- 对齐方式
- 间距控制
- 换行行为

### 响应式设计

通过Flex布局配置,用户可以轻松实现响应式布局,无需编写CSS代码。

---

**修改日期**: 2025-10-11
**修改人**: Kiro AI Assistant
