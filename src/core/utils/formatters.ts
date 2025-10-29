/**
 * Component 层数据格式化工具
 *
 * 职责：
 * - 提供展示相关的数据格式化
 * - 日期、时间格式化
 * - 数字、货币格式化
 * - 文本格式化和截断
 *
 * 使用场景：
 * - 在组件模板中格式化显示数据
 * - 准备数据用于 UI 展示
 *
 * 注意：
 * - 仅用于展示格式化，不改变数据结构
 * - 不包含业务逻辑
 * - 应该是纯函数，无副作用
 */

/**
 * 日期格式化选项
 */
export interface DateFormatOptions {
  /**
   * 格式模板
   * - 'YYYY-MM-DD': 2024-01-01
   * - 'YYYY-MM-DD HH:mm:ss': 2024-01-01 10:30:00
   * - 'MM/DD/YYYY': 01/01/2024
   * - 'relative': 相对时间（如：2小时前）
   */
  format?: string

  /**
   * 时区
   */
  timezone?: string

  /**
   * 语言
   */
  locale?: string
}

/**
 * 数字格式化选项
 */
export interface NumberFormatOptions {
  /**
   * 小数位数
   */
  decimals?: number

  /**
   * 千分位分隔符
   */
  thousandsSeparator?: string

  /**
   * 小数点符号
   */
  decimalSeparator?: string

  /**
   * 前缀
   */
  prefix?: string

  /**
   * 后缀
   */
  suffix?: string
}

/**
 * 货币格式化选项
 */
export interface CurrencyFormatOptions {
  /**
   * 货币代码（如：CNY, USD）
   */
  currency?: string

  /**
   * 货币符号（如：¥, $）
   */
  symbol?: string

  /**
   * 小数位数
   */
  decimals?: number

  /**
   * 语言
   */
  locale?: string
}

/**
 * 文本格式化选项
 */
export interface TextFormatOptions {
  /**
   * 最大长度
   */
  maxLength?: number

  /**
   * 省略符号
   */
  ellipsis?: string

  /**
   * 大小写转换
   */
  case?: 'upper' | 'lower' | 'capitalize' | 'title'
}

/**
 * 数据格式化工具集
 */
