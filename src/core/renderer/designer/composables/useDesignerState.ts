import { ref, computed, nextTick, type Ref } from 'vue'
import type { Control, RootView, DataBinding, DataFlow, DataAction, DataSourceOption } from '@/types'
import { DataBindingManager, DataFlowManager, DataActionManager } from '@/core/renderer/designer/managers'

/**
 * 画布状态接口
 */
export interface CanvasState {
  controls: Control[]
  selectedControlId: string | null
  hoveredControlId: string | null
  clipboard: Control | null
}

/**
 * 设计器状态接口
 */
export interface DesignerState {
  // 视图状态
  currentView: Ref<RootView | null>
  selectedControlId: Ref<string | null>
  selectedControlIds: Ref<string[]>

  // 画布切换状态
  activeCanvas: Ref<'page' | 'overlay'>
  activeOverlayId: Ref<string | null>
  overlayCanvasMap: Ref<Map<string, CanvasState>>

  // 画布状态
  zoom: Ref<number>
  canvasWidth: Ref<number>
  canvasHeight: Ref<number>
  showGrid: Ref<boolean>
  showGuides: Ref<boolean>

  // 历史状态
  historyIndex: Ref<number>

  // UI 状态
  activeRightPanel: Ref<'properties' | 'events' | 'layout'>
  leftPanelCollapsed: Ref<boolean>
  rightPanelCollapsed: Ref<boolean>

  // 剪贴板
  clipboard: Ref<Control | null>
}

/**
 * 设计器状态管理 Composable
 */
