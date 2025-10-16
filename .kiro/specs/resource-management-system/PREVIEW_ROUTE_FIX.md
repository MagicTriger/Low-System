# 预览功能路由修复

## 修复时间

2025-10-16

## 问题描述

预览功能显示 "No match for" 错误，页面无法正常加载。

根据截图显示的错误信息：

```
错误类型: No match for {"name":"Preview","params":{"id":"query","mode":"temp"}}
```

## 根本原因

有两个问题导致预览功能失败：

### 1. 路由名称不匹配

**路由配置中的名称：**

```typescript
// src/modules/designer/router/index.ts
{
  path: '/preview/:id',
  name: 'DesignerPreview',  // ← 实际定义的名称
  component: () => import('../views/Preview.vue'),
  meta: {
    title: '预览页面',
    requiresAuth: false,
  },
}
```

**DesignerNew.vue 中使用的名称：**

```typescript
// src/modules/designer/views/DesignerNew.vue
const previewUrl = router.resolve({
  name: 'Preview', // ← 错误！应该是 'DesignerPreview'
  params: { id: 'temp' },
  query: { mode: 'temp' },
}).href
```

### 2. SessionStorage Key 不一致

**DesignerNew.vue 中保存数据：**

```typescript
sessionStorage.setItem('preview-data', JSON.stringify(previewData)) // ← 使用连字符
```

**Preview.vue 中读取数据：**

```typescript
const previewDataStr = sessionStorage.getItem('preview_data') // ← 使用下划线
```

## 修复方案

### 修复 1: 统一路由名称

**文件：** `src/modules/designer/views/DesignerNew.vue`

**修改前：**

```typescript
const previewUrl = router.resolve({
  name: 'Preview',
  params: { id: 'temp' },
  query: { mode: 'temp' },
}).href
```

**修改后：**

```typescript
const previewUrl = router.resolve({
  name: 'DesignerPreview', // ✅ 使用正确的路由名称
  params: { id: 'temp' },
  query: { mode: 'temp' },
}).href
```

### 修复 2: 统一 SessionStorage Key

**文件：** `src/modules/designer/views/Preview.vue`

**修改前：**

```typescript
const previewDataStr = sessionStorage.getItem('preview_data')
```

**修改后：**

```typescript
const previewDataStr = sessionStorage.getItem('preview-data') // ✅ 使用连字符
```

## 数据流程

### 1. 用户点击预览按钮

```typescript
// DesignerNew.vue - handlePreview()
function handlePreview() {
  try {
    // 1. 准备预览数据
    const previewData = {
      view: currentView.value,
      components: designerState.components.value,
      dataActions: designerState.dataActions.value,
      timestamp: Date.now(),
    }

    // 2. 保存到 sessionStorage
    sessionStorage.setItem('preview-data', JSON.stringify(previewData))

    // 3. 解析预览页面 URL
    const previewUrl = router.resolve({
      name: 'DesignerPreview', // ✅ 正确的路由名称
      params: { id: 'temp' },
      query: { mode: 'temp' },
    }).href

    // 4. 在新窗口打开预览页面
    window.open(previewUrl, '_blank')

    message.success('已打开预览')
  } catch (error: any) {
    message.error('预览失败: ' + (error.message || '未知错误'))
  }
}
```

### 2. 预览页面加载数据

```typescript
// Preview.vue - loadPageData()
const loadPageData = async () => {
  try {
    loading.value = true
    error.value = null

    // 1. 从 sessionStorage 读取预览数据
    const previewDataStr = sessionStorage.getItem('preview-data') // ✅ 正确的 key

    if (previewDataStr) {
      try {
        // 2. 解析 JSON 数据
        pageData.value = JSON.parse(previewDataStr)
        console.log('✅ 预览数据加载成功:', pageData.value)
      } catch (parseError) {
        console.error('❌ 预览数据解析失败:', parseError)
        error.value = '预览数据格式错误'
      }
    } else {
      // 3. 如果没有数据，使用示例数据
      console.warn('⚠️ 未找到预览数据，使用示例数据')
      pageData.value = createSampleData()
    }
  } catch (err) {
    console.error('❌ 加载页面数据失败:', err)
    error.value = err instanceof Error ? err.message : '加载页面数据失败'
  } finally {
    loading.value = false
  }
}
```

## 路由配置说明

### 完整的路由结构

