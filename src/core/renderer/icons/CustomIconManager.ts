/**
 * 自定义图标管理器
 * 支持用户添加自定义图标
 */

import { h, defineComponent } from 'vue'
import type { IconDefinition, IconLibrary } from './types'

export interface CustomIcon {
  id: string
  name: string
  svg: string
  category: string
  tags: string[]
  createdAt: number
  updatedAt: number
}

export class CustomIconManager {
  private static STORAGE_KEY = 'custom_icons'
  private customIcons: Map<string, CustomIcon> = new Map()

  constructor() {
    this.loadFromStorage()
  }

  /**
   * 添加自定义图标
   */
  addIcon(icon: Omit<CustomIcon, 'id' | 'createdAt' | 'updatedAt'>): CustomIcon {
    const id = this.generateId()
    const now = Date.now()

    const customIcon: CustomIcon = {
      ...icon,
      id,
      createdAt: now,
      updatedAt: now,
    }

    this.customIcons.set(id, customIcon)
    this.saveToStorage()

    return customIcon
  }

  /**
   * 更新自定义图标
   */
  updateIcon(id: string, updates: Partial<Omit<CustomIcon, 'id' | 'createdAt'>>): CustomIcon | null {
    const icon = this.customIcons.get(id)
    if (!icon) {
      return null
    }

    const updatedIcon: CustomIcon = {
      ...icon,
      ...updates,
      updatedAt: Date.now(),
    }

    this.customIcons.set(id, updatedIcon)
    this.saveToStorage()

    return updatedIcon
  }

  /**
   * 删除自定义图标
   */
  deleteIcon(id: string): boolean {
    const deleted = this.customIcons.delete(id)
    if (deleted) {
      this.saveToStorage()
    }
    return deleted
  }

  /**
   * 获取自定义图标
   */
  getIcon(id: string): CustomIcon | null {
    return this.customIcons.get(id) || null
  }

  /**
   * 获取所有自定义图标
   */
  getAllIcons(): CustomIcon[] {
    return Array.from(this.customIcons.values())
  }

  /**
   * 从SVG字符串创建图标
   */
  addIconFromSvg(name: string, svg: string, category: string = '自定义', tags: string[] = []): CustomIcon {
    return this.addIcon({
      name,
      svg,
      category,
      tags: ['custom', '自定义', ...tags],
    })
  }

  /**
   * 从URL导入图标
   */
  async addIconFromUrl(name: string, url: string, category: string = '自定义', tags: string[] = []): Promise<CustomIcon> {
    try {
      const response = await fetch(url)
      const svg = await response.text()

      if (!svg.includes('<svg')) {
        throw new Error('Invalid SVG content')
      }

      return this.addIconFromSvg(name, svg, category, tags)
    } catch (error) {
      throw new Error(`Failed to load icon from URL: ${error}`)
    }
  }

  /**
   * 批量导入图标
   */
  async importIcons(icons: Array<Omit<CustomIcon, 'id' | 'createdAt' | 'updatedAt'>>): Promise<CustomIcon[]> {
    const imported: CustomIcon[] = []

    for (const icon of icons) {
      try {
        const customIcon = this.addIcon(icon)
        imported.push(customIcon)
      } catch (error) {
        console.error(`Failed to import icon ${icon.name}:`, error)
      }
    }

    return imported
  }

  /**
   * 导出所有自定义图标
   */
  exportIcons(): CustomIcon[] {
    return this.getAllIcons()
  }

  /**
   * 导出为JSON
   */
  exportAsJson(): string {
    return JSON.stringify(this.exportIcons(), null, 2)
  }

  /**
   * 从JSON导入
   */
  async importFromJson(json: string): Promise<CustomIcon[]> {
    try {
      const icons = JSON.parse(json) as CustomIcon[]
      return await this.importIcons(icons)
    } catch (error) {
      throw new Error(`Failed to import from JSON: ${error}`)
    }
  }

  /**
   * 创建自定义图标库
   */
  createCustomLibrary(): IconLibrary {
    const icons: IconDefinition[] = this.getAllIcons().map(customIcon => ({
      name: customIcon.name,
      category: customIcon.category,
      tags: customIcon.tags,
      keywords: [customIcon.name.toLowerCase(), ...customIcon.tags],
      component: this.createSvgComponent(customIcon.svg),
      svg: customIcon.svg,
    }))

    return {
      id: 'custom',
      name: '自定义图标',
      version: '1.0.0',
      description: '用户自定义图标库',
      icons,
      loaded: true,
    }
  }

  /**
   * 从SVG字符串创建Vue组件
   */
  private createSvgComponent(svg: string) {
    return defineComponent({
      name: 'CustomIcon',
      setup() {
        return () => h('span', { innerHTML: svg, class: 'custom-icon' })
      },
    })
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * 保存到本地存储
   */
  private saveToStorage(): void {
    try {
      const data = JSON.stringify(Array.from(this.customIcons.values()))
      localStorage.setItem(CustomIconManager.STORAGE_KEY, data)
    } catch (error) {
      console.error('Failed to save custom icons:', error)
    }
  }

  /**
   * 从本地存储加载
   */
  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem(CustomIconManager.STORAGE_KEY)
      if (data) {
        const icons = JSON.parse(data) as CustomIcon[]
        icons.forEach(icon => {
          this.customIcons.set(icon.id, icon)
        })
      }
    } catch (error) {
      console.error('Failed to load custom icons:', error)
    }
  }

  /**
   * 清空所有自定义图标
   */
  clear(): void {
    this.customIcons.clear()
    this.saveToStorage()
  }
}

// 全局单例
let globalCustomIconManager: CustomIconManager | null = null

/**
 * 获取全局自定义图标管理器
 */
export function getCustomIconManager(): CustomIconManager {
  if (!globalCustomIconManager) {
    globalCustomIconManager = new CustomIconManager()
  }
  return globalCustomIconManager
}

/**
 * 设置全局自定义图标管理器
 */
export function setCustomIconManager(manager: CustomIconManager): void {
  globalCustomIconManager = manager
}
