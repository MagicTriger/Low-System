# Flex 容器布局配置

## 修改内容

### 1. 添加 FlexVisualizer 到 Flex 容器配置

**文件**: `src/core/renderer/controls/register.ts`

**问题**:

- Flex 容器的布局配置字段分散在多个 select 字段中
- 没有使用 FlexVisualizer 可视化组件
- 用户体验不够直观

**解决方案**:
将 Flex 布局的主要配置（方向、对齐、间距）整合到一个字段中，使用 FlexVisualizer 提供可视化配置界面。

**配置变更**:

```typescript
{
  kind: 'flex',
  kindName: '弹性布局',
  type: ControlType.Container,
  icon: 'flex',
  component: FlexControl,
  dataBindable: false,
  events: {
    click: {
      name: '点击事件',
      description: '容器被点击时触发',
    },
  },
  panels: {
    extends: ['basic', 'layout', 'style', 'event'],
    custom: [
      {
        group: 'component' as any,
        title: 'Flex布局',
        icon: 'LayoutOutlined',
        fields: [
          // 新增：使用 FlexVisualizer 的可视化配置字段
          {
            key: 'flexConfig',
            label: 'Flex配置',
            type: 'text' as any,
            defaultValue: {
              direction: 'row',
              justify: 'flex-start',
              align: 'stretch',
              gap: 8,
            },
            layout: { span: 2 },  // 占据整行
            visualizer: {
              type: 'flex',
              interactive: true,
              preview: true,
            },
          },
          // 保留：换行配置
          {
            key: 'flexWrap',
            label: '换行',
            type: 'select' as any,
            defaultValue: 'nowrap',
            options: [
              { label: '不换行', value: 'nowrap' },
              { label: '换行', value: 'wrap' },
              { label: '反向换行', value: 'wrap-reverse' },
            ],
            layout: { span: 2 },
          },
          // 保留：间距配置（作为备用）
          {
            key: 'gap',
            label: '间距',
            type: 'number' as any,
            defaultValue: 0,
            description: '子元素之间的间距(px)',
            layout: { span: 2 },
          },
        ],
      },
    ],
  },
}
```

### 2. FlexVisualizer 功能

FlexVisualizer 提供以下功能：

1. **主轴方向** (flexDirection)

   - 水平 (row)
   - 水平反向 (row-reverse)
   - 垂直 (column)
   - 垂直反向 (column-reverse)

2. **主轴对齐** (justifyContent)

   - 起始对齐 (flex-start)
   - 末尾对齐 (flex-end)
   - 居中对齐 (center)
   - 两端对齐 (space-between)
   - 环绕对齐 (space-around)
   - 均匀对齐 (space-evenly)

3. **交叉轴对齐** (alignItems)

   - 顶部对齐 (flex-start)
   - 底部对齐 (flex-end)
   - 居中对齐 (center)
   - 拉伸 (stretch)
   - 基线对齐 (baseline)

4. **间距** (gap)

   - 数字输入框，单位为 px
   - 实时预览效果

5. **实时预览**
   - 显示 3 个示例子元素
   - 根据配置实时更新布局

## 数据结构

FlexConfig 对象结构：

```typescript
interface FlexConfig {
  direction: 'row' | 'row-reverse' | 'column' | 'column-reverse'
  justify: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly'
  align: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline'
  gap: number // 单位：px
}
```

## 属性更新处理

在 `DesignerNew.vue` 的 `handlePropertyUpdate` 函数中，需要处理 `flexConfig` 属性：

```typescript
function handlePropertyUpdate(property: string, value: any) {
  // ...

  if (property === 'flexConfig') {
    // 将 flexConfig 对象转换为 styles
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      display: 'flex',
      flexDirection: value.direction,
      justifyContent: value.justify,
      alignItems: value.align,
      gap: `${value.gap || 8}px`,
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
    console.log('✅ Flex配置已更新:', value)
  }

  // ...
}
```

## 测试步骤

### 步骤 1: 添加 Flex 容器

1. 在组件库中找到"弹性布局"组件
2. 拖拽到画布上
3. 选中 Flex 容器

### 步骤 2: 打开 Flex 配置

1. 在属性面板中找到"Flex布局"折叠框
2. 展开折叠框
3. 查看"Flex配置"字段

**预期结果**:

- ✅ 显示 FlexVisualizer 可视化配置界面
- ✅ 包含主轴方向、主轴对齐、交叉轴对齐的按钮组
- ✅ 包含间距输入框
- ✅ 显示实时预览框

### 步骤 3: 测试配置功能

1. 点击不同的主轴方向按钮
2. 点击不同的对齐方式按钮
3. 修改间距值

**预期结果**:

- ✅ 预览框实时更新
- ✅ 画布上的 Flex 容器实时更新
- ✅ 配置被正确保存

### 步骤 4: 测试其他字段

1. 修改"换行"配置
2. 修改"间距"数字输入框

**预期结果**:

- ✅ 配置正确应用到容器
- ✅ 所有配置可以正常工作

## 开关按钮切换问题

### 问题描述

用户报告开关按钮点击后不能切换状态。

### 可能原因

1. **modelValue 没有正确更新** - 检查 v-model 绑定
2. **属性更新没有触发** - 检查 handlePropertyUpdate 函数
3. **组件没有重新渲染** - 检查 Vue 响应式更新

### 调试步骤

1. 打开浏览器控制台
2. 点击任意开关按钮
3. 观察日志输出

**预期日志**:

```
[SwitchField] Updating: true/false
[FieldRenderer] Field value updated: disabled = true
[PanelGroup] Field updated: disabled = true
[PropertiesPanel] Updating property: disabled = true
[DesignerNew] 属性更新: disabled = true
[Button] Props updated: {disabled: true, ...}
```

### 解决方案

如果开关不能切换，检查：

1. **SwitchField 组件**:

```vue
<a-switch :checked="modelValue" :disabled="config.disabled" @update:checked="handleUpdate" size="small" />
```

2. **FieldRenderer 的 v-model 绑定**:

```vue
<component :is="rendererComponent" v-model="fieldValue" :config="config" />
```

3. **PanelGroup 的事件传递**:

```vue
<FieldRenderer :config="field" :model-value="values[field.key]" @update:model-value="handleFieldUpdate(field.key, $event)" />
```

## 相关文件

- `src/core/renderer/controls/register.ts` - Flex 容器配置
- `src/core/infrastructure/fields/visualizers/FlexVisualizer.vue` - Flex 可视化组件
- `src/core/infrastructure/fields/renderers/SwitchField.vue` - 开关字段渲染器
- `src/core/infrastructure/fields/FieldRenderer.vue` - 字段渲染器容器
- `src/modules/designer/views/DesignerNew.vue` - 属性更新处理

## 注意事项

1. **FlexConfig 和单独字段的关系**:

   - FlexConfig 用于可视化配置
   - flexWrap 和 gap 字段作为补充配置
   - 两者可以独立工作

2. **样式应用**:

   - FlexConfig 的值需要转换为 CSS 样式
   - 确保在 handlePropertyUpdate 中正确处理

3. **默认值**:
   - 确保 FlexConfig 有合理的默认值
   - 避免 undefined 导致的问题

## 总结

本次修改为 Flex 容器添加了可视化配置界面，使用户可以更直观地配置 Flex 布局。同时保留了原有的单独字段配置，提供更灵活的配置方式。
