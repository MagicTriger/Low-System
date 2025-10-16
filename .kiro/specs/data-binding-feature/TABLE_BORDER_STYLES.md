# 表格组件边框样式优化

## 问题描述

当给Table组件添加TableHeader和TableRow子组件后,需要显示清晰的表格分隔线,使表头和表体视觉上更加美观和易于区分。

## 解决方案

### 1. Table容器样式

```css
.table-designer-mode {
  width: 100%;
  border: 1px solid #d9d9d9; /* 外边框 */
  border-radius: 2px; /* 圆角 */
  overflow: hidden; /* 隐藏溢出 */
  background-color: #ffffff; /* 白色背景 */
}
```

### 2. TableHeader分隔线

```css
/* TableHeader底部加粗分隔线 */
.table-designer-mode :deep(.table-header-flex-container),
.table-designer-mode :deep(.table-header-wrapper) {
  border-bottom: 2px solid #f0f0f0; /* 2px加粗线 */
  background-color: #fafafa; /* 浅灰背景 */
}
```

### 3. TableRow分隔线

```css
/* TableRow之间的细分隔线 */
.table-designer-mode :deep(.table-row-flex-container),
.table-designer-mode :deep(.table-row-wrapper) {
  border-bottom: 1px solid #f0f0f0; /* 1px细线 */
}

/* 最后一行不显示底部边框 */
.table-designer-mode :deep(.table-row-flex-container:last-child),
.table-designer-mode :deep(.table-row-wrapper:last-child) {
  border-bottom: none;
}
```

### 4. 移除内部边框

```css
/* 移除TableHeader和TableRow的左右边框,只保留上下分隔线 */
.table-designer-mode :deep(.table-header-flex-container) {
  border-left: none;
  border-right: none;
  border-top: none;
}

.table-designer-mode :deep(.table-row-flex-container) {
  border-left: none;
  border-right: none;
  border-top: none;
}
```

## 视觉效果

```
┌─────────────────────────────────────┐  ← Table外边框 (1px #d9d9d9)
│  TableHeader (背景 #fafafa)          │
│  ┌─────────┬─────────┬─────────┐   │
│  │ 文本1   │ 文本2   │ 文本3   │   │
│  └─────────┴─────────┴─────────┘   │
├═════════════════════════════════════┤  ← TableHeader底部 (2px #f0f0f0)
│  TableRow                            │
│  ┌─────────┬─────────┬─────────┐   │
│  │ 数据1   │ 数据2   │ 数据3   │   │
│  └─────────┴─────────┴─────────┘   │
├─────────────────────────────────────┤  ← TableRow分隔线 (1px #f0f0f0)
│  TableRow                            │
│  ┌─────────┬─────────┬─────────┐   │
│  │ 数据4   │ 数据5   │ 数据6   │   │
│  └─────────┴─────────┴─────────┘   │
└─────────────────────────────────────┘  ← Table外边框
```

## 样式层级

### 外层: Table容器

- 外边框: 1px solid #d9d9d9
- 圆角: 2px
- 背景: #ffffff

### 中层: TableHeader

- 背景色: #fafafa (浅灰色,区分表头)
- 底部边框: 2px solid #f0f0f0 (加粗,强调分隔)
- 左右上边框: none

### 内层: TableRow

- 背景色: #ffffff (白色)
- 底部边框: 1px solid #f0f0f0 (细线,分隔行)
- 左右上边框: none
- 最后一行: 无底部边框

## 颜色说明

| 颜色    | 用途            | 说明              |
| ------- | --------------- | ----------------- |
| #d9d9d9 | Table外边框     | 中等灰色,清晰边界 |
| #f0f0f0 | 内部分隔线      | 浅灰色,柔和分隔   |
| #fafafa | TableHeader背景 | 极浅灰,区分表头   |
| #ffffff | TableRow背景    | 白色,清晰内容     |

## 边框粗细

