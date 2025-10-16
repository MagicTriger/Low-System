/**
 * 统一通知服务
 * 在页面右上角显示通知弹框
 */

import { notification } from 'ant-design-vue'

export type NotificationType = 'success' | 'info' | 'warning' | 'error'

export interface NotificationOptions {
  message: string
  description?: string
  duration?: number
  type?: NotificationType
  key?: string
}

/**
 * 通知服务类
 */
export class NotificationService {
  private defaultDuration = 4.5 // 默认显示时长（秒）
  private maxCount = 3 // 最多同时显示的通知数量

  constructor() {
    // 配置全局通知设置
    notification.config({
      placement: 'topRight',
      top: '24px',
      duration: this.defaultDuration,
      maxCount: this.maxCount,
    })
  }

  /**
   * 显示成功通知
   */
  success(message: string, description?: string, duration?: number): void {
    this.show({
      type: 'success',
      message,
      description,
      duration,
    })
  }

  /**
   * 显示信息通知
   */
  info(message: string, description?: string, duration?: number): void {
    this.show({
      type: 'info',
      message,
      description,
      duration,
    })
  }

  /**
   * 显示警告通知
   */
  warning(message: string, description?: string, duration?: number): void {
    this.show({
      type: 'warning',
      message,
      description,
      duration,
    })
  }

  /**
   * 显示错误通知
   */
  error(message: string, description?: string, duration?: number): void {
    this.show({
      type: 'error',
      message,
      description,
      duration: duration || 6, // 错误通知默认显示更久
    })
  }

  /**
   * 显示通知
   */
  private show(options: NotificationOptions): void {
    const { type = 'info', message, description, duration, key } = options

    const config = {
      message,
      description,
      duration: duration ?? this.defaultDuration,
      key: key || `notification-${Date.now()}`,
    }

    // 根据类型调用对应的方法
    notification[type](config)
  }

  /**
   * 关闭指定通知
   */
  close(key: string): void {
    notification.close(key)
  }

  /**
   * 关闭所有通知
   */
  closeAll(): void {
    notification.destroy()
  }

  /**
   * 显示加载中通知
   */
  loading(message: string, description?: string, key?: string): string {
    const notificationKey = key || `loading-${Date.now()}`

    notification.info({
      message,
      description,
      duration: 0, // 不自动关闭
      key: notificationKey,
      icon: () => {
        // 可以自定义加载图标
        return null
      },
    })

    return notificationKey
  }

  /**
   * 更新通知内容
   */
  update(key: string, options: Partial<NotificationOptions>): void {
    const { type = 'info', message, description, duration } = options

    notification[type]({
      key,
      message: message || '',
      description,
      duration: duration ?? this.defaultDuration,
    })
  }
}

// 创建全局单例
export const notificationService = new NotificationService()

/**
 * 便捷方法 - 成功通知
 */
export function notifySuccess(message: string, description?: string): void {
  notificationService.success(message, description)
}

/**
 * 便捷方法 - 信息通知
 */
export function notifyInfo(message: string, description?: string): void {
  notificationService.info(message, description)
}

/**
 * 便捷方法 - 警告通知
 */
export function notifyWarning(message: string, description?: string): void {
  notificationService.warning(message, description)
}

/**
 * 便捷方法 - 错误通知
 */
export function notifyError(message: string, description?: string): void {
  notificationService.error(message, description)
}

/**
 * 便捷方法 - 网络错误通知
 */
export function notifyNetworkError(error?: any): void {
  const message = '网络请求失败'
  const description = error?.message || '请检查网络连接后重试'
  notificationService.error(message, description)
}

/**
 * 便捷方法 - 权限错误通知
 */
export function notifyPermissionError(resource?: string): void {
  const message = '权限不足'
  const description = resource ? `您没有访问"${resource}"的权限` : '您没有执行此操作的权限'
  notificationService.error(message, description)
}

/**
 * 便捷方法 - 后端错误通知
 */
export function notifyServerError(error?: any): void {
  const message = '服务器错误'
  const description = error?.message || error?.data?.message || '服务器处理请求时发生错误，请稍后重试'
  notificationService.error(message, description)
}
