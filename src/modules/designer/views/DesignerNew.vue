<template>
  <div class="designer-container">
    <!-- 顶部工具栏 -->
    <div class="designer-header">
      <div class="header-left">
        <h1 class="designer-title">{{ designName }}</h1>
        <a-button type="link" size="small" @click="handleRename">
          <template #icon><edit-outlined /></template>
        </a-button>
      </div>

      <div class="header-center">
        <a-button-group>
          <a-button @click="handleSave" :loading="saving">
            <template #icon><save-outlined /></template>
            保存
          </a-button>
          <a-button @click="handlePreview">
            <template #icon><eye-outlined /></template>
            预览
          </a-button>
        </a-button-group>

        <!-- 三端显示切换 -->
        <a-segmented v-model:value="previewDevice" :options="deviceOptions" style="margin-left: 16px" />
      </div>

      <div class="header-right">
        <a-button-group>
          <a-button @click="handleUndo" :disabled="!canUndo">
            <template #icon><undo-outlined /></template>
          </a-button>
          <a-button @click="handleRedo" :disabled="!canRedo">
            <template #icon><redo-outlined /></template>
          </a-button>
        </a-button-group>

        <a-badge :dot="hasUnsavedChanges" color="orange">
          <span class="save-status">{{ hasUnsavedChanges ? '未保存' : '已保存' }}</span>
        </a-badge>

        <a-tooltip title="返回资源管理">
          <a-button type="text" @click="handleBack" style="margin-left: 12px">
            <template #icon><arrow-left-outlined /></template>
          </a-button>
        </a-tooltip>

        <!-- 用户头像下拉菜单 -->
        <a-dropdown :trigger="['click']" placement="bottomRight">
          <div class="user-avatar-wrapper">
            <a-avatar :size="32" :src="userAvatar" style="cursor: pointer">
              <template #icon><user-outlined /></template>
            </a-avatar>
          </div>
          <template #overlay>
            <a-menu>
              <a-menu-item key="profile" @click="handleUserProfile">
                <user-outlined />
                <span style="margin-left: 8px">个人中心</span>
              </a-menu-item>
              <a-menu-item key="settings" @click="handleUserSettings">
                <setting-outlined />
                <span style="margin-left: 8px">账号设置</span>
              </a-menu-item>
              <a-menu-divider />
              <a-menu-item key="logout" @click="handleLogout">
                <logout-outlined />
                <span style="margin-left: 8px">退出登录</span>
              </a-menu-item>
            </a-menu>
          </template>
        </a-dropdown>
      </div>
    </div>

    <!-- 主内容区 -->
    <div class="designer-main">
      <!-- 左侧组件库面板 -->
      <div class="designer-left" :style="{ width: leftPanelWidth + 'px' }">
        <!-- 调整大小手柄 -->
        <div class="resize-handle resize-handle-right" @mousedown="e => startResize('left', e)" />

        <ControlsPanel @control-select="handleControlSelect" />
      </div>

      <!-- 页面大纲面板 -->
      <div class="designer-outline" :style="{ width: outlinePanelWidth + 'px' }">
        <!-- 调整大小手柄 -->
        <div class="resize-handle resize-handle-right" @mousedown="e => startResize('outline', e)" />

        <div class="outline-header">
          <h3 class="outline-title">页面大纲</h3>
        </div>
        <div class="outline-content-wrapper">
          <OutlineTree
            :controls="currentView?.controls || []"
            :selected-control-id="selectedControlId"
            :view-id="currentView?.id || 'default'"
            @control-select="handleControlSelect"
            @control-delete="handleControlDelete"
          />
        </div>
      </div>

      <!-- 中间画布区 -->
      <div class="designer-center">
        <!-- 对齐工具栏 -->
        <AlignmentToolbar
          :visible="selectedControlIds.length > 1"
          @align="handleAlign"
          @distribute="handleDistribute"
          @resize="handleUnifySize"
        />

        <!-- 画布工具栏 -->
        <CanvasToolbar
          :canvas-width="canvasWidth"
          :canvas-height="canvasHeight"
          :zoom="zoom"
          :show-grid="showGrid"
          :show-guides="showGuides"
          :can-undo="canUndo"
          :can-redo="canRedo"
          @zoom-in="zoomIn"
          @zoom-out="zoomOut"
          @zoom-reset="resetZoom"
          @zoom-fit="fitCanvas"
          @toggle-grid="toggleGrid"
          @toggle-guides="toggleGuides"
          @undo="handleUndo"
          @redo="handleRedo"
          @data-source="handleDataSource"
        />

        <!-- 画布区域 -->
        <CanvasArea
          :width="canvasWidth"
          :height="canvasHeight"
          :zoom="zoom"
          :show-grid="showGrid"
          :is-empty="isEmpty"
          :drop-indicator="dropIndicator"
          @drop="handleCanvasDrop"
          @canvas-click="handleCanvasClick"
        >
          <template #controls>
            <DesignerControlRenderer
              v-for="control in currentView?.controls || []"
              :key="control.id"
              :control="control"
              :selected-id="selectedControlId"
              :hovered-id="hoveredControlId"
              :zoom="zoom"
              @select="handleControlSelect"
              @hover="handleControlHover"
              @drop="handleControlDrop"
              @resize-start="handleResizeStart"
            />
          </template>
        </CanvasArea>
      </div>

      <!-- 右侧属性面板 -->
      <div class="designer-right" :style="{ width: rightPanelWidth + 'px' }">
        <!-- 调整大小手柄 -->
        <div class="resize-handle resize-handle-left" @mousedown="e => startResize('right', e)" />

        <div class="properties-header">
          <h3 class="properties-title">{{ selectedControl ? '组件配置' : '属性面板' }}</h3>
        </div>
        <div class="properties-content-wrapper">
          <PropertiesPanel
            :control="selectedControl"
            :data-sources="Object.values(dataConfig.dataSources || {})"
            :data-operations="Object.values(dataConfig.operations || {})"
            @update="handlePropertyUpdate"
          />
        </div>
      </div>
    </div>

    <!-- 数据源配置模态框 -->
    <DataSourceConfigModal
      v-model="showDataSourceModal"
      v-model:dataSources="dataConfig.dataSources"
      v-model:dataFlows="dataConfig.dataFlows"
      v-model:operations="dataConfig.operations"
      @save="handleDataConfigSave"
    />

    <!-- 用户设置弹窗 -->
    <UserSettingsModal v-model:visible="userSettingsVisible" @success="handleUserSettingsSuccess" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, h, nextTick, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import {
  SaveOutlined,
  EyeOutlined,
  UndoOutlined,
  RedoOutlined,
  EditOutlined,
  ArrowLeftOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons-vue'

// 导入组件
import { CanvasToolbar, CanvasArea, DesignerControlRenderer, AlignmentToolbar } from '@/core/renderer/designer/canvas'
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'
import DataSourceConfigModal from '@/core/renderer/designer/communication/DataSourceConfigModal.vue'
import ControlsPanel from '@/core/renderer/designer/controls.vue'
import OutlineTree from '@/core/renderer/designer/outline/OutlineTree.vue'
import UserSettingsModal from '@/modules/designer/components/UserSettingsModal.vue'

// 导入 composables
import { useDesignerState } from '@/core/renderer/designer/composables/useDesignerState'
import { useDragDrop } from '@/core/renderer/designer/composables/useDragDrop'
import { useHistoryManager } from '@/core/renderer/designer/managers/HistoryManager'
import { ControlFactory } from '@/core/renderer/base'
import type { RootView } from '@/types/index'

// 导入持久化服务
import { PersistenceService } from '@/core/services/PersistenceService'

// 导入 API
// import { saveDesign, loadDesign, type SaveDesignResponse, type LoadDesignResponse } from '../api/designer'

// 路由
const route = useRoute()
const router = useRouter()

// 状态管理
const designerState = useDesignerState()
const dragDrop = useDragDrop()
const history = useHistoryManager({ maxEntries: 50 })
// 持久化服务
const persistenceService = new PersistenceService()

const designName = ref('未命名页面')

// 解构状态
const {
  currentView,
  selectedControlId,
  selectedControlIds,
  zoom,
  canvasWidth,
  canvasHeight,
  showGrid,
  showGuides,
  selectControl,
  clearSelection,
  zoomIn,
  zoomOut,
  resetZoom,
  toggleGrid,
  toggleGuides,
  addControl,
  removeControl,
  updateControl,
  findControlById,
} = designerState

// UI 状态
const leftPanelWidth = ref(280) // 组件库宽度
const outlinePanelWidth = ref(250) // 大纲树宽度
const rightPanelWidth = ref(320) // 属性面板宽度
const saving = ref(false)
const hoveredControlId = ref<string | null>(null)
const hasUnsavedChanges = ref(false)

// 三端显示状态
const previewDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop')
const deviceOptions = [
  { label: '桌面端', value: 'desktop', icon: '💻' },
  { label: '平板', value: 'tablet', icon: '📱' },
  { label: '手机', value: 'mobile', icon: '📱' },
]

// 数据源配置状态
const showDataSourceModal = ref(false)
const dataConfig = ref({
  dataSources: {},
  dataFlows: {},
  operations: {},
})

// 计算属性
const isEmpty = computed(() => {
  return !currentView.value || currentView.value.controls.length === 0
})

const selectedControl = computed(() => {
  if (!selectedControlId.value || !currentView.value) return null
  return findControlById(currentView.value.controls, selectedControlId.value)
})

const canUndo = computed(() => history.canUndo())
const canRedo = computed(() => history.canRedo())

const dropIndicator = computed(() => dragDrop.dropIndicator.value)

// 标记未保存更改
function markAsUnsaved() {
  hasUnsavedChanges.value = true
}

// 初始化视图
function initializeView() {
  const view: RootView = {
    id: 'view_' + Date.now(),
    name: '新页面',
    controls: [],
  }

  designerState.setView(view)
  hasUnsavedChanges.value = false
}

// 导航栏操作
// 返回
function handleBack() {
  if (hasUnsavedChanges.value) {
    Modal.confirm({
      title: '确认返回',
      content: '当前有未保存的更改，确定要返回吗？',
      okText: '确定',
      cancelText: '取消',
      onOk: () => {
        router.push('/designer/resource')
      },
    })
  } else {
    router.push('/designer/resource')
  }
}

// 用户相关操作
// 获取用户信息
function getStateManager() {
  if (typeof window !== 'undefined' && (window as any).__MIGRATION_SYSTEM__) {
    return (window as any).__MIGRATION_SYSTEM__.stateManagement.stateManager
  }
  return null
}

// 用户头像
const userAvatar = computed(() => {
  const stateManager = getStateManager()
  if (!stateManager) return undefined
  const authState = stateManager.getState('auth')
  return authState?.userInfo?.avatar
})

// 用户名
const username = computed(() => {
  const stateManager = getStateManager()
  if (!stateManager) return '未登录'
  const authState = stateManager.getState('auth')
  return authState?.userInfo?.displayName || authState?.userInfo?.username || '未登录'
})

// 个人中心
function handleUserProfile() {
  message.info('个人中心功能开发中...')
  // TODO: 跳转到个人中心页面
}

// 用户设置弹窗
const userSettingsVisible = ref(false)

// 账号设置
function handleUserSettings() {
  userSettingsVisible.value = true
}

// 用户设置成功回调
function handleUserSettingsSuccess() {
  message.success('用户信息已更新')
}

// 退出登录
function handleLogout() {
  Modal.confirm({
    title: '确认退出',
    content: '确定要退出登录吗？',
    okText: '确定',
    cancelText: '取消',
    onOk: async () => {
      try {
        const stateManager = getStateManager()
        if (stateManager) {
          // 调用登出 action
          await stateManager.dispatch('auth/logout')
          message.success('已退出登录')
          // 跳转到登录页
          router.push('/designer/login')
        }
      } catch (error: any) {
        message.error('退出登录失败: ' + (error.message || '未知错误'))
      }
    },
  })
}

// 工具栏操作
// 重命名
function handleRename() {
  Modal.confirm({
    title: '重命名页面',
    content: h('div', [
      h('p', '请输入新的页面名称：'),
      h('input', {
        id: 'rename-input',
        class: 'ant-input',
        value: designName.value,
        style: { width: '100%', marginTop: '8px' },
      }),
    ]),
    okText: '确定',
    cancelText: '取消',
    onOk: () => {
      const input = document.getElementById('rename-input') as HTMLInputElement
      const newName = input?.value.trim()
      if (newName && newName !== designName.value) {
        designName.value = newName
        markAsUnsaved()
        message.success('已重命名')
      }
    },
  })
}

async function handleSave() {
  if (!currentView.value) return

  saving.value = true
  try {
    // 保存到localStorage
    persistenceService.saveToLocal({
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
      dataActions: designerState.dataActions.value,
    })

    // TODO: 如果有后端API,也保存到服务器
    // await api.saveDesign(designId.value, currentView.value)

    hasUnsavedChanges.value = false
  } catch (error: any) {
  } finally {
    saving.value = false
  }
}

// 数据源配置
function handleDataSource() {
  showDataSourceModal.value = true
}

function handleDataConfigSave(data: any) {
  dataConfig.value = data
  hasUnsavedChanges.value = true
}

async function handlePreview() {
  if (!currentView.value) {
    return
  }

  try {
    // 将当前设计数据保存到 sessionStorage 用于预览
    const previewData = {
      view: currentView.value,
      dataSources: designerState.dataSources.value,
      dataFlows: designerState.dataFlows.value,
      dataActions: designerState.dataActions.value,
      timestamp: Date.now(),
    }

    sessionStorage.setItem('preview-data', JSON.stringify(previewData))

    // 打开预览页面（使用临时预览模式）
    const previewUrl = router.resolve({
      name: 'DesignerPreview',
      params: { id: 'temp' },
      query: { mode: 'temp' },
    }).href

    window.open(previewUrl, '_blank')
    message.success('已打开预览')
  } catch (error: any) {
    message.error('预览失败: ' + (error.message || '未知错误'))
  }
}

function handleUndo() {
  const entry = history.undo()
  if (entry) {
    applyHistoryEntry(entry, 'undo')
    message.success('已撤销')
  }
}

function handleRedo() {
  const entry = history.redo()
  if (entry) {
    applyHistoryEntry(entry, 'redo')
    message.success('已重做')
  }
}

// 应用历史记录
function applyHistoryEntry(entry: any, direction: 'undo' | 'redo') {
  if (!currentView.value) return

  const isUndo = direction === 'undo'

  switch (entry.action) {
    case 'add-control':
      if (isUndo) {
        // 撤销添加 = 删除控件
        removeControl(entry.data.control.id)
      } else {
        // 重做添加 = 添加控件
        addControl(entry.data.control, entry.data.parentId)
        selectControl(entry.data.control.id)
      }
      break

    case 'delete-control':
      if (isUndo) {
        // 撤销删除 = 添加回控件
        if (entry.data.control) {
          addControl(entry.data.control, entry.data.parentId, entry.data.index)
          selectControl(entry.data.control.id)
        }
      } else {
        // 重做删除 = 删除控件
        removeControl(entry.data.controlId)
      }
      break

    case 'update-property':
      if (isUndo) {
        // 撤销属性更新 = 恢复旧值
        if (entry.data.oldValue !== undefined) {
          updateControl(entry.data.controlId, { [entry.data.property]: entry.data.oldValue })
        }
      } else {
        // 重做属性更新 = 应用新值
        updateControl(entry.data.controlId, { [entry.data.property]: entry.data.newValue || entry.data.value })
      }
      break

    case 'move-control':
      if (isUndo) {
        // 撤销移动 = 移回原位置
        const control = findControlById(currentView.value.controls, entry.data.controlId)
        if (control) {
          removeControl(entry.data.controlId)
          addControl(control, entry.data.oldParentId, entry.data.oldIndex)
        }
      } else {
        // 重做移动 = 移到新位置
        const control = findControlById(currentView.value.controls, entry.data.controlId)
        if (control) {
          removeControl(entry.data.controlId)
          if (entry.data.newPosition === 'inside') {
            addControl(control, entry.data.dropId)
          } else {
            const dropPosition = findControlParentAndIndex(entry.data.dropId)
            if (dropPosition) {
              const targetIndex = entry.data.newPosition === 'before' ? dropPosition.index : dropPosition.index + 1
              addControl(control, dropPosition.parentId, targetIndex)
            }
          }
        }
      }
      break

    case 'resize-control':
      if (isUndo) {
        // 撤销调整大小 = 恢复原尺寸
        const control = findControlById(currentView.value.controls, entry.data.controlId)
        if (control) {
          updateControl(entry.data.controlId, {
            styles: {
              ...control.styles,
              width: `${entry.data.oldSize.width}px`,
              height: `${entry.data.oldSize.height}px`,
            },
          })
        }
      } else {
        // 重做调整大小 = 应用新尺寸
        const control = findControlById(currentView.value.controls, entry.data.controlId)
        if (control) {
          updateControl(entry.data.controlId, {
            styles: {
              ...control.styles,
              width: entry.data.newSize.width,
              height: entry.data.newSize.height,
            },
          })
        }
      }
      break
  }
}

// 画布操作
function fitCanvas() {
  // TODO: 实现适应画布功能
  resetZoom()
}

function handleCanvasClick() {
  clearSelection()
}

// 控件操作
function handleControlSelect(controlIdOrDef: string | any) {
  if (typeof controlIdOrDef === 'string') {
    selectControl(controlIdOrDef)
  }
}

function handleControlHover(controlId: string | null) {
  hoveredControlId.value = controlId
}

function handleControlDelete(controlId: string) {
  const control = findControlById(currentView.value?.controls || [], controlId)
  if (!control) return

  // 保存控件信息和位置以便撤销
  const parentAndIndex = findControlParentAndIndex(controlId)

  removeControl(controlId)
  history.push(
    'delete-control',
    {
      controlId,
      control: JSON.parse(JSON.stringify(control)), // 深拷贝
      parentId: parentAndIndex?.parentId,
      index: parentAndIndex?.index,
    },
    `删除控件 ${control.name || control.kind}`
  )
  hasUnsavedChanges.value = true
  message.success('已删除组件')
}

// 查找控件的父级和索引
function findControlParentAndIndex(controlId: string): { parentId?: string; index: number } | null {
  if (!currentView.value) return null

  function search(controls: any[], parentId?: string): { parentId?: string; index: number } | null {
    for (let i = 0; i < controls.length; i++) {
      if (controls[i].id === controlId) {
        return { parentId, index: i }
      }
      if (controls[i].children) {
        const result = search(controls[i].children, controls[i].id)
        if (result) return result
      }
    }
    return null
  }

  return search(currentView.value.controls)
}

// 控件移动处理
function handleControlMove(dragId: string, dropId: string, position: 'before' | 'after' | 'inside') {
  if (!currentView.value) return

  // 不能移动到自己
  if (dragId === dropId) return

  // 获取拖拽的控件
  const dragControl = findControlById(currentView.value.controls, dragId)
  if (!dragControl) return

  // 检查是否移动到自己的子节点（防止循环引用）
  if (isDescendant(dragControl, dropId)) {
    message.error('不能移动到自己的子节点')
    return
  }

  // 保存旧位置信息
  const oldPosition = findControlParentAndIndex(dragId)

  // 先从原位置移除
  removeControl(dragId)

  // 根据位置添加到新位置
  if (position === 'inside') {
    // 添加为子节点
    addControl(dragControl, dropId)
  } else {
    // 添加为兄弟节点
    const dropPosition = findControlParentAndIndex(dropId)
    if (dropPosition) {
      const targetIndex = position === 'before' ? dropPosition.index : dropPosition.index + 1
      addControl(dragControl, dropPosition.parentId, targetIndex)
    }
  }

  history.push(
    'move-control',
    {
      controlId: dragId,
      oldParentId: oldPosition?.parentId,
      oldIndex: oldPosition?.index,
      newParentId: position === 'inside' ? dropId : findControlParentAndIndex(dropId)?.parentId,
      newPosition: position,
      dropId,
    },
    `移动控件 ${dragControl.name || dragControl.kind}`
  )

  markAsUnsaved()
  message.success('已移动组件')
}

// 检查是否是后代节点
function isDescendant(parent: any, childId: string): boolean {
  if (!parent.children) return false

  for (const child of parent.children) {
    if (child.id === childId) return true
    if (isDescendant(child, childId)) return true
  }

  return false
}

// 控件复制处理（从大纲树）
function handleControlCopy(control: any) {
  designerState.copyToClipboard(control)
  message.success('已复制组件到剪贴板')
}

function handleControlDuplicate(controlId: string) {
  const control = findControlById(currentView.value?.controls || [], controlId)
  if (control) {
    const cloned = ControlFactory.clone(control)
    addControl(cloned)
    history.push('add-control', { control: cloned }, `复制控件 ${control.kind}`)
    markAsUnsaved()
    message.success('已复制组件')
  }
}

// 拖放处理
function handleCanvasDrop(event: DragEvent) {
  const data = dragDrop.readDragTransfer(event)

  if (!data) {
    return
  }

  if (data.type === 'control-library' && data.controlKind) {
    // 从组件库拖拽
    const newControl = ControlFactory.create(data.controlKind, {
      name: data.controlKind,
    })

    addControl(newControl)
    selectControl(newControl.id)
    history.push('add-control', { control: newControl }, `添加控件 ${data.controlKind}`)
    markAsUnsaved()
    message.success('已添加组件')
  }
}

function handleControlDrop(data: { controlId: string; event: DragEvent }) {
  const dragData = dragDrop.readDragTransfer(data.event)
  if (!dragData) return

  if (dragData.type === 'control-library' && dragData.controlKind) {
    // 拖拽到容器中
    const newControl = ControlFactory.create(dragData.controlKind, {
      name: dragData.controlKind,
    })

    addControl(newControl, data.controlId)
    selectControl(newControl.id)
    history.push('add-control', { control: newControl, parentId: data.controlId }, `添加控件到容器`)
    markAsUnsaved()
    message.success('已添加组件到容器')
  }
}

// 控件调整大小
let resizingControl: string | null = null
let resizeHandle: string | null = null
let resizeStartPos = { x: 0, y: 0 }
let resizeStartSize = { width: 0, height: 0 }
let resizeStartRect: DOMRect | null = null

function handleResizeStart(data: { controlId: string; handle: string; event: MouseEvent }) {
  const control = findControlById(currentView.value?.controls || [], data.controlId)
  if (!control) return

  resizingControl = data.controlId
  resizeHandle = data.handle
  resizeStartPos = { x: data.event.clientX, y: data.event.clientY }

  // 获取当前尺寸（从实际渲染的元素获取）
  const element = document.querySelector(`[data-control-id="${data.controlId}"]`)
  if (element) {
    resizeStartRect = element.getBoundingClientRect()
    resizeStartSize = {
      width: resizeStartRect.width,
      height: resizeStartRect.height,
    }
  } else {
    // 回退到从 styles 获取
    const currentWidth = control.styles?.width ? parseFloat(control.styles.width) : 100
    const currentHeight = control.styles?.height ? parseFloat(control.styles.height) : 100
    resizeStartSize = { width: currentWidth, height: currentHeight }
  }

  document.addEventListener('mousemove', handleResizeMove)
  document.addEventListener('mouseup', handleResizeEnd)
}

function handleResizeMove(e: MouseEvent) {
  if (!resizingControl || !resizeHandle) return

  const control = findControlById(currentView.value?.controls || [], resizingControl)
  if (!control) return

  const deltaX = e.clientX - resizeStartPos.x
  const deltaY = e.clientY - resizeStartPos.y

  let newWidth = resizeStartSize.width
  let newHeight = resizeStartSize.height

  // 根据拖拽手柄计算新尺寸（考虑缩放）
  const scaledDeltaX = deltaX / zoom.value
  const scaledDeltaY = deltaY / zoom.value

  switch (resizeHandle) {
    case 'e': // 右
      newWidth = resizeStartSize.width + scaledDeltaX
      break
    case 'w': // 左
      newWidth = resizeStartSize.width - scaledDeltaX
      break
    case 's': // 下
      newHeight = resizeStartSize.height + scaledDeltaY
      break
    case 'n': // 上
      newHeight = resizeStartSize.height - scaledDeltaY
      break
    case 'se': // 右下
      newWidth = resizeStartSize.width + scaledDeltaX
      newHeight = resizeStartSize.height + scaledDeltaY
      break
    case 'sw': // 左下
      newWidth = resizeStartSize.width - scaledDeltaX
      newHeight = resizeStartSize.height + scaledDeltaY
      break
    case 'ne': // 右上
      newWidth = resizeStartSize.width + scaledDeltaX
      newHeight = resizeStartSize.height - scaledDeltaY
      break
    case 'nw': // 左上
      newWidth = resizeStartSize.width - scaledDeltaX
      newHeight = resizeStartSize.height - scaledDeltaY
      break
  }

  // 限制最小尺寸
  newWidth = Math.max(20, newWidth)
  newHeight = Math.max(20, newHeight)

  // 更新控件样式（深度合并）
  const mergedStyles = {
    ...control.styles,
    width: `${Math.round(newWidth)}px`,
    height: `${Math.round(newHeight)}px`,
  }

  updateControl(resizingControl, { styles: mergedStyles })

  // 实时触发选择框更新
  nextTick(() => {
    window.dispatchEvent(new Event('resize'))
  })
}

function handleResizeEnd() {
  if (resizingControl) {
    const control = findControlById(currentView.value?.controls || [], resizingControl)
    if (control) {
      history.push(
        'resize-control',
        {
          controlId: resizingControl,
          oldSize: resizeStartSize,
          newSize: {
            width: control.styles?.width,
            height: control.styles?.height,
          },
        },
        `调整控件大小 ${control.name || control.kind}`
      )
      markAsUnsaved()
      message.success('已调整组件大小')
    }
  }

  resizingControl = null
  resizeHandle = null
  resizeStartRect = null
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
}

// 辅助函数：将值转换为CSS字符串
function toCssValue(val: any): string | undefined {
  if (val === undefined || val === null) return undefined
  if (typeof val === 'string') return val
  if (typeof val === 'object' && val.value !== undefined) {
    return `${val.value}${val.type || 'px'}`
  }
  return String(val)
}

// 将属性对象转换为 CSS styles
function convertToStyles(property: string, value: any): Record<string, any> {
  const styles: Record<string, any> = {}

  switch (property) {
    case 'layout':
      // 尺寸和布局属性
      if (value.width !== undefined) styles.width = toCssValue(value.width)
      if (value.height !== undefined) styles.height = toCssValue(value.height)
      if (value.minWidth !== undefined) styles.minWidth = toCssValue(value.minWidth)
      if (value.minHeight !== undefined) styles.minHeight = toCssValue(value.minHeight)
      if (value.maxWidth !== undefined) styles.maxWidth = toCssValue(value.maxWidth)
      if (value.maxHeight !== undefined) styles.maxHeight = toCssValue(value.maxHeight)
      if (value.padding !== undefined) styles.padding = toCssValue(value.padding)
      if (value.paddingTop !== undefined) styles.paddingTop = toCssValue(value.paddingTop)
      if (value.paddingRight !== undefined) styles.paddingRight = toCssValue(value.paddingRight)
      if (value.paddingBottom !== undefined) styles.paddingBottom = toCssValue(value.paddingBottom)
      if (value.paddingLeft !== undefined) styles.paddingLeft = toCssValue(value.paddingLeft)
      if (value.margin !== undefined) styles.margin = toCssValue(value.margin)
      if (value.marginTop !== undefined) styles.marginTop = toCssValue(value.marginTop)
      if (value.marginRight !== undefined) styles.marginRight = toCssValue(value.marginRight)
      if (value.marginBottom !== undefined) styles.marginBottom = toCssValue(value.marginBottom)
      if (value.marginLeft !== undefined) styles.marginLeft = toCssValue(value.marginLeft)
      if (value.display !== undefined) styles.display = value.display
      if (value.overflowX !== undefined) styles.overflowX = value.overflowX
      if (value.overflowY !== undefined) styles.overflowY = value.overflowY
      // Flex 布局
      if (value.flexDirection !== undefined) styles.flexDirection = value.flexDirection
      if (value.flexWrap !== undefined) styles.flexWrap = value.flexWrap
      if (value.justifyContent !== undefined) styles.justifyContent = value.justifyContent
      if (value.alignItems !== undefined) styles.alignItems = value.alignItems
      if (value.columnGap !== undefined) styles.columnGap = toCssValue(value.columnGap)
      if (value.rowGap !== undefined) styles.rowGap = toCssValue(value.rowGap)
      break

    case 'position':
      if (value.position !== undefined) styles.position = value.position
      if (value.left !== undefined) styles.left = toCssValue(value.left)
      if (value.right !== undefined) styles.right = toCssValue(value.right)
      if (value.top !== undefined) styles.top = toCssValue(value.top)
      if (value.bottom !== undefined) styles.bottom = toCssValue(value.bottom)
      if (value.zIndex !== undefined) styles.zIndex = value.zIndex
      break

    case 'font':
      if (value.fontSize !== undefined) styles.fontSize = toCssValue(value.fontSize)
      if (value.color !== undefined) styles.color = value.color
      if (value.fontFamily !== undefined) styles.fontFamily = value.fontFamily
      if (value.fontStyle !== undefined) styles.fontStyle = value.fontStyle
      if (value.fontWeight !== undefined) styles.fontWeight = value.fontWeight
      if (value.lineHeight !== undefined) styles.lineHeight = toCssValue(value.lineHeight)
      if (value.textAlign !== undefined) styles.textAlign = value.textAlign
      break

    case 'border':
      const { position: borderPos, style: borderStyle, width: borderWidth, color: borderColor } = value
      if (borderPos === 'all') {
        if (borderStyle) styles.borderStyle = borderStyle
        if (borderWidth) styles.borderWidth = toCssValue(borderWidth)
        if (borderColor) styles.borderColor = borderColor
      } else if (borderPos) {
        const side = borderPos.charAt(0).toUpperCase() + borderPos.slice(1)
        if (borderStyle) styles[`border${side}Style`] = borderStyle
        if (borderWidth) styles[`border${side}Width`] = toCssValue(borderWidth)
        if (borderColor) styles[`border${side}Color`] = borderColor
      }
      break

    case 'radius':
      if (value.borderRadius !== undefined) styles.borderRadius = toCssValue(value.borderRadius)
      if (value.borderTopLeftRadius !== undefined) styles.borderTopLeftRadius = toCssValue(value.borderTopLeftRadius)
      if (value.borderTopRightRadius !== undefined) styles.borderTopRightRadius = toCssValue(value.borderTopRightRadius)
      if (value.borderBottomLeftRadius !== undefined) styles.borderBottomLeftRadius = toCssValue(value.borderBottomLeftRadius)
      if (value.borderBottomRightRadius !== undefined) styles.borderBottomRightRadius = toCssValue(value.borderBottomRightRadius)
      break

    case 'background':
      if (value.color !== undefined) styles.backgroundColor = value.color
      if (value.image !== undefined) styles.backgroundImage = value.image ? `url(${value.image})` : undefined
      if (value.position !== undefined) styles.backgroundPosition = value.position
      if (value.size !== undefined) styles.backgroundSize = value.size
      if (value.repeat !== undefined) styles.backgroundRepeat = value.repeat
      break
  }

  return styles
}

// 属性更新
function handlePropertyUpdate(property: string, value: any) {
  console.log('🔧 [DesignerNew] 属性更新:', property, '=', value)

  if (!selectedControlId.value || !selectedControl.value) {
    console.warn('❌ 没有选中的组件')
    return
  }

  const oldValue = selectedControl.value[property]

  // 处理不同类型的属性更新
  if (property === 'text') {
    // Button组件的文本属性 -> 更新到 props.text
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      text: value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
    console.log('✅ 按钮文本已更新:', value)
  } else if (['width', 'height', 'top', 'right', 'bottom', 'left'].includes(property)) {
    // 尺寸属性(ControlSize类型) -> 更新到 layout
    const mergedLayout = {
      ...(selectedControl.value.layout || {}),
      [property]: value, // value是ControlSize对象 { type: 'px', value: 100 }
    }
    updateControl(selectedControlId.value, { layout: mergedLayout })
    console.log('✅ 尺寸属性已更新:', property, value)
  } else if (property === 'fontSize') {
    // 字体大小 -> 更新到 styles
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      fontSize: value + 'px',
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
    console.log('✅ 字体大小已更新:', value + 'px')
  } else if (property === 'styles') {
    // 直接更新 styles
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      ...value,
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
    console.log('✅ 样式已合并更新:', mergedStyles)
  } else if (['layout', 'position', 'font', 'border', 'radius', 'background'].includes(property)) {
    // 直接更新结构化属性对象
    updateControl(selectedControlId.value, { [property]: value })

    // 同时将这些属性转换为 styles 以确保渲染正确
    const styleUpdates = convertToStyles(property, value)
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      ...styleUpdates,
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
    console.log(`✅ ${property} 已更新并转换到 styles:`, value, styleUpdates)
  } else if (property === 'name') {
    // 更新组件名称
    updateControl(selectedControlId.value, { name: value })
    console.log('✅ 组件名称已更新:', value)
  } else if (property === 'id') {
    // ID是只读的,不允许修改
    console.warn('⚠️ ID字段是只读的,不能修改')
    return
  } else if (property === 'visible') {
    // 可见性 -> 更新到 props
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      visible: value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
    console.log('✅ 可见性已更新:', value)
  } else if (property === 'disabled') {
    // 禁用状态 -> 更新到 props
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      disabled: value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
    console.log('✅ 禁用状态已更新:', value)
  } else if (['icon', 'type', 'size', 'danger', 'ghost', 'loading'].includes(property)) {
    // Button组件的特定属性 -> 更新到 props
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      [property]: value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
    console.log(`✅ ${property}已更新:`, value)
  } else if (property === 'props') {
    // 深度合并 props
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      ...value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
    console.log('✅ 组件属性已合并更新:', mergedProps)
  } else if (property === 'dataBinding') {
    // 更新数据绑定
    updateControl(selectedControlId.value, { dataBinding: value })
    console.log('✅ 数据绑定已更新:', value)
  } else if (property === 'events') {
    // 更新事件配置
    updateControl(selectedControlId.value, { events: value })
    console.log('✅ 事件配置已更新:', value)
  } else if (property === 'opacity') {
    // 更新透明度
    updateControl(selectedControlId.value, { opacity: value })
    console.log('✅ 透明度已更新:', value)
  } else if (property === 'classes') {
    // 更新CSS类
    updateControl(selectedControlId.value, { classes: value })
    console.log('✅ CSS类已更新:', value)
  } else if (property === 'flexConfig') {
    // Flex配置 -> 转换为 styles
    const mergedStyles = {
      ...(selectedControl.value.styles || {}),
      display: 'flex',
      flexDirection: value.direction || 'row',
      justifyContent: value.justify || 'flex-start',
      alignItems: value.align || 'stretch',
    }
    updateControl(selectedControlId.value, { styles: mergedStyles })
    console.log('✅ Flex配置已更新:', value)

    // 处理 flexRatio - 应用到子元素
    if (value.flexRatio) {
      const ratioString = value.flexRatio as string
      console.log('📐 Processing flex ratio from flexConfig:', ratioString)
      const ratios = ratioString
        .split(':')
        .map(r => parseFloat(r.trim()))
        .filter(r => !isNaN(r))
      if (ratios.length > 0) {
        nextTick(() => {
          const container = document.querySelector(`[data-control-id="${selectedControlId.value}"]`)
          if (container) {
            const children = Array.from(container.children) as HTMLElement[]
            children.forEach((child, index) => {
              if (index < ratios.length) {
                const ratio = ratios[index]
                child.style.flex = `${ratio} 1 0%`
                console.log(`  📏 Applied flex: ${ratio} to child ${index}`)
              } else {
                const lastRatio = ratios[ratios.length - 1]
                child.style.flex = `${lastRatio} 1 0%`
                console.log(`  📏 Applied flex: ${lastRatio} to child ${index} (fallback)`)
              }
            })
          }
        })
      }
    }
  } else {
    // 其他属性 -> 尝试更新到 props
    const mergedProps = {
      ...(selectedControl.value.props || {}),
      [property]: value,
    }
    updateControl(selectedControlId.value, { props: mergedProps })
    console.log('✅ 属性已更新到props:', property, value)
  }

  // 标记为未保存
  markAsUnsaved()

  // 强制更新选择框位置和大小
  nextTick(() => {
    // 触发窗口 resize 事件，让所有组件更新矩形
    window.dispatchEvent(new Event('resize'))
  })

  history.push(
    'update-property',
    {
      controlId: selectedControlId.value,
      property,
      oldValue,
      newValue: value,
    },
    `更新属性 ${property}`
  )
  markAsUnsaved()

  message.success(`已更新属性: ${property}`)
}

function handleEventUpdate(event: string, executions: any[]) {
  if (!selectedControlId.value || !selectedControl.value) return

  const oldEventExection = selectedControl.value.eventExection || {}
  const eventExection = { ...oldEventExection }
  eventExection[event] = executions

  updateControl(selectedControlId.value, { eventExection })
  history.push(
    'update-property',
    {
      controlId: selectedControlId.value,
      property: 'eventExection',
      oldValue: oldEventExection,
      newValue: eventExection,
    },
    `更新事件 ${event}`
  )
  markAsUnsaved()
}

// 面板调整大小
let resizing = false
let resizingPanel: 'left' | 'outline' | 'right' | null = null
let startX = 0
let startWidth = 0

function startResize(panel: 'left' | 'outline' | 'right', e: MouseEvent) {
  resizing = true
  resizingPanel = panel
  startX = e.clientX
  if (panel === 'left') {
    startWidth = leftPanelWidth.value
  } else if (panel === 'outline') {
    startWidth = outlinePanelWidth.value
  } else {
    startWidth = rightPanelWidth.value
  }

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
}

function handleResize(e: MouseEvent) {
  if (!resizing || !resizingPanel) return

  const delta = e.clientX - startX
  const minWidth = 200
  const maxWidth = 600

  if (resizingPanel === 'left') {
    // 左侧组件库面板:向右拖动增加宽度
    const newWidth = startWidth + delta
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      leftPanelWidth.value = newWidth
    }
  } else if (resizingPanel === 'outline') {
    // 大纲面板:向右拖动增加宽度
    const newWidth = startWidth + delta
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      outlinePanelWidth.value = newWidth
    }
  } else {
    // 右侧属性面板:向左拖动增加宽度
    const newWidth = startWidth - delta
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      rightPanelWidth.value = newWidth
    }
  }
}

