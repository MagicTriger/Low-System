/**
 * 扩展验证规则
 * 提供更多实用的验证规则
 */

import type { ValidationRule } from './index'

// 扩展的验证规则接口
export interface ExtendedValidationRule {
  name: string
  message: string
  validator: (value: any, context?: any) => boolean | Promise<boolean>
}

/**
 * 中文姓名验证
 */
export const chineseName: ExtendedValidationRule = {
  name: 'chineseName',
  message: '请输入有效的中文姓名',
  validator: (value: string) => {
    if (!value) return true
    const pattern = /^[\u4e00-\u9fa5]{2,10}$/
    return pattern.test(value)
  }
}

/**
 * 手机号验证
 */
export const phone: ExtendedValidationRule = {
  name: 'phone',
  message: '请输入有效的手机号码',
  validator: (value: string) => {
    if (!value) return false
    return /^1[3-9]\d{9}$/.test(value)
  }
}

/**
 * 身份证号验证
 */
export const idCard: ExtendedValidationRule = {
  name: 'idCard',
  message: '请输入有效的身份证号码',
  validator: (value: string) => {
    if (!value) return true
    
    // 18位身份证号码验证
    const pattern = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/
    
    if (!pattern.test(value)) {
      return false
    }
    
    // 校验码验证
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(value[i]) * weights[i]
    }
    
    const checkCode = checkCodes[sum % 11]
    return value[17].toUpperCase() === checkCode
  }
}

/**
 * 银行卡号验证
 */
export const bankCard: ExtendedValidationRule = {
  name: 'bankCard',
  message: '请输入有效的银行卡号',
  validator: (value: string) => {
    if (!value) return true
    
    // 移除空格
    const cardNumber = value.replace(/\s/g, '')
    
    // 长度检查
    if (cardNumber.length < 16 || cardNumber.length > 19) {
      return false
    }
    
    // 数字检查
    if (!/^\d+$/.test(cardNumber)) {
      return false
    }
    
    // Luhn算法验证
    let sum = 0
    let isEven = false
    
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber[i])
      
      if (isEven) {
        digit *= 2
        if (digit > 9) {
          digit -= 9
        }
      }
      
      sum += digit
      isEven = !isEven
    }
    
    return sum % 10 === 0
  }
}

/**
 * 邮政编码验证
 */
export const zipCode: ExtendedValidationRule = {
  name: 'zipCode',
  message: '请输入有效的邮政编码',
  validator: (value: string) => {
    if (!value) return true
    const pattern = /^\d{6}$/
    return pattern.test(value)
  }
}

/**
 * IP地址验证
 */
export const ipAddress: ExtendedValidationRule = {
  name: 'ipAddress',
  message: '请输入有效的IP地址',
  validator: (value: string) => {
    if (!value) return true
    const pattern = /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    return pattern.test(value)
  }
}

/**
 * MAC地址验证
 */
export const macAddress: ExtendedValidationRule = {
  name: 'macAddress',
  message: '请输入有效的MAC地址',
  validator: (value: string) => {
    if (!value) return true
    const pattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/
    return pattern.test(value)
  }
}

/**
 * 车牌号验证
 */
export const licensePlate: ExtendedValidationRule = {
  name: 'licensePlate',
  message: '请输入有效的车牌号',
  validator: (value: string) => {
    if (!value) return true
    // 普通车牌
    const normalPattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{4}[A-Z0-9挂学警港澳]$/
    // 新能源车牌
    const newEnergyPattern = /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-Z0-9]{5}$/
    
    return normalPattern.test(value) || newEnergyPattern.test(value)
  }
}

/**
 * 统一社会信用代码验证
 */
export const socialCreditCode: ExtendedValidationRule = {
  name: 'socialCreditCode',
  message: '请输入有效的统一社会信用代码',
  validator: (value: string) => {
    if (!value) return true
    
    const pattern = /^[0-9A-HJ-NPQRTUWXY]{2}\d{6}[0-9A-HJ-NPQRTUWXY]{10}$/
    if (!pattern.test(value)) {
      return false
    }
    
    // 校验码验证
    const weights = [1, 3, 9, 27, 19, 26, 16, 17, 20, 29, 25, 13, 8, 24, 10, 30, 28]
    const codes = '0123456789ABCDEFGHJKLMNPQRTUWXY'
    
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += codes.indexOf(value[i]) * weights[i]
    }
    
    const checkCode = codes[31 - (sum % 31)]
    return value[17] === checkCode
  }
}

/**
 * 密码强度验证
 */
export const strongPassword: ExtendedValidationRule = {
  name: 'strongPassword',
  message: '密码必须包含大小写字母、数字和特殊字符，长度至少8位',
  validator: (value: string) => {
    if (!value) return true
    
    // 至少8位
    if (value.length < 8) return false
    
    // 包含大写字母
    if (!/[A-Z]/.test(value)) return false
    
    // 包含小写字母
    if (!/[a-z]/.test(value)) return false
    
    // 包含数字
    if (!/\d/.test(value)) return false
    
    // 包含特殊字符
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value)) return false
    
    return true
  }
}

/**
 * 中等密码强度验证
 */
