# 属性面板修复进度

## 已完成 ✅

### 1. 属性面板结构调整 ✅

- ✅ 将基本信息（组件ID、名称、类型）移到布局配置面板顶部
- ✅ 删除独立的"基本信息"面板
- ✅ 用图标替代"属性"标签文本（SettingOutlined）
- ✅ 添加tooltip提示
- ✅ 修复布局配置面板背景色为白色

### 修改内容

**src/core/renderer/designer/settings/PropertiesPanel.vue:**

- 移除了独立的"基本信息"折叠面板
- 将ID、名称、类型字段移到"布局配置"面板顶部
- 添加了分隔线区分基本信息和布局字段
- 使用`<SettingOutlined />`图标替代"属性"文本
- 添加了`a-tooltip`显示"属性"提示
- 强制设置`.property-collapse :deep(.ant-collapse-content)`背景为白色
- 添加`.basic-info-section`样式确保基本信息区域背景为白色

## 待完成 ⏳

### 2. 选择框包裹问题 ⏳

需要修改：`src/core/renderer/designer/canvas/SelectionOverlay.vue`

**问题：**

- 选择框不完全包裹组件
- 按钮等组件右侧有空余

**解决方案：**

- 使用`getBoundingClientRect()`获取实际渲染尺寸
- 考虑padding、border、margin
- 确保选择框完全贴合组件边界

### 3. 拖拽和配置面板同步 ⏳

需要修改：

- `src/core/renderer/designer/canvas/SelectionOverlay.vue`
- `src/core/renderer/designer/composables/useDesignerState.ts`

**问题：**

- 拖拽改变大小后，配置面板不更新
- 配置面板修改后，画布不更新

**解决方案：**

- 在拖拽结束时更新control.layout
- 监听layout变化并应用到DOM
- 实现双向数据绑定

### 4. 配置属性生效 ⏳

需要修改：`src/core/renderer/designer/canvas/DesignerControlRenderer.vue`

**问题：**

- 布局配置（宽度、高度等）不生效
- 定位配置不生效
- 其他样式配置不生效

**解决方案：**

- 将control.layout转换为CSS样式
- 将control.position转换为CSS样式
- 将control.font、border、radius、background转换为CSS样式
- 应用到组件的style属性

## 下一步行动

### 优先级1：让配置生效（最重要）

修改`DesignerControlRenderer.vue`，添加样式应用逻辑：

```typescript
// 将ControlSize转换为CSS值
function sizeToCSS(size?: ControlSize): string | undefined {
  if (!size || !size.type || size.type === 'none') return undefined
  return `${size.value}${size.type}`
}

// 生成样式对象
const computedStyle = computed(() => {
  const style: Record<string, any> = {}

  if (control.layout) {
    if (control.layout.width) style.width = sizeToCSS(control.layout.width)
    if (control.layout.height) style.height = sizeToCSS(control.layout.height)
    // ... 其他布局属性
  }

  if (control.position) {
    if (control.position.position) style.position = control.position.position
    if (control.position.left) style.left = sizeToCSS(control.position.left)
    // ... 其他定位属性
  }

  // ... 字体、边框、背景等

  return style
})
```

### 优先级2：修复选择框

修改`SelectionOverlay.vue`，使用实际渲染尺寸：

```typescript
function updateBounds() {
  const element = document.querySelector(`[data-control-id="${selectedControl.id}"]`)
  if (element) {
    const rect = element.getBoundingClientRect()
    const canvasRect = canvasElement.getBoundingClientRect()

    bounds.value = {
      left: rect.left - canvasRect.left,
      top: rect.top - canvasRect.top,
      width: rect.width,
      height: rect.height,
    }
  }
}
```

### 优先级3：实现双向同步

在拖拽结束时更新control：

```typescript
function onResizeEnd(newBounds) {
  updateControl(selectedControl.id, {
    layout: {
      ...selectedControl.layout,
      width: { type: 'px', value: newBounds.width },
      height: { type: 'px', value: newBounds.height },
    },
  })
}
```

## 测试清单

完成后需要测试：

- [ ] 基本信息显示在布局配置顶部
- [ ] 图标和tooltip正常显示
- [ ] 布局配置面板背景为白色
- [ ] 修改宽度/高度后组件大小改变
- [ ] 拖拽改变大小后配置面板更新
- [ ] 选择框完全包裹组件
- [ ] 所有样式配置都能生效

## 相关文件

- ✅ src/core/renderer/designer/settings/PropertiesPanel.vue（已修改）
- ⏳ src/core/renderer/designer/canvas/DesignerControlRenderer.vue（待修改）
- ⏳ src/core/renderer/designer/canvas/SelectionOverlay.vue（待修改）
- ⏳ src/core/renderer/designer/composables/useDesignerState.ts（待修改）

---

**更新时间：** 2025-10-11  
**当前进度：** 20%（1/5完成）  
**下一步：** 修改DesignerControlRenderer让配置生效
