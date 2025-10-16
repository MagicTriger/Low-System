# 管理端侧边栏简化 - 设计文档

## 概述

本文档描述管理端侧边栏简化的技术设计方案。核心思路是保持现有的 DynamicMenu 组件不变,只需要调整数据源,让它只显示从设计端挂载过来的菜单。

## 架构设计

### 整体架构

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

### 组件层次

```
Layout.vue
├── AppLogo.vue
└── DynamicMenu.vue (复用现有组件)
    └── a-menu (Ant Design 菜单组件)
```

## 核心组件设计

### 1. Layout 组件调整

**文件**: `src/modules/admin/views/Layout.vue`

**调整内容**:

```vue
<template>
  <a-layout class="admin-layout">
    <a-layout-header class="admin-header">
      <AppHeader :collapsed="collapsed" @toggle-sidebar="collapsed = !collapsed" />
    </a-layout-header>

    <a-layout class="main-layout">
      <!-- 侧边栏 -->
      <a-layout-sider v-model:collapsed="collapsed" :trigger="null" collapsible :width="220" :collapsed-width="80" class="admin-sider">
        <AppLogo :collapsed="collapsed" />
        <!-- 使用现有的 DynamicMenu 组件 -->
        <DynamicMenu :menu-tree="adminMenuTree" :collapsed="collapsed" />
      </a-layout-sider>

      <!-- 内容区 -->
      <a-layout-content class="admin-content">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useModule } from '@/core/state/helpers'
import type { MenuTreeNode } from '@/core/api/menu'

const collapsed = ref(false)
const adminMenuTree = ref<MenuTreeNode[]>([])
const resourceModule = useModule('resource')

// 加载已挂载到管理端的菜单
const loadAdminMenuTree = async () => {
  try {
    await resourceModule.dispatch('fetchAdminMenuTree')
    adminMenuTree.value = resourceModule.state.adminMenuTree || []
  } catch (error) {
    console.error('加载管理端菜单失败:', error)
  }
}

onMounted(() => {
  loadAdminMenuTree()
})
</script>
```

### 2. DynamicMenu 组件

**文件**: `src/modules/admin/components/DynamicMenu.vue`

**保持不变**: 现有的 DynamicMenu 组件已经很好地实现了菜单展示功能,不需要修改。

**功能特性**:

- ✅ 树形结构展示
- ✅ 展开/折叠功能
- ✅ 菜单导航
- ✅ 当前页面高亮
- ✅ 响应式设计
- ✅ 图标显示
- ✅ 默认菜单支持

### 3. 设计端资源管理界面调整

**文件**: `src/modules/designer/views/ResourceManagement.vue`

**添加挂载操作**:

在资源卡片或树形节点上添加"挂载到管理端"操作按钮。

```vue
<template>
  <!-- 在资源卡片或树节点的操作区域添加 -->
  <a-tooltip :title="item.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
    <a-button type="text" :icon="item.mountedToAdmin ? 'link' : 'disconnect'" @click="handleToggleMount(item)">
      {{ item.mountedToAdmin ? '已挂载' : '挂载' }}
    </a-button>
  </a-tooltip>
</template>

<script setup lang="ts">
const handleToggleMount = async (item: MenuTreeNode) => {
  try {
    if (item.mountedToAdmin) {
      await menuApi.unmountMenuFromAdmin(item.menuCode)
      message.success('已取消挂载')
    } else {
      await menuApi.mountMenuToAdmin(item.menuCode)
      message.success('挂载成功')
    }
    // 刷新数据
    await loadResourceTree()
  } catch (error) {
    message.error('操作失败')
  }
}
</script>
```

## 数据层设计

### 1. API 扩展

**文件**: `src/core/api/menu.ts`

**新增方法**:

```typescript
/**
 * 获取已挂载到管理端的菜单树
 */
export async function getAdminMenuTree(): Promise<MenuTreeNode[]> {
  const response = await request.get<ApiResponse<MenuTreeNode[]>>('/menu/admin-tree')
  return response.data || []
}

/**
 * 挂载菜单到管理端
 */
export async function mountMenuToAdmin(menuCode: string): Promise<void> {
  await request.post('/menu/mount-to-admin', { menuCode })
}

/**
 * 取消菜单挂载
 */
export async function unmountMenuFromAdmin(menuCode: string): Promise<void> {
  await request.post('/menu/unmount-from-admin', { menuCode })
}

/**
 * 检查菜单是否已挂载到管理端
 */
export async function isMenuMountedToAdmin(menuCode: string): Promise<boolean> {
  const response = await request.get<ApiResponse<boolean>>(`/menu/is-mounted/${menuCode}`)
  return response.data || false
}
```

### 2. State Module 扩展

**文件**: `src/core/state/modules/resource.ts`

**新增状态和 actions**:

```typescript
interface ResourceState {
  // ... 现有状态
  adminMenuTree: MenuTreeNode[] // 管理端菜单树
}

const state: ResourceState = {
  // ... 现有状态
  adminMenuTree: [],
}

const actions = {
  // ... 现有 actions

  /**
   * 获取管理端菜单树
   */
  async fetchAdminMenuTree({ commit }: ActionContext<ResourceState, any>) {
    try {
      const tree = await menuApi.getAdminMenuTree()
      commit('SET_ADMIN_MENU_TREE', tree)
      return tree
    } catch (error) {
      console.error('获取管理端菜单树失败:', error)
      throw error
    }
  },

  /**
   * 挂载菜单到管理端
   */
  async mountMenuToAdmin({ dispatch }: ActionContext<ResourceState, any>, menuCode: string) {
    await menuApi.mountMenuToAdmin(menuCode)
    // 刷新菜单树
    await dispatch('fetchResourceTree')
    await dispatch('fetchAdminMenuTree')
  },

  /**
   * 取消菜单挂载
   */
  async unmountMenuFromAdmin({ dispatch }: ActionContext<ResourceState, any>, menuCode: string) {
    await menuApi.unmountMenuFromAdmin(menuCode)
    // 刷新菜单树
    await dispatch('fetchResourceTree')
    await dispatch('fetchAdminMenuTree')
  },
}

const mutations = {
  // ... 现有 mutations

  SET_ADMIN_MENU_TREE(state: ResourceState, tree: MenuTreeNode[]) {
    state.adminMenuTree = tree
  },
}
```

