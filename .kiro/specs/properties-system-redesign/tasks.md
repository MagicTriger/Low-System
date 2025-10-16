# 属性面板系统重新设计 - 任务列表

## 任务列表

- [x] 1. 清理现有属性配置系统

  - [x] 1.1 删除旧的properties目录

    - 删除 `src/core/renderer/properties/` 目录及所有文件
    - 删除 `src/core/renderer/properties/panels/` 目录
    - 删除 `src/core/renderer/properties/PropertyFieldManager.ts`
    - 删除 `src/core/renderer/properties/PropertyPanelManager.ts`
    - 删除 `src/core/renderer/properties/types.ts`
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 1.2 删除旧的字段渲染器

    - 删除 `src/core/renderer/designer/settings/fields/` 目录及所有文件
    - 删除 `src/core/renderer/designer/settings/fields/renderers/` 目录
    - 删除 `src/core/renderer/designer/settings/fields/FieldRenderer.vue`
    - 删除 `src/core/renderer/designer/settings/fields/index.ts`
    - _Requirements: 1.2, 1.3_

  - [x] 1.3 删除旧的服务和插件

    - 删除 `src/core/services/PropertyService.ts`
    - 删除 `src/core/plugins/PropertyPlugin.ts`
    - 从 `src/core/index.ts` 中移除相关导入和初始化代码
    - _Requirements: 1.4, 1.5_

  - [x] 1.4 清理控件定义中的旧配置

    - 从 `src/core/renderer/controls/register.ts` 中移除所有 `settings` 字段
    - 从 `src/core/renderer/base.ts` 中移除 `settings` 和 `propertyPanels` 类型定义
    - 清理所有控件组件中的旧属性配置引用
    - _Requirements: 1.6_

  - [x] 1.5 清理PropertiesPanel组件

    - 备份当前 `src/core/renderer/designer/settings/PropertiesPanel.vue`
    - 移除所有硬编码的字段定义和渲染逻辑
    - 保留组件外壳和基本结构
    - _Requirements: 1.7_

- [ ] 2. 创建基础设施层字段系统

  - [ ] 2.1 创建字段类型定义

    - 创建 `src/core/infrastructure/fields/types.ts`
    - 定义 `FieldType` 枚举
    - 定义 `FieldConfig` 接口
    - 定义 `FieldOption` 接口
    - 定义 `ValidationRule` 接口
    - 定义 `DependencyRule` 接口
    - 定义 `FieldLayout` 接口
    - 定义 `FieldVisualizer` 接口
    - _Requirements: 2.1, 2.2, 2.3, 2.6, 2.7_

  - [ ] 2.2 创建字段注册表

    - 创建 `src/core/infrastructure/fields/registry.ts`
    - 实现 `FieldRegistry` 类
    - 实现 `register()` 方法 - 注册字段渲染器
    - 实现 `getRenderer()` 方法 - 获取字段渲染器
    - 实现 `registerBatch()` 方法 - 批量注册
    - 实现 `validateConfig()` 方法 - 验证字段配置
    - 实现 `registerVisualizer()` 方法 - 注册可视化组件
    - 实现 `getVisualizer()` 方法 - 获取可视化组件
    - _Requirements: 2.3, 2.4_

  - [ ] 2.3 创建基础字段渲染器

    - 创建 `src/core/infrastructure/fields/renderers/` 目录
    - 创建 `TextField.vue` - 文本输入字段
    - 创建 `NumberField.vue` - 数字输入字段
    - 创建 `SelectField.vue` - 下拉选择字段
    - 创建 `SwitchField.vue` - 开关字段
    - 创建 `TextareaField.vue` - 文本域字段
    - 所有渲染器实现统一的Props和Emits接口
    - _Requirements: 2.2, 2.5_

  - [ ] 2.4 创建高级字段渲染器

    - 创建 `ColorField.vue` - 颜色选择字段
    - 创建 `SliderField.vue` - 滑块字段
    - 创建 `IconField.vue` - 图标选择字段(集成IconPicker)
    - 实现字段验证显示
    - 实现错误提示
    - _Requirements: 2.2, 2.5_

  - [ ] 2.5 创建字段导出文件
    - 创建 `src/core/infrastructure/fields/index.ts`
    - 导出所有字段类型定义
    - 导出FieldRegistry
    - 导出所有字段渲染器
    - _Requirements: 2.1, 2.2_

