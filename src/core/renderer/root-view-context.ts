import { ref, computed, type Ref } from 'vue'
import type { 
  RootView, 
  View, 
  Control, 
  ControlNode, 
  ResourceDTO, 
  DesignDTO,
  DataSourceOption
} from '../types'
import { RootViewMode } from '../types'
import { ControlTreeBuilder } from './base'
import { DataSource } from '../engines/data-source'
import { DataTransfer } from '../engines/data-transfer'

/**
 * 根视图上下文
 * 管理整个页面的渲染状态和数据
 */
export class RootViewContext {
  // 页面资源
  public page: ResourceDTO
  
  // 渲染模式
  public mode: RootViewMode
  
  // 设计数据
  public data?: DesignDTO
  
  // 核心状态
  private _rootView = ref<RootView>()
  private _rootViewJson = ref<string>()
  
  // 计算属性
  public readonly rootView = computed<RootView>({
    get: () => this._rootView.value!,
    set: (v: RootView) => {
      this._rootView.value = v
      this._rootViewJson.value = JSON.stringify(v, null, 2)
    },
  })
  
  public readonly rootViewJson = computed(() => this._rootViewJson.value)

  // 视图管理
  public views = ref<View[]>([])
  public viewIdMap = computed<Record<string, View>>(() => {
    const map: Record<string, View> = {}
    this.views.value.forEach(v => {
      map[v.id] = v
    })
    return map
  })

  // 数据源管理
  public dataSources: {
    defs: Ref<Record<string, DataSourceOption>>
    inst: Ref<Record<string, DataSource>>
  } = {
    defs: ref({}),
    inst: ref({})
  }

  // 数据流管理
  public dataTransfers: Record<string, DataTransfer> = {}

  // 控件管理
  public ctrlTree = ref<Record<string, ControlNode>>({})
  public activeCtrls = ref<Record<string, Control>>({})
  
  // 控件实例引用
  private controlRefs: Record<string, any> = {}
  private instIdCounter = 0

  constructor(
    page: ResourceDTO,
    mode: RootViewMode = RootViewMode.Runtime,
    data?: DesignDTO
  ) {
    this.page = page
    this.mode = mode
    this.data = data
    this.init()
  }

  /**
   * 初始化上下文
   */
  private async init() {
    try {
      await this.loadPage()
      await this.loadDataSources()
      await this.loadDataTransfer()
      this.makeControlTree()
    } catch (error) {
      console.error('根视图上下文初始化失败:', error)
    }
  }

  /**
   * 加载页面数据
   */
  private async loadPage() {
    if (this.data) {
      this.processDesignData(this.data)
    } else {
      // 这里应该从API加载页面数据
      // 暂时创建默认数据
      const defaultData: DesignDTO = {
        rootView: {
          id: 'root',
          name: '根视图',
          controls: []
        },
        dataSources: {},
        dataTransfers: {}
      }
      this.processDesignData(defaultData)
    }
  }

  /**
   * 处理设计数据
   */
  private processDesignData(data: DesignDTO) {
    // 设置根视图
    this._rootView.value = data.rootView
    
    // 设置视图列表
    this.views.value = data.rootView.views || [data.rootView]
    
    // 设置数据源定义
    this.dataSources.defs.value = data.dataSources || {}
    
    // 设置数据流定义
    Object.entries(data.dataTransfers || {}).forEach(([id, config]) => {
      this.dataTransfers[id] = new DataTransfer(config)
    })
  }

  /**
   * 加载数据源
   */
  private async loadDataSources() {
    const defs = this.dataSources.defs.value
    const instances: Record<string, DataSource> = {}
    
    for (const [id, def] of Object.entries(defs)) {
      try {
        const dataSource = new DataSource(def)
        instances[id] = dataSource
      } catch (error) {
        console.error(`数据源 ${id} 初始化失败:`, error)
      }
    }
    
    this.dataSources.inst.value = instances
  }

  /**
   * 加载数据流
   */
  private async loadDataTransfer() {
    // 数据流已在processDesignData中初始化
  }

  /**
   * 构建控件树
   */
  private makeControlTree() {
    const tree: Record<string, ControlNode> = {}
    
    // 处理根视图控件
    if (this._rootView.value?.controls) {
      const rootTree = ControlTreeBuilder.build(this._rootView.value.controls)
      Object.assign(tree, rootTree)
    }
    
    // 处理浮层控件
    if (this._rootView.value?.overlays) {
      const overlayTree = ControlTreeBuilder.build(this._rootView.value.overlays)
      Object.assign(tree, overlayTree)
    }
    
    // 处理其他视图控件
    this.views.value.forEach(view => {
      if (view.id !== this._rootView.value?.id && view.controls) {
        const viewTree = ControlTreeBuilder.build(view.controls)
        Object.assign(tree, viewTree)
      }
    })
    
    this.ctrlTree.value = tree
  }

  /**
   * 查找控件
   */
  public findControl(id: string): Control | null {
    const node = this.ctrlTree.value[id]
    return node ? node.control : null
  }

  /**
   * 添加控件引用
   */
  public addCtrlRef(viewId: string, instId: string, control: Control, methods?: any): void {
    const key = `${viewId}_${instId}`
    this.controlRefs[key] = {
      id: control.id,
      control,
      methods,
      viewId,
      instId
    }
  }

