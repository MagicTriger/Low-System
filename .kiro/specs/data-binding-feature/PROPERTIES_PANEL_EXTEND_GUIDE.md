# 属性面板扩展指南

## 概述

当前的PropertiesPanel.vue是一个简化版本，只包含基本信息和布局配置两个折叠面板。本指南说明如何添加更多的配置面板。

## 当前实现

### 已实现的折叠面板

1. ✅ 基本信息 - 组件ID、名称、类型
2. ✅ 布局配置 - 宽度、高度（带布局图案）

### 待添加的折叠面板

3. ⏳ 内外边距 - padding和margin配置
4. ⏳ Flex布局 - Flex相关配置
5. ⏳ 定位配置 - position相关配置
6. ⏳ 字体配置 - 字体样式配置
7. ⏳ 边框配置 - 边框样式配置
8. ⏳ 圆角配置 - border-radius配置
9. ⏳ 背景配置 - 背景相关配置
10. ⏳ 其他配置 - 透明度、类名等
11. ⏳ 数据绑定选项卡 - 数据绑定配置

## 如何添加新的折叠面板

### 步骤1：在template中添加折叠面板

在`<a-collapse>`标签内添加新的`<a-collapse-panel>`：

```vue
<!-- 内外边距 -->
<a-collapse-panel key="spacing" header="内外边距">
  <LayoutDiagram type="box" style="margin-bottom: 16px" />
  
  <div class="property-group">
    <label class="property-label">上内边距</label>
    <DomSizeRenderer v-model="layoutConfig.paddingTop" 
      @update:modelValue="updateLayout('paddingTop', $event)" />
  </div>
  
  <div class="property-group">
    <label class="property-label">右内边距</label>
    <DomSizeRenderer v-model="layoutConfig.paddingRight" 
      @update:modelValue="updateLayout('paddingRight', $event)" />
  </div>
  
  <!-- 更多字段... -->
</a-collapse-panel>
```

### 步骤2：添加配置对象（如果需要）

如果新面板需要新的配置对象，在script中添加：

```typescript
const spacingConfig = reactive<{
  paddingTop?: ControlSize
  paddingRight?: ControlSize
  // ...
}>({})
```

### 步骤3：添加watch监听（如果需要）

在watch中添加新配置对象的监听：

```typescript
watch(
  () => props.control,
  newControl => {
    if (newControl) {
      Object.assign(layoutConfig, newControl.layout || {})
      Object.assign(spacingConfig, newControl.layout || {}) // 新增
      // ...
    }
  },
  { immediate: true, deep: true }
)
```

### 步骤4：添加更新函数（如果需要）

如果需要特殊的更新逻辑，添加新的更新函数：

```typescript
function updateSpacing(key: string, value: any) {
  const newLayout = { ...props.control?.layout, [key]: value }
  emit('update', 'layout', newLayout)
}
```

## 完整示例：添加Flex布局面板

### 1. 在template中添加

```vue
<!-- Flex布局 -->
<a-collapse-panel key="flex" header="Flex布局">
  <LayoutDiagram type="flex" 
    :flexDirection="layoutConfig.flexDirection" 
    :justifyContent="layoutConfig.justifyContent" 
    :alignItems="layoutConfig.alignItems" 
    style="margin-bottom: 16px" />
  
  <div class="property-group">
    <label class="property-label">Flex方向</label>
    <a-select v-model:value="layoutConfig.flexDirection" size="small" style="width: 100%" 
      @update:value="v => updateLayout('flexDirection', v)">
      <a-select-option value="row">横向</a-select-option>
      <a-select-option value="row-reverse">横向反转</a-select-option>
      <a-select-option value="column">纵向</a-select-option>
      <a-select-option value="column-reverse">纵向反转</a-select-option>
    </a-select>
  </div>
  
  <div class="property-group">
    <label class="property-label">主轴对齐</label>
    <a-select v-model:value="layoutConfig.justifyContent" size="small" style="width: 100%" 
      @update:value="v => updateLayout('justifyContent', v)">
      <a-select-option value="flex-start">起点对齐</a-select-option>
      <a-select-option value="flex-end">终点对齐</a-select-option>
      <a-select-option value="center">居中对齐</a-select-option>
      <a-select-option value="space-between">两端对齐</a-select-option>
      <a-select-option value="space-around">环绕对齐</a-select-option>
      <a-select-option value="space-evenly">均匀对齐</a-select-option>
    </a-select>
  </div>
  
  <div class="property-group">
    <label class="property-label">交叉轴对齐</label>
    <a-select v-model:value="layoutConfig.alignItems" size="small" style="width: 100%" 
      @update:value="v => updateLayout('alignItems', v)">
      <a-select-option value="flex-start">起点对齐</a-select-option>
      <a-select-option value="flex-end">终点对齐</a-select-option>
      <a-select-option value="center">居中对齐</a-select-option>
      <a-select-option value="baseline">基线对齐</a-select-option>
      <a-select-option value="stretch">拉伸对齐</a-select-option>
    </a-select>
  </div>
</a-collapse-panel>
```

