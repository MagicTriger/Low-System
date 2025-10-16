# Flex 预览图最终修复

## 问题

用户反馈"预览子元素数量"这个手动输入框不需要，应该根据"子元素占比"自动计算预览数量。

## 解决方案

删除"预览子元素数量"输入框，改为根据"子元素占比"字符串自动计算预览方块数量。

## 修改内容

### 1. 删除手动输入框

删除了整个"预览子元素数量"配置项：

```vue
<!-- 删除了这部分 -->
<div class="control-group">
  <div class="ratio-header">
    <label class="control-label">预览子元素数量</label>
    <a-input-number v-model:value="actualChildrenCount" ... />
  </div>
  <div class="ratio-hint">设置预览图显示几个子元素方块</div>
</div>
```

### 2. 调整布局顺序

将"子元素占比"输入框移到预览图之前，更符合逻辑：

```vue
<!-- 先输入占比 -->
<div class="control-group">
  <label class="control-label">子元素占比</label>
  <a-input v-model:value="flexConfig.flexRatio" ... />
</div>

<!-- 再显示预览 -->
<div class="preview-box" :style="previewStyle">
  ...
</div>
```

### 3. 简化计算逻辑

预览数量直接由占比字符串决定：

```typescript
// 之前：需要手动输入数量
const actualChildrenCount = ref(3)
const ratioArray = computed(() => {
  // 复杂的逻辑...
  const childCount = actualChildrenCount.value
  // ...
})

// 现在：自动根据占比计算
const ratioArray = computed(() => {
  const ratioString = flexConfig.value.flexRatio || '1:1:1'
  const ratios = ratioString
    .split(':')
    .map(r => parseFloat(r.trim()))
    .filter(r => !isNaN(r))

  if (ratios.length === 0) {
    return [1, 1, 1]
  }

  return ratios
})
```

## 使用方法

1. 选中容器组件（Flex/Grid/Table）
2. 打开"布局样式"标签页
3. 展开"Flex布局"折叠框
4. 在"子元素占比"输入框中输入占比（如 `1:2`）
5. 预览图自动显示对应数量的方块（2个）✅
6. 预览图按比例显示（1:2）✅

## 示例

### 示例 1: 两个子元素

```
输入占比: 1:2
↓
预览图自动显示: [1] [2]
↓
比例: 第1个占1/3，第2个占2/3 ✅
```

### 示例 2: 三个子元素

```
输入占比: 1:2:1
↓
预览图自动显示: [1] [2] [3]
↓
比例: 1:2:1 ✅
```

### 示例 3: 四个子元素

```
输入占比: 1:1:1:1
↓
预览图自动显示: [1] [2] [3] [4]
↓
比例: 均等分配 ✅
```

## 优势

1. ✅ **更简洁** - 删除了不必要的输入框
2. ✅ **更直观** - 占比决定数量，逻辑清晰
3. ✅ **更自动** - 无需手动输入数量
4. ✅ **更准确** - 占比和数量完全对应

## 总结

通过删除手动输入框，让预览图完全由"子元素占比"驱动，实现了更简洁、更直观的用户体验！

现在用户只需要输入占比（如 `1:2`），预览图就会自动显示对应数量的方块，完全不需要额外配置。
