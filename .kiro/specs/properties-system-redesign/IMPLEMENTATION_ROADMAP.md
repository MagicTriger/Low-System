# 属性面板系统 - 实施路线图

## 当前状态

✅ **已完成:** 任务1-5 (基础设施层)  
⏳ **待完成:** 任务6-11 (UI层、集成层、优化层)

## 剩余任务实施指南

### 任务6: 实现属性面板UI组件 (关键任务)

#### 6.1 创建FieldRenderer组件

**文件:** `src/core/infrastructure/fields/FieldRenderer.vue`

**核心功能:**

```vue
<template>
  <div class="field-renderer" :class="fieldClasses">
    <label class="field-label">
      {{ config.label }}
      <a-tooltip v-if="config.tooltip" :title="config.tooltip">
        <QuestionCircleOutlined />
      </a-tooltip>
    </label>

    <div class="field-content">
      <!-- 动态加载字段渲染器 -->
      <component :is="rendererComponent" v-model="fieldValue" :config="config" :errors="errors" @validate="handleValidate" />

      <!-- 可视化组件(如果有) -->
      <component v-if="visualizerComponent" :is="visualizerComponent" v-model="fieldValue" :config="config" />
    </div>

    <!-- 错误提示 -->
    <div v-if="hasError" class="field-error">
      {{ errors[0] }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { getPropertyPanelService } from '@core/infrastructure/services'

// Props和逻辑实现...
</script>
```

**关键点:**

- 使用`getPropertyPanelService()`获取服务
- 动态加载字段渲染器和可视化组件
- 实现字段验证和错误显示
- 支持disabled和readonly状态

#### 6.2 创建PanelGroup组件

**文件:** `src/core/renderer/designer/settings/PanelGroup.vue`

**核心功能:**

```vue
<template>
  <div class="panel-group" :class="{ collapsed: !expanded }">
    <div class="panel-header" @click="toggleExpanded">
      <component :is="iconComponent" class="panel-icon" />
      <span class="panel-title">{{ config.title }}</span>
      <DownOutlined :class="{ rotated: expanded }" />
    </div>

    <div v-show="expanded" class="panel-body">
      <div class="fields-grid">
        <div v-for="field in visibleFields" :key="field.key" :class="getFieldClass(field)">
          <FieldRenderer :config="field" :model-value="values[field.key]" @update:model-value="handleFieldUpdate(field.key, $event)" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getPropertyPanelService } from '@core/infrastructure/services'
import FieldRenderer from '@core/infrastructure/fields/FieldRenderer.vue'

// 实现面板折叠、字段过滤(依赖规则)、双列布局...
</script>

<style scoped>
.fields-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px 16px;
}
.span-1 {
  grid-column: span 1;
}
.span-2 {
  grid-column: span 2;
}
</style>
```

**关键点:**

- 实现面板折叠/展开
- 双列网格布局
- 依赖规则检查(使用`service.checkDependency()`)
- 字段值更新事件处理

#### 6.3 重构PropertiesPanel组件

**文件:** `src/core/renderer/designer/settings/PropertiesPanel.vue`

**核心功能:**

```vue
<template>
  <div class="properties-panel">
    <div v-if="!selectedComponent" class="empty-state">
      <EmptyOutlined />
      <p>请选择一个组件</p>
    </div>

    <div v-else class="panel-content">
      <PanelGroup v-for="panel in panels" :key="panel.group" :config="panel" :values="componentProps" @update="handlePropertyUpdate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { getPropertyPanelService } from '@core/infrastructure/services'
import { useStateManager } from '@core/state/helpers'
import PanelGroup from './PanelGroup.vue'

const service = getPropertyPanelService()
const stateManager = useStateManager()

// 获取选中组件
const selectedComponent = computed(() => stateManager.getState('designer/selectedComponent'))

// 获取面板配置
const panels = computed(() => {
  if (!selectedComponent.value) return []
  return service.getPanelsForComponent(selectedComponent.value.type)
})

// 更新属性
function handlePropertyUpdate(key: string, value: any) {
  stateManager.dispatch('designer/updateProperty', { key, value })
}
</script>
```