export const mediumPassword: ExtendedValidationRule = {
  name: 'mediumPassword',
  message: '密码必须包含字母和数字，长度至少6位',
  validator: (value: string) => {
    if (!value) return true
    
    // 至少6位
    if (value.length < 6) return false
    
    // 包含字母
    if (!/[a-zA-Z]/.test(value)) return false
    
    // 包含数字
    if (!/\d/.test(value)) return false
    
    return true
  }
}

/**
 * 年龄验证
 */
export const age = (min: number = 0, max: number = 150): ExtendedValidationRule => ({
  name: 'age',
  message: `年龄必须在${min}-${max}岁之间`,
  validator: (value: number) => {
    if (value === null || value === undefined) return true
    const numValue = Number(value)
    return !isNaN(numValue) && numValue >= min && numValue <= max
  }
})

/**
 * 日期范围验证
 */
export const dateRange = (startDate?: Date, endDate?: Date): ExtendedValidationRule => ({
  name: 'dateRange',
  message: '日期超出允许范围',
  validator: (value: string | Date) => {
    if (!value) return true
    
    const date = value instanceof Date ? value : new Date(value)
    if (isNaN(date.getTime())) return false
    
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    
    return true
  }
})

/**
 * 文件大小验证
 */
export const fileSize = (maxSize: number, unit: 'B' | 'KB' | 'MB' | 'GB' = 'MB'): ExtendedValidationRule => {
  const multipliers = { B: 1, KB: 1024, MB: 1024 * 1024, GB: 1024 * 1024 * 1024 }
  const maxBytes = maxSize * multipliers[unit]
  
  return {
    name: 'fileSize',
    message: `文件大小不能超过${maxSize}${unit}`,
    validator: (value: File | FileList) => {
      if (!value) return true
      
      if (value instanceof FileList) {
        for (let i = 0; i < value.length; i++) {
          if (value[i].size > maxBytes) return false
        }
        return true
      }
      
      return value.size <= maxBytes
    }
  }
}

/**
 * 文件类型验证
 */
export const fileType = (allowedTypes: string[]): ExtendedValidationRule => ({
  name: 'fileType',
  message: `只允许上传${allowedTypes.join('、')}格式的文件`,
  validator: (value: File | FileList) => {
    if (!value) return true
    
    const checkType = (file: File): boolean => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      return Boolean(extension && allowedTypes.includes(extension))
    }
    
    if (value instanceof FileList) {
      for (let i = 0; i < value.length; i++) {
        if (!checkType(value[i])) {
          return false
        }
      }
      return true
    } else {
      return checkType(value)
    }
  }
})

/**
 * 数组长度验证
 */
export const arrayLength = (min?: number, max?: number): ExtendedValidationRule => ({
  name: 'arrayLength',
  message: `数组长度必须在${min || 0}-${max || '∞'}之间`,
  validator: (value: any[]) => {
    if (!Array.isArray(value)) return false
    
    if (min !== undefined && value.length < min) return false
    if (max !== undefined && value.length > max) return false
    
    return true
  }
})

/**
 * 对象属性验证
 */
export const hasProperty = (property: string): ExtendedValidationRule => ({
  name: 'hasProperty',
  message: `对象必须包含属性: ${property}`,
  validator: (value: any) => {
    if (!value || typeof value !== 'object') return false
    return property in value
  }
})

/**
 * 自定义正则验证
 */
export const customPattern = (pattern: RegExp, message: string): ExtendedValidationRule => ({
  name: 'customPattern',
  message,
  validator: (value: string) => {
    if (!value) return true
    return pattern.test(value)
  }
})

/**
 * 异步验证规则工厂
 */
export const asyncRule = (
  name: string,
  message: string,
  asyncValidator: (value: any) => Promise<boolean>
): ExtendedValidationRule => ({
  name,
  message,
  validator: asyncValidator
})

/**
 * 条件验证规则
 */
export const conditionalRule = (
  condition: (value: any, context?: any) => boolean,
  rule: ExtendedValidationRule
): ExtendedValidationRule => ({
  name: `conditional_${rule.name}`,
  message: rule.message,
  validator: (value: any, context?: any) => {
    if (!condition(value, context)) return true
    return rule.validator?.(value, context) ?? false
  }
})

/**
 * 组合验证规则
 */
export const combineRules = (
  operator: 'AND' | 'OR',
  rules: ExtendedValidationRule[],
  message?: string
): ExtendedValidationRule => ({
  name: `combined_${operator.toLowerCase()}`,
  message: message || `组合验证失败`,
  validator: (value: any, context?: any) => {
    if (operator === 'AND') {
      return rules.every(rule => rule.validator?.(value, context) ?? false)
    } else {
      return rules.some(rule => rule.validator?.(value, context) ?? false)
    }
  }
})

/**
 * 常用验证规则预设
 */
export const presetRules = {
  // 基础规则
  required: { name: 'required', message: '此字段为必填项', validator: (value: any) => value !== null && value !== undefined && value !== '' },
  
  // 字符串规则
  chineseName,
  phone,
  idCard,
  bankCard,
  zipCode,
  licensePlate,
  socialCreditCode,
  strongPassword,
  mediumPassword,
  
  // 网络规则
  ipAddress,
  macAddress,
  
  // 工厂函数
  age,
  dateRange,
  fileSize,
  fileType,
  arrayLength,
  hasProperty,
  customPattern,
  asyncRule,
  conditionalRule,
  combineRules
}