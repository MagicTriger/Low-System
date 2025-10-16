# 属性系统快速开始指南

## 概述

属性系统提供了一个配置驱动的属性面板解决方案，支持：

- 灵活的字段配置
- 强大的验证系统
- 智能的依赖条件
- 插件化扩展
- 完全向后兼容

## 基本使用

### 1. 定义属性字段

```typescript
import type { PropertyFieldConfig } from '@/core/renderer/properties'

const nameField: PropertyFieldConfig = {
  key: 'name',
  name: '控件名称',
  fieldType: 'text',
  placeholder: '输入控件名称',
  required: true,
  validation: [
    {
      type: 'minLength',
      value: 2,
      message: '名称至少2个字符',
    },
  ],
}

const colorField: PropertyFieldConfig = {
  key: 'color',
  name: '颜色',
  fieldType: 'color',
  defaultValue: '#1890ff',
}
```

### 2. 定义属性面板

```typescript
import type { PropertyPanelConfig } from '@/core/renderer/properties'

const myPanelConfig: PropertyPanelConfig = {
  id: 'my-panel',
  name: '我的面板',
  groups: [
    {
      key: 'basic',
      name: '基本信息',
      fields: [nameField, colorField],
      collapsible: true,
      defaultExpanded: true,
    },
  ],
}
```

### 3. 注册面板配置

```typescript
import { usePropertyService } from '@/core/services/helpers'

const propertyService = usePropertyService()
const panelManager = propertyService.getPanelManager()

panelManager.registerPanel(myPanelConfig)
```

### 4. 使用状态管理

```typescript
import { useStateManager } from '@/core/state/helpers'

const stateManager = useStateManager()

// 加载属性面板
await stateManager.dispatch('designer/loadPropertyPanel', control)

// 更新属性
await stateManager.dispatch('designer/updateProperty', {
  key: 'name',
  value: '新名称',
})

// 获取属性值
const name = stateManager.getters['designer/getPropertyValue']('name')

// 验证所有属性
const isValid = await stateManager.dispatch('designer/validateAllProperties')
```

## 高级功能

### 1. 字段验证

```typescript
const emailField: PropertyFieldConfig = {
  key: 'email',
  name: '邮箱',
  fieldType: 'text',
  required: true,
  validation: [
    {
      type: 'email',
      message: '请输入有效的邮箱地址',
    },
  ],
}

const ageField: PropertyFieldConfig = {
  key: 'age',
  name: '年龄',
  fieldType: 'number',
  min: 0,
  max: 150,
  validation: [
    {
      type: 'min',
      value: 0,
      message: '年龄不能小于0',
    },
    {
      type: 'max',
      value: 150,
      message: '年龄不能大于150',
    },
  ],
}

const customField: PropertyFieldConfig = {
  key: 'username',
  name: '用户名',
  fieldType: 'text',
  validation: [
    {
      type: 'custom',
      validator: async value => {
        // 自定义验证逻辑
        const exists = await checkUsernameExists(value)
        return !exists
      },
      message: '用户名已存在',
    },
  ],
}
```

### 2. 依赖条件

```typescript
const typeField: PropertyFieldConfig = {
  key: 'type',
  name: '类型',
  fieldType: 'select',
  options: [
    { label: '文本', value: 'text' },
    { label: '图片', value: 'image' },
  ],
}

const textField: PropertyFieldConfig = {
  key: 'text',
  name: '文本内容',
  fieldType: 'textarea',
  // 只在type为text时显示
  dependsOn: {
    field: 'type',
    operator: 'eq',
    value: 'text',
    action: 'show',
  },
}

const imageField: PropertyFieldConfig = {
  key: 'imageUrl',
  name: '图片URL',
  fieldType: 'text',
  // 只在type为image时显示
  dependsOn: {
    field: 'type',
    operator: 'eq',
    value: 'image',
    action: 'show',
  },
}
```

### 3. 创建属性插件

```typescript
import { BasePropertyPlugin } from '@/core/plugins/PropertyPlugin'
import type { PluginMetadata } from '@/core/plugins/IPlugin'

class MyPropertyPlugin extends BasePropertyPlugin {
  readonly metadata: PluginMetadata = {
    id: 'my-property-plugin',
    name: '我的属性插件',
    version: '1.0.0',
    description: '提供自定义属性字段和面板',
  }

  registerPropertyFields() {
    return [
      {
        key: 'customField',
        name: '自定义字段',
        fieldType: 'text',
      },
    ]
  }

  registerPropertyPanels() {
    return [
      {
        id: 'custom-panel',
        name: '自定义面板',
        fields: [
          {
            key: 'customField',
            name: '自定义字段',
            fieldType: 'text',
          },
        ],
      },
    ]
  }

  registerFieldRenderers() {
    const renderers = new Map()
    // 注册自定义渲染器
    // renderers.set('custom', CustomFieldRenderer)
    return renderers
  }

  protected async onActivate() {
    this.log('插件已激活')
  }

  protected async onDeactivate() {
    this.log('插件已停用')
  }
}

// 注册插件
const plugin = new MyPropertyPlugin()
const pluginManager = usePluginManager()
await pluginManager.register(plugin)
await pluginManager.activate('my-property-plugin')
```

