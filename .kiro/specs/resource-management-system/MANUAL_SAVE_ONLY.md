# 设计器手动保存功能说明

## 当前状态

✅ **设计器已经是纯手动保存模式**

经过代码审查，当前的设计器实现已经是纯手动保存模式，没有任何自动保存功能。

## 保存机制

### 1. 手动保存

用户需要点击顶部工具栏的"保存"按钮来保存设计：

```vue
<a-button @click="handleSave" :loading="saving">
  <template #icon><save-outlined /></template>
  保存
</a-button>
```

### 2. 保存逻辑

```typescript
async function handleSave() {
  if (!currentView.value) return

  saving.value = true
  try {
    // 保存到localStorage
    persistenceService.saveToLocal({
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
      dataActions: designerState.dataActions.value,
    })

    // TODO: 如果有后端API,也保存到服务器
    // await api.saveDesign(designId.value, currentView.value)

    hasUnsavedChanges.value = false
    message.success('保存成功')
  } catch (error: any) {
    message.error('保存失败')
  } finally {
    saving.value = false
  }
}
```

### 3. 未保存更改提示

设计器会跟踪未保存的更改，并在以下情况提示用户：

#### 3.1 状态指示器

顶部工具栏显示保存状态：

```vue
<a-badge :dot="hasUnsavedChanges" color="orange">
  <span class="save-status">{{ hasUnsavedChanges ? '未保存' : '已保存' }}</span>
</a-badge>
```

#### 3.2 返回确认

当用户尝试返回资源管理页面时，如果有未保存的更改，会弹出确认对话框：

```typescript
function handleBack() {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认返回',
      content: '当前有未保存的更改，确定要返回吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        router.push('/designer/resource')
      },
    })
  } else {
    router.push('/designer/resource')
  }
}
```

## 触发未保存状态的操作

以下操作会将 `hasUnsavedChanges` 设置为 `true`：

1. **添加控件**

   - 从组件库拖拽控件到画布
   - 粘贴控件
   - 复制控件

2. **删除控件**

   - 从大纲树删除控件
   - 从画布删除控件

3. **移动控件**

   - 在大纲树中拖拽控件
   - 在画布中移动控件

4. **调整控件大小**

   - 拖拽控件的调整手柄

5. **修改控件属性**

   - 在属性面板修改属性
   - 修改样式
   - 修改事件

6. **重命名页面**

   - 修改页面名称

7. **数据源配置**
   - 修改数据源
   - 修改数据流
   - 修改数据操作

## 没有自动保存的原因

### 优点

1. **用户控制** - 用户完全控制何时保存，避免意外保存错误的更改
2. **性能优化** - 不会频繁触发保存操作，减少性能开销
3. **撤销/重做** - 用户可以自由撤销/重做，不用担心自动保存破坏历史记录
4. **明确的保存点** - 用户明确知道哪些更改已保存，哪些未保存

### 缺点

1. **数据丢失风险** - 如果用户忘记保存，可能会丢失更改
2. **需要手动操作** - 用户需要记得点击保存按钮

## 建议的改进（可选）

如果未来需要增强保存体验，可以考虑以下方案：

### 1. 定时提醒保存

```typescript
// 每5分钟检查一次未保存更改
let saveReminderTimer: NodeJS.Timeout | null = null

onMounted(() => {
  saveReminderTimer = setInterval(
    () => {
      if (hasUnsavedChanges.value) {
        message.warning('您有未保存的更改，请及时保存')
      }
    },
    5 * 60 * 1000
  ) // 5分钟
})

onUnmounted(() => {
  if (saveReminderTimer) {
    clearInterval(saveReminderTimer)
  }
})
```

### 2. 浏览器关闭前提示

```typescript
onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', handleBeforeUnload)
})

function handleBeforeUnload(e: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) {
    e.preventDefault()
    e.returnValue = '您有未保存的更改，确定要离开吗？'
    return e.returnValue
  }
}
```

### 3. 快捷键保存

```typescript
onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
})

function handleKeyDown(e: KeyboardEvent) {
  // Ctrl+S 或 Cmd+S
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    handleSave()
  }
}
```

### 4. 自动草稿保存（不影响正式保存）

```typescript
// 每30秒自动保存草稿到localStorage
let autoDraftTimer: NodeJS.Timeout | null = null

onMounted(() => {
  autoDraftTimer = setInterval(() => {
    if (hasUnsavedChanges.value && currentView.value) {
      // 保存到草稿，不影响正式保存
      persistenceService.saveDraft({
        view: currentView.value,
        timestamp: Date.now(),
      })
      console.log('草稿已自动保存')
    }
  }, 30 * 1000) // 30秒
})

onUnmounted(() => {
  if (autoDraftTimer) {
    clearInterval(autoDraftTimer)
  }
})

// 页面加载时检查是否有草稿
onMounted(() => {
  const draft = persistenceService.loadDraft()
  if (draft && draft.timestamp > lastSaveTimestamp) {
    Modal.confirm({
      title: '发现未保存的草稿',
      content: `发现 ${formatTime(draft.timestamp)} 的草稿，是否恢复？`,
      okText: '恢复草稿',
      cancelText: '忽略',
      onOk: () => {
        // 恢复草稿
        designerState.setView(draft.view)
        message.success('已恢复草稿')
      },
      onCancel: () => {
        // 删除草稿
        persistenceService.deleteDraft()
      },
    })
  }
})
```

## 总结

当前设计器已经实现了纯手动保存模式：

✅ **只能通过点击保存按钮保存**
✅ **有未保存更改提示**
✅ **返回时有确认对话框**
✅ **保存状态清晰可见**

如果需要增强保存体验，建议优先考虑：

1. 快捷键保存（Ctrl+S）
2. 浏览器关闭前提示
3. 定时提醒保存
4. 自动草稿保存（不影响正式保存）

---

**文档创建时间**: 2025-10-17  
**状态**: ✅ 已确认为手动保存模式
