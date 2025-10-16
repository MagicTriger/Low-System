/**
 * Element Plus Icons 图标库
 */

import type { IconLibrary } from '../types'

/**
 * 创建Element Plus图标库
 * 注意: 需要安装 @element-plus/icons-vue
 */
export async function createElementIconLibrary(): Promise<IconLibrary> {
  try {
    // 动态导入 Element Plus 图标
    const ElementIcons = await import('@element-plus/icons-vue')

    const icons = Object.entries(ElementIcons)
      .filter(([name]) => name !== 'default') // 过滤掉 default 导出
      .map(([name, component]) => {
        let category = '通用'
        let tags: string[] = ['element', 'element-plus']

        // 根据图标名称分类
        if (name.includes('Arrow') || name.includes('Top') || name.includes('Bottom') || name.includes('Back') || name.includes('Right')) {
          category = '方向'
          tags.push('direction', '方向')
        } else if (
          name.includes('Check') ||
          name.includes('Close') ||
          name.includes('Info') ||
          name.includes('Warning') ||
          name.includes('Error') ||
          name.includes('Success')
        ) {
          category = '提示'
          tags.push('feedback', '提示')
        } else if (name.includes('Document') || name.includes('Folder') || name.includes('Files') || name.includes('Delete')) {
          category = '文件'
          tags.push('file', '文件')
        } else if (name.includes('User') || name.includes('Avatar') || name.includes('People')) {
          category = '用户'
          tags.push('user', '用户')
        } else if (name.includes('Setting') || name.includes('Tools') || name.includes('Operation')) {
          category = '设置'
          tags.push('setting', '设置')
        } else if (name.includes('Edit') || name.includes('Pen') || name.includes('Brush')) {
          category = '编辑'
          tags.push('edit', '编辑')
        } else if (name.includes('Chart') || name.includes('Data') || name.includes('Histogram') || name.includes('Pie')) {
          category = '图表'
          tags.push('chart', '图表')
        } else if (name.includes('Lock') || name.includes('Unlock') || name.includes('Key')) {
          category = '安全'
          tags.push('security', '安全')
        } else if (name.includes('Location') || name.includes('Place') || name.includes('Position')) {
          category = '地图'
          tags.push('map', '地图')
        } else if (name.includes('Message') || name.includes('Chat') || name.includes('Comment')) {
          category = '通讯'
          tags.push('communication', '通讯')
        }

        // 生成搜索关键词
        const keywords = [name.toLowerCase(), ...tags]

        return {
          name,
          category,
          tags,
          keywords,
          component: component as any,
        }
      })

    return {
      id: 'element',
      name: 'Element Plus Icons',
      version: '1.0.0',
      description: 'Element Plus 官方图标库',
      icons,
      loaded: true,
    }
  } catch (error) {
    console.warn('Element Plus Icons not installed. Please run: npm install @element-plus/icons-vue')
    return {
      id: 'element',
      name: 'Element Plus Icons',
      version: '1.0.0',
      description: 'Element Plus 官方图标库 (未安装)',
      icons: [],
      loaded: false,
    }
  }
}
