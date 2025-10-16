# 🧪 迁移系统测试指南

## 快速测试

在浏览器控制台中执行以下命令来测试迁移系统的各项功能。

### 1. 验证系统可用性

```javascript
// 检查迁移系统是否可用
console.log('Migration System:', window.__MIGRATION_SYSTEM__)

// 应该看到:
// {
//   system: MigrationSystem,
//   compatLayer: ApiCompatLayer,
//   featureFlags: FeatureFlags,
//   versionManager: VersionManager
// }
```

### 2. 测试特性开关

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 查看所有特性
console.table(
  featureFlags.getAllFlags().map(f => ({
    name: f.name,
    enabled: f.enabled,
    description: f.description,
  }))
)

// 检查特性是否启用
console.log('New API Client:', featureFlags.isEnabled('new_api_client'))
// 应该返回: true

// 启用一个特性
featureFlags.enable('new_data_flow_engine')
console.log('Data Flow Engine:', featureFlags.isEnabled('new_data_flow_engine'))
// 应该返回: true

// 禁用一个特性
featureFlags.disable('new_data_flow_engine')
console.log('Data Flow Engine:', featureFlags.isEnabled('new_data_flow_engine'))
// 应该返回: false

// 切换特性状态
featureFlags.toggle('new_data_flow_engine')
console.log('Data Flow Engine:', featureFlags.isEnabled('new_data_flow_engine'))
// 应该返回: true
```

### 3. 测试兼容层

```javascript
const { compatLayer } = window.__MIGRATION_SYSTEM__

// 检查API是否支持
console.log('Supports dataSource.create:', compatLayer.supports('dataSource.create'))
// 应该返回: true

// 获取迁移建议
const advice = compatLayer.getMigrationAdvice('dataSource.create')
console.log('Migration Advice:', advice)
// 应该显示迁移建议对象

// 测试API适配 (注意: 需要先注册新版API服务)
// compatLayer.adapt({
//   name: 'dataSource.create',
//   args: [{ type: 'api', url: '/api/data' }]
// }).then(result => {
//   console.log('API adapted:', result)
// }).catch(error => {
//   console.error('Adaptation failed:', error)
// })
```

### 4. 测试版本管理

```javascript
const { versionManager } = window.__MIGRATION_SYSTEM__

// 获取当前版本
const version = versionManager.getCurrentVersion()
console.log('Current Version:', `${version.major}.${version.minor}.${version.patch}`)
// 应该显示: 2.0.0

// 检查版本兼容性
const compatibility = versionManager.checkCompatibility('1.0.0')
console.log('Compatibility Check:', compatibility)
// 应该显示兼容性检查结果

// 查看迁移历史
const history = versionManager.getMigrationHistory()
console.log('Migration History:', history)
// 应该显示迁移历史记录
```

### 5. 测试迁移系统状态

```javascript
const { system } = window.__MIGRATION_SYSTEM__

// 获取完整状态
const status = system.getStatus()
console.log('System Status:', status)

// 查看各组件状态
console.log('Compat Layer Enabled:', status.compatLayer.enabled)
console.log('Feature Flags Count:', status.featureFlags.flags.length)
console.log('Current Version:', status.versionManager.currentVersion)
```

## 功能测试

### 测试1: 特性开关持久化

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 1. 启用一个特性
featureFlags.enable('new_data_flow_engine')

// 2. 刷新页面
location.reload()

// 3. 页面加载后,再次检查
// (在新的控制台会话中执行)
const { featureFlags: ff } = window.__MIGRATION_SYSTEM__
console.log('Persisted:', ff.isEnabled('new_data_flow_engine'))
// 应该返回: true (说明状态已持久化)
```

### 测试2: 特性开关条件评估

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 注册一个带条件的特性
featureFlags.register({
  name: 'test_feature',
  description: '测试特性',
  enabled: true,
  conditions: [
    {
      type: 'percentage',
      params: { percentage: 50 }, // 50%的用户
    },
  ],
})

// 测试多次,看是否一致
for (let i = 0; i < 5; i++) {
  const enabled = featureFlags.isEnabled('test_feature', {
    userId: 'test-user-123',
  })
  console.log(`Test ${i + 1}:`, enabled)
}
// 对于同一用户,结果应该一致
```

### 测试3: 数据迁移

```javascript
const { system } = window.__MIGRATION_SYSTEM__

// 创建旧版本数据
const oldData = {
  __version: '1.0.0',
  dataSources: [
    {
      id: 'ds1',
      type: 'api',
      config: { url: '/api/data' },
    },
  ],
}

// 执行迁移
system
  .migrateData(oldData)
  .then(newData => {
    console.log('Migrated Data:', newData)
    console.log('New Version:', newData.__version)
    // 应该显示: 2.0.0
  })
  .catch(error => {
    console.error('Migration failed:', error)
  })
```

### 测试4: 兼容层警告

```javascript
const { compatLayer } = window.__MIGRATION_SYSTEM__

