# 字段重复显示的根本原因分析

## 🔍 问题发现

通过深入分析代码,我发现了字段重复显示的**真正原因**:

### 问题根源

在`src/core/renderer/controls/register.ts`中,按钮控件定义包含了`settings`数组:

```typescript
{
  kind: 'button',
  kindName: '按钮',
  type: ControlType.Common,
  icon: 'button',
  component: ButtonControl,
  dataBindable: true,
  settings: [
    // 数据分组
    {
      key: 'dataSource',
      name: '数据源',
      type: 'select',
      defaultValue: '',
      options: [],
      group: 'data',
    },
    // 公共分组
    {
      key: 'text',
      name: '文本',
      type: 'string',
      defaultValue: '',
      group: 'common',
    },
    {
      key: 'icon',
      name: '图标',
      type: 'icon',
      defaultValue: '',
      group: 'common',
    },
    // ... 更多字段
  ],
}
```

同时,在`src/core/renderer/properties/panels/BasicPanel.ts`中,也定义了通用字段:

```typescript
export const BasicPanelConfig: PropertyPanelConfig = {
  id: 'basic',
  name: '基本',
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
        },
        {
          key: 'name',
          name: '控件名称',
          fieldType: 'text',
        },
        // ...
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
        },
        {
          key: 'classes',
          name: '样式类名',
          fieldType: 'text',
        },
      ],
    },
  ],
}
```

## 🔴 重复来源

字段重复显示是因为:

1. **控件特定字段** (来自`settings`数组)
2. **通用面板字段** (来自`BasicPanel.ts`)

这两个来源的字段被**同时渲染**到属性面板中!

## 📊 当前渲染逻辑

在`PropertyPanelManager.ts`中:

```typescript
getPanelsForControl(controlKind: string): PropertyPanelConfig[] {
  // 1. 获取控件特定配置
  const controlConfig = this.controlPanels.get(controlKind)

  if (controlConfig && controlConfig.length > 0) {
    return controlConfig  // 返回控件特定面板
  }

  // 2. 如果没有控件特定配置,返回默认面板
  return this.getAllPanels()  // 返回所有默认面板(包括BasicPanel)
}
```

问题是:**控件定义中的`settings`字段被转换成了面板配置,但同时BasicPanel的通用字段也被包含进来了!**

## 🎯 解决方案

有几个可能的解决方案:

### 方案1: 合并字段(推荐)

修改`PropertyPanelManager`的逻辑,智能合并控件特定字段和通用字段,去除重复。

### 方案2: 分离字段

- 控件的`settings`只包含控件特定的字段
- BasicPanel只包含真正通用的字段(id, name, classes等)
- 不要在两个地方定义相同的字段

### 方案3: 优先级控制

- 如果控件有特定配置,只使用控件配置
- 如果控件没有特定配置,才使用默认面板

## 🔧 需要检查的代码

1. **PropertyPanelManager.ts** - `registerControlDefinitions`方法
   - 检查如何将控件的`settings`转换为面板配置
2. **PropertyPanelManager.ts** - `getPanelsForControl`方法

   - 检查如何合并控件配置和默认配置

3. **register.ts** - 按钮控件的`settings`定义
   - 检查是否有重复字段定义

## 📝 下一步行动

1. 检查`PropertyPanelManager.registerControlDefinitions`的实现
2. 确认字段合并逻辑
3. 实施去重机制
4. 测试修复效果

## 🚨 临时解决方案

如果需要快速修复,可以:

1. 从按钮控件的`settings`中移除与BasicPanel重复的字段
2. 或者修改`getPanelsForControl`只返回控件特定配置,不包含默认面板
