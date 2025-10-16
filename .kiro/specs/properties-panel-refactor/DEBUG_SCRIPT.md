# 调试脚本

## 在浏览器控制台运行以下脚本来诊断问题

### 1. 检查PropertyService和面板配置

\`\`\`javascript
// 获取Vue应用实例
const app = document.querySelector('#app')?.\_\_vueParentComponent?.ctx

// 检查PropertyService
const propertyService = app?.provides?.propertyService
console.log('=== PropertyService Status ===')
console.log('Available:', !!propertyService)

if (propertyService) {
// 获取面板管理器
const panelManager = propertyService.getPanelManager()

// 获取所有面板
const panels = panelManager.getAllPanels()
console.log('\n=== Registered Panels ===')
console.log('Total panels:', panels.length)
panels.forEach(panel => {
console.log(`\nPanel: ${panel.id} (${panel.name})`)
console.log(`  Groups: ${panel.groups?.length || 0}`)
panel.groups?.forEach(group => {
console.log(`    - ${group.name}: ${group.fields?.length || 0} fields`)

      // 检查重复字段
      const fieldKeys = group.fields?.map(f => f.key) || []
      const uniqueKeys = [...new Set(fieldKeys)]
      if (fieldKeys.length !== uniqueKeys.length) {
        console.error(`      ⚠️ DUPLICATE FIELDS DETECTED!`)
        console.error(`      Field keys:`, fieldKeys)
        console.error(`      Unique keys:`, uniqueKeys)
      }
    })

})

// 检查字段渲染器
const fieldManager = propertyService.getFieldManager()
console.log('\n=== Field Renderers ===')
const rendererTypes = ['text', 'number', 'select', 'switch', 'textarea', 'color', 'icon', 'size', 'slider']
rendererTypes.forEach(type => {
const renderer = fieldManager.getRenderer(type)
console.log(`  ${type}: ${renderer ? '✓' : '✗'}`)
})
}
\`\`\`

### 2. 检查当前选中的控件和面板

\`\`\`javascript
// 查找PropertiesPanel组件实例
function findPropertiesPanel(component) {
if (!component) return null

// 检查当前组件
if (component.type?.name === 'PropertiesPanel' ||
component.type?.\_\_name === 'PropertiesPanel') {
return component
}

// 递归查找子组件
if (component.subTree) {
const result = findPropertiesPanel(component.subTree)
if (result) return result
}

if (component.children) {
for (const child of component.children) {
const result = findPropertiesPanel(child)
if (result) return result
}
}

return null
}

const app = document.querySelector('#app')?.\_\_vueParentComponent
const propertiesPanel = findPropertiesPanel(app)

if (propertiesPanel) {
console.log('\n=== PropertiesPanel Component ===')
console.log('Found:', !!propertiesPanel)
console.log('Props:', propertiesPanel.props)
console.log('Control:', propertiesPanel.props?.control)

// 获取panels computed属性
const panels = propertiesPanel.setupState?.panels
console.log('\n=== Panels in Component ===')
console.log('Panels:', panels)

if (panels?.value) {
panels.value.forEach(panel => {
console.log(`\nPanel: ${panel.id}`)
panel.groups?.forEach(group => {
console.log(`  Group: ${group.key} - ${group.name}`)
console.log(`  Fields:`, group.fields?.map(f => f.key))
})
})
}
} else {
console.error('PropertiesPanel component not found!')
}
\`\`\`

### 3. 检查是否有多个PropertiesPanel实例

\`\`\`javascript
function findAllPropertiesPanels(component, results = []) {
if (!component) return results

// 检查当前组件
if (component.type?.name === 'PropertiesPanel' ||
component.type?.\_\_name === 'PropertiesPanel') {
results.push(component)
}

// 递归查找子组件
if (component.subTree) {
findAllPropertiesPanels(component.subTree, results)
}

if (component.children) {
for (const child of component.children) {
findAllPropertiesPanels(child, results)
}
}

return results
}

const app = document.querySelector('#app')?.\_\_vueParentComponent
const allPanels = findAllPropertiesPanels(app)

console.log('\n=== All PropertiesPanel Instances ===')
console.log('Count:', allPanels.length)

if (allPanels.length > 1) {
console.warn('⚠️ Multiple PropertiesPanel instances detected!')
console.warn('This might cause duplicate fields!')
}
\`\`\`

### 4. 监控面板注册

\`\`\`javascript
// 在页面刷新前运行此脚本
const originalRegisterPanel = PropertyPanelManager.prototype.registerPanel
PropertyPanelManager.prototype.registerPanel = function(panel) {
console.log(`📋 Registering panel: ${panel.id}`)
console.trace() // 打印调用栈
return originalRegisterPanel.call(this, panel)
}
\`\`\`

## 预期结果

### 正常情况

- PropertyService应该可用
- 应该有3个面板：basic, style, event
- 每个面板的每个group中不应该有重复的字段key
- 所有字段渲染器都应该注册成功
- 只应该有1个PropertiesPanel实例

### 异常情况

如果发现：

- 字段key重复 → 检查面板配置文件
- 多个PropertiesPanel实例 → 检查组件树，可能有重复渲染
- 渲染器未注册 → 检查registerFieldRenderers调用
- 面板被注册多次 → 检查初始化流程

## 修复建议

根据调试结果：

1. **如果字段key重复**

   - 检查BasicPanel.ts、StylePanel.ts、EventPanel.ts
   - 确保每个group的fields数组中没有重复的key

2. **如果有多个PropertiesPanel实例**

   - 检查是否有多个地方渲染了PropertiesPanel
   - 可能是路由配置问题或组件重复导入

3. **如果面板被注册多次**

   - 检查是否有多个地方调用了registerDefaultPanels
   - 检查PropertyService.initialize是否被调用多次

4. **如果渲染器未注册**
   - 确保registerFieldRenderers在PropertyService初始化后调用
   - 检查字段渲染器文件是否存在
