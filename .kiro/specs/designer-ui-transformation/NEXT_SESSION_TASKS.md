# 下一个会话的任务清单

## 会话目标

修复设计器的三个核心问题，使其完全可用

## 任务优先级

### 🔴 高优先级 - 必须修复

#### 任务 1: 修复选择框位置问题

**当前问题：**

- 选择框（SelectionOverlay）位置不正确
- 应该完全包裹住组件，但当前显示在错误的位置
- 从截图看，image 组件的选择框位置明显不对

**根本原因：**

- `controlRect` 计算可能不准确
- `SelectionOverlay` 使用绝对定位，但坐标可能相对于错误的父元素
- `updateControlRect()` 可能没有在正确的时机调用

**解决方案：**

1. 检查 `DesignerControlRenderer.vue` 中的 `updateControlRect` 函数
2. 确保 `wrapperRef` 正确引用到包装元素
3. 验证 `SelectionOverlay` 的定位方式
4. 添加 `watch` 监听 `control` 变化，自动更新 rect
5. 考虑使用 `getBoundingClientRect()` 获取相对于视口的位置

**关键代码位置：**

- `src/core/renderer/designer/canvas/DesignerControlRenderer.vue` - 第 95-100 行
- `src/core/renderer/designer/canvas/SelectionOverlay.vue` - 第 60-65 行

**验证方法：**

1. 拖拽一个组件到画布
2. 点击选择该组件
3. 检查蓝色选择框是否完全包围组件
4. 检查 8 个调整手柄是否在正确位置

#### ✅ 任务 2: 修复属性更新问题（已完成）

**问题已解决！**

- ✅ 在布局面板修改宽度、高度时，组件会实时更新
- ✅ 所有样式配置都能正确生效
- ✅ 组件名称可以修改
- ✅ 组件特定属性（如按钮文字）可以修改

**解决方案：**

- 添加了 `convertToStyles` 函数，将 PropertiesPanel 发送的属性对象转换为 CSS styles
- 增强了 `handlePropertyUpdate` 函数，支持多种属性类型的处理
- 实现了深度合并逻辑，确保属性正确更新

**详细文档：**

- [属性更新修复方案](./PROPERTY_UPDATE_FIX.md)
- [属性更新测试指南](./PROPERTY_UPDATE_TEST_GUIDE.md)
- [属性更新完成报告](./PROPERTY_UPDATE_COMPLETE.md)

### 测试 3: 组件定义

1. 展开所有组件分类
2. 验证每个分类都有组件
3. 拖拽每种类型的组件
4. 验证都能成功添加到画布

## 成功标准

- ✅ 选择框完全包围组件，位置准确
- ✅ 修改宽度高度时组件实时更新
- ✅ 所有组件分类都有可用组件
- ✅ 控制台没有错误
- ✅ 用户体验流畅

## 参考文档

- [会话总结](./SESSION_SUMMARY.md)
- [拖拽测试指南](./DRAG_TEST_GUIDE.md)
- [最终状态报告](./FINAL_STATUS.md)
- [UI 布局修复](./UI_LAYOUT_FIX.md)
- [视觉问题修复](./VISUAL_FIXES.md)

## 预计时间

- 任务 1 (选择框): 30-45 分钟
- 任务 2 (属性更新): 20-30 分钟
- 任务 3 (组件定义): 30-45 分钟

**总计: 1.5-2 小时**

## 注意事项

1. **先修复选择框** - 这是最明显的问题
2. **测试每个修复** - 确保不引入新问题
3. **保留调试日志** - 暂时保留，便于排查
4. **增量提交** - 每完成一个任务就测试验证
5. **参考现有代码** - 查看 DesignerTest.vue 可能有参考实现

## 开始新会话时

请告诉 AI：

"我需要继续修复设计器的问题。请阅读 `.kiro/specs/designer-ui-transformation/NEXT_SESSION_TASKS.md` 文件，按照优先级修复以下问题：

1. 选择框位置不正确
2. 属性更新不生效
3. 某些组件分类为空

拖拽功能已经基本可以工作了。"
