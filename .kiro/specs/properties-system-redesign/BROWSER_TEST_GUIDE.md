# 浏览器测试指南

## 🎯 测试目标

验证属性面板修复是否成功,确保选中组件后能正确显示属性配置。

---

## 📋 测试步骤

### 步骤1: 刷新页面

```
1. 保存所有文件
2. 在浏览器中按 Ctrl+Shift+R (强制刷新)
3. 等待页面完全加载
```

### 步骤2: 创建组件

```
1. 从左侧组件库拖拽一个"按钮"组件到画布
2. 观察右侧属性面板
```

**预期结果**:

- ✅ 属性面板显示"按钮属性"或"组件配置"标题
- ✅ 显示组件ID (如: button_xxx)
- ✅ 显示多个可折叠的面板组
- ✅ 每个面板包含可编辑的字段

**如果失败**:

- ❌ 仍然显示"请选择一个组件" → 继续步骤3诊断

### 步骤3: 控制台诊断

打开浏览器控制台 (F12),执行以下命令:

#### 3.1 检查服务初始化

```javascript
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('Service:', service)
console.log('Initialized:', service?.initialized)
```

**预期**: service存在且initialized为true

#### 3.2 检查选中组件

```javascript
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerState = stateManager?.getState('designer')
console.log('Designer State:', designerState)
console.log('Selected Control:', designerState?.selectedControl)
```

**预期**: selectedControl应该有值,包含id、kind、props等字段

#### 3.3 检查面板配置

```javascript
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
const panels = service?.getPanelsForComponent('button')
console.log('Button Panels:', panels)
console.log('Panel Count:', panels?.length)
```

**预期**: panels应该是一个数组,长度 > 0

---

## 🔍 诊断结果分析

### 情况A: selectedControl 为 null

**原因**: 组件选择没有触发状态更新

**解决方案**:

```javascript
// 手动触发选择
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerModule = stateManager?.modules?.designer

// 获取画布中的第一个组件ID
const canvas = document.querySelector('.canvas-content')
const firstComponent = canvas?.querySelector('[data-component-id]')
const componentId = firstComponent?.getAttribute('data-component-id')

if (componentId && designerModule) {
  // 手动设置选中组件
  designerModule.commit('setSelectedControl', {
    id: componentId,
    kind: 'button',
    props: { text: '按钮' },
  })
  console.log('✅ Manually selected:', componentId)
}
```

### 情况B: panels 为空数组

**原因**: 面板配置没有正确注册

**解决方案**:

```javascript
// 检查控件定义
const definitions = window.__CONTROL_DEFINITIONS__
console.log('Button Definition:', definitions?.button)
console.log('Button Panels:', definitions?.button?.panels)

// 如果panels存在但没有注册,手动注册
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
if (definitions?.button?.panels) {
  service?.registerComponentPanel({
    componentType: 'button',
    panels: definitions.button.panels,
  })
  console.log('✅ Manually registered button panels')
}
```

### 情况C: 一切正常但面板不显示

**原因**: Vue组件渲染问题

**解决方案**:

```javascript
// 检查PropertiesPanel组件
const propertiesPanel = document.querySelector('.properties-panel')
console.log('Panel Element:', propertiesPanel)
console.log('Panel HTML:', propertiesPanel?.innerHTML.substring(0, 500))

// 检查是否有空状态
const emptyState = propertiesPanel?.querySelector('.empty-state')
console.log('Empty State:', emptyState)

// 检查是否有面板内容
const panelContent = propertiesPanel?.querySelector('.panel-content')
console.log('Panel Content:', panelContent)
```

---

## 🧪 完整测试脚本

复制以下脚本到浏览器控制台,一次性执行所有诊断:

