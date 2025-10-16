import type { DataFlow, DataTransform, TransformConfig } from '@/types'

/**
 * 数据流管理器
 * 负责管理数据流的创建、更新、删除和执行
 */
export class DataFlowManager {
  private dataFlows: Map<string, DataFlow> = new Map()

  /**
   * 创建数据流
   */
  createDataFlow(config: Partial<DataFlow>): DataFlow {
    const now = Date.now()
    const dataFlow: DataFlow = {
      id: config.id || `flow_${now}_${Math.random().toString(36).substr(2, 9)}`,
      name: config.name || '新数据流',
      description: config.description,
      sourceId: config.sourceId || '',
      transforms: config.transforms || [],
      enabled: config.enabled !== undefined ? config.enabled : true,
      createdAt: now,
      updatedAt: now,
    }
    this.dataFlows.set(dataFlow.id, dataFlow)
    return dataFlow
  }

  /**
   * 更新数据流
   */
  updateDataFlow(id: string, updates: Partial<DataFlow>): void {
    const dataFlow = this.dataFlows.get(id)
    if (dataFlow) {
      Object.assign(dataFlow, updates, { updatedAt: Date.now() })
    }
  }

  /**
   * 删除数据流
   */
  deleteDataFlow(id: string): void {
    this.dataFlows.delete(id)
  }

  /**
   * 获取数据流
   */
  getDataFlow(id: string): DataFlow | undefined {
    return this.dataFlows.get(id)
  }

  /**
   * 获取所有数据流
   */
  getAllDataFlows(): DataFlow[] {
    return Array.from(this.dataFlows.values())
  }

  /**
   * 获取数据源的所有数据流
   */
  getDataFlowsBySource(sourceId: string): DataFlow[] {
    return this.getAllDataFlows().filter(flow => flow.sourceId === sourceId)
  }

  /**
   * 添加转换步骤
   */
  addTransform(flowId: string, transform: DataTransform): void {
    const dataFlow = this.dataFlows.get(flowId)
    if (dataFlow) {
      dataFlow.transforms.push(transform)
      dataFlow.updatedAt = Date.now()
    }
  }

  /**
   * 移除转换步骤
   */
  removeTransform(flowId: string, transformId: string): void {
    const dataFlow = this.dataFlows.get(flowId)
    if (dataFlow) {
      dataFlow.transforms = dataFlow.transforms.filter(t => t.id !== transformId)
      dataFlow.updatedAt = Date.now()
    }
  }

  /**
   * 更新转换步骤
   */
  updateTransform(flowId: string, transformId: string, config: TransformConfig): void {
    const dataFlow = this.dataFlows.get(flowId)
    if (dataFlow) {
      const transform = dataFlow.transforms.find(t => t.id === transformId)
      if (transform) {
        transform.config = config
        dataFlow.updatedAt = Date.now()
      }
    }
  }

  /**
   * 重新排序转换步骤
   */
  reorderTransforms(flowId: string, transformIds: string[]): void {
    const dataFlow = this.dataFlows.get(flowId)
    if (dataFlow) {
      const transformMap = new Map(dataFlow.transforms.map(t => [t.id, t]))
      dataFlow.transforms = transformIds.map(id => transformMap.get(id)!).filter(Boolean)
      dataFlow.updatedAt = Date.now()
    }
  }

  /**
   * 清空所有数据流
   */
  clear(): void {
    this.dataFlows.clear()
  }
}
