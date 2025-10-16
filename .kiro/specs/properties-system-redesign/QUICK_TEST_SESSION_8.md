# 快速测试指南 - Session 8

## 🎯 测试目标

1. ✅ 调试开关按钮切换问题
2. ✅ 验证 Flex 布局配置在"布局样式"标签页显示
3. ✅ 验证所有容器组件（flex、grid、table）都有 Flex 布局配置

## 🚀 快速测试步骤

### 步骤 1: 启动开发服务器

```bash
npm run dev
```

### 步骤 2: 测试开关按钮调试信息

1. 打开浏览器控制台（F12）
2. 在设计器中添加一个**按钮组件**
3. 选中按钮，打开右侧属性面板
4. 找到"按钮属性"折叠框，展开
5. 点击"禁用状态"开关

**✅ 预期日志**：

```
[SwitchField] Switch toggled: disabled = true previous value: undefined
```

6. 再次点击"禁用状态"开关

**✅ 预期日志**：

```
[SwitchField] Switch toggled: disabled = false previous value: true
```

**❌ 如果看到问题**：

- `previous value` 始终是 `undefined` → modelValue 没有正确传递
- `previous value` 始终是 `true` → 值没有正确更新
- 请截图控制台日志并告诉我

### 步骤 3: 测试 Flex 容器的 Flex 布局配置

1. 在左侧组件库中找到"弹性布局"组件
2. 拖拽到画布上
3. 选中 Flex 容器
4. 打开右侧属性面板
5. 点击"布局样式"标签页（第二个标签）

**✅ 预期结果**：

- 看到"Flex布局"折叠框
- 展开后显示 FlexVisualizer、换行、间距字段

**❌ 如果没看到**：

- 检查是否在"基础属性"标签页（第一个标签）
- 如果在"基础属性"标签页看到，说明分组没有生效

### 步骤 4: 测试 Grid 容器的 Flex 布局配置

1. 在左侧组件库中找到"网格布局"组件
2. 拖拽到画布上
3. 选中 Grid 容器
4. 打开右侧属性面板
5. 点击"布局样式"标签页

**✅ 预期结果**：

- 看到"Flex布局"折叠框
- 展开后显示 FlexVisualizer、换行、间距字段

### 步骤 5: 测试 Table 容器的 Flex 布局配置

1. 在左侧组件库中找到"表格"组件
2. 拖拽到画布上
3. 选中 Table 容器
4. 打开右侧属性面板
5. 点击"基础属性"标签页

**✅ 预期结果**：

- 看到"表格属性"折叠框（原有的）

6. 点击"布局样式"标签页

**✅ 预期结果**：

- 看到"Flex布局"折叠框（新增的）
- 展开后显示 FlexVisualizer、换行、间距字段

### 步骤 6: 测试 FlexVisualizer 交互

对于任何容器组件（flex、grid、table）：

1. 选中容器
2. 打开"布局样式"标签页
3. 展开"Flex布局"折叠框
4. 点击主轴方向按钮（横向/纵向）

**✅ 预期结果**：

- 预览框实时更新
- 画布上的容器布局实时改变

5. 点击主轴对齐按钮

**✅ 预期结果**：

- 预览框实时更新
- 画布上的容器对齐方式实时改变

6. 修改间距值

**✅ 预期结果**：

- 预览框实时更新
- 画布上的容器子元素间距实时改变

## 🐛 调试命令

如果遇到问题，在浏览器控制台运行：

### 检查面板分组

```javascript
;(async () => {
  const { getPropertyPanelService } = await import('/src/core/infrastructure/services/index.ts')
  const service = getPropertyPanelService()

  console.log('=== Flex 容器 ===')
  const flexPanels = service.getPanelsForComponent('flex')
  flexPanels.forEach(p => console.log(`  ${p.group}: ${p.title}`))

  console.log('\n=== Grid 容器 ===')
  const gridPanels = service.getPanelsForComponent('grid')
  gridPanels.forEach(p => console.log(`  ${p.group}: ${p.title}`))

  console.log('\n=== Table 容器 ===')
  const tablePanels = service.getPanelsForComponent('table')
  tablePanels.forEach(p => console.log(`  ${p.group}: ${p.title}`))
})()
```

