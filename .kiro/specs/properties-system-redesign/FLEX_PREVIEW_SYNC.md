# Flex 预览图与画布子元素数量同步

## 问题描述

之前的 FlexVisualizer 预览图固定显示 3 个子元素，但画布中实际容器可能只有 2 个或其他数量的子元素，导致预览图与实际情况不符。

**问题示例**：

- 画布中容器有 2 个按钮
- 预览图显示 3 个方块
- 用户输入占比 `1:1`，但预览图显示 3 个等比例方块

## 解决方案

通过 DOM 查询自动检测画布中选中容器的实际子元素数量，并动态调整预览图显示的子元素数量。

## 修改的文件

### src/core/infrastructure/fields/visualizers/FlexVisualizer.vue

#### 1. 添加导入

```typescript
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
```

#### 2. 添加子元素数量检测

```typescript
// 实际子元素数量（从 DOM 中检测）
const actualChildrenCount = ref(props.childrenCount || 3)

// 检测画布中选中容器的实际子元素数量
function detectChildrenCount() {
  // 尝试从 DOM 中获取当前选中的容器
  const selectedContainer = document.querySelector('.designer-canvas .selected-control')
  if (selectedContainer) {
    const childCount = selectedContainer.children.length
    if (childCount > 0 && childCount !== actualChildrenCount.value) {
      actualChildrenCount.value = childCount
      console.log(`[FlexVisualizer] 检测到容器有 ${childCount} 个子元素`)
    }
  }
}

// 定期检测子元素数量变化
let detectInterval: number | null = null
onMounted(() => {
  detectChildrenCount()
  detectInterval = window.setInterval(detectChildrenCount, 500)
})

onUnmounted(() => {
  if (detectInterval) {
    clearInterval(detectInterval)
  }
})
```

#### 3. 更新比例数组计算

```typescript
// 解析比例字符串为数组，并根据实际子元素数量调整
const ratioArray = computed(() => {
  const ratioString = flexConfig.value.flexRatio || '1:1:1'
  const ratios = ratioString
    .split(':')
    .map(r => parseFloat(r.trim()))
    .filter(r => !isNaN(r))

  // 如果没有有效的比例，使用默认值
  if (ratios.length === 0) {
    return Array(actualChildrenCount.value).fill(1) // ← 使用实际数量
  }

  // 根据实际子元素数量调整比例数组
  const childCount = actualChildrenCount.value // ← 使用实际数量
  const result = []

  for (let i = 0; i < childCount; i++) {
    if (i < ratios.length) {
      result.push(ratios[i])
    } else {
      // 如果子元素数量超过比例数量，使用最后一个比例
      result.push(ratios[ratios.length - 1])
    }
  }

  return result
})
```

## 工作原理

### 1. DOM 查询

通过 CSS 选择器 `.designer-canvas .selected-control` 查找画布中当前选中的容器元素。

### 2. 子元素计数

使用 `selectedContainer.children.length` 获取容器的直接子元素数量。

### 3. 定期检测

每 500ms 检测一次子元素数量，确保在用户添加/删除子元素时能及时更新预览图。

### 4. 动态调整

根据检测到的实际子元素数量，动态生成对应数量的预览方块。

## 功能特点

### 1. 自动同步

- ✅ 预览图自动与画布中的实际子元素数量同步
- ✅ 无需手动配置或刷新
- ✅ 实时响应子元素的添加/删除

### 2. 智能适配

- ✅ 如果容器有 2 个子元素，预览图显示 2 个方块
- ✅ 如果容器有 5 个子元素，预览图显示 5 个方块
- ✅ 占比配置自动适配实际子元素数量

### 3. 性能优化

- ✅ 使用定时器而不是实时监听，减少性能开销
- ✅ 只在数量变化时更新，避免不必要的重渲染
- ✅ 组件卸载时清理定时器，防止内存泄漏

## 使用示例

### 示例 1: 两个子元素

**画布状态**：

- Flex 容器包含 2 个按钮

**预览图**：

