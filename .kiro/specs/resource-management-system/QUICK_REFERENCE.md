# 快速参考指南

## 项目概览

**项目名称**: 资源管理系统
**当前版本**: v2.1.0
**当前进度**: 39% (7/18 任务完成)
**状态**: 🚀 管理端框架已完成

## 快速启动

### 开发环境启动

```bash
# 启动管理端
npm run dev:admin

# 启动设计端
npm run dev:designer

# 同时启动所有模块
npm run dev:all
```

### 构建

```bash
# 构建管理端
npm run build:admin

# 构建设计端
npm run build:designer

# 构建所有模块
npm run build:all
```

## 目录结构

```
src/
├── core/                          # 核心模块
│   ├── api/                       # API服务层
│   │   ├── index.ts              # API导出
│   │   └── menu.ts               # 菜单API ✅
│   ├── state/                     # 状态管理
│   │   └── modules/
│   │       └── resource.ts       # 资源状态 ✅
│   └── ...
├── modules/
│   └── admin/                     # 管理端模块
│       ├── views/                 # 页面组件
│       │   ├── Layout.vue        # 主布局 ✅
│       │   ├── Dashboard.vue     # 仪表板 ✅
│       │   ├── NotFound.vue      # 404页面 ✅
│       │   └── Login.vue         # 登录页 ✅
│       ├── components/            # 通用组件
│       │   ├── AppHeader.vue     # 顶部栏 ✅
│       │   ├── AppLogo.vue       # LOGO ✅
│       │   └── DynamicMenu.vue   # 动态菜单 ✅
│       ├── router/
│       │   └── index.ts          # 路由配置 ✅
│       ├── styles/
│       │   └── layout.css        # 布局样式
│       ├── index.html            # 入口HTML ✅
│       ├── main.ts               # 入口JS ✅
│       └── App.vue               # 根组件 ✅
└── ...
```

## 核心功能

### 1. 路由系统

**基础路由**:

- `/login` - 登录页
- `/` - 主布局
- `/dashboard` - 仪表板
- `/*` - 404页面

**动态路由**:

```typescript
// 从菜单树生成路由
import { registerDynamicRoutes } from './router'

const menuTree = await menuApiService.getMenuTree()
registerDynamicRoutes(router, menuTree.data)
```

**路由守卫**:

```typescript
// 设置路由守卫
import { setupRouterGuards } from './router'

setupRouterGuards(router)
```

### 2. 菜单系统

**使用方式**:

```vue
<DynamicMenu :menu-tree="menuTree" :collapsed="collapsed" />
```

**菜单数据格式**:

```typescript
interface MenuTreeNode {
  id: number
  parentId: number | null
  menuCode: string
  name: string
  module: string
  nodeType: 1 | 2 | 3 // 1=文件夹, 2=页面, 3=按钮
  sortOrder: number
  icon?: string
  path?: string
  children?: MenuTreeNode[]
}
```

### 3. API服务

**菜单API**:

```typescript
import { menuApiService } from '@/core/api/menu'

// 获取菜单列表
const list = await menuApiService.getMenuList({ page: 1, size: 10 })

// 获取菜单树
const tree = await menuApiService.getMenuTree()

// 创建菜单
await menuApiService.createMenu(data)

// 更新菜单
await menuApiService.updateMenu(data)

// 删除菜单
await menuApiService.deleteMenu(id)
```

### 4. 状态管理

**使用资源状态**:

```typescript
import { useModule } from '@/core/state/helpers'

const resourceModule = useModule('resource')

// 获取状态
const resources = resourceModule.state.resources
const loading = resourceModule.state.loading

// 调用actions
await resourceModule.dispatch('fetchResources')
await resourceModule.dispatch('fetchResourceTree')
await resourceModule.dispatch('createResource', data)
```

## 设计规范

### 颜色方案

```css
/* 主色调 */
--sidebar-bg: #2c3e50; /* 深色侧边栏 */
--header-bg: #f6bb42; /* 黄色顶栏 */
--content-bg: #e8eaed; /* 浅灰背景 */
--card-bg: #ffffff; /* 白色卡片 */
--primary: #1890ff; /* 主题蓝色 */
--success: #52c41a; /* 成功绿色 */
--warning: #faad14; /* 警告橙色 */
--error: #ff4d4f; /* 错误红色 */
```

