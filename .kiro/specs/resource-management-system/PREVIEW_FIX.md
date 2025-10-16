# 设计器预览功能修复

## 更新时间

2025-10-16

## 问题描述

设计器预览页面出现错误，无法正常显示预览内容。主要问题包括：

1. 导入的 `Icon` 组件路径不存在 (`@/core/components`)
2. 使用了不存在的 `PageData` 类型
3. `RootViewRenderer` 的 `mode` 属性使用了错误的字符串值

## 修复内容

### 1. 修复图标组件导入

**问题**: 使用了不存在的 `Icon` 组件

```typescript
import { Icon } from '@/core/components' // ❌ 路径不存在
```

**修复**: 使用 Ant Design Vue 的图标组件

```typescript
import {
  FullscreenOutlined,
  FullscreenExitOutlined,
  ArrowLeftOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
  RotateRightOutlined,
} from '@ant-design/icons-vue'
```

### 2. 替换所有 Icon 组件使用

#### 全屏按钮

```vue
<!-- 修复前 -->
<Icon name="fullscreen" />

<!-- 修复后 -->
<FullscreenExitOutlined v-if="isFullscreen" />
<FullscreenOutlined v-else />
```

#### 返回按钮

```vue
<!-- 修复前 -->
<Icon name="arrow-left" />

<!-- 修复后 -->
<ArrowLeftOutlined />
```

#### 加载状态

```vue
<!-- 修复前 -->
<div class="loading-spinner"></div>

<!-- 修复后 -->
<LoadingOutlined class="loading-spinner" />
```

#### 错误状态

```vue
<!-- 修复前 -->
<Icon name="error" class="error-icon" />

<!-- 修复后 -->
<ExclamationCircleOutlined class="error-icon" />
```

#### 旋转按钮

```vue
<!-- 修复前 -->
<Icon name="rotate" />

<!-- 修复后 -->
<RotateRightOutlined />
```

### 3. 添加 PageData 类型定义

**问题**: `PageData` 类型不存在

**修复**: 在组件内添加类型定义

```typescript
// 类型定义
interface PageData {
  id: string
  title: string
  components: any[]
  meta?: {
    title?: string
    description?: string
  }
}
```

### 4. 修复 RootViewMode 使用

**问题**: 使用了错误的字符串值

```vue
<RootViewRenderer :mode="'preview'" />
<!-- ❌ 'preview' 不是有效值 -->
```

**修复**: 使用正确的枚举值

```typescript
// 导入枚举
import { RootViewMode } from '@/types'

// 使用枚举值
<RootViewRenderer :mode="RootViewMode.Runtime" />
```

### 5. 更新样式

修复图标样式，因为现在使用的是图标组件而不是 div：

```css
/* 修复前 */
.loading-spinner {
  @apply mb-4 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600;
}

.error-icon {
  @apply mb-4 h-12 w-12 text-red-500;
}

/* 修复后 */
.loading-spinner {
  @apply mb-4 text-4xl text-blue-600;
}

.error-icon {
  @apply mb-4 text-5xl text-red-500;
}
```

## 预览功能说明

### 数据来源

预览页面从 `sessionStorage` 读取预览数据：

```typescript
const previewDataStr = sessionStorage.getItem('preview_data')
if (previewDataStr) {
  pageData.value = JSON.parse(previewDataStr)
}
```

### 设备预览

支持多种设备预览模式：

| 设备   | 宽度     | 高度     |
| ------ | -------- | -------- |
| 桌面端 | 1200px   | 800px    |
| 平板   | 768px    | 1024px   |
| 手机   | 375px    | 667px    |
| 自定义 | 用户定义 | 用户定义 |

### 功能特性

1. **全屏预览**

   - 支持全屏模式
   - 自动监听全屏状态变化

2. **设备切换**

   - 桌面端、平板、手机预览
   - 自定义尺寸

3. **横竖屏切换**

   - 支持横竖屏切换（非桌面端）
   - 自动交换宽高

4. **返回编辑**
   - 一键返回设计器编辑页面

## 使用方法

### 从设计器打开预览

在设计器页面中，点击"预览"按钮：

```typescript
// 保存预览数据到 sessionStorage
sessionStorage.setItem('preview_data', JSON.stringify(pageData))

// 跳转到预览页面
router.push(`/designer/preview/${pageId}`)
```

### 预览页面路由

```typescript
{
  path: '/designer/preview/:id',
  name: 'Preview',
  component: () => import('@/modules/designer/views/Preview.vue')
}
```

## 测试步骤

1. **基本预览测试**

   - 在设计器中设计一个页面
   - 点击"预览"按钮
   - 验证页面正常渲染

2. **设备切换测试**

   - 切换到不同设备预览
   - 验证视口尺寸正确

3. **横竖屏测试**

   - 在手机/平板模式下切换横竖屏
   - 验证宽高正确交换

4. **全屏测试**

   - 点击全屏按钮
   - 验证进入全屏模式
   - 按 ESC 退出全屏

5. **返回测试**
   - 点击"返回编辑"按钮
   - 验证正确返回设计器页面

## 修改文件

- `src/modules/designer/views/Preview.vue`
  - 修复图标组件导入
  - 添加 PageData 类型定义
  - 修复 RootViewMode 使用
  - 更新图标样式

## 状态

✅ 图标组件导入已修复
✅ PageData 类型已定义
✅ RootViewMode 使用已修复
✅ 图标样式已更新
✅ 代码无类型错误
✅ 预览功能可正常使用

## 后续优化建议

1. **数据持久化**

   - 考虑将预览数据保存到后端
   - 支持分享预览链接

2. **更多设备预设**

   - 添加更多常见设备尺寸
   - 支持自定义设备预设

3. **交互测试**

   - 在预览模式下支持交互测试
   - 记录用户操作日志

4. **性能优化**

   - 大型页面的渲染优化
   - 懒加载组件

5. **响应式预览**

   - 实时响应式预览
   - 同时预览多个设备

6. **截图功能**

   - 支持页面截图
   - 导出为图片

7. **二维码分享**
   - 生成预览二维码
   - 手机扫码预览
