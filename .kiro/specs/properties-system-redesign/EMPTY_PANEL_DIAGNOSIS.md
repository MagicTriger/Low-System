# 属性面板为空问题诊断指南

## 问题描述

属性配置面板显示"请选择一个组件",即使已经选中了组件。

## 可能的原因

### 1. PropertyPanelService未初始化

**症状**: 面板完全为空或显示错误  
**检查方法**:

```javascript
// 在浏览器控制台执行
window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
```

**解决方案**:

- 确保在应用启动时调用了 `CoreServicesIntegration.integrate()`
- 检查 `src/core/migration/bootstrap.ts` 是否正确初始化

### 2. 组件未选中或状态未同步

**症状**: 面板显示"请选择一个组件"  
**检查方法**:

```javascript
// 在浏览器控制台执行
window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager?.getState('designer')
```

**解决方案**:

- 检查Designer状态模块是否正确注册
- 确认组件选中时触发了状态更新
- 检查 `PropertiesPanel.vue` 中的 `selectedComponent` computed

### 3. 组件没有panels配置

**症状**: 选中组件后面板仍为空  
**检查方法**:

```javascript
// 在浏览器控制台执行
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
service?.getPanelsForComponent('button') // 替换为你的组件kind
```

**解决方案**:

- 确保组件定义中添加了 `panels` 配置
- 检查 `registerControlDefinition` 是否正确注册了面板

### 4. PanelGroup或FieldRenderer组件未正确导入

**症状**: 面板结构显示但字段不渲染  
**检查方法**:

- 检查浏览器控制台是否有组件导入错误
- 检查Vue DevTools中组件树

**解决方案**:

- 确认 `PanelGroup.vue` 正确导入到 `PropertiesPanel.vue`
- 确认 `FieldRenderer.vue` 正确导入到 `PanelGroup.vue`

### 5. 通用面板未注册

**症状**: 只显示组件特定面板,通用面板不显示  
**检查方法**:

```javascript
// 在浏览器控制台执行
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
service?.getCommonPanel('basic')
```

**解决方案**:

- 确保 `PropertyPanelService.initialize()` 被调用
- 检查通用面板是否正确注册

---

## 诊断步骤

### 步骤1: 检查服务初始化

打开浏览器控制台,执行:

```javascript
// 1. 检查迁移系统
console.log('Migration System:', window.__MIGRATION_SYSTEM__)

// 2. 检查PropertyPanelService
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('PropertyPanelService:', service)

// 3. 检查服务是否初始化
console.log('Service initialized:', service?._initialized || service?.initialized)
```

**预期结果**: 所有值都应该存在且不为undefined

### 步骤2: 检查状态管理

```javascript
// 1. 检查StateManager
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
console.log('StateManager:', stateManager)

// 2. 检查designer状态
const designerState = stateManager?.getState('designer')
console.log('Designer State:', designerState)

// 3. 检查选中组件
console.log('Selected Component:', designerState?.selectedComponent)
```

**预期结果**: 选中组件后,selectedComponent应该有值

### 步骤3: 检查面板配置

```javascript
// 1. 获取服务
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')

// 2. 检查通用面板
console.log('Basic Panel:', service?.getCommonPanel('basic'))
console.log('Layout Panel:', service?.getCommonPanel('layout'))
console.log('Style Panel:', service?.getCommonPanel('style'))
console.log('Event Panel:', service?.getCommonPanel('event'))

// 3. 检查组件面板(替换'button'为你的组件kind)
console.log('Button Panels:', service?.getPanelsForComponent('button'))
```

**预期结果**: 所有面板配置都应该返回对象数组

### 步骤4: 检查组件注册

```javascript
// 1. 检查控件定义
import { ControlDefinitions } from '@/core/renderer/definitions'
console.log('Control Definitions:', ControlDefinitions)

// 2. 检查特定组件
console.log('Button Definition:', ControlDefinitions['button'])

// 3. 检查panels配置
console.log('Button Panels Config:', ControlDefinitions['button']?.panels)
```

**预期结果**: 组件定义应该包含panels配置

---

## 快速修复方案

### 方案1: 重新初始化服务

在应用入口文件中添加:

```typescript
// src/main.ts 或 src/modules/designer/main.ts
import { initializePropertyPanelService } from '@/core/infrastructure/services'

// 在应用启动时
async function initApp() {
  try {
    await initializePropertyPanelService()
    console.log('✅ PropertyPanelService initialized')
  } catch (error) {
    console.error('❌ Failed to initialize PropertyPanelService:', error)
  }
}

initApp()
```

### 方案2: 手动触发组件选中

在Designer组件中:

```typescript
// 当组件被选中时
function handleComponentSelect(component) {
  // 更新状态
  stateManager.commit('designer.setSelectedComponent', component)

  // 触发事件
  eventBus.emit('component.selected', component)

  console.log('Component selected:', component)
}
```

### 方案3: 添加调试日志

在 `PropertiesPanel.vue` 中添加:

```typescript
// 在script setup中
watch(selectedComponent, (newVal, oldVal) => {
  console.log('Selected component changed:', {
    old: oldVal?.kind,
    new: newVal?.kind,
    component: newVal,
  })
})

watch(panels, newVal => {
  console.log('Panels updated:', newVal)
})
```

---

## 常见错误信息

### "PropertyPanelService not initialized"

**原因**: 服务未初始化  
**解决**: 调用 `initializePropertyPanelService()`

### "Cannot read property 'getPanelsForComponent' of undefined"

**原因**: 服务未注册到DI容器  
**解决**: 检查 `CoreServicesIntegration.ts` 中的注册代码

### "Module 'designer' not found"

**原因**: Designer状态模块未注册  
**解决**: 检查状态模块注册代码

### "Component 'PanelGroup' not found"

**原因**: 组件导入路径错误  
**解决**: 检查import语句

---

## 验证清单

完成修复后,验证以下项目:

- [ ] 浏览器控制台无错误
- [ ] PropertyPanelService已初始化
- [ ] 选中组件后selectedComponent有值
- [ ] getPanelsForComponent返回面板数组
- [ ] 面板在UI中正确显示
- [ ] 字段可以编辑
- [ ] 属性更新到组件

---

## 需要帮助?

如果以上方法都无法解决问题,请提供:

1. 浏览器控制台的完整错误信息
2. 上述诊断步骤的输出结果
3. Vue DevTools中的组件树截图
4. Network面板中的请求信息

这将帮助快速定位问题!