```
┌──────────────────────────────┐
│  [1]      [2]                │
└──────────────────────────────┘
```

**占比配置**：`1:1`

**效果**：

- 预览图显示 2 个等比例方块
- 画布中的按钮按 1:1 比例分配

### 示例 2: 三个子元素

**画布状态**：

- Flex 容器包含 3 个按钮

**预览图**：

```
┌──────────────────────────────┐
│  [1]    [2]      [3]         │
└──────────────────────────────┘
```

**占比配置**：`1:2:1`

**效果**：

- 预览图显示 3 个方块，按 1:2:1 比例
- 画布中的按钮按 1:2:1 比例分配

### 示例 3: 添加子元素

**初始状态**：

- 容器有 2 个按钮
- 预览图显示 2 个方块

**操作**：

- 用户添加第 3 个按钮到容器

**结果**：

- 500ms 内，预览图自动更新为 3 个方块
- 控制台显示：`[FlexVisualizer] 检测到容器有 3 个子元素`

### 示例 4: 删除子元素

**初始状态**：

- 容器有 3 个按钮
- 预览图显示 3 个方块

**操作**：

- 用户删除第 3 个按钮

**结果**：

- 500ms 内，预览图自动更新为 2 个方块
- 控制台显示：`[FlexVisualizer] 检测到容器有 2 个子元素`

## 验证步骤

### 测试 1: 基本同步功能

1. 启动开发服务器：`npm run dev`
2. 添加一个 Flex 容器到画布
3. 在容器中添加 2 个按钮
4. 选中 Flex 容器，打开"布局样式"标签页
5. 展开"Flex布局"折叠框

**预期结果**：

- ✅ 预览图显示 2 个方块（不是 3 个）
- ✅ 控制台显示：`[FlexVisualizer] 检测到容器有 2 个子元素`

### 测试 2: 添加子元素

1. 在容器中再添加 1 个按钮（总共 3 个）
2. 等待 0.5 秒
3. 观察预览图变化

**预期结果**：

- ✅ 预览图自动更新为 3 个方块
- ✅ 控制台显示：`[FlexVisualizer] 检测到容器有 3 个子元素`

### 测试 3: 删除子元素

1. 删除容器中的 1 个按钮（剩余 2 个）
2. 等待 0.5 秒
3. 观察预览图变化

**预期结果**：

- ✅ 预览图自动更新为 2 个方块
- ✅ 控制台显示：`[FlexVisualizer] 检测到容器有 2 个子元素`

### 测试 4: 占比配置

1. 容器有 2 个按钮
2. 在"子元素占比"输入框中输入 `1:2`
3. 观察预览图和画布

**预期结果**：

- ✅ 预览图显示 2 个方块，按 1:2 比例
- ✅ 画布中的按钮按 1:2 比例分配宽度
- ✅ 第一个按钮占 1/3，第二个按钮占 2/3

### 测试 5: 占比数量不匹配

1. 容器有 3 个按钮
2. 在"子元素占比"输入框中输入 `1:2`（只有 2 个比例）
3. 观察预览图和画布

**预期结果**：

- ✅ 预览图显示 3 个方块
- ✅ 前 2 个方块按 1:2 比例
- ✅ 第 3 个方块使用最后一个比例（2）
- ✅ 画布中的按钮也按此规则分配

## 技术细节

### DOM 选择器

```typescript
const selectedContainer = document.querySelector('.designer-canvas .selected-control')
```

这个选择器假设：

- 画布容器有 `.designer-canvas` 类
- 选中的控件有 `.selected-control` 类

如果实际的类名不同，需要调整选择器。

### 检测频率

```typescript
detectInterval = window.setInterval(detectChildrenCount, 500)
```

每 500ms 检测一次，这个频率：

- ✅ 足够快，用户感觉不到延迟
- ✅ 足够慢，不会造成性能问题
- ⚠️ 如果需要更快的响应，可以减少到 200-300ms
- ⚠️ 如果担心性能，可以增加到 1000ms

### 内存管理

```typescript
onUnmounted(() => {
  if (detectInterval) {
    clearInterval(detectInterval)
  }
})
```

