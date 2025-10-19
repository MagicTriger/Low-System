# 用户菜单组件快速使用指南

## 一、在设计器中使用用户菜单组件

### 步骤1：打开设计器

访问设计器页面（通常是 `/designer`）

### 步骤2：创建新页面或打开现有页面

1. 点击"新建页面"或选择现有页面
2. 进入页面编辑模式

### 步骤3：添加用户菜单组件

1. 在左侧组件库中找到"自定义"分类
2. 找到"用户菜单"组件
3. 拖拽到画布中

### 步骤4：配置组件属性

在右侧属性面板中配置：

#### 基础属性

- **组件名称**：给组件起个名字，如 "mainMenu"
- **宽度/高度**：设置组件尺寸

#### 菜单属性

- **菜单模式**：

  - 内嵌（inline）：默认，适合侧边栏
  - 垂直（vertical）：垂直菜单，无子菜单缩进
  - 水平（horizontal）：水平菜单，适合顶部导航

- **菜单主题**：

  - 亮色（light）：白色背景
  - 暗色（dark）：深色背景

- **收起菜单**：是否收起菜单（仅内嵌模式有效）

- **自动加载**：组件挂载时是否自动加载菜单数据

#### 样式属性

- **背景颜色**：设置组件背景色
- **边距/内边距**：调整间距

### 步骤5：保存页面

点击"保存"按钮保存页面配置

### 步骤6：创建菜单资源

1. 进入"资源管理"页面
2. 点击"新建资源"
3. 填写资源信息：
   - **资源名称**：用户菜单页面
   - **菜单编码**：user-menus-page
   - **菜单类型**：自定义界面
   - **URL地址**：/user-menus-page
   - **权限路径**：/api/v1/groovyHandler/user-menus-page
   - **图标**：选择合适的图标
   - **排序序号**：设置显示顺序
4. 点击"确定"创建

### 步骤7：挂载到管理端

1. 在资源列表中找到刚创建的资源
2. 勾选该资源
3. 点击"挂载到管理端"按钮
4. 确认挂载

### 步骤8：访问页面

1. 刷新管理端页面
2. 在左侧菜单中找到"用户菜单页面"
3. 点击进入，查看用户菜单组件

---

## 二、配置示例

### 示例1：侧边栏菜单

```json
{
  "menuMode": "inline",
  "menuTheme": "light",
  "inlineCollapsed": false,
  "autoLoad": true,
  "backgroundColor": "#ffffff"
}
```

**效果**：白色背景的侧边栏菜单，自动展开

### 示例2：顶部导航菜单

```json
{
  "menuMode": "horizontal",
  "menuTheme": "dark",
  "autoLoad": true,
  "backgroundColor": "#001529"
}
```

**效果**：深色背景的顶部导航菜单

### 示例3：收起的侧边栏

```json
{
  "menuMode": "inline",
  "menuTheme": "dark",
  "inlineCollapsed": true,
  "autoLoad": true,
  "backgroundColor": "#001529"
}
```

**效果**：深色背景的收起侧边栏，只显示图标

---

## 三、常见问题

### Q1：组件显示"暂无菜单数据"

**原因**：

- 用户未登录
- 后端未返回菜单数据
- 后端接口 `/system/menu/user-menus` 未实现

**解决方案**：

1. 确保用户已登录
2. 检查后端接口是否正常
3. 点击"加载菜单"按钮手动加载

### Q2：菜单图标不显示

**原因**：

- 图标名称错误
- 图标库未加载

**解决方案**：

1. 检查菜单数据中的 `icon` 字段
2. 确保图标名称正确（如 "UserOutlined"）
3. 检查图标库是否已初始化

### Q3：点击菜单没有反应

**原因**：

- 菜单项未配置 URL
- 路由未注册

**解决方案**：

1. 检查菜单数据中的 `url` 字段
2. 确保路由已注册
3. 在组件中添加路由跳转逻辑

### Q4：菜单样式不对

**原因**：

- 主题配置错误
- CSS 样式冲突

**解决方案**：

1. 检查 `menuTheme` 配置
2. 调整 `backgroundColor` 属性
3. 检查全局 CSS 是否有冲突

---

## 四、高级用法

### 1. 自定义菜单点击事件

在设计器中添加事件处理：

1. 选中用户菜单组件
2. 切换到"事件"面板
3. 添加"菜单点击"事件
4. 编写事件处理代码：

```javascript
function handleMenuClick(event) {
  const menuKey = event.key
  console.log('点击菜单:', menuKey)

  // 跳转到对应页面
  router.push(`/page/${menuKey}`)
}
```

### 2. 动态刷新菜单

在页面中添加刷新按钮：

```vue
<template>
  <a-button @click="refreshMenus">刷新菜单</a-button>
  <user-menus-component ref="menuRef" />
</template>

<script setup>
import { ref } from 'vue'
import { useModule } from '@/core/state/helpers'

const menuRef = ref()
const resourceModule = useModule('resource')

async function refreshMenus() {
  await resourceModule.dispatch('fetchCurrentUserMenus')
}
</script>
```