// 使用已废弃的API (应该显示警告)
compatLayer
  .adapt({
    name: 'store.register',
    args: ['myModule', { state: {}, mutations: {}, actions: {} }],
  })
  .catch(error => {
    console.log('Expected error (API not registered):', error.message)
  })

// 检查控制台,应该看到废弃警告
```

## 性能测试

### 测试1: 特性开关评估性能

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 测试1000次评估的时间
console.time('Feature Flag Evaluation')
for (let i = 0; i < 1000; i++) {
  featureFlags.isEnabled('new_api_client')
}
console.timeEnd('Feature Flag Evaluation')
// 应该 < 10ms
```

### 测试2: 兼容层转换性能

```javascript
const { compatLayer } = window.__MIGRATION_SYSTEM__

// 测试100次API适配的时间
console.time('API Adaptation')
const promises = []
for (let i = 0; i < 100; i++) {
  promises.push(
    compatLayer
      .adapt({
        name: 'eventBus.on',
        args: ['test-event', () => {}],
      })
      .catch(() => {})
  )
}
Promise.all(promises).then(() => {
  console.timeEnd('API Adaptation')
  // 应该 < 500ms
})
```

## 集成测试

### 测试场景1: 新旧实现切换

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 模拟新旧实现切换
function processData(data) {
  if (featureFlags.isEnabled('new_data_flow_engine')) {
    console.log('Using NEW implementation')
    return `NEW: ${data}`
  } else {
    console.log('Using OLD implementation')
    return `OLD: ${data}`
  }
}

// 测试旧实现
featureFlags.disable('new_data_flow_engine')
console.log(processData('test'))
// 应该输出: Using OLD implementation, OLD: test

// 测试新实现
featureFlags.enable('new_data_flow_engine')
console.log(processData('test'))
// 应该输出: Using NEW implementation, NEW: test
```

### 测试场景2: 灰度发布

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 配置灰度发布 (20%用户)
featureFlags.register({
  name: 'gradual_rollout_test',
  description: '灰度发布测试',
  enabled: true,
  conditions: [
    {
      type: 'percentage',
      params: { percentage: 20 },
    },
  ],
})

// 测试100个不同用户
let enabledCount = 0
for (let i = 0; i < 100; i++) {
  const enabled = featureFlags.isEnabled('gradual_rollout_test', {
    userId: `user-${i}`,
  })
  if (enabled) enabledCount++
}

console.log(`Enabled for ${enabledCount}/100 users`)
// 应该接近20个用户
```

## 故障测试

### 测试1: 不存在的特性

```javascript
const { featureFlags } = window.__MIGRATION_SYSTEM__

// 检查不存在的特性
const enabled = featureFlags.isEnabled('non_existent_feature')
console.log('Non-existent feature:', enabled)
// 应该返回: false (默认值)
```

### 测试2: 不支持的API

```javascript
const { compatLayer } = window.__MIGRATION_SYSTEM__

// 尝试适配不支持的API
compatLayer
  .adapt({
    name: 'unsupported.api',
    args: [],
  })
  .catch(error => {
    console.log('Expected error:', error.message)
    // 应该显示: No adapter found for legacy API
  })
```

### 测试3: 无效的版本

```javascript
const { versionManager } = window.__MIGRATION_SYSTEM__

// 检查无效版本
try {
  const compatibility = versionManager.checkCompatibility('invalid-version')
  console.log('Should not reach here')
} catch (error) {
  console.log('Expected error:', error.message)
  // 应该显示: Invalid version format
}
```

## 测试清单

完成以下测试项:

### 基础功能

- [ ] 迁移系统可访问
- [ ] 兼容层可用
- [ ] 特性开关可用
- [ ] 版本管理器可用

### 特性开关

- [ ] 查看所有特性
- [ ] 检查特性状态
- [ ] 启用特性
- [ ] 禁用特性
- [ ] 切换特性
- [ ] 特性持久化

### 兼容层

- [ ] 检查API支持
- [ ] 获取迁移建议
- [ ] API适配 (需要注册服务)

### 版本管理

- [ ] 获取当前版本
- [ ] 检查版本兼容性
- [ ] 查看迁移历史
- [ ] 数据迁移

### 性能

- [ ] 特性评估性能 < 10ms/1000次
- [ ] API适配性能 < 500ms/100次

### 集成

- [ ] 新旧实现切换
- [ ] 灰度发布

### 故障处理

- [ ] 不存在的特性
- [ ] 不支持的API
- [ ] 无效的版本

## 测试结果

记录测试结果:

```
测试日期: 2025-10-12
测试人员: [你的名字]
测试环境: Chrome/Edge/Firefox [版本]

基础功能: ✅ 通过
特性开关: ✅ 通过
兼容层: ⏳ 部分通过 (需要注册API服务)
版本管理: ✅ 通过
性能测试: ✅ 通过
集成测试: ✅ 通过
故障测试: ✅ 通过

总体评价: 🟢 优秀
```

## 下一步

测试通过后:

1. 开始注册新版API服务
2. 实现待启用的特性
3. 编写自动化测试
4. 开始实际代码迁移

---

**祝测试顺利！** 🧪
