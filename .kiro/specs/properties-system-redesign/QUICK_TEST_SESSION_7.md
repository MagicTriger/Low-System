# 快速测试指南 - Session 7

## 🎯 测试目标

验证两个修复：

1. ✅ 开关按钮可以正常切换（禁用/启用）
2. ✅ Flex 容器显示"Flex布局"配置面板

## 🚀 快速测试步骤

### 步骤 1: 启动开发服务器

```bash
npm run dev
```

### 步骤 2: 测试开关按钮

1. 打开浏览器控制台（F12）
2. 在设计器中添加一个**按钮组件**
3. 选中按钮，打开右侧属性面板
4. 找到"按钮属性"折叠框，展开
5. 点击"禁用状态"开关

**✅ 预期结果**：

- 控制台显示：`[SwitchField] Switch toggled: disabled = true`
- 开关变为蓝色
- 画布上的按钮变为灰色（禁用）

6. 再次点击"禁用状态"开关

**✅ 预期结果**：

- 控制台显示：`[SwitchField] Switch toggled: disabled = false`
- 开关变为灰色
- 画布上的按钮恢复正常

### 步骤 3: 测试 Flex 容器面板

1. 在左侧组件库中找到"弹性布局"组件
2. 拖拽到画布上
3. 选中 Flex 容器
4. 打开右侧属性面板
5. 点击"基础属性"标签页

**✅ 预期结果**：

- 看到"基础属性"折叠框
- 看到"Flex布局"折叠框 ← **这是新增的！**

6. 展开"Flex布局"折叠框

**✅ 预期结果**：

- 显示"Flex配置"可视化组件
- 显示"换行"下拉选择器
- 显示"间距"数字输入框

7. 测试 Flex 配置交互

**✅ 预期结果**：

- 可以点击主轴方向按钮（横向/纵向）
- 可以点击对齐方式按钮
- 预览框实时更新
- 画布上的 Flex 容器实时更新

## 🐛 如果测试失败

### 问题 1: 开关按钮不能切换

**检查**：

- 控制台是否有 `[SwitchField] Switch toggled:` 日志？
- 如果没有，检查 `src/core/infrastructure/fields/renderers/SwitchField.vue`

### 问题 2: Flex 面板不显示

**检查**：
在浏览器控制台运行：

```javascript
;(async () => {
  const { getPropertyPanelService } = await import('/src/core/infrastructure/services/index.ts')
  const service = getPropertyPanelService()
  const panels = service.getPanelsForComponent('flex')
  console.log(
    'Flex panels:',
    panels.map(p => p.title)
  )

  const hasFlexPanel = panels.some(p => p.title === 'Flex布局')
  console.log(hasFlexPanel ? '✅ Flex panel registered' : '❌ Flex panel NOT registered')
})()
```

**如果显示 "❌ Flex panel NOT registered"**：

1. 检查控制台是否有 `✅ Manually registered Flex panel configuration` 日志
2. 如果没有，检查 `src/modules/designer/main.ts` 的修改是否正确
3. 尝试刷新页面（Ctrl+F5 强制刷新）

### 问题 3: FlexVisualizer 不显示

**检查**：

- 确认 `src/core/infrastructure/fields/visualizers/FlexVisualizer.vue` 文件存在
- 确认 visualizer 已注册到 PropertyPanelService

## 📝 测试清单

- [ ] 开关按钮第一次点击可以禁用
- [ ] 开关按钮第二次点击可以启用
- [ ] 控制台显示开关切换日志
- [ ] Flex 容器显示"Flex布局"折叠框
- [ ] "Flex布局"折叠框可以展开
- [ ] FlexVisualizer 可视化组件显示
- [ ] 换行下拉选择器显示
- [ ] 间距数字输入框显示
- [ ] FlexVisualizer 交互正常
- [ ] 画布实时更新

## ✅ 全部通过？

恭喜！两个问题都已修复。你可以：

1. 继续测试其他组件的属性面板
2. 测试属性的持久化（刷新页面后属性是否保留）
3. 测试属性的实时更新（修改属性后画布是否立即更新）

## ❌ 有问题？

请告诉我：

1. 哪个测试失败了？
2. 控制台有什么错误信息？
3. 截图或描述看到的现象

我会帮你进一步调试！
