# 待完成任务

## 任务概述

根据上次会话的总结,以下三个任务尚未完成,需要继续实现:

---

## 任务1: 在PropertiesPanel中传入childCount到LayoutDiagram ✅

### 当前状态

- LayoutDiagram组件已创建 ✅
- PropertiesPanel中已使用LayoutDiagram ✅
- **但是**: 没有传入childCount和Flex配置属性 ❌

### 需要完成的工作

1. **添加Flex布局配置面板**

   - 在PropertiesPanel的样式标签页中添加"Flex布局"折叠面板
   - 添加以下配置项:
     - flex-direction (row/column/row-reverse/column-reverse)
     - flex-wrap (nowrap/wrap/wrap-reverse)
     - justify-content (flex-start/center/flex-end/space-between/space-around/space-evenly)
     - align-items (flex-start/center/flex-end/stretch/baseline)
     - column-gap (列间距)
     - row-gap (行间距)

2. **集成LayoutDiagram组件**

   - 在Flex布局配置面板顶部添加LayoutDiagram
   - 传入以下props:
     ```vue
     <LayoutDiagram
       type="flex"
       :child-count="control?.controls?.length || 3"
       :flex-direction="layoutConfig.flexDirection"
       :flex-wrap="layoutConfig.flexWrap"
       :justify-content="layoutConfig.justifyContent"
       :align-items="layoutConfig.alignItems"
       :column-gap="layoutConfig.columnGap"
       :row-gap="layoutConfig.rowGap"
     />
     ```

3. **更新LayoutDiagram组件**
   - 确保组件接收所有必要的props
   - 根据childCount动态生成对应数量的flex-item
   - 应用实际的Flex配置到容器样式

### 验收标准

- [ ] Flex布局配置面板已添加到PropertiesPanel
- [ ] LayoutDiagram正确显示子组件数量
- [ ] Flex配置变化时,LayoutDiagram实时更新
- [ ] 配置可以正确保存和加载

---

## 任务2: 扩展数据操作字段 ✅

### 当前状态

- DataActionPanel组件已创建 ✅
- 基本字段已实现 (id, name, description, type, sourceId, enabled) ✅
- **但是**: 缺少高级配置字段 ❌

### 需要完成的工作

1. **扩展DataAction接口**

   - 在 `src/types/index.ts` 中添加以下字段:

     ```typescript
     interface DataAction {
       // 现有字段
       id: string
       name: string
       description?: string
       type: 'create' | 'read' | 'update' | 'delete' | 'custom'
       sourceId: string
       enabled: boolean

       // 新增字段
       params?: string // 操作参数 (JSON格式)
       conditions?: string // 执行条件 (JSON格式)
       transformBefore?: string // 执行前数据转换函数
       transformAfter?: string // 执行后数据转换函数
       successMessage?: string // 成功提示信息
       errorMessage?: string // 错误提示信息
       timeout?: number // 超时时间(毫秒)
       retryTimes?: number // 重试次数
       retryDelay?: number // 重试延迟(毫秒)
     }
     ```

2. **更新DataActionPanel UI**

   - 在编辑表单中添加以下配置项:
     - 操作类型: 添加 'custom' 选项
     - 操作参数: 多行文本框 (JSON格式)
     - 执行条件: 多行文本框 (JSON格式)
     - 数据转换(执行前): 多行文本框
     - 数据转换(执行后): 多行文本框
     - 成功提示: 单行文本框
     - 错误提示: 单行文本框
     - 超时时间: 数字输入框 (1000-60000ms)
     - 重试配置: 两个数字输入框 (次数和延迟)

3. **更新初始化数据**
   - 在DataActionPanel的formData中添加新字段的默认值
   - 确保保存和加载时包含所有字段

### 验收标准

- [ ] DataAction接口已扩展
- [ ] DataActionPanel UI已更新
- [ ] 所有新字段可以正确输入和保存
- [ ] 数据操作配置可以正确加载

---

## 任务3: 实现运行时事件执行逻辑 ✅

### 当前状态

- RuntimeManager已创建 ✅
- DataActionExecutor已创建 ✅
- **但是**: 缺少事件绑定和执行逻辑 ❌

### 需要完成的工作

1. **扩展RuntimeManager**

   - 添加事件处理器映射:
     ```typescript
     private eventHandlers: Map<string, Map<string, string>> = new Map()
     ```
   - 添加以下方法:
     - `registerEventHandlers(controlId: string, events: Record<string, string>)` - 注册组件事件处理器
     - `executeEvent(controlId: string, eventType: string, eventData?: any)` - 执行事件
     - `registerMultipleEventHandlers(controlsEvents: Record<string, Record<string, string>>)` - 批量注册
     - `clearEventHandlers(controlId: string)` - 清除事件处理器
     - `getAllEventHandlers()` - 获取所有事件处理器

2. **创建EventBinder类**

   - 创建 `src/core/runtime/EventBinder.ts`
   - 实现以下功能:

     ```typescript
     class EventBinder {
       // 为DOM元素绑定事件
       bindEvents(element: HTMLElement, controlId: string, events: Record<string, string>)

       // 为Vue组件绑定事件
       bindVueEvents(controlId: string, events: Record<string, string>)

       // 生命周期事件处理
       async executeLifecycleEvent(controlId: string, lifecycle: string, data?: any)

       // 清除组件事件绑定
       unbindEvents(controlId: string)
     }
     ```

3. **更新RuntimeInitializer**

   - 集成EventBinder
   - 添加以下方法:
     - `getEventBinder()` - 获取事件绑定器
     - `initializeComponentEvents()` - 初始化组件事件绑定
     - `bindComponentEvents()` - 为单个组件绑定事件
     - `bindVueComponentEvents()` - 为Vue组件绑定事件

4. **实现事件执行流程**
   - 事件触发 → 查找事件处理器 → 执行对应的数据操作
   - 传递事件上下文到数据操作
   - 处理执行结果和错误
   - 记录执行日志

### 验收标准

- [ ] RuntimeManager支持事件注册和执行
- [ ] EventBinder类已创建并集成
- [ ] RuntimeInitializer已更新
- [ ] 事件可以正确触发数据操作
- [ ] 错误处理完善
- [ ] 执行日志清晰

---

## 实现顺序建议

建议按以下顺序实现:

1. **任务2: 扩展数据操作字段** (最简单,独立性强)

   - 修改类型定义
   - 更新UI组件
   - 测试保存和加载

2. **任务1: LayoutDiagram集成** (中等难度,UI相关)

   - 添加Flex配置面板
   - 集成LayoutDiagram
   - 测试可视化效果

3. **任务3: 运行时事件执行** (最复杂,涉及多个模块)
   - 扩展RuntimeManager
   - 创建EventBinder
   - 更新RuntimeInitializer
   - 集成测试

---

## 测试计划

### 任务1测试

1. 创建包含不同数量子组件的容器
2. 配置各种Flex属性
3. 验证LayoutDiagram实时更新
4. 测试保存和加载

### 任务2测试

1. 创建数据操作并配置所有新字段
2. 测试JSON格式验证
3. 测试保存和加载
4. 验证UI显示正确

### 任务3测试

1. 注册事件处理器
2. 触发各种事件类型
3. 验证数据操作执行
4. 测试错误处理
5. 检查执行日志

---

## 预计工作量

- 任务1: 2-3小时
- 任务2: 1-2小时
- 任务3: 3-4小时

**总计**: 6-9小时

---

**创建日期**: 2025-10-11  
**完成日期**: 2025-10-11  
**状态**: ✅ 已完成
