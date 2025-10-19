import { ApiClient } from './ApiClient'

// 创建带 /api 前缀的API客户端实例
const baseURL = import.meta.env.DEV
  ? '/api' // 开发环境：使用代理
  : (import.meta.env.VITE_SERVICE_URL || 'http://localhost:8090') + '/api' // 生产环境：完整URL

const apiClient = new ApiClient({
  url: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export interface AvatarUploadResponse {
  avatarUrl: string
  thumbnailUrl?: string
}

export interface AvatarInfo {
  userId: string
  avatarUrl: string
  thumbnailUrl?: string
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
 * 阿里云OSS上传凭证
 */
interface OSSUploadCredentials {
  accessKeyId: string
  accessKeySecret: string
  securityToken: string
  bucket: string
  region: string
  expiration: string
}

/**
 * 获取阿里云OSS上传凭证
 * @returns OSS上传凭证
 * @example
 * ```ts
 * const credentials = await getOSSUploadCredentials()
 * const url = await uploadAvatarDirectToOSS(file, credentials)
 * ```
 */
export async function getOSSUploadCredentials(): Promise<OSSUploadCredentials> {
  try {
    const response = await apiClient.get<ApiResponse<OSSUploadCredentials>>('/user/avatar/oss/credentials')

    if (response.data.success && response.data.data) {
      return response.data.data
    }

    throw new Error(response.data.message || '获取上传凭证失败')
  } catch (error: any) {
    console.error('获取OSS凭证失败:', error)
    throw new Error('获取上传凭证失败，请稍后重试')
  }
}

/**
 * 直接上传到阿里云OSS（前端直传）
 * @param file 图片文件
 * @param credentials OSS凭证
 * @returns 上传后的文件URL
 * @example
 * ```ts
 * const credentials = await getOSSUploadCredentials()
 * const avatarUrl = await uploadAvatarDirectToOSS(file, credentials)
 * await updateAvatarUrl(avatarUrl)
 * ```
 */
export async function uploadAvatarDirectToOSS(file: File, credentials: OSSUploadCredentials): Promise<string> {
  try {
    // 生成唯一文件名
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const fileExt = file.name.split('.').pop()
    const fileName = `avatars/${timestamp}_${randomStr}.${fileExt}`

    // 构建OSS上传URL
    const ossUrl = `https://${credentials.bucket}.${credentials.region}.aliyuncs.com/${fileName}`

    // 创建FormData
    const formData = new FormData()
    formData.append('key', fileName)
    formData.append('OSSAccessKeyId', credentials.accessKeyId)
    formData.append('policy', '') // 需要后端生成policy
    formData.append('Signature', '') // 需要后端生成签名
    formData.append('success_action_status', '200')
    formData.append('x-oss-security-token', credentials.securityToken)
    formData.append('file', file)

    // 直接上传到OSS
    const response = await fetch(ossUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      throw new Error('上传到OSS失败')
    }

    return ossUrl
  } catch (error: any) {
    console.error('上传到OSS失败:', error)
    throw new Error('上传失败，请稍后重试')
  }
}

/**
 * 上传用户头像（通过后端代理到阿里云OSS）
 * @param file 图片文件
 * @returns 头像URL信息
 */
export async function uploadAvatar(file: File): Promise<AvatarUploadResponse> {
  try {
    // 验证文件
    if (!file) {
      throw new Error('请选择要上传的图片')
    }

    // 验证文件大小（2MB）
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('文件太大，请选择小于2MB的图片')
    }

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      throw new Error('不支持的文件格式，请上传JPG、PNG或GIF格式')
    }

    console.log('开始上传头像文件:', file.name, file.size, 'bytes')

    // 通过后端上传到阿里云OSS
    const formData = new FormData()
    formData.append('file', file)

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

      console.log('头像上传成功（阿里云OSS）:', responseData.data)
      return responseData.data
    }

    // 直接返回格式 { avatarUrl, thumbnailUrl }
    if ('avatarUrl' in responseData) {
      console.log('头像上传成功（阿里云OSS）:', responseData)
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
