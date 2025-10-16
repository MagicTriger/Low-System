# 属性更新修复方案

## 问题描述

当前设计器中，属性面板的配置无法正确生效，包括：

1. 样式配置（宽度、高度、边距、颜色等）不生效
2. 基本属性配置不生效
3. 组件名称配置不生效（对于文本和按钮等组件）

## 根本原因

### 1. 属性结构不匹配

**PropertiesPanel 发送的属性：**

- `layout` - 包含 width, height, padding, margin 等
- `position` - 包含 position, left, right, top, bottom, zIndex
- `font` - 包含 fontSize, color, fontFamily 等
- `border` - 包含边框相关属性
- `radius` - 包含圆角相关属性
- `background` - 包含背景相关属性
- `name` - 组件名称
- `props` - 组件特定属性（如 Button 的 text）

**组件实际存储的结构：**

```typescript
interface Control {
  id: string
  kind: string
  name?: string
  styles?: Record<string, any> // CSS 样式对象
  props?: Record<string, any> // 组件特定属性
  // ...
}
```

### 2. handlePropertyUpdate 处理不完整

当前的 `handlePropertyUpdate` 函数只对 `styles` 属性做了深度合并，但 PropertiesPanel 发送的是 `layout`、`font` 等独立属性对象。

## 解决方案

### 方案 A：修改 handlePropertyUpdate（推荐）

在 `DesignerNew.vue` 中修改 `handlePropertyUpdate` 函数，将 PropertiesPanel 发送的属性对象转换为 `styles` 对象：

```typescript
function handlePropertyUpdate(property: string, value: any) {
  console.log('属性更新:', property, value)

  if (!selectedControlId.value || !selectedControl.value) {
    console.warn('没有选中的组件')
    return
  }

  const oldValue = selectedControl.value[property]

  // 处理不同类型的属性更新
  if (property === 'styles') {
    // 直接更新 styles
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      ...value,
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
  } else if (['layout', 'position', 'font', 'border', 'radius', 'background'].includes(property)) {
    // 将这些属性转换为 styles
    const styleUpdates = convertToStyles(property, value)
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      ...styleUpdates,
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
  } else if (property === 'name') {
    // 更新组件名称
    updateControl(selectedControlId.value, { name: value })
  } else if (property === 'props') {
    // 深度合并 props
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      ...value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
  } else {
    // 其他属性直接更新
    updateControl(selectedControlId.value, { [property]: value })
  }

  // 强制更新选择框位置和大小
  nextTick(() => {
    window.dispatchEvent(new Event('resize'))
  })

  history.push(
    'update-property',
    {
      controlId: selectedControlId.value,
      property,
      oldValue,
      newValue: value,
    },
    `更新属性 ${property}`
  )
  markAsUnsaved()
  message.success(`已更新属性: ${property}`)
}

// 将属性对象转换为 CSS styles
function convertToStyles(property: string, value: any): Record<string, any> {
  const styles: Record<string, any> = {}

  switch (property) {
    case 'layout':
      // 尺寸和布局属性
      if (value.width !== undefined) styles.width = value.width
      if (value.height !== undefined) styles.height = value.height
      if (value.minWidth !== undefined) styles.minWidth = value.minWidth
      if (value.minHeight !== undefined) styles.minHeight = value.minHeight
      if (value.maxWidth !== undefined) styles.maxWidth = value.maxWidth
      if (value.maxHeight !== undefined) styles.maxHeight = value.maxHeight
      if (value.padding !== undefined) styles.padding = value.padding
      if (value.paddingTop !== undefined) styles.paddingTop = value.paddingTop
      if (value.paddingRight !== undefined) styles.paddingRight = value.paddingRight
      if (value.paddingBottom !== undefined) styles.paddingBottom = value.paddingBottom
      if (value.paddingLeft !== undefined) styles.paddingLeft = value.paddingLeft
      if (value.margin !== undefined) styles.margin = value.margin
      if (value.marginTop !== undefined) styles.marginTop = value.marginTop
      if (value.marginRight !== undefined) styles.marginRight = value.marginRight
      if (value.marginBottom !== undefined) styles.marginBottom = value.marginBottom
      if (value.marginLeft !== undefined) styles.marginLeft = value.marginLeft
      if (value.display !== undefined) styles.display = value.display
      if (value.overflowX !== undefined) styles.overflowX = value.overflowX
      if (value.overflowY !== undefined) styles.overflowY = value.overflowY
      // Flex 布局
      if (value.flexDirection !== undefined) styles.flexDirection = value.flexDirection
      if (value.flexWrap !== undefined) styles.flexWrap = value.flexWrap
      if (value.justifyContent !== undefined) styles.justifyContent = value.justifyContent
      if (value.alignItems !== undefined) styles.alignItems = value.alignItems
      if (value.columnGap !== undefined) styles.columnGap = value.columnGap
      if (value.rowGap !== undefined) styles.rowGap = value.rowGap
      break

    case 'position':
      if (value.position !== undefined) styles.position = value.position
      if (value.left !== undefined) styles.left = value.left
      if (value.right !== undefined) styles.right = value.right
      if (value.top !== undefined) styles.top = value.top
      if (value.bottom !== undefined) styles.bottom = value.bottom
      if (value.zIndex !== undefined) styles.zIndex = value.zIndex
      break

    case 'font':
      if (value.fontSize !== undefined) styles.fontSize = value.fontSize
      if (value.color !== undefined) styles.color = value.color
      if (value.fontFamily !== undefined) styles.fontFamily = value.fontFamily
      if (value.fontStyle !== undefined) styles.fontStyle = value.fontStyle
      if (value.fontWeight !== undefined) styles.fontWeight = value.fontWeight
      if (value.lineHeight !== undefined) styles.lineHeight = value.lineHeight
      if (value.textAlign !== undefined) styles.textAlign = value.textAlign
      break

    case 'border':
      const { position: borderPos, style: borderStyle, width: borderWidth, color: borderColor } = value
      if (borderPos === 'all') {
        if (borderStyle) styles.borderStyle = borderStyle
        if (borderWidth) styles.borderWidth = borderWidth
        if (borderColor) styles.borderColor = borderColor
      } else if (borderPos) {
        const side = borderPos.charAt(0).toUpperCase() + borderPos.slice(1)
        if (borderStyle) styles[`border${side}Style`] = borderStyle
        if (borderWidth) styles[`border${side}Width`] = borderWidth
        if (borderColor) styles[`border${side}Color`] = borderColor
      }
      break

    case 'radius':
      if (value.borderRadius !== undefined) styles.borderRadius = value.borderRadius
      if (value.borderTopLeftRadius !== undefined) styles.borderTopLeftRadius = value.borderTopLeftRadius
      if (value.borderTopRightRadius !== undefined) styles.borderTopRightRadius = value.borderTopRightRadius
      if (value.borderBottomLeftRadius !== undefined) styles.borderBottomLeftRadius = value.borderBottomLeftRadius
      if (value.borderBottomRightRadius !== undefined) styles.borderBottomRightRadius = value.borderBottomRightRadius
      break

    case 'background':
      if (value.color !== undefined) styles.backgroundColor = value.color
      if (value.image !== undefined) styles.backgroundImage = value.image ? `url(${value.image})` : undefined
      if (value.position !== undefined) styles.backgroundPosition = value.position
      if (value.size !== undefined) styles.backgroundSize = value.size
      if (value.repeat !== undefined) styles.backgroundRepeat = value.repeat
      break
  }

  return styles
}
```

