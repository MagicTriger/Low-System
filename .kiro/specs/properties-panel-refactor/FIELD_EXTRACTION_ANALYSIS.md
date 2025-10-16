# PropertiesPanel字段提取分析

## 当前字段结构分析

### 1. 基本信息面板 (basic-info)

- 控件ID (readonly)
- 实例ID (readonly)
- 控件名称 (text input)
- 权限绑定 (select)

### 2. 动态属性分组

从控件定义的settings中读取，按group分组：

- data组 - 数据相关属性
- common组 - 公共属性
- extend组 - 扩展属性

支持的字段类型：

- string - 文本输入
- select - 下拉选择
- boolean - 开关
- icon - 图标选择器（已有IconPickerField组件）

### 3. 扩展属性 (extended)

- 自定义属性 (JSON textarea)

### 4. 公共属性 (common)

- 透明度 (slider, 1-100)
- 样式类名 (text input, 空格分隔)

### 5. 数据绑定 (data-binding)

- 数据源 (select from dataSources)
- 绑定字段 (text input)
- 数据转换 (textarea)

### 6. 尺寸配置 (size)

- 宽度 (DomSizeRenderer)
- 高度 (DomSizeRenderer)
- 最小宽度 (DomSizeRenderer)
- 最小高度 (DomSizeRenderer)
- 最大宽度 (DomSizeRenderer)
- 最大高度 (DomSizeRenderer)
- 水平溢出 (select: visible/hidden/scroll/auto)
- 垂直溢出 (select: visible/hidden/scroll/auto)
- 显示方式 (select: block/inline/inline-block/flex/inline-flex/grid/none)

### 7. 内外边距 (spacing)

- 可交互的盒模型编辑器 (InteractiveBoxModel组件)
- 详细配置：
  - 内边距简写 (text input)
  - 上/右/下/左内边距 (DomSizeRenderer)
  - 外边距简写 (text input)
  - 上/右/下/左外边距 (DomSizeRenderer)

### 8. Flex布局 (flex)

- Flex方向 (select: row/row-reverse/column/column-reverse)
- 主轴对齐 (select: flex-start/flex-end/center/space-between/space-around/space-evenly)
- 交叉轴对齐 (select: flex-start/flex-end/center/stretch/baseline)
- 换行 (select: nowrap/wrap/wrap-reverse)
- Flex增长 (number input)
- Flex收缩 (number input)
- Flex基准 (DomSizeRenderer)
- 对齐自身 (select: auto/flex-start/flex-end/center/stretch/baseline)

### 9. 定位配置 (position)

- 定位方式 (select: static/relative/absolute/fixed/sticky)
- 上/右/下/左 (DomSizeRenderer)
- Z-index (number input)

### 10. 字体配置 (font)

- 字体大小 (DomSizeRenderer)
- 字体颜色 (ColorRenderer)
- 字体系列 (text input)
- 字体粗细 (select: 100-900)
- 行高 (DomSizeRenderer)
- 文字对齐 (select: left/center/right/justify)

### 11. 边框配置 (border)

- 边框位置 (select: all/top/right/bottom/left)
- 边框样式 (select: none/solid/dashed/dotted/double)
- 边框宽度 (DomSizeRenderer)
- 边框颜色 (ColorRenderer)

### 12. 圆角配置 (radius)

- 统一圆角 (DomSizeRenderer)
- 左上/右上/左下/右下圆角 (DomSizeRenderer)

### 13. 背景配置 (background)

- 亮色主题背景色 (ColorRenderer)
- 暗色主题背景色 (ColorRenderer)
- 背景图片 (text input, URL)
- 背景位置 (text input)
- 背景尺寸 (text input)
- 背景重复 (select: no-repeat/repeat/repeat-x/repeat-y/round/space)

### 14. 生命周期事件 (lifecycle-events)

- mounted (select from dataOperations)
- beforeUnmount (select from dataOperations)

### 15. 鼠标事件 (mouse-events)

- click (select from dataOperations)
- dblclick (select from dataOperations)
- mouseenter (select from dataOperations)
- mouseleave (select from dataOperations)
- mousemove (select from dataOperations)
- mousedown (select from dataOperations)
- mouseup (select from dataOperations)

### 16. 键盘事件 (keyboard-events)

- keydown (select from dataOperations)
- keyup (select from dataOperations)
- keypress (select from dataOperations)

### 17. 表单事件 (form-events)

- change (select from dataOperations)
- input (select from dataOperations)
- focus (select from dataOperations)
- blur (select from dataOperations)
- submit (select from dataOperations)

## 现有组件复用

### 已有的字段渲染器

1. **DomSizeRenderer** - 尺寸编辑器（支持px, %, em, rem等单位）
2. **ColorRenderer** - 颜色选择器
3. **IconPickerField** - 图标选择器（集成IconLibraryManager）
4. **InteractiveBoxModel** - 可交互的盒模型编辑器

### 需要创建的字段渲染器

1. **TextField** - 文本输入
2. **NumberField** - 数字输入
3. **SelectField** - 下拉选择
4. **SwitchField** - 开关
5. **TextareaField** - 文本域
6. **SliderField** - 滑块

## 配置提取策略

### 阶段1：创建基础配置结构

1. 创建类型定义（PropertyFieldConfig, PropertyPanelConfig等）
2. 创建PropertyService并注册到DI容器
3. 创建PropertyFieldManager和PropertyPanelManager

### 阶段2：提取通用面板配置

1. **BasicPanel** - 基本信息、扩展属性、公共属性、数据绑定
2. **StylePanel** - 尺寸、内外边距、Flex、定位、字体、边框、圆角、背景
3. **EventPanel** - 生命周期、鼠标、键盘、表单事件

### 阶段3：创建字段渲染器

1. 创建FieldRenderer入口组件
2. 创建基础字段渲染器
3. 集成现有高级字段渲染器

### 阶段4：重构PropertiesPanel

1. 使用配置驱动渲染
2. 移除硬编码的字段定义
3. 保持UI结构和样式不变

## 配置示例

```typescript
// 基本信息面板配置示例
export const BasicPanelConfig: PropertyPanelConfig = {
  id: 'basic',
  name: '基本',
  icon: 'InfoCircleOutlined',
  groups: [
    {
      key: 'basic-info',
      name: '基本信息',
      fields: [
        {
          key: 'id',
          name: '控件ID',
          fieldType: 'text',
          readonly: true,
          disabled: true,
        },
        {
          key: 'name',
          name: '控件名称',
          fieldType: 'text',
          placeholder: '输入控件名称',
        },
        {
          key: 'permission',
          name: '权限绑定',
          fieldType: 'select',
          placeholder: '选择权限',
          allowClear: true,
          options: [],
        },
      ],
    },
    {
      key: 'common',
      name: '公共属性',
      fields: [
        {
          key: 'opacity',
          name: '透明度（1-100）',
          fieldType: 'slider',
          min: 1,
          max: 100,
          defaultValue: 100,
        },
        {
          key: 'classes',
          name: '样式类名',
          fieldType: 'text',
          placeholder: '输入CSS类名，空格分隔',
        },
      ],
    },
  ],
}
```

## 向后兼容策略

1. **保持settings字段格式**

   - 现有控件定义的settings字段继续有效
   - 自动转换为新的PropertyFieldConfig格式

2. **渐进式迁移**

   - 新旧系统可以共存
   - 优先使用propertyPanels配置
   - 如果没有propertyPanels，则使用settings

3. **配置转换工具**
   - 提供自动转换工具
   - 生成迁移报告
   - 验证转换结果
