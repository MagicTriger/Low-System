# 资源表单图标字段改为下拉选择

## 概述

已成功将资源编辑表单中的"图标"字段从文本输入框改为下拉选择框,用户可以从图标库中直观地选择图标。

## 实现的功能

### 1. 图标下拉选择框

- 将原来的文本输入框改为下拉选择框
- 支持搜索过滤图标
- 支持清除选择
- 显示图标预览和名称

### 2. 图标列表加载

- 从图标库管理器加载 Ant Design 图标
- 默认加载前100个图标
- 每个选项显示图标图形和名称

### 3. 搜索过滤功能

- 支持按图标名称搜索
- 实时过滤匹配的图标
- 不区分大小写

### 4. 视觉优化

- 图标预览使用蓝色显示
- 图标名称使用灰色文字
- 下拉列表最大高度400px,超出滚动
- 选项布局清晰,易于选择

## 修改的文件

### src/modules/designer/components/ResourceForm.vue

1. **替换图标输入框为下拉选择框**

   ```vue
   <a-select
     v-model:value="formData.icon"
     placeholder="请选择图标"
     show-search
     allow-clear
     :filter-option="filterIconOption"
     :dropdown-render="dropdownRender"
   >
     <a-select-option v-for="icon in iconList" :key="icon.name" :value="icon.name">
       <div class="icon-option">
         <component :is="icon.component" class="icon-preview" />
         <span class="icon-name">{{ icon.name }}</span>
       </div>
     </a-select-option>
   </a-select>
   ```

2. **添加必要的导入**

   ```typescript
   import { getIconLibraryManager } from '@/core/renderer/icons/IconLibraryManager'
   import type { IconDefinition } from '@/core/renderer/icons/types'
   ```

3. **添加状态管理**

   ```typescript
   const iconManager = getIconLibraryManager()
   const iconList = ref<IconDefinition[]>([])
   const iconSearchQuery = ref('')
   ```

4. **实现图标加载方法**

   ```typescript
   const loadIcons = () => {
     const result = iconManager.searchIcons({
       libraryId: 'antd',
       pageSize: 100,
     })
     iconList.value = result.icons
   }
   ```

5. **实现搜索过滤方法**

   ```typescript
   const filterIconOption = (input: string, option: any) => {
     const iconName = option.value.toLowerCase()
     return iconName.includes(input.toLowerCase())
   }
   ```

6. **添加样式**
   - 图标选项布局样式
   - 图标预览样式
   - 下拉列表滚动样式

## 使用方式

1. 打开资源编辑表单(新建或编辑资源)
2. 点击"图标"字段的下拉框
3. 浏览图标列表或输入关键词搜索
4. 点击选择需要的图标
5. 图标名称会自动填充到字段中

## 技术特点

- **直观选择**: 用户可以看到图标的实际样式,而不是只输入名称
- **搜索功能**: 支持快速搜索定位图标
- **复用基建**: 使用已注册的图标库管理器
- **性能优化**: 默认只加载100个图标,避免列表过长
- **用户体验**: 支持清除选择,支持键盘导航

## 优势

1. **降低错误**: 避免手动输入图标名称时的拼写错误
2. **提高效率**: 可视化选择比记忆图标名称更快
3. **更好的UX**: 用户可以预览图标效果
4. **一致性**: 确保使用的图标都来自图标库

## 后续优化建议

1. 支持分页加载更多图标
2. 添加图标分类筛选
3. 支持收藏常用图标
4. 添加最近使用的图标列表
5. 支持自定义图标上传
6. 增加图标预览大小调整
7. 支持按颜色或风格筛选图标

## 测试建议

1. 测试图标下拉框的打开和关闭
2. 测试图标搜索功能
3. 测试图标选择和清除
4. 测试表单提交时图标值的保存
5. 测试编辑已有资源时图标的回显
6. 测试在不同浏览器中的兼容性
7. 测试下拉列表的滚动性能

## 注意事项

- 当前加载前100个图标,如需更多可调整 pageSize
- 图标组件需要动态渲染,确保图标库已正确注册
- 搜索功能基于图标名称,不支持中文别名搜索
