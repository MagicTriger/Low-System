import { ref, computed, type Ref } from 'vue'
import type { ObjectMetadata } from '../../types/index'
import type { DataSource } from './data-source'
import { DataField } from './data-field'

/**
 * 数据对象引擎
 * 管理单个数据对象的字段和状态
 */
export class DataObject {
  // 数据源引用
  public dataSource: DataSource
  
  // 对象ID（在数据源中的索引）
  public id: number
  
  // 元数据
  public metadata: ObjectMetadata
  
  // 字段映射
  public fields: Record<string, DataField> = {}
  
  // 原始数据
  private originalData: any = {}
  
  // 修改状态
  private _isChanged: Ref<boolean> = ref(false)
  
  // 验证状态
  private _isValid: Ref<boolean> = ref(true)
  
  // 错误信息
  private _errors: Ref<Record<string, string[]>> = ref({})
  
  // 计算属性
  public readonly isChanged = computed(() => this._isChanged.value)
  public readonly isValid = computed(() => this._isValid.value)
  public readonly errors = computed(() => this._errors.value)
  public readonly hasErrors = computed(() => Object.keys(this._errors.value).length > 0)
  
  constructor(
    dataSource: DataSource,
    id: number,
    metadata: ObjectMetadata,
    data: any = {}
  ) {
    this.dataSource = dataSource
    this.id = id
    this.metadata = metadata
    this.originalData = { ...data }
    
    this.init(data)
  }
  
  /**
   * 初始化数据对象
   */
  private init(data: any): void {
    // 根据元数据创建字段
    Object.entries(this.metadata.fields).forEach(([fieldCode, fieldMetadata]) => {
      const fieldValue = data[fieldCode] ?? fieldMetadata.defaultValue
      this.fields[fieldCode] = new DataField(
        this.dataSource,
        this,
        fieldMetadata,
        fieldValue
      )
    })
    
    // 监听字段变化
    this.watchFieldChanges()
  }
  
  /**
   * 监听字段变化
   */
  private watchFieldChanges(): void {
    Object.values(this.fields).forEach(field => {
      // 监听字段值变化
      field.onValueChange(() => {
        this.checkChanged()
        this.validate()
      })
    })
  }
  
  /**
   * 检查是否有修改
   */
  private checkChanged(): void {
    const currentData = this.getData()
    this._isChanged.value = JSON.stringify(currentData) !== JSON.stringify(this.originalData)
  }
  
  /**
   * 验证数据对象
   */
  async validate(): Promise<boolean> {
    const errors: Record<string, string[]> = {}
    let isValid = true
    
    // 验证所有字段
    for (const [fieldCode, field] of Object.entries(this.fields)) {
      const fieldErrors = await field.validate()
      if (fieldErrors.length > 0) {
        errors[fieldCode] = fieldErrors
        isValid = false
      }
    }
    
    this._errors.value = errors
    this._isValid.value = isValid
    
    return isValid
  }
  
  /**
   * 获取字段值
   */
  getFieldValue(fieldCode: string): any {
    const field = this.fields[fieldCode]
    return field ? field.value.value : undefined
  }
  
  /**
   * 设置字段值
   */
  setFieldValue(fieldCode: string, value: any): boolean {
    const field = this.fields[fieldCode]
    if (field) {
      field.setValue(value)
      return true
    }
    return false
  }
  
  /**
   * 获取所有数据
   */
  getData(): any {
    const data: any = {}
    Object.entries(this.fields).forEach(([fieldCode, field]) => {
      data[fieldCode] = field.value.value
    })
    return data
  }
  
  /**
   * 设置所有数据
   */
  setData(data: any): void {
    Object.entries(data).forEach(([fieldCode, value]) => {
      this.setFieldValue(fieldCode, value)
    })
  }
  
  /**
   * 重置到原始状态
   */
  reset(): void {
    this.setData(this.originalData)
    this._isChanged.value = false
    this._errors.value = {}
    this._isValid.value = true
  }
  
  /**
   * 标记为干净状态（保存后调用）
   */
  markAsClean(): void {
    this.originalData = { ...this.getData() }
    this._isChanged.value = false
  }
  
  /**
   * 克隆数据对象
   */
  clone(): DataObject {
    return new DataObject(
      this.dataSource,
      -1, // 新对象暂时使用-1作为ID
      this.metadata,
      this.getData()
    )
  }
  
  /**
   * 获取字段
   */
  getField(fieldCode: string): DataField | null {
    return this.fields[fieldCode] || null
  }
  
  /**
   * 获取所有字段
   */
  getAllFields(): DataField[] {
    return Object.values(this.fields)
  }
  
  /**
   * 获取已修改的字段
   */
  getChangedFields(): DataField[] {
    return Object.values(this.fields).filter(field => field.isChanged.value)
  }
  
  /**
   * 获取有错误的字段
   */
  getErrorFields(): DataField[] {
    return Object.values(this.fields).filter(field => field.hasErrors.value)
  }
  
  /**
   * 序列化为JSON
   */
  toJSON(): any {
    return {
      id: this.id,
      metadata: this.metadata,
      data: this.getData(),
      isChanged: this.isChanged.value,
      isValid: this.isValid.value,
      errors: this.errors.value
    }
  }
  
  /**
   * 销毁数据对象
   */
  destroy(): void {
    Object.values(this.fields).forEach(field => field.destroy())
    this.fields = {}
  }
  
  // 静态方法：提供键用于依赖注入
  static readonly ProvideKey = Symbol('DataObject')
}