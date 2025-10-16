import { ref, watch, type Ref } from 'vue'
import type { DataRawValue } from '../../types/index'
import type { DataSource } from './data-source'
import type { DataObject } from './data-object'
import type { DataField } from './data-field'

// 规则条件接口
export interface RuleCondition {
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'contains' | 'empty' | 'notEmpty'
  value?: any
  logic?: 'and' | 'or'
}

// 规则动作接口
export interface RuleAction {
  type: 'setValue' | 'setVisible' | 'setRequired' | 'setReadonly' | 'setOptions' | 'showMessage' | 'custom'
  target: string
  value?: any
  message?: string
  handler?: (context: RuleExecutionContext) => void
}

// 数据规则接口
export interface DataRule {
  id: string
  name: string
  description?: string
  enabled: boolean
  priority: number
  trigger: 'onChange' | 'onLoad' | 'onSave' | 'manual'
  conditions: RuleCondition[]
  actions: RuleAction[]
}

// 规则执行上下文
export interface RuleExecutionContext {
  dataSource: DataSource
  dataObject: DataObject
  triggerField?: DataField
  triggerValue?: DataRawValue
  variables: Record<string, any>
}

/**
 * 数据规则引擎
 * 处理数据联动、验证和自动化操作
 */
export class DataRules {
  // 规则列表
  public rules: DataRule[] = []
  
  // 数据源引用
  public dataSource: DataSource
  
  // 执行状态
  public executing: Ref<boolean> = ref(false)
  
  // 执行日志
  public executionLog: Ref<Array<{ time: Date; rule: string; action: string; result: any }>> = ref([])
  
  // 变量存储
  private variables: Record<string, any> = {}
  
  // 监听器清理函数
  private cleanupFunctions: Array<() => void> = []
  
  constructor(dataSource: DataSource, rules: DataRule[] = []) {
    this.dataSource = dataSource
    this.rules = rules
    this.init()
  }
  
  /**
   * 初始化规则引擎
   */
  private init(): void {
    // 监听数据源变化
    this.setupDataSourceWatchers()
    
    // 执行初始化规则
    this.executeRules('onLoad')
  }
  
  /**
   * 设置数据源监听器
   */
  private setupDataSourceWatchers(): void {
    // 监听数据对象变化
    const stopWatchingObjects = watch(
      () => this.dataSource.objects.value,
      (newObjects, oldObjects) => {
        // 为新对象设置字段监听器
        newObjects.forEach(obj => this.setupObjectWatchers(obj))
      },
      { immediate: true }
    )
    
    this.cleanupFunctions.push(stopWatchingObjects)
  }
  
  /**
   * 设置数据对象监听器
   */
  private setupObjectWatchers(dataObject: DataObject): void {
    // 监听每个字段的值变化
    Object.values(dataObject.fields).forEach(field => {
      field.onValueChange((newValue) => {
        this.executeRules('onChange', dataObject, field, newValue)
      })
    })
  }
  
  /**
   * 执行规则
   */
  async executeRules(
    trigger: 'onChange' | 'onLoad' | 'onSave' | 'manual',
    dataObject?: DataObject,
    triggerField?: DataField,
    triggerValue?: DataRawValue
  ): Promise<void> {
    if (this.executing.value) return
    
    this.executing.value = true
    
    try {
      // 获取匹配的规则
      const matchedRules = this.rules
        .filter(rule => rule.enabled && rule.trigger === trigger)
        .sort((a, b) => b.priority - a.priority) // 按优先级排序
      
      // 执行规则
      for (const rule of matchedRules) {
        await this.executeRule(rule, dataObject, triggerField, triggerValue)
      }
    } catch (error) {
      console.error('规则执行失败:', error)
    } finally {
      this.executing.value = false
    }
  }
  
  /**
   * 执行单个规则
   */
  private async executeRule(
    rule: DataRule,
    dataObject?: DataObject,
    triggerField?: DataField,
    triggerValue?: DataRawValue
  ): Promise<void> {
    try {
      // 如果没有指定数据对象，对所有对象执行规则
      const targetObjects = dataObject ? [dataObject] : this.dataSource.objects.value
      
      for (const obj of targetObjects) {
        const context: RuleExecutionContext = {
          dataSource: this.dataSource,
          dataObject: obj,
          triggerField,
          triggerValue,
          variables: this.variables
        }
        
        // 检查条件
        if (this.evaluateConditions(rule.conditions, context)) {
          // 执行动作
          await this.executeActions(rule.actions, context)
          
          // 记录执行日志
          this.logExecution(rule, context)
        }
      }
    } catch (error) {
      console.error(`规则 ${rule.name} 执行失败:`, error)
    }
  }
  
  /**
   * 评估规则条件
   */
  private evaluateConditions(conditions: RuleCondition[], context: RuleExecutionContext): boolean {
    if (conditions.length === 0) return true
    
    let result = true
    let currentLogic: 'and' | 'or' = 'and'
    
    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context)
      
      if (currentLogic === 'and') {
        result = result && conditionResult
      } else {
        result = result || conditionResult
      }
      
