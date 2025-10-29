import { ref } from 'vue'
import type { Control } from '@/core/types'

/**
 * 拖拽数据类型
 */
export type DragDataType = 'control-library' | 'outline-tree' | 'canvas'

/**
 * 拖拽数据
 */
export interface DragData {
  type: DragDataType
  controlKind?: string // 组件库拖拽
  controlId?: string // 现有控件拖拽
  control?: Control
}

/**
 * 放置位置
 */
export interface DropPosition {
  x: number
  y: number
  parentId?: string
  index?: number
}

/**
 * 放置目标
 */
export interface DropTarget {
  type: 'canvas' | 'container'
  controlId?: string
  position: DropPosition
  valid: boolean
}

/**
 * 放置指示器
 */
export interface DropIndicator {
  visible: boolean
  type: 'before' | 'after' | 'inside'
  targetId: string
  rect?: DOMRect
}

/**
 * 拖放管理器 Composable
 */
export function useDragDrop() {
  // 状态
  const isDragging = ref(false)
  const dragData = ref<DragData | null>(null)
  const dropTarget = ref<DropTarget | null>(null)
  const dropIndicator = ref<DropIndicator | null>(null)
  const dragPreview = ref<HTMLElement | null>(null)

  /**
   * 开始拖拽
   */
  function startDrag(data: DragData, preview?: HTMLElement): void {
    isDragging.value = true
    dragData.value = data
    dragPreview.value = preview || null
  }

  /**
   * 结束拖拽
   */
  function endDrag(): void {
    isDragging.value = false
    dragData.value = null
    dropTarget.value = null
    dropIndicator.value = null
    dragPreview.value = null
  }

  /**
   * 设置放置目标
   */
  function setDropTarget(target: DropTarget | null): void {
    dropTarget.value = target
  }

  /**
   * 设置放置指示器
   */
  function setDropIndicator(indicator: DropIndicator | null): void {
    dropIndicator.value = indicator
  }

  /**
   * 验证放置目标
   */
  function validateDropTarget(targetType: 'canvas' | 'container', targetId?: string): boolean {
    if (!dragData.value) return false

    // 如果是从组件库拖拽，总是允许
    if (dragData.value.type === 'control-library') {
      return true
    }

    // 如果是从大纲树或画布拖拽现有控件
    if (dragData.value.controlId) {
      // 不能拖到自己身上
      if (targetId === dragData.value.controlId) {
        return false
      }

      // 检查是否拖到自己的子控件上
      if (isDescendant(dragData.value.controlId, targetId)) {
        return false
      }

      return true
    }

    return false
  }

  /**
   * 计算放置位置
   */
  function calculateDropPosition(event: DragEvent, targetElement: HTMLElement, targetId?: string): DropPosition {
    const rect = targetElement.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    return {
      x,
      y,
      parentId: targetId,
      index: undefined, // 将在实际放置时计算
    }
  }

  /**
   * 处理拖拽进入
   */
  function handleDragEnter(event: DragEvent, targetType: 'canvas' | 'container', targetId?: string): void {
    event.preventDefault()

    const valid = validateDropTarget(targetType, targetId)

    if (valid && event.currentTarget instanceof HTMLElement) {
      const position = calculateDropPosition(event, event.currentTarget, targetId)

      setDropTarget({
        type: targetType,
        controlId: targetId,
        position,
        valid,
      })
    }
  }

  /**
   * 处理拖拽经过
   */
  function handleDragOver(event: DragEvent, targetType: 'canvas' | 'container', targetId?: string): void {
    event.preventDefault()

    if (dropTarget.value && event.currentTarget instanceof HTMLElement) {
      const position = calculateDropPosition(event, event.currentTarget, targetId)
      dropTarget.value.position = position
    }
  }

  /**
   * 处理拖拽离开
   */
  function handleDragLeave(event: DragEvent): void {
    // 只有当离开的是目标元素本身时才清除
    if (event.currentTarget === event.target) {
      setDropTarget(null)
      setDropIndicator(null)
    }
  }

  /**
   * 处理放置
   */
  function handleDrop(event: DragEvent): DropTarget | null {
    event.preventDefault()

    const target = dropTarget.value

    // 清理状态
    endDrag()

    return target
  }

  /**
   * 创建拖拽数据传输对象
   */
  function createDragTransfer(event: DragEvent, data: DragData): void {
    if (!event.dataTransfer) return

    // 设置拖拽效果
    event.dataTransfer.effectAllowed = 'copy'

    // 设置数据
    event.dataTransfer.setData('text/plain', JSON.stringify(data))
    event.dataTransfer.setData('application/json', JSON.stringify(data))
  }

  /**
   * 从拖拽数据传输对象读取数据
   */
  function readDragTransfer(event: DragEvent): DragData | null {
    if (!event.dataTransfer) return null

    try {
      const jsonData = event.dataTransfer.getData('application/json')
      if (jsonData) {
        return JSON.parse(jsonData)
      }

      const textData = event.dataTransfer.getData('text/plain')
      if (textData) {
        return JSON.parse(textData)
      }
    } catch (error) {
      console.error('Failed to read drag data:', error)
    }

    return null
  }

  /**
   * 检查目标控件是否是源控件的后代
   */
  function isDescendant(sourceId: string, targetId: string): boolean {
    // 需要从全局状态或传入的控件树中查找
    // 这里返回 false 作为默认值，实际实现需要访问控件树
    return false
  }

  return {
    // 状态
    isDragging,
    dragData,
    dropTarget,
    dropIndicator,
    dragPreview,

    // 方法
    startDrag,
    endDrag,
    setDropTarget,
    setDropIndicator,
    validateDropTarget,
    calculateDropPosition,
    handleDragEnter,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    createDragTransfer,
    readDragTransfer,
    isDescendant,
  }
}
