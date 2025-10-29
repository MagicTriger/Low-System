/**
 * 共享 API 类型定义
 *
 * 此文件包含在多个 API 模块中使用的通用类型定义，
 * 避免在不同模块中重复定义相同的类型导致命名冲突。
 */

/**
 * 标准 API 响应格式
 *
 * 用于包装所有后端 API 的响应数据
 */
export interface StandardApiResponse<T = any> {
  /** 请求是否成功 */
  success: boolean
  /** 响应状态码 */
  code: number
  /** 响应消息 */
  message: string
  /** 响应数据 */
  data: T
}

/**
 * 菜单树节点
 *
 * 用于表示菜单的树形结构
 */
export interface MenuTreeNode {
  /** 菜单ID */
  id: number
  /** 菜单编码 */
  menuCode: string
  /** 菜单名称 */
  name: string
  /** 所属模块 */
  module: string
  /** 节点类型 */
  nodeType: number
  /** 排序顺序 */
  sortOrder: number
  /** 创建时间 */
  createdAt: string
  /** 父节点ID */
  parentId: number | null
  /** URL地址 */
  url?: string
  /** 图标 */
  icon?: string
  /** 路径 */
  path?: string
  /** 元数据 */
  meta?: string
  /** 子节点 */
  children?: MenuTreeNode[]
}

/**
 * 分页参数
 */
export interface PaginationParams {
  /** 页码（从1开始） */
  page?: number
  /** 每页数量 */
  size?: number
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  /** 数据列表 */
  data: T[]
  /** 总记录数 */
  total: number
  /** 当前页码 */
  page: number
  /** 每页数量 */
  size: number
  /** 总页数 */
  totalPages: number
  /** 是否有下一页 */
  hasNext: boolean
  /** 是否有上一页 */
  hasPrevious: boolean
}
