# Vuex 导入错误修复

## 问题描述

**错误信息：**

```
Failed to resolve import "vuex" from "src/modules/designer/components/ResourceTree.vue"
```

**原因：**
ResourceTree 组件错误地使用了 `useStore` from 'vuex'，但项目使用的是自定义的状态管理系统，不依赖 Vuex。

## 修复方案

### 修复前

```typescript
import { useStore } from 'vuex'

const store = useStore()
const resourceTree = computed(() => store.state.resource.resourceTree || [])

await store.dispatch('resource/fetchResourceTree')
```

### 修复后

```typescript
import { useModule } from '@/core/state/helpers'

const resourceModule = useModule('resource')
const resourceTree = computed(() => resourceModule.state.resourceTree || [])

await resourceModule.dispatch('fetchResourceTree')
```

## 修复文件

1. `src/modules/designer/components/ResourceTree.vue`
2. `src/modules/admin/components/ResourceTree.vue`

## 技术说明

项目使用自定义的状态管理系统，通过 `useModule` helper 函数访问状态模块：

```typescript
// 获取 resource 模块
const resourceModule = useModule('resource')

// 访问状态
resourceModule.state.resourceTree

// 调用 action
resourceModule.dispatch('fetchResourceTree')

// 调用 mutation
resourceModule.commit('setResourceTree', data)

// 访问 getter
resourceModule.getters.filteredResources
```

## 测试验证

修复后应该能够正常启动：

```bash
npm run dev:designer
```

访问 http://localhost:5173 应该不再有 Vuex 导入错误。

## 相关文档

- `src/core/state/helpers.ts` - 状态管理 helper 函数
- `src/core/state/modules/resource.ts` - resource 状态模块
- `.kiro/specs/resource-management-system/TASK_3_COMPLETED.md` - 状态管理实现文档

---

**修复时间**: 2025-10-14  
**状态**: ✅ 已修复
