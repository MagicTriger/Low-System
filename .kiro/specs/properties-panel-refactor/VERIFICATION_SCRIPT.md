# 🧪 验证脚本 - 控件注册流程

## 目的

验证控件注册流程是否正常工作,以及属性面板是否正确显示。

## 验证步骤

### 1. 检查控件定义注册

在浏览器控制台中运行:

```javascript
// 1. 检查 ControlDefinitions 是否被填充
import { ControlDefinitions } from '@/core/renderer/definitions'
console.log('📋 Registered Controls:', Object.keys(ControlDefinitions))
console.log('📊 Total Controls:', Object.keys(ControlDefinitions).length)

// 2. 检查按钮控件定义
const buttonDef = ControlDefinitions['button']
console.log('🔘 Button Definition:', buttonDef)
console.log('🔘 Button Settings:', buttonDef?.settings)

// 3. 检查所有控件的 settings
Object.entries(ControlDefinitions).forEach(([kind, def]) => {
  console.log(`${kind}: ${def.settings?.length || 0} settings`)
})
```

### 2. 检查 PropertyService 初始化

在浏览器控制台中运行:

```javascript
// 获取 PropertyService 实例
const app = document.querySelector('#app').__vueParentComponent
const propertyService = app.appContext.config.globalProperties.$propertyService

// 或者通过 inject
import { inject } from 'vue'
const propertyService = inject('propertyService')

console.log('🔧 PropertyService:', propertyService)
console.log('📋 PanelManager:', propertyService.panelManager)
console.log('🎨 FieldManager:', propertyService.fieldManager)
```

### 3. 检查 PropertyPanelManager

```javascript
// 获取 PanelManager
const panelManager = propertyService.panelManager

// 检查注册的面板
console.log('📋 All Panels:', panelManager.getAllPanels())

// 检查按钮控件的面板配置
const buttonPanels = panelManager.getPanelsForControl('button')
console.log('🔘 Button Panels:', buttonPanels)

// 检查每个面板的分组和字段
buttonPanels.forEach(panel => {
  console.log(`\n📋 Panel: ${panel.name}`)
  panel.groups?.forEach(group => {
    console.log(`  📁 Group: ${group.name} (${group.fields.length} fields)`)
    group.fields.forEach(field => {
      console.log(`    - ${field.name} (${field.key})`)
    })
  })
})
```

### 4. 检查字段重复

```javascript
// 检查是否有重复的字段
const buttonPanels = panelManager.getPanelsForControl('button')
const allFields = []
const duplicates = []

buttonPanels.forEach(panel => {
  panel.groups?.forEach(group => {
    group.fields.forEach(field => {
      if (allFields.includes(field.key)) {
        duplicates.push(field.key)
      } else {
        allFields.push(field.key)
      }
    })
  })
})

console.log('📊 Total Fields:', allFields.length)
console.log('🔴 Duplicate Fields:', duplicates)

if (duplicates.length === 0) {
  console.log('✅ No duplicate fields found!')
} else {
  console.log('❌ Found duplicate fields:', duplicates)
}
```

## 预期结果

### 1. 控件定义注册成功

```
📋 Registered Controls: ['button', 'text-input', 'number', 'boolean', ...]
📊 Total Controls: 20+
🔘 Button Definition: { kind: 'button', kindName: '按钮', ... }
🔘 Button Settings: [{ key: 'text', name: '文本', ... }, ...]
```

### 2. PropertyService 初始化成功

```
🔧 PropertyService: PropertyService { ... }
📋 PanelManager: PropertyPanelManager { ... }
🎨 FieldManager: PropertyFieldManager { ... }
```

### 3. 面板配置正确

```
📋 Panel: 基础
  📁 Group: 公共属性 (3 fields)
    - 文本 (text)
    - 图标 (icon)
    - 点击不冒泡 (stopPropagation)
  📁 Group: 数据绑定 (1 fields)
    - 数据源 (dataSource)
  📁 Group: 扩展属性 (5 fields)
    - 大小 (size)
    - 类型 (type)
    - 背景透明 (ghost)
    - 危险 (danger)
    - 形状 (shape)
```

### 4. 无重复字段

```
📊 Total Fields: 15
🔴 Duplicate Fields: []
✅ No duplicate fields found!
```

## 控制台日志检查

应用启动时,应该看到以下日志:

```
✅ Registered X control definitions
📋 PropertyPanelManager created
🔧 Initializing Property System...
✅ Registered X control definitions to PanelManager
✅ Property System initialized successfully
```

## UI 验证

1. **拖拽按钮到画布**
2. **选中按钮**
3. **查看属性面板**

应该看到:

- ✅ 基础 tab (包含公共属性、数据绑定、扩展属性)
- ✅ 样式 tab (包含尺寸、间距、字体等)
- ✅ 事件 tab (包含点击事件等)
- ✅ 每个字段只显示一次
- ✅ 字段按分组正确组织

## 故障排查

### 如果 ControlDefinitions 为空

**问题:** `registerBasicControls()` 没有被调用

**解决方案:**

1. 检查 `main.ts` 中是否导入并调用了 `registerBasicControls()`
2. 检查浏览器控制台是否有导入错误
3. 重启开发服务器

### 如果面板配置为空

**问题:** `PropertyService.initialize()` 没有正确注册控件定义

**解决方案:**

1. 检查 `PropertyService.ts` 中的 `initialize()` 方法
2. 确认 `registerControlDefinitions()` 被调用
3. 检查浏览器控制台的错误日志

### 如果字段重复

**问题:** 面板合并逻辑有问题

**解决方案:**

1. 检查 `PropertyPanelManager.ts` 中的 `mergePanels()` 方法
2. 确认字段去重逻辑正确
3. 检查 group key 是否匹配

## 调试技巧

### 1. 添加调试日志

在 `PropertyPanelManager.ts` 的 `getPanelForControl()` 方法中添加:

```typescript
console.log(`🔍 Getting panel for control: ${controlKind}`)
console.log(`📋 Control definition:`, controlDef)
console.log(`📋 Settings:`, controlDef.settings)
console.log(`📋 Generated panel:`, config)
```

### 2. 断点调试

在以下位置设置断点:

- `register.ts` 的 `registerBasicControls()` 函数
- `PropertyService.ts` 的 `initialize()` 方法
- `PropertyPanelManager.ts` 的 `registerControlDefinitions()` 方法
- `PropertyPanelManager.ts` 的 `getPanelForControl()` 方法

### 3. 网络请求检查

检查是否有模块加载失败:

- 打开浏览器开发者工具
- 切换到 Network tab
- 筛选 JS 文件
- 查找 404 或其他错误

## 成功标准

- ✅ ControlDefinitions 包含所有控件定义
- ✅ 每个控件定义都有 settings 数组
- ✅ PropertyService 成功初始化
- ✅ PropertyPanelManager 注册了所有控件定义
- ✅ 属性面板显示控件特定字段
- ✅ 没有重复的字段
- ✅ 字段按分组正确组织
- ✅ 字段类型正确映射

## 下一步

如果所有验证都通过:

1. ✅ 标记问题为已解决
2. ✅ 更新文档
3. ✅ 提交代码

如果验证失败:

1. ❌ 根据故障排查指南定位问题
2. ❌ 修复问题
3. ❌ 重新运行验证
