# 组件Panels配置参考文档

本文档提供所有组件的panels配置参考,可以直接复制到`src/core/renderer/controls/register.ts`中。

---

## 输入组件配置

### String (文本输入)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '输入属性',
    icon: 'EditOutlined',
    fields: [
      {
        key: 'placeholder',
        label: '占位符',
        type: 'text' as any,
        layout: { span: 24 }
      },
      {
        key: 'maxLength',
        label: '最大长度',
        type: 'number' as any,
        layout: { span: 12 }
      },
      {
        key: 'showCount',
        label: '显示字数',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      },
      {
        key: 'allowClear',
        label: '清除按钮',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      }
    ]
  }]
}
```

### Number (数字输入)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '数字属性',
    icon: 'NumberOutlined',
    fields: [
      {
        key: 'min',
        label: '最小值',
        type: 'number' as any,
        layout: { span: 12 }
      },
      {
        key: 'max',
        label: '最大值',
        type: 'number' as any,
        layout: { span: 12 }
      },
      {
        key: 'step',
        label: '步长',
        type: 'number' as any,
        defaultValue: 1,
        layout: { span: 12 }
      },
      {
        key: 'precision',
        label: '精度',
        type: 'number' as any,
        layout: { span: 12 }
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      }
    ]
  }]
}
```

### Boolean (布尔输入)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '开关属性',
    icon: 'CheckSquareOutlined',
    fields: [
      {
        key: 'checkedText',
        label: '选中文本',
        type: 'text' as any,
        layout: { span: 12 }
      },
      {
        key: 'uncheckedText',
        label: '未选中文本',
        type: 'text' as any,
        layout: { span: 12 }
      },
      {
        key: 'disabled',
        label: '禁用',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      }
    ]
  }]
}
```

---

## 容器组件配置

### Flex (弹性布局)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: 'Flex布局',
    icon: 'LayoutOutlined',
    fields: [
      {
        key: 'flexDirection',
        label: '主轴方向',
        type: 'select' as any,
        defaultValue: 'row',
        options: [
          { label: '水平', value: 'row' },
          { label: '水平反向', value: 'row-reverse' },
          { label: '垂直', value: 'column' },
          { label: '垂直反向', value: 'column-reverse' }
        ],
        visualizer: 'flex',
        layout: { span: 12 }
      },
      {
        key: 'justifyContent',
        label: '主轴对齐',
        type: 'select' as any,
        defaultValue: 'flex-start',
        options: [
          { label: '起点', value: 'flex-start' },
          { label: '终点', value: 'flex-end' },
          { label: '居中', value: 'center' },
          { label: '两端', value: 'space-between' },
          { label: '环绕', value: 'space-around' },
          { label: '均分', value: 'space-evenly' }
        ],
        visualizer: 'flex',
        layout: { span: 12 }
      },
      {
        key: 'alignItems',
        label: '交叉轴对齐',
        type: 'select' as any,
        defaultValue: 'stretch',
        options: [
          { label: '起点', value: 'flex-start' },
          { label: '终点', value: 'flex-end' },
          { label: '居中', value: 'center' },
          { label: '基线', value: 'baseline' },
          { label: '拉伸', value: 'stretch' }
        ],
        visualizer: 'flex',
        layout: { span: 12 }
      },
      {
        key: 'flexWrap',
        label: '换行',
        type: 'select' as any,
        defaultValue: 'nowrap',
        options: [
          { label: '不换行', value: 'nowrap' },
          { label: '换行', value: 'wrap' },
          { label: '反向换行', value: 'wrap-reverse' }
        ],
        layout: { span: 12 }
      },
      {
        key: 'gap',
        label: '间距',
        type: 'number' as any,
        defaultValue: 0,
        layout: { span: 12 }
      }
    ]
  }]
}
```

### Grid (网格布局)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: 'Grid布局',
    icon: 'AppstoreOutlined',
    fields: [
      {
        key: 'columns',
        label: '列数',
        type: 'number' as any,
        defaultValue: 2,
        layout: { span: 12 }
      },
      {
        key: 'rows',
        label: '行数',
        type: 'number' as any,
        layout: { span: 12 }
      },
      {
        key: 'columnGap',
        label: '列间距',
        type: 'number' as any,
        defaultValue: 16,
        layout: { span: 12 }
      },
      {
        key: 'rowGap',
        label: '行间距',
        type: 'number' as any,
        defaultValue: 16,
        layout: { span: 12 }
      },
      {
        key: 'autoFlow',
        label: '自动流',
        type: 'select' as any,
        defaultValue: 'row',
        options: [
          { label: '行', value: 'row' },
          { label: '列', value: 'column' },
          { label: '密集行', value: 'row dense' },
          { label: '密集列', value: 'column dense' }
        ],
        layout: { span: 12 }
      }
    ]
  }]
}
```

---

## 集合组件配置

### Table (表格)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '表格属性',
    icon: 'TableOutlined',
    fields: [
      {
        key: 'bordered',
        label: '显示边框',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      },
      {
        key: 'striped',
        label: '斑马纹',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      },
      {
        key: 'showHeader',
        label: '显示表头',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'pagination',
        label: '分页',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'pageSize',
        label: '每页条数',
        type: 'number' as any,
        defaultValue: 10,
        layout: { span: 12 }
      },
      {
        key: 'size',
        label: '表格大小',
        type: 'select' as any,
        defaultValue: 'middle',
        options: [
          { label: '大', value: 'large' },
          { label: '中', value: 'middle' },
          { label: '小', value: 'small' }
        ],
        layout: { span: 12 }
      }
    ]
  }]
}
```

