# 核心4组件完整配置代码

直接复制以下代码到 `src/core/renderer/controls/register.ts` 中对应组件的位置。

---

## 1. String组件配置

找到String组件定义,添加panels配置:

```typescript
{
  kind: 'string',
  kindName: '文本输入',
  type: ControlType.Input,
  icon: 'input',
  component: StringControl,
  dataBindable: true,
  events: {
    change: {
      name: '值变化',
      description: '输入值发生变化时触发',
    },
    focus: {
      name: '获得焦点',
      description: '输入框获得焦点时触发',
    },
    blur: {
      name: '失去焦点',
      description: '输入框失去焦点时触发',
    },
    pressEnter: {
      name: '按下回车',
      description: '按下回车键时触发',
    },
  },
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
          placeholder: '请输入占位符文本',
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
},
```

---

## 2. Number组件配置

找到Number组件定义,添加panels配置:

```typescript
{
  kind: 'number',
  kindName: '数字输入',
  type: ControlType.Input,
  icon: 'number',
  component: NumberControl,
  dataBindable: true,
  events: {
    change: {
      name: '值变化',
      description: '数字值发生变化时触发',
    },
    focus: {
      name: '获得焦点',
      description: '输入框获得焦点时触发',
    },
    blur: {
      name: '失去焦点',
      description: '输入框失去焦点时触发',
    },
  },
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
          description: '数值精度(小数位数)',
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
},
```

---

## 3. Flex组件配置

找到Flex组件定义,添加panels配置:

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
          description: '子元素之间的间距(px)',
          layout: { span: 12 }
        }
      ]
    }]
  }
},
```

---

## 4. Table组件配置

找到Table组件定义,添加panels配置:

```typescript
{
  kind: 'table',
  kindName: '表格',
  type: ControlType.Container,
  icon: 'table',
  component: TableControl,
  dataBindable: true,
  events: {
    change: {
      name: '表格变化',
      description: '表格数据或状态发生变化时触发',
    },
    rowClick: {
      name: '行点击',
      description: '表格行被点击时触发',
    },
    rowDblClick: {
      name: '行双击',
      description: '表格行被双击时触发',
    },
  },
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
},
```

---

## 应用说明

1. 打开 `src/core/renderer/controls/register.ts`
2. 找到对应的组件定义(搜索 `kind: 'string'` 等)
3. 将上面的完整配置替换原有的组件定义
4. 保存文件
5. 检查TypeScript错误

完成后,这4个组件就有完整的属性面板配置了!