- [ ] 3. 创建可视化组件系统

  - [ ] 3.1 创建可视化组件目录

    - 创建 `src/core/infrastructure/fields/visualizers/` 目录
    - 创建可视化组件的通用样式文件
    - _Requirements: UI/UX增强_

  - [ ] 3.2 创建内外边距可视化组件

    - 创建 `MarginPaddingVisualizer.vue`
    - 实现盒模型可视化展示
    - 实现四个方向的输入框(top, right, bottom, left)
    - 实现交互式编辑
    - 实现值的解析和格式化
    - 支持简写格式(10px, 10px 20px, 10px 20px 10px 20px)
    - _Requirements: UI/UX增强_

  - [ ] 3.3 创建Flex布局可视化组件

    - 创建 `FlexVisualizer.vue`
    - 实现flex-direction可视化选择(图标按钮)
    - 实现justify-content可视化选择(图标按钮)
    - 实现align-items可视化选择(图标按钮)
    - 实现实时预览效果
    - _Requirements: UI/UX增强_

  - [ ] 3.4 创建字体大小可视化组件

    - 创建 `FontSizeVisualizer.vue`
    - 实现字体大小预览列表
    - 显示不同大小的"Aa"示例
    - 高亮当前选中的大小
    - 支持快速选择常用字体大小
    - _Requirements: UI/UX增强_

  - [ ] 3.5 创建边框可视化组件

    - 创建 `BorderVisualizer.vue`
    - 实现边框宽度、样式、颜色的可视化编辑
    - 实现圆角可视化编辑
    - 实现实时预览框
    - 支持四个角独立设置圆角
    - _Requirements: UI/UX增强_

  - [ ] 3.6 创建定位可视化组件

    - 创建 `PositionVisualizer.vue`
    - 实现position类型选择按钮
    - 实现top/right/bottom/left可视化输入
    - 显示定位示意图
    - _Requirements: UI/UX增强_

  - [ ] 3.7 创建尺寸可视化组件

    - 创建 `SizeVisualizer.vue`
    - 实现宽度和高度输入
    - 支持单位切换(px, %, auto)
    - 显示尺寸预览框
    - _Requirements: UI/UX增强_

  - [ ] 3.8 创建可视化组件导出文件
    - 创建 `src/core/infrastructure/fields/visualizers/index.ts`
    - 导出所有可视化组件
    - 创建可视化组件注册映射
    - _Requirements: UI/UX增强_

