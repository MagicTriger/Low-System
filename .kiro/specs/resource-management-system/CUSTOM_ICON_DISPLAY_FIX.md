# 自定义图标显示修复

## 问题描述

在资源管理页面的表格视图中,当资源使用自定义图标时(如"custom/tree"),图标列显示的是文本字符串而不是实际的图标样式。

## 问题原因

`getIconComponent`函数只尝试从'antd'图标库获取图标,没有处理自定义图标的情况。自定义图标的格式是"custom/iconName",需要特殊解析。

## 解决方案

### 修改文件: `src/modules/designer/views/ResourceManagement.vue`

更新了`getIconComponent`函数,添加了对自定义图标的支持:

```typescript
const getIconComponent = (iconName?: string) => {
  if (!iconName) return null

  // 检查是否是自定义图标 (格式: custom/iconName)
  if (iconName.startsWith('custom/')) {
    const customIconName = iconName.replace('custom/', '')
    const iconManager = getIconLibraryManager()
    const customIcon = iconManager.getIcon('custom', customIconName)
    if (customIcon) {
      return customIcon.component
    }
  }

  // 尝试从图标库获取
  const iconManager = getIconLibraryManager()
  const icon = iconManager.getIcon('antd', iconName)
  if (icon) {
    return icon.component
  }

  // 降级到固定映射
  const iconMap: Record<string, any> = {
    folder: FolderOutlined,
    file: FileOutlined,
    app: AppstoreOutlined,
  }
  return iconMap[iconName] || null
}
```

## 修复逻辑

1. **检测自定义图标**: 首先检查图标名称是否以"custom/"开头
2. **解析图标名称**: 移除"custom/"前缀,获取实际的图标名称
3. **从自定义图标库获取**: 使用`iconManager.getIcon('custom', customIconName)`从自定义图标库获取图标
4. **返回组件**: 如果找到自定义图标,返回其组件
5. **回退处理**: 如果不是自定义图标,继续原有的逻辑(从antd库或固定映射获取)

## 图标格式说明

### 自定义图标格式

- 格式: `custom/iconName`
- 示例: `custom/tree`, `custom/user`, `custom/settings`
- 存储位置: 自定义图标库(localStorage)

### 标准图标格式

- 格式: `iconName`
- 示例: `folder`, `file`, `app`
- 来源: Ant Design图标库或固定映射

## 测试建议

1. **测试自定义图标显示**:

   - 在资源管理页面切换到表格视图
   - 查看使用自定义图标的资源
   - 确认图标列显示实际的图标样式而不是文本

2. **测试标准图标显示**:

   - 确认使用标准图标的资源仍然正常显示
   - 测试folder、file、app等固定映射的图标

3. **测试图标库集成**:

   - 添加新的自定义图标
   - 将自定义图标分配给资源
   - 在表格视图中确认新图标正确显示

4. **测试边界情况**:
   - 图标名称为空
   - 图标名称不存在
   - 图标名称格式错误

## 相关文件

- `src/modules/designer/views/ResourceManagement.vue` - 资源管理页面
- `src/core/renderer/icons/IconLibraryManager.ts` - 图标库管理器
- `src/core/renderer/icons/CustomIconManager.ts` - 自定义图标管理器
- `src/core/renderer/icons/types.ts` - 图标类型定义

## 完成时间

2025-10-16
