# 任务 3.4 设计方案 - 重构控件渲染器

## 概述

本任务旨在重构现有的控件渲染器,使用新的框架适配器系统,实现框架无关的渲染逻辑。

## 当前状态

现有的控件渲染器(`src/core/renderer/control-renderer.vue`)直接依赖Vue,耦合度高:

- 直接使用Vue组件
- 硬编码的Vue特性
- 难以支持其他框架
- 测试困难

## 重构目标

1. **框架无关**: 使用适配器模式解耦框架依赖
2. **易于测试**: 清晰的接口,易于Mock
3. **高性能**: 利用批量更新和虚拟滚动
4. **向后兼容**: 保持现有API不变

## 设计方案

### 1. 新的控件渲染器架构

```
┌─────────────────────────────────────┐
│   ControlRenderer (Vue Component)   │
│  - 使用RenderEngine渲染控件         │
│  - 处理用户交互                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│        RenderEngine                 │
│  - 控件到组件的转换                 │
│  - 批量更新优化                     │
└─────────────────────────────────────┘
              ↓
┌─────────────────────────────────────┐
│    VueFrameworkAdapter              │
│  - Vue特定的渲染逻辑                │
│  - 组件生命周期管理                 │
└─────────────────────────────────────┘
```

### 2. 控件渲染器接口

```typescript
interface IControlRenderer {
  /** 渲染控件 */
  render(control: Control, container: HTMLElement): void

  /** 更新控件 */
  update(controlId: string, props: Partial<Control>): void

  /** 批量更新 */
  batchUpdate(updates: ControlUpdate[]): void

  /** 卸载控件 */
  unmount(controlId: string): void

  /** 获取控件实例 */
  getInstance(controlId: string): ComponentInstance | undefined
}
```

### 3. 重构步骤

#### 步骤1: 创建新的控件渲染器服务

```typescript
// src/core/renderer/ControlRendererService.ts
export class ControlRendererService implements IControlRenderer {
  private engine: RenderEngine

  constructor(adapter: IFrameworkAdapter) {
    this.engine = new RenderEngine(adapter)
  }

  render(control: Control, container: HTMLElement): void {
    this.engine.render(control, container)
  }

  update(controlId: string, props: Partial<Control>): void {
    this.engine.update(controlId, props)
  }

  batchUpdate(updates: ControlUpdate[]): void {
    this.engine.batchUpdate(updates)
  }

  unmount(controlId: string): void {
    this.engine.unmount(controlId)
  }
}
```

#### 步骤2: 更新Vue控件渲染器组件

```vue
<!-- src/core/renderer/control-renderer.vue -->
<template>
  <div ref="containerRef" class="control-renderer"></div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { VueFrameworkAdapter } from './adapters'
import { ControlRendererService } from './ControlRendererService'

const props = defineProps<{
  control: Control
}>()

const containerRef = ref<HTMLElement>()
let rendererService: ControlRendererService | null = null

onMounted(() => {
  if (!containerRef.value) return

  // 创建渲染服务
  const adapter = new VueFrameworkAdapter()
  rendererService = new ControlRendererService(adapter)

  // 渲染控件
  rendererService.render(props.control, containerRef.value)
})

watch(
  () => props.control,
  newControl => {
    if (rendererService) {
      rendererService.update(newControl.id, newControl)
    }
  },
  { deep: true }
)

onBeforeUnmount(() => {
  if (rendererService && props.control) {
    rendererService.unmount(props.control.id)
  }
})
</script>
```

#### 步骤3: 集成虚拟滚动

对于列表类控件,集成虚拟滚动:

```vue
<template>
  <VirtualList v-if="isListControl" :items="control.children" :item-height="50" #default="{ item }">
    <ControlRenderer :control="item" />
  </VirtualList>
  <div v-else ref="containerRef"></div>
</template>
```

#### 步骤4: 批量更新优化

```typescript
// 收集更新
const updates: ControlUpdate[] = []

controls.forEach(control => {
  if (needsUpdate(control)) {
    updates.push({
      controlId: control.id,
      props: getUpdatedProps(control),
    })
  }
})

// 批量更新
rendererService.batchUpdate(updates)
```

### 4. 兼容性策略

#### 保持现有API

```typescript
// 旧API
<control-renderer :control="control" />

// 新API(相同)
<control-renderer :control="control" />
```

#### 渐进式迁移

1. 新控件使用新渲染器
2. 旧控件保持兼容
3. 逐步迁移旧控件

#### 特性开关

```typescript
const useNewRenderer = config.get('features.newRenderer', false)

if (useNewRenderer) {
  // 使用新渲染器
} else {
  // 使用旧渲染器
}
```

### 5. 性能优化

#### 批量更新

```typescript
// 收集所有更新
const updates = collectUpdates()

// 一次性批量更新
rendererService.batchUpdate(updates)
```

#### 虚拟滚动

```typescript
// 对于大列表使用虚拟滚动
if (control.children.length > 100) {
  return <VirtualList items={control.children} />
}
```

#### 懒加载

```typescript
// 延迟加载非可见控件
if (isVisible(control)) {
  rendererService.render(control, container)
}
```

### 6. 测试策略

#### 单元测试

```typescript
describe('ControlRendererService', () => {
  it('should render control', () => {
    const adapter = new MockAdapter()
    const service = new ControlRendererService(adapter)

    service.render(mockControl, mockContainer)

    expect(adapter.createComponent).toHaveBeenCalled()
  })
})
```

#### 集成测试

```typescript
describe('ControlRenderer Integration', () => {
  it('should render and update control', async () => {
    const wrapper = mount(ControlRenderer, {
      props: { control: mockControl },
    })

    await wrapper.setProps({ control: updatedControl })

    expect(wrapper.html()).toContain('updated')
  })
})
```

## 实施计划

### 阶段1: 基础设施 (1-2天)

- [x] 创建框架适配器接口
- [x] 实现Vue框架适配器
- [x] 创建渲染引擎
- [ ] 创建控件渲染器服务

### 阶段2: 重构渲染器 (2-3天)

- [ ] 重构control-renderer.vue
- [ ] 集成虚拟滚动
- [ ] 实现批量更新
- [ ] 添加性能监控

### 阶段3: 测试和优化 (1-2天)

- [ ] 编写单元测试
- [ ] 编写集成测试
- [ ] 性能测试和优化
- [ ] 文档更新

### 阶段4: 迁移和发布 (1-2天)

- [ ] 迁移现有控件
- [ ] 兼容性测试
- [ ] 发布新版本
- [ ] 监控和反馈

## 风险和挑战

### 风险1: 兼容性问题

**缓解措施**:

- 保持API不变
- 提供兼容层
- 渐进式迁移

### 风险2: 性能回归

**缓解措施**:

- 性能基准测试
- 持续监控
- 优化热点代码

### 风险3: 学习曲线

**缓解措施**:

- 完善文档
- 提供示例
- 团队培训

## 成功标准

1. ✅ 所有现有功能正常工作
2. ✅ 性能提升20%以上
3. ✅ 测试覆盖率80%以上
4. ✅ 文档完善
5. ✅ 团队认可

## 相关文档

- [框架适配器文档](../../src/core/renderer/adapters/README.md)
- [虚拟滚动文档](../../src/core/renderer/virtual/README.md)
- [架构设计文档](./design.md)
