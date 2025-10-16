import { computed, inject, provide, type Ref } from 'vue'
import type { Control, ControlRendererProps } from './base'
import type { DataRawValue } from '../../types'
import { DataSource } from '../engines/data-source'
import { DataObject } from '../engines/data-object'
import { DataField } from '../engines/data-field'
import { ObjectMetadata, FieldMetadata } from './metadata'
import { RootViewContext } from './root-view-context'

// 控件实例ID键
export const ControlInstIdKey = Symbol('ControlInstId')

/**
 * 控件成员钩子
 * 提供控件的数据绑定、事件处理等核心功能
 */
export function useControlMembers<T extends Control, TV extends DataRawValue = DataRawValue>(
  props: ControlRendererProps<T>,
  provideFunc?: (key: symbol, value: any) => void
) {
  // 基础注入
  const control = computed(() => props.control)
  const controlInstId = inject<string>(ControlInstIdKey, 'default')
  const ctx = inject<RootViewContext>(RootViewContext.ProvideKey, null as any)
  const viewId = inject<string>(RootViewContext.ViewIdKey, 'default')
  
  // 数据层注入
  const dataSource = inject<Ref<DataSource>>(DataSource.ProvideKey, null as any)
  const objectMetadata = inject<Ref<any>>(ObjectMetadata.ProvideKey, null as any)
  const fieldMetadata = inject<Ref<any>>(FieldMetadata.ProvideKey, null as any)
  const dataObject = inject<Ref<DataObject>>(DataObject.ProvideKey, null as any)
  const dataField = inject<Ref<DataField>>(DataField.ProvideKey, null as any)

  // 响应式值绑定
  const value = computed<TV>({
    get: () => {
      if (dataField?.value) {
        return dataField.value.value.value as TV
      }
      return control.value?.defaultValue as TV
    },
    set: (val: TV) => {
      if (dataField?.value && dataSource?.value && !dataSource.value.option.readonly) {
        dataField.value.setValue(val)
      }
    },
  })

  // 数据绑定提供器
  const provideMaker = () => {
    const binding = control.value?.dataBinding
    if (binding && provideFunc) {
      if (!binding.inherit && ctx) {
        // 直接绑定数据源
        const ds = ctx.dataSources.inst.value[binding.source]
        if (ds) {
          provideDataSourceContext(ds, binding, provideFunc)
        }
      } else if (binding.inherit && binding.propertyCode) {
        // 继承绑定属性
        provideInheritedContext(binding.propertyCode, provideFunc)
      }
    }
  }

  // 事件处理器
  const eventHandler = async (event: string, ...args: any[]): Promise<boolean> => {
    const executions = control.value?.eventExection?.[event]
    if (executions && executions.length > 0) {
      try {
        return await executeEventChain(executions, {
          control: control.value,
          dataSource: dataSource?.value,
          dataObject: dataObject?.value,
          dataField: dataField?.value,
          args,
          ctx
        })
      } catch (error) {
        console.error('事件执行失败:', error)
        // 可以在这里集成通知系统
        return false
      }
    }
    return true
  }

  // 初始化数据绑定
  provideMaker()

  return {
    control,
    controlInstId,
    ctx,
    viewId,
    dataSource,
    dataField,
    value,
    eventHandler,
  }
}

/**
 * 提供数据源上下文
 */
function provideDataSourceContext(
  dataSource: DataSource, 
  binding: any, 
  provideFunc: (key: symbol, value: any) => void
) {
  // 提供数据源
  provideFunc(DataSource.ProvideKey, ref(dataSource))
  
  // 如果有对象绑定，提供数据对象
  if (binding.objectCode) {
    const dataObject = dataSource.objects.value.find(obj => 
      obj.metadata.code === binding.objectCode
    )
    
    if (dataObject) {
      provideFunc(DataObject.ProvideKey, ref(dataObject))
      provideFunc(ObjectMetadata.ProvideKey, ref(dataObject.metadata))
      
      // 如果有字段绑定，提供数据字段
      if (binding.propertyCode) {
        const dataField = dataObject.getField(binding.propertyCode)
        if (dataField) {
          provideFunc(DataField.ProvideKey, ref(dataField))
          provideFunc(FieldMetadata.ProvideKey, ref(dataField.metadata))
        }
      }
    }
  }
}

/**
 * 提供继承上下文
 */
function provideInheritedContext(
  propertyCode: string, 
  provideFunc: (key: symbol, value: any) => void
) {
  // 从父级上下文继承数据字段
  const parentDataObject = inject<Ref<DataObject>>(DataObject.ProvideKey, null as any)
  
  if (parentDataObject?.value) {
    const dataField = parentDataObject.value.getField(propertyCode)
    if (dataField) {
      provideFunc(DataField.ProvideKey, ref(dataField))
      provideFunc(FieldMetadata.ProvideKey, ref(dataField.metadata))
    }
  }
}