### 3. 监听菜单变化

```vue
<script setup>
import { watch } from 'vue'
import { useModule } from '@/core/state/helpers'

const resourceModule = useModule('resource')

watch(
  () => resourceModule.state.userMenuTree,
  newMenus => {
    console.log('菜单已更新:', newMenus)
  }
)
</script>
```

---

## 五、最佳实践

### 1. 菜单结构设计

```
客户端（CLIENT）
├── 系统管理（DIRECTORY）
│   ├── 用户管理（MENU）
│   ├── 角色管理（MENU）
│   └── 菜单管理（MENU）
├── 业务模块（DIRECTORY）
│   ├── 订单管理（MENU）
│   └── 商品管理（MENU）
└── 个人中心（DIRECTORY）
    ├── 个人信息（MENU）
    └── 修改密码（MENU）
```

### 2. URL 和 Path 命名规范

```json
{
  "name": "用户管理",
  "url": "/system/user", // 前端路由：模块/功能
  "path": "/api/v1/groovyHandler/system/user" // 后端路径：保持一致
}
```

### 3. 图标选择建议

- 目录：FolderOutlined
- 菜单：FileOutlined
- 用户相关：UserOutlined
- 设置相关：SettingOutlined
- 数据相关：DatabaseOutlined

### 4. 排序规则

- 客户端：0
- 系统管理：100
- 业务模块：200-900
- 个人中心：1000

---

## 六、调试技巧

### 1. 查看菜单数据

在浏览器控制台执行：

```javascript
// 获取状态管理器
const sm = window.__STATE_MANAGER__

// 查看用户菜单
console.log(sm.getState('resource').userMenuTree)

// 查看路由映射表
console.log(sm.getState('resource').pathMap)
```

### 2. 查看请求头

在浏览器开发者工具中：

1. 打开 Network 面板
2. 发起一个请求
3. 查看 Request Headers
4. 确认是否包含 `path` 字段

### 3. 测试 Path 匹配

```javascript
const sm = window.__STATE_MANAGER__
const resourceModule = sm.getModule('resource')

// 测试路由匹配
const path = resourceModule.getters.getCurrentPath('/user/list')
console.log('匹配的 path:', path)
```

---

## 七、完整示例

### 创建一个带用户菜单的管理后台

#### 1. 页面布局

```vue
<template>
  <a-layout style="min-height: 100vh">
    <!-- 侧边栏 -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo">管理后台</div>
      <user-menus-component :menu-mode="'inline'" :menu-theme="'dark'" :inline-collapsed="collapsed" :auto-load="true" />
    </a-layout-sider>

    <!-- 主内容区 -->
    <a-layout>
      <!-- 顶部 -->
      <a-layout-header style="background: #fff; padding: 0">
        <a-space style="float: right; padding: 0 24px">
          <a-button @click="refreshMenus">刷新菜单</a-button>
          <a-dropdown>
            <a-avatar>U</a-avatar>
            <template #overlay>
              <a-menu>
                <a-menu-item>个人信息</a-menu-item>
                <a-menu-item>退出登录</a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </a-space>
      </a-layout-header>

      <!-- 内容 -->
      <a-layout-content style="margin: 16px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup>
import { ref } from 'vue'
import { useModule } from '@/core/state/helpers'

const collapsed = ref(false)
const resourceModule = useModule('resource')

async function refreshMenus() {
  await resourceModule.dispatch('fetchCurrentUserMenus')
}
</script>

<style scoped>
.logo {
  height: 32px;
  margin: 16px;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  text-align: center;
}
</style>
```

#### 2. 配置菜单数据

在后端数据库中配置：

```sql
INSERT INTO menu (name, code, type, url, path, icon, sort_order, parent_id) VALUES
('系统管理', 'system', 'CLIENT', '/system', '/api/v1/groovyHandler/system', 'SettingOutlined', 0, NULL),
('用户管理', 'user', 'MENU', '/system/user', '/api/v1/groovyHandler/system/user', 'UserOutlined', 1, 1),
('角色管理', 'role', 'MENU', '/system/role', '/api/v1/groovyHandler/system/role', 'TeamOutlined', 2, 1),
('菜单管理', 'menu', 'MENU', '/system/menu', '/api/v1/groovyHandler/system/menu', 'MenuOutlined', 3, 1);
```

#### 3. 测试

1. 登录系统
2. 查看左侧菜单是否正常显示
3. 点击菜单项，检查路由跳转
4. 发起请求，检查请求头是否包含 path

---

## 八、总结

通过以上步骤，你已经成功：

✅ 在设计器中添加了用户菜单组件
✅ 配置了菜单属性
✅ 创建并挂载了菜单资源
✅ 实现了自动 path 添加功能

现在你可以：

- 在任何页面中使用用户菜单组件
- 动态管理菜单数据
- 自动处理权限校验
- 无需手动配置 path 值

**享受开发吧！** 🎉
