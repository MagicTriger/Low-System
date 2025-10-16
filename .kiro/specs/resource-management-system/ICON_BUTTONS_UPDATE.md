# 资源管理界面按钮图标化更新

## 更新时间

2025-10-16

## 更新内容

### 1. 卡片视图 - 添加挂载功能按钮

在卡片背面的功能按钮区域添加了挂载按钮，使用图标显示：

**位置**: `src/modules/designer/components/ResourceCardView.vue`

**修改内容**:

- 在卡片背面的 `info-header-actions` 区域最前面添加挂载按钮
- 使用 `ApiOutlined` 图标
- 未挂载状态：普通图标
- 已挂载状态：绿色图标 (#52c41a)
- 添加 tooltip 提示："挂载到管理端" / "取消挂载"

```vue
<a-tooltip :title="resource.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
  <a-button type="text" size="small" @click.stop="handleMount(resource)">
    <ApiOutlined v-if="!resource.mountedToAdmin" />
    <ApiOutlined v-else style="color: #52c41a" />
  </a-button>
</a-tooltip>
```

### 2. 表格视图 - 文本按钮改为图标按钮

将表格操作列的所有文本按钮改为图标按钮，并添加 tooltip 提示。

**位置**: `src/modules/designer/views/ResourceManagement.vue`

**修改内容**:

#### 挂载按钮

- 移除文本 "挂载" / "已挂载"
- 使用 `ApiOutlined` 图标
- 未挂载：普通图标
- 已挂载：绿色图标
- Tooltip: "挂载到管理端" / "取消挂载"

```vue
<a-tooltip :title="record.mountedToAdmin ? '取消挂载' : '挂载到管理端'">
  <a-button type="link" size="small" :loading="mountingId === record.id" @click="handleToggleMount(record as MenuTreeNode)">
    <template #icon>
      <ApiOutlined v-if="!record.mountedToAdmin" />
      <ApiOutlined v-else style="color: #52c41a" />
    </template>
  </a-button>
</a-tooltip>
```

#### 设计器按钮（新增）

- 使用 `DesktopOutlined` 图标
- Tooltip: "进入设计器"

```vue
<a-tooltip title="进入设计器">
  <a-button type="link" size="small" @click="handleDesigner(record)">
    <template #icon>
      <DesktopOutlined />
    </template>
  </a-button>
</a-tooltip>
```

#### 编辑按钮

- 移除文本 "编辑"
- 使用 `EditOutlined` 图标
- Tooltip: "编辑资源"

```vue
<a-tooltip title="编辑资源">
  <a-button type="link" size="small" @click="handleEdit(record)">
    <template #icon>
      <EditOutlined />
    </template>
  </a-button>
</a-tooltip>
```

#### 删除按钮

- 移除文本 "删除"
- 使用 `DeleteOutlined` 图标
- Tooltip: "删除资源"
- 保持 danger 样式

```vue
<a-tooltip title="删除资源">
  <a-button type="link" size="small" danger :loading="deletingId === record.id" @click="handleDelete(record)">
    <template #icon>
      <DeleteOutlined />
    </template>
  </a-button>
</a-tooltip>
```

### 3. 图标导入

在 `ResourceManagement.vue` 中添加了必要的图标导入：

```typescript
import {
  PlusOutlined,
  ReloadOutlined,
  SearchOutlined,
  FolderOutlined,
  FileOutlined,
  AppstoreOutlined,
  QuestionCircleOutlined,
  AppstoreAddOutlined,
  TableOutlined,
  ApiOutlined, // 新增 - 挂载图标
  DesktopOutlined, // 新增 - 设计器图标
  EditOutlined, // 新增 - 编辑图标
  DeleteOutlined, // 新增 - 删除图标
} from '@ant-design/icons-vue'
```

## 视觉效果

### 卡片视图

- 卡片背面功能按钮区域现在有4个图标按钮：
  1. 🔗 挂载/取消挂载（ApiOutlined）
  2. 🖥️ 进入设计器（DesktopOutlined）
  3. ✏️ 编辑（EditOutlined）
  4. 🗑️ 删除（DeleteOutlined - 红色）

### 表格视图

- 操作列现在显示4个图标按钮（带 tooltip）：
  1. 🔗 挂载/取消挂载
  2. 🖥️ 进入设计器
  3. ✏️ 编辑
  4. 🗑️ 删除

## 用户体验改进

1. **更简洁的界面**

   - 移除了文本，只保留图标
   - 减少了视觉噪音
   - 节省了空间

2. **清晰的提示**

   - 所有按钮都有 tooltip 提示
   - 鼠标悬停时显示功能说明

3. **状态可视化**

   - 已挂载的资源显示绿色图标
   - 一目了然地看出挂载状态

4. **功能完整性**
   - 表格视图新增了"进入设计器"按钮
   - 与卡片视图功能保持一致

## 图标说明

| 功能           | 图标            | 颜色           | 说明               |
| -------------- | --------------- | -------------- | ------------------ |
| 挂载（未挂载） | ApiOutlined     | 默认           | 点击挂载到管理端   |
| 挂载（已挂载） | ApiOutlined     | 绿色 (#52c41a) | 点击取消挂载       |
| 进入设计器     | DesktopOutlined | 默认           | 打开设计器编辑页面 |
| 编辑           | EditOutlined    | 默认           | 编辑资源信息       |
| 删除           | DeleteOutlined  | 红色 (danger)  | 删除资源           |

## 测试建议

1. **卡片视图测试**

   - 右键点击卡片翻转到背面
   - 验证4个图标按钮都正常显示
   - 测试挂载按钮的状态切换（图标颜色变化）
   - 验证 tooltip 提示正确显示

2. **表格视图测试**

   - 验证操作列显示4个图标按钮
   - 测试每个按钮的功能
   - 验证挂载状态的图标颜色变化
   - 确认 tooltip 提示正确

3. **响应式测试**
   - 在不同屏幕尺寸下测试
   - 确保图标按钮在小屏幕上也能正常显示和点击

## 修改文件

1. `src/modules/designer/components/ResourceCardView.vue`

   - 在卡片背面添加挂载按钮

2. `src/modules/designer/views/ResourceManagement.vue`
   - 表格视图的所有按钮改为图标按钮
   - 添加设计器按钮
   - 导入必要的图标组件

## 状态

✅ 卡片视图挂载按钮已添加
✅ 表格视图按钮已图标化
✅ 设计器按钮已添加
✅ Tooltip 提示已添加
✅ 图标导入已完成
✅ 代码无语法错误

## 后续优化建议

1. **图标动画**

   - 可以为挂载状态切换添加过渡动画
   - 按钮悬停时添加缩放效果

2. **快捷键支持**

   - 可以为常用操作添加键盘快捷键
   - 例如：E 键编辑，D 键删除等

3. **批量操作**

   - 支持选中多个资源进行批量挂载/取消挂载
   - 添加批量删除功能

4. **图标主题**
   - 支持根据系统主题切换图标颜色
   - 暗色模式下使用不同的颜色方案
