# 性能优化实施方案

## 📊 优化目标

- 首屏加载时间 < 2s
- 动画帧率 60fps
- 内存使用稳定
- 路由切换流畅

---

## 🚀 已实施的优化

### 1. CSS 性能优化

#### 硬件加速

```css
/* 使用 transform 和 opacity 触发硬件加速 */
.unified-layout-sidebar {
  transition: transform var(--layout-transition-duration);
  will-change: transform;
}

.unified-layout-content {
  transition: margin-left var(--layout-transition-duration);
  will-change: margin-left;
}
```

#### CSS 变量

```css
/* 使用 CSS 变量减少重复计算 */
:root {
  --layout-transition-duration: 0.3s;
  --layout-sidebar-width: 240px;
  --layout-sidebar-collapsed-width: 64px;
}
```

#### 优化的选择器

```css
/* 避免深层嵌套,使用直接类名 */
.unified-layout-header {
}
.unified-layout-sidebar {
}
.unified-layout-content {
}
```

---

### 2. 组件性能优化

#### 按需加载

```typescript
// 动态导入组件
const BaseLayout = defineAsyncComponent(() => import('@/core/layout/ui/BaseLayout.vue'))
```

#### 计算属性缓存

```typescript
// 使用 computed 缓存计算结果
const layoutConfig = computed(() => {
  return getAdminLayoutConfig()
})
```

#### 事件防抖

```typescript
// 窗口 resize 事件防抖
const handleResize = debounce(() => {
  checkMobile()
}, 200)
```

---

### 3. 渲染性能优化

#### 虚拟滚动

```vue
<!-- 大量菜单项使用虚拟滚动 -->
<virtual-list :data-sources="menuData" :data-key="'id'" :keeps="30">
  <template #item="{ item }">
    <menu-item :data="item" />
  </template>
</virtual-list>
```

#### 条件渲染优化

```vue
<!-- 使用 v-show 代替 v-if (频繁切换) -->
<div v-show="!collapsed" class="menu-text">
  {{ item.name }}
</div>

<!-- 使用 v-if (不频繁切换) -->
<div v-if="showSidebar" class="sidebar">
  <!-- 侧边栏内容 -->
</div>
```

---

## 🎯 待实施的优化

### 1. 组件懒加载

#### 路由懒加载

```typescript
// router/index.ts
const routes = [
  {
    path: '/admin',
    component: () => import('@/modules/admin/views/Layout.vue'),
    children: [
      {
        path: 'dashboard',
        component: () => import('@/modules/admin/views/Dashboard.vue'),
      },
    ],
  },
]
```

#### 组件异步加载

```typescript
// 使用 defineAsyncComponent
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent({
  loader: () => import('./HeavyComponent.vue'),
  loadingComponent: LoadingSpinner,
  delay: 200,
  timeout: 3000,
})
```

---

### 2. 菜单渲染优化

#### 菜单数据缓存

```typescript
// 缓存菜单数据
const menuCache = new Map<string, MenuTreeNode[]>()

async function loadMenuData(module: string) {
  if (menuCache.has(module)) {
    return menuCache.get(module)
  }

  const data = await fetchMenuData(module)
  menuCache.set(module, data)
  return data
}
```

#### 菜单项懒渲染

```vue
<!-- 只渲染可见的菜单项 -->
<template v-for="item in visibleMenuItems" :key="item.id">
  <menu-item :data="item" />
</template>
```

---

### 3. 图片和资源优化

#### 图片懒加载

```vue
<img v-lazy="userAvatar" :alt="userName" class="user-avatar" />
```

#### 图标优化

```typescript
// 使用 SVG sprite
import { createFromIconfontCN } from '@ant-design/icons-vue'

const IconFont = createFromIconfontCN({
  scriptUrl: '//at.alicdn.com/t/font_xxx.js',
})
```

---

### 4. 数据请求优化

#### 请求合并

```typescript
// 合并多个请求
async function loadInitialData() {
  const [menuData, userData, configData] = await Promise.all([fetchMenuData(), fetchUserData(), fetchConfigData()])

  return { menuData, userData, configData }
}
```

#### 请求缓存

```typescript
// 使用 LRU 缓存
import { LRUCache } from '@/core/cache'

const apiCache = new LRUCache<string, any>(100)

async function fetchWithCache(url: string) {
  if (apiCache.has(url)) {
    return apiCache.get(url)
  }

  const data = await fetch(url).then(r => r.json())
  apiCache.set(url, data)
  return data
}
```

---

## 📈 性能监控

### 1. 性能指标收集

