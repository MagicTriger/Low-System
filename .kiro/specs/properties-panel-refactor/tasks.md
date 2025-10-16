# 属性面板重构任务列表

## 任务列表

- [ ] 1. 集成现有架构创建属性系统

  - [x] 1.1 创建属性系统类型定义

    - 创建 `src/core/renderer/properties/types.ts`
    - 扩展现有 `BaseControlDefinition` 接口
    - 兼容现有 `settings` 字段格式
    - 定义 PropertyFieldConfig, PropertyPanelConfig 等类型
    - 定义 ValidationRule, DependencyCondition 等辅助类型
    - _Requirements: 1.1, 2.1_

  - [ ] 1.2 创建属性服务

    - 创建 `src/core/services/PropertyService.ts`
    - 集成到现有DI容器
    - 实现服务初始化

    - 注册到服务系统

    - _Requirements: 1.1, 1.2_

  - [ ] 1.3 实现属性字段管理器

    - 创建 `src/core/renderer/properties/PropertyFieldManager.ts`

    - 实现字段注册和检索

    - 实现渲染器注册和检索
    - 实现字段验证逻辑
    - 实现依赖条件检查
    - 集成现有IconLibraryManager

    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 1.4 实现属性面板管理器

    - 创建 `src/core/renderer/properties/PropertyPanelManager.ts`

    - 实现面板配置注册

    - 实现面板配置检索
    - 实现配置合并逻辑
    - 集成现有ControlDefinitions
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 1.5 创建属性插件系统
    - 创建 `src/core/plugins/PropertyPlugin.ts`
    - 扩展现有IPlugin接口
    - 实现BasePropertyPlugin基类
    - 集成到现有插件系统
    - _Requirements: 4.1, 4.2_
  - [x] 1.6 扩展状态管理

    - 扩展 `src/core/state/modules/designer.ts`
    - 集成到现有StateManager
    - 实现属性状态管理
    - 实现属性验证状态
    - _Requirements: 3.3, 3.5_

- [ ] 2. 创建字段渲染器组件（集成现有组件）

  - [ ] 2.1 创建字段渲染器入口组件

    - 创建 `src/core/renderer/designer/settings/fields/FieldRenderer.vue`
    - 实现动态组件加载
    - 实现字段验证显示
    - 实现错误提示
    - 集成现有状态管理

    - _Requirements: 2.1, 2.2, 2.3_

  - [ ] 2.2 创建基础字段渲染器

    - 创建 `renderers/TextField.vue` - 文本输入字段
    - 创建 `renderers/NumberField.vue` - 数字输入字段

    - 创建 `renderers/SelectField.vue` - 下拉选择字段

    - 创建 `renderers/SwitchField.vue` - 开关字段
    - 创建 `renderers/TextareaField.vue` - 文本域字段
    - _Requirements: 2.1, 2.2_

  - [ ] 2.3 集成现有高级字段渲染器

    - 创建 `renderers/ColorField.vue` - 颜色选择字段（集成现有ColorRenderer）
    - 创建 `renderers/IconField.vue` - 图标选择字段（集成现有IconPickerField）
    - 创建 `renderers/SizeField.vue` - 尺寸编辑字段（集成现有DomSizeRenderer）
    - 创建 `renderers/SliderField.vue` - 滑块字段
    - _Requirements: 2.1, 2.2_

  - [ ] 2.4 创建字段渲染器注册系统

    - 创建 `src/core/renderer/designer/settings/fields/index.ts`

    - 注册所有字段渲染器到PropertyService
    - 导出字段渲染器
    - 集成到服务初始化流程

    - _Requirements: 2.1, 4.1_

- [ ] 3. 提取和转换现有面板配置

  - [ ] 3.1 分析现有控件定义

    - 分析 `src/core/renderer/controls/register.ts` 中的settings配置

    - 提取现有字段配置模式
    - 创建配置转换映射
    - _Requirements: 3.1, 3.2_

  - [ ] 3.2 创建基础面板配置

    - 创建 `src/core/renderer/properties/panels/BasicPanel.ts`
    - 转换基本信息字段配置
    - 转换数据绑定字段配置

    - 转换扩展属性字段配置

    - 兼容现有settings格式
    - _Requirements: 3.1, 3.2_

  - [x] 3.3 创建样式面板配置

    - 创建 `src/core/renderer/properties/panels/StylePanel.ts`
    - 转换尺寸配置字段
    - 转换内外边距字段
    - 转换Flex布局字段
    - 转换定位配置字段
    - 转换字体配置字段

    - 转换边框配置字段
    - 转换圆角配置字段
    - 转换背景配置字段
    - _Requirements: 3.1, 3.2_

  - [ ] 3.4 创建事件面板配置
    - 创建 `src/core/renderer/properties/panels/EventPanel.ts`
    - 转换生命周期事件字段
    - 转换鼠标事件字段
    - 转换键盘事件字段
    - 转换表单事件字段
    - _Requirements: 3.1, 3.2_
  - [ ] 3.5 创建面板配置注册系统
    - 创建 `src/core/renderer/properties/panels/index.ts`
    - 导出所有面板配置
    - 注册到PropertyPanelManager
    - 集成到服务初始化流程
    - _Requirements: 3.1, 3.4_

