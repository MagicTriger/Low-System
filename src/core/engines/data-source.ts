import { ref, computed, type Ref } from 'vue'
import type { DataSourceOption, ObjectMetadata, ApiResponse } from '../../types/index'
import { api } from '@/core/api/request'
import { DataObject } from './data-object'

/**
 * 数据源引擎
 * 负责数据的加载、保存、验证等操作
 */
export class DataSource {
  // 数据源配置
  public option: DataSourceOption
  
  // 元数据
  public metadata: Ref<ObjectMetadata | null> = ref(null)
  
  // 数据对象列表
  public objects: Ref<DataObject[]> = ref([])
  
  // 加载状态
  public loading: Ref<boolean> = ref(false)
  
  // 错误信息
  public error: Ref<string | null> = ref(null)
  
  // 计算属性
  public readonly isLoaded = computed(() => this.objects.value.length > 0)
  public readonly hasError = computed(() => !!this.error.value)
  
  constructor(option: DataSourceOption) {
    this.option = option
    this.init()
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
      this.error.value = error instanceof Error ? error.message : '初始化失败'
      console.error('数据源初始化失败:', error)
    }
  }
  
  /**
   * 加载元数据
   */
  private async loadMetadata(): Promise<void> {
    if (this.option.type === 'static') {
      // 静态数据源，从配置中获取元数据
      this.metadata.value = this.option.metadata || {
        code: 'static',
        name: '静态数据',
        fields: {}
      }
      return
    }
    
    // API数据源，从服务器获取元数据
    const response = await api.get<ObjectMetadata>(`/metadata/${this.option.id}`)
    this.metadata.value = response.data.data
  }
  
  /**
   * 加载数据
   */
  async load(): Promise<boolean> {
    if (this.loading.value) return false
    
    this.loading.value = true
    this.error.value = null
    
    try {
      let data: any[] = []
      
      switch (this.option.type) {
        case 'static':
          data = this.option.data || []
          break
          
        case 'api':
          const response = await this.fetchFromAPI()
          data = response.data
          break
          
        case 'mock':
          data = this.generateMockData()
          break
          
        default:
          throw new Error(`不支持的数据源类型: ${this.option.type}`)
      }
      
      // 创建数据对象
      this.objects.value = data.map((item, index) => 
        new DataObject(this, index, this.metadata.value!, item)
      )
      
      return true
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '加载数据失败'
      console.error('数据加载失败:', error)
      return false
    } finally {
      this.loading.value = false
    }
  }
  
  /**
   * 从API获取数据
   */
  private async fetchFromAPI(): Promise<ApiResponse<any[]>> {
    const { url, method = 'GET', headers, params, data } = this.option
    
    if (!url) {
      throw new Error('API数据源缺少URL配置')
    }
    
    const config = {
      headers: headers || {},
      params: params || {}
    }
    
    switch (method.toUpperCase()) {
      case 'GET':
        return (await api.get(url, config)).data
      case 'POST':
        return (await api.post(url, data, config)).data
      case 'PUT':
        return (await api.put(url, data, config)).data
      case 'DELETE':
        return (await api.delete(url, config)).data
      default:
        throw new Error(`不支持的HTTP方法: ${method}`)
    }
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
      if (this.metadata.value) {
        Object.entries(this.metadata.value.fields).forEach(([fieldCode, fieldMeta]) => {
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
    this.error.value = null
    
    try {
      // 收集所有修改的数据
      const changedData = this.objects.value
        .filter(obj => obj.isChanged.value)
        .map(obj => obj.getData())
      
      if (changedData.length === 0) {
        return true
      }
      
      // 发送保存请求
      await api.post(`/data-source/${this.option.id}/save`, {
        data: changedData
      })
      
      // 标记所有对象为未修改状态
      this.objects.value.forEach(obj => obj.markAsClean())
      
      return true
    } catch (error) {
      this.error.value = error instanceof Error ? error.message : '保存数据失败'
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
    const newObject = new DataObject(
      this, 
      this.objects.value.length, 
      this.metadata.value!, 
      data
    )
    
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
    this.error.value = null
  }
  
  /**
   * 刷新数据
   */
  async refresh(): Promise<boolean> {
    this.clear()
    return await this.load()
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
    this.metadata.value = null
    this.error.value = null
  }
  
  // 静态方法：提供键用于依赖注入
  static readonly ProvideKey = Symbol('DataSource')
}