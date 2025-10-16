/**
 * 遗留API适配器
 *
 * 提供向后兼容的API接口,使现有代码无需修改即可使用新的API客户端
 * 符合需求 15.1, 15.2, 15.3 - 向后兼容性
 */

import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import type { IApiClient, RequestConfig, ApiResponse } from '../IApiClient'
import { ApiClient } from '../ApiClient'
import type { ApiResponse as LegacyApiResponse } from '@/core/types'

/**
 * 遗留API适配器
 *
 * 将新的ApiClient包装成类似Axios的接口
 */
export class LegacyApiAdapter {
  private client: IApiClient

  constructor(client?: IApiClient) {
    this.client = client || new ApiClient()
  }

  /**
   * GET请求
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<LegacyApiResponse<T>>> {
    const response = await this.client.get<LegacyApiResponse<T>>(url, this.convertConfig(config))
    return this.convertResponse(response)
  }

  /**
   * POST请求
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<LegacyApiResponse<T>>> {
    const response = await this.client.post<LegacyApiResponse<T>>(url, data, this.convertConfig(config))
    return this.convertResponse(response)
  }

  /**
   * PUT请求
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<LegacyApiResponse<T>>> {
    const response = await this.client.put<LegacyApiResponse<T>>(url, data, this.convertConfig(config))
    return this.convertResponse(response)
  }

  /**
   * DELETE请求
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<LegacyApiResponse<T>>> {
    const response = await this.client.delete<LegacyApiResponse<T>>(url, this.convertConfig(config))
    return this.convertResponse(response)
  }

  /**
   * PATCH请求
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<LegacyApiResponse<T>>> {
    const response = await this.client.patch<LegacyApiResponse<T>>(url, data, this.convertConfig(config))
    return this.convertResponse(response)
  }

  /**
   * 转换配置
   */
  private convertConfig(config?: AxiosRequestConfig): RequestConfig {
    if (!config) return {}

    return {
      headers: config.headers as Record<string, string>,
      params: config.params,
      timeout: config.timeout,
      withCredentials: config.withCredentials,
      responseType: config.responseType as any,
      onUploadProgress: config.onUploadProgress as any,
      onDownloadProgress: config.onDownloadProgress as any,
    }
  }

  /**
   * 转换响应
   */
  private convertResponse<T>(response: ApiResponse<T>): AxiosResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as any,
      config: response.config as any,
    } as AxiosResponse<T>
  }

  /**
   * 获取底层客户端
   */
  getClient(): IApiClient {
    return this.client
  }
}
