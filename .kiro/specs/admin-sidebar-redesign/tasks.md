# 管理端侧边栏简化 - 任务列表

## 任务概述

简化管理端侧边栏,去除搜索、筛选等复杂功能,只保留简洁的菜单列表,显示从设计端挂载过来的菜单。

## 任务列表

- [x] 1. 清理之前创建的复杂组件

  - 删除 AdminSidebar.vue 组件
  - 删除 SidebarSearch.vue 组件
  - 删除 SidebarFilter.vue 组件
  - 删除相关的完成文档
  - _Requirements: 1_

- [x] 2. 扩展菜单 API

  - [x] 2.1 添加 getAdminMenuTree 方法

    - 实现获取已挂载到管理端的菜单树
    - 只返回 mountedToAdmin = true 的菜单
    - _Requirements: 2_

  - [x] 2.2 添加 mountMenuToAdmin 方法

    - 实现挂载菜单到管理端的功能
    - 更新菜单的 mountedToAdmin 字段
    - _Requirements: 2_

  - [ ] 2.3 添加 unmountMenuFromAdmin 方法

    - 实现取消菜单挂载的功能
    - 更新菜单的 mountedToAdmin 字段

    - _Requirements: 2_

  - [ ] 2.4 添加 isMenuMountedToAdmin 方法
    - 实现检查菜单是否已挂载的功能
    - 返回布尔值
    - _Requirements: 2_

- [x] 3. 扩展 resource state module

  - [x] 3.1 添加 adminMenuTree 状态

    - 在 ResourceState 接口中添加 adminMenuTree 字段
    - 初始化为空数组
    - _Requirements: 2_

  - [ ] 3.2 实现 fetchAdminMenuTree action

    - 调用 getAdminMenuTree API
    - 更新 state.adminMenuTree
    - 处理错误情况

    - _Requirements: 2_

  - [ ] 3.3 实现 mountMenuToAdmin action

    - 调用 mountMenuToAdmin API
    - 刷新菜单树数据
    - _Requirements: 2_

  - [ ] 3.4 实现 unmountMenuFromAdmin action
    - 调用 unmountMenuFromAdmin API
    - 刷新菜单树数据
    - _Requirements: 2_
  - [ ] 3.5 添加 SET_ADMIN_MENU_TREE mutation
    - 更新 state.adminMenuTree
    - _Requirements: 2_

- [x] 4. 更新 MenuTreeNode 数据结构

  - 在 MenuTreeNode 接口中添加 mountedToAdmin 字段

  - 类型为可选的布尔值
  - 更新相关的类型定义文件
  - _Requirements: 2_

- [x] 5. 调整管理端 Layout 组件

  - [ ] 5.1 更新 Layout.vue

    - 移除对 AdminSidebar 的引用
    - 保持使用 DynamicMenu 组件
    - 添加 adminMenuTree 状态

    - 实现 loadAdminMenuTree 方法

    - _Requirements: 1, 2_

  - [ ] 5.2 调整样式

    - 确保侧边栏宽度为 220px
    - 折叠宽度为 80px

    - 保持响应式设计
    - _Requirements: 5_

- [ ] 6. 在设计端添加挂载操作

  - [ ] 6.1 更新 ResourceManagement.vue

    - 在资源卡片上添加"挂载到管理端"按钮
    - 实现 handleToggleMount 方法

    - 根据 mountedToAdmin 状态显示不同文本
    - _Requirements: 2_

  - [ ] 6.2 更新 ResourceTree.vue

    - 在树节点操作区域添加挂载按钮
    - 实现挂载/取消挂载功能
    - 显示挂载状态图标

    - _Requirements: 2_

  - [x] 6.3 添加操作反馈

    - 挂载成功显示成功提示
    - 挂载失败显示错误提示
    - 操作过程中显示加载状态
    - _Requirements: 2_

- [ ] 7. 实现数据同步机制

  - 挂载/取消挂载后自动刷新菜单树
  - 管理端自动更新侧边栏菜单
  - 处理并发操作的情况
  - _Requirements: 2_

