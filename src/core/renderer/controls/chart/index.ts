// 图表控件导出
export { default as LineChart } from './LineChart.vue'
export { default as BarChart } from './BarChart.vue'
export { default as PieChart } from './PieChart.vue'

// 图表控件类型定义
export interface ChartData {
  name: string
  value: number
  category?: string
}

export interface ChartOptions {
  title?: {
    text?: string
    left?: string
    top?: string
  }
  tooltip?: any
  legend?: any
  grid?: any
  xAxis?: any
  yAxis?: any
  series?: any[]
  [key: string]: any
}

export interface ChartControlProps {
  data?: ChartData[]
  options?: ChartOptions
  theme?: string
  width?: string | number
  height?: string | number
  loading?: boolean
}

// 图表控件配置
export const ChartControlConfigs = {
  LineChart: {
    name: '折线图',
    icon: 'line-chart',
    category: 'chart',
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
        { name: '6月', value: 230 }
      ]
    }
  },
  BarChart: {
    name: '柱状图',
    icon: 'bar-chart',
    category: 'chart',
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
        { name: '产品E', value: 390 }
      ]
    }
  },
  PieChart: {
    name: '饼图',
    icon: 'pie-chart',
    category: 'chart',
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
        { name: '搜索引擎', value: 1548 }
      ]
    }
  }
}