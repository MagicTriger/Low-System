<template>
  <div class="pie-chart-control" :style="containerStyle">
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
const chartType = computed(() => value.value?.chartType || 'pie') // pie | doughnut | rose
const showLabel = computed(() => value.value?.showLabel !== false)
const showLegend = computed(() => value.value?.showLegend !== false)

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
    text: '饼图',
    left: 'center'
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    data: []
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
    const options = {
      ...defaultOptions,
      ...chartOptions.value
    }

    // 处理图例显示
    if (!showLegend.value) {
      options.legend = { show: false }
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

  // 假设数据格式为 [{ name: string, value: number }]
  const legendData = data.map(item => item.name)
  
  // 根据图表类型配置系列
  const seriesConfig = getSeriesConfig(data)

  return {
    legend: {
      ...defaultOptions.legend,
      data: legendData,
      show: showLegend.value
    },
    series: [seriesConfig]
  }
}

// 获取系列配置
const getSeriesConfig = (data: any[]) => {
  const baseConfig = {
    name: '数据',
    type: 'pie',
    data: data,
    emphasis: {
      itemStyle: {
        shadowBlur: 10,
        shadowOffsetX: 0,
        shadowColor: 'rgba(0, 0, 0, 0.5)'
      }
    }
  }

  // 根据图表类型调整配置
  switch (chartType.value) {
    case 'doughnut':
      return {
        ...baseConfig,
        radius: ['40%', '70%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: false,
        label: {
          show: showLabel.value,
          position: 'center'
        },
        emphasis: {
          ...baseConfig.emphasis,
          label: {
            show: true,
            fontSize: '30',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        }
      }
    
    case 'rose':
      return {
        ...baseConfig,
        radius: [20, 100],
        center: ['50%', '50%'],
        roseType: 'area',
        itemStyle: {
          borderRadius: 8
        },
        label: {
          show: showLabel.value
        }
      }
    
    default: // pie
      return {
        ...baseConfig,
        radius: '70%',
        center: ['50%', '50%'],
        label: {
          show: showLabel.value,
          formatter: '{b}: {c} ({d}%)'
        }
      }
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

  // 饼图特有的选中事件
  chartInstance.value.on('pieselectchanged', (params: any) => {
    eventHandler('pieselectchanged', params)
  })

  // 图例选择事件
  chartInstance.value.on('legendselectchanged', (params: any) => {
    eventHandler('legendselectchanged', params)
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
watch([chartData, chartOptions, theme, chartType, showLabel, showLegend], () => {
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
.pie-chart-control {
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
  .pie-chart-control {
    min-height: 200px;
  }
}

@media (max-width: 480px) {
  .pie-chart-control {
    min-height: 150px;
  }
}
</style>