/**
 * 图标库系统导出
 */

export * from './types'
export * from './IconLibraryManager'
export * from './CustomIconManager'
export * from './libraries/antd'
// Element Plus 图标库按需导入,不在这里导出

// 初始化图标库
import { getIconLibraryManager } from './IconLibraryManager'
import { getCustomIconManager } from './CustomIconManager'
import { createAntdIconLibrary } from './libraries/antd'

/**
 * 初始化默认图标库
 */
export async function initializeIconLibraries(): Promise<void> {
  const manager = getIconLibraryManager()
  const customManager = getCustomIconManager()

  // 注册Ant Design图标库
  const antdLibrary = createAntdIconLibrary()
  manager.registerLibrary(antdLibrary)

  // 注册Element Plus图标库(异步,动态导入)
  try {
    // 动态导入 Element Plus 图标库,避免在未安装时报错
    const { createElementIconLibrary } = await import('./libraries/element')
    const elementLibrary = await createElementIconLibrary()
    if (elementLibrary.icons.length > 0) {
      manager.registerLibrary(elementLibrary)
      console.log('✅ Element Plus Icons loaded')
    }
  } catch (error) {
    console.warn('⚠️ Element Plus Icons not available. Install with: npm install @element-plus/icons-vue')
  }

  // 注册自定义图标库
  const customLibrary = customManager.createCustomLibrary()
  manager.registerLibrary(customLibrary)

  console.log('✅ Icon libraries initialized')
  console.log(
    `📦 Loaded libraries: ${manager
      .getAllLibraries()
      .map(lib => lib.name)
      .join(', ')}`
  )
}
