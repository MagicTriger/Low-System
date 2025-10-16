# 🎴 卡片层级导航功能

## ✨ 功能概述

实现了一个交互式的层级卡片导航系统，支持：

- 📁 层级浏览：点击父卡片进入子层级
- 🎨 颜色区分：不同层级使用不同颜色
- 🔄 卡片翻转：右键查看详细信息
- 🧭 面包屑导航：快速返回上级

## 🎯 功能特性

### 1. 层级导航

#### 初始状态

- 只显示**顶级文件夹**（父卡片）
- 使用**蓝色系**配色
- 显示子菜单数量

#### 点击父卡片

- 隐藏所有父卡片
- 只显示该父卡片的子卡片
- 子卡片使用**绿色系**配色

#### 继续深入

- 可以继续点击文件夹类型的子卡片
- 更深层级使用**紫色系**配色
- 支持无限层级

### 2. 颜色系统

| 层级                   | 颜色系 | 渐变色            | 边框色                  | 图标色  |
| ---------------------- | ------ | ----------------- | ----------------------- | ------- |
| Level 0（父卡片）      | 蓝色系 | #e0f2fe → #bae6fd | rgba(59, 130, 246, 0.3) | #1e40af |
| Level 1（一级子卡片）  | 绿色系 | #d1fae5 → #a7f3d0 | rgba(16, 185, 129, 0.3) | #047857 |
| Level 2+（二级及以上） | 紫色系 | #e9d5ff → #d8b4fe | rgba(168, 85, 247, 0.3) | #7c3aed |

### 3. 卡片翻转

#### 正面（默认）

- 显示图标
- 显示名称
- 显示编码
- 显示类型标签
- 显示子菜单数量

#### 背面（右键翻转）

- 显示完整信息：
  - ID
  - 编码
  - 模块
  - 类型
  - 排序
  - 路径（如果有）
  - 创建时间
- 显示操作按钮：
  - 编辑
  - 删除

### 4. 面包屑导航

- 显示当前浏览路径
- 点击任意层级快速跳转
- 点击"根目录"返回顶层

## 🎮 交互说明

### 鼠标操作

| 操作             | 效果                               |
| ---------------- | ---------------------------------- |
| **左键点击卡片** | 如果是文件夹且有子菜单，进入下一层 |
| **右键点击卡片** | 翻转卡片，查看详细信息             |
| **再次右键点击** | 翻转回正面                         |
| **悬停卡片**     | 卡片向上浮动                       |
| **点击面包屑**   | 跳转到指定层级                     |

### 键盘操作

- 暂无键盘快捷键（可以后续添加）

## 📐 布局设计

### 卡片尺寸

- 默认：280px × 320px
- 移动端：240px × 280px

### 网格布局

- 响应式网格
- 自动填充
- 最小宽度：280px（桌面）/ 240px（移动）

### 间距

- 卡片间距：24px（桌面）/ 16px（移动）
- 内边距：24px

## 🎨 视觉效果

### 动画效果

1. **卡片悬停**

   ```css
   transform: translateY(-4px);
   transition: transform 0.3s ease;
   ```

2. **卡片翻转**

   ```css
   transform: rotateY(180deg);
   transition: transform 0.6s;
   ```

3. **3D 透视**
   ```css
   perspective: 1000px;
   transform-style: preserve-3d;
   ```

### 阴影效果

- 默认：`0 2px 8px rgba(0, 0, 0, 0.1)`
- 悬停：自动提升

## 💻 代码结构

### 核心状态

```typescript
// 导航栈：记录当前浏览路径
const navigationStack = ref<MenuTreeNode[]>([])

// 翻转的卡片集合
const flippedCards = ref<Set<number>>(new Set())

// 当前显示的资源
const displayResources = computed(() => {
  if (navigationStack.value.length === 0) {
    // 根目录：只显示顶级文件夹
    return props.resources.filter(r => r.nodeType === 1 && (!r.parentId || r.parentId === 0))
  } else {
    // 子目录：显示当前节点的子节点
    const current = navigationStack.value[navigationStack.value.length - 1]
    return current.children || []
  }
})
```

### 核心方法

