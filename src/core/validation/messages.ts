/**
 * 验证消息管理系统
 * 支持国际化和自定义错误消息
 */

/**
 * 消息模板类型
 */
export type MessageTemplate = string | ((params?: any) => string)

/**
 * 语言包接口
 */
export interface LanguagePack {
  [ruleName: string]: MessageTemplate
}

/**
 * 默认中文消息
 */
export const zhCN: LanguagePack = {
  required: '此字段为必填项',
  minLength: (params: { min: number }) => `最少输入${params.min}个字符`,
  maxLength: (params: { max: number }) => `最多输入${params.max}个字符`,
  pattern: '格式不正确',
  email: '请输入有效的邮箱地址',
  url: '请输入有效的网址',
  number: '请输入有效的数字',
  integer: '请输入整数',
  min: (params: { min: number }) => `数值不能小于${params.min}`,
  max: (params: { max: number }) => `数值不能大于${params.max}`,
  range: (params: { min: number; max: number }) => `数值必须在${params.min}-${params.max}之间`,
  
  // 扩展规则消息
  chineseName: '请输入有效的中文姓名',
  phone: '请输入有效的手机号码',
  idCard: '请输入有效的身份证号码',
  bankCard: '请输入有效的银行卡号',
  zipCode: '请输入有效的邮政编码',
  ipAddress: '请输入有效的IP地址',
  macAddress: '请输入有效的MAC地址',
  licensePlate: '请输入有效的车牌号',
  socialCreditCode: '请输入有效的统一社会信用代码',
  strongPassword: '密码必须包含大小写字母、数字和特殊字符，长度至少8位',
  mediumPassword: '密码必须包含字母和数字，长度至少6位',
  age: (params: { min: number; max: number }) => `年龄必须在${params.min}-${params.max}岁之间`,
  dateRange: '日期超出允许范围',
  fileSize: (params: { size: number; unit: string }) => `文件大小不能超过${params.size}${params.unit}`,
  fileType: (params: { types: string[] }) => `只允许上传${params.types.join('、')}格式的文件`,
  arrayLength: (params: { min?: number; max?: number }) => `数组长度必须在${params.min || 0}-${params.max || '∞'}之间`,
  hasProperty: (params: { property: string }) => `对象必须包含属性: ${params.property}`,
  
  // 通用消息
  invalid: '输入无效',
  tooShort: '输入过短',
  tooLong: '输入过长',
  notMatch: '输入不匹配',
  duplicate: '输入重复',
  notFound: '未找到',
  forbidden: '禁止操作',
  timeout: '操作超时',
  networkError: '网络错误',
  serverError: '服务器错误',
  
  // 表单消息
  formInvalid: '表单验证失败',
  fieldRequired: '必填字段不能为空',
  fieldInvalid: '字段格式不正确',
  submitFailed: '提交失败',
  saveFailed: '保存失败',
  loadFailed: '加载失败'
}

/**
 * 英文消息
 */
export const enUS: LanguagePack = {
  required: 'This field is required',
  minLength: (params: { min: number }) => `Minimum ${params.min} characters required`,
  maxLength: (params: { max: number }) => `Maximum ${params.max} characters allowed`,
  pattern: 'Invalid format',
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  number: 'Please enter a valid number',
  integer: 'Please enter an integer',
  min: (params: { min: number }) => `Value must be at least ${params.min}`,
  max: (params: { max: number }) => `Value must be at most ${params.max}`,
  range: (params: { min: number; max: number }) => `Value must be between ${params.min} and ${params.max}`,
  
  // Extended rules
  chineseName: 'Please enter a valid Chinese name',
  phone: 'Please enter a valid phone number',
  idCard: 'Please enter a valid ID card number',
  bankCard: 'Please enter a valid bank card number',
  zipCode: 'Please enter a valid zip code',
  ipAddress: 'Please enter a valid IP address',
  macAddress: 'Please enter a valid MAC address',
  licensePlate: 'Please enter a valid license plate',
  socialCreditCode: 'Please enter a valid social credit code',
  strongPassword: 'Password must contain uppercase, lowercase, numbers and special characters, at least 8 characters',
  mediumPassword: 'Password must contain letters and numbers, at least 6 characters',
  age: (params: { min: number; max: number }) => `Age must be between ${params.min} and ${params.max}`,
  dateRange: 'Date is out of allowed range',
  fileSize: (params: { size: number; unit: string }) => `File size cannot exceed ${params.size}${params.unit}`,
  fileType: (params: { types: string[] }) => `Only ${params.types.join(', ')} files are allowed`,
  arrayLength: (params: { min?: number; max?: number }) => `Array length must be between ${params.min || 0} and ${params.max || '∞'}`,
  hasProperty: (params: { property: string }) => `Object must have property: ${params.property}`,
  
  // Common messages
  invalid: 'Invalid input',
  tooShort: 'Input too short',
  tooLong: 'Input too long',
  notMatch: 'Input does not match',
  duplicate: 'Duplicate input',
  notFound: 'Not found',
  forbidden: 'Operation forbidden',
  timeout: 'Operation timeout',
  networkError: 'Network error',
  serverError: 'Server error',
  
  // Form messages
  formInvalid: 'Form validation failed',
  fieldRequired: 'Required fields cannot be empty',
  fieldInvalid: 'Field format is incorrect',
  submitFailed: 'Submit failed',
  saveFailed: 'Save failed',
  loadFailed: 'Load failed'
}

/**
 * 消息管理器
 */
export class MessageManager {
  private currentLanguage: string = 'zh-CN'
  private languagePacks: Map<string, LanguagePack> = new Map()
  private customMessages: Map<string, string> = new Map()
  
