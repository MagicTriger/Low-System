# 属性面板使用说明

## 概述

新的属性面板是一个功能完整的组件配置界面，支持所有样式配置字段，并提供可视化的布局图案辅助配置。

## 快速开始

### 1. 导入组件

```typescript
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'
```

### 2. 使用组件

```vue
<template>
  <PropertiesPanel
    :control="selectedControl"
    :dataSources="dataSources"
    :dataFlows="dataFlows"
    @update="handlePropertyUpdate"
    @updateBinding="handleBindingUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'
import type { Control, DataBinding } from '@/core/renderer/base'

const selectedControl = ref<Control | null>(null)
const dataSources = ref([])
const dataFlows = ref([])

function handlePropertyUpdate(property: string, value: any) {
  if (selectedControl.value) {
    selectedControl.value[property] = value
    // 触发重新渲染或保存
  }
}

function handleBindingUpdate(binding: DataBinding | undefined) {
  if (selectedControl.value) {
    selectedControl.value.dataBinding = binding
    // 触发重新渲染或保存
  }
}
</script>
```

## Props

### control

- **类型**: `Control | null`
- **必需**: 是
- **说明**: 当前选中的控件对象

### dataSources

- **类型**: `any[]`
- **必需**: 否
- **默认值**: `[]`
- **说明**: 可用的数据源列表

### dataFlows

- **类型**: `any[]`
- **必需**: 否
- **默认值**: `[]`
- **说明**: 可用的数据流列表

## Events

### update

- **参数**: `(property: string, value: any)`
- **说明**: 当属性值变更时触发
- **示例**:
  ```typescript
  function handlePropertyUpdate(property: string, value: any) {
    console.log(`属性 ${property} 更新为:`, value)
    // 更新控件对象
    selectedControl.value[property] = value
  }
  ```

### updateBinding

- **参数**: `(binding: DataBinding | undefined)`
- **说明**: 当数据绑定配置变更时触发
- **示例**:
  ```typescript
  function handleBindingUpdate(binding: DataBinding | undefined) {
    console.log('数据绑定更新:', binding)
    // 更新控件的数据绑定
    selectedControl.value.dataBinding = binding
  }
  ```

## 配置字段

### 基本信息

- `id` - 组件ID（只读）
- `name` - 组件名称
- `kind` - 组件类型（只读）

### 布局配置

- `layout.width` - 宽度
- `layout.height` - 高度
- `layout.minWidth` - 最小宽度
- `layout.minHeight` - 最小高度
- `layout.maxWidth` - 最大宽度
- `layout.maxHeight` - 最大高度

### 内外边距

- `layout.padding` - 内边距（简写）
- `layout.paddingTop` - 上内边距
- `layout.paddingRight` - 右内边距
- `layout.paddingBottom` - 下内边距
- `layout.paddingLeft` - 左内边距
- `layout.margin` - 外边距（简写）
- `layout.marginTop` - 上外边距
- `layout.marginRight` - 右外边距
- `layout.marginBottom` - 下外边距
- `layout.marginLeft` - 左外边距

### Flex布局

- `layout.flexDirection` - Flex方向
- `layout.flexWrap` - Flex换行
- `layout.justifyContent` - 主轴对齐
- `layout.alignItems` - 交叉轴对齐
- `layout.alignContent` - 内容对齐
- `layout.columnGap` - 列间距
- `layout.rowGap` - 行间距

### 定位配置

- `position.position` - 定位类型
- `position.left` - 左边界
- `position.right` - 右边界
- `position.top` - 上边界
- `position.bottom` - 下边界
- `position.zIndex` - 层级

### 字体配置

- `font.fontSize` - 字体大小
- `font.color` - 字体颜色
- `font.fontFamily` - 字体族
- `font.fontStyle` - 字体样式
- `font.fontWeight` - 字体粗细
- `font.lineHeight` - 行高
- `font.textAlign` - 文字对齐

### 边框配置

- `border.position` - 边框位置
- `border.style` - 边框样式
- `border.width` - 边框宽度
- `border.color` - 边框颜色

### 圆角配置

- `radius.borderRadius` - 统一圆角
- `radius.borderTopLeftRadius` - 左上圆角
- `radius.borderTopRightRadius` - 右上圆角
- `radius.borderBottomLeftRadius` - 左下圆角
- `radius.borderBottomRightRadius` - 右下圆角

