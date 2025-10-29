import { ref, computed, type Ref } from 'vue'
import type { DataSourceOption, ObjectMetadata, ApiResponse } from '../../types/index'
import { api } from '@/core/api/request'
import { DataObject } from './data-object'
import type {
  IDataSource,
  DataSourceConfig,
  DataSourceState,
  DataSourceMetadata,
  LoadOptions,
  DataSourceEvents,
} from '../data/interfaces/IDataSource'

/**
 * 数据源引擎
 * 负责数据的加载、保存、验证等操作
 * 实现 IDataSource 接口以确保与数据源系统的兼容性
 */
export class DataSource implements IDataSource {
  // 数据源配置
  public option: DataSourceOption

  // 内部元数据
  private _metadata: Ref<ObjectMetadata | null> = ref(null)

  // 数据对象列表
  public objects: Ref<DataObject[]> = ref([])

  // 加载状态
  public loading: Ref<boolean> = ref(false)

  // 内部错误信息
  private _error: Ref<string | null> = ref(null)

  // 计算属性
  public readonly isLoaded = computed(() => this.objects.value.length > 0)

  // 事件处理器
  private eventHandlers: Map<keyof DataSourceEvents, Set<Function>> = new Map()

  // 当前状态
  private _state: DataSourceState = 'idle' as DataSourceState

  constructor(option: DataSourceOption) {
    this.option = option
    this.init()
  }

  // IDataSource 接口实现

  get config(): DataSourceConfig {
    return {
      id: this.option.id,
      name: this.option.name || this.option.id,
      type: this.option.type as any,
      autoLoad: this.option.autoLoad,
      options: this.option,
    }
  }

  get metadata(): DataSourceMetadata {
    return {
      id: this.option.id,
      name: this.option.name || this.option.id,
      type: this.option.type as any,
      state: this.state,
      hasCached: false,
      recordCount: this.objects.value.length,
    }
  }

  get state(): DataSourceState {
    if (this.loading.value) return 'loading' as DataSourceState
    if (this._error.value) return 'error' as DataSourceState
    if (this.isLoaded.value) return 'loaded' as DataSourceState
    return 'idle' as DataSourceState
  }

  get data(): any {
    return this.objects.value.map(obj => obj.getData())
  }

  get isLoading(): boolean {
    return this.loading.value
  }

  get hasError(): boolean {
    return !!this._error.value
  }

  get error(): Error | null {
    return this._error.value ? new Error(this._error.value) : null
  }

  /**
   * 初始化数据源
   */
  private async init() {
    try {
      // 加载元数据
      await this.loadMetadata()

      // 自动加载数据
      if (this.option.autoLoad) {
        await this.load()
      }
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : '初始化失败'
      console.error('数据源初始化失败:', error)
    }
  }

  /**
   * 加载元数据
   */
  private async loadMetadata(): Promise<void> {
    if (this.option.type === 'static') {
      // 静态数据源，从配置中获取元数据
      this._metadata.value = this.option.metadata || {
        code: 'static',
        name: '静态数据',
        fields: {},
      }
      return
    }

    // API数据源，从服务器获取元数据
    const response = await api.get<ObjectMetadata>(`/metadata/${this.option.id}`)
    this._metadata.value = response.data.data
  }

  /**
   * 加载数据 (IDataSource 接口方法)
   */
  async load(options?: LoadOptions): Promise<any> {
    if (this.loading.value && !options?.forceRefresh) {
      return this.data
    }

    this.emit('before-load', options)

    const prevState = this.state
    this.loading.value = true
    this._error.value = null

    try {
      let data: any[] = []

      switch (this.option.type) {
        case 'static':
          data = this.option.data || []
          break

        case 'api':
          const response = await this.fetchFromAPI(options)
          data = response.data
          break

        case 'mock':
          data = this.generateMockData()
          break

        default:
          throw new Error(`不支持的数据源类型: ${this.option.type}`)
      }

      // 创建数据对象
      this.objects.value = data.map((item, index) => new DataObject(this, index, this._metadata.value!, item))

      this.emit('state-change', this.state, prevState)
      this.emit('after-load', this.data)
      this.emit('data-change', this.data, null)

      return this.data
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : '加载数据失败'
      console.error('数据加载失败:', error)
      this.emit('error', error as Error)
      this.emit('state-change', this.state, prevState)
      throw error
    } finally {
      this.loading.value = false
    }
  }

  /**
   * 刷新数据 (IDataSource 接口方法)
   */
  async refresh(options?: LoadOptions): Promise<any> {
    this.emit('refresh')
    return this.load({ ...options, forceRefresh: true })
  }

  /**
   * 重新加载数据 (IDataSource 接口方法)
   */
  async reload(options?: LoadOptions): Promise<any> {
    this.clear()
    return this.load(options)
  }

  /**
   * 设置数据 (IDataSource 接口方法)
   */
  setData(data: any): void {
    const prevData = this.data

    if (Array.isArray(data)) {
      this.objects.value = data.map((item, index) => new DataObject(this, index, this._metadata.value!, item))
    } else {
      this.objects.value = [new DataObject(this, 0, this._metadata.value!, data)]
    }

    this.emit('data-change', this.data, prevData)
  }

