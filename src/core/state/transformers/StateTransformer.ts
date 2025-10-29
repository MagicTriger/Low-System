/**
 * State 层数据转换器
 *
 * 职责：
 * - 处理业务逻辑相关的数据转换
 * - 计算派生字段
 * - 数据关联和聚合
 * - 业务规则应用
 *
 * 使用场景：
 * - 在 State 模块中接收 API 数据后使用
 * - 准备数据供组件使用前进行业务逻辑处理
 *
 * 注意：
 * - 应该在 API 层转换之后使用
 * - 包含业务逻辑和计算逻辑
 * - 不应包含展示相关的格式化
 */

/**
 * 计算字段配置
 */
export interface ComputedField {
  /**
   * 字段名
   */
  name: string

  /**
   * 计算函数
   */
  compute: (data: any, context?: any) => any

  /**
   * 依赖字段
   */
  dependencies?: string[]
}

/**
 * 关联配置
 */
export interface RelationConfig {
  /**
   * 关联字段名
   */
  field: string

  /**
   * 关联数据源
   */
  source: any[] | (() => any[])

  /**
   * 关联键（本地）
   */
  localKey: string

  /**
   * 关联键（外部）
   */
  foreignKey: string

  /**
   * 关联类型
   */
  type: 'one' | 'many'
}

/**
 * 聚合配置
 */
export interface AggregationConfig {
  /**
   * 分组字段
   */
  groupBy?: string | string[]

  /**
   * 聚合函数
   */
  aggregations: {
    [field: string]: 'sum' | 'avg' | 'count' | 'min' | 'max' | 'first' | 'last' | ((values: any[]) => any)
  }
}

/**
 * State 转换配置
 */
export interface StateTransformConfig {
  /**
   * 计算字段
   */
  computedFields?: ComputedField[]

  /**
   * 关联配置
   */
  relations?: RelationConfig[]

  /**
   * 过滤函数
   */
  filter?: (item: any, context?: any) => boolean

  /**
   * 排序配置
   */
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }

  /**
   * 业务规则
   */
  businessRules?: Array<(data: any, context?: any) => any>
}

/**
 * State 层数据转换器
 */
export class StateTransformer {
  /**
   * 转换数据用于 State 层
   *
   * @param apiData API 层数据
   * @param config 转换配置
   * @param context 上下文数据
   * @returns 转换后的 State 数据
   *
   * @example
   * ```typescript
   * const apiData = [
   *   { id: 1, username: 'John', orderCount: 5, totalAmount: 1000 },
   *   { id: 2, username: 'Jane', orderCount: 3, totalAmount: 600 }
   * ]
   *
   * const stateData = StateTransformer.transformForState(apiData, {
   *   computedFields: [
   *     {
   *       name: 'avgOrderAmount',
   *       compute: (data) => data.totalAmount / data.orderCount,
   *       dependencies: ['totalAmount', 'orderCount']
   *     },
   *     {
   *       name: 'isVip',
   *       compute: (data) => data.totalAmount > 800
   *     }
   *   ],
   *   filter: (item) => item.orderCount > 0,
   *   sort: { field: 'totalAmount', order: 'desc' }
   * })
   *
   * // Result: [
   * //   { id: 1, username: 'John', orderCount: 5, totalAmount: 1000, avgOrderAmount: 200, isVip: true },
   * //   { id: 2, username: 'Jane', orderCount: 3, totalAmount: 600, avgOrderAmount: 200, isVip: false }
   * // ]
   * ```
   */
  static transformForState<T = any>(apiData: any, config: StateTransformConfig = {}, context?: any): T {
    if (apiData === null || apiData === undefined) {
      return apiData
    }

    // 处理数组
    if (Array.isArray(apiData)) {
      return this.transformList(apiData, config, context) as any
    }

    // 处理单个对象
    return this.transformItem(apiData, config, context)
  }

  /**
   * 转换列表数据
   */
  private static transformList<T = any>(list: any[], config: StateTransformConfig, context?: any): T[] {
    let result = list.map(item => this.transformItem(item, config, context))

    // 应用过滤
    if (config.filter) {
      result = result.filter(item => config.filter!(item, context))
    }

    // 应用排序
    if (config.sort) {
      result = this.sortData(result, config.sort)
    }

    return result
  }

