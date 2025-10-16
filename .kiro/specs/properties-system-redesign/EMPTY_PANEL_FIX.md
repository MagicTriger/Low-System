# 属性面板为空问题 - 修复完成

## 问题描述

属性面板显示"请选择一个组件",即使已经选中了组件(如Button、Grid、Table)。

## 根本原因

### 问题1: 字段名不匹配

- **PropertiesPanel.vue** 期望从designer状态模块获取 `selectedComponent`
- **designer.ts** 状态模块实际使用的字段名是 `selectedControl`
- 导致PropertiesPanel无法获取选中的组件

### 问题2: 状态未同步

- **useDesignerState.ts** 中的 `selectControl` 函数只更新了本地ref
- 没有同步更新designer状态模块
- 导致PropertiesPanel无法通过状态模块获取选中组件

## 修复方案

### 修复1: 更新PropertiesPanel.vue

**文件**: `src/core/renderer/designer/settings/PropertiesPanel.vue`

**修改前**:

```typescript
const selectedComponent = computed(() => {
  if (designerModule) {
    try {
      return designerModule.state.selectedComponent // ❌ 字段名错误
    } catch (error) {
      console.debug('[PropertiesPanel] Failed to get selected component from state:', error)
    }
  }
  return props.control
})
```

**修改后**:

```typescript
const selectedComponent = computed(() => {
  if (designerModule) {
    try {
      return designerModule.state.selectedControl // ✅ 使用正确的字段名
    } catch (error) {
      console.debug('[PropertiesPanel] Failed to get selected component from state:', error)
    }
  }
  return props.control
})
```

---

### 修复2: 更新useDesignerState.ts

**文件**: `src/core/renderer/designer/composables/useDesignerState.ts`

**修改前**:

```typescript
function selectControl(id: string | null) {
  selectedControlId.value = id
  if (id) {
    selectedControlIds.value = [id]
  } else {
    selectedControlIds.value = []
  }
  // ❌ 没有同步到状态模块
}
```

**修改后**:

```typescript
function selectControl(id: string | null) {
  selectedControlId.value = id
  if (id) {
    selectedControlIds.value = [id]
  } else {
    selectedControlIds.value = []
  }

  // ✅ 同步更新designer状态模块
  try {
    const stateManager = (window as any).__MIGRATION_SYSTEM__?.stateManagement?.stateManager
    if (stateManager) {
      const designerModule = stateManager.modules?.designer
      if (designerModule && currentView.value) {
        // 查找选中的控件
        const control = id ? findControlById(currentView.value.controls, id) : null
        designerModule.commit('setSelectedControl', control)
      }
    }
  } catch (error) {
    console.debug('[useDesignerState] Failed to sync with designer module:', error)
  }
}
```

---

## 验证步骤

### 1. 在浏览器中测试

1. 打开设计器页面
2. 从左侧组件库拖拽一个Button组件到画布
3. 点击选中Button组件
4. 查看右侧属性面板

**预期结果**:

- ✅ 属性面板显示"按钮属性"标题
- ✅ 显示组件ID
- ✅ 显示多个属性面板(基础、布局、样式、事件等)
- ✅ 每个面板包含可编辑的字段

### 2. 在控制台验证

```javascript
// 检查选中组件
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerState = stateManager?.getState('designer')
console.log('✅ Selected Control:', designerState?.selectedControl)

// 检查面板配置
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('✅ Button Panels:', service?.getPanelsForComponent('button'))
```

**预期输出**:

```javascript
✅ Selected Control: {
  id: "button_xxx",
  kind: "button",
  props: { text: "按钮" },
  // ... 其他字段
}

✅ Button Panels: [
  { group: "component", title: "按钮属性", fields: [...] },
  { group: "basic", title: "基础属性", fields: [...] },
  { group: "layout", title: "布局", fields: [...] },
  // ... 其他面板
]
```

---

## 数据流

### 修复后的完整数据流

```
用户点击组件
    ↓
DesignerNew.vue: handleControlSelect()
    ↓
useDesignerState: selectControl(id)
    ↓
    ├─→ 更新本地ref: selectedControlId.value = id
    └─→ 同步状态模块: designerModule.commit('setSelectedControl', control)
            ↓
        designer.ts: setSelectedControl mutation
            ↓
        state.selectedControl = control
            ↓
PropertiesPanel.vue: selectedComponent computed
    ↓
    ├─→ 从状态模块获取: designerModule.state.selectedControl
    └─→ 触发重新渲染
            ↓
        显示组件信息和属性面板
```

---

## 相关文件

### 修改的文件

1. `src/core/renderer/designer/settings/PropertiesPanel.vue` - 修复字段名
2. `src/core/renderer/designer/composables/useDesignerState.ts` - 添加状态同步

### 相关文件

1. `src/core/state/modules/designer.ts` - Designer状态模块定义
2. `src/modules/designer/views/DesignerNew.vue` - 设计器主视图
3. `src/core/infrastructure/services/PropertyPanelService.ts` - 属性面板服务

---

## 测试清单

- [ ] Button组件选中后显示属性面板
- [ ] Grid组件选中后显示属性面板
- [ ] Table组件选中后显示属性面板
- [ ] 切换选中不同组件时面板正确更新
- [ ] 取消选中时面板显示"请选择一个组件"
- [ ] 属性修改后正确保存到组件
- [ ] 控制台无JavaScript错误

---

## 下一步

1. **测试修复**: 在浏览器中验证属性面板是否正常显示
2. **添加组件配置**: 为String、Number、Flex、Table等组件添加panels配置
3. **完善面板**: 根据需要添加更多字段和可视化组件

---

## 注意事项

### 命名不一致问题

项目中存在命名不一致的情况:

- 有些地方使用 `control` (控件)
- 有些地方使用 `component` (组件)

建议:

- 保持现有命名,避免大规模重构
- 在新代码中统一使用 `control`
- 添加注释说明两者的关系

### 状态管理双轨制

当前存在两套状态管理:

1. **本地ref** (useDesignerState)
2. **全局状态模块** (designer module)

修复方案:

- 保持双轨制,确保两者同步
- 本地ref用于快速响应
- 状态模块用于跨组件共享

---

## 成功标志

✅ 修复完成后,你应该能够:

1. 选中任何组件后立即看到属性面板
2. 面板显示正确的组件类型和属性
3. 修改属性后组件立即更新
4. 控制台没有错误信息

现在请刷新浏览器,测试属性面板是否正常工作!
