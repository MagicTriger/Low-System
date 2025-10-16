# 布局图案功能说明

## 功能概述

属性面板中已经集成了可视化的布局图案，用于直观地展示不同的布局配置。

## 已实现的图案类型

### 1. 盒模型图案（Box Model）

**位置：** 样式标签 → 尺寸配置

**显示内容：**

- Margin（外边距）- 红色边框
- Border（边框）- 橙色边框
- Padding（内边距）- 绿色边框
- Content（内容区域）- 蓝色边框

**用途：** 帮助用户理解盒模型的层次结构

### 2. Flex 布局图案

**位置：** 样式标签 → Flex布局

**显示内容：**

- 根据配置动态显示子元素的排列方式
- 支持的配置：
  - Flex方向（row, column, row-reverse, column-reverse）
  - Flex换行（nowrap, wrap, wrap-reverse）
  - 主轴对齐（flex-start, flex-end, center, space-between, space-around, space-evenly）
  - 交叉轴对齐（flex-start, flex-end, center, baseline, stretch）
  - 列间距和行间距

**用途：** 实时预览 Flex 布局效果

### 3. 定位图案

**位置：** 样式标签 → 定位配置

**显示内容：**

- 根据定位类型显示元素的位置
- 支持的定位类型：
  - relative（相对定位）
  - absolute（绝对定位）
  - fixed（固定定位）
  - sticky（粘性定位）

**用途：** 理解不同定位方式的效果

## 技术实现

### 组件文件

**LayoutDiagram.vue**

- 路径：`src/core/renderer/designer/settings/components/LayoutDiagram.vue`
- 类型：Vue 3 组件
- Props：
  - `type`: 图案类型（'flex' | 'grid' | 'box' | 'position'）
  - `childCount`: 子元素数量（用于 Flex 布局）
  - `flexDirection`: Flex 方向
  - `flexWrap`: Flex 换行方式
  - `justifyContent`: 主轴对齐
  - `alignItems`: 交叉轴对齐
  - `columnGap`: 列间距
  - `rowGap`: 行间距
  - `positionType`: 定位类型

### 集成位置

**PropertiesPanel.vue**

- 第 131 行：盒模型图案

  ```vue
  <LayoutDiagram type="box" style="margin-bottom: 16px" />
  ```

- 第 265-275 行：Flex 布局图案

  ```vue
  <LayoutDiagram
    type="flex"
    :child-count="control?.children?.length || 3"
    :flex-direction="layoutConfig.flexDirection"
    :flex-wrap="layoutConfig.flexWrap"
    :justify-content="layoutConfig.justifyContent"
    :align-items="layoutConfig.alignItems"
    :column-gap="..."
    :row-gap="..."
    style="margin-bottom: 16px"
  />
  ```

- 第 354 行：定位图案
  ```vue
  <LayoutDiagram type="position" :positionType="positionConfig.position" style="margin-bottom: 16px" />
  ```

## 样式设计

### 盒模型样式

```css
.box-margin {
  background: rgba(255, 117, 117, 0.2); /* 红色半透明 */
  border: 2px solid #ff7875;
}

.box-border {
  background: rgba(255, 169, 64, 0.2); /* 橙色半透明 */
  border: 2px solid #ffa940;
}

.box-padding {
  background: rgba(115, 209, 61, 0.2); /* 绿色半透明 */
  border: 2px solid #73d13d;
}

.box-content {
  background: rgba(64, 169, 255, 0.2); /* 蓝色半透明 */
  border: 2px solid #40a9ff;
}
```

### Flex 布局样式

```css
.flex-container {
  display: flex;
  background: rgba(96, 165, 250, 0.1); /* 蓝色半透明背景 */
  border: 1px dashed #60a5fa; /* 蓝色虚线边框 */
}

.flex-item {
  background: #60a5fa; /* 蓝色实心 */
  color: white;
}
```

### 定位样式

```css
.position-container {
  background: rgba(114, 46, 209, 0.1); /* 紫色半透明背景 */
  border: 1px dashed #722ed1; /* 紫色虚线边框 */
}

.position-item {
  background: #722ed1; /* 紫色实心 */
  color: white;
}
```

## 使用方法

### 查看盒模型图案

1. 打开设计器
2. 选择任意组件
3. 在右侧属性面板，切换到"样式"标签
4. 展开"尺寸配置"
5. 在顶部可以看到盒模型图案

### 查看 Flex 布局图案

1. 选择一个容器组件（如 Flex 容器）
2. 在右侧属性面板，切换到"样式"标签
3. 展开"Flex布局"
4. 在顶部可以看到 Flex 布局图案
5. 修改 Flex 配置，图案会实时更新

### 查看定位图案

1. 选择任意组件
2. 在右侧属性面板，切换到"样式"标签
3. 展开"定位配置"
4. 在顶部可以看到定位图案
5. 修改定位类型，图案会实时更新

## 特性

### 1. 实时更新

图案会根据配置的变化实时更新，提供即时的视觉反馈。

### 2. 动态高度

Flex 布局图案会根据子元素数量和布局方向自动调整高度。

### 3. 颜色编码

不同的布局层次使用不同的颜色，便于区分：

- 盒模型：红（margin）→ 橙（border）→ 绿（padding）→ 蓝（content）
- Flex 布局：蓝色系
- 定位：紫色系

### 4. 标签提示

盒模型图案中每个层次都有文字标签，清晰标识各个部分。

## 扩展性

### 添加新的图案类型

如果需要添加新的图案类型（如 Grid 布局），可以：

1. 在 `LayoutDiagram.vue` 中添加新的模板：

```vue
<div v-else-if="type === 'grid'" class="grid-diagram">
  <!-- Grid 布局图案 -->
</div>
```

2. 添加对应的样式：

```css
.grid-diagram {
  /* Grid 布局样式 */
}
```

3. 在 PropertiesPanel 中使用：

```vue
<LayoutDiagram type="grid" />
```

## 优势

1. **直观易懂** - 可视化展示比文字描述更容易理解
2. **实时反馈** - 配置变化立即反映在图案上
3. **学习工具** - 帮助用户学习 CSS 布局概念
4. **减少错误** - 直观预览减少配置错误
5. **提升效率** - 快速理解和调整布局

## 总结

布局图案功能已经完全实现并集成到属性面板中，为用户提供了直观的可视化布局配置体验。这个功能不仅提升了用户体验，还帮助用户更好地理解 CSS 布局概念。

---

**实现日期：** 2025-10-11  
**状态：** ✅ 已完成并集成
**位置：** 属性面板 → 样式标签 → 各个布局配置面板
