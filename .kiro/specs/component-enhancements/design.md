# 组件库增强设计文档

## 概述

本文档描述如何在现有架构基础上添加行内文本、按钮组件和图标库系统。

## 架构

### 组件架构

```
src/core/renderer/
├── controls/
│   ├── basic/              # 基础组件
│   │   ├── Text.vue       # 行内文本组件
│   │   └── Button.vue     # 按钮组件
│   ├── container/          # 容器组件
│   └── form/              # 表单组件
├── icons/                  # 图标库系统
│   ├── IconLibrary.ts     # 图标库管理器
│   ├── IconPicker.vue     # 图标选择器组件
│   ├── icons/             # 图标定义
│   │   ├── antd.ts       # Ant Design图标集
│   │   └── custom.ts     # 自定义图标集
│   └── types.ts          # 图标类型定义
└── designer/
    └── settings/
        ├── PropertiesPanel.vue      # 属性面板（已存在）
        ├── TextProperties.vue       # 文本属性编辑器
        ├── ButtonProperties.vue     # 按钮属性编辑器
        └── IconPickerField.vue      # 图标选择字段
```

## 组件设计

### 1. 行内文本组件 (Text)

#### 数据模型

```typescript
interface TextControl extends BaseControl {
  kind: 'text'
  props: {
    content: string // 文本内容
    tag: 'span' | 'p' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
    fontSize?: number // 字体大小
    fontWeight?: string // 字体粗细
    color?: string // 文字颜色
    textAlign?: 'left' | 'center' | 'right' | 'justify'
    lineHeight?: number // 行高
    letterSpacing?: number // 字间距
    textDecoration?: string // 文本装饰
    fontFamily?: string // 字体
    editable?: boolean // 是否可编辑
  }
}
```

#### 组件特性

- 支持双击编辑
- 支持富文本格式
- 支持响应式字体大小
- 支持文本溢出处理

### 2. 按钮组件 (Button)

#### 数据模型

```typescript
interface ButtonControl extends BaseControl {
  kind: 'button'
  props: {
    text: string // 按钮文本
    type: 'primary' | 'default' | 'dashed' | 'text' | 'link'
    size: 'small' | 'middle' | 'large'
    shape?: 'default' | 'circle' | 'round'
    icon?: string // 图标名称
    iconPosition?: 'left' | 'right' // 图标位置
    loading?: boolean // 加载状态
    disabled?: boolean // 禁用状态
    block?: boolean // 块级按钮
    danger?: boolean // 危险按钮
    ghost?: boolean // 幽灵按钮
    htmlType?: 'button' | 'submit' | 'reset'
  }
  events: {
    onClick?: EventHandler // 点击事件
    onDoubleClick?: EventHandler // 双击事件
  }
}
```

#### 组件特性

- 支持多种按钮类型
- 支持图标配置
- 支持加载状态
- 支持事件绑定

### 3. 图标库系统

#### 图标库管理器

```typescript
interface IconDefinition {
  name: string // 图标名称
  category: string // 图标分类
  tags: string[] // 搜索标签
  component: Component // Vue组件
  svg?: string // SVG内容
}

interface IconLibrary {
  id: string // 图标库ID
  name: string // 图标库名称
  version: string // 版本
  icons: IconDefinition[] // 图标列表
}

class IconLibraryManager {
  private libraries: Map<string, IconLibrary>

  // 注册图标库
  registerLibrary(library: IconLibrary): void

  // 获取图标
  getIcon(libraryId: string, iconName: string): IconDefinition | null

  // 搜索图标
  searchIcons(query: string, category?: string): IconDefinition[]

  // 获取所有分类
  getCategories(libraryId?: string): string[]

  // 懒加载图标库
  loadLibrary(libraryId: string): Promise<IconLibrary>
}
```

#### 图标选择器组件

