# 属性面板重构完成

## 重构内容

### 1. 标签页结构调整

将属性面板重构为3个主要标签页,使用图标显示:

- **基本** (InfoCircleOutlined 图标)

  - 基本信息
  - 扩展属性
  - 公共属性
  - 数据绑定

- **样式** (BgColorsOutlined 图标)

  - 尺寸配置
  - 内外边距
  - Flex布局
  - 定位配置
  - 字体配置
  - 边框配置
  - 圆角配置
  - 背景配置

- **事件** (ThunderboltOutlined 图标)
  - 事件配置

### 2. 基本标签页详细配置

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

### 3. 样式标签页整合

将原来分散在多个面板的样式配置统一整合到"样式"标签页中:

- 从"基本信息"面板移除了样式相关配置
- 将边框、圆角、背景等配置整合到样式标签页
- 删除了重复的"其他配置"面板

### 4. 背景色修复

确保所有配置面板的背景色为白色:

```css
.property-collapse :deep(.ant-collapse-content) {
  background: #ffffff !important;
  border-top: 1px solid #e8e8e8;
}
```

### 5. 新增功能

#### 扩展属性处理

```typescript
function handlePropsChange(value: string) {
  try {
    const props = JSON.parse(value)
    emit('update', 'props', props)
  } catch (e) {
    console.error('Invalid JSON format', e)
  }
}
```

#### 数据绑定配置

```typescript
const dataBindingConfig = reactive({ dataSource: '', bindingPath: '' })

function updateDataBinding(key: string, value: any) {
  const newDataBinding = { ...dataBindingConfig, [key]: value }
  emit('update', 'dataBinding', newDataBinding)
}
```

## 测试建议

1. **基本标签页测试**

   - 修改组件名称
   - 编辑扩展属性(JSON格式)
   - 调整透明度
   - 添加样式类名
   - 配置数据绑定

2. **样式标签页测试**

   - 测试所有尺寸配置
   - 测试内外边距配置
   - 测试Flex布局配置
   - 测试定位配置
   - 测试字体配置
   - 测试边框配置
   - 测试圆角配置
   - 测试背景配置

3. **事件标签页测试**

   - 配置事件处理

4. **UI测试**
   - 确认标签页图标正确显示
   - 确认所有面板背景色为白色
   - 确认折叠面板展开/收起正常
   - 确认配置项输入正常

## 改进点

1. ✅ 标签页使用图标显示,更简洁
2. ✅ 基本配置只包含组件基本信息和通用属性
3. ✅ 样式配置统一整合到样式标签页
4. ✅ 删除了重复的配置项
5. ✅ 背景色统一为白色
6. ✅ 添加了数据绑定配置
7. ✅ 添加了扩展属性配置

## 文件变更

- `src/core/renderer/designer/settings/PropertiesPanel.vue` - 完全重构

## 下一步

1. 测试所有配置项的功能
2. 根据需要添加更多事件配置选项
3. 完善数据绑定功能的UI交互
