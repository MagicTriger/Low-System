/**
 * 事件执行引擎
 *
 * 负责执行事件动作，包括数据源操作、浮层控制、导航等
 */

import { message } from 'ant-design-vue'
import type { EventAction, EventActionConfig, DataSourceOperationType } from '@/core/api/event-config'
import { EventActionType } from '@/core/api/event-config'
import { DataSourceFactory } from '@/core/data/DataSourceFactory'
import type { IDataSource } from '@/core/data/interfaces/IDataSource'
import { resolveContextExpression } from '@/core/utils/context-resolver'
import type { StateManager } from '@/core/state/StateManager'
import type { OverlayConfig } from '@/core/api/overlay'
import { overlayApi } from '@/core/api/overlay'

/**
 * 事件执行上下文
 */
export interface EventExecutionContext {
  /** 当前控件数据 */
  control?: any
  /** 页面数据上下文 */
  page?: any
  /** 用户数据 */
  user?: any
  /** 自定义数据 */
  [key: string]: any
}

/**
 * 事件执行结果
 */
export interface EventExecutionResult {
  success: boolean
  data?: any
  error?: Error
}

/**
 * 数据源操作执行器
 */
class DataSourceOperationExecutor {
  private dataSourceFactory: DataSourceFactory

  constructor(dataSourceFactory: DataSourceFactory) {
    this.dataSourceFactory = dataSourceFactory
  }

  /**
   * 执行数据源操作
   */
  async execute(
    dataSourceId: string,
    operationType: DataSourceOperationType,
    operationParams: Record<string, any>,
    context: EventExecutionContext
  ): Promise<any> {
    // 解析参数中的上下文表达式
    const resolvedParams = this.resolveParams(operationParams, context)

    // 获取数据源
    const dataSource = this.getDataSource(dataSourceId)

    // 根据操作类型执行
    switch (operationType) {
      case 'create':
        return this.executeCreate(dataSource, resolvedParams)
      case 'read':
        return this.executeRead(dataSource, resolvedParams)
      case 'update':
        return this.executeUpdate(dataSource, resolvedParams)
      case 'delete':
        return this.executeDelete(dataSource, resolvedParams)
      case 'query':
        return this.executeQuery(dataSource, resolvedParams)
      default:
        throw new Error(`Unsupported operation type: ${operationType}`)
    }
  }

  /**
   * 执行 CREATE 操作
   */
  private async executeCreate(dataSource: IDataSource, params: Record<string, any>): Promise<any> {
    const { fields } = params

    if (!fields || !Array.isArray(fields)) {
      throw new Error('CREATE operation requires fields parameter')
    }

    // 构建创建数据对象
    const createData: Record<string, any> = {}
    for (const field of fields) {
      if (field.name) {
        createData[field.name] = this.convertFieldValue(field.value, field.type)
      }
    }

    // 调用数据源的创建方法
    return dataSource.load({
      params: {
        method: 'POST',
        data: createData,
      },
    })
  }

  /**
   * 执行 READ 操作
   */
  private async executeRead(dataSource: IDataSource, params: Record<string, any>): Promise<any> {
    const { condition } = params

    if (!condition) {
      throw new Error('READ operation requires condition parameter')
    }

    return dataSource.load({
      params: {
        method: 'GET',
        params: condition,
      },
    })
  }

  /**
   * 执行 UPDATE 操作
   */
  private async executeUpdate(dataSource: IDataSource, params: Record<string, any>): Promise<any> {
    const { condition, fields } = params

    if (!condition) {
      throw new Error('UPDATE operation requires condition parameter')
    }

    if (!fields || !Array.isArray(fields)) {
      throw new Error('UPDATE operation requires fields parameter')
    }

    // 构建更新数据对象
    const updateData: Record<string, any> = {}
    for (const field of fields) {
      if (field.name) {
        updateData[field.name] = field.value
      }
    }

    return dataSource.load({
      params: {
        method: 'PUT',
        params: condition,
        data: updateData,
      },
    })
  }

