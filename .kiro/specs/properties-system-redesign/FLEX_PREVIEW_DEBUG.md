# Flex 预览图调试指南

## 问题描述

容器组件的布局预览图与画布中的实际子元素数量不对应。

## 已添加的调试功能

### 1. 多种 DOM 选择器

现在会尝试多种选择器来查找选中的容器：

```typescript
const selectors = [
  '.designer-canvas .selected-control',
  '.designer-canvas .control-selected',
  '.designer-canvas .active-control',
  '.designer-canvas [data-selected="true"]',
  '.canvas-container .selected',
  '.control-wrapper.selected',
  '[data-control-selected="true"]',
]
```

### 2. 详细的日志输出

现在会输出以下调试信息：

- 使用的选择器
- 容器的所有子元素数量
- 过滤掉的辅助元素
- 过滤后的实际子元素数量
- 预览图更新信息

## 调试步骤

### 步骤 1: 启动开发服务器

```bash
npm run dev
```

### 步骤 2: 打开浏览器控制台

按 F12 打开开发者工具，切换到 Console 标签页。

### 步骤 3: 添加容器和子元素

1. 在组件库中找到"弹性布局"（Flex）组件
2. 拖拽到画布上
3. 在 Flex 容器中添加 2 个按钮组件

### 步骤 4: 选中容器并查看日志

1. 选中 Flex 容器
2. 打开属性面板
3. 点击"布局样式"标签页
4. 展开"Flex布局"折叠框
5. 查看控制台日志

### 预期日志输出

```
[FlexVisualizer] 找到选中容器，使用选择器: .designer-canvas .selected-control
[FlexVisualizer] 容器所有子元素: 2 [div.button-component, div.button-component]
[FlexVisualizer] 过滤后的实际子元素数量: 2
[FlexVisualizer] 更新预览图显示 2 个子元素
```

### 如果看到不同的日志

#### 情况 1: 未找到选中的容器

```
[FlexVisualizer] 未找到选中的容器，尝试的选择器: [...]
```

**原因**：画布中选中容器的 CSS 类名与预期不符。

**解决方法**：

1. 在控制台运行以下命令，查看实际的 DOM 结构：

```javascript
// 查找所有可能的容器元素
document.querySelectorAll('[class*="select"]').forEach(el => {
  console.log('Element:', el, 'Classes:', el.className)
})
```

2. 找到选中容器的实际类名
3. 将类名添加到 `selectors` 数组中

#### 情况 2: 子元素数量不对

```
[FlexVisualizer] 容器所有子元素: 5 [...]
[FlexVisualizer] 过滤掉辅助元素: resize-handle
[FlexVisualizer] 过滤掉辅助元素: selection-outline
[FlexVisualizer] 过滤掉辅助元素: control-actions
[FlexVisualizer] 过滤后的实际子元素数量: 2
```

**原因**：容器中包含辅助元素（如调整手柄、选择框等）。

**解决方法**：

1. 查看日志中过滤掉的元素类名
2. 确认过滤规则是否正确
3. 如果有新的辅助元素类名，添加到过滤规则中

#### 情况 3: 预览图数量还是不对

```
[FlexVisualizer] 过滤后的实际子元素数量: 2
[FlexVisualizer] 更新预览图显示 2 个子元素
```

但预览图还是显示 3 个方块。

**原因**：`actualChildrenCount` 没有正确更新到 `ratioArray`。

**解决方法**：

1. 在控制台运行以下命令，检查响应式状态：

```javascript
// 查找 FlexVisualizer 组件实例
const flexVisualizer = document.querySelector('.flex-visualizer').__vueParentComponent
console.log('actualChildrenCount:', flexVisualizer.ctx.actualChildrenCount)
console.log('ratioArray:', flexVisualizer.ctx.ratioArray)
```

2. 确认 `actualChildrenCount` 的值是否正确
3. 确认 `ratioArray` 是否使用了 `actualChildrenCount`

## 手动测试命令

### 命令 1: 查找选中的容器

在浏览器控制台运行：

