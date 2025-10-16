# 资源管理系统

> 一个现代化的企业级菜单资源管理解决方案

## 项目概述

资源管理系统是一个基于Vue 3 + TypeScript的企业级应用，提供完整的菜单资源管理功能，包括资源的增删改查、搜索筛选、分页展示等核心功能。

### 主要特性

- 🎨 **现代化UI设计** - 采用Dashgum风格，深色侧边栏 + 黄色顶栏
- 🚀 **完整的CRUD功能** - 创建、读取、更新、删除资源
- 🔍 **强大的搜索筛选** - 多条件组合搜索，实时筛选
- 📄 **分页展示** - 支持自定义每页大小，快速跳转
- 📱 **响应式设计** - 完美适配桌面端和移动端
- 🔐 **权限控制** - 基于角色的访问控制（待完善）
- 🌳 **树形结构** - 支持多级菜单树（待实现）

## 技术栈

- **前端框架**: Vue 3.3+
- **开发语言**: TypeScript 5.0+
- **UI组件库**: Ant Design Vue 4.0+
- **状态管理**: Pinia (通过StateManager封装)
- **路由管理**: Vue Router 4.0+
- **构建工具**: Vite 5.0+
- **HTTP客户端**: Axios (通过ApiClient封装)

## 快速开始

### 环境要求

- Node.js >= 16.0.0
- npm >= 8.0.0

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
# 启动设计端（包含资源管理）
npm run dev:designer

# 启动管理端
npm run dev:admin
```

### 构建生产版本

```bash
# 构建所有模块
npm run build:all

# 或分别构建
npm run build:designer
npm run build:admin
```

## 项目结构

```
src/
├── core/                      # 核心模块
│   ├── api/                  # API服务层
│   │   ├── menu.ts          # 菜单API
│   │   └── index.ts         # API导出
│   ├── state/               # 状态管理
│   │   └── modules/
│   │       └── resource.ts  # 资源状态
│   └── ...
├── modules/
│   ├── admin/               # 管理端模块
│   │   ├── views/          # 页面组件
│   │   ├── components/     # 通用组件
│   │   ├── router/         # 路由配置
│   │   ├── main.ts         # 入口文件
│   │   └── App.vue         # 根组件
│   └── designer/            # 设计端模块
│       ├── views/          # 页面组件
│       ├── components/     # 通用组件
│       └── router/         # 路由配置
└── ...
```

## 功能模块

### 1. 资源管理

**功能列表**:

- ✅ 资源列表展示
- ✅ 搜索和筛选
- ✅ 分页功能
- ✅ 新建资源
- ✅ 编辑资源
- ✅ 删除资源
- ⏳ 树形视图
- ⏳ 批量操作

**使用场景**:

- 配置系统菜单
- 管理页面路由
- 配置按钮权限

### 2. 动态菜单

**功能列表**:

- ✅ 递归菜单渲染
- ✅ 图标系统集成
- ✅ 路由导航
- ✅ 自动高亮
- ✅ 智能展开

**使用场景**:

- 管理端侧边栏菜单
- 根据权限动态显示

### 3. 路由系统

**功能列表**:

- ✅ 基础路由配置
- ✅ 动态路由注册
- ✅ 路由守卫
- ✅ 404页面

**使用场景**:

- 页面导航
- 权限控制
- 错误处理

## 文档

### 核心文档

- [设计文档](./design.md) - 系统架构和设计
- [任务列表](./tasks.md) - 开发任务清单
- [需求文档](./requirements.md) - 功能需求说明

### 快速参考

- [快速开始指南](./QUICK_START_GUIDE.md) - 5分钟上手
- [快速参考](./QUICK_REFERENCE.md) - 常用命令和API

### 完成报告

- [项目完成报告](./PROJECT_COMPLETE.md) - 项目总结
- [最终会话总结](./FINAL_SESSION_SUMMARY.md) - 开发总结

### 任务报告

- [任务4完成](./TASK_4_UI_REFACTOR_COMPLETED.md) - UI重构
- [任务5完成](./TASK_5_COMPLETED.md) - 动态菜单
- [任务6-7完成](./TASK_6_7_COMPLETED.md) - 路由和入口
- [任务8完成](./TASK_8_COMPLETED.md) - 表格组件
- [任务9完成](./TASK_9_COMPLETED.md) - 表单组件

## API接口

### 菜单管理API

```typescript
import { menuApiService } from '@/core/api/menu'

// 获取菜单列表
const list = await menuApiService.getMenuList({
  page: 1,
  size: 10,
  name: '搜索关键词',
})

// 获取菜单树
const tree = await menuApiService.getMenuTree()

// 创建菜单
await menuApiService.createMenu({
  name: '新菜单',
  menuCode: 'new-menu',
  module: 'system',
  nodeType: 2,
  sortOrder: 0,
})

// 更新菜单
await menuApiService.updateMenu({
  id: 1,
  name: '更新后的名称',
  // ...
})

// 删除菜单
await menuApiService.deleteMenu(1)
```

## 开发指南

### 添加新页面

1. 创建页面组件:

```vue
<!-- src/modules/admin/views/NewPage.vue -->
<template>
  <div class="new-page">
    <h1>新页面</h1>
  </div>
</template>
```

2. 添加路由:

```typescript
// src/modules/admin/router/index.ts
{
  path: 'new-page',
  name: 'NewPage',
  component: () => import('../views/NewPage.vue'),
  meta: { title: '新页面' }
}
```

3. 添加菜单项（通过资源管理界面）

### 自定义主题

修改颜色变量:

```css
/* 侧边栏背景 */
--sidebar-bg: #2c3e50;

/* 顶部栏背景 */
--header-bg: #f6bb42;

/* 主题色 */
--primary-color: #1890ff;
```

## 部署

### 开发环境

```bash
npm run dev:designer  # 设计端
npm run dev:admin     # 管理端
```

### 生产环境

```bash
# 构建
npm run build:all

# 预览
npm run preview:designer
npm run preview:admin
```

### Docker部署

```bash
# 构建镜像
docker build -t resource-management .

# 运行容器
docker run -p 80:80 resource-management
```

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License

## 联系方式

- **技术支持**: support@example.com
- **问题反馈**: [GitHub Issues](https://github.com/your-repo/issues)
- **文档**: [在线文档](https://docs.example.com)

## 更新日志

### v2.1.0 (2025-10-14)

**新增**:

- ✅ 资源管理完整功能
- ✅ 管理端框架
- ✅ 动态菜单系统
- ✅ 动态路由系统

**优化**:

- ✅ UI设计现代化
- ✅ 响应式布局
- ✅ 代码质量提升

**修复**:

- ✅ 路由错误
- ✅ 布局问题

## 致谢

感谢所有为项目做出贡献的开发者！

---

**项目状态**: ✅ 核心功能已完成  
**维护状态**: 🟢 活跃维护中  
**最后更新**: 2025-10-14
