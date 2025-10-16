# 资源按节点类型分类显示

## 修改时间

2025-10-16

## 需求说明

根据`nodeType`字段对资源进行分类显示:

- `nodeType = 1` (文件夹): 设计端资源
- `nodeType = 2` (页面): 管理端资源
- `nodeType = 3` (按钮)或其他: 其他资源

## 实现方案

### 修改文件: `src/modules/designer/views/ResourceManagement.vue`

#### 1. 添加计算属性

添加了三个计算属性来分类资源:

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

#### 2. 修改模板结构

将卡片视图改为分类显示:

```vue
<!-- 卡片视图 -->
<div v-if="viewMode === 'card'" class="resource-sections">
  <!-- 设计端资源 (nodeType = 1) -->
  <div v-if="designerResources.length > 0" class="resource-section">
    <div class="section-header">
      <h3>设计端资源</h3>
      <a-tag color="blue">{{ designerResources.length }} 个资源</a-tag>
    </div>
    <ResourceCardView
      :resources="designerResources"
      @edit="handleEdit"
      @delete="handleDelete"
      @designer="handleDesigner"
      @mount="handleToggleMount"
    />
  </div>

  <!-- 管理端资源 (nodeType = 2) -->
  <div v-if="adminResources.length > 0" class="resource-section">
    <div class="section-header">
      <h3>管理端资源</h3>
      <a-tag color="green">{{ adminResources.length }} 个资源</a-tag>
    </div>
    <ResourceCardView
      :resources="adminResources"
      @edit="handleEdit"
      @delete="handleDelete"
      @designer="handleDesigner"
      @mount="handleToggleMount"
    />
  </div>

  <!-- 其他资源 (nodeType = 3 或其他) -->
  <div v-if="otherResources.length > 0" class="resource-section">
    <div class="section-header">
      <h3>其他资源</h3>
      <a-tag color="orange">{{ otherResources.length }} 个资源</a-tag>
    </div>
    <ResourceCardView
      :resources="otherResources"
      @edit="handleEdit"
      @delete="handleDelete"
      @designer="handleDesigner"
      @mount="handleToggleMount"
    />
  </div>

  <!-- 空状态 -->
  <div v-if="dataSource.length === 0 && !loading" class="empty-state">
    <a-empty description="暂无资源数据">
      <a-button type="primary" @click="handleCreate">
        <template #icon>
          <PlusOutlined />
        </template>
        创建第一个资源
      </a-button>
    </a-empty>
  </div>
</div>
```

#### 3. 添加样式

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

## 功能特性

### 1. 自动分类显示

- **设计端资源**: 显示所有`nodeType = 1`的资源(文件夹类型)
- **管理端资源**: 显示所有`nodeType = 2`的资源(页面类型)
- **其他资源**: 显示所有`nodeType = 3`或其他类型的资源(按钮等)

### 2. 动态统计

每个分类标题旁边显示该分类下的资源数量:

- 设计端资源: 蓝色标签
- 管理端资源: 绿色标签
- 其他资源: 橙色标签

### 3. 条件显示

- 只有当某个分类下有资源时,才显示该分类
- 如果某个分类为空,则不显示该分类的标题和内容
- 保持界面简洁,避免显示空的分类

### 4. 递归提取

- 使用`flattenResources`函数递归提取所有资源,包括嵌套的子资源
- 确保所有层级的资源都能被正确分类

### 5. 保持原有功能

- 搜索功能仍然有效,会在所有分类中搜索
- 筛选功能仍然有效,会影响所有分类的显示
- 表格树视图不受影响,仍然显示完整的树形结构
- 编辑、删除、设计器、挂载等操作仍然有效

## 界面效果

### 分类显示效果

```
┌─────────────────────────────────────────┐
│ 🔍 搜索框                    [卡片] [树形] │
├─────────────────────────────────────────┤
│ 设计端资源                        3 个资源 │
│ ─────────────────────────────────────── │
│ [📁 页面设计]  [📁 组件库]  [📁 模板库]    │
│                                         │
│ 管理端资源                        4 个资源 │
│ ─────────────────────────────────────── │
│ [👤 用户管理]  [👥 角色管理]              │
│ [📋 菜单管理]  [🔒 权限管理]              │
│                                         │
│ 其他资源                          2 个资源 │
│ ─────────────────────────────────────── │
│ [🔘 导出按钮]  [🔘 导入按钮]              │
└─────────────────────────────────────────┘
```

### 空状态处理

如果所有分类都为空,显示统一的空状态:

```
┌─────────────────────────────────────────┐
│           📭                            │
│        暂无资源数据                        │
│     [+ 创建第一个资源]                     │
└─────────────────────────────────────────┘
```

## 数据结构

### 资源对象结构

