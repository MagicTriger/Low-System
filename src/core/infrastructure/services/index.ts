/**
 * 基础设施服务导出文件
 * 导出PropertyPanelService和相关辅助函数
 */

export { PropertyPanelService } from './PropertyPanelService'

// 服务单例实例
let propertyPanelServiceInstance: import('./PropertyPanelService').PropertyPanelService | null = null

/**
 * 获取PropertyPanelService单例实例
 * @returns PropertyPanelService实例
 */
export function getPropertyPanelService(): import('./PropertyPanelService').PropertyPanelService {
  if (!propertyPanelServiceInstance) {
    throw new Error('[PropertyPanelService] Service not initialized. Call initializePropertyPanelService() first.')
  }
  return propertyPanelServiceInstance
}

/**
 * 初始化PropertyPanelService
 * @returns PropertyPanelService实例
 */
export async function initializePropertyPanelService(): Promise<import('./PropertyPanelService').PropertyPanelService> {
  if (propertyPanelServiceInstance) {
    console.warn('[PropertyPanelService] Service already initialized')
    return propertyPanelServiceInstance
  }

  const { PropertyPanelService } = await import('./PropertyPanelService')
  propertyPanelServiceInstance = new PropertyPanelService()
  await propertyPanelServiceInstance.initialize()

  return propertyPanelServiceInstance
}

/**
 * 重置PropertyPanelService实例(主要用于测试)
 */
export function resetPropertyPanelService(): void {
  propertyPanelServiceInstance = null
}
