/**
 * 日志传输器实现
 */

import type { ILogTransport, ILogFormatter, LogRecord, LogLevel } from './types'
import { LogLevel as Level } from './types'
import { SimpleFormatter } from './formatters'

/**
 * 控制台传输器
 */
export class ConsoleTransport implements ILogTransport {
  public readonly name = 'console'

  constructor(
    public readonly level: LogLevel = Level.Debug,
    private formatter: ILogFormatter = new SimpleFormatter()
  ) {}

  log(record: LogRecord): void {
    const message = this.formatter.format(record)

    switch (record.level) {
      case Level.Debug:
        console.debug(message)
        break
      case Level.Info:
        console.info(message)
        break
      case Level.Warn:
        console.warn(message)
        break
      case Level.Error:
      case Level.Fatal:
        console.error(message)
        break
    }
  }
}

/**
 * 内存传输器
 * 将日志存储在内存中
 */
export class MemoryTransport implements ILogTransport {
  public readonly name = 'memory'
  private records: LogRecord[] = []

  constructor(
    public readonly level: LogLevel = Level.Debug,
    private maxRecords: number = 1000
  ) {}

  log(record: LogRecord): void {
    this.records.push(record)

    // 限制记录数量
    if (this.records.length > this.maxRecords) {
      this.records.shift()
    }
  }

  getRecords(): LogRecord[] {
    return [...this.records]
  }

  clear(): void {
    this.records = []
  }

  close(): void {
    this.clear()
  }
}

/**
 * 文件传输器
 * 将日志写入文件(浏览器环境使用 Blob)
 */
export class FileTransport implements ILogTransport {
  public readonly name: string
  private buffer: string[] = []
  private flushTimer?: any

  constructor(
    filename: string,
    public readonly level: LogLevel = Level.Info,
    private formatter: ILogFormatter = new SimpleFormatter(),
    private bufferSize: number = 100,
    private flushInterval: number = 5000
  ) {
    this.name = `file:${filename}`
    this.startFlushTimer()
  }

  log(record: LogRecord): void {
    const message = this.formatter.format(record)
    this.buffer.push(message)

    if (this.buffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  flush(): void {
    if (this.buffer.length === 0) return

    const content = this.buffer.join('\n') + '\n'
    this.buffer = []

    // 在浏览器环境中,创建下载链接
    if (typeof window !== 'undefined') {
      const blob = new Blob([content], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)

      // 可以选择自动下载或存储到 IndexedDB
      console.debug('[FileTransport] Log content ready:', url)
    }
  }

  close(): void {
    this.stopFlushTimer()
    this.flush()
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }
}

/**
 * HTTP传输器
 * 将日志发送到远程服务器
 */
export class HttpTransport implements ILogTransport {
  public readonly name = 'http'
  private buffer: LogRecord[] = []
  private flushTimer?: any

  constructor(
    private endpoint: string,
    public readonly level: LogLevel = Level.Warn,
    private bufferSize: number = 10,
    private flushInterval: number = 10000
  ) {
    this.startFlushTimer()
  }

  log(record: LogRecord): void {
    this.buffer.push(record)

    if (this.buffer.length >= this.bufferSize) {
      this.flush()
    }
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return

    const records = [...this.buffer]
    this.buffer = []

    try {
      await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ logs: records }),
      })
    } catch (error) {
      console.error('[HttpTransport] Failed to send logs:', error)
      // 将失败的日志放回缓冲区
      this.buffer.unshift(...records)
    }
  }

  close(): void {
    this.stopFlushTimer()
    this.flush()
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush()
    }, this.flushInterval)
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = undefined
    }
  }
}

/**
 * LocalStorage传输器
 * 将日志存储到 LocalStorage
 */
export class LocalStorageTransport implements ILogTransport {
  public readonly name = 'localStorage'
  private storageKey: string

  constructor(
    storageKey: string = 'app-logs',
    public readonly level: LogLevel = Level.Warn,
    private formatter: ILogFormatter = new SimpleFormatter(),
    private maxSize: number = 1000
  ) {
    this.storageKey = storageKey
  }

  log(record: LogRecord): void {
    try {
      const message = this.formatter.format(record)
      const logs = this.getLogs()

      logs.push({
        timestamp: record.timestamp.toISOString(),
        message,
      })

      // 限制大小
      if (logs.length > this.maxSize) {
        logs.shift()
      }

      localStorage.setItem(this.storageKey, JSON.stringify(logs))
    } catch (error) {
      console.error('[LocalStorageTransport] Failed to store log:', error)
    }
  }

  getLogs(): Array<{ timestamp: string; message: string }> {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  clear(): void {
    localStorage.removeItem(this.storageKey)
  }

  close(): void {
    // LocalStorage 不需要关闭
  }
}

/**
 * 多传输器
 * 将日志发送到多个传输器
 */
export class MultiTransport implements ILogTransport {
  public readonly name = 'multi'
  public readonly level: LogLevel

  constructor(
    private transports: ILogTransport[],
    level?: LogLevel
  ) {
    // 使用最低的日志级别
    this.level = level ?? Math.min(...transports.map(t => t.level))
  }

  log(record: LogRecord): void {
    for (const transport of this.transports) {
      if (record.level >= transport.level) {
        transport.log(record)
      }
    }
  }

  async flush(): Promise<void> {
    const promises: Promise<void>[] = []

    for (const transport of this.transports) {
      if (transport.flush) {
        const result = transport.flush()
        if (result instanceof Promise) {
          promises.push(result)
        }
      }
    }

    await Promise.all(promises)
  }

  close(): void {
    for (const transport of this.transports) {
      if (transport.close) {
        transport.close()
      }
    }
  }
}