### 3. 数据结构

**MenuTreeNode 扩展**:

```typescript
interface MenuTreeNode {
  menuCode: string
  name: string
  path?: string
  icon?: string
  nodeType: 1 | 2 | 3 // 1=文件夹, 2=页面, 3=按钮
  sortOrder: number
  parentCode?: string
  children?: MenuTreeNode[]

  // 新增字段
  mountedToAdmin?: boolean // 是否挂载到管理端
}
```

## 后端 API 设计

### 1. 获取管理端菜单树

```
GET /api/menu/admin-tree

Response:
{
  "code": 200,
  "data": [
    {
      "menuCode": "user-management",
      "name": "用户管理",
      "path": "/user",
      "icon": "user",
      "nodeType": 2,
      "sortOrder": 1,
      "mountedToAdmin": true,
      "children": []
    }
  ]
}
```

**逻辑**: 只返回 `mountedToAdmin = true` 的菜单项。

### 2. 挂载菜单

```
POST /api/menu/mount-to-admin

Request:
{
  "menuCode": "user-management"
}

Response:
{
  "code": 200,
  "message": "挂载成功"
}
```

**逻辑**: 将指定菜单的 `mountedToAdmin` 字段设置为 `true`。

### 3. 取消挂载

```
POST /api/menu/unmount-from-admin

Request:
{
  "menuCode": "user-management"
}

Response:
{
  "code": 200,
  "message": "取消挂载成功"
}
```

**逻辑**: 将指定菜单的 `mountedToAdmin` 字段设置为 `false`。

## 数据流

### 挂载菜单流程

```
1. 用户在设计端点击"挂载到管理端"
   ↓
2. 调用 mountMenuToAdmin API
   ↓
3. 后端更新数据库 (mountedToAdmin = true)
   ↓
4. 前端刷新菜单树
   ↓
5. 管理端侧边栏自动显示新菜单
```

### 管理端加载菜单流程

```
1. 管理端 Layout 组件挂载
   ↓
2. 调用 fetchAdminMenuTree action
   ↓
3. 调用 getAdminMenuTree API
   ↓
4. 后端返回已挂载的菜单树
   ↓
5. 更新 state.adminMenuTree
   ↓
6. DynamicMenu 组件渲染菜单
```

## 错误处理

### 1. 菜单加载失败

```typescript
try {
  await loadAdminMenuTree()
} catch (error) {
  console.error('加载菜单失败:', error)
  // 显示默认菜单
  adminMenuTree.value = getDefaultMenuItems()
}
```

### 2. 挂载操作失败

```typescript
try {
  await mountMenuToAdmin(menuCode)
  message.success('挂载成功')
} catch (error) {
  message.error('挂载失败,请重试')
  console.error(error)
}
```

### 3. 网络错误

使用统一的错误拦截器处理网络错误,显示友好的错误提示。

## 性能优化

### 1. 菜单数据缓存

```typescript
// 缓存管理端菜单数据,避免频繁请求
const CACHE_KEY = 'admin_menu_tree'
const CACHE_DURATION = 5 * 60 * 1000 // 5分钟

async function fetchAdminMenuTree() {
  const cached = cache.get(CACHE_KEY)
  if (cached) {
    return cached
  }

  const data = await menuApi.getAdminMenuTree()
  cache.set(CACHE_KEY, data, CACHE_DURATION)
  return data
}
```

### 2. 按需加载

菜单数据在 Layout 组件挂载时加载,不影响首屏渲染。

### 3. 虚拟滚动

如果菜单项超过 100 个,DynamicMenu 组件可以考虑使用虚拟滚动优化性能。

## 测试策略

### 1. 单元测试

- 测试 API 方法
- 测试 state actions 和 mutations
- 测试组件渲染

### 2. 集成测试

- 测试挂载/取消挂载流程
- 测试菜单数据同步
- 测试菜单导航功能

### 3. E2E 测试

- 测试完整的用户操作流程
- 测试不同设备上的显示效果

## 部署注意事项

### 1. 数据库迁移

需要在菜单表中添加 `mounted_to_admin` 字段:

```sql
ALTER TABLE menu ADD COLUMN mounted_to_admin BOOLEAN DEFAULT FALSE;
```

### 2. API 版本兼容

新增的 API 需要保持向后兼容,不影响现有功能。

### 3. 缓存清理

部署后需要清理前端缓存,确保用户获取最新代码。

## 总结

这个设计方案的核心优势:

1. **简单**: 复用现有的 DynamicMenu 组件,不需要重新开发
2. **清晰**: 数据流简单明了,易于理解和维护
3. **灵活**: 通过 `mountedToAdmin` 字段控制菜单显示,灵活方便
4. **高效**: 最小化代码改动,降低开发和测试成本

需要删除的组件:

- AdminSidebar.vue (之前创建的复杂侧边栏组件)
- SidebarSearch.vue (搜索组件)
- SidebarFilter.vue (筛选组件)

保留的组件:

- DynamicMenu.vue (现有的菜单组件)
- AppLogo.vue (Logo 组件)
- AppHeader.vue (顶部栏组件)
