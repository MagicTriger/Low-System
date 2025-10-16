# Implementation Plan - 核心服务集成

- [x] 1. 创建服务集成模块

  - 创建`ServicesIntegration.ts`
  - 实现服务注册和初始化逻辑
  - _Requirements: 2_

- [x] 1.1 创建ServicesIntegration类

  - 实现基础结构
  - 添加配置接口
  - 实现integrate方法
  - _Requirements: 2.1, 2.2_

- [x] 1.2 实现服务注册方法

  - 实现registerPluginSystem
  - 实现registerLayoutSystem
  - 实现registerBusinessServices
  - _Requirements: 2.2_

- [x] 2. 注册插件系统服务

  - 注册PluginManager到DI容器
  - 已在registerPluginSystem中实现
  - _Requirements: 3_

- [x] 2.1 注册PluginManager

  - 已注册为单例
  - 使用动态导入
  - _Requirements: 3.1_

- [ ] 2.2 注册插件注册表

  - 注册ControlRegistry
  - 注册SettingRendererRegistry
  - _Requirements: 3.2_

- [x] 3. 注册布局系统服务

  - 注册布局相关服务到DI容器
  - 已在registerLayoutSystem中实现
  - _Requirements: 4_

- [x] 3.1 注册LayoutManager

  - 已使用工厂函数创建
  - 已注册为单例
  - _Requirements: 4.1_

- [x] 3.2 注册GridSystem

  - 已使用工厂函数创建
  - 已注册为单例
  - _Requirements: 4.2_

- [x] 3.3 注册ContainerManager

  - 已使用工厂函数创建
  - 已注册为单例
  - _Requirements: 4.3_

- [ ] 4. 注册运行时系统服务

  - 注册运行时相关服务
  - 配置服务依赖
  - 验证运行时系统
  - _Requirements: 5_

- [ ] 4.1 注册DataFlowEngine

  - 注册为单例
  - _Requirements: 5.2_

- [ ] 4.2 注册RuntimeManager

  - 配置依赖DataFlowEngine
  - 注册为单例
  - _Requirements: 5.1_

- [ ] 4.3 注册执行器

  - 注册DataActionExecutor
  - 注册DataBindingExecutor
  - _Requirements: 5.2_

- [x] 5. 注册业务服务

  - 注册业务相关服务
  - 已在registerBusinessServices中实现
  - _Requirements: 6_

- [x] 5.1 注册DesignPersistenceService

  - 已注册为单例
  - _Requirements: 6.1_

- [x] 5.2 注册DataSourceService

  - 已注册为单例
  - _Requirements: 6.2_

- [x] 6. 创建服务访问辅助函数

  - 创建统一的服务访问接口
  - 提供类型安全的访问方式
  - _Requirements: 7_

- [x] 6.1 创建helpers文件

  - 实现useService通用函数
  - 实现特定服务的访问函数
  - _Requirements: 7.1_

- [x] 6.2 添加类型定义

  - 定义服务类型映射
  - 确保类型安全
  - _Requirements: 7.1_

- [x] 7. 集成到bootstrap

  - 在bootstrap中调用服务集成
  - 暴露服务到全局对象
  - _Requirements: 2.3_

- [x] 7.1 更新bootstrap.ts

  - 添加服务集成调用
  - 配置集成选项
  - _Requirements: 2.3_

- [x] 7.2 暴露服务到全局

  - 添加services到**MIGRATION_SYSTEM**
  - 提供开发环境访问
  - _Requirements: 2.3_
