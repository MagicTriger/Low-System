# 管理端侧边栏简化

## 📋 项目概述

简化管理端侧边栏,去除搜索、筛选等复杂功能,只保留简洁的菜单列表,显示从设计端资源管理界面挂载过来的菜单项。

## 🎯 核心目标

- **简化界面**: 只显示 Logo 和菜单列表,去除搜索、筛选等功能
- **菜单挂载**: 支持从设计端标记菜单挂载到管理端
- **复用组件**: 最大化复用现有的 DynamicMenu 组件
- **数据同步**: 设计端和管理端的菜单数据保持同步

## 🏗️ 架构设计

### 整体流程

```
设计端资源管理
    ↓ (标记挂载)
菜单数据库 (mountedToAdmin 字段)
    ↓ (API 获取)
管理端 Layout
    ↓ (传递数据)
DynamicMenu 组件
    ↓ (渲染)
侧边栏菜单
```

### 组件结构

```
Layout.vue
├── AppLogo.vue
└── DynamicMenu.vue (复用现有组件)
```

## 📝 核心功能

### 1. 简洁的侧边栏

- 只显示 Logo 和菜单列表
- 不包含搜索框和筛选器
- 支持展开/折叠
- 响应式设计

### 2. 菜单挂载

- 在设计端资源管理界面标记菜单
- 标记后自动显示在管理端侧边栏
- 支持取消挂载
- 实时同步

### 3. 菜单展示

- 树形结构展示
- 支持多级菜单
- 图标显示
- 当前页面高亮

## 🔧 技术实现

### API 扩展

```typescript
// 获取已挂载到管理端的菜单树
getAdminMenuTree(): Promise<MenuTreeNode[]>

// 挂载菜单到管理端
mountMenuToAdmin(menuCode: string): Promise<void>

// 取消菜单挂载
unmountMenuFromAdmin(menuCode: string): Promise<void>
```

### 数据结构

```typescript
interface MenuTreeNode {
  menuCode: string
  name: string
  path?: string
  icon?: string
  nodeType: 1 | 2 | 3 // 1=文件夹, 2=页面, 3=按钮
  sortOrder: number
  mountedToAdmin?: boolean // 新增字段
  children?: MenuTreeNode[]
}
```

### State 扩展

```typescript
interface ResourceState {
  adminMenuTree: MenuTreeNode[] // 管理端菜单树
}

// Actions
fetchAdminMenuTree() // 获取管理端菜单
mountMenuToAdmin() // 挂载菜单
unmountMenuFromAdmin() // 取消挂载
```

## 📦 需要删除的组件

之前创建的复杂组件需要删除:

- ❌ `src/modules/admin/components/AdminSidebar.vue`
- ❌ `src/modules/admin/components/SidebarSearch.vue`
- ❌ `src/modules/admin/components/SidebarFilter.vue`
- ❌ `.kiro/specs/admin-sidebar-redesign/TASK_1_COMPLETED.md`
- ❌ `.kiro/specs/admin-sidebar-redesign/TASK_4_COMPLETED.md`
- ❌ `.kiro/specs/admin-sidebar-redesign/TASK_7_COMPLETED.md`
- ❌ `.kiro/specs/admin-sidebar-redesign/PROGRESS_UPDATE.md`

## 📦 保留的组件

- ✅ `src/modules/admin/components/DynamicMenu.vue` (现有组件)
- ✅ `src/modules/admin/components/AppLogo.vue`
- ✅ `src/modules/admin/components/AppHeader.vue`
- ✅ `src/modules/admin/views/Layout.vue` (需要调整)

## 🚀 快速开始

### 1. 清理旧组件

```bash
# 删除之前创建的复杂组件
rm src/modules/admin/components/AdminSidebar.vue
rm src/modules/admin/components/SidebarSearch.vue
rm src/modules/admin/components/SidebarFilter.vue
```

### 2. 扩展 API

在 `src/core/api/menu.ts` 中添加新的 API 方法。

### 3. 扩展 State

在 `src/core/state/modules/resource.ts` 中添加新的状态和 actions。

### 4. 调整 Layout

更新 `src/modules/admin/views/Layout.vue`,使用 `adminMenuTree` 数据。

### 5. 添加挂载操作

在设计端资源管理界面添加"挂载到管理端"按钮。

## 📊 任务进度

- [ ] 1. 清理旧组件 (0.5h)
- [ ] 2. 扩展菜单 API (2h)
- [ ] 3. 扩展 resource state (2h)
- [ ] 4. 更新数据结构 (0.5h)
- [ ] 5. 调整 Layout 组件 (1h)
- [ ] 6. 添加挂载操作 (3h)
- [ ] 7. 实现数据同步 (1h)
- [ ] 8. 添加错误处理 (1h)
- [ ] 9. 性能优化 (2h)
- [ ] 10. 编写测试 (4h, 可选)
- [ ] 11. 更新文档 (1h)
- [ ] 12. 测试验证 (2h)

**总计**: 约 15-20 小时

## 📖 文档

- [需求文档](./requirements.md) - 详细的功能需求
- [设计文档](./design.md) - 技术设计方案
- [任务列表](./tasks.md) - 详细的任务分解

## ✅ 成功标准

- ✅ 管理端侧边栏只显示 Logo 和菜单列表
- ✅ 设计端可以标记菜单挂载到管理端
- ✅ 挂载的菜单自动显示在管理端侧边栏
- ✅ 菜单导航功能正常
- ✅ 响应式设计正常工作
- ✅ 性能指标达标
- ✅ 代码简洁易维护

## 🎨 界面效果

### 管理端侧边栏

```
┌─────────────────────┐
│   [Logo]            │
├─────────────────────┤
│ 📊 仪表板           │
│ 👤 用户管理         │
│ 🔐 角色管理         │
│ 📋 菜单管理         │
│ 🔑 权限管理         │
└─────────────────────┘
```

### 设计端资源管理

```
┌─────────────────────────────┐
│ 用户管理                     │
│ [挂载到管理端] [编辑] [删除] │
└─────────────────────────────┘
```

## 🔍 关键点

1. **简洁性**: 去除所有不必要的功能,只保留核心的菜单展示
2. **复用性**: 最大化复用现有的 DynamicMenu 组件
3. **一致性**: 设计端和管理端的菜单数据保持同步
4. **灵活性**: 通过 `mountedToAdmin` 字段灵活控制菜单显示

## 🤝 贡献

如有问题或建议,请联系开发团队。

## 📄 许可

内部项目,仅供团队使用。
