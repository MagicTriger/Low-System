<template>
  <div class="performance-monitor" :class="{ 'dark': isDark, 'compact': compact }">
    <!-- 性能概览 -->
    <div class="monitor-header">
      <div class="header-left">
        <h3 class="monitor-title">
          <i class="icon-monitor"></i>
          性能监控
        </h3>
        <div class="monitor-status" :class="performanceStatus">
          <span class="status-dot"></span>
          {{ performanceStatusText }}
        </div>
      </div>
      <div class="header-right">
        <button 
          class="btn-toggle" 
          :class="{ active: isMonitoring }"
          @click="toggleMonitoring"
        >
          {{ isMonitoring ? '停止' : '开始' }}
        </button>
        <button class="btn-clear" @click="clearMetrics">
          清除数据
        </button>
        <button class="btn-export" @click="exportMetrics">
          导出报告
        </button>
      </div>
    </div>

    <!-- 实时指标 -->
    <div class="metrics-grid">
      <div class="metric-card" v-for="metric in realTimeMetrics" :key="metric.key">
        <div class="metric-header">
          <span class="metric-name">{{ metric.name }}</span>
          <span class="metric-trend" :class="metric.trend">
            <i :class="getTrendIcon(metric.trend)"></i>
          </span>
        </div>
        <div class="metric-value">
          {{ formatMetricValue(metric.value, metric.unit) }}
        </div>
        <div class="metric-chart">
          <svg :width="chartWidth" :height="chartHeight" viewBox="0 0 100 30">
            <polyline
              :points="getChartPoints(metric.history)"
              fill="none"
              :stroke="getMetricColor(metric.key)"
              stroke-width="2"
            />
          </svg>
        </div>
      </div>
    </div>

    <!-- 详细分析 -->
    <div class="analysis-tabs">
      <div class="tab-headers">
        <button
          v-for="tab in analysisTabs"
          :key="tab.key"
          class="tab-header"
          :class="{ active: activeTab === tab.key }"
          @click="activeTab = tab.key"
        >
          <i :class="tab.icon"></i>
          {{ tab.name }}
        </button>
      </div>

      <div class="tab-content">
        <!-- 内存分析 -->
        <div v-if="activeTab === 'memory'" class="memory-analysis">
          <div class="memory-overview">
            <div class="memory-usage">
              <div class="usage-bar">
                <div 
                  class="usage-fill" 
                  :style="{ width: memoryUsagePercent + '%' }"
                ></div>
              </div>
              <div class="usage-text">
                {{ formatBytes(memoryMetrics.used) }} / {{ formatBytes(memoryMetrics.total) }}
                ({{ memoryUsagePercent.toFixed(1) }}%)
              </div>
            </div>
          </div>

          <div class="memory-breakdown">
            <div class="breakdown-item" v-for="item in memoryBreakdown" :key="item.name">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-value">{{ formatBytes(item.value) }}</div>
              <div class="item-bar">
                <div 
                  class="item-fill" 
                  :style="{ 
                    width: (item.value / memoryMetrics.total * 100) + '%',
                    backgroundColor: item.color 
                  }"
                ></div>
              </div>
            </div>
          </div>
        </div>

        <!-- 渲染性能 -->
        <div v-if="activeTab === 'render'" class="render-analysis">
          <div class="render-metrics">
            <div class="metric-group">
              <h4>帧率统计</h4>
              <div class="fps-chart">
                <canvas ref="fpsChart" width="300" height="150"></canvas>
              </div>
            </div>

            <div class="metric-group">
              <h4>渲染时间</h4>
              <div class="render-times">
                <div class="time-item" v-for="time in renderTimes" :key="time.name">
                  <span class="time-name">{{ time.name }}</span>
                  <span class="time-value">{{ time.value.toFixed(2) }}ms</span>
                  <div class="time-bar">
                    <div 
                      class="time-fill" 
                      :style="{ width: (time.value / maxRenderTime * 100) + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 网络分析 -->
        <div v-if="activeTab === 'network'" class="network-analysis">
          <div class="network-overview">
            <div class="network-stats">
              <div class="stat-item">
                <span class="stat-label">总请求</span>
                <span class="stat-value">{{ networkMetrics.totalRequests }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">成功率</span>
                <span class="stat-value">{{ networkMetrics.successRate.toFixed(1) }}%</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">平均延迟</span>
                <span class="stat-value">{{ networkMetrics.averageLatency.toFixed(0) }}ms</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">数据传输</span>
                <span class="stat-value">{{ formatBytes(networkMetrics.totalBytes) }}</span>
              </div>
            </div>
          </div>

          <div class="network-requests">
            <div class="request-list">
              <div class="request-header">
                <span class="col-method">方法</span>
                <span class="col-url">URL</span>
                <span class="col-status">状态</span>
                <span class="col-time">时间</span>
                <span class="col-size">大小</span>
              </div>
              <div 
                class="request-item" 
                v-for="request in recentRequests" 
                :key="request.id"
                :class="{ error: request.status >= 400 }"
              >
                <span class="col-method" :class="request.method.toLowerCase()">
                  {{ request.method }}
                </span>
                <span class="col-url" :title="request.url">
                  {{ truncateUrl(request.url) }}
                </span>
                <span class="col-status" :class="getStatusClass(request.status)">
                  {{ request.status }}
                </span>
                <span class="col-time">{{ request.duration }}ms</span>
                <span class="col-size">{{ formatBytes(request.size) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 缓存分析 -->
        <div v-if="activeTab === 'cache'" class="cache-analysis">
          <div class="cache-overview">
            <div class="cache-stats">
              <div class="stat-card">
                <div class="stat-title">命中率</div>
                <div class="stat-value">{{ cacheMetrics.hitRate.toFixed(1) }}%</div>
                <div class="stat-chart">
                  <div class="hit-rate-circle">
                    <svg width="60" height="60" viewBox="0 0 60 60">
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#e5e7eb"
                        stroke-width="4"
                      />
                      <circle
                        cx="30"
                        cy="30"
                        r="25"
                        fill="none"
                        stroke="#10b981"
                        stroke-width="4"
                        :stroke-dasharray="circumference"
                        :stroke-dashoffset="circumference - (cacheMetrics.hitRate / 100) * circumference"
                        transform="rotate(-90 30 30)"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div class="stat-card">
                <div class="stat-title">缓存大小</div>
                <div class="stat-value">{{ formatBytes(cacheMetrics.totalSize) }}</div>
                <div class="stat-subtitle">{{ cacheMetrics.totalEntries }} 条目</div>
              </div>

              <div class="stat-card">
                <div class="stat-title">内存使用</div>
                <div class="stat-value">{{ (cacheMetrics.memoryUsage * 100).toFixed(1) }}%</div>
                <div class="stat-subtitle">{{ formatBytes(cacheMetrics.memoryUsed) }}</div>
              </div>
            </div>
          </div>

          <div class="cache-layers">
            <div class="layer-item" v-for="layer in cacheLayers" :key="layer.name">
              <div class="layer-header">
                <span class="layer-name">{{ layer.name }}</span>
                <span class="layer-size">{{ layer.size }} 项</span>
              </div>
              <div class="layer-bar">
                <div 
                  class="layer-fill" 
                  :style="{ 
                    width: (layer.size / maxLayerSize * 100) + '%',
                    backgroundColor: layer.color 
                  }"
                ></div>
              </div>
              <div class="layer-stats">
                <span>命中: {{ layer.hits }}</span>
                <span>未命中: {{ layer.misses }}</span>
                <span>驱逐: {{ layer.evictions }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误分析 -->
        <div v-if="activeTab === 'errors'" class="error-analysis">
          <div class="error-overview">
            <div class="error-stats">
              <div class="error-count">
                <span class="count-number">{{ errorMetrics.totalErrors }}</span>
                <span class="count-label">总错误数</span>
              </div>
              <div class="error-rate">
                <span class="rate-number">{{ errorMetrics.errorRate.toFixed(2) }}%</span>
                <span class="rate-label">错误率</span>
              </div>
            </div>
          </div>

          <div class="error-list">
            <div class="error-filters">
              <select v-model="errorFilter" class="filter-select">
                <option value="all">所有错误</option>
                <option value="javascript">JavaScript 错误</option>
                <option value="network">网络错误</option>
                <option value="render">渲染错误</option>
                <option value="api">API 错误</option>
              </select>
              <select v-model="errorSort" class="sort-select">
                <option value="time">按时间排序</option>
                <option value="frequency">按频率排序</option>
                <option value="severity">按严重程度排序</option>
              </select>
            </div>

            <div class="error-items">
              <div 
                class="error-item" 
                v-for="error in filteredErrors" 
                :key="error.id"
                :class="error.severity"
              >
                <div class="error-header">
                  <span class="error-type">{{ error.type }}</span>
                  <span class="error-time">{{ formatTime(error.timestamp) }}</span>
                  <span class="error-count" v-if="error.count > 1">
                    {{ error.count }}x
                  </span>
                </div>
                <div class="error-message">{{ error.message }}</div>
                <div class="error-stack" v-if="error.stack && showErrorDetails">
                  <pre>{{ error.stack }}</pre>
                </div>
                <div class="error-actions">
                  <button @click="toggleErrorDetails(error.id)">
                    {{ showErrorDetails ? '隐藏' : '显示' }}详情
                  </button>
                  <button @click="ignoreError(error.id)">忽略</button>
                  <button @click="reportError(error)">报告</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能建议 -->
    <div class="performance-suggestions" v-if="suggestions.length > 0">
      <h4>性能优化建议</h4>
      <div class="suggestion-list">
        <div 
          class="suggestion-item" 
          v-for="suggestion in suggestions" 
          :key="suggestion.id"
          :class="suggestion.priority"
        >
          <div class="suggestion-icon">
            <i :class="getSuggestionIcon(suggestion.type)"></i>
          </div>
          <div class="suggestion-content">
            <div class="suggestion-title">{{ suggestion.title }}</div>
            <div class="suggestion-description">{{ suggestion.description }}</div>
            <div class="suggestion-impact">
              预期提升: {{ suggestion.impact }}
            </div>
          </div>
          <div class="suggestion-actions">
            <button @click="applySuggestion(suggestion)" class="btn-apply">
              应用
            </button>
            <button @click="dismissSuggestion(suggestion.id)" class="btn-dismiss">
              忽略
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'

// Props
interface Props {
  isDark?: boolean
  compact?: boolean
  autoStart?: boolean
  updateInterval?: number
  maxHistorySize?: number
}

const props = withDefaults(defineProps<Props>(), {
  isDark: false,
  compact: false,
  autoStart: true,
  updateInterval: 1000,
  maxHistorySize: 100
})

// Emits
const emit = defineEmits<{
  'performance-alert': [alert: PerformanceAlert]
  'metric-threshold': [metric: string, value: number]
  'error-detected': [error: ErrorInfo]
}>()

// 接口定义
interface MetricData {
  key: string
  name: string
  value: number
  unit: string
  trend: 'up' | 'down' | 'stable'
  history: number[]
  threshold?: number
}

interface MemoryMetrics {
  used: number
  total: number
  available: number
  heap: number
  nonHeap: number
}

interface NetworkMetrics {
  totalRequests: number
  successRate: number
  averageLatency: number
  totalBytes: number
}

interface CacheMetrics {
  hitRate: number
  totalSize: number
  totalEntries: number
  memoryUsage: number
  memoryUsed: number
}

interface ErrorMetrics {
  totalErrors: number
  errorRate: number
}

interface NetworkRequest {
  id: string
  method: string
  url: string
  status: number
  duration: number
  size: number
  timestamp: number
}

interface ErrorInfo {
  id: string
  type: string
  message: string
  stack?: string
  timestamp: number
  count: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

interface PerformanceSuggestion {
  id: string
  type: string
  title: string
  description: string
  impact: string
  priority: 'low' | 'medium' | 'high'
  action?: () => void
}

interface PerformanceAlert {
  type: string
  message: string
  severity: 'info' | 'warning' | 'error'
  timestamp: number
}

// 响应式数据
const isMonitoring = ref(false)
const activeTab = ref('memory')
const errorFilter = ref('all')
const errorSort = ref('time')
const showErrorDetails = ref(false)
const chartWidth = 100
const chartHeight = 30

// 性能指标
const realTimeMetrics = ref<MetricData[]>([
  {
    key: 'fps',
    name: 'FPS',
    value: 60,
    unit: 'fps',
    trend: 'stable',
    history: [],
    threshold: 30
  },
  {
    key: 'memory',
    name: '内存使用',
    value: 0,
    unit: 'MB',
    trend: 'stable',
    history: []
  },
  {
    key: 'cpu',
    name: 'CPU 使用',
    value: 0,
    unit: '%',
    trend: 'stable',
    history: []
  },
  {
    key: 'network',
    name: '网络延迟',
    value: 0,
    unit: 'ms',
    trend: 'stable',
    history: []
  }
])

const memoryMetrics = reactive<MemoryMetrics>({
  used: 0,
  total: 0,
  available: 0,
  heap: 0,
  nonHeap: 0
})

const networkMetrics = reactive<NetworkMetrics>({
  totalRequests: 0,
  successRate: 100,
  averageLatency: 0,
  totalBytes: 0
})

const cacheMetrics = reactive<CacheMetrics>({
  hitRate: 0,
  totalSize: 0,
  totalEntries: 0,
  memoryUsage: 0,
  memoryUsed: 0
})

const errorMetrics = reactive<ErrorMetrics>({
  totalErrors: 0,
  errorRate: 0
})

const recentRequests = ref<NetworkRequest[]>([])
const errors = ref<ErrorInfo[]>([])
const suggestions = ref<PerformanceSuggestion[]>([])

// 计算属性
const performanceStatus = computed(() => {
  const fpsMetric = realTimeMetrics.value.find(m => m.key === 'fps')
  const memoryMetric = realTimeMetrics.value.find(m => m.key === 'memory')
  
  if (fpsMetric && fpsMetric.value < 30) return 'critical'
  if (memoryMetric && memoryMetric.value > 80) return 'warning'
  if (errorMetrics.errorRate > 5) return 'warning'
  
  return 'good'
})

const performanceStatusText = computed(() => {
  switch (performanceStatus.value) {
    case 'good': return '良好'
    case 'warning': return '警告'
    case 'critical': return '严重'
    default: return '未知'
  }
})

const memoryUsagePercent = computed(() => {
  return memoryMetrics.total > 0 ? (memoryMetrics.used / memoryMetrics.total) * 100 : 0
})

const memoryBreakdown = computed(() => [
  { name: '堆内存', value: memoryMetrics.heap, color: '#3b82f6' },
  { name: '非堆内存', value: memoryMetrics.nonHeap, color: '#10b981' },
  { name: '可用内存', value: memoryMetrics.available, color: '#f59e0b' }
])

const renderTimes = ref([
  { name: '组件渲染', value: 0 },
  { name: '样式计算', value: 0 },
  { name: '布局计算', value: 0 },
  { name: '绘制时间', value: 0 }
])

const maxRenderTime = computed(() => {
  return Math.max(...renderTimes.value.map(t => t.value), 1)
})

const cacheLayers = computed(() => [
  { name: '内存缓存', size: 150, hits: 1200, misses: 50, evictions: 10, color: '#3b82f6' },
  { name: '会话缓存', size: 80, hits: 800, misses: 30, evictions: 5, color: '#10b981' },
  { name: '本地缓存', size: 40, hits: 400, misses: 20, evictions: 2, color: '#f59e0b' },
  { name: '索引缓存', size: 20, hits: 200, misses: 10, evictions: 1, color: '#ef4444' }
])

const maxLayerSize = computed(() => {
  return Math.max(...cacheLayers.value.map(l => l.size), 1)
})

const circumference = 2 * Math.PI * 25

const filteredErrors = computed(() => {
  let filtered = errors.value

  if (errorFilter.value !== 'all') {
    filtered = filtered.filter(error => error.type === errorFilter.value)
  }

  switch (errorSort.value) {
    case 'frequency':
      filtered.sort((a, b) => b.count - a.count)
      break
    case 'severity':
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
      filtered.sort((a, b) => severityOrder[b.severity] - severityOrder[a.severity])
      break
    default:
      filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  return filtered
})

const analysisTabs = [
  { key: 'memory', name: '内存', icon: 'icon-memory' },
  { key: 'render', name: '渲染', icon: 'icon-render' },
  { key: 'network', name: '网络', icon: 'icon-network' },
  { key: 'cache', name: '缓存', icon: 'icon-cache' },
  { key: 'errors', name: '错误', icon: 'icon-error' }
]

// 监控相关
let monitoringTimer: number | null = null
let performanceObserver: PerformanceObserver | null = null
let fpsChart: HTMLCanvasElement | null = null

// 方法
const toggleMonitoring = () => {
  if (isMonitoring.value) {
    stopMonitoring()
  } else {
    startMonitoring()
  }
}

const startMonitoring = () => {
  isMonitoring.value = true
  
  // 启动定时器
  monitoringTimer = window.setInterval(() => {
    updateMetrics()
  }, props.updateInterval)

  // 启动性能观察器
  if (window.PerformanceObserver) {
    performanceObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      processPerformanceEntries(entries)
    })

    performanceObserver.observe({ 
      entryTypes: ['measure', 'navigation', 'resource', 'paint'] 
    })
  }

  // 监听错误
  window.addEventListener('error', handleError)
  window.addEventListener('unhandledrejection', handleUnhandledRejection)
}

const stopMonitoring = () => {
  isMonitoring.value = false
  
  if (monitoringTimer) {
    clearInterval(monitoringTimer)
    monitoringTimer = null
  }

  if (performanceObserver) {
    performanceObserver.disconnect()
    performanceObserver = null
  }

  window.removeEventListener('error', handleError)
  window.removeEventListener('unhandledrejection', handleUnhandledRejection)
}

const updateMetrics = () => {
  // 更新内存指标
  if (performance.memory) {
    const memory = performance.memory
    memoryMetrics.used = memory.usedJSHeapSize
    memoryMetrics.total = memory.totalJSHeapSize
    memoryMetrics.available = memory.jsHeapSizeLimit - memory.usedJSHeapSize
    memoryMetrics.heap = memory.usedJSHeapSize
    memoryMetrics.nonHeap = memory.totalJSHeapSize - memory.usedJSHeapSize

    // 更新内存指标历史
    const memoryMetric = realTimeMetrics.value.find(m => m.key === 'memory')
    if (memoryMetric) {
      const memoryMB = memory.usedJSHeapSize / (1024 * 1024)
      updateMetricHistory(memoryMetric, memoryMB)
    }
  }

  // 更新 FPS
  updateFPS()

  // 更新网络指标
  updateNetworkMetrics()

  // 更新缓存指标
  updateCacheMetrics()

  // 检查性能阈值
  checkPerformanceThresholds()

  // 生成性能建议
  generateSuggestions()
}

const updateMetricHistory = (metric: MetricData, value: number) => {
  metric.value = value
  metric.history.push(value)
  
  if (metric.history.length > props.maxHistorySize) {
    metric.history.shift()
  }

  // 计算趋势
  if (metric.history.length >= 3) {
    const recent = metric.history.slice(-3)
    const avg = recent.reduce((sum, val) => sum + val, 0) / recent.length
    const prev = metric.history[metric.history.length - 4] || avg
    
    if (avg > prev * 1.1) {
      metric.trend = 'up'
    } else if (avg < prev * 0.9) {
      metric.trend = 'down'
    } else {
      metric.trend = 'stable'
    }
  }
}

const updateFPS = () => {
  // 简化的 FPS 计算
  const now = performance.now()
  const fps = Math.round(1000 / (now - (window as any).lastFrameTime || 16))
  ;(window as any).lastFrameTime = now

  const fpsMetric = realTimeMetrics.value.find(m => m.key === 'fps')
  if (fpsMetric) {
    updateMetricHistory(fpsMetric, Math.min(fps, 60))
  }

  // 更新 FPS 图表
  updateFPSChart()
}

const updateFPSChart = () => {
  if (!fpsChart) return

  const ctx = fpsChart.getContext('2d')
  if (!ctx) return

  const fpsMetric = realTimeMetrics.value.find(m => m.key === 'fps')
  if (!fpsMetric || fpsMetric.history.length === 0) return

  ctx.clearRect(0, 0, fpsChart.width, fpsChart.height)
  
  const width = fpsChart.width
  const height = fpsChart.height
  const data = fpsMetric.history.slice(-50) // 最近50个数据点
  
  if (data.length < 2) return

  ctx.strokeStyle = '#3b82f6'
  ctx.lineWidth = 2
  ctx.beginPath()

  data.forEach((value, index) => {
    const x = (index / (data.length - 1)) * width
    const y = height - (value / 60) * height
    
    if (index === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  })

  ctx.stroke()
}

const updateNetworkMetrics = () => {
  // 模拟网络指标更新
  networkMetrics.totalRequests += Math.floor(Math.random() * 5)
  networkMetrics.successRate = 95 + Math.random() * 5
  networkMetrics.averageLatency = 50 + Math.random() * 100
  networkMetrics.totalBytes += Math.floor(Math.random() * 10000)
}

const updateCacheMetrics = () => {
  // 模拟缓存指标更新
  cacheMetrics.hitRate = 80 + Math.random() * 20
  cacheMetrics.totalSize = 1024 * 1024 * (10 + Math.random() * 40)
  cacheMetrics.totalEntries = 100 + Math.floor(Math.random() * 900)
  cacheMetrics.memoryUsage = 0.3 + Math.random() * 0.4
  cacheMetrics.memoryUsed = cacheMetrics.totalSize * cacheMetrics.memoryUsage
}

const processPerformanceEntries = (entries: PerformanceEntry[]) => {
  entries.forEach(entry => {
    if (entry.entryType === 'resource') {
      const resourceEntry = entry as PerformanceResourceTiming
      addNetworkRequest({
        id: Math.random().toString(36).substr(2, 9),
        method: 'GET', // 简化处理
        url: resourceEntry.name,
        status: 200, // 简化处理
        duration: resourceEntry.duration,
        size: resourceEntry.transferSize || 0,
        timestamp: resourceEntry.startTime
      })
    }
  })
}

const addNetworkRequest = (request: NetworkRequest) => {
  recentRequests.value.unshift(request)
  
  if (recentRequests.value.length > 100) {
    recentRequests.value.pop()
  }
}

const handleError = (event: ErrorEvent) => {
  const error: ErrorInfo = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'javascript',
    message: event.message,
    stack: event.error?.stack,
    timestamp: Date.now(),
    count: 1,
    severity: 'medium'
  }

  addError(error)
}

const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
  const error: ErrorInfo = {
    id: Math.random().toString(36).substr(2, 9),
    type: 'promise',
    message: event.reason?.message || 'Unhandled promise rejection',
    stack: event.reason?.stack,
    timestamp: Date.now(),
    count: 1,
    severity: 'high'
  }

  addError(error)
}

const addError = (error: ErrorInfo) => {
  // 检查是否是重复错误
  const existingError = errors.value.find(e => 
    e.message === error.message && e.type === error.type
  )

  if (existingError) {
    existingError.count++
    existingError.timestamp = error.timestamp
  } else {
    errors.value.unshift(error)
    
    if (errors.value.length > 100) {
      errors.value.pop()
    }
  }

  errorMetrics.totalErrors++
  emit('error-detected', error)
}

const checkPerformanceThresholds = () => {
  realTimeMetrics.value.forEach(metric => {
    if (metric.threshold && metric.value < metric.threshold) {
      const alert: PerformanceAlert = {
        type: 'threshold',
        message: `${metric.name} 低于阈值: ${metric.value}${metric.unit} < ${metric.threshold}${metric.unit}`,
        severity: 'warning',
        timestamp: Date.now()
      }
      
      emit('performance-alert', alert)
      emit('metric-threshold', metric.key, metric.value)
    }
  })
}

const generateSuggestions = () => {
  const newSuggestions: PerformanceSuggestion[] = []

  // 内存建议
  if (memoryUsagePercent.value > 80) {
    newSuggestions.push({
      id: 'memory-high',
      type: 'memory',
      title: '内存使用过高',
      description: '当前内存使用超过80%，建议清理不必要的对象引用',
      impact: '减少内存使用20-30%',
      priority: 'high'
    })
  }

  // FPS 建议
  const fpsMetric = realTimeMetrics.value.find(m => m.key === 'fps')
  if (fpsMetric && fpsMetric.value < 30) {
    newSuggestions.push({
      id: 'fps-low',
      type: 'render',
      title: 'FPS 过低',
      description: '帧率低于30fps，建议优化渲染性能',
      impact: '提升帧率至60fps',
      priority: 'high'
    })
  }

  // 缓存建议
  if (cacheMetrics.hitRate < 70) {
    newSuggestions.push({
      id: 'cache-low',
      type: 'cache',
      title: '缓存命中率低',
      description: '缓存命中率低于70%，建议优化缓存策略',
      impact: '提升响应速度30-50%',
      priority: 'medium'
    })
  }

  suggestions.value = newSuggestions
}

const clearMetrics = () => {
  realTimeMetrics.value.forEach(metric => {
    metric.history = []
    metric.value = 0
  })
  
  recentRequests.value = []
  errors.value = []
  suggestions.value = []
  
  // 重置统计
  Object.assign(memoryMetrics, {
    used: 0,
    total: 0,
    available: 0,
    heap: 0,
    nonHeap: 0
  })
  
  Object.assign(networkMetrics, {
    totalRequests: 0,
    successRate: 100,
    averageLatency: 0,
    totalBytes: 0
  })
  
  Object.assign(errorMetrics, {
    totalErrors: 0,
    errorRate: 0
  })
}

const exportMetrics = () => {
  const data = {
    timestamp: Date.now(),
    metrics: realTimeMetrics.value,
    memory: memoryMetrics,
    network: networkMetrics,
    cache: cacheMetrics,
    errors: errorMetrics,
    requests: recentRequests.value,
    errorList: errors.value,
    suggestions: suggestions.value
  }

  const blob = new Blob([JSON.stringify(data, null, 2)], { 
    type: 'application/json' 
  })
  
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `performance-report-${new Date().toISOString().slice(0, 19)}.json`
  a.click()
  
  URL.revokeObjectURL(url)
}

const applySuggestion = (suggestion: PerformanceSuggestion) => {
  if (suggestion.action) {
    suggestion.action()
  }
  
  // 移除已应用的建议
  const index = suggestions.value.findIndex(s => s.id === suggestion.id)
  if (index > -1) {
    suggestions.value.splice(index, 1)
  }
}

const dismissSuggestion = (id: string) => {
  const index = suggestions.value.findIndex(s => s.id === id)
  if (index > -1) {
    suggestions.value.splice(index, 1)
  }
}

const toggleErrorDetails = (id: string) => {
  showErrorDetails.value = !showErrorDetails.value
}

const ignoreError = (id: string) => {
  const index = errors.value.findIndex(e => e.id === id)
  if (index > -1) {
    errors.value.splice(index, 1)
  }
}

const reportError = (error: ErrorInfo) => {
  // 实现错误报告逻辑
  console.log('Reporting error:', error)
}

// 工具函数
const formatMetricValue = (value: number, unit: string): string => {
  if (unit === 'MB') {
    return (value / (1024 * 1024)).toFixed(1) + unit
  } else if (unit === 'ms') {
    return value.toFixed(0) + unit
  } else if (unit === '%') {
    return value.toFixed(1) + unit
  }
  return value.toFixed(0) + unit
}

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString()
}

const getTrendIcon = (trend: string): string => {
  switch (trend) {
    case 'up': return 'icon-trend-up'
    case 'down': return 'icon-trend-down'
    default: return 'icon-trend-stable'
  }
}

const getMetricColor = (key: string): string => {
  const colors: Record<string, string> = {
    fps: '#3b82f6',
    memory: '#10b981',
    cpu: '#f59e0b',
    network: '#ef4444'
  }
  return colors[key] || '#6b7280'
}

const getChartPoints = (history: number[]): string => {
  if (history.length === 0) return ''
  
  const max = Math.max(...history, 1)
  const points = history.map((value, index) => {
    const x = (index / (history.length - 1)) * 100
    const y = 30 - (value / max) * 30
    return `${x},${y}`
  })
  
  return points.join(' ')
}

const truncateUrl = (url: string): string => {
  if (url.length <= 50) return url
  return url.substring(0, 47) + '...'
}

const getStatusClass = (status: number): string => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'redirect'
  if (status >= 400 && status < 500) return 'client-error'
  if (status >= 500) return 'server-error'
  return ''
}

