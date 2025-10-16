/**
 * 日志系统类型定义
 */

// 日志级别
export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  Fatal = 4,
}

// 日志级别名称映射
export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.Debug]: 'DEBUG',
  [LogLevel.Info]: 'INFO',
  [LogLevel.Warn]: 'WARN',
  [LogLevel.Error]: 'ERROR',
  [LogLevel.Fatal]: 'FATAL',
}

// 日志记录
export interface LogRecord {
  /** 日志级别 */
  level: LogLevel
  /** 日志消息 */
  message: string
  /** 时间戳 */
  timestamp: Date
  /** 日志来源 */
  source?: string
  /** 日志上下文 */
  context?: Record<string, any>
  /** 错误对象 */
  error?: Error
  /** 堆栈跟踪 */
  stack?: string
}

// 日志格式化器接口
export interface ILogFormatter {
  /**
   * 格式化日志记录
   */
  format(record: LogRecord): string
}

// 日志传输器接口
export interface ILogTransport {
  /**
   * 传输器名称
   */
  readonly name: string

  /**
   * 最小日志级别
   */
  readonly level: LogLevel

  /**
   * 写入日志
   */
  log(record: LogRecord): void | Promise<void>

  /**
   * 刷新缓冲区
   */
  flush?(): void | Promise<void>

  /**
   * 关闭传输器
   */
  close?(): void | Promise<void>
}

// 日志过滤器
export type LogFilter = (record: LogRecord) => boolean

// 日志器接口
export interface ILogger {
  /**
   * 记录调试日志
   */
  debug(message: string, context?: Record<string, any>): void

  /**
   * 记录信息日志
   */
  info(message: string, context?: Record<string, any>): void

  /**
   * 记录警告日志
   */
  warn(message: string, context?: Record<string, any>): void

  /**
   * 记录错误日志
   */
  error(message: string, error?: Error, context?: Record<string, any>): void

  /**
   * 记录致命错误日志
   */
  fatal(message: string, error?: Error, context?: Record<string, any>): void

  /**
   * 记录指定级别的日志
   */
  log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void

  /**
   * 创建子日志器
   */
  child(source: string, context?: Record<string, any>): ILogger

  /**
   * 添加传输器
   */
  addTransport(transport: ILogTransport): void

  /**
   * 移除传输器
   */
  removeTransport(name: string): void

  /**
   * 设置日志级别
   */
  setLevel(level: LogLevel): void

  /**
   * 获取日志级别
   */
  getLevel(): LogLevel

  /**
   * 添加过滤器
   */
  addFilter(filter: LogFilter): void

  /**
   * 刷新所有传输器
   */
  flush(): Promise<void>
}

// 日志器配置
export interface LoggerOptions {
  /** 日志来源 */
  source?: string
  /** 最小日志级别 */
  level?: LogLevel
  /** 传输器列表 */
  transports?: ILogTransport[]
  /** 过滤器列表 */
  filters?: LogFilter[]
  /** 默认上下文 */
  context?: Record<string, any>
}

// 日志错误类
export class LoggerError extends Error {
  constructor(
    message: string,
    public originalError?: Error
  ) {
    super(message)
    this.name = 'LoggerError'
  }
}
