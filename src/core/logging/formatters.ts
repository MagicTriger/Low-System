/**
 * 日志格式化器实现
 */

import type { ILogFormatter, LogRecord } from './types'
import { LogLevelNames } from './types'

/**
 * 简单文本格式化器
 */
export class SimpleFormatter implements ILogFormatter {
  format(record: LogRecord): string {
    const level = LogLevelNames[record.level]
    const timestamp = record.timestamp.toISOString()
    const source = record.source ? `[${record.source}]` : ''

    let message = `${timestamp} ${level} ${source} ${record.message}`

    if (record.context && Object.keys(record.context).length > 0) {
      message += ` ${JSON.stringify(record.context)}`
    }

    if (record.error) {
      message += `\n${record.error.message}`
      if (record.stack) {
        message += `\n${record.stack}`
      }
    }

    return message
  }
}

/**
 * JSON格式化器
 */
export class JsonFormatter implements ILogFormatter {
  constructor(private pretty: boolean = false) {}

  format(record: LogRecord): string {
    const data = {
      level: LogLevelNames[record.level],
      message: record.message,
      timestamp: record.timestamp.toISOString(),
      source: record.source,
      context: record.context,
      error: record.error
        ? {
            message: record.error.message,
            name: record.error.name,
            stack: record.stack,
          }
        : undefined,
    }

    return this.pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data)
  }
}

/**
 * 彩色控制台格式化器
 */
export class ColoredFormatter implements ILogFormatter {
  private colors = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m', // Green
    WARN: '\x1b[33m', // Yellow
    ERROR: '\x1b[31m', // Red
    FATAL: '\x1b[35m', // Magenta
    RESET: '\x1b[0m',
  }

  format(record: LogRecord): string {
    const level = LogLevelNames[record.level]
    const color = this.colors[level as keyof typeof this.colors] || this.colors.RESET
    const timestamp = record.timestamp.toISOString()
    const source = record.source ? `[${record.source}]` : ''

    let message = `${color}${timestamp} ${level}${this.colors.RESET} ${source} ${record.message}`

    if (record.context && Object.keys(record.context).length > 0) {
      message += ` ${JSON.stringify(record.context)}`
    }

    if (record.error) {
      message += `\n${this.colors.ERROR}${record.error.message}${this.colors.RESET}`
      if (record.stack) {
        message += `\n${record.stack}`
      }
    }

    return message
  }
}

/**
 * 自定义格式化器
 */
export class CustomFormatter implements ILogFormatter {
  constructor(private template: (record: LogRecord) => string) {}

  format(record: LogRecord): string {
    return this.template(record)
  }
}
