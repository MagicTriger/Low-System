import { ref, computed, watch, type Ref } from 'vue'
import type { FieldMetadata, ValidationRule, DataRawValue } from '../../types/index'
import type { DataSource } from './data-source'
import type { DataObject } from './data-object'

/**
 * 数据字段引擎
 * 管理单个字段的值、验证和状态
 */
export class DataField {
  // 数据源引用
  public dataSource: DataSource
  
  // 数据对象引用
  public dataObject: DataObject
  
  // 字段元数据
  public metadata: FieldMetadata
  
  // 字段值
  private _value: Ref<DataRawValue> = ref(null)
  
  // 原始值
  private originalValue: DataRawValue = null
  
  // 验证错误
  private _errors: Ref<string[]> = ref([])
  
  // 验证状态
  private _isValidating: Ref<boolean> = ref(false)
  
  // 值变化回调
  private valueChangeCallbacks: Array<(value: DataRawValue) => void> = []
  
  // 计算属性
  public readonly value = computed({
    get: () => this._value.value,
    set: (val: DataRawValue) => this.setValue(val)
  })
  
  public readonly errors = computed(() => this._errors.value)
  public readonly hasErrors = computed(() => this._errors.value.length > 0)
  public readonly isValidating = computed(() => this._isValidating.value)
  public readonly isChanged = computed(() => this._value.value !== this.originalValue)
  public readonly isValid = computed(() => this._errors.value.length === 0)
  
  constructor(
    dataSource: DataSource,
    dataObject: DataObject,
    metadata: FieldMetadata,
    initialValue: DataRawValue = null
  ) {
    this.dataSource = dataSource
    this.dataObject = dataObject
    this.metadata = metadata
    this.originalValue = initialValue
    this._value.value = initialValue ?? metadata.defaultValue ?? null
    
    this.init()
  }
  
  /**
   * 初始化字段
   */
  private init(): void {
    // 监听值变化
    watch(this._value, (newValue, oldValue) => {
      // 触发值变化回调
      this.valueChangeCallbacks.forEach(callback => {
        try {
          callback(newValue)
        } catch (error) {
          console.error('字段值变化回调执行失败:', error)
        }
      })
      
      // 自动验证
      if (newValue !== oldValue) {
        this.validate()
      }
    }, { immediate: false })
  }
  
  /**
   * 设置字段值
   */
  setValue(value: DataRawValue): void {
    // 类型转换
    const convertedValue = this.convertValue(value)
    this._value.value = convertedValue
  }
  
  /**
   * 获取字段值
   */
  getValue(): DataRawValue {
    return this._value.value
  }
  
  /**
   * 值类型转换
   */
  private convertValue(value: DataRawValue): DataRawValue {
    if (value === null || value === undefined) {
      return null
    }
    
    switch (this.metadata.type) {
      case 'string':
        return String(value)
        
      case 'number':
        const num = Number(value)
        return isNaN(num) ? null : num
        
      case 'boolean':
        if (typeof value === 'boolean') return value
        if (typeof value === 'string') {
          return value.toLowerCase() === 'true' || value === '1'
        }
        return Boolean(value)
        
      case 'date':
        if (value instanceof Date) return value
        if (typeof value === 'string' || typeof value === 'number') {
          const date = new Date(value)
          return isNaN(date.getTime()) ? null : date
        }
        return null
        
      case 'array':
        return Array.isArray(value) ? value : []
        
      case 'object':
        return typeof value === 'object' ? value : {}
        
      default:
        return value
    }
  }
  
  /**
   * 验证字段值
   */
  async validate(): Promise<string[]> {
    this._isValidating.value = true
    const errors: string[] = []
    
    try {
      const value = this._value.value
      const rules = this.metadata.validation || []
      
      // 执行验证规则
      for (const rule of rules) {
        const error = await this.validateRule(value, rule)
        if (error) {
          errors.push(error)
        }
      }
      
      this._errors.value = errors
      return errors
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '验证失败'
      this._errors.value = [errorMessage]
      return [errorMessage]
    } finally {
      this._isValidating.value = false
    }
  }
  
  /**
   * 验证单个规则
   */
  private async validateRule(value: DataRawValue, rule: ValidationRule): Promise<string | null> {
    switch (rule.type) {
      case 'required':
        if (this.isEmpty(value)) {
          return rule.message || `${this.metadata.name}不能为空`
        }
        break
        
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `${this.metadata.name}不能小于${rule.value}`
        }
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || `${this.metadata.name}长度不能小于${rule.value}`
        }
        break
        
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `${this.metadata.name}不能大于${rule.value}`
        }
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || `${this.metadata.name}长度不能大于${rule.value}`
        }
        break
        
      case 'pattern':
        if (typeof value === 'string' && !new RegExp(rule.value).test(value)) {
          return rule.message || `${this.metadata.name}格式不正确`
        }
        break
        
      case 'custom':
        if (typeof rule.value === 'function') {
          try {
            const result = await rule.value(value, this)
            if (result !== true) {
              return typeof result === 'string' ? result : (rule.message || '验证失败')
            }
          } catch (error) {
            return rule.message || '自定义验证失败'
          }
        }
        break
    }
    
    return null
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
   * 重置字段值
   */
  reset(): void {
    this._value.value = this.originalValue
    this._errors.value = []
  }
  
  /**
   * 标记为干净状态
   */
  markAsClean(): void {
    this.originalValue = this._value.value
  }
  
  /**
   * 清除验证错误
   */
  clearErrors(): void {
    this._errors.value = []
  }
  
  /**
   * 添加验证错误
   */
  addError(error: string): void {
    if (!this._errors.value.includes(error)) {
      this._errors.value.push(error)
    }
  }
  
  /**
   * 注册值变化回调
   */
  onValueChange(callback: (value: DataRawValue) => void): void {
    this.valueChangeCallbacks.push(callback)
  }
  
  /**
   * 移除值变化回调
   */
  offValueChange(callback: (value: DataRawValue) => void): void {
    const index = this.valueChangeCallbacks.indexOf(callback)
    if (index > -1) {
      this.valueChangeCallbacks.splice(index, 1)
    }
  }
  
  /**
   * 格式化显示值
   */
  getDisplayValue(): string {
    const value = this._value.value
    
    if (value === null || value === undefined) {
      return ''
    }
    
    switch (this.metadata.type) {
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString()
        }
        break
        
      case 'number':
        if (typeof value === 'number') {
          return value.toLocaleString()
        }
        break
        
      case 'boolean':
        return value ? '是' : '否'
        
      case 'array':
        if (Array.isArray(value)) {
          return `[${value.length}项]`
        }
        break
        
      case 'object':
        if (typeof value === 'object') {
          return '[对象]'
        }
        break
    }
    
    return String(value)
  }
  
  /**
   * 序列化为JSON
   */
  toJSON(): any {
    return {
      code: this.metadata.code,
      name: this.metadata.name,
      type: this.metadata.type,
      value: this._value.value,
      originalValue: this.originalValue,
      errors: this._errors.value,
      isChanged: this.isChanged.value,
      isValid: this.isValid.value
    }
  }
  
  /**
   * 销毁字段
   */
  destroy(): void {
    this.valueChangeCallbacks = []
    this._errors.value = []
  }
  
  // 静态方法：提供键用于依赖注入
  static readonly ProvideKey = Symbol('DataField')
}