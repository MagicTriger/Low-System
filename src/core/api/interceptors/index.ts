/**
 * 内置拦截器
 *
 * 提供常用的请求和响应拦截器
 */

import type { RequestInterceptor, ResponseInterceptor, ErrorInterceptor } from '../IApiClient'

/**
 * 认证拦截器
 * 自动添加认证令牌
 */
export const authInterceptor: RequestInterceptor = config => {
  // 从存储中获取token
  const token = localStorage.getItem('auth_token')

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    }
  }

  return config
}

/**
 * 请求ID拦截器
 * 为每个请求添加唯一ID
 */
export const requestIdInterceptor: RequestInterceptor = config => {
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  config.headers = {
    ...config.headers,
    'X-Request-ID': requestId,
  }

  return config
}

/**
 * 时间戳拦截器
 * 为GET请求添加时间戳防止缓存
 */
export const timestampInterceptor: RequestInterceptor = config => {
  if (config.method === 'GET') {
    config.params = {
      ...config.params,
      _t: Date.now(),
    }
  }

  return config
}

/**
 * 日志拦截器
 * 记录请求和响应日志
 */
export const loggingInterceptor = {
  request: (config => {
    console.log('[API Request]', {
      method: config.method,
      url: config.url,
      params: config.params,
      data: config.data,
    })
    return config
  }) as RequestInterceptor,

  response: (response => {
    console.log('[API Response]', {
      status: response.status,
      url: response.config.url,
      data: response.data,
    })
    return response
  }) as ResponseInterceptor,

  error: (error => {
    console.error('[API Error]', {
      message: error.message,
      status: error.status,
      url: error.config?.url,
    })
    throw error
  }) as ErrorInterceptor,
}

/**
 * 错误处理拦截器
 * 统一处理API错误
 */
export const errorHandlingInterceptor: ErrorInterceptor = error => {
  // 网络错误
  if (error.isNetworkError) {
    console.error('Network error:', error.message)
    // 可以在这里显示全局错误提示
  }

  // 超时错误
  if (error.isTimeoutError) {
    console.error('Request timeout:', error.message)
  }

  // HTTP错误
  if (error.status) {
    switch (error.status) {
      case 401:
        // 未授权,跳转到登录页
        console.error('Unauthorized, redirecting to login...')
        break
      case 403:
        console.error('Forbidden')
        break
      case 404:
        console.error('Not found')
        break
      case 500:
        console.error('Server error')
        break
    }
  }

  throw error
}

/**
 * 响应数据转换拦截器
 * 自动解包响应数据
 */
export const dataTransformInterceptor: ResponseInterceptor = response => {
  // 如果响应数据有标准格式,自动解包
  if (response.data && typeof response.data === 'object') {
    if ('code' in response.data && 'data' in response.data) {
      // 检查业务状态码
      if (response.data.code !== 200) {
        throw new Error(response.data.message || 'Request failed')
      }
      // 解包数据
      response.data = response.data.data
    }
  }

  return response
}

/**
 * 重试拦截器
 * 自动重试失败的请求
 */
export const retryInterceptor: ErrorInterceptor = async error => {
  const config = error.config

  // 如果没有配置重试或已达到最大重试次数,直接抛出错误
  if (!config?.retry || (config.metadata?.retryCount || 0) >= config.retry.times) {
    throw error
  }

  // 增加重试计数
  config.metadata = config.metadata || {}
  config.metadata.retryCount = (config.metadata.retryCount || 0) + 1

  // 计算延迟
  const delay = config.retry.delay * Math.pow(2, config.metadata.retryCount - 1)

  // 等待后重试
  await new Promise(resolve => setTimeout(resolve, delay))

  // 这里需要重新发起请求,但由于拦截器无法直接访问客户端实例
  // 实际实现应该在ApiClient中处理
  throw error
}
