# Logo 和标题更新

## 🎯 更新内容

根据用户提供的截图,完成以下修改:

1. ✅ **侧边栏顶部 Logo 区域**显示 "Kiro Platform"
2. ✅ **侧边栏菜单标题**显示 "资源管理" (作为一级菜单)
3. ✅ **顶部导航栏标题**显示 "低代码管理系统"

---

## 📝 详细修改

### 1. 类型定义扩展

**文件**: `src/core/layout/types.ts`

添加了 `LogoConfig` 接口和在 `SidebarConfig` 中添加 logo 配置:

```typescript
/**
 * Logo 配置
 */
export interface LogoConfig {
  /** Logo 图片 URL */
  logoUrl?: string
  /** Logo 文本 */
  logoText?: string
  /** 点击跳转路径 */
  to?: string
}

/**
 * 侧边栏配置
 */
export interface SidebarConfig {
  // ... 其他配置
  /** Logo 配置 */
  logo?: LogoConfig
  // ...
}
```

---

### 2. 设计端布局配置更新

**文件**: `src/modules/designer/config/layout.ts`

#### 修改内容:

```typescript
header: {
  title: '低代码管理系统',  // 从 '资源管理' 改为 '低代码管理系统'
  // ...
}

sidebar: {
  // 添加 Logo 配置
  logo: {
    logoText: 'Kiro Platform',
    to: '/designer/resource',
  },
  // ...
}
```

---

### 3. AppSidebar 组件更新

**文件**: `src/core/layout/ui/AppSidebar.vue`

传递 Logo 配置给 AppLogo 组件:

```vue
<AppLogo :collapsed="collapsed" :logo-url="config.logo?.logoUrl" :logo-text="config.logo?.logoText" :to="config.logo?.to" />
```

---

### 4. 设计端菜单结构更新

**文件**: `src/modules/designer/views/Layout.vue`

将菜单结构改为层级结构:

```typescript
const designerMenuTree = ref<MenuTreeNode[]>([
  {
    id: 1,
    menuCode: 'resource-management',
    name: '资源管理', // 一级菜单标题
    nodeType: 1, // 目录类型
    icon: 'FolderOutlined',
    path: '',
    children: [
      {
        id: 2,
        menuCode: 'resource-list',
        name: '资源列表', // 二级菜单
        nodeType: 2, // 页面类型
        icon: 'FileOutlined',
        path: '/designer/resource',
      },
    ],
  },
])
```

---

## 🎨 视觉效果

### 修改后的界面结构

```
┌─────────────────────────────────────────────────────────┐
│  ☰  低代码管理系统          🔔 ⚙️ 👤                  │ ← 顶部标题
├─────────────────────────────────────────────────────────┤
│                    │                                     │
│  Kiro Platform     │                                     │ ← Logo 区域
│  ─────────────────│                                     │
│  👤                │                                     │
│  用户名             │                                     │ ← 用户头像
│  角色               │                                     │
│  ─────────────────│                                     │
│  📁 资源管理        │         内容区域                     │ ← 一级菜单
│    📄 资源列表      │                                     │ ← 二级菜单
│                    │                                     │
└────────────────────┴─────────────────────────────────────┘
```

---

## 📋 配置对比

### 修改前 vs 修改后

| 配置项        | 修改前          | 修改后                     |
| ------------- | --------------- | -------------------------- |
| **顶部标题**  | 资源管理        | 低代码管理系统             |
| **Logo 文本** | Kiro (默认)     | Kiro Platform              |
| **菜单结构**  | 平铺            | 层级 (资源管理 > 资源列表) |
| **一级菜单**  | 资源管理 (页面) | 资源管理 (目录)            |
| **二级菜单**  | 无              | 资源列表 (页面)            |

---

## 🔧 配置说明

### Logo 配置

Logo 配置现在支持三种方式:

1. **仅文本**:

