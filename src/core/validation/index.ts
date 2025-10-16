/**
 * 组件验证系统
 * 为所有输入组件提供统一的验证规则和错误提示机制
 */

import { messageManager, getMessage } from './messages'

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'email' | 'url' | 'number' | 'integer' | 'min' | 'max' | 'custom'
  message?: string
  value?: any
  validator?: (value: any, rule: ValidationRule) => boolean | string
}

export interface ValidationResult {
  valid: boolean
  message?: string
  field?: string
}

export interface FieldValidation {
  field: string
  rules: ValidationRule[]
  value: any
}

/**
 * 内置验证规则
 */
export const builtInRules = {
  required: {
    validator: (value: any) => {
      if (Array.isArray(value)) {
        return value.length > 0
      }
      if (typeof value === 'string') {
        return value.trim().length > 0
      }
      return value !== null && value !== undefined && value !== ''
    },
    message: '此字段为必填项'
  },
  
  minLength: {
    validator: (value: any, rule: ValidationRule) => {
      const str = String(value || '')
      return str.length >= (rule.value || 0)
    },
    message: (rule: ValidationRule) => `最少需要输入 ${rule.value} 个字符`
  },
  
  maxLength: {
    validator: (value: any, rule: ValidationRule) => {
      const str = String(value || '')
      return str.length <= (rule.value || Infinity)
    },
    message: (rule: ValidationRule) => `最多只能输入 ${rule.value} 个字符`
  },
  
  pattern: {
    validator: (value: any, rule: ValidationRule) => {
      if (!value) return true // 空值跳过正则验证
      const regex = rule.value instanceof RegExp ? rule.value : new RegExp(rule.value)
      return regex.test(String(value))
    },
    message: '输入格式不正确'
  },
  
  email: {
    validator: (value: any) => {
      if (!value) return true
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(String(value))
    },
    message: '请输入有效的邮箱地址'
  },
  
  url: {
    validator: (value: any) => {
      if (!value) return true
      try {
        new URL(String(value))
        return true
      } catch {
        return false
      }
    },
    message: '请输入有效的URL地址'
  },
  
  number: {
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return true
      return !isNaN(Number(value))
    },
    message: '请输入有效的数字'
  },
  
  integer: {
    validator: (value: any) => {
      if (value === null || value === undefined || value === '') return true
      const num = Number(value)
      return !isNaN(num) && Number.isInteger(num)
    },
    message: '请输入有效的整数'
  },
  
  min: {
    validator: (value: any, rule: ValidationRule) => {
      if (value === null || value === undefined || value === '') return true
      const num = Number(value)
      return !isNaN(num) && num >= (rule.value || 0)
    },
    message: (rule: ValidationRule) => `数值不能小于 ${rule.value}`
  },
  
  max: {
    validator: (value: any, rule: ValidationRule) => {
      if (value === null || value === undefined || value === '') return true
      const num = Number(value)
      return !isNaN(num) && num <= (rule.value || Infinity)
    },
    message: (rule: ValidationRule) => `数值不能大于 ${rule.value}`
  }
}

/**
 * 验证单个字段
 */
export function validateField(value: any, rules: ValidationRule[]): ValidationResult {
  for (const rule of rules) {
    const result = validateRule(value, rule)
    if (!result.valid) {
      return result
    }
  }
  
  return { valid: true }
}

/**
 * 验证单个规则
 */
