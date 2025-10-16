# 菜单数据传递修复

## 🐛 问题描述

控制台出现大量错误:

```
应用警告: Missing required prop: "menuData"
应用警告: Invalid prop: type check failed for prop "menuTree". Expected Array, got Undefined
应用错误: TypeError: items is not iterable
```

## 🔍 问题分析

### 数据流

```
Layout.vue (designer)
  ↓ :menu-data="designerMenuTree"
BaseLayout.vue
  ↓ ??? (缺失)
AppSidebar.vue
  ↓ :menu-tree="menuData"
DynamicMenu.vue
```

### 根本原因

`BaseLayout.vue` 接收了 `menuData` prop,但是**没有传递给 `AppSidebar`**!

```vue
<!-- BaseLayout.vue - 修复前 -->
<AppSidebar :config="config.sidebar" :collapsed="collapsed" :selected-keys="selectedKeys" @menu-click="handleMenuClick">
  <!-- 缺少 :menu-data="menuData" -->
</AppSidebar>
```

这导致:

1. `AppSidebar` 的必需 prop `menuData` 未定义
2. `DynamicMenu` 的 `menuTree` prop 收到 undefined
3. 遍历 undefined 导致 "items is not iterable" 错误

## ✅ 修复方案

### 添加 menuData 传递

```vue
<!-- BaseLayout.vue - 修复后 -->
<AppSidebar
  :config="config.sidebar"
  :collapsed="collapsed"
  :menu-data="menuData"
  :selected-keys="selectedKeys"
  @menu-click="handleMenuClick"
>
  <template #top>
    <slot name="sidebar-top" />
  </template>
  <template #bottom>
    <slot name="sidebar-bottom" />
  </template>
</AppSidebar>
```

## 🎯 预期效果

修复后:

- ✅ 菜单数据正确传递到 AppSidebar
- ✅ DynamicMenu 能正确渲染菜单项
- ✅ 控制台不再有 prop 相关错误
- ✅ 侧边栏菜单正常显示

## 📊 完整数据流

```
Layout.vue
  props: { menuData: designerMenuTree }
    ↓
BaseLayout.vue
  props: { menuData: MenuTreeNode[] }
    ↓ :menu-data="menuData"
AppSidebar.vue
  props: { menuData: MenuTreeNode[] }
    ↓ :menu-tree="menuData"
DynamicMenu.vue
  props: { menuTree: MenuTreeNode[] }
    ↓ v-for="item in menuTree"
DynamicMenuItem.vue
  props: { menuItem: MenuTreeNode }
```

## 🧪 测试步骤

1. 刷新页面
2. 检查控制台,确认没有 prop 相关错误
3. 检查侧边栏菜单是否正常显示
4. 点击汉堡菜单按钮,测试收起/展开功能

## 📝 相关修复

这个修复解决了菜单数据传递的问题,配合之前的 CSS 修复,侧边栏功能应该完全正常了:

1. ✅ CSS 选择器修复 - 内容区域正确调整位置
2. ✅ 菜单数据传递修复 - 菜单正常显示

---

**修复时间**: 2025-10-15  
**修复状态**: ✅ 完成  
**测试状态**: 待验证
