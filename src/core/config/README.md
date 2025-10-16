# 配置管理系统

强大的配置管理系统,支持多环境、多源、热更新、验证等功能。

## 核心特性

- ✅ 多环境支持 (development, production, test, staging)
- ✅ 多配置源 (对象、环境变量、JSON文件、LocalStorage、远程API)
- ✅ 配置热更新
- ✅ 配置验证和模式定义
- ✅ 配置变更监听
- ✅ 嵌套配置访问
- ✅ 默认值支持
- ✅ 类型安全

## 快速开始

### 基础使用

```typescript
import { ConfigManager, ObjectConfigSource } from '@/core/config'

// 创建配置管理器
const config = new ConfigManager()

// 添加配置源
config.addSource(
  new ObjectConfigSource('default', {
    api: {
      baseUrl: 'https://api.example.com',
      timeout: 5000,
    },
    features: {
      enableAnalytics: true,
    },
  })
)

// 加载配置
await config.reload()

// 获取配置
const baseUrl = config.get('api.baseUrl')
const timeout = config.get<number>('api.timeout', 3000)

// 设置配置
config.set('features.enableAnalytics', false)
```

### 使用全局配置

```typescript
import { globalConfig } from '@/core/config'

// 直接使用全局实例
const value = globalConfig.get('some.key', 'default')
```

## 配置源

### 1. 对象配置源

```typescript
import { ObjectConfigSource } from '@/core/config'

const source = new ObjectConfigSource(
  'app',
  {
    app: {
      name: 'My App',
      version: '1.0.0',
    },
  },
  0
) // 优先级为0

config.addSource(source)
```

### 2. 环境变量配置源

```typescript
import { EnvironmentConfigSource } from '@/core/config'

// 从环境变量加载配置
// APP_API_BASE_URL -> api.baseUrl
const source = new EnvironmentConfigSource('APP_')

config.addSource(source)
```

### 3. JSON文件配置源

```typescript
import { JsonFileConfigSource } from '@/core/config'

const source = new JsonFileConfigSource(
  'config-file',
  '/config/app.json',
  50 // 优先级
)

config.addSource(source)
```

### 4. LocalStorage配置源

```typescript
import { LocalStorageConfigSource } from '@/core/config'

const source = new LocalStorageConfigSource('app-config')

config.addSource(source)

// 保存配置到LocalStorage
source.save({ theme: 'dark' })
```

### 5. 远程配置源

```typescript
import { RemoteConfigSource } from '@/core/config'

const source = new RemoteConfigSource(
  'remote',
  'https://api.example.com/config',
  75, // 优先级
  60000 // 轮询间隔(毫秒)
)

config.addSource(source)
```

### 6. 合并配置源

```typescript
import { MergedConfigSource, ObjectConfigSource } from '@/core/config'

const source = new MergedConfigSource('merged', [
  new ObjectConfigSource('default', defaultConfig),
  new ObjectConfigSource('override', overrideConfig),
])

config.addSource(source)
```

## 配置验证

### 定义配置模式

```typescript
import { ConfigSchema } from '@/core/config'

const schema: ConfigSchema = {
  'api.baseUrl': {
    type: 'string',
    required: true,
    pattern: /^https?:\/\//,
    description: 'API base URL',
  },
  'api.timeout': {
    type: 'number',
    default: 5000,
    min: 1000,
    max: 30000,
    description: 'API timeout in milliseconds',
  },
  'features.enableAnalytics': {
    type: 'boolean',
    default: false,
    description: 'Enable analytics tracking',
  },
  'app.environment': {
    type: 'string',
    enum: ['development', 'production', 'test'],
    required: true,
    description: 'Application environment',
  },
}

config.setSchema(schema)
```

### 自定义验证

```typescript
const schema: ConfigSchema = {
  'user.email': {
    type: 'string',
    required: true,
    validate: value => {
      if (typeof value !== 'string') return false
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    },
  },
  'user.age': {
    type: 'number',
    validate: value => {
      if (typeof value !== 'number') return 'Must be a number'
      if (value < 0) return 'Must be positive'
      if (value > 150) return 'Must be less than 150'
      return true
    },
  },
}
```

### 验证配置

```typescript
const result = config.validate()

if (!result.valid) {
  console.error('Config validation failed:', result.errors)
  result.errors?.forEach(error => {
    console.error(`- ${error.path}: ${error.message}`)
  })
}
```

## 配置监听

### 监听特定键

```typescript
const unwatch = config.watch('api.baseUrl', event => {
  console.log('API base URL changed:', {
    oldValue: event.oldValue,
    newValue: event.newValue,
    source: event.source,
    timestamp: event.timestamp,
  })
})

// 取消监听
unwatch()
```

### 监听所有变更

```typescript
const unwatch = config.watchAll(event => {
  console.log(`Config changed: ${event.key}`, event)
})

// 取消监听
unwatch()
```

## 环境管理

```typescript
// 获取当前环境
const env = config.getEnvironment() // 'development' | 'production' | 'test' | 'staging'

// 设置环境
config.setEnvironment('production')

// 根据环境加载不同配置
const apiUrl = config.get(env === 'production' ? 'api.production.baseUrl' : 'api.development.baseUrl')
```

## 高级用法

### 配置优先级

配置源按优先级合并,数字越大优先级越高:

```typescript
config.addSource(new ObjectConfigSource('default', defaultConfig, 0))
config.addSource(new JsonFileConfigSource('file', '/config.json', 50))
config.addSource(new EnvironmentConfigSource('APP_', 100))
config.addSource(new LocalStorageConfigSource('app-config', 200))
```

