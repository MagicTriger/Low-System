# 资源管理系统实施任务列表

## 任务概述

本任务列表将资源管理系统的实施分为多个阶段，每个阶段包含具体的编码任务。任务按照依赖关系排序，确保每个任务都可以在前置任务完成后独立执行。

## 任务列表

- [x] 1. 基础设施准备

  - 创建管理端模块目录结构
  - 配置构建和开发环境
  - 设置路由别名和环境变量
  - _Requirements: 4.1, 4.12, 4.13_

- [x] 1.1 创建管理端模块目录

  - 在 `src/modules/` 下创建 `admin` 目录
  - 创建基本文件结构：index.html, main.ts, App.vue, router/index.ts
  - _Requirements: 4.1_

- [x] 1.2 配置 Vite 构建

  - 更新 `vite.config.ts` 添加管理端端口映射（5174）
  - 确保管理端入口文件正确配置
  - _Requirements: 4.12_

- [x] 1.3 创建环境变量文件

  - 创建 `envs/.env.admin` 文件
  - 配置 VITE_APP_MODEL=admin 和其他必要变量
  - _Requirements: 4.13_

- [x] 1.4 更新 package.json 脚本

  - 添加 dev:admin, build:admin, preview:admin 脚本
  - _Requirements: 4.13_

- [x] 2. API 服务层实现

  - 创建菜单管理 API 服务类
  - 实现所有 CRUD 接口方法
  - 添加错误处理和类型定义
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.10_

- [x] 2.1 创建 MenuApiService 类

  - 在 `src/core/api/` 下创建 `menu.ts` 文件
  - 定义 MenuApiService 类和构造函数
  - 注入 ApiClient 依赖
  - _Requirements: 7.1, 7.10_

- [x] 2.2 实现查询接口

  - 实现 getMenuList 方法（GET /api/permissions/menus/list）
  - 实现 getMenuTree 方法（GET /api/permissions/menus/tree）
  - 添加请求参数类型定义
  - _Requirements: 7.1, 7.2, 7.8, 7.9_

- [x] 2.3 实现 CUD 接口

  - 实现 createMenu 方法（POST /api/permissions/menus/create）
  - 实现 updateMenu 方法（PUT /api/permissions/menus/update）
  - 实现 deleteMenu 方法（DELETE /api/permissions/menus/delete/{id}）
  - _Requirements: 7.3, 7.4, 7.5_

- [x] 2.4 添加错误处理

  - 实现 handleError 私有方法
  - 处理 401/403/404/409/500 等错误码
  - 添加友好的错误消息
  - _Requirements: 7.6, 7.7, 7.11, 7.12_

- [x] 2.5 导出 API 服务

  - 在 `src/core/api/index.ts` 中导出 MenuApiService
  - 创建单例实例或工厂方法
  - _Requirements: 6.3_

- [x] 3. 状态管理模块

  - 创建资源管理状态模块
  - 实现 state、getters、actions、mutations
  - 注册到全局状态管理器
  - _Requirements: 2.2, 2.3, 2.4, 2.5, 2.6, 6.4_

- [x] 3.1 创建 resource 状态模块

  - 在 `src/core/state/modules/` 下创建 `resource.ts`
  - 定义 state 接口和初始状态
  - _Requirements: 2.2, 6.4_

- [x] 3.2 实现 getters

  - 实现 filteredResources getter
  - 实现 resourceById getter
  - _Requirements: 2.2_

- [x] 3.3 实现 actions

  - 实现 fetchResources action（调用 getMenuList）
  - 实现 fetchResourceTree action（调用 getMenuTree）
  - 实现 createResource action
  - 实现 updateResource action
  - 实现 deleteResource action
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 3.4 实现 mutations

  - 实现 setResources mutation
  - 实现 setResourceTree mutation
  - 实现 setCurrentResource mutation
  - 实现 setLoading mutation
  - 实现 setQuery mutation
  - 实现 setPagination mutation
  - _Requirements: 2.2, 2.10_

- [x] 3.5 注册状态模块

  - 在 `src/core/state/modules/index.ts` 中导出 resourceModule
  - 在 registerStateModules 函数中注册模块
  - _Requirements: 6.4_

- [x] 4. 管理端布局组件

  - 创建管理端主布局组件
  - 实现顶部栏、侧边栏、底部栏
  - 设计高科技感 LOGO
  - _Requirements: 4.5, 4.6, 4.7, 4.15, 4.16_