  /**
   * 执行 DELETE 操作
   */
  private async executeDelete(dataSource: IDataSource, params: Record<string, any>): Promise<any> {
    const { condition } = params

    if (!condition) {
      throw new Error('DELETE operation requires condition parameter')
    }

    return dataSource.load({
      params: {
        method: 'DELETE',
        params: condition,
      },
    })
  }

  /**
   * 执行 QUERY 操作
   */
  private async executeQuery(dataSource: IDataSource, params: Record<string, any>): Promise<any> {
    const { condition, fields, sort } = params

    const queryParams: Record<string, any> = {}

    if (condition) {
      Object.assign(queryParams, condition)
    }

    if (fields && Array.isArray(fields) && fields.length > 0) {
      queryParams.fields = fields.join(',')
    }

    if (sort && sort.field) {
      queryParams.sortField = sort.field
      queryParams.sortOrder = sort.order || 'asc'
    }

    return dataSource.load({
      params: {
        method: 'GET',
        params: queryParams,
      },
    })
  }

  /**
   * 解析参数中的上下文表达式
   */
  private resolveParams(params: Record<string, any>, context: EventExecutionContext): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(params)) {
      resolved[key] = this.resolveValue(value, context)
    }

    return resolved
  }

  /**
   * 递归解析值中的上下文表达式
   */
  private resolveValue(value: any, context: EventExecutionContext): any {
    if (typeof value === 'string') {
      return resolveContextExpression(value, context)
    }

    if (Array.isArray(value)) {
      return value.map(item => this.resolveValue(item, context))
    }

    if (value && typeof value === 'object') {
      const resolved: Record<string, any> = {}
      for (const [k, v] of Object.entries(value)) {
        resolved[k] = this.resolveValue(v, context)
      }
      return resolved
    }

    return value
  }

  /**
   * 转换字段值类型
   */
  private convertFieldValue(value: any, type: string): any {
    switch (type) {
      case 'number':
        return Number(value)
      case 'boolean':
        return Boolean(value)
      case 'expression':
        // 表达式类型的值已经在 resolveValue 中处理
        return value
      case 'string':
      default:
        return String(value)
    }
  }

  /**
   * 获取数据源实例
   */
  private getDataSource(dataSourceId: string): IDataSource {
    // TODO: 从数据源管理器获取数据源实例
    // 这里需要实现数据源的获取逻辑
    throw new Error(`Data source not implemented: ${dataSourceId}`)
  }
}

/**
 * 事件执行器
 */
export class EventExecutor {
  private dataSourceOperationExecutor: DataSourceOperationExecutor
  private stateManager?: StateManager

  constructor(dataSourceFactory: DataSourceFactory, stateManager?: StateManager) {
    this.dataSourceOperationExecutor = new DataSourceOperationExecutor(dataSourceFactory)
    this.stateManager = stateManager
  }

  /**
   * 执行事件动作列表
   */
  async execute(actions: EventAction[], context: EventExecutionContext): Promise<EventExecutionResult[]> {
    const results: EventExecutionResult[] = []

    for (const action of actions) {
      try {
        const result = await this.executeAction(action, context)
        results.push({
          success: true,
          data: result,
        })

        // 执行成功链
        if (action.onSuccess && action.onSuccess.length > 0) {
          const successContext = { ...context, result }
          await this.execute(action.onSuccess, successContext)
        }
      } catch (error: any) {
        results.push({
          success: false,
          error,
        })

        // 执行失败链
        if (action.onError && action.onError.length > 0) {
          const errorContext = { ...context, error }
          await this.execute(action.onError, errorContext)
        } else {
          // 如果没有错误处理链，则抛出错误
          throw error
        }
      }
    }

    return results
  }

