import type { ObjectMetadata as ObjectMetadataType, FieldMetadata as FieldMetadataType } from '../../types'

// 元数据注册表
export const ObjectMetadataRegistry: Record<string, ObjectMetadataType> = {}
export const FieldMetadataRegistry: Record<string, FieldMetadataType> = {}

/**
 * 注册对象元数据
 */
export function registerObjectMetadata(metadata: ObjectMetadataType): void {
  if (ObjectMetadataRegistry[metadata.code]) {
    console.warn(`对象元数据 ${metadata.code} 已存在，将被覆盖`)
  }
  
  ObjectMetadataRegistry[metadata.code] = metadata
  
  // 同时注册字段元数据
  Object.values(metadata.fields).forEach(fieldMetadata => {
    registerFieldMetadata(fieldMetadata)
  })
}

/**
 * 注册字段元数据
 */
export function registerFieldMetadata(metadata: FieldMetadataType): void {
  const key = `${metadata.code}`
  if (FieldMetadataRegistry[key]) {
    console.warn(`字段元数据 ${key} 已存在，将被覆盖`)
  }
  
  FieldMetadataRegistry[key] = metadata
}

/**
 * 获取对象元数据
 */
export function getObjectMetadata(code: string): ObjectMetadataType | null {
  return ObjectMetadataRegistry[code] || null
}

/**
 * 获取字段元数据
 */
export function getFieldMetadata(code: string): FieldMetadataType | null {
  return FieldMetadataRegistry[code] || null
}

/**
 * 获取所有对象元数据
 */
export function getAllObjectMetadata(): ObjectMetadataType[] {
  return Object.values(ObjectMetadataRegistry)
}

/**
 * 获取所有字段元数据
 */
export function getAllFieldMetadata(): FieldMetadataType[] {
  return Object.values(FieldMetadataRegistry)
}

/**
 * 搜索对象元数据
 */
export function searchObjectMetadata(keyword: string): ObjectMetadataType[] {
  const lowerKeyword = keyword.toLowerCase()
  return Object.values(ObjectMetadataRegistry).filter(metadata =>
    metadata.name.toLowerCase().includes(lowerKeyword) ||
    metadata.code.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 搜索字段元数据
 */
export function searchFieldMetadata(keyword: string): FieldMetadataType[] {
  const lowerKeyword = keyword.toLowerCase()
  return Object.values(FieldMetadataRegistry).filter(metadata =>
    metadata.name.toLowerCase().includes(lowerKeyword) ||
    metadata.code.toLowerCase().includes(lowerKeyword)
  )
}

/**
 * 验证对象元数据
 */
export function validateObjectMetadata(metadata: ObjectMetadataType): string[] {
  const errors: string[] = []
  
  if (!metadata.code) {
    errors.push('对象编码不能为空')
  }
  
  if (!metadata.name) {
    errors.push('对象名称不能为空')
  }
  
  if (!metadata.fields || Object.keys(metadata.fields).length === 0) {
    errors.push('对象必须包含至少一个字段')
  }
  
  // 验证字段
  Object.entries(metadata.fields).forEach(([fieldCode, fieldMetadata]) => {
    const fieldErrors = validateFieldMetadata(fieldMetadata)
    fieldErrors.forEach(error => {
      errors.push(`字段 ${fieldCode}: ${error}`)
    })
  })
  
  return errors
}

/**
 * 验证字段元数据
 */
export function validateFieldMetadata(metadata: FieldMetadataType): string[] {
  const errors: string[] = []
  
  if (!metadata.code) {
    errors.push('字段编码不能为空')
  }
  
  if (!metadata.name) {
    errors.push('字段名称不能为空')
  }
  
  if (!metadata.type) {
    errors.push('字段类型不能为空')
  }
  
  const validTypes = ['string', 'number', 'boolean', 'date', 'object', 'array']
  if (!validTypes.includes(metadata.type)) {
    errors.push(`无效的字段类型: ${metadata.type}`)
  }
  
  return errors
}

/**
 * 创建默认对象元数据
 */
export function createDefaultObjectMetadata(code: string, name: string): ObjectMetadataType {
  return {
    code,
    name,
    fields: {
      id: {
        code: 'id',
        name: 'ID',
        type: 'string',
        required: true
      },
      name: {
        code: 'name',
        name: '名称',
        type: 'string',
        required: true
      },
      createTime: {
        code: 'createTime',
        name: '创建时间',
        type: 'date',
        required: false
      }
    }
  }
}

/**
 * 创建默认字段元数据
 */
export function createDefaultFieldMetadata(code: string, name: string, type: FieldMetadataType['type']): FieldMetadataType {
  return {
    code,
    name,
    type,
    required: false,
    defaultValue: getDefaultValueByType(type)
  }
}

/**
 * 根据类型获取默认值
 */
function getDefaultValueByType(type: FieldMetadataType['type']): any {
  switch (type) {
    case 'string':
      return ''
    case 'number':
      return 0
    case 'boolean':
      return false
    case 'date':
      return null
    case 'array':
      return []
    case 'object':
      return {}
    default:
      return null
  }
}

/**
 * 克隆对象元数据
 */
export function cloneObjectMetadata(metadata: ObjectMetadataType): ObjectMetadataType {
  return JSON.parse(JSON.stringify(metadata))
}

/**
 * 克隆字段元数据
 */
export function cloneFieldMetadata(metadata: FieldMetadataType): FieldMetadataType {
  return JSON.parse(JSON.stringify(metadata))
}

/**
 * 合并对象元数据
 */
export function mergeObjectMetadata(base: ObjectMetadataType, override: Partial<ObjectMetadataType>): ObjectMetadataType {
  const merged = cloneObjectMetadata(base)
  
  if (override.name) merged.name = override.name
  if (override.fields) {
    merged.fields = { ...merged.fields, ...override.fields }
  }
  
  return merged
}

/**
 * 移除对象元数据
 */
export function unregisterObjectMetadata(code: string): boolean {
  if (ObjectMetadataRegistry[code]) {
    // 同时移除相关字段元数据
    const metadata = ObjectMetadataRegistry[code]
    Object.keys(metadata.fields).forEach(fieldCode => {
      unregisterFieldMetadata(fieldCode)
    })
    
    delete ObjectMetadataRegistry[code]
    return true
  }
  return false
}

/**
 * 移除字段元数据
 */
export function unregisterFieldMetadata(code: string): boolean {
  if (FieldMetadataRegistry[code]) {
    delete FieldMetadataRegistry[code]
    return true
  }
  return false
}

/**
 * 清空所有元数据
 */
export function clearAllMetadata(): void {
  Object.keys(ObjectMetadataRegistry).forEach(code => {
    delete ObjectMetadataRegistry[code]
  })
  
  Object.keys(FieldMetadataRegistry).forEach(code => {
    delete FieldMetadataRegistry[code]
  })
}

/**
 * 获取元数据统计信息
 */
export function getMetadataStats(): {
  objectCount: number
  fieldCount: number
  fieldTypeStats: Record<string, number>
} {
  const fieldTypeStats: Record<string, number> = {}
  
  Object.values(FieldMetadataRegistry).forEach(field => {
    fieldTypeStats[field.type] = (fieldTypeStats[field.type] || 0) + 1
  })
  
  return {
    objectCount: Object.keys(ObjectMetadataRegistry).length,
    fieldCount: Object.keys(FieldMetadataRegistry).length,
    fieldTypeStats
  }
}

// 提供键用于依赖注入
export const ObjectMetadata = {
  ProvideKey: Symbol('ObjectMetadata')
}

export const FieldMetadata = {
  ProvideKey: Symbol('FieldMetadata')
}