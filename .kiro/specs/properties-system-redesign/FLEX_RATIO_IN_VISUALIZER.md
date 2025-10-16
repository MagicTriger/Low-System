# Flex 容器占比配置集成到可视化组件

## 更新内容

根据用户需求，将 Flex 容器的占比配置集成到 FlexVisualizer 可视化组件中，实现：

1. **将占比输入框放在布局预览图下方**
2. **在预览图中实时显示占比效果**
3. **删除独立的 gap 字段**

## 修改的文件

### 1. src/core/infrastructure/fields/visualizers/FlexVisualizer.vue

#### 删除的内容

- ❌ 删除了"间距"（gap）字段和输入框
- ❌ 删除了 `flexConfig.gap` 属性

#### 新增的内容

- ✅ 添加了"子元素占比"（flexRatio）输入框
- ✅ 输入框放在预览图下方
- ✅ 添加了占比提示文本："输入比例，如 1:2 表示左边1/3，右边2/3"
- ✅ 预览图中的子元素根据占比动态调整大小

#### 核心代码

**模板部分**：

```vue
<!-- Preview -->
<div class="preview-box" :style="previewStyle">
  <div
    class="preview-item"
    v-for="(ratio, index) in ratioArray"
    :key="index"
    :style="{ flex: `${ratio} 1 0%` }"
  >
    {{ index + 1 }}
  </div>
</div>

<!-- Flex Ratio -->
<div class="control-group">
  <label class="control-label">子元素占比</label>
  <a-input
    v-model:value="flexConfig.flexRatio"
    size="small"
    placeholder="例如: 1:2:1"
    @change="emitUpdate"
  />
  <div class="ratio-hint">输入比例，如 1:2 表示左边1/3，右边2/3</div>
</div>
```

**脚本部分**：

```typescript
const flexConfig = ref({
  direction: 'row',
  justify: 'flex-start',
  align: 'stretch',
  flexRatio: '1:1:1', // 默认等比例
})

// 解析比例字符串为数组
const ratioArray = computed(() => {
  const ratioString = flexConfig.value.flexRatio || '1:1:1'
  const ratios = ratioString
    .split(':')
    .map(r => parseFloat(r.trim()))
    .filter(r => !isNaN(r))
  return ratios.length > 0 ? ratios : [1, 1, 1]
})

const previewStyle = computed(() => ({
  display: 'flex',
  flexDirection: flexConfig.value.direction as any,
  justifyContent: flexConfig.value.justify as any,
  alignItems: flexConfig.value.align as any,
  gap: '8px', // 固定间距用于预览
}))
```

**样式部分**：

```css
.preview-item {
  min-width: 40px; /* 改为 min-width，允许根据 flex 调整 */
  height: 40px;
  background: #1890ff;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 500;
}

.ratio-hint {
  font-size: 11px;
  color: #8c8c8c;
  margin-top: 4px;
  line-height: 1.4;
}
```

### 2. src/core/renderer/controls/register.ts

更新了三个容器组件的 flexConfig 默认值：

**修改前**：

```typescript
defaultValue: {
  direction: 'row',
  justify: 'flex-start',
  align: 'stretch',
  gap: 8,  // ← 删除
}
```

**修改后**：

```typescript
defaultValue: {
  direction: 'row',
  justify: 'flex-start',
  align: 'stretch',
  flexRatio: '1:1:1',  // ← 新增
}
```

**影响的组件**：

- Flex 容器（弹性布局）
- Grid 容器（网格布局）
- Table 容器（表格）

### 3. src/modules/designer/main.ts

更新了手动注册的 Flex 面板配置：

```typescript
defaultValue: {
  direction: 'row',
  justify: 'flex-start',
  align: 'stretch',
  flexRatio: '1:1:1',  // 替换 gap: 8
}
```

### 4. src/modules/designer/views/DesignerNew.vue

在 `handlePropertyUpdate` 函数中添加了 flexRatio 的处理逻辑：

```typescript
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
    const ratios = ratioString.split(':').map(r => parseFloat(r.trim())).filter(r => !isNaN(r))
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
}
```

## 功能说明

### 1. 可视化预览

FlexVisualizer 现在会根据输入的占比实时更新预览图：

