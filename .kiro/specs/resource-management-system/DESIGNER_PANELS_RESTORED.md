# 设计器面板恢复完成

## 更新时间

2025-10-16

## 问题描述

设计器页面缺少两个重要的面板:

1. 左侧组件库面板不见了
2. 右侧页面大纲面板不见了

## 问题分析

### 1. 组件库面板缺失

**原因**: 在 `DesignerNew.vue` 中,模板只包含了中间画布区和右侧属性面板,缺少左侧的组件库面板。

**影响**: 用户无法拖拽组件到画布上进行设计。

### 2. 页面大纲面板错误

**原因**: 在 `PropertiesPanel.vue` 中,组件注册代码有语法错误,试图在 `<script setup>` 外部使用未定义的 `app` 变量。

**影响**: 页面大纲树组件无法正常渲染。

## 修复方案

### 1. 恢复左侧组件库面板

#### 添加左侧面板结构

在 `DesignerNew.vue` 的模板中添加:

```vue
<!-- 左侧组件库面板 -->
<div class="designer-left" :style="{ width: leftPanelWidth + 'px' }">
  <!-- 调整大小手柄 -->
  <div class="resize-handle resize-handle-right" @mousedown="e => startResize('left', e)" />
  
  <ControlsPanel @control-select="handleControlSelect" />
</div>
```

#### 导入组件

```typescript
import ControlsPanel from '@/core/renderer/designer/controls.vue'
```

#### 添加状态管理

```typescript
// UI 状态
const leftPanelWidth = ref(280)
const rightPanelWidth = ref(320)
```

#### 更新调整大小功能

支持左右两个面板的大小调整:

```typescript
function startResize(panel: 'left' | 'right', e: MouseEvent) {
  resizing = true
  resizingPanel = panel
  startX = e.clientX
  startWidth = panel === 'left' ? leftPanelWidth.value : rightPanelWidth.value
  // ...
}
```

#### 添加样式

```css
/* 左侧组件库面板 */
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

### 2. 修复页面大纲面板

#### 修复组件注册错误

**原有代码** (有错误):

```typescript
// 定义组件
const components = {
  OutlineTree,
  useDesignerState,
  PanelGroup,
}

// 注册组件 - 错误:app 未定义
Object.entries(components).forEach(([name, component]) => {
  app.component(name, component)
})
```

**修复后代码**:

```typescript
// 使用设计器状态
const designerState = useDesignerState()
```

在 Vue 3 的 `<script setup>` 语法中,组件会自动注册,无需手动调用 `app.component()`。

## 修改文件

### 新建文件

- 无

### 修改文件

1. `src/modules/designer/views/DesignerNew.vue`

   - 添加左侧组件库面板结构
   - 导入 ControlsPanel 组件
   - 添加左侧面板宽度状态
   - 更新调整大小功能
   - 添加左侧面板样式

2. `src/core/renderer/designer/settings/PropertiesPanel.vue`
   - 修复组件注册错误
   - 简化 script setup 代码

## 设计器布局结构

修复后的设计器页面布局:

```
┌─────────────────────────────────────────────────────────────┐
│                        顶部工具栏                            │
├─────────────┬─────────────────────────────┬─────────────────┤
│             │                             │                 │
│   组件库    │          画布区域            │   属性面板      │
│             │                             │                 │
│  - 基础组件  │    - 画布工具栏              │  - 页面大纲     │
│  - 布局组件  │    - 设计画布               │  - 属性设置     │
│  - 表单组件  │    - 对齐工具               │  - 样式配置     │
│             │                             │                 │
│   280px     │          flex: 1           │     320px       │
└─────────────┴─────────────────────────────┴─────────────────┘
```

## 功能特性

### 左侧组件库面板

- **宽度**: 默认 280px,可调整 (200px - 600px)
- **内容**: 各种可拖拽的组件
- **交互**: 支持拖拽到画布
- **调整**: 右侧边缘可拖拽调整宽度

### 右侧属性面板

- **宽度**: 默认 320px,可调整 (200px - 600px)
- **内容**: 页面大纲 + 属性设置
- **大纲树**: 显示页面组件层级结构
- **属性面板**: 显示选中组件的属性配置
- **调整**: 左侧边缘可拖拽调整宽度

### 中间画布区

- **布局**: 自适应宽度 (flex: 1)
- **内容**: 设计画布 + 工具栏
- **背景**: 浅灰色 (#f8fafc)

## 测试步骤

1. **访问设计器页面**

   - 进入资源管理页面
   - 点击资源卡片的"设计器"按钮
   - 验证是否成功跳转到设计器

2. **检查左侧组件库**

   - 确认左侧显示组件库面板
   - 验证组件分类和列表
   - 测试拖拽组件到画布

3. **检查右侧面板**

   - 确认右侧显示属性面板
   - 验证页面大纲树显示
   - 测试选中组件后属性面板更新

4. **测试面板调整**

   - 拖拽左侧面板右边缘调整宽度
   - 拖拽右侧面板左边缘调整宽度
   - 验证最小/最大宽度限制

5. **测试响应式**
   - 调整浏览器窗口大小
   - 验证布局自适应
   - 验证小屏幕下的显示

## 状态

✅ 左侧组件库面板已恢复
✅ 右侧页面大纲面板已修复
✅ 面板调整大小功能正常
✅ 布局响应式正常

## 下一步

设计器面板恢复完成,可以继续进行其他功能开发或测试。
