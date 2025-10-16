# 特性开关系统 (Feature Flags)

特性开关系统用于控制新旧功能的切换,支持渐进式重构、A/B测试和灰度发布。

## 核心功能

### 1. 特性管理

- 注册和注销特性
- 启用和禁用特性
- 批量更新特性状态

### 2. 条件评估

支持多种条件类型:

- **用户条件**: 基于用户ID或用户属性
- **环境条件**: 基于部署环境(开发/测试/生产)
- **百分比条件**: 灰度发布,按百分比启用
- **日期条件**: 基于时间范围
- **自定义条件**: 自定义评估逻辑

### 3. 持久化

自动保存特性状态到本地存储,页面刷新后保持状态。

### 4. 事件通知

特性状态变更时触发事件,便于其他模块响应。

## 使用方法

### 基础使用

```typescript
import { FeatureFlags } from '@/core/features'

// 创建特性开关实例
const featureFlags = new FeatureFlags({
  defaultEnabled: false,
  enableEvents: true,
  enablePersistence: true,
})

// 注册特性
featureFlags.register({
  name: 'new_data_flow_engine',
  description: '新的数据流引擎',
  enabled: false,
})

// 检查特性是否启用
if (featureFlags.isEnabled('new_data_flow_engine')) {
  // 使用新的数据流引擎
  useNewDataFlowEngine()
} else {
  // 使用旧的数据流引擎
  useOldDataFlowEngine()
}

// 启用特性
featureFlags.enable('new_data_flow_engine')

// 禁用特性
featureFlags.disable('new_data_flow_engine')

// 切换特性状态
featureFlags.toggle('new_data_flow_engine')
```

### 使用条件

#### 用户条件

```typescript
featureFlags.register({
  name: 'beta_feature',
  description: 'Beta测试功能',
  enabled: true,
  conditions: [
    {
      type: 'user',
      params: {
        userIds: ['user1', 'user2', 'user3'],
      },
    },
  ],
})

// 检查时提供用户上下文
const isEnabled = featureFlags.isEnabled('beta_feature', {
  userId: 'user1',
})
```

#### 环境条件

```typescript
featureFlags.register({
  name: 'debug_mode',
  description: '调试模式',
  enabled: true,
  conditions: [
    {
      type: 'environment',
      params: {
        environments: ['development', 'test'],
      },
    },
  ],
})

const isEnabled = featureFlags.isEnabled('debug_mode', {
  environment: 'development',
})
```

#### 百分比条件 (灰度发布)

```typescript
featureFlags.register({
  name: 'new_ui',
  description: '新UI设计',
  enabled: true,
  conditions: [
    {
      type: 'percentage',
      params: {
        percentage: 20, // 20%的用户可以看到新UI
      },
    },
  ],
})

// 基于用户ID的一致性哈希,同一用户总是得到相同的结果
const isEnabled = featureFlags.isEnabled('new_ui', {
  userId: 'user123',
})
```

#### 日期条件

```typescript
featureFlags.register({
  name: 'holiday_theme',
  description: '节日主题',
  enabled: true,
  conditions: [
    {
      type: 'date',
      params: {
        startDate: '2024-12-20',
        endDate: '2025-01-05',
      },
    },
  ],
})
```

#### 自定义条件

```typescript
featureFlags.register({
  name: 'premium_feature',
  description: '高级功能',
  enabled: true,
  conditions: [
    {
      type: 'custom',
      params: {
        evaluator: context => {
          return context.userAttributes?.isPremium === true
        },
      },
    },
  ],
})

const isEnabled = featureFlags.isEnabled('premium_feature', {
  userAttributes: {
    isPremium: true,
  },
})
```

### 使用集成类

```typescript
import { FeatureFlagIntegration } from '@/core/features'

const integration = new FeatureFlagIntegration({
  featureFlags,
  defaultContext: {
    userId: 'user123',
    environment: 'production',
  },
})

// 根据特性开关执行不同的代码路径
const result = await integration.branch(
  'new_api_client',
  () => newApiClient.get('/data'),
  () => oldApiClient.get('/data')
)

// 仅在特性启用时执行
await integration.whenEnabled('new_feature', () => {
  console.log('New feature is enabled')
})

// 根据特性开关选择值
const apiClient = integration.select('new_api_client', newApiClient, oldApiClient)
```

### 使用装饰器

```typescript
import { featureFlag } from '@/core/features'

class MyService {
  featureFlags: IFeatureFlags

  constructor(featureFlags: IFeatureFlags) {
    this.featureFlags = featureFlags
  }

  @featureFlag('new_algorithm', false)
  processData(data: any) {
    // 仅在特性启用时执行
    return newAlgorithm(data)
  }
}
```

### 使用预定义的特性标志

