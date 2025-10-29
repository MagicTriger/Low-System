/**
 * API 层数据转换器
 *
 * 职责：
 * - 将后端响应数据转换为前端标准格式
 * - 处理字段重命名和类型映射
 * - 处理日期格式转换
 * - 处理枚举值映射
 *
 * 使用场景：
 * - 在 API 模块中接收后端响应后立即使用
 * - 确保前端代码使用统一的数据格式
 *
 * 注意：
 * - 不应包含业务逻辑相关的数据转换
 * - 不应包含计算字段或数据聚合
 * - 仅负责格式转换和类型映射
 */

/**
 * 字段映射配置
 */
export interface FieldMapping {
  /**
   * 源字段名（后端字段）
   */
  from: string

  /**
   * 目标字段名（前端字段）
   */
  to: string

  /**
   * 类型转换函数
   */
  transform?: (value: any) => any
}

/**
 * 转换配置
 */
export interface TransformConfig {
  /**
   * 字段映射列表
   */
  fieldMappings?: FieldMapping[]

  /**
   * 日期字段列表
   */
  dateFields?: string[]

  /**
   * 枚举映射
   */
  enumMappings?: Record<string, Record<string, any>>

  /**
   * 是否保留未映射的字段
   */
  keepUnmapped?: boolean
}

/**
 * API 层数据转换器
 */
export class ApiTransformer {
  /**
   * 将后端响应转换为前端标准格式
   *
   * @param backendData 后端数据
   * @param config 转换配置
   * @returns 转换后的前端数据
   *
   * @example
   * ```typescript
   * const backendData = {
   *   user_name: 'John',
   *   created_time: '2024-01-01 10:00:00',
   *   user_status: 1
   * }
   *
   * const frontendData = ApiTransformer.transformResponse(backendData, {
   *   fieldMappings: [
   *     { from: 'user_name', to: 'username' },
   *     { from: 'created_time', to: 'createdAt' },
   *     { from: 'user_status', to: 'status' }
   *   ],
   *   dateFields: ['createdAt'],
   *   enumMappings: {
   *     status: { 1: 'active', 0: 'inactive' }
   *   }
   * })
   *
   * // Result: { username: 'John', createdAt: Date, status: 'active' }
   * ```
   */
  static transformResponse<T = any>(backendData: any, config: TransformConfig = {}): T {
    if (backendData === null || backendData === undefined) {
      return backendData
    }

    // 处理数组
    if (Array.isArray(backendData)) {
      return backendData.map(item => this.transformResponse(item, config)) as any
    }

    // 处理对象
    if (typeof backendData === 'object') {
      return this.transformObject(backendData, config)
    }

    // 基本类型直接返回
    return backendData
  }

  /**
   * 将前端数据转换为后端格式
   *
   * @param frontendData 前端数据
   * @param config 转换配置
   * @returns 转换后的后端数据
   *
   * @example
   * ```typescript
   * const frontendData = {
   *   username: 'John',
   *   createdAt: new Date(),
   *   status: 'active'
   * }
   *
   * const backendData = ApiTransformer.transformRequest(frontendData, {
   *   fieldMappings: [
   *     { from: 'username', to: 'user_name' },
   *     { from: 'createdAt', to: 'created_time' },
   *     { from: 'status', to: 'user_status' }
   *   ],
   *   dateFields: ['created_time'],
   *   enumMappings: {
   *     user_status: { 'active': 1, 'inactive': 0 }
   *   }
   * })
   *
   * // Result: { user_name: 'John', created_time: '2024-01-01 10:00:00', user_status: 1 }
   * ```
   */
  static transformRequest(frontendData: any, config: TransformConfig = {}): any {
    if (frontendData === null || frontendData === undefined) {
      return frontendData
    }

    // 处理数组
    if (Array.isArray(frontendData)) {
      return frontendData.map(item => this.transformRequest(item, config))
    }

    // 处理对象
    if (typeof frontendData === 'object') {
      // 反转字段映射
      const reversedConfig: TransformConfig = {
        ...config,
        fieldMappings: config.fieldMappings?.map(m => ({
          from: m.to,
          to: m.from,
          transform: m.transform,
        })),
      }

      return this.transformObject(frontendData, reversedConfig)
    }

    // 基本类型直接返回
    return frontendData
  }