- [x] 4.1 创建 Layout 主组件

  - 创建 `src/modules/admin/views/Layout.vue`
  - 使用 Ant Design Layout 组件搭建基本结构
  - 实现侧边栏折叠/展开功能
  - _Requirements: 4.5, 4.6_

- [x] 4.2 创建 AppLogo 组件

  - 创建 `src/modules/admin/components/AppLogo.vue`
  - 设计高科技感的 SVG LOGO（蓝色系、几何图形、渐变）
  - 实现展开/收起状态切换
  - 添加鼠标悬停动画效果
  - _Requirements: 4.7_

- [x] 4.3 创建 AppHeader 组件

  - 创建 `src/modules/admin/components/AppHeader.vue`
  - 实现侧边栏折叠按钮
  - 添加用户信息显示（头像、用户名）
  - 添加通知图标和下拉菜单
  - 添加设置入口
  - _Requirements: 4.15_

- [x] 4.4 创建 AppSidebar 组件

  - 创建 `src/modules/admin/components/AppSidebar.vue`
  - 集成 AppLogo 组件
  - 集成 DynamicMenu 组件
  - 处理侧边栏宽度变化
  - _Requirements: 4.6_

- [x] 4.5 创建 AppFooter 组件

  - 创建 `src/modules/admin/components/AppFooter.vue`
  - 显示版权信息
  - 显示系统版本号
  - 添加友情链接（可选）
  - _Requirements: 4.16_

- [x] 4.6 添加布局样式

  - 创建布局相关的 CSS 样式
  - 实现响应式设计
  - 添加过渡动画效果
  - _Requirements: 8.11_

- [x] 5. 动态菜单组件

  - 创建动态菜单组件
  - 实现菜单树渲染逻辑
  - 集成路由导航
  - _Requirements: 4.8, 4.10, 4.11_

- [x] 5.1 创建 DynamicMenu 组件

  - 创建 `src/modules/admin/components/DynamicMenu.vue`
  - 定义 MenuProps 接口
  - 实现基本菜单结构
  - _Requirements: 4.8_

- [x] 5.2 实现菜单渲染逻辑

  - 实现 renderMenu 递归函数
  - 过滤按钮类型节点（nodeType !== 3）
  - 根据 sortOrder 排序菜单项
  - 根据 nodeType 渲染不同类型（文件夹/页面）
  - _Requirements: 4.10, 4.11_

- [x] 5.3 集成图标系统

  - 使用 IconLibraryManager 加载图标
  - 根据 icon 字段动态显示图标
  - 提供默认图标
  - _Requirements: 6.7_

- [x] 5.4 实现路由导航

  - 监听菜单项点击事件
  - 使用 Vue Router 进行页面跳转
  - 高亮当前激活菜单项
  - _Requirements: 4.8_

- [x] 6. 管理端路由配置

  - 配置管理端基础路由
  - 实现动态路由注册
  - 添加路由守卫
  - _Requirements: 4.2, 4.3, 9.1, 9.2_

- [x] 6.1 创建基础路由配置

  - 创建 `src/modules/admin/router/index.ts`
  - 定义登录、布局、仪表板等基础路由
  - 配置路由元信息（title, icon, requiresAuth）
  - _Requirements: 4.2_

- [x] 6.2 实现动态路由注册

  - 实现 registerDynamicRoutes 函数
  - 实现 generateRoutesFromMenu 函数
  - 根据菜单树动态添加路由
  - _Requirements: 4.8, 4.9_

- [x] 6.3 添加路由守卫

  - 实现 beforeEach 守卫检查认证状态
  - 验证 token 有效性
  - 处理未授权访问（跳转登录页）
  - _Requirements: 9.1, 9.2_

- [x] 6.4 创建 404 页面

  - 创建 `src/modules/admin/views/NotFound.vue`
  - 设计友好的 404 页面
  - 提供返回首页链接
  - _Requirements: 4.3_

- [x] 7. 管理端入口和初始化

  - 创建管理端入口文件
  - 初始化应用和核心服务
  - 加载菜单树并注册动态路由
  - _Requirements: 4.1, 4.4, 4.8_

- [x] 7.1 创建 index.html

  - 创建 `src/modules/admin/index.html`
  - 配置页面标题和元信息
  - 添加根元素 #app
  - _Requirements: 4.12_

- [x] 7.2 创建 main.ts

  - 创建 `src/modules/admin/main.ts`
  - 使用 AppInit 初始化应用
  - 初始化图标库
  - 注册全局组件
  - _Requirements: 4.1, 4.4_

