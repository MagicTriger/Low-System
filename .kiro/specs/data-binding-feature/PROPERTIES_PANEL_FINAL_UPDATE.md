# 属性面板最终更新

## 修改内容

### 1. 删除右侧配置面板的三个文本标签页

**修改文件**: `src/modules/designer/views/DesignerNew.vue`

#### 修改前:

```vue
<a-tabs v-model:activeKey="rightActiveTab" size="small">
  <a-tab-pane key="properties" tab="属性">
    <PropertiesPanel :control="selectedControl" @update="handlePropertyUpdate" />
  </a-tab-pane>
  <a-tab-pane key="events" tab="事件">
    <EventsPanel :control="selectedControl" @update="handleEventUpdate" />
  </a-tab-pane>
  <a-tab-pane key="layout" tab="布局">
    <LayoutPanel :control="selectedControl" @update="handlePropertyUpdate" />
  </a-tab-pane>
</a-tabs>
```

#### 修改后:

```vue
<PropertiesPanel :control="selectedControl" :data-sources="Object.values(dataConfig.dataSources || {})" @update="handlePropertyUpdate" />
```

**改进点**:

- ✅ 删除了"属性"、"事件"、"布局"三个文本标签页
- ✅ 直接显示PropertiesPanel组件
- ✅ 删除了EventsPanel和LayoutPanel的导入
- ✅ 界面更简洁,所有配置都在PropertiesPanel的图标标签页中

### 2. 数据绑定配置改为下拉框

**修改文件**: `src/core/renderer/designer/settings/PropertiesPanel.vue`

#### 修改前:

```vue
<a-select
  v-model:value="dataBindingConfig.dataSource"
  size="small"
  style="width: 100%"
  placeholder="选择数据源"
  @update:value="v => updateDataBinding('dataSource', v)"
>
  <a-select-option value="">无</a-select-option>
  <a-select-option value="api">API数据</a-select-option>
  <a-select-option value="static">静态数据</a-select-option>
</a-select>
```

#### 修改后:

```vue
<a-select
  v-model:value="dataBindingConfig.dataSourceId"
  size="small"
  style="width: 100%"
  placeholder="选择数据源"
  allow-clear
  @update:value="v => updateDataBinding('dataSourceId', v)"
>
  <a-select-option value="">无</a-select-option>
  <a-select-option
    v-for="ds in dataSources"
    :key="ds.id"
    :value="ds.id"
  >
    {{ ds.name }} ({{ ds.type }})
  </a-select-option>
</a-select>
```

**改进点**:

- ✅ 数据源选项来自实际配置的数据源
- ✅ 显示数据源名称和类型
- ✅ 支持清除选择
- ✅ 动态加载数据源列表

### 3. 新增Props定义

```typescript
interface Props {
  control: Control | null
  dataSources?: any[]
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => [],
})
```

### 4. 更新数据绑定配置结构

#### 修改前:

```typescript
const dataBindingConfig = reactive({
  dataSource: '',
  bindingPath: '',
})
```

#### 修改后:

```typescript
const dataBindingConfig = reactive({
  dataSourceId: '', // 数据源ID
  bindingField: '', // 绑定字段
  transform: '', // 数据转换函数
})
```

### 5. 新增配置字段

在数据绑定面板中新增了以下字段:

1. **数据源** (dataSourceId)

   - 下拉选择框
   - 显示所有已配置的数据源
   - 格式: "数据源名称 (类型)"

2. **绑定字段** (bindingField)

   - 文本输入框
   - 指定要绑定的数据字段路径
   - 例如: `data.items`

3. **数据转换** (transform)
   - 多行文本框
   - 可选的数据转换函数
   - 用于在绑定前转换数据

## 测试建议

### 1. 测试标签页删除

- ✅ 确认右侧面板不再显示"属性"、"事件"、"布局"文本标签页
- ✅ 确认PropertiesPanel直接显示
- ✅ 确认图标标签页正常工作

### 2. 测试数据绑定

1. 打开数据源配置,添加几个数据源
2. 选择一个组件
3. 在"基本"标签页中打开"数据绑定"面板
4. 确认数据源下拉框显示所有配置的数据源
5. 选择一个数据源
6. 输入绑定字段
7. 可选输入数据转换函数
8. 保存并验证配置

### 3. 测试数据源集成

- ✅ 添加API数据源
- ✅ 添加静态数据源
- ✅ 添加Mock数据源
- ✅ 确认所有数据源都显示在下拉框中
- ✅ 确认数据源名称和类型正确显示

## 文件变更

1. `src/modules/designer/views/DesignerNew.vue`

   - 删除三个文本标签页
   - 删除EventsPanel和LayoutPanel导入
   - 添加dataSources prop传递

2. `src/core/renderer/designer/settings/PropertiesPanel.vue`
   - 添加dataSources prop
   - 更新数据绑定配置UI
   - 更新dataBindingConfig结构
   - 添加数据转换字段

## 下一步

1. 实现数据绑定的实际执行逻辑
2. 实现数据转换函数的解析和执行
3. 添加数据绑定的预览功能
4. 完善错误处理和验证
