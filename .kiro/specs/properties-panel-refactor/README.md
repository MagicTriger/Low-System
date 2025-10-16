# 属性面板重构项目

## 📋 项目概述

本项目旨在将PropertiesPanel.vue中的配置面板字段提取到基础设施层，实现配置驱动的属性面板系统。

## 🎯 目标

1. **提高可维护性** - 集中管理所有字段配置
2. **便于扩展** - 新增字段类型更容易
3. **支持不同组件** - 不同组件可以有不同的面板配置需求
4. **代码复用** - 字段渲染器可以在多处使用

## 🏗️ 架构设计

### 核心组件

1. **配置系统**

   - `FieldConfigManager` - 字段配置管理器
   - `PanelConfigManager` - 面板配置管理器
   - 类型定义和验证规则

2. **字段渲染器**

   - `FieldRenderer` - 字段渲染器入口
   - 各种类型的字段组件（TextField, NumberField, ColorField等）
   - 自动验证和错误提示

3. **面板配置**
   - `BasicPanel` - 基础面板配置
   - `StylePanel` - 样式面板配置
   - `EventPanel` - 事件面板配置
   - 组件特定配置

### 目录结构

```
src/core/renderer/designer/settings/
├── PropertiesPanel.vue          # 简化后的主组件
├── config/                      # 配置系统
│   ├── types.ts                # 类型定义
│   ├── FieldConfigManager.ts   # 字段配置管理器
│   ├── PanelConfigManager.ts   # 面板配置管理器
│   └── index.ts                # 导出
├── fields/                      # 字段渲染器
│   ├── FieldRenderer.vue       # 渲染器入口
│   ├── TextField.vue           # 文本字段
│   ├── NumberField.vue         # 数字字段
│   ├── ColorField.vue          # 颜色字段
│   ├── SelectField.vue         # 选择字段
│   ├── SwitchField.vue         # 开关字段
│   ├── IconField.vue           # 图标字段
│   └── index.ts                # 注册
└── panels/                      # 面板配置
    ├── BasicPanel.ts           # 基础面板
    ├── StylePanel.ts           # 样式面板
    ├── EventPanel.ts           # 事件面板
    ├── TextControlPanel.ts     # 文本组件配置
    ├── ButtonControlPanel.ts   # 按钮组件配置
    └── index.ts                # 导出
```

## 📚 文档

- [需求文档](./requirements.md) - 详细的功能需求和验收标准
- [设计文档](./design.md) - 架构设计和技术方案
- [任务列表](./tasks.md) - 实施任务和进度

## 🚀 核心特性

### 1. 配置驱动

```typescript
// 定义字段配置
const fieldConfig: FieldConfig = {
  key: 'fontSize',
  label: '字体大小',
  type: 'number',
  defaultValue: 14,
  min: 12,
  max: 72,
  validation: [
    {
      type: 'required',
      message: '字体大小不能为空',
    },
  ],
}

// 注册字段
fieldConfigManager.registerField(fieldConfig)
```

### 2. 自动渲染

```vue
<template>
  <!-- 自动根据配置渲染字段 -->
  <FieldRenderer v-for="field in fields" :key="field.key" :config="field" v-model="values[field.key]" />
</template>
```

### 3. 字段验证

```typescript
// 自动验证字段值
const result = fieldConfigManager.validateField(config, value)
if (!result.valid) {
  console.error(result.message)
}
```

### 4. 依赖条件

```typescript
// 字段依赖条件
const fieldConfig: FieldConfig = {
  key: 'bindingField',
  label: '绑定字段',
  type: 'text',
  dependsOn: {
    field: 'dataSourceId',
    operator: 'ne',
    value: '',
  },
}
// 只有当dataSourceId不为空时才显示
```

### 5. 自定义渲染器

```typescript
// 注册自定义字段类型
fieldConfigManager.registerRenderer('gradient', GradientPickerField)

// 使用自定义字段
const fieldConfig: FieldConfig = {
  key: 'background',
  label: '背景渐变',
  type: 'gradient',
}
```

## 📖 使用示例

### 创建面板配置

```typescript
// panels/ButtonControlPanel.ts
import type { PanelConfig } from '../config/types'

export const buttonPanelConfig: PanelConfig = {
  id: 'control-button',
  title: '按钮属性',
  tabs: [
    {
      key: 'basic',
      title: '基本',
      icon: 'InfoCircleOutlined',
      groups: [
        {
          key: 'button-props',
          title: '按钮属性',
          fields: [
            {
              key: 'text',
              label: '按钮文字',
              type: 'text',
              placeholder: '输入按钮文字',
              required: true,
            },
            {
              key: 'type',
              label: '按钮类型',
              type: 'select',
              defaultValue: 'default',
              options: [
                { label: '默认', value: 'default' },
                { label: '主要', value: 'primary' },
                { label: '危险', value: 'danger' },
              ],
            },
            {
              key: 'icon',
              label: '图标',
              type: 'icon',
            },
          ],
        },
      ],
    },
  ],
}

// 注册配置
panelConfigManager.registerPanel(buttonPanelConfig)
```

