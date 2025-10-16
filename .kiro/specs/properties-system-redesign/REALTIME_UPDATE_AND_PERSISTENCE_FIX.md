# 🔧 实时更新和持久化修复方案

## 🎯 问题分析

### 问题1: 配置面板更改后画布组件不会实时更新渲染

**根本原因**:

1. `updateControl`函数虽然更新了`currentView.value`,但由于Vue的响应式系统限制,深层嵌套对象的更新可能不会触发组件重新渲染
2. Button组件使用`computed`从`control.value.props`读取,但`control`对象的引用没有改变

**数据流**:

```
PropertiesPanel更新
  ↓
DesignerNew.handlePropertyUpdate
  ↓
useDesignerState.updateControl
  ↓
更新currentView.value.controls数组
  ↓
❌ Button组件的computed没有重新计算
```

### 问题2: 关闭面板后配置丢失

**根本原因**:

- 没有任何持久化机制
- 数据只存在于内存中的`currentView`
- 刷新页面或关闭后数据全部丢失

---

## ✅ 解决方案

### 方案1: 修复实时更新 - 强制触发响应式更新

#### 1.1 修改 `useDesignerState.ts` 的 `updateControl` 函数

**关键改进**:

- 创建全新的控件对象,而不是修改现有对象
- 使用`JSON.parse(JSON.stringify())`深拷贝,确保所有引用都是新的
- 触发`currentView`的完全替换

```typescript
function updateControl(controlId: string, updates: Partial<Control>) {
  if (!currentView.value) return

  console.log('🔄 [updateControl] Updating control:', controlId, updates)

  // 深拷贝整个视图,确保所有引用都是新的
  const newView = JSON.parse(JSON.stringify(currentView.value))

  // 递归查找并更新控件
  function findAndUpdate(controls: Control[]): boolean {
    for (let i = 0; i < controls.length; i++) {
      if (controls[i].id === controlId) {
        // 找到目标控件,深度合并更新
        Object.keys(updates).forEach(key => {
          const value = updates[key as keyof Control]
          if (value !== undefined) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
              // 对象类型:深度合并
              controls[i][key as keyof Control] = {
                ...(controls[i][key as keyof Control] as any),
                ...value,
              } as any
            } else {
              // 基本类型或数组:直接赋值
              controls[i][key as keyof Control] = value as any
            }
          }
        })
        console.log('✅ [updateControl] Control updated:', controls[i])
        return true
      }

      // 递归查找子控件
      if (controls[i].children && controls[i].children!.length > 0) {
        if (findAndUpdate(controls[i].children!)) {
          return true
        }
      }
    }
    return false
  }

  // 执行更新
  const found = findAndUpdate(newView.controls)

  if (found) {
    // 完全替换currentView,触发响应式更新
    currentView.value = newView
    console.log('✅ [updateControl] View updated, triggering re-render')

    // 触发额外的更新事件
    nextTick(() => {
      window.dispatchEvent(
        new CustomEvent('designer:control-updated', {
          detail: { controlId, updates },
        })
      )
    })
  } else {
    console.warn('❌ [updateControl] Control not found:', controlId)
  }
}
```

#### 1.2 修改 Button 组件 - 添加响应式监听

```vue
<script setup lang="ts">
import { computed, watch, ref } from 'vue'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

const props = defineProps<{ control: ButtonControl }>()
const { control, eventHandler } = useControlMembers(props)

// 使用ref存储计算值,确保响应式
const text = ref(control.value.props?.text || '按钮')
const buttonType = ref(control.value.props?.type || 'default')
// ... 其他属性

// 监听control变化,立即更新
watch(
  () => control.value.props,
  newProps => {
    console.log('🔄 [Button] Props changed:', newProps)
    text.value = newProps?.text || '按钮'
    buttonType.value = newProps?.type || 'default'
    // ... 更新其他属性
  },
  { deep: true, immediate: true }
)
</script>
```

---

### 方案2: 实现持久化机制

#### 2.1 创建持久化服务

**文件**: `src/core/services/PersistenceService.ts`