### 4. 使用工厂函数创建插件

```typescript
import { createPropertyPlugin } from '@/core/plugins/PropertyPlugin'

const plugin = createPropertyPlugin({
  metadata: {
    id: 'simple-plugin',
    name: '简单插件',
    version: '1.0.0',
  },
  fields: [
    {
      key: 'field1',
      name: '字段1',
      fieldType: 'text',
    },
  ],
  panels: [
    {
      id: 'panel1',
      name: '面板1',
      fields: [
        {
          key: 'field1',
          name: '字段1',
          fieldType: 'text',
        },
      ],
    },
  ],
  onActivate: async () => {
    console.log('插件激活')
  },
})
```

## 向后兼容

### 现有settings格式自动转换

```typescript
// 旧的控件定义（仍然有效）
const oldControlDef = {
  kind: 'MyControl',
  settings: [
    {
      key: 'name',
      name: '名称',
      type: 'string',
      group: 'basic',
    },
    {
      key: 'enabled',
      name: '启用',
      type: 'boolean',
      group: 'common',
    },
  ],
}

// 系统会自动转换为新格式
// 无需修改现有代码
```

### 新的控件定义格式

```typescript
// 新的控件定义（推荐）
const newControlDef = {
  kind: 'MyControl',
  propertyPanels: [
    {
      id: 'basic',
      name: '基本',
      groups: [
        {
          key: 'basic-info',
          name: '基本信息',
          fields: [
            {
              key: 'name',
              name: '名称',
              fieldType: 'text',
              required: true,
            },
          ],
        },
      ],
    },
  ],
}
```

## 配置优先级

系统按以下优先级加载配置：

1. **propertyPanels** - 控件定义中的propertyPanels配置（最高优先级）
2. **propertyFields** - 控件定义中的propertyFields配置
3. **settings** - 控件定义中的settings配置（向后兼容）
4. **默认面板** - 系统默认的basic、style、event面板（最低优先级）

## 最佳实践

### 1. 字段命名

- 使用有意义的key
- 使用清晰的name
- 提供描述和提示信息

### 2. 验证规则

- 优先使用内置验证规则
- 自定义验证函数保持简单
- 提供清晰的错误消息

### 3. 依赖条件

- 保持依赖关系简单
- 避免循环依赖
- 使用合适的action（show/hide/enable/disable）

### 4. 面板组织

- 按功能分组
- 使用tabs组织大量字段
- 设置合理的默认展开状态

### 5. 性能优化

- 使用配置缓存
- 避免频繁的验证
- 使用防抖处理用户输入

## 调试技巧

### 1. 查看注册的字段

```typescript
const propertyService = usePropertyService()
const fieldManager = propertyService.getFieldManager()

// 获取所有字段
const allFields = fieldManager.getAllFields()
console.log('所有字段:', allFields)

// 获取特定字段
const field = fieldManager.getField('name')
console.log('name字段:', field)
```

### 2. 查看注册的面板

```typescript
const panelManager = propertyService.getPanelManager()

// 获取所有面板
const allPanels = panelManager.getAllPanels()
console.log('所有面板:', allPanels)

// 获取控件的面板配置
const config = panelManager.getPanelForControl('Button')
console.log('Button面板配置:', config)
```

### 3. 查看状态

```typescript
const stateManager = useStateManager()

// 获取designer状态
const designerState = stateManager.getState('designer')
console.log('Designer状态:', designerState)

// 获取属性值
const values = stateManager.getters['designer/getAllPropertyValues']
console.log('所有属性值:', values)

// 获取验证错误
const errors = stateManager.getters['designer/getAllValidationErrors']
console.log('验证错误:', errors)
```

## 常见问题

### Q: 如何添加自定义字段类型？

A: 创建自定义渲染器组件，然后通过PropertyPlugin注册。

### Q: 如何实现复杂的验证逻辑？

A: 使用custom验证规则，提供自定义验证函数。

### Q: 如何实现字段之间的联动？

A: 使用dependsOn配置依赖条件。

### Q: 如何迁移现有的settings配置？

A: 无需迁移，系统会自动转换。如果需要新功能，可以逐步迁移到propertyPanels格式。

### Q: 如何优化性能？

A: 使用配置缓存、懒加载、防抖验证等技术。

## 下一步

- 查看完整的API文档
- 学习字段渲染器的创建
- 了解面板配置的高级用法
- 探索插件系统的更多功能
