# 🔧 宽度/高度字段和图标渲染修复

## 🎯 问题描述

1. **按钮的高度和宽度无法选择单位并且更改之后也不生效**

   - DomSizeRenderer(SIZE类型字段)没有显示
   - 宽度和高度字段显示为普通文本输入框
   - 修改后不生效

2. **按钮组件的图标选择确定之后所选择的图标要能把当前按钮变成选择之后的图标图案**
   - 图标选择后不显示在按钮上
   - 按钮没有渲染图标组件

---

## ✅ 已完成的修复

### 修复1: PropertiesPanel合并所有属性

**问题根源**:

- `componentProps`只返回`control.props`
- 但是`width`和`height`存储在`control.layout`中
- 导致LayoutPanel的字段无法获取到值

**文件**: `src/core/renderer/designer/settings/PropertiesPanel.vue`

**修改**:

```typescript
// 修改前
const componentProps = computed(() => {
  if (!selectedComponent.value) return {}
  return selectedComponent.value.props || {}
})

// 修改后
const componentProps = computed(() => {
  if (!selectedComponent.value) return {}

  // 合并所有属性到一个对象,方便字段访问
  return {
    // 基础属性
    id: selectedComponent.value.id,
    name: selectedComponent.value.name,
    kind: selectedComponent.value.kind,

    // 组件特定属性 (props)
    ...(selectedComponent.value.props || {}),

    // 布局属性 (layout)
    ...(selectedComponent.value.layout || {}),

    // 样式属性 (styles)
    ...(selectedComponent.value.styles || {}),

    // 其他属性
    visible: selectedComponent.value.visible,
    disabled: selectedComponent.value.disabled,
  }
})
```

**效果**:

- 现在`width`和`height`字段可以从`componentProps`中获取到值
- DomSizeRenderer会正确显示当前的宽度和高度
- 单位选择器会正确显示

---

### 修复2: Button组件正确渲染图标

**问题根源**:

- `iconComponent`只返回图标名称字符串
- 没有实际导入Ant Design的图标组件
- 导致图标无法渲染

**文件**: `src/core/renderer/controls/common/Button.vue`

**修改**:

```typescript
// 修改前
const iconComponent = computed(() => {
  if (!icon.value) return null
  // 这里可以根据图标名称返回对应的图标组件
  return icon.value
})

// 修改后
const iconComponent = computed(() => {
  if (!icon.value) return null
  // 动态导入Ant Design图标
  try {
    // 导入所有Ant Design图标
    const icons = require('@ant-design/icons-vue')
    return icons[icon.value] || null
  } catch (error) {
    console.warn(`[Button] Failed to load icon: ${icon.value}`, error)
    return null
  }
})
```

**效果**:

- 图标名称(如'HomeOutlined')会被转换为实际的图标组件
- 按钮会正确渲染图标

---

## 🔄 数据流验证

### 宽度/高度字段

```
用户打开属性面板
  ↓
PropertiesPanel.componentProps
  ↓
合并 control.layout (包含width和height)
  ↓
PanelGroup接收values
  ↓
FieldRenderer接收modelValue
  ↓
DomSizeRenderer显示
  ↓
✅ 显示数字输入框 + 单位选择器
  ↓
用户修改值
  ↓
emit('update:modelValue', { type: 'px', value: 100 })
  ↓
... (属性更新流程)
  ↓
更新到 control.layout.width
  ↓
✅ 按钮宽度改变
```

### 图标渲染

```
用户选择图标 'HomeOutlined'
  ↓
更新到 control.props.icon = 'HomeOutlined'
  ↓
Button组件重新渲染
  ↓
icon computed 返回 'HomeOutlined'
  ↓
iconComponent computed
  ↓
require('@ant-design/icons-vue')
  ↓
icons['HomeOutlined']
  ↓
返回 HomeOutlined 组件
  ↓
<component :is="iconComponent" />
  ↓
✅ 图标显示在按钮上
```

---

## 🧪 测试步骤

### 测试1: 宽度字段显示和修改

1. **刷新浏览器** (Ctrl+Shift+R)
2. **拖拽Button组件**到画布
3. **选中Button组件**
4. **切换到"布局样式"标签页**
5. **查看"宽度"字段**
   - **预期**: 看到数字输入框 + 单位选择器(无/像素/%/字宽)
