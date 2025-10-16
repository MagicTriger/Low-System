# 属性面板为空 - 调试指南

## 问题描述

属性面板显示"请选择一个组件",即使已经选中了组件(如Button、Grid、Table)。

## 诊断步骤

### 步骤1: 检查PropertyPanelService初始化状态

在浏览器控制台执行:

```javascript
// 检查服务是否可用
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('✅ PropertyPanelService:', service)
console.log('✅ Service initialized:', service?.initialized)
console.log('✅ Service methods:', Object.keys(service || {}))
```

**预期结果**:

- service 应该是一个对象
- initialized 应该是 true
- 应该有 getPanelsForComponent 等方法

---

### 步骤2: 检查选中组件状态

```javascript
// 检查状态管理器
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
console.log('✅ StateManager:', stateManager)

// 检查designer状态
const designerState = stateManager?.getState('designer')
console.log('✅ Designer State:', designerState)
console.log('✅ Selected Component:', designerState?.selectedComponent)
```

**预期结果**:

- designerState 应该存在
- selectedComponent 应该有值(当你选中组件时)
- selectedComponent 应该有 id, kind, props 等字段

---

### 步骤3: 检查面板配置

```javascript
// 检查Button组件的面板配置
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('✅ Button Panels:', service?.getPanelsForComponent('button'))
console.log('✅ Basic Panel:', service?.getCommonPanel('basic'))
console.log('✅ All Component Panels:', service?.componentPanels)
```

**预期结果**:

- getPanelsForComponent('button') 应该返回一个数组
- 数组应该包含多个面板配置对象
- 每个面板应该有 group, title, fields 等字段

---

### 步骤4: 检查控件定义

```javascript
// 检查控件定义注册表
const definitions = window.__CONTROL_DEFINITIONS__
console.log('✅ Control Definitions:', definitions)
console.log('✅ Button Definition:', definitions?.button)
console.log('✅ Button Panels:', definitions?.button?.panels)
```

**预期结果**:

- definitions 应该存在
- button 定义应该存在
- button.panels 应该有配置

---

## 可能的问题和解决方案

### 问题1: selectedComponent 为 null

**症状**: 步骤2中 selectedComponent 为 null 或 undefined

**原因**:

- Designer状态模块没有正确更新选中组件
- 组件选择事件没有触发

**解决方案**:
检查 DesignerNew.vue 中的组件选择逻辑:

```javascript
// 在浏览器控制台手动设置选中组件
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerModule = stateManager?.modules?.designer

// 假设你创建了一个button组件,ID为 button_xxx
designerModule?.dispatch('selectComponent', {
  id: 'button_1760297969725_1t1wxjjyn', // 替换为实际ID
  kind: 'button',
  props: { text: '按钮' },
})
```

---

### 问题2: getPanelsForComponent 返回空数组

**症状**: 步骤3中 getPanelsForComponent 返回 []

**原因**:

- 面板配置没有正确注册
- 控件定义中的 panels 字段格式不正确

**解决方案**:
检查控件注册流程:

```javascript
// 检查面板是否注册
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('Component Panels Map:', service?.componentPanels)

// 如果为空,手动注册
service?.registerComponentPanel({
  componentType: 'button',
  panels: {
    extends: ['basic', 'layout', 'style', 'event'],
    custom: [],
  },
})
```

---

### 问题3: PropertiesPanel 组件没有接收到 props

**症状**: PropertiesPanel 组件的 selectedComponent 始终为 null

**原因**:

- PropertiesPanel 没有正确连接到状态管理
- useModule('designer') 失败

**解决方案**:
检查 PropertiesPanel 的挂载和props传递:

```javascript
// 在 PropertiesPanel.vue 的 setup 中添加调试日志
console.log('[PropertiesPanel] Mounted')
console.log('[PropertiesPanel] Service:', service)
console.log('[PropertiesPanel] Designer Module:', designerModule)
console.log('[PropertiesPanel] Selected Component:', selectedComponent.value)
console.log('[PropertiesPanel] Panels:', panels.value)
```

---

### 问题4: 面板配置格式错误

**症状**: getPanelsForComponent 返回数据,但面板不显示

**原因**:

- 面板配置的字段类型不正确
- 缺少必需的字段

**解决方案**:
验证面板配置格式:

```javascript
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
const panels = service?.getPanelsForComponent('button')

// 检查每个面板的结构
panels?.forEach(panel => {
  console.log('Panel:', panel.group, panel.title)
  console.log('Fields:', panel.fields?.length)
  panel.fields?.forEach(field => {
    console.log('  Field:', field.key, field.type, field.label)
  })
})
```

---

## 快速修复方案

### 方案A: 重新初始化服务

```javascript
// 在浏览器控制台执行
const container = window.__MIGRATION_SYSTEM__?.coreServices?.container
const service = container?.resolve('PropertyPanelService')

// 清除缓存
if (service?.cache) {
  service.cache.clear()
}

// 重新注册面板
const definitions = window.__CONTROL_DEFINITIONS__
Object.entries(definitions || {}).forEach(([kind, def]) => {
  if (def.panels) {
    service?.registerComponentPanel({
      componentType: kind,
      panels: def.panels,
    })
  }
})

console.log('✅ Service reinitialized')
```

---

### 方案B: 手动触发组件选择

```javascript
// 获取画布中的第一个组件
const canvas = document.querySelector('.canvas-content')
const firstComponent = canvas?.querySelector('[data-component-id]')
const componentId = firstComponent?.getAttribute('data-component-id')

if (componentId) {
  // 触发选择
  const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
  const designerModule = stateManager?.modules?.designer

  designerModule?.dispatch('selectComponent', {
    id: componentId,
    kind: firstComponent?.getAttribute('data-component-kind') || 'button',
  })

  console.log('✅ Component selected:', componentId)
}
```

---

### 方案C: 检查Vue组件挂载

```javascript
// 检查PropertiesPanel是否正确挂载
const app = document.querySelector('#app')
const propertiesPanel = app?.querySelector('.properties-panel')

console.log('✅ PropertiesPanel element:', propertiesPanel)
console.log('✅ PropertiesPanel classes:', propertiesPanel?.className)
console.log('✅ PropertiesPanel content:', propertiesPanel?.innerHTML.substring(0, 200))
```

---

## 验证清单

执行完诊断后,检查以下项目:

- [ ] PropertyPanelService 已初始化
- [ ] StateManager 可用
- [ ] Designer 状态模块已注册
- [ ] selectedComponent 有值
- [ ] getPanelsForComponent 返回非空数组
- [ ] 面板配置格式正确
- [ ] PropertiesPanel 组件已挂载
- [ ] 没有JavaScript错误

---

## 下一步

根据诊断结果:

1. **如果 selectedComponent 为 null**: 修复组件选择逻辑
2. **如果 panels 为空数组**: 修复面板注册逻辑
3. **如果都正常但面板不显示**: 检查Vue组件渲染逻辑

请执行上述诊断步骤,并告诉我结果!
