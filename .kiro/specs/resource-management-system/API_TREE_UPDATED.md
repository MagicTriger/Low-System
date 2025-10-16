# 🌲 API 切换到树形接口

## ✅ 修改完成

### 📝 修改内容

#### src/modules/designer/views/ResourceManagement.vue

**修改前**：使用分页列表 API

```typescript
await resourceModule.dispatch('fetchResources', {
  ...filterForm,
  page: pagination.current,
  size: pagination.pageSize,
})
```

**修改后**：使用树形 API

```typescript
// 使用树形 API 获取菜单树
await resourceModule.dispatch('fetchResourceTree')

// 获取树形数据
const treeData = resourceModule.state.resourceTree

// 合并默认客户端和 API 返回的树形数据
const clientsWithChildren = defaultClients.map(client => {
  const treeNode = treeData.find(node => node.menuCode === client.menuCode)
  return {
    ...client,
    children: treeNode?.children || [],
  }
})
```

### 🎯 API 对比

| 特性 | 列表 API                                     | 树形 API                      |
| ---- | -------------------------------------------- | ----------------------------- |
| 路径 | `/api/permissions/menus/list`                | `/api/permissions/menus/tree` |
| 方法 | GET                                          | GET                           |
| 参数 | page, size, name, menuCode, module, nodeType | 无                            |
| 返回 | 分页数据                                     | 完整树形结构                  |
| 优点 | 支持分页、搜索                               | 一次获取完整结构              |
| 缺点 | 需要手动构建树                               | 数据量大时性能问题            |

### 🌲 树形 API 响应格式

```json
{
  "success": true,
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "parentId": null,
      "menuCode": "designer",
      "name": "设计器",
      "module": "designer",
      "nodeType": 1,
      "nodeTypeText": "文件夹",
      "sortOrder": 1,
      "icon": "desktop",
      "createdAt": "2025-09-11 17:19:51",
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "menuCode": "user",
          "name": "用户管理",
          "module": "system",
          "nodeType": 2,
          "nodeTypeText": "页面",
          "sortOrder": 1,
          "url": "/system/user",
          "createdAt": "2025-09-11 17:19:51",
          "children": []
        }
      ]
    }
  ]
}
```

### 🎨 数据处理流程

```
1. 调用 fetchResourceTree
   ↓
2. 获取完整的树形数据
   ↓
3. 根据 menuCode 匹配默认客户端
   ↓
4. 将树节点的 children 赋值给客户端
   ↓
5. 显示在卡片视图中
```

### 💡 优势

1. **完整的层级结构**

   - 一次请求获取所有数据
   - 自动包含父子关系
   - 支持无限层级

2. **简化数据处理**

   - 不需要手动构建树
   - 不需要按 parentId 分组
   - 直接使用 children 属性

3. **更好的性能**
   - 减少 API 请求次数
   - 前端缓存完整数据
   - 快速的层级导航

### ⚠️ 注意事项

1. **数据量问题**

   - 如果菜单数量很大，可能影响性能
   - 建议后端限制树的深度
   - 或者实现懒加载

2. **搜索功能**

   - 当前搜索功能可能需要调整
   - 需要在前端过滤树形数据
   - 或者添加专门的搜索 API

3. **分页功能**
   - 树形 API 不支持分页
   - 如果需要分页，应该使用列表 API
   - 或者在前端实现虚拟滚动

### 🔄 后续优化建议

#### 1. 混合使用两个 API

```typescript
// 卡片视图：使用树形 API
if (viewMode.value === 'card') {
  await resourceModule.dispatch('fetchResourceTree')
}

// 表格视图：使用列表 API（支持分页）
if (viewMode.value === 'table') {
  await resourceModule.dispatch('fetchResources', {
    page: pagination.current,
    size: pagination.pageSize,
  })
}
```

#### 2. 实现前端搜索

```typescript
const searchInTree = (nodes: MenuTreeNode[], keyword: string): MenuTreeNode[] => {
  const results: MenuTreeNode[] = []

  for (const node of nodes) {
    if (node.name.includes(keyword) || node.menuCode.includes(keyword)) {
      results.push(node)
    }
    if (node.children) {
      results.push(...searchInTree(node.children, keyword))
    }
  }

  return results
}
```

#### 3. 懒加载子节点

```typescript
// 只在点击时加载子节点
const loadChildren = async (parentId: number) => {
  const response = await menuApiService.getMenuList({ parentId })
  return response.data.data
}
```

### 📚 相关文档

1. [菜单管理接口文档](./菜单管理接口.md)
2. [卡片导航功能](.kiro/specs/resource-management-system/CARD_NAVIGATION_FEATURE.md)
3. [资源管理系统设计](.kiro/specs/resource-management-system/design.md)

### 🎉 总结

**修改完成！**

**变更内容**：

- ✅ 从列表 API 切换到树形 API
- ✅ 使用 `/api/permissions/menus/tree`
- ✅ 简化了数据处理逻辑
- ✅ 支持完整的层级结构

**现在刷新浏览器，系统将使用树形 API 获取菜单数据！** 🚀
