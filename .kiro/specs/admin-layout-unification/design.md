# 管理端界面框架统一 - 设计文档

## 概述

本设计旨在将管理端(admin)和设计端(designer)的界面框架统一,通过创建可配置的共享布局组件,实现代码复用,减少维护成本。

## 架构设计

### 当前架构分析

**设计端 (Designer)**:

- 位置: `src/modules/designer/views/Layout.vue`
- 特点: 所有布局代码都在一个文件中,包括头部、侧边栏、内容区
- 菜单: 硬编码在组件中
- 样式: Dashgum 风格,黄色主题

**管理端 (Admin)**:

- 位置: `src/modules/admin/views/Layout.vue`
- 特点: 使用独立的子组件 (AppHeader, AppLogo, DynamicMenu)
- 菜单: 动态从后端加载
- 样式: 与设计端相同的 Dashgum 风格

**问题**:

1. 两个模块有重复的布局代码
2. 样式定义重复
3. 修改布局需要同时修改两处
4. 管理端的组件化做得更好,但设计端没有复用

### 目标架构

```
src/
├── core/
│   └── layout/                    # 共享布局组件
│       ├── BaseLayout.vue         # 基础布局组件
│       ├── AppHeader.vue          # 统一头部组件
│       ├── AppSidebar.vue         # 统一侧边栏组件
│       ├── AppLogo.vue            # Logo 组件
│       ├── DynamicMenu.vue        # 动态菜单组件
│       ├── UserDropdown.vue       # 用户下拉菜单
│       └── types.ts               # 布局相关类型定义
├── modules/
│   ├── designer/
│   │   ├── views/
│   │   │   └── Layout.vue         # 使用 BaseLayout + 设计端配置
│   │   └── config/
│   │       └── layout.ts          # 设计端布局配置
│   └── admin/
│       ├── views/
│       │   └── Layout.vue         # 使用 BaseLayout + 管理端配置
│       └── config/
│           └── layout.ts          # 管理端布局配置
```

## 组件设计

### 1. BaseLayout 组件

**职责**: 提供基础的布局结构,接收配置来定制不同模块的布局

**Props**:

```typescript
interface BaseLayoutProps {
  // 布局配置
  config: LayoutConfig
  // 是否显示侧边栏
  showSidebar?: boolean
  // 是否显示头部
  showHeader?: boolean
  // 初始折叠状态
  defaultCollapsed?: boolean
}

interface LayoutConfig {
  // 模块标识
  module: 'designer' | 'admin'
  // 头部配置
  header: HeaderConfig
  // 侧边栏配置
  sidebar: SidebarConfig
  // 主题配置
  theme: ThemeConfig
}
```

**插槽**:

- `header-left`: 头部左侧自定义内容
- `header-right`: 头部右侧自定义内容
- `sidebar-top`: 侧边栏顶部自定义内容
- `sidebar-bottom`: 侧边栏底部自定义内容
- `default`: 主内容区

### 2. AppHeader 组件

**职责**: 统一的头部导航栏

**Props**:

```typescript
interface AppHeaderProps {
  // 头部配置
  config: HeaderConfig
  // 折叠状态
  collapsed: boolean
  // 用户信息
  userInfo?: UserInfo
}

interface HeaderConfig {
  // 标题
  title: string
  // 是否显示侧边栏切换按钮
  showSidebarToggle: boolean
  // 是否显示图标库
  showIconLibrary: boolean
  // 是否显示通知
  showNotifications: boolean
  // 是否显示设置
  showSettings: boolean
  // 自定义操作按钮
  actions?: HeaderAction[]
}
```

**事件**:

- `toggle-sidebar`: 切换侧边栏
- `icon-library-click`: 点击图标库
- `notification-click`: 点击通知
- `settings-click`: 点击设置
- `user-action`: 用户菜单操作

### 3. AppSidebar 组件

**职责**: 统一的侧边栏导航

**Props**:

```typescript
interface AppSidebarProps {
  // 侧边栏配置
  config: SidebarConfig
  // 折叠状态
  collapsed: boolean
  // 菜单数据
  menuData: MenuTreeNode[]
  // 当前选中的菜单
  selectedKeys?: string[]
}

interface SidebarConfig {
  // 宽度
  width: number
  // 折叠后宽度
  collapsedWidth: number
  // 是否显示用户信息
  showUserInfo: boolean
  // 用户信息配置
  userInfo?: {
    avatar?: string
    name?: string
  }
  // 菜单模式
  menuMode: 'inline' | 'vertical'
  // 主题
  theme: 'light' | 'dark'
}
```

**事件**:

- `menu-click`: 菜单点击
- `menu-select`: 菜单选中

### 4. DynamicMenu 组件

**职责**: 动态渲染菜单树

**Props**:

```typescript
interface DynamicMenuProps {
  // 菜单树数据
  menuTree: MenuTreeNode[]
  // 折叠状态
  collapsed: boolean
  // 当前选中的菜单
  selectedKeys?: string[]
  // 菜单模式
  mode?: 'inline' | 'vertical'
  // 主题
  theme?: 'light' | 'dark'
}
```

**功能**:

- 递归渲染多级菜单
- 支持图标显示
- 支持路由跳转
- 支持权限控制

### 5. UserDropdown 组件

**职责**: 用户信息下拉菜单

**Props**:

```typescript
interface UserDropdownProps {
  // 用户信息
  userInfo: UserInfo
  // 菜单项配置
  menuItems?: UserMenuItem[]
}

interface UserInfo {
  avatar?: string
  name: string
  role?: string
}

interface UserMenuItem {
  key: string
  label: string
  icon?: string
  divider?: boolean
}
```