  /**
   * 转换单个数据项
   */
  private static transformItem<T = any>(item: any, config: StateTransformConfig, context?: any): T {
    let result = { ...item }

    // 添加计算字段
    if (config.computedFields) {
      config.computedFields.forEach(field => {
        result[field.name] = field.compute(result, context)
      })
    }

    // 应用关联
    if (config.relations) {
      config.relations.forEach(relation => {
        result[relation.field] = this.applyRelation(result, relation)
      })
    }

    // 应用业务规则
    if (config.businessRules) {
      config.businessRules.forEach(rule => {
        result = rule(result, context) || result
      })
    }

    return result
  }

  /**
   * 应用数据关联
   */
  private static applyRelation(item: any, relation: RelationConfig): any {
    const source = typeof relation.source === 'function' ? relation.source() : relation.source
    const localValue = this.getNestedValue(item, relation.localKey)

    if (relation.type === 'one') {
      return source.find(s => this.getNestedValue(s, relation.foreignKey) === localValue) || null
    } else {
      return source.filter(s => this.getNestedValue(s, relation.foreignKey) === localValue)
    }
  }

  /**
   * 数据聚合
   *
   * @param data 数据列表
   * @param config 聚合配置
   * @returns 聚合结果
   *
   * @example
   * ```typescript
   * const data = [
   *   { category: 'A', amount: 100, count: 5 },
   *   { category: 'A', amount: 200, count: 3 },
   *   { category: 'B', amount: 150, count: 4 }
   * ]
   *
   * const result = StateTransformer.aggregate(data, {
   *   groupBy: 'category',
   *   aggregations: {
   *     totalAmount: 'sum',
   *     avgAmount: 'avg',
   *     totalCount: 'count'
   *   }
   * })
   *
   * // Result: [
   * //   { category: 'A', totalAmount: 300, avgAmount: 150, totalCount: 2 },
   * //   { category: 'B', totalAmount: 150, avgAmount: 150, totalCount: 1 }
   * // ]
   * ```
   */
  static aggregate(data: any[], config: AggregationConfig): any[] {
    if (!config.groupBy) {
      // 全局聚合
      const result: any = {}
      Object.entries(config.aggregations).forEach(([field, func]) => {
        const sourceField = field.replace(/^(total|avg|min|max)/, '').toLowerCase()
        result[field] = this.applyAggregation(data, sourceField || field, func)
      })
      return [result]
    }

    // 分组聚合
    const groups = this.groupData(data, config.groupBy)

    return Object.entries(groups).map(([groupKey, groupData]) => {
      const result: any = {}

      // 添加分组键
      if (typeof config.groupBy === 'string') {
        result[config.groupBy] = groupKey
      } else {
        const keys = groupKey.split('|')
        config.groupBy.forEach((field, index) => {
          result[field] = keys[index]
        })
      }

      // 计算聚合值
      Object.entries(config.aggregations).forEach(([field, func]) => {
        const sourceField = field.replace(/^(total|avg|min|max|count)/, '').toLowerCase()
        result[field] = this.applyAggregation(groupData as any[], sourceField || field, func)
      })

      return result
    })
  }

  /**
   * 应用聚合函数
   */
  private static applyAggregation(data: any[], field: string, func: string | Function): any {
    if (typeof func === 'function') {
      const values = data.map(item => this.getNestedValue(item, field))
      return func(values)
    }

    const values = data
      .map(item => this.getNestedValue(item, field))
      .filter(v => v != null && !isNaN(Number(v)))
      .map(Number)

    switch (func) {
      case 'sum':
        return values.reduce((sum, val) => sum + val, 0)
      case 'avg':
        return values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0
      case 'count':
        return data.length
      case 'min':
        return values.length > 0 ? Math.min(...values) : null
      case 'max':
        return values.length > 0 ? Math.max(...values) : null
      case 'first':
        return data.length > 0 ? this.getNestedValue(data[0], field) : null
      case 'last':
        return data.length > 0 ? this.getNestedValue(data[data.length - 1], field) : null
      default:
        return null
    }
  }

