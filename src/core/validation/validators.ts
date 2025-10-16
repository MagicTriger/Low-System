/**
 * 高级验证器类
 * 提供更复杂的验证逻辑和功能
 */

import type { ValidationRule, ValidationResult } from './index'
import { validateField } from './index'
import { getMessage } from './messages'

/**
 * 字段依赖配置
 */
export interface FieldDependency {
  field: string
  condition: (value: any) => boolean
  rules: ValidationRule[]
}

/**
 * 验证上下文
 */
export interface ValidationContext {
  [field: string]: any
}

/**
 * 高级验证器
 */
export class AdvancedValidator {
  private fields: Map<string, ValidationRule[]> = new Map()
  private values: Map<string, any> = new Map()
  private dependencies: Map<string, FieldDependency[]> = new Map()
  private asyncValidators: Map<string, (value: any) => Promise<ValidationResult>> = new Map()
  private validationCache: Map<string, { value: any; result: ValidationResult; timestamp: number }> = new Map()
  private cacheTimeout: number = 5000 // 5秒缓存
  
  /**
   * 添加字段
   */
  addField(field: string, rules: ValidationRule[], value?: any) {
    this.fields.set(field, rules)
    if (value !== undefined) {
      this.values.set(field, value)
    }
    return this
  }
  
  /**
   * 添加字段依赖
   */
  addDependency(field: string, dependency: FieldDependency) {
    if (!this.dependencies.has(field)) {
      this.dependencies.set(field, [])
    }
    this.dependencies.get(field)!.push(dependency)
    return this
  }
  
  /**
   * 添加异步验证器
   */
  addAsyncValidator(field: string, validator: (value: any) => Promise<ValidationResult>) {
    this.asyncValidators.set(field, validator)
    return this
  }
  
  /**
   * 更新字段值
   */
  updateValue(field: string, value: any) {
    this.values.set(field, value)
    // 清除相关缓存
    this.clearFieldCache(field)
    return this
  }
  
  /**
   * 批量更新值
   */
  updateValues(values: Record<string, any>) {
    Object.entries(values).forEach(([field, value]) => {
      this.updateValue(field, value)
    })
    return this
  }
  
  /**
   * 验证单个字段（同步）
   */
  validateField(field: string): ValidationResult {
    const rules = this.fields.get(field)
    if (!rules) {
      return { valid: true }
    }
    
    const value = this.values.get(field)
    
    // 检查缓存
    const cacheKey = `${field}_${JSON.stringify(value)}`
    const cached = this.validationCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.result
    }
    
    // 基础验证
    let result = validateField(value, rules)
    
    // 依赖验证
    if (result.valid) {
      const dependencies = this.dependencies.get(field)
      if (dependencies) {
        for (const dep of dependencies) {
          const depValue = this.values.get(dep.field)
          if (dep.condition(depValue)) {
            const depResult = validateField(value, dep.rules)
            if (!depResult.valid) {
              result = depResult
              break
            }
          }
        }
      }
    }
    
    // 缓存结果
    this.validationCache.set(cacheKey, {
      value,
      result,
      timestamp: Date.now()
    })
    
    return result
  }
  
  /**
   * 异步验证单个字段
   */
  async validateFieldAsync(field: string): Promise<ValidationResult> {
    // 先执行同步验证
    const syncResult = this.validateField(field)
    if (!syncResult.valid) {
      return syncResult
    }
    
    // 执行异步验证
    const asyncValidator = this.asyncValidators.get(field)
    if (asyncValidator) {
      const value = this.values.get(field)
      try {
        return await asyncValidator(value)
      } catch (error) {
        return {
          valid: false,
          message: `异步验证失败: ${error instanceof Error ? error.message : '未知错误'}`
        }
      }
    }
    
    return syncResult
  }
  
  /**
   * 验证所有字段（同步）
   */
  validateAll(): ValidationResult[] {
    const results: ValidationResult[] = []
    
    for (const [field] of this.fields) {
      const result = this.validateField(field)
      results.push({ ...result, field })
    }
    
    return results
  }
  
  /**
   * 异步验证所有字段
   */
  async validateAllAsync(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    for (const [field] of this.fields) {
      const result = await this.validateFieldAsync(field)
      results.push({ ...result, field })
    }
    
    return results
  }
  
  /**
   * 检查是否所有字段都有效
   */
  isAllValid(): boolean {
    return this.validateAll().every(result => result.valid)
  }
  
  /**
   * 获取第一个错误
   */
  getFirstError(): ValidationResult | null {
    const results = this.validateAll()
    return results.find(result => !result.valid) || null
  }
  
  /**
   * 获取所有错误
   */
  getAllErrors(): ValidationResult[] {
    return this.validateAll().filter(result => !result.valid)
  }
  
  /**
   * 获取错误映射
   */
  getErrorMap(): Record<string, string> {
    const errors: Record<string, string> = {}
    const results = this.validateAll()
    
    results.forEach(result => {
      if (!result.valid && result.field && result.message) {
        errors[result.field] = result.message
      }
    })
    
    return errors
  }
  
  /**
   * 清除字段缓存
   */
  private clearFieldCache(field: string) {
    const keysToDelete: string[] = []
    for (const [key] of this.validationCache) {
      if (key.startsWith(`${field}_`)) {
        keysToDelete.push(key)
      }
    }
    keysToDelete.forEach(key => this.validationCache.delete(key))
  }
  
  /**
   * 清除所有缓存
   */
  clearCache() {
    this.validationCache.clear()
    return this
  }
  
  /**
   * 重置验证器
   */
  reset() {
    this.fields.clear()
    this.values.clear()
    this.dependencies.clear()
    this.asyncValidators.clear()
    this.clearCache()
    return this
  }
  
  /**
   * 获取验证统计信息
   */
  getStats() {
    const results = this.validateAll()
    const valid = results.filter(r => r.valid).length
    const invalid = results.filter(r => !r.valid).length
    
    return {
      total: results.length,
      valid,
      invalid,
      validRate: results.length > 0 ? (valid / results.length) * 100 : 0,
      cacheSize: this.validationCache.size
    }
  }
}