**事件**:

- `menu-click`: 菜单项点击

## 数据流设计

### 配置数据流

```
模块配置文件 (layout.ts)
    ↓
BaseLayout 组件
    ↓
├─→ AppHeader (header config)
├─→ AppSidebar (sidebar config)
│       ↓
│   DynamicMenu (menu data)
└─→ RouterView (content)
```

### 菜单数据流

```
后端 API
    ↓
State Management (resource module)
    ↓
Layout 组件
    ↓
AppSidebar 组件
    ↓
DynamicMenu 组件
    ↓
渲染菜单树
```

## 配置示例

### 设计端配置

```typescript
// src/modules/designer/config/layout.ts
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

### 管理端配置

```typescript
// src/modules/admin/config/layout.ts
export const adminLayoutConfig: LayoutConfig = {
  module: 'admin',
  header: {
    title: '管理后台',
    showSidebarToggle: true,
    showIconLibrary: false,
    showNotifications: true,
    showSettings: true,
  },
  sidebar: {
    width: 220,
    collapsedWidth: 80,
    showUserInfo: true,
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

## 样式设计

### CSS 变量

使用 CSS 变量来实现主题定制:

```css
:root {
  /* 主题色 */
  --layout-primary-color: #f6bb42;
  --layout-header-bg: #f6bb42;
  --layout-sidebar-bg: #2c3e50;
  --layout-content-bg: #e8eaed;

  /* 尺寸 */
  --layout-header-height: 60px;
  --layout-sidebar-width: 220px;
  --layout-sidebar-collapsed-width: 80px;

  /* 间距 */
  --layout-padding: 20px;
  --layout-padding-mobile: 12px;

  /* 阴影 */
  --layout-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  --layout-sidebar-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
}
```

### 响应式设计

```css
/* 桌面端 */
@media (min-width: 769px) {
  .layout-sidebar {
    position: fixed;
    left: 0;
  }

  .layout-content {
    margin-left: var(--layout-sidebar-width);
  }
}

/* 移动端 */
@media (max-width: 768px) {
  .layout-sidebar {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }

  .layout-sidebar.mobile-open {
    transform: translateX(0);
  }

  .layout-content {
    margin-left: 0;
    padding: var(--layout-padding-mobile);
  }
}
```

## 迁移策略

### 阶段 1: 创建共享组件

1. 创建 `src/core/layout/` 目录
2. 实现 BaseLayout 组件
3. 实现 AppHeader 组件
4. 实现 AppSidebar 组件
5. 实现 DynamicMenu 组件
6. 实现 UserDropdown 组件
7. 定义类型和接口

### 阶段 2: 迁移管理端

1. 创建管理端配置文件
2. 更新管理端 Layout.vue 使用 BaseLayout
3. 删除管理端的重复组件
4. 测试管理端功能

### 阶段 3: 迁移设计端

1. 创建设计端配置文件
2. 更新设计端 Layout.vue 使用 BaseLayout
3. 测试设计端功能

### 阶段 4: 清理和优化

1. 删除重复的样式文件
2. 优化性能
3. 添加单元测试
4. 更新文档

## 错误处理

### 菜单加载失败

```typescript
try {
  await loadMenuTree()
} catch (error) {
  console.error('加载菜单失败:', error)
  // 显示默认菜单或错误提示
  showDefaultMenu()
}
```

### 路由跳转失败

```typescript
const handleMenuClick = async (menuItem: MenuTreeNode) => {
  try {
    await router.push(menuItem.path)
  } catch (error) {
    console.error('路由跳转失败:', error)
    message.error('页面跳转失败')
  }
}
```

## 测试策略

### 单元测试

- BaseLayout 组件渲染测试
- AppHeader 组件交互测试
- AppSidebar 组件折叠/展开测试
- DynamicMenu 组件菜单渲染测试
- 配置加载测试

### 集成测试

- 设计端完整流程测试
- 管理端完整流程测试
- 路由导航测试
- 权限控制测试

### E2E 测试

- 用户登录后查看布局
- 切换菜单导航
- 折叠/展开侧边栏
- 响应式布局测试

## 性能优化

### 懒加载

```typescript
// 懒加载菜单组件
const DynamicMenu = defineAsyncComponent(() => import('@/core/layout/DynamicMenu.vue'))
```

### 虚拟滚动

对于大量菜单项,使用虚拟滚动:

```typescript
import { RecycleScroller } from 'vue3-virtual-scroller'
```

### 缓存

缓存菜单数据,避免重复请求:

```typescript
const menuCache = new Map<string, MenuTreeNode[]>()

const loadMenuTree = async (module: string) => {
  if (menuCache.has(module)) {
    return menuCache.get(module)
  }

  const data = await fetchMenuTree(module)
  menuCache.set(module, data)
  return data
}
```

## 兼容性考虑

- 支持 Vue 3.x
- 支持 TypeScript 4.x+
- 支持现代浏览器 (Chrome, Firefox, Safari, Edge)
- 支持移动端浏览器
- 支持 IE11 (可选,需要 polyfill)

## 安全考虑

- 菜单权限验证
- 路由权限守卫
- XSS 防护 (菜单名称转义)
- CSRF 防护 (API 请求)

## 可访问性

- 键盘导航支持
- ARIA 标签
- 焦点管理
- 屏幕阅读器支持

## 国际化

```typescript
interface LayoutI18n {
  header: {
    title: string
    notifications: string
    settings: string
    logout: string
  }
  sidebar: {
    collapse: string
    expand: string
  }
}
```

## 文档

- 组件 API 文档
- 配置指南
- 迁移指南
- 最佳实践
- 常见问题