- **输入 `1:1:1`**：三个子元素等比例分配（默认）
- **输入 `1:2`**：第一个子元素占 1/3，第二个占 2/3
- **输入 `1:2:1`**：三个子元素按 1:2:1 的比例分配
- **输入 `2:3:1`**：三个子元素按 2:3:1 的比例分配

### 2. 实时应用

当用户修改占比配置时：

1. FlexVisualizer 的预览图立即更新
2. 配置保存到 flexConfig 对象
3. DesignerNew.vue 接收到更新
4. 自动应用到画布中的实际容器子元素

### 3. 布局结构

现在的 Flex 配置面板布局：

```
┌─────────────────────────────────┐
│  Flex布局                        │
├─────────────────────────────────┤
│  主轴方向: [→] [←] [↓] [↑]      │
│  主轴对齐: [⊣] [⊢] [⊣⊢] ...    │
│  交叉轴对齐: [⊤] [⊥] [↕] ...    │
│                                  │
│  ┌──────────────────────────┐   │
│  │  [1]  [2]  [3]           │   │  ← 预览图
│  └──────────────────────────┘   │
│                                  │
│  子元素占比: [1:1:1_______]     │  ← 占比输入框
│  输入比例，如 1:2 表示...       │  ← 提示文本
│                                  │
│  换行: [不换行 ▼]               │
└─────────────────────────────────┘
```

## 使用示例

### 示例 1: 两列布局（1:2）

**配置**：

- 方向：水平（row）
- 占比：`1:2`

**效果**：

- 第一个子元素占 33.33% 宽度
- 第二个子元素占 66.67% 宽度

**预览图**：

```
┌──────────────────────────────┐
│  [1]      [2]                │
└──────────────────────────────┘
```

### 示例 2: 三列布局（1:2:1）

**配置**：

- 方向：水平（row）
- 占比：`1:2:1`

**效果**：

- 第一个子元素占 25% 宽度
- 第二个子元素占 50% 宽度
- 第三个子元素占 25% 宽度

**预览图**：

```
┌──────────────────────────────┐
│  [1]    [2]      [3]         │
└──────────────────────────────┘
```

### 示例 3: 侧边栏布局（1:3）

**配置**：

- 方向：水平（row）
- 占比：`1:3`

**效果**：

- 侧边栏占 25% 宽度
- 主内容区占 75% 宽度

**预览图**：

```
┌──────────────────────────────┐
│  [1]  [2]                    │
└──────────────────────────────┘
```

### 示例 4: 垂直布局（2:1）

**配置**：

- 方向：垂直（column）
- 占比：`2:1`

**效果**：

- 第一个子元素占 66.67% 高度
- 第二个子元素占 33.33% 高度

**预览图**：

```
┌────┐
│ [1]│
│    │
├────┤
│ [2]│
└────┘
```

## 验证步骤

### 测试 1: 基本占比功能

1. 启动开发服务器：`npm run dev`
2. 添加一个 Flex 容器到画布
3. 在容器中添加 3 个按钮组件
4. 选中 Flex 容器
5. 打开"布局样式"标签页
6. 展开"Flex布局"折叠框

**预期结果**：

- ✅ 看到可视化预览图，显示 3 个等比例的方块
- ✅ 预览图下方有"子元素占比"输入框
- ✅ 输入框默认值为 `1:1:1`
- ✅ 输入框下方有提示文本

### 测试 2: 修改占比

1. 在"子元素占比"输入框中输入 `1:2:1`
2. 观察预览图变化
3. 观察画布中的实际容器变化

**预期结果**：

- ✅ 预览图中的方块按 1:2:1 比例显示
- ✅ 画布中的按钮按 1:2:1 比例分配宽度
- ✅ 控制台显示：`📐 Processing flex ratio from flexConfig: 1:2:1`
- ✅ 控制台显示：`📏 Applied flex: 1 to child 0`
- ✅ 控制台显示：`📏 Applied flex: 2 to child 1`
- ✅ 控制台显示：`📏 Applied flex: 1 to child 2`

### 测试 3: 不同方向

1. 切换主轴方向为"垂直"（column）
2. 观察预览图和画布变化

**预期结果**：

- ✅ 预览图中的方块垂直排列
- ✅ 方块按 1:2:1 比例分配高度
- ✅ 画布中的按钮垂直排列，按比例分配高度

### 测试 4: 子元素数量不匹配