function stopResize() {
  resizing = false
  resizingPanel = null
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
}

// 键盘快捷键
function handleKeyDown(e: KeyboardEvent) {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0
  const ctrlKey = isMac ? e.metaKey : e.ctrlKey

  // Ctrl/Cmd + Z: 撤销
  if (ctrlKey && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
    return
  }

  // Ctrl/Cmd + Shift + Z 或 Ctrl/Cmd + Y: 重做
  if ((ctrlKey && e.key === 'z' && e.shiftKey) || (ctrlKey && e.key === 'y')) {
    e.preventDefault()
    handleRedo()
    return
  }

  // Ctrl/Cmd + S: 保存
  if (ctrlKey && e.key === 's') {
    e.preventDefault()
    handleSave()
    return
  }

  // Ctrl/Cmd + C: 复制
  if (ctrlKey && e.key === 'c' && selectedControlId.value) {
    e.preventDefault()
    handleCopy()
    return
  }

  // Ctrl/Cmd + V: 粘贴
  if (ctrlKey && e.key === 'v') {
    e.preventDefault()
    handlePaste()
    return
  }

  // Ctrl/Cmd + D: 复制
  if (ctrlKey && e.key === 'd' && selectedControlId.value) {
    e.preventDefault()
    handleControlDuplicate(selectedControlId.value)
    return
  }

  // Delete 或 Backspace: 删除
  // 但要排除在输入框、文本域等可编辑元素中的情况
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedControlId.value) {
    const target = e.target as HTMLElement
    const isEditable =
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.isContentEditable ||
      target.closest('.ant-input') ||
      target.closest('.ant-select') ||
      target.closest('.ant-picker') ||
      target.closest('input') ||
      target.closest('textarea')

    if (!isEditable) {
      e.preventDefault()
      handleControlDelete(selectedControlId.value)
      return
    }
  }

  // Escape: 取消选择
  if (e.key === 'Escape') {
    e.preventDefault()
    clearSelection()
    return
  }

  // Ctrl/Cmd + A: 全选（暂不实现）
  if (ctrlKey && e.key === 'a') {
    e.preventDefault()
    // TODO: 实现全选功能
    return
  }
}

