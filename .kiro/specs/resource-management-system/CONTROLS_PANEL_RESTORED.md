# 设计器组件库面板恢复完成

## 更新时间

2025-10-15

## 问题描述

设计器页面左侧的组件库面板不见了,用户无法拖拽组件到画布上。

## 问题原因

在 `DesignerNew.vue` 文件中,虽然组件库面板组件 (`controls.vue`) 存在,但是:

1. 没有在模板中引入和使用
2. 没有导入 `ControlsPanel` 组件
3. 缺少左侧面板的布局和样式

## 修复方案

### 1. 添加左侧组件库面板到模板

在主内容区添加左侧面板:

```vue
<div class="designer-main">
  <!-- 左侧组件库面板 -->
  <div class="designer-left" :style="{ width: leftPanelWidth + 'px' }">
    <!-- 调整大小手柄 -->
    <div class="resize-handle resize-handle-right" @mousedown="e => startResize('left', e)" />

    <ControlsPanel @control-select="handleControlSelect" />
  </div>

  <!-- 中间画布区 -->
  <div class="designer-center">
    ...
  </div>

  <!-- 右侧面板 -->
  <div class="designer-right">
    ...
  </div>
</div>
```

### 2. 导入组件库面板组件

```typescript
import ControlsPanel from '@/core/renderer/designer/controls.vue'
```

### 3. 添加左侧面板状态

```typescript
const leftPanelWidth = ref(280)
```

### 4. 更新调整大小功能

修改 `startResize` 函数以支持左右两侧面板:

```typescript
function startResize(panel: 'left' | 'right', e: MouseEvent) {
  resizing = true
  resizingPanel = panel
  startX = e.clientX
  startWidth = panel === 'left' ? leftPanelWidth.value : rightPanelWidth.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent) {
  if (!resizing || !resizingPanel) return

  const delta = e.clientX - startX
  const minWidth = 200
  const maxWidth = 600

  if (resizingPanel === 'left') {
    // 左侧面板:向右拖动增加宽度
    const newWidth = startWidth + delta
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      leftPanelWidth.value = newWidth
    }
  } else {
    // 右侧面板:向左拖动增加宽度
    const newWidth = startWidth - delta
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      rightPanelWidth.value = newWidth
    }
  }
}
```

### 5. 添加左侧面板样式

```css
.designer-left {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;
  overflow: hidden;
}
```

## 修改文件

- `src/modules/designer/views/DesignerNew.vue` - 添加组件库面板

## 组件库面板功能

恢复后的组件库面板包含以下功能:

### 1. 组件分类

- 通用组件 (common)
- 输入组件 (input)
- 容器组件 (container)
- 表格组件 (table)
- 图表组件 (chart)
- 仪表盘组件 (dashboard)
- SVG组件 (svg)
- 移动端组件 (mobile)
- 自定义组件 (custom)

### 2. 搜索功能

- 点击搜索按钮可以搜索组件
- 支持模糊搜索
- 显示搜索结果数量

### 3. 拖拽功能

- 支持拖拽组件到画布
- 拖拽时显示抓取光标
- 拖拽数据格式符合 DragData 接口

### 4. 响应式设计

- 支持调整面板宽度 (200px - 600px)
- 小屏幕下自动调整布局
- 组件网格自适应

### 5. 统计信息

- 显示总组件数量
- 实时更新

## 布局结构

```
┌─────────────────────────────────────────────────────────┐
│                    顶部工具栏                              │
├──────────┬─────────────────────────┬───────────────
```
