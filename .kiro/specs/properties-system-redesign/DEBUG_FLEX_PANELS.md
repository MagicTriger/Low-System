# Flex 容器面板调试指南

## 问题分析

Flex 容器的布局配置折叠框没有显示。根据代码分析，可能的原因：

1. **面板注册时序问题**: `registerControlDefinition` 使用动态导入注册面板，可能存在时序问题
2. **PropertyPanelService 未初始化**: 服务可能在组件定义注册时还未初始化
3. **面板配置格式问题**: custom 面板的配置可能不符合预期格式

## 调试步骤

### 步骤 1: 在浏览器控制台检查注册状态

打开浏览器控制台，运行以下命令：

```javascript
// 1. 检查控件定义是否注册
const { ControlDefinitions } = await import('/src/core/renderer/definitions.ts')
console.log('Flex definition:', ControlDefinitions['flex'])

// 2. 检查面板配置
if (ControlDefinitions['flex']) {
  console.log('Flex panels config:', ControlDefinitions['flex'].panels)
}

// 3. 检查 PropertyPanelService
const { getPropertyPanelService } = await import('/src/core/infrastructure/services/index.ts')
const service = getPropertyPanelService()
console.log('Service initialized:', service.isInitialized())

// 4. 检查 Flex 的面板是否注册
const panels = service.getPanelsForComponent('flex')
console.log('Flex panels:', panels)

// 5. 检查 PanelRegistry
const registry = service.getPanelRegistry()
console.log('Has flex panel:', registry.hasComponentPanel('flex'))
console.log('Flex panel config:', registry.getComponentPanelConfig('flex'))
```

### 步骤 2: 检查控制台日志

启动开发服务器后，查找以下日志：

```
✅ Registered control definition: flex
  ✓ Registered panels for flex
```

如果看到：

```
  ℹ️  PropertyPanelService not yet initialized for flex
```

说明面板注册时 PropertyPanelService 还未初始化。

### 步骤 3: 检查 PropertiesPanel 的日志

选中 Flex 容器后，查看控制台日志：

```
[PropertiesPanel] ✅ Selected control from props: {kind: 'flex', ...}
[PropertiesPanel] Got panels for flex : [...]
```

如果面板数组为空或只有通用面板（basic, layout, style, event），说明自定义面板没有注册成功。

## 解决方案

### 方案 1: 手动注册面板（临时方案）

在 `src/modules/designer/main.ts` 中手动注册 Flex 面板：

```typescript
import { getPropertyPanelService } from '@core/infrastructure/services'

// 在初始化后手动注册 Flex 面板
const service = getPropertyPanelService()
service.registerComponentPanel({
  componentType: 'flex',
  extends: ['basic', 'layout', 'style', 'event'],
  panels: [
    {
      group: 'component',
      title: 'Flex布局',
      icon: 'LayoutOutlined',
      order: 1,
      fields: [
        {
          key: 'flexConfig',
          label: 'Flex配置',
          type: 'text',
          defaultValue: {
            direction: 'row',
            justify: 'flex-start',
            align: 'stretch',
            gap: 8,
          },
          layout: { span: 24 },
          visualizer: {
            type: 'flex',
            interactive: true,
            preview: true,
          },
        },
        {
          key: 'flexWrap',
          label: '换行',
          type: 'select',
          defaultValue: 'nowrap',
          options: [
            { label: '不换行', value: 'nowrap' },
            { label: '换行', value: 'wrap' },
            { label: '反向换行', value: 'wrap-reverse' },
          ],
          layout: { span: 12 },
        },
        {
          key: 'gap',
          label: '间距',
          type: 'number',
          defaultValue: 0,
          description: '子元素之间的间距(px)',
          layout: { span: 12 },
        },
      ],
    },
  ],
})
```

### 方案 2: 修复注册时序（推荐方案）

修改 `src/core/renderer/definitions.ts` 中的 `registerControlDefinition` 函数，确保在 PropertyPanelService 初始化后再注册面板。

## 快速测试命令

在浏览器控制台运行：

```javascript
// 快速检查 Flex 面板
;(async () => {
  const { getPropertyPanelService } = await import('/src/core/infrastructure/services/index.ts')
  const service = getPropertyPanelService()
  const panels = service.getPanelsForComponent('flex')
  console.log('Flex panels count:', panels.length)
  console.log(
    'Flex panels:',
    panels.map(p => ({ group: p.group, title: p.title }))
  )

  // 检查是否有 component 分组的面板
  const componentPanel = panels.find(p => p.group === 'component')
  if (componentPanel) {
    console.log('✅ Component panel found:', componentPanel.title)
    console.log(
      'Fields:',
      componentPanel.fields.map(f => f.key)
    )
  } else {
    console.log('❌ Component panel NOT found')
  }
})()
```

## 预期结果

正确注册后，应该看到：

```
Flex panels count: 5
Flex panels: [
  { group: 'basic', title: '基础属性' },
  { group: 'layout', title: '布局样式' },
  { group: 'style', title: '样式属性' },
  { group: 'event', title: '事件' },
  { group: 'component', title: 'Flex布局' }  // ← 这个是自定义面板
]
✅ Component panel found: Flex布局
Fields: ['flexConfig', 'flexWrap', 'gap']
```

## 下一步

根据调试结果：

1. 如果面板已注册但不显示 → 检查 PropertiesPanel 的标签页过滤逻辑
2. 如果面板未注册 → 使用方案 1 或方案 2 修复
3. 如果面板注册但字段不显示 → 检查 FieldRenderer 和 FlexVisualizer
