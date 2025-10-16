import type { BaseControlDefinition as ControlDefinition } from './base'
import { ControlType } from './base'

// 控件类型信息
export interface ControlTypeInfo {
  type: ControlType
  name: string
  icon: string
  description?: string
}

// 控件类型信息映射
export const ControlTypeInfos: ControlTypeInfo[] = [
  {
    type: ControlType.Common,
    name: '基础组件',
    icon: 'component',
    description: '常用的基础UI组件',
  },
  {
    type: ControlType.Input,
    name: '输入组件',
    icon: 'input',
    description: '表单输入相关组件',
  },
  {
    type: ControlType.Container,
    name: '容器组件',
    icon: 'container',
    description: '布局和容器组件',
  },
  {
    type: ControlType.Collection,
    name: '集合组件',
    icon: 'table',
    description: '数据展示和集合组件',
  },
  {
    type: ControlType.Chart,
    name: '图表组件',
    icon: 'chart',
    description: '数据可视化图表组件',
  },
  {
    type: ControlType.BI,
    name: '大屏组件',
    icon: 'dashboard',
    description: '数据大屏专用组件',
  },
  {
    type: ControlType.SVG,
    name: 'SVG组件',
    icon: 'svg',
    description: '矢量图形组件',
  },
  {
    type: ControlType.Mobile,
    name: '移动端组件',
    icon: 'mobile',
    description: '移动端专用组件',
  },
  {
    type: ControlType.Custom,
    name: '自定义组件',
    icon: 'custom',
    description: '用户自定义组件',
  },
]

// 控件定义注册表
export const ControlDefinitions: Record<string, ControlDefinition> = {}

/**
 * 注册控件定义
 */
export function registerControlDefinition(definition: ControlDefinition): void {
  if (ControlDefinitions[definition.kind]) {
    console.warn(`控件定义 ${definition.kind} 已存在，将被覆盖`)
  }

  ControlDefinitions[definition.kind] = definition
  console.log(`✅ Registered control definition: ${definition.kind}`)

  // 自动注册面板配置到PropertyPanelService
  if (definition.panels) {
    try {
      // 动态导入PropertyPanelService以避免循环依赖
      import('../infrastructure/services')
        .then(({ getPropertyPanelService }) => {
          try {
            const service = getPropertyPanelService()

            // 将ComponentPanelDefinition转换为ComponentPanelConfig
            const panelConfig = {
              componentType: definition.kind,
              panels: definition.panels?.custom || [],
              extends: definition.panels?.extends?.map(name => {
                // 将字符串转换为PanelGroup枚举
                const groupMap: Record<string, string> = {
                  basic: 'basic',
                  layout: 'layout',
                  style: 'style',
                  event: 'event',
                }
                return groupMap[name] || name
              }) as any[],
            }

            // 注册组件面板配置
            service.registerComponentPanel(panelConfig)

            console.log(`  ✓ Registered panels for ${definition.kind}`)
          } catch (error) {
            // PropertyPanelService可能还未初始化,这是正常的
            console.debug(`  ℹ️  PropertyPanelService not yet initialized for ${definition.kind}`)
          }
        })
        .catch(error => {
          console.debug(`  ℹ️  Failed to load PropertyPanelService for ${definition.kind}:`, error)
        })
    } catch (error) {
      console.debug(`  ℹ️  Could not register panels for ${definition.kind}:`, error)
    }
  }
}

/**
 * 批量注册控件定义
 */
export function registerControlDefinitions(definitions: ControlDefinition[]): void {
  console.log(`📋 registerControlDefinitions called with ${definitions.length} definitions`)
  definitions.forEach(definition => {
    registerControlDefinition(definition)
  })
  console.log(`✅ Total registered controls: ${Object.keys(ControlDefinitions).length}`)
}

/**
 * 获取控件定义
 */
export function getControlDefinition(kind: string): ControlDefinition | null {
  return ControlDefinitions[kind] || null
}

/**
 * 获取所有控件定义
 */
export function getAllControlDefinitions(): ControlDefinition[] {
  return Object.values(ControlDefinitions)
}

/**
 * 按类型获取控件定义
 */
export function getControlDefinitionsByType(type: ControlType): ControlDefinition[] {
  return Object.values(ControlDefinitions).filter(def => def.type === type)
}

/**
 * 搜索控件定义
 */
export function searchControlDefinitions(keyword: string): ControlDefinition[] {
  const lowerKeyword = keyword.toLowerCase()
  return Object.values(ControlDefinitions).filter(
    def => def.kindName.toLowerCase().includes(lowerKeyword) || def.kind.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 验证控件定义
 */
export function validateControlDefinition(definition: ControlDefinition): string[] {
  const errors: string[] = []

  if (!definition.kind) {
    errors.push('控件类型(kind)不能为空')
  }

  if (!definition.kindName) {
    errors.push('控件名称(kindName)不能为空')
  }

  if (!definition.component) {
    errors.push('控件组件(component)不能为空')
  }

  if (!Object.values(ControlTypeInfos).some(info => info.type === definition.type)) {
    errors.push(`无效的控件类型: ${definition.type}`)
  }

  return errors
}

/**
 * 移除控件定义
 */
export function unregisterControlDefinition(kind: string): boolean {
  if (ControlDefinitions[kind]) {
    delete ControlDefinitions[kind]
    return true
  }
  return false
}

/**
 * 清空所有控件定义
 */
export function clearControlDefinitions(): void {
  Object.keys(ControlDefinitions).forEach(kind => {
    delete ControlDefinitions[kind]
  })
}

/**
 * 获取控件定义统计信息
 */
export function getControlDefinitionStats(): Record<ControlType, number> {
  const stats = {} as Record<ControlType, number>

  ControlTypeInfos.forEach(info => {
    stats[info.type] = 0
  })

  Object.values(ControlDefinitions).forEach(def => {
    stats[def.type] = (stats[def.type] || 0) + 1
  })

  return stats
}
