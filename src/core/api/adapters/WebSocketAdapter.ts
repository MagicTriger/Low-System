/**
 * WebSocket适配器
 *
 * 支持WebSocket双向通信
 * 符合需求 8.2 - 支持多种协议
 */

import type { IApiAdapter } from './IApiAdapter'
import type { RequestConfig, ApiResponse } from '../IApiClient'

/**
 * WebSocket消息类型
 */
export enum WebSocketMessageType {
  TEXT = 'text',
  BINARY = 'binary',
  JSON = 'json',
}

/**
 * WebSocket配置扩展
 */
export interface WebSocketConfig extends RequestConfig {
  /** 消息类型 */
  messageType?: WebSocketMessageType
  /** 重连配置 */
  reconnect?: {
    enabled: boolean
    maxAttempts: number
    delay: number
  }
  /** 心跳配置 */
  heartbeat?: {
    enabled: boolean
    interval: number
    message: string | object
  }
}

/**
 * WebSocket连接状态
 */
export enum WebSocketState {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

/**
 * WebSocket事件
 */
export interface WebSocketEvents {
  onOpen?: (event: Event) => void
  onMessage?: (data: any) => void
  onError?: (error: Event) => void
  onClose?: (event: CloseEvent) => void
}

/**
 * WebSocket连接管理器
 */
class WebSocketConnection {
  private ws: WebSocket | null = null
  private state: WebSocketState = WebSocketState.DISCONNECTED
  private reconnectAttempts = 0
  private heartbeatTimer: number | null = null
  private messageQueue: any[] = []

  constructor(
    private url: string,
    private config: WebSocketConfig,
    private events: WebSocketEvents
  ) {}

  /**
   * 连接WebSocket
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.state = WebSocketState.CONNECTING
        this.ws = new WebSocket(this.url)

        this.ws.onopen = event => {
          this.state = WebSocketState.CONNECTED
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.flushMessageQueue()
          this.events.onOpen?.(event)
          resolve()
        }

        this.ws.onmessage = event => {
          const data = this.parseMessage(event.data)
          this.events.onMessage?.(data)
        }

        this.ws.onerror = event => {
          this.state = WebSocketState.ERROR
          this.events.onError?.(event)
          reject(new Error('WebSocket connection error'))
        }

        this.ws.onclose = event => {
          this.state = WebSocketState.DISCONNECTED
          this.stopHeartbeat()
          this.events.onClose?.(event)

          // 自动重连
          if (this.config.reconnect?.enabled && !event.wasClean) {
            this.attemptReconnect()
          }
        }
      } catch (error) {
        this.state = WebSocketState.ERROR
        reject(error)
      }
    })
  }

  /**
   * 发送消息
   */
  send(data: any): void {
    if (this.state !== WebSocketState.CONNECTED || !this.ws) {
      // 连接未建立时,将消息加入队列
      this.messageQueue.push(data)
      return
    }

    const message = this.serializeMessage(data)
    this.ws.send(message)
  }

  /**
   * 关闭连接
   */
  close(code?: number, reason?: string): void {
    this.state = WebSocketState.DISCONNECTING
    this.stopHeartbeat()
    this.ws?.close(code, reason)
    this.ws = null
  }

  /**
   * 获取连接状态
   */
  getState(): WebSocketState {
    return this.state
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    const { maxAttempts, delay } = this.config.reconnect!

    if (this.reconnectAttempts >= maxAttempts) {
      console.error('Max reconnect attempts reached')
      return
    }

    this.reconnectAttempts++
    console.log(`Reconnecting... Attempt ${this.reconnectAttempts}/${maxAttempts}`)

    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnect failed:', error)
      })
    }, delay)
  }

  /**
   * 启动心跳
   */
  private startHeartbeat(): void {
    if (!this.config.heartbeat?.enabled) return

    const { interval, message } = this.config.heartbeat

    this.heartbeatTimer = window.setInterval(() => {
      if (this.state === WebSocketState.CONNECTED) {
        this.send(message)
      }
    }, interval)
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  /**
   * 刷新消息队列
   */
  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      this.send(message)
    }
  }

  /**
   * 解析消息
   */
  private parseMessage(data: any): any {
    if (this.config.messageType === WebSocketMessageType.JSON) {
      try {
        return JSON.parse(data)
      } catch {
        return data
      }
    }
    return data
  }

  /**
   * 序列化消息
   */
  private serializeMessage(data: any): string | ArrayBuffer | Blob {
    if (this.config.messageType === WebSocketMessageType.JSON) {
      return JSON.stringify(data)
    }
    return data
  }
}

/**
 * WebSocket适配器实现
 */
export class WebSocketAdapter implements IApiAdapter {
  readonly name = 'websocket'
  readonly version = '1.0.0'

  private connections = new Map<string, WebSocketConnection>()

  /**
   * 执行WebSocket请求
   */
  async request<T = any>(config: WebSocketConfig): Promise<ApiResponse<T>> {
    return new Promise((resolve, reject) => {
      const connection = this.getOrCreateConnection(config)

      // 设置消息监听器
      const originalOnMessage = config.metadata?.onMessage
      const events: WebSocketEvents = {
        onMessage: data => {
          originalOnMessage?.(data)
          resolve({
            data,
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          })
        },
        onError: error => {
          reject(error)
        },
      }

      // 连接并发送消息
      connection
        .connect()
        .then(() => {
          if (config.data) {
            connection.send(config.data)
          }
        })
        .catch(reject)
    })
  }

  /**
   * 检查是否支持协议
   */
  supports(protocol: string): boolean {
    return protocol === 'ws' || protocol === 'wss' || protocol === 'websocket'
  }

  /**
   * 获取或创建连接
   */
  private getOrCreateConnection(config: WebSocketConfig): WebSocketConnection {
    const url = config.url!

    if (!this.connections.has(url)) {
      const connection = new WebSocketConnection(url, config, {
        onOpen: config.metadata?.onOpen,
        onMessage: config.metadata?.onMessage,
        onError: config.metadata?.onError,
        onClose: config.metadata?.onClose,
      })
      this.connections.set(url, connection)
    }

    return this.connections.get(url)!
  }

  /**
   * 关闭连接
   */
  closeConnection(url: string): void {
    const connection = this.connections.get(url)
    if (connection) {
      connection.close()
      this.connections.delete(url)
    }
  }

  /**
   * 关闭所有连接
   */
  closeAllConnections(): void {
    this.connections.forEach(connection => {
      connection.close()
    })
    this.connections.clear()
  }

  /**
   * 销毁适配器
   */
  async dispose(): Promise<void> {
    this.closeAllConnections()
  }
}