**关键点:**

- 注入PropertyPanelService
- 监听选中组件状态
- 动态加载面板配置
- 更新到状态管理

---

### 任务7: 集成到现有框架 (关键任务)

#### 7.1 注册服务到DI容器

**文件:** `src/core/migration/CoreServicesIntegration.ts`

```typescript
import { initializePropertyPanelService } from '@core/infrastructure/services'

export async function initializeCoreServices(container: Container) {
  // ... 其他服务初始化

  // 初始化PropertyPanelService
  const propertyPanelService = await initializePropertyPanelService()
  container.register('propertyPanelService', propertyPanelService)

  console.log('[CoreServices] PropertyPanelService registered')
}
```

#### 7.2 更新控件定义接口

**文件:** `src/core/renderer/base.ts`

```typescript
import type { PanelDefinition } from '@core/infrastructure/panels/types'

export interface BaseControlDefinition {
  kind: string
  kindName: string
  // ... 其他字段

  // 新增: 面板配置
  panels?: PanelDefinition
}
```

#### 7.3 更新控件注册流程

**文件:** `src/core/renderer/definitions.ts`

```typescript
import { getPropertyPanelService } from '@core/infrastructure/services'

export function registerControlDefinition(definition: BaseControlDefinition) {
  // 注册控件定义
  ControlDefinitions[definition.kind] = definition

  // 如果有面板配置,注册到PropertyPanelService
  if (definition.panels) {
    const service = getPropertyPanelService()
    service.registerComponentPanel({
      componentType: definition.kind,
      panels: definition.panels.custom || [],
      extends: definition.panels.extends || [],
    })
  }
}
```

#### 7.4 添加辅助函数

**文件:** `src/core/services/helpers.ts`

```typescript
import { getPropertyPanelService } from '@core/infrastructure/services'

export function usePropertyPanelService() {
  return getPropertyPanelService()
}
```

---

### 任务8: 更新组件定义 (示例)

#### 8.1 更新Button组件定义

**文件:** `src/core/renderer/controls/register.ts`

```typescript
import { PanelGroup, FieldType } from '@core/infrastructure/panels/types'

export const ButtonDefinition: BaseControlDefinition = {
  kind: 'button',
  kindName: '按钮',
  // ... 其他配置

  panels: {
    extends: ['basic', 'layout', 'style', 'event'],
    custom: [
      {
        group: PanelGroup.COMPONENT,
        title: '按钮属性',
        icon: 'SettingOutlined',
        order: 5,
        fields: [
          {
            key: 'text',
            label: '按钮文本',
            type: FieldType.TEXT,
            defaultValue: '按钮',
            layout: { span: 2 },
            validation: [{ type: 'required', message: '按钮文本不能为空' }],
          },
          {
            key: 'type',
            label: '按钮类型',
            type: FieldType.SELECT,
            defaultValue: 'primary',
            layout: { span: 1 },
            options: [
              { label: '主要', value: 'primary' },
              { label: '默认', value: 'default' },
              { label: '虚线', value: 'dashed' },
              { label: '文本', value: 'text' },
              { label: '链接', value: 'link' },
            ],
          },
          {
            key: 'size',
            label: '按钮大小',
            type: FieldType.SELECT,
            defaultValue: 'middle',
            layout: { span: 1 },
            options: [
              { label: '大', value: 'large' },
              { label: '中', value: 'middle' },
              { label: '小', value: 'small' },
            ],
          },
          {
            key: 'icon',
            label: '图标',
            type: FieldType.ICON,
            layout: { span: 1 },
          },
          {
            key: 'danger',
            label: '危险按钮',
            type: FieldType.SWITCH,
            defaultValue: false,
            layout: { span: 1 },
          },
        ],
      },
    ],
  },
}
```

---

### 任务9: 性能优化

#### 9.1 字段渲染器懒加载

已在PropertyPanelService中实现(使用动态import)

#### 9.2 面板配置缓存

