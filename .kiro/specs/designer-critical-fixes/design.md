# 设计器关键问题修复设计文档

## 概述

本文档描述了修复设计器中两个关键问题的技术设计方案。

---

## 架构

### 整体架构

```
DesignerNew.vue (主页面)
├── CanvasToolbar.vue (工具栏)
│   └── 数据源按钮 → 打开配置弹框
├── CanvasArea.vue (画布区域)
│   └── DesignerControlRenderer.vue (控件渲染器)
│       ├── 修复：移除无限循环
│       └── 优化：性能改进
└── DataSourceConfigModal.vue (新增：数据源配置弹框)
    ├── DataSourcePanel.vue (数据源配置)
    ├── DataFlowPanel.vue (数据流配置)
    └── DataOperationPanel.vue (数据操作配置)
```

---

## 组件和接口

### 1. DesignerControlRenderer 修复

#### 问题分析

**无限循环链路：**

```
MutationObserver 监听 DOM
  ↓
触发回调 → updateControlRect()
  ↓
console.log() 输出日志
  ↓
某些浏览器将日志视为 DOM 变化
  ↓
MutationObserver 再次触发
  ↓
无限循环 → 浏览器崩溃
```

#### 修复方案

**方案 1: 移除 console.log（推荐）**

```typescript
function updateControlRect() {
  if (wrapperRef.value) {
    const rect = wrapperRef.value.getBoundingClientRect()
    const canvas = document.querySelector('.canvas')
    if (!canvas) {
      // 移除 console.warn
      return
    }

    const canvasRect = canvas.getBoundingClientRect()
    controlRect.value = {
      left: rect.left - canvasRect.left,
      top: rect.top - canvasRect.top,
      width: rect.width,
      height: rect.height,
      right: rect.right - canvasRect.left,
      bottom: rect.bottom - canvasRect.top,
      x: rect.x - canvasRect.left,
      y: rect.y - canvasRect.top,
    } as DOMRect

    // 移除 console.log
  }
}
```

**方案 2: 添加防抖**

```typescript
import { debounce } from 'lodash-es'

const updateControlRect = debounce(() => {
  // 更新逻辑
}, 16) // 约 60fps
```

**方案 3: 添加更新标志**

```typescript
const isUpdating = ref(false)

function updateControlRect() {
  if (isUpdating.value) return

  isUpdating.value = true

  // 更新逻辑

  nextTick(() => {
    isUpdating.value = false
  })
}
```

**方案 4: 优化 MutationObserver**

```typescript
const observer = new MutationObserver(
  debounce(() => {
    updateControlRect()
  }, 16)
)

observer.observe(wrapperRef.value, {
  attributes: true,
  attributeFilter: ['style', 'class'], // 只监听特定属性
  childList: true,
  subtree: false, // 不监听子树
})
```

**方案 5: 优化 watch**

```typescript
// 移除 deep: true，只监听特定属性
watch(
  () => [props.control.styles, props.control.classes, props.control.children?.length],
  () => {
    nextTick(() => {
      updateControlRect()
    })
  }
)
```

#### 最终方案（组合）

1. **移除所有 console.log**
2. **添加防抖到 updateControlRect**
3. **优化 MutationObserver 配置**
4. **优化 watch 监听**

---

### 2. 数据源配置模态框

#### 组件结构

```vue
<template>
  <a-modal
    v-model:open="visible"
    title="数据源配置"
    width="100%"
    :style="{ top: 0, paddingBottom: 0 }"
    :body-style="{ height: 'calc(100vh - 110px)', padding: 0 }"
    :footer="null"
    :destroyOnClose="true"
  >
    <div class="data-config-container">
      <!-- 左侧导航 -->
      <div class="data-config-sidebar">
        <a-tabs v-model:activeKey="activeTab" tab-position="left">
          <a-tab-pane key="datasource" tab="数据源">
            <DataSourcePanel v-model:dataSources="dataSources" @test="handleTestDataSource" />
          </a-tab-pane>
          <a-tab-pane key="dataflow" tab="数据流">
            <DataFlowPanel v-model:dataFlows="dataFlows" :dataSources="dataSources" />
          </a-tab-pane>
          <a-tab-pane key="operation" tab="数据操作">
            <DataOperationPanel v-model:operations="operations" :dataSources="dataSources" />
          </a-tab-pane>
        </a-tabs>
      </div>

      <!-- 右侧预览 -->
      <div class="data-config-preview">
        <DataPreview :activeTab="activeTab" :dataSources="dataSources" :dataFlows="dataFlows" :operations="operations" />
      </div>
    </div>

    <!-- 底部操作栏 -->
    <div class="data-config-footer">
      <a-space>
        <a-button @click="handleCancel">取消</a-button>
        <a-button @click="handleImport">导入配置</a-button>
        <a-button @click="handleExport">导出配置</a-button>
        <a-button type="primary" @click="handleSave">保存</a-button>
      </a-space>
    </div>
  </a-modal>
</template>
```