export const Formatters = {
  /**
   * 日期格式化
   *
   * @param date 日期对象或字符串
   * @param options 格式化选项
   * @returns 格式化后的日期字符串
   *
   * @example
   * ```typescript
   * Formatters.formatDate(new Date(), { format: 'YYYY-MM-DD' })
   * // => '2024-01-01'
   *
   * Formatters.formatDate(new Date(), { format: 'relative' })
   * // => '2小时前'
   * ```
   */
  formatDate(date: Date | string | number | null | undefined, options: DateFormatOptions = {}): string {
    if (!date) return ''

    const dateObj = date instanceof Date ? date : new Date(date)

    if (isNaN(dateObj.getTime())) return ''

    const { format = 'YYYY-MM-DD HH:mm:ss', locale = 'zh-CN' } = options

    // 相对时间格式
    if (format === 'relative') {
      return this.formatRelativeTime(dateObj, locale)
    }

    // 自定义格式
    return this.formatDateWithPattern(dateObj, format)
  },

  /**
   * 格式化相对时间
   */
  formatRelativeTime(date: Date, locale: string = 'zh-CN'): string {
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    const isChinese = locale.startsWith('zh')

    if (seconds < 60) {
      return isChinese ? '刚刚' : 'just now'
    } else if (minutes < 60) {
      return isChinese ? `${minutes}分钟前` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`
    } else if (hours < 24) {
      return isChinese ? `${hours}小时前` : `${hours} hour${hours > 1 ? 's' : ''} ago`
    } else if (days < 30) {
      return isChinese ? `${days}天前` : `${days} day${days > 1 ? 's' : ''} ago`
    } else if (months < 12) {
      return isChinese ? `${months}个月前` : `${months} month${months > 1 ? 's' : ''} ago`
    } else {
      return isChinese ? `${years}年前` : `${years} year${years > 1 ? 's' : ''} ago`
    }
  },

  /**
   * 使用模式格式化日期
   */
  formatDateWithPattern(date: Date, pattern: string): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()
    const hours = date.getHours()
    const minutes = date.getMinutes()
    const seconds = date.getSeconds()

    const pad = (n: number, length: number = 2) => String(n).padStart(length, '0')

    return pattern
      .replace('YYYY', String(year))
      .replace('YY', String(year).slice(-2))
      .replace('MM', pad(month))
      .replace('M', String(month))
      .replace('DD', pad(day))
      .replace('D', String(day))
      .replace('HH', pad(hours))
      .replace('H', String(hours))
      .replace('mm', pad(minutes))
      .replace('m', String(minutes))
      .replace('ss', pad(seconds))
      .replace('s', String(seconds))
  },

  /**
   * 数字格式化
   *
   * @param num 数字
   * @param options 格式化选项
   * @returns 格式化后的数字字符串
   *
   * @example
   * ```typescript
   * Formatters.formatNumber(1234567.89, { decimals: 2, thousandsSeparator: ',' })
   * // => '1,234,567.89'
   *
   * Formatters.formatNumber(0.1234, { decimals: 2, suffix: '%' })
   * // => '0.12%'
   * ```
   */
  formatNumber(num: number | null | undefined, options: NumberFormatOptions = {}): string {
    if (num === null || num === undefined || isNaN(num)) return ''

    const { decimals = 0, thousandsSeparator = ',', decimalSeparator = '.', prefix = '', suffix = '' } = options

    // 处理小数位
    const fixed = num.toFixed(decimals)
    const [intPart, decPart] = fixed.split('.')

    // 添加千分位分隔符
    const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)

    // 组合结果
    let result = formattedInt
    if (decPart) {
      result += decimalSeparator + decPart
    }

    return prefix + result + suffix
  },

  /**
   * 货币格式化
   *
   * @param amount 金额
   * @param options 格式化选项
   * @returns 格式化后的货币字符串
   *
   * @example
   * ```typescript
   * Formatters.formatCurrency(1234.56, { currency: 'CNY' })
   * // => '¥1,234.56'
   *
   * Formatters.formatCurrency(1234.56, { currency: 'USD', locale: 'en-US' })
   * // => '$1,234.56'
   * ```
   */
  formatCurrency(amount: number | null | undefined, options: CurrencyFormatOptions = {}): string {
    if (amount === null || amount === undefined || isNaN(amount)) return ''

    const { currency = 'CNY', symbol, decimals = 2, locale = 'zh-CN' } = options

    // 使用 Intl.NumberFormat 进行格式化
    try {
      const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })

      let result = formatter.format(amount)

      // 如果指定了自定义符号，替换默认符号
      if (symbol) {
        const currencySymbols: Record<string, string> = {
          CNY: '¥',
          USD: '$',
          EUR: '€',
          GBP: '£',
          JPY: '¥',
        }
        const defaultSymbol = currencySymbols[currency] || currency
        result = result.replace(defaultSymbol, symbol)
      }

      return result
    } catch {
      // 降级处理
      const symbolMap: Record<string, string> = {
        CNY: '¥',
        USD: '$',
        EUR: '€',
        GBP: '£',
        JPY: '¥',
      }
      const currencySymbol = symbol || symbolMap[currency] || currency
      return this.formatNumber(amount, {
        decimals,
        thousandsSeparator: ',',
        prefix: currencySymbol,
      })
    }
  },

  /**
   * 百分比格式化
   *
   * @param value 数值（0-1 或 0-100）
   * @param decimals 小数位数
   * @param isDecimal 是否为小数形式（0-1）
   * @returns 格式化后的百分比字符串
   *
   * @example
   * ```typescript
   * Formatters.formatPercent(0.1234, 2, true)
   * // => '12.34%'
   *
   * Formatters.formatPercent(12.34, 2, false)
   * // => '12.34%'
   * ```
   */
  formatPercent(value: number | null | undefined, decimals: number = 2, isDecimal: boolean = true): string {
    if (value === null || value === undefined || isNaN(value)) return ''

    const percent = isDecimal ? value * 100 : value
    return this.formatNumber(percent, { decimals, suffix: '%' })
  },

  /**
   * 文件大小格式化
   *
   * @param bytes 字节数
   * @param decimals 小数位数
   * @returns 格式化后的文件大小字符串
   *
   * @example
   * ```typescript
   * Formatters.formatFileSize(1024)
   * // => '1.00 KB'
   *
   * Formatters.formatFileSize(1048576)
   * // => '1.00 MB'
   * ```
   */
  formatFileSize(bytes: number | null | undefined, decimals: number = 2): string {
    if (bytes === null || bytes === undefined || isNaN(bytes)) return ''

    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return this.formatNumber(bytes / Math.pow(k, i), { decimals }) + ' ' + sizes[i]
  },

  /**
   * 文本格式化
   *
   * @param text 文本
   * @param options 格式化选项
   * @returns 格式化后的文本
   *
   * @example
   * ```typescript
   * Formatters.formatText('Hello World', { case: 'upper' })
   * // => 'HELLO WORLD'
   *
   * Formatters.formatText('This is a long text', { maxLength: 10 })
   * // => 'This is a...'
   * ```
   */
  formatText(text: string | null | undefined, options: TextFormatOptions = {}): string {
    if (!text) return ''

    let result = text
    const { maxLength, ellipsis = '...', case: textCase } = options

    // 截断文本
    if (maxLength && result.length > maxLength) {
      result = result.slice(0, maxLength) + ellipsis
    }

    // 大小写转换
    if (textCase) {
      switch (textCase) {
        case 'upper':
          result = result.toUpperCase()
          break
        case 'lower':
          result = result.toLowerCase()
          break
        case 'capitalize':
          result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase()
          break
        case 'title':
          result = result.replace(/\b\w/g, char => char.toUpperCase())
          break
      }
    }

    return result
  },

  /**
   * 电话号码格式化
   *
   * @param phone 电话号码
   * @param format 格式（如：'xxx-xxxx-xxxx'）
   * @returns 格式化后的电话号码
   *
   * @example
   * ```typescript
   * Formatters.formatPhone('13812345678')
   * // => '138-1234-5678'
   * ```
   */
  formatPhone(phone: string | null | undefined, format: string = 'xxx-xxxx-xxxx'): string {
    if (!phone) return ''

    const digits = phone.replace(/\D/g, '')

    if (digits.length === 11) {
      return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
    }

    return phone
  },

  /**
   * 身份证号格式化（脱敏）
   *
   * @param idCard 身份证号
   * @param maskLength 脱敏长度
   * @returns 格式化后的身份证号
   *
   * @example
   * ```typescript
   * Formatters.formatIdCard('110101199001011234')
   * // => '110101********1234'
   * ```
   */
  formatIdCard(idCard: string | null | undefined, maskLength: number = 8): string {
    if (!idCard) return ''

    if (idCard.length < maskLength + 4) return idCard

    const start = idCard.slice(0, 6)
    const end = idCard.slice(-4)
    const mask = '*'.repeat(maskLength)

    return start + mask + end
  },

  /**
   * 银行卡号格式化（脱敏）
   *
   * @param cardNumber 银行卡号
   * @returns 格式化后的银行卡号
   *
   * @example
   * ```typescript
   * Formatters.formatBankCard('6222021234567890123')
   * // => '6222 **** **** 0123'
   * ```
   */
  formatBankCard(cardNumber: string | null | undefined): string {
    if (!cardNumber) return ''

    const digits = cardNumber.replace(/\D/g, '')

    if (digits.length < 16) return cardNumber

    const start = digits.slice(0, 4)
    const end = digits.slice(-4)

    return `${start} **** **** ${end}`
  },

  /**
   * 地址格式化（脱敏）
   *
   * @param address 地址
   * @param keepLength 保留长度
   * @returns 格式化后的地址
   *
   * @example
   * ```typescript
   * Formatters.formatAddress('北京市朝阳区某某街道123号')
   * // => '北京市朝阳区某某街道***'
   * ```
   */
  formatAddress(address: string | null | undefined, keepLength: number = 10): string {
    if (!address) return ''

    if (address.length <= keepLength) return address

    return address.slice(0, keepLength) + '***'
  },

  /**
   * 布尔值格式化
   *
   * @param value 布尔值
   * @param labels 标签映射
   * @returns 格式化后的文本
   *
   * @example
   * ```typescript
   * Formatters.formatBoolean(true)
   * // => '是'
   *
   * Formatters.formatBoolean(false, { true: 'Active', false: 'Inactive' })
   * // => 'Inactive'
   * ```
   */
  formatBoolean(value: boolean | null | undefined, labels: { true: string; false: string } = { true: '是', false: '否' }): string {
    if (value === null || value === undefined) return ''
    return value ? labels.true : labels.false
  },

  /**
   * 枚举值格式化
   *
   * @param value 枚举值
   * @param enumMap 枚举映射
   * @returns 格式化后的文本
   *
   * @example
   * ```typescript
   * const statusMap = { 1: '启用', 0: '禁用' }
   * Formatters.formatEnum(1, statusMap)
   * // => '启用'
   * ```
   */
  formatEnum(value: any, enumMap: Record<string | number, string>): string {
    if (value === null || value === undefined) return ''
    return enumMap[value] || String(value)
  },
}

/**
 * 创建格式化器工厂
 *
 * @example
 * ```typescript
 * const dateFormatter = createFormatter('date', { format: 'YYYY-MM-DD' })
 * const formatted = dateFormatter(new Date())
 * ```
 */
export function createFormatter(type: 'date' | 'number' | 'currency' | 'percent' | 'text', options: any = {}) {
  return (value: any) => {
    switch (type) {
      case 'date':
        return Formatters.formatDate(value, options)
      case 'number':
        return Formatters.formatNumber(value, options)
      case 'currency':
        return Formatters.formatCurrency(value, options)
      case 'percent':
        return Formatters.formatPercent(value, options.decimals, options.isDecimal)
      case 'text':
        return Formatters.formatText(value, options)
      default:
        return String(value)
    }
  }
}

/**
 * 导出默认格式化器实例
 */
export default Formatters