// 复制粘贴功能
function handleCopy() {
  if (!selectedControl.value) return

  designerState.copyToClipboard(selectedControl.value)
  message.success('已复制组件')
}

function handlePaste() {
  const pastedControl = designerState.pasteFromClipboard()
  if (pastedControl) {
    selectControl(pastedControl.id)
    history.push('add-control', { control: pastedControl }, '粘贴控件')
    markAsUnsaved()
    message.success('已粘贴组件')
  } else {
    message.warning('剪贴板为空')
  }
}

// 对齐和分布工具
function handleAlign(type: 'left' | 'center-horizontal' | 'right' | 'top' | 'center-vertical' | 'bottom') {
  if (!currentView.value || selectedControlIds.value.length < 2) return

  const controls = selectedControlIds.value.map(id => findControlById(currentView.value!.controls, id)).filter(Boolean)

  if (controls.length < 2) return

  // 获取参考控件（第一个选中的）
  const reference = controls[0]
  const refLeft = parseInt(reference.styles?.left || '0')
  const refTop = parseInt(reference.styles?.top || '0')
  const refWidth = parseInt(reference.styles?.width || '100')
  const refHeight = parseInt(reference.styles?.height || '100')

  controls.slice(1).forEach(control => {
    const width = parseInt(control.styles?.width || '100')
    const height = parseInt(control.styles?.height || '100')
    const newStyles = { ...control.styles }

    switch (type) {
      case 'left':
        newStyles.left = `${refLeft}px`
        break
      case 'center-horizontal':
        newStyles.left = `${refLeft + (refWidth - width) / 2}px`
        break
      case 'right':
        newStyles.left = `${refLeft + refWidth - width}px`
        break
      case 'top':
        newStyles.top = `${refTop}px`
        break
      case 'center-vertical':
        newStyles.top = `${refTop + (refHeight - height) / 2}px`
        break
      case 'bottom':
        newStyles.top = `${refTop + refHeight - height}px`
        break
    }

    updateControl(control.id, { styles: newStyles })
  })

  markAsUnsaved()
  message.success('已对齐')
}

