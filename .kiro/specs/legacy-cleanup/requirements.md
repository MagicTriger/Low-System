# Requirements Document - 旧系统清理

## Introduction

本需求文档定义了从项目中清理旧系统代码并全面采用新架构的要求。新架构已经100%完成并集成，现在需要移除旧的Pinia stores和相关代码，确保项目完全使用新的StateManager系统。

## Requirements

### Requirement 1: 识别和分析旧系统代码

**User Story:** 作为开发者，我想要识别所有旧系统的代码和依赖，以便了解需要清理的范围。

#### Acceptance Criteria

1. WHEN 扫描项目代码 THEN 系统 SHALL 列出所有旧的Pinia stores文件
2. WHEN 分析代码依赖 THEN 系统 SHALL 识别所有引用旧stores的文件
3. WHEN 检查配置文件 THEN 系统 SHALL 识别旧系统相关的配置和依赖
4. WHEN 分析完成 THEN 系统 SHALL 生成完整的清理清单

### Requirement 2: 迁移旧stores到新StateManager

**User Story:** 作为开发者，我想要将旧的Pinia stores迁移到新的StateManager，以便使用统一的状态管理系统。

#### Acceptance Criteria

1. WHEN 迁移app store THEN 系统 SHALL 创建对应的StateManager模块
2. WHEN 迁移auth store THEN 系统 SHALL 创建对应的StateManager模块
3. WHEN 迁移theme store THEN 系统 SHALL 创建对应的StateManager模块
4. WHEN 迁移user store THEN 系统 SHALL 创建对应的StateManager模块
5. WHEN 迁移完成 THEN 所有状态管理功能 SHALL 保持一致

### Requirement 3: 更新代码引用

**User Story:** 作为开发者，我想要更新所有引用旧stores的代码，以便使用新的StateManager API。

#### Acceptance Criteria

1. WHEN 查找旧API调用 THEN 系统 SHALL 识别所有`useXxxStore()`调用
2. WHEN 更新组件代码 THEN 系统 SHALL 替换为新的StateManager API
3. WHEN 更新服务代码 THEN 系统 SHALL 替换为新的StateManager API
4. WHEN 更新完成 THEN 所有代码 SHALL 使用新API且无编译错误

### Requirement 4: 移除旧系统文件和依赖

**User Story:** 作为开发者，我想要移除所有旧系统的文件和依赖，以便保持代码库的整洁。

#### Acceptance Criteria

1. WHEN 删除旧stores文件 THEN 系统 SHALL 移除`src/core/stores`目录
2. WHEN 更新package.json THEN 系统 SHALL 移除不再需要的Pinia依赖（如果完全不用）
3. WHEN 清理导出 THEN 系统 SHALL 从`src/core/index.ts`移除旧stores导出
4. WHEN 清理完成 THEN 项目 SHALL 能够正常构建和运行

### Requirement 5: 更新兼容层配置

**User Story:** 作为开发者，我想要更新兼容层配置，以便完全禁用旧API的兼容支持。

#### Acceptance Criteria

1. WHEN 更新特性标志 THEN 系统 SHALL 将所有新系统特性设为默认启用
2. WHEN 配置兼容层 THEN 系统 SHALL 设置为仅记录警告模式
3. WHEN 更新完成 THEN 系统 SHALL 在使用旧API时显示弃用警告
4. IF 检测到旧API调用 THEN 系统 SHALL 记录详细的迁移建议

### Requirement 6: 验证和测试

**User Story:** 作为开发者，我想要验证清理后的系统功能正常，以便确保没有破坏现有功能。

#### Acceptance Criteria

1. WHEN 运行应用 THEN 系统 SHALL 正常启动无错误
2. WHEN 测试状态管理 THEN 所有状态操作 SHALL 正常工作
3. WHEN 测试认证流程 THEN 登录登出 SHALL 正常工作
4. WHEN 测试UI交互 THEN 所有界面功能 SHALL 正常工作
5. WHEN 检查控制台 THEN 系统 SHALL 无错误和警告（除了预期的弃用警告）

### Requirement 7: 文档更新

**User Story:** 作为开发者，我想要更新相关文档，以便团队了解新的开发方式。

#### Acceptance Criteria

1. WHEN 更新README THEN 文档 SHALL 反映新的状态管理方式
2. WHEN 创建迁移指南 THEN 文档 SHALL 包含从旧API到新API的对照表
3. WHEN 更新示例代码 THEN 所有示例 SHALL 使用新API
4. WHEN 文档完成 THEN 开发者 SHALL 能够快速上手新系统

## Success Criteria

- ✅ 所有旧的Pinia stores已被移除
- ✅ 所有代码引用已更新为新API
- ✅ 项目能够正常构建和运行
- ✅ 所有功能测试通过
- ✅ 文档已更新
- ✅ 代码库更加整洁和统一

## Out of Scope

- 不涉及新功能开发
- 不涉及UI/UX改进
- 不涉及性能优化（除非清理带来的自然提升）
- 暂时保留Pinia依赖（因为PiniaAdapter可能还需要）
