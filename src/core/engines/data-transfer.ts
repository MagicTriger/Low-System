import { ref, type Ref } from 'vue'
import type { DataRawValue } from '../../types/index'

// 数据流步骤接口
export interface DataTransferStep {
  id: string
  name: string
  type: 'transform' | 'filter' | 'validate' | 'custom'
  config: any
  enabled: boolean
}

// 数据流配置接口
export interface DataTransferConfig {
  id: string
  name: string
  description?: string
  steps: DataTransferStep[]
  input: {
    type: 'dataSource' | 'static' | 'parameter'
    source?: string
    data?: any
  }
  output: {
    type: 'dataSource' | 'variable' | 'return'
    target?: string
  }
}

// 数据流执行上下文
export interface DataTransferContext {
  input: any
  variables: Record<string, any>
  parameters: Record<string, any>
  currentStep: number
  totalSteps: number
}

/**
 * 数据流引擎
 * 处理复杂的数据转换和流程执行
 */
export class DataTransfer {
  // 配置
  public config: DataTransferConfig
  
  // 执行状态
  public executing: Ref<boolean> = ref(false)
  
  // 执行结果
  public result: Ref<any> = ref(null)
  
  // 错误信息
  public error: Ref<string | null> = ref(null)
  
  // 执行上下文
  private context: DataTransferContext | null = null
  
  constructor(config: DataTransferConfig) {
    this.config = config
  }
  
  /**
   * 执行数据流
   */
  async execute(parameters: Record<string, any> = {}): Promise<any> {
    if (this.executing.value) {
      throw new Error('数据流正在执行中')
    }
    
    this.executing.value = true
    this.error.value = null
    this.result.value = null
    
    try {
      // 初始化执行上下文
      this.context = {
        input: await this.getInputData(),
        variables: {},
        parameters,
        currentStep: 0,
        totalSteps: this.config.steps.filter(step => step.enabled).length
      }
      
      let data = this.context.input
      
      // 执行所有步骤
      for (const step of this.config.steps) {
        if (!step.enabled) continue
        
        this.context.currentStep++
        data = await this.executeStep(step, data, this.context)
      }
      
      // 处理输出
      await this.handleOutput(data)
      
      this.result.value = data
      return data
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '数据流执行失败'
      console.error('数据流执行失败:', error)
      throw error
    } finally {
      this.executing.value = false
      this.context = null
    }
  }
  
  /**
   * 获取输入数据
   */
  private async getInputData(): Promise<any> {
    const { input } = this.config
    
    switch (input.type) {
      case 'static':
        return input.data
        
      case 'dataSource':
        // 从数据源获取数据
        if (input.source) {
          // 这里应该从数据源管理器获取数据
          // 暂时返回空数组
          return []
        }
        return null
        
      case 'parameter':
        return this.context?.parameters || {}
        
      default:
        return null
    }
  }
  
  /**
   * 执行单个步骤
   */
  private async executeStep(
    step: DataTransferStep,
    data: any,
    context: DataTransferContext
  ): Promise<any> {
    switch (step.type) {
      case 'transform':
        return this.executeTransform(step, data, context)
        
      case 'filter':
        return this.executeFilter(step, data, context)
        
      case 'validate':
        return this.executeValidate(step, data, context)
        
      case 'custom':
        return this.executeCustom(step, data, context)
        
      default:
        throw new Error(`不支持的步骤类型: ${step.type}`)
    }
  }
  
  /**
   * 执行数据转换步骤
   */
  private async executeTransform(
    step: DataTransferStep,
    data: any,
    context: DataTransferContext
  ): Promise<any> {
    const { config } = step
    
    if (!Array.isArray(data)) {
      throw new Error('转换步骤需要数组类型的数据')
    }
    
    switch (config.type) {
      case 'map':
        // 字段映射
        return data.map(item => {
          const mapped: any = {}
          Object.entries(config.mapping || {}).forEach(([targetField, sourceField]) => {
            mapped[targetField] = this.getNestedValue(item, sourceField as string)
          })
          return mapped
        })
        
      case 'aggregate':
        // 数据聚合
        return this.aggregateData(data, config)
        
      case 'sort':
        // 数据排序
        return this.sortData(data, config)
        
      case 'group':
        // 数据分组
        return this.groupData(data, config)
        
      default:
        return data
    }
  }
  
  /**
   * 执行数据过滤步骤
   */
  private async executeFilter(
    step: DataTransferStep,
    data: any,
    context: DataTransferContext
  ): Promise<any> {
    const { config } = step
    
    if (!Array.isArray(data)) {
      return data
    }
    
    return data.filter(item => {
      return this.evaluateCondition(item, config.condition, context)
    })
  }
  
  /**
   * 执行数据验证步骤
   */
  private async executeValidate(
    step: DataTransferStep,
    data: any,
    context: DataTransferContext
  ): Promise<any> {
    const { config } = step
    
    // 验证数据格式
    if (config.schema) {
      // 这里可以集成JSON Schema验证
      // 暂时简单验证
      if (!this.validateSchema(data, config.schema)) {
        throw new Error(`数据验证失败: ${step.name}`)
      }
    }
    
    return data
  }
  