```javascript
console.log('🔍 开始诊断属性面板...\n')

// 1. 检查服务
const service = window.__MIGRATION_SYSTEM__?.coreServices?.container?.resolve('PropertyPanelService')
console.log('1️⃣ PropertyPanelService:')
console.log('   - 存在:', !!service)
console.log('   - 已初始化:', service?.initialized)
console.log('')

// 2. 检查状态管理
const stateManager = window.__MIGRATION_SYSTEM__?.stateManagement?.stateManager
const designerState = stateManager?.getState('designer')
console.log('2️⃣ Designer State:')
console.log('   - StateManager存在:', !!stateManager)
console.log('   - Designer State存在:', !!designerState)
console.log('   - Selected Control:', designerState?.selectedControl)
console.log('')

// 3. 检查面板配置
const panels = service?.getPanelsForComponent('button')
console.log('3️⃣ Button Panels:')
console.log('   - 面板数量:', panels?.length || 0)
if (panels && panels.length > 0) {
  panels.forEach((panel, index) => {
    console.log(`   - 面板${index + 1}:`, panel.title, `(${panel.fields?.length || 0} 字段)`)
  })
}
console.log('')

// 4. 检查控件定义
const definitions = window.__CONTROL_DEFINITIONS__
console.log('4️⃣ Control Definitions:')
console.log('   - 定义存在:', !!definitions)
console.log('   - Button定义:', !!definitions?.button)
console.log('   - Button Panels:', !!definitions?.button?.panels)
console.log('')

// 5. 检查DOM元素
const propertiesPanel = document.querySelector('.properties-panel')
const emptyState = propertiesPanel?.querySelector('.empty-state')
const panelContent = propertiesPanel?.querySelector('.panel-content')
console.log('5️⃣ DOM Elements:')
console.log('   - PropertiesPanel存在:', !!propertiesPanel)
console.log('   - 显示空状态:', !!emptyState)
console.log('   - 显示面板内容:', !!panelContent)
console.log('')

// 6. 诊断结果
console.log('📊 诊断结果:')
if (!service || !service.initialized) {
  console.log('   ❌ PropertyPanelService未初始化')
} else if (!designerState?.selectedControl) {
  console.log('   ❌ 没有选中的组件')
  console.log('   💡 请尝试点击画布中的组件')
} else if (!panels || panels.length === 0) {
  console.log('   ❌ 面板配置为空')
  console.log('   💡 需要为组件注册面板配置')
} else if (emptyState) {
  console.log('   ❌ 面板显示空状态')
  console.log('   💡 PropertiesPanel组件可能没有正确接收数据')
} else if (panelContent) {
  console.log('   ✅ 一切正常!属性面板应该正常显示')
} else {
  console.log('   ⚠️  未知问题,需要进一步调查')
}

console.log('\n✅ 诊断完成!')
```

---

## 📸 预期界面

### 正常状态

```
┌─────────────────────────────────┐
│ 组件配置                         │
├─────────────────────────────────┤
│ 按钮                             │
│ ID: button_1760297969725_xxx    │
├─────────────────────────────────┤
│ ▼ 按钮属性                       │
│   按钮文本: [按钮        ]       │
│   按钮类型: [默认 ▼]             │
│   按钮大小: [中   ▼]             │
│   图标:     [选择图标]           │
│   危险按钮: [ ] OFF              │
├─────────────────────────────────┤
│ ▼ 基础属性                       │
│   组件名称: [button      ]       │
│   显示:     [☑] ON               │
│   禁用:     [ ] OFF              │
├─────────────────────────────────┤
│ ▼ 布局                           │
│   ...                            │
└─────────────────────────────────┘
```

### 空状态 (问题状态)

```
┌─────────────────────────────────┐
│ 属性面板                         │
├─────────────────────────────────┤
│                                  │
│         🎯                       │
│                                  │
│    请选择一个组件                 │
│                                  │
│  选择画布中的组件来编辑其属性     │
│                                  │
└─────────────────────────────────┘
```

---

## ✅ 成功标准

测试通过的标准:

1. ✅ 选中组件后,属性面板立即显示内容
2. ✅ 显示正确的组件类型名称
3. ✅ 显示组件ID
4. ✅ 至少显示2个以上的面板组
5. ✅ 每个面板包含可编辑的字段
6. ✅ 控制台没有JavaScript错误
7. ✅ 修改字段值后,组件立即更新

---

## 🆘 如果测试失败

1. **复制控制台输出**: 将诊断脚本的输出复制下来
2. **截图**: 截取属性面板区域的截图
3. **提供信息**: 告诉我:
   - 哪个步骤失败了
   - 控制台输出是什么
   - 是否有JavaScript错误

我会根据这些信息提供进一步的修复方案!

---

## 🎉 测试成功后

如果测试成功,接下来可以:

1. 测试其他组件 (Grid、Table等)
2. 测试属性修改功能
3. 为更多组件添加panels配置
4. 完善字段类型和可视化

祝测试顺利! 🚀
