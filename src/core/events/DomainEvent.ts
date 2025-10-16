/**
 * 领域事件基类
 * 用于实现领域驱动设计(DDD)中的领域事件模式
 */

import type { IEventBus } from './types'

// 生成唯一ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 领域事件基类
 */
export abstract class DomainEvent {
  /** 事件唯一ID */
  readonly id: string

  /** 事件类型 */
  readonly type: string

  /** 事件时间戳 */
  readonly timestamp: number

  /** 事件版本 */
  readonly version: number

  /** 事件元数据 */
  readonly metadata: Record<string, any>

  constructor(type: string, version: number = 1, metadata: Record<string, any> = {}) {
    this.id = generateId()
    this.type = type
    this.timestamp = Date.now()
    this.version = version
    this.metadata = metadata
  }

  /**
   * 转换为JSON
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      type: this.type,
      timestamp: this.timestamp,
      version: this.version,
      metadata: this.metadata,
      ...this.getPayload(),
    }
  }

  /**
   * 获取事件负载(子类实现)
   */
  protected abstract getPayload(): Record<string, any>
}

/**
 * 领域事件发布器
 */
export class DomainEventPublisher {
  constructor(private eventBus: IEventBus) {}

  /**
   * 发布领域事件(同步)
   */
  publish(event: DomainEvent): void {
    this.eventBus.emit(event.type, event)
  }

  /**
   * 发布领域事件(异步)
   */
  async publishAsync(event: DomainEvent): Promise<void> {
    await this.eventBus.emitAsync(event.type, event)
  }

  /**
   * 批量发布事件
   */
  async publishBatch(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publishAsync(event)
    }
  }
}

// 预定义的系统事件

/**
 * 数据源加载完成事件
 */
export class DataSourceLoadedEvent extends DomainEvent {
  constructor(
    public readonly sourceId: string,
    public readonly data: any
  ) {
    super('dataSource.loaded')
  }

  protected getPayload() {
    return {
      sourceId: this.sourceId,
      data: this.data,
    }
  }
}

/**
 * 控件选中事件
 */
export class ControlSelectedEvent extends DomainEvent {
  constructor(
    public readonly controlId: string,
    public readonly control: any
  ) {
    super('control.selected')
  }

  protected getPayload() {
    return {
      controlId: this.controlId,
      control: this.control,
    }
  }
}

/**
 * 控件更新事件
 */
export class ControlUpdatedEvent extends DomainEvent {
  constructor(
    public readonly controlId: string,
    public readonly updates: Record<string, any>
  ) {
    super('control.updated')
  }

  protected getPayload() {
    return {
      controlId: this.controlId,
      updates: this.updates,
    }
  }
}

/**
 * 视图变更事件
 */
export class ViewChangedEvent extends DomainEvent {
  constructor(public readonly viewId: string) {
    super('view.changed')
  }

  protected getPayload() {
    return {
      viewId: this.viewId,
    }
  }
}
