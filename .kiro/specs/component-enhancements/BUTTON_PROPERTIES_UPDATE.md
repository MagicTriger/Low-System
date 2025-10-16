# 按钮组件属性面板更新

## 更新日期

2025-10-12

## 更新内容

### 删除的组件

1. ✅ 删除了 `src/core/renderer/controls/basic/Text.vue` - 旧的文本组件
2. ✅ 删除了 `src/core/renderer/controls/basic/Button.vue` - 旧的按钮组件

### 修改的文件

1. ✅ `src/core/renderer/controls/register.ts`
   - 移除了 Text 和 ButtonNew 组件的导入
   - 删除了 text 组件的定义（kind: 'text'）
   - 删除了 button-new 组件的定义（kind: 'button-new'）
   - 重新组织了 button 组件的属性配置

## 按钮组件新的属性结构

按照图片要求，按钮组件的属性现在按以下分组组织：

### 1. 基本 (basic)

这些属性由系统自动生成和显示：

- 控件ID (自动生成)
- 实例ID (自动生成)
- 控件名称 (用户可编辑)
- 权限绑定 (下拉选择)

### 2. 数据 (data)

```typescript
{
  key: 'dataSource',
  name: '数据源',
  type: 'select',
  defaultValue: '',
  options: [],
  group: 'data',
}
```

### 3. 公共 (common)

```typescript
// 文本
{
  key: 'text',
  name: '文本',
  type: 'string',
  defaultValue: '',
  group: 'common',
}

// 图标
{
  key: 'icon',
  name: '图标',
  type: 'icon',
  defaultValue: '',
  group: 'common',
}

// 点击不冒泡
{
  key: 'stopPropagation',
  name: '点击不冒泡',
  type: 'boolean',
  defaultValue: false,
  group: 'common',
}
```

### 4. 扩展 (extend)

```typescript
// 大小
{
  key: 'size',
  name: '大小',
  type: 'select',
  defaultValue: '小',
  options: [
    { label: '小', value: 'small' },
    { label: '中', value: 'middle' },
    { label: '大', value: 'large' },
  ],
  group: 'extend',
}

// 类型
{
  key: 'type',
  name: '类型',
  type: 'select',
  defaultValue: 'link',
  options: [
    { label: 'default', value: 'default' },
    { label: 'primary', value: 'primary' },
    { label: 'dashed', value: 'dashed' },
    { label: 'text', value: 'text' },
    { label: 'link', value: 'link' },
  ],
  group: 'extend',
}

// 背景透明
{
  key: 'ghost',
  name: '背景透明',
  type: 'boolean',
  defaultValue: false,
  group: 'extend',
}

// 危险
{
  key: 'danger',
  name: '危险',
  type: 'boolean',
  defaultValue: false,
  group: 'extend',
}

// 形状
{
  key: 'shape',
  name: '形状',
  type: 'select',
  defaultValue: '',
  options: [
    { label: '默认', value: '' },
    { label: '圆形', value: 'circle' },
    { label: '圆角', value: 'round' },
  ],
  group: 'extend',
}
```

## 属性分组说明

### basic (基本)

- 显示组件的基础信息
- 包括系统自动生成的ID和用户可编辑的名称
- 权限绑定用于控制组件的访问权限

### data (数据)

- 数据源配置
- 用于绑定数据到组件

### common (公共)

- 所有按钮都需要的通用属性
- 文本：按钮显示的文字
- 图标：按钮的图标（使用图标选择器）
- 点击不冒泡：控制事件冒泡行为

### extend (扩展)

- 按钮的样式和行为扩展
- 大小：控制按钮尺寸
- 类型：控制按钮的视觉样式
- 背景透明：幽灵按钮效果
- 危险：危险操作的视觉提示
- 形状：按钮的形状样式

## 与图片的对应关系

图片中显示的属性面板结构：

```
按钮
├── 基本
│   ├── 控件ID: ctrl_1740381810715_2545
│   ├── 实例ID: inst_1760267890036_2678
│   ├── 控件名称: [输入框]
│   └── 权限绑定: [下拉选择]
├── 数据
│   └── 数据源: [下拉选择]
├── 公共
│   ├── 文本: [输入框]
│   ├── 图标: EditOutlined [下拉选择]
│   └── 点击不冒泡: [开关]
└── 扩展
    ├── 大小: 小 [下拉选择]
    ├── 类型: link [下拉选择]
    ├── 背景透明: [开关]
    ├── 危险: [开关]
    └── 形状: [下拉选择]
```

## 使用说明

### 在设计器中使用

1. 从组件库拖拽"按钮"组件到画布
2. 选中按钮组件
3. 在右侧属性面板查看和编辑属性
4. 属性按分组折叠显示：
   - 基本：显示组件基础信息
   - 数据：配置数据源
   - 公共：配置文本、图标等
   - 扩展：配置样式和行为

### 属性编辑器类型

- **string**: 文本输入框
- **select**: 下拉选择框
- **boolean**: 开关按钮
- **icon**: 图标选择器（弹出图标库）

## 注意事项

1. **dataBindable 设置为 true**

   - 按钮组件现在支持数据绑定
   - 可以通过数据源动态控制按钮属性

2. **图标选择器**

   - 图标字段使用 `type: 'icon'`
   - 会自动显示图标选择器
   - 用户可以从图标库中选择图标

3. **默认值**

   - 大小默认为"小"
   - 类型默认为"link"
   - 其他布尔值默认为 false

4. **分组名称**
   - basic: 基本
   - data: 数据
   - common: 公共
   - extend: 扩展

## 后续工作

### 需要在属性面板中实现

1. **基本信息显示**

   - 自动显示控件ID
   - 自动显示实例ID
   - 提供控件名称编辑
   - 提供权限绑定选择

2. **分组折叠**

   - 实现属性分组的折叠/展开
   - 默认展开常用分组
   - 记住用户的折叠状态

3. **属性编辑器**
   - 为每种类型提供合适的编辑器
   - 图标选择器集成
   - 数据源选择器集成

## 测试建议

1. **功能测试**

   - 测试每个属性的编辑
   - 测试属性的保存和恢复
   - 测试图标选择器

2. **UI测试**

   - 测试属性面板的布局
   - 测试分组的折叠/展开
   - 测试不同屏幕尺寸

3. **集成测试**
   - 测试与现有系统的集成
   - 测试数据绑定功能
   - 测试事件处理

## 总结

本次更新成功：

- ✅ 删除了旧的文本和按钮组件
- ✅ 重新组织了按钮组件的属性结构
- ✅ 按照图片要求分组属性
- ✅ 添加了新的属性（数据源、点击不冒泡等）
- ✅ 保持了与现有架构的兼容性

属性面板现在有了清晰的结构，更符合用户的使用习惯。
