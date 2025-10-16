# 框架适配器系统

框架适配器系统提供了框架无关的渲染引擎抽象,使低代码平台能够支持多种前端框架(Vue、React、Angular等)。

## 架构概览

```
┌─────────────────────────────────────────┐
│         IRenderEngine                    │
│  (高层次渲染API)                         │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│      IFrameworkAdapter                   │
│  (框架适配器接口)                        │
└─────────────────────────────────────────┘
                  ↓
┌──────────────┬──────────────┬───────────┐
│ VueAdapter   │ ReactAdapter │  其他...   │
│ (Vue 3)      │ (React 18)   │           │
└──────────────┴──────────────┴───────────┘
```

## 核心概念

### 1. 框架适配器 (IFrameworkAdapter)

框架适配器定义了框架无关的渲染接口,包括:

- **组件管理**: 注册、创建、获取组件
- **生命周期**: 挂载、更新、卸载组件
- **批量操作**: 批量更新组件
- **实例管理**: 管理组件实例

### 2. 渲染引擎 (IRenderEngine)

渲染引擎提供高层次的渲染API,基于框架适配器实现:

- **控件渲染**: 将控件定义渲染为组件
- **属性更新**: 更新控件属性
- **批量更新**: 批量更新多个控件
- **性能统计**: 收集渲染性能数据

### 3. 组件实例 (ComponentInstance)

组件实例表示一个已创建的组件:

```typescript
interface ComponentInstance {
  id: string // 组件唯一标识
  type: string // 组件类型
  instance: any // 组件实例引用
  container: HTMLElement // 挂载的容器
  props: Record<string, any> // 组件属性
}
```

## 快速开始

### 1. 创建Vue适配器

```typescript
import { VueFrameworkAdapter } from '@/core/renderer/adapters'

// 创建适配器
const adapter = new VueFrameworkAdapter()

// 注册组件
adapter.registerComponent({
  type: 'Button',
  component: ButtonComponent,
  defaultProps: {
    type: 'primary',
    size: 'medium',
  },
})
```

### 2. 创建渲染引擎

```typescript
import { RenderEngine } from '@/core/renderer/adapters'

// 创建渲染引擎
const engine = new RenderEngine(adapter)

// 渲染控件
const control = {
  id: 'btn-1',
  kind: 'Button',
  properties: {
    text: 'Click Me',
    type: 'primary',
  },
}

const instance = engine.render(control, containerElement)
```

### 3. 更新控件

```typescript
// 更新单个控件
engine.update('btn-1', {
  properties: {
    text: 'Updated Text',
  },
})

// 批量更新
engine.batchUpdate([
  {
    controlId: 'btn-1',
    props: { properties: { text: 'Button 1' } },
  },
  {
    controlId: 'btn-2',
    props: { properties: { text: 'Button 2' } },
  },
])
```

### 4. 卸载控件

```typescript
// 卸载单个控件
engine.unmount('btn-1')

// 销毁渲染引擎(卸载所有控件)
engine.destroy()
```

## 生命周期钩子

框架适配器支持完整的组件生命周期钩子:

```typescript
adapter.registerComponent({
  type: 'MyComponent',
  component: MyComponent,
  hooks: {
    beforeMount: props => {
      console.log('Before mount:', props)
    },
    mounted: instance => {
      console.log('Mounted:', instance.id)
    },
    beforeUpdate: (newProps, oldProps) => {
      console.log('Before update:', newProps, oldProps)
    },
    updated: instance => {
      console.log('Updated:', instance.id)
    },
    beforeUnmount: instance => {
      console.log('Before unmount:', instance.id)
    },
    unmounted: () => {
      console.log('Unmounted')
    },
  },
})
```

## 批量更新

批量更新可以提高性能,减少重复渲染:

```typescript
// 方式1: 使用batch选项
engine.update('btn-1', { text: 'Text 1' }, { batch: true })
engine.update('btn-2', { text: 'Text 2' }, { batch: true })
// 更新会在下一个微任务中批量执行

// 方式2: 使用batchUpdate方法
engine.batchUpdate([
  { controlId: 'btn-1', props: { text: 'Text 1' } },
  { controlId: 'btn-2', props: { text: 'Text 2' } },
])
```

## 性能统计

渲染引擎提供性能统计功能:

```typescript
const stats = engine.getStats()

console.log('Total renders:', stats.totalRenders)
console.log('Total updates:', stats.totalUpdates)
console.log('Average render time:', stats.averageRenderTime, 'ms')
console.log('Average update time:', stats.averageUpdateTime, 'ms')
console.log('Mounted components:', stats.mountedComponents)

// 重置统计
engine.resetStats()
```

