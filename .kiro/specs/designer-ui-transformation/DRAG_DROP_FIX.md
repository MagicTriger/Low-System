# 拖拽功能修复

## 修复日期

2025-10-10

## 问题描述

拖拽功能无法正常工作，从组件库拖拽组件到画布时没有反应。

## 根本原因

拖拽数据格式不匹配：

- `controls.vue` 中设置的拖拽数据格式与 `DesignerNew.vue` 中期望的格式不一致
- `handleCanvasDrop` 期望的数据格式是 `DragData` 类型（包含 `type` 和 `controlKind`）
- 但 `controls.vue` 设置的数据格式是 `{ kind, kindName, type }`

## 修复方案

### 1. 修复 controls.vue 中的拖拽数据格式

**修改前：**

```typescript
const handleDragStart = (event: DragEvent, control: ControlDefinition) => {
  event.dataTransfer?.setData('text/plain', control.kind)
  event.dataTransfer?.setData(
    'application/json',
    JSON.stringify({
      kind: control.kind,
      kindName: control.kindName,
      type: control.type,
    })
  )

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }
}
```

**修改后：**

```typescript
const handleDragStart = (event: DragEvent, control: ControlDefinition) => {
  // 设置拖拽数据，格式需要匹配 DragData 接口
  const dragData = {
    type: 'control-library',
    controlKind: control.kind,
  }

  event.dataTransfer?.setData('text/plain', JSON.stringify(dragData))
  event.dataTransfer?.setData('application/json', JSON.stringify(dragData))

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copy'
  }

  console.log('开始拖拽组件:', control.kind)
}
```

### 2. 添加调试日志到 handleCanvasDrop

**修改后：**

```typescript
function handleCanvasDrop(event: DragEvent) {
  console.log('画布接收到 drop 事件')

  const data = dragDrop.readDragTransfer(event)
  console.log('读取到的拖拽数据:', data)

  if (!data) {
    console.warn('没有读取到拖拽数据')
    return
  }

  if (data.type === 'control-library' && data.controlKind) {
    console.log('创建新组件:', data.controlKind)

    // 从组件库拖拽
    const newControl = ControlFactory.create(data.controlKind, {
      name: data.controlKind,
    })

    console.log('新组件创建成功:', newControl)

    addControl(newControl)
    selectControl(newControl.id)
    history.push('add-control', { control: newControl }, `添加控件 ${data.controlKind}`)
    markAsUnsaved()
    message.success('已添加组件')
  } else {
    console.warn('拖拽数据格式不正确:', data)
  }
}
```

## DragData 接口定义

```typescript
export interface DragData {
  type: DragDataType // 'control-library' | 'outline-tree' | 'canvas'
  controlKind?: string // 组件库拖拽时使用
  controlId?: string // 现有控件拖拽时使用
  control?: Control
}
```

## 拖拽流程

### 完整的拖拽流程：

1. **用户开始拖拽组件**

   - 在 `controls.vue` 中触发 `@dragstart` 事件
   - 调用 `handleDragStart` 函数
   - 设置拖拽数据到 `event.dataTransfer`

2. **拖拽到画布上方**

   - `CanvasArea.vue` 接收 `@dragover` 事件
   - 调用 `event.preventDefault()` 允许放置

3. **释放鼠标（放置）**

   - `CanvasArea.vue` 接收 `@drop` 事件
   - 触发 `emit('drop', event)`
   - `DesignerNew.vue` 接收事件，调用 `handleCanvasDrop`

4. **处理放置**
   - 从 `event.dataTransfer` 读取拖拽数据
   - 验证数据格式
   - 使用 `ControlFactory.create` 创建新组件
   - 调用 `addControl` 添加到视图
   - 选中新组件
   - 记录历史操作
   - 显示成功消息

## 测试步骤

1. **打开浏览器开发者工具**

   - 打开 Console 标签页查看日志

2. **测试拖拽**

   - 从左侧组件库选择一个组件（如 Button）
   - 拖拽到中央画布区域
   - 释放鼠标

3. **检查日志**

   - 应该看到 "开始拖拽组件: button"
   - 应该看到 "画布接收到 drop 事件"
   - 应该看到 "读取到的拖拽数据: {type: 'control-library', controlKind: 'button'}"
   - 应该看到 "创建新组件: button"
   - 应该看到 "新组件创建成功: {...}"
   - 应该看到成功消息 "已添加组件"

4. **验证结果**
   - 画布上应该出现新添加的组件
   - 大纲树中应该显示新组件
   - 右侧属性面板应该显示组件属性

## 可能的问题和解决方案

### 问题 1: 拖拽时鼠标显示禁止图标

**原因：** 画布没有正确处理 `dragover` 事件
**解决：** 确保 `CanvasArea.vue` 中的 `handleDragOver` 调用了 `event.preventDefault()`

### 问题 2: 放置后没有反应

**原因：** 拖拽数据格式不正确或 `ControlFactory.create` 失败
**解决：**

- 检查控制台日志，查看拖拽数据格式
- 确保组件类型已注册到 `ControlFactory`

### 问题 3: 组件创建成功但不显示

**原因：**

- `addControl` 函数可能有问题
- 组件渲染器可能有问题
  **解决：**
- 检查 `currentView.value.controls` 数组是否包含新组件
- 检查 `DesignerControlRenderer` 是否正确渲染

### 问题 4: 拖拽数据读取失败

**原因：** `readDragTransfer` 函数可能无法正确解析数据
**解决：**

- 确保 `text/plain` 和 `application/json` 都设置了相同的数据
- 检查 JSON 格式是否正确

## 相关文件

- ✅ `src/core/renderer/designer/controls.vue` - 组件库，设置拖拽数据
- ✅ `src/core/renderer/designer/canvas/CanvasArea.vue` - 画布区域，接收拖拽事件
- ✅ `src/modules/designer/views/DesignerNew.vue` - 主设计器，处理拖拽逻辑
- ✅ `src/core/renderer/designer/composables/useDragDrop.ts` - 拖拽管理器

## 下一步改进

1. **添加拖拽预览**

   - 在拖拽时显示组件的预览图
   - 使用 `event.dataTransfer.setDragImage()`

2. **添加放置位置指示器**

   - 在拖拽时显示放置位置的视觉提示
   - 使用 `dropIndicator` 状态

3. **支持拖拽到容器**

   - 实现 `handleControlDrop` 函数
   - 允许将组件拖拽到容器组件内部

4. **支持拖拽排序**

   - 允许在大纲树中拖拽组件重新排序
   - 实现 `handleControlMove` 函数

5. **添加拖拽限制**
   - 某些组件只能放置在特定容器中
   - 实现 `validateDropTarget` 函数

## 验证清单

- [x] 修复拖拽数据格式
- [x] 添加调试日志
- [ ] 测试从组件库拖拽到画布
- [ ] 测试拖拽到容器
- [ ] 测试大纲树中的拖拽排序
- [ ] 移除调试日志（生产环境）

## 总结

本次修复主要解决了拖拽数据格式不匹配的问题。通过统一 `controls.vue` 和 `DesignerNew.vue` 中的数据格式，确保拖拽功能能够正常工作。

关键修改：

1. ✅ 修改 `handleDragStart` 使用正确的 `DragData` 格式
2. ✅ 添加调试日志帮助排查问题
3. ✅ 确保数据格式与接口定义一致

现在刷新浏览器，拖拽功能应该可以正常工作了！🎉