```typescript
logo: {
  logoText: 'Kiro Platform',
  to: '/designer/resource',
}
```

2. **仅图片**:

```typescript
logo: {
  logoUrl: '/path/to/logo.png',
  to: '/designer/resource',
}
```

3. **图片 + 文本**:

```typescript
logo: {
  logoUrl: '/path/to/logo.png',
  logoText: 'Kiro Platform',
  to: '/designer/resource',
}
```

### 菜单结构

菜单支持两种节点类型:

- **nodeType: 1** - 目录 (可展开,不可点击)
- **nodeType: 2** - 页面 (可点击,跳转到 path)

---

## 🧪 测试指南

### 1. 测试 Logo 显示

```bash
# 访问设计端
http://localhost:5173/designer/resource
```

**检查项**:

- [ ] 侧边栏顶部显示 "Kiro Platform"
- [ ] 点击 Logo 跳转到 `/designer/resource`
- [ ] 折叠侧边栏时,Logo 显示为图标

### 2. 测试标题显示

**检查项**:

- [ ] 顶部导航栏显示 "低代码管理系统"
- [ ] 标题文字清晰可读
- [ ] 标题位置居中或靠左(根据设计)

### 3. 测试菜单结构

**检查项**:

- [ ] 侧边栏显示 "资源管理" 一级菜单
- [ ] 点击 "资源管理" 可以展开/折叠
- [ ] 展开后显示 "资源列表" 二级菜单
- [ ] 点击 "资源列表" 跳转到资源管理页面

### 4. 测试折叠状态

**检查项**:

- [ ] 折叠侧边栏时,Logo 变为图标
- [ ] 折叠侧边栏时,菜单显示为图标
- [ ] 展开侧边栏时,所有文字正常显示

---

## 🎯 完成状态

| 需求                          | 状态 | 说明         |
| ----------------------------- | ---- | ------------ |
| Logo 显示 "Kiro Platform"     | ✅   | 已配置       |
| 侧边栏菜单显示 "资源管理"     | ✅   | 作为一级目录 |
| 顶部标题显示 "低代码管理系统" | ✅   | 已更新       |
| 菜单层级结构                  | ✅   | 支持多级菜单 |

---

## 📚 相关文档

- [布局类型定义](../../src/core/layout/types.ts)
- [设计端布局配置](../../src/modules/designer/config/layout.ts)
- [AppLogo 组件](../../src/core/layout/ui/AppLogo.vue)
- [AppSidebar 组件](../../src/core/layout/ui/AppSidebar.vue)

---

## 🔄 后续扩展

### 1. 添加 Logo 图片

如果需要添加 Logo 图片:

```typescript
// src/modules/designer/config/layout.ts
sidebar: {
  logo: {
    logoUrl: '/assets/logo.png',  // 添加图片路径
    logoText: 'Kiro Platform',
    to: '/designer/resource',
  },
  // ...
}
```

### 2. 添加更多菜单项

```typescript
const designerMenuTree = ref<MenuTreeNode[]>([
  {
    name: '资源管理',
    children: [
      { name: '资源列表', path: '/designer/resource' },
      { name: '上传资源', path: '/designer/resource/upload' },
      { name: '分类管理', path: '/designer/resource/category' },
    ],
  },
  {
    name: '设计器',
    children: [
      { name: '页面设计', path: '/designer/page' },
      { name: '组件库', path: '/designer/components' },
    ],
  },
])
```

### 3. 动态加载菜单

```typescript
// 从 API 加载菜单
import { getDesignerMenu } from '@/core/api/menu'

onMounted(async () => {
  try {
    const menuData = await getDesignerMenu()
    designerMenuTree.value = menuData
  } catch (error) {
    console.error('加载菜单失败:', error)
  }
})
```

---

**更新时间**: 2025-10-15  
**更新状态**: ✅ 完成  
**代码检查**: ✅ 无语法错误  
**测试状态**: 待测试
