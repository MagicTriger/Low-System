/**
 * Ant Design Icons 图标库
 */

import type { IconLibrary } from '../types'
import * as AntdIcons from '@ant-design/icons-vue'

/**
 * 创建Ant Design图标库
 */
export function createAntdIconLibrary(): IconLibrary {
  const icons = Object.entries(AntdIcons)
    .filter(([name]) => name.endsWith('Outlined') || name.endsWith('Filled') || name.endsWith('TwoTone'))
    .map(([name, component]) => {
      // 解析图标名称和类型
      let iconName = name
      let category = '通用'
      let tags: string[] = []

      if (name.endsWith('Outlined')) {
        iconName = name.replace('Outlined', '')
        tags.push('outlined', '线框')
      } else if (name.endsWith('Filled')) {
        iconName = name.replace('Filled', '')
        tags.push('filled', '填充')
      } else if (name.endsWith('TwoTone')) {
        iconName = name.replace('TwoTone', '')
        tags.push('twotone', '双色')
      }

      // 根据图标名称分类
      if (
        iconName.includes('Arrow') ||
        iconName.includes('Up') ||
        iconName.includes('Down') ||
        iconName.includes('Left') ||
        iconName.includes('Right')
      ) {
        category = '方向'
        tags.push('direction', '方向')
      } else if (
        iconName.includes('Check') ||
        iconName.includes('Close') ||
        iconName.includes('Info') ||
        iconName.includes('Warning') ||
        iconName.includes('Error')
      ) {
        category = '提示'
        tags.push('feedback', '提示')
      } else if (iconName.includes('File') || iconName.includes('Folder') || iconName.includes('Copy') || iconName.includes('Delete')) {
        category = '文件'
        tags.push('file', '文件')
      } else if (iconName.includes('User') || iconName.includes('Team') || iconName.includes('Contact')) {
        category = '用户'
        tags.push('user', '用户')
      } else if (iconName.includes('Setting') || iconName.includes('Tool') || iconName.includes('Control')) {
        category = '设置'
        tags.push('setting', '设置')
      } else if (iconName.includes('Edit') || iconName.includes('Form') || iconName.includes('Input')) {
        category = '编辑'
        tags.push('edit', '编辑')
      } else if (iconName.includes('Chart') || iconName.includes('Bar') || iconName.includes('Pie') || iconName.includes('Line')) {
        category = '图表'
        tags.push('chart', '图表')
      } else if (iconName.includes('Lock') || iconName.includes('Unlock') || iconName.includes('Safety')) {
        category = '安全'
        tags.push('security', '安全')
      }

      // 生成搜索关键词
      const keywords = [
        iconName.toLowerCase(),
        ...tags,
        // 添加拼音首字母（简化版）
      ]

      return {
        name,
        category,
        tags,
        keywords,
        component: component as any,
      }
    })

  return {
    id: 'antd',
    name: 'Ant Design Icons',
    version: '1.0.0',
    description: 'Ant Design 官方图标库',
    icons,
    loaded: true,
  }
}