  /**
   * 执行自定义步骤
   */
  private async executeCustom(
    step: DataTransferStep,
    data: any,
    context: DataTransferContext
  ): Promise<any> {
    const { config } = step
    
    if (typeof config.handler === 'function') {
      return await config.handler(data, context)
    }
    
    if (typeof config.code === 'string') {
      // 执行自定义代码
      try {
        const func = new Function('data', 'context', config.code)
        return await func(data, context)
      } catch (error) {
        throw new Error(`自定义步骤执行失败: ${(error as Error).message}`)
      }
    }
    
    return data
  }
  
  /**
   * 处理输出
   */
  private async handleOutput(data: any): Promise<void> {
    const { output } = this.config
    
    switch (output.type) {
      case 'dataSource':
        // 输出到数据源
        if (output.target) {
          // 这里应该将数据保存到指定数据源
          console.log('输出到数据源:', output.target, data)
        }
        break
        
      case 'variable':
        // 输出到变量
        if (output.target && this.context) {
          this.context.variables[output.target] = data
        }
        break
        
      case 'return':
        // 直接返回
        break
    }
  }
  
  /**
   * 获取嵌套属性值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }
  
  /**
   * 数据聚合
   */
  private aggregateData(data: any[], config: any): any {
    const { groupBy, aggregations } = config
    
    if (!groupBy) {
      // 全局聚合
      const result: any = {}
      Object.entries(aggregations || {}).forEach(([field, func]) => {
        result[field] = this.applyAggregation(data, field, func as string)
      })
      return [result]
    }
    
    // 分组聚合
    const groups = this.groupData(data, { field: groupBy })
    return Object.entries(groups).map(([groupKey, groupData]) => {
      const result: any = { [groupBy]: groupKey }
      Object.entries(aggregations || {}).forEach(([field, func]) => {
        result[field] = this.applyAggregation(groupData as any[], field, func as string)
      })
      return result
    })
  }
  
  /**
   * 应用聚合函数
   */
  private applyAggregation(data: any[], field: string, func: string): any {
    const values = data.map(item => this.getNestedValue(item, field)).filter(v => v != null)
    
    switch (func) {
      case 'sum':
        return values.reduce((sum, val) => sum + Number(val), 0)
      case 'avg':
        return values.length > 0 ? values.reduce((sum, val) => sum + Number(val), 0) / values.length : 0
      case 'count':
        return values.length
      case 'min':
        return Math.min(...values.map(Number))
      case 'max':
        return Math.max(...values.map(Number))
      case 'first':
        return values[0]
      case 'last':
        return values[values.length - 1]
      default:
        return null
    }
  }
  
  /**
   * 数据排序
   */
  private sortData(data: any[], config: any): any[] {
    const { field, order = 'asc' } = config
    
    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, field)
      const bVal = this.getNestedValue(b, field)
      
      if (aVal < bVal) return order === 'asc' ? -1 : 1
      if (aVal > bVal) return order === 'asc' ? 1 : -1
      return 0
    })
  }
  
  /**
   * 数据分组
   */
  private groupData(data: any[], config: any): Record<string, any[]> {
    const { field } = config
    
    return data.reduce((groups, item) => {
      const key = String(this.getNestedValue(item, field))
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(item)
      return groups
    }, {} as Record<string, any[]>)
  }
  
  /**
   * 评估条件
   */
  private evaluateCondition(item: any, condition: any, context: DataTransferContext): boolean {
    if (!condition) return true
    
    const { field, operator, value } = condition
    const itemValue = this.getNestedValue(item, field)
    
    switch (operator) {
      case 'eq': return itemValue === value
      case 'ne': return itemValue !== value
      case 'gt': return itemValue > value
      case 'gte': return itemValue >= value
      case 'lt': return itemValue < value
      case 'lte': return itemValue <= value
      case 'in': return Array.isArray(value) && value.includes(itemValue)
      case 'nin': return Array.isArray(value) && !value.includes(itemValue)
      case 'contains': return String(itemValue).includes(String(value))
      case 'startsWith': return String(itemValue).startsWith(String(value))
      case 'endsWith': return String(itemValue).endsWith(String(value))
      default: return true
    }
  }
  
  /**
   * 验证数据结构
   */
  private validateSchema(data: any, schema: any): boolean {
    // 简单的结构验证，实际项目中可以使用JSON Schema
    if (schema.type === 'array') {
      return Array.isArray(data)
    }
    
    if (schema.type === 'object') {
      return typeof data === 'object' && data !== null
    }
    
    return true
  }
  
  /**
   * 获取执行进度
   */
  getProgress(): { current: number; total: number; percentage: number } {
    if (!this.context) {
      return { current: 0, total: 0, percentage: 0 }
    }
    
    const { currentStep, totalSteps } = this.context
    return {
      current: currentStep,
      total: totalSteps,
      percentage: totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0
    }
  }
  
  /**
   * 停止执行
   */
  stop(): void {
    this.executing.value = false
    this.context = null
  }
  
  /**
   * 克隆数据流
   */
  clone(): DataTransfer {
    return new DataTransfer(JSON.parse(JSON.stringify(this.config)))
  }
}