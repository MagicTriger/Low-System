import type { DataBinding, ComponentBinding } from '@/types'

/**
 * 数据绑定管理器
 * 负责管理组件与数据源/数据流的绑定关系
 */
export class DataBindingManager {
  private bindings: Map<string, ComponentBinding> = new Map()

  /**
   * 创建绑定
   */
  createBinding(controlId: string, controlName: string, controlKind: string, binding: DataBinding): void {
    const componentBinding: ComponentBinding = {
      controlId,
      controlName,
      controlKind,
      binding,
    }
    this.bindings.set(controlId, componentBinding)
  }

  /**
   * 更新绑定
   */
  updateBinding(controlId: string, updates: Partial<DataBinding>): void {
    const existing = this.bindings.get(controlId)
    if (existing) {
      existing.binding = {
        ...existing.binding,
        ...updates,
      }
    }
  }

  /**
   * 删除绑定
   */
  removeBinding(controlId: string): void {
    this.bindings.delete(controlId)
  }

  /**
   * 获取绑定
   */
  getBinding(controlId: string): DataBinding | undefined {
    return this.bindings.get(controlId)?.binding
  }

  /**
   * 获取组件绑定信息
   */
  getComponentBinding(controlId: string): ComponentBinding | undefined {
    return this.bindings.get(controlId)
  }

  /**
   * 获取数据源的所有绑定
   */
  getBindingsBySource(sourceId: string): ComponentBinding[] {
    const result: ComponentBinding[] = []
    this.bindings.forEach(binding => {
      if (binding.binding.source === sourceId) {
        result.push(binding)
      }
    })
    return result
  }

  /**
   * 获取数据流的所有绑定
   */
  getBindingsByDataFlow(flowId: string): ComponentBinding[] {
    const result: ComponentBinding[] = []
    this.bindings.forEach(binding => {
      if (binding.binding.dataFlowId === flowId) {
        result.push(binding)
      }
    })
    return result
  }

  /**
   * 获取所有绑定
   */
  getAllBindings(): ComponentBinding[] {
    return Array.from(this.bindings.values())
  }

  /**
   * 清空所有绑定
   */
  clear(): void {
    this.bindings.clear()
  }
}