### 背景配置

- `background.color` - 亮色主题背景色
- `background.darkColor` - 暗色主题背景色
- `background.image` - 背景图片
- `background.position` - 背景位置
- `background.size` - 背景尺寸
- `background.repeat` - 背景重复

### 其他配置

- `opacity` - 透明度（1-100）
- `classes` - 样式类名

### 数据绑定

- `dataBinding.bindingType` - 绑定类型
- `dataBinding.source` - 数据源
- `dataBinding.dataFlowId` - 数据流ID
- `dataBinding.propertyPath` - 属性路径
- `dataBinding.autoLoad` - 自动加载
- `dataBinding.refreshInterval` - 刷新间隔
- `dataBinding.transform` - 转换表达式

## 类型定义

### Control

```typescript
interface Control {
  id: string
  kind: string
  name?: string
  layout?: ControlLayout
  position?: ControlPosition
  font?: ControlFont
  border?: ControlBorder
  radius?: ControlBorderRadius
  background?: ControlBackground
  opacity?: number
  classes?: string[]
  dataBinding?: DataBinding
  // ... 其他字段
}
```

### ControlSize

```typescript
interface ControlSize {
  type?: 'px' | '%' | 'rem'
  value?: number
}
```

### ControlLayout

```typescript
interface ControlLayout {
  width?: ControlSize
  height?: ControlSize
  minWidth?: ControlSize
  minHeight?: ControlSize
  maxWidth?: ControlSize
  maxHeight?: ControlSize
  padding?: string
  paddingTop?: ControlSize
  paddingRight?: ControlSize
  paddingBottom?: ControlSize
  paddingLeft?: ControlSize
  margin?: string
  marginTop?: ControlSize
  marginRight?: ControlSize
  marginBottom?: ControlSize
  marginLeft?: ControlSize
  flexDirection?: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  flexWrap?: 'nowrap' | 'wrap' | 'wrap-reverse'
  justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch'
  alignContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'stretch'
  columnGap?: ControlSize
  rowGap?: ControlSize
  // ... 其他字段
}
```

### DataBinding

```typescript
interface DataBinding {
  source: string
  bindingType: 'direct' | 'dataflow' | 'manual'
  dataFlowId?: string
  propertyPath?: string
  autoLoad?: boolean
  refreshInterval?: number
  transform?: string
}
```

## 使用示例

### 示例1：基本使用

```vue
<template>
  <div class="designer">
    <div class="canvas">
      <!-- 画布区域 -->
    </div>
    <div class="properties">
      <PropertiesPanel :control="selectedControl" @update="handlePropertyUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'

const selectedControl = ref({
  id: 'button_1',
  kind: 'Button',
  name: '按钮',
  layout: {
    width: { type: 'px', value: 120 },
    height: { type: 'px', value: 40 },
  },
})

function handlePropertyUpdate(property: string, value: any) {
  selectedControl.value[property] = value
}
</script>
```

### 示例2：带数据绑定

```vue
<template>
  <PropertiesPanel
    :control="selectedControl"
    :dataSources="dataSources"
    :dataFlows="dataFlows"
    @update="handlePropertyUpdate"
    @updateBinding="handleBindingUpdate"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'

const selectedControl = ref({
  id: 'table_1',
  kind: 'Table',
  name: '数据表格',
})

const dataSources = ref([
  { id: 'ds1', name: '用户数据源' },
  { id: 'ds2', name: '订单数据源' },
])

const dataFlows = ref([
  { id: 'df1', name: '用户列表流' },
  { id: 'df2', name: '订单列表流' },
])

function handlePropertyUpdate(property: string, value: any) {
  selectedControl.value[property] = value
  console.log('属性更新:', property, value)
}

function handleBindingUpdate(binding: DataBinding | undefined) {
  selectedControl.value.dataBinding = binding
  console.log('绑定更新:', binding)
}
</script>
```

### 示例3：完整配置