### 2. 更新activeKeys默认值

```typescript
const activeKeys = ref(['basic', 'layout', 'flex']) // 添加'flex'
```

## 完整示例：添加字体配置面板

### 1. 在template中添加

```vue
<!-- 字体配置 -->
<a-collapse-panel key="font" header="字体配置">
  <div class="property-group">
    <label class="property-label">字体大小</label>
    <DomSizeRenderer v-model="fontConfig.fontSize" 
      @update:modelValue="updateFont('fontSize', $event)" />
  </div>
  
  <div class="property-group">
    <label class="property-label">字体颜色</label>
    <ColorRenderer v-model="fontConfig.color" 
      @update:modelValue="updateFont('color', $event)" />
  </div>
  
  <div class="property-group">
    <label class="property-label">字体粗细</label>
    <a-select v-model:value="fontConfig.fontWeight" size="small" style="width: 100%" 
      @update:value="v => updateFont('fontWeight', v)">
      <a-select-option :value="100">100 - 极细</a-select-option>
      <a-select-option :value="200">200 - 纤细</a-select-option>
      <a-select-option :value="300">300 - 细</a-select-option>
      <a-select-option :value="400">400 - 正常</a-select-option>
      <a-select-option :value="500">500 - 中等</a-select-option>
      <a-select-option :value="600">600 - 半粗</a-select-option>
      <a-select-option :value="700">700 - 粗</a-select-option>
      <a-select-option :value="800">800 - 特粗</a-select-option>
      <a-select-option :value="900">900 - 极粗</a-select-option>
    </a-select>
  </div>
</a-collapse-panel>
```

### 2. 添加更新函数

```typescript
function updateFont(key: string, value: any) {
  const newFont = { ...props.control?.font, [key]: value }
  emit('update', 'font', newFont)
}
```

## 完整示例：添加数据绑定选项卡

### 1. 在template中添加新选项卡

```vue
<!-- 数据绑定选项卡 -->
<a-tab-pane key="binding" tab="数据绑定">
  <div class="tab-content">
    <a-collapse v-model:activeKey="bindingActiveKeys" :bordered="false" 
      expand-icon-position="end" class="property-collapse">
      <a-collapse-panel key="binding-config" header="数据绑定配置">
        <div class="property-group">
          <label class="property-label">绑定类型</label>
          <a-select v-model:value="bindingConfig.bindingType" size="small" 
            style="width: 100%">
            <a-select-option value="direct">直接绑定</a-select-option>
            <a-select-option value="dataflow">数据流绑定</a-select-option>
            <a-select-option value="manual">手动绑定</a-select-option>
          </a-select>
        </div>
        
        <div class="property-group">
          <label class="property-label">数据源</label>
          <a-select v-model:value="bindingConfig.source" size="small" 
            style="width: 100%" allow-clear>
            <a-select-option v-for="ds in dataSources" :key="ds.id" :value="ds.id">
              {{ ds.name }}
            </a-select-option>
          </a-select>
        </div>
        
        <!-- 更多字段... -->
      </a-collapse-panel>
    </a-collapse>
  </div>
</a-tab-pane>
```

### 2. 添加配置对象和状态

