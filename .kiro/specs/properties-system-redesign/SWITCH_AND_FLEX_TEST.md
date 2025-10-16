# 开关按钮和 Flex 容器测试指南

## 测试目标

验证以下两个修复是否正常工作：

1. 开关按钮的切换功能（第一次禁用，第二次启用）
2. Flex 容器的布局配置折叠框

## 快速测试步骤

### 测试 1: 开关按钮切换

1. 启动开发服务器：`npm run dev`
2. 打开浏览器控制台（F12）
3. 在设计器中添加一个按钮组件
4. 选中按钮，打开属性面板
5. 找到"按钮属性"折叠框并展开
6. 点击"禁用状态"开关

**预期结果**：

- ✅ 控制台显示：`[SwitchField] Switch toggled: disabled = true`
- ✅ 开关变为蓝色（选中状态）
- ✅ 画布上的按钮变为灰色（禁用状态）

7. 再次点击"禁用状态"开关

**预期结果**：

- ✅ 控制台显示：`[SwitchField] Switch toggled: disabled = false`
- ✅ 开关变为灰色（未选中状态）
- ✅ 画布上的按钮恢复正常（可点击）

### 测试 2: Flex 容器配置

1. 在组件库中找到"弹性布局"组件
2. 拖拽到画布上
3. 选中 Flex 容器
4. 打开属性面板

**预期结果**：

- ✅ 显示"基础属性"、"布局样式"、"样式属性"、"事件"等面板
- ✅ 显示"Flex布局"自定义面板

5. 展开"Flex布局"面板

**预期结果**：

- ✅ 显示"Flex配置"字段（FlexVisualizer）
- ✅ 显示"换行"下拉选择器
- ✅ 显示"间距"数字输入框

6. 测试 FlexVisualizer 交互

**预期结果**：

- ✅ 可以点击主轴方向按钮（横向/纵向）
- ✅ 可以点击主轴对齐按钮
- ✅ 可以点击交叉轴对齐按钮
- ✅ 预览框实时更新
- ✅ 画布上的 Flex 容器实时更新

## 如果测试失败

### 问题 1: 开关按钮不能切换

**检查步骤**：

1. 确认控制台是否有 `[SwitchField] Switch toggled:` 日志
2. 如果没有日志，检查 `src/core/infrastructure/fields/renderers/SwitchField.vue`
3. 如果有日志但状态不更新，检查 `src/modules/designer/views/DesignerNew.vue` 的 `handlePropertyUpdate` 函数

### 问题 2: Flex 布局面板不显示

**检查步骤**：

1. 确认选中的是 Flex 容器（kind: 'flex'）
2. 检查 `src/core/renderer/controls/register.ts` 中的 Flex 容器配置
3. 检查控制台是否有错误信息

## 相关文件

- `src/core/renderer/controls/register.ts` - 组件配置（开关 span 和 Flex 面板）
- `src/core/infrastructure/fields/renderers/SwitchField.vue` - 开关字段（添加了日志）
- `src/modules/designer/views/DesignerNew.vue` - 属性更新处理（flexConfig 处理）
- `src/core/infrastructure/fields/visualizers/FlexVisualizer.vue` - Flex 可视化组件

## 下一步

测试完成后，请告诉我：

1. 哪些测试通过了 ✅
2. 哪些测试失败了 ❌
3. 控制台是否有任何错误信息

我会根据测试结果进行进一步的修复。
