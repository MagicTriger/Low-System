# 架构重构迁移指南

本指南帮助开发者将现有代码从旧架构迁移到新架构。

## 目录

- [概述](#概述)
- [迁移策略](#迁移策略)
- [版本对照](#版本对照)
- [API变更](#api变更)
- [数据迁移](#数据迁移)
- [代码示例](#代码示例)
- [常见问题](#常见问题)
- [迁移工具](#迁移工具)

## 概述

### 重构目标

新架构旨在实现:

- 更好的模块解耦
- 更强的可扩展性
- 更高的性能
- 更好的类型安全
- 更易于测试

### 主要变更

1. **依赖注入**: 引入依赖注入容器,统一管理服务生命周期
2. **插件系统**: 控件、数据源等通过插件方式注册
3. **事件总线**: 统一的事件通信机制
4. **数据流引擎**: 重构数据流处理逻辑
5. **渲染引擎**: 框架无关的渲染抽象
6. **API层**: 统一的API客户端接口

## 迁移策略

### 渐进式迁移

推荐采用渐进式迁移策略,分阶段完成:

#### 阶段1: 启用兼容层 (1-2周)

```typescript
// 1. 启用兼容层
import { ApiCompatLayer } from '@/core/compat'

const compatLayer = new ApiCompatLayer({
  enabled: true,
  autoMigrate: false,
})

// 2. 注册新版API实例
compatLayer.registerApi('DataFlowEngine', dataFlowEngine)
compatLayer.registerApi('StateManager', stateManager)
compatLayer.registerApi('EventBus', eventBus)

// 3. 现有代码继续工作,无需修改
```

#### 阶段2: 迁移核心模块 (2-3周)

优先迁移核心模块:

1. 依赖注入容器
2. 事件总线
3. 配置管理
4. 日志系统

#### 阶段3: 迁移业务模块 (3-4周)

逐步迁移业务模块:

1. 数据流引擎
2. 渲染引擎
3. 状态管理
4. API层

#### 阶段4: 清理和优化 (1-2周)

1. 移除兼容层
2. 清理旧代码
3. 性能优化
4. 文档更新

### 并行迁移

对于大型项目,可以采用并行迁移策略:

1. **特性开关**: 使用特性开关控制新旧实现
2. **模块隔离**: 新旧模块独立运行
3. **逐步替换**: 逐个模块替换为新实现

## 版本对照

### 1.x → 2.0

| 功能     | 1.x          | 2.0            | 状态 |
| -------- | ------------ | -------------- | ---- |
| 依赖注入 | 无           | Container      | 新增 |
| 事件系统 | 简单EventBus | 增强EventBus   | 重构 |
| 数据源   | 直接使用     | DataFlowEngine | 重构 |
| 状态管理 | Pinia        | StateManager   | 重构 |
| 控件注册 | 直接注册     | 插件系统       | 重构 |
| API调用  | axios        | ApiClient      | 重构 |

### 2.0 → 2.1

| 功能     | 2.0  | 2.1      | 状态 |
| -------- | ---- | -------- | ---- |
| 插件系统 | 基础 | 增强     | 优化 |
| 数据流   | 基础 | 转换管道 | 新增 |
| 性能优化 | 基础 | 虚拟滚动 | 新增 |

## API变更

### 数据源API

#### 旧版 (1.x)

```typescript
// 创建数据源
const dataSource = {
  type: 'api',
  url: '/api/data',
  method: 'GET',
}

// 加载数据
const data = await loadData(dataSource)
```

#### 新版 (2.0)

```typescript
// 通过依赖注入获取数据流引擎
const dataFlowEngine = container.resolve(DataFlowEngine)

// 创建数据源
const dataSource = dataFlowEngine.createDataSource({
  type: 'api',
  config: {
    url: '/api/data',
    method: 'GET',
  },
})

// 加载数据
const data = await dataSource.load()
```

#### 迁移步骤

1. 使用兼容层 (临时方案):

```typescript
// 兼容层自动转换
const data = await compatLayer.adapt({
  name: 'dataSource.create',
  args: [{ type: 'api', url: '/api/data' }],
})
```

2. 迁移到新API:

```typescript
// 1. 注入依赖
class MyComponent {
  constructor(private dataFlowEngine: DataFlowEngine) {}

  async loadData() {
    // 2. 使用新API
    const dataSource = this.dataFlowEngine.createDataSource({
      type: 'api',
      config: { url: '/api/data' },
    })
    return dataSource.load()
  }
}
```

### 状态管理API

#### 旧版 (1.x)

```typescript
// 使用Pinia store
import { useMyStore } from '@/stores/myStore'

const store = useMyStore()
store.myAction()
```

#### 新版 (2.0)

```typescript
// 使用StateManager
const stateManager = container.resolve(StateManager)

// 注册模块
stateManager.registerModule({
  name: 'myModule',
  state: {
    /* ... */
  },
  actions: {
    /* ... */
  },
  mutations: {
    /* ... */
  },
})

// 分发action
await stateManager.dispatch('myModule.myAction')
```

#### 迁移步骤

1. 保持Pinia store (兼容模式):

```typescript
// 创建适配器
class PiniaStateAdapter {
  constructor(
    private stateManager: StateManager,
    private piniaStore: any
  ) {}

  // 将Pinia store包装为StateModule
  toStateModule() {
    return {
      name: this.piniaStore.$id,
      state: this.piniaStore.$state,
      // ...
    }
  }
}
```

2. 逐步迁移到StateManager:

```typescript
// 1. 定义状态模块
const myModule: IStateModule = {
  name: 'myModule',
  state: {
    data: null,
    loading: false,
  },
  actions: {
    async loadData(context) {
      context.commit('setLoading', true)
      const data = await fetchData()
      context.commit('setData', data)
      context.commit('setLoading', false)
    },
  },
  mutations: {
    setData(state, data) {
      state.data = data
    },
    setLoading(state, loading) {
      state.loading = loading
    },
  },
}

// 2. 注册模块
stateManager.registerModule(myModule)

// 3. 使用
await stateManager.dispatch('myModule.loadData')
const state = stateManager.getState('myModule')
```

### 事件API

#### 旧版 (1.x)

```typescript
// 全局事件总线
import { eventBus } from '@/utils/eventBus'

eventBus.on('event', handler)
eventBus.emit('event', data)
```

#### 新版 (2.0)

```typescript
// 通过依赖注入获取
const eventBus = container.resolve(EventBus)

eventBus.on('event', handler, {
  priority: 10,
  async: true,
})
eventBus.emit('event', data)
```

#### 迁移步骤

1. 使用兼容层:

```typescript
// 自动适配
eventBus.on('event', handler) // 仍然工作
```

2. 迁移到新API:

```typescript
class MyService {
  constructor(private eventBus: IEventBus) {
    this.setupListeners()
  }

  private setupListeners() {
    this.eventBus.on('dataLoaded', this.handleDataLoaded.bind(this), {
      priority: 10,
    })
  }

  private handleDataLoaded(data: any) {
    // 处理事件
  }
}
```

### 控件注册API

#### 旧版 (1.x)

```typescript
// 直接注册控件
import { registerControl } from '@/core/controls'

registerControl({
  kind: 'my-control',
  kindName: '我的控件',
  component: MyControlComponent,
  // ...
})
```

#### 新版 (2.0)

```typescript
// 通过插件注册
import { IControlPlugin } from '@/core/plugins'

class MyControlPlugin implements IControlPlugin {
  metadata = {
    id: 'my-control-plugin',
    name: '我的控件插件',
    version: '1.0.0',
  }

  registerControls() {
    return [
      {
        kind: 'my-control',
        kindName: '我的控件',
        component: MyControlComponent,
        // ...
      },
    ]
  }

  async install(context: PluginContext) {
    // 插件安装逻辑
  }

  async uninstall(context: PluginContext) {
    // 插件卸载逻辑
  }
}

// 注册插件
const pluginManager = container.resolve(PluginManager)
pluginManager.registerPlugin(new MyControlPlugin())
```

### API客户端

#### 旧版 (1.x)

```typescript
// 使用axios
import axios from 'axios'

const response = await axios.get('/api/data')
const data = response.data
```

#### 新版 (2.0)

```typescript
// 使用ApiClient
const apiClient = container.resolve(ApiClient)

const response = await apiClient.get('/api/data', {
  cache: { enabled: true, ttl: 300 },
  retry: { times: 3, delay: 1000 },
})
const data = response.data
```

## 数据迁移

### 自动迁移

系统提供自动数据迁移功能:

```typescript
import { VersionManager, registerAllMigrations } from '@/core/version'

// 创建版本管理器
const versionManager = new VersionManager({
  currentVersion: '2.0.0',
  autoMigrate: true,
})

// 注册所有迁移脚本
registerAllMigrations(versionManager)

// 加载旧数据
const oldData = await loadData()

// 自动迁移
const newData = await versionManager.migrate(oldData)

// 保存新数据
await saveData(newData)
```

### 手动迁移

对于复杂场景,可以手动执行迁移:

```typescript
// 1. 检查版本兼容性
const compatibility = versionManager.checkCompatibility(oldData.__version)

if (!compatibility.compatible) {
  console.error('Incompatible version:', compatibility.errors)
  return
}

// 2. 显示需要的迁移
console.log('Required migrations:')
compatibility.requiredMigrations.forEach(m => {
  console.log(`  - ${m.description}`)
})

// 3. 确认后执行迁移
if (confirm('Execute migrations?')) {
  const newData = await versionManager.migrate(oldData)
  await saveData(newData)
}
```

### 数据备份

在迁移前,务必备份数据:

```typescript
// 备份数据
const backup = JSON.parse(JSON.stringify(oldData))
localStorage.setItem('data_backup', JSON.stringify(backup))

try {
  // 执行迁移
  const newData = await versionManager.migrate(oldData)
  await saveData(newData)
} catch (error) {
  // 恢复备份
  console.error('Migration failed, restoring backup:', error)
  const backup = JSON.parse(localStorage.getItem('data_backup')!)
  await saveData(backup)
}
```

## 代码示例

### 完整迁移示例

#### 旧版代码 (1.x)

```typescript
// MyComponent.vue (旧版)
import { ref } from 'vue'
import axios from 'axios'
import { eventBus } from '@/utils/eventBus'
import { useMyStore } from '@/stores/myStore'

export default {
  setup() {
    const data = ref(null)
    const store = useMyStore()

    const loadData = async () => {
      const response = await axios.get('/api/data')
      data.value = response.data
      store.setData(response.data)
      eventBus.emit('dataLoaded', response.data)
    }

    return { data, loadData }
  },
}
```

#### 新版代码 (2.0)

```typescript
// MyComponent.ts (新版)
import { inject } from 'vue'
import { DataFlowEngine } from '@/core/data'
import { StateManager } from '@/core/state'
import { EventBus } from '@/core/events'

export class MyComponentController {
  private dataSource: IDataSource

  constructor(
    private dataFlowEngine: DataFlowEngine,
    private stateManager: StateManager,
    private eventBus: EventBus
  ) {
    this.dataSource = this.dataFlowEngine.createDataSource({
      type: 'api',
      config: { url: '/api/data' },
    })
  }

  async loadData() {
    const data = await this.dataSource.load()
    await this.stateManager.dispatch('myModule.setData', data)
    this.eventBus.emit('dataLoaded', data)
    return data
  }
}

// MyComponent.vue
export default {
  setup() {
    const container = inject('container')
    const controller = new MyComponentController(
      container.resolve(DataFlowEngine),
      container.resolve(StateManager),
      container.resolve(EventBus)
    )

    return { controller }
  },
}
```

### 使用依赖注入

```typescript
// 1. 定义服务
class MyService {
  constructor(
    private apiClient: ApiClient,
    private logger: ILogger
  ) {}

  async fetchData() {
    this.logger.info('Fetching data...')
    const response = await this.apiClient.get('/api/data')
    return response.data
  }
}

// 2. 注册服务
container.register(
  MyService,
  {
    useClass: MyService,
    deps: [ApiClient, Logger],
  },
  { lifetime: ServiceLifetime.Singleton }
)

// 3. 使用服务
const myService = container.resolve(MyService)
const data = await myService.fetchData()
```

## 常见问题

### Q1: 如何处理循环依赖?

**A**: 使用工厂函数或延迟注入:

```typescript
// 使用工厂函数
container.register(ServiceA, {
  useFactory: container => {
    const serviceB = () => container.resolve(ServiceB)
    return new ServiceA(serviceB)
  },
})
```

### Q2: 如何迁移现有的Pinia stores?

**A**: 使用适配器模式:

```typescript
// 创建适配器
class PiniaAdapter {
  constructor(private stateManager: StateManager) {}

  adaptStore(piniaStore: any) {
    this.stateManager.registerModule({
      name: piniaStore.$id,
      state: piniaStore.$state,
      // 适配actions和mutations
    })
  }
}
```

### Q3: 性能会受影响吗?

**A**: 新架构经过优化,性能应该更好:

- 懒加载减少初始加载时间
- 虚拟滚动优化大列表渲染
- 多级缓存减少重复请求
- Web Worker处理计算密集任务

### Q4: 如何回滚到旧版本?

**A**: 使用版本管理器的回滚功能:

```typescript
const rolledBackData = await versionManager.rollback(currentData, '1.0.0')
```

### Q5: 兼容层会一直保留吗?

**A**: 不会。兼容层是临时方案,建议在迁移完成后移除:

1. 阶段1: 启用兼容层 (v2.0)
2. 阶段2: 逐步迁移代码 (v2.0-v2.2)
3. 阶段3: 移除兼容层 (v3.0)

## 迁移工具

### 自动化迁移脚本

```typescript
// migrate.ts
import { VersionManager, registerAllMigrations } from '@/core/version'
import { ApiCompatLayer } from '@/core/compat'

async function migrateProject() {
  console.log('Starting project migration...')

  // 1. 创建版本管理器
  const versionManager = new VersionManager({
    currentVersion: '2.0.0',
    autoMigrate: true,
  })

  registerAllMigrations(versionManager)

  // 2. 迁移数据
  const files = await findAllDataFiles()

  for (const file of files) {
    console.log(`Migrating ${file}...`)
    const data = await readFile(file)
    const migrated = await versionManager.migrate(data)
    await writeFile(file, migrated)
    console.log(`✓ ${file} migrated`)
  }

  console.log('Migration completed!')
}

// 运行迁移
migrateProject().catch(console.error)
```

### 代码扫描工具

```typescript
// scan-deprecated-api.ts
import { glob } from 'glob'
import { readFile } from 'fs/promises'

async function scanDeprecatedAPIs() {
  const files = await glob('src/**/*.{ts,vue}')
  const deprecatedAPIs = ['dataSource.create', 'store.register', 'eventBus.on']

  const results: any[] = []

  for (const file of files) {
    const content = await readFile(file, 'utf-8')

    for (const api of deprecatedAPIs) {
      if (content.includes(api)) {
        results.push({ file, api })
      }
    }
  }

  console.log('Deprecated API usage:')
  results.forEach(r => {
    console.log(`  ${r.file}: ${r.api}`)
  })

  return results
}

scanDeprecatedAPIs()
```

## 获取帮助

- 查看 [API文档](../README.md)
- 查看 [示例项目](../../examples)
- 提交 [Issue](https://github.com/your-repo/issues)
- 加入 [讨论组](https://github.com/your-repo/discussions)

## 相关文档

- [版本管理](./README.md)
- [兼容层](../compat/README.md)
- [特性开关](../features/README.md)
- [依赖注入](../di/README.md)
