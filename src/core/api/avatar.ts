import { ApiClientFactory } from './ApiClient'

// 创建API客户端实例
const apiClient = ApiClientFactory.create()

export interface AvatarUploadResponse {
  avatarUrl: string
  thumbnailUrl: string
}

export interface AvatarInfo {
  userId: string
  avatarUrl: string
  thumbnailUrl: string
  uploadedAt: string
}

/**
 * 后端响应格式
 */
interface ApiResponse<T> {
  success: boolean
  message: string
  data?: T
}

/**
 * 上传用户头像
 * @param file 图片文件
 * @returns 头像URL信息
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  try {
    const formData = new FormData()
    formData.append('file', file)

    console.log('开始上传头像文件:', file.name, file.size, 'bytes')

    const response = await apiClient.post<ApiResponse<AvatarUploadResponse>>('/user/avatar/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })

    console.log('收到服务器响应:', response)

    // 处理后端的响应格式
    const responseData = response.data

    // 验证响应数据
    if (!responseData || typeof responseData !== 'object') {
      console.error('响应数据格式错误:', responseData)
      throw new Error('服务器返回的数据格式不正确')
    }

    // 检查是否是包装格式 { success, message, data }
    if ('success' in responseData && 'data' in responseData) {
      if (!responseData.success) {
        throw new Error(responseData.message || '上传失败')
      }

      if (!responseData.data) {
        throw new Error('服务器未返回数据')
      }

      if (!responseData.data.avatarUrl) {
        throw new Error('服务器未返回头像URL')
      }

      console.log('头像上传成功:', responseData.data)
      return responseData.data
    }

    // 直接返回格式 { avatarUrl, thumbnailUrl }
    if ('avatarUrl' in responseData) {
      console.log('头像上传成功:', responseData)
      return responseData as unknown as AvatarUploadResponse
    }

    console.error('无法识别的响应格式:', responseData)
    throw new Error('服务器返回的数据格式不正确')
  } catch (error: any) {
    console.error('上传头像API错误:', error)

    // 提供更友好的错误信息
    if (error.message?.includes('JSON')) {
      throw new Error('服务器返回数据格式错误，请联系管理员')
    }

    if (error.status === 413) {
      throw new Error('文件太大，请选择小于2MB的图片')
    }

    if (error.status === 415) {
      throw new Error('不支持的文件格式，请上传JPG、PNG或GIF格式')
    }

    if (error.status === 401) {
      throw new Error('未登录或登录已过期，请重新登录')
    }

    throw error
  }
}

/**
 * 删除用户头像
 */
export async function deleteAvatar(): Promise<void> {
  await apiClient.delete('/user/avatar')
}

/**
 * 获取用户头像信息
 * @param userId 用户ID(可选,不传则获取当前用户)
 * @returns 头像信息
 */
export async function getAvatarInfo(userId?: string): Promise<AvatarInfo> {
  const url = userId ? `/user/avatar/${userId}` : '/user/avatar'
  const response = await apiClient.get<AvatarInfo>(url)
  return response.data
}

/**
 * 更新用户头像(通过URL)
 * @param avatarUrl 头像URL
 */
export async function updateAvatarUrl(avatarUrl: string): Promise<void> {
  await apiClient.put('/user/avatar/url', { avatarUrl })
}