#### 数据模型

```typescript
// 数据源配置
interface DataSourceConfig {
  id: string
  name: string
  type: 'api' | 'static' | 'mock'
  config: {
    // API 类型
    url?: string
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
    headers?: Record<string, string>
    params?: Record<string, any>
    body?: any

    // 静态类型
    data?: any

    // Mock 类型
    mockTemplate?: string
  }
  metadata: {
    fields: Record<string, FieldMetadata>
  }
  autoLoad: boolean
  readonly: boolean
}

// 字段元数据
interface FieldMetadata {
  code: string
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required: boolean
  defaultValue?: any
}

// 数据流配置
interface DataFlowConfig {
  id: string
  name: string
  sourceId: string
  transforms: DataTransform[]
}

interface DataTransform {
  type: 'filter' | 'map' | 'aggregate' | 'sort'
  config: any
}

// 数据操作配置
interface DataOperationConfig {
  id: string
  name: string
  type: 'create' | 'read' | 'update' | 'delete'
  dataSourceId: string
  config: {
    endpoint?: string
    method?: string
    params?: Record<string, any>
  }
  hooks: {
    before?: string
    after?: string
  }
}
```

---

## 数据模型

### 设计器状态扩展

```typescript
interface DesignerState {
  // 现有字段...

  // 新增：数据配置
  dataConfig: {
    dataSources: Record<string, DataSourceConfig>
    dataFlows: Record<string, DataFlowConfig>
    operations: Record<string, DataOperationConfig>
  }
}
```

### 控件数据绑定扩展

```typescript
interface Control {
  // 现有字段...

  // 扩展：数据绑定
  dataBinding?: {
    source: string // 数据源 ID
    objectCode?: string
    propertyCode?: string
    transform?: string // 数据流 ID
  }
}
```

---

## 错误处理

### 1. 无限循环检测

```typescript
// 添加循环检测
let updateCount = 0
let lastUpdateTime = 0

function updateControlRect() {
  const now = Date.now()

  // 如果在 100ms 内更新超过 10 次，认为是无限循环
  if (now - lastUpdateTime < 100) {
    updateCount++
    if (updateCount > 10) {
      console.error('检测到无限循环，停止更新')
      return
    }
  } else {
    updateCount = 0
  }

  lastUpdateTime = now

  // 正常更新逻辑
}
```

### 2. 数据源配置验证

```typescript
function validateDataSourceConfig(config: DataSourceConfig): string[] {
  const errors: string[] = []

  if (!config.name) {
    errors.push('数据源名称不能为空')
  }

  if (config.type === 'api') {
    if (!config.config.url) {
      errors.push('API 地址不能为空')
    }
    if (!config.config.method) {
      errors.push('请求方法不能为空')
    }
  }

  if (config.type === 'static') {
    if (!config.config.data) {
      errors.push('静态数据不能为空')
    }
  }

  return errors
}
```

### 3. 数据源连接测试

```typescript
async function testDataSource(config: DataSourceConfig): Promise<{
  success: boolean
  message: string
  data?: any
}> {
  try {
    if (config.type === 'api') {
      const response = await fetch(config.config.url!, {
        method: config.config.method,
        headers: config.config.headers,
        body: config.config.body ? JSON.stringify(config.config.body) : undefined,
      })

      if (!response.ok) {
        return {
          success: false,
          message: `请求失败: ${response.status} ${response.statusText}`,
        }
      }

      const data = await response.json()
      return {
        success: true,
        message: '连接成功',
        data,
      }
    }

    if (config.type === 'static') {
      return {
        success: true,
        message: '静态数据验证成功',
        data: config.config.data,
      }
    }

    return {
      success: false,
      message: '不支持的数据源类型',
    }
  } catch (error) {
    return {
      success: false,
      message: `连接失败: ${error.message}`,
    }
  }
}
```

---

## 测试策略

### 1. 无限循环修复测试

**单元测试：**

