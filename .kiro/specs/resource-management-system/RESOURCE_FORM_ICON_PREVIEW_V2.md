# 资源表单图标预览增强 V2

## 修复时间

2025-10-16

## 问题描述

在编辑资源弹框(ResourceForm.vue)中,图标字段没有在输入框中显示图标的视觉预览。用户反馈图标显示在了错误的位置(弹框右下角),而不是在"图标"字段的输入框中。

## 解决方案

### 修改文件: `src/modules/designer/components/ResourceForm.vue`

#### 1. 改用输入框+弹框模式

将原来的下拉选择器改为:

- 一个带图标预览的只读输入框
- 点击输入框打开图标选择弹框
- 弹框中以网格形式展示所有图标

```vue
<a-input-group compact style="display: flex">
  <a-input
    :value="formData.icon"
    placeholder="请输入关键词搜索图标（支持模糊查询）"
    readonly
    style="flex: 1; cursor: pointer"
    @click="showIconSelector = true"
  >
    <template #prefix>
      <component
        :is="getSelectedIconComponent()"
        v-if="formData.icon && getSelectedIconComponent()"
        class="selected-icon-preview"
      />
    </template>
  </a-input>
  <a-button v-if="formData.icon" @click="formData.icon = ''" style="border-left: 0">
    <template #icon>
      <CloseOutlined />
    </template>
  </a-button>
</a-input-group>
```

#### 2. 添加图标选择弹框

```vue
<a-modal v-model:visible="showIconSelector" title="选择图标" :width="800" @ok="showIconSelector = false">
  <a-input
    v-model:value="iconSearchQuery"
    placeholder="搜索图标..."
    allow-clear
    @change="(e: any) => handleIconSearch(e.target.value)"
    style="margin-bottom: 16px"
  >
    <template #prefix>
      <SearchOutlined />
    </template>
  </a-input>
  <div class="icon-grid">
    <div
      v-for="icon in iconList"
      :key="icon.name"
      class="icon-grid-item"
      :class="{ 'icon-grid-item-selected': formData.icon === icon.name }"
      @click="selectIcon(icon.name)"
    >
      <component :is="icon.component" class="icon-grid-icon" />
      <div class="icon-grid-name">{{ icon.name }}</div>
    </div>
  </div>
  <a-empty v-if="iconList.length === 0" description="未找到匹配的图标" />
</a-modal>
```

#### 3. 添加必要的导入

```typescript
import { CloseOutlined, SearchOutlined } from '@ant-design/icons-vue'
```

#### 4. 添加响应式变量

```typescript
const showIconSelector = ref(false)
```

#### 5. 添加selectIcon方法

```typescript
const selectIcon = (iconName: string) => {
  formData.value.icon = iconName
  showIconSelector.value = false
}
```

#### 6. 添加样式

```css
/* 输入框中的图标预览 */
.input-icon-preview {
  font-size: 16px;
  color: #1890ff;
}

/* 图标网格 */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 8px;
}

.icon-grid-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s;
}

.icon-grid-item:hover {
  border-color: #1890ff;
  background-color: #f0f5ff;
}

.icon-grid-item-selected {
  border-color: #1890ff;
  background-color: #e6f7ff;
}

.icon-grid-icon {
  font-size: 24px;
  color: #1890ff;
  margin-bottom: 8px;
}

.icon-grid-name {
  font-size: 12px;
  color: #666;
  text-align: center;
  word-break: break-all;
  line-height: 1.2;
}
```

## 功能特性

### 1. 图标预览在输入框中显示

- 图标显示在输入框的左侧(prefix位置)
- 图标名称显示在输入框的值区域
- 清除按钮显示在输入框右侧

### 2. 图标选择弹框

- 点击输入框打开图标选择弹框
- 弹框中以网格形式展示所有图标
- 支持搜索过滤图标
- 点击图标即可选择

### 3. 视觉反馈

- 当前选中的图标在网格中高亮显示
- 鼠标悬停时图标项有hover效果
- 图标以大尺寸(24px)显示,便于识别

### 4. 用户体验

- 输入框只读,防止手动输入错误
- 点击输入框任意位置都可以打开选择器
- 清除按钮方便快速清空选择
- 弹框支持搜索,快速定位图标

## 用户体验改进

### 之前:

- 图标显示在弹框右下角的错误位置
- 无法在图标字段中看到图标预览

### 现在:

```
图标字段: [🌲 custom/tree] [×]
           ↑      ↑        ↑
         图标   名称    清除按钮
```

点击输入框后:

```
┌─────────────────────────────────┐
│ 选择图标                    [×] │
├─────────────────────────────────┤
│ 🔍 搜索图标...                  │
├─────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐   │
│ │ 🌲 │ │ 👤 │ │ 🏠 │ │ ⚙️ │   │
│ │tree│ │user│ │home│ │set │   │
│ └────┘ └────┘ └────┘ └────┘   │
│ ...更多图标...                  │
└─────────────────────────────────┘
```

## 技术实现

### 输入框模式

- 使用`a-input-group`组合输入框和清除按钮
- 输入框设置为只读(`readonly`)
- 使用`#prefix`插槽显示图标预览

### 弹框模式

- 使用`a-modal`组件创建图标选择弹框
- 使用CSS Grid布局创建图标网格
- 响应式列数,自动适应容器宽度

### 图标查找

- 复用现有的`getSelectedIconComponent()`方法
- 支持自定义图标和标准图标
- 从所有图标库中查找

## 测试建议

### 1. 测试图标预览显示

- 打开编辑资源弹框
- 选择一个图标
- 确认图标显示在输入框左侧

### 2. 测试图标选择

- 点击图标输入框
- 确认弹框打开
- 点击一个图标
- 确认图标被选中并显示在输入框中

### 3. 测试搜索功能

- 在弹框的搜索框中输入关键词
- 确认图标列表被过滤
- 确认搜索结果正确

### 4. 测试清除功能

- 选择一个图标
- 点击清除按钮
- 确认图标被清空

### 5. 测试自定义图标

- 选择一个自定义图标(如custom/tree)
- 确认图标正确显示

### 6. 测试表单提交

- 选择图标后保存资源
- 确认在资源列表中图标正确显示

## 相关文件

- `src/modules/designer/components/ResourceForm.vue` - 资源编辑表单(本次修改)
- `src/modules/designer/views/ResourceManagement.vue` - 资源管理页面
- `src/core/renderer/icons/IconLibraryManager.ts` - 图标库管理器
- `src/core/renderer/icons/CustomIconManager.ts` - 自定义图标管理器

## 完成状态

✅ 图标预览功能已实现
✅ 图标显示在正确位置(输入框中)
✅ 图标选择弹框已实现
✅ 搜索功能已实现
✅ 清除功能已实现
✅ 样式优化已完成
✅ 文档已编写

## 总结

这次修复将图标预览从错误的位置(弹框右下角)移到了正确的位置(图标字段的输入框中)。采用了输入框+弹框的交互模式,提供了更好的用户体验:

1. 图标预览直接显示在输入框中,一目了然
2. 点击输入框打开图标选择弹框,操作直观
3. 网格布局展示所有图标,便于浏览和选择
4. 支持搜索过滤,快速定位目标图标
5. 清除按钮方便快速清空选择

这个实现方式比下拉选择器更适合图标选择的场景,因为图标数量多,网格展示比列表展示更直观。