- [ ] 4. 创建面板配置系统

  - [ ] 4.1 创建面板类型定义

    - 创建 `src/core/infrastructure/panels/types.ts`
    - 定义 `PanelGroup` 枚举
    - 定义 `PanelConfig` 接口
    - 定义 `ComponentPanelConfig` 接口
    - _Requirements: 3.1, 3.2, 4.1_

  - [ ] 4.2 创建通用面板配置 - 基础属性

    - 创建 `src/core/infrastructure/panels/common/` 目录
    - 创建 `BasicPanel.ts`
    - 定义基础属性字段: id, name, visible, disabled
    - 配置字段布局(双列)
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.3 创建通用面板配置 - 布局属性

    - 创建 `LayoutPanel.ts`
    - 定义布局属性字段: width, height, margin, padding, position, zIndex
    - 为margin和padding配置可视化组件
    - 配置字段布局(双列)
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.4 创建通用面板配置 - 样式属性

    - 创建 `StylePanel.ts`
    - 定义样式属性字段: backgroundColor, color, fontSize, fontWeight, border, borderRadius, opacity
    - 为fontSize配置可视化组件
    - 为border配置可视化组件
    - 配置字段布局(双列)
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ] 4.5 创建通用面板配置 - 事件属性

    - 创建 `EventPanel.ts`
    - 定义事件属性字段: onClick, onMouseEnter, onMouseLeave
    - 配置字段布局(整行,因为是textarea)
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 4.6 创建面板注册表

    - 创建 `src/core/infrastructure/panels/registry.ts`
    - 实现 `PanelRegistry` 类
    - 实现 `registerCommonPanel()` 方法 - 注册通用面板
    - 实现 `registerComponentPanel()` 方法 - 注册组件特定面板
    - 实现 `getPanelsForComponent()` 方法 - 获取组件的所有面板
    - 实现 `mergePanels()` 方法 - 合并通用面板和组件特定面板
    - _Requirements: 3.1, 3.2, 3.4, 4.2, 4.3_

  - [ ] 4.7 创建面板导出文件
    - 创建 `src/core/infrastructure/panels/index.ts`
    - 导出所有面板类型定义
    - 导出PanelRegistry
    - 导出所有通用面板配置
    - _Requirements: 3.1, 3.2_

- [x] 5. 创建属性面板服务

  - [x] 5.1 创建PropertyPanelService类

    - 创建 `src/core/infrastructure/services/PropertyPanelService.ts`
    - 定义服务类结构
    - 初始化FieldRegistry和PanelRegistry
    - _Requirements: 6.1, 6.2_

  - [x] 5.2 实现字段管理功能

    - 实现 `registerField()` 方法 - 注册字段渲染器
    - 实现 `getFieldRenderer()` 方法 - 获取字段渲染器
    - 实现 `registerVisualizer()` 方法 - 注册可视化组件
    - 实现 `getVisualizer()` 方法 - 获取可视化组件
    - _Requirements: 2.3, 2.4, 6.1_

  - [x] 5.3 实现面板管理功能

    - 实现 `registerCommonPanel()` 方法 - 注册通用面板
    - 实现 `registerComponentPanel()` 方法 - 注册组件特定面板
    - 实现 `getPanelsForComponent()` 方法 - 获取组件的所有面板配置
    - _Requirements: 3.1, 3.2, 3.4, 6.1_

  - [x] 5.4 实现验证功能

    - 实现 `validateFieldValue()` 方法 - 验证字段值
    - 实现 `checkDependency()` 方法 - 检查依赖条件
    - 支持内置验证规则(required, min, max, pattern)
    - 支持自定义验证函数
    - _Requirements: 2.6, 6.1_

  - [x] 5.5 实现服务初始化

    - 实现 `initialize()` 方法
    - 注册所有内置字段渲染器
    - 注册所有可视化组件
    - 注册所有通用面板配置
    - _Requirements: 6.1, 6.5_

  - [x] 5.6 创建服务导出文件

    - 创建 `src/core/infrastructure/services/index.ts`
    - 导出PropertyPanelService
    - 创建服务单例获取函数
    - _Requirements: 6.1_

- [-] 6. 实现属性面板UI组件

  - [x] 6.1 创建FieldRenderer组件

    - 创建 `src/core/infrastructure/fields/FieldRenderer.vue`
    - 实现字段标签显示
    - 实现动态加载字段渲染器组件
    - 实现可视化组件集成
    - 实现字段验证错误显示
    - 实现tooltip提示
    - 实现disabled和readonly状态
    - 支持双列布局(通过layout.span配置)
    - _Requirements: 2.1, 2.2, 2.3, 5.1, 5.2_

  - [ ] 6.2 创建PanelGroup组件

    - 创建 `src/core/renderer/designer/settings/PanelGroup.vue`
    - 实现面板标题和图标显示
    - 实现面板折叠/展开功能
    - 实现字段网格布局(双列)
    - 实现依赖条件检查和字段可见性控制
    - 实现字段值更新事件处理
    - 支持响应式布局(小屏幕切换为单列)
    - _Requirements: 3.1, 3.3, 5.3, 5.4_

  - [ ] 6.3 重构PropertiesPanel组件

    - 更新 `src/core/renderer/designer/settings/PropertiesPanel.vue`
    - 注入PropertyPanelService
    - 实现组件选中状态监听
    - 实现动态加载面板配置
    - 实现空状态显示(无组件选中时)
    - 实现属性更新到状态管理
    - 集成PanelGroup组件
    - _Requirements: 5.1, 5.2, 5.3, 5.5_

  - [ ] 6.4 创建UI组件样式
    - 创建统一的样式变量
    - 实现FieldRenderer样式
    - 实现PanelGroup样式
    - 实现PropertiesPanel样式
    - 实现响应式布局样式
    - 实现深色模式支持
    - _Requirements: 5.1, 5.2, 5.3_

