# 资源卡片视图分类显示功能

## 更新时间

2025-10-16

## 功能概述

在资源管理页面的卡片视图中,按 `nodeType` 对资源进行分类显示,让用户能够清晰地区分设计端资源、管理端资源和其他资源。

## 实现的功能

### 1. 分类显示

资源按照 `nodeType` 字段分为三类:

- **设计端资源** (`nodeType = 1`) - 显示蓝色标签
- **管理端资源** (`nodeType = 2`) - 显示绿色标签
- **其他资源** (`nodeType = 3` 或其他) - 显示橙色标签

### 2. 递归提取

- 使用 `flattenResources` 函数递归提取所有资源
- 包括嵌套的子资源
- 确保所有层级的资源都能被正确分类

### 3. 动态统计

- 每个分类标题旁边显示该分类下的资源数量
- 使用不同颜色的标签区分分类
- 实时更新统计数据

### 4. 条件显示

- 只显示有资源的分类
- 空分类自动隐藏
- 保持界面简洁

### 5. 保持原有功能

- 搜索功能仍然有效
- 筛选功能仍然有效
- 表格视图不受影响,仍然显示完整的树形数据
- 所有操作(编辑、删除、设计器、挂载)仍然有效

## 技术实现

### 计算属性

```typescript
// 递归提取所有资源（包括子资源）
const flattenResources = (nodes: MenuTreeNode[]): MenuTreeNode[] => {
  const result: MenuTreeNode[] = []
  const flatten = (items: MenuTreeNode[]) => {
    items.forEach(item => {
      result.push(item)
      if (item.children && item.children.length > 0) {
        flatten(item.children)
      }
    })
  }
  flatten(nodes)
  return result
}

// 设计端资源 (nodeType = 1)
const designerResources = computed(() => {
  const allResources = flattenResources(dataSource.value)
  return allResources.filter(resource => resource.nodeType === 1)
})

// 管理端资源 (nodeType = 2)
const adminResources = computed(() => {
  const allResources = flattenResources(dataSource.value)
  return allResources.filter(resource => resource.nodeType === 2)
})

// 其他资源 (nodeType = 3 或其他)
const otherResources = computed(() => {
  const allResources = flattenResources(dataSource.value)
  return allResources.filter(resource => resource.nodeType !== 1 && resource.nodeType !== 2)
})
```

### 模板结构

```vue
<div v-if="viewMode === 'card'" class="resource-sections">
  <!-- 设计端资源 -->
  <div v-if="designerResources.length > 0" class="resource-section">
    <div class="section-header">
      <h3>设计端资源</h3>
      <a-tag color="blue">{{ designerResources.length }} 个资源</a-tag>
    </div>
    <ResourceCardView :resources="designerResources" ... />
  </div>

  <!-- 管理端资源 -->
  <div v-if="adminResources.length > 0" class="resource-section">
    <div class="section-header">
      <h3>管理端资源</h3>
      <a-tag color="green">{{ adminResources.length }} 个资源</a-tag>
    </div>
    <ResourceCardView :resources="adminResources" ... />
  </div>

  <!-- 其他资源 -->
  <div v-if="otherResources.length > 0" class="resource-section">
    <div class="section-header">
      <h3>其他资源</h3>
      <a-tag color="orange">{{ otherResources.length }} 个资源</a-tag>
    </div>
    <ResourceCardView :resources="otherResources" ... />
  </div>

  <!-- 空状态 -->
  <div v-if="dataSource.length === 0 && !loading" class="empty-state">
    <a-empty description="暂无资源数据">
      <a-button type="primary" @click="handleCreate">
        <template #icon><PlusOutlined /></template>
        创建第一个资源
      </a-button>
    </a-empty>
  </div>
</div>
```

### 样式

```css
.resource-sections {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.resource-section {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.section-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #262626;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
```

## 界面效果

卡片视图现在按以下方式显示:

```
设计端资源                    3 个资源
─────────────────────────────────────
[📁 页面设计]  [📁 组件库]  [📁 模板库]

管理端资源                    4 个资源
─────────────────────────────────────
[👤 用户管理]  [👥 角色管理]
[📋 菜单管理]  [🔒 权限管理]

其他资源                      2 个资源
─────────────────────────────────────
[🔘 导出按钮]  [🔘 导入按钮]
```

## 用户体验改进

1. **清晰的分类** - 用户可以一眼看出哪些资源属于设计端,哪些属于管理端
2. **快速统计** - 每个分类的资源数量一目了然
3. **简洁界面** - 空分类自动隐藏,避免界面混乱
4. **保持一致** - 表格视图保持原有的树形结构,不受影响
5. **灵活切换** - 用户可以在卡片视图和表格视图之间自由切换

## 测试建议

1. 创建不同 `nodeType` 的资源,验证分类是否正确
2. 测试嵌套资源是否能正确提取和分类
3. 验证搜索和筛选功能是否正常工作
4. 测试所有操作按钮(编辑、删除、设计器、挂载)是否正常
5. 切换视图模式,确保表格视图不受影响

## 相关文件

- `src/modules/designer/views/ResourceManagement.vue` - 主要实现文件
- `src/modules/designer/components/ResourceCardView.vue` - 卡片视图组件
- `src/core/api/menu.ts` - 菜单资源类型定义

## 后续优化建议

1. 可以考虑添加分类的折叠/展开功能
2. 可以添加分类的排序功能
3. 可以考虑将分类配置化,支持自定义分类规则
4. 可以添加分类的拖拽排序功能
