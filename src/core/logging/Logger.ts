/**
 * 日志器实现
 * 提供统一的日志记录接口
 */

import type { LogLevel, LogRecord, ILogger, ILogTransport, LogFilter, LoggerOptions } from './types'
import { LogLevel as Level } from './types'

export class Logger implements ILogger {
  private source: string
  private level: LogLevel
  private transports: Map<string, ILogTransport> = new Map()
  private filters: LogFilter[] = []
  private defaultContext: Record<string, any>

  constructor(options: LoggerOptions = {}) {
    this.source = options.source || 'app'
    this.level = options.level ?? Level.Info
    this.defaultContext = options.context || {}

    if (options.transports) {
      options.transports.forEach(transport => this.addTransport(transport))
    }

    if (options.filters) {
      this.filters = [...options.filters]
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(Level.Debug, message, context)
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(Level.Info, message, context)
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(Level.Warn, message, context)
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(Level.Error, message, context, error)
  }

  fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(Level.Fatal, message, context, error)
  }

  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    // 检查日志级别
    if (level < this.level) {
      return
    }

    // 创建日志记录
    const record: LogRecord = {
      level,
      message,
      timestamp: new Date(),
      source: this.source,
      context: { ...this.defaultContext, ...context },
      error,
      stack: error?.stack,
    }

    // 应用过滤器
    if (!this.shouldLog(record)) {
      return
    }

    // 写入所有传输器
    this.writeToTransports(record)
  }

  child(source: string, context?: Record<string, any>): ILogger {
    return new Logger({
      source: `${this.source}.${source}`,
      level: this.level,
      transports: Array.from(this.transports.values()),
      filters: [...this.filters],
      context: { ...this.defaultContext, ...context },
    })
  }

  addTransport(transport: ILogTransport): void {
    this.transports.set(transport.name, transport)
  }

  removeTransport(name: string): void {
    const transport = this.transports.get(name)
    if (transport?.close) {
      transport.close()
    }
    this.transports.delete(name)
  }

  setLevel(level: LogLevel): void {
    this.level = level
  }

  getLevel(): LogLevel {
    return this.level
  }

  addFilter(filter: LogFilter): void {
    this.filters.push(filter)
  }

  async flush(): Promise<void> {
    const promises: Promise<void>[] = []

    for (const transport of this.transports.values()) {
      if (transport.flush) {
        const result = transport.flush()
        if (result instanceof Promise) {
          promises.push(result)
        }
      }
    }

    await Promise.all(promises)
  }

  private shouldLog(record: LogRecord): boolean {
    return this.filters.every(filter => filter(record))
  }

  private writeToTransports(record: LogRecord): void {
    for (const transport of this.transports.values()) {
      // 检查传输器的日志级别
      if (record.level >= transport.level) {
        try {
          transport.log(record)
        } catch (error) {
          console.error('[Logger] Transport error:', error)
        }
      }
    }
  }
}

// 导出全局日志器实例
export const globalLogger = new Logger({
  source: 'app',
  level: Level.Info,
})