const getSuggestionIcon = (type: string): string => {
  const icons: Record<string, string> = {
    memory: 'icon-memory',
    render: 'icon-render',
    cache: 'icon-cache',
    network: 'icon-network'
  }
  return icons[type] || 'icon-suggestion'
}

// 生命周期
onMounted(() => {
  if (props.autoStart) {
    startMonitoring()
  }

  nextTick(() => {
    fpsChart = document.querySelector('.fps-chart canvas') as HTMLCanvasElement
  })
})

onUnmounted(() => {
  stopMonitoring()
})

// 监听器
watch(() => props.updateInterval, (newInterval) => {
  if (isMonitoring.value) {
    stopMonitoring()
    startMonitoring()
  }
})
</script>

<style scoped>
.performance-monitor {
  @apply bg-white rounded-lg shadow-sm border border-gray-200 p-6;
}

.performance-monitor.dark {
  @apply bg-gray-800 border-gray-700;
}

.performance-monitor.compact {
  @apply p-4;
}

.monitor-header {
  @apply flex items-center justify-between mb-6;
}

.header-left {
  @apply flex items-center gap-4;
}

.monitor-title {
  @apply text-lg font-semibold text-gray-900 flex items-center gap-2;
}

.dark .monitor-title {
  @apply text-white;
}

