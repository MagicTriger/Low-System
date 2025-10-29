# 数据转换职责划分指南

本文档详细说明了系统中各层的数据转换职责，以及 Pipeline 和 DataTransfer 的使用场景。

## 目录

- [架构概览](#架构概览)
- [各层职责](#各层职责)
- [Pipeline vs DataTransfer](#pipeline-vs-datatransfer)
- [使用示例](#使用示例)
- [最佳实践](#最佳实践)

## 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Component 层                            │
│  职责：展示格式化（日期、数字、文本格式化）                    │
│  工具：Formatters                                            │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
┌─────────────────────────────────────────────────────────────┐
│                      State 层                                │
│  职责：业务逻辑转换（计算字段、数据关联、聚合）                │
│  工具：StateTransformer                                      │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
┌─────────────────────────────────────────────────────────────┐
│                      API 层                                  │
│  职责：格式转换（字段重命名、类型映射、日期解析）              │
│  工具：ApiTransformer                                        │
└─────────────────────────────────────────────────────────────┘
                              ↑
                              │
                         后端 API
```

## 各层职责

### 1. API 层（ApiTransformer）

**职责：**

- 将后端响应数据转换为前端标准格式
- 字段重命名（如：`user_name` → `username`）
- 类型映射（如：数字状态 → 字符串状态）
- 日期格式转换（如：字符串 → Date 对象）
- 枚举值映射

**不应该做：**

- ❌ 业务逻辑计算
- ❌ 数据聚合
- ❌ 展示格式化

**使用场景：**

```typescript
// 在 API 模块中使用
import { ApiTransformer } from '@/core/api/transformers/ApiTransformer'

export const userApi = {
  async getList() {
    const response = await apiClient.get('/users')

    // API 层转换：字段重命名和类型映射
    return ApiTransformer.transformResponse(response.data, {
      fieldMappings: [
        { from: 'user_name', to: 'username' },
        { from: 'created_time', to: 'createdAt' },
        { from: 'user_status', to: 'status' },
      ],
      dateFields: ['createdAt'],
      enumMappings: {
        status: { 1: 'active', 0: 'inactive' },
      },
    })
  },
}
```

### 2. State 层（StateTransformer）

**职责：**

- 业务逻辑相关的数据转换
- 计算派生字段（如：`fullName = firstName + lastName`）
- 数据关联（如：关联用户和订单）
- 数据聚合（如：计算总金额、平均值）
- 应用业务规则

**不应该做：**

- ❌ 字段重命名
- ❌ 展示格式化
- ❌ 类型映射

**使用场景：**

```typescript
// 在 State 模块中使用
import { StateTransformer } from '@/core/state/transformers/StateTransformer'

export const userModule = {
  actions: {
    async loadUsers({ commit }) {
      // 1. 从 API 获取数据（已经过 API 层转换）
      const apiData = await userApi.getList()

      // 2. State 层转换：添加计算字段和业务逻辑
      const stateData = StateTransformer.transformForState(apiData, {
        computedFields: [
          {
            name: 'fullName',
            compute: data => `${data.firstName} ${data.lastName}`,
          },
          {
            name: 'isVip',
            compute: data => data.totalAmount > 10000,
          },
        ],
        relations: [
          {
            field: 'orders',
            source: () => orderModule.state.orders,
            localKey: 'id',
            foreignKey: 'userId',
            type: 'many',
          },
        ],
      })

      commit('SET_USERS', stateData)
    },
  },
}
```

### 3. Component 层（Formatters）

**职责：**

- 展示相关的数据格式化
- 日期时间格式化（如：`2024-01-01 10:30:00`）
- 数字格式化（如：`1,234.56`）
- 货币格式化（如：`¥1,234.56`）
- 文本格式化（如：截断、大小写转换）
- 数据脱敏（如：手机号、身份证）

**不应该做：**

- ❌ 改变数据结构
- ❌ 业务逻辑计算
- ❌ 数据关联

**使用场景：**

```vue
<template>
  <div>
    <!-- 日期格式化 -->
    <span>{{ Formatters.formatDate(user.createdAt, { format: 'YYYY-MM-DD' }) }}</span>

    <!-- 货币格式化 -->
    <span>{{ Formatters.formatCurrency(user.totalAmount, { currency: 'CNY' }) }}</span>

    <!-- 文本截断 -->
    <span>{{ Formatters.formatText(user.bio, { maxLength: 50 }) }}</span>

    <!-- 电话号码脱敏 -->
    <span>{{ Formatters.formatPhone(user.phone) }}</span>
  </div>
</template>

<script setup lang="ts">
import { Formatters } from '@/core/utils/formatters'
</script>
```

## Pipeline vs DataTransfer

### Pipeline（通用链式数据处理）

**特点：**

- 通用的链式数据处理框架
- 代码驱动，灵活性高
- 支持自定义处理器
- 适合复杂的数据转换流程
- 支持错误处理策略
- 支持缓存和超时控制

**使用场景：**

- 需要多步骤的数据处理
- 处理逻辑复杂且需要灵活组合
- 需要错误处理和重试机制
- 需要性能优化（缓存）

**示例：**

```typescript
import { Pipeline } from '@/core/data/pipeline/Pipeline'
import { SortProcessor, FilterProcessor, MapProcessor } from '@/core/data/pipeline/processors'

// 创建数据处理管道
const userDataPipeline = new Pipeline({
  id: 'user-data-pipeline',
  name: '用户数据处理管道',
  enableCache: true,
  cacheTTL: 60000,
  errorStrategy: ErrorStrategy.Skip,
})

// 添加处理器
userDataPipeline
  .addProcessor(
    new FilterProcessor({
      name: 'filter-active-users',
      description: '过滤活跃用户',
      condition: user => user.status === 'active',
    })
  )
  .addProcessor(
    new MapProcessor({
      name: 'add-full-name',
      description: '添加全名',
      mapper: user => ({
        ...user,
        fullName: `${user.firstName} ${user.lastName}`,
      }),
    })
  )
  .addProcessor(
    new SortProcessor({
      name: 'sort-by-created-date',
      description: '按创建日期排序',
      field: 'createdAt',
      order: 'desc',
    })
  )

// 执行管道
const result = await userDataPipeline.execute(rawUserData)
console.log(result.result) // 处理后的数据
console.log(result.duration) // 执行时长
console.log(result.steps) // 各步骤详情
```

### DataTransfer（配置驱动的数据流）

**特点：**

- 配置驱动，易于维护
- 适合标准化的数据转换场景
- 支持数据源输入输出
- 内置常用转换操作（map、filter、aggregate）
- 适合低代码场景

**使用场景：**

- 标准化的数据转换流程
- 需要配置化管理的数据流
- 低代码平台中的数据转换
- 数据源之间的数据流转

**示例：**

```typescript
import { DataTransfer } from '@/core/engines/data-transfer'

// 创建数据流配置
const userDataFlow = new DataTransfer({
  id: 'user-data-flow',
  name: '用户数据流',
  description: '处理用户数据并输出到表格',
  input: {
    type: 'dataSource',
    source: 'user-api',
  },
  output: {
    type: 'variable',
    target: 'userTableData',
  },
  steps: [
    {
      id: 'filter-step',
      name: '过滤活跃用户',
      type: 'filter',
      enabled: true,
      config: {
        condition: {
          field: 'status',
          operator: 'eq',
          value: 'active',
        },
      },
    },
    {
      id: 'transform-step',
      name: '字段映射',
      type: 'transform',
      enabled: true,
      config: {
        type: 'map',
        mapping: {
          userName: 'username',
          userEmail: 'email',
          createTime: 'createdAt',
        },
      },
    },
    {
      id: 'sort-step',
      name: '排序',
      type: 'transform',
      enabled: true,
      config: {
        type: 'sort',
        field: 'createdAt',
        order: 'desc',
      },
    },
  ],
})

// 执行数据流
await userDataFlow.execute()
```

### 选择指南

| 场景           | 推荐工具         | 原因                              |
| -------------- | ---------------- | --------------------------------- |
| API 响应转换   | ApiTransformer   | 专门用于 API 层的格式转换         |
| 业务逻辑处理   | StateTransformer | 专门用于 State 层的业务转换       |
| UI 展示格式化  | Formatters       | 专门用于 Component 层的展示格式化 |
| 复杂多步骤处理 | Pipeline         | 灵活的链式处理，支持自定义处理器  |
| 配置化数据流   | DataTransfer     | 配置驱动，适合低代码场景          |

## 使用示例

### 完整的数据流转示例

```typescript
// 1. API 层：获取并转换后端数据
// src/core/api/user.ts
import { ApiTransformer } from '@/core/api/transformers/ApiTransformer'

export const userApi = {
  async getList() {
    const response = await apiClient.get('/users')

    // API 层转换：字段重命名和类型映射
    return ApiTransformer.transformResponse(response.data.list, {
      fieldMappings: [
        { from: 'user_name', to: 'username' },
        { from: 'first_name', to: 'firstName' },
        { from: 'last_name', to: 'lastName' },
        { from: 'created_time', to: 'createdAt' },
        { from: 'total_amount', to: 'totalAmount' }
      ],
      dateFields: ['createdAt'],
      enumMappings: {
        status: { 1: 'active', 0: 'inactive' }
      }
    })
  }
}

// 2. State 层：添加业务逻辑
// src/core/state/modules/user.ts
import { StateTransformer } from '@/core/state/transformers/StateTransformer'

export const userModule = {
  state: () => ({
    users: []
  }),

  actions: {
    async loadUsers({ commit }) {
      // 获取 API 数据
      const apiData = await userApi.getList()

      // State 层转换：添加计算字段和业务逻辑
      const stateData = StateTransformer.transformForState(apiData, {
        computedFields: [
          {
            name: 'fullName',
            compute: (data) => `${data.firstName} ${data.lastName}`,
            dependencies: ['firstName', 'lastName']
          },
          {
            name: 'isVip',
            compute: (data) => data.totalAmount > 10000
          },
          {
            name: 'memberLevel',
            compute: (data) => {
              if (data.totalAmount > 50000) return 'platinum'
              if (data.totalAmount > 10000) return 'gold'
              return 'silver'
            }
          }
        ],
        filter: (user) => user.status === 'active',
        sort: { field: 'totalAmount', order: 'desc' }
      })

      commit('SET_USERS', stateData)
    }
  }
}

// 3. Component 层：展示格式化
// src/components/UserList.vue
<template>
  <div class="user-list">
    <div v-for="user in users" :key="user.id" class="user-item">
      <h3>{{ user.fullName }}</h3>
      <p>注册时间：{{ Formatters.formatDate(user.createdAt, { format: 'YYYY-MM-DD' }) }}</p>
      <p>消费金额：{{ Formatters.formatCurrency(user.totalAmount, { currency: 'CNY' }) }}</p>
      <p>会员等级：{{ Formatters.formatEnum(user.memberLevel, memberLevelMap) }}</p>
      <p>VIP 状态：{{ Formatters.formatBoolean(user.isVip, { true: '是', false: '否' }) }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useStore } from '@/core/state/StateManager'
import { Formatters } from '@/core/utils/formatters'

const store = useStore()
const users = computed(() => store.state.user.users)

const memberLevelMap = {
  platinum: '白金会员',
  gold: '黄金会员',
  silver: '银卡会员'
}
</script>
```

### 使用 Pipeline 处理复杂数据

```typescript
import { Pipeline } from '@/core/data/pipeline/Pipeline'
import { ErrorStrategy } from '@/core/data/pipeline/IPipeline'

// 创建复杂的数据处理管道
const orderAnalysisPipeline = new Pipeline({
  id: 'order-analysis',
  name: '订单分析管道',
  enableCache: true,
  cacheTTL: 300000, // 5分钟缓存
  timeout: 10000, // 10秒超时
  errorStrategy: ErrorStrategy.Skip,
})

// 添加处理器
orderAnalysisPipeline
  // 1. 过滤有效订单
  .addProcessor({
    name: 'filter-valid-orders',
    process: orders => orders.filter(o => o.status !== 'cancelled'),
  })
  // 2. 关联用户信息
  .addProcessor({
    name: 'join-user-info',
    process: async orders => {
      const userIds = [...new Set(orders.map(o => o.userId))]
      const users = await userApi.getByIds(userIds)
      const userMap = new Map(users.map(u => [u.id, u]))

      return orders.map(order => ({
        ...order,
        user: userMap.get(order.userId),
      }))
    },
  })
  // 3. 计算订单统计
  .addProcessor({
    name: 'calculate-statistics',
    process: orders => {
      return orders.map(order => ({
        ...order,
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        averagePrice: order.totalAmount / order.items.length,
      }))
    },
  })
  // 4. 按金额排序
  .addProcessor({
    name: 'sort-by-amount',
    process: orders => {
      return [...orders].sort((a, b) => b.totalAmount - a.totalAmount)
    },
  })

// 执行管道
const result = await orderAnalysisPipeline.execute(rawOrders)

console.log('处理结果:', result.result)
console.log('执行时长:', result.duration, 'ms')
console.log(
  '各步骤耗时:',
  result.steps.map(s => ({
    name: s.processorName,
    duration: s.duration,
  }))
)
```

## 最佳实践

### 1. 分层原则

- ✅ **API 层只做格式转换**：字段重命名、类型映射、日期解析
- ✅ **State 层处理业务逻辑**：计算字段、数据关联、业务规则
- ✅ **Component 层只做展示格式化**：日期格式、数字格式、文本格式

### 2. 工具选择

- ✅ **简单转换用 Transformer**：ApiTransformer、StateTransformer
- ✅ **复杂流程用 Pipeline**：多步骤、需要错误处理、需要性能优化
- ✅ **配置化场景用 DataTransfer**：低代码平台、标准化流程

### 3. 性能优化

- ✅ **使用 Pipeline 缓存**：对于重复的数据处理
- ✅ **避免重复转换**：在合适的层级进行转换，避免多次转换
- ✅ **按需加载**：大数据量时使用分页和虚拟滚动

### 4. 错误处理

- ✅ **API 层捕获网络错误**
- ✅ **State 层捕获业务逻辑错误**
- ✅ **Component 层提供友好的错误提示**

### 5. 可维护性

- ✅ **创建可复用的转换配置**
- ✅ **使用 TypeScript 类型定义**
- ✅ **编写单元测试**
- ✅ **添加清晰的注释和文档**

## 总结

| 层级         | 工具             | 职责       | 示例                 |
| ------------ | ---------------- | ---------- | -------------------- |
| API 层       | ApiTransformer   | 格式转换   | 字段重命名、类型映射 |
| State 层     | StateTransformer | 业务逻辑   | 计算字段、数据关联   |
| Component 层 | Formatters       | 展示格式化 | 日期格式、数字格式   |
| 通用处理     | Pipeline         | 链式处理   | 复杂多步骤转换       |
| 配置化流程   | DataTransfer     | 配置驱动   | 低代码数据流         |

遵循这些原则和最佳实践，可以确保代码的清晰性、可维护性和性能。