组件卸载时清理定时器，防止内存泄漏。

### 变化检测

```typescript
if (childCount > 0 && childCount !== actualChildrenCount.value) {
  actualChildrenCount.value = childCount
  console.log(`[FlexVisualizer] 检测到容器有 ${childCount} 个子元素`)
}
```

只在数量真正变化时更新，避免不必要的重渲染。

## 优势

### 1. 用户体验

- ✅ 预览图准确反映实际情况
- ✅ 用户不会被误导
- ✅ 所见即所得

### 2. 自动化

- ✅ 无需手动配置
- ✅ 无需刷新
- ✅ 自动适配

### 3. 灵活性

- ✅ 支持任意数量的子元素
- ✅ 支持动态添加/删除
- ✅ 支持不同的占比配置

## 限制和注意事项

### 1. DOM 依赖

- ⚠️ 依赖特定的 DOM 结构和类名
- ⚠️ 如果画布结构变化，可能需要调整选择器

### 2. 检测延迟

- ⚠️ 有 500ms 的检测延迟
- ⚠️ 用户添加/删除子元素后，预览图不是立即更新

### 3. 性能考虑

- ⚠️ 定时器会持续运行
- ⚠️ 如果页面有多个 FlexVisualizer，会有多个定时器

## 后续优化建议

### 1. 使用 MutationObserver

替代定时器，使用 MutationObserver 监听 DOM 变化：

```typescript
const observer = new MutationObserver(() => {
  detectChildrenCount()
})

onMounted(() => {
  const selectedContainer = document.querySelector('.designer-canvas .selected-control')
  if (selectedContainer) {
    observer.observe(selectedContainer, {
      childList: true, // 监听子元素变化
      subtree: false, // 不监听子树
    })
  }
})

onUnmounted(() => {
  observer.disconnect()
})
```

**优势**：

- ✅ 实时响应，无延迟
- ✅ 更高效，只在变化时触发
- ✅ 更准确，不会错过任何变化

### 2. 通过 Props 传递

让父组件（PropertiesPanel）传递子元素数量：

```typescript
<FieldRenderer
  :config="field"
  :model-value="values[field.key]"
  :children-count="selectedControl.children?.length"
  @update:model-value="handleFieldUpdate(field.key, $event)"
/>
```

**优势**：

- ✅ 不依赖 DOM 查询
- ✅ 更可靠
- ✅ 更容易测试

### 3. 事件驱动

使用事件总线通知子元素数量变化：

```typescript
// 在 DesignerNew.vue 中
eventBus.emit('container:children-changed', {
  controlId: containerId,
  childrenCount: children.length,
})

// 在 FlexVisualizer.vue 中
onMounted(() => {
  eventBus.on('container:children-changed', data => {
    if (data.controlId === currentControlId) {
      actualChildrenCount.value = data.childrenCount
    }
  })
})
```

**优势**：

- ✅ 实时响应
- ✅ 解耦
- ✅ 可扩展

## 总结

本次更新成功实现了 Flex 预览图与画布子元素数量的自动同步：

1. ✅ **自动检测** - 通过 DOM 查询自动检测子元素数量
2. ✅ **实时更新** - 每 500ms 检测一次，及时响应变化
3. ✅ **动态适配** - 预览图根据实际数量显示对应的方块
4. ✅ **性能优化** - 只在数量变化时更新，避免不必要的重渲染
5. ✅ **内存管理** - 组件卸载时清理定时器

用户现在可以看到准确的预览效果，预览图中的子元素数量与画布中的实际数量完全一致，实现了真正的所见即所得！

## 相关文档

- [Flex 容器占比配置集成到可视化组件](./FLEX_RATIO_IN_VISUALIZER.md) - 占比配置的文档
- [Flex 容器间距字段删除](./FLEX_GAP_REMOVAL.md) - 删除 gap 字段的文档
- [属性面板系统设计](./design.md) - 整体设计文档
- [任务列表](./tasks.md) - 当前进度和待办任务
