import type { DataAction, ActionConfig } from '@/types'

/**
 * 数据操作管理器
 * 负责管理数据操作的创建、更新、删除
 */
export class DataActionManager {
  private dataActions: Map<string, DataAction> = new Map()

  /**
   * 创建数据操作
   */
  createDataAction(config: Partial<DataAction>): DataAction {
    const now = Date.now()
    const dataAction: DataAction = {
      id: config.id || `action_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name || '新数据操作',
      description: config.description,
      type: config.type || 'read',
      sourceId: config.sourceId || '',
      config: config.config || ({ type: 'read' } as ActionConfig),
      enabled: config.enabled !== undefined ? config.enabled : true,
      createdAt: now,
      updatedAt: now,
    }
    this.dataActions.set(dataAction.id, dataAction)
    return dataAction
  }

  /**
   * 更新数据操作
   */
  updateDataAction(id: string, updates: Partial<DataAction>): void {
    const dataAction = this.dataActions.get(id)
    if (dataAction) {
      Object.assign(dataAction, updates, { updatedAt: Date.now() })
    }
  }

  /**
   * 删除数据操作
   */
  deleteDataAction(id: string): void {
    this.dataActions.delete(id)
  }

  /**
   * 获取数据操作
   */
  getDataAction(id: string): DataAction | undefined {
    return this.dataActions.get(id)
  }

  /**
   * 获取所有数据操作
   */
  getAllDataActions(): DataAction[] {
    return Array.from(this.dataActions.values())
  }

  /**
   * 按类型获取数据操作
   */
  getDataActionsByType(type: 'create' | 'read' | 'update' | 'delete'): DataAction[] {
    return this.getAllDataActions().filter(action => action.type === type)
  }

  /**
   * 获取数据源的所有数据操作
   */
  getDataActionsBySource(sourceId: string): DataAction[] {
    return this.getAllDataActions().filter(action => action.sourceId === sourceId)
  }

  /**
   * 清空所有数据操作
   */
  clear(): void {
    this.dataActions.clear()
  }
}