.monitor-status {
  @apply flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium;
}

.monitor-status.good {
  @apply bg-green-100 text-green-800;
}

.monitor-status.warning {
  @apply bg-yellow-100 text-yellow-800;
}

.monitor-status.critical {
  @apply bg-red-100 text-red-800;
}

.dark .monitor-status.good {
  @apply bg-green-900 text-green-300;
}

.dark .monitor-status.warning {
  @apply bg-yellow-900 text-yellow-300;
}

.dark .monitor-status.critical {
  @apply bg-red-900 text-red-300;
}

.status-dot {
  @apply w-2 h-2 rounded-full bg-current;
}

.header-right {
  @apply flex items-center gap-2;
}

.btn-toggle {
  @apply px-4 py-2 rounded-md text-sm font-medium border transition-colors;
}

.btn-toggle:not(.active) {
  @apply bg-white text-gray-700 border-gray-300 hover:bg-gray-50;
}

.btn-toggle.active {
  @apply bg-blue-600 text-white border-blue-600 hover:bg-blue-700;
}

.dark .btn-toggle:not(.active) {
  @apply bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600;
}

.btn-clear,
.btn-export {
  @apply px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors;
}

.dark .btn-clear,
.dark .btn-export {
  @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}

.metrics-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6;
}

