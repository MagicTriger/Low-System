import { ref, type Ref } from 'vue'
import type { Control, RootView } from '@/core/types'

/**
 * 历史操作类型
 */
export type HistoryAction = 'add-control' | 'delete-control' | 'move-control' | 'resize-control' | 'update-property' | 'reorder-control'

/**
 * 历史记录条目
 */
export interface HistoryEntry {
  id: string
  timestamp: number
  action: HistoryAction
  data: any
  description: string
}

/**
 * 历史管理器配置
 */
export interface HistoryManagerConfig {
  maxEntries?: number
  enabled?: boolean
}

/**
 * 历史管理器
 */
export class HistoryManager {
  private history: Ref<HistoryEntry[]>
  private currentIndex: Ref<number>
  private maxEntries: number
  private enabled: boolean

  constructor(config: HistoryManagerConfig = {}) {
    this.history = ref<HistoryEntry[]>([])
    this.currentIndex = ref(-1)
    this.maxEntries = config.maxEntries || 50
    this.enabled = config.enabled !== false
  }

  /**
   * 添加历史记录
   */
  push(action: HistoryAction, data: any, description: string): void {
    if (!this.enabled) return

    // 如果当前不在历史记录末尾，删除后面的记录
    if (this.currentIndex.value < this.history.value.length - 1) {
      this.history.value = this.history.value.slice(0, this.currentIndex.value + 1)
    }

    // 创建新的历史记录
    const entry: HistoryEntry = {
      id: `history_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      action,
      data: JSON.parse(JSON.stringify(data)), // 深拷贝数据
      description,
    }

    // 添加到历史记录
    this.history.value.push(entry)
    this.currentIndex.value++

    // 限制历史记录数量
    if (this.history.value.length > this.maxEntries) {
      this.history.value.shift()
      this.currentIndex.value--
    }
  }

  /**
   * 撤销操作
   */
  undo(): HistoryEntry | null {
    if (!this.canUndo()) return null

    const entry = this.history.value[this.currentIndex.value]
    this.currentIndex.value--

    return entry
  }

  /**
   * 重做操作
   */
  redo(): HistoryEntry | null {
    if (!this.canRedo()) return null

    this.currentIndex.value++
    const entry = this.history.value[this.currentIndex.value]

    return entry
  }

  /**
   * 是否可以撤销
   */
  canUndo(): boolean {
    return this.currentIndex.value >= 0
  }

  /**
   * 是否可以重做
   */
  canRedo(): boolean {
    return this.currentIndex.value < this.history.value.length - 1
  }

  /**
   * 清空历史记录
   */
  clear(): void {
    this.history.value = []
    this.currentIndex.value = -1
  }

  /**
   * 获取当前历史记录
   */
  getHistory(): HistoryEntry[] {
    return this.history.value
  }

  /**
   * 获取当前索引
   */
  getCurrentIndex(): number {
    return this.currentIndex.value
  }

  /**
   * 启用/禁用历史记录
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled
  }

  /**
   * 获取历史记录统计
   */
  getStats(): {
    total: number
    current: number
    canUndo: boolean
    canRedo: boolean
  } {
    return {
      total: this.history.value.length,
      current: this.currentIndex.value,
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
    }
  }
}

/**
 * 历史管理器 Composable
 */
export function useHistoryManager(config?: HistoryManagerConfig) {
  const manager = new HistoryManager(config)

  return {
    push: manager.push.bind(manager),
    undo: manager.undo.bind(manager),
    redo: manager.redo.bind(manager),
    canUndo: manager.canUndo.bind(manager),
    canRedo: manager.canRedo.bind(manager),
    clear: manager.clear.bind(manager),
    getHistory: manager.getHistory.bind(manager),
    getCurrentIndex: manager.getCurrentIndex.bind(manager),
    setEnabled: manager.setEnabled.bind(manager),
    getStats: manager.getStats.bind(manager),
  }
}
