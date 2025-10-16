# 侧边栏收起/展开功能修复

## 🐛 问题描述

用户反馈点击汉堡菜单按钮时,侧边栏收起但内容区域没有相应调整位置,导致内容被隐藏。

**具体现象**:

- 点击前:侧边栏宽度 240px,内容区域正常显示
- 点击后:侧边栏宽度变为 64px,但内容区域的左侧部分被隐藏

## 🔍 问题分析

经过代码检查,发现问题在于 CSS 选择器不正确:

### 原问题

```css
.unified-layout-collapsed .unified-layout-content {
  margin-left: var(--layout-sidebar-collapsed-width, 64px);
}
```

这个选择器是**后代选择器**,意味着它在查找 `.unified-layout-collapsed` 元素**内部**的 `.unified-layout-content` 元素。

但实际的 DOM 结构是:

```html
<div class="unified-layout unified-layout-collapsed">
  <header class="unified-layout-header">...</header>
  <aside class="unified-layout-sidebar">...</aside>
  <main class="unified-layout-content">...</main>
</div>
```

当侧边栏收起时,`unified-layout-collapsed` 类被添加到根元素 `.unified-layout` 上,与 `.unified-layout` 类共存。

## ✅ 修复方案

### 修复 CSS 选择器

将选择器从后代选择器改为类组合选择器:

```css
/* 修复前 - 后代选择器 */
.unified-layout-collapsed .unified-layout-content {
  margin-left: var(--layout-sidebar-collapsed-width, 64px);
}

/* 修复后 - 类组合选择器 */
.unified-layout.unified-layout-collapsed .unified-layout-content {
  margin-left: var(--layout-sidebar-collapsed-width, 64px);
}
```

### 技术说明

- `.unified-layout-collapsed .unified-layout-content` - 后代选择器,查找父元素内的子元素
- `.unified-layout.unified-layout-collapsed .unified-layout-content` - 类组合选择器,要求元素同时具有两个类

类组合选择器 `.unified-layout.unified-layout-collapsed` 表示元素必须同时具有 `unified-layout` 和 `unified-layout-collapsed` 两个类。

## 🎯 预期效果

修复后,点击汉堡菜单按钮应该:

### 收起时

- ✅ 侧边栏宽度从 240px 变为 64px
- ✅ 内容区域的 margin-left 从 240px 变为 64px
- ✅ 菜单文字隐藏,只显示图标
- ✅ 平滑的过渡动画

### 展开时

- ✅ 侧边栏宽度从 64px 变为 240px
- ✅ 内容区域的 margin-left 从 64px 变为 240px
- ✅ 菜单文字显示
- ✅ 平滑的过渡动画

## 🧪 测试步骤

1. **启动设计端服务**

   ```bash
   npm run D
   ```

2. **访问设计端**

   ```
   http://localhost:5173/designer/login
   ```

3. **登录后测试**
   - 点击顶部导航栏左侧的汉堡菜单图标 (☰)
   - 观察侧边栏是否正确收起到 64px
   - 观察内容区域是否正确向左移动
   - 再次点击确认能正确展开
   - 检查动画是否流畅

## 📊 修复前后对比

### 修复前

- ❌ 点击汉堡菜单,侧边栏宽度变化但内容区域不动
- ❌ CSS 选择器不匹配实际 DOM 结构
- ❌ 用户体验不佳,看起来像是右边面板在收展

### 修复后

- ✅ 点击汉堡菜单,侧边栏和内容区域同步调整
- ✅ CSS 选择器正确匹配 DOM 结构
- ✅ 流畅的收起/展开动画效果
- ✅ 符合用户预期的交互体验

## 🔧 相关文件

- `src/core/layout/ui/BaseLayout.vue` - 修复了内容区域的 CSS 选择器

## 📝 CSS 变量说明

```css
--layout-sidebar-width: 240px /* 展开时宽度 */ --layout-sidebar-collapsed-width: 64px /* 收起时宽度 */ --layout-transition-duration: 0.3s
  /* 过渡动画时长 */;
```

这些变量在 BaseLayout 的 `cssVariables` 计算属性中动态设置。

## 🎨 状态管理

```typescript
const collapsed = ref(props.defaultCollapsed)

const handleToggleSidebar = () => {
  collapsed.value = !collapsed.value
}
```

`collapsed` 状态通过 `handleToggleSidebar` 函数切换,并通过类绑定应用到模板:

```vue
<div class="unified-layout" :class="{ 'unified-layout-collapsed': collapsed }"></div>
```

---

**修复时间**: 2025-10-15  
**修复状态**: ✅ 完成  
**测试状态**: 待用户验证
