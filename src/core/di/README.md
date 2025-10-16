# 依赖注入容器 (Dependency Injection Container)

## 概述

这是一个轻量级、类型安全的依赖注入容器实现,支持多种服务生命周期和灵活的服务注册方式。

## 特性

- ✅ 类型安全的服务注册和解析
- ✅ 支持三种生命周期: Singleton, Transient, Scoped
- ✅ 循环依赖检测
- ✅ 父子容器支持
- ✅ 装饰器支持
- ✅ 标签分组
- ✅ 多种提供者类型

## 快速开始

### 基本用法

```typescript
import { Container, ServiceLifetime } from '@/core/di'

// 创建容器
const container = new Container()

// 定义服务
class Logger {
  log(message: string) {
    console.log(message)
  }
}

class HttpClient {
  constructor(private logger: Logger) {}

  async get(url: string) {
    this.logger.log(`GET ${url}`)
    // ...
  }
}

// 注册服务
container.register(
  Logger,
  {
    useClass: Logger,
  },
  { lifetime: ServiceLifetime.Singleton }
)

container.register(
  HttpClient,
  {
    useClass: HttpClient,
    deps: [Logger],
  },
  { lifetime: ServiceLifetime.Singleton }
)

// 解析服务
const http = container.resolve(HttpClient)
await http.get('/api/users')
```

### 使用装饰器

```typescript
import { Injectable, Inject } from '@/core/di'

@Injectable({ lifetime: ServiceLifetime.Singleton })
class Logger {
  log(message: string) {
    console.log(message)
  }
}

@Injectable({ lifetime: ServiceLifetime.Singleton })
class HttpClient {
  constructor(@Inject(Logger) private logger: Logger) {}

  async get(url: string) {
    this.logger.log(`GET ${url}`)
    // ...
  }
}

// 服务已自动注册,直接解析
import { globalContainer } from '@/core/di'
const http = globalContainer.resolve(HttpClient)
```

## 服务生命周期

### Singleton (单例)

整个应用生命周期内只创建一次实例。

```typescript
container.register(
  MyService,
  {
    useClass: MyService,
  },
  { lifetime: ServiceLifetime.Singleton }
)

const instance1 = container.resolve(MyService)
const instance2 = container.resolve(MyService)
console.log(instance1 === instance2) // true
```

### Transient (瞬态)

每次解析都创建新实例。

```typescript
container.register(
  MyService,
  {
    useClass: MyService,
  },
  { lifetime: ServiceLifetime.Transient }
)

const instance1 = container.resolve(MyService)
const instance2 = container.resolve(MyService)
console.log(instance1 === instance2) // false
```

### Scoped (作用域)

在同一作用域(子容器)内共享实例。

```typescript
container.register(
  MyService,
  {
    useClass: MyService,
  },
  { lifetime: ServiceLifetime.Scoped }
)

const scope1 = container.createChild()
const instance1 = scope1.resolve(MyService)
const instance2 = scope1.resolve(MyService)
console.log(instance1 === instance2) // true

const scope2 = container.createChild()
const instance3 = scope2.resolve(MyService)
console.log(instance1 === instance3) // false
```

## 提供者类型

### 类提供者 (ClassProvider)

```typescript
container.register(MyService, {
  useClass: MyServiceImpl,
  deps: [Dependency1, Dependency2],
})
```

### 工厂提供者 (FactoryProvider)

```typescript
container.register(MyService, {
  useFactory: (dep1, dep2) => new MyService(dep1, dep2),
  deps: [Dependency1, Dependency2],
})
```

### 值提供者 (ValueProvider)

```typescript
const config = { apiUrl: 'https://api.example.com' }
container.register('Config', {
  useValue: config,
})
```

### 别名提供者 (AliasProvider)

```typescript
container.register(IMyService, {
  useClass: MyServiceImpl,
})

container.register('MyService', {
  useAlias: IMyService,
})
```

## 高级功能

### 标签分组

```typescript
container.register(
  Plugin1,
  {
    useClass: Plugin1,
  },
  { tags: ['plugin'] }
)

container.register(
  Plugin2,
  {
    useClass: Plugin2,
  },
  { tags: ['plugin'] }
)

// 获取所有插件
const plugins = container.getByTag('plugin')
```

### 父子容器

```typescript
const parent = new Container()
parent.register(SharedService, { useClass: SharedService })

const child = parent.createChild()
child.register(ChildService, { useClass: ChildService })

// 子容器可以解析父容器的服务
const shared = child.resolve(SharedService)
```

### 循环依赖检测

```typescript
// 这会抛出 CircularDependencyError
class ServiceA {
  constructor(b: ServiceB) {}
}

class ServiceB {
  constructor(a: ServiceA) {}
}

container.register(ServiceA, {
  useClass: ServiceA,
  deps: [ServiceB],
})

container.register(ServiceB, {
  useClass: ServiceB,
  deps: [ServiceA],
})

// 抛出: CircularDependencyError
container.resolve(ServiceA)
```

## 最佳实践

1. **使用接口作为Token**: 提高代码的可测试性和灵活性
2. **优先使用Singleton**: 除非有特殊需求,否则使用单例模式
3. **避免循环依赖**: 通过重构代码结构避免循环依赖
4. **使用装饰器**: 在支持的环境中使用装饰器简化代码
5. **合理使用标签**: 使用标签对相关服务进行分组管理

## API参考

### Container

- `register<T>(token, provider, options)` - 注册服务
- `resolve<T>(token)` - 解析服务
- `tryResolve<T>(token)` - 尝试解析服务
- `has(token)` - 检查服务是否已注册
- `createChild()` - 创建子容器
- `getDescriptors()` - 获取所有服务描述符
- `getByTag<T>(tag)` - 根据标签获取服务
- `clear()` - 清空容器
- `dispose()` - 销毁容器

### 装饰器

- `@Injectable(options)` - 标记类为可注入服务
- `@Inject(token)` - 标记构造函数参数的依赖注入

## 注意事项

1. 装饰器需要在 `tsconfig.json` 中启用:

   ```json
   {
     "compilerOptions": {
       "experimentalDecorators": true,
       "emitDecoratorMetadata": true
     }
   }
   ```

2. 需要安装 `reflect-metadata`:

   ```bash
   npm install reflect-metadata
   ```

3. 在应用入口导入:
   ```typescript
   import 'reflect-metadata'
   ```
