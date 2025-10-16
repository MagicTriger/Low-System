# Vite Root 配置问题

## 问题描述

访问设计器页面时出现 404 错误，Vite 尝试从错误的路径加载模块：

```
Failed to fetch dynamically imported module: http://localhost:5173/views/DesignerNew.vue
```

## 根本原因

Vite 配置中设置了自定义的 `root` 目录：

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, join(process.cwd(), 'envs'))
  return {
    root: `./src/modules/${env.VITE_APP_MODEL}`, // ← 这里设置了 root
    // ...
  }
})
```

当 `VITE_APP_MODEL=designer` 时，Vite 的根目录是 `./src/modules/designer`。

这导致路由中的相对路径解析出现问题：

- 路由文件位置：`src/modules/designer/router/index.ts`
- 使用 `../views/DesignerNew.vue` 时
- Vite 解析为：`src/modules/views/DesignerNew.vue` ❌
- 实际位置：`src/modules/designer/views/DesignerNew.vue` ✅

## 解决方案

### 方案 1：使用正确的相对路径（已采用）

从 `router/index.ts` 到 `views/DesignerNew.vue` 的正确相对路径是 `../views/DesignerNew.vue`。

但由于 Vite 的 root 设置，这个路径会被解析为相对于 `src/modules/designer` 的路径，所以实际上是正确的。

### 方案 2：使用路径别名

```typescript
// 使用 @designer 别名
component: () => import('@designer/views/DesignerNew.vue')
```

### 方案 3：清除 Vite 缓存

Vite 可能缓存了旧的模块解析结果。需要：

1. 停止开发服务器
2. 删除 `node_modules/.vite` 目录
3. 重新启动服务器

## 操作步骤

### 1. 停止当前服务器

按 `Ctrl+C` 停止 Vite 开发服务器

### 2. 清除缓存

```bash
# Windows CMD
rmdir /s /q node_modules\.vite

# Windows PowerShell
Remove-Item -Recurse -Force node_modules\.vite

# 或者手动删除 node_modules/.vite 目录
```

### 3. 重新启动服务器

```bash
npm run dev
```

## 验证

启动后访问 `http://localhost:5173/designer`，应该能正常显示设计器页面。

## 文件结构说明

```
src/modules/designer/
├── router/
│   └── index.ts          ← 路由配置文件
├── views/
│   ├── DesignerNew.vue   ← 目标文件
│   ├── DesignerTest.vue
│   ├── Preview.vue
│   ├── Login.vue
│   └── NotFound.vue
├── main.ts
└── index.html
```

从 `router/index.ts` 到 `views/DesignerNew.vue`：

- 相对路径：`../views/DesignerNew.vue` ✅
- 由于 Vite root 是 `src/modules/designer`
- 实际解析为：`src/modules/designer/views/DesignerNew.vue` ✅

## 其他可能的问题

### 1. TypeScript 编译错误

如果文件有 TypeScript 错误，Vite 也无法加载模块。

检查方法：

```bash
npm run type-check
```

### 2. 语法错误

检查 Vue 文件是否有语法错误。

### 3. 循环依赖

检查是否存在循环导入。

## 更新日志

### 2024-01-XX

- ✅ 识别 Vite root 配置问题
- ✅ 确认路由路径配置正确
- ✅ 提供清除缓存解决方案
- ✅ 验证 TypeScript 无错误
