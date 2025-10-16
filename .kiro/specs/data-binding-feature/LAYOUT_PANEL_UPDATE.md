# 样式布局配置面板完善

## 🎉 更新完成

样式布局配置面板已完善，所有配置字段都使用折叠框组织。

## ✅ 已完成的更新

### 1. 折叠面板结构

使用Ant Design的Collapse组件，将所有配置分组到折叠面板中：

- ✅ **定位** - 定位类型、边界、层级
- ✅ **弹性布局** - 尺寸、溢出、Flex、Grid、对齐
- ✅ **字体** - 字体大小、颜色、字重、行高、对齐
- ✅ **边框** - 线条样式、宽度、颜色、图片
- ✅ **圆角** - 统一圆角、四个角单独设置
- ✅ **背景** - 背景颜色、渐变、图片、大小、重复、位置
- ✅ **样式** - CSS类、CSS样式
- ✅ **其它** - 透明度、动态缩放
- ✅ **内边距** - 填充、上下左右填充

### 2. 配置字段详情

#### 定位面板

```
- 定位类型 (position)
- 上边界 (top)
- 下边界 (bottom)
- 左边界 (left)
- 右边界 (right)
- 层级 (z-index)
```

#### 弹性布局面板

```
- 宽度 (width)
- 最小宽度 (min-width)
- 最大宽度 (max-width)
- 高度 (height)
- 最小高度 (min-height)
- 最大高度 (max-height)
- 水平溢出 (overflow-x)
- 垂直溢出 (overflow-y)
- 填充 (flex)
- 上填充 (flex-grow)
- 下填充 (flex-shrink)
- 左填充 (flex-basis)
- 右填充 (align-self)
- 边距 (margin)
- 上边距 (margin-top)
- 下边距 (margin-bottom)
- 左边距 (margin-left)
- 右边距 (margin-right)
- 排列方向 (flex-direction)
- 行配置 (flex-wrap)
- 列间距 (column-gap)
- 行间距 (row-gap)
- 主轴对齐 (justify-content)
- 侧轴对齐 (align-items)
- 内容侧轴对齐 (align-content)
- 跨行 (grid-row)
- 跨列 (grid-column)
- 垂直对齐 (vertical-align)
- 水平对齐 (text-align)
```

#### 字体面板

```
- font-size
- 颜色 (color)
- font-family
- font-weight (normal, bold, 100-900)
- line-height
- 文本对齐 (左对齐、居中、右对齐、两端)
```

#### 边框面板

```
- 线条样式 (border-style)
- 边框宽度 (border-width)
- 边框颜色 (border-color)
- 边框图片 (border-image)
```

#### 圆角面板

```
- border-radius (统一圆角)
- 左上 (border-top-left-radius)
- 右上 (border-top-right-radius)
- 左下 (border-bottom-left-radius)
- 右下 (border-bottom-right-radius)
```

#### 背景面板

```
- 背景颜色 (background-color)
- 渐变色 (background-image)
- 背景图片 (background-image)
- 背景大小 (background-size)
- repeat (background-repeat)
- position (background-position)
```

#### 样式面板

```
- CSS 类 (classes)
- CSS 样式 (自定义CSS)
```

#### 其它面板

```
- 透明度 (opacity) - 滑块控制 0-100
- 动态缩放 (transform) - 开关
```

#### 内边距面板

```
- 填充 (padding)
- 上填充 (padding-top)
- 下填充 (padding-bottom)
- 左填充 (padding-left)
- 右填充 (padding-right)
```

### 3. UI特性

#### 深色主题