```typescript
import { FEATURE_FLAGS, initializeDefaultFeatureFlags } from '@/core/features'

// 初始化默认特性标志
initializeDefaultFeatureFlags(featureFlags)

// 使用预定义的特性标志名称
if (featureFlags.isEnabled(FEATURE_FLAGS.NEW_DATA_FLOW_ENGINE)) {
  // ...
}
```

## 集成到关键模块

### 数据流引擎

```typescript
class DataFlowEngine {
  constructor(
    private featureFlags: IFeatureFlags,
    private newEngine: NewDataFlowEngine,
    private oldEngine: OldDataFlowEngine
  ) {}

  createDataSource(config: any) {
    if (this.featureFlags.isEnabled(FEATURE_FLAGS.NEW_DATA_FLOW_ENGINE)) {
      return this.newEngine.createDataSource(config)
    } else {
      return this.oldEngine.createDataSource(config)
    }
  }
}
```

### 渲染引擎

```typescript
class RenderEngine {
  constructor(
    private featureFlags: IFeatureFlags,
    private newRenderer: NewRenderer,
    private oldRenderer: OldRenderer
  ) {}

  render(control: Control) {
    if (this.featureFlags.isEnabled(FEATURE_FLAGS.NEW_RENDER_ENGINE)) {
      return this.newRenderer.render(control)
    } else {
      return this.oldRenderer.render(control)
    }
  }
}
```

### API客户端

```typescript
class ApiService {
  constructor(
    private featureFlags: IFeatureFlags,
    private newClient: NewApiClient,
    private oldClient: OldApiClient
  ) {}

  async get(url: string) {
    if (this.featureFlags.isEnabled(FEATURE_FLAGS.NEW_API_CLIENT)) {
      const response = await this.newClient.get(url)
      return response.data
    } else {
      return this.oldClient.get(url)
    }
  }
}
```

## 渐进式重构策略

### 阶段1: 注册特性,默认禁用

```typescript
featureFlags.register({
  name: 'new_feature',
  description: '新功能',
  enabled: false, // 默认禁用
})
```

### 阶段2: 在开发环境启用

```typescript
featureFlags.register({
  name: 'new_feature',
  description: '新功能',
  enabled: true,
  conditions: [
    {
      type: 'environment',
      params: {
        environments: ['development'],
      },
    },
  ],
})
```

### 阶段3: 灰度发布 (10%用户)

```typescript
featureFlags.register({
  name: 'new_feature',
  description: '新功能',
  enabled: true,
  conditions: [
    {
      type: 'percentage',
      params: {
        percentage: 10,
      },
    },
  ],
})
```

### 阶段4: 扩大灰度范围 (50%用户)

```typescript
featureFlags.updateFlags({
  new_feature: true,
})

// 更新百分比条件
const flag = featureFlags.getFlag('new_feature')
if (flag && flag.conditions) {
  flag.conditions[0].params.percentage = 50
}
```

### 阶段5: 全量发布

```typescript
featureFlags.register({
  name: 'new_feature',
  description: '新功能',
  enabled: true,
  conditions: [], // 移除所有条件
})
```

### 阶段6: 移除旧代码和特性开关

完全移除旧代码和特性开关,只保留新实现。

## 监控和分析

### 监听特性状态变更

```typescript
eventBus.on('feature.enabled', ({ name, flag }) => {
  console.log(`Feature enabled: ${name}`)
  // 发送分析事件
  analytics.track('feature_enabled', { feature: name })
})

eventBus.on('feature.disabled', ({ name, flag }) => {
  console.log(`Feature disabled: ${name}`)
  analytics.track('feature_disabled', { feature: name })
})
```

### 获取所有特性状态

```typescript
const allFlags = featureFlags.getAllFlags()
console.table(
  allFlags.map(f => ({
    name: f.name,
    enabled: f.enabled,
    description: f.description,
  }))
)
```

## 最佳实践

1. **使用预定义的特性标志名称**: 避免字符串硬编码,使用 `FEATURE_FLAGS` 常量
2. **提供清晰的描述**: 每个特性都应该有清晰的描述
3. **设置合理的默认值**: 新特性默认禁用,稳定特性默认启用
4. **使用条件进行灰度发布**: 逐步推广新特性,降低风险
5. **及时清理**: 特性稳定后,移除特性开关和旧代码
6. **监控特性使用情况**: 记录特性的使用情况,便于分析
7. **文档化**: 记录每个特性的用途和迁移计划

## 注意事项

1. 不要过度使用特性开关,会增加代码复杂度
2. 特性开关应该是临时的,不是永久的配置
3. 定期审查和清理不再需要的特性开关
4. 在生产环境中谨慎使用百分比条件,确保用户体验一致性
5. 特性开关的状态变更应该有审计日志

## 相关文档

- [兼容层](../compat/README.md)
- [版本管理](../version/README.md)
- [配置管理](../config/README.md)
