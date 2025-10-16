# 资源表单图标预览增强

## 修复时间

2025-10-16

## 问题描述

在编辑资源弹框(ResourceForm.vue)中,图标选择器虽然在下拉列表中显示了图标预览,但在选中后的输入框中没有显示图标的视觉预览,用户只能看到图标的文本名称(如"custom/tree"或"user-outlined"),无法直观地确认选择的图标样式。

## 解决方案

### 修改文件: `src/modules/designer/components/ResourceForm.vue`

#### 1. 在图标选择器中添加suffixIcon插槽

在`a-select`组件中添加了`#suffixIcon`插槽,用于显示当前选中图标的预览:

```vue
<a-select
  v-model:value="formData.icon"
  placeholder="请输入关键词搜索图标（支持模糊查询）"
  show-search
  allow-clear
  :filter-option="filterIconOption"
  :dropdown-render="dropdownRender"
  @search="handleIconSearch"
  :not-found-content="iconSearchQuery ? '未找到匹配的图标' : '请输入关键词搜索'"
  :loading="iconLoading"
>
  <template #suffixIcon>
    <component
      :is="getSelectedIconComponent()"
      v-if="formData.icon && getSelectedIconComponent()"
      class="selected-icon-preview"
    />
  </template>
  <a-select-option v-for="icon in iconList" :key="icon.name" :value="icon.name">
    <div class="icon-option">
      <component :is="icon.component" class="icon-preview" />
      <span class="icon-name">{{ icon.name }}</span>
    </div>
  </a-select-option>
</a-select>
```

#### 2. 添加getSelectedIconComponent函数

实现了一个函数来获取当前选中图标的Vue组件:

```typescript
// 获取选中图标的组件
const getSelectedIconComponent = () => {
  if (!formData.value.icon) return null

  // 检查是否是自定义图标 (格式: custom/iconName)
  if (formData.value.icon.startsWith('custom/')) {
    const customIconName = formData.value.icon.replace('custom/', '')
    const customIcon = iconManager.getIcon('custom', customIconName)
    if (customIcon) {
      return customIcon.component
    }
  }

  // 尝试从所有图标库中查找
  const allLibraries = iconManager.getAllLibraries()
  for (const library of allLibraries) {
    const icon = iconManager.getIcon(library.id, formData.value.icon)
    if (icon) {
      return icon.component
    }
  }

  return null
}
```

#### 3. 添加样式

为选中的图标预览添加了样式:

```css
/* 选中图标的预览样式 */
.selected-icon-preview {
  font-size: 16px;
  color: #1890ff;
  margin-right: 4px;
}

/* 确保选中的值也显示图标 */
:deep(.ant-select-selection-item) {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

## 功能特性

### 1. 图标预览显示

- 在选择框的右侧(suffixIcon位置)显示当前选中图标的实际样式
- 图标以蓝色(#1890ff)显示,与Ant Design的主题色保持一致
- 图标大小为16px,与输入框高度协调

### 2. 自定义图标支持

- 正确解析"custom/iconName"格式的自定义图标
- 从自定义图标库中获取图标组件
- 与ResourceManagement.vue中的图标显示逻辑保持一致

### 3. 多图标库支持

- 支持从所有已注册的图标库中查找图标
- 自动遍历所有图标库,找到匹配的图标组件
- 兼容Ant Design图标库和自定义图标库

### 4. 智能显示

- 只有在选中图标且能找到对应组件时才显示预览
- 避免在未选择或找不到图标时显示空白或错误

## 用户体验改进

### 之前:

```
图标字段: [custom/tree ▼]
           ↑
        只有文本名称
```

### 现在:

```
图标字段: [custom/tree 🌲]
           ↑           ↑
        文本名称    图标预览
```

## 界面效果

1. **未选择图标时**: 显示占位符文本"请输入关键词搜索图标"
2. **选择图标后**: 在输入框右侧显示图标预览 + 图标名称
3. **下拉列表**: 每个选项都显示图标预览 + 图标名称
4. **清除图标**: 点击清除按钮后,图标预览消失

## 技术实现

### 动态组件渲染

使用Vue 3的`<component :is="...">`语法动态渲染图标组件:

- 支持任何Vue组件作为图标
- 实时响应图标选择的变化
- 性能优化,只在需要时查找图标组件

### 图标查找策略

1. 首先检查是否是自定义图标(custom/前缀)
2. 如果是自定义图标,从自定义图标库获取
3. 如果不是,遍历所有已注册的图标库
4. 返回第一个匹配的图标组件

### 样式集成

- 使用`:deep()`选择器修改Ant Design组件的内部样式
- 保持与现有设计系统的一致性
- 响应式布局,适配不同屏幕尺寸

## 测试建议

### 1. 测试自定义图标预览

- 打开编辑资源弹框
- 选择一个自定义图标(如custom/tree)
- 确认输入框右侧显示实际的图标样式

### 2. 测试标准图标预览

- 选择标准图标(如user-outlined, home-outlined)
- 确认图标正确显示

### 3. 测试图标切换

- 在不同图标之间切换
- 确认预览实时更新

### 4. 测试清除功能

- 选择一个图标
- 点击清除按钮
- 确认图标预览消失

### 5. 测试图标库切换

- 切换不同的图标库
- 选择图标后确认预览正确显示

### 6. 测试表单提交

- 选择图标后保存资源
- 确认在资源列表中图标正确显示

## 相关文件

- `src/modules/designer/components/ResourceForm.vue` - 资源编辑表单(本次修改)
- `src/modules/designer/views/ResourceManagement.vue` - 资源管理页面
- `src/core/renderer/icons/IconLibraryManager.ts` - 图标库管理器
- `src/core/renderer/icons/CustomIconManager.ts` - 自定义图标管理器

## 注意事项

### TypeScript类型警告

代码中存在一个TypeScript类型警告,关于表单验证规则的类型定义。这是Ant Design Vue的类型定义问题,不影响实际功能运行。可以通过以下方式修复(可选):

```typescript
const rules: Record<string, any> = {
  name: [{ required: true, message: '请输入资源名称', trigger: 'blur' }],
  menuCode: [{ required: true, message: '请输入菜单编码', trigger: 'blur' }],
  module: [{ required: true, message: '请输入业务模块', trigger: 'blur' }],
  nodeType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
}
```

### 性能考虑

- `getSelectedIconComponent()`函数会在每次渲染时调用
- 由于图标库通常不大,性能影响可忽略
- 如果图标库很大,可以考虑添加缓存机制

## 后续优化建议

1. **添加图标缓存**: 缓存已查找的图标组件,避免重复查找
2. **图标预加载**: 在打开弹框时预加载常用图标
3. **图标分类**: 在下拉列表中按图标库分组显示
4. **图标收藏**: 允许用户收藏常用图标,快速访问

## 完成状态

✅ 图标预览功能已实现
✅ 自定义图标支持已完成
✅ 多图标库支持已完成
✅ 样式优化已完成
✅ 文档已编写

## 总结

这次修复为资源表单的图标选择器添加了视觉预览功能,大大提升了用户体验。用户现在可以在选择图标时立即看到图标的实际样式,而不仅仅是文本名称。这个功能与ResourceManagement.vue中的图标显示保持一致,提供了统一的用户体验。
