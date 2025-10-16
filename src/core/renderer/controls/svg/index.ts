// SVG控件导出
export { default as SvgIcon } from './SvgIcon.vue'
export { default as SvgShape } from './SvgShape.vue'

// SVG控件类型定义
export interface SvgIconProps {
  iconName?: string
  iconUrl?: string
  iconData?: string
  width?: string | number
  height?: string | number
  color?: string
  hoverColor?: string
  size?: 'small' | 'default' | 'large' | 'custom'
  rotation?: number
  flipX?: boolean
  flipY?: boolean
  opacity?: number
  cursor?: string
  label?: string
  showLabel?: boolean
  labelPosition?: 'top' | 'bottom' | 'left' | 'right'
  animation?: 'none' | 'spin' | 'pulse' | 'bounce'
  viewBox?: string
}

export interface GradientStop {
  offset: string
  color: string
  opacity?: number
}

export interface SvgShapeProps {
  shapeType?: 'rectangle' | 'circle' | 'ellipse' | 'triangle' | 'polygon' | 'line' | 'polyline' | 'path'
  width?: string | number
  height?: string | number
  fillColor?: string
  strokeColor?: string
  strokeWidth?: number
  strokeDasharray?: string
  opacity?: number
  rotation?: number
  scaleX?: number
  scaleY?: number
  borderRadius?: number
  
  // 渐变属性
  gradientType?: 'none' | 'linear' | 'radial'
  gradientStops?: GradientStop[]
  gradientStart?: { x: string; y: string }
  gradientEnd?: { x: string; y: string }
  gradientCenter?: { x: string; y: string }
  gradientRadius?: string
  
  // 图案属性
  patternType?: 'none' | 'dots' | 'lines' | 'grid'
  patternSize?: { width: number; height: number }
  patternUnits?: string
  
  // 文本属性
  text?: string
  showText?: boolean
  textColor?: string
  fontSize?: string | number
  fontFamily?: string
  textAnchor?: 'start' | 'middle' | 'end'
  textBaseline?: 'auto' | 'baseline' | 'before-edge' | 'text-before-edge' | 'middle' | 'central' | 'after-edge' | 'text-after-edge' | 'ideographic' | 'alphabetic' | 'hanging' | 'mathematical'
  
  // 交互属性
  hoverFillColor?: string
  hoverStrokeColor?: string
  cursor?: string
  
  // 特定形状属性
  points?: string // 用于 polygon, polyline
  pathData?: string // 用于 path
  x1?: number // 用于 line
  y1?: number
  x2?: number
  y2?: number
  
  viewBox?: string
}

// SVG控件配置
export const SvgControlConfigs = {
  SvgIcon: {
    name: 'SVG图标',
    icon: 'file-image',
    category: 'svg',
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
      animation: 'none'
    }
  },
  SvgShape: {
    name: 'SVG形状',
    icon: 'bg-colors',
    category: 'svg',
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
      cursor: 'default'
    }
  }
}

// 预设形状配置
export const ShapePresets = {
  rectangle: {
    name: '矩形',
    shapeType: 'rectangle',
    width: '100',
    height: '60'
  },
  square: {
    name: '正方形',
    shapeType: 'rectangle',
    width: '80',
    height: '80'
  },
  circle: {
    name: '圆形',
    shapeType: 'circle',
    width: '80',
    height: '80'
  },
  ellipse: {
    name: '椭圆',
    shapeType: 'ellipse',
    width: '120',
    height: '80'
  },
  triangle: {
    name: '三角形',
    shapeType: 'triangle',
    width: '80',
    height: '80'
  },
  diamond: {
    name: '菱形',
    shapeType: 'polygon',
    width: '80',
    height: '80',
    points: '40,0 80,40 40,80 0,40'
  },
  star: {
    name: '星形',
    shapeType: 'polygon',
    width: '80',
    height: '80',
    points: '40,0 48,28 76,28 54,44 62,72 40,56 18,72 26,44 4,28 32,28'
  },
  arrow: {
    name: '箭头',
    shapeType: 'polygon',
    width: '100',
    height: '60',
    points: '0,20 60,20 60,0 100,30 60,60 60,40 0,40'
  }
}

// 渐变预设
export const GradientPresets = {
  blueToGreen: {
    name: '蓝绿渐变',
    gradientType: 'linear',
    gradientStops: [
      { offset: '0%', color: '#1890ff' },
      { offset: '100%', color: '#52c41a' }
    ]
  },
  redToYellow: {
    name: '红黄渐变',
    gradientType: 'linear',
    gradientStops: [
      { offset: '0%', color: '#ff4d4f' },
      { offset: '100%', color: '#faad14' }
    ]
  },
  purpleToBlue: {
    name: '紫蓝渐变',
    gradientType: 'linear',
    gradientStops: [
      { offset: '0%', color: '#722ed1' },
      { offset: '100%', color: '#1890ff' }
    ]
  },
  radialSunset: {
    name: '日落径向',
    gradientType: 'radial',
    gradientStops: [
      { offset: '0%', color: '#faad14' },
      { offset: '50%', color: '#ff7a45' },
      { offset: '100%', color: '#ff4d4f' }
    ]
  }
}

// 常用图标预设
export const IconPresets = {
  // 基础图标
  home: { iconName: 'HomeOutlined', label: '首页' },
  user: { iconName: 'UserOutlined', label: '用户' },
  setting: { iconName: 'SettingOutlined', label: '设置' },
  search: { iconName: 'SearchOutlined', label: '搜索' },
  menu: { iconName: 'MenuOutlined', label: '菜单' },
  close: { iconName: 'CloseOutlined', label: '关闭' },
  
  // 方向图标
  up: { iconName: 'UpOutlined', label: '向上' },
  down: { iconName: 'DownOutlined', label: '向下' },
  left: { iconName: 'LeftOutlined', label: '向左' },
  right: { iconName: 'RightOutlined', label: '向右' },
  
  // 操作图标
  edit: { iconName: 'EditOutlined', label: '编辑' },
  delete: { iconName: 'DeleteOutlined', label: '删除' },
  copy: { iconName: 'CopyOutlined', label: '复制' },
  save: { iconName: 'SaveOutlined', label: '保存' },
  download: { iconName: 'DownloadOutlined', label: '下载' },
  upload: { iconName: 'UploadOutlined', label: '上传' },
  
  // 状态图标
  success: { iconName: 'CheckCircleOutlined', label: '成功', color: '#52c41a' },
  error: { iconName: 'CloseCircleOutlined', label: '错误', color: '#ff4d4f' },
  warning: { iconName: 'ExclamationCircleOutlined', label: '警告', color: '#faad14' },
  info: { iconName: 'InfoCircleOutlined', label: '信息', color: '#1890ff' }
}