---

## 图表组件配置

### LineChart (折线图)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '图表属性',
    icon: 'LineChartOutlined',
    fields: [
      {
        key: 'title',
        label: '图表标题',
        type: 'text' as any,
        layout: { span: 24 }
      },
      {
        key: 'smooth',
        label: '平滑曲线',
        type: 'switch' as any,
        defaultValue: false,
        layout: { span: 12 }
      },
      {
        key: 'showLegend',
        label: '显示图例',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'showGrid',
        label: '显示网格',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'showTooltip',
        label: '显示提示',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      }
    ]
  }]
}
```

### BarChart (柱状图)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '图表属性',
    icon: 'BarChartOutlined',
    fields: [
      {
        key: 'title',
        label: '图表标题',
        type: 'text' as any,
        layout: { span: 24 }
      },
      {
        key: 'orientation',
        label: '方向',
        type: 'select' as any,
        defaultValue: 'vertical',
        options: [
          { label: '垂直', value: 'vertical' },
          { label: '水平', value: 'horizontal' }
        ],
        layout: { span: 12 }
      },
      {
        key: 'showLegend',
        label: '显示图例',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'showGrid',
        label: '显示网格',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      }
    ]
  }]
}
```

### PieChart (饼图)

```typescript
panels: {
  extends: ['basic', 'layout', 'style', 'event'],
  custom: [{
    group: 'component' as any,
    title: '图表属性',
    icon: 'PieChartOutlined',
    fields: [
      {
        key: 'title',
        label: '图表标题',
        type: 'text' as any,
        layout: { span: 24 }
      },
      {
        key: 'chartType',
        label: '图表类型',
        type: 'select' as any,
        defaultValue: 'pie',
        options: [
          { label: '饼图', value: 'pie' },
          { label: '环形图', value: 'doughnut' }
        ],
        layout: { span: 12 }
      },
      {
        key: 'showLabel',
        label: '显示标签',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'showLegend',
        label: '显示图例',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      },
      {
        key: 'showPercentage',
        label: '显示百分比',
        type: 'switch' as any,
        defaultValue: true,
        layout: { span: 12 }
      }
    ]
  }]
}
```

---

## 使用说明

### 1. 复制配置

将上述配置复制到对应组件定义的`panels`字段中。

### 2. 调整字段

根据实际需求调整:

- `key` - 属性键名
- `label` - 显示标签
- `type` - 字段类型
- `defaultValue` - 默认值
- `options` - 选项(select类型)
- `layout.span` - 布局宽度(12=半列, 24=整列)

### 3. 添加可视化

对于需要可视化的字段,添加`visualizer`属性:

- `flex` - Flex布局可视化
- `margin-padding` - 内外边距可视化
- `border` - 边框可视化
- `position` - 定位可视化
- `size` - 尺寸可视化
- `font-size` - 字体大小可视化

### 4. 验证配置

添加配置后:

1. 检查TypeScript类型错误
2. 运行应用测试面板显示
3. 验证字段功能正常

---

## 配置模板

```typescript
{
  kind: 'component-name',
  kindName: '组件名称',
  type: ControlType.XXX,
  icon: 'icon-name',
  component: ComponentVue,
  dataBindable: true,
  events: { /* 事件定义 */ },
  panels: {
    extends: ['basic', 'layout', 'style', 'event'],
    custom: [{
      group: 'component' as any,
      title: '组件属性',
      icon: 'IconName',
      fields: [
        {
          key: 'propertyName',
          label: '显示标签',
          type: 'text' as any,
          defaultValue: '',
          layout: { span: 12 }
        }
      ]
    }]
  }
}
```

---

## 注意事项

1. **类型断言** - 所有`type`和`group`需要`as any`断言
2. **布局优化** - 合理使用span: 12(半列)和24(整列)
3. **字段顺序** - 按重要性和逻辑分组排列字段
4. **默认值** - 为常用字段提供合理的默认值
5. **验证规则** - 可添加validation数组进行验证

---

**文档版本**: 1.0  
**最后更新**: 2025-10-13