- [ ] 4. 重构PropertiesPanel组件（保持向后兼容）

  - [ ] 4.1 简化PropertiesPanel结构
    - 移除硬编码的字段定义
    - 使用配置驱动渲染
    - 保留现有的UI结构和样式
    - 集成PropertyService
    - _Requirements: 3.1, 3.3_
  - [ ] 4.2 集成字段渲染器
    - 使用FieldRenderer组件
    - 实现字段值绑定
    - 实现字段更新逻辑
    - 集成状态管理
    - _Requirements: 2.1, 2.2, 3.3_
  - [ ] 4.3 实现动态面板加载
    - 根据组件类型从PropertyPanelManager加载配置
    - 实现配置缓存
    - 实现配置合并
    - 支持控件特定配置覆盖
    - _Requirements: 3.1, 3.2, 3.3_
  - [ ] 4.4 实现依赖条件显示
    - 检查字段依赖条件
    - 动态显示/隐藏字段
    - 更新字段状态
    - 集成验证系统
    - _Requirements: 1.5, 3.3_

- [ ] 5. 扩展现有控件定义（向后兼容）

  - [ ] 5.1 更新Button控件定义
    - 扩展 `src/core/renderer/controls/basic/Button.vue` 的定义
    - 添加propertyPanels配置
    - 保持现有settings字段兼容
    - 注册到PropertyPlugin
    - _Requirements: 3.1, 3.2, 4.1_
  - [ ] 5.2 更新Text控件定义
    - 扩展 `src/core/renderer/controls/basic/Text.vue` 的定义
    - 添加propertyPanels配置
    - 保持现有settings字段兼容
    - 注册到PropertyPlugin
    - _Requirements: 3.1, 3.2, 4.1_
  - [ ] 5.3 创建控件配置迁移工具
    - 创建 `src/core/renderer/properties/migration/ConfigMigrator.ts`
    - 实现settings到propertyPanels的自动转换
    - 提供迁移验证工具
    - 生成迁移报告
    - _Requirements: 4.1, 4.2_

- [ ] 6. 集成和测试

  - [ ] 6.1 服务系统集成
    - 在 `src/core/index.ts` 中注册PropertyService
    - 更新服务初始化顺序
    - 验证DI容器集成
    - 测试服务生命周期
    - _Requirements: 1.1, 1.2, 4.1_
  - [ ] 6.2 功能测试
    - 测试所有字段类型渲染
    - 测试字段验证
    - 测试依赖条件
    - 测试面板配置加载
    - 测试向后兼容性
    - _Requirements: 1.1, 2.1, 3.1, 4.2_
  - [ ] 6.3 性能优化
    - 实现字段懒加载
    - 实现配置缓存
    - 实现验证防抖
    - 优化渲染性能
    - _Requirements: 性能需求_
  - [ ] 6.4 文档更新
    - 编写PropertyService使用文档
    - 编写PropertyPlugin扩展指南
    - 编写配置迁移指南
    - 更新API文档
    - _Requirements: 可维护性需求_

## 实施顺序

1. **阶段1: 架构集成** (任务1) - 创建属性系统并集成到现有架构

   - 创建类型定义
   - 创建PropertyService并注册到DI容器
   - 创建管理器类
   - 创建PropertyPlugin
   - 扩展状态管理

2. **阶段2: 字段渲染器** (任务2) - 创建可复用的字段组件

   - 创建FieldRenderer入口
   - 创建基础字段渲染器
   - 集成现有高级字段渲染器
   - 注册到PropertyService

3. **阶段3: 配置转换** (任务3) - 提取和转换现有配置

   - 分析现有控件定义
   - 创建面板配置
   - 转换现有settings格式
   - 注册到PropertyPanelManager

4. **阶段4: 组件重构** (任务4) - 重构PropertiesPanel

   - 简化组件结构
   - 集成字段渲染器
   - 实现动态面板加载
   - 实现依赖条件显示

5. **阶段5: 控件扩展** (任务5) - 扩展现有控件定义

   - 更新Button和Text控件
   - 创建配置迁移工具
   - 保持向后兼容

6. **阶段6: 集成测试** (任务6) - 集成、测试和优化
   - 服务系统集成
   - 功能测试
   - 性能优化
   - 文档更新

## 预估时间

- 任务1: 3-4天 (架构集成，包括服务、插件、状态管理)
- 任务2: 2-3天 (字段渲染器组件)
- 任务3: 2-3天 (配置转换和提取)
- 任务4: 2-3天 (PropertiesPanel重构)
- 任务5: 2天 (控件扩展和迁移工具)
- 任务6: 2-3天 (集成、测试和优化)

总计: 13-18天

## 架构集成要点

1. **服务系统集成**

   - PropertyService注册到DI容器
   - 在核心初始化流程中启动
   - 与现有服务协同工作

2. **插件系统集成**

   - PropertyPlugin扩展IPlugin接口
   - 支持动态注册字段和面板
   - 与ControlPlugin协同工作

3. **状态管理集成**

   - 扩展现有designer模块
   - 使用StateManager管理属性状态
   - 与EventBus集成实现响应式更新

4. **控件定义扩展**
   - 扩展BaseControlDefinition
   - 保持settings字段向后兼容
   - 支持新的propertyPanels配置

## 注意事项

1. **向后兼容**:

   - 保持现有settings字段格式
   - 支持渐进式迁移
   - 提供自动转换工具

2. **架构一致性**:

   - 遵循现有DI模式
   - 遵循现有插件模式
   - 遵循现有状态管理模式

3. **渐进式迁移**:

   - 可以先迁移部分控件
   - 新旧系统可以共存
   - 逐步完成全部迁移

4. **测试覆盖**:

   - 每个阶段完成后进行测试
   - 重点测试向后兼容性
   - 集成测试验证系统协同

5. **文档同步**:
   - 及时更新API文档
   - 提供迁移指南
   - 提供扩展示例