1. 在容器中添加第 4 个按钮
2. 占比仍为 `1:2:1`（只有 3 个比例）

**预期结果**：

- ✅ 前 3 个按钮按 1:2:1 比例分配
- ✅ 第 4 个按钮使用最后一个比例（1）
- ✅ 控制台显示：`📏 Applied flex: 1 to child 3 (fallback)`

### 测试 5: 无效输入

1. 在"子元素占比"输入框中输入无效值，如 `abc`
2. 观察预览图和画布

**预期结果**：

- ✅ 预览图显示默认的 3 个等比例方块
- ✅ 画布中的按钮保持原样
- ✅ 不会报错

## 技术细节

### CSS Flex 属性

`flex: ${ratio} 1 0%` 的含义：

- `flex-grow: ${ratio}` - 增长因子，决定元素如何分配剩余空间
- `flex-shrink: 1` - 收缩因子，当空间不足时如何收缩
- `flex-basis: 0%` - 基础大小，设为 0% 让元素完全根据 flex-grow 分配空间

### 比例计算

对于 `1:2:1` 的比例：

- 总比例 = 1 + 2 + 1 = 4
- 第一个元素 = 1/4 = 25%
- 第二个元素 = 2/4 = 50%
- 第三个元素 = 1/4 = 25%

### 预览图间距

预览图中使用固定的 `gap: 8px` 来显示子元素之间的间距，这只是为了预览效果，不会应用到实际的容器中。

## 优势

### 1. 集成化设计

- 所有 Flex 配置集中在一个可视化组件中
- 用户可以在一个地方完成所有配置
- 预览图实时反映配置效果

### 2. 直观易用

- 占比输入框紧跟预览图，用户可以立即看到效果
- 提示文本清晰说明如何使用
- 预览图动态调整，所见即所得

### 3. 灵活强大

- 支持任意数量的子元素
- 支持任意比例配置
- 支持水平和垂直方向
- 自动处理子元素数量不匹配的情况

### 4. 代码简洁

- 删除了独立的 gap 字段
- 占比逻辑集中在 FlexVisualizer 中
- 减少了配置项数量

## 后续优化建议

### 1. 添加比例预设

在输入框下方添加常用比例的快捷按钮：

```vue
<div class="ratio-presets">
  <button @click="setRatio('1:1')">1:1</button>
  <button @click="setRatio('1:2')">1:2</button>
  <button @click="setRatio('2:1')">2:1</button>
  <button @click="setRatio('1:1:1')">1:1:1</button>
  <button @click="setRatio('1:2:1')">1:2:1</button>
</div>
```

### 2. 可视化比例编辑器

创建一个可拖拽的比例编辑器：

- 显示可拖拽的分隔线
- 拖拽分隔线调整比例
- 实时显示比例数值

### 3. 响应式比例

支持不同屏幕尺寸的不同比例：

```typescript
{
  desktop: '1:2:1',
  tablet: '1:1:1',
  mobile: '1'  // 垂直堆叠
}
```

### 4. 比例验证

添加输入验证，确保比例格式正确：

- 只允许数字和冒号
- 至少包含一个有效数字
- 提供实时的格式提示

### 5. 百分比显示

在预览图中显示每个子元素的百分比：

```
┌──────────────────────────────┐
│  [1]      [2]      [3]       │
│  25%      50%      25%       │
└──────────────────────────────┘
```

## 总结

本次更新成功将 Flex 容器的占比配置集成到 FlexVisualizer 可视化组件中：

1. ✅ **删除了 gap 字段** - 简化了配置选项
2. ✅ **添加了 flexRatio 输入框** - 放在预览图下方
3. ✅ **实时预览效果** - 预览图根据占比动态调整
4. ✅ **自动应用到画布** - 配置立即生效
5. ✅ **代码无错误** - 所有修改通过了诊断检查

用户现在可以在一个集成的可视化组件中完成所有 Flex 布局配置，包括方向、对齐和占比，实现更直观、更高效的布局设计体验！

## 相关文档

- [Flex 容器间距字段删除](./FLEX_GAP_REMOVAL.md) - 删除 gap 字段的文档
- [Flex 容器占比配置更新](./FLEX_RATIO_UPDATE.md) - 添加 flexRatio 字段的文档
- [属性面板系统设计](./design.md) - 整体设计文档
- [任务列表](./tasks.md) - 当前进度和待办任务
