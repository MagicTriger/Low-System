# Implementation Plan - 旧系统清理

- [x] 1. 创建StateManager模块

  - 创建`src/core/state/modules/`目录
  - 实现4个状态模块（app、auth、theme、user）
  - 创建辅助函数和模块注册
  - _Requirements: 1, 2_

- [x] 1.1 创建App状态模块

  - 实现`src/core/state/modules/app.ts`
  - 定义AppState接口
  - 实现state、getters、mutations、actions
  - _Requirements: 2.1_

- [x] 1.2 创建Auth状态模块

  - 实现`src/core/state/modules/auth.ts`
  - 定义AuthState接口
  - 实现登录、登出、认证检查逻辑
  - _Requirements: 2.2_

- [x] 1.3 创建Theme状态模块

  - 实现`src/core/state/modules/theme.ts`
  - 定义ThemeState接口
  - 实现主题切换和初始化逻辑
  - _Requirements: 2.3_

- [x] 1.4 创建User状态模块

  - 实现`src/core/state/modules/user.ts`
  - 定义UserState接口
  - 实现用户信息管理逻辑
  - _Requirements: 2.4_

- [x] 1.5 创建辅助函数

  - 实现`src/core/state/helpers.ts`
  - 实现useState、useCommit、useDispatch、useGetter
  - 实现useModule组合式API
  - _Requirements: 2_

- [x] 1.6 创建模块注册

  - 实现`src/core/state/modules/index.ts`
  - 实现registerStateModules函数
  - 导出所有模块和辅助函数
  - _Requirements: 2_

- [x] 2. 更新应用初始化

  - 在应用启动时注册StateManager模块
  - 更新主题初始化代码
  - 验证初始化流程
  - _Requirements: 3_

- [x] 2.1 更新核心初始化

  - 修改`src/core/index.ts`
  - 调用registerStateModules()
  - 使用StateManager替代useThemeStore
  - _Requirements: 3.1_

- [x] 2.2 更新迁移系统集成

  - 确保StateManager在bootstrap中正确初始化
  - 验证全局访问接口
  - _Requirements: 3_

- [x] 3. 更新高优先级组件

  - 更新核心功能组件使用新API
  - 确保关键流程正常工作
  - _Requirements: 3_

- [x] 3.1 更新API请求模块

  - 修改`src/core/api/request.ts`
  - 使用StateManager获取token
  - 更新用户登出逻辑
  - _Requirements: 3.2_

- [x] 3.2 更新登录组件

  - 修改`src/modules/designer/views/Login.vue`
  - 使用StateManager进行认证
  - 测试登录登出流程
  - _Requirements: 3.2_

- [x] 4. 更新中优先级组件

  - 更新UI组件使用新API
  - 验证UI交互正常
  - _Requirements: 3_

- [x] 4.1 更新AppWrapper组件

  - 修改`src/core/components/AppWrapper.vue`
  - 使用StateManager获取主题状态
  - 验证主题类应用正确
  - _Requirements: 3.2_

- [x] 4.2 更新Designer App组件

  - 修改`src/modules/designer/App.vue`
  - 使用StateManager设置页面标题
  - 验证页面标题更新
  - _Requirements: 3.2_

- [x] 5. 验证和测试

  - 运行应用验证所有功能
  - 执行手动测试清单
  - 修复发现的问题
  - _Requirements: 6_

- [x] 5.1 功能验证

  - 测试应用启动
  - 测试主题切换
  - 测试登录登出
  - 测试状态持久化
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 5.2 错误检查

  - 检查控制台错误
  - 检查TypeScript编译错误
  - 检查运行时警告
  - _Requirements: 6.5_

- [x] 6. 清理旧代码

  - 删除旧的Pinia stores
  - 更新导出和配置
  - 清理不需要的代码
  - _Requirements: 4_

- [x] 6.1 删除旧stores目录

  - 备份`src/core/stores/`目录
  - 删除stores目录
  - _Requirements: 4.1_

- [x] 6.2 更新核心导出

  - 修改`src/core/index.ts`
  - 移除stores导出
  - 添加state模块导出
  - _Requirements: 4.3_

- [x] 6.3 清理Pinia初始化

  - 评估是否需要保留Pinia（PiniaAdapter）
  - 如果不需要，移除Pinia初始化代码
  - 更新相关配置
  - _Requirements: 4.2_

- [x] 7. 更新特性标志配置

  - 将新系统特性设为默认启用
  - 配置兼容层为警告模式
  - _Requirements: 5_

- [x] 7.1 更新特性标志

  - 修改特性标志默认值
  - 将NEW_STATE_MANAGER设为默认启用
  - _Requirements: 5.1_

- [x] 7.2 配置兼容层

  - 设置兼容层为仅记录模式
  - 添加旧API弃用警告
  - _Requirements: 5.2, 5.3, 5.4_

- [x] 8. 更新文档

  - 更新README和开发指南
  - 创建迁移指南
  - 更新示例代码
  - _Requirements: 7_

- [x] 8.1 更新README

  - 更新状态管理说明
  - 添加新API使用示例
  - _Requirements: 7.1_

- [x] 8.2 创建迁移指南

  - 创建`LEGACY_TO_NEW_MIGRATION.md`
  - 包含API对照表
  - 包含迁移示例
  - _Requirements: 7.2_

- [x] 8.3 更新示例代码

  - 更新文档中的示例
  - 更新README中的代码
  - _Requirements: 7.3_

- [ ] 9. 最终验证

  - 完整的功能测试
  - 性能检查
  - 代码审查
  - _Requirements: 6_

- [x] 9.1 完整功能测试

  - 测试所有关键流程
  - 测试边缘情况
  - 确认无回归问题
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 9.2 性能检查

  - 检查应用启动时间
  - 检查状态操作性能
  - 对比迁移前后性能
  - _Requirements: 6_

- [x] 9.3 代码审查

  - 检查代码质量
  - 确认无TypeScript错误
  - 确认代码风格一致
  - _Requirements: 6.5_

- [x] 10. 创建完成报告

  - 总结清理工作
  - 记录遇到的问题和解决方案
  - 更新项目文档
  - _Requirements: 7_
