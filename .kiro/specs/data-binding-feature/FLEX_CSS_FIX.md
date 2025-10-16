# Flex容器CSS宽度修复

## 问题描述

即使在ControlFactory中设置了Flex容器的默认layout为100%宽度,Flex容器在画布上仍然只占很小的宽度。

## 根本原因

Flex组件的CSS样式中没有设置默认宽度,导致容器使用了浏览器的默认宽度(auto或内容宽度)。

虽然我们在ControlFactory中设置了layout属性:

```typescript
layout: {
  width: { type: '%', value: 100 },
  minHeight: { type: 'px', value: 100 },
}
```

但这个layout需要通过`controlToStyles`转换并应用到组件上。如果Flex组件的CSS或内联样式没有正确应用这些值,容器仍然会很窄。

## 解决方案

### 1. 在Flex组件的CSS中设置默认宽度

```css
.flex-container {
  position: relative;
  width: 100%; /* 默认占满父容器宽度 */
  min-height: 100px; /* 设置最小高度确保容器可见 */
}
```

### 2. 在flexStyles计算属性中也设置默认宽度

```typescript
const flexStyles = computed(() => {
  const styles: Record<string, any> = {
    display: 'flex',
    width: '100%', // 默认占满父容器宽度
  }
  // ... 其他样式
})
```

## 修改文件

- `src/core/renderer/controls/container/Flex.vue` - CSS样式和flexStyles计算属性

## 为什么需要两处都设置?

### CSS设置 (推荐)

- 作为基础默认值
- 即使JS没有执行也能生效
- 性能更好

### JS内联样式设置 (补充)

- 确保在所有情况下都能生效
- 可以被layout属性覆盖
- 提供额外的保障

## 修复后的效果

### 之前

```
画布 (1200px)
└─ Flex容器 (auto → 50px) ❌ 太窄!
   └─ Table (100% → 50px) ❌
```

### 之后

```
画布 (1200px)
└─ Flex容器 (100% → 1200px) ✅ 占满画布!
   └─ Table (100% → 1200px) ✅ 占满容器!
```

## 测试步骤

1. **清除浏览器缓存并刷新**

   - 按Ctrl+Shift+R强制刷新
   - 确保加载最新的CSS

2. **创建Flex容器**

   - 拖拽Flex组件到画布
   - 验证: Flex容器应该占满画布宽度(红色边框应该横跨整个画布)

3. **添加Table组件**

   - 拖拽Table到Flex容器
   - 验证: Table应该占满Flex容器宽度

4. **添加多个Table**
   - 继续添加Table组件
   - 验证: 表格应该自动平均分配空间

## 完成状态

✅ Flex组件CSS默认宽度设置
✅ Flex组件JS默认宽度设置
✅ 语法检查通过
🔄 等待测试验证

## 注意事项

- 需要清除浏览器缓存才能看到CSS更新
- 如果还是不行,检查浏览器开发者工具中Flex容器的实际样式
- 确认width: 100%是否被正确应用
