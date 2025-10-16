import { ref, computed, nextTick, type Ref } from 'vue'
import type { Control, RootView, DataBinding, DataFlow, DataAction, DataSourceOption } from '@/types'
import { DataBindingManager, DataFlowManager, DataActionManager } from '@/core/renderer/designer/managers'

/**
 * 设计器状态接口
 */
export interface DesignerState {
  // 视图状态
  currentView: Ref<RootView | null>
  selectedControlId: Ref<string | null>
  selectedControlIds: Ref<string[]>

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
    console.log('[useDesignerState] selectControl called with id:', id)
    selectedControlId.value = id
    if (id) {
      selectedControlIds.value = [id]
    } else {
      selectedControlIds.value = []
    }

    // 同步更新designer状态模块
    try {
      const stateManager = (window as any).__MIGRATION_SYSTEM__?.stateManagement?.stateManager
      console.log('[useDesignerState] StateManager:', !!stateManager)

      if (stateManager) {
        const designerModule = stateManager.modules?.designer
        console.log('[useDesignerState] Designer Module:', !!designerModule)
        console.log('[useDesignerState] Current View:', !!currentView.value)

        if (designerModule && currentView.value) {
          // 查找选中的控件
          const control = id ? findControlById(currentView.value.controls, id) : null
          console.log('[useDesignerState] Found control:', control)
          designerModule.commit('setSelectedControl', control)
          console.log('[useDesignerState] ✅ Control synced to state module')
        } else {
          console.warn('[useDesignerState] ❌ Cannot sync: missing module or view')
        }
      }
    } catch (error) {
      console.error('[useDesignerState] ❌ Failed to sync with designer module:', error)
    }
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

  // 视图操作
  function setView(view: RootView) {
    currentView.value = view
    clearSelection()
  }

  function updateControl(controlId: string, updates: Partial<Control>) {
    if (!currentView.value) return

    console.log('🔄 [updateControl] Updating control:', controlId, updates)

    // 深拷贝整个视图,确保所有引用都是新的
    const newView = JSON.parse(JSON.stringify(currentView.value))

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
    const found = findAndUpdate(newView.controls)

    if (found) {
      // 完全替换currentView,触发响应式更新
      currentView.value = newView
      console.log('✅ [updateControl] View updated, triggering re-render')

      // 如果更新的是容器的布局方向,重新调整其中的表格尺寸
      if (updates.layout?.flexDirection) {
        const updatedControl = findControlById(newView.controls, controlId)
        if (updatedControl?.kind === 'Container' || updatedControl?.kind === 'Flex' || updatedControl?.kind === 'Grid') {
          autoResizeTablesInContainer(updatedControl)
        }
      }

      // 触发额外的更新事件
      nextTick(() => {
        window.dispatchEvent(
          new CustomEvent('designer:control-updated', {
            detail: { controlId, updates },
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

    if (parentId) {
      const parent = findControlById(currentView.value.controls, parentId)
      if (parent) {
        if (!parent.children) parent.children = []
        if (index !== undefined) {
          parent.children.splice(index, 0, control)
        } else {
          parent.children.push(control)
        }
        // 如果添加的是表格组件到容器中,自动调整所有表格的尺寸
        if (control.kind === 'Table' && (parent.kind === 'Container' || parent.kind === 'Flex' || parent.kind === 'Grid')) {
          autoResizeTablesInContainer(parent)
        }
        // 触发视图更新
        currentView.value = { ...currentView.value }
      }
    } else {
      if (index !== undefined) {
        currentView.value.controls.splice(index, 0, control)
      } else {
        currentView.value.controls.push(control)
      }
      // 触发视图更新
      currentView.value = { ...currentView.value }
    }
  }

  function removeControl(controlId: string) {
    if (!currentView.value) return

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

    findControlAndParent(currentView.value.controls)

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

    removeFromArray(currentView.value.controls)

    // 如果删除的是表格组件,并且父容器是Container/Flex/Grid,重新调整剩余表格的尺寸
    if (
      removedControl?.kind === 'Table' &&
      (parentContainer?.kind === 'Container' || parentContainer?.kind === 'Flex' || parentContainer?.kind === 'Grid')
    ) {
      autoResizeTablesInContainer(parentContainer)
    }

    // 触发视图更新
    currentView.value = { ...currentView.value }

    if (selectedControlId.value === controlId) {
      clearSelection()
    }
  }

  // 剪贴板操作
  function copyToClipboard(control: Control) {
    clipboard.value = JSON.parse(JSON.stringify(control))
  }

  function pasteFromClipboard(parentId?: string, index?: number) {
    if (!clipboard.value) return null

    const cloned = JSON.parse(JSON.stringify(clipboard.value))
    // 重新生成 ID
    const regenerateIds = (ctrl: Control) => {
      ctrl.id = `${ctrl.kind}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      if (ctrl.children) {
        ctrl.children.forEach(regenerateIds)
      }
    }
    regenerateIds(cloned)

    addControl(cloned, parentId, index)
    return cloned
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

    // 方法
    selectControl,
    toggleControlSelection,
    clearSelection,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    toggleGrid,
    toggleGuides,
    setView,
    updateControl,
    addControl,
    removeControl,
    copyToClipboard,
    pasteFromClipboard,
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