- [x] 7.3 创建 App.vue

  - 创建 `src/modules/admin/App.vue`
  - 添加 router-view
  - 添加全局样式
  - _Requirements: 4.1_

- [x] 7.4 实现菜单加载和路由注册

  - 在应用启动时调用 fetchResourceTree
  - 获取菜单树后调用 registerDynamicRoutes
  - 处理加载失败情况
  - _Requirements: 4.8, 4.10_

- [x] 8. 资源管理界面 - 表格组件

  - 创建资源管理主页面
  - 实现资源表格组件
  - 添加搜索和筛选功能
  - _Requirements: 2.1, 2.2, 2.8, 2.9, 2.10_

- [x] 8.1 创建 ResourceManagement 主页面

  - 创建 `src/modules/designer/views/ResourceManagement.vue`（设计端）
  - 创建 `src/modules/admin/views/ResourceManagement.vue`（管理端）
  - 设计页面布局（搜索栏 + 操作栏 + 表格）
  - _Requirements: 2.1, 3.2_

- [x] 8.2 创建 ResourceTable 组件

  - 创建 `src/modules/designer/components/ResourceTable.vue`
  - 使用 Ant Design Table 组件
  - 定义表格列（id, name, menuCode, module, nodeType, sortOrder, url, icon, path, createdAt）
  - 添加操作列（编辑、删除按钮）
  - _Requirements: 2.2, 2.5, 2.6_

- [x] 8.3 实现分页功能

  - 配置 Table 的 pagination 属性
  - 监听页码和每页大小变化
  - 调用 fetchResources 重新加载数据
  - _Requirements: 2.10_

- [x] 8.4 创建 ResourceFilters 组件

  - 创建 `src/modules/designer/components/ResourceFilters.vue`
  - 添加搜索输入框（name, menuCode, module）
  - 添加筛选下拉框（nodeType, parentId）
  - 实现搜索和筛选逻辑
  - _Requirements: 2.8, 2.9_

- [x] 8.5 集成状态管理

  - 使用 resource store 的 state 和 actions
  - 在组件挂载时调用 fetchResources
  - 监听 loading 状态显示加载动画
  - _Requirements: 2.2, 8.2_

- [x] 8.6 添加操作按钮

  - 添加"新建资源"按钮
  - 添加"查看树形结构"按钮
  - 添加"刷新"按钮
  - 绑定点击事件
  - _Requirements: 2.3, 2.11_

- [x] 9. 资源管理界面 - 表单组件

  - 创建资源表单组件
  - 实现创建和编辑功能
  - 添加表单验证
  - _Requirements: 2.3, 2.4, 2.5, 8.7, 8.8_

- [x] 9.1 创建 ResourceForm 组件

  - 创建 `src/modules/designer/components/ResourceForm.vue`
  - 使用 Ant Design Modal + Form 组件
  - 定义表单字段（parentId, menuCode, name, module, nodeType, sortOrder, url, icon, path, meta）
  - _Requirements: 2.3, 2.4_

- [x] 9.2 实现表单验证

  - 添加必填字段验证（menuCode, name, module）
  - 添加格式验证（menuCode 唯一性、url 格式等）
  - 实现实时验证反馈
  - _Requirements: 8.7, 8.8_

- [x] 9.3 实现创建功能

  - 打开表单对话框（空表单）
  - 提交时调用 createResource action
  - 处理成功和失败情况
  - 显示成功/失败提示
  - _Requirements: 2.3, 2.4, 8.4, 8.5_

- [x] 9.4 实现编辑功能

  - 打开表单对话框（预填充数据）
  - 提交时调用 updateResource action
  - 处理成功和失败情况
  - 显示成功/失败提示
  - _Requirements: 2.5, 2.6, 8.4, 8.5_

- [x] 9.5 集成图标选择器

  - 使用 IconPicker 组件选择图标
  - 显示当前选中的图标
  - 支持搜索和分类浏览
  - _Requirements: 6.7_

- [x] 9.6 实现父级资源选择

  - 添加级联选择器选择 parentId
  - 只显示 nodeType=1（文件夹）的资源
  - 支持清空选择（根节点）
  - _Requirements: 2.12_

- [x] 10. 资源管理界面 - 树形视图

  - 创建资源树组件
  - 实现树形结构展示
  - 添加树节点操作
  - _Requirements: 2.11, 2.12, 2.13, 2.14_

