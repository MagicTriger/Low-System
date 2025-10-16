# 属性面板整合完成

## 整合内容

### 1. 标签页结构 - 只保留图标

移除了"属性"、"事件"、"布局"文本标签页,只保留3个图标标签页:

- 📋 **基本** (InfoCircleOutlined)
- 🎨 **样式** (BgColorsOutlined)
- ⚡ **事件** (ThunderboltOutlined)

### 2. 基本标签页配置

#### 基本信息

- 组件ID (只读)
- 组件名称
- 组件类型 (只读)

#### 扩展属性

- 自定义属性 (JSON格式)

#### 公共属性

- 透明度 (1-100)
- 样式类名

#### 数据绑定

- 数据源选择 (无/API数据/静态数据)
- 绑定路径

### 3. 样式标签页配置 (整合旧版本)

#### 尺寸配置

- 宽度、高度
- 最小宽度、最小高度
- 最大宽度、最大高度
- **新增**: 水平溢出 (overflowX)
- **新增**: 垂直溢出 (overflowY)
- **新增**: 显示方式 (display)

#### 内外边距

- 内边距 (padding) - 简写和四个方向
- 外边距 (margin) - 简写和四个方向

#### Flex布局

- Flex方向
- Flex换行
- 主轴对齐
- 交叉轴对齐
- 列间距
- 行间距

#### 定位配置

- 定位类型 (static/relative/absolute/fixed/sticky)
- 上下左右边界
- 层级 (z-index)

#### 字体配置

- 字体大小
- 字体颜色
- 字体族
- 字体样式
- 字体粗细
- 行高
- 文字对齐

#### 边框配置

- 边框位置
- 边框样式
- 边框宽度
- 边框颜色

#### 圆角配置

- 统一圆角
- 四个角独立圆角

#### 背景配置

- 亮色主题背景色
- 暗色主题背景色
- 背景图片
- 背景位置
- 背景尺寸
- 背景重复

### 4. 事件标签页配置 (整合旧版本)

#### 生命周期事件

- 组件挂载后 (mounted)
- 组件卸载前 (beforeUnmount)
- 组件更新后 (updated)

#### 鼠标事件

- 点击 (click)
- 双击 (dblclick)
- 鼠标移入 (mouseenter)
- 鼠标移出 (mouseleave)

#### 键盘事件

- 按键按下 (keydown)
- 按键释放 (keyup)
- 按键按下并释放 (keypress)

#### 表单事件

- 值改变 (change)
- 输入 (input)
- 获得焦点 (focus)
- 失去焦点 (blur)
- 提交 (submit)

## 新增功能

### 1. 溢出控制

```typescript
layoutConfig: {
  overflowX: 'visible' | 'hidden' | 'scroll' | 'auto',
  overflowY: 'visible' | 'hidden' | 'scroll' | 'auto'
}
```

### 2. 显示方式

```typescript
layoutConfig: {
  display: 'block' | 'inline' | 'inline-block' | 'flex' | 'inline-flex' | 'grid' | 'none'
}
```

### 3. 完整事件系统

```typescript
eventsConfig: {
  // 生命周期
  mounted: string,
  beforeUnmount: string,
  updated: string,
  // 鼠标事件
  click: string,
  dblclick: string,
  mouseenter: string,
  mouseleave: string,
  // 键盘事件
  keydown: string,
  keyup: string,
  keypress: string,
  // 表单事件
  change: string,
  input: string,
  focus: string,
  blur: string,
  submit: string
}
```

### 4. 事件更新函数

```typescript
function updateEvents(key: string, value: any) {
  const newEvents = { ...eventsConfig, [key]: value }
  emit('update', 'events', newEvents)
}
```

## 改进点

1. ✅ 只保留图标标签页,界面更简洁
2. ✅ 整合了旧版本的所有配置
3. ✅ 添加了溢出控制配置
4. ✅ 添加了显示方式配置
5. ✅ 完善了事件系统,支持15种事件类型
6. ✅ 所有事件支持JavaScript代码输入
7. ✅ 保持了白色背景主题
8. ✅ 统一的配置面板结构

## 测试建议

### 基本标签页

1. 修改组件名称
2. 编辑扩展属性(JSON格式)
3. 调整透明度滑块
4. 添加样式类名
5. 配置数据绑定

### 样式标签页

1. 测试尺寸配置(包括新增的溢出和显示方式)
2. 测试内外边距配置
3. 测试Flex布局配置
4. 测试定位配置
5. 测试字体配置
6. 测试边框配置
7. 测试圆角配置
8. 测试背景配置

### 事件标签页

1. 测试生命周期事件
2. 测试鼠标事件
3. 测试键盘事件
4. 测试表单事件
5. 验证事件代码能正确保存和执行

## 文件变更

- `src/core/renderer/designer/settings/PropertiesPanel.vue` - 完全重构并整合

## 下一步

1. 测试所有配置项的功能
2. 验证事件代码的执行
3. 完善数据绑定功能的UI交互
4. 考虑添加更多高级配置选项
