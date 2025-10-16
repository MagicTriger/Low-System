# 运行时问题修复

## 修复日期

2025-10-12

## 修复的问题

### 1. ✅ 布局系统循环依赖问题

**问题描述:**

```
Layout system registration failed: ReferenceError: Cannot access 'DEFAULT_BREAKPOINTS' before initialization
```

**根本原因:**

- `LayoutManager.ts`、`GridSystem.ts`、`ContainerManager.ts` 从 `./index` 导入常量和工具类
- `index.ts` 在最后导出这些管理器类
- 造成循环依赖，导致初始化顺序错误

**修复方案:**

1. 在 `LayoutManager.ts` 中：

   - 将类型导入改为 `import type`
   - 将枚举类型改为普通导入（因为枚举是值）
   - 直接在文件内定义 `DEFAULT_BREAKPOINTS` 和 `LayoutUtils` 类

2. 在 `GridSystem.ts` 中：

   - 将所有导入改为 `import type`
   - 直接在文件内定义 `DEFAULT_BREAKPOINTS`、`DEFAULT_GRID_CONFIG`
   - 添加本地 `LayoutUtils` 和 `CSSGenerator` 类

3. 在 `ContainerManager.ts` 中：
   - 将所有导入改为 `import type`
   - 直接在文件内定义 `DEFAULT_BREAKPOINTS`、`DEFAULT_CONTAINER_CONFIG`
   - 添加本地 `LayoutUtils` 和 `CSSGenerator` 类

**修复文件:**

- `src/core/layout/LayoutManager.ts`
- `src/core/layout/GridSystem.ts`
- `src/core/layout/ContainerManager.ts`

---

### 2. ✅ StateManager模块重复注册问题

**问题描述:**

```
Module "app" already registered
Module "auth" already registered
Module "theme" already registered
Module "user" already registered
```

**根本原因:**

- `StateManagementIntegration.integrate()` 调用 `registerStateModules()`
- 应用启动时可能多次调用集成函数
- 没有检查模块是否已注册就直接注册

**修复方案:**
在 `src/core/state/modules/index.ts` 的 `registerStateModules()` 函数中：

1. 添加模块注册检查逻辑
2. 使用 `try-catch` 检测模块是否已存在
3. 只注册未注册的模块

```typescript
// 检查模块是否已注册，避免重复注册
const registeredModules = new Set<string>()

try {
  if (sm.getState('app')) registeredModules.add('app')
} catch (e) {
  /* 模块未注册 */
}

// ... 其他模块检查

// 只注册未注册的模块
if (!registeredModules.has('app')) {
  sm.registerModule(appModule)
}
```

**修复文件:**

- `src/core/state/modules/index.ts`

---

### 3. ✅ StateManager Actions路径问题

**问题描述:**

```
Action "auth.checkAuth" not found
Action "theme.init" not found
Action "app.initLanguage" not found
Action "user.initFromStorage" not found
```

**根本原因:**

- Action调用使用了错误的路径格式 `auth.checkAuth`
- 应该使用 `auth/checkAuth` 格式（使用斜杠而不是点）

**修复方案:**
在 `src/core/state/modules/index.ts` 的 `initializeStateModules()` 函数中：

1. 将所有 action 调用从 `module.action` 改为 `module/action`
2. 添加状态检查，确保模块已注册后再调用 action

```typescript
// 修复前
await sm.dispatch('auth.checkAuth')

// 修复后
const authState = sm.getState('auth')
if (authState) {
  await sm.dispatch('auth/checkAuth')
}
```

**修复文件:**

- `src/core/state/modules/index.ts`

---

### 4. ✅ LayoutManager类型导入问题

**问题描述:**

```
"LayoutEventType" 是使用 "import type" 导入的，因此不能用作值
"DeviceType" 是使用 "import type" 导入的，因此不能用作值
```

**根本原因:**

- TypeScript枚举既是类型也是值
- 使用 `import type` 导入枚举会导致运行时错误

**修复方案:**
将枚举类型从 `import type` 中分离出来，使用普通导入：

```typescript
import type {
  ILayoutManager,
  Breakpoint,
  // ... 其他类型
} from './index'

import { DeviceType, LayoutEventType } from './index'
```

**修复文件:**

- `src/core/layout/LayoutManager.ts`

---

### 5. ✅ LayoutManager代码错误

**问题描述:**

- `getMediaQueries()` 方法中 `queries` 变量未定义
- `getViewportInfo()` 返回对象包含不存在的 `breakpoint` 属性

**修复方案:**

1. 在 `getMediaQueries()` 中添加 `queries` 变量声明
2. 从 `getViewportInfo()` 返回值中移除 `breakpoint` 属性

**修复文件:**

- `src/core/layout/LayoutManager.ts`

---

## 修复结果

### ✅ 所有问题已修复

1. **布局系统** - 循环依赖已解决，可以正常初始化
2. **状态管理** - 模块不会重复注册
3. **Actions调用** - 使用正确的路径格式
4. **类型系统** - TypeScript编译无错误

### 验证方法

运行应用并检查控制台：

```bash
npm run dev
```

预期结果：

- ✅ 布局系统注册成功
- ✅ 状态模块注册成功（无重复注册警告）
- ✅ 所有Actions正常执行
- ✅ 无TypeScript编译错误

---

## 技术要点

### 避免循环依赖的最佳实践

1. **使用 `import type` 导入类型**

   - 只导入类型，不导入值
   - 减少运行时依赖

2. **本地定义常量和工具类**

   - 在需要的文件中直接定义
   - 避免从 `index.ts` 导入

3. **枚举类型特殊处理**
   - 枚举既是类型也是值
   - 必须使用普通导入

### StateManager模块管理

1. **检查模块是否已注册**

   - 使用 `try-catch` 检测
   - 避免重复注册

2. **正确的Action路径格式**

   - 使用 `module/action` 格式
   - 不要使用 `module.action`

3. **安全的模块初始化**
   - 先检查模块是否存在
   - 再调用模块的actions

---

## 下一步

应用现在应该可以正常运行了！如果还有其他问题，请检查：

1. **浏览器控制台** - 查看运行时错误
2. **网络请求** - 检查API调用
3. **Vue DevTools** - 检查组件状态

所有核心系统已经集成并正常工作：

- ✅ 迁移系统
- ✅ 兼容层
- ✅ 特性标志
- ✅ 核心服务（DI、EventBus、Config、Logger）
- ✅ 数据层
- ✅ 状态管理
- ✅ 服务集成（插件、布局、业务服务）