## 扩展适配器

### 创建自定义适配器

```typescript
import { BaseFrameworkAdapter } from '@/core/renderer/adapters'

class ReactFrameworkAdapter extends BaseFrameworkAdapter {
  readonly name = 'react' as const
  readonly version = '18.x'

  protected createComponentInstance(definition, props, options) {
    // 实现React组件创建逻辑
    const id = this.generateId()
    const element = React.createElement(definition.component, props)

    return {
      id,
      type: definition.type,
      instance: element,
      container: null as any,
      props,
    }
  }

  protected mountComponent(component, container) {
    // 实现React组件挂载逻辑
    const root = ReactDOM.createRoot(container)
    root.render(component.instance)
    component.instance = root
  }

  protected updateComponent(instance, props, options) {
    // 实现React组件更新逻辑
    const root = instance.instance
    const element = React.createElement(this.components.get(instance.type)!.component, props)
    root.render(element)
  }

  protected unmountComponent(instance) {
    // 实现React组件卸载逻辑
    const root = instance.instance
    root.unmount()
  }
}
```

## 最佳实践

### 1. 组件注册

在应用启动时注册所有组件:

```typescript
// 在应用初始化时
const adapter = new VueFrameworkAdapter()

// 批量注册组件
const components = [
  { type: 'Button', component: ButtonComponent },
  { type: 'Input', component: InputComponent },
  { type: 'Select', component: SelectComponent },
]

components.forEach(comp => adapter.registerComponent(comp))
```

### 2. 错误处理

使用try-catch处理渲染错误:

```typescript
try {
  const instance = engine.render(control, container)
} catch (error) {
  console.error('Render error:', error)
  // 显示错误UI或回退方案
}
```

### 3. 内存管理

及时卸载不需要的组件:

```typescript
// 组件不再需要时
engine.unmount(controlId)

// 页面卸载时
onUnmounted(() => {
  engine.destroy()
})
```

### 4. 性能优化

使用批量更新减少重复渲染:

```typescript
// 不推荐: 多次单独更新
controls.forEach(control => {
  engine.update(control.id, control.props)
})

// 推荐: 批量更新
engine.batchUpdate(
  controls.map(control => ({
    controlId: control.id,
    props: control.props,
  }))
)
```

## API参考

### IFrameworkAdapter

```typescript
interface IFrameworkAdapter {
  readonly name: FrameworkType
  readonly version: string

  registerComponent(definition: ComponentDefinition): void
  getComponent(type: string): ComponentDefinition | undefined
  createComponent(type: string, props: any, options?: RenderOptions): ComponentInstance
  mount(component: ComponentInstance, container: HTMLElement): void
  update(componentId: string, props: any, options?: UpdateOptions): void
  batchUpdate(updates: BatchUpdateItem[]): void
  unmount(componentId: string): void
  getInstance(componentId: string): ComponentInstance | undefined
  isMounted(componentId: string): boolean
  destroy(): void
}
```

### IRenderEngine

```typescript
interface IRenderEngine {
  readonly adapter: IFrameworkAdapter

  render(control: Control, container: HTMLElement, options?: RenderOptions): ComponentInstance
  update(controlId: string, props: Partial<Control>, options?: UpdateOptions): void
  batchUpdate(updates: Array<{ controlId: string; props: Partial<Control> }>): void
  unmount(controlId: string): void
  getControlInstance(controlId: string): ComponentInstance | undefined
  destroy(): void
}
```

## 故障排查

### 组件未注册

**错误**: `Component type "XXX" not registered`

**解决**: 确保在使用前注册组件

```typescript
adapter.registerComponent({
  type: 'XXX',
  component: XXXComponent,
})
```

### 组件未找到

**错误**: `Component "xxx-id" not found`

**解决**: 确保组件已经渲染并且ID正确

```typescript
// 检查组件是否已挂载
if (adapter.isMounted(componentId)) {
  adapter.update(componentId, props)
}
```

### 适配器已销毁

**错误**: `Adapter has been destroyed`

**解决**: 不要在适配器销毁后使用它

```typescript
// 创建新的适配器
const adapter = new VueFrameworkAdapter()
const engine = new RenderEngine(adapter)
```

## 相关文档

- [架构设计文档](../../../.kiro/specs/architecture-refactoring/design.md)
- [需求文档](../../../.kiro/specs/architecture-refactoring/requirements.md)
- [任务列表](../../../.kiro/specs/architecture-refactoring/tasks.md)