  /**
   * 转换对象
   */
  private static transformObject<T = any>(obj: any, config: TransformConfig): T {
    const result: any = {}
    const { fieldMappings = [], dateFields = [], enumMappings = {}, keepUnmapped = true } = config

    // 创建字段映射表
    const mappingMap = new Map<string, FieldMapping>()
    fieldMappings.forEach(mapping => {
      mappingMap.set(mapping.from, mapping)
    })

    // 处理所有字段
    Object.keys(obj).forEach(key => {
      let value = obj[key]
      let targetKey = key

      // 应用字段映射
      const mapping = mappingMap.get(key)
      if (mapping) {
        targetKey = mapping.to

        // 应用自定义转换
        if (mapping.transform) {
          value = mapping.transform(value)
        }
      } else if (!keepUnmapped) {
        // 不保留未映射的字段
        return
      }

      // 处理日期字段
      if (dateFields.includes(targetKey)) {
        value = this.parseDate(value)
      }

      // 处理枚举映射
      if (enumMappings[targetKey]) {
        const enumMap = enumMappings[targetKey]
        value = enumMap[value] !== undefined ? enumMap[value] : value
      }

      // 递归处理嵌套对象
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        value = this.transformObject(value, config)
      }

      // 递归处理数组
      if (Array.isArray(value)) {
        value = value.map(item => {
          if (item && typeof item === 'object') {
            return this.transformObject(item, config)
          }
          return item
        })
      }

      result[targetKey] = value
    })

    return result
  }

  /**
   * 解析日期字符串
   */
  private static parseDate(value: any): Date | null {
    if (!value) return null

    if (value instanceof Date) return value

    if (typeof value === 'string') {
      // 尝试解析常见的日期格式
      const date = new Date(value)
      return isNaN(date.getTime()) ? null : date
    }

    if (typeof value === 'number') {
      // 时间戳
      return new Date(value)
    }

    return null
  }

  /**
   * 批量转换响应数据
   *
   * @param dataList 数据列表
   * @param config 转换配置
   * @returns 转换后的数据列表
   */
  static transformResponseList<T = any>(dataList: any[], config: TransformConfig = {}): T[] {
    return dataList.map(item => this.transformResponse<T>(item, config))
  }

  /**
   * 转换分页响应
   *
   * @param response 分页响应
   * @param config 转换配置
   * @returns 转换后的分页响应
   */
  static transformPaginatedResponse<T = any>(
    response: { list: any[]; total: number; page?: number; pageSize?: number },
    config: TransformConfig = {}
  ): { list: T[]; total: number; page?: number; pageSize?: number } {
    return {
      ...response,
      list: this.transformResponseList<T>(response.list, config),
    }
  }

  /**
   * 创建预配置的转换器
   *
   * @param config 转换配置
   * @returns 转换器函数
   *
   * @example
   * ```typescript
   * const userTransformer = ApiTransformer.createTransformer({
   *   fieldMappings: [
   *     { from: 'user_name', to: 'username' },
   *     { from: 'created_time', to: 'createdAt' }
   *   ],
   *   dateFields: ['createdAt']
   * })
   *
   * const user = userTransformer(backendUserData)
   * ```
   */
  static createTransformer<T = any>(config: TransformConfig) {
    return (data: any): T => this.transformResponse<T>(data, config)
  }
}

/**
 * 常用的字段映射预设
 */
export const CommonFieldMappings = {
  /**
   * 下划线转驼峰
   */
  snakeToCamel: (obj: any): any => {
    const result: any = {}
    Object.keys(obj).forEach(key => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = obj[key]
    })
    return result
  },

  /**
   * 驼峰转下划线
   */
  camelToSnake: (obj: any): any => {
    const result: any = {}
    Object.keys(obj).forEach(key => {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = obj[key]
    })
    return result
  },
}
