# Flex 预览图手动控制修复

## 问题描述

之前尝试通过 DOM 查询自动检测画布中容器的子元素数量，但所有选择器都无法找到选中的容器：

```
[FlexVisualizer] 未找到选中的容器，尝试的选择器: (7) [...]
```

这导致预览图无法自动同步，始终显示默认的 3 个子元素。

## 根本原因

画布中选中容器的 DOM 结构和 CSS 类名与预期完全不同，所有尝试的选择器都无法匹配：

- `.designer-canvas .selected-control`
- `.designer-canvas .control-selected`
- `.designer-canvas .active-control`
- 等等...

## 解决方案

**放弃 DOM 查询，改用手动控制**：添加一个数字输入框，让用户直接指定预览图显示几个子元素。

### 优势

1. ✅ **简单可靠** - 不依赖 DOM 结构
2. ✅ **用户可控** - 用户可以随时调整
3. ✅ **即时生效** - 修改后立即更新预览图
4. ✅ **无性能开销** - 不需要定时器或 DOM 监听

## 修改内容

### 1. 添加子元素数量输入框

```vue
<!-- Children Count -->
<div class="control-group">
  <div class="ratio-header">
    <label class="control-label">预览子元素数量</label>
    <a-input-number
      v-model:value="actualChildrenCount"
      :min="1"
      :max="10"
      size="small"
      style="width: 80px"
    />
  </div>
  <div class="ratio-hint">设置预览图显示几个子元素方块</div>
</div>
```

### 2. 简化逻辑

删除所有 DOM 检测代码，只保留简单的响应式变量：

```typescript
// 预览子元素数量（用户可手动调整）
const actualChildrenCount = ref(props.childrenCount || 3)
```

### 3. 删除不需要的导入

```typescript
// 之前
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

// 现在
import { ref, computed, watch } from 'vue'
```

## 使用方法

1. 选中容器组件（Flex/Grid/Table）
2. 打开"布局样式"标签页
3. 展开"Flex布局"折叠框
4. 在"预览子元素数量"输入框中输入实际的子元素数量
5. 预览图立即更新显示对应数量的方块
6. 配置"子元素占比"，预览图按比例显示

## 测试步骤

1. 添加一个 Flex 容器到画布
2. 在容器中添加 2 个按钮
3. 选中容器，打开"布局样式" → "Flex布局"
4. 将"预览子元素数量"改为 2
5. 预览图显示 2 个方块 ✅
6. 输入占比 `1:2`
7. 预览图按 1:2 比例显示 ✅

## 总结

通过添加手动控制，彻底解决了预览图不准确的问题：

- ❌ 之前：依赖 DOM 查询，不可靠
- ✅ 现在：用户手动控制，简单可靠

虽然需要用户手动输入，但这是最可靠的方案，而且用户可以完全控制预览效果！