```vue
<template>
  <div class="icon-picker">
    <!-- 搜索框 -->
    <a-input-search v-model:value="searchQuery" placeholder="搜索图标..." @search="handleSearch" />

    <!-- 分类标签 -->
    <div class="icon-categories">
      <a-tag v-for="category in categories" :key="category" :checked="selectedCategory === category" @click="selectCategory(category)">
        {{ category }}
      </a-tag>
    </div>

    <!-- 图标网格 -->
    <div class="icon-grid">
      <div
        v-for="icon in filteredIcons"
        :key="icon.name"
        class="icon-item"
        :class="{ selected: selectedIcon === icon.name }"
        @click="selectIcon(icon)"
      >
        <component :is="icon.component" />
        <span class="icon-name">{{ icon.name }}</span>
      </div>
    </div>

    <!-- 分页 -->
    <a-pagination v-model:current="currentPage" :total="totalIcons" :pageSize="pageSize" size="small" />
  </div>
</template>
```

## 属性面板增强

### 属性分组

```typescript
interface PropertyGroup {
  key: string
  label: string
  icon?: string
  properties: PropertyDefinition[]
}

interface PropertyDefinition {
  key: string
  label: string
  type: 'text' | 'number' | 'color' | 'select' | 'switch' | 'icon' | 'textarea'
  defaultValue?: any
  options?: Array<{ label: string; value: any }>
  validation?: ValidationRule[]
  description?: string
}
```

### 属性编辑器

为不同类型的属性提供专用编辑器：

1. **文本编辑器** - 单行文本输入
2. **数字编辑器** - 数字输入，支持步进
3. **颜色编辑器** - 颜色选择器
4. **下拉编辑器** - 下拉选择框
5. **开关编辑器** - 布尔值开关
6. **图标编辑器** - 图标选择器
7. **文本域编辑器** - 多行文本输入

## 数据流

### 组件创建流程

```
用户拖拽组件
  ↓
创建组件定义
  ↓
注册到控件树
  ↓
渲染组件
  ↓
显示在画布
```

### 属性更新流程

```
用户修改属性
  ↓
验证属性值
  ↓
更新组件定义
  ↓
触发重新渲染
  ↓
更新画布显示
```

### 图标选择流程

```
用户点击图标选择器
  ↓
显示图标库面板
  ↓
用户搜索/浏览图标
  ↓
选择图标
  ↓
更新组件图标属性
  ↓
关闭图标库面板
```

## 错误处理

### 组件错误

- 组件渲染失败 → 显示错误占位符
- 属性验证失败 → 显示验证错误提示
- 图标加载失败 → 显示默认图标

### 图标库错误

- 图标库加载失败 → 显示错误提示，使用缓存
- 图标不存在 → 显示默认图标
- 搜索超时 → 显示加载提示

## 测试策略

### 单元测试

- 组件渲染测试
- 属性更新测试
- 图标库管理器测试
- 图标搜索测试

### 集成测试

- 组件拖拽创建测试
- 属性面板交互测试
- 图标选择流程测试

### E2E测试

- 完整的组件创建和配置流程
- 图标库使用流程
- 多组件协同测试

## 性能优化

### 图标库优化

1. **懒加载** - 按需加载图标库
2. **虚拟滚动** - 大量图标时使用虚拟滚动
3. **缓存** - 缓存已加载的图标
4. **预加载** - 预加载常用图标

### 组件优化

1. **按需渲染** - 只渲染可见组件
2. **防抖** - 属性更新防抖
3. **Memo** - 使用Vue的缓存机制
4. **异步组件** - 大型组件异步加载

## 扩展性

### 自定义图标库

支持用户添加自定义图标库：

```typescript
// 注册自定义图标库
iconLibraryManager.registerLibrary({
  id: 'custom',
  name: '自定义图标',
  version: '1.0.0',
  icons: [
    {
      name: 'my-icon',
      category: '自定义',
      tags: ['custom'],
      component: MyIconComponent,
    },
  ],
})
```

### 自定义属性编辑器

支持为特定属性类型注册自定义编辑器：

```typescript
// 注册自定义编辑器
propertyEditorRegistry.register('gradient', GradientEditor)
```

## 国际化

支持多语言：

```typescript
const i18n = {
  'zh-CN': {
    'component.text': '文本',
    'component.button': '按钮',
    'icon.search': '搜索图标',
    'property.fontSize': '字体大小',
  },
  'en-US': {
    'component.text': 'Text',
    'component.button': 'Button',
    'icon.search': 'Search Icons',
    'property.fontSize': 'Font Size',
  },
}
```
