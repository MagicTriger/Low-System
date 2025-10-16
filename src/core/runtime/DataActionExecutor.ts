import type {
  DataAction,
  CreateActionConfig,
  ReadActionConfig,
  UpdateActionConfig,
  DeleteActionConfig,
  EventExecution,
  DataErrorType,
  DataSourceOption,
} from '@/types'
import { DataError } from '@/types'
import { dataSourceService } from '@/core/services/DataSourceService'

/**
 * 数据操作执行器
 * 负责执行数据操作（CRUD）
 */
export class DataActionExecutor {
  private dataSourceManager: any // 需要注入

  constructor(dataSourceManager?: any) {
    this.dataSourceManager = dataSourceManager
  }

  /**
   * 执行数据操作
   */
  async execute(action: DataAction, context?: any): Promise<any> {
    try {
      if (!action.enabled) {
        throw new Error('数据操作未启用')
      }

      let result: any

      switch (action.type) {
        case 'create':
          result = await this.executeCreate(action, context)
          break
        case 'read':
          result = await this.executeRead(action, context)
          break
        case 'update':
          result = await this.executeUpdate(action, context)
          break
        case 'delete':
          result = await this.executeDelete(action, context)
          break
        default:
          throw new Error(`不支持的操作类型: ${action.type}`)
      }

      // 执行成功回调
      const config = action.config as any
      if (config.onSuccess) {
        await this.executeCallbacks(config.onSuccess, result)
      }

      return result
    } catch (error) {
      // 执行失败回调
      const config = action.config as any
      if (config.onError) {
        await this.executeCallbacks(config.onError, error)
      }

      throw new DataError('ACTION_EXECUTION_ERROR' as DataErrorType, `数据操作执行失败: ${error}`, { action, error })
    }
  }

  /**
   * 执行创建操作
   */
  private async executeCreate(action: DataAction, context: any): Promise<any> {
    const config = action.config as CreateActionConfig

    // 映射数据
    const data = this.mapData(context, config.dataMapping)

    // 获取数据源
    const dataSource = await this.getDataSource(action.sourceId)

    // 调用数据源API
    if (dataSource.type === 'api') {
      const response = await fetch(dataSource.url!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(dataSource.headers || {}),
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error(`创建失败: ${response.statusText}`)
      }

      const result = await response.json()
      return { success: true, data: result }
    }

    // 其他类型的数据源暂不支持创建操作
    return { success: true, data }
  }

  /**
   * 执行读取操作
   */
  private async executeRead(action: DataAction, context: any): Promise<any> {
    const config = action.config as ReadActionConfig

    // 构建查询参数
    const params = { ...config.params, ...context }

    // 获取数据源
    const dataSource = await this.getDataSource(action.sourceId)

    // 使用数据源服务获取数据
    const data = await dataSourceService.fetchData({
      ...dataSource,
      params,
    })

    return { success: true, data }
  }

  /**
   * 执行更新操作
   */
  private async executeUpdate(action: DataAction, context: any): Promise<any> {
    const config = action.config as UpdateActionConfig

    // 映射数据
    const data = this.mapData(context, config.dataMapping)

    // 调用数据源API
    // 这里需要实现实际的API调用
    console.log('Update data:', data, 'condition:', config.condition)

    return { success: true, data }
  }

  /**
   * 执行删除操作
   */
  private async executeDelete(action: DataAction, context: any): Promise<any> {
    const config = action.config as DeleteActionConfig

    // 显示确认对话框
    if (config.confirmMessage) {
      const confirmed = confirm(config.confirmMessage)
      if (!confirmed) {
        throw new Error('用户取消操作')
      }
    }

    // 调用数据源API
    // 这里需要实现实际的API调用
    console.log('Delete with condition:', config.condition)

    return { success: true }
  }

  /**
   * 执行回调
   */
  private async executeCallbacks(callbacks: EventExecution[], result: any): Promise<void> {
    for (const callback of callbacks) {
      try {
        // 这里需要实现回调执行逻辑
        console.log('Execute callback:', callback, 'with result:', result)
      } catch (error) {
        console.error('回调执行失败:', error)
      }
    }
  }

  /**
   * 映射数据
   */
  private mapData(context: any, mapping: Record<string, string>): any {
    const result: any = {}
    Object.entries(mapping).forEach(([target, source]) => {
      result[target] = this.getNestedValue(context, source)
    })
    return result
  }

  /**
   * 获取嵌套值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * 获取数据源
   */
  private async getDataSource(sourceId: string): Promise<DataSourceOption> {
    if (!this.dataSourceManager) {
      throw new Error('DataSourceManager未初始化')
    }

    const dataSource = this.dataSourceManager.getDataSource?.(sourceId)
    if (!dataSource) {
      throw new Error(`数据源不存在: ${sourceId}`)
    }

    return dataSource
  }
}
