/**
 * 管道构建器实现
 * 提供流式API构建数据处理管道
 */

import type { IPipeline, IPipelineBuilder, IPipelineProcessor, PipelineConfig, PipelineContext } from './IPipeline'
import { Pipeline } from './Pipeline'

// 内置处理器

class MapProcessor<TInput, TOutput> implements IPipelineProcessor<TInput, TOutput> {
  constructor(
    public readonly name: string,
    private mapper: (input: TInput) => TOutput | Promise<TOutput>
  ) {}

  async process(input: TInput, context: PipelineContext): Promise<TOutput> {
    return await this.mapper(input)
  }
}

class FilterProcessor<T> implements IPipelineProcessor<T, T> {
  constructor(
    public readonly name: string,
    private predicate: (input: T) => boolean
  ) {}

  process(input: T, context: PipelineContext): T {
    if (Array.isArray(input)) {
      return input.filter(this.predicate) as any
    }
    return input
  }
}

class ConditionalProcessor<TInput, TOutput> implements IPipelineProcessor<TInput, TOutput> {
  constructor(
    public readonly name: string,
    private condition: (input: TInput) => boolean,
    private thenProcessor: IPipelineProcessor<TInput, TOutput>,
    private elseProcessor?: IPipelineProcessor<TInput, TOutput>
  ) {}

  async process(input: TInput, context: PipelineContext): Promise<TOutput> {
    if (this.condition(input)) {
      return await this.thenProcessor.process(input, context)
    } else if (this.elseProcessor) {
      return await this.elseProcessor.process(input, context)
    }
    return input as any
  }
}

class ParallelProcessor<TInput, TOutput> implements IPipelineProcessor<TInput, TOutput> {
  constructor(
    public readonly name: string,
    private processors: IPipelineProcessor<TInput, any>[],
    private combiner: (results: any[]) => TOutput
  ) {}

  async process(input: TInput, context: PipelineContext): Promise<TOutput> {
    const results = await Promise.all(this.processors.map(p => p.process(input, context)))
    return this.combiner(results)
  }
}

// 管道构建器实现

export class PipelineBuilder<TInput = any> implements IPipelineBuilder<TInput> {
  private processors: IPipelineProcessor[] = []
  private processorCounter = 0

  pipe<TOutput = any>(processor: IPipelineProcessor<TInput, TOutput>): IPipelineBuilder<TOutput> {
    this.processors.push(processor)
    return this as any
  }

  map<TOutput = any>(mapper: (input: TInput) => TOutput | Promise<TOutput>, name?: string): IPipelineBuilder<TOutput> {
    const processorName = name || `map-${this.processorCounter++}`
    const processor = new MapProcessor(processorName, mapper)
    return this.pipe(processor)
  }

  filter(predicate: (input: TInput) => boolean, name?: string): IPipelineBuilder<TInput> {
    const processorName = name || `filter-${this.processorCounter++}`
    const processor = new FilterProcessor(processorName, predicate)
    return this.pipe(processor)
  }

  when<TOutput = any>(
    condition: (input: TInput) => boolean,
    thenProcessor: IPipelineProcessor<TInput, TOutput>,
    elseProcessor?: IPipelineProcessor<TInput, TOutput>
  ): IPipelineBuilder<TOutput> {
    const processorName = `conditional-${this.processorCounter++}`
    const processor = new ConditionalProcessor(processorName, condition, thenProcessor, elseProcessor)
    return this.pipe(processor)
  }

  parallel<TOutput = any>(processors: IPipelineProcessor<TInput, any>[], combiner: (results: any[]) => TOutput): IPipelineBuilder<TOutput> {
    const processorName = `parallel-${this.processorCounter++}`
    const processor = new ParallelProcessor(processorName, processors, combiner)
    return this.pipe(processor)
  }

  build(config: PipelineConfig): IPipeline<any, TInput> {
    const pipeline = new Pipeline(config)
    this.processors.forEach(p => pipeline.addProcessor(p))
    return pipeline
  }
}
