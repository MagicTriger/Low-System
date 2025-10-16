import type { RootView } from '@/types'

/**
 * 持久化服务
 * 负责保存和加载设计器数据
 * 支持按资源 URL 独立存储数据
 */
export class PersistenceService {
  private storageKeyPrefix = 'designer_data'
  private autoSaveInterval: number | null = null
  private autoSaveDelay = 2000 // 2秒自动保存
  private currentResourceUrl: string | null = null

  /**
   * 设置当前资源 URL
   */
  setResourceUrl(url: string): void {
    this.currentResourceUrl = url
    console.log(`✅ [Persistence] Resource URL set to: ${url}`)
  }

  /**
   * 获取存储键
   */
  private getStorageKey(resourceUrl?: string): string {
    const url = resourceUrl || this.currentResourceUrl
    if (!url) {
      // 如果没有指定资源 URL，使用默认键（向后兼容）
      return this.storageKeyPrefix
    }
    return `${this.storageKeyPrefix}_${url}`
  }

  /**
   * 保存设计数据到localStorage
   * @param data 设计数据
   * @param resourceUrl 可选的资源 URL，如果不提供则使用当前设置的 URL
   */
  saveToLocal(
    data: {
      view: RootView
      dataSources?: Record<string, any>
      dataFlows?: Record<string, any>
      dataActions?: Record<string, any>
    },
    resourceUrl?: string
  ): void {
    try {
      const storageKey = this.getStorageKey(resourceUrl)
      const serialized = JSON.stringify({
        ...data,
        timestamp: Date.now(),
        version: '1.0.0',
        resourceUrl: resourceUrl || this.currentResourceUrl,
      })
      localStorage.setItem(storageKey, serialized)
      console.log(`✅ [Persistence] Data saved to localStorage with key: ${storageKey}`)
    } catch (error) {
      console.error('❌ [Persistence] Failed to save:', error)
    }
  }

  /**
   * 从localStorage加载设计数据
   * @param resourceUrl 可选的资源 URL，如果不提供则使用当前设置的 URL
   */
  loadFromLocal(resourceUrl?: string): any | null {
    try {
      const storageKey = this.getStorageKey(resourceUrl)
      const serialized = localStorage.getItem(storageKey)
      if (!serialized) {
        console.log(`ℹ️ [Persistence] No data found for key: ${storageKey}`)
        return null
      }

      const data = JSON.parse(serialized)
      console.log(`✅ [Persistence] Data loaded from localStorage with key: ${storageKey}`)
      return data
    } catch (error) {
      console.error('❌ [Persistence] Failed to load:', error)
      return null
    }
  }

  /**
   * 启动自动保存
   */
  startAutoSave(callback: () => void): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
    }

    this.autoSaveInterval = window.setInterval(() => {
      callback()
    }, this.autoSaveDelay)

    console.log('✅ [Persistence] Auto-save started')
  }

  /**
   * 停止自动保存
   */
  stopAutoSave(): void {
    if (this.autoSaveInterval) {
      clearInterval(this.autoSaveInterval)
      this.autoSaveInterval = null
      console.log('✅ [Persistence] Auto-save stopped')
    }
  }

  /**
   * 清除本地数据
   * @param resourceUrl 可选的资源 URL，如果不提供则使用当前设置的 URL
   */
  clearLocal(resourceUrl?: string): void {
    const storageKey = this.getStorageKey(resourceUrl)
    localStorage.removeItem(storageKey)
    console.log(`✅ [Persistence] Local data cleared for key: ${storageKey}`)
  }

  /**
   * 清除所有资源的数据
   */
  clearAllLocal(): void {
    const keys = Object.keys(localStorage)
    const designerKeys = keys.filter(key => key.startsWith(this.storageKeyPrefix))
    designerKeys.forEach(key => localStorage.removeItem(key))
    console.log(`✅ [Persistence] All designer data cleared (${designerKeys.length} items)`)
  }

  /**
   * 导出为JSON文件
   */
  exportToFile(data: any, filename: string = 'design.json'): void {
    try {
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      console.log('✅ [Persistence] Data exported to file')
    } catch (error) {
      console.error('❌ [Persistence] Failed to export:', error)
    }
  }

  /**
   * 从JSON文件导入
   */
  async importFromFile(file: File): Promise<any | null> {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      console.log('✅ [Persistence] Data imported from file')
      return data
    } catch (error) {
      console.error('❌ [Persistence] Failed to import:', error)
      return null
    }
  }
}