```typescript
// 处理卡片点击
const handleCardClick = (resource: MenuTreeNode) => {
  if (resource.nodeType === 1 && hasChildren(resource)) {
    navigationStack.value.push(resource)
    flippedCards.value.clear()
  }
}

// 处理卡片右键点击
const handleCardRightClick = (resource: MenuTreeNode) => {
  if (flippedCards.value.has(resource.id)) {
    flippedCards.value.delete(resource.id)
  } else {
    flippedCards.value.add(resource.id)
  }
  flippedCards.value = new Set(flippedCards.value)
}

// 导航到指定层级
const navigateTo = (index: number) => {
  navigationStack.value = navigationStack.value.slice(0, index + 1)
  flippedCards.value.clear()
}

// 返回根目录
const navigateToRoot = () => {
  navigationStack.value = []
  flippedCards.value.clear()
}
```

## 🧪 使用示例

### 基本使用

```vue
<template>
  <ResourceCardView :resources="resources" @edit="handleEdit" @delete="handleDelete" />
</template>

<script setup>
import ResourceCardView from '@/modules/designer/components/ResourceCardView.vue'

const resources = ref([
  {
    id: 1,
    name: '设计器',
    menuCode: 'designer',
    nodeType: 1,
    children: [
      { id: 2, name: '用户管理', menuCode: 'user', nodeType: 2 },
      { id: 3, name: '角色管理', menuCode: 'role', nodeType: 2 },
    ],
  },
])

const handleEdit = resource => {
  console.log('编辑:', resource)
}

const handleDelete = resource => {
  console.log('删除:', resource)
}
</script>
```

## 📱 响应式设计

### 桌面端（> 768px）

- 网格布局，自动填充
- 卡片尺寸：280px × 320px
- 间距：24px

### 移动端（≤ 768px）

- 网格布局，自动填充
- 卡片尺寸：240px × 280px
- 间距：16px
- 图标缩小

## 🎯 用户体验

### 优点

- ✅ 直观的层级导航
- ✅ 清晰的颜色区分
- ✅ 流畅的动画效果
- ✅ 详细的信息展示
- ✅ 快速的面包屑导航

### 注意事项

- ⚠️ 右键翻转可能不够直观，建议添加提示
- ⚠️ 深层级可能导致用户迷失，建议限制层级深度
- ⚠️ 移动端右键操作需要长按实现

## 🚀 后续优化建议

### 功能增强

1. **键盘导航**

   - ESC 键返回上一层
   - 方向键选择卡片
   - Enter 键进入/翻转

2. **搜索功能**

   - 全局搜索
   - 高亮匹配项
   - 显示路径

3. **拖拽排序**

   - 拖拽改变顺序
   - 拖拽移动到其他文件夹

4. **批量操作**
   - 多选卡片
   - 批量删除
   - 批量移动

### 性能优化

1. **虚拟滚动**

   - 大量卡片时使用虚拟滚动
   - 提高渲染性能

2. **懒加载**

   - 按需加载子节点
   - 减少初始加载时间

3. **缓存机制**
   - 缓存已访问的层级
   - 快速返回

### 视觉优化

1. **过渡动画**

   - 层级切换时的过渡效果
   - 卡片进入/退出动画

2. **加载状态**

   - 加载中的骨架屏
   - 加载失败的提示

3. **空状态优化**
   - 更友好的空状态提示
   - 引导用户操作

## 📚 相关文档

1. [资源管理系统设计](.kiro/specs/resource-management-system/design.md)
2. [卡片视图完成](.kiro/specs/resource-management-system/CARD_VIEW_COMPLETED.md)
3. [UI 重构总结](.kiro/specs/resource-management-system/UI_REFACTOR_SUMMARY.md)

## 🎉 总结

**功能已完成！**

**实现的功能**：

- ✅ 层级导航（点击进入子层级）
- ✅ 颜色区分（不同层级不同颜色）
- ✅ 卡片翻转（右键查看详情）
- ✅ 面包屑导航（快速返回）
- ✅ 响应式设计（适配移动端）
- ✅ 流畅动画（3D 翻转效果）

**使用方法**：

1. 左键点击文件夹卡片 → 进入子层级
2. 右键点击任意卡片 → 翻转查看详情
3. 点击面包屑 → 返回指定层级
4. 悬停卡片 → 查看浮动效果

**现在可以在资源管理页面体验这个功能了！** 🚀
