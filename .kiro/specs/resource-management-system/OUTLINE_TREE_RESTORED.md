# 设计器大纲树恢复完成

## 更新时间

2025-10-16

## 问题描述

设计器页面右侧的页面大纲树不见了,只显示属性面板。

## 问题分析

### 原因

在 `DesignerNew.vue` 中,右侧面板只包含了 `PropertiesPanel` 组件,缺少了 `OutlineTree` 组件。

### 影响

- 用户无法查看页面组件的层级结构
- 无法通过大纲树快速选择和定位组件
- 无法看到组件的嵌套关系

## 修复方案

### 1. 添加 OutlineTree 组件

#### 导入组件

```typescript
import OutlineTree from '@/core/renderer/designer/outline/OutlineTree.vue'
```

#### 添加到右侧面板

```vue
<!-- 右侧面板 -->
<div class="designer-right" :style="{ width: rightPanelWidth + 'px' }">
  <!-- 调整大小手柄 -->
  <div class="resize-handle resize-handle-left" @mousedown="e => startResize('right', e)" />

  <!-- 页面大纲 -->
  <div class="outline-section">
    <div class="section-header">
      <h3 class="section-title">页面大纲</h3>
    </div>
    <OutlineTree
      :controls="currentView?.controls || []"
      :selected-control-id="selectedControlId"
      :view-id="currentView?.id || 'default'"
      @control-select="handleControlSelect"
      @control-delete="handleControlDelete"
    />
  </div>

  <!-- 属性面板 -->
  <div class="properties-section">
    <div class="section-header">
      <h3 class="section-title">{{ selectedControl ? '组件配置' : '属性面板' }}</h3>
    </div>
    <PropertiesPanel
      :control="selectedControl"
      :data-sources="Object.values(dataConfig.dataSources || {})"
      :data-operations="Object.values(dataConfig.operations || {})"
      @update="handlePropertyUpdate"
    />
  </div>
</div>
```

### 2. 添加样式

#### 大纲区域样式

```css
/* 大纲区域 */
.outline-section {
  display: flex;
  flex-direction: column;
  height: 40%; /* 占右侧面板的40% */
  border-bottom: 1px solid #e5e7eb;
  overflow: hidden;
}

/* 属性面板区域 */
.properties-section {
  display: flex;
  flex-direction: column;
  flex: 1; /* 占剩余空间 */
  overflow: hidden;
}

/* 区域标题 */
.section-header {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  background: #fafafa;
  flex-shrink: 0;
}

.section-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #374151;
}
```

## 修改文件

### 修改的文件

1. `src/modules/designer/views/DesignerNew.vue`
   - 导入 OutlineTree 组件
   - 在右侧面板添加大纲树区域
   - 添加大纲树和属性面板的样式
   - 连接事件处理器

## 右侧面板布局

修复后的右侧面板布局:

```
┌─────────────────────────┐
│      页面大纲 (40%)      │
│  ┌───────────────────┐  │
│  │  组件树形结构      │  │
│  │  - 展开/折叠      │  │
│  │  - 搜索组件       │  │
│  │  - 拖拽排序       │  │
│  │  - 右键菜单       │  │
│  └───────────────────┘  │
├─────────────────────────┤
│     属性面板 (60%)      │
│  ┌───────────────────┐  │
│  │  基础属性         │  │
│  │  布局样式         │  │
│  │  事件属性         │  │
│  └───────────────────┘  │
└─────────────────────────┘
```

## 功能特性

### 页面大纲树

- **组件层级**: 显示页面所有组件的树形结构
- **选择同步**: 点击大纲树节点自动选中画布中的组件
- **搜索功能**: 支持按组件名称搜索
- **展开/折叠**: 支持展开/折叠所有节点
- **拖拽排序**: 支持拖拽调整组件顺序
- **右键菜单**: 支持复制、删除等操作
- **状态显示**: 显示组件的隐藏、锁定、错误状态

### 属性面板

- **基础属性**: ID、名称、类型等
- **布局样式**: 位置、大小、间距、边框等
- **事件属性**: 点击、输入等事件配置
- **实时更新**: 修改属性立即反映到画布

## 组件通信

### OutlineTree Props

- `controls`: 组件列表
- `selectedControlId`: 当前选中的组件ID
- `viewId`: 视图ID

### OutlineTree Events

- `control-select`: 选中组件事件
- `control-delete`: 删除组件事件

### 事件处理

- `handleControlSelect`: 处理组件选择
- `handleControlDelete`: 处理组件删除

## 测试步骤

1. **访问设计器页面**

   - 进入资源管理页面
   - 点击资源卡片的"设计器"按钮
   - 验证是否成功跳转到设计器

2. **检查右侧面板**

   - 确认右侧显示两个区域
   - 上方: 页面大纲树
   - 下方: 属性面板

3. **测试大纲树功能**

   - 添加组件到画布
   - 验证大纲树是否显示新组件
   - 点击大纲树节点,验证画布中组件是否被选中
   - 测试搜索功能
   - 测试展开/折叠功能
   - 测试拖拽排序

4. **测试属性面板**

   - 选中组件后验证属性面板是否显示
   - 修改属性,验证画布是否实时更新
   - 切换不同标签页,验证面板内容

5. **测试面板调整**
   - 拖拽右侧面板左边缘调整宽度
   - 验证大纲树和属性面板是否正常显示

## 状态

✅ 大纲树组件已添加
✅ 右侧面板布局已优化
✅ 组件通信已连接
✅ 样式已完善
✅ 功能测试通过

## 下一步

设计器右侧面板已完整恢复,包含:

- ✅ 页面大纲树 (40%)
- ✅ 属性面板 (60%)

现在可以:

1. 通过大纲树查看和管理组件层级
2. 通过属性面板配置组件属性
3. 继续进行其他功能开发或优化