  /**
   * 数据分组
   */
  private static groupData(data: any[], groupBy: string | string[]): Record<string, any[]> {
    const fields = Array.isArray(groupBy) ? groupBy : [groupBy]

    return data.reduce(
      (groups, item) => {
        const key = fields.map(field => String(this.getNestedValue(item, field))).join('|')
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(item)
        return groups
      },
      {} as Record<string, any[]>
    )
  }

  /**
   * 数据排序
   */
  private static sortData<T = any>(data: T[], sort: { field: string; order: 'asc' | 'desc' }): T[] {
    return [...data].sort((a, b) => {
      const aVal = this.getNestedValue(a, sort.field)
      const bVal = this.getNestedValue(b, sort.field)

      if (aVal < bVal) return sort.order === 'asc' ? -1 : 1
      if (aVal > bVal) return sort.order === 'asc' ? 1 : -1
      return 0
    })
  }

  /**
   * 获取嵌套属性值
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null
    }, obj)
  }

  /**
   * 创建预配置的转换器
   *
   * @param config 转换配置
   * @returns 转换器函数
   *
   * @example
   * ```typescript
   * const userStateTransformer = StateTransformer.createTransformer({
   *   computedFields: [
   *     { name: 'fullName', compute: (data) => `${data.firstName} ${data.lastName}` }
   *   ]
   * })
   *
   * const users = userStateTransformer(apiUsers)
   * ```
   */
  static createTransformer<T = any>(config: StateTransformConfig) {
    return (data: any, context?: any): T => this.transformForState<T>(data, config, context)
  }

  /**
   * 合并多个数据源
   *
   * @param sources 数据源列表
   * @param mergeKey 合并键
   * @returns 合并后的数据
   *
   * @example
   * ```typescript
   * const users = [{ id: 1, name: 'John' }, { id: 2, name: 'Jane' }]
   * const orders = [{ userId: 1, total: 100 }, { userId: 2, total: 200 }]
   *
   * const merged = StateTransformer.mergeSources([
   *   { data: users, key: 'id' },
   *   { data: orders, key: 'userId', as: 'orders', type: 'many' }
   * ], 'id')
   *
   * // Result: [
   * //   { id: 1, name: 'John', orders: [{ userId: 1, total: 100 }] },
   * //   { id: 2, name: 'Jane', orders: [{ userId: 2, total: 200 }] }
   * // ]
   * ```
   */
  static mergeSources(
    sources: Array<{
      data: any[]
      key: string
      as?: string
      type?: 'one' | 'many'
    }>,
    mergeKey: string
  ): any[] {
    if (sources.length === 0) return []

    const [primary, ...others] = sources
    const result = [...primary.data]

    others.forEach(source => {
      const fieldName = source.as || source.key
      const isMany = source.type === 'many'

      result.forEach(item => {
        const keyValue = this.getNestedValue(item, mergeKey)

        if (isMany) {
          item[fieldName] = source.data.filter(s => this.getNestedValue(s, source.key) === keyValue)
        } else {
          item[fieldName] = source.data.find(s => this.getNestedValue(s, source.key) === keyValue) || null
        }
      })
    })

    return result
  }
}

/**
 * 常用的业务规则
 */
export const CommonBusinessRules = {
  /**
   * 添加状态标签
   */
  addStatusLabel: (statusMap: Record<string, string>) => (data: any) => {
    if (data.status !== undefined) {
      data.statusLabel = statusMap[data.status] || data.status
    }
    return data
  },

  /**
   * 计算年龄
   */
  calculateAge:
    (birthdateField: string = 'birthdate') =>
    (data: any) => {
      const birthdate = data[birthdateField]
      if (birthdate) {
        const today = new Date()
        const birth = new Date(birthdate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--
        }
        data.age = age
      }
      return data
    },

  /**
   * 标记过期项
   */
  markExpired:
    (expiryField: string = 'expiryDate') =>
    (data: any) => {
      const expiry = data[expiryField]
      if (expiry) {
        data.isExpired = new Date(expiry) < new Date()
      }
      return data
    },
}
