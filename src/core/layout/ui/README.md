# 统一布局组件系统

## 概述

这个目录包含了统一的 UI 布局组件,用于管理端和设计端共享。通过配置化的方式实现不同模块的差异化需求。

## 组件列表

### BaseLayout.vue

基础布局组件,提供整体的布局结构。

**Props**:

- `config`: 布局配置对象
- `showSidebar`: 是否显示侧边栏
- `showHeader`: 是否显示头部
- `defaultCollapsed`: 初始折叠状态
- `menuData`: 菜单数据

**插槽**:

- `header-left`: 头部左侧自定义内容
- `header-right`: 头部右侧自定义内容
- `sidebar-top`: 侧边栏顶部自定义内容
- `sidebar-bottom`: 侧边栏底部自定义内容
- `default`: 主内容区

### AppHeader.vue

统一的头部导航栏组件。

**Props**:

- `config`: 头部配置
- `collapsed`: 折叠状态
- `userInfo`: 用户信息

**事件**:

- `toggle-sidebar`: 切换侧边栏
- `icon-library-click`: 点击图标库
- `notification-click`: 点击通知
- `settings-click`: 点击设置
- `user-action`: 用户菜单操作

### AppSidebar.vue

统一的侧边栏导航组件。

**Props**:

- `config`: 侧边栏配置
- `collapsed`: 折叠状态
- `menuData`: 菜单数据
- `selectedKeys`: 当前选中的菜单

**事件**:

- `menu-click`: 菜单点击
- `menu-select`: 菜单选中

### DynamicMenu.vue

动态菜单组件,递归渲染菜单树。

**Props**:

- `menuTree`: 菜单树数据
- `collapsed`: 折叠状态
- `selectedKeys`: 当前选中的菜单
- `mode`: 菜单模式
- `theme`: 主题

**事件**:

- `menu-click`: 菜单点击

### UserDropdown.vue

用户信息下拉菜单组件。

**Props**:

- `userInfo`: 用户信息
- `menuItems`: 菜单项配置

**事件**:

- `menu-click`: 菜单项点击

### AppLogo.vue

Logo 组件。

**Props**:

- `collapsed`: 折叠状态
- `logoUrl`: Logo 图片 URL
- `logoText`: Logo 文本
- `to`: 点击跳转路径

## 使用示例

### 设计端

```vue
<template>
  <BaseLayout :config="layoutConfig" :menu-data="menuData">
    <router-view />
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseLayout from '@/core/layout/ui/BaseLayout.vue'
import { designerLayoutConfig } from '../config/layout'

const menuData = ref([])

onMounted(async () => {
  // 加载菜单数据
  menuData.value = await loadDesignerMenu()
})
</script>
```

### 管理端

```vue
<template>
  <BaseLayout :config="layoutConfig" :menu-data="menuData">
    <router-view />
  </BaseLayout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BaseLayout from '@/core/layout/ui/BaseLayout.vue'
import { adminLayoutConfig } from '../config/layout'
import { useModule } from '@/core/state/helpers'

const resourceModule = useModule('resource')
const menuData = ref([])

onMounted(async () => {
  await resourceModule.dispatch('fetchAdminMenuTree')
  menuData.value = resourceModule.state.adminMenuTree
})
</script>
```

## 配置示例

```typescript
import type { LayoutConfig } from '@/core/layout/types'

export const designerLayoutConfig: LayoutConfig = {
  module: 'designer',
  header: {
    title: '低代码平台',
    showSidebarToggle: true,
    showIconLibrary: true,
    showNotifications: true,
    showSettings: true,
  },
  sidebar: {
    width: 220,
    collapsedWidth: 80,
    showUserInfo: true,
    userInfo: {
      name: '管理员',
    },
    menuMode: 'inline',
    theme: 'dark',
  },
  theme: {
    primaryColor: '#f6bb42',
    sidebarBg: '#2c3e50',
    headerBg: '#f6bb42',
  },
}
```

## 样式定制

组件使用 CSS 变量来实现主题定制:

```css
:root {
  --layout-primary-color: #f6bb42;
  --layout-header-bg: #f6bb42;
  --layout-sidebar-bg: #2c3e50;
  --layout-content-bg: #e8eaed;
  --layout-header-height: 60px;
  --layout-sidebar-width: 220px;
  --layout-sidebar-collapsed-width: 80px;
}
```

## 注意事项

1. 所有组件都使用 TypeScript,确保类型安全
2. 组件支持响应式布局,自动适配移动端
3. 菜单数据需要符合 `MenuTreeNode` 类型定义
4. 配置对象应该在模块的 `config/layout.ts` 文件中定义
5. 组件内部使用 Ant Design Vue 组件库

## 开发指南

### 添加新功能

1. 在 `types.ts` 中添加类型定义
2. 在对应组件中实现功能
3. 更新配置接口
4. 更新文档

### 调试

使用 Vue Devtools 查看组件状态和 Props。

### 测试

每个组件都应该有对应的单元测试文件。
