/**
 * 图标库管理器
 * 负责注册、加载和搜索图标
 */

import type { IconDefinition, IconLibrary, IconSearchOptions, IconSearchResult } from './types'

export class IconLibraryManager {
  private libraries: Map<string, IconLibrary> = new Map()
  private iconCache: Map<string, IconDefinition> = new Map()

  /**
   * 注册图标库
   */
  registerLibrary(library: IconLibrary): void {
    this.libraries.set(library.id, library)

    // 缓存图标以便快速查找
    library.icons.forEach(icon => {
      const key = `${library.id}:${icon.name}`
      this.iconCache.set(key, icon)
    })
  }

  /**
   * 获取图标库
   */
  getLibrary(libraryId: string): IconLibrary | null {
    return this.libraries.get(libraryId) || null
  }

  /**
   * 获取所有图标库
   */
  getAllLibraries(): IconLibrary[] {
    return Array.from(this.libraries.values())
  }

  /**
   * 获取图标
   */
  getIcon(libraryId: string, iconName: string): IconDefinition | null {
    const key = `${libraryId}:${iconName}`
    return this.iconCache.get(key) || null
  }

  /**
   * 搜索图标
   */
  searchIcons(options: IconSearchOptions = {}): IconSearchResult {
    const { query = '', category, libraryId, tags = [], page = 1, pageSize = 50 } = options

    let allIcons: IconDefinition[] = []

    // 收集所有图标
    if (libraryId) {
      const library = this.libraries.get(libraryId)
      if (library) {
        allIcons = library.icons
      }
    } else {
      this.libraries.forEach(library => {
        allIcons.push(...library.icons)
      })
    }

    // 过滤图标
    let filteredIcons = allIcons

    // 按分类过滤
    if (category) {
      filteredIcons = filteredIcons.filter(icon => icon.category === category)
    }

    // 按标签过滤
    if (tags.length > 0) {
      filteredIcons = filteredIcons.filter(icon => tags.some(tag => icon.tags.includes(tag)))
    }

    // 按关键词搜索
    if (query) {
      const lowerQuery = query.toLowerCase()
      filteredIcons = filteredIcons.filter(icon => {
        // 搜索名称
        if (icon.name.toLowerCase().includes(lowerQuery)) {
          return true
        }
        // 搜索标签
        if (icon.tags.some(tag => tag.toLowerCase().includes(lowerQuery))) {
          return true
        }
        // 搜索关键词
        if (icon.keywords?.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
          return true
        }
        return false
      })
    }

    // 分页
    const total = filteredIcons.length
    const start = (page - 1) * pageSize
    const end = start + pageSize
    const paginatedIcons = filteredIcons.slice(start, end)

    return {
      icons: paginatedIcons,
      total,
      page,
      pageSize,
    }
  }

  /**
   * 获取所有分类
   */
  getCategories(libraryId?: string): string[] {
    const categories = new Set<string>()

    if (libraryId) {
      const library = this.libraries.get(libraryId)
      if (library) {
        library.icons.forEach(icon => categories.add(icon.category))
      }
    } else {
      this.libraries.forEach(library => {
        library.icons.forEach(icon => categories.add(icon.category))
      })
    }

    return Array.from(categories).sort()
  }

  /**
   * 获取所有标签
   */
  getTags(libraryId?: string): string[] {
    const tags = new Set<string>()

    if (libraryId) {
      const library = this.libraries.get(libraryId)
      if (library) {
        library.icons.forEach(icon => {
          icon.tags.forEach(tag => tags.add(tag))
        })
      }
    } else {
      this.libraries.forEach(library => {
        library.icons.forEach(icon => {
          icon.tags.forEach(tag => tags.add(tag))
        })
      })
    }

    return Array.from(tags).sort()
  }

  /**
   * 懒加载图标库
   */
  async loadLibrary(libraryId: string): Promise<IconLibrary | null> {
    const library = this.libraries.get(libraryId)
    if (!library) {
      console.warn(`Icon library not found: ${libraryId}`)
      return null
    }

    if (library.loaded) {
      return library
    }

    // 这里可以实现异步加载逻辑
    // 例如从CDN加载图标数据
    library.loaded = true
    return library
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.iconCache.clear()
  }
}

// 全局单例
let globalIconLibraryManager: IconLibraryManager | null = null

/**
 * 获取全局图标库管理器
 */
export function getIconLibraryManager(): IconLibraryManager {
  if (!globalIconLibraryManager) {
    globalIconLibraryManager = new IconLibraryManager()
  }
  return globalIconLibraryManager
}

/**
 * 设置全局图标库管理器
 */
export function setIconLibraryManager(manager: IconLibraryManager): void {
  globalIconLibraryManager = manager
}
