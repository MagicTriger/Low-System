import { registerControlDefinitions } from '../definitions'
import type { BaseControlDefinition as ControlDefinition } from '../base'
import { ControlType } from '../base'

// 导入控件组件
import ButtonControl from './common/Button.vue'
import SpanControl from './common/Span.vue'
import ImageControl from './common/Image.vue'
import StringControl from './input/String.vue'
import NumberControl from './input/Number.vue'
import BooleanControl from './input/Boolean.vue'
import FlexControl from './container/Flex.vue'
import GridControl from './container/Grid.vue'
import TableControl from './collection/Table.vue'
import TableHeader from './collection/TableHeader.vue'
import TableRow from './collection/TableRow.vue'

// 图表控件
import LineChart from './chart/LineChart.vue'
import BarChart from './chart/BarChart.vue'
import PieChart from './chart/PieChart.vue'

// 移动端控件
import MobileContainer from './mobile/MobileContainer.vue'
import MobileList from './mobile/MobileList.vue'

// SVG控件
import SvgIcon from './svg/SvgIcon.vue'
import SvgShape from './svg/SvgShape.vue'

// 大屏控件
import DataPanel from './dashboard/DataPanel.vue'
import DashboardContainer from './dashboard/DashboardContainer.vue'

// 自定义控件
import CustomComponent from './custom/CustomComponent.vue'
import UserManagementComponent from './custom/UserManagementComponent.vue'

// 输入控件
import TextInput from './input/TextInput.vue'
import Number from './input/Number.vue'
import Boolean from './input/Boolean.vue'
import Date from './input/Date.vue'
import Upload from './input/Upload.vue'
import DatePicker from './input/DatePicker.vue'
import NumberInput from './input/NumberInput.vue'
import PasswordInput from './input/PasswordInput.vue'
import RichText from './input/RichText.vue'
import Select from './input/Select.vue'
import Textarea from './input/Textarea.vue'
import Radio from './input/Radio.vue'
import Checkbox from './input/Checkbox.vue'

// 输入控件定义
const inputControls = {
  'text-input': {
    component: TextInput,
    name: '文本输入',
    category: 'input',
    icon: 'EditOutlined',
    description: '单行文本输入框',
    defaultProps: {
      placeholder: '请输入文本',
      size: 'middle',
    },
  },
  number: {
    component: Number,
    name: '数字输入',
    category: 'input',
    icon: 'NumberOutlined',
    description: '数字输入控件',
    defaultProps: {
      placeholder: '请输入数字',
      size: 'middle',
    },
  },
  boolean: {
    component: Boolean,
    name: '布尔值',
    category: 'input',
    icon: 'CheckSquareOutlined',
    description: '布尔值输入控件',
    defaultProps: {
      type: 'checkbox',
      size: 'middle',
    },
  },
  date: {
    component: Date,
    name: '日期',
    category: 'input',
    icon: 'CalendarOutlined',
    description: '日期选择控件',
    defaultProps: {
      mode: 'date',
      size: 'middle',
    },
  },
  upload: {
    component: Upload,
    name: '文件上传',
    category: 'input',
    icon: 'UploadOutlined',
    description: '文件上传控件',
    defaultProps: {
      listType: 'text',
      multiple: false,
    },
  },
  'date-picker': {
    component: DatePicker,
    name: '日期选择器',
    category: 'input',
    icon: 'CalendarOutlined',
    description: '日期时间选择器',
    defaultProps: {
      picker: 'date',
      size: 'middle',
    },
  },
  'number-input': {
    component: NumberInput,
    name: '数字输入框',
    category: 'input',
    icon: 'NumberOutlined',
    description: '数字输入框控件',
    defaultProps: {
      placeholder: '请输入数字',
      size: 'middle',
    },
  },
  'password-input': {
    component: PasswordInput,
    name: '密码输入',
    category: 'input',
    icon: 'LockOutlined',
    description: '密码输入框控件',
    defaultProps: {
      placeholder: '请输入密码',
      size: 'middle',
    },
  },
  'rich-text': {
    component: RichText,
    name: '富文本编辑器',
    category: 'input',
    icon: 'EditOutlined',
    description: '富文本编辑器控件',
    defaultProps: {
      placeholder: '请输入内容',
      showToolbar: true,
    },
  },
  select: {
    component: Select,
    name: '选择器',
    category: 'input',
    icon: 'SelectOutlined',
    description: '下拉选择器控件',
    defaultProps: {
      placeholder: '请选择',
      size: 'middle',
      options: [],
    },
  },
  textarea: {
    component: Textarea,
    name: '多行文本',
    category: 'input',
    icon: 'EditOutlined',
    description: '多行文本输入框',
    defaultProps: {
      placeholder: '请输入文本',
      rows: 4,
    },
  },
  radio: {
    component: Radio,
    name: '单选按钮',
    category: 'input',
    icon: 'RadioButtonOutlined',
    description: '单选按钮控件',
    defaultProps: {
      type: 'group',
      size: 'middle',
      options: [],
    },
  },
  checkbox: {
    component: Checkbox,
    name: '复选框',
    category: 'input',
    icon: 'CheckSquareOutlined',
    description: '复选框控件',
    defaultProps: {
      type: 'group',
      options: [],
    },
  },
}