```typescript
const control: Control = {
  id: 'container_1',
  kind: 'Container',
  name: 'Flex容器',
  layout: {
    width: { type: 'px', value: 800 },
    height: { type: 'px', value: 600 },
    padding: '20px',
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    columnGap: { type: 'px', value: 16 },
  },
  position: {
    position: 'relative',
    zIndex: 1,
  },
  font: {
    fontSize: { type: 'px', value: 14 },
    color: '#333333',
    fontFamily: 'Arial, sans-serif',
    fontWeight: 400,
  },
  border: {
    position: 'all',
    style: 'solid',
    width: { type: 'px', value: 1 },
    color: '#e0e0e0',
  },
  radius: {
    borderRadius: { type: 'px', value: 8 },
  },
  background: {
    color: '#ffffff',
    darkColor: '#1e1e1e',
  },
  opacity: 100,
  classes: ['custom-container', 'flex-layout'],
  dataBinding: {
    source: 'ds1',
    bindingType: 'dataflow',
    dataFlowId: 'df1',
    propertyPath: 'items',
    autoLoad: true,
    refreshInterval: 5000,
  },
}
```

## 子组件

### DomSizeRenderer

尺寸输入组件，支持数值和单位选择。

```vue
<DomSizeRenderer v-model="sizeValue" placeholder="输入尺寸" />
```

### ColorRenderer

颜色选择组件，支持颜色选择器和文本输入。

```vue
<ColorRenderer v-model="colorValue" placeholder="选择颜色" />
```

### LayoutDiagram

布局图案组件，可视化展示布局配置。

```vue
<!-- Flex布局图案 -->
<LayoutDiagram type="flex" :flexDirection="flexDirection" :justifyContent="justifyContent" :alignItems="alignItems" />

<!-- 盒模型图案 -->
<LayoutDiagram type="box" />

<!-- 定位图案 -->
<LayoutDiagram type="position" :positionType="positionType" />
```

## 样式定制

属性面板使用深色主题，如果需要定制样式，可以覆盖以下CSS变量：

```css
.properties-panel {
  --bg-primary: #1e1e1e;
  --bg-secondary: #252526;
  --bg-tertiary: #2d2d30;
  --border-color: #3e3e42;
  --text-primary: #d4d4d4;
  --text-secondary: #9ca3af;
  --text-hint: #6b7280;
  --accent-color: #60a5fa;
}
```

## 注意事项

1. **Control对象必须是响应式的**

   ```typescript
   const control = ref<Control>({ ... })  // ✅ 正确
   const control: Control = { ... }       // ❌ 错误
   ```

2. **处理update事件时要更新原对象**

   ```typescript
   function handlePropertyUpdate(property: string, value: any) {
     // ✅ 正确 - 更新响应式对象
     selectedControl.value[property] = value

     // ❌ 错误 - 创建新对象会丢失响应性
     selectedControl.value = { ...selectedControl.value, [property]: value }
   }
   ```

3. **嵌套对象的更新**

   ```typescript
   function updateLayout(key: string, value: any) {
     // ✅ 正确 - 创建新的layout对象
     selectedControl.value.layout = {
       ...selectedControl.value.layout,
       [key]: value,
     }
   }
   ```

4. **数据源和数据流列表**
   - 确保提供正确的数据源和数据流列表
   - 列表项必须包含`id`和`name`字段

## 常见问题

### Q: 属性面板不显示？

A: 检查control prop是否为null，只有选中组件时才会显示配置界面。

### Q: 配置修改后组件没有更新？

A: 确保正确处理了update事件，并更新了响应式的control对象。

### Q: 布局图案不显示？

A: 检查LayoutDiagram组件是否正确导入，以及样式是否加载。

### Q: 颜色选择器不工作？

A: 确保使用的是现代浏览器（Chrome, Firefox, Edge），旧版浏览器可能不支持input type="color"。

### Q: 数据绑定配置不生效？

A: 检查是否正确处理了updateBinding事件，并确保数据源和数据流列表正确。

## 更多信息

- [完成说明文档](./PROPERTIES_PANEL_COMPLETE.md)
- [测试指南](./PROPERTIES_PANEL_TEST_GUIDE.md)
- [总结文档](./PROPERTIES_PANEL_SUMMARY.md)
- [样式布局配置面板字段定义文档](../../../docs/低代码平台样式布局配置面板字段定义文档.md)

## 支持

如有问题或建议，请联系开发团队。