- ✅ 深色背景 (#1a1d23)
- ✅ 深色输入框 (#22252b)
- ✅ 深色边框 (#3d4149)
- ✅ 浅色文字 (#e5e7eb)
- ✅ 灰色标签 (#9ca3af)

#### 交互体验

- ✅ 折叠面板展开/收起动画
- ✅ 输入框聚焦高亮
- ✅ 下拉选择器
- ✅ 颜色选择器
- ✅ 滑块控制
- ✅ 按钮组
- ✅ 开关控件

#### 响应式设计

- ✅ 自适应宽度
- ✅ 滚动条样式
- ✅ 紧凑布局

### 4. 功能特性

#### 实时更新

- ✅ 所有配置修改实时生效
- ✅ 自动清理空值
- ✅ 样式对象同步

#### 智能处理

- ✅ CSS类名解析
- ✅ CSS样式字符串解析
- ✅ 透明度百分比转换
- ✅ 驼峰命名转换

#### 数据绑定

- ✅ 双向数据绑定
- ✅ 监听control变化
- ✅ 自动初始化值

## 📸 UI效果

### 折叠面板布局

```
┌─────────────────────────────────────┐
│ ▼ 定位                              │
│   定位类型: [relative ▼]            │
│   上边界: [无                    ]  │
│   下边界: [无                    ]  │
│   ...                               │
├─────────────────────────────────────┤
│ ▼ 弹性布局                          │
│   宽度: [无                      ]  │
│   最小宽度: [无                  ]  │
│   ...                               │
├─────────────────────────────────────┤
│ ▼ 字体                              │
│   font-size: [无                 ]  │
│   颜色: [🎨                      ]  │
│   ...                               │
├─────────────────────────────────────┤
│ ▼ 边框                              │
│   线条样式: [solid ▼]              │
│   边框宽度: [1px                 ]  │
│   ...                               │
├─────────────────────────────────────┤
│ ▼ 圆角                              │
│   border-radius: [无             ]  │
│   [左上]  [右上]                    │
│   [左下]  [右下]                    │
├─────────────────────────────────────┤
│ ▼ 背景                              │
│   背景颜色: [🎨                  ]  │
│   渐变色: [无                    ]  │
│   ...                               │
├─────────────────────────────────────┤
│ ▼ 样式                              │
│   CSS 类: [无                    ]  │
│   CSS 样式: [                    ]  │
│             [                    ]  │
├─────────────────────────────────────┤
│ ▼ 其它                              │
│   透明度: ━━━━━━━━━━━━━━━━━ 100   │
│   动态缩放: [○]                     │
├─────────────────────────────────────┤
│ ▼ 内边距                            │
│   填充: [无                      ]  │
│   上填充: [无                    ]  │
│   ...                               │
└─────────────────────────────────────┘
```

## 🎯 使用方式

### 基本使用

```vue
<template>
  <LayoutPanel :control="selectedControl" @update="handleUpdate" />
</template>

<script setup>
import LayoutPanel from '@/core/renderer/designer/settings/LayoutPanel.vue'

const selectedControl = ref(null)

function handleUpdate(property, value) {
  if (selectedControl.value) {
    selectedControl.value[property] = value
  }
}
</script>
```

### 配置示例

#### 设置定位

```javascript
// 绝对定位，距离顶部20px，左侧30px
{
  position: 'absolute',
  top: '20px',
  left: '30px',
  zIndex: 10
}
```

#### 设置Flex布局

```javascript
// Flex容器，居中对齐
{
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'center',
  alignItems: 'center',
  gap: '10px'
}
```

#### 设置字体样式

```javascript
// 字体配置
{
  fontSize: '16px',
  fontFamily: 'Arial, sans-serif',
  fontWeight: '500',
  lineHeight: '1.5',
  color: '#333333'
}
```

#### 设置边框和圆角

```javascript
// 边框和圆角
{
  borderStyle: 'solid',
  borderWidth: '1px',
  borderColor: '#e5e7eb',
  borderRadius: '8px'
}
```

#### 设置背景

```javascript
// 背景配置
{
  backgroundColor: '#ffffff',
  backgroundImage: 'linear-gradient(to right, #667eea, #764ba2)',
  backgroundSize: 'cover',
  backgroundPosition: 'center center'
}
```

## 🔧 技术实现

### 组件结构

```
LayoutPanel.vue
├── template
│   ├── panel-empty (无选择状态)
│   └── panel-content
│       └── a-collapse (折叠面板容器)
│           ├── a-collapse-panel (定位)
│           ├── a-collapse-panel (弹性布局)
│           ├── a-collapse-panel (字体)
│           ├── a-collapse-panel (边框)
│           ├── a-collapse-panel (圆角)
│           ├── a-collapse-panel (背景)
│           ├── a-collapse-panel (样式)
│           ├── a-collapse-panel (其它)
│           └── a-collapse-panel (内边距)
├── script
│   ├── activeKeys (展开的面板)
│   ├── styles (样式对象)
│   ├── cssClass (CSS类)
│   ├── cssStyle (CSS样式)
│   ├── opacityValue (透明度)
│   ├── updateStyles() (更新样式)
│   ├── setStyle() (设置单个样式)
│   ├── updateCssClass() (更新CSS类)
│   ├── updateCssStyle() (更新CSS样式)
│   └── updateOpacity() (更新透明度)
└── style
    ├── 深色主题样式
    ├── 折叠面板样式
    ├── 输入框样式
    └── 滚动条样式
```

### 数据流

```
1. control变化 → watch监听
2. 初始化styles对象
3. 用户修改配置 → updateStyles()
4. 清理空值 → emit('update')
5. 父组件更新control
```

### 样式处理

```javascript
// 清理空值
const cleanedStyles = {}
Object.keys(styles.value).forEach(key => {
  const value = styles.value[key]
  if (value !== undefined && value !== null && value !== '') {
    cleanedStyles[key] = value
  }
})

// 发送更新
emit('update', 'styles', cleanedStyles)
```

## 📝 注意事项

1. **默认展开** - 所有面板默认展开，方便快速访问
2. **实时更新** - 所有修改立即生效，无需保存按钮
3. **空值清理** - 自动清理空值，保持数据整洁
4. **类型安全** - 使用TypeScript确保类型安全
5. **深色主题** - 统一的深色主题风格

## 🎊 总结

样式布局配置面板已完全重构，提供了：

- ✅ 完整的CSS属性配置
- ✅ 折叠面板组织结构
- ✅ 深色主题UI
- ✅ 实时更新机制
- ✅ 智能数据处理
- ✅ 友好的用户体验

所有配置字段都已添加，并使用折叠框进行组织，符合设计要求！

---

**更新日期**: 2025-10-11  
**版本**: 2.0.0  
**状态**: ✅ 完成
