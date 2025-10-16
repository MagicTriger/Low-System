/**
 * GraphQL适配器
 *
 * 支持GraphQL查询和变更操作
 * 符合需求 8.2 - 支持多种协议
 */

import type { IApiAdapter } from './IApiAdapter'
import type { RequestConfig, ApiResponse } from '../IApiClient'

/**
 * GraphQL请求配置扩展
 */
export interface GraphQLRequestConfig extends RequestConfig {
  /** GraphQL查询语句 */
  query?: string
  /** GraphQL变量 */
  variables?: Record<string, any>
  /** 操作名称 */
  operationName?: string
}

/**
 * GraphQL响应格式
 */
interface GraphQLResponse<T = any> {
  data?: T
  errors?: Array<{
    message: string
    locations?: Array<{ line: number; column: number }>
    path?: string[]
    extensions?: Record<string, any>
  }>
}

/**
 * GraphQL错误
 */
export class GraphQLError extends Error {
  constructor(
    message: string,
    public errors: GraphQLResponse['errors']
  ) {
    super(message)
    this.name = 'GraphQLError'
  }
}

/**
 * GraphQL适配器实现
 */
export class GraphQLAdapter implements IApiAdapter {
  readonly name = 'graphql'
  readonly version = '1.0.0'

  /**
   * 执行GraphQL请求
   */
  async request<T = any>(config: GraphQLRequestConfig): Promise<ApiResponse<T>> {
    const { query, variables, operationName } = config

    if (!query) {
      throw new Error('GraphQL query is required')
    }

    // 构建GraphQL请求体
    const body = {
      query,
      variables,
      operationName,
    }

    const abortController = new AbortController()
    const timeoutId = config.timeout ? setTimeout(() => abortController.abort(), config.timeout) : null

    try {
      const response = await fetch(config.url!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...config.headers,
        } as HeadersInit,
        body: JSON.stringify(body),
        signal: abortController.signal,
        credentials: config.withCredentials ? 'include' : 'same-origin',
      })

      if (timeoutId) clearTimeout(timeoutId)

      const result: GraphQLResponse<T> = await response.json()

      // 检查GraphQL错误
      if (result.errors && result.errors.length > 0) {
        throw new GraphQLError(result.errors.map(e => e.message).join('; '), result.errors)
      }

      return {
        data: result.data!,
        status: response.status,
        statusText: response.statusText,
        headers: this.parseHeaders(response.headers),
        config,
      }
    } catch (error: any) {
      if (timeoutId) clearTimeout(timeoutId)

      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }

      throw error
    }
  }

  /**
   * 检查是否支持协议
   */
  supports(protocol: string): boolean {
    return protocol === 'graphql'
  }

  /**
   * 解析响应头
   */
  private parseHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {}
    headers.forEach((value, key) => {
      result[key] = value
    })
    return result
  }
}

/**
 * GraphQL查询构建器
 */
export class GraphQLQueryBuilder {
  private query: string = ''
  private variables: Record<string, any> = {}
  private operationName?: string

  /**
   * 设置查询语句
   */
  setQuery(query: string): this {
    this.query = query
    return this
  }

  /**
   * 设置变量
   */
  setVariables(variables: Record<string, any>): this {
    this.variables = variables
    return this
  }

  /**
   * 添加变量
   */
  addVariable(key: string, value: any): this {
    this.variables[key] = value
    return this
  }

  /**
   * 设置操作名称
   */
  setOperationName(name: string): this {
    this.operationName = name
    return this
  }

  /**
   * 构建请求配置
   */
  build(): GraphQLRequestConfig {
    return {
      query: this.query,
      variables: this.variables,
      operationName: this.operationName,
    }
  }
}