function handleDistribute(type: 'horizontal' | 'vertical') {
  if (!currentView.value || selectedControlIds.value.length < 3) {
    message.warning('至少需要选择3个组件才能分布')
    return
  }

  const controls = selectedControlIds.value.map(id => findControlById(currentView.value!.controls, id)).filter(Boolean)

  if (controls.length < 3) return

  // 按位置排序
  const sorted = [...controls].sort((a, b) => {
    if (type === 'horizontal') {
      return parseInt(a.styles?.left || '0') - parseInt(b.styles?.left || '0')
    } else {
      return parseInt(a.styles?.top || '0') - parseInt(b.styles?.top || '0')
    }
  })

  const first = sorted[0]
  const last = sorted[sorted.length - 1]

  if (type === 'horizontal') {
    const firstLeft = parseInt(first.styles?.left || '0')
    const lastLeft = parseInt(last.styles?.left || '0')
    const totalSpace = lastLeft - firstLeft
    const gap = totalSpace / (sorted.length - 1)

    sorted.slice(1, -1).forEach((control, index) => {
      const newLeft = firstLeft + gap * (index + 1)
      updateControl(control.id, {
        styles: { ...control.styles, left: `${newLeft}px` },
      })
    })
  } else {
    const firstTop = parseInt(first.styles?.top || '0')
    const lastTop = parseInt(last.styles?.top || '0')
    const totalSpace = lastTop - firstTop
    const gap = totalSpace / (sorted.length - 1)

    sorted.slice(1, -1).forEach((control, index) => {
      const newTop = firstTop + gap * (index + 1)
      updateControl(control.id, {
        styles: { ...control.styles, top: `${newTop}px` },
      })
    })
  }

  markAsUnsaved()
  message.success('已分布')
}