**✅ 预期输出**：

```
=== Flex 容器 ===
  basic: 基础属性
  layout: 布局样式
  style: 样式属性
  event: 事件
  flex: Flex布局  ← 应该是 'flex' 分组

=== Grid 容器 ===
  basic: 基础属性
  layout: 布局样式
  style: 样式属性
  event: 事件
  flex: Flex布局  ← 应该是 'flex' 分组

=== Table 容器 ===
  basic: 基础属性
  layout: 布局样式
  style: 样式属性
  event: 事件
  component: 表格属性  ← 在基础属性标签页
  flex: Flex布局  ← 在布局样式标签页
```

### 检查开关按钮的值传递

```javascript
// 在控制台查看选中组件的属性
window.__SELECTED_CONTROL__ = null

// 在 PropertiesPanel.vue 中添加这行（临时调试）
// watch(selectedComponent, (newVal) => { window.__SELECTED_CONTROL__ = newVal })

// 然后在控制台运行
console.log('Selected control props:', window.__SELECTED_CONTROL__?.props)
```

## 📝 测试清单

- [ ] 开关按钮第一次点击显示正确的日志
- [ ] 开关按钮第二次点击显示正确的日志（previous value 应该是 true）
- [ ] Flex 容器的"Flex布局"在"布局样式"标签页
- [ ] Grid 容器的"Flex布局"在"布局样式"标签页
- [ ] Table 容器的"Flex布局"在"布局样式"标签页
- [ ] Table 容器的"表格属性"在"基础属性"标签页
- [ ] FlexVisualizer 可以正常交互
- [ ] 主轴方向切换正常
- [ ] 主轴对齐切换正常
- [ ] 交叉轴对齐切换正常
- [ ] 间距修改正常
- [ ] 画布实时更新

## ✅ 全部通过？

恭喜！所有功能都正常工作。你可以：

1. 继续使用 Flex 布局配置来设计界面
2. 测试其他组件的属性面板
3. 测试属性的持久化

## ❌ 有问题？

请告诉我：

1. **开关按钮问题**：

   - 控制台显示的完整日志
   - `previous value` 的值是什么
   - 按钮的实际状态（是否变灰）

2. **Flex 布局配置问题**：

   - 哪个容器组件有问题（flex/grid/table）
   - "Flex布局"折叠框在哪个标签页显示
   - 是否完全没有显示

3. **FlexVisualizer 问题**：
   - 是否显示了 FlexVisualizer
   - 点击按钮是否有反应
   - 画布是否实时更新

我会根据你的反馈进一步调试！

## 🔍 常见问题

### Q1: "Flex布局"还是在"基础属性"标签页

**A**: 检查控制台是否有以下日志：

```
✅ Manually registered Flex panel configuration
[PanelRegistry] Component panel for "flex" is already registered. Overwriting.
```

如果有 "Overwriting" 警告，说明手动注册覆盖了 register.ts 中的配置。

**解决方案**：刷新页面（Ctrl+F5 强制刷新）

### Q2: Grid 或 Table 没有"Flex布局"

**A**: 运行调试命令检查面板是否注册：

```javascript
const service = await (await import('/src/core/infrastructure/services/index.ts')).getPropertyPanelService()
console.log(service.getPanelsForComponent('grid'))
```

如果没有 `flex` 分组的面板，说明注册失败。

### Q3: 开关按钮 previous value 始终是 undefined

**A**: 这说明 `modelValue` 没有正确传递。需要检查：

1. FieldRenderer 是否正确绑定 v-model
2. PanelGroup 是否正确传递 values
3. PropertiesPanel 是否正确合并 componentProps

我会帮你进一步调试这个问题。