/**
 * 控件注册表类型定义
 */
type ControlRegistryItem = {
  component: any
  name: string
  category: string
  icon: string
  description: string
  defaultProps: Record<string, any>
}

/**
 * 注册所有基础控件
 */
export const controlRegistry: Record<string, ControlRegistryItem> = {
  // 合并所有控件类型
  ...inputControls,

  // 通用控件
  image: {
    component: ImageControl,
    name: '图片',
    category: 'common',
    icon: 'PictureOutlined',
    description: '图片显示控件',
    defaultProps: {
      src: '',
      alt: '图片',
      width: 'auto',
      height: 'auto',
    },
  },

  // 布局控件
  grid: {
    component: GridControl,
    name: '网格布局',
    category: 'layout',
    icon: 'AppstoreOutlined',
    description: '网格布局容器',
    defaultProps: {
      columns: 2,
      gap: 16,
      justify: 'start',
      align: 'top',
    },
  },

  // 集合控件
  table: {
    component: TableControl,
    name: '表格',
    category: 'collection',
    icon: 'TableOutlined',
    description: '数据表格控件',
    defaultProps: {
      columns: [],
      dataSource: [],
      pagination: true,
      size: 'middle',
    },
  },

  // 图表控件
  'line-chart': {
    component: LineChart,
    name: '折线图',
    category: 'chart',
    icon: 'LineChartOutlined',
    description: '折线图表控件',
    defaultProps: {
      width: '100%',
      height: '300px',
      theme: 'default',
      data: [
        { name: '1月', value: 120 },
        { name: '2月', value: 132 },
        { name: '3月', value: 101 },
        { name: '4月', value: 134 },
        { name: '5月', value: 90 },
        { name: '6月', value: 230 },
      ],
    },
  },
  'bar-chart': {
    component: BarChart,
    name: '柱状图',
    category: 'chart',
    icon: 'BarChartOutlined',
    description: '柱状图表控件',
    defaultProps: {
      width: '100%',
      height: '300px',
      theme: 'default',
      orientation: 'vertical',
      data: [
        { name: '产品A', value: 320 },
        { name: '产品B', value: 302 },
        { name: '产品C', value: 301 },
        { name: '产品D', value: 334 },
        { name: '产品E', value: 390 },
      ],
    },
  },
  'pie-chart': {
    component: PieChart,
    name: '饼图',
    category: 'chart',
    icon: 'PieChartOutlined',
    description: '饼图表控件',
    defaultProps: {
      width: '100%',
      height: '300px',
      theme: 'default',
      chartType: 'pie',
      showLabel: true,
      showLegend: true,
      data: [
        { name: '直接访问', value: 335 },
        { name: '邮件营销', value: 310 },
        { name: '联盟广告', value: 234 },
        { name: '视频广告', value: 135 },
        { name: '搜索引擎', value: 1548 },
      ],
    },
  },

  // 移动端控件
  'mobile-container': {
    component: MobileContainer,
    name: '移动端容器',
    category: 'mobile',
    icon: 'MobileOutlined',
    description: '移动端页面容器',
    defaultProps: {
      title: '移动端页面',
      showHeader: true,
      showFooter: false,
      showBackButton: false,
      showMenuButton: false,
      backgroundColor: '#f5f5f5',
      headerColor: '#ffffff',
      footerColor: '#ffffff',
      borderRadius: '12px',
      showBorder: true,
      orientation: 'portrait',
      width: '375px',
      height: '667px',
    },
  },
  'mobile-list': {
    component: MobileList,
    name: '移动端列表',
    category: 'mobile',
    icon: 'UnorderedListOutlined',
    description: '移动端列表控件',
    defaultProps: {
      showSearch: false,
      showAvatar: true,
      showDescription: true,
      showExtra: false,
      showArrow: true,
      showActions: false,
      showLoadMore: false,
      hasMore: false,
      emptyText: '暂无数据',
      loadMoreText: '加载更多',
      avatarSize: 'default',
      avatarShape: 'circle',
      itemHeight: 'auto',
      divider: true,
      backgroundColor: '#ffffff',
      data: [
        {
          id: 1,
          title: '列表项目 1',
          description: '这是第一个列表项目的描述信息',
          avatar: '',
          extra: '刚刚',
        },
        {
          id: 2,
          title: '列表项目 2',
          description: '这是第二个列表项目的描述信息',
          avatar: '',
          extra: '5分钟前',
        },
        {
          id: 3,
          title: '列表项目 3',
          description: '这是第三个列表项目的描述信息',
          avatar: '',
          extra: '1小时前',
        },
      ],
    },
  },

  // SVG控件
  'svg-icon': {
    component: SvgIcon,
    name: 'SVG图标',
    category: 'svg',
    icon: 'FileImageOutlined',
    description: 'SVG矢量图标控件',
    defaultProps: {
      iconName: 'FileImageOutlined',
      width: '24',
      height: '24',
      color: '#333333',
      size: 'default',
      rotation: 0,
      flipX: false,
      flipY: false,
      opacity: 1,
      cursor: 'default',
      label: '',
      showLabel: false,
      labelPosition: 'bottom',
      animation: 'none',
    },
  },
  'svg-shape': {
    component: SvgShape,
    name: 'SVG形状',
    category: 'svg',
    icon: 'BgColorsOutlined',
    description: 'SVG几何形状控件',
    defaultProps: {
      shapeType: 'rectangle',
      width: '100',
      height: '100',
      fillColor: '#1890ff',
      strokeColor: 'none',
      strokeWidth: 1,
      strokeDasharray: 'none',
      opacity: 1,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      borderRadius: 0,
      gradientType: 'none',
      gradientStops: [],
      patternType: 'none',
      text: '',
      showText: false,
      textColor: '#333333',
      fontSize: '14',
      fontFamily: 'Arial, sans-serif',
      textAnchor: 'middle',
      textBaseline: 'middle',
      cursor: 'default',
    },
  },
}