### 使用面板配置

```vue
<template>
  <div class="properties-panel">
    <a-tabs v-model:activeKey="activeTab">
      <a-tab-pane v-for="tab in panelConfig.tabs" :key="tab.key" :tab="tab.title">
        <a-collapse>
          <a-collapse-panel v-for="group in tab.groups" :key="group.key" :header="group.title">
            <FieldRenderer
              v-for="field in group.fields"
              :key="field.key"
              :config="field"
              v-model="values[field.key]"
              @change="handleFieldChange"
            />
          </a-collapse-panel>
        </a-collapse>
      </a-tab-pane>
    </a-tabs>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getPanelConfigManager } from './config'
import FieldRenderer from './fields/FieldRenderer.vue'

const props = defineProps<{
  control: Control
}>()

const panelConfigManager = getPanelConfigManager()

// 根据组件类型加载配置
const panelConfig = computed(() => {
  return panelConfigManager.getPanelForControl(props.control.kind)
})
</script>
```

## 🎨 优势

### 对比现有实现

**现有方式（硬编码）:**

```vue
<template>
  <div class="property-group">
    <label>字体大小</label>
    <a-input-number v-model:value="fontSize" :min="12" :max="72" @change="handleChange" />
  </div>
  <div class="property-group">
    <label>字体颜色</label>
    <ColorPicker v-model:value="fontColor" @change="handleChange" />
  </div>
  <!-- 更多字段... -->
</template>
```

**新方式（配置驱动）:**

```typescript
// 配置文件
const fields = [
  {
    key: 'fontSize',
    label: '字体大小',
    type: 'number',
    min: 12,
    max: 72
  },
  {
    key: 'fontColor',
    label: '字体颜色',
    type: 'color'
  }
]

// 组件中
<FieldRenderer
  v-for="field in fields"
  :key="field.key"
  :config="field"
  v-model="values[field.key]"
/>
```

### 优势总结

1. **代码量减少** - 减少80%的模板代码
2. **易于维护** - 配置集中管理
3. **易于扩展** - 新增字段只需添加配置
4. **类型安全** - TypeScript类型定义
5. **自动验证** - 内置验证机制
6. **可复用** - 字段渲染器可在多处使用

## 📊 实施计划

### 阶段划分

1. **阶段1: 基础架构** (2-3天)

   - 创建类型定义
   - 实现配置管理器
   - 创建全局单例

2. **阶段2: 字段渲染器** (2-3天)

   - 创建FieldRenderer组件
   - 实现基础字段渲染器
   - 实现高级字段渲染器

3. **阶段3: 配置提取** (2-3天)

   - 提取基础面板配置
   - 提取样式面板配置
   - 提取事件面板配置

4. **阶段4: 组件重构** (2-3天)

   - 简化PropertiesPanel
   - 集成字段渲染器
   - 实现动态加载

5. **阶段5: 特定配置** (1天)

   - 创建组件特定配置
   - 注册到管理器

6. **阶段6: 测试优化** (1-2天)
   - 功能测试
   - 性能优化
   - 文档更新

### 总计时间

10-15天

## 🔧 开发指南

### 添加新字段类型

1. 创建字段渲染器组件
2. 注册到FieldConfigManager
3. 在配置中使用

```typescript
// 1. 创建渲染器
// fields/GradientField.vue
<template>
  <div class="gradient-field">
    <!-- 渐变选择器UI -->
  </div>
</template>

// 2. 注册渲染器
import GradientField from './GradientField.vue'
fieldConfigManager.registerRenderer('gradient', GradientField)

// 3. 使用
const fieldConfig: FieldConfig = {
  key: 'background',
  label: '背景渐变',
  type: 'gradient'
}
```

### 添加组件特定配置

```typescript
// panels/MyControlPanel.ts
export const myControlPanelConfig: PanelConfig = {
  id: 'control-mycontrol',
  tabs: [
    // 标签页配置
  ],
}

// 注册
panelConfigManager.registerPanel(myControlPanelConfig)
```

## 🎯 下一步

1. 查看[需求文档](./requirements.md)了解详细需求
2. 查看[设计文档](./design.md)了解架构设计
3. 查看[任务列表](./tasks.md)开始实施

## 📞 支持

如有问题或建议，请查看文档或联系开发团队。

---

**让我们一起构建更好的属性面板系统！** 🚀