export function validateRule(value: any, rule: ValidationRule): ValidationResult {
  try {
    let isValid = false
    let message = rule.message

    switch (rule.type) {
      case 'required':
        isValid = value !== null && value !== undefined && value !== ''
        if (!isValid && !message) {
          message = getMessage('required')
        }
        break

      case 'minLength':
        if (value === null || value === undefined || value === '') {
          isValid = true // 空值通过，由required规则处理
        } else {
          const length = String(value).length
          isValid = length >= (rule.value || 0)
          if (!isValid && !message) {
            message = getMessage('minLength', { min: rule.value })
          }
        }
        break

      case 'maxLength':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          const length = String(value).length
          isValid = length <= (rule.value || Infinity)
          if (!isValid && !message) {
            message = getMessage('maxLength', { max: rule.value })
          }
        }
        break

      case 'pattern':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          const regex = rule.value instanceof RegExp ? rule.value : new RegExp(rule.value)
          isValid = regex.test(String(value))
          if (!isValid && !message) {
            message = getMessage('pattern')
          }
        }
        break

      case 'email':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          isValid = emailPattern.test(String(value))
          if (!isValid && !message) {
            message = getMessage('email')
          }
        }
        break

      case 'url':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          try {
            new URL(String(value))
            isValid = true
          } catch {
            isValid = false
            if (!message) {
              message = getMessage('url')
            }
          }
        }
        break

      case 'number':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          isValid = !isNaN(Number(value))
          if (!isValid && !message) {
            message = getMessage('number')
          }
        }
        break

      case 'integer':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          const num = Number(value)
          isValid = !isNaN(num) && Number.isInteger(num)
          if (!isValid && !message) {
            message = getMessage('integer')
          }
        }
        break

      case 'min':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          const num = Number(value)
          isValid = !isNaN(num) && num >= (rule.value || 0)
          if (!isValid && !message) {
            message = getMessage('min', { min: rule.value })
          }
        }
        break

      case 'max':
        if (value === null || value === undefined || value === '') {
          isValid = true
        } else {
          const num = Number(value)
          isValid = !isNaN(num) && num <= (rule.value || Infinity)
          if (!isValid && !message) {
            message = getMessage('max', { max: rule.value })
          }
        }
        break

      case 'custom':
        if (rule.validator) {
          const result = rule.validator(value, rule)
          if (typeof result === 'boolean') {
            isValid = result
          } else {
            isValid = false
            message = result
          }
        } else {
          isValid = true
        }
        break

      default:
        isValid = true
    }

    return {
      valid: isValid,
      message: isValid ? undefined : message
    }
  } catch (error) {
    return {
      valid: false,
      message: `验证过程中发生错误: ${error instanceof Error ? error.message : '未知错误'}`
    }
  }
}

/**
 * 验证多个字段
 */
export function validateFields(fields: FieldValidation[]): ValidationResult[] {
  return fields.map(field => ({
    ...validateField(field.value, field.rules),
    field: field.field
  }))
}

/**
 * 检查是否所有字段都通过验证
 */
export function isAllValid(results: ValidationResult[]): boolean {
  return results.every(result => result.valid)
}

/**
 * 获取第一个验证错误
 */
export function getFirstError(results: ValidationResult[]): ValidationResult | null {
  return results.find(result => !result.valid) || null
}

/**
 * 获取所有验证错误
 */
export function getAllErrors(results: ValidationResult[]): ValidationResult[] {
  return results.filter(result => !result.valid)
}

/**
 * 创建验证规则构建器
 */
export class ValidationRuleBuilder {
  private rules: ValidationRule[] = []
  
  required(message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'required',
      message: message || builtInRules.required.message
    })
    return this
  }
  
  minLength(length: number, message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'minLength',
      value: length,
      message: message
    })
    return this
  }
  
  maxLength(length: number, message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'maxLength',
      value: length,
      message: message
    })
    return this
  }
  
  pattern(regex: RegExp | string, message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'pattern',
      value: regex,
      message: message || builtInRules.pattern.message
    })
    return this
  }
  
  email(message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'email',
      message: message || builtInRules.email.message
    })
    return this
  }
  
  url(message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'url',
      message: message || builtInRules.url.message
    })
    return this
  }
  
  number(message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'number',
      message: message || builtInRules.number.message
    })
    return this
  }
  
  integer(message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'integer',
      message: message || builtInRules.integer.message
    })
    return this
  }
  
  min(value: number, message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'min',
      value,
      message: message
    })
    return this
  }
  
  max(value: number, message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'max',
      value,
      message: message
    })
    return this
  }
  
  custom(validator: (value: any, rule: ValidationRule) => boolean | string, message?: string): ValidationRuleBuilder {
    this.rules.push({
      type: 'custom',
      validator,
      message
    })
    return this
  }
  
  build(): ValidationRule[] {
    return [...this.rules]
  }
}