  /**
   * 移除控件引用
   */
  public removeCtrlRef(viewId: string, instId: string): void {
    const key = `${viewId}_${instId}`
    delete this.controlRefs[key]
  }

  /**
   * 获取控件引用
   */
  public getControlRef(controlId: string): any {
    return Object.values(this.controlRefs).find(ref => ref.id === controlId)
  }

  /**
   * 生成实例ID
   */
  public nextInstId(): string {
    return `inst_${++this.instIdCounter}`
  }

  /**
   * 设置活动控件
   */
  public setActiveControl(viewId: string, controlId?: string): void {
    if (controlId) {
      const control = this.findControl(controlId)
      if (control) {
        this.activeCtrls.value[viewId] = control
      }
    } else {
      delete this.activeCtrls.value[viewId]
    }
  }

  /**
   * 清除活动控件
   */
  public clearActiveControl(viewId: string): void {
    delete this.activeCtrls.value[viewId]
  }

  /**
   * 添加视图
   */
  public addView(view?: Partial<View>): View {
    const newView: View = {
      id: `view_${Date.now()}`,
      name: '新视图',
      controls: [],
      ...view
    }
    
    this.views.value.push(newView)
    return newView
  }

  /**
   * 删除视图
   */
  public removeView(viewId: string): boolean {
    const index = this.views.value.findIndex(v => v.id === viewId)
    if (index > -1) {
      this.views.value.splice(index, 1)
      return true
    }
    return false
  }

  /**
   * 添加控件
   */
  public addControl(viewId: string, kind: string, options: any = {}): Control {
    const view = this.viewIdMap.value[viewId]
    if (!view) {
      throw new Error(`视图 ${viewId} 不存在`)
    }
    
    const control: Control = {
      id: `${kind}_${Date.now()}`,
      kind,
      name: options.name || kind,
      classes: options.classes || [],
      styles: options.styles || {},
      dataBinding: options.dataBinding,
      eventExection: options.eventExection || {},
      children: options.children || [],
      ...options
    }
    
    view.controls.push(control)
    this.makeControlTree() // 重建控件树
    
    return control
  }

  /**
   * 删除控件
   */
  public deleteControl(viewId: string, controlId: string): boolean {
    const view = this.viewIdMap.value[viewId]
    if (!view) return false
    
    const deleteFromArray = (controls: Control[]): boolean => {
      for (let i = 0; i < controls.length; i++) {
        if (controls[i].id === controlId) {
          controls.splice(i, 1)
          return true
        }
        if (controls[i].children && deleteFromArray(controls[i].children!)) {
          return true
        }
      }
      return false
    }
    
    const deleted = deleteFromArray(view.controls)
    if (deleted) {
      this.makeControlTree() // 重建控件树
      
      // 清除活动状态
      if (this.activeCtrls.value[viewId]?.id === controlId) {
        delete this.activeCtrls.value[viewId]
      }
    }
    
    return deleted
  }

  /**
   * 复制控件
   */
  public copyControl(control: Control): void {
    // 实现控件复制逻辑
    console.log('复制控件:', control)
  }

  /**
   * 粘贴控件
   */
  public pasteControl(viewId: string, parentId?: string): void {
    // 实现控件粘贴逻辑
    console.log('粘贴控件到视图:', viewId, '父控件:', parentId)
  }

  /**
   * 展开所有大纲节点
   */
  public expandAllOutlineNodes(viewId: string): void {
    // 实现大纲节点展开逻辑
    console.log('展开所有大纲节点:', viewId)
  }

  /**
   * 折叠所有大纲节点
   */
  public collapseAllOutlineNodes(viewId: string): void {
    // 实现大纲节点折叠逻辑
    console.log('折叠所有大纲节点:', viewId)
  }

  /**
   * 重置控件属性
   */
  public resetControlProperties(controlId: string): void {
    const control = this.findControl(controlId)
    if (control) {
      // 重置为默认属性
      control.styles = {}
      control.classes = []
      console.log('重置控件属性:', controlId)
    }
  }

  /**
   * 复制控件属性
   */
  public copyControlProperties(control: Control): void {
    // 实现属性复制逻辑
    console.log('复制控件属性:', control)
  }

  /**
   * 获取成员方法
   */
  public useMembers() {
    return {
      rootView: this.rootView,
      rootViewJson: this.rootViewJson,
      views: this.views,
      viewIdMap: this.viewIdMap,
      dataSources: this.dataSources,
      dataTransfers: this.dataTransfers,
      ctrlTree: this.ctrlTree,
      activeCtrls: this.activeCtrls
    }
  }

  /**
   * 销毁上下文
   */
  public destroy(): void {
    // 销毁数据源
    Object.values(this.dataSources.inst.value).forEach(ds => ds.destroy())
    
    // 销毁数据流
    Object.values(this.dataTransfers).forEach(dt => dt.stop())
    
    // 清理引用
    this.controlRefs = {}
    this.views.value = []
    this.ctrlTree.value = {}
    this.activeCtrls.value = {}
  }

  // 静态方法：提供键用于依赖注入
  static readonly ProvideKey = Symbol('RootViewContext')
  static readonly ViewIdKey = Symbol('ViewId')
  static readonly RendererKey = Symbol('Renderer')
}