# 侧边栏切换调试指南

## 🔍 问题现象

从截图看:

1. 点击汉堡菜单前:侧边栏宽度正常(240px),显示完整菜单文字
2. 点击汉堡菜单后:侧边栏变窄(64px),但右侧内容区域也被压缩了

## 🐛 可能的原因

### 1. CSS 选择器问题 ✅ 已修复

已将 `.unified-layout-collapsed .unified-layout-content` 改为 `.unified-layout.unified-layout-collapsed .unified-layout-content`

### 2. 需要检查的其他问题

#### 检查点 1: 类绑定是否生效

打开浏览器开发者工具,检查根元素:

```html
<!-- 展开状态 -->
<div class="unified-layout" style="...">
  <!-- 收起状态 -->
  <div class="unified-layout unified-layout-collapsed" style="..."></div>
</div>
```

#### 检查点 2: CSS 变量是否正确

在开发者工具中检查计算后的样式:

```css
/* 展开状态 */
.unified-layout-content {
  margin-left: 240px; /* 应该是 --layout-sidebar-width 的值 */
}

/* 收起状态 */
.unified-layout.unified-layout-collapsed .unified-layout-content {
  margin-left: 64px; /* 应该是 --layout-sidebar-collapsed-width 的值 */
}
```

#### 检查点 3: 侧边栏宽度是否正确变化

```css
/* 展开状态 */
.unified-layout-sidebar {
  width: 240px;
}

/* 收起状态 */
.unified-layout-sidebar-collapsed {
  width: 64px;
}
```

## 🧪 调试步骤

### 步骤 1: 在浏览器中检查元素

1. 打开浏览器开发者工具 (F12)
2. 点击汉堡菜单按钮
3. 观察以下元素的变化:

```javascript
// 在控制台执行以下代码
const layout = document.querySelector('.unified-layout')
const sidebar = document.querySelector('.unified-layout-sidebar')
const content = document.querySelector('.unified-layout-content')

console.log('Layout classes:', layout.className)
console.log('Sidebar width:', window.getComputedStyle(sidebar).width)
console.log('Content margin-left:', window.getComputedStyle(content).marginLeft)
```

### 步骤 2: 检查 collapsed 状态

在 Vue DevTools 中检查 BaseLayout 组件的 `collapsed` 状态:

- 展开时应该是 `false`
- 收起时应该是 `true`

### 步骤 3: 检查 CSS 变量

在开发者工具的 Elements 面板中,选中根元素,查看 Computed 样式:

```
--layout-sidebar-width: 240px
--layout-sidebar-collapsed-width: 64px
```

## 🔧 可能的修复方案

### 方案 1: 确保 CSS 选择器优先级正确

如果发现样式没有生效,可能是优先级问题。尝试添加 `!important`:

```css
.unified-layout.unified-layout-collapsed .unified-layout-content {
  margin-left: var(--layout-sidebar-collapsed-width, 64px) !important;
}
```

### 方案 2: 检查是否有其他样式覆盖

搜索项目中是否有其他地方定义了 `.unified-layout-content` 的样式:

```bash
# 在项目根目录执行
grep -r "unified-layout-content" --include="*.vue" --include="*.css"
```

### 方案 3: 使用 transform 代替 margin

如果 margin 方式有问题,可以尝试使用 transform:

```css
.unified-layout-content {
  margin-left: 0;
  transform: translateX(var(--layout-sidebar-width, 240px));
  transition: transform var(--layout-transition-duration);
}

.unified-layout.unified-layout-collapsed .unified-layout-content {
  transform: translateX(var(--layout-sidebar-collapsed-width, 64px));
}
```

## 📊 预期行为

### 正常情况下的 DOM 结构和样式

```html
<!-- 展开状态 -->
<div class="unified-layout" style="--layout-sidebar-width: 240px; --layout-sidebar-collapsed-width: 64px;">
  <header class="unified-layout-header">...</header>
  <aside class="unified-layout-sidebar" style="width: 240px;">...</aside>
  <main class="unified-layout-content" style="margin-left: 240px;">...</main>
</div>

<!-- 收起状态 -->
<div class="unified-layout unified-layout-collapsed" style="--layout-sidebar-width: 240px; --layout-sidebar-collapsed-width: 64px;">
  <header class="unified-layout-header">...</header>
  <aside class="unified-layout-sidebar unified-layout-sidebar-collapsed" style="width: 64px;">...</aside>
  <main class="unified-layout-content" style="margin-left: 64px;">...</main>
</div>
```

## 🎯 下一步

请按照上述调试步骤检查,并告诉我:

1. 根元素的类名是否正确切换
2. CSS 变量的值是否正确
3. 计算后的样式值是什么

这样我们就能找到问题的根本原因并修复它。