- [x] 10.1 创建 ResourceTree 组件

  - 创建 `src/modules/designer/components/ResourceTree.vue`
  - 使用 Ant Design Tree 组件
  - 定义树节点数据结构
  - _Requirements: 2.11_

- [x] 10.2 实现树形数据渲染

  - 调用 fetchResourceTree 获取数据
  - 递归渲染树节点
  - 根据 nodeType 显示不同图标
  - 根据 sortOrder 排序节点
  - _Requirements: 2.11, 2.13, 2.14_

- [x] 10.3 添加树节点操作

  - 展开/折叠节点
  - 节点选择功能
  - 默认展开第一层
  - _Requirements: 2.12_

- [x] 10.4 实现树形视图对话框

  - 创建 Modal 对话框显示树形视图
  - 添加关闭按钮
  - 支持销毁时清理
  - _Requirements: 2.11_

- [x] 11. 删除功能和确认对话框

  - 实现删除资源功能
  - 添加确认对话框
  - 处理级联删除
  - _Requirements: 2.7, 8.6_

- [x] 11.1 实现删除功能

  - 在表格操作列添加删除按钮
  - 点击时显示确认对话框
  - 确认后调用 deleteResource action
  - _Requirements: 2.7_

- [x] 11.2 添加确认对话框

  - 使用 Ant Design Modal.confirm
  - 显示警告信息（级联删除提示）
  - 提供取消和确认按钮
  - _Requirements: 8.6_

- [x] 11.3 处理删除结果

  - 删除成功后刷新表格
  - 显示成功提示
  - 删除失败时显示错误信息
  - _Requirements: 8.4, 8.5_

- [x] 12. 预览功能修复

  - 修复预览数据加载问题
  - 优化预览页面渲染
  - 处理错误情况
  - _Requirements: 1.1, 1.2, 1.3, 1.6_

- [x] 12.1 修复数据加载逻辑

  - 检查 sessionStorage 数据读取
  - 验证数据格式和完整性
  - 添加数据加载失败处理
  - 提供示例数据后备
  - _Requirements: 1.2, 1.3_

- [x] 12.2 优化渲染逻辑

  - 确保 RootViewRenderer 正确接收数据
  - 简化组件结构
  - 添加渲染错误处理
  - _Requirements: 1.1, 1.8_

- [x] 12.3 改进错误提示

  - 设计友好的错误页面
  - 显示具体错误信息
  - 提供重试按钮
  - 添加详细日志
  - _Requirements: 1.3_

- [x] 13. 设计端UI改造为Dashgum风格

  - 黄色顶部栏（#f6bb42）
  - 深色侧边栏（#2c3e50）
  - 用户信息和通知
  - 响应式布局
  - _Requirements: 1.7, 8.11_

- [x] 13.1 顶部栏设计

  - 黄色主题背景
  - 侧边栏折叠按钮
  - 通知徽章
  - 用户下拉菜单
  - _Requirements: 1.7_

- [x] 13.2 侧边栏设计

  - 深色主题背景
  - Logo区域
  - 菜单图标
  - 选中高亮（黄色）
  - _Requirements: 1.7_

- [x] 13.3 响应式优化

  - 移动端侧边栏隐藏
  - 小屏幕标题隐藏
  - 内容区自适应
  - 触摸友好
  - _Requirements: 8.11_

- [x] 14. 设计端路由集成

  - 在设计端添加资源管理路由
  - 集成资源管理页面
  - 添加导航入口
  - _Requirements: 3.1, 3.2, 3.4, 3.5_

- [x] 14.1 添加资源管理路由

  - 在 `src/modules/designer/router/index.ts` 中添加路由配置
  - 配置路由路径和组件
  - 设置路由元信息
  - _Requirements: 3.1, 3.2_

- [x] 14.2 添加导航菜单项

  - 创建 Layout 布局组件
  - 添加顶部导航菜单
  - 配置菜单图标和文本
  - 实现路由跳转
  - _Requirements: 3.4, 3.5_

- [x] 14.3 测试路由导航

  - 测试从设计端访问资源管理页面
  - 测试页面渲染和功能
  - 测试在资源管理和设计器之间切换
  - _Requirements: 3.2, 3.6_

- [ ] 15. 权限控制实现

  - 实现按钮级权限控制
  - 添加权限指令
  - 集成权限验证
  - _Requirements: 9.2, 9.4_

- [ ] 15.1 创建权限指令

  - 创建 `v-permission` 指令
  - 实现权限检查逻辑
  - 隐藏无权限元素
  - _Requirements: 9.2_

