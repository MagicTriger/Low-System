# 🔧 DomSizeRenderer 集成方案

## 📋 问题分析

### 当前状态

- ✅ `DomSizeRenderer.vue`组件已存在
- ✅ 组件功能完整(数值输入 + 单位选择)
- ❌ 组件没有被使用
- ❌ 属性面板使用简单的TEXT字段处理尺寸

### 问题

当前的尺寸输入体验不够好:

- 用户需要手动输入单位(如"100px")
- 容易输入错误的格式
- 没有单位选择器
- 不支持`ControlSize`类型

---

## ✅ 解决方案

### 方案1: 注册DomSizeRenderer为字段类型

#### 步骤1: 添加SIZE字段类型

**文件**: `src/core/infrastructure/fields/types.ts`

```typescript
export enum FieldType {
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  SWITCH = 'switch',
  TEXTAREA = 'textarea',
  COLOR = 'color',
  SLIDER = 'slider',
  ICON = 'icon',
  SIZE = 'size', // 新增: 尺寸字段类型
}
```

#### 步骤2: 注册DomSizeRenderer

**文件**: `src/core/infrastructure/fields/registry.ts`

在`registerDefaultRenderers`函数中添加:

```typescript
import DomSizeRenderer from '@/core/renderer/designer/settings/renderers/DomSizeRenderer.vue'

function registerDefaultRenderers() {
  // ... 其他渲染器

  // 注册尺寸渲染器
  this.register(FieldType.SIZE, DomSizeRenderer)

  console.log('✅ [FieldRegistry] Default renderers registered')
}
```

#### 步骤3: 更新LayoutPanel配置

**文件**: `src/core/infrastructure/panels/common/LayoutPanel.ts`

```typescript
export const LayoutPanel: PanelConfig = {
  group: PanelGroup.LAYOUT,
  title: '布局属性',
  icon: 'LayoutOutlined',
  collapsible: true,
  defaultExpanded: true,
  order: 2,
  fields: [
    {
      key: 'width',
      label: '宽度',
      type: FieldType.SIZE, // 改为SIZE类型
      placeholder: '输入宽度',
      tooltip: '组件宽度',
      layout: { span: 1 },
    },
    {
      key: 'height',
      label: '高度',
      type: FieldType.SIZE, // 改为SIZE类型
      placeholder: '输入高度',
      tooltip: '组件高度',
      layout: { span: 1 },
    },
    // margin和padding保持TEXT类型,因为它们支持简写格式
    {
      key: 'margin',
      label: '外边距',
      type: FieldType.TEXT,
      placeholder: '0, 10px, 10px 20px',
      tooltip: '组件外边距,支持简写格式',
      layout: { span: 2 },
      visualizer: {
        type: 'margin',
        interactive: true,
        preview: true,
      },
    },
    {
      key: 'padding',
      label: '内边距',
      type: FieldType.TEXT,
      placeholder: '0, 10px, 10px 20px',
      tooltip: '组件内边距,支持简写格式',
      layout: { span: 2 },
      visualizer: {
        type: 'padding',
        interactive: true,
        preview: true,
      },
    },
    // ... 其他字段
  ],
}
```

#### 步骤4: 更新handlePropertyUpdate处理尺寸类型

**文件**: `src/modules/designer/views/DesignerNew.vue`

在`handlePropertyUpdate`函数中添加尺寸类型的处理:

```typescript
function handlePropertyUpdate(property: string, value: any) {
  console.log('🔧 [DesignerNew] 属性更新:', property, '=', value)

  if (!selectedControlId.value || !selectedControl.value) {
    console.warn('❌ 没有选中的组件')
    return
  }

  const oldValue = selectedControl.value[property]

  // 处理尺寸类型(ControlSize)
  if (['width', 'height', 'top', 'right', 'bottom', 'left'].includes(property)) {
    // 尺寸属性 -> 更新到 layout
    const mergedLayout = {
      ...(selectedControl.value.layout || {}),
      [property]: value, // value是ControlSize对象 { type: 'px', value: 100 }
    }
    updateControl(selectedControlId.value, { layout: mergedLayout })
    console.log('✅ 尺寸属性已更新:', property, value)
  }
  // ... 其他属性处理
}
```

---

## 🔄 数据流

### 尺寸属性更新流程