```typescript
/**
 * 持久化服务
 * 负责保存和加载设计器数据
 */
export class PersistenceService {
  private storageKey = 'designer_data'
  private autoSaveInterval: number | null = null
  private autoSaveDelay = 2000 // 2秒自动保存

  /**
   * 保存设计数据到localStorage
   */
  saveToLocal(data: { view: RootView; dataSources?: Record<string, any>; dataFlows?: Record<string, any> }): void {
    try {
      const serialized = JSON.stringify({
        ...data,
        timestamp: Date.now(),
        version: '1.0.0',
      })
      localStorage.setItem(this.storageKey, serialized)
      console.log('✅ [Persistence] Data saved to localStorage')
    } catch (error) {
      console.error('❌ [Persistence] Failed to save:', error)
    }
  }

  /**
   * 从localStorage加载设计数据
   */
  loadFromLocal(): any | null {
    try {
      const serialized = localStorage.getItem(this.storageKey)
      if (!serialized) return null

      const data = JSON.parse(serialized)
      console.log('✅ [Persistence] Data loaded from localStorage')
      return data
    } catch (error) {
      console.error('❌ [Persistence] Failed to load:', error)
      return null
    }
  }

  /**
   * 启动自动保存
   */
  startAutoSave(callback: () => void): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }

    this.autoSaveInterval = window.setInterval(() => {
      callback()
    }, this.autoSaveDelay)

    console.log('✅ [Persistence] Auto-save started')
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
      console.log('✅ [Persistence] Auto-save stopped')
    }
  }

  /**
   * 清除本地数据
   */
  clearLocal(): void {
    localStorage.removeItem(this.storageKey)
    console.log('✅ [Persistence] Local data cleared')
  }

  /**
   * 导出为JSON文件
   */
  exportToFile(data: any, filename: string = 'design.json'): void {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      console.log('✅ [Persistence] Data exported to file')
    } catch (error) {
      console.error('❌ [Persistence] Failed to export:', error)
    }
  }

  /**
   * 从JSON文件导入
   */
  async importFromFile(file: File): Promise<any | null> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      console.log('✅ [Persistence] Data imported from file')
      return data
    } catch (error) {
      console.error('❌ [Persistence] Failed to import:', error)
      return null
    }
  }
}
```

#### 2.2 集成到 DesignerNew.vue

```typescript
import { PersistenceService } from '@/core/services/PersistenceService'

// 创建持久化服务实例
const persistenceService = new PersistenceService()

// 在组件挂载时加载数据
onMounted(() => {
  // 尝试从localStorage加载
  const savedData = persistenceService.loadFromLocal()
  if (savedData && savedData.view) {
    designerState.setView(savedData.view)
    if (savedData.dataSources) {
      designerState.setDataSources(savedData.dataSources)
    }
    if (savedData.dataFlows) {
      designerState.setDataFlows(savedData.dataFlows)
    }
    message.success('已加载上次保存的设计')
  } else {
    // 没有保存的数据,初始化新视图
    initializeView()
  }

  // 启动自动保存
  persistenceService.startAutoSave(() => {
    if (currentView.value) {
      persistenceService.saveToLocal({
        view: currentView.value,
        dataSources: designerState.dataSources.value,
        dataFlows: designerState.dataFlows.value,
      })
    }
  })
})

// 在组件卸载时停止自动保存
onUnmounted(() => {
  persistenceService.stopAutoSave()
})

// 修改handleSave函数
async function handleSave() {
  if (!currentView.value) return

  saving.value = true
  try {
    // 保存到localStorage
    persistenceService.saveToLocal({
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
    })

    // TODO: 如果有后端API,也保存到服务器
    // await api.saveDesign(designId.value, currentView.value)

    hasUnsavedChanges.value = false
    message.success('保存成功')
  } catch (error: any) {
    message.error(error.message || '保存失败')
    console.error('保存失败:', error)
  } finally {
    saving.value = false
  }
}

// 添加导出功能
function handleExport() {
  if (!currentView.value) return

  persistenceService.exportToFile(
    {
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
    },
    `${designName.value}.json`
  )

  message.success('设计已导出')
}

// 添加导入功能
async function handleImport(file: File) {
  const data = await persistenceService.importFromFile(file)
  if (data && data.view) {
    designerState.setView(data.view)
    if (data.dataSources) {
      designerState.setDataSources(data.dataSources)
    }
    if (data.dataFlows) {
      designerState.setDataFlows(data.dataFlows)
    }
    message.success('设计已导入')
  } else {
    message.error('导入失败:文件格式不正确')
  }
}
```

