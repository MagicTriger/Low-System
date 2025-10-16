/**
 * 内置管道处理器
 * 提供常用的数据转换处理器
 */

import type { IPipelineProcessor, PipelineContext } from '../IPipeline'

// 排序处理器
export class SortProcessor<T> implements IPipelineProcessor<T[], T[]> {
  readonly name = 'sort'

  constructor(
    private compareFn?: (a: T, b: T) => number,
    private key?: keyof T
  ) {}

  process(input: T[], context: PipelineContext): T[] {
    if (!Array.isArray(input)) {
      return input
    }

    const copy = [...input]

    if (this.compareFn) {
      return copy.sort(this.compareFn)
    }

    if (this.key) {
      return copy.sort((a, b) => {
        const aVal = a[this.key!]
        const bVal = b[this.key!]
        if (aVal < bVal) return -1
        if (aVal > bVal) return 1
        return 0
      })
    }

    return copy.sort()
  }
}

// 分组处理器
export class GroupByProcessor<T> implements IPipelineProcessor<T[], Record<string, T[]>> {
  readonly name = 'groupBy'

  constructor(private keyFn: (item: T) => string) {}

  process(input: T[], context: PipelineContext): Record<string, T[]> {
    if (!Array.isArray(input)) {
      return {} as Record<string, T[]>
    }

    return input.reduce(
      (groups, item) => {
        const key = this.keyFn(item)
        if (!groups[key]) {
          groups[key] = []
        }
        groups[key].push(item)
        return groups
      },
      {} as Record<string, T[]>
    )
  }
}

// 聚合处理器
export class AggregateProcessor<T, R> implements IPipelineProcessor<T[], R> {
  readonly name = 'aggregate'

  constructor(
    private aggregateFn: (accumulator: R, current: T, index: number) => R,
    private initialValue: R
  ) {}

  process(input: T[], context: PipelineContext): R {
    if (!Array.isArray(input)) {
      return this.initialValue
    }

    return input.reduce(this.aggregateFn, this.initialValue)
  }
}

// 去重处理器
export class UniqueProcessor<T> implements IPipelineProcessor<T[], T[]> {
  readonly name = 'unique'

  constructor(private keyFn?: (item: T) => any) {}

  process(input: T[], context: PipelineContext): T[] {
    if (!Array.isArray(input)) {
      return input
    }

    if (this.keyFn) {
      const seen = new Set()
      return input.filter(item => {
        const key = this.keyFn!(item)
        if (seen.has(key)) {
          return false
        }
        seen.add(key)
        return true
      })
    }

    return [...new Set(input)]
  }
}

// 分页处理器
export class PaginateProcessor<T> implements IPipelineProcessor<T[], T[]> {
  readonly name = 'paginate'

  constructor(
    private page: number,
    private pageSize: number
  ) {}

  process(input: T[], context: PipelineContext): T[] {
    if (!Array.isArray(input)) {
      return input
    }

    const start = (this.page - 1) * this.pageSize
    const end = start + this.pageSize
    return input.slice(start, end)
  }
}

// 扁平化处理器
export class FlattenProcessor<T> implements IPipelineProcessor<T[][], T[]> {
  readonly name = 'flatten'

  constructor(private depth: number = 1) {}

  process(input: T[][], context: PipelineContext): T[] {
    if (!Array.isArray(input)) {
      return input as any
    }

    return this.flattenArray(input, this.depth)
  }

  private flattenArray(arr: any[], depth: number): any[] {
    if (depth === 0) {
      return arr
    }

    return arr.reduce((flat, item) => {
      if (Array.isArray(item)) {
        return flat.concat(this.flattenArray(item, depth - 1))
      }
      return flat.concat(item)
    }, [])
  }
}

// 转换处理器
export class TransformProcessor<TInput, TOutput> implements IPipelineProcessor<TInput, TOutput> {
  readonly name = 'transform'

  constructor(private transformFn: (input: TInput) => TOutput | Promise<TOutput>) {}

  async process(input: TInput, context: PipelineContext): Promise<TOutput> {
    return await this.transformFn(input)
  }
}

// 验证处理器
export class ValidateProcessor<T> implements IPipelineProcessor<T, T> {
  readonly name = 'validate'

  constructor(
    private validationFn: (input: T) => boolean,
    private errorMessage?: string
  ) {}

  process(input: T, context: PipelineContext): T {
    if (!this.validationFn(input)) {
      throw new Error(this.errorMessage || 'Validation failed')
    }
    return input
  }

  validate(input: T): boolean {
    return this.validationFn(input)
  }
}

// 日志处理器
export class LogProcessor<T> implements IPipelineProcessor<T, T> {
  readonly name = 'log'

  constructor(
    private label?: string,
    private logFn: (data: T, label?: string) => void = console.log
  ) {}

  process(input: T, context: PipelineContext): T {
    this.logFn(input, this.label)
    return input
  }
}

// 延迟处理器
export class DelayProcessor<T> implements IPipelineProcessor<T, T> {
  readonly name = 'delay'

  constructor(private delayMs: number) {}

  async process(input: T, context: PipelineContext): Promise<T> {
    await new Promise(resolve => setTimeout(resolve, this.delayMs))
    return input
  }
}

// 缓存处理器
export class CacheProcessor<T> implements IPipelineProcessor<T, T> {
  readonly name = 'cache'
  private cache = new Map<string, { data: T; expires: number }>()

  constructor(
    private keyFn: (input: T) => string,
    private ttl: number = 60000
  ) {}

  process(input: T, context: PipelineContext): T {
    const key = this.keyFn(input)
    const cached = this.cache.get(key)

    if (cached && Date.now() < cached.expires) {
      return cached.data
    }

    this.cache.set(key, {
      data: input,
      expires: Date.now() + this.ttl,
    })

    return input
  }
}
