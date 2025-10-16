# 属性面板修复计划

## 需要修复的问题

### 1. 属性面板结构调整 ⏳

- [ ] 将基本信息（组件ID、名称、类型）移到布局配置面板顶部
- [ ] 删除独立的"基本信息"面板
- [ ] 用图标替代"属性"、"事件"、"数据"标签文本
- [ ] 添加tooltip提示

### 2. 选择框包裹问题 ⏳

- [ ] 修复SelectionOverlay组件，确保完全包裹组件
- [ ] 处理按钮等组件右侧空余问题
- [ ] 确保所有组件类型都能正确包裹

### 3. 拖拽和配置面板同步 ⏳

- [ ] 实现拖拽改变大小时更新配置面板
- [ ] 实现配置面板修改时更新画布组件
- [ ] 双向数据绑定

### 4. 配置属性生效 ⏳

- [ ] 确保布局配置（宽度、高度等）生效
- [ ] 确保定位配置生效
- [ ] 确保其他样式配置生效

### 5. 样式修复 ⏳

- [ ] 修复布局配置面板背景色为白色
- [ ] 确保所有面板样式一致

## 实施步骤

### 步骤1：修改PropertiesPanel结构

1. 移除"基本信息"面板
2. 将ID、名称、类型添加到"布局配置"顶部
3. 使用图标替代标签文本

### 步骤2：修复SelectionOverlay

1. 读取SelectionOverlay.vue
2. 修复边界计算逻辑
3. 确保完全包裹组件

### 步骤3：实现双向同步

1. 修改DesignerControlRenderer
2. 添加样式应用逻辑
3. 实现拖拽更新配置

### 步骤4：测试和验证

1. 测试所有配置是否生效
2. 测试拖拽同步
3. 测试选择框包裹

## 文件清单

需要修改的文件：

- src/core/renderer/designer/settings/PropertiesPanel.vue
- src/core/renderer/designer/canvas/SelectionOverlay.vue
- src/core/renderer/designer/canvas/DesignerControlRenderer.vue
- src/core/renderer/designer/composables/useDesignerState.ts

---

**创建时间：** 2025-10-11  
**状态：** 规划中