function handleUnifySize(type: 'same-width' | 'same-height' | 'same-size') {
  if (!currentView.value || selectedControlIds.value.length < 2) return

  const controls = selectedControlIds.value.map(id => findControlById(currentView.value!.controls, id)).filter(Boolean)

  if (controls.length < 2) return

  // 使用第一个控件的尺寸作为参考
  const reference = controls[0]
  const refWidth = reference.styles?.width || '100px'
  const refHeight = reference.styles?.height || '100px'

  controls.slice(1).forEach(control => {
    const newStyles = { ...control.styles }

    switch (type) {
      case 'same-width':
        newStyles.width = refWidth
        break
      case 'same-height':
        newStyles.height = refHeight
        break
      case 'same-size':
        newStyles.width = refWidth
        newStyles.height = refHeight
        break
    }

    updateControl(control.id, { styles: newStyles })
  })

  markAsUnsaved()
  message.success('已统一尺寸')
}

// 监听设备类型变化,调整画布尺寸
watch(previewDevice, newDevice => {
  switch (newDevice) {
    case 'desktop':
      designerState.canvasWidth.value = 1200
      designerState.canvasHeight.value = 800
      break
    case 'tablet':
      designerState.canvasWidth.value = 768
      designerState.canvasHeight.value = 1024
      break
    case 'mobile':
      designerState.canvasWidth.value = 375
      designerState.canvasHeight.value = 667
      break
  }
})

