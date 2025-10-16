# 管理端界面框架统一

## 项目概述

将管理端(admin)和设计端(designer)的界面框架统一,通过创建可配置的共享布局组件实现代码复用,避免重复造轮子。

## 目标

- ✅ 统一两个模块的布局、导航、头部等核心 UI 组件
- ✅ 减少代码重复,提高可维护性
- ✅ 通过配置化实现差异化需求
- ✅ 保持功能完整性和用户体验一致性

## 当前状态

### 设计端 (Designer)

- **位置**: `src/modules/designer/views/Layout.vue`
- **特点**: 所有布局代码在一个文件中
- **菜单**: 硬编码
- **问题**: 代码重复,不易维护

### 管理端 (Admin)

- **位置**: `src/modules/admin/views/Layout.vue`
- **特点**: 使用独立子组件 (AppHeader, AppLogo, DynamicMenu)
- **菜单**: 动态加载
- **问题**: 与设计端重复,样式重复

## 目标架构

```
src/core/layout/              # 共享布局组件
├── BaseLayout.vue            # 基础布局
├── AppHeader.vue             # 统一头部
├── AppSidebar.vue            # 统一侧边栏
├── AppLogo.vue               # Logo 组件
├── DynamicMenu.vue           # 动态菜单
├── UserDropdown.vue          # 用户下拉菜单
└── types.ts                  # 类型定义

src/modules/designer/
├── views/Layout.vue          # 使用 BaseLayout + 配置
└── config/layout.ts          # 设计端配置

src/modules/admin/
├── views/Layout.vue          # 使用 BaseLayout + 配置
└── config/layout.ts          # 管理端配置
```

## 核心组件

### 1. BaseLayout

- 提供基础布局结构
- 接收配置定制不同模块
- 支持插槽扩展

### 2. AppHeader

- 统一的头部导航栏
- 可配置的功能按钮
- 用户信息下拉菜单

### 3. AppSidebar

- 统一的侧边栏导航
- 支持折叠/展开
- 动态菜单渲染

### 4. DynamicMenu

- 递归渲染菜单树
- 支持图标和路由
- 权限控制

## 配置示例

```typescript
// 设计端配置
export const designerLayoutConfig: LayoutConfig = {
  module: 'designer',
  header: {
    title: '低代码平台',
    showIconLibrary: true,
    showNotifications: true,
  },
  sidebar: {
    width: 220,
    showUserInfo: true,
    theme: 'dark',
  },
  theme: {
    primaryColor: '#f6bb42',
  },
}
```

## 实施计划

### 阶段 1: 创建共享组件 (12 小时)

- 创建基础设施
- 实现 BaseLayout
- 实现 AppHeader
- 实现 AppSidebar
- 实现 DynamicMenu
- 实现辅助组件

### 阶段 2: 迁移管理端 (4 小时)

- 创建配置文件
- 更新 Layout.vue
- 删除重复组件
- 测试功能

### 阶段 3: 迁移设计端 (2 小时)

- 创建配置文件
- 更新 Layout.vue
- 测试功能

### 阶段 4: 优化和完善 (9 小时)

- 性能优化
- 样式优化
- 错误处理
- 文档和测试
- 清理发布

**总计**: 约 27 小时

## 收益

### 代码质量

- ✅ 减少约 60% 的重复代码
- ✅ 提高代码可维护性
- ✅ 统一的代码风格

### 开发效率

- ✅ 新增模块只需配置,无需重写布局
- ✅ 修改布局一处生效,无需多处修改
- ✅ 降低维护成本

### 用户体验

- ✅ 统一的视觉风格
- ✅ 一致的交互体验
- ✅ 更好的响应式支持

## 风险和挑战

### 技术风险

- **兼容性**: 确保新布局与现有功能兼容
- **性能**: 避免引入性能问题
- **迁移成本**: 需要充分测试

### 缓解措施

- 渐进式迁移,分阶段完成
- 充分的测试覆盖
- 保持向后兼容
- 详细的文档和指南

## 文档

- [需求文档](./requirements.md) - 详细的功能需求和验收标准
- [设计文档](./design.md) - 架构设计和技术方案
- [任务列表](./tasks.md) - 详细的实施任务和时间估算

## 开始使用

### 查看需求

```bash
# 阅读需求文档,了解项目目标
cat .kiro/specs/admin-layout-unification/requirements.md
```

### 查看设计

```bash
# 阅读设计文档,了解技术方案
cat .kiro/specs/admin-layout-unification/design.md
```

### 开始开发

```bash
# 查看任务列表,按顺序执行
cat .kiro/specs/admin-layout-unification/tasks.md
```

## 下一步

**准备好开始了吗?**

请告诉我你想从哪个任务开始:

1. 创建共享布局基础设施 (任务 1)
2. 实现 BaseLayout 组件 (任务 2)
3. 或者你想先了解更多细节?

我会帮你一步步完成这个重构项目! 🚀