.metric-card {
  @apply bg-gray-50 rounded-lg p-4 border border-gray-200;
}

.dark .metric-card {
  @apply bg-gray-700 border-gray-600;
}

.metric-header {
  @apply flex items-center justify-between mb-2;
}

.metric-name {
  @apply text-sm font-medium text-gray-600;
}

.dark .metric-name {
  @apply text-gray-400;
}

.metric-trend {
  @apply text-xs;
}

.metric-trend.up {
  @apply text-red-500;
}

.metric-trend.down {
  @apply text-green-500;
}

.metric-trend.stable {
  @apply text-gray-500;
}

.metric-value {
  @apply text-2xl font-bold text-gray-900 mb-3;
}

.dark .metric-value {
  @apply text-white;
}

.metric-chart {
  @apply h-8;
}

.analysis-tabs {
  @apply mb-6;
}

.tab-headers {
  @apply flex border-b border-gray-200 mb-4;
}

.dark .tab-headers {
  @apply border-gray-700;
}

.tab-header {
  @apply px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent transition-colors flex items-center gap-2;
}

.tab-header.active {
  @apply text-blue-600 border-blue-600;
}

.dark .tab-header {
  @apply text-gray-400 hover:text-gray-200;
}

.dark .tab-header.active {
  @apply text-blue-400 border-blue-400;
}