// 生命周期
onMounted(async () => {
  // 获取资源 URL 参数
  const resourceUrl = route.params.url as string

  // 设置持久化服务的资源 URL
  if (resourceUrl) {
    persistenceService.setResourceUrl(resourceUrl)
  }

  // 检查是否是编辑模式
  const id = route.params.id as string
  if (id) {
    // TODO: 实现从服务器加载设计数据
    // await loadDesignData(id)
  }

  // 尝试从localStorage加载（使用资源 URL）
  const savedData = persistenceService.loadFromLocal(resourceUrl)
  if (savedData && savedData.view) {
    designerState.setView(savedData.view)
    if (savedData.dataSources) {
      designerState.setDataSources(savedData.dataSources)
    }
    if (savedData.dataFlows) {
      designerState.setDataFlows(savedData.dataFlows)
    }
    if (savedData.dataActions) {
      designerState.setDataActions(savedData.dataActions)
    }
  } else {
    // 没有保存的数据,初始化新视图
    initializeView()
  }

  // 启动自动保存（会使用设置的资源 URL）
  persistenceService.startAutoSave(() => {
    if (currentView.value) {
      persistenceService.saveToLocal({
        view: currentView.value,
        dataSources: designerState.dataSources.value,
        dataFlows: designerState.dataFlows.value,
        dataActions: designerState.dataActions.value,
      })
      console.log(`🔄 [Auto-save] Design auto-saved for resource: ${resourceUrl}`)
    }
  })

  // 绑定键盘事件
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  // 停止自动保存
  persistenceService.stopAutoSave()

  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.removeEventListener('mousemove', handleResizeMove)
  document.removeEventListener('mouseup', handleResizeEnd)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.designer-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f0f2f5;
}

/* 顶部工具栏 */
.designer-header {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  background: #f5c842;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.header-center {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  justify-content: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  margin-right: 0; /* 移除固定边距 */
}

.user-avatar-wrapper {
  margin-left: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  transition: opacity 0.3s;

  &:hover {
    opacity: 0.8;
  }
}

.designer-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.save-status {
  font-size: 13px;
  color: #6b7280;
  padding: 4px 8px;
}

/* 主内容区 */
.designer-main {
  display: flex;
  flex-direction: row; /* 确保横向布局 */
  flex: 1;
  overflow: hidden;
  gap: 0;
}

/* 左侧组件库面板 */
.designer-left {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 280px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;
  overflow: hidden;
}

/* 页面大纲面板 */
.designer-outline {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 250px;
  background: #ffffff;
  border-right: 1px solid #e5e7eb;
  flex-shrink: 0;
  overflow: hidden;
}

.outline-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  flex-shrink: 0;
}

.outline-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.outline-content-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 中间画布 */
.designer-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-width: 0;
  background: #f8fafc;
}

/* 右侧属性面板 */
.designer-right {
  position: relative;
  display: flex;
  flex-direction: column;
  width: 320px;
  background: #ffffff;
  border-left: 1px solid #e5e7eb;
  flex-shrink: 0;
  overflow: hidden;
}

.properties-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  flex-shrink: 0;
}

.properties-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}

.properties-content-wrapper {
  flex: 1;
  overflow: hidden;
}

/* 调整大小手柄 */
.resize-handle {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 4px;
  cursor: col-resize;
  z-index: 10;
  transition: background 0.2s;
}

.resize-handle:hover {
  background: #3b82f6;
}

.resize-handle-right {
  right: -2px;
}

.resize-handle-left {
  left: -2px;
}

/* Tabs 样式 */
:deep(.ant-tabs) {
  height: 100%;
  display: flex;
  flex-direction: column;
}

:deep(.ant-tabs-content) {
  flex: 1;
  overflow: hidden;
}

:deep(.ant-tabs-tabpane) {
  height: 100%;
  overflow-y: auto;
}
</style>
