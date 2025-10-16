# 通知系统错误修复

## 问题

`ReferenceError: require is not defined`

## 原因

在 ES 模块中使用了 CommonJS 的 `require` 语法，Vite 不支持。

## 解决方案

### 1. 移除 useNotification helper

删除了 `src/core/services/helpers.ts` 中的 `useNotification` 函数，因为它使用了 `require`。

### 2. 直接导入通知服务

在组件中直接导入 `notificationService`：

```typescript
// 旧代码（错误）
import { useNotification } from '@/core/services/helpers'
const notify = useNotification()

// 新代码（正确）
import { notificationService } from '@/core/notification'
const notify = notificationService
```

### 3. 更新的文件

**ResourceManagement.vue**:

```typescript
import { notificationService } from '@/core/notification'
const notify = notificationService
```

**Login.vue**:

```typescript
import { notificationService } from '@/core/notification'
const notify = notificationService
```

## 使用方式

```typescript
// 导入通知服务
import { notificationService } from '@/core/notification'

// 或者使用便捷函数
import { notifySuccess, notifyError } from '@/core/notification'

// 使用
notificationService.success('操作成功')
notifySuccess('操作成功', '详细描述')
```

## 状态

✅ 已修复，无诊断错误