  /**
   * 执行单个事件动作
   */
  private async executeAction(action: EventAction, context: EventExecutionContext): Promise<any> {
    const { type, config } = action

    switch (type) {
      case EventActionType.DATA_SOURCE:
        return this.executeDataSourceAction(config, context)

      case EventActionType.OPEN_OVERLAY:
        return this.executeOpenOverlayAction(config, context)

      case EventActionType.CLOSE_OVERLAY:
        return this.executeCloseOverlayAction(config, context)

      case EventActionType.NAVIGATE:
        return this.executeNavigateAction(config, context)

      case EventActionType.CUSTOM:
        return this.executeCustomAction(config, context)

      default:
        throw new Error(`Unsupported action type: ${type}`)
    }
  }

  /**
   * 执行数据源操作动作
   */
  private async executeDataSourceAction(config: EventActionConfig, context: EventExecutionContext): Promise<any> {
    const { dataSourceId, operationType, operationParams } = config

    if (!dataSourceId) {
      throw new Error('Data source action requires dataSourceId')
    }

    if (!operationType) {
      throw new Error('Data source action requires operationType')
    }

    return this.dataSourceOperationExecutor.execute(dataSourceId, operationType, operationParams || {}, context)
  }

  /**
   * 执行打开浮层动作
   */
  private async executeOpenOverlayAction(config: EventActionConfig, context: EventExecutionContext): Promise<any> {
    const { overlayId, overlayParams } = config

    if (!overlayId) {
      const error = new Error('Open overlay action requires overlayId')
      console.error('❌ [EventExecutor] 打开浮层失败: overlayId 未定义')
      message.error('打开浮层失败: 浮层ID未定义')
      throw error
    }

    // 解析浮层参数中的上下文表达式
    let resolvedParams: Record<string, any> = {}
    try {
      resolvedParams = overlayParams ? this.resolveObjectExpressions(overlayParams, context) : {}
    } catch (error: any) {
      console.error(`❌ [EventExecutor] 解析浮层参数失败: ${overlayId}`, error)
      message.error(`解析浮层参数失败: ${error.message}`)
      throw new Error(`解析浮层参数失败: ${error.message}`)
    }

    try {
      // 加载浮层配置
      const overlayConfigResponse = await overlayApi.get(overlayId)
      const overlayConfig = overlayConfigResponse.data.data as OverlayConfig

      // 如果有状态管理器，使用状态管理器打开浮层
      if (this.stateManager) {
        // 创建数据返回回调
        const onReturn = (data: any) => {
          console.log(`✅ [EventExecutor] 浮层返回数据: ${overlayId}`, data)
          // 将返回数据注入到上下文中，供后续事件使用
          context.overlayReturnData = data
        }

        // 创建关闭回调
        const onClose = (returnData?: any) => {
          console.log(`✅ [EventExecutor] 浮层关闭: ${overlayId}`, returnData)
          if (returnData !== undefined) {
            context.overlayReturnData = returnData
          }
        }

        await this.stateManager.dispatch('overlay/openOverlay', {
          id: overlayId,
          config: overlayConfig,
          params: resolvedParams,
          parentContext: context,
          onReturn,
          onClose,
        })

        console.log(`✅ [EventExecutor] 浮层已打开: ${overlayId}`, resolvedParams)
        message.success(`浮层已打开: ${overlayConfig.title || overlayConfig.name}`)
      } else {
        // 降级处理：仅记录日志
        console.log('⚠️ [EventExecutor] StateManager not available, overlay not opened:', overlayId, resolvedParams)
        message.info(`打开浮层: ${overlayId}`)
      }

      return { overlayId, params: resolvedParams, config: overlayConfig }
    } catch (error: any) {
      console.error(`❌ [EventExecutor] 打开浮层失败: ${overlayId}`, error)

      // 提供更详细的错误信息
      let errorMessage = '打开浮层失败'
      if (error.response?.status === 404) {
        errorMessage = `浮层不存在: ${overlayId}`
      } else if (error.response?.status === 403) {
        errorMessage = '没有权限访问该浮层'
      } else if (error.message) {
        errorMessage = `打开浮层失败: ${error.message}`
      }

      message.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 执行关闭浮层动作
   */
  private async executeCloseOverlayAction(config: EventActionConfig, context: EventExecutionContext): Promise<any> {
    const { overlayId } = config

    try {
      // 如果有状态管理器，使用状态管理器关闭浮层
      if (this.stateManager) {
        // 解析返回数据中的上下文表达式
        let returnData = context.returnData
        if (returnData && typeof returnData === 'object') {
          try {
            returnData = this.resolveObjectExpressions(returnData, context)
          } catch (error: any) {
            console.error(`❌ [EventExecutor] 解析返回数据失败: ${overlayId || 'current'}`, error)
            // 继续使用原始返回数据
          }
        }

        // 如果未指定 overlayId，则关闭当前浮层（栈顶浮层）
        const result = await this.stateManager.dispatch('overlay/closeOverlay', {
          id: overlayId, // 如果为 undefined，overlay 模块会自动关闭当前浮层
          returnData, // 支持传递返回数据
        })

        if (result.success) {
          console.log(`✅ [EventExecutor] 浮层已关闭: ${result.overlayId}`, returnData)
          message.success(`浮层已关闭`)
        } else {
          console.warn(`⚠️ [EventExecutor] ${result.message}`)
          message.warning(result.message)
        }

        return result
      } else {
        // 降级处理：仅记录日志
        console.log('⚠️ [EventExecutor] StateManager not available, overlay not closed:', overlayId || 'current')
        message.info(`关闭浮层: ${overlayId || '当前'}`)
        return { overlayId }
      }
    } catch (error: any) {
      console.error(`❌ [EventExecutor] 关闭浮层失败: ${overlayId || 'current'}`, error)

      // 提供更详细的错误信息
      let errorMessage = '关闭浮层失败'
      if (error.message) {
        errorMessage = `关闭浮层失败: ${error.message}`
      }

      message.error(errorMessage)
      throw new Error(errorMessage)
    }
  }

  /**
   * 执行导航动作
   */
  private async executeNavigateAction(config: EventActionConfig, context: EventExecutionContext): Promise<any> {
    const { path, query } = config

    if (!path) {
      throw new Error('Navigate action requires path')
    }

    // 解析路径和查询参数中的上下文表达式
    const resolvedPath = resolveContextExpression(path, context)
    const resolvedQuery = query ? this.resolveObjectExpressions(query, context) : {}

    // TODO: 调用路由进行导航
    console.log('Navigate to:', resolvedPath, resolvedQuery)
    message.info(`导航到: ${resolvedPath}`)

    return { path: resolvedPath, query: resolvedQuery }
  }

  /**
   * 执行自定义脚本动作
   */
  private async executeCustomAction(config: EventActionConfig, context: EventExecutionContext): Promise<any> {
    const { script } = config

    if (!script) {
      throw new Error('Custom action requires script')
    }

    // TODO: 执行自定义脚本
    console.log('Execute custom script:', script)
    message.info('执行自定义脚本')

    return { script }
  }

  /**
   * 解析对象中的上下文表达式
   */
  private resolveObjectExpressions(obj: Record<string, any>, context: EventExecutionContext): Record<string, any> {
    const resolved: Record<string, any> = {}

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        resolved[key] = resolveContextExpression(value, context)
      } else if (Array.isArray(value)) {
        resolved[key] = value.map(item => (typeof item === 'string' ? resolveContextExpression(item, context) : item))
      } else if (value && typeof value === 'object') {
        resolved[key] = this.resolveObjectExpressions(value, context)
      } else {
        resolved[key] = value
      }
    }

    return resolved
  }
}

/**
 * 创建默认的事件执行器实例
 */
export function createEventExecutor(dataSourceFactory: DataSourceFactory, stateManager?: StateManager): EventExecutor {
  return new EventExecutor(dataSourceFactory, stateManager)
}
