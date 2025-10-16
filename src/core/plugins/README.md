# 插件系统

插件系统提供了标准化的插件注册、生命周期管理和依赖解析机制,支持控件插件和设置渲染器插件的扩展。

## 核心概念

### 插件接口 (IPlugin)

所有插件必须实现 `IPlugin` 接口,包含以下核心方法:

- `install()` - 安装插件,注册服务和配置
- `uninstall()` - 卸载插件,清理资源
- `activate()` - 激活插件功能
- `deactivate()` - 停用插件功能

### 插件元数据 (PluginMetadata)

每个插件必须提供元数据,包括:

- `id` - 插件唯一标识符
- `name` - 插件名称
- `version` - 插件版本(遵循语义化版本)
- `dependencies` - 插件依赖列表
- `provides` - 插件提供的功能标识

### 插件状态 (PluginState)

插件有以下状态:

- `Uninstalled` - 未安装
- `Installed` - 已安装但未激活
- `Active` - 已激活
- `Deactivated` - 已停用
- `Error` - 错误状态

## 插件管理器 (PluginManager)

插件管理器负责插件的注册、卸载、激活、停用和依赖管理。

### 基本用法

```typescript
import { PluginManager } from '@/core/plugins'

// 创建插件管理器
const pluginManager = new PluginManager(container, eventBus, config, logger, {
  strictMode: true,
  autoActivate: false,
})

// 注册插件
await pluginManager.register(myPlugin)

// 激活插件
await pluginManager.activate('my-plugin-id')

// 停用插件
await pluginManager.deactivate('my-plugin-id')

// 卸载插件
await pluginManager.unregister('my-plugin-id')
```

### 依赖管理

插件管理器自动处理插件依赖:

- 验证依赖是否满足
- 检查版本兼容性
- 检测循环依赖
- 按依赖顺序加载插件

### 版本检查

支持语义化版本范围:

- `^1.0.0` - 主版本兼容
- `~1.0.0` - 次版本兼容
- `>=1.0.0` - 大于等于
- `1.0.0` - 精确匹配

## 控件插件 (IControlPlugin)

控件插件用于注册自定义控件。

### 创建控件插件

```typescript
import { BaseControlPlugin, defineControl, createVueAdapter } from '@/core/plugins'
import MyControl from './MyControl.vue'

class MyControlPlugin extends BaseControlPlugin {
  metadata = {
    id: 'my-control-plugin',
    name: 'My Control Plugin',
    version: '1.0.0',
  }

  registerControls() {
    return [
      defineControl({
        kind: 'my-control',
        kindName: '我的控件',
        category: ControlCategory.Custom,
        icon: 'custom-icon',
        component: createVueAdapter(MyControl),
        properties: [
          {
            key: 'label',
            name: '标签',
            type: 'string',
            defaultValue: '',
          },
        ],
        events: [
          {
            name: 'click',
            description: '点击事件',
          },
        ],
        dataBinding: {
          enabled: true,
          property: 'value',
          mode: 'two-way',
        },
      }),
    ]
  }
}
```

### 控件注册表 (ControlRegistry)

```typescript
import { ControlRegistry } from '@/core/plugins'

const registry = new ControlRegistry()

// 注册插件
registry.registerPlugin(myControlPlugin)

// 获取控件
const control = registry.getControl('my-control')

// 获取所有控件
const allControls = registry.getAllControls()

// 按分类获取控件
const inputControls = registry.getAllControls(ControlCategory.Input)

// 懒加载控件
const control = await registry.lazyLoadControl('my-control', async () => {
  const module = await import('./MyControl.vue')
  return defineControl({
    // ...
  })
})
```

## 设置渲染器插件 (ISettingRendererPlugin)

设置渲染器插件用于注册自定义属性面板渲染器。

### 创建设置渲染器插件

```typescript
import { BaseSettingRendererPlugin, defineSettingRenderer } from '@/core/plugins'
import MyRenderer from './MyRenderer.vue'

class MySettingRendererPlugin extends BaseSettingRendererPlugin {
  metadata = {
    id: 'my-renderer-plugin',
    name: 'My Renderer Plugin',
    version: '1.0.0',
  }

  registerRenderers() {
    return [
      defineSettingRenderer({
        type: 'my-renderer',
        name: '我的渲染器',
        component: MyRenderer,
        description: '自定义渲染器',
        supportedTypes: ['string', 'number'],
      }),
    ]
  }

  registerPanels() {
    return [
      {
        id: 'my-panel',
        title: '我的面板',
        fields: [
          {
            key: 'myField',
            label: '我的字段',
            renderer: 'my-renderer',
            defaultValue: '',
          },
        ],
      },
    ]
  }
}
```

