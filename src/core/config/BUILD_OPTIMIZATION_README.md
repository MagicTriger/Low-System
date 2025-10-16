# 构建优化指南

本文档介绍低代码平台的构建优化策略和配置方法。

## 优化特性

### 1. 代码分割 (Code Splitting)

自动将代码分割成多个小块,实现按需加载:

- **框架分块**: Vue、Vue Router、Pinia 等核心框架独立打包
- **UI库分块**: Ant Design Vue、Element Plus 等UI库独立打包
- **编辑器分块**: Monaco Editor 等大型编辑器独立打包
- **业务分块**: 核心代码、组件、视图分别打包
- **第三方库分块**: 根据策略将 node_modules 分块

#### 分块策略

**默认策略 (default)**

```typescript
// 大型库单独分块,其他依赖打包到 vendor
manualChunks: {
  'vue': ['vue'],
  'vue-router': ['vue-router'],
  'antdv': ['ant-design-vue'],
  'monaco': ['monaco-editor'],
  'vendor': ['其他依赖'],
  'core': ['src/core/**'],
  'components': ['src/components/**'],
}
```

**激进策略 (aggressive)**

```typescript
// 每个包单独分块,最大化并行加载
manualChunks: {
  'vendor-lodash': ['lodash'],
  'vendor-axios': ['axios'],
  'vendor-dayjs': ['dayjs'],
  // ... 每个依赖独立分块
}
```

**保守策略 (conservative)**

```typescript
// 所有依赖打包到一起,减少HTTP请求
manualChunks: {
  'vendor': ['所有node_modules'],
}
```

### 2. Tree Shaking

移除未使用的代码:

```typescript
{
  treeshake: {
    moduleSideEffects: 'no-external',
    propertyReadSideEffects: false,
    tryCatchDeoptimization: false,
  }
}
```

**最佳实践**:

- 使用 ES6 模块语法 (import/export)
- 避免使用 `import *`
- 使用具名导入: `import { func } from 'lib'`
- 标记纯函数: `/*#__PURE__*/`

### 3. 资源压缩

#### Gzip 压缩

```typescript
viteCompression({
  algorithm: 'gzip',
  ext: '.gz',
  threshold: 10240, // 10KB以上才压缩
})
```

#### Brotli 压缩 (更高压缩率)

```typescript
viteCompression({
  algorithm: 'brotliCompress',
  ext: '.br',
  threshold: 10240,
})
```

**压缩效果**:

- JavaScript: 70-80% 压缩率
- CSS: 80-90% 压缩率
- HTML: 60-70% 压缩率

### 4. CDN 加速

将常用库从 CDN 加载,减少构建体积:

```typescript
// 使用 jsDelivr CDN
import { cdnPresets } from './build-optimization'

createCDNPlugin(cdnPresets.jsdelivr)
```

**支持的 CDN**:

- unpkg: `https://unpkg.com/`
- jsDelivr: `https://cdn.jsdelivr.net/npm/`
- bootcdn: `https://cdn.bootcdn.net/ajax/libs/` (国内)

**外部化的库**:

- Vue 3
- Vue Router 4
- Pinia 2

### 5. 资源优化

#### 图片优化

- 使用 WebP 格式
- 图片懒加载
- 响应式图片

#### 字体优化

- 字体子集化
- 字体预加载
- 使用系统字体

#### CSS 优化

- CSS 代码分割
- 移除未使用的 CSS
- CSS 压缩

## 使用方法

### 方法 1: 使用优化配置文件

```bash
# 使用优化配置构建
vite build --config vite.config.optimized.ts
```

### 方法 2: 在代码中使用

```typescript
import { getFullOptimizationConfig } from '@core/config/build-optimization'

export default defineConfig({
  ...getFullOptimizationConfig({
    codeSplitting: true,
    treeShaking: true,
    compression: true,
    cdn: true,
    cdnConfig: cdnPresets.jsdelivr,
    chunkStrategy: 'default',
  }),
})
```

### 方法 3: 环境变量控制

```bash
# .env.production
VITE_ENABLE_CDN=true
VITE_CHUNK_STRATEGY=default
```

## 性能分析

### 构建分析

```bash
# 生成构建分析报告
npm run build

# 查看 dist/stats.html
```

### 分析指标

- **Bundle Size**: 总体积
- **Chunk Size**: 各分块体积
- **Gzip Size**: 压缩后体积
- **Brotli Size**: Brotli压缩后体积
- **Load Time**: 加载时间

### 优化目标

| 指标       | 目标值  | 说明   |
| ---------- | ------- | ------ |
| 首屏JS     | < 200KB | Gzip后 |
| 首屏CSS    | < 50KB  | Gzip后 |
| 总体积     | < 2MB   | Gzip后 |
| 首屏加载   | < 3s    | 3G网络 |
| 可交互时间 | < 5s    | 3G网络 |

## 最佳实践

### 1. 懒加载

```typescript
// 路由懒加载
const routes = [
  {
    path: '/designer',
    component: () => import('@/views/Designer.vue'),
  },
]

// 组件懒加载
const AsyncComponent = defineAsyncComponent(() => import('@/components/HeavyComponent.vue'))
```

### 2. 预加载

```typescript
// 预加载关键资源
import { routeLazyLoader } from '@core/loader'

routeLazyLoader.preloadRoutes(['designer', 'manager'])
```

### 3. 代码分割

```typescript
// 动态导入
const module = await import('./heavy-module')

// 使用 magic comments
const module = await import(
  /* webpackChunkName: "heavy-module" */
  './heavy-module'
)
```

### 4. 缓存策略

```typescript
// 使用内容哈希
output: {
  filename: '[name].[contenthash].js',
  chunkFilename: '[name].[contenthash].js',
}

// 长期缓存
headers: {
  'Cache-Control': 'public, max-age=31536000, immutable',
}
```

## 性能监控

### 1. 构建时监控

```typescript
import { createPerformancePlugin } from '@core/config/build-optimization'

plugins: [createPerformancePlugin()]
```

### 2. 运行时监控

```typescript
// 使用 Performance API
const observer = new PerformanceObserver(list => {
  for (const entry of list.getEntries()) {
    console.log(entry.name, entry.duration)
  }
})

observer.observe({ entryTypes: ['measure', 'navigation'] })
```

## 故障排查

### 问题 1: 分块过多

**症状**: 生成了太多小文件,HTTP请求过多

**解决**:

```typescript
// 使用保守策略
chunkStrategy: 'conservative'
```

### 问题 2: 分块过少

**症状**: 单个文件过大,加载缓慢

**解决**:

```typescript
// 使用激进策略
chunkStrategy: 'aggressive'
```

### 问题 3: CDN 加载失败

**症状**: 生产环境白屏,控制台报错

**解决**:

```typescript
// 禁用 CDN 或使用国内 CDN
cdn: false,
// 或
cdnConfig: cdnPresets.bootcdn
```

### 问题 4: Tree Shaking 不生效

**症状**: 未使用的代码仍然被打包

**解决**:

- 检查是否使用了 ES6 模块
- 检查 package.json 的 sideEffects 配置
- 避免使用 `import *`

## 参考资源

- [Vite 构建优化](https://vitejs.dev/guide/build.html)
- [Rollup 代码分割](https://rollupjs.org/guide/en/#code-splitting)
- [Web.dev 性能优化](https://web.dev/performance/)
- [Chrome DevTools 性能分析](https://developer.chrome.com/docs/devtools/performance/)