- [ ] 7. 集成到现有框架

  - [ ] 7.1 注册服务到DI容器

    - 在 `src/core/migration/CoreServicesIntegration.ts` 中导入PropertyPanelService
    - 在initializeCoreServices函数中初始化并注册PropertyPanelService到容器
    - 在 `src/core/services/helpers.ts` 中添加 `usePropertyPanelService()` 辅助函数
    - 确保服务在正确的初始化顺序中注册
    - _Requirements: 6.1, 6.5_

  - [ ] 7.2 更新控件定义接口

    - 在 `src/core/renderer/base.ts` 中添加 `panels` 字段定义
    - 定义 `ComponentPanelDefinition` 接口
    - 更新 `BaseControlDefinition` 接口
    - _Requirements: 4.1, 4.2, 6.4_

  - [ ] 7.3 更新控件注册流程

    - 在 `src/core/renderer/definitions.ts` 中更新 `registerControlDefinition()`
    - 自动注册组件的面板配置到PropertyPanelService(通过DI容器获取)
    - 验证面板配置的有效性
    - _Requirements: 4.1, 4.2, 6.4_

  - [ ] 7.4 集成现有的Designer状态模块

    - 使用现有的 `src/core/state/modules/designer.ts` 状态模块
    - 更新PropertiesPanel使用 `useStateManager()` 访问状态
    - 使用 `designer/updateProperty` action更新属性
    - 使用 `designer/loadPropertyPanel` action加载面板配置
    - 确保与现有状态结构兼容
    - 实现状态变化时的UI更新
    - _Requirements: 5.4, 6.3_

  - [ ] 7.5 集成现有的EventBus

    - 在PropertyPanelService中获取全局EventBus实例
    - 使用EventBus触发属性更新事件 `control.property.updated`
    - 在PropertiesPanel中监听组件选中事件
    - 确保与现有事件系统兼容
    - _Requirements: 5.4, 6.3_

  - [ ] 7.6 集成现有的缓存系统

    - 在PropertyPanelService中使用 `useCache()` 获取缓存实例(如果可用)

    - 缓存面板配置合并结果
    - 缓存字段渲染器组件
    - 设置合理的缓存过期时间
    - _Requirements: 性能需求, 6.6_

