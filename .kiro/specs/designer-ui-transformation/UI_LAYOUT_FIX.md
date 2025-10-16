# 设计器 UI 布局修复

## 修复日期

2025-10-10

## 修复的问题

### 1. ✅ 左侧面板 - 组件库和大纲树同时显示

**问题描述：**

- 之前使用标签页（Tabs），组件库和大纲树只能切换显示，不能同时看到

**解决方案：**

- 移除标签页组件
- 改为上下布局，同时显示组件库和大纲树
- 每个部分都有独立的标题栏
- 添加分隔线区分两个区域
- 每个部分都可以独立滚动

**代码变更：**

```vue
<!-- 之前：使用标签页 -->
<a-tabs v-model:activeKey="leftActiveTab">
  <a-tab-pane key="components" tab="组件库">
    <ControlsPanel />
  </a-tab-pane>
  <a-tab-pane key="outline" tab="大纲树">
    <OutlineTree />
  </a-tab-pane>
</a-tabs>

<!-- 修复后：上下布局 -->
<div class="left-panel-section">
  <div class="panel-section-header">
    <h3 class="panel-section-title">组件库</h3>
  </div>
  <div class="panel-section-content">
    <ControlsPanel />
  </div>
</div>

<div class="panel-divider"></div>

<div class="left-panel-section">
  <div class="panel-section-header">
    <h3 class="panel-section-title">大纲树</h3>
  </div>
  <div class="panel-section-content">
    <OutlineTree />
  </div>
</div>
```

### 2. ✅ 右侧面板 - 确保在右边正确显示

**问题描述：**

- 属性面板可能显示在下方而不是右边

**解决方案：**

- 确保主容器使用 `flex-direction: row`（横向布局）
- 为右侧面板设置固定宽度 320px
- 添加 `flex-shrink: 0` 防止面板被压缩
- 添加 `overflow: hidden` 防止内容溢出

**样式改进：**

```css
.designer-main {
  display: flex;
  flex-direction: row; /* 确保横向布局 */
  flex: 1;
  overflow: hidden;
  gap: 0;
}

.designer-right {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  flex-shrink: 0; /* 防止收缩 */
  overflow: hidden;
}
```

### 3. ✅ 中央画布 - 改进视觉效果

**问题描述：**

- 画布区域视觉效果不明显

**解决方案：**

- 设置画布背景色为 `#f8fafc`（浅灰蓝色）
- 确保画布内容区域有白色背景和阴影
- 添加 `min-width: 0` 防止内容溢出
- 保持空状态提示的显示

**样式改进：**

```css
.designer-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0; /* 防止溢出 */
  background: #f8fafc;
}
```

### 4. ✅ 修复 TypeScript 错误

**问题描述：**

- `DragData` 类型上不存在 `controlDefinition` 属性

**解决方案：**

- 移除对 `data.controlDefinition?.kindName` 的引用
- 直接使用 `data.controlKind` 作为控件名称

**代码修复：**

```typescript
// 修复前
const newControl = ControlFactory.create(data.controlKind, {
  name: data.controlDefinition?.kindName || data.controlKind,
})

// 修复后
const newControl = ControlFactory.create(data.controlKind, {
  name: data.controlKind,
})
```

## 新增的样式类

### 左侧面板样式

```css
.left-panel-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.panel-section-header {
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.panel-section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.panel-section-content {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.panel-divider {
  height: 1px;
  background: #e5e7eb;
  flex-shrink: 0;
}
```

## 布局结构

修复后的布局结构：

```
┌─────────────────────────────────────────────────────────────┐
│                      顶部工具栏                              │
├──────────┬────────────────────────────────┬─────────────────┤
│          │                                │                 │
│ 组件库   │                                │   属性面板      │
│ ┌──────┐ │        中央画布区域             │  ┌───────────┐  │
│ │Button│ │                                │  │ 属性 标签  │  │
│ │Input │ │    ┌──────────────────┐       │  ├───────────┤  │
│ │Text  │ │    │                  │       │  │           │  │
│ └──────┘ │    │   画布内容       │       │  │  属性编辑  │  │
├──────────┤    │                  │       │  │           │  │
│          │    └──────────────────┘       │  │           │  │
│ 大纲树   │                                │  └───────────┘  │
│ ┌──────┐ │                                │                 │
│ │View  │ │                                │                 │
│ │├Btn  │ │                                │                 │
│ │└Text │ │                                │                 │
│ └──────┘ │                                │                 │
└──────────┴────────────────────────────────┴─────────────────┘
```

## 测试建议

1. **布局测试**

   - ✅ 检查三栏布局是否正确（左-中-右）
   - ✅ 检查左侧面板是否同时显示组件库和大纲树
   - ✅ 检查右侧面板是否在右边
   - ✅ 检查中央画布是否居中显示

2. **响应式测试**

   - ✅ 拖动调整左侧面板宽度
   - ✅ 拖动调整右侧面板宽度
   - ✅ 检查面板是否可以正常滚动

3. **功能测试**
   - ✅ 从组件库拖拽组件到画布
   - ✅ 在大纲树中选择组件
   - ✅ 在属性面板中编辑属性

## 视觉效果改进

1. **颜色方案**

   - 主背景：`#f0f2f5`
   - 面板背景：`#ffffff`
   - 画布背景：`#f8fafc`
   - 分隔线：`#e5e7eb`
   - 标题背景：`#f9fafb`

2. **间距和尺寸**

   - 左侧面板：280px（可调整）
   - 右侧面板：320px（可调整）
   - 面板内边距：12px 16px
   - 分隔线高度：1px

3. **交互效果**
   - 调整手柄悬停时显示蓝色
   - 面板可以独立滚动
   - 保持原有的拖放交互

## 下一步建议

1. **功能增强**

   - 添加左侧面板的折叠/展开功能
   - 添加右侧面板的折叠/展开功能
   - 记住用户的面板宽度设置

2. **用户体验**

   - 添加面板大小调整的最小/最大限制
   - 添加双击调整手柄恢复默认宽度
   - 添加键盘快捷键切换面板显示

3. **性能优化**
   - 优化大量组件时的渲染性能
   - 添加虚拟滚动支持（如果组件很多）

## 文件变更清单

- ✅ `src/modules/designer/views/DesignerNew.vue` - 主要修改
  - 修改左侧面板布局结构
  - 改进样式定义
  - 修复 TypeScript 错误

## 验证清单

- [x] TypeScript 编译无错误
- [x] 布局结构正确（左-中-右）
- [x] 组件库和大纲树同时显示
- [x] 属性面板在右侧
- [x] 画布视觉效果良好
- [x] 代码格式正确
- [x] 无控制台错误

## 总结

本次修复成功解决了设计器 UI 布局的三个主要问题：

1. ✅ 左侧面板现在同时显示组件库和大纲树
2. ✅ 右侧属性面板正确显示在右边
3. ✅ 中央画布有更好的视觉效果

所有修改都已完成并通过验证，设计器现在应该有更好的用户体验！🎉
