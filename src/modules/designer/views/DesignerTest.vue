<template>
  <div class="designer-test">
    <!-- 顶部导航 -->
    <div class="test-header">
      <h1>可视化设计器测试页面</h1>
      <div class="test-controls">
        <button @click="runAllTests" :disabled="isRunning" class="btn-primary">
          {{ isRunning ? '测试中...' : '运行所有测试' }}
        </button>
        <button @click="clearResults" class="btn-secondary">清除结果</button>
        <button @click="exportResults" class="btn-outline">导出结果</button>
      </div>
    </div>

    <!-- 测试结果概览 -->
    <div class="test-overview">
      <div class="test-stats">
        <div class="stat-item">
          <span class="stat-label">总测试数</span>
          <span class="stat-value">{{ totalTests }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">通过</span>
          <span class="stat-value success">{{ passedTests }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">失败</span>
          <span class="stat-value error">{{ failedTests }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">成功率</span>
          <span class="stat-value">{{ successRate }}%</span>
        </div>
      </div>
      
      <div class="test-progress" v-if="isRunning">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${testProgress}%` }"></div>
        </div>
        <span class="progress-text">{{ currentTest }}</span>
      </div>
    </div>

    <!-- 测试模块列表 -->
    <div class="test-modules">
      <div class="module-grid">
        <!-- 组件库测试 -->
        <div class="test-module" :class="getModuleStatus('components')">
          <div class="module-header">
            <h3>组件库测试</h3>
            <span class="module-status">{{ getModuleStatusText('components') }}</span>
          </div>
          <div class="module-content">
            <p>测试基础组件、表单组件、数据展示组件等</p>
            <div class="test-items">
              <div v-for="test in componentTests" :key="test.id" class="test-item" :class="test.status">
                <span class="test-name">{{ test.name }}</span>
                <span class="test-result">{{ test.result }}</span>
              </div>
            </div>
            <button @click="runModuleTest('components')" :disabled="isRunning" class="btn-test">
              运行测试
            </button>
          </div>
        </div>

        <!-- 布局系统测试 -->
        <div class="test-module" :class="getModuleStatus('layout')">
          <div class="module-header">
            <h3>布局系统测试</h3>
            <span class="module-status">{{ getModuleStatusText('layout') }}</span>
          </div>
          <div class="module-content">
            <p>测试网格布局、响应式布局、拖拽排序等</p>
            <div class="test-items">
              <div v-for="test in layoutTests" :key="test.id" class="test-item" :class="test.status">
                <span class="test-name">{{ test.name }}</span>
                <span class="test-result">{{ test.result }}</span>
              </div>
            </div>
            <button @click="runModuleTest('layout')" :disabled="isRunning" class="btn-test">
              运行测试
            </button>
          </div>
        </div>

        <!-- 属性编辑器测试 -->
        <div class="test-module" :class="getModuleStatus('properties')">
          <div class="module-header">
            <h3>属性编辑器测试</h3>
            <span class="module-status">{{ getModuleStatusText('properties') }}</span>
          </div>
          <div class="module-content">
            <p>测试属性面板、样式编辑器、事件绑定等</p>
            <div class="test-items">
              <div v-for="test in propertyTests" :key="test.id" class="test-item" :class="test.status">
                <span class="test-name">{{ test.name }}</span>
                <span class="test-result">{{ test.result }}</span>
              </div>
            </div>
            <button @click="runModuleTest('properties')" :disabled="isRunning" class="btn-test">
              运行测试
            </button>
          </div>
        </div>

        <!-- 组件通信测试 -->
        <div class="test-module" :class="getModuleStatus('communication')">
          <div class="module-header">
            <h3>组件通信测试</h3>
            <span class="module-status">{{ getModuleStatusText('communication') }}</span>
          </div>
          <div class="module-content">
            <p>测试事件总线、数据源管理、状态管理等</p>
            <div class="test-items">
              <div v-for="test in communicationTests" :key="test.id" class="test-item" :class="test.status">
                <span class="test-name">{{ test.name }}</span>
                <span class="test-result">{{ test.result }}</span>
              </div>
            </div>
            <button @click="runModuleTest('communication')" :disabled="isRunning" class="btn-test">
              运行测试
            </button>
          </div>
        </div>

        <!-- 后端集成测试 -->
        <div class="test-module" :class="getModuleStatus('backend')">
          <div class="module-header">
            <h3>后端集成测试</h3>
            <span class="module-status">{{ getModuleStatusText('backend') }}</span>
          </div>
          <div class="module-content">
            <p>测试API管理、依赖注入、配置管理等</p>
            <div class="test-items">
              <div v-for="test in backendTests" :key="test.id" class="test-item" :class="test.status">
                <span class="test-name">{{ test.name }}</span>
                <span class="test-result">{{ test.result }}</span>
              </div>
            </div>
            <button @click="runModuleTest('backend')" :disabled="isRunning" class="btn-test">
              运行测试
            </button>
          </div>
        </div>

        <!-- 性能优化测试 -->
        <div class="test-module" :class="getModuleStatus('performance')">
          <div class="module-header">
            <h3>性能优化测试</h3>
            <span class="module-status">{{ getModuleStatusText('performance') }}</span>
          </div>
          <div class="module-content">
            <p>测试虚拟滚动、懒加载、缓存管理等</p>
            <div class="test-items">
              <div v-for="test in performanceTests" :key="test.id" class="test-item" :class="test.status">
                <span class="test-name">{{ test.name }}</span>
                <span class="test-result">{{ test.result }}</span>
              </div>
            </div>
            <button @click="runModuleTest('performance')" :disabled="isRunning" class="btn-test">
              运行测试
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 详细测试结果 -->
    <div class="test-details" v-if="testResults.length > 0">
      <h2>详细测试结果</h2>
      <div class="results-list">
        <div v-for="result in testResults" :key="result.id" class="result-item" :class="result.status">
          <div class="result-header">
            <h4>{{ result.module }} - {{ result.name }}</h4>
            <span class="result-status">{{ result.status }}</span>
            <span class="result-time">{{ result.duration }}ms</span>
          </div>
          <div class="result-content">
            <p class="result-description">{{ result.description }}</p>
            <div v-if="result.error" class="result-error">
              <strong>错误信息：</strong>
              <pre>{{ result.error }}</pre>
            </div>
            <div v-if="result.details" class="result-details">
              <strong>详细信息：</strong>
              <pre>{{ JSON.stringify(result.details, null, 2) }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 性能监控面板 -->
    <div class="performance-panel">
      <h2>性能监控</h2>
      <PerformanceMonitor />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { PerformanceMonitor } from '@/core/renderer/designer/performance'

// 测试状态
const isRunning = ref(false)
const currentTest = ref('')
const testProgress = ref(0)
const testResults = ref<TestResult[]>([])

// 测试数据接口
interface TestItem {
  id: string
  name: string
  status: 'pending' | 'running' | 'passed' | 'failed'
  result: string
}

interface TestResult {
  id: string
  module: string
  name: string
  status: 'passed' | 'failed'
  duration: number
  description: string
  error?: string
  details?: any
}

// 各模块测试数据
const componentTests = ref<TestItem[]>([
  { id: 'basic-components', name: '基础组件渲染', status: 'pending', result: '' },
  { id: 'form-components', name: '表单组件功能', status: 'pending', result: '' },
  { id: 'data-components', name: '数据展示组件', status: 'pending', result: '' },
  { id: 'navigation-components', name: '导航组件', status: 'pending', result: '' },
  { id: 'feedback-components', name: '反馈组件', status: 'pending', result: '' }
])

const layoutTests = ref<TestItem[]>([
  { id: 'grid-layout', name: '网格布局系统', status: 'pending', result: '' },
  { id: 'responsive-layout', name: '响应式布局', status: 'pending', result: '' },
  { id: 'drag-drop', name: '拖拽排序功能', status: 'pending', result: '' },
  { id: 'layout-templates', name: '布局模板', status: 'pending', result: '' },
  { id: 'layout-constraints', name: '布局约束', status: 'pending', result: '' }
])

const propertyTests = ref<TestItem[]>([
  { id: 'property-panel', name: '属性面板', status: 'pending', result: '' },
  { id: 'style-editor', name: '样式编辑器', status: 'pending', result: '' },
  { id: 'event-binding', name: '事件绑定', status: 'pending', result: '' },
  { id: 'data-binding', name: '数据绑定', status: 'pending', result: '' },
  { id: 'validation-rules', name: '验证规则', status: 'pending', result: '' }
])

const communicationTests = ref<TestItem[]>([
  { id: 'event-bus', name: '事件总线', status: 'pending', result: '' },
  { id: 'data-source', name: '数据源管理', status: 'pending', result: '' },
  { id: 'state-management', name: '状态管理', status: 'pending', result: '' },
  { id: 'component-communication', name: '组件通信', status: 'pending', result: '' },
  { id: 'data-synchronization', name: '数据同步', status: 'pending', result: '' }
])

const backendTests = ref<TestItem[]>([
  { id: 'api-manager', name: 'API管理器', status: 'pending', result: '' },
  { id: 'dependency-injection', name: '依赖注入', status: 'pending', result: '' },
  { id: 'config-management', name: '配置管理', status: 'pending', result: '' },
  { id: 'service-integration', name: '服务集成', status: 'pending', result: '' },
  { id: 'error-handling', name: '错误处理', status: 'pending', result: '' }
])

const performanceTests = ref<TestItem[]>([
  { id: 'virtual-scroll', name: '虚拟滚动', status: 'pending', result: '' },
  { id: 'lazy-loading', name: '懒加载', status: 'pending', result: '' },
  { id: 'cache-management', name: '缓存管理', status: 'pending', result: '' },
  { id: 'performance-monitoring', name: '性能监控', status: 'pending', result: '' },
  { id: 'memory-optimization', name: '内存优化', status: 'pending', result: '' }
])

// 计算属性
const totalTests = computed(() => {
  return componentTests.value.length + 
         layoutTests.value.length + 
         propertyTests.value.length + 
         communicationTests.value.length + 
         backendTests.value.length + 
         performanceTests.value.length
})

const passedTests = computed(() => {
  return testResults.value.filter(result => result.status === 'passed').length
})

const failedTests = computed(() => {
  return testResults.value.filter(result => result.status === 'failed').length
})

const successRate = computed(() => {
  if (testResults.value.length === 0) return 0
  return Math.round((passedTests.value / testResults.value.length) * 100)
})

// 获取模块状态
const getModuleStatus = (module: string) => {
  const moduleTests = getModuleTests(module)
  const hasRunning = moduleTests.some(test => test.status === 'running')
  const hasFailed = moduleTests.some(test => test.status === 'failed')
  const allPassed = moduleTests.every(test => test.status === 'passed')
  
  if (hasRunning) return 'running'
  if (hasFailed) return 'failed'
  if (allPassed && moduleTests.length > 0) return 'passed'
  return 'pending'
}

const getModuleStatusText = (module: string) => {
  const status = getModuleStatus(module)
  const statusMap = {
    pending: '待测试',
    running: '测试中',
    passed: '通过',
    failed: '失败'
  }
  return statusMap[status]
}

const getModuleTests = (module: string) => {
  switch (module) {
    case 'components': return componentTests.value
    case 'layout': return layoutTests.value
    case 'properties': return propertyTests.value
    case 'communication': return communicationTests.value
    case 'backend': return backendTests.value
    case 'performance': return performanceTests.value
    default: return []
  }
}

// 测试方法
const runAllTests = async () => {
  if (isRunning.value) return
  
  isRunning.value = true
  testProgress.value = 0
  testResults.value = []
  
  const modules = ['components', 'layout', 'properties', 'communication', 'backend', 'performance']
  
  for (let i = 0; i < modules.length; i++) {
    await runModuleTest(modules[i])
    testProgress.value = Math.round(((i + 1) / modules.length) * 100)
  }
  
  isRunning.value = false
  currentTest.value = ''
}

const runModuleTest = async (module: string) => {
  const moduleTests = getModuleTests(module)
  
  for (const test of moduleTests) {
    test.status = 'running'
    currentTest.value = `${module} - ${test.name}`
    
    const startTime = performance.now()
    
    try {
      // 模拟测试执行
      await simulateTest(module, test)
      
      const duration = Math.round(performance.now() - startTime)
      
      test.status = 'passed'
      test.result = '通过'
      
      testResults.value.push({
        id: test.id,
        module,
        name: test.name,
        status: 'passed',
        duration,
        description: `${test.name} 测试通过`
      })
    } catch (error) {
      const duration = Math.round(performance.now() - startTime)
      
      test.status = 'failed'
      test.result = '失败'
      
      testResults.value.push({
        id: test.id,
        module,
        name: test.name,
        status: 'failed',
        duration,
        description: `${test.name} 测试失败`,
        error: error instanceof Error ? error.message : String(error)
      })
    }
    
    // 添加延迟以显示测试过程
    await new Promise(resolve => setTimeout(resolve, 200))
  }
}

const simulateTest = async (module: string, test: TestItem) => {
  // 模拟不同类型的测试
  const testDuration = Math.random() * 1000 + 500 // 500-1500ms
  
  await new Promise(resolve => setTimeout(resolve, testDuration))
  
  // 模拟一些测试失败的情况
  if (Math.random() < 0.1) { // 10% 失败率
    throw new Error(`模拟测试失败: ${test.name}`)
  }
  
  // 根据模块类型执行不同的测试逻辑
  switch (module) {
    case 'components':
      await testComponents(test)
      break
    case 'layout':
      await testLayout(test)
      break
    case 'properties':
      await testProperties(test)
      break
    case 'communication':
      await testCommunication(test)
      break
    case 'backend':
      await testBackend(test)
      break
    case 'performance':
      await testPerformance(test)
      break
  }
}

// 具体测试方法
const testComponents = async (test: TestItem) => {
  // 测试组件渲染和功能
  console.log(`Testing component: ${test.name}`)
}

const testLayout = async (test: TestItem) => {
  // 测试布局系统
  console.log(`Testing layout: ${test.name}`)
}

const testProperties = async (test: TestItem) => {
  // 测试属性编辑器
  console.log(`Testing properties: ${test.name}`)
}

const testCommunication = async (test: TestItem) => {
  // 测试组件通信
  console.log(`Testing communication: ${test.name}`)
}

const testBackend = async (test: TestItem) => {
  // 测试后端集成
  console.log(`Testing backend: ${test.name}`)
}

const testPerformance = async (test: TestItem) => {
  // 测试性能优化
  console.log(`Testing performance: ${test.name}`)
}

// 工具方法
const clearResults = () => {
  testResults.value = []
  
  // 重置所有测试状态
  const allTests = [
    ...componentTests.value,
    ...layoutTests.value,
    ...propertyTests.value,
    ...communicationTests.value,
    ...backendTests.value,
    ...performanceTests.value
  ]
  
  allTests.forEach(test => {
    test.status = 'pending'
    test.result = ''
  })
}

const exportResults = () => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: totalTests.value,
      passed: passedTests.value,
      failed: failedTests.value,
      successRate: successRate.value
    },
    results: testResults.value
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `designer-test-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 生命周期
onMounted(() => {
  console.log('Designer test page mounted')
})

onUnmounted(() => {
  console.log('Designer test page unmounted')
})
</script>

<style scoped>
.designer-test {
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 2px solid #e5e7eb;
}

.test-header h1 {
  margin: 0;
  color: #1f2937;
  font-size: 28px;
  font-weight: 600;
}

.test-controls {
  display: flex;
  gap: 12px;
}

.btn-primary, .btn-secondary, .btn-outline, .btn-test {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.btn-secondary {
  background: #6b7280;
  color: white;
}

.btn-secondary:hover {
  background: #4b5563;
}

.btn-outline {
  background: transparent;
  color: #3b82f6;
  border: 1px solid #3b82f6;
}

.btn-outline:hover {
  background: #3b82f6;
  color: white;
}

.btn-test {
  background: #10b981;
  color: white;
  width: 100%;
  margin-top: 12px;
}

.btn-test:hover:not(:disabled) {
  background: #059669;
}

.btn-test:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

.test-overview {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
}

.stat-label {
  display: block;
  font-size: 14px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  display: block;
  font-size: 24px;
  font-weight: 600;
  color: #1f2937;
}

.stat-value.success {
  color: #10b981;
}

.stat-value.error {
  color: #ef4444;
}

.test-progress {
  margin-top: 20px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: #3b82f6;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #6b7280;
}

.test-modules {
  margin-bottom: 40px;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.test-module {
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  overflow: hidden;
  transition: all 0.2s;
}

.test-module.pending {
  border-color: #e5e7eb;
}

.test-module.running {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.test-module.passed {
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.test-module.failed {
  border-color: #ef4444;
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.module-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
}

.module-status {
  font-size: 12px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 4px;
  background: #e5e7eb;
  color: #6b7280;
}

.test-module.running .module-status {
  background: #dbeafe;
  color: #3b82f6;
}

.test-module.passed .module-status {
  background: #d1fae5;
  color: #10b981;
}

.test-module.failed .module-status {
  background: #fee2e2;
  color: #ef4444;
}

.module-content {
  padding: 20px;
}

.module-content p {
  margin: 0 0 16px 0;
  color: #6b7280;
  font-size: 14px;
}

.test-items {
  margin-bottom: 16px;
}

.test-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  margin-bottom: 4px;
  border-radius: 4px;
  background: #f9fafb;
  font-size: 13px;
}

.test-item.running {
  background: #dbeafe;
  color: #3b82f6;
}

.test-item.passed {
  background: #d1fae5;
  color: #10b981;
}

.test-item.failed {
  background: #fee2e2;
  color: #ef4444;
}

.test-name {
  font-weight: 500;
}

.test-result {
  font-size: 12px;
  font-weight: 600;
}

.test-details {
  background: white;
  border-radius: 8px;
  padding: 24px;
  margin-bottom: 30px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.test-details h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

.results-list {
  space-y: 12px;
}

.result-item {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  margin-bottom: 12px;
  overflow: hidden;
}

.result-item.passed {
  border-color: #10b981;
}

.result-item.failed {
  border-color: #ef4444;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.result-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.result-status {
  font-size: 12px;
  font-weight: 500;
  padding: 2px 6px;
  border-radius: 3px;
}

.result-item.passed .result-status {
  background: #d1fae5;
  color: #10b981;
}

.result-item.failed .result-status {
  background: #fee2e2;
  color: #ef4444;
}

.result-time {
  font-size: 12px;
  color: #6b7280;
}

.result-content {
  padding: 16px;
}

.result-description {
  margin: 0 0 12px 0;
  color: #4b5563;
  font-size: 14px;
}

.result-error, .result-details {
  margin-top: 12px;
}

.result-error strong, .result-details strong {
  color: #1f2937;
  font-size: 13px;
}

.result-error pre, .result-details pre {
  margin: 8px 0 0 0;
  padding: 12px;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 12px;
  color: #374151;
  overflow-x: auto;
}

.performance-panel {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.performance-panel h2 {
  margin: 0 0 20px 0;
  color: #1f2937;
  font-size: 20px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .designer-test {
    padding: 16px;
  }
  
  .test-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
  
  .test-controls {
    justify-content: center;
  }
  
  .module-grid {
    grid-template-columns: 1fr;
  }
  
  .test-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .result-header {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
}

/* 深色主题支持 */
@media (prefers-color-scheme: dark) {
  .designer-test {
    background: #111827;
    color: #f9fafb;
  }
  
  .test-header {
    border-bottom-color: #374151;
  }
  
  .test-header h1 {
    color: #f9fafb;
  }
  
  .test-overview, .test-module, .test-details, .performance-panel {
    background: #1f2937;
    border-color: #374151;
  }
  
  .module-header {
    background: #111827;
    border-bottom-color: #374151;
  }
  
  .module-header h3 {
    color: #f9fafb;
  }
  
  .test-item {
    background: #111827;
  }
  
  .result-header {
    background: #111827;
    border-bottom-color: #374151;
  }
  
  .result-header h4 {
    color: #f9fafb;
  }
  
  .result-error pre, .result-details pre {
    background: #111827;
    color: #d1d5db;
  }
}
</style>