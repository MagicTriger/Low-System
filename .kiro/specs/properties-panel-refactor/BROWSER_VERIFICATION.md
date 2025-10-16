# 🔍 浏览器验证脚本

## 请在浏览器控制台运行以下脚本

### 1. 验证 ControlDefinitions

```javascript
// 导入并检查 ControlDefinitions
const defsModule = await import('/src/core/renderer/definitions.ts')
const defs = defsModule.ControlDefinitions

console.log('📋 Registered Controls:', Object.keys(defs))
console.log('📊 Total:', Object.keys(defs).length)

// 检查按钮定义
const buttonDef = defs['button']
console.log('\n🔘 Button Definition:')
console.log('  - kind:', buttonDef?.kind)
console.log('  - kindName:', buttonDef?.kindName)
console.log('  - settings count:', buttonDef?.settings?.length)
console.log('  - settings:', buttonDef?.settings)
```

### 2. 检查 PropertyService

```javascript
// 获取 Vue 应用实例
const app = document.querySelector('#app').__vueParentComponent
const propertyService = app.appContext.provides.propertyService

console.log('\n🔧 PropertyService:')
console.log('  - initialized:', propertyService.isInitialized())
console.log('  - panelManager:', propertyService.panelManager)
console.log('  - fieldManager:', propertyService.fieldManager)
```

### 3. 检查按钮的面板配置

```javascript
// 获取按钮的面板配置
const panelManager = propertyService.panelManager
const buttonPanels = panelManager.getPanelsForControl('button')

console.log('\n📋 Button Panels:', buttonPanels.length, 'panels')

buttonPanels.forEach((panel, index) => {
  console.log(`\n📋 Panel ${index + 1}: ${panel.name}`)
  console.log(`  - id: ${panel.id}`)
  console.log(`  - groups: ${panel.groups?.length || 0}`)

  panel.groups?.forEach(group => {
    console.log(`\n  📁 Group: ${group.name} (${group.key})`)
    console.log(`    - fields: ${group.fields.length}`)
    group.fields.forEach(field => {
      console.log(`      - ${field.name} (${field.key})`)
    })
  })
})
```

### 4. 检查字段重复

```javascript
// 收集所有字段并检查重复
const allFieldKeys = []
const duplicates = []
const fieldsByKey = new Map()

buttonPanels.forEach(panel => {
  panel.groups?.forEach(group => {
    group.fields.forEach(field => {
      if (allFieldKeys.includes(field.key)) {
        duplicates.push(field.key)
        console.log(`❌ Duplicate found: ${field.key} in group ${group.key}`)

        // 记录重复字段的详细信息
        if (!fieldsByKey.has(field.key)) {
          fieldsByKey.set(field.key, [])
        }
        fieldsByKey.get(field.key).push({
          panel: panel.name,
          group: group.name,
          field: field,
        })
      } else {
        allFieldKeys.push(field.key)
        fieldsByKey.set(field.key, [
          {
            panel: panel.name,
            group: group.name,
            field: field,
          },
        ])
      }
    })
  })
})

console.log('\n📊 Summary:')
console.log(`  - Total fields: ${allFieldKeys.length}`)
console.log(`  - Duplicate fields: ${duplicates.length}`)

if (duplicates.length > 0) {
  console.log('\n❌ Duplicates found:')
  const uniqueDuplicates = [...new Set(duplicates)]
  uniqueDuplicates.forEach(key => {
    console.log(`\n  🔴 ${key}:`)
    fieldsByKey.get(key).forEach(location => {
      console.log(`    - ${location.panel} > ${location.group}`)
    })
  })
} else {
  console.log('\n✅ No duplicates found!')
}
```

### 5. 检查面板合并逻辑

```javascript
// 检查 getPanelForControl 的返回值
const singlePanel = panelManager.getPanelForControl('button')

console.log('\n📋 Single Panel (before split):')
console.log('  - id:', singlePanel?.id)
console.log('  - name:', singlePanel?.name)
console.log('  - groups:', singlePanel?.groups?.length)

if (singlePanel?.groups) {
  singlePanel.groups.forEach(group => {
    console.log(`\n  📁 ${group.name} (${group.key}):`)
    console.log(`    - fields: ${group.fields.length}`)

    // 检查组内是否有重复
    const groupFieldKeys = group.fields.map(f => f.key)
    const groupDuplicates = groupFieldKeys.filter((key, index) => groupFieldKeys.indexOf(key) !== index)

    if (groupDuplicates.length > 0) {
      console.log(`    ❌ Duplicates in group: ${[...new Set(groupDuplicates)].join(', ')}`)
    } else {
      console.log(`    ✅ No duplicates in group`)
    }
  })
}
```

### 6. 完整验证脚本 (一次性运行)

```javascript
;(async () => {
  console.log('🔍 Starting verification...\n')

  // 1. ControlDefinitions
  const defsModule = await import('/src/core/renderer/definitions.ts')
  const defs = defsModule.ControlDefinitions
  console.log('✅ ControlDefinitions loaded:', Object.keys(defs).length, 'controls')

  // 2. PropertyService
  const app = document.querySelector('#app').__vueParentComponent
  const propertyService = app.appContext.provides.propertyService
  console.log('✅ PropertyService loaded')

  // 3. Button panels
  const panelManager = propertyService.panelManager
  const buttonPanels = panelManager.getPanelsForControl('button')
  console.log('✅ Button panels loaded:', buttonPanels.length, 'panels')

  // 4. Check duplicates
  const allFieldKeys = []
  const duplicates = []

  buttonPanels.forEach(panel => {
    panel.groups?.forEach(group => {
      group.fields.forEach(field => {
        if (allFieldKeys.includes(field.key)) {
          duplicates.push(field.key)
        } else {
          allFieldKeys.push(field.key)
        }
      })
    })
  })

  console.log('\n📊 Results:')
  console.log('  - Total fields:', allFieldKeys.length)
  console.log('  - Duplicate fields:', duplicates.length)

  if (duplicates.length > 0) {
    console.log('\n❌ FAILED: Duplicates found:', [...new Set(duplicates)])
  } else {
    console.log('\n✅ SUCCESS: No duplicates!')
  }
})()
```

## 预期结果

如果修复成功,应该看到:

- ✅ ControlDefinitions: 21 controls
- ✅ Button panels: 3 panels (基础、样式、事件)
- ✅ Total fields: ~15-20 (取决于配置)
- ✅ Duplicate fields: 0

如果仍然有重复,会显示具体哪些字段重复了。