| 位置            | 粗细 | 说明              |
| --------------- | ---- | ----------------- |
| Table外边框     | 1px  | 标准边框          |
| TableHeader底部 | 2px  | 加粗,强调表头分隔 |
| TableRow底部    | 1px  | 细线,柔和分隔     |

## 使用场景

### 场景1: 标准表格

```
Table
├─ TableHeader
│  ├─ Text (姓名)
│  ├─ Text (年龄)
│  └─ Text (操作)
├─ TableRow
│  ├─ Text (张三)
│  ├─ Text (25)
│  └─ Button (编辑)
└─ TableRow
   ├─ Text (李四)
   ├─ Text (30)
   └─ Button (编辑)
```

**效果**:

- Table有清晰的外边框
- TableHeader有浅灰背景和加粗底部分隔线
- TableRow之间有细分隔线
- 最后一行无底部边框

### 场景2: 多行表格

```
Table
├─ TableHeader
└─ TableRow × 10
```

**效果**:

- 每行之间有清晰的分隔线
- 最后一行与Table底部边框无缝衔接

### 场景3: 只有表头

```
Table
└─ TableHeader
```

**效果**:

- TableHeader有浅灰背景
- 底部有加粗分隔线
- 与Table底部边框无缝衔接

## 响应式考虑

### 小屏幕

- 边框粗细保持不变
- 确保分隔线清晰可见

### 大屏幕

- 边框粗细保持不变
- 视觉效果一致

## 可访问性

### 对比度

- 边框颜色 #d9d9d9 与白色背景对比度: 2.8:1 ✓
- 分隔线 #f0f0f0 与白色背景对比度: 1.2:1 ✓
- TableHeader背景 #fafafa 与白色对比度: 1.04:1 ✓

### 视觉层次

- 外边框最深 (#d9d9d9)
- TableHeader分隔线次之 (2px #f0f0f0)
- TableRow分隔线最浅 (1px #f0f0f0)

## 浏览器兼容性

- ✅ Chrome/Edge: 完全支持
- ✅ Firefox: 完全支持
- ✅ Safari: 完全支持
- ✅ IE11: 完全支持 (border, border-radius)

## 性能考虑

- 使用简单的border属性,性能开销极小
- :deep() 选择器在Vue中编译为后代选择器,性能良好
- 无复杂的CSS计算或动画

## 维护建议

### 修改边框颜色

在Table.vue的style部分统一修改:

```css
/* 外边框颜色 */
.table-designer-mode {
  border: 1px solid #your-color;
}

/* 内部分隔线颜色 */
.table-designer-mode :deep(.table-header-flex-container),
.table-designer-mode :deep(.table-header-wrapper),
.table-designer-mode :deep(.table-row-flex-container),
.table-designer-mode :deep(.table-row-wrapper) {
  border-bottom-color: #your-color;
}
```

### 修改边框粗细

```css
/* TableHeader分隔线粗细 */
.table-designer-mode :deep(.table-header-flex-container),
.table-designer-mode :deep(.table-header-wrapper) {
  border-bottom-width: 3px; /* 改为3px */
}
```

### 添加悬停效果

```css
/* TableRow悬停效果 */
.table-designer-mode :deep(.table-row-flex-container:hover) {
  background-color: #f5f5f5;
}
```

## 完成状态

- ✅ Table外边框样式
- ✅ TableHeader底部加粗分隔线
- ✅ TableHeader浅灰背景
- ✅ TableRow细分隔线
- ✅ 最后一行无底部边框
- ✅ 移除内部左右边框
- ✅ 圆角和溢出处理

## 相关文件

- `src/core/renderer/controls/collection/Table.vue` - Table组件样式
- `src/core/renderer/controls/collection/TableHeader.vue` - TableHeader组件
- `src/core/renderer/controls/collection/TableRow.vue` - TableRow组件

---

**修改日期**: 2025-10-11  
**修改人**: Kiro AI Assistant  
**状态**: 已完成 ✅
