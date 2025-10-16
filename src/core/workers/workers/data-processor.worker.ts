/**
 * 数据处理Worker
 * 处理计算密集型数据操作
 */

import type { WorkerTask, WorkerResult } from '../WorkerManager'

// Worker消息处理
self.onmessage = async (event: MessageEvent<WorkerTask>) => {
  const task = event.data
  const result: WorkerResult = {
    taskId: task.id,
    success: false,
  }

  try {
    switch (task.type) {
      case 'sort':
        result.data = await sortData(task.data)
        break
      case 'filter':
        result.data = await filterData(task.data)
        break
      case 'aggregate':
        result.data = await aggregateData(task.data)
        break
      case 'transform':
        result.data = await transformData(task.data)
        break
      default:
        throw new Error(`Unknown task type: ${task.type}`)
    }

    result.success = true
  } catch (error) {
    result.error = error instanceof Error ? error.message : String(error)
  }

  self.postMessage(result)
}

/**
 * 排序数据
 */
async function sortData(params: { data: any[]; field: string; order: 'asc' | 'desc' }): Promise<any[]> {
  const { data, field, order } = params

  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, field)
    const bVal = getNestedValue(b, field)

    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 过滤数据
 */
async function filterData(params: { data: any[]; conditions: Array<{ field: string; operator: string; value: any }> }): Promise<any[]> {
  const { data, conditions } = params

  return data.filter(item => {
    return conditions.every(condition => {
      const value = getNestedValue(item, condition.field)
      return evaluateCondition(value, condition.operator, condition.value)
    })
  })
}

/**
 * 聚合数据
 */
async function aggregateData(params: {
  data: any[]
  groupBy: string
  aggregations: Array<{ field: string; function: 'sum' | 'avg' | 'count' | 'min' | 'max' }>
}): Promise<any[]> {
  const { data, groupBy, aggregations } = params

  // 分组
  const groups = new Map<any, any[]>()
  for (const item of data) {
    const key = getNestedValue(item, groupBy)
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(item)
  }

  // 聚合
  const results: any[] = []
  for (const [key, items] of groups.entries()) {
    const result: any = { [groupBy]: key }

    for (const agg of aggregations) {
      const values = items.map(item => getNestedValue(item, agg.field))
      result[`${agg.function}_${agg.field}`] = calculateAggregation(values, agg.function)
    }

    results.push(result)
  }

  return results
}

/**
 * 转换数据
 */
async function transformData(params: {
  data: any[]
  mappings: Array<{ source: string; target: string; transform?: string }>
}): Promise<any[]> {
  const { data, mappings } = params

  return data.map(item => {
    const result: any = {}

    for (const mapping of mappings) {
      let value = getNestedValue(item, mapping.source)

      if (mapping.transform) {
        value = applyTransform(value, mapping.transform)
      }

      setNestedValue(result, mapping.target, value)
    }

    return result
  })
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

/**
 * 设置嵌套值
 */
function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.')
  const lastKey = keys.pop()!
  const target = keys.reduce((current, key) => {
    if (!current[key]) current[key] = {}
    return current[key]
  }, obj)
  target[lastKey] = value
}

/**
 * 评估条件
 */
function evaluateCondition(value: any, operator: string, compareValue: any): boolean {
  switch (operator) {
    case '==':
    case 'eq':
      return value == compareValue
    case '===':
      return value === compareValue
    case '!=':
    case 'ne':
      return value != compareValue
    case '>':
    case 'gt':
      return value > compareValue
    case '>=':
    case 'gte':
      return value >= compareValue
    case '<':
    case 'lt':
      return value < compareValue
    case '<=':
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
 * 计算聚合
 */
function calculateAggregation(values: any[], func: string): any {
  const numbers = values.filter(v => typeof v === 'number')

  switch (func) {
    case 'sum':
      return numbers.reduce((sum, v) => sum + v, 0)
    case 'avg':
      return numbers.length > 0 ? numbers.reduce((sum, v) => sum + v, 0) / numbers.length : 0
    case 'count':
      return values.length
    case 'min':
      return numbers.length > 0 ? Math.min(...numbers) : undefined
    case 'max':
      return numbers.length > 0 ? Math.max(...numbers) : undefined
    default:
      return undefined
  }
}

/**
 * 应用转换
 */
function applyTransform(value: any, transform: string): any {
  switch (transform) {
    case 'uppercase':
      return String(value).toUpperCase()
    case 'lowercase':
      return String(value).toLowerCase()
    case 'trim':
      return String(value).trim()
    case 'number':
      return Number(value)
    case 'string':
      return String(value)
    case 'boolean':
      return Boolean(value)
    default:
      return value
  }
}

export {}
