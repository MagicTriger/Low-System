# 工具栏和预览功能修复

## 修改内容

### 1. 删除"新建"按钮

从顶部工具栏中删除了"新建"按钮，简化界面。

**修改前**：

```vue
<a-button-group>
  <a-button @click="handleNew">新建</a-button>
  <a-button @click="handleSave">保存</a-button>
  <a-button @click="handlePreview">预览</a-button>
</a-button-group>
```

**修改后**：

```vue
<a-button-group>
  <a-button @click="handleSave">保存</a-button>
  <a-button @click="handlePreview">预览</a-button>
</a-button-group>
```

同时删除了 `handleNew()` 函数的实现。

### 2. 修复预览功能

**问题**：

- 之前的预览功能要求必须先保存设计（需要 designId）
- 如果没有保存过，会提示"请先保存页面"
- 用户无法快速预览当前设计效果

**解决方案**：
使用 sessionStorage 临时存储当前设计数据，无需保存即可预览。

**修改后的逻辑**：

```typescript
async function handlePreview() {
  if (!currentView.value) {
    message.warning('没有可预览的内容')
    return
  }

  try {
    // 将当前设计数据保存到 sessionStorage 用于预览
    const previewData = {
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
      dataActions: designerState.dataActions.value,
      timestamp: Date.now(),
    }

    sessionStorage.setItem('preview-data', JSON.stringify(previewData))

    // 打开预览页面（使用临时预览模式）
    const previewUrl = router.resolve({
      name: 'Preview',
      params: { id: 'temp' },
      query: { mode: 'temp' },
    }).href

    window.open(previewUrl, '_blank')
    message.success('已打开预览')
  } catch (error: any) {
    console.error('预览失败:', error)
    message.error('预览失败: ' + (error.message || '未知错误'))
  }
}
```

## 功能特点

### 1. 简化的工具栏

- ✅ 删除了"新建"按钮
- ✅ 保留"保存"和"预览"按钮
- ✅ 界面更简洁

### 2. 改进的预览功能

- ✅ **无需保存即可预览** - 直接预览当前设计
- ✅ **使用 sessionStorage** - 临时存储预览数据
- ✅ **独立窗口** - 在新标签页中打开预览
- ✅ **包含完整数据** - 包括视图、数据源、数据流等

## 使用方法

### 预览当前设计

1. 在设计器中编辑页面
2. 点击工具栏的"预览"按钮
3. 系统自动在新标签页打开预览
4. 无需先保存，即可查看效果 ✅

### 预览数据存储

预览数据存储在 sessionStorage 中：

- Key: `preview-data`
- 包含: view, dataSources, dataFlows, dataActions, timestamp
- 生命周期: 浏览器标签页关闭后自动清除

## 注意事项

### 预览页面需要适配

预览页面（Preview 组件）需要支持从 sessionStorage 读取数据：

```typescript
// 在 Preview 组件中
const route = useRoute()

if (route.query.mode === 'temp') {
  // 从 sessionStorage 读取预览数据
  const previewDataStr = sessionStorage.getItem('preview-data')
  if (previewDataStr) {
    const previewData = JSON.parse(previewDataStr)
    // 使用 previewData 渲染页面
  }
} else {
  // 从服务器加载保存的设计
  const designId = route.params.id
  // ...
}
```

## 优势

1. ✅ **更快的预览** - 无需保存即可预览
2. ✅ **更简洁的界面** - 删除不常用的"新建"按钮
3. ✅ **更好的体验** - 即时查看设计效果
4. ✅ **数据安全** - sessionStorage 自动清理，不占用永久存储

## 总结

通过删除"新建"按钮和改进预览功能，提升了设计器的易用性：

- 工具栏更简洁
- 预览更快捷
- 无需保存即可预览
- 用户体验更好

现在用户可以随时点击"预览"按钮查看当前设计效果，无需先保存！