/**
 * 条件验证器
 */
export class ConditionalValidator {
  private conditions: Map<string, (context: ValidationContext) => boolean> = new Map()
  private validators: Map<string, AdvancedValidator> = new Map()
  
  /**
   * 添加条件
   */
  addCondition(name: string, condition: (context: ValidationContext) => boolean) {
    this.conditions.set(name, condition)
    return this
  }
  
  /**
   * 添加验证器
   */
  addValidator(conditionName: string, validator: AdvancedValidator) {
    this.validators.set(conditionName, validator)
    return this
  }
  
  /**
   * 验证
   */
  validate(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = []
    
    for (const [conditionName, condition] of this.conditions) {
      if (condition(context)) {
        const validator = this.validators.get(conditionName)
        if (validator) {
          // 更新验证器的值
          Object.entries(context).forEach(([field, value]) => {
            validator.updateValue(field, value)
          })
          
          const conditionResults = validator.validateAll()
          results.push(...conditionResults)
        }
      }
    }
    
    return results
  }
  
  /**
   * 异步验证
   */
  async validateAsync(context: ValidationContext): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    for (const [conditionName, condition] of this.conditions) {
      if (condition(context)) {
        const validator = this.validators.get(conditionName)
        if (validator) {
          // 更新验证器的值
          Object.entries(context).forEach(([field, value]) => {
            validator.updateValue(field, value)
          })
          
          const conditionResults = await validator.validateAllAsync()
          results.push(...conditionResults)
        }
      }
    }
    
    return results
  }
}

/**
 * 批量验证器
 */
export class BatchValidator {
  private validators: AdvancedValidator[] = []
  
  /**
   * 添加验证器
   */
  addValidator(validator: AdvancedValidator) {
    this.validators.push(validator)
    return this
  }
  
  /**
   * 批量验证
   */
  validateAll(): ValidationResult[] {
    const results: ValidationResult[] = []
    
    this.validators.forEach((validator, index) => {
      const validatorResults = validator.validateAll()
      validatorResults.forEach(result => {
        results.push({
          ...result,
          field: result.field ? `validator_${index}_${result.field}` : `validator_${index}`
        })
      })
    })
    
    return results
  }
  
  /**
   * 异步批量验证
   */
  async validateAllAsync(): Promise<ValidationResult[]> {
    const results: ValidationResult[] = []
    
    for (let i = 0; i < this.validators.length; i++) {
      const validator = this.validators[i]
      const validatorResults = await validator.validateAllAsync()
      validatorResults.forEach(result => {
        results.push({
          ...result,
          field: result.field ? `validator_${i}_${result.field}` : `validator_${i}`
        })
      })
    }
    
    return results
  }
  
  /**
   * 并行异步验证
   */
  async validateAllParallel(): Promise<ValidationResult[]> {
    const promises = this.validators.map(async (validator, index) => {
      const validatorResults = await validator.validateAllAsync()
      return validatorResults.map(result => ({
        ...result,
        field: result.field ? `validator_${index}_${result.field}` : `validator_${index}`
      }))
    })
    
    const results = await Promise.all(promises)
    return results.flat()
  }
}

/**
 * 验证器工厂
 */
export class ValidatorFactory {
  /**
   * 创建基础验证器
   */
  static createBasic(): AdvancedValidator {
    return new AdvancedValidator()
  }
  
  /**
   * 创建表单验证器
   */
  static createForm(fields: Record<string, ValidationRule[]>): AdvancedValidator {
    const validator = new AdvancedValidator()
    
    Object.entries(fields).forEach(([field, rules]) => {
      validator.addField(field, rules)
    })
    
    return validator
  }
  
  /**
   * 创建条件验证器
   */
  static createConditional(): ConditionalValidator {
    return new ConditionalValidator()
  }
  
  /**
   * 创建批量验证器
   */
  static createBatch(): BatchValidator {
    return new BatchValidator()
  }
  
  /**
   * 从配置创建验证器
   */
  static fromConfig(config: {
    fields: Record<string, ValidationRule[]>
    dependencies?: Record<string, FieldDependency[]>
    asyncValidators?: Record<string, (value: any) => Promise<ValidationResult>>
  }): AdvancedValidator {
    const validator = new AdvancedValidator()
    
    // 添加字段
    Object.entries(config.fields).forEach(([field, rules]) => {
      validator.addField(field, rules)
    })
    
    // 添加依赖
    if (config.dependencies) {
      Object.entries(config.dependencies).forEach(([field, deps]) => {
        deps.forEach(dep => validator.addDependency(field, dep))
      })
    }
    
    // 添加异步验证器
    if (config.asyncValidators) {
      Object.entries(config.asyncValidators).forEach(([field, asyncValidator]) => {
        validator.addAsyncValidator(field, asyncValidator)
      })
    }
    
    return validator
  }
}