/**
 * 创建验证规则构建器实例
 */
export function createRules(): ValidationRuleBuilder {
  return new ValidationRuleBuilder()
}

/**
 * 常用验证规则预设
 */
export const commonRules = {
  // 用户名规则
  username: createRules()
    .required('用户名不能为空')
    .minLength(3, '用户名至少3个字符')
    .maxLength(20, '用户名最多20个字符')
    .pattern(/^[a-zA-Z0-9_]+$/, '用户名只能包含字母、数字和下划线')
    .build(),
  
  // 密码规则
  password: createRules()
    .required('密码不能为空')
    .minLength(6, '密码至少6个字符')
    .maxLength(50, '密码最多50个字符')
    .build(),
  
  // 强密码规则
  strongPassword: createRules()
    .required('密码不能为空')
    .minLength(8, '密码至少8个字符')
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, '密码必须包含大小写字母、数字和特殊字符')
    .build(),
  
  // 邮箱规则
  email: createRules()
    .required('邮箱不能为空')
    .email()
    .build(),
  
  // 手机号规则
  phone: createRules()
    .required('手机号不能为空')
    .pattern(/^1[3-9]\d{9}$/, '请输入有效的手机号')
    .build(),
  
  // 身份证号规则
  idCard: createRules()
    .required('身份证号不能为空')
    .pattern(/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/, '请输入有效的身份证号')
    .build(),
  
  // URL规则
  url: createRules()
    .url()
    .build(),
  
  // 正整数规则
  positiveInteger: createRules()
    .required('请输入数值')
    .integer()
    .min(1, '数值必须大于0')
    .build(),
  
  // 非负整数规则
  nonNegativeInteger: createRules()
    .required('请输入数值')
    .integer()
    .min(0, '数值不能小于0')
    .build()
}

/**
 * 表单验证器类
 */
export class FormValidator {
  private fields: Map<string, { rules: ValidationRule[], value: any }> = new Map()
  private errors: Map<string, string> = new Map()
  
  /**
   * 添加字段验证规则
   */
  addField(field: string, rules: ValidationRule[], value?: any): FormValidator {
    this.fields.set(field, { rules, value })
    return this
  }
  
  /**
   * 更新字段值
   */
  updateValue(field: string, value: any): FormValidator {
    const fieldData = this.fields.get(field)
    if (fieldData) {
      fieldData.value = value
    }
    return this
  }
  
  /**
   * 验证单个字段
   */
  validateField(field: string): ValidationResult {
    const fieldData = this.fields.get(field)
    if (!fieldData) {
      return { valid: true }
    }
    
    const result = validateField(fieldData.value, fieldData.rules)
    
    if (result.valid) {
      this.errors.delete(field)
    } else {
      this.errors.set(field, result.message || '验证失败')
    }
    
    return { ...result, field }
  }
  
  /**
   * 验证所有字段
   */
  validateAll(): ValidationResult[] {
    const results: ValidationResult[] = []
    
    for (const [field] of this.fields) {
      results.push(this.validateField(field))
    }
    
    return results
  }
  
  /**
   * 检查是否所有字段都有效
   */
  isValid(): boolean {
    return this.errors.size === 0
  }
  
  /**
   * 获取字段错误信息
   */
  getError(field: string): string | undefined {
    return this.errors.get(field)
  }
  
  /**
   * 获取所有错误信息
   */
  getAllErrors(): Record<string, string> {
    return Object.fromEntries(this.errors)
  }
  
  /**
   * 清除字段错误
   */
  clearError(field: string): FormValidator {
    this.errors.delete(field)
    return this
  }
  
  /**
   * 清除所有错误
   */
  clearAllErrors(): FormValidator {
    this.errors.clear()
    return this
  }
  
  /**
   * 重置验证器
   */
  reset(): FormValidator {
    this.fields.clear()
    this.errors.clear()
    return this
  }
}

/**
 * 创建表单验证器实例
 */
export function createValidator(): FormValidator {
  return new FormValidator()
}