- [ ] 8. 添加错误处理

  - [ ] 8.1 菜单加载失败处理
    - 显示错误提示
    - 显示默认菜单
    - 记录错误日志
    - _Requirements: 4_
  - [ ] 8.2 挂载操作失败处理
    - 显示友好的错误提示
    - 允许用户重试
    - 记录错误日志
    - _Requirements: 2_

- [ ] 9. 性能优化

  - [ ] 9.1 实现菜单数据缓存
    - 缓存管理端菜单数据
    - 设置合理的缓存时间(5分钟)
    - 提供手动刷新功能
    - _Requirements: 性能要求_
  - [ ] 9.2 优化菜单渲染
    - 确保菜单展开/折叠动画流畅
    - 优化大量菜单项的渲染性能
    - _Requirements: 性能要求_

- [ ]\* 10. 编写测试

  - [ ]\* 10.1 单元测试
    - 测试 API 方法
    - 测试 state actions 和 mutations
    - 测试组件渲染
    - _Requirements: 所有_
  - [ ]\* 10.2 集成测试
    - 测试挂载/取消挂载流程
    - 测试菜单数据同步
    - 测试菜单导航功能
    - _Requirements: 所有_

- [ ] 11. 更新文档

  - 更新 API 文档
  - 更新组件使用文档
  - 编写用户操作指南
  - _Requirements: 所有_

- [ ] 12. 测试和验证

  - [ ] 12.1 功能测试
    - 测试菜单挂载功能
    - 测试菜单显示和导航
    - 测试响应式设计
    - _Requirements: 所有_
  - [ ] 12.2 兼容性测试
    - 测试不同浏览器
    - 测试不同设备
    - 测试不同屏幕尺寸
    - _Requirements: 5_
  - [ ] 12.3 性能测试
    - 测试菜单加载时间
    - 测试大量菜单项的性能
    - 测试内存占用
    - _Requirements: 性能要求_

## 任务依赖关系

```
1 (清理组件)
    ↓
2 (扩展 API) → 4 (更新数据结构)
    ↓
3 (扩展 state)
    ↓
5 (调整 Layout) + 6 (添加挂载操作)
    ↓
7 (数据同步) + 8 (错误处理)
    ↓
9 (性能优化)
    ↓
10 (测试) + 11 (文档)
    ↓
12 (验证)
```

## 预计工作量

- 任务 1: 0.5 小时
- 任务 2: 2 小时
- 任务 3: 2 小时
- 任务 4: 0.5 小时
- 任务 5: 1 小时
- 任务 6: 3 小时
- 任务 7: 1 小时
- 任务 8: 1 小时
- 任务 9: 2 小时
- 任务 10: 4 小时 (可选)
- 任务 11: 1 小时
- 任务 12: 2 小时

**总计**: 约 15-20 小时 (不含可选测试)

## 里程碑

### 里程碑 1: 基础功能完成 (第 1-2 天)

- [x] 清理旧组件
- [x] API 扩展完成
- [x] State 扩展完成
- [x] 数据结构更新

### 里程碑 2: 核心功能完成 (第 3-4 天)

- [ ] Layout 调整完成
- [ ] 挂载操作添加完成
- [ ] 数据同步实现
- [ ] 错误处理完成

### 里程碑 3: 优化和测试 (第 5 天)

- [ ] 性能优化完成
- [ ] 测试完成
- [ ] 文档更新完成
- [ ] 验证通过

## 注意事项

1. **保持简洁**: 不要添加不必要的功能,保持侧边栏简洁
2. **复用组件**: 最大化复用现有的 DynamicMenu 组件
3. **数据一致性**: 确保设计端和管理端的菜单数据保持同步
4. **错误处理**: 提供友好的错误提示和默认菜单
5. **性能**: 关注大量菜单项时的性能表现

## 成功标准

- ✅ 管理端侧边栏只显示 Logo 和菜单列表
- ✅ 设计端可以标记菜单挂载到管理端
- ✅ 挂载的菜单自动显示在管理端侧边栏
- ✅ 菜单导航功能正常
- ✅ 响应式设计正常工作
- ✅ 性能指标达标
- ✅ 代码简洁易维护
