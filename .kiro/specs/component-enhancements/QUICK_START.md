# 组件库增强 - 快速开始

## 🎯 新功能概览

本次更新为低代码平台添加了以下功能：

1. **图标库系统** - 可视化选择图标，无需编写代码
2. **行内文本组件** - 快速添加和编辑文本
3. **增强按钮组件** - 支持图标、多种样式和状态

## 🚀 快速开始

### 1. 使用文本组件

#### 在设计器中使用

1. 打开设计器
2. 从左侧组件库找到"文本"组件
3. 拖拽到画布
4. 双击文本进行编辑
5. 在右侧属性面板配置样式

#### 可配置属性

- **基础属性**

  - 文本内容
  - 标签类型（span, p, div, h1-h6）
  - 可编辑开关
  - 占位符

- **样式属性**
  - 字体大小
  - 字体粗细
  - 文字颜色
  - 对齐方式
  - 行高
  - 字间距
  - 文本装饰
  - 字体系列

#### 示例

```typescript
// 创建文本组件
const textControl = {
  id: 'text_001',
  kind: 'text',
  name: '标题文本',
  props: {
    content: '欢迎使用低代码平台',
    tag: 'h1',
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1890ff',
    textAlign: 'center',
  },
}
```

### 2. 使用按钮组件

#### 在设计器中使用

1. 打开设计器
2. 从左侧组件库找到"按钮(新)"组件
3. 拖拽到画布
4. 在右侧属性面板配置

#### 可配置属性

- **基础属性**

  - 按钮文字
  - 按钮类型（默认、主要、虚线、文字、链接）
  - 按钮大小（大、中、小）
  - 按钮形状（默认、圆形、圆角）
  - 图标（从图标库选择）
  - 图标位置（左侧、右侧）
  - HTML类型

- **状态属性**

  - 加载状态
  - 禁用状态

- **样式属性**
  - 块级按钮
  - 危险按钮
  - 幽灵按钮

#### 示例

```typescript
// 创建按钮组件
const buttonControl = {
  id: 'button_001',
  kind: 'button-new',
  name: '提交按钮',
  props: {
    text: '提交',
    type: 'primary',
    size: 'large',
    icon: 'CheckOutlined',
    iconPosition: 'left',
    loading: false,
    disabled: false,
  },
  eventExection: {
    onClick: [
      {
        type: 'control',
        target: 'form_001',
        method: 'submit',
      },
    ],
  },
}
```

### 3. 使用图标库

#### 在属性面板中选择图标

1. 选中按钮组件
2. 在属性面板找到"图标"字段
3. 点击图标预览框
4. 在弹出的图标选择器中：
   - 使用搜索框搜索图标
   - 点击分类标签筛选
   - 点击图标进行选择
   - 点击清除按钮移除图标

#### 图标搜索技巧

- **按名称搜索**: 输入图标名称，如 "user"
- **按分类浏览**: 点击分类标签，如 "用户"、"文件"
- **按标签搜索**: 输入标签，如 "outlined"、"filled"

#### 可用图标库

当前集成了 **Ant Design Icons**，包含：

- 方向图标
- 提示图标
- 文件图标
- 用户图标
- 设置图标
- 编辑图标
- 图表图标
- 安全图标
- 等等...

#### 在代码中使用图标库

```typescript
import { getIconLibraryManager } from '@/core/renderer/icons'

// 获取图标管理器
const iconManager = getIconLibraryManager()

// 搜索图标
const result = iconManager.searchIcons({
  query: 'user',
  category: '用户',
  page: 1,
  pageSize: 50,
})

console.log(`找到 ${result.total} 个图标`)
result.icons.forEach(icon => {
  console.log(icon.name, icon.category)
})

// 获取特定图标
const userIcon = iconManager.getIcon('antd', 'UserOutlined')
if (userIcon) {
  // 使用图标组件
  const IconComponent = userIcon.component
}

// 获取所有分类
const categories = iconManager.getCategories()
console.log('可用分类:', categories)
```

## 📝 最佳实践

### 文本组件

1. **使用合适的标签**

   - 标题使用 h1-h6
   - 段落使用 p
   - 行内文本使用 span

2. **设置合理的字体大小**

   - 标题: 20-32px
   - 正文: 14-16px
   - 小字: 12px

3. **保持文本可读性**
   - 行高建议 1.5-2
   - 避免过长的行宽
   - 使用合适的颜色对比度

### 按钮组件

1. **选择合适的按钮类型**

   - 主要操作使用 primary
   - 次要操作使用 default
   - 危险操作使用 danger

2. **合理使用图标**

   - 图标应与按钮文字相关
   - 不要在小按钮上使用图标
   - 保持图标风格一致

3. **提供反馈**
   - 异步操作使用 loading 状态
   - 不可用时使用 disabled 状态

### 图标选择

1. **保持图标风格一致**

   - 在同一界面使用同一风格（outlined/filled）
   - 避免混用不同图标库

2. **选择语义明确的图标**

   - 图标应清晰表达功能
   - 必要时配合文字说明

3. **注意图标大小**
   - 按钮图标: 14-16px
   - 独立图标: 20-24px
   - 大图标: 32px+

## 🔧 故障排除

### 问题1: 图标不显示

**可能原因:**

- 图标名称错误
- 图标库未初始化

**解决方案:**

```typescript
// 检查图标是否存在
const icon = iconManager.getIcon('antd', 'YourIconName')
if (!icon) {
  console.error('图标不存在')
}

// 确保图标库已初始化
import { initializeIconLibraries } from '@/core/renderer/icons'
initializeIconLibraries()
```

### 问题2: 文本编辑不生效

**可能原因:**

- editable 属性设置为 false
- 事件冲突

**解决方案:**

```typescript
// 确保 editable 为 true
textControl.props.editable = true

// 检查是否有其他事件阻止编辑
```

### 问题3: 按钮点击无响应

**可能原因:**

- disabled 状态为 true
- 事件未正确配置

**解决方案:**

```typescript
// 检查按钮状态
buttonControl.props.disabled = false

// 检查事件配置
console.log(buttonControl.eventExection)
```

## 📚 更多资源

- [完整设计文档](.kiro/specs/component-enhancements/design.md)
- [需求文档](.kiro/specs/component-enhancements/requirements.md)
- [实施总结](.kiro/specs/component-enhancements/IMPLEMENTATION_SUMMARY.md)
- [任务列表](.kiro/specs/component-enhancements/tasks.md)

## 🎉 开始使用

现在你可以：

1. 启动设计器: `npm run dev`
2. 打开浏览器访问设计器
3. 尝试拖拽新组件到画布
4. 体验图标选择功能
5. 配置组件属性

祝你使用愉快！ 🚀
