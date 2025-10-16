/**
 * 管道工厂实现
 * 负责创建和管理管道实例
 */

import type { IPipeline, IPipelineBuilder, IPipelineFactory, IPipelineProcessor, PipelineConfig } from './IPipeline'
import { Pipeline } from './Pipeline'
import { PipelineBuilder } from './PipelineBuilder'

export class PipelineFactory implements IPipelineFactory {
  private registeredProcessors = new Map<string, IPipelineProcessor>()

  create<TInput = any, TOutput = any>(config: PipelineConfig): IPipeline<TInput, TOutput> {
    return new Pipeline<TInput, TOutput>(config)
  }

  createBuilder<TInput = any>(): IPipelineBuilder<TInput> {
    return new PipelineBuilder<TInput>()
  }

  registerProcessor(name: string, processor: IPipelineProcessor): void {
    if (this.registeredProcessors.has(name)) {
      console.warn(`[PipelineFactory] Processor ${name} is already registered, overwriting`)
    }
    this.registeredProcessors.set(name, processor)
  }

  getRegisteredProcessor(name: string): IPipelineProcessor | undefined {
    return this.registeredProcessors.get(name)
  }

  getAllRegisteredProcessors(): Record<string, IPipelineProcessor> {
    const result: Record<string, IPipelineProcessor> = {}
    this.registeredProcessors.forEach((processor, name) => {
      result[name] = processor
    })
    return result
  }
}
