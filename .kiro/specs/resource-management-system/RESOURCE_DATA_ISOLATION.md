# 资源数据隔离实现

## 更新时间

2025-10-15

## 问题描述

之前所有资源的设计器数据都存储在同一个 localStorage 键中，导致：

1. 打开不同资源时，看到的都是同一份设计数据
2. 无法为每个资源独立设计页面
3. 切换资源时数据会相互覆盖

## 解决方案

### 1. 路由配置调整

**最终路由结构：**

- 资源管理器：`/designer/resource`
- 设计器：`/designer/resource/:url`

### 2. PersistenceService 增强

**文件：** `src/core/services/PersistenceService.ts`

**新增功能：**

1. **资源 URL 管理**

```typescript
private currentResourceUrl: string | null = null

setResourceUrl(url: string): void {
  this.currentResourceUrl = url
}
```

2. **动态存储键生成**

```typescript
private getStorageKey(resourceUrl?: string): string {
  const url = resourceUrl || this.currentResourceUrl
  if (!url) {
    return this.storageKeyPrefix  // 向后兼容
  }
  return `${this.storageKeyPrefix}_${url}`
}
```

3. **按资源保存和加载**

```typescript
saveToLocal(data: {...}, resourceUrl?: string): void
loadFromLocal(resourceUrl?: string): any | null
clearLocal(resourceUrl?: string): void
```

4. **批量清理功能**

```typescript
clearAllLocal(): void {
  // 清除所有资源的设计数据
}
```

### 3. DesignerNew.vue 集成

**文件：** `src/modules/designer/views/DesignerNew.vue`

**修改内容：**

1. **获取资源 URL**

```typescript
onMounted(async () => {
  const resourceUrl = route.params.url as string
  console.log('🎯 [Designer] Resource URL:', resourceUrl)

  // 设置持久化服务的资源 URL
  if (resourceUrl) {
    persistenceService.setResourceUrl(resourceUrl)
  }

  // 加载该资源的数据
  const savedData = persistenceService.loadFromLocal(resourceUrl)
  // ...
})
```

2. **自动保存使用资源 URL**

```typescript
persistenceService.startAutoSave(() => {
  if (currentView.value) {
    persistenceService.saveToLocal({
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
      dataActions: designerState.dataActions.value,
    })
    console.log(`🔄 [Auto-save] Design auto-saved for resource: ${resourceUrl}`)
  }
})
```

## 存储结构

### LocalStorage 键格式

```
designer_data_home       -> 首页资源的设计数据
designer_data_about      -> 关于页资源的设计数据
designer_data_contact    -> 联系页资源的设计数据
designer_data_products   -> 产品页资源的设计数据
```

### 数据格式

```json
{
  "view": {
    "id": "view_xxx",
    "name": "页面名称",
    "controls": [...]
  },
  "dataSources": {...},
  "dataFlows": {...},
  "dataActions": {...},
  "timestamp": 1697123456789,
  "version": "1.0.0",
  "resourceUrl": "home"
}
```

## 工作流程

### 1. 打开资源进行设计

```
用户点击资源卡片
  ↓
导航到 /designer/resource/home
  ↓
DesignerNew.vue 获取 URL 参数 "home"
  ↓
设置 persistenceService.setResourceUrl("home")
  ↓
加载 localStorage["designer_data_home"]
  ↓
显示该资源的设计数据
```

### 2. 保存设计数据

```
用户编辑设计
  ↓
自动保存触发（每2秒）
  ↓
persistenceService.saveToLocal(data)
  ↓
保存到 localStorage["designer_data_home"]
  ↓
该资源的数据独立保存
```

### 3. 切换资源

```
返回资源管理页面
  ↓
点击另一个资源（如 "about"）
  ↓
导航到 /designer/resource/about
  ↓
设置 persistenceService.setResourceUrl("about")
  ↓
加载 localStorage["designer_data_about"]
  ↓
显示 about 资源的设计数据（与 home 完全独立）
```

## 优势

### 1. 数据隔离

- 每个资源的设计数据完全独立
- 不会相互覆盖或混淆
- 可以为每个页面设计不同的布局和组件

### 2. 灵活性

- 支持任意数量的资源
- 可以随时添加新资源
- 每个资源都有独立的设计历史

### 3. 可维护性

- 清晰的存储结构
- 易于调试和排查问题
- 可以单独清除某个资源的数据

### 4. 向后兼容

- 如果没有提供资源 URL，仍然使用默认键
- 不会破坏现有的数据

## 测试场景

### 场景 1：创建多个资源的设计

1. 打开资源 "home"，添加一些组件
2. 保存并返回
3. 打开资源 "about"，添加不同的组件
4. 保存并返回
5. 再次打开 "home"
6. ✅ 验证：应该看到之前为 "home" 设计的组件，而不是 "about" 的

### 场景 2：自动保存

1. 打开资源 "products"
2. 添加组件并等待 2 秒
3. 刷新页面
4. ✅ 验证：应该自动加载之前的设计

### 场景 3：数据清理

1. 在浏览器控制台执行：

```javascript
const service = new PersistenceService()
service.clearLocal('home') // 清除 home 资源的数据
service.clearAllLocal() // 清除所有资源的数据
```

## 调试技巧

### 查看所有资源的数据

```javascript
// 在浏览器控制台执行
Object.keys(localStorage)
  .filter(key => key.startsWith('designer_data'))
  .forEach(key => {
    console.log(key, JSON.parse(localStorage[key]))
  })
```

### 清除特定资源的数据

```javascript
localStorage.removeItem('designer_data_home')
```

### 查看当前资源的数据

```javascript
const url = window.location.pathname.split('/').pop()
const data = localStorage.getItem(`designer_data_${url}`)
console.log(JSON.parse(data))
```

## 注意事项

1. **资源 URL 必须唯一**

   - 确保每个资源的 URL 字段是唯一的
   - 建议在数据库层面添加唯一约束

2. **LocalStorage 容量限制**

   - LocalStorage 通常有 5-10MB 的限制
   - 如果设计数据过大，考虑使用 IndexedDB
   - 或者实现服务器端存储

3. **数据迁移**

   - 旧的 `designer_data` 键中的数据不会自动迁移
   - 如果需要，可以手动迁移到新的键格式

4. **URL 编码**
   - 如果资源 URL 包含特殊字符，会自动进行 URL 编码
   - 存储键会使用编码后的 URL

## 后续优化建议

1. **服务器端存储**

   - 实现 API 接口保存设计数据到服务器
   - LocalStorage 作为本地缓存
   - 支持多设备同步

2. **版本控制**

   - 为每个资源的设计数据添加版本历史
   - 支持撤销和恢复到历史版本

3. **数据压缩**

   - 对大型设计数据进行压缩
   - 节省 LocalStorage 空间

4. **冲突检测**
   - 检测多个标签页同时编辑同一资源
   - 提供冲突解决机制