```typescript
describe('DesignerControlRenderer', () => {
  it('should not trigger infinite loop on DOM changes', async () => {
    const wrapper = mount(DesignerControlRenderer, {
      props: {
        control: mockControl,
      },
    })

    // 模拟 DOM 变化
    for (let i = 0; i < 100; i++) {
      wrapper.vm.updateControlRect()
      await nextTick()
    }

    // 验证没有崩溃
    expect(wrapper.exists()).toBe(true)
  })

  it('should debounce updateControlRect calls', async () => {
    const spy = vi.spyOn(wrapper.vm, 'updateControlRect')

    // 快速调用多次
    for (let i = 0; i < 10; i++) {
      wrapper.vm.updateControlRect()
    }

    await new Promise(resolve => setTimeout(resolve, 20))

    // 验证只调用了一次
    expect(spy).toHaveBeenCalledTimes(1)
  })
})
```

**集成测试：**

```typescript
describe('Dashboard Component Drag', () => {
  it('should add dashboard component without crash', async () => {
    const wrapper = mount(DesignerNew)

    // 模拟拖拽大屏组件
    const dragData = {
      type: 'control-library',
      controlKind: 'dashboard-container',
    }

    await wrapper.vm.handleDrop({
      dataTransfer: {
        getData: () => JSON.stringify(dragData),
      },
    })

    // 等待渲染
    await new Promise(resolve => setTimeout(resolve, 100))

    // 验证组件已添加
    expect(wrapper.vm.controls.length).toBe(1)
    expect(wrapper.vm.controls[0].kind).toBe('dashboard-container')
  })
})
```

### 2. 数据源配置测试

**单元测试：**

```typescript
describe('DataSourcePanel', () => {
  it('should add new data source', async () => {
    const wrapper = mount(DataSourcePanel)

    await wrapper.vm.handleAdd({
      name: 'Test API',
      type: 'api',
      config: {
        url: 'https://api.example.com/data',
        method: 'GET',
      },
    })

    expect(wrapper.vm.dataSources.length).toBe(1)
  })

  it('should validate data source config', () => {
    const errors = validateDataSourceConfig({
      name: '',
      type: 'api',
      config: {},
    })

    expect(errors.length).toBeGreaterThan(0)
  })
})
```

**E2E 测试：**

```typescript
describe('Data Source Configuration', () => {
  it('should open full screen modal', async () => {
    await page.click('[data-testid="datasource-button"]')

    const modal = await page.waitForSelector('.data-config-container')
    expect(modal).toBeTruthy()
  })

  it('should save data source configuration', async () => {
    // 打开弹框
    await page.click('[data-testid="datasource-button"]')

    // 添加数据源
    await page.click('[data-testid="add-datasource"]')
    await page.fill('[data-testid="datasource-name"]', 'Test API')
    await page.select('[data-testid="datasource-type"]', 'api')
    await page.fill('[data-testid="datasource-url"]', 'https://api.example.com')

    // 保存
    await page.click('[data-testid="save-button"]')

    // 验证保存成功
    const toast = await page.waitForSelector('.ant-message-success')
    expect(toast).toBeTruthy()
  })
})
```

---

## 性能考虑

### 1. 控件渲染性能

**优化措施：**

- 使用防抖限制 `updateControlRect` 调用频率
- 使用 `attributeFilter` 限制 MutationObserver 监听范围
- 移除 `deep: true`，只监听必要的属性
- 使用 `v-memo` 优化列表渲染

**性能指标：**

- 单个组件渲染时间 < 16ms (60fps)
- 100 个组件渲染时间 < 1s
- 拖拽响应延迟 < 50ms

### 2. 数据源配置性能

**优化措施：**

- 使用虚拟滚动显示大量数据源
- 使用 Web Worker 处理数据转换
- 使用 IndexedDB 缓存配置
- 使用懒加载加载配置面板

**性能指标：**

- 配置弹框打开时间 < 500ms
- 数据源列表渲染时间 < 100ms
- 配置保存时间 < 200ms

---

## 安全考虑

### 1. 数据源安全

- **CORS 处理：** 使用代理服务器处理跨域请求
- **认证：** 支持 Bearer Token、API Key 等认证方式
- **敏感信息：** 加密存储 API 密钥和密码
- **权限控制：** 限制数据源的访问权限

### 2. XSS 防护

- **输入验证：** 验证所有用户输入
- **输出转义：** 转义所有动态内容
- **CSP：** 配置内容安全策略

---

## 部署考虑

### 1. 向后兼容

- 保持现有 API 不变
- 新增配置字段使用可选类型
- 提供配置迁移工具

### 2. 配置存储

- 使用 localStorage 存储本地配置
- 使用服务器 API 存储云端配置
- 支持配置的导入导出

---

**创建日期：** 2025-10-11  
**创建人：** Kiro AI Assistant  
**状态：** 待审核