### 布局尺寸

```css
/* 侧边栏 */
--sidebar-width: 220px;
--sidebar-collapsed-width: 80px;

/* 顶部栏 */
--header-height: 60px;

/* 间距 */
--content-padding: 20px;
--card-padding: 24px;
--card-margin: 16px;
```

### 组件样式

**卡片**:

```vue
<a-card :bordered="false" class="custom-card">
  <!-- 内容 -->
</a-card>

<style scoped>
.custom-card {
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
</style>
```

**按钮**:

```vue
<a-button type="primary" size="large">
  <template #icon>
    <plus-outlined />
  </template>
  新建
</a-button>
```

## 常用命令

### Git

```bash
# 查看状态
git status

# 提交更改
git add .
git commit -m "feat: 完成任务X"

# 推送
git push origin main
```

### 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev:admin

# 类型检查
npm run type-check

# 代码格式化
npm run format

# 代码检查
npm run lint
```

### 测试

```bash
# 运行测试
npm run test

# 运行测试（监听模式）
npm run test:watch

# 测试覆盖率
npm run test:coverage
```

## 常见问题

### Q1: 如何添加新页面？

1. 在 `src/modules/admin/views/` 创建页面组件
2. 在路由配置中添加路由
3. 在菜单数据中添加菜单项

### Q2: 如何添加新的API接口？

1. 在 `src/core/api/` 创建API服务类
2. 定义接口方法和类型
3. 在 `src/core/api/index.ts` 中导出

### Q3: 如何添加新的状态模块？

1. 在 `src/core/state/modules/` 创建状态模块
2. 定义 state、getters、actions、mutations
3. 在 `src/core/state/modules/index.ts` 中注册

### Q4: 如何自定义主题颜色？

修改相关组件的CSS变量或样式。

### Q5: 如何处理API错误？

API服务层已经实现了统一的错误处理，会自动抛出友好的错误消息。

## 调试技巧

### 1. 开发者工具

```javascript
// 在浏览器控制台中
// 查看路由
console.log(router.getRoutes())

// 查看状态
console.log(store.state)

// 查看菜单数据
console.log(resourceModule.state.resourceTree)
```

### 2. Vue Devtools

安装 Vue Devtools 浏览器扩展，可以：

- 查看组件树
- 查看组件状态
- 查看路由信息
- 查看Vuex/Pinia状态

### 3. 日志输出

开发环境下，应用会输出详细的日志：

```
✅ 管理端模块已启动
✅ 图标库已初始化
✅ 菜单树加载成功
✅ 动态路由注册完成
```

## 性能优化

### 1. 路由懒加载

```typescript
const Dashboard = () => import('../views/Dashboard.vue')
```

### 2. 组件懒加载

```vue
<script setup lang="ts">
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() => import('./HeavyComponent.vue'))
</script>
```

### 3. 图片优化

```vue
<img src="@/assets/logo.png" loading="lazy" alt="Logo" />
```

## 部署

### 开发环境

```bash
npm run dev:admin
```

访问: http://localhost:5174

### 生产环境

```bash
# 构建
npm run build:admin

# 预览
npm run preview:admin
```

### Docker部署

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build:admin
EXPOSE 80
CMD ["npm", "run", "preview:admin"]
```

## 文档资源

### 项目文档

- `design.md` - 设计文档
- `tasks.md` - 任务列表
- `requirements.md` - 需求文档
- `CURRENT_STATUS.md` - 当前状态
- `SESSION_SUMMARY.md` - 会话总结
- `QUICK_REFERENCE.md` - 快速参考（本文档）

### 任务完成报告

- `TASK_4_UI_REFACTOR_COMPLETED.md` - UI重构
- `TASK_5_COMPLETED.md` - 动态菜单
- `TASK_6_7_COMPLETED.md` - 路由和入口

### 技术文档

- [Vue 3](https://vuejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
- [Ant Design Vue](https://antdv.com/)
- [Vite](https://vitejs.dev/)
- [Vue Router](https://router.vuejs.org/)
- [Pinia](https://pinia.vuejs.org/)

## 联系方式

**开发团队**: Kiro IDE 开发团队
**技术支持**: support@example.com
**项目地址**: [GitHub](https://github.com/your-repo)

---

**最后更新**: 2025-10-14
**版本**: v1.0.0
