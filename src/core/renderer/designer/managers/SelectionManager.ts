import { ref, computed, type Ref, type ComputedRef } from 'vue'
import type { Control } from '@/core/types'

/**
 * 选择管理器
 */
export class SelectionManager {
  private selectedIds: Ref<string[]>
  private activeId: Ref<string | null>
  private hoveredId: Ref<string | null>

  constructor() {
    this.selectedIds = ref<string[]>([])
    this.activeId = ref<string | null>(null)
    this.hoveredId = ref<string | null>(null)
  }

  /**
   * 选择单个控件
   */
  select(id: string): void {
    this.activeId.value = id
    this.selectedIds.value = [id]
  }

  /**
   * 添加到选择
   */
  addToSelection(id: string): void {
    if (!this.selectedIds.value.includes(id)) {
      this.selectedIds.value.push(id)
      this.activeId.value = id
    }
  }

  /**
   * 从选择中移除
   */
  removeFromSelection(id: string): void {
    const index = this.selectedIds.value.indexOf(id)
    if (index > -1) {
      this.selectedIds.value.splice(index, 1)

      if (this.activeId.value === id) {
        this.activeId.value = this.selectedIds.value[0] || null
      }
    }
  }

  /**
   * 切换选择状态
   */
  toggle(id: string): void {
    if (this.selectedIds.value.includes(id)) {
      this.removeFromSelection(id)
    } else {
      this.addToSelection(id)
    }
  }

  /**
   * 清空选择
   */
  clear(): void {
    this.selectedIds.value = []
    this.activeId.value = null
  }

  /**
   * 是否选中
   */
  isSelected(id: string): boolean {
    return this.selectedIds.value.includes(id)
  }

  /**
   * 是否激活
   */
  isActive(id: string): boolean {
    return this.activeId.value === id
  }

  /**
   * 设置悬停
   */
  setHovered(id: string | null): void {
    this.hoveredId.value = id
  }

  /**
   * 是否悬停
   */
  isHovered(id: string): boolean {
    return this.hoveredId.value === id
  }

  /**
   * 获取选中的ID列表
   */
  getSelectedIds(): string[] {
    return this.selectedIds.value
  }

  /**
   * 获取激活的ID
   */
  getActiveId(): string | null {
    return this.activeId.value
  }

  /**
   * 获取悬停的ID
   */
  getHoveredId(): string | null {
    return this.hoveredId.value
  }

  /**
   * 是否有选择
   */
  hasSelection(): boolean {
    return this.selectedIds.value.length > 0
  }

  /**
   * 获取选择数量
   */
  getSelectionCount(): number {
    return this.selectedIds.value.length
  }

  /**
   * 是否多选
   */
  isMultiSelection(): boolean {
    return this.selectedIds.value.length > 1
  }
}

/**
 * 选择管理器 Composable
 */
export function useSelectionManager() {
  const manager = new SelectionManager()

  // 响应式引用
  const selectedIds = computed(() => manager.getSelectedIds())
  const activeId = computed(() => manager.getActiveId())
  const hoveredId = computed(() => manager.getHoveredId())
  const hasSelection = computed(() => manager.hasSelection())
  const selectionCount = computed(() => manager.getSelectionCount())
  const isMultiSelection = computed(() => manager.isMultiSelection())

  return {
    // 状态
    selectedIds,
    activeId,
    hoveredId,
    hasSelection,
    selectionCount,
    isMultiSelection,

    // 方法
    select: manager.select.bind(manager),
    addToSelection: manager.addToSelection.bind(manager),
    removeFromSelection: manager.removeFromSelection.bind(manager),
    toggle: manager.toggle.bind(manager),
    clear: manager.clear.bind(manager),
    isSelected: manager.isSelected.bind(manager),
    isActive: manager.isActive.bind(manager),
    setHovered: manager.setHovered.bind(manager),
    isHovered: manager.isHovered.bind(manager),
  }
}