```typescript
// src/modules/designer/router/index.ts
export const routes: RouteRecordRaw[] = [
  // 1. 根路径重定向
  {
    path: '/',
    redirect: () => {
      const token = localStorage.getItem('token')
      return token ? '/designer/resource' : '/designer/login'
    },
  },

  // 2. 登录页（独立路由）
  {
    path: '/designer/login',
    name: 'DesignerLogin',
    component: () => import('../views/Login.vue'),
    meta: {
      title: '设计端登录',
      requiresAuth: false,
    },
  },

  // 3. 主布局
  {
    path: '/designer',
    component: Layout,
    redirect: '/designer/resource',
    meta: {
      requiresAuth: true,
    },
    children: [
      {
        path: 'resource',
        name: 'DesignerResourceManagement',
        component: ResourceManagement,
        meta: {
          title: '资源管理',
          requiresAuth: true,
        },
      },
    ],
  },

  // 4. 设计器页面（独立路由）
  {
    path: '/designer/resource/:url',
    name: 'DesignerEditor',
    component: () => import('../views/DesignerNew.vue'),
    meta: {
      title: '设计器',
      requiresAuth: true,
    },
  },

  // 5. 预览页面（独立路由）✅
  {
    path: '/preview/:id',
    name: 'DesignerPreview', // ← 这是正确的路由名称
    component: () => import('../views/Preview.vue'),
    meta: {
      title: '预览页面',
      requiresAuth: false, // 预览不需要认证
    },
  },

  // 6. 404 页面
  {
    path: '/designer/:pathMatch(.*)*',
    name: 'DesignerNotFound',
    component: () => import('../views/NotFound.vue'),
    meta: {
      title: '页面不存在',
    },
  },
]
```

### 路由命名规范

为了避免混淆，所有设计器相关的路由都使用 `Designer` 前缀：

- `DesignerLogin` - 登录页
- `DesignerResourceManagement` - 资源管理
- `DesignerEditor` - 设计器编辑页
- `DesignerPreview` - 预览页面
- `DesignerNotFound` - 404 页面

## 测试步骤

### 1. 基本预览测试

1. 打开设计器页面
2. 在画布上添加一些组件
3. 点击顶部的"预览"按钮
4. ✅ 验证预览页面在新窗口正常打开
5. ✅ 验证页面数据正确显示

### 2. 数据传递测试

1. 在设计器中创建复杂的页面结构
2. 点击预览
3. ✅ 验证所有组件都正确显示
4. ✅ 验证组件数量正确
5. ✅ 验证组件类型和ID正确

### 3. 路由测试

1. 直接访问 `/preview/temp`
2. ✅ 验证页面能正常加载
3. ✅ 验证显示"未找到预览数据"或示例数据

### 4. SessionStorage 测试

```javascript
// 在浏览器控制台测试

// 1. 检查数据是否正确保存
console.log(sessionStorage.getItem('preview-data'))

// 2. 手动设置测试数据
sessionStorage.setItem(
  'preview-data',
  JSON.stringify({
    view: {
      id: 'test',
      title: '测试页面',
      components: [
        { id: 'comp1', type: 'Button' },
        { id: 'comp2', type: 'Input' },
      ],
    },
  })
)

// 3. 刷新预览页面，验证数据加载
```

## 修改文件

1. **src/modules/designer/views/DesignerNew.vue**

   - 修复路由名称：`'Preview'` → `'DesignerPreview'`

2. **src/modules/designer/views/Preview.vue**
   - 修复 SessionStorage key：`'preview_data'` → `'preview-data'`

## 验证结果

✅ 路由名称已统一
✅ SessionStorage key 已统一
✅ 预览功能应该可以正常工作
✅ 代码无类型错误
✅ 只有 Tailwind CSS 警告（正常）

## 预期效果

修复后，当用户点击预览按钮时：

1. **设计器页面**

   - 保存当前视图数据到 `sessionStorage['preview-data']`
   - 使用正确的路由名称 `'DesignerPreview'` 解析 URL
   - 在新窗口打开预览页面

2. **预览页面**

   - 从 `sessionStorage['preview-data']` 读取数据
   - 解析并显示页面信息
   - 显示组件列表
   - 提供设备切换、全屏等功能

3. **用户体验**
   - 点击预览按钮后，新窗口立即打开
   - 预览页面快速加载并显示内容
   - 没有错误提示
   - 可以正常使用所有预览功能

## 错误排查

如果预览功能仍然有问题：

### 1. 检查路由配置

```javascript
// 在浏览器控制台
import { router } from '@/modules/designer/router'
console.log(router.getRoutes().find(r => r.name === 'DesignerPreview'))
```

### 2. 检查 SessionStorage

```javascript
// 检查数据是否存在
console.log(sessionStorage.getItem('preview-data'))

// 检查数据格式
try {
  const data = JSON.parse(sessionStorage.getItem('preview-data'))
  console.log('数据格式正确:', data)
} catch (e) {
  console.error('数据格式错误:', e)
}
```

### 3. 检查路由解析

```javascript
// 在 DesignerNew.vue 中添加调试
const previewUrl = router.resolve({
  name: 'DesignerPreview',
  params: { id: 'temp' },
  query: { mode: 'temp' },
})
console.log('预览 URL:', previewUrl)
```

### 4. 清除缓存

```javascript
// 清除所有 sessionStorage
sessionStorage.clear()

// 刷新页面
location.reload()
```

## 总结

这次修复解决了两个关键问题：

1. **路由名称不匹配** - 导致 Vue Router 无法找到对应的路由
2. **SessionStorage key 不一致** - 导致预览页面无法读取数据

修复后，预览功能应该可以正常工作了！🎉

## 相关文档

- [PREVIEW_FIX_V3.md](.kiro/specs/resource-management-system/PREVIEW_FIX_V3.md) - 预览功能简化版本
- [DESIGNER_ROUTE_FIX.md](.kiro/specs/resource-management-system/DESIGNER_ROUTE_FIX.md) - 设计器路由修复