```
用户在DomSizeRenderer中输入
  ↓
选择单位: px / % / rem
  ↓
emit('update:modelValue', { type: 'px', value: 100 })
  ↓
FieldRenderer接收到ControlSize对象
  ↓
emit('update', 'width', { type: 'px', value: 100 })
  ↓
PanelGroup.handleFieldUpdate
  ↓
PropertiesPanel.handlePropertyUpdate
  ↓
emit('update', 'width', { type: 'px', value: 100 })
  ↓
DesignerNew.handlePropertyUpdate
  ↓
更新到control.layout.width
  ↓
✅ 组件重新渲染
```

---

## 📊 数据结构

### ControlSize类型

```typescript
export enum ControlSizeType {
  None = 'none',
  Percent = '%',
  Pixel = 'px',
  Rem = 'rem',
}

export interface ControlSize {
  type?: ControlSizeType
  value?: number
}
```

### 示例数据

```typescript
// 100像素
{ type: 'px', value: 100 }

// 50%
{ type: '%', value: 50 }

// 2字宽
{ type: 'rem', value: 2 }

// 无/auto
undefined 或 { type: 'none' }
```

---

## 🧪 测试步骤

### 测试1: 宽度设置

1. **拖拽Button组件**到画布
2. **在属性面板找到"宽度"字段**
3. **应该看到**:
   - 左侧: 数字输入框
   - 右侧: 单位选择器(无/像素/%/字宽)
4. **输入100,选择"像素"**
5. **预期**: 按钮宽度变为100px

### 测试2: 高度设置

1. **选中Button组件**
2. **在属性面板找到"高度"字段**
3. **输入50,选择"%"**
4. **预期**: 按钮高度变为50%

### 测试3: 单位切换

1. **选中Button组件**
2. **设置宽度为100px**
3. **切换单位为"%"**
4. **预期**:
   - 数值保持100
   - 单位变为%
   - 按钮宽度变为100%

### 测试4: 无单位

1. **选中Button组件**
2. **设置宽度为100px**
3. **切换单位为"无"**
4. **预期**:
   - 输入框禁用
   - 按钮宽度恢复为auto

---

## 🎯 优势

使用`DomSizeRenderer`的优势:

1. **更好的用户体验**

   - 数值和单位分离
   - 单位选择器清晰直观
   - 避免输入错误

2. **类型安全**

   - 使用`ControlSize`类型
   - TypeScript类型检查
   - 避免字符串解析错误

3. **一致性**

   - 所有尺寸字段使用相同的组件
   - 统一的交互方式
   - 统一的数据格式

4. **可扩展性**
   - 易于添加新单位(如vw、vh)
   - 易于添加验证规则
   - 易于添加预设值

---

## 🔧 实施步骤

### 步骤1: 添加SIZE字段类型

```bash
# 修改 src/core/infrastructure/fields/types.ts
# 添加 SIZE = 'size' 到 FieldType 枚举
```

### 步骤2: 注册DomSizeRenderer

```bash
# 修改 src/core/infrastructure/fields/registry.ts
# 在 registerDefaultRenderers 中注册
```

### 步骤3: 更新LayoutPanel

```bash
# 修改 src/core/infrastructure/panels/common/LayoutPanel.ts
# 将 width 和 height 改为 SIZE 类型
```

### 步骤4: 更新属性处理

```bash
# 修改 src/modules/designer/views/DesignerNew.vue
# 在 handlePropertyUpdate 中添加尺寸处理
```

### 步骤5: 测试

```bash
# 刷新浏览器
# 测试宽度和高度设置
# 验证单位切换
```

---

## 📚 相关文件

1. **DomSizeRenderer组件**: `src/core/renderer/designer/settings/renderers/DomSizeRenderer.vue`
2. **字段类型定义**: `src/core/infrastructure/fields/types.ts`
3. **字段注册表**: `src/core/infrastructure/fields/registry.ts`
4. **布局面板配置**: `src/core/infrastructure/panels/common/LayoutPanel.ts`
5. **属性更新处理**: `src/modules/designer/views/DesignerNew.vue`
6. **基础类型定义**: `src/core/renderer/base.ts`

---

## 🎊 总结

集成`DomSizeRenderer`后:

- ✅ 更好的用户体验
- ✅ 类型安全的尺寸处理
- ✅ 统一的交互方式
- ✅ 易于扩展和维护

这个改进将显著提升属性面板的易用性! 🚀
