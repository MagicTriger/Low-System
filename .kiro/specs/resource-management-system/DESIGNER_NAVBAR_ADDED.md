# 设计器导航栏添加完成

## 修改内容

为设计器页面（DesignerNew.vue）添加了顶部导航栏，提供更好的导航体验。

## 功能特性

### 1. 导航栏布局

- 左侧：返回按钮 + 面包屑导航
- 右侧：资源信息（ID）

### 2. 返回功能

- 点击返回按钮返回资源管理页面
- 如果有未保存的更改，会弹出确认对话框
- 确认后才会返回，避免数据丢失

### 3. 面包屑导航

- 显示当前位置：资源管理 > 页面名称
- 可以点击"资源管理"快速返回

### 4. 资源信息

- 显示当前资源的ID
- 新建资源显示"新建"

## 代码修改

### 1. 模板修改

```vue
<!-- 顶部导航栏 -->
<div class="designer-navbar">
  <div class="navbar-left">
    <a-button type="text" @click="handleBack">
      <template #icon><arrow-left-outlined /></template>
      返回
    </a-button>
    <a-divider type="vertical" />
    <a-breadcrumb>
      <a-breadcrumb-item>
        <router-link to="/resource">资源管理</router-link>
      </a-breadcrumb-item>
      <a-breadcrumb-item>{{ designName }}</a-breadcrumb-item>
    </a-breadcrumb>
  </div>
  <div class="navbar-right">
    <span class="resource-info">ID: {{ designId || '新建' }}</span>
  </div>
</div>
```

### 2. 图标导入

```typescript
import { ArrowLeftOutlined } from '@ant-design/icons-vue'
```

### 3. 返回方法

```typescript
function handleBack() {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认返回',
      content: '当前有未保存的更改，确定要返回吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        router.push('/resource')
      },
    })
  } else {
    router.push('/resource')
  }
}
```

### 4. 样式添加

```css
.designer-navbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: #ffffff;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.navbar-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.navbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.resource-info {
  font-size: 12px;
  color: #6b7280;
}
```

## 测试步骤

1. 刷新浏览器
2. 从资源管理页面点击设计器按钮
3. 应该能看到顶部导航栏，包含：
   - 返回按钮
   - 面包屑导航（资源管理 > 页面名称）
   - 资源ID
4. 点击返回按钮，应该返回资源管理页面
5. 如果有未保存的更改，应该弹出确认对话框

## 完成时间

2025-10-15