export function useDesignerState() {
  // 视图状态
  const currentView = ref<RootView | null>(null)
  const selectedControlId = ref<string | null>(null)
  const selectedControlIds = ref<string[]>([])

  // 画布切换状态
  const activeCanvas = ref<'page' | 'overlay'>('page')
  const activeOverlayId = ref<string | null>(null)
  const overlayCanvasMap = ref<Map<string, CanvasState>>(new Map())

  // 画布状态
  const zoom = ref(1)
  const canvasWidth = ref(1200)
  const canvasHeight = ref(800)
  const showGrid = ref(false)
  const showGuides = ref(false)

  // 历史状态
  const historyIndex = ref(-1)

  // UI 状态
  const activeRightPanel = ref<'properties' | 'events' | 'layout'>('properties')
  const leftPanelCollapsed = ref(false)
  const rightPanelCollapsed = ref(false)

  // 剪贴板
  const clipboard = ref<Control | null>(null)

  // 数据管理器
  const dataBindingManager = new DataBindingManager()
  const dataFlowManager = new DataFlowManager()
  const dataActionManager = new DataActionManager()

  // 数据状态
  const dataSources = ref<Record<string, DataSourceOption>>({})
  const dataFlows = ref<Record<string, DataFlow>>({})
  const dataActions = ref<Record<string, DataAction>>({})

  // 计算属性
  const selectedControl = computed(() => {
    if (!currentView.value || !selectedControlId.value) return null
    return findControlById(currentView.value.controls, selectedControlId.value)
  })

  const hasSelection = computed(() => selectedControlId.value !== null)

  const canvasStyle = computed(() => ({
    width: `${canvasWidth.value}px`,
    height: `${canvasHeight.value}px`,
    transform: `scale(${zoom.value})`,
    transformOrigin: 'top left',
  }))

  // 画布切换相关计算属性
  const currentCanvasControls = computed(() => {
    if (activeCanvas.value === 'page') {
      return currentView.value?.controls || []
    } else if (activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      return overlayCanvas?.controls || []
    }
    return []
  })

  const currentCanvasSelectedControlId = computed(() => {
    if (activeCanvas.value === 'page') {
      return selectedControlId.value
    } else if (activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      return overlayCanvas?.selectedControlId || null
    }
    return null
  })

  const currentCanvasHoveredControlId = computed(() => {
    if (activeCanvas.value === 'page') {
      return hoveredControlId.value
    } else if (activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      return overlayCanvas?.hoveredControlId || null
    }
    return null
  })

  const currentCanvasClipboard = computed(() => {
    if (activeCanvas.value === 'page') {
      return pageCanvasState.value.clipboard
    } else if (activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      return overlayCanvas?.clipboard || null
    }
    return null
  })

  // 辅助函数
  function findControlById(controls: Control[], id: string): Control | null {
    for (const control of controls) {
      if (control.id === id) return control
      if (control.children) {
        const found = findControlById(control.children, id)
        if (found) return found
      }
    }
    return null
  }

  // 选择操作
  function selectControl(id: string | null) {
    // 根据当前画布类型更新选中状态
    if (activeCanvas.value === 'page') {
      // 页面画布：直接更新 selectedControlId
      selectedControlId.value = id
      if (id) {
        selectedControlIds.value = [id]
      } else {
        selectedControlIds.value = []
      }
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      // 浮层画布：更新浮层画布的选中状态
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (overlayCanvas) {
        overlayCanvas.selectedControlId = id
        // 同时更新全局的 selectedControlId 以保持兼容性
        selectedControlId.value = id
        if (id) {
          selectedControlIds.value = [id]
        } else {
          selectedControlIds.value = []
        }
      }
    }

    // 同步更新designer状态模块
    try {
      const stateManager = (window as any).__MIGRATION_SYSTEM__?.stateManagement?.stateManager

      if (stateManager) {
        const designerModule = stateManager.modules?.designer

        if (designerModule && currentView.value) {
          // 查找选中的控件
          const controls =
            activeCanvas.value === 'page' ? currentView.value.controls : overlayCanvasMap.value.get(activeOverlayId.value!)?.controls || []
          const control = id ? findControlById(controls, id) : null
          designerModule.commit('setSelectedControl', control)
        } else {
          console.warn('[useDesignerState] Cannot sync: missing module or view')
        }
      }
    } catch (error) {
      console.error('[useDesignerState] Failed to sync with designer module:', error)
    }
  }

  // 悬停操作
  function hoverControl(id: string | null) {
    console.log('[useDesignerState] hoverControl called with id:', id, 'canvas:', activeCanvas.value)

    // 根据当前画布类型更新悬停状态
    if (activeCanvas.value === 'page') {
      // 页面画布：更新页面画布的悬停状态
      hoveredControlId.value = id
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      // 浮层画布：更新浮层画布的悬停状态
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (overlayCanvas) {
        overlayCanvas.hoveredControlId = id
        // 同时更新全局的 hoveredControlId 以保持兼容性
        hoveredControlId.value = id
        console.log('[useDesignerState] Updated overlay canvas hover:', activeOverlayId.value, id)
      }
    }
  }

  function clearHover() {
    hoverControl(null)
  }

  function toggleControlSelection(id: string) {
    const index = selectedControlIds.value.indexOf(id)
    if (index > -1) {
      selectedControlIds.value.splice(index, 1)
      if (selectedControlId.value === id) {
        selectedControlId.value = selectedControlIds.value[0] || null
      }
    } else {
      selectedControlIds.value.push(id)
      selectedControlId.value = id
    }
  }

  function clearSelection() {
    selectedControlId.value = null
    selectedControlIds.value = []
  }

  // 画布操作
  function setZoom(value: number) {
    zoom.value = Math.max(0.1, Math.min(5, value))
  }

  function zoomIn() {
    setZoom(zoom.value * 1.2)
  }

  function zoomOut() {
    setZoom(zoom.value / 1.2)
  }

  function resetZoom() {
    zoom.value = 1
  }

  function toggleGrid() {
    showGrid.value = !showGrid.value
  }

  function toggleGuides() {
    showGuides.value = !showGuides.value
  }

  // 页面画布状态(用于保存页面画布的独立状态)
  const pageCanvasState = ref<{
    selectedControlId: string | null
    hoveredControlId: string | null
    clipboard: Control | null
  }>({
    selectedControlId: null,
    hoveredControlId: null,
    clipboard: null,
  })

  // 悬停状态
  const hoveredControlId = ref<string | null>(null)

  // 画布切换操作
  function switchCanvas(canvasType: 'page' | 'overlay', overlayId?: string) {
    console.log('[useDesignerState] switchCanvas:', canvasType, overlayId)

    // 保存当前画布的状态
    if (activeCanvas.value === 'page') {
      // 保存页面画布状态
      pageCanvasState.value.selectedControlId = selectedControlId.value
      pageCanvasState.value.hoveredControlId = hoveredControlId.value
      pageCanvasState.value.clipboard = clipboard.value
      console.log('[useDesignerState] Saved page canvas state:', pageCanvasState.value)
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      // 保存浮层画布状态
      const currentOverlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (currentOverlayCanvas) {
        currentOverlayCanvas.selectedControlId = selectedControlId.value
        currentOverlayCanvas.hoveredControlId = hoveredControlId.value
        currentOverlayCanvas.clipboard = clipboard.value
        console.log('[useDesignerState] Saved overlay canvas state:', activeOverlayId.value, currentOverlayCanvas)
      }
    }

    // 切换画布类型
    activeCanvas.value = canvasType

    if (canvasType === 'overlay') {
      if (!overlayId) {
        console.warn('[useDesignerState] switchCanvas to overlay requires overlayId')
        return
      }

      activeOverlayId.value = overlayId

      // 如果浮层画布不存在,创建新的画布状态
      if (!overlayCanvasMap.value.has(overlayId)) {
        console.log('[useDesignerState] Creating new overlay canvas state for:', overlayId)
        overlayCanvasMap.value.set(overlayId, {
          controls: [],
          selectedControlId: null,
          hoveredControlId: null,
          clipboard: null,
        })
      }

      // 恢复浮层画布的状态
      const overlayCanvas = overlayCanvasMap.value.get(overlayId)
      if (overlayCanvas) {
        selectedControlId.value = overlayCanvas.selectedControlId
        hoveredControlId.value = overlayCanvas.hoveredControlId
        clipboard.value = overlayCanvas.clipboard
        console.log('[useDesignerState] Restored overlay canvas state:', overlayCanvas)
      }
    } else {
      // 切换到页面画布,恢复页面画布状态
      activeOverlayId.value = null
      selectedControlId.value = pageCanvasState.value.selectedControlId
      hoveredControlId.value = pageCanvasState.value.hoveredControlId
      clipboard.value = pageCanvasState.value.clipboard
      console.log('[useDesignerState] Switched to page canvas, restored state:', pageCanvasState.value)
    }
  }

  function getOverlayCanvas(overlayId: string): CanvasState | undefined {
    return overlayCanvasMap.value.get(overlayId)
  }

  function createOverlayCanvas(overlayId: string, initialControls: Control[] = []): CanvasState {
    const canvasState: CanvasState = {
      controls: initialControls,
      selectedControlId: null,
      hoveredControlId: null,
      clipboard: null,
    }
    overlayCanvasMap.value.set(overlayId, canvasState)
    console.log('[useDesignerState] Created overlay canvas:', overlayId, canvasState)
    return canvasState
  }

  function removeOverlayCanvas(overlayId: string) {
    const deleted = overlayCanvasMap.value.delete(overlayId)
    console.log('[useDesignerState] Removed overlay canvas:', overlayId, deleted)

    // 如果删除的是当前活动的浮层,切换回页面画布
    if (activeOverlayId.value === overlayId) {
      switchCanvas('page')
    }
  }

  function updateOverlayCanvasControls(overlayId: string, controls: Control[]) {
    const overlayCanvas = overlayCanvasMap.value.get(overlayId)
    if (overlayCanvas) {
      overlayCanvas.controls = controls
      console.log('[useDesignerState] Updated overlay canvas controls:', overlayId, controls.length)
    } else {
      console.warn('[useDesignerState] Overlay canvas not found:', overlayId)
    }
  }

  // 视图操作
  function setView(view: RootView) {
    currentView.value = view
    clearSelection()
  }

  function updateControl(controlId: string, updates: Partial<Control>) {
    if (!currentView.value) return

    console.log('🔄 [updateControl] Updating control:', controlId, 'canvas:', activeCanvas.value, updates)

    // 获取当前画布的控件列表
    let targetControls: Control[]
    if (activeCanvas.value === 'page') {
      targetControls = currentView.value.controls
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (!overlayCanvas) {
        console.warn('[updateControl] Overlay canvas not found:', activeOverlayId.value)
        return
      }
      targetControls = overlayCanvas.controls
    } else {
      console.warn('[updateControl] Invalid canvas state')
      return
    }

    // 深拷贝控件列表,确保所有引用都是新的
    const newControls = JSON.parse(JSON.stringify(targetControls))

    // 递归查找并更新控件
    function findAndUpdate(controls: Control[]): boolean {
      for (let i = 0; i < controls.length; i++) {
        if (controls[i].id === controlId) {
          // 找到目标控件,深度合并更新
          Object.keys(updates).forEach(key => {
            const value = updates[key as keyof Control]
            if (value !== undefined) {
              if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                // 对象类型:深度合并
                controls[i][key as keyof Control] = {
                  ...(controls[i][key as keyof Control] as any),
                  ...value,
                } as any
              } else {
                // 基本类型或数组:直接赋值
                controls[i][key as keyof Control] = value as any
              }
            }
          })
          console.log('✅ [updateControl] Control updated:', controls[i])
          return true
        }

        // 递归查找子控件
        if (controls[i].children && controls[i].children!.length > 0) {
          if (findAndUpdate(controls[i].children!)) {
            return true
          }
        }
      }
      return false
    }

    // 执行更新
    const found = findAndUpdate(newControls)

    if (found) {
      // 更新对应画布的控件列表
      if (activeCanvas.value === 'page') {
        // 完全替换currentView,触发响应式更新
        currentView.value = { ...currentView.value, controls: newControls }
        console.log('✅ [updateControl] Page canvas updated, triggering re-render')
      } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
        // 更新浮层画布
        const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
        if (overlayCanvas) {
          overlayCanvas.controls = newControls
          console.log('✅ [updateControl] Overlay canvas updated, triggering re-render')
        }
      }

      // 如果更新的是容器的布局方向,重新调整其中的表格尺寸
      if (updates.layout?.flexDirection) {
        const updatedControl = findControlById(newControls, controlId)
        if (updatedControl?.kind === 'Container' || updatedControl?.kind === 'Flex' || updatedControl?.kind === 'Grid') {
          autoResizeTablesInContainer(updatedControl)
        }
      }

      // 触发额外的更新事件
      nextTick(() => {
        window.dispatchEvent(
          new CustomEvent('designer:control-updated', {
            detail: { controlId, updates, canvas: activeCanvas.value },
          })
        )
      })
    } else {
      console.warn('❌ [updateControl] Control not found:', controlId)
    }
  }

  /**
   * 自动调整容器中表格组件的尺寸
   * 根据表格数量平均分配空间
   */
  function autoResizeTablesInContainer(container: Control) {
    if (!container.children) return

    // 找出所有表格组件
    const tableControls = container.children.filter(child => child.kind === 'Table')
    if (tableControls.length === 0) return

    // 计算每个表格应该占用的百分比
    const percentage = Math.floor(10000 / tableControls.length) / 100 // 保留2位小数

    // 获取容器的布局方向
    const flexDirection = container.layout?.flexDirection || 'row'
    const isVertical = flexDirection === 'column' || flexDirection === 'column-reverse'

    // 根据布局方向设置对应的尺寸
    tableControls.forEach(table => {
      if (!table.layout) {
        table.layout = {}
      }

      if (isVertical) {
        // 纵向布局:设置高度为平均值,宽度占满
        table.layout.height = { type: '%', value: percentage }
        table.layout.width = { type: '%', value: 100 }
      } else {
        // 横向布局:设置宽度为平均值,高度占满
        table.layout.width = { type: '%', value: percentage }
        table.layout.height = { type: '%', value: 100 }
      }
    })

    // 触发视图更新
    if (currentView.value) {
      currentView.value = { ...currentView.value }
    }
  }

  function addControl(control: Control, parentId?: string, index?: number) {
    if (!currentView.value) return

    console.log('[useDesignerState] addControl:', control.id, 'canvas:', activeCanvas.value, 'parentId:', parentId)

    // 在浮层模式下，如果没有指定parentId，默认添加到当前浮层
    if (activeCanvas.value === 'overlay' && activeOverlayId.value && !parentId) {
      parentId = activeOverlayId.value
      console.log('[useDesignerState] Auto-set parentId to current overlay:', parentId)
    }

    // 获取当前画布的控件列表
    let targetControls: Control[]
    if (activeCanvas.value === 'page') {
      targetControls = currentView.value.controls
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      // 在浮层模式下，需要在页面控件和浮层列表中查找
      targetControls = currentView.value.controls
      // 同时也需要在overlays数组中查找
      if (currentView.value.overlays) {
        targetControls = [...targetControls, ...currentView.value.overlays]
      }
    } else {
      console.warn('[useDesignerState] Invalid canvas state')
      return
    }

    if (parentId) {
      // 先在页面控件中查找父控件
      let parent = findControlById(currentView.value.controls, parentId)

      // 如果在页面控件中没找到，尝试在浮层列表中查找
      if (!parent && currentView.value.overlays) {
        parent = currentView.value.overlays.find(o => o.id === parentId)
        if (!parent) {
          // 在浮层的子控件中查找
          for (const overlay of currentView.value.overlays) {
            parent = findControlById(overlay.children || [], parentId)
            if (parent) break
          }
        }
      }

      if (parent) {
        if (!parent.children) parent.children = []
        if (index !== undefined) {
          parent.children.splice(index, 0, control)
        } else {
          parent.children.push(control)
        }
        console.log('[useDesignerState] Control added to parent:', parentId, 'children count:', parent.children.length)

        // 如果添加的是表格组件到容器中,自动调整所有表格的尺寸
        if (control.kind === 'Table' && (parent.kind === 'Container' || parent.kind === 'Flex' || parent.kind === 'Grid')) {
          autoResizeTablesInContainer(parent)
        }
      } else {
        console.warn('[useDesignerState] Parent control not found:', parentId)
      }
    } else {
      if (index !== undefined) {
        targetControls.splice(index, 0, control)
      } else {
        targetControls.push(control)
      }
    }

    // 触发视图更新
    currentView.value = { ...currentView.value }

    console.log('[useDesignerState] Control added to', activeCanvas.value, 'canvas')
  }

  function removeControl(controlId: string) {
    if (!currentView.value) return

    console.log('[useDesignerState] removeControl:', controlId, 'canvas:', activeCanvas.value)

    // 找到要删除的控件和其父容器
    let parentContainer: Control | null = null
    let removedControl: Control | null = null

    function findControlAndParent(controls: Control[], parent?: Control): boolean {
      for (const control of controls) {
        if (control.id === controlId) {
          removedControl = control
          parentContainer = parent || null
          return true
        }
        if (control.children && findControlAndParent(control.children, control)) {
          return true
        }
      }
      return false
    }

    // 在页面控件中查找
    findControlAndParent(currentView.value.controls)

    // 如果在页面控件中没找到，尝试在浮层列表中查找
    if (!removedControl && currentView.value.overlays) {
      // 检查是否是浮层本身
      const overlayIndex = currentView.value.overlays.findIndex(o => o.id === controlId)
      if (overlayIndex > -1) {
        removedControl = currentView.value.overlays[overlayIndex]
        currentView.value.overlays.splice(overlayIndex, 1)
        console.log('[useDesignerState] Overlay removed from overlays array')

        // 清理浮层画布状态
        removeOverlayCanvas(controlId)

        // 触发视图更新
        currentView.value = { ...currentView.value }
        return
      }

      // 在浮层的子控件中查找
      for (const overlay of currentView.value.overlays) {
        if (findControlAndParent(overlay.children || [], overlay)) {
          break
        }
      }
    }

    function removeFromArray(controls: Control[]): boolean {
      const index = controls.findIndex(c => c.id === controlId)
      if (index > -1) {
        controls.splice(index, 1)
        return true
      }

      for (const control of controls) {
        if (control.children && removeFromArray(control.children)) {
          return true
        }
      }

      return false
    }

    // 从页面控件中删除
    let removed = removeFromArray(currentView.value.controls)

    // 如果在页面控件中没删除成功，尝试从浮层中删除
    if (!removed && currentView.value.overlays) {
      for (const overlay of currentView.value.overlays) {
        if (removeFromArray(overlay.children || [])) {
          removed = true
          break
        }
      }
    }

    if (removed) {
      console.log('[useDesignerState] Control removed:', controlId)
    } else {
      console.warn('[useDesignerState] Control not found:', controlId)
    }

    // 如果删除的是表格组件,并且父容器是Container/Flex/Grid,重新调整剩余表格的尺寸
    if (
      removedControl?.kind === 'Table' &&
      (parentContainer?.kind === 'Container' || parentContainer?.kind === 'Flex' || parentContainer?.kind === 'Grid')
    ) {
      autoResizeTablesInContainer(parentContainer)
    }

    // 触发视图更新
    if (activeCanvas.value === 'page') {
      currentView.value = { ...currentView.value }
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      // 触发浮层画布更新
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (overlayCanvas) {
        overlayCanvas.controls = [...overlayCanvas.controls]
      }
    }

    // 清除选中状态
    if (activeCanvas.value === 'page') {
      if (selectedControlId.value === controlId) {
        clearSelection()
      }
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (overlayCanvas && overlayCanvas.selectedControlId === controlId) {
        overlayCanvas.selectedControlId = null
        selectedControlId.value = null
        selectedControlIds.value = []
      }
    }

    console.log('[useDesignerState] Control removed from', activeCanvas.value, 'canvas')
  }

  // 剪贴板操作
  function copyToClipboard(control: Control) {
    const clonedControl = JSON.parse(JSON.stringify(control))
    clipboard.value = clonedControl

    // 同时更新当前画布的剪贴板状态
    if (activeCanvas.value === 'page') {
      pageCanvasState.value.clipboard = clonedControl
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (overlayCanvas) {
        overlayCanvas.clipboard = clonedControl
      }
    }

    console.log('[useDesignerState] Copied to clipboard:', control.id, 'canvas:', activeCanvas.value)
  }

  function pasteFromClipboard(parentId?: string, index?: number) {
    // 获取当前画布的剪贴板内容
    let clipboardContent: Control | null = null

    if (activeCanvas.value === 'page') {
      clipboardContent = pageCanvasState.value.clipboard || clipboard.value
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      clipboardContent = overlayCanvas?.clipboard || clipboard.value
    } else {
      clipboardContent = clipboard.value
    }

    if (!clipboardContent) {
      console.warn('[useDesignerState] No content in clipboard')
      return null
    }

    const cloned = JSON.parse(JSON.stringify(clipboardContent))
    // 重新生成 ID
    const regenerateIds = (ctrl: Control) => {
      ctrl.id = `${ctrl.kind}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      if (ctrl.children) {
        ctrl.children.forEach(regenerateIds)
      }
    }
    regenerateIds(cloned)

    addControl(cloned, parentId, index)
    console.log('[useDesignerState] Pasted from clipboard:', cloned.id, 'canvas:', activeCanvas.value)
    return cloned
  }

  function clearClipboard() {
    clipboard.value = null

    // 同时清除当前画布的剪贴板
    if (activeCanvas.value === 'page') {
      pageCanvasState.value.clipboard = null
    } else if (activeCanvas.value === 'overlay' && activeOverlayId.value) {
      const overlayCanvas = overlayCanvasMap.value.get(activeOverlayId.value)
      if (overlayCanvas) {
        overlayCanvas.clipboard = null
      }
    }

    console.log('[useDesignerState] Clipboard cleared, canvas:', activeCanvas.value)
  }

  // 数据源操作
  function addDataSource(config: Partial<DataSourceOption>): string {
    const id = config.id || `ds_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    dataSources.value[id] = {
      id,
      name: config.name || '新数据源',
      type: config.type || 'api',
      ...config,
    } as DataSourceOption
    return id
  }

  function updateDataSource(id: string, updates: Partial<DataSourceOption>) {
    if (dataSources.value[id]) {
      dataSources.value[id] = { ...dataSources.value[id], ...updates }
    }
  }

  function removeDataSource(id: string) {
    delete dataSources.value[id]
  }

  function getDataSource(id: string): DataSourceOption | undefined {
    return dataSources.value[id]
  }

  // 数据流操作
  function addDataFlow(config: Partial<DataFlow>): string {
    const flow = dataFlowManager.createDataFlow(config)
    dataFlows.value[flow.id] = flow
    return flow.id
  }

  function updateDataFlow(id: string, updates: Partial<DataFlow>) {
    dataFlowManager.updateDataFlow(id, updates)
    const flow = dataFlowManager.getDataFlow(id)
    if (flow) {
      dataFlows.value[id] = flow
    }
  }

  function removeDataFlow(id: string) {
    dataFlowManager.deleteDataFlow(id)
    delete dataFlows.value[id]
  }

  function getDataFlow(id: string): DataFlow | undefined {
    return dataFlowManager.getDataFlow(id)
  }

  // 数据操作
  function addDataAction(config: Partial<DataAction>): string {
    const action = dataActionManager.createDataAction(config)
    dataActions.value[action.id] = action
    return action.id
  }

  function updateDataAction(id: string, updates: Partial<DataAction>) {
    dataActionManager.updateDataAction(id, updates)
    const action = dataActionManager.getDataAction(id)
    if (action) {
      dataActions.value[id] = action
    }
  }

  function removeDataAction(id: string) {
    dataActionManager.deleteDataAction(id)
    delete dataActions.value[id]
  }

  function getDataAction(id: string): DataAction | undefined {
    return dataActionManager.getDataAction(id)
  }

  // 数据绑定操作
  function bindControl(controlId: string, controlName: string, controlKind: string, binding: DataBinding) {
    dataBindingManager.createBinding(controlId, controlName, controlKind, binding)
    // 更新控件的dataBinding属性
    updateControl(controlId, { dataBinding: binding })
  }

  function unbindControl(controlId: string) {
    dataBindingManager.removeBinding(controlId)
    // 清除控件的dataBinding属性
    updateControl(controlId, { dataBinding: undefined })
  }

  function updateBinding(controlId: string, updates: Partial<DataBinding>) {
    dataBindingManager.updateBinding(controlId, updates)
    const binding = dataBindingManager.getBinding(controlId)
    if (binding) {
      updateControl(controlId, { dataBinding: binding })
    }
  }

  function getBinding(controlId: string): DataBinding | undefined {
    return dataBindingManager.getBinding(controlId)
  }

  // 批量设置数据
  function setDataSources(sources: Record<string, DataSourceOption>) {
    dataSources.value = { ...sources }
  }

  function setDataFlows(flows: Record<string, DataFlow>) {
    dataFlows.value = { ...flows }
    // 同步到管理器
    dataFlowManager.clear()
    Object.values(flows).forEach(flow => {
      dataFlowManager.createDataFlow(flow)
    })
  }

  function setDataActions(actions: Record<string, DataAction>) {
    dataActions.value = { ...actions }
    // 同步到管理器
    dataActionManager.clear()
    Object.values(actions).forEach(action => {
      dataActionManager.createDataAction(action)
    })
  }

  return {
    // 状态
    currentView,
    selectedControlId,
    selectedControlIds,
    hoveredControlId,
    activeCanvas,
    activeOverlayId,
    overlayCanvasMap,
    zoom,
    canvasWidth,
    canvasHeight,
    showGrid,
    showGuides,
    historyIndex,
    activeRightPanel,
    leftPanelCollapsed,
    rightPanelCollapsed,
    clipboard,

    // 计算属性
    selectedControl,
    hasSelection,
    canvasStyle,
    currentCanvasControls,
    currentCanvasSelectedControlId,
    currentCanvasHoveredControlId,
    currentCanvasClipboard,

    // 方法
    selectControl,
    toggleControlSelection,
    clearSelection,
    hoverControl,
    clearHover,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleGrid,
    toggleGuides,
    switchCanvas,
    getOverlayCanvas,
    createOverlayCanvas,
    removeOverlayCanvas,
    updateOverlayCanvasControls,
    setView,
    updateControl,
    addControl,
    removeControl,
    copyToClipboard,
    pasteFromClipboard,
    clearClipboard,
    findControlById,
    autoResizeTablesInContainer,

    // 数据管理器
    dataBindingManager,
    dataFlowManager,
    dataActionManager,

    // 数据状态
    dataSources,
    dataFlows,
    dataActions,

    // 数据操作方法
    addDataSource,
    updateDataSource,
    removeDataSource,
    getDataSource,
    addDataFlow,
    updateDataFlow,
    removeDataFlow,
    getDataFlow,
    addDataAction,
    updateDataAction,
    removeDataAction,
    getDataAction,
    bindControl,
    unbindControl,
    updateBinding,
    getBinding,
    setDataSources,
    setDataFlows,
    setDataActions,
  }
}