```typescript
interface MenuResource {
  id: number
  name: string // 资源名称
  menuCode: string // 菜单编码
  module: string // 业务模块
  nodeType: number // 节点类型: 1=文件夹, 2=页面, 3=按钮
  path?: string // 路由路径
  icon?: string // 图标
  sortOrder: number // 排序
  parentId?: number // 父级ID
  mountedToAdmin?: boolean // 是否已挂载到管理端
  children?: MenuResource[] // 子资源
}
```

### 节点类型说明

```typescript
enum NodeType {
  FOLDER = 1, // 文件夹 - 设计端资源
  PAGE = 2, // 页面 - 管理端资源
  BUTTON = 3, // 按钮 - 其他资源
}
```

## 业务逻辑

### 1. 设计端资源 (nodeType = 1)

这些资源主要用于页面设计和开发:

- 页面设计文件夹
- 组件库文件夹
- 模板库文件夹
- 其他设计相关的组织结构

**特点**:

- 通常作为容器,包含其他资源
- 不直接对应具体的功能页面
- 主要用于组织和分类

### 2. 管理端资源 (nodeType = 2)

这些资源是具体的管理功能页面:

- 用户管理页面
- 角色管理页面
- 菜单管理页面
- 权限管理页面
- 其他系统管理页面

**特点**:

- 对应具体的功能页面
- 可以被挂载到管理端侧边栏
- 有具体的路由路径和URL

### 3. 其他资源 (nodeType = 3+)

这些资源是页面内的功能按钮或其他元素:

- 导出按钮
- 导入按钮
- 审批按钮
- 其他操作按钮

**特点**:

- 通常是页面内的功能元素
- 不对应独立的页面
- 用于权限控制

## 挂载逻辑

### 管理端资源挂载

只有`nodeType = 2`的资源可以被挂载到管理端:

1. 在管理端资源分类下,每个资源卡片显示"挂载"按钮
2. 点击挂载后,资源会出现在管理端的侧边栏中
3. 管理端会为该资源自动注册路由
4. 用户可以通过侧边栏访问该页面

### 设计端资源不可挂载

`nodeType = 1`的资源(文件夹)不应该被挂载到管理端,因为它们只是组织结构,不是具体的功能页面。

## 搜索和筛选

### 搜索行为

搜索功能会在所有分类中进行搜索:

- 输入关键词后,每个分类只显示匹配的资源
- 如果某个分类没有匹配的资源,该分类会被隐藏
- 搜索结果仍然按分类显示

### 筛选行为

筛选功能(按模块、节点类型)会影响所有分类:

- 选择特定节点类型时,只显示对应的分类
- 例如选择"页面"时,只显示管理端资源分类
- 选择"文件夹"时,只显示设计端资源分类

## 测试建议

### 1. 测试分类显示

1. 创建不同`nodeType`的资源
2. 确认资源出现在正确的分类下
3. 确认分类标题和数量统计正确

### 2. 测试搜索功能

1. 输入搜索关键词
2. 确认搜索结果在正确的分类下显示
3. 确认空分类被正确隐藏

### 3. 测试筛选功能

1. 选择不同的节点类型筛选
2. 确认只显示对应的分类
3. 确认筛选逻辑正确

### 4. 测试递归提取

1. 创建嵌套的资源结构
2. 确认所有层级的资源都被正确提取和分类
3. 确认子资源不会被遗漏

### 5. 测试挂载功能

1. 尝试挂载管理端资源(nodeType=2)
2. 确认挂载成功
3. 确认设计端资源不显示挂载按钮(如果有此逻辑)

## 相关文件

- `src/modules/designer/views/ResourceManagement.vue` - 资源管理主页面(本次修改)
- `src/modules/designer/components/ResourceCardView.vue` - 资源卡片视图组件
- `src/modules/designer/components/ResourceTree.vue` - 资源树形视图组件
- `src/core/api/menu.ts` - 菜单资源API

## 完成状态

✅ 添加资源分类显示逻辑
✅ 添加计算属性进行资源分类
✅ 添加递归提取函数
✅ 添加分类标题和统计
✅ 添加样式美化
✅ 保持原有搜索筛选功能
✅ 文档已编写

## 总结

这次修改实现了根据`nodeType`字段对资源进行分类显示的功能:

1. **设计端资源** (`nodeType = 1`): 主要是文件夹类型的组织结构
2. **管理端资源** (`nodeType = 2`): 主要是具体的管理功能页面
3. **其他资源** (`nodeType = 3+`): 主要是按钮等功能元素

通过这种分类显示,用户可以更清晰地了解不同类型资源的用途和归属,提高了资源管理的效率和用户体验。

递归提取功能确保了所有层级的资源都能被正确分类,即使资源有复杂的嵌套结构也能正常工作。