### 方案 B：修改 PropertiesPanel（不推荐）

修改 PropertiesPanel 直接发送 `styles` 对象，但这需要大量重构现有代码。

## 实施步骤

1. 在 `DesignerNew.vue` 中添加 `convertToStyles` 函数
2. 修改 `handlePropertyUpdate` 函数，添加属性类型判断和转换逻辑
3. 测试各种属性更新：
   - 宽度、高度
   - 内外边距
   - 字体样式
   - 边框和圆角
   - 背景色
   - 组件名称
   - 组件特定属性（如 Button 的 text）

## 测试用例

### 1. 测试样式更新

- 选择一个 Button 组件
- 修改宽度为 "300px" → 组件应立即变宽
- 修改高度为 "50px" → 组件应立即变高
- 修改背景色 → 背景色应立即改变
- 修改字体大小 → 文字大小应立即改变

### 2. 测试基本属性更新

- 选择一个 Button 组件
- 修改组件名称为 "提交按钮" → 大纲树中应显示新名称
- 修改按钮文字为 "点击提交" → 按钮上的文字应改变

### 3. 测试文本组件

- 选择一个 Span（文本）组件
- 修改组件名称 → 应生效
- 修改文本内容 → 应生效
- 修改字体样式 → 应生效

## 预期结果

- ✅ 所有样式配置都能实时生效
- ✅ 组件名称可以修改
- ✅ 组件特定属性（如按钮文字）可以修改
- ✅ 修改后的属性可以正确保存和加载
- ✅ 撤销/重做功能正常工作

## 相关文件

- `src/modules/designer/views/DesignerNew.vue` - 主设计器视图
- `src/core/renderer/designer/settings/PropertiesPanel.vue` - 属性面板
- `src/core/renderer/designer/composables/useDesignerState.ts` - 状态管理
- `src/core/renderer/controls/common/Button.vue` - 按钮组件
- `src/core/renderer/controls/common/Span.vue` - 文本组件

## 注意事项

1. 确保 `convertToStyles` 函数处理所有可能的属性值类型
2. 注意单位转换（如数字转换为 "px" 字符串）
3. 处理 undefined 和 null 值
4. 保持向后兼容性
5. 添加适当的错误处理和日志

## 后续优化

1. 考虑使用 TypeScript 类型定义确保类型安全
2. 添加属性验证逻辑
3. 优化性能，避免不必要的重新渲染
4. 添加属性变化的动画效果
5. 支持批量属性更新
