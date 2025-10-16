# 属性面板快速开始指南

## 5分钟快速上手

### 1. 导入组件

```typescript
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'
```

### 2. 使用组件

```vue
<template>
  <PropertiesPanel :control="selectedControl" @update="handlePropertyUpdate" />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import PropertiesPanel from '@/core/renderer/designer/settings/PropertiesPanel.vue'

const selectedControl = ref({
  id: 'button_1',
  kind: 'Button',
  name: '按钮',
  layout: {
    width: { type: 'px', value: 120 },
    height: { type: 'px', value: 40 },
  },
})

function handlePropertyUpdate(property: string, value: any) {
  selectedControl.value[property] = value
  console.log('属性更新:', property, value)
}
</script>
```

### 3. 运行测试

```bash
npm run dev
```

## 当前功能

### ✅ 已实现

- 基本信息配置（组件ID、名称、类型）
- 布局配置（宽度、高度，带可视化图案）
- 深色主题UI
- 折叠面板结构
- 响应式更新

### ⏳ 可扩展

- 内外边距配置
- Flex布局配置
- 定位配置
- 字体配置
- 边框配置
- 圆角配置
- 背景配置
- 数据绑定

## 如何扩展

### 添加新的配置面板

1. 打开 `src/core/renderer/designer/settings/PropertiesPanel.vue`
2. 在 `<a-collapse>` 中添加新的 `<a-collapse-panel>`
3. 参考现有的布局配置面板

示例：

```vue
<!-- Flex布局 -->
<a-collapse-panel key="flex" header="Flex布局">
  <LayoutDiagram type="flex" 
    :flexDirection="layoutConfig.flexDirection" 
    style="margin-bottom: 16px" />
  
  <div class="property-group">
    <label class="property-label">Flex方向</label>
    <a-select v-model:value="layoutConfig.flexDirection" 
      size="small" style="width: 100%" 
      @update:value="v => updateLayout('flexDirection', v)">
      <a-select-option value="row">横向</a-select-option>
      <a-select-option value="column">纵向</a-select-option>
    </a-select>
  </div>
</a-collapse-panel>
```

## 完整文档

- 📖 [使用说明](./PROPERTIES_PANEL_README.md) - 详细的API文档和使用示例
- 🔧 [扩展指南](./PROPERTIES_PANEL_EXTEND_GUIDE.md) - 如何添加新的配置面板
- ✅ [测试指南](./PROPERTIES_PANEL_TEST_GUIDE.md) - 测试步骤和预期结果
- 📝 [完整实现](./PROPERTIES_PANEL_COMPLETE.md) - 所有65个字段的完整代码
- 📊 [项目总结](./PROPERTIES_PANEL_SUMMARY.md) - 技术实现和代码统计
- 📋 [状态报告](./PROPERTIES_PANEL_STATUS.md) - 当前状态和下一步工作

## 需要帮助？

查看 [PROPERTIES_PANEL_README.md](./PROPERTIES_PANEL_README.md) 中的常见问题部分。

## 核心组件

### DomSizeRenderer

尺寸输入组件，支持数值和单位选择。

```vue
<DomSizeRenderer v-model="sizeValue" />
```

### ColorRenderer

颜色选择组件，支持颜色选择器和文本输入。

```vue
<ColorRenderer v-model="colorValue" />
```

### LayoutDiagram

布局图案组件，可视化展示布局配置。

```vue
<LayoutDiagram type="flex" />
<LayoutDiagram type="box" />
<LayoutDiagram type="position" />
```

## 下一步

1. ✅ 集成到设计器
2. ✅ 测试基本功能
3. ⏳ 根据需要添加更多配置面板
4. ⏳ 收集用户反馈

---

**提示：** 这是一个简化版本，包含核心功能和示例。所有基础设施已就位，可以快速扩展。
