<template>
  <div class="bar-chart-control" :style="containerStyle">
    <div ref="chartRef" class="chart-container" :style="chartStyle"></div>
    <div v-if="loading" class="chart-loading">
      <a-spin size="large" />
    </div>
    <div v-if="error" class="chart-error">
      <a-result status="error" :title="error" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

interface Props {
  control: Control
}

const props = defineProps<Props>()

// 使用控件成员
const { value, eventHandler } = useControlMembers(props)

// 图表实例和状态
const chartRef = ref<HTMLElement>()
const chartInstance = ref<ECharts>()
const loading = ref(false)
const error = ref('')

// 控件属性
const chartData = computed(() => value.value?.data || [])
const chartOptions = computed(() => value.value?.options || {})
const width = computed(() => props.control.width || '100%')
const height = computed(() => props.control.height || '300px')
const theme = computed(() => value.value?.theme || 'default')
const orientation = computed(() => value.value?.orientation || 'vertical') // vertical | horizontal

// 样式计算
const containerStyle = computed(() => ({
  width: width.value,
  height: height.value,
  position: 'relative'
}))

const chartStyle = computed(() => ({
  width: '100%',
  height: '100%'
}))

// 默认配置
const defaultOptions: EChartsOption = {
  title: {
    text: '柱状图',
    left: 'center'
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    }
  },
  legend: {
    data: [],
    bottom: 0
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '10%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: []
  },
  yAxis: {
    type: 'value'
  },
  series: []
}

// 初始化图表
const initChart = async () => {
  if (!chartRef.value) return

  try {
    loading.value = true
    error.value = ''

    // 创建图表实例
    chartInstance.value = echarts.init(chartRef.value, theme.value)
    
    // 设置配置
    updateChart()
    
    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)
    
    loading.value = false
  } catch (err) {
    error.value = err instanceof Error ? err.message : '图表初始化失败'
    loading.value = false
  }
}

// 更新图表
const updateChart = () => {
  if (!chartInstance.value) return

  try {
    // 合并配置
    let options = {
      ...defaultOptions,
      ...chartOptions.value
    }

    // 处理横向柱状图
    if (orientation.value === 'horizontal') {
      options = {
        ...options,
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: [] }
      }
    }

    // 处理数据
    if (chartData.value && chartData.value.length > 0) {
      const processedData = processChartData(chartData.value)
      Object.assign(options, processedData)
    }

    // 设置配置
    chartInstance.value.setOption(options, true)
    
    // 绑定事件
    bindChartEvents()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '图表更新失败'
  }
}

// 处理图表数据
const processChartData = (data: any[]) => {
  if (!Array.isArray(data) || data.length === 0) {
    return {}
  }

  // 假设数据格式为 [{ name: string, value: number, category?: string }]
  const categories = [...new Set(data.map(item => item.category || 'default'))]
  const axisData = [...new Set(data.map(item => item.name))]
  
  const series = categories.map(category => ({
    name: category,
    type: 'bar',
    data: axisData.map(name => {
      const item = data.find(d => d.name === name && (d.category || 'default') === category)
      return item ? item.value : 0
    }),
    // 柱状图特有配置
    barWidth: '60%',
    itemStyle: {
      borderRadius: orientation.value === 'horizontal' ? [0, 4, 4, 0] : [4, 4, 0, 0]
    }
  }))

  const axisConfig = orientation.value === 'horizontal' 
    ? {
        xAxis: { type: 'value' },
        yAxis: { type: 'category', data: axisData }
      }
    : {
        xAxis: { type: 'category', data: axisData },
        yAxis: { type: 'value' }
      }

  return {
    ...axisConfig,
    legend: {
      ...defaultOptions.legend,
      data: categories
    },
    series
  }
}

// 绑定图表事件
const bindChartEvents = () => {
  if (!chartInstance.value) return

  // 点击事件
  chartInstance.value.on('click', (params: any) => {
    eventHandler('click', params)
  })

  // 双击事件
  chartInstance.value.on('dblclick', (params: any) => {
    eventHandler('dblclick', params)
  })

  // 鼠标悬停事件
  chartInstance.value.on('mouseover', (params: any) => {
    eventHandler('mouseover', params)
  })

  // 柱状图特有的选中事件
  chartInstance.value.on('selectchanged', (params: any) => {
    eventHandler('selectchanged', params)
  })
}

// 处理窗口大小变化
const handleResize = () => {
  if (chartInstance.value) {
    chartInstance.value.resize()
  }
}

// 销毁图表
const destroyChart = () => {
  if (chartInstance.value) {
    chartInstance.value.dispose()
    chartInstance.value = undefined
  }
  window.removeEventListener('resize', handleResize)
}

// 监听数据变化
watch([chartData, chartOptions, theme, orientation], () => {
  if (chartInstance.value) {
    updateChart()
  }
}, { deep: true })

// 生命周期
onMounted(async () => {
  await nextTick()
  initChart()
})

onUnmounted(() => {
  destroyChart()
})

// 暴露方法
defineExpose({
  getChartInstance: () => chartInstance.value,
  updateChart,
  resize: handleResize
})
</script>

<style scoped>
.bar-chart-control {
  display: block;
  position: relative;
  background: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.chart-container {
  position: relative;
}

.chart-loading {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.8);
  z-index: 10;
}

.chart-error {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  z-index: 10;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .bar-chart-control {
    min-height: 200px;
  }
}

@media (max-width: 480px) {
  .bar-chart-control {
    min-height: 150px;
  }
}
</style>