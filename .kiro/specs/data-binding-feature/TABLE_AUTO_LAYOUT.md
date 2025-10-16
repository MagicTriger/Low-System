# 表格组件智能自动布局功能

## 功能概述

实现表格组件在容器中的智能自动布局:

- 1个表格 → 占满容器(100%)
- 2个表格 → 各占50%
- 3个表格 → 各占33.33%
- 4个表格 → 各占25%
- N个表格 → 各占100/N%

## 实现状态

✅ 设计完成
✅ 代码实现完成
✅ 语法检查通过
✅ 响应式更新修复完成
✅ 容器类型识别修复完成

## 核心功能

1. 自动尺寸计算 - 根据表格数量平均分配空间
2. 智能布局适配 - 支持横向(row)和纵向(column)布局
3. 动态调整 - 添加/删除/修改时自动重新计算
4. 响应式更新 - 确保Vue能够检测到变化并重新渲染
5. 多容器支持 - 支持Container、Flex、Grid等容器类型

## 触发时机

- 添加表格组件到Flex/Grid容器时
- 删除Flex/Grid容器中的表格组件时
- 修改Flex/Grid容器布局方向时

## 实现细节

### 核心函数: autoResizeTablesInContainer

```typescript
function autoResizeTablesInContainer(container: Control) {
  if (!container.children) return

  // 找出所有表格组件
  const tableControls = container.children.filter(child => child.kind === 'Table')
  if (tableControls.length === 0) return

  // 计算每个表格应该占用的百分比
  const percentage = Math.floor(10000 / tableControls.length) / 100

  // 获取容器的布局方向
  const flexDirection = container.layout?.flexDirection || 'row'
  const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse'

  // 根据布局方向设置对应的尺寸
  tableControls.forEach(table => {
    if (!table.layout) {
      table.layout = {}
    }

    if (isVertical) {
      // 纵向布局:设置高度为平均值,宽度占满
      table.layout.height = { type: '%', value: percentage }
      table.layout.width = { type: '%', value: 100 }
    } else {
      // 横向布局:设置宽度为平均值,高度占满
      table.layout.width = { type: '%', value: percentage }
      table.layout.height = { type: '%', value: 100 }
    }
  })

  // 触发视图更新
  if (currentView.value) {
    currentView.value = { ...currentView.value }
  }
}
```

### 集成点

#### 1. addControl - 添加表格时自动调整

```typescript
// 如果添加的是表格组件到容器中,自动调整所有表格的尺寸
if (control.kind === 'Table' && (parent.kind === 'Container' || parent.kind === 'Flex' || parent.kind === 'Grid')) {
  autoResizeTablesInContainer(parent)
}
```

#### 2. removeControl - 删除表格时自动调整

```typescript
// 如果删除的是表格组件,并且父容器是Container/Flex/Grid,重新调整剩余表格的尺寸
if (
  removedControl?.kind === 'Table' &&
  (parentContainer?.kind === 'Container' || parentContainer?.kind === 'Flex' || parentContainer?.kind === 'Grid')
) {
  autoResizeTablesInContainer(parentContainer)
}
```

#### 3. updateControl - 修改布局方向时自动调整

```typescript
// 如果更新的是容器的布局方向,重新调整其中的表格尺寸
if (updates.layout?.flexDirection) {
  const updatedControl = findControlById(newCurrentView.controls, controlId)
  if (updatedControl?.kind === 'Container' || updatedControl?.kind === 'Flex' || updatedControl?.kind === 'Grid') {
    autoResizeTablesInContainer(updatedControl)
  }
}
```

## 使用示例

### 横向布局 (Flex容器)

```
Flex容器 (flexDirection: row)
├─ Table 1 (width: 33.33%, height: 100%)
├─ Table 2 (width: 33.33%, height: 100%)
└─ Table 3 (width: 33.33%, height: 100%)
```

### 纵向布局 (Flex容器)

```
Flex容器 (flexDirection: column)
├─ Table 1 (width: 100%, height: 33.33%)
├─ Table 2 (width: 100%, height: 33.33%)
└─ Table 3 (width: 100%, height: 33.33%)
```

## 测试步骤

1. **创建Flex容器**

   - 在画布上添加一个Flex组件
   - 在属性面板中设置flexDirection为'row'(横向)

2. **添加第1个表格**

   - 拖拽Table组件到Flex容器中
   - 验证: 表格应该占满容器(100%宽度)

3. **添加第2个表格**

   - 再拖拽一个Table组件到Flex容器中
   - 验证: 两个表格应该各占50%宽度

4. **添加第3个表格**

   - 再拖拽一个Table组件到Flex容器中
   - 验证: 三个表格应该各占33.33%宽度

5. **删除一个表格**

   - 删除其中一个表格
   - 验证: 剩余表格应该重新分配空间

6. **修改布局方向**
   - 将Flex容器的flexDirection从'row'改为'column'
   - 验证: 表格应该从横向排列变为纵向排列,尺寸重新计算

## 关键修复

### 1. 响应式更新问题

在初始实现中,虽然修改了控件的layout属性,但Vue无法检测到这些变化。通过在`addControl`和`removeControl`函数的最后添加:

```typescript
currentView.value = { ...currentView.value }
```

这会创建一个新的对象引用,触发Vue的响应式系统,确保视图正确更新。

### 2. 容器类型识别问题

最初的实现只检查`parent.kind === 'Container'`,但实际的容器控件类型是`'Flex'`和`'Grid'`。修复后支持三种容器类型:

```typescript
if (control.kind === 'Table' && (parent.kind === 'Container' || parent.kind === 'Flex' || parent.kind === 'Grid')) {
  autoResizeTablesInContainer(parent)
}
```

### 3. 样式转换

layout属性通过`controlToStyles`函数自动转换为CSS样式:

```typescript
// layout.width = { type: '%', value: 50 }
// 转换为: width: '50%'
if (layout.width) styles.width = sizeToCSS(layout.width)
```

## 完成日期

2025-10-11

## 版本历史

- v1.0 (2025-10-11): 初始实现
- v1.1 (2025-10-11): 修复响应式更新问题
- v1.2 (2025-10-11): 修复容器类型识别问题,支持Flex和Grid容器