- [ ] 8. 更新组件定义

  - [ ] 8.1 更新Button组件定义

    - 在 `src/core/renderer/controls/register.ts` 中更新Button定义
    - 添加 `panels` 配置
    - 定义组件特定属性字段: text, type, size, icon, danger, ghost
    - 配置字段布局和可视化
    - 继承通用面板: basic, layout, style, event
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.2 更新Span(文本)组件定义

    - 更新Span组件定义
    - 添加 `panels` 配置
    - 定义组件特定属性字段: text, html, ellipsis, strong, italic, underline
    - 配置字段布局
    - 继承通用面板
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.3 更新Image组件定义

    - 更新Image组件定义
    - 添加 `panels` 配置
    - 定义组件特定属性字段: src, alt, fit, preview, lazy
    - 配置字段布局
    - 继承通用面板
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.4 更新输入组件定义

    - 更新String, Number, Boolean组件定义
    - 添加 `panels` 配置
    - 定义各自的特定属性字段
    - 配置字段布局和验证规则
    - 继承通用面板
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.5 更新容器组件定义

    - 更新Flex, Grid组件定义
    - 添加 `panels` 配置
    - 定义布局相关的特定属性字段
    - 为Flex配置可视化组件
    - 继承通用面板
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 8.6 更新其他组件定义
    - 更新Table, Chart等其他组件定义
    - 添加 `panels` 配置
    - 定义各自的特定属性字段
    - 配置字段布局
    - 继承通用面板
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ] 9. 性能优化

  - [ ] 9.1 实现字段渲染器懒加载

    - 使用动态import加载字段渲染器组件
    - 实现渲染器组件缓存
    - 优化首次加载性能
    - _Requirements: 性能需求_

  - [ ] 9.2 实现面板配置缓存

    - 缓存面板配置合并结果
    - 缓存字段可见性计算结果
    - 使用computed优化重复计算
    - _Requirements: 性能需求, 6.6_

  - [ ] 9.3 实现输入防抖

    - 为文本输入字段添加防抖
    - 为滑块字段添加防抖
    - 为数字输入字段添加防抖
    - 减少频繁的状态更新
    - _Requirements: 性能需求, 6.6_

  - [ ] 9.4 实现虚拟滚动(可选)

    - 当字段数量超过50个时启用虚拟滚动
    - 只渲染可见区域的字段
    - 集成现有的VirtualScroller组件
    - _Requirements: 性能需求, 6.6_

  - [ ] 9.5 优化可视化组件性能
    - 优化可视化组件的渲染性能
    - 使用CSS transform代替position
    - 减少DOM操作
    - _Requirements: 性能需求_

- [ ] 10. 测试和验证

  - [ ] 10.1 功能测试

    - 测试所有字段类型的渲染
    - 测试字段值的读取和更新
    - 测试字段验证功能
    - 测试依赖条件显示/隐藏
    - 测试面板折叠/展开
    - 测试可视化组件交互
    - _Requirements: 1.1, 2.1, 3.1, 4.2_

  - [ ] 10.2 组件定义测试

    - 测试所有组件的面板配置加载
    - 测试通用面板和组件特定面板的合并
    - 测试字段布局(双列/整行)
    - 测试字段可视化组件显示
    - _Requirements: 3.1, 3.2, 4.1, 4.2_

  - [ ] 10.3 集成测试

    - 测试完整的属性编辑流程
    - 测试属性更新到组件的实时预览
    - 测试与状态管理的集成
    - 测试与事件总线的集成
    - _Requirements: 5.4, 6.3, 6.4_

  - [ ] 10.4 性能测试

    - 测试大量字段时的渲染性能
    - 测试频繁更新时的性能
    - 测试内存占用
    - 验证懒加载和缓存效果
    - _Requirements: 性能需求, 6.6_

  - [ ] 10.5 响应式测试

    - 测试不同屏幕尺寸下的布局
    - 测试移动端的单列布局
    - 测试可视化组件的响应式
    - _Requirements: UI/UX增强_

  - [ ] 10.6 浏览器兼容性测试
    - 测试Chrome浏览器
    - 测试Firefox浏览器
    - 测试Safari浏览器
    - 测试Edge浏览器
    - _Requirements: 可维护性需求_