### 设置渲染器注册表 (SettingRendererRegistry)

```typescript
import { SettingRendererRegistry } from '@/core/plugins'

const registry = new SettingRendererRegistry()

// 注册插件
registry.registerPlugin(myRendererPlugin)

// 获取渲染器
const renderer = registry.getRenderer('my-renderer')

// 获取面板
const panel = registry.getPanel('my-panel')

// 按分组获取字段
const fieldsByGroup = registry.getFieldsByGroup('my-panel')
```

## 插件上下文 (PluginContext)

插件上下文提供插件运行时所需的核心服务:

```typescript
interface PluginContext {
  container: IContainer // 依赖注入容器
  eventBus: IEventBus // 事件总线
  config: IConfigManager // 配置管理器
  logger: ILogger // 日志器
  pluginManager: IPluginManager // 插件管理器引用
}
```

## 事件

插件系统发布以下事件:

- `plugin:registered` - 插件已注册
- `plugin:unregistered` - 插件已卸载
- `plugin:activated` - 插件已激活
- `plugin:deactivated` - 插件已停用

### 监听插件事件

```typescript
eventBus.on('plugin:activated', ({ pluginId }) => {
  console.log(`Plugin ${pluginId} activated`)
})
```

## 错误处理

插件系统提供以下错误类型:

- `PluginError` - 通用插件错误
- `PluginDependencyError` - 依赖错误
- `PluginVersionConflictError` - 版本冲突错误
- `PluginAlreadyExistsError` - 插件已存在错误
- `PluginNotFoundError` - 插件未找到错误
- `PluginCircularDependencyError` - 循环依赖错误

## 最佳实践

### 1. 使用基础插件类

继承 `BaseControlPlugin` 或 `BaseSettingRendererPlugin` 简化插件开发:

```typescript
class MyPlugin extends BaseControlPlugin {
  // 只需实现必要的方法
  registerControls() {
    return [...]
  }

  // 可选的生命周期钩子
  protected async onInstall(context: PluginContext) {
    // 安装逻辑
  }
}
```

### 2. 声明依赖

明确声明插件依赖:

```typescript
metadata = {
  id: 'my-plugin',
  name: 'My Plugin',
  version: '1.0.0',
  dependencies: [
    {
      pluginId: 'base-plugin',
      version: '^1.0.0',
      optional: false,
    },
  ],
}
```

### 3. 使用辅助函数

使用辅助函数简化定义:

```typescript
// 定义控件
const control = defineControl({
  kind: 'my-control',
  // ...
})

// 定义渲染器
const renderer = defineSettingRenderer({
  type: 'my-renderer',
  // ...
})

// 定义面板
const panel = defineSettingPanel({
  id: 'my-panel',
  // ...
})
```

### 4. 懒加载

对于大型控件,使用懒加载:

```typescript
registry.lazyLoadControl('heavy-control', async () => {
  const module = await import('./HeavyControl.vue')
  return defineControl({
    // ...
  })
})
```

### 5. 健康检查

实现健康检查方法:

```typescript
async healthCheck(): Promise<PluginHealthStatus> {
  return {
    healthy: true,
    message: 'Plugin is running normally',
    details: {
      controlsRegistered: 10,
      activeConnections: 5,
    },
  }
}
```

## 示例

完整的插件示例请参考:

- `src/core/plugins/examples/` - 示例插件
- `src/core/data/plugins/builtin/` - 内置数据源插件

## 架构图

```
┌─────────────────────────────────────────────────────────┐
│                    PluginManager                         │
│  - 注册/卸载插件                                          │
│  - 依赖解析                                               │
│  - 生命周期管理                                           │
└─────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ControlPlugin │  │RendererPlugin│  │CustomPlugin  │
│              │  │              │  │              │
│- 控件注册    │  │- 渲染器注册  │  │- 自定义功能  │
│- 事件处理    │  │- 面板定义    │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│ControlRegistry│ │RendererRegistry│ │CustomRegistry│
└──────────────┘  └──────────────┘  └──────────────┘
```

## 相关文档

- [依赖注入系统](../di/README.md)
- [事件总线系统](../events/README.md)
- [配置管理系统](../config/README.md)
- [日志系统](../logging/README.md)