  constructor() {
    // 注册默认语言包
    this.registerLanguage('zh-CN', zhCN)
    this.registerLanguage('en-US', enUS)
  }
  
  /**
   * 注册语言包
   */
  registerLanguage(language: string, pack: LanguagePack) {
    this.languagePacks.set(language, pack)
  }
  
  /**
   * 设置当前语言
   */
  setLanguage(language: string) {
    if (this.languagePacks.has(language)) {
      this.currentLanguage = language
    } else {
      console.warn(`Language pack '${language}' not found`)
    }
  }
  
  /**
   * 获取当前语言
   */
  getLanguage(): string {
    return this.currentLanguage
  }
  
  /**
   * 设置自定义消息
   */
  setCustomMessage(key: string, message: string) {
    this.customMessages.set(key, message)
  }
  
  /**
   * 批量设置自定义消息
   */
  setCustomMessages(messages: Record<string, string>) {
    Object.entries(messages).forEach(([key, message]) => {
      this.customMessages.set(key, message)
    })
  }
  
  /**
   * 获取消息
   */
  getMessage(ruleName: string, params?: any): string {
    // 优先使用自定义消息
    const customKey = params ? `${ruleName}_${JSON.stringify(params)}` : ruleName
    if (this.customMessages.has(customKey)) {
      return this.customMessages.get(customKey)!
    }
    
    if (this.customMessages.has(ruleName)) {
      return this.customMessages.get(ruleName)!
    }
    
    // 使用语言包消息
    const languagePack = this.languagePacks.get(this.currentLanguage)
    if (!languagePack) {
      return `Validation failed for rule: ${ruleName}`
    }
    
    const template = languagePack[ruleName]
    if (!template) {
      return `Unknown validation rule: ${ruleName}`
    }
    
    if (typeof template === 'string') {
      return template
    }
    
    if (typeof template === 'function') {
      try {
        return template(params)
      } catch (error) {
        console.error(`Error generating message for rule '${ruleName}':`, error)
        return `Validation failed for rule: ${ruleName}`
      }
    }
    
    return `Invalid message template for rule: ${ruleName}`
  }
  
  /**
   * 检查是否有消息
   */
  hasMessage(ruleName: string): boolean {
    if (this.customMessages.has(ruleName)) {
      return true
    }
    
    const languagePack = this.languagePacks.get(this.currentLanguage)
    return languagePack ? ruleName in languagePack : false
  }
  
  /**
   * 获取所有可用的规则名称
   */
  getAvailableRules(): string[] {
    const languagePack = this.languagePacks.get(this.currentLanguage)
    const languageRules = languagePack ? Object.keys(languagePack) : []
    const customRules = Array.from(this.customMessages.keys())
    
    return [...new Set([...languageRules, ...customRules])]
  }
  
  /**
   * 清除自定义消息
   */
  clearCustomMessages() {
    this.customMessages.clear()
  }
  
  /**
   * 删除特定自定义消息
   */
  removeCustomMessage(key: string) {
    this.customMessages.delete(key)
  }
  
  /**
   * 获取语言包信息
   */
  getLanguagePackInfo() {
    return {
      current: this.currentLanguage,
      available: Array.from(this.languagePacks.keys()),
      customMessages: this.customMessages.size
    }
  }
}

/**
 * 全局消息管理器实例
 */
export const messageManager = new MessageManager()

/**
 * 便捷函数：获取消息
 */
export const getMessage = (ruleName: string, params?: any): string => {
  return messageManager.getMessage(ruleName, params)
}

/**
 * 便捷函数：设置语言
 */
export const setLanguage = (language: string) => {
  messageManager.setLanguage(language)
}

/**
 * 便捷函数：设置自定义消息
 */
export const setCustomMessage = (key: string, message: string) => {
  messageManager.setCustomMessage(key, message)
}

/**
 * 便捷函数：批量设置自定义消息
 */
export const setCustomMessages = (messages: Record<string, string>) => {
  messageManager.setCustomMessages(messages)
}

/**
 * 消息格式化工具
 */
export class MessageFormatter {
  /**
   * 格式化带参数的消息
   */
  static format(template: string, params: Record<string, any>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return params[key] !== undefined ? String(params[key]) : match
    })
  }
  
  /**
   * 创建参数化消息模板
   */
  static createTemplate(template: string): (params: Record<string, any>) => string {
    return (params: Record<string, any>) => this.format(template, params)
  }
  
  /**
   * 创建多语言消息
   */
  static createMultiLanguageMessage(messages: Record<string, string>) {
    return (language: string = 'zh-CN') => {
      return messages[language] || messages['zh-CN'] || messages[Object.keys(messages)[0]]
    }
  }
}

/**
 * 消息主题配置
 */
export interface MessageTheme {
  error: string
  warning: string
  success: string
  info: string
}

/**
 * 默认消息主题
 */
export const defaultTheme: MessageTheme = {
  error: '#ff4d4f',
  warning: '#faad14',
  success: '#52c41a',
  info: '#1890ff'
}

/**
 * 消息样式管理器
 */
export class MessageStyleManager {
  private theme: MessageTheme = defaultTheme
  
  setTheme(theme: Partial<MessageTheme>) {
    this.theme = { ...this.theme, ...theme }
  }
  
  getTheme(): MessageTheme {
    return { ...this.theme }
  }
  
  getColor(type: keyof MessageTheme): string {
    return this.theme[type]
  }
  
  createStyledMessage(message: string, type: keyof MessageTheme): string {
    return `<span style="color: ${this.getColor(type)}">${message}</span>`
  }
}

/**
 * 全局样式管理器实例
 */
export const messageStyleManager = new MessageStyleManager()