.tab-content {
  @apply min-h-96;
}

.memory-overview {
  @apply mb-6;
}

.memory-usage {
  @apply space-y-2;
}

.usage-bar {
  @apply w-full h-4 bg-gray-200 rounded-full overflow-hidden;
}

.dark .usage-bar {
  @apply bg-gray-700;
}

.usage-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.usage-text {
  @apply text-sm text-gray-600;
}

.dark .usage-text {
  @apply text-gray-400;
}

.memory-breakdown {
  @apply space-y-3;
}

.breakdown-item {
  @apply flex items-center gap-4;
}

.item-name {
  @apply text-sm font-medium text-gray-700 w-24;
}

.dark .item-name {
  @apply text-gray-300;
}

.item-value {
  @apply text-sm text-gray-600 w-20;
}

.dark .item-value {
  @apply text-gray-400;
}

.item-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.dark .item-bar {
  @apply bg-gray-700;
}

.item-fill {
  @apply h-full transition-all duration-300;
}

.render-metrics {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.metric-group h4 {
  @apply text-base font-semibold text-gray-900 mb-3;
}

.dark .metric-group h4 {
  @apply text-white;
}

.fps-chart {
  @apply border border-gray-200 rounded;
}

.dark .fps-chart {
  @apply border-gray-700;
}

.render-times {
  @apply space-y-3;
}

.time-item {
  @apply flex items-center gap-4;
}

.time-name {
  @apply text-sm font-medium text-gray-700 w-24;
}

.dark .time-name {
  @apply text-gray-300;
}

.time-value {
  @apply text-sm text-gray-600 w-16;
}

.dark .time-value {
  @apply text-gray-400;
}

.time-bar {
  @apply flex-1 h-2 bg-gray-200 rounded-full overflow-hidden;
}

.dark .time-bar {
  @apply bg-gray-700;
}

.time-fill {
  @apply h-full bg-blue-500 transition-all duration-300;
}

.network-overview {
  @apply mb-6;
}

.network-stats {
  @apply grid grid-cols-2 lg:grid-cols-4 gap-4;
}

.stat-item {
  @apply text-center;
}

.stat-label {
  @apply block text-sm text-gray-600 mb-1;
}

.dark .stat-label {
  @apply text-gray-400;
}

.stat-value {
  @apply block text-lg font-semibold text-gray-900;
}

.dark .stat-value {
  @apply text-white;
}

.network-requests {
  @apply border border-gray-200 rounded-lg overflow-hidden;
}

.dark .network-requests {
  @apply border-gray-700;
}

.request-list {
  @apply divide-y divide-gray-200;
}

.dark .request-list {
  @apply divide-gray-700;
}

.request-header {
  @apply grid grid-cols-5 gap-4 px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700;
}

.dark .request-header {
  @apply bg-gray-700 text-gray-300;
}

.request-item {
  @apply grid grid-cols-5 gap-4 px-4 py-3 text-sm hover:bg-gray-50;
}

.request-item.error {
  @apply bg-red-50;
}

.dark .request-item {
  @apply hover:bg-gray-700;
}

.dark .request-item.error {
  @apply bg-red-900/20;
}

.col-method {
  @apply font-medium;
}

.col-method.get {
  @apply text-green-600;
}

.col-method.post {
  @apply text-blue-600;
}

.col-method.put {
  @apply text-yellow-600;
}

.col-method.delete {
  @apply text-red-600;
}

.col-status.success {
  @apply text-green-600;
}

.col-status.redirect {
  @apply text-yellow-600;
}

.col-status.client-error,
.col-status.server-error {
  @apply text-red-600;
}

.cache-overview {
  @apply mb-6;
}

.cache-stats {
  @apply grid grid-cols-1 md:grid-cols-3 gap-4;
}

.stat-card {
  @apply bg-gray-50 rounded-lg p-4 text-center;
}

.dark .stat-card {
  @apply bg-gray-700;
}

.stat-title {
  @apply text-sm font-medium text-gray-600 mb-2;
}

.dark .stat-title {
  @apply text-gray-400;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 mb-2;
}

.dark .stat-value {
  @apply text-white;
}

.stat-subtitle {
  @apply text-sm text-gray-500;
}

.dark .stat-subtitle {
  @apply text-gray-400;
}

.hit-rate-circle {
  @apply mx-auto;
}

.cache-layers {
  @apply space-y-4;
}

.layer-item {
  @apply border border-gray-200 rounded-lg p-4;
}

.dark .layer-item {
  @apply border-gray-700;
}

.layer-header {
  @apply flex items-center justify-between mb-2;
}

.layer-name {
  @apply font-medium text-gray-900;
}

.dark .layer-name {
  @apply text-white;
}

.layer-size {
  @apply text-sm text-gray-600;
}

.dark .layer-size {
  @apply text-gray-400;
}

.layer-bar {
  @apply w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2;
}

.dark .layer-bar {
  @apply bg-gray-700;
}

.layer-fill {
  @apply h-full transition-all duration-300;
}

.layer-stats {
  @apply flex items-center gap-4 text-xs text-gray-600;
}

.dark .layer-stats {
  @apply text-gray-400;
}

.error-overview {
  @apply mb-6;
}

.error-stats {
  @apply flex items-center gap-8;
}

.error-count,
.error-rate {
  @apply text-center;
}

.count-number,
.rate-number {
  @apply block text-3xl font-bold text-gray-900 mb-1;
}

.dark .count-number,
.dark .rate-number {
  @apply text-white;
}

.count-label,
.rate-label {
  @apply text-sm text-gray-600;
}

.dark .count-label,
.dark .rate-label {
  @apply text-gray-400;
}

.error-list {
  @apply space-y-4;
}

.error-filters {
  @apply flex items-center gap-4 mb-4;
}

.filter-select,
.sort-select {
  @apply px-3 py-2 border border-gray-300 rounded-md text-sm;
}

.dark .filter-select,
.dark .sort-select {
  @apply bg-gray-700 border-gray-600 text-white;
}

.error-items {
  @apply space-y-3;
}

.error-item {
  @apply border border-gray-200 rounded-lg p-4;
}

.error-item.low {
  @apply border-gray-300;
}

.error-item.medium {
  @apply border-yellow-300;
}

.error-item.high {
  @apply border-orange-300;
}

.error-item.critical {
  @apply border-red-300;
}

.dark .error-item {
  @apply border-gray-700;
}

.dark .error-item.low {
  @apply border-gray-600;
}

.dark .error-item.medium {
  @apply border-yellow-600;
}

.dark .error-item.high {
  @apply border-orange-600;
}

.dark .error-item.critical {
  @apply border-red-600;
}

.error-header {
  @apply flex items-center gap-4 mb-2;
}

.error-type {
  @apply px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-medium;
}

.dark .error-type {
  @apply bg-gray-700 text-gray-300;
}

.error-time {
  @apply text-sm text-gray-500;
}

.dark .error-time {
  @apply text-gray-400;
}

.error-count {
  @apply px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-medium;
}

.dark .error-count {
  @apply bg-red-900 text-red-300;
}

.error-message {
  @apply text-sm text-gray-900 mb-2;
}

.dark .error-message {
  @apply text-white;
}

.error-stack {
  @apply bg-gray-50 rounded p-3 mb-3;
}

.dark .error-stack {
  @apply bg-gray-800;
}

.error-stack pre {
  @apply text-xs text-gray-700 whitespace-pre-wrap;
}

.dark .error-stack pre {
  @apply text-gray-300;
}

.error-actions {
  @apply flex items-center gap-2;
}

.error-actions button {
  @apply px-3 py-1 text-xs border border-gray-300 rounded hover:bg-gray-50 transition-colors;
}

.dark .error-actions button {
  @apply border-gray-600 hover:bg-gray-700 text-gray-300;
}

.performance-suggestions {
  @apply border-t border-gray-200 pt-6;
}

.dark .performance-suggestions {
  @apply border-gray-700;
}

.performance-suggestions h4 {
  @apply text-base font-semibold text-gray-900 mb-4;
}

.dark .performance-suggestions h4 {
  @apply text-white;
}

.suggestion-list {
  @apply space-y-3;
}

.suggestion-item {
  @apply flex items-start gap-4 p-4 border border-gray-200 rounded-lg;
}

.suggestion-item.low {
  @apply border-gray-300;
}

.suggestion-item.medium {
  @apply border-yellow-300;
}

.suggestion-item.high {
  @apply border-red-300;
}

.dark .suggestion-item {
  @apply border-gray-700;
}

.dark .suggestion-item.low {
  @apply border-gray-600;
}

.dark .suggestion-item.medium {
  @apply border-yellow-600;
}

.dark .suggestion-item.high {
  @apply border-red-600;
}

.suggestion-icon {
  @apply w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600;
}

.dark .suggestion-icon {
  @apply bg-blue-900 text-blue-400;
}

.suggestion-content {
  @apply flex-1;
}

.suggestion-title {
  @apply font-medium text-gray-900 mb-1;
}

.dark .suggestion-title {
  @apply text-white;
}

.suggestion-description {
  @apply text-sm text-gray-600 mb-2;
}

.dark .suggestion-description {
  @apply text-gray-400;
}

.suggestion-impact {
  @apply text-sm text-green-600 font-medium;
}

.dark .suggestion-impact {
  @apply text-green-400;
}

.suggestion-actions {
  @apply flex items-center gap-2;
}

.btn-apply {
  @apply px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors;
}

.btn-dismiss {
  @apply px-3 py-1 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors;
}

.dark .btn-dismiss {
  @apply text-gray-400 hover:text-gray-200 hover:bg-gray-700;
}
</style>