- [ ] 11. 文档和示例

  - [ ] 11.1 编写API文档

    - 编写FieldConfig接口文档
    - 编写PanelConfig接口文档
    - 编写PropertyPanelService API文档
    - 编写所有公共接口的TypeScript类型说明
    - 提供使用示例
    - _Requirements: 可维护性需求_

  - [ ] 11.2 编写使用指南

    - 编写"如何定义组件面板配置"指南
    - 编写"如何使用内置字段类型"指南
    - 编写"如何创建自定义字段类型"指南
    - 编写"如何配置验证和依赖规则"指南
    - 编写"如何使用可视化组件"指南
    - _Requirements: 可维护性需求_

  - [ ] 11.3 编写迁移指南

    - 编写从旧系统迁移到新系统的步骤
    - 提供配置转换对照表
    - 列出常见问题和解决方案
    - 提供迁移示例
    - _Requirements: 可维护性需求_

  - [ ] 11.4 创建示例项目

    - 创建完整的组件定义示例
    - 创建自定义字段类型示例
    - 创建自定义可视化组件示例
    - 创建复杂验证规则示例
    - _Requirements: 可维护性需求_

  - [ ] 11.5 更新项目README
    - 更新项目架构说明
    - 更新属性面板系统说明
    - 添加新系统的特性介绍
    - 添加快速开始指南
    - _Requirements: 可维护性需求_

## 实施顺序

1. **阶段1: 清理** (任务1) - 删除所有旧代码

   - 删除旧的properties目录
   - 删除旧的字段渲染器
   - 删除旧的服务和插件
   - 清理控件定义

2. **阶段2: 基础设施 - 字段系统** (任务2-3) - 创建字段和可视化组件

   - 创建字段类型定义
   - 创建字段注册表
   - 创建基础和高级字段渲染器
   - 创建所有可视化组件

3. **阶段3: 基础设施 - 面板系统** (任务4) - 创建面板配置

   - 创建面板类型定义
   - 创建通用面板配置
   - 创建面板注册表

4. **阶段4: 服务层** (任务5) - 创建核心服务

   - 创建PropertyPanelService
   - 实现字段和面板管理
   - 实现验证功能
   - 实现服务初始化

5. **阶段5: UI层** (任务6) - 实现UI组件

   - 创建FieldRenderer组件
   - 创建PanelGroup组件
   - 重构PropertiesPanel组件
   - 创建UI样式

6. **阶段6: 集成** (任务7) - 集成到框架

   - 注册服务到应用
   - 更新控件定义接口
   - 更新控件注册流程
   - 集成状态管理和事件总线

7. **阶段7: 组件更新** (任务8) - 更新所有组件定义

   - 更新基础组件定义
   - 更新输入组件定义
   - 更新容器组件定义
   - 更新其他组件定义

8. **阶段8: 优化** (任务9) - 性能优化

   - 实现懒加载
   - 实现缓存
   - 实现防抖
   - 优化可视化组件

9. **阶段9: 测试** (任务10) - 全面测试

   - 功能测试
   - 集成测试
   - 性能测试
   - 兼容性测试

10. **阶段10: 文档** (任务11) - 编写文档
    - API文档
    - 使用指南
    - 迁移指南
    - 示例项目

## 预估时间

- 任务1: 0.5天 (清理旧代码)
- 任务2: 2天 (字段系统)
- 任务3: 3天 (可视化组件系统)
- 任务4: 1.5天 (面板配置系统)
- 任务5: 2天 (属性面板服务)
- 任务6: 2.5天 (UI组件)
- 任务7: 1天 (框架集成)
- 任务8: 2天 (组件定义更新)
- 任务9: 1.5天 (性能优化)
- 任务10: 2天 (测试)
- 任务11: 2天 (文档)

总计: 19.5天

## 注意事项

1. **清理阶段**:

   - 在删除旧代码前做好备份
   - 确保不影响其他功能模块
   - 逐步清理,避免一次性删除过多

2. **架构一致性**:

   - 遵循现有的DI模式
   - 遵循现有的状态管理模式
   - 保持代码风格一致

3. **向后兼容**:

   - 虽然是全新系统,但要确保不影响现有功能
   - 提供清晰的迁移路径
   - 保留必要的兼容层

4. **测试覆盖**:

   - 每个阶段完成后进行测试
   - 重点测试核心功能
   - 确保性能达标

5. **文档同步**:

   - 及时更新API文档
   - 提供详细的使用示例
   - 编写清晰的迁移指南

6. **UI/UX**:
   - 确保可视化组件直观易用
   - 双列布局美观合理
   - 响应式设计完善
   - 交互流畅自然
