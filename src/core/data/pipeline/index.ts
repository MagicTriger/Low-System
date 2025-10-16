/**
 * 数据流转换管道模块
 * 提供链式数据处理和转换能力
 */

// 导出接口
export type {
  IPipeline,
  IPipelineProcessor,
  IPipelineBuilder,
  IPipelineFactory,
  PipelineConfig,
  PipelineContext,
  PipelineResult,
  PipelineStepResult,
} from './IPipeline'

export { ErrorStrategy, PipelineError, PipelineTimeoutError, ProcessorValidationError } from './IPipeline'

// 导出实现
export { Pipeline } from './Pipeline'
export { PipelineBuilder } from './PipelineBuilder'
export { PipelineFactory } from './PipelineFactory'

// 导出内置处理器
export {
  SortProcessor,
  GroupByProcessor,
  AggregateProcessor,
  UniqueProcessor,
  PaginateProcessor,
  FlattenProcessor,
  TransformProcessor,
  ValidateProcessor,
  LogProcessor,
  DelayProcessor,
  CacheProcessor,
} from './processors'