```typescript
// 在PanelRegistry中添加缓存
private panelCache: Map<string, PanelConfig[]> = new Map()

getPanelsForComponent(componentType: string): PanelConfig[] {
  if (this.panelCache.has(componentType)) {
    return this.panelCache.get(componentType)!
  }

  const panels = this.mergePanels(componentType)
  this.panelCache.set(componentType, panels)
  return panels
}
```

#### 9.3 输入防抖

```typescript
// 在FieldRenderer中添加防抖
import { useDebounceFn } from '@vueuse/core'

const debouncedUpdate = useDebounceFn(value => {
  emit('update:modelValue', value)
}, 300)
```

---

### 任务10: 测试和验证

#### 测试清单

- [ ] 所有字段类型渲染正常
- [ ] 可视化组件交互正常
- [ ] 面板折叠/展开正常
- [ ] 字段验证正常
- [ ] 依赖规则正常
- [ ] 属性更新到组件正常
- [ ] 性能测试(大量字段)
- [ ] 浏览器兼容性测试

---

### 任务11: 文档和示例

#### 文档结构

```
docs/
├── API.md                 # API文档
├── USAGE_GUIDE.md         # 使用指南
├── MIGRATION_GUIDE.md     # 迁移指南
└── examples/              # 示例代码
    ├── custom-field.md
    ├── custom-panel.md
    └── component-config.md
```

---

## 实施优先级

### 第一优先级 (核心功能)

1. ✅ 任务1-5: 基础设施层
2. ⏳ 任务6: UI组件 (FieldRenderer, PanelGroup, PropertiesPanel)
3. ⏳ 任务7: 框架集成 (DI容器、控件注册)

### 第二优先级 (功能完善)

4. ⏳ 任务8: 更新组件定义 (至少Button, Text, Image)
5. ⏳ 任务10: 基础测试

### 第三优先级 (优化和文档)

6. ⏳ 任务9: 性能优化
7. ⏳ 任务11: 文档编写

---

## 快速启动指南

### 步骤1: 创建UI组件

```bash
# 创建FieldRenderer
touch src/core/infrastructure/fields/FieldRenderer.vue

# 创建PanelGroup
touch src/core/renderer/designer/settings/PanelGroup.vue

# 更新PropertiesPanel
# 编辑 src/core/renderer/designer/settings/PropertiesPanel.vue
```

### 步骤2: 集成服务

```typescript
// 在应用初始化时
import { initializePropertyPanelService } from '@core/infrastructure/services'

async function initApp() {
  await initializePropertyPanelService()
  // ... 其他初始化
}
```

### 步骤3: 更新组件定义

```typescript
// 为Button组件添加panels配置
ButtonDefinition.panels = {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [
    /* 组件特定面板 */
  ],
}
```

### 步骤4: 测试

```bash
# 启动开发服务器
npm run dev

# 在浏览器中测试
# 1. 选择一个组件
# 2. 查看属性面板
# 3. 编辑属性值
# 4. 验证更新效果
```

---

## 注意事项

### 关键集成点

1. **服务初始化** - 必须在应用启动时初始化PropertyPanelService
2. **状态管理** - 使用现有的designer状态模块
3. **事件总线** - 属性更新时触发事件
4. **类型定义** - 确保所有接口类型正确

### 常见问题

1. **服务未初始化** - 确保调用了initializePropertyPanelService()
2. **字段渲染器未找到** - 检查字段类型是否正确注册
3. **面板不显示** - 检查组件是否注册了panels配置
4. **属性不更新** - 检查状态管理集成是否正确

---

## 总结

本路线图提供了完成剩余任务(6-11)的详细指南。关键是:

1. **先完成核心UI组件** (任务6) - FieldRenderer, PanelGroup, PropertiesPanel
2. **然后集成到框架** (任务7) - DI容器、控件注册、状态管理
3. **更新组件定义** (任务8) - 为现有组件添加panels配置
4. **最后优化和完善** (任务9-11) - 性能优化、测试、文档

按照这个顺序实施,可以确保系统逐步可用,每个阶段都可以测试验证。
