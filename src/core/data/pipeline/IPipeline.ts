/**
 * 数据管道接口定义
 */

/**
 * 管道处理器接口
 */
export interface IPipelineProcessor<TInput = any, TOutput = any> {
  /**
   * 处理器名称
   */
  name: string

  /**
   * 处理器描述
   */
  description?: string

  /**
   * 处理数据
   */
  process(input: TInput, context: PipelineContext): Promise<TOutput> | TOutput

  /**
   * 验证输入数据
   */
  validate?(input: TInput): boolean
}

/**
 * 管道配置
 */
export interface PipelineConfig {
  /**
   * 管道ID
   */
  id: string

  /**
   * 管道名称
   */
  name: string

  /**
   * 管道描述
   */
  description?: string

  /**
   * 是否启用缓存
   */
  enableCache?: boolean

  /**
   * 缓存TTL(毫秒)
   */
  cacheTTL?: number

  /**
   * 超时时间(毫秒)
   */
  timeout?: number

  /**
   * 错误策略
   */
  errorStrategy?: ErrorStrategy
}

/**
 * 管道上下文
 */
export interface PipelineContext {
  /**
   * 管道ID
   */
  pipelineId: string

  /**
   * 执行ID
   */
  executionId: string

  /**
   * 开始时间
   */
  startTime: Date

  /**
   * 当前步骤
   */
  currentStep: number

  /**
   * 总步骤数
   */
  totalSteps: number

  /**
   * 元数据
   */
  metadata: Record<string, any>

  /**
   * 中间结果
   */
  intermediateResults: any[]
}

/**
 * 管道执行结果
 */
export interface PipelineResult<T = any> {
  /**
   * 执行ID
   */
  executionId: string

  /**
   * 执行结果
   */
  result: T

  /**
   * 执行时长(毫秒)
   */
  duration: number

  /**
   * 是否成功
   */
  success: boolean

  /**
   * 错误信息
   */
  error?: Error

  /**
   * 步骤结果
   */
  steps: PipelineStepResult[]

  /**
   * 上下文
   */
  context: PipelineContext
}

/**
 * 管道步骤结果
 */
export interface PipelineStepResult {
  /**
   * 步骤索引
   */
  stepIndex: number

  /**
   * 处理器名称
   */
  processorName: string

  /**
   * 输入数据
   */
  input: any

  /**
   * 输出数据
   */
  output: any

  /**
   * 执行时长(毫秒)
   */
  duration: number

  /**
   * 是否成功
   */
  success: boolean

  /**
   * 错误信息
   */
  error?: Error
}

/**
 * 错误策略
 */
export enum ErrorStrategy {
  /**
   * 停止执行
   */
  Stop = 'stop',

  /**
   * 跳过当前步骤
   */
  Skip = 'skip',

  /**
   * 使用默认值
   */
  UseDefault = 'use_default',

  /**
   * 重试
   */
  Retry = 'retry',
}

/**
 * 管道构建器接口
 */
export interface IPipelineBuilder<TInput = any, TOutput = any> {
  /**
   * 添加处理器
   */
  addProcessor<T = any, R = any>(processor: IPipelineProcessor<T, R>): IPipelineBuilder<TInput, R>

  /**
   * 构建管道
   */
  build(): IPipeline<TInput, TOutput>
}

/**
 * 管道工厂接口
 */
export interface IPipelineFactory {
  /**
   * 创建管道
   */
  create<TInput = any, TOutput = any>(config: PipelineConfig): IPipeline<TInput, TOutput>

  /**
   * 创建构建器
   */
  createBuilder<TInput = any, TOutput = any>(config: PipelineConfig): IPipelineBuilder<TInput, TOutput>
}

/**
 * 管道接口
 */
export interface IPipeline<TInput = any, TOutput = any> {
  /**
   * 管道配置
   */
  readonly config: PipelineConfig

  /**
   * 处理器列表
   */
  readonly processors: IPipelineProcessor[]

  /**
   * 添加处理器
   */
  addProcessor<T = any, R = any>(processor: IPipelineProcessor<T, R>): IPipeline<TInput, R>

  /**
   * 插入处理器
   */
  insertProcessor<T = any, R = any>(index: number, processor: IPipelineProcessor<T, R>): IPipeline<TInput, TOutput>

  /**
   * 移除处理器
   */
  removeProcessor(name: string): IPipeline<TInput, TOutput>

  /**
   * 获取处理器
   */
  getProcessor(name: string): IPipelineProcessor | undefined

  /**
   * 执行管道
   */
  execute(input: TInput, metadata?: Record<string, any>): Promise<PipelineResult<TOutput>>

  /**
   * 克隆管道
   */
  clone(): IPipeline<TInput, TOutput>

  /**
   * 清空管道
   */
  clear(): IPipeline<TInput, TOutput>
}

/**
 * 管道错误
 */
export class PipelineError extends Error {
  constructor(
    message: string,
    public pipelineId: string,
    public stepIndex: number,
    public processorName: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'PipelineError'
  }
}

/**
 * 管道超时错误
 */
export class PipelineTimeoutError extends Error {
  constructor(
    public pipelineId: string,
    public timeout: number
  ) {
    super(`Pipeline execution timeout after ${timeout}ms`)
    this.name = 'PipelineTimeoutError'
  }
}

/**
 * 处理器验证错误
 */
export class ProcessorValidationError extends Error {
  constructor(
    public pipelineId: string,
    public processorName: string,
    public input: any
  ) {
    super(`Processor validation failed: ${processorName}`)
    this.name = 'ProcessorValidationError'
  }
}
