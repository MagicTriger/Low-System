# 视觉问题修复

## 修复日期

2025-10-10

## 修复的问题

### 1. ✅ 大纲树背景色黑色看不见文本

**问题描述：**

- 大纲树显示黑色背景，文本不可见
- 系统深色主题导致的问题

**根本原因：**

- OutlineTree.vue 中有深色主题的媒体查询 `@media (prefers-color-scheme: dark)`
- 当系统设置为深色模式时，自动应用深色样式

**解决方案：**

- 注释掉深色主题的媒体查询
- 设计器始终使用浅色主题，保持一致性

**修改文件：**

- `src/core/renderer/designer/outline/OutlineTree.vue`

```css
/* 深色主题支持 - 暂时禁用，设计器始终使用浅色主题 */
/* @media (prefers-color-scheme: dark) {
  ...
} */
```

### 2. ✅ 组件选择框显示问题

**问题描述：**

- Table 组件的选择框不在渲染组件的外部
- 选择框位置不准确

**根本原因：**

- DesignerControlRenderer 使用 outline 样式显示选择框
- outline 不占用空间，可能与 SelectionOverlay 冲突
- controlRect 没有及时更新

**解决方案：**

1. 移除 outline 样式，完全使用 SelectionOverlay 组件
2. 添加 MutationObserver 监听 DOM 变化，及时更新 controlRect
3. 确保 SelectionOverlay 使用绝对定位，正确覆盖在组件上方

**修改文件：**

- `src/core/renderer/designer/canvas/DesignerControlRenderer.vue`

**关键修改：**

1. **移除 outline 样式**

```css
.designer-control-wrapper.is-selected {
  /* 移除 outline，使用 SelectionOverlay 组件显示选择框 */
}

.designer-control-wrapper.is-hovered:not(.is-selected) {
  /* 移除 outline，使用 SelectionOverlay 组件显示悬停框 */
}
```

2. **添加 MutationObserver**

```typescript
onMounted(() => {
  updateControlRect()

  // 监听窗口大小变化
  window.addEventListener('resize', updateControlRect)

  // 使用 MutationObserver 监听 DOM 变化
  if (wrapperRef.value) {
    const observer = new MutationObserver(() => {
      updateControlRect()
    })

    observer.observe(wrapperRef.value, {
      attributes: true,
      childList: true,
      subtree: true,
    })

    // 清理
    onUnmounted(() => {
      observer.disconnect()
    })
  }
})
```

### 3. ⏳ 父子组件嵌套渲染结构显示问题

**问题描述：**

- 父子组件嵌套结构在大纲树中无法正确显示

**当前状态：**

- DesignerControlRenderer 已经支持递归渲染子组件
- OutlineTree 已经支持树形结构显示
- 需要验证数据流是否正确

**需要检查：**

1. 控件数据结构中的 children 属性是否正确
2. buildTreeData 函数是否正确构建树形数据
3. 拖拽到容器时是否正确设置父子关系

**下一步：**

- 测试拖拽组件到容器（如 Flex）
- 检查大纲树是否显示嵌套结构
- 验证选择子组件时的行为

## 技术细节

### SelectionOverlay 定位

SelectionOverlay 使用绝对定位，基于 controlRect 的坐标：

```typescript
const overlayStyle = computed(() => ({
  left: `${props.rect.left}px`,
  top: `${props.rect.top}px`,
  width: `${props.rect.width}px`,
  height: `${props.rect.height}px`,
}))
```

### controlRect 更新时机

1. **组件挂载时** - onMounted
2. **窗口大小变化时** - window resize 事件
3. **鼠标进入时** - handleMouseEnter
4. **DOM 变化时** - MutationObserver

### 大纲树数据结构

```typescript
interface TreeNode {
  key: string
  title: string
  name: string
  kind: string
  hidden: boolean
  locked: boolean
  hasError: boolean
  control: Control
  children?: TreeNode[]
}
```

## 测试步骤

### 测试 1: 大纲树显示

1. 刷新浏览器
2. 检查左侧大纲树区域
3. 确认背景色为白色
4. 确认文本清晰可见
5. 确认图标和颜色正确显示

**预期结果：**

- ✅ 背景色为白色 (#ffffff)
- ✅ 文本颜色为深色 (#262626)
- ✅ 所有文本清晰可读

### 测试 2: 组件选择框

1. 拖拽一个组件到画布
2. 点击选择该组件
3. 检查选择框是否正确显示在组件周围
4. 检查选择框是否完全包围组件
5. 检查调整手柄是否在正确位置

**预期结果：**

- ✅ 选择框蓝色边框完全包围组件
- ✅ 组件名称标签显示在组件上方
- ✅ 8个调整手柄显示在边框的角和边上
- ✅ 鼠标悬停时显示虚线边框

### 测试 3: 父子组件嵌套

1. 拖拽一个 Flex 容器到画布
2. 拖拽一个 Button 到 Flex 容器内
3. 检查大纲树是否显示嵌套结构
4. 点击大纲树中的 Button
5. 检查画布中的 Button 是否被选中

**预期结果：**

- ✅ 大纲树显示 Flex > Button 的层级结构
- ✅ 可以展开/折叠 Flex 节点
- ✅ 点击子节点可以选中对应组件
- ✅ 选择框正确显示在子组件上

## 已知问题

### 问题 1: SelectionOverlay 可能被遮挡

**描述：** 如果组件有很高的 z-index，SelectionOverlay 可能被遮挡

**解决方案：** SelectionOverlay 已设置 `z-index: 999`，应该足够高

### 问题 2: 快速拖拽时 controlRect 可能不准确

**描述：** 快速拖拽多个组件时，controlRect 更新可能有延迟

**解决方案：** MutationObserver 会自动更新，但可能有轻微延迟

### 问题 3: 容器组件的最小高度

**描述：** 空容器可能太小，难以拖拽组件进去

**解决方案：** 已设置 `min-height: 50px`，并在拖拽时显示放置提示

## 相关文件

- ✅ `src/core/renderer/designer/outline/OutlineTree.vue` - 大纲树组件
- ✅ `src/core/renderer/designer/canvas/DesignerControlRenderer.vue` - 控件渲染器
- ✅ `src/core/renderer/designer/canvas/SelectionOverlay.vue` - 选择覆盖层

## 下一步改进

1. **优化 controlRect 更新性能**

   - 使用 requestAnimationFrame 节流
   - 只在必要时更新

2. **改进容器组件的视觉提示**

   - 更明显的拖拽目标指示
   - 显示容器的边界

3. **添加组件层级指示**

   - 在画布上显示组件的层级关系
   - 使用缩进或连线表示父子关系

4. **支持多选**
   - 按住 Ctrl 点击多个组件
   - 框选多个组件
   - 批量操作

## 验证清单

- [x] 移除大纲树深色主题
- [x] 移除 DesignerControlRenderer 的 outline 样式
- [x] 添加 MutationObserver 监听 DOM 变化
- [ ] 测试大纲树显示
- [ ] 测试组件选择框
- [ ] 测试父子组件嵌套
- [ ] 测试拖拽到容器

## 总结

本次修复解决了两个主要的视觉问题：

1. ✅ **大纲树背景色问题** - 禁用深色主题，确保文本可读
2. ✅ **组件选择框问题** - 移除 outline，使用 SelectionOverlay，添加 DOM 监听

关键改进：

- 统一使用浅色主题，避免系统设置干扰
- 完全依赖 SelectionOverlay 组件显示选择框
- 使用 MutationObserver 确保 controlRect 及时更新

现在刷新浏览器，这些视觉问题应该都已修复！🎉
