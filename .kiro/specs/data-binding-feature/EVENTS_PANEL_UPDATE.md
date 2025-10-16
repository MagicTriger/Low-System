# 事件配置面板更新

## 修改内容

### 1. 事件配置改为下拉框选择数据操作

**修改文件**: `src/core/renderer/designer/settings/PropertiesPanel.vue`

#### 修改前:

所有事件配置使用多行文本框(textarea)输入JavaScript代码

```vue
<a-textarea
  v-model:value="eventsConfig.click"
  placeholder="输入JavaScript代码"
  :rows="3"
  size="small"
  @update:value="v => updateEvents('click', v)"
/>
```

#### 修改后:

所有事件配置改为下拉框,选择已配置的数据操作

```vue
<a-select
  v-model:value="eventsConfig.click"
  size="small"
  style="width: 100%"
  placeholder="选择数据操作"
  allow-clear
  @update:value="v => updateEvents('click', v)"
>
  <a-select-option value="">无</a-select-option>
  <a-select-option
    v-for="op in dataOperations"
    :key="op.id"
    :value="op.id"
  >
    {{ op.name }} ({{ op.type }})
  </a-select-option>
</a-select>
```

### 2. 更新Props定义

```typescript
interface Props {
  control: Control | null
  dataSources?: any[]
  dataOperations?: any[] // 新增
}

const props = withDefaults(defineProps<Props>(), {
  dataSources: () => [],
  dataOperations: () => [], // 新增
})
```

### 3. 更新的事件类型

所有15种事件类型都已更新为下拉框配置:

#### 生命周期事件 (3种)

- 组件挂载后 (mounted)
- 组件卸载前 (beforeUnmount)
- 组件更新后 (updated)

#### 鼠标事件 (4种)

- 点击 (click)
- 双击 (dblclick)
- 鼠标移入 (mouseenter)
- 鼠标移出 (mouseleave)

#### 键盘事件 (3种)

- 按键按下 (keydown)
- 按键释放 (keyup)
- 按键按下并释放 (keypress)

#### 表单事件 (5种)

- 值改变 (change)
- 输入 (input)
- 获得焦点 (focus)
- 失去焦点 (blur)
- 提交 (submit)

### 4. DesignerNew.vue更新

传入dataOperations prop:

```vue
<PropertiesPanel
  :control="selectedControl"
  :data-sources="Object.values(dataConfig.dataSources || {})"
  :data-operations="Object.values(dataConfig.operations || {})"
  @update="handlePropertyUpdate"
/>
```

## 改进点

1. ✅ 所有事件配置统一使用下拉框
2. ✅ 数据操作来自数据源配置
3. ✅ 显示格式: "操作名称 (类型)"
4. ✅ 支持清除选择
5. ✅ 动态加载数据操作列表
6. ✅ 更直观的配置方式
7. ✅ 避免手写代码错误
8. ✅ 统一的事件管理

## 使用流程

### 1. 配置数据操作

1. 打开数据源配置弹框
2. 切换到"数据操作"标签页
3. 添加数据操作(增删改查等)
4. 配置操作的参数和逻辑

### 2. 绑定事件

1. 选择一个组件
2. 切换到"事件"标签页(⚡图标)
3. 展开需要的事件类型面板
4. 从下拉框中选择对应的数据操作
5. 保存配置

### 3. 运行时执行

- 当事件触发时,自动执行绑定的数据操作
- 数据操作可以是API调用、数据更新等
- 支持链式操作和数据流转

## 数据操作类型示例

### API调用

- 类型: `api`
- 用途: 调用后端接口
- 示例: 获取用户列表、提交表单

### 数据更新

- 类型: `update`
- 用途: 更新本地数据
- 示例: 修改表格数据、更新状态

### 数据删除

- 类型: `delete`
- 用途: 删除数据
- 示例: 删除列表项、清空表单

### 数据查询

- 类型: `query`
- 用途: 查询数据
- 示例: 搜索、筛选、排序

### 自定义操作

- 类型: `custom`
- 用途: 自定义逻辑
- 示例: 复杂业务逻辑、多步操作

## 测试建议

### 1. 配置测试

1. 添加多个数据操作
2. 确认所有操作都显示在下拉框中
3. 确认显示格式正确: "名称 (类型)"

### 2. 绑定测试

1. 为不同事件绑定不同的数据操作
2. 确认绑定成功保存
3. 确认可以清除绑定

### 3. 执行测试

1. 触发绑定了数据操作的事件
2. 确认数据操作正确执行
3. 确认数据更新正确

### 4. 边界测试

- 测试没有数据操作时的显示
- 测试清除绑定后的行为
- 测试多个事件绑定同一操作

## 文件变更

1. `src/core/renderer/designer/settings/PropertiesPanel.vue`

   - 添加dataOperations prop
   - 将所有事件配置改为下拉框
   - 更新15种事件类型的UI

2. `src/modules/designer/views/DesignerNew.vue`
   - 传入dataOperations prop

## 下一步

1. 实现事件触发时的数据操作执行逻辑
2. 添加数据操作的参数配置
3. 实现数据操作的结果处理
4. 添加错误处理和日志记录
5. 完善数据操作的类型定义
