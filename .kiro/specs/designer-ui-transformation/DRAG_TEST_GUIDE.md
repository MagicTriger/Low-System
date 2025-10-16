# 拖拽功能测试指南

## 测试目的

验证从组件库拖拽组件到画布的完整流程

## 测试前准备

1. **打开浏览器开发者工具**

   - 按 F12 打开开发者工具
   - 切换到 Console 标签页
   - 清空控制台（点击 🚫 图标）

2. **刷新页面**
   - 按 F5 或点击刷新按钮
   - 等待页面完全加载

## 测试步骤

### 步骤 1: 测试拖拽开始

1. 在左侧组件库中找到 "Button" 组件
2. 按住鼠标左键开始拖拽
3. **检查控制台**，应该看到：
   ```
   开始拖拽组件: button
   ```

**如果没有看到日志：**

- 检查组件是否有 `draggable="true"` 属性
- 检查 `@dragstart` 事件是否绑定
- 检查浏览器是否支持拖拽

### 步骤 2: 测试拖拽到画布

1. 继续拖拽 Button 组件到中央画布区域
2. 在画布上方移动鼠标
3. **检查控制台**，应该看到：
   ```
   画布 dragover
   画布 dragover
   ... (多次)
   ```

**如果没有看到日志：**

- 检查画布是否有 `@dragover` 事件
- 检查事件是否调用了 `event.preventDefault()`

### 步骤 3: 测试放置

1. 在画布上释放鼠标
2. **检查控制台**，应该看到：

   ```
   画布 drop 事件触发
   画布接收到的原始数据: {"type":"control-library","controlKind":"button"}
   画布接收到 drop 事件
   读取到的拖拽数据: {type: 'control-library', controlKind: 'button'}
   创建新组件: button
   新组件创建成功: {id: '...', kind: 'button', ...}
   组件已更新
   ```

3. **检查画布**，应该看到：
   - Button 组件出现在画布上
   - 显示成功消息 "已添加组件"

**如果没有看到组件：**

- 检查控制台是否有错误
- 检查 `ControlFactory.create` 是否成功
- 检查 `addControl` 函数是否正确

### 步骤 4: 测试组件选择

1. 点击画布上的 Button 组件
2. **检查控制台**，应该看到选择相关的日志
3. **检查右侧属性面板**，应该显示组件属性

### 步骤 5: 测试属性编辑

1. 在右侧属性面板的 "组件名称" 输入框中输入 "我的按钮"
2. **检查控制台**，应该看到：

   ```
   属性更新: name 我的按钮
   旧值: button 新值: 我的按钮
   组件已更新
   ```

3. **检查画布**，组件应该实时更新

## 常见问题排查

### 问题 1: 拖拽时鼠标显示禁止图标

**原因：** 画布没有调用 `event.preventDefault()`

**解决方案：**

```typescript
function handleDragOver(event: DragEvent) {
  event.preventDefault() // 必须调用
  event.stopPropagation()
}
```

### 问题 2: 放置后没有反应

**可能原因：**

1. 拖拽数据格式不正确
2. `readDragTransfer` 函数读取失败
3. `ControlFactory.create` 失败
4. `addControl` 函数有问题

**排查步骤：**

1. 检查 "画布接收到的原始数据" 日志
2. 检查 "读取到的拖拽数据" 日志
3. 检查 "创建新组件" 日志
4. 检查是否有错误日志

### 问题 3: 组件创建成功但不显示

**可能原因：**

1. `currentView.value.controls` 数组没有更新
2. `DesignerControlRenderer` 没有渲染
3. 组件样式问题（如 display: none）

**排查步骤：**

1. 在 Vue DevTools 中检查 `currentView.controls`
2. 检查是否有 `v-for` 渲染组件
3. 检查组件的 styles 属性

### 问题 4: 属性更新不生效

**可能原因：**

1. `handlePropertyUpdate` 没有被调用
2. `updateControl` 函数有问题
3. Vue 响应式更新延迟

**排查步骤：**

1. 检查 "属性更新" 日志
2. 检查 "组件已更新" 日志
3. 在 Vue DevTools 中检查组件数据

## 调试技巧

### 1. 使用 Vue DevTools

1. 安装 Vue DevTools 浏览器扩展
2. 打开 DevTools，切换到 Vue 标签页
3. 查看组件树和数据

### 2. 断点调试

1. 在 Sources 标签页中找到相关文件
2. 在关键函数处设置断点
3. 重新执行操作，查看变量值

### 3. 网络请求

1. 切换到 Network 标签页
2. 检查是否有 API 请求
3. 查看请求和响应数据

## 预期的完整日志流程

```
# 1. 开始拖拽
开始拖拽组件: button

# 2. 拖拽到画布
画布 dragover
画布 dragover
...

# 3. 放置
画布 drop 事件触发
画布接收到的原始数据: {"type":"control-library","controlKind":"button"}
画布接收到 drop 事件
读取到的拖拽数据: {type: 'control-library', controlKind: 'button'}
创建新组件: button
新组件创建成功: {id: 'ctrl_xxx', kind: 'button', name: 'button', ...}
组件已更新

# 4. 选择组件
(选择相关日志)

# 5. 编辑属性
属性更新: name 我的按钮
旧值: button 新值: 我的按钮
组件已更新
```

## 成功标准

- ✅ 可以从组件库拖拽组件
- ✅ 拖拽时鼠标显示正常图标
- ✅ 放置后组件出现在画布上
- ✅ 可以选择组件
- ✅ 可以编辑组件属性
- ✅ 属性更改实时生效
- ✅ 大纲树显示组件
- ✅ 控制台没有错误

## 下一步

如果所有测试都通过，可以继续测试：

1. 拖拽到容器
2. 组件嵌套
3. 拖拽排序
4. 多选操作
5. 撤销/重做

如果测试失败，请：

1. 记录失败的步骤
2. 复制控制台日志
3. 截图保存
4. 报告问题