/**
 * 执行事件链
 */
async function executeEventChain(
  executions: any[], 
  context: {
    control: Control
    dataSource?: DataSource
    dataObject?: DataObject
    dataField?: DataField
    args: any[]
    ctx?: RootViewContext | null
  }
): Promise<boolean> {
  for (const execution of executions) {
    const success = await executeEvent(execution, context)
    if (!success) {
      return false
    }
  }
  return true
}

/**
 * 执行单个事件
 */
async function executeEvent(
  execution: any,
  context: {
    control: Control
    dataSource?: DataSource
    dataObject?: DataObject
    dataField?: DataField
    args: any[]
    ctx?: RootViewContext | null
  }
): Promise<boolean> {
  const { type, target, method, params = {} } = execution
  
  try {
    switch (type) {
      case 'control':
        return await executeControlEvent(target, method, params, context)
        
      case 'dataSource':
        return await executeDataSourceEvent(target, method, params, context)
        
      case 'dataTransfer':
        return await executeDataTransferEvent(target, method, params, context)
        
      case 'global':
        return await executeGlobalEvent(target, method, params, context)
        
      default:
        console.warn(`未知的事件类型: ${type}`)
        return false
    }
  } catch (error) {
    console.error(`事件执行失败 [${type}:${target}:${method}]:`, error)
    return false
  }
}

/**
 * 执行控件事件
 */
async function executeControlEvent(
  target: string,
  method: string,
  params: any,
  context: any
): Promise<boolean> {
  if (!context.ctx) return false
  
  // 查找目标控件
  const targetControl = context.ctx.findControl(target)
  if (!targetControl) {
    console.warn(`未找到目标控件: ${target}`)
    return false
  }
  
  // 获取控件实例
  const controlRef = context.ctx.getControlRef(targetControl.id)
  if (!controlRef?.methods?.[method]) {
    console.warn(`控件 ${target} 不支持方法: ${method}`)
    return false
  }
  
  // 执行方法
  const result = await controlRef.methods[method](params)
  return result !== false
}

/**
 * 执行数据源事件
 */
async function executeDataSourceEvent(
  target: string,
  method: string,
  params: any,
  context: any
): Promise<boolean> {
  if (!context.ctx) return false
  
  const dataSource = context.ctx.dataSources.inst.value[target]
  if (!dataSource) {
    console.warn(`未找到数据源: ${target}`)
    return false
  }
  
  switch (method) {
    case 'load':
      return await dataSource.load()
    case 'save':
      return await dataSource.save()
    case 'refresh':
      return await dataSource.refresh()
    case 'clear':
      dataSource.clear()
      return true
    default:
      console.warn(`数据源不支持方法: ${method}`)
      return false
  }
}

/**
 * 执行数据流事件
 */
async function executeDataTransferEvent(
  target: string,
  method: string,
  params: any,
  context: any
): Promise<boolean> {
  if (!context.ctx) return false
  
  const dataTransfer = context.ctx.dataTransfers[target]
  if (!dataTransfer) {
    console.warn(`未找到数据流: ${target}`)
    return false
  }
  
  switch (method) {
    case 'execute':
      const result = await dataTransfer.execute(params)
      return result !== null
    case 'stop':
      dataTransfer.stop()
      return true
    default:
      console.warn(`数据流不支持方法: ${method}`)
      return false
  }
}

/**
 * 执行全局事件
 */
async function executeGlobalEvent(
  target: string,
  method: string,
  params: any,
  context: any
): Promise<boolean> {
  switch (target) {
    case 'window':
      return executeWindowEvent(method, params)
    case 'router':
      return executeRouterEvent(method, params)
    case 'message':
      return executeMessageEvent(method, params)
    default:
      console.warn(`未知的全局目标: ${target}`)
      return false
  }
}

/**
 * 执行窗口事件
 */
function executeWindowEvent(method: string, params: any): boolean {
  switch (method) {
    case 'open':
      window.open(params.url, params.target || '_blank', params.features)
      return true
    case 'close':
      window.close()
      return true
    case 'reload':
      window.location.reload()
      return true
    case 'redirect':
      window.location.href = params.url
      return true
    default:
      return false
  }
}

/**
 * 执行路由事件
 */
function executeRouterEvent(method: string, params: any): boolean {
  // 这里需要注入路由实例
  // 暂时返回true
  console.log(`路由事件: ${method}`, params)
  return true
}

/**
 * 执行消息事件
 */
function executeMessageEvent(method: string, params: any): boolean {
  switch (method) {
    case 'success':
      // 这里可以集成消息组件
      console.log('成功:', params.message)
      return true
    case 'error':
      console.error('错误:', params.message)
      return true
    case 'warning':
      console.warn('警告:', params.message)
      return true
    case 'info':
      console.info('信息:', params.message)
      return true
    default:
      return false
  }
}