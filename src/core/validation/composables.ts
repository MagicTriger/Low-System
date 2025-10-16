/**
 * 验证系统的Vue组合式API
 * 提供响应式的验证功能，方便在组件中使用
 */

import { ref, computed, watch, type Ref } from 'vue'
import {
  validateField,
  validateRule,
  type ValidationRule,
  type ValidationResult,
  FormValidator
} from './index'

/**
 * 单字段验证组合式API
 */
export function useFieldValidation(
  value: Ref<any>,
  rules: ValidationRule[] | Ref<ValidationRule[]>,
  options: {
    immediate?: boolean
    trigger?: 'change' | 'blur' | 'manual'
  } = {}
) {
  const { immediate = false, trigger = 'change' } = options
  
  const error = ref<string | null>(null)
  const isValidating = ref(false)
  const hasValidated = ref(false)
  
  const isValid = computed(() => error.value === null)
  const hasError = computed(() => error.value !== null)
  
  // 执行验证
  const validate = async (): Promise<ValidationResult> => {
    isValidating.value = true
    hasValidated.value = true
    
    try {
      const currentRules = Array.isArray(rules) ? rules : rules.value
      const result = validateField(value.value, currentRules)
      
      error.value = result.valid ? null : (result.message || '验证失败')
      
      return result
    } finally {
      isValidating.value = false
    }
  }
  
  // 清除验证错误
  const clearError = () => {
    error.value = null
    hasValidated.value = false
  }
  
  // 重置验证状态
  const reset = () => {
    clearError()
    isValidating.value = false
  }
  
  // 监听值变化自动验证
  if (trigger === 'change') {
    watch(value, () => {
      if (hasValidated.value || immediate) {
        validate()
      }
    }, { immediate })
  }
  
  return {
    error: readonly(error),
    isValid,
    hasError,
    isValidating: readonly(isValidating),
    hasValidated: readonly(hasValidated),
    validate,
    clearError,
    reset
  }
}

/**
 * 表单验证组合式API
 */
export function useFormValidation() {
  const validator = new FormValidator()
  const isValidating = ref(false)
  const errors = ref<Record<string, string>>({})
  
  const isValid = computed(() => Object.keys(errors.value).length === 0)
  const hasErrors = computed(() => Object.keys(errors.value).length > 0)
  
  // 添加字段
  const addField = (field: string, rules: ValidationRule[], value?: any) => {
    validator.addField(field, rules, value)
    return {
      field,
      rules,
      value
    }
  }
  
  // 更新字段值
  const updateValue = (field: string, value: any) => {
    validator.updateValue(field, value)
  }
  
  // 验证单个字段
  const validateField = async (field: string): Promise<ValidationResult> => {
    const result = validator.validateField(field)
    
    if (result.valid) {
      delete errors.value[field]
    } else {
      errors.value[field] = result.message || '验证失败'
    }
    
    // 触发响应式更新
    errors.value = { ...errors.value }
    
    return result
  }
  
  // 验证所有字段
  const validateAll = async (): Promise<ValidationResult[]> => {
    isValidating.value = true
    
    try {
      const results = validator.validateAll()
      
      // 更新错误状态
      errors.value = {}
      results.forEach(result => {
        if (!result.valid && result.field) {
          errors.value[result.field] = result.message || '验证失败'
        }
      })
      
      return results
    } finally {
      isValidating.value = false
    }
  }
  
  // 获取字段错误
  const getError = (field: string): string | undefined => {
    return errors.value[field]
  }
  
  // 清除字段错误
  const clearError = (field: string) => {
    delete errors.value[field]
    errors.value = { ...errors.value }
    validator.clearError(field)
  }
  
  // 清除所有错误
  const clearAllErrors = () => {
    errors.value = {}
    validator.clearAllErrors()
  }
  
  // 重置表单
  const reset = () => {
    clearAllErrors()
    validator.reset()
    isValidating.value = false
  }
  
  return {
    errors: readonly(errors),
    isValid,
    hasErrors,
    isValidating: readonly(isValidating),
    addField,
    updateValue,
    validateField,
    validateAll,
    getError,
    clearError,
    clearAllErrors,
    reset
  }
}

/**
 * 异步验证组合式API
 */