  /**
   * 获取数据 (IDataSource 接口方法)
   */
  getData(): any {
    return this.data
  }

  /**
   * 订阅事件 (IDataSource 接口方法)
   */
  on<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set())
    }
    this.eventHandlers.get(event)!.add(handler as Function)

    // 返回取消订阅函数
    return () => this.off(event, handler)
  }

  /**
   * 取消订阅 (IDataSource 接口方法)
   */
  off<K extends keyof DataSourceEvents>(event: K, handler: DataSourceEvents[K]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.delete(handler as Function)
    }
  }

  /**
   * 触发事件
   */
  private emit<K extends keyof DataSourceEvents>(event: K, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event)
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(...args)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * 销毁数据源 (IDataSource 接口方法)
   */
  dispose(): void {
    this.destroy()
    this.eventHandlers.clear()
  }

  /**
   * 从API获取数据
   */
  private async fetchFromAPI(options?: LoadOptions): Promise<{ data: any[] }> {
    const { url, method = 'GET', headers, params, data } = this.option

    if (!url) {
      throw new Error('API数据源缺少URL配置')
    }

    const config = {
      headers: headers || {},
      params: { ...(params || {}), ...(options?.params || {}) },
    }

    let response: any
    switch (method.toUpperCase()) {
      case 'GET':
        response = await api.get(url, config)
        break
      case 'POST':
        response = await api.post(url, data, config)
        break
      case 'PUT':
        response = await api.put(url, data, config)
        break
      case 'DELETE':
        response = await api.delete(url, config)
        break
      default:
        throw new Error(`不支持的HTTP方法: ${method}`)
    }

    // 返回统一格式
    return { data: response.data?.data || response.data || [] }
  }

  /**
   * 生成模拟数据
   */
  private generateMockData(): any[] {
    const mockData = []
    const count = 10 // 默认生成10条数据

    for (let i = 0; i < count; i++) {
      const item: any = { id: i + 1 }

      // 根据元数据生成字段值
      if (this._metadata.value) {
        Object.entries(this._metadata.value.fields).forEach(([fieldCode, fieldMeta]) => {
          switch (fieldMeta.type) {
            case 'string':
              item[fieldCode] = `${fieldMeta.name}_${i + 1}`
              break
            case 'number':
              item[fieldCode] = Math.floor(Math.random() * 100)
              break
            case 'boolean':
              item[fieldCode] = Math.random() > 0.5
              break
            case 'date':
              item[fieldCode] = new Date()
              break
            default:
              item[fieldCode] = null
          }
        })
      }

      mockData.push(item)
    }

    return mockData
  }

  /**
   * 保存数据
   */
  async save(): Promise<boolean> {
    if (this.option.readonly) {
      throw new Error('只读数据源不支持保存操作')
    }

    if (this.option.type === 'static') {
      // 静态数据源不需要保存
      return true
    }

    this.loading.value = true
    this._error.value = null

    try {
      // 收集所有修改的数据
      const changedData = this.objects.value.filter(obj => obj.isChanged.value).map(obj => obj.getData())

      if (changedData.length === 0) {
        return true
      }

      // 发送保存请求
      await api.post(`/data-source/${this.option.id}/save`, {
        data: changedData,
      })

      // 标记所有对象为未修改状态
      this.objects.value.forEach(obj => obj.markAsClean())

      return true
    } catch (error) {
      this._error.value = error instanceof Error ? error.message : '保存数据失败'
      console.error('数据保存失败:', error)
      return false
    } finally {
      this.loading.value = false
    }
  }

  /**
   * 添加数据对象
   */
  addObject(data: any = {}): DataObject {
    const newObject = new DataObject(this, this.objects.value.length, this._metadata.value!, data)

    this.objects.value.push(newObject)
    return newObject
  }

  /**
   * 删除数据对象
   */
  removeObject(index: number): boolean {
    if (index >= 0 && index < this.objects.value.length) {
      this.objects.value.splice(index, 1)

      // 重新设置索引
      this.objects.value.forEach((obj, idx) => {
        obj.id = idx
      })

      return true
    }
    return false
  }

  /**
   * 清空数据
   */
  clear(): void {
    this.objects.value = []
    this._error.value = null
  }

  /**
   * 获取数据对象
   */
  getObject(index: number): DataObject | null {
    return this.objects.value[index] || null
  }

  /**
   * 查找数据对象
   */
  findObject(predicate: (obj: DataObject) => boolean): DataObject | null {
    return this.objects.value.find(predicate) || null
  }

  /**
   * 过滤数据对象
   */
  filterObjects(predicate: (obj: DataObject) => boolean): DataObject[] {
    return this.objects.value.filter(predicate)
  }

  /**
   * 销毁数据源
   */
  destroy(): void {
    this.objects.value.forEach(obj => obj.destroy())
    this.objects.value = []
    this._metadata.value = null
    this._error.value = null
  }

  // 静态方法：提供键用于依赖注入
  static readonly ProvideKey = Symbol('DataSource')
}