- [ ] 15.2 应用权限控制

  - 在资源管理界面应用权限指令
  - 控制新建、编辑、删除按钮显示
  - 根据 nodeType=3 的资源配置权限
  - _Requirements: 2.14, 9.2_

- [ ] 15.3 实现权限验证

  - 在 API 调用前验证权限
  - 处理权限不足的情况
  - 显示权限不足提示
  - _Requirements: 9.4_

- [x] 16. 用户体验优化

  - 添加加载状态和反馈
  - 优化表单交互
  - 改进错误提示
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.10_

- [x] 16.1 添加加载状态

  - 在数据加载时显示加载提示
  - 在按钮操作时显示 loading 状态
  - 禁用重复提交
  - _Requirements: 8.2, 8.3_

- [x] 16.2 优化成功/失败提示

  - 使用 Ant Design message 组件
  - 统一提示样式和位置
  - 更友好的提示文案
  - _Requirements: 8.4, 8.5_

- [x] 16.3 实现键盘快捷键

  - 支持 Ctrl+F 聚焦搜索
  - 支持 Ctrl+N 新建资源
  - 支持 Ctrl+R 刷新列表
  - 支持 Enter 提交表单
  - 添加快捷键提示
  - _Requirements: 8.10_

- [x] 16.4 优化响应式设计

  - 表格横向滚动
  - 操作按钮 Tooltip
  - 事件监听器清理
  - _Requirements: 8.11_

- [ ] 17. 集成测试和调试

  - 编写集成测试用例
  - 测试完整功能流程
  - 修复发现的问题
  - _Requirements: 所有需求_

- [ ] 17.1 测试资源管理 CRUD

  - 测试创建资源流程
  - 测试编辑资源流程
  - 测试删除资源流程
  - 测试查询和筛选功能
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 2.7, 2.8, 2.9_

- [ ] 17.2 测试管理端功能

  - 测试登录和认证
  - 测试动态菜单加载
  - 测试路由导航
  - 测试布局和响应式
  - _Requirements: 4.1, 4.2, 4.3, 4.8, 9.1_

- [ ] 17.3 测试预览功能

  - 测试预览数据加载
  - 测试设备切换
  - 测试全屏模式
  - 测试错误处理
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ] 17.4 性能测试

  - 测试大数据量表格性能
  - 测试菜单树渲染性能
  - 优化性能瓶颈
  - _Requirements: 10.1_

- [ ] 18. 文档和部署准备

  - 编写使用文档
  - 更新 README
  - 准备部署配置
  - _Requirements: 10.1, 10.2, 10.9, 10.10_

- [ ] 18.1 编写使用文档

  - 编写资源管理使用指南
  - 编写管理端使用指南
  - 添加常见问题解答
  - _Requirements: 10.1, 10.2_

- [ ] 18.2 更新项目 README

  - 更新项目结构说明
  - 添加新功能介绍
  - 更新开发和构建命令
  - _Requirements: 10.1_

- [ ] 18.3 准备部署配置

  - 配置生产环境变量
  - 更新 Nginx 配置示例
  - 准备 Docker 配置（可选）
  - _Requirements: 10.9, 10.10_

- [ ] 18.4 编写变更日志
  - 记录新增功能
  - 记录修复的问题
  - 记录破坏性变更
  - _Requirements: 10.12_

## 任务执行说明

1. **任务顺序**: 按照编号顺序执行任务，确保依赖关系正确
2. **测试**: 每完成一个主任务后，进行功能测试
3. **提交**: 每完成一个主任务后，提交代码并标记任务完成
4. **文档**: 在实现过程中同步更新相关文档
5. **代码审查**: 关键任务完成后进行代码审查

## 可选任务（标记为 \*）

本项目暂无可选任务，所有任务都是核心功能的一部分。

## 预计工作量

- 基础设施准备: 2-3 小时
- API 和状态管理: 4-5 小时
- 管理端布局和路由: 6-8 小时
- 资源管理界面: 8-10 小时
- 预览功能修复和美化: 3-4 小时
- 权限和优化: 4-5 小时
- 测试和文档: 4-5 小时

**总计**: 约 31-40 小时

## 里程碑

- **里程碑 1**: 完成基础设施和 API 层（任务 1-3）
- **里程碑 2**: 完成管理端框架（任务 4-7）
- **里程碑 3**: 完成资源管理界面（任务 8-11）
- **里程碑 4**: 完成预览功能（任务 12-13）
- **里程碑 5**: 完成集成和优化（任务 14-18）