```typescript
const bindingActiveKeys = ref(['binding-config'])

const bindingConfig = ref({
  source: '',
  bindingType: 'direct',
  dataFlowId: undefined,
  propertyPath: '',
  autoLoad: true,
  refreshInterval: 0,
  transform: undefined,
})

// 监听control变化
watch(
  () => props.control,
  newControl => {
    if (newControl?.dataBinding) {
      bindingConfig.value = { ...newControl.dataBinding }
    } else {
      bindingConfig.value = {
        source: '',
        bindingType: 'direct',
        dataFlowId: undefined,
        propertyPath: '',
        autoLoad: true,
        refreshInterval: 0,
        transform: undefined,
      }
    }
  },
  { immediate: true }
)
```

### 3. 添加处理函数

```typescript
function handleSaveBinding() {
  if (!bindingConfig.value.source) {
    message.warning('请选择数据源')
    return
  }
  emit('updateBinding', { ...bindingConfig.value })
  message.success('数据绑定已保存')
}

function handleClearBinding() {
  bindingConfig.value = {
    source: '',
    bindingType: 'direct',
    dataFlowId: undefined,
    propertyPath: '',
    autoLoad: true,
    refreshInterval: 0,
    transform: undefined,
  }
  emit('updateBinding', undefined)
  message.success('数据绑定已清除')
}
```

## 注意事项

### 1. 保持一致的结构

所有折叠面板应该遵循相同的结构：

```vue
<a-collapse-panel key="unique-key" header="面板标题">
  <!-- 可选：布局图案 -->
  <LayoutDiagram type="..." />
  
  <!-- 配置字段 -->
  <div class="property-group">
    <label class="property-label">字段标签</label>
    <!-- 输入控件 -->
  </div>
</a-collapse-panel>
```

### 2. 使用合适的输入控件

- 尺寸值：使用 `DomSizeRenderer`
- 颜色值：使用 `ColorRenderer`
- 选项：使用 `a-select`
- 文本：使用 `a-input`
- 数字：使用 `a-input-number`
- 开关：使用 `a-switch`
- 滑块：使用 `a-slider`

### 3. 正确处理响应式更新

```typescript
// ✅ 正确 - 创建新对象
function updateLayout(key: string, value: any) {
  const newLayout = { ...props.control?.layout, [key]: value }
  emit('update', 'layout', newLayout)
}

// ❌ 错误 - 直接修改
function updateLayout(key: string, value: any) {
  props.control.layout[key] = value // 不要这样做！
}
```

### 4. 添加必要的导入

如果使用了新的组件或图标，记得添加导入：

```typescript
import { message } from 'ant-design-vue'
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons-vue'
```

## 完整的配置面板模板

参考 `PROPERTIES_PANEL_COMPLETE.md` 文档中的完整实现，其中包含所有65个配置字段的完整代码。

## 测试新添加的面板

1. 启动开发服务器
2. 打开设计器页面
3. 选择一个组件
4. 展开新添加的折叠面板
5. 测试所有输入控件
6. 验证配置能正确保存和加载

## 性能优化建议

### 1. 使用v-show代替v-if（对于频繁切换的内容）

```vue
<!-- ✅ 推荐 -->
<div v-show="bindingConfig.bindingType === 'dataflow'">
  <!-- 内容 -->
</div>

<!-- ⏳ 可选 -->
<div v-if="bindingConfig.bindingType === 'dataflow'">
  <!-- 内容 -->
</div>
```

### 2. 使用computed缓存计算结果

```typescript
const hasDataBinding = computed(() => !!props.control?.dataBinding)
```

### 3. 防抖输入事件

```typescript
import { debounce } from 'lodash-es'

const debouncedUpdate = debounce((property: string, value: any) => {
  emit('update', property, value)
}, 300)
```

## 下一步

1. 根据需要逐步添加更多的配置面板
2. 测试每个新添加的面板
3. 收集用户反馈
4. 优化性能和用户体验

## 参考文档

- [完整实现文档](./PROPERTIES_PANEL_COMPLETE.md)
- [测试指南](./PROPERTIES_PANEL_TEST_GUIDE.md)
- [使用说明](./PROPERTIES_PANEL_README.md)
- [样式布局配置面板字段定义文档](../../../docs/低代码平台样式布局配置面板字段定义文档.md)
