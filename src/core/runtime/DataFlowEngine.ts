import type { DataFlow, DataTransform, FilterConfig, MapConfig, SortConfig, AggregateConfig, DataErrorType } from '@/types'
import { DataError } from '@/types'

/**
 * 数据流引擎
 * 负责执行数据流转换
 */
export class DataFlowEngine {
  /**
   * 执行数据流
   */
  async execute(flow: DataFlow, sourceData: any): Promise<any> {
    try {
      let data = sourceData

      // 按顺序执行所有启用的转换步骤
      for (const transform of flow.transforms) {
        if (transform.enabled) {
          data = await this.executeTransform(transform, data)
        }
      }

      return data
    } catch (error) {
      throw new DataError('FLOW_EXECUTION_ERROR' as DataErrorType, `数据流执行失败: ${error}`, { flow, error })
    }
  }

  /**
   * 执行单个转换
   */
  private async executeTransform(transform: DataTransform, data: any): Promise<any> {
    try {
      switch (transform.type) {
        case 'filter':
          return this.filter(data, transform.config as FilterConfig)
        case 'map':
          return this.map(data, transform.config as MapConfig)
        case 'sort':
          return this.sort(data, transform.config as SortConfig)
        case 'aggregate':
          return this.aggregate(data, transform.config as AggregateConfig)
        default:
          return data
      }
    } catch (error) {
      throw new DataError('TRANSFORM_ERROR' as DataErrorType, `转换执行失败: ${error}`, { transform, error })
    }
  }

  /**
   * 过滤数据
   */
  private filter(data: any[], config: FilterConfig): any[] {
    if (!Array.isArray(data)) {
      return data
    }

    return data.filter(item => {
      const results = config.conditions.map(condition => {
        const value = this.getNestedValue(item, condition.field)
        return this.evaluateCondition(value, condition.operator, condition.value)
      })

      return config.logic === 'AND' ? results.every(r => r) : results.some(r => r)
    })
  }

  /**
   * 映射数据
   */
  private map(data: any[], config: MapConfig): any[] {
    if (!Array.isArray(data)) {
      return data
    }

    return data.map(item => {
      const mapped: any = {}
      config.mappings.forEach(mapping => {
        const value = this.getNestedValue(item, mapping.source)
        mapped[mapping.target] = mapping.transform ? this.applyTransform(value, mapping.transform) : value
      })
      return mapped
    })
  }

  /**
   * 排序数据
   */
  private sort(data: any[], config: SortConfig): any[] {
    if (!Array.isArray(data)) {
      return data
    }

    const sorted = [...data]
    sorted.sort((a, b) => {
      for (const field of config.fields) {
        const aValue = this.getNestedValue(a, field.field)
        const bValue = this.getNestedValue(b, field.field)

        let comparison = 0
        if (aValue < bValue) comparison = -1
        if (aValue > bValue) comparison = 1

        if (comparison !== 0) {
          return field.order === 'asc' ? comparison : -comparison
        }
      }
      return 0
    })

    return sorted
  }

  /**
   * 聚合数据
   */
  private aggregate(data: any[], config: AggregateConfig): any[] {
    if (!Array.isArray(data)) {
      return data
    }

    // 按分组字段分组
    const groups = new Map<string, any[]>()
    data.forEach(item => {
      const key = config.groupBy.map(field => this.getNestedValue(item, field)).join('|')
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key)!.push(item)
    })

    // 对每个分组执行聚合
    const result: any[] = []
    groups.forEach((items, key) => {
      const aggregated: any = {}

      // 添加分组字段
      config.groupBy.forEach((field, index) => {
        aggregated[field] = this.getNestedValue(items[0], field)
      })

      // 执行聚合函数
      config.aggregations.forEach(agg => {
        aggregated[agg.alias] = this.executeAggregation(items, agg.field, agg.function)
      })

      result.push(aggregated)
    })

    return result
  }

  /**
   * 执行聚合函数
   */
  private executeAggregation(items: any[], field: string, func: string): any {
    const values = items.map(item => this.getNestedValue(item, field)).filter(v => v !== undefined && v !== null)

    switch (func) {
      case 'count':
        return values.length
      case 'sum':
        return values.reduce((sum, v) => sum + Number(v), 0)
      case 'avg':
        return values.length > 0 ? values.reduce((sum, v) => sum + Number(v), 0) / values.length : 0
      case 'min':
        return values.length > 0 ? Math.min(...values.map(Number)) : undefined
      case 'max':
        return values.length > 0 ? Math.max(...values.map(Number)) : undefined
      default:
        return undefined
    }
  }

  /**
   * 评估条件
   */
  private evaluateCondition(value: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'eq':
        return value === compareValue
      case 'ne':
        return value !== compareValue
      case 'gt':
        return value > compareValue
      case 'gte':
        return value >= compareValue
      case 'lt':
        return value < compareValue
      case 'lte':
        return value <= compareValue
      case 'contains':
        return String(value).includes(String(compareValue))
      case 'startsWith':
        return String(value).startsWith(String(compareValue))
      case 'endsWith':
        return String(value).endsWith(String(compareValue))
      default:
        return false
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 应用转换表达式（简单实现）
   */
  private applyTransform(value: any, transform: string): any {
    // 简单的转换支持，可以扩展
    try {
      // 支持简单的JavaScript表达式
      const func = new Function('value', `return ${transform}`)
      return func(value)
    } catch {
      return value
    }
  }
}