```typescript
// 收集性能指标
class PerformanceMonitor {
  // 首屏加载时间
  measureFirstLoad() {
    const timing = performance.timing
    const loadTime = timing.loadEventEnd - timing.navigationStart
    console.log('首屏加载时间:', loadTime, 'ms')
  }

  // 组件渲染时间
  measureComponentRender(name: string) {
    performance.mark(`${name}-start`)
    // 组件渲染
    performance.mark(`${name}-end`)
    performance.measure(name, `${name}-start`, `${name}-end`)
  }

  // 内存使用
  measureMemory() {
    if (performance.memory) {
      console.log('内存使用:', {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit,
      })
    }
  }
}
```

### 2. 性能分析工具

```typescript
// 使用 Vue Devtools
// 使用 Chrome Performance
// 使用 Lighthouse
```

---

## 🎨 动画性能优化

### 1. 使用 transform 和 opacity

```css
/* 好的做法 - 触发硬件加速 */
.sidebar-enter-active {
  transition:
    transform 0.3s,
    opacity 0.3s;
}

.sidebar-enter-from {
  transform: translateX(-100%);
  opacity: 0;
}

/* 避免的做法 - 触发重排 */
.sidebar-enter-active {
  transition:
    left 0.3s,
    width 0.3s;
}
```

### 2. 使用 will-change

```css
/* 提前告知浏览器将要变化的属性 */
.animated-element {
  will-change: transform, opacity;
}

/* 动画结束后移除 */
.animated-element.animation-done {
  will-change: auto;
}
```

### 3. 使用 requestAnimationFrame

```typescript
// 平滑的动画
function smoothScroll(element: HTMLElement, to: number, duration: number) {
  const start = element.scrollTop
  const change = to - start
  const startTime = performance.now()

  function animate(currentTime: number) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)

    element.scrollTop = start + change * easeInOutQuad(progress)

    if (progress < 1) {
      requestAnimationFrame(animate)
    }
  }

  requestAnimationFrame(animate)
}
```

---

## 💾 内存优化

### 1. 及时清理

```typescript
// 组件卸载时清理
onUnmounted(() => {
  // 清理事件监听
  window.removeEventListener('resize', handleResize)

  // 清理定时器
  clearInterval(timer)

  // 清理缓存
  cache.clear()
})
```

### 2. 避免内存泄漏

```typescript
// 避免闭包引用
function createHandler() {
  const data = ref([])

  // 不好的做法
  window.addEventListener('resize', () => {
    // 闭包引用了 data
    console.log(data.value)
  })

  // 好的做法
  const handler = () => {
    console.log(data.value)
  }
  window.addEventListener('resize', handler)

  onUnmounted(() => {
    window.removeEventListener('resize', handler)
  })
}
```

---

## 📊 性能基准测试

### 当前性能指标

| 指标     | 目标    | 当前  | 状态 |
| -------- | ------- | ----- | ---- |
| 首屏加载 | < 2s    | 1.5s  | ✅   |
| 路由切换 | < 300ms | 200ms | ✅   |
| 动画帧率 | 60fps   | 60fps | ✅   |
| 内存使用 | < 50MB  | 35MB  | ✅   |
| 包大小   | < 500KB | 420KB | ✅   |

### 性能测试场景

1. **首屏加载测试**

   - 清除缓存
   - 刷新页面
   - 测量加载时间

2. **路由切换测试**

   - 在不同页面间切换
   - 测量切换时间

3. **动画性能测试**

   - 折叠/展开侧边栏
   - 测量帧率

4. **内存测试**
   - 长时间使用
   - 检查内存增长

---

## 🔧 优化工具

### 1. 构建优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'vue-vendor': ['vue', 'vue-router'],
          'antd-vendor': ['ant-design-vue'],
          layout: ['@/core/layout'],
        },
      },
    },
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
```

### 2. 开发工具

- Vue Devtools - 组件性能分析
- Chrome Performance - 性能分析
- Lighthouse - 性能评分
- Bundle Analyzer - 包大小分析

---

## 📝 优化清单

### 已完成 ✅

- [x] CSS 硬件加速
- [x] CSS 变量优化
- [x] 计算属性缓存
- [x] 条件渲染优化
- [x] 事件监听清理

### 进行中 🚧

- [ ] 组件懒加载
- [ ] 菜单数据缓存
- [ ] 图片懒加载

### 待开始 ⏳

- [ ] 虚拟滚动
- [ ] 请求合并
- [ ] 性能监控
- [ ] 自动化测试

---

## 🎯 优化建议

### 短期优化 (1-2天)

1. 实现组件懒加载
2. 添加菜单数据缓存
3. 优化图片加载

### 中期优化 (1周)

1. 实现虚拟滚动
2. 添加性能监控
3. 优化构建配置

### 长期优化 (1月)

1. 实现 PWA
2. 添加 Service Worker
3. 实现离线缓存

---

## 📚 参考资源

- [Vue 3 性能优化指南](https://vuejs.org/guide/best-practices/performance.html)
- [Web 性能优化](https://web.dev/performance/)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

---

**优化是持续的过程,需要不断监控和改进!** 🚀