---

## 🧪 测试步骤

### 测试实时更新

1. **刷新浏览器** (Ctrl+Shift+R)
2. **拖拽Button组件**到画布
3. **修改按钮文本**
4. **预期**: 画布中的按钮文字立即更新
5. **控制台**: 应该看到:
   ```
   🔄 [updateControl] Updating control: button_xxx { props: { text: '新文本' } }
   ✅ [updateControl] Control updated: {...}
   ✅ [updateControl] View updated, triggering re-render
   🔄 [Button] Props changed: { text: '新文本', ... }
   ```

### 测试持久化

1. **创建一个设计**,添加几个组件
2. **修改组件属性**
3. **刷新浏览器**
4. **预期**: 设计自动恢复,所有组件和属性都保留
5. **控制台**: 应该看到 `✅ [Persistence] Data loaded from localStorage`

### 测试自动保存

1. **修改组件属性**
2. **等待2秒**
3. **打开浏览器开发者工具** → Application → Local Storage
4. **预期**: 看到`designer_data`键,包含完整的设计数据

### 测试导出/导入

1. **点击导出按钮**
2. **预期**: 下载一个JSON文件
3. **清空设计**
4. **导入刚才的JSON文件**
5. **预期**: 设计完全恢复

---

## 📊 修复前后对比

### 修复前

```
用户修改属性
  ↓
updateControl修改对象
  ↓
❌ Vue没有检测到变化
  ↓
❌ 组件不重新渲染
  ↓
❌ 刷新后数据丢失
```

### 修复后

```
用户修改属性
  ↓
updateControl深拷贝+完全替换
  ↓
✅ Vue检测到currentView变化
  ↓
✅ 组件立即重新渲染
  ↓
✅ 自动保存到localStorage
  ↓
✅ 刷新后自动恢复
```

---

## 🚀 实施步骤

### 步骤1: 修复实时更新

1. 修改`src/core/renderer/designer/composables/useDesignerState.ts`的`updateControl`函数
2. 添加深拷贝和完全替换逻辑
3. 测试属性更新是否实时生效

### 步骤2: 创建持久化服务

1. 创建`src/core/services/PersistenceService.ts`
2. 实现保存/加载/导出/导入功能
3. 添加自动保存机制

### 步骤3: 集成到DesignerNew

1. 在`DesignerNew.vue`中导入PersistenceService
2. 在`onMounted`中加载数据
3. 启动自动保存
4. 修改`handleSave`函数

### 步骤4: 添加UI控件

1. 在工具栏添加"导出"和"导入"按钮
2. 添加"清空设计"按钮
3. 显示自动保存状态指示器

---

## 🎯 成功标准

修复成功后,应该能够:

- ✅ 修改属性后画布立即更新
- ✅ 刷新浏览器后设计自动恢复
- ✅ 每2秒自动保存一次
- ✅ 可以导出设计为JSON文件
- ✅ 可以导入JSON文件恢复设计
- ✅ 控制台显示详细的持久化日志

---

## 🔧 可选优化

### 优化1: IndexedDB存储

- 对于大型设计,localStorage可能不够用
- 可以使用IndexedDB存储更大的数据

### 优化2: 版本控制

- 保存多个历史版本
- 支持回退到之前的版本

### 优化3: 云端同步

- 集成后端API
- 支持多设备同步

### 优化4: 冲突解决

- 检测本地和云端的冲突
- 提供合并或选择策略

---

## 🎊 总结

这个方案解决了两个核心问题:

1. **实时更新**: 通过深拷贝和完全替换`currentView`,确保Vue的响应式系统能够检测到变化
2. **持久化**: 通过localStorage自动保存,确保数据不会丢失

所有修改都符合当前的架构和基建,不需要大规模重构! 🚀
