/**
 * API适配器接口
 *
 * 支持多种协议和传输方式的适配器模式
 * 符合需求 8.2 - 通过适配器模式扩展新协议
 */

import type { RequestConfig, ApiResponse } from '../IApiClient'

/**
 * API适配器接口
 */
export interface IApiAdapter {
  /** 适配器名称 */
  readonly name: string

  /** 适配器版本 */
  readonly version: string

  /**
   * 执行请求
   */
  request<T = any>(config: RequestConfig): Promise<ApiResponse<T>>

  /**
   * 检查是否支持指定协议
   */
  supports(protocol: string): boolean

  /**
   * 初始化适配器
   */
  initialize?(): Promise<void>

  /**
   * 销毁适配器
   */
  dispose?(): Promise<void>
}

/**
 * 适配器注册表
 */
export interface IAdapterRegistry {
  /**
   * 注册适配器
   */
  register(adapter: IApiAdapter): void

  /**
   * 注销适配器
   */
  unregister(name: string): void

  /**
   * 获取适配器
   */
  get(protocol: string): IApiAdapter | undefined

  /**
   * 获取所有适配器
   */
  getAll(): IApiAdapter[]

  /**
   * 检查是否支持协议
   */
  supports(protocol: string): boolean
}
