# Flex 容器和图标修复总结

## 修复内容

### 1. FlexVisualizer 组件优化

**文件**: `src/core/infrastructure/fields/visualizers/FlexVisualizer.vue`

**改进**:

- 将标签改为中文：主轴方向、主轴对齐、交叉轴对齐
- 添加间距(gap)配置输入框
- 更新 flexConfig 数据结构包含 gap 属性
- 更新 previewStyle 计算属性包含 gap 样式
- 优化按钮组间距从 4px 到 6px

**代码变更**:

```vue
// 添加 gap 配置 const flexConfig = ref({ direction: 'row', justify: 'flex-start', align: 'stretch', gap: 8, // 新增 }) // 预览样式包含 gap
const previewStyle = computed(() => ({ display: 'flex', flexDirection: flexConfig.value.direction, justifyContent: flexConfig.value.justify,
alignItems: flexConfig.value.align, gap: `${flexConfig.value.gap || 8}px`, // 新增 }))
```

### 2. 宽度/高度输入框布局优化

**文件**: `src/core/infrastructure/panels/common/LayoutPanel.ts`

**改进**:

- 将宽度和高度字段的 span 从 1 改为 2
- 给输入框更多空间，提升用户体验

**代码变更**:

```typescript
{
  key: 'width',
  label: '宽度',
  type: FieldType.SIZE,
  placeholder: '输入宽度',
  tooltip: '组件宽度',
  layout: { span: 2 },  // 从 1 改为 2
},
{
  key: 'height',
  label: '高度',
  type: FieldType.SIZE,
  placeholder: '输入高度',
  tooltip: '组件高度',
  layout: { span: 2 },  // 从 1 改为 2
},
```

### 3. 按钮组件图标渲染修复

**文件**: `src/core/renderer/controls/common/Button.vue`

**问题**:

- 使用 `require` 动态导入图标在 Vite 环境中不工作
- 导致选择图标后不显示

**修复**:

- 改用 ES6 import 导入所有 Ant Design 图标
- 简化 iconComponent 计算属性逻辑

**代码变更**:

```vue
<script setup lang="ts">
import { computed } from 'vue'
import * as AntIcons from '@ant-design/icons-vue' // 新增导入
import { useControlMembers } from '../../control-members'
import type { Control } from '../../base'

// 简化图标组件获取
const iconComponent = computed(() => {
  if (!icon.value) return null
  // 从导入的 AntIcons 中获取图标组件
  return (AntIcons as any)[icon.value] || null
})
</script>
```

## 测试建议

### 1. Flex 容器测试

1. 在设计器中添加 Flex 容器组件
2. 打开属性面板，查看 Flex 布局配置
3. 测试主轴方向、主轴对齐、交叉轴对齐的切换
4. 测试间距(gap)输入框，输入不同数值
5. 观察预览框中的实时效果

### 2. 宽度/高度输入框测试

1. 选择任意组件
2. 打开布局属性面板
3. 确认宽度和高度输入框占据更多空间
4. 测试输入不同单位的值（px, %, auto等）

### 3. 按钮图标测试

1. 在设计器中添加按钮组件
2. 选中按钮，打开属性面板
3. 点击图标字段的选择按钮
4. 从图标库中选择一个图标
5. 确认图标正确显示在按钮上
6. 测试切换不同图标
7. 测试清除图标

## 相关文件

- `src/core/infrastructure/fields/visualizers/FlexVisualizer.vue` - Flex 可视化组件
- `src/core/infrastructure/panels/common/LayoutPanel.ts` - 布局面板配置
- `src/core/renderer/controls/common/Button.vue` - 按钮组件
- `src/core/infrastructure/fields/renderers/IconField.vue` - 图标字段渲染器
- `src/core/renderer/designer/settings/IconPickerField.vue` - 图标选择器
- `src/modules/designer/views/DesignerNew.vue` - 设计器主视图（属性更新处理）

## 注意事项

1. **图标导入性能**: 导入所有 Ant Design 图标可能会增加包大小，但这是最可靠的方式
2. **Flex 配置持久化**: 确保 gap 属性在保存和加载时正确序列化
3. **响应式更新**: 所有属性更新都通过 `handlePropertyUpdate` 函数处理，确保实时更新

## 下一步

如果需要进一步优化：

1. 考虑图标按需加载以减小包大小
2. 添加更多 Flex 布局选项（如 flex-wrap, align-content）
3. 为其他容器组件添加类似的可视化配置
