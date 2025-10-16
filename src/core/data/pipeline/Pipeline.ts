/**
 * 数据流转换管道实现
 * 提供链式数据处理和转换能力
 */

import type { IPipeline, IPipelineProcessor, PipelineConfig, PipelineContext, PipelineResult, PipelineStepResult } from './IPipeline'
import { ErrorStrategy, PipelineError, PipelineTimeoutError, ProcessorValidationError } from './IPipeline'

export class Pipeline<TInput = any, TOutput = any> implements IPipeline<TInput, TOutput> {
  private _processors: IPipelineProcessor[] = []
  private cache = new Map<string, any>()

  constructor(public readonly config: PipelineConfig) {}

  get processors(): IPipelineProcessor[] {
    return [...this._processors]
  }

  addProcessor<T = any, R = any>(processor: IPipelineProcessor<T, R>): IPipeline<TInput, R> {
    this._processors.push(processor)
    return this as any
  }

  insertProcessor<T = any, R = any>(index: number, processor: IPipelineProcessor<T, R>): IPipeline<TInput, TOutput> {
    this._processors.splice(index, 0, processor)
    return this
  }

  removeProcessor(name: string): IPipeline<TInput, TOutput> {
    const index = this._processors.findIndex(p => p.name === name)
    if (index !== -1) {
      this._processors.splice(index, 1)
    }
    return this
  }

  getProcessor(name: string): IPipelineProcessor | undefined {
    return this._processors.find(p => p.name === name)
  }

  async execute(input: TInput, metadata: Record<string, any> = {}): Promise<PipelineResult<TOutput>> {
    const executionId = this.generateExecutionId()
    const startTime = new Date()
    const context: PipelineContext = {
      pipelineId: this.config.id,
      executionId,
      startTime,
      currentStep: 0,
      totalSteps: this._processors.length,
      metadata,
      intermediateResults: [],
    }

    const steps: PipelineStepResult[] = []
    let currentData: any = input
    let success = true
    let error: Error | undefined

    try {
      // 检查缓存
      if (this.config.enableCache) {
        const cacheKey = this.getCacheKey(input, metadata)
        const cached = this.cache.get(cacheKey)
        if (cached) {
          return this.createSuccessResult(executionId, cached, startTime, steps, context)
        }
      }

      // 设置超时
      const timeoutPromise = this.config.timeout ? this.createTimeoutPromise(this.config.timeout, executionId) : null

      // 执行管道
      const executionPromise = this.executeProcessors(currentData, context, steps)

      if (timeoutPromise) {
        currentData = await Promise.race([executionPromise, timeoutPromise])
      } else {
        currentData = await executionPromise
      }

      // 缓存结果
      if (this.config.enableCache) {
        const cacheKey = this.getCacheKey(input, metadata)
        this.cache.set(cacheKey, currentData)

        // 设置缓存过期
        if (this.config.cacheTTL) {
          setTimeout(() => {
            this.cache.delete(cacheKey)
          }, this.config.cacheTTL)
        }
      }
    } catch (err) {
      success = false
      error = err as Error
    }

    const duration = Date.now() - startTime.getTime()

    return {
      executionId,
      result: currentData,
      duration,
      success,
      error,
      steps,
      context,
    }
  }

  clone(): IPipeline<TInput, TOutput> {
    const cloned = new Pipeline<TInput, TOutput>(this.config)
    this._processors.forEach(p => cloned.addProcessor(p))
    return cloned
  }

  clear(): IPipeline<TInput, TOutput> {
    this._processors = []
    this.cache.clear()
    return this
  }

  // 私有方法

  private async executeProcessors(input: any, context: PipelineContext, steps: PipelineStepResult[]): Promise<any> {
    let currentData = input

    for (let i = 0; i < this._processors.length; i++) {
      const processor = this._processors[i]
      context.currentStep = i + 1

      const stepStartTime = Date.now()
      let stepSuccess = true
      let stepError: Error | undefined

      try {
        // 验证输入
        if (processor.validate && !processor.validate(currentData)) {
          throw new ProcessorValidationError(this.config.id, processor.name, currentData)
        }

        // 执行处理器
        currentData = await processor.process(currentData, context)
        context.intermediateResults.push(currentData)
      } catch (err) {
        stepSuccess = false
        stepError = err as Error

        // 根据错误策略处理
        const shouldContinue = await this.handleProcessorError(err as Error, processor, i, context)

        if (!shouldContinue) {
          throw new PipelineError(
            `Pipeline execution failed at step ${i + 1}: ${processor.name}`,
            this.config.id,
            i,
            processor.name,
            err as Error
          )
        }
      }

      // 记录步骤结果
      steps.push({
        stepIndex: i,
        processorName: processor.name,
        input: i === 0 ? input : context.intermediateResults[i - 1],
        output: currentData,
        duration: Date.now() - stepStartTime,
        success: stepSuccess,
        error: stepError,
      })
    }

    return currentData
  }

  private async handleProcessorError(
    error: Error,
    processor: IPipelineProcessor,
    stepIndex: number,
    context: PipelineContext
  ): Promise<boolean> {
    const strategy = this.config.errorStrategy || ErrorStrategy.Stop

    switch (strategy) {
      case ErrorStrategy.Stop:
        return false

      case ErrorStrategy.Skip:
        console.warn(`[Pipeline] Skipping processor ${processor.name} due to error:`, error)
        return true

      case ErrorStrategy.UseDefault:
        console.warn(`[Pipeline] Using default value for processor ${processor.name} due to error:`, error)
        // 使用上一步的结果作为默认值
        return true

      case ErrorStrategy.Retry:
        // 简单重试一次
        try {
          const prevData = stepIndex === 0 ? context.intermediateResults[0] : context.intermediateResults[stepIndex - 1]
          await processor.process(prevData, context)
          return true
        } catch {
          return false
        }

      default:
        return false
    }
  }

  private createTimeoutPromise(timeout: number, executionId: string): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new PipelineTimeoutError(this.config.id, timeout))
      }, timeout)
    })
  }

  private createSuccessResult(
    executionId: string,
    result: any,
    startTime: Date,
    steps: PipelineStepResult[],
    context: PipelineContext
  ): PipelineResult<TOutput> {
    return {
      executionId,
      result,
      duration: Date.now() - startTime.getTime(),
      success: true,
      steps,
      context,
    }
  }

  private getCacheKey(input: any, metadata: Record<string, any>): string {
    return `${this.config.id}-${JSON.stringify(input)}-${JSON.stringify(metadata)}`
  }

  private generateExecutionId(): string {
    return `${this.config.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }
}