export function useAsyncValidation<T = any>(
  asyncValidator: (value: T) => Promise<boolean | string>,
  options: {
    debounce?: number
    immediate?: boolean
  } = {}
) {
  const { debounce = 300, immediate = false } = options
  
  const isValidating = ref(false)
  const error = ref<string | null>(null)
  const hasValidated = ref(false)
  
  const isValid = computed(() => error.value === null && !isValidating.value)
  const hasError = computed(() => error.value !== null)
  
  let debounceTimer: NodeJS.Timeout | null = null
  
  // 执行异步验证
  const validate = async (value: T): Promise<ValidationResult> => {
    // 清除之前的定时器
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    return new Promise((resolve) => {
      debounceTimer = setTimeout(async () => {
        isValidating.value = true
        hasValidated.value = true
        
        try {
          const result = await asyncValidator(value)
          
          if (typeof result === 'boolean') {
            error.value = result ? null : '验证失败'
            resolve({ valid: result, message: error.value || undefined })
          } else {
            error.value = result
            resolve({ valid: false, message: result })
          }
        } catch (err) {
          error.value = '验证过程中发生错误'
          resolve({ valid: false, message: error.value })
        } finally {
          isValidating.value = false
        }
      }, debounce)
    })
  }
  
  // 清除验证错误
  const clearError = () => {
    error.value = null
    hasValidated.value = false
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }
  
  // 重置验证状态
  const reset = () => {
    clearError()
    isValidating.value = false
  }
  
  return {
    error: readonly(error),
    isValid,
    hasError,
    isValidating: readonly(isValidating),
    hasValidated: readonly(hasValidated),
    validate,
    clearError,
    reset
  }
}

/**
 * 条件验证组合式API
 */
export function useConditionalValidation(
  condition: Ref<boolean> | (() => boolean),
  rules: ValidationRule[] | Ref<ValidationRule[]>
) {
  const shouldValidate = computed(() => {
    return typeof condition === 'function' ? condition() : condition.value
  })
  
  const conditionalRules = computed(() => {
    if (!shouldValidate.value) {
      return []
    }
    return Array.isArray(rules) ? rules : rules.value
  })
  
  return {
    shouldValidate,
    rules: conditionalRules
  }
}

/**
 * 验证组合器 - 组合多个验证结果
 */
export function useValidationComposer(...validations: Array<{
  isValid: Ref<boolean>
  error: Ref<string | null>
}>) {
  const isAllValid = computed(() => {
    return validations.every(validation => validation.isValid.value)
  })
  
  const hasAnyError = computed(() => {
    return validations.some(validation => validation.error.value !== null)
  })
  
  const firstError = computed(() => {
    const validation = validations.find(v => v.error.value !== null)
    return validation?.error.value || null
  })
  
  const allErrors = computed(() => {
    return validations
      .map(v => v.error.value)
      .filter(error => error !== null) as string[]
  })
  
  return {
    isAllValid,
    hasAnyError,
    firstError,
    allErrors
  }
}

/**
 * 实时验证组合式API
 */
export function useRealtimeValidation(
  value: Ref<any>,
  rules: ValidationRule[],
  options: {
    debounce?: number
    immediate?: boolean
  } = {}
) {
  const { debounce = 0, immediate = true } = options
  
  const error = ref<string | null>(null)
  const isValidating = ref(false)
  
  const isValid = computed(() => error.value === null)
  
  let debounceTimer: NodeJS.Timeout | null = null
  
  const validate = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    
    const doValidate = () => {
      isValidating.value = true
      
      try {
        const result = validateField(value.value, rules)
        error.value = result.valid ? null : (result.message || '验证失败')
      } finally {
        isValidating.value = false
      }
    }
    
    if (debounce > 0) {
      debounceTimer = setTimeout(doValidate, debounce)
    } else {
      doValidate()
    }
  }
  
  // 监听值变化
  watch(value, validate, { immediate })
  
  const clearError = () => {
    error.value = null
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
  }
  
  return {
    error: readonly(error),
    isValid,
    isValidating: readonly(isValidating),
    validate,
    clearError
  }
}

// 导入readonly函数
function readonly<T>(ref: Ref<T>): Readonly<Ref<T>> {
  return ref as Readonly<Ref<T>>
}