```javascript
// 尝试所有选择器
const selectors = [
  '.designer-canvas .selected-control',
  '.designer-canvas .control-selected',
  '.designer-canvas .active-control',
  '.designer-canvas [data-selected="true"]',
  '.canvas-container .selected',
  '.control-wrapper.selected',
  '[data-control-selected="true"]',
]

selectors.forEach(selector => {
  const el = document.querySelector(selector)
  if (el) {
    console.log('✅ 找到:', selector, el)
    console.log('   子元素数量:', el.children.length)
    console.log('   子元素:', Array.from(el.children))
  } else {
    console.log('❌ 未找到:', selector)
  }
})
```

### 命令 2: 查看画布结构

```javascript
// 查看画布的 DOM 结构
const canvas = document.querySelector('.designer-canvas') || document.querySelector('.canvas-container')
if (canvas) {
  console.log('画布元素:', canvas)
  console.log('画布子元素:', Array.from(canvas.children))

  // 查找所有包含 "select" 的类名
  canvas.querySelectorAll('[class*="select"]').forEach(el => {
    console.log('选中元素:', el.className, el)
  })
}
```

### 命令 3: 实时监听子元素变化

```javascript
// 监听容器子元素变化
const container = document.querySelector('.designer-canvas .selected-control')
if (container) {
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList') {
        console.log('子元素变化:', {
          添加: mutation.addedNodes.length,
          删除: mutation.removedNodes.length,
          当前总数: container.children.length,
        })
      }
    })
  })

  observer.observe(container, {
    childList: true,
    subtree: false,
  })

  console.log('✅ 已开始监听容器子元素变化')
}
```

## 常见问题

### Q1: 为什么预览图总是显示 3 个方块？

**A**: 可能的原因：

1. **DOM 选择器不正确** - 没有找到选中的容器
2. **检测频率太慢** - 500ms 的检测间隔可能不够快
3. **响应式更新失败** - `actualChildrenCount` 更新了但 `ratioArray` 没有重新计算

**解决方法**：

- 查看控制台日志，确认是否找到了选中的容器
- 尝试手动刷新页面
- 检查 `ratioArray` 的计算逻辑

### Q2: 为什么添加子元素后预览图不更新？

**A**: 可能的原因：

1. **检测延迟** - 需要等待 500ms
2. **DOM 结构变化** - 子元素不是直接添加到容器中
3. **过滤规则太严格** - 实际的子元素被过滤掉了

**解决方法**：

- 等待 0.5 秒后再检查
- 查看控制台日志，确认子元素数量是否正确
- 检查过滤规则是否过滤掉了实际的子元素

### Q3: 为什么控制台没有任何日志？

**A**: 可能的原因：

1. **组件没有挂载** - FlexVisualizer 组件没有渲染
2. **定时器没有启动** - `onMounted` 没有执行
3. **控制台过滤** - 日志被过滤掉了

**解决方法**：

- 确认"Flex布局"折叠框已展开
- 检查控制台过滤设置
- 刷新页面重试

## 下一步优化

如果调试后发现问题，可以考虑以下优化：

### 1. 使用 MutationObserver

替代定时器，实时监听 DOM 变化：

```typescript
const observer = new MutationObserver(() => {
  detectChildrenCount()
})

onMounted(() => {
  const canvas = document.querySelector('.designer-canvas')
  if (canvas) {
    observer.observe(canvas, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-selected'],
    })
  }
})
```

### 2. 通过 Props 传递

让父组件传递子元素数量：

```vue
<!-- PropertiesPanel.vue -->
<FieldRenderer
  :config="field"
  :model-value="values[field.key]"
  :children-count="selectedControl?.children?.length"
  @update:model-value="handleFieldUpdate(field.key, $event)"
/>
```

### 3. 使用事件总线

通过事件通知子元素数量变化：

```typescript
// 在添加/删除子元素时
eventBus.emit('container:children-changed', {
  controlId: container.id,
  childrenCount: container.children.length,
})
```

## 总结

本次更新添加了详细的调试日志，帮助定位预览图不准确的问题：

1. ✅ **多种选择器** - 尝试多种方式查找选中的容器
2. ✅ **详细日志** - 输出完整的检测过程
3. ✅ **过滤辅助元素** - 排除设计器辅助元素
4. ✅ **调试命令** - 提供手动测试命令

请按照调试步骤操作，查看控制台日志，找出具体的问题原因！
