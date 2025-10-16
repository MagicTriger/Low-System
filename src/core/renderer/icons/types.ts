/**
 * 图标库类型定义
 */

import type { Component } from 'vue'

/**
 * 图标定义
 */
export interface IconDefinition {
  /** 图标名称 */
  name: string
  /** 图标分类 */
  category: string
  /** 搜索标签 */
  tags: string[]
  /** Vue组件 */
  component: Component
  /** SVG内容（可选） */
  svg?: string
  /** 关键词（用于搜索） */
  keywords?: string[]
}

/**
 * 图标库定义
 */
export interface IconLibrary {
  /** 图标库ID */
  id: string
  /** 图标库名称 */
  name: string
  /** 版本 */
  version: string
  /** 描述 */
  description?: string
  /** 图标列表 */
  icons: IconDefinition[]
  /** 是否已加载 */
  loaded?: boolean
}

/**
 * 图标搜索选项
 */
export interface IconSearchOptions {
  /** 搜索关键词 */
  query?: string
  /** 分类筛选 */
  category?: string
  /** 图标库ID筛选 */
  libraryId?: string
  /** 标签筛选 */
  tags?: string[]
  /** 分页 */
  page?: number
  /** 每页数量 */
  pageSize?: number
}

/**
 * 图标搜索结果
 */
export interface IconSearchResult {
  /** 图标列表 */
  icons: IconDefinition[]
  /** 总数 */
  total: number
  /** 当前页 */
  page: number
  /** 每页数量 */
  pageSize: number
}
