import type { Control, DataBinding, DataErrorType, DataSourceOption } from '@/types'
import { DataError } from '@/types'
import { DataFlowEngine } from './DataFlowEngine'
import { dataSourceService } from '@/core/services/DataSourceService'

/**
 * 数据绑定执行器
 * 负责在运行时执行数据绑定
 */
export class DataBindingExecutor {
  private dataFlowEngine: DataFlowEngine
  private subscriptions: Map<string, () => void> = new Map()
  private dataSourceManager: any // 需要注入
  private dataFlowManager: any // 需要注入

  constructor(dataSourceManager?: any, dataFlowManager?: any) {
    this.dataFlowEngine = new DataFlowEngine()
    this.dataSourceManager = dataSourceManager
    this.dataFlowManager = dataFlowManager
  }

  /**
   * 绑定组件
   */
  async bindControl(control: Control, binding: DataBinding): Promise<void> {
    try {
      // 根据绑定类型执行不同的绑定逻辑
      switch (binding.bindingType) {
        case 'direct':
          await this.bindDirect(control, binding)
          break
        case 'dataflow':
          await this.bindDataFlow(control, binding)
          break
        case 'manual':
          // 手动绑定不自动加载
          break
        default:
          // 默认为直接绑定
          await this.bindDirect(control, binding)
      }

      // 设置自动刷新
      if (binding.autoLoad && binding.refreshInterval) {
        this.setupAutoRefresh(control.id, binding.refreshInterval)
      }
    } catch (error) {
      throw new DataError('BINDING_ERROR' as DataErrorType, `绑定失败: ${error}`, { control, binding, error })
    }
  }

  /**
   * 直接绑定
   */
  private async bindDirect(control: Control, binding: DataBinding): Promise<void> {
    if (!this.dataSourceManager) {
      console.warn('DataSourceManager not available')
      return
    }

    // 从数据源获取数据
    const data = await this.fetchDataFromSource(binding.source)

    // 应用数据到组件
    this.applyDataToControl(control, data, binding.propertyPath)

    // 监听数据源变化
    if (binding.autoLoad) {
      this.watchDataSource(binding.source, newData => {
        this.applyDataToControl(control, newData, binding.propertyPath)
      })
    }
  }

  /**
   * 数据流绑定
   */
  private async bindDataFlow(control: Control, binding: DataBinding): Promise<void> {
    if (!this.dataSourceManager || !this.dataFlowManager) {
      console.warn('DataSourceManager or DataFlowManager not available')
      return
    }

    if (!binding.dataFlowId) {
      throw new Error('数据流ID未指定')
    }

    // 获取数据流配置
    const dataFlow = this.dataFlowManager.getDataFlow(binding.dataFlowId)
    if (!dataFlow) {
      throw new Error(`数据流不存在: ${binding.dataFlowId}`)
    }

    // 从数据源获取数据
    const sourceData = await this.fetchDataFromSource(dataFlow.sourceId)

    // 执行数据流转换
    const transformedData = await this.dataFlowEngine.execute(dataFlow, sourceData)

    // 应用数据到组件
    this.applyDataToControl(control, transformedData, binding.propertyPath)

    // 监听数据源变化
    if (binding.autoLoad) {
      this.watchDataSource(dataFlow.sourceId, async newData => {
        const transformed = await this.dataFlowEngine.execute(dataFlow, newData)
        this.applyDataToControl(control, transformed, binding.propertyPath)
      })
    }
  }

  /**
   * 解绑组件
   */
  unbindControl(controlId: string): void {
    const cleanup = this.subscriptions.get(controlId)
    if (cleanup) {
      cleanup()
      this.subscriptions.delete(controlId)
    }
  }

  /**
   * 刷新绑定数据
   */
  async refreshBinding(controlId: string, control: Control, binding: DataBinding): Promise<void> {
    await this.bindControl(control, binding)
  }

  /**
   * 设置自动刷新
   */
  private setupAutoRefresh(controlId: string, interval: number): void {
    const timerId = setInterval(() => {
      // 触发刷新逻辑
      console.log(`Auto refresh for control: ${controlId}`)
    }, interval)

    // 保存清理函数
    const existingCleanup = this.subscriptions.get(controlId)
    this.subscriptions.set(controlId, () => {
      clearInterval(timerId)
      existingCleanup?.()
    })
  }

  /**
   * 应用数据到组件
   */
  private applyDataToControl(control: Control, data: any, propertyPath?: string): void {
    let targetData = data

    // 如果指定了属性路径，提取对应的数据
    if (propertyPath) {
      targetData = this.getNestedValue(data, propertyPath)
    }

    // 根据组件类型应用数据
    // 这里需要根据实际的组件类型来处理
    if (control.kind === 'Table') {
      control.dataSource = targetData
    } else if (control.kind === 'List') {
      control.items = targetData
    } else if (control.kind === 'Span') {
      control.text = targetData
    } else {
      // 默认设置到data属性
      control.data = targetData
    }
  }

  /**
   * 监听数据源变化
   */
  private watchDataSource(sourceId: string, callback: (data: any) => void): () => void {
    // 这里需要实现数据源的监听逻辑
    // 返回清理函数
    return () => {
      // 清理监听
    }
  }

  /**
   * 从数据源获取数据
   */
  private async fetchDataFromSource(sourceId: string): Promise<any> {
    if (!this.dataSourceManager) {
      throw new Error('DataSourceManager未初始化')
    }

    // 从数据源管理器获取数据源配置
    const dataSource = this.dataSourceManager.getDataSource?.(sourceId)
    if (!dataSource) {
      throw new Error(`数据源不存在: ${sourceId}`)
    }

    // 使用数据源服务获取数据
    try {
      const data = await dataSourceService.fetchData(dataSource)
      return data
    } catch (error: any) {
      throw new Error(`获取数据失败: ${error.message}`)
    }
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }
}