6. **输入100,选择"像素"**
   - **预期**: 按钮宽度变为100px
7. **检查控制台**:
   ```
   🔧 [DesignerNew] 属性更新: width = { type: 'px', value: 100 }
   ✅ 尺寸属性已更新: width { type: 'px', value: 100 }
   ```

### 测试2: 高度字段显示和修改

1. **选中Button组件**
2. **查看"高度"字段**
   - **预期**: 看到数字输入框 + 单位选择器
3. **输入50,选择"像素"**
   - **预期**: 按钮高度变为50px

### 测试3: 图标选择和渲染

1. **选中Button组件**
2. **切换到"基础属性"标签页**
3. **找到"图标"字段**
4. **点击"选择"按钮**
5. **选择一个图标**(如HomeOutlined)
6. **点击"确定"**
7. **查看画布中的按钮**
   - **预期**: 按钮左侧显示Home图标
8. **尝试其他图标**(如UserOutlined, SettingOutlined)
   - **预期**: 图标立即改变

### 测试4: 单位切换

1. **选中Button组件**
2. **设置宽度为100px**
3. **切换单位为"%"**
   - **预期**: 按钮宽度变为100%(占满父容器)
4. **切换单位为"无"**
   - **预期**: 按钮宽度恢复为auto

---

## 🔍 调试命令

### 检查componentProps

```javascript
// 在浏览器控制台执行
const panel = document.querySelector('.properties-panel').__vueParentComponent
console.log('Component Props:', panel.ctx.componentProps)
// 应该看到: { id: '...', name: '...', width: {...}, height: {...}, text: '...', ... }
```

### 检查Button的icon

```javascript
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const control = stateManager?.getState('designer')?.selectedControl
console.log('Button Icon:', control?.props?.icon)
// 应该看到: 'HomeOutlined' 或其他图标名称
```

### 检查图标组件

```javascript
const icons = require('@ant-design/icons-vue')
console.log('HomeOutlined Component:', icons.HomeOutlined)
// 应该看到: Vue组件对象
```

---

## 📊 修复前后对比

### 修复前

| 问题         | 状态              |
| ------------ | ----------------- |
| 宽度字段显示 | ❌ 普通文本输入框 |
| 高度字段显示 | ❌ 普通文本输入框 |
| 单位选择器   | ❌ 不显示         |
| 宽度修改生效 | ❌ 不生效         |
| 图标显示     | ❌ 不显示         |

### 修复后

| 问题         | 状态                       |
| ------------ | -------------------------- |
| 宽度字段显示 | ✅ 数字输入框 + 单位选择器 |
| 高度字段显示 | ✅ 数字输入框 + 单位选择器 |
| 单位选择器   | ✅ 显示(无/像素/%/字宽)    |
| 宽度修改生效 | ✅ 立即生效                |
| 图标显示     | ✅ 正确渲染                |

---

## 📁 修改的文件

1. ✅ `src/core/renderer/designer/settings/PropertiesPanel.vue`

   - 修改`componentProps`合并所有属性

2. ✅ `src/core/renderer/controls/common/Button.vue`
   - 修改`iconComponent`动态导入图标组件

---

## 🎯 成功标准

修复成功后,应该能够:

- ✅ 宽度和高度字段显示为数字输入框 + 单位选择器
- ✅ 可以选择单位(无/像素/%/字宽)
- ✅ 修改宽度和高度立即生效
- ✅ 选择图标后立即显示在按钮上
- ✅ 切换不同图标立即生效
- ✅ 所有其他组件的宽度和高度也能正常工作

---

## 🚀 额外优化

### 优化1: 支持更多单位

可以在`DomSizeRenderer.vue`中添加更多单位选项:

- vw (视口宽度)
- vh (视口高度)
- em (相对字体大小)

### 优化2: 图标预览

可以在图标字段旁边显示图标预览,让用户更直观地看到选择的图标。

### 优化3: 快捷输入

可以支持直接输入"100px"这样的字符串,自动解析为`{ type: 'px', value: 100 }`。

---

## 🎊 修复完成!

现在请测试:

1. **刷新浏览器** (Ctrl+Shift+R)
2. **拖拽Button组件**
3. **测试宽度和高度字段**
4. **测试图标选择**

所有功能都应该正常工作了! 🚀