      // 更新逻辑操作符
      if (condition.logic) {
        currentLogic = condition.logic
      }
    }
    
    return result
  }
  
  /**
   * 评估单个条件
   */
  private evaluateCondition(condition: RuleCondition, context: RuleExecutionContext): boolean {
    const field = context.dataObject.getField(condition.field)
    if (!field) return false
    
    const fieldValue = field.getValue()
    const { operator, value } = condition
    
    switch (operator) {
      case 'eq':
        return fieldValue === value
        
      case 'ne':
        return fieldValue !== value
        
      case 'gt':
        return Number(fieldValue) > Number(value)
        
      case 'gte':
        return Number(fieldValue) >= Number(value)
        
      case 'lt':
        return Number(fieldValue) < Number(value)
        
      case 'lte':
        return Number(fieldValue) <= Number(value)
        
      case 'in':
        return Array.isArray(value) && value.includes(fieldValue)
        
      case 'nin':
        return Array.isArray(value) && !value.includes(fieldValue)
        
      case 'contains':
        return String(fieldValue).includes(String(value))
        
      case 'empty':
        return this.isEmpty(fieldValue)
        
      case 'notEmpty':
        return !this.isEmpty(fieldValue)
        
      default:
        return false
    }
  }
  
  /**
   * 执行规则动作
   */
  private async executeActions(actions: RuleAction[], context: RuleExecutionContext): Promise<void> {
    for (const action of actions) {
      await this.executeAction(action, context)
    }
  }
  
  /**
   * 执行单个动作
   */
  private async executeAction(action: RuleAction, context: RuleExecutionContext): Promise<void> {
    const { type, target, value, message, handler } = action
    
    switch (type) {
      case 'setValue':
        const field = context.dataObject.getField(target)
        if (field) {
          field.setValue(value)
        }
        break
        
      case 'setVisible':
        // 设置字段可见性（需要UI层支持）
        this.setFieldProperty(target, 'visible', value, context)
        break
        
      case 'setRequired':
        // 设置字段必填性
        this.setFieldProperty(target, 'required', value, context)
        break
        
      case 'setReadonly':
        // 设置字段只读性
        this.setFieldProperty(target, 'readonly', value, context)
        break
        
      case 'setOptions':
        // 设置字段选项
        this.setFieldProperty(target, 'options', value, context)
        break
        
      case 'showMessage':
        // 显示消息
        if (message) {
          console.log(`规则消息: ${message}`)
          // 这里可以集成消息通知系统
        }
        break
        
      case 'custom':
        // 执行自定义处理器
        if (handler) {
          await handler(context)
        }
        break
    }
  }
  
  /**
   * 设置字段属性
   */
  private setFieldProperty(
    fieldCode: string,
    property: string,
    value: any,
    context: RuleExecutionContext
  ): void {
    const field = context.dataObject.getField(fieldCode)
    if (!field) return
    
    // 将属性存储在变量中，供UI层使用
    const key = `${context.dataObject.id}_${fieldCode}_${property}`
    this.variables[key] = value
  }
  
  /**
   * 检查值是否为空
   */
  private isEmpty(value: DataRawValue): boolean {
    if (value === null || value === undefined) return true
    if (typeof value === 'string') return value.trim() === ''
    if (Array.isArray(value)) return value.length === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
  }
  
  /**
   * 记录执行日志
   */
  private logExecution(rule: DataRule, context: RuleExecutionContext): void {
    this.executionLog.value.push({
      time: new Date(),
      rule: rule.name,
      action: `执行规则: ${rule.actions.length} 个动作`,
      result: 'success'
    })
    
    // 限制日志数量
    if (this.executionLog.value.length > 100) {
      this.executionLog.value = this.executionLog.value.slice(-50)
    }
  }
  
  /**
   * 添加规则
   */
  addRule(rule: DataRule): void {
    this.rules.push(rule)
    this.rules.sort((a, b) => b.priority - a.priority)
  }
  
  /**
   * 删除规则
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(rule => rule.id === ruleId)
    if (index > -1) {
      this.rules.splice(index, 1)
      return true
    }
    return false
  }
  
  /**
   * 更新规则
   */
  updateRule(ruleId: string, updates: Partial<DataRule>): boolean {
    const rule = this.rules.find(rule => rule.id === ruleId)
    if (rule) {
      Object.assign(rule, updates)
      this.rules.sort((a, b) => b.priority - a.priority)
      return true
    }
    return false
  }
  
  /**
   * 启用/禁用规则
   */
  toggleRule(ruleId: string, enabled?: boolean): boolean {
    const rule = this.rules.find(rule => rule.id === ruleId)
    if (rule) {
      rule.enabled = enabled !== undefined ? enabled : !rule.enabled
      return true
    }
    return false
  }
  
  /**
   * 获取字段属性
   */
  getFieldProperty(objectId: number, fieldCode: string, property: string): any {
    const key = `${objectId}_${fieldCode}_${property}`
    return this.variables[key]
  }
  
  /**
   * 设置变量
   */
  setVariable(key: string, value: any): void {
    this.variables[key] = value
  }
  
  /**
   * 获取变量
   */
  getVariable(key: string): any {
    return this.variables[key]
  }
  
  /**
   * 清除执行日志
   */
  clearLog(): void {
    this.executionLog.value = []
  }
  
  /**
   * 销毁规则引擎
   */
  destroy(): void {
    // 清理监听器
    this.cleanupFunctions.forEach(cleanup => cleanup())
    this.cleanupFunctions = []
    
    // 清理数据
    this.rules = []
    this.variables = {}
    this.executionLog.value = []
  }
}