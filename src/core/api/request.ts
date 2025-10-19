import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { message, notification } from 'ant-design-vue'
import type { ApiResponse } from './types'
import { global, CONSTANTS, ERROR_MESSAGES } from '@/core/global'
import { useState, useDispatch } from '@/core/state/helpers'

// 创建axios实例
const request: AxiosInstance = axios.create({
  baseURL: global.apiUrl,
  timeout: CONSTANTS.DEFAULTS.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加认证token
    try {
      // 从 auth 模块获取 token
      const authState = useState('auth')
      if (authState && authState.accessToken) {
        const tokenType = authState.tokenType || 'Bearer'
        config.headers.Authorization = `${tokenType} ${authState.accessToken}`
      }
    } catch (error) {
      // StateManager可能还未初始化，尝试从 localStorage 获取
      const accessToken = localStorage.getItem('accessToken')
      const tokenType = localStorage.getItem('tokenType') || 'Bearer'
      if (accessToken) {
        config.headers.Authorization = `${tokenType} ${accessToken}`
      }
    }

    // 添加请求ID用于追踪
    config.headers['X-Request-ID'] = generateRequestId()

    // 添加时间戳防止缓存
    if (config.method === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now(),
      }
    }

    return config
  },
  error => {
    console.error('请求拦截器错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { data } = response

    // 检查业务状态码
    if (data.code !== CONSTANTS.HTTP_STATUS.OK) {
      const errorMessage = data.message || ERROR_MESSAGES.UNKNOWN_ERROR

      // 特殊状态码处理
      switch (data.code) {
        case CONSTANTS.HTTP_STATUS.UNAUTHORIZED:
          handleUnauthorized()
          break
        case CONSTANTS.HTTP_STATUS.FORBIDDEN:
          notification.error({
            message: '权限不足',
            description: ERROR_MESSAGES.FORBIDDEN,
          })
          break
        default:
          message.error(errorMessage)
      }

      return Promise.reject(new Error(errorMessage))
    }

    return response
  },
  error => {
    console.error('响应拦截器错误:', error)

    // 网络错误处理
    if (!error.response) {
      message.error(ERROR_MESSAGES.NETWORK_ERROR)
      return Promise.reject(error)
    }

    const { status, data } = error.response
    let errorMessage = ERROR_MESSAGES.UNKNOWN_ERROR

    switch (status) {
      case CONSTANTS.HTTP_STATUS.BAD_REQUEST:
        errorMessage = data?.message || ERROR_MESSAGES.VALIDATION_ERROR
        break
      case CONSTANTS.HTTP_STATUS.UNAUTHORIZED:
        errorMessage = ERROR_MESSAGES.UNAUTHORIZED
        handleUnauthorized()
        break
      case CONSTANTS.HTTP_STATUS.FORBIDDEN:
        errorMessage = ERROR_MESSAGES.FORBIDDEN
        break
      case CONSTANTS.HTTP_STATUS.NOT_FOUND:
        errorMessage = ERROR_MESSAGES.NOT_FOUND
        break
      case CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR:
        errorMessage = ERROR_MESSAGES.SERVER_ERROR
        break
      default:
        errorMessage = data?.message || ERROR_MESSAGES.UNKNOWN_ERROR
    }

    // 显示错误消息
    if (status !== CONSTANTS.HTTP_STATUS.UNAUTHORIZED) {
      message.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

// 处理未授权
function handleUnauthorized() {
  try {
    const dispatch = useDispatch('user')
    dispatch('logout')
  } catch (error) {
    console.error('Failed to logout:', error)
  }

  // 跳转到登录页
  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

// 生成请求ID
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 请求方法封装
export const api = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.get(url, config)
  },

  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.post(url, data, config)
  },

  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.put(url, data, config)
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.delete(url, config)
  },

  patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return request.patch(url, data, config)
  },

  upload<T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<AxiosResponse<ApiResponse<T>>> {
    const formData = new FormData()
    formData.append('file', file)

    return request.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: progressEvent => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      },
    })
  },

  download(url: string, filename?: string, config?: AxiosRequestConfig): Promise<void> {
    return request
      .get(url, {
        ...config,
        responseType: 'blob',
      })
      .then(response => {
        const blob = new Blob([response.data])
        const downloadUrl = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = filename || 'download'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(downloadUrl)
      })
  },
}

export default request
