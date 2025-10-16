# 🚨 关键问题 - selectedControl始终为null

## 问题症状

控制台显示:

```
[PropertiesPanel] Selected control from state: null
```

即使组件创建成功,属性面板仍然显示"请选择一个组件"。

---

## 根本原因

`selectControl`函数被调用,但状态模块中的`selectedControl`没有更新。

可能的原因:

1. `currentView.value`为空
2. `findControlById`找不到控件
3. `designerModule.commit`没有执行
4. 状态模块的mutation没有正确工作

---

## 🔍 诊断步骤

### 步骤1: 执行诊断命令

在浏览器控制台执行:

```javascript
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerState = stateManager?.getState('designer')

console.log('=== 完整诊断 ===')
console.log('1. Service:', !!service, service?.initialized)
console.log('2. StateManager:', !!stateManager)
console.log('3. Designer State:', designerState)
console.log('4. Selected Control:', designerState?.selectedControl)
console.log('5. Button Panels:', service?.getPanelsForComponent('button')?.length)
```

### 步骤2: 刷新页面并拖拽组件

1. 刷新浏览器 (Ctrl+Shift+R)
2. 拖拽Button组件到画布
3. 查看控制台输出

**预期看到**:

```
[useDesignerState] selectControl called with id: button_xxx
[useDesignerState] StateManager: true
[useDesignerState] Designer Module: true
[useDesignerState] Current View: true
[useDesignerState] Found control: { id: "button_xxx", ... }
[useDesignerState] ✅ Control synced to state module
```

**如果看到**:

```
[useDesignerState] ❌ Cannot sync: missing module or view
```

说明`currentView.value`为空或`designerModule`不存在。

### 步骤3: 手动测试状态更新

在浏览器控制台执行:

```javascript
// 手动设置选中组件
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerModule = stateManager?.modules?.designer

// 创建一个测试组件
const testControl = {
  id: 'test_123',
  kind: 'button',
  props: { text: '测试按钮' },
}

// 手动提交
designerModule?.commit('setSelectedControl', testControl)

// 验证
const state = stateManager?.getState('designer')
console.log('✅ Manual test - Selected Control:', state?.selectedControl)
```

如果手动测试成功,说明状态模块工作正常,问题在于`selectControl`函数。

---

## 🔧 可能的修复方案

### 方案A: 确保currentView有值

检查`currentView`是否在组件创建时已经有值:

```typescript
function selectControl(id: string | null) {
  console.log('[DEBUG] currentView:', currentView.value)
  console.log('[DEBUG] controls:', currentView.value?.controls)

  // ... 其余代码
}
```

### 方案B: 直接传递control对象

修改`selectControl`函数,直接接收control对象:

```typescript
function selectControl(id: string | null, control?: Control | null) {
  selectedControlId.value = id

  // 如果提供了control对象,直接使用
  const controlToSync = control || (id ? findControlById(currentView.value.controls, id) : null)

  if (stateManager && designerModule) {
    designerModule.commit('setSelectedControl', controlToSync)
  }
}
```

### 方案C: 使用watch监听selectedControlId

添加一个watch来监听`selectedControlId`的变化:

```typescript
watch(selectedControlId, newId => {
  if (newId && currentView.value) {
    const control = findControlById(currentView.value.controls, newId)
    if (control && designerModule) {
      designerModule.commit('setSelectedControl', control)
    }
  }
})
```

---

## 📋 下一步行动

1. **刷新浏览器**并查看新的调试日志
2. **执行诊断命令**确认问题所在
3. **根据日志输出**选择合适的修复方案
4. **告诉我日志内容**,我会提供具体的修复代码

---

## 🎯 成功标准

修复成功后,应该看到:

1. **控制台日志**:

   ```
   [useDesignerState] selectControl called with id: button_xxx
   [useDesignerState] Found control: { id: "button_xxx", kind: "button", ... }
   [useDesignerState] ✅ Control synced to state module
   [PropertiesPanel] Selected control from state: { id: "button_xxx", ... }
   [PropertiesPanel] Got panels for button: [...]
   ```

2. **属性面板显示**:
   - ✅ 显示组件名称和ID
   - ✅ 显示多个面板组
   - ✅ 显示可编辑的字段

---

现在请刷新浏览器,拖拽组件,然后把控制台的完整输出告诉我!
