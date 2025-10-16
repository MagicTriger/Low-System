/**
 * Worker任务辅助函数
 * 提供常用计算密集任务的便捷接口
 */

import { workerManager } from './WorkerManager'

/**
 * 初始化Worker池
 */
export function initializeWorkerPools(): void {
  // 注册数据处理Worker池
  workerManager.registerPool('dataProcessor', new URL('./workers/data-processor.worker.ts', import.meta.url).href, {
    size: Math.max(2, navigator.hardwareConcurrency - 2),
    timeout: 30000,
    maxQueueSize: 50,
  })
}

/**
 * 在Worker中排序数据
 */
export async function sortDataInWorker(data: any[], field: string, order: 'asc' | 'desc' = 'asc'): Promise<any[]> {
  return workerManager.execute('dataProcessor', 'sort', {
    data,
    field,
    order,
  })
}

/**
 * 在Worker中过滤数据
 */
export async function filterDataInWorker(data: any[], conditions: Array<{ field: string; operator: string; value: any }>): Promise<any[]> {
  return workerManager.execute('dataProcessor', 'filter', {
    data,
    conditions,
  })
}

/**
 * 在Worker中聚合数据
 */
export async function aggregateDataInWorker(
  data: any[],
  groupBy: string,
  aggregations: Array<{ field: string; function: 'sum' | 'avg' | 'count' | 'min' | 'max' }>
): Promise<any[]> {
  return workerManager.execute('dataProcessor', 'aggregate', {
    data,
    groupBy,
    aggregations,
  })
}

/**
 * 在Worker中转换数据
 */
export async function transformDataInWorker(
  data: any[],
  mappings: Array<{ source: string; target: string; transform?: string }>
): Promise<any[]> {
  return workerManager.execute('dataProcessor', 'transform', {
    data,
    mappings,
  })
}

/**
 * 判断是否应该使用Worker
 * 对于小数据集,使用Worker可能反而更慢
 */
export function shouldUseWorker(dataSize: number, threshold = 1000): boolean {
  return dataSize >= threshold
}

/**
 * 智能数据处理
 * 根据数据大小自动选择是否使用Worker
 */
export async function smartSort(data: any[], field: string, order: 'asc' | 'desc' = 'asc'): Promise<any[]> {
  if (shouldUseWorker(data.length)) {
    return sortDataInWorker(data, field, order)
  }

  // 主线程处理
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, field)
    const bVal = getNestedValue(b, field)
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

/**
 * 智能过滤
 */
export async function smartFilter(data: any[], conditions: Array<{ field: string; operator: string; value: any }>): Promise<any[]> {
  if (shouldUseWorker(data.length)) {
    return filterDataInWorker(data, conditions)
  }

  // 主线程处理
  return data.filter(item => {
    return conditions.every(condition => {
      const value = getNestedValue(item, condition.field)
      return evaluateCondition(value, condition.operator, condition.value)
    })
  })
}

/**
 * 获取嵌套值
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj)
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
