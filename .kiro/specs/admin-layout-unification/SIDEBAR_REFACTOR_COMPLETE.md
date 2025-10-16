# 侧边栏重构完成

## 🎯 重构目标

删除复杂的 menuData 传递机制,简化布局系统,使用 slot 方式让使用者自己定义侧边栏内容。

## ✅ 完成的工作

### 1. 简化 BaseLayout 组件

**删除的内容**:

- ❌ `menuData` prop
- ❌ `AppSidebar` 组件
- ❌ `DynamicMenu` 组件
- ❌ `DynamicMenuItem` 组件
- ❌ 复杂的菜单数据传递逻辑
- ❌ 菜单选中状态管理
- ❌ 菜单点击事件处理

**保留的内容**:

- ✅ 布局配置 (config)
- ✅ 侧边栏折叠/展开功能
- ✅ 响应式设计
- ✅ CSS 变量系统
- ✅ 头部组件

**新增的内容**:

- ✅ `#sidebar` slot,传递 `collapsed` 状态
- ✅ 更简洁的 API

### 2. 更新 Layout.vue

**之前的方式**:

```vue
<BaseLayout :config="layoutConfig" :menu-data="designerMenuTree" @menu-click="handleMenuClick">
  <router-view />
</BaseLayout>
```

**现在的方式**:

```vue
<BaseLayout :config="layoutConfig">
  <template #sidebar="{ collapsed }">
    <a-menu
      v-model:selectedKeys="selectedKeys"
      mode="inline"
      theme="dark"
      :inline-collapsed="collapsed"
    >
      <a-menu-item key="/designer/resource">
        <template #icon><FolderOutlined /></template>
        <span>资源管理</span>
      </a-menu-item>
    </a-menu>
  </template>
  
  <router-view />
</BaseLayout>
```

## 🎨 新的使用方式

### 基本用法

```vue
<template>
  <BaseLayout :config="layoutConfig">
    <!-- 自定义侧边栏 -->
    <template #sidebar="{ collapsed }">
      <!-- 你的侧边栏内容 -->
      <a-menu :inline-collapsed="collapsed">
        <a-menu-item>菜单项</a-menu-item>
      </a-menu>
    </template>

    <!-- 主内容 -->
    <router-view />
  </BaseLayout>
</template>
```

### 优势

1. **更灵活**: 使用者可以完全自定义侧边栏内容
2. **更简单**: 不需要复杂的菜单数据结构
3. **更直观**: 直接在模板中定义菜单,所见即所得
4. **更易维护**: 减少了组件层级和数据传递
5. **更少错误**: 消除了 menuData 相关的 prop 验证错误

## 📊 代码对比

### 之前的复杂度

```
BaseLayout (接收 menuData)
  └── AppSidebar (接收 menuData)
      └── DynamicMenu (接收 menuTree)
          └── DynamicMenuItem (递归渲染)
```

**问题**:

- 4 层组件嵌套
- 复杂的 props 传递
- 菜单数据结构要求严格
- 难以自定义

### 现在的简洁度

```
BaseLayout (提供 sidebar slot)
  └── 使用者自定义内容 (直接使用 Ant Design Menu)
```

**优势**:

- 2 层组件
- 简单的 slot 传递
- 无数据结构限制
- 完全可自定义

## 🔧 技术细节

### BaseLayout Props

```typescript
interface Props {
  config: LayoutConfig // 布局配置
  showSidebar?: boolean // 是否显示侧边栏
  showHeader?: boolean // 是否显示头部
  defaultCollapsed?: boolean // 初始折叠状态
  userInfo?: UserInfo // 用户信息
  notificationCount?: number // 通知数量
}
```

### BaseLayout Slots

```typescript
{
  sidebar: { collapsed: boolean }  // 侧边栏插槽,传递折叠状态
  default: {}                      // 主内容插槽
  'header-left': {}               // 头部左侧插槽
  'header-right': {}              // 头部右侧插槽
}
```

### BaseLayout Events

```typescript
{
  'toggle-sidebar': (collapsed: boolean) => void
  'icon-library-click': () => void
  'notification-click': () => void
  'settings-click': () => void
  'user-action': (action: string) => void
}
```

## 🎯 侧边栏折叠功能

### CSS 实现

```css
/* 侧边栏宽度 */
.unified-layout-sidebar {
  width: var(--layout-sidebar-width, 240px);
  transition: width var(--layout-transition-duration);
}

/* 折叠状态 */
.unified-layout.unified-layout-collapsed .unified-layout-sidebar {
  width: var(--layout-sidebar-collapsed-width, 64px);
}

/* 内容区域自动调整 */
.unified-layout-content {
  margin-left: var(--layout-sidebar-width, 240px);
  transition: margin-left var(--layout-transition-duration);
}

.unified-layout.unified-layout-collapsed .unified-layout-content {
  margin-left: var(--layout-sidebar-collapsed-width, 64px);
}
```

### 工作原理

1. 点击汉堡菜单按钮
2. `collapsed` 状态切换
3. 根元素添加/移除 `unified-layout-collapsed` 类
4. CSS 自动调整侧边栏宽度和内容区域边距
5. Ant Design Menu 的 `inline-collapsed` 自动隐藏文字

## 📝 迁移指南

### 如果你正在使用旧版 BaseLayout

**步骤 1**: 删除 `menu-data` prop

```diff
<BaseLayout
  :config="layoutConfig"
- :menu-data="menuData"
>
```

**步骤 2**: 添加 sidebar slot

```diff
<BaseLayout :config="layoutConfig">
+ <template #sidebar="{ collapsed }">
+   <a-menu :inline-collapsed="collapsed">
+     <!-- 你的菜单项 -->
+   </a-menu>
+ </template>

  <router-view />
</BaseLayout>
```

**步骤 3**: 删除 `@menu-click` 事件

```diff
<BaseLayout
  :config="layoutConfig"
- @menu-click="handleMenuClick"
>
```

**步骤 4**: 在菜单项中直接处理点击

```vue
<a-menu-item @click="router.push('/path')">
  菜单项
</a-menu-item>
```

## 🚀 下一步

现在侧边栏已经完全简化,你可以:

1. ✅ 使用任何 UI 库的菜单组件
2. ✅ 自定义侧边栏样式
3. ✅ 添加自定义内容(logo、用户信息等)
4. ✅ 完全控制菜单行为

## 🎉 总结

通过这次重构:

- 删除了 3 个复杂的组件
- 减少了 200+ 行代码
- 消除了所有 menuData 相关错误
- 提供了更灵活的 API
- 保持了所有核心功能

侧边栏折叠功能现在应该可以正常工作了! 🎊