优先级顺序: LocalStorage > Environment > File > Default

### 热更新

```typescript
const config = new ConfigManager({
  enableHotReload: true, // 启用热更新
})

// 配置源支持watch时,会自动监听变化并重新加载
config.addSource(new JsonFileConfigSource('config', '/config.json'))
```

### 配置合并

```typescript
// 合并新配置
config.merge({
  api: {
    timeout: 10000, // 只更新timeout,保留其他api配置
  },
  newFeature: {
    enabled: true,
  },
})
```

### 重置配置

```typescript
// 重置所有配置
config.reset()

// 重新加载
await config.reload()
```

## 完整示例

```typescript
import { ConfigManager, ObjectConfigSource, EnvironmentConfigSource, LocalStorageConfigSource, ConfigSchema } from '@/core/config'

// 定义配置模式
const schema: ConfigSchema = {
  'api.baseUrl': {
    type: 'string',
    required: true,
    pattern: /^https?:\/\//,
  },
  'api.timeout': {
    type: 'number',
    default: 5000,
    min: 1000,
    max: 30000,
  },
  'features.darkMode': {
    type: 'boolean',
    default: false,
  },
}

// 创建配置管理器
const config = new ConfigManager({
  environment: 'development',
  schema,
  enableHotReload: true,
  enableValidation: true,
  enableDebug: true,
})

// 添加配置源
config.addSource(
  new ObjectConfigSource(
    'default',
    {
      api: {
        baseUrl: 'https://api.example.com',
        timeout: 5000,
      },
      features: {
        darkMode: false,
      },
    },
    0
  )
)

config.addSource(new EnvironmentConfigSource('APP_', 100))
config.addSource(new LocalStorageConfigSource('app-config', 200))

// 加载配置
await config.reload()

// 验证配置
const validation = config.validate()
if (!validation.valid) {
  console.error('Config validation failed:', validation.errors)
}

// 监听配置变化
config.watch('features.darkMode', event => {
  console.log('Dark mode changed:', event.newValue)
  // 更新UI主题
  updateTheme(event.newValue as boolean)
})

// 使用配置
const apiClient = createApiClient({
  baseUrl: config.get('api.baseUrl'),
  timeout: config.get<number>('api.timeout'),
})

// 更新配置
config.set('features.darkMode', true)
```

## API 参考

### ConfigManager

#### 构造函数

```typescript
new ConfigManager(options?: ConfigManagerOptions)
```

#### 方法

- `get<T>(key: string, defaultValue?: T): T` - 获取配置值
- `set(key: string, value: ConfigValue): void` - 设置配置值
- `has(key: string): boolean` - 检查配置键是否存在
- `getAll(): ConfigObject` - 获取所有配置
- `merge(config: ConfigObject): void` - 合并配置
- `reset(): void` - 重置配置
- `watch(key: string, listener: ConfigChangeListener): () => void` - 监听配置变化
- `watchAll(listener: ConfigChangeListener): () => void` - 监听所有配置变化
- `addSource(source: IConfigSource): void` - 添加配置源
- `removeSource(name: string): void` - 移除配置源
- `reload(): Promise<void>` - 重新加载配置
- `validate(): ValidationResult` - 验证配置
- `setSchema(schema: ConfigSchema): void` - 设置配置模式
- `getEnvironment(): Environment` - 获取当前环境
- `setEnvironment(env: Environment): void` - 设置环境

### IConfigSource

#### 接口

```typescript
interface IConfigSource {
  readonly name: string
  readonly priority: number
  load(): Promise<ConfigObject>
  watch?(callback: (config: ConfigObject) => void): () => void
}
```

## 最佳实践

### 1. 使用配置模式

始终定义配置模式以确保类型安全和验证:

```typescript
const schema: ConfigSchema = {
  'api.baseUrl': {
    type: 'string',
    required: true,
    description: 'API base URL',
  },
}

config.setSchema(schema)
```

### 2. 合理设置优先级

按照从低到高的顺序设置优先级:

- 默认配置: 0
- 文件配置: 50
- 远程配置: 75
- 环境变量: 100
- 用户配置: 200

### 3. 使用环境变量

敏感信息应该通过环境变量配置:

```typescript
// .env
APP_API_KEY=secret-key
APP_API_BASE_URL=https://api.example.com

// 代码中
config.addSource(new EnvironmentConfigSource('APP_'))
const apiKey = config.get('api.key')
```

### 4. 监听关键配置

监听关键配置的变化并及时响应:

```typescript
config.watch('api.baseUrl', event => {
  // 重新初始化API客户端
  reinitializeApiClient(event.newValue)
})
```

### 5. 提供默认值

始终为配置提供合理的默认值:

```typescript
const timeout = config.get<number>('api.timeout', 5000)
```

## 故障排查

### 配置未生效

1. 检查配置源优先级
2. 检查配置键路径是否正确
3. 启用调试日志查看详细信息

### 验证失败

1. 检查配置模式定义
2. 查看验证错误详情
3. 确保配置值类型正确

### 热更新不工作

1. 确保启用了热更新选项
2. 检查配置源是否支持watch
3. 查看控制台错误信息

## 性能考虑

1. **配置缓存**: 配置值会被缓存,读取性能很高
2. **懒加载**: 配置源按需加载
3. **批量更新**: 使用merge进行批量更新
4. **监听优化**: 只监听需要的配置键

## 示例

完整示例请参考项目中的使用场景。