export function registerBasicControls() {
  console.log('🚀 registerBasicControls() called')

  const definitions: ControlDefinition[] = [
    // 按钮组件
    {
      kind: 'button',
      kindName: '按钮',
      type: ControlType.Common,
      icon: 'button',
      component: ButtonControl,
      dataBindable: true,
      events: {
        click: {
          name: '点击事件',
          description: '按钮被点击时触发',
        },
      },
      panels: {
        extends: ['basic', 'layout', 'style', 'event'],
        custom: [
          {
            group: 'component' as any,
            title: '按钮属性',
            icon: 'SettingOutlined',
            fields: [
              {
                key: 'text',
                label: '按钮文本',
                type: 'text' as any,
                defaultValue: '按钮',
                layout: { span: 24 },
              },
              {
                key: 'type',
                label: '按钮类型',
                type: 'select' as any,
                defaultValue: 'default',
                options: [
                  { label: '默认', value: 'default' },
                  { label: '主要', value: 'primary' },
                  { label: '虚线', value: 'dashed' },
                  { label: '文本', value: 'text' },
                  { label: '链接', value: 'link' },
                ],
                layout: { span: 12 },
              },
              {
                key: 'size',
                label: '按钮大小',
                type: 'select' as any,
                defaultValue: 'middle',
                options: [
                  { label: '大', value: 'large' },
                  { label: '中', value: 'middle' },
                  { label: '小', value: 'small' },
                ],
                layout: { span: 12 },
              },
              {
                key: 'icon',
                label: '图标',
                type: 'icon' as any,
                layout: { span: 12 },
              },
              {
                key: 'danger',
                label: '危险按钮',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 2 },
              },
              {
                key: 'ghost',
                label: '幽灵按钮',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 2 },
              },
              {
                key: 'loading',
                label: '加载状态',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 2 },
              },
              {
                key: 'block',
                label: '块级按钮',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 2 },
              },
            ],
          },
        ],
      },
    },

    {
      kind: 'span',
      kindName: '文本',
      type: ControlType.Common,
      icon: 'text',
      component: SpanControl,
      dataBindable: true,
      events: {
        click: {
          name: '点击事件',
          description: '文本被点击时触发',
        },
      },
      panels: {
        extends: ['basic', 'layout', 'style', 'event'],
        custom: [
          {
            group: 'component' as any,
            title: '文本属性',
            icon: 'FontSizeOutlined',
            fields: [
              {
                key: 'text',
                label: '文本内容',
                type: 'textarea' as any,
                defaultValue: '文本',
                layout: { span: 24 },
              },
              {
                key: 'html',
                label: 'HTML内容',
                type: 'textarea' as any,
                description: '支持HTML标签',
                layout: { span: 24 },
              },
              {
                key: 'ellipsis',
                label: '文本省略',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'strong',
                label: '加粗',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'italic',
                label: '斜体',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'underline',
                label: '下划线',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'delete',
                label: '删除线',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'code',
                label: '代码样式',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
            ],
          },
        ],
      },
    },

    {
      kind: 'image',
      kindName: '图片',
      type: ControlType.Common,
      icon: 'image',
      component: ImageControl,
      dataBindable: true,
      events: {
        click: {
          name: '点击事件',
          description: '图片被点击时触发',
        },
        load: {
          name: '加载完成',
          description: '图片加载完成时触发',
        },
        error: {
          name: '加载失败',
          description: '图片加载失败时触发',
        },
      },
      panels: {
        extends: ['basic', 'layout', 'style', 'event'],
        custom: [
          {
            group: 'component' as any,
            title: '图片属性',
            icon: 'PictureOutlined',
            fields: [
              {
                key: 'src',
                label: '图片地址',
                type: 'text' as any,
                placeholder: 'https://example.com/image.jpg',
                layout: { span: 24 },
              },
              {
                key: 'alt',
                label: '替代文本',
                type: 'text' as any,
                description: '图片无法显示时的文本',
                layout: { span: 24 },
              },
              {
                key: 'fit',
                label: '填充模式',
                type: 'select' as any,
                defaultValue: 'cover',
                options: [
                  { label: '填充', value: 'fill' },
                  { label: '包含', value: 'contain' },
                  { label: '覆盖', value: 'cover' },
                  { label: '无', value: 'none' },
                  { label: '缩小', value: 'scale-down' },
                ],
                layout: { span: 12 },
              },
              {
                key: 'preview',
                label: '支持预览',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'lazy',
                label: '懒加载',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
            ],
          },
        ],
      },
    },

    // 输入组件
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
        custom: [
          {
            group: 'component' as any,
            title: '输入属性',
            icon: 'EditOutlined',
            fields: [
              {
                key: 'placeholder',
                label: '占位符',
                type: 'text' as any,
                placeholder: '请输入占位符文本',
                layout: { span: 24 },
              },
              {
                key: 'maxLength',
                label: '最大长度',
                type: 'number' as any,
                layout: { span: 12 },
              },
              {
                key: 'showCount',
                label: '显示字数',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'allowClear',
                label: '清除按钮',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'disabled',
                label: '禁用',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
            ],
          },
        ],
      },
    },

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
        custom: [
          {
            group: 'component' as any,
            title: '数字属性',
            icon: 'NumberOutlined',
            fields: [
              {
                key: 'min',
                label: '最小值',
                type: 'number' as any,
                layout: { span: 12 },
              },
              {
                key: 'max',
                label: '最大值',
                type: 'number' as any,
                layout: { span: 12 },
              },
              {
                key: 'step',
                label: '步长',
                type: 'number' as any,
                defaultValue: 1,
                layout: { span: 12 },
              },
              {
                key: 'precision',
                label: '精度',
                type: 'number' as any,
                description: '数值精度(小数位数)',
                layout: { span: 12 },
              },
              {
                key: 'disabled',
                label: '禁用',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
            ],
          },
        ],
      },
    },

    {
      kind: 'boolean',
      kindName: '布尔输入',
      type: ControlType.Input,
      icon: 'checkbox',
      component: BooleanControl,
      dataBindable: true,
      events: {
        change: {
          name: '值变化',
          description: '布尔值发生变化时触发',
        },
      },
    },

    // 容器组件
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
            group: 'flex' as any,
            title: 'Flex布局',
            icon: 'LayoutOutlined',
            order: 5,
            fields: [
              {
                key: 'flexConfig',
                label: 'Flex配置',
                type: 'text' as any,
                defaultValue: {
                  direction: 'row',
                  justify: 'flex-start',
                  align: 'stretch',
                  flexRatio: '1:1:1',
                },
                layout: { span: 2 },
                visualizer: {
                  type: 'flex',
                  interactive: true,
                  preview: true,
                },
              },
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
            ],
          },
        ],
      },
    },

    {
      kind: 'grid',
      kindName: '网格布局',
      type: ControlType.Container,
      icon: 'grid',
      component: GridControl,
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
            group: 'flex' as any,
            title: 'Flex布局',
            icon: 'LayoutOutlined',
            order: 5,
            fields: [
              {
                key: 'flexConfig',
                label: 'Flex配置',
                type: 'text' as any,
                defaultValue: {
                  direction: 'row',
                  justify: 'flex-start',
                  align: 'stretch',
                  flexRatio: '1:1:1',
                },
                layout: { span: 2 },
                visualizer: {
                  type: 'flex',
                  interactive: true,
                  preview: true,
                },
              },
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
            ],
          },
        ],
      },
    },

    // 集合组件（在设计器中可作为容器）
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
        custom: [
          {
            group: 'component' as any,
            title: '表格属性',
            icon: 'TableOutlined',
            fields: [
              {
                key: 'bordered',
                label: '显示边框',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'striped',
                label: '斑马纹',
                type: 'switch' as any,
                defaultValue: false,
                layout: { span: 12 },
              },
              {
                key: 'showHeader',
                label: '显示表头',
                type: 'switch' as any,
                defaultValue: true,
                layout: { span: 12 },
              },
              {
                key: 'pagination',
                label: '分页',
                type: 'switch' as any,
                defaultValue: true,
                layout: { span: 12 },
              },
              {
                key: 'pageSize',
                label: '每页条数',
                type: 'number' as any,
                defaultValue: 10,
                layout: { span: 12 },
              },
              {
                key: 'size',
                label: '表格大小',
                type: 'select' as any,
                defaultValue: 'middle',
                options: [
                  { label: '大', value: 'large' },
                  { label: '中', value: 'middle' },
                  { label: '小', value: 'small' },
                ],
                layout: { span: 12 },
              },
            ],
          },
          {
            group: 'flex' as any,
            title: 'Flex布局',
            icon: 'LayoutOutlined',
            order: 5,
            fields: [
              {
                key: 'flexConfig',
                label: 'Flex配置',
                type: 'text' as any,
                defaultValue: {
                  direction: 'row',
                  justify: 'flex-start',
                  align: 'stretch',
                  flexRatio: '1:1:1',
                },
                layout: { span: 2 },
                visualizer: {
                  type: 'flex',
                  interactive: true,
                  preview: true,
                },
              },
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
            ],
          },
        ],
      },
    },

    // 表格头组件
    {
      kind: 'table-header',
      kindName: '表格头',
      type: ControlType.Container,
      icon: 'table',
      component: TableHeader,
      dataBindable: false,
      events: {},
    },

    // 表格行组件
    {
      kind: 'table-row',
      kindName: '表格行',
      type: ControlType.Container,
      icon: 'table',
      component: TableRow,
      dataBindable: true,
      events: {
        click: {
          name: '行点击',
          description: '表格行被点击时触发',
        },
      },
    },

    // 图表组件
    {
      kind: 'line-chart',
      kindName: '折线图',
      type: ControlType.Chart,
      icon: 'line-chart',
      component: LineChart,
      dataBindable: true,
      events: {
        click: {
          name: '点击事件',
          description: '图表被点击时触发',
        },
      },
    },

    {
      kind: 'bar-chart',
      kindName: '柱状图',
      type: ControlType.Chart,
      icon: 'bar-chart',
      component: BarChart,
      dataBindable: true,
      events: {
        click: {
          name: '点击事件',
          description: '图表被点击时触发',
        },
      },
    },

    {
      kind: 'pie-chart',
      kindName: '饼图',
      type: ControlType.Chart,
      icon: 'pie-chart',
      component: PieChart,
      dataBindable: true,
      events: {
        click: {
          name: '点击事件',
          description: '图表被点击时触发',
        },
      },
    },

    // 移动端组件
    {
      kind: 'mobile-container',
      kindName: '移动端容器',
      type: ControlType.Mobile,
      icon: 'mobile',
      component: MobileContainer,
      dataBindable: false,
      events: {},
    },

    {
      kind: 'mobile-list',
      kindName: '移动端列表',
      type: ControlType.Mobile,
      icon: 'list',
      component: MobileList,
      dataBindable: true,
      events: {
        itemClick: {
          name: '项目点击',
          description: '列表项被点击时触发',
        },
      },
    },

    // SVG组件
    {
      kind: 'svg-icon',
      kindName: 'SVG图标',
      type: ControlType.SVG,
      icon: 'icon',
      component: SvgIcon,
      dataBindable: false,
      events: {
        click: {
          name: '点击事件',
          description: 'SVG图标被点击时触发',
        },
      },
    },

    {
      kind: 'svg-shape',
      kindName: 'SVG形状',
      type: ControlType.SVG,
      icon: 'shape',
      component: SvgShape,
      dataBindable: false,
      events: {
        click: {
          name: '点击事件',
          description: 'SVG形状被点击时触发',
        },
      },
    },

    // 大屏组件
    {
      kind: 'data-panel',
      kindName: '数据面板',
      type: ControlType.Dashboard,
      icon: 'dashboard',
      component: DataPanel,
      dataBindable: true,
      events: {},
    },

    {
      kind: 'dashboard-container',
      kindName: '大屏容器',
      type: ControlType.Dashboard,
      icon: 'dashboard',
      component: DashboardContainer,
      dataBindable: false,
      events: {},
    },

    // 自定义组件
    {
      kind: 'custom',
      kindName: '自定义组件',
      type: ControlType.Custom,
      icon: 'custom',
      component: CustomComponent,
      dataBindable: true,
      events: {},
    },

    // 用户管理组件
    {
      kind: 'user-management',
      kindName: '用户管理',
      type: ControlType.Custom,
      icon: 'team',
      component: UserManagementComponent,
      dataBindable: false,
      events: {},
      panels: {
        extends: ['basic', 'layout', 'style'],
        custom: [
          {
            group: 'component' as any,
            title: '组件属性',
            icon: 'SettingOutlined',
            fields: [
              {
                key: 'pageSize',
                label: '每页条数',
                type: 'number' as any,
                defaultValue: 10,
                min: 5,
                max: 100,
                layout: { span: 12 },
              },
              {
                key: 'showSearch',
                label: '显示搜索栏',
                type: 'switch' as any,
                defaultValue: true,
                layout: { span: 12 },
              },
            ],
          },
        ],
      },
    },
  ]

  registerControlDefinitions(definitions)
}
