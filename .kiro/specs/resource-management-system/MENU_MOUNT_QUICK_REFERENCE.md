# 菜单挂载功能 - 快速参考

## API 端点速查

| 功能       | 方法   | 路径                                    | 说明                 |
| ---------- | ------ | --------------------------------------- | -------------------- |
| 挂载菜单   | POST   | `/api/permissions/menus/mount`          | 挂载单个菜单到管理端 |
| 批量挂载   | POST   | `/api/permissions/menus/mount/batch`    | 批量挂载多个菜单     |
| 已挂载列表 | GET    | `/api/permissions/menus/mounted`        | 获取已挂载菜单列表   |
| 更新排序   | PUT    | `/api/permissions/menus/mount/sort`     | 更新挂载菜单排序     |
| 取消挂载   | DELETE | `/api/permissions/menus/mount/{menuId}` | 取消菜单挂载         |

---

## 快速示例

### 挂载菜单

```typescript
// 挂载
await menuApiService.mountMenu({
  menuId: 'menu_001',
  mountToAdmin: true,
  sortOrder: 10,
})

// 取消挂载
await menuApiService.unmountMenu('menu_001')
```

### 批量操作

```typescript
// 批量挂载
await menuApiService.batchMountMenus({
  menuIds: ['menu_001', 'menu_002', 'menu_003'],
  mountToAdmin: true,
})
```

---

## 数据库字段

```sql
-- 添加挂载相关字段
mounted_to_admin BOOLEAN DEFAULT FALSE
admin_sort_order INT DEFAULT 0
mounted_at TIMESTAMP NULL
```

---

## 前端UI交互

### 资源管理界面

```vue
<!-- 挂载按钮 -->
<a-button type="link" size="small" :loading="mountingId === record.id" @click="handleToggleMount(record)">
  {{ record.mountedToAdmin ? '已挂载' : '挂载' }}
</a-button>
```

### 处理函数

```typescript
async function handleToggleMount(menu: MenuTreeNode) {
  mountingId.value = menu.id

  try {
    if (menu.mountedToAdmin) {
      // 取消挂载
      await menuApiService.unmountMenu(menu.id)
      message.success('取消挂载成功')
    } else {
      // 挂载
      await menuApiService.mountMenu({
        menuId: menu.id,
        mountToAdmin: true,
      })
      message.success('挂载成功')
    }

    // 刷新列表
    await fetchResources()
  } catch (error) {
    message.error('操作失败')
  } finally {
    mountingId.value = null
  }
}
```

---

## 状态管理

### Vuex Actions

```typescript
// 在 resource.ts 中添加
actions: {
  async mountMenu({ commit }, { menuId, mountToAdmin, sortOrder }) {
    const response = await menuApiService.mountMenu({
      menuId,
      mountToAdmin,
      sortOrder
    })

    if (response.success) {
      // 更新本地状态
      commit('updateMenuMountStatus', {
        menuId,
        mountedToAdmin: mountToAdmin
      })
    }

    return response
  },

  async getMountedMenus({ commit }, params) {
    const response = await menuApiService.getMountedMenus(params)

    if (response.success) {
      commit('setMountedMenus', response.data.list)
    }

    return response
  }
}
```

---

## 权限配置

### 权限定义

```typescript
{
  code: 'menu:mount',
  name: '挂载菜单',
  description: '允许将菜单挂载到管理端',
  module: 'resource',
  type: 'button'
}
```

### 使用权限

```vue
<!-- 只有有权限的用户才能看到挂载按钮 -->
<a-button v-permission="'menu:mount'" @click="handleMount">
  挂载
</a-button>
```

---

## 业务规则

1. **可挂载类型**: 只有页面类型(nodeType=2)的菜单可以挂载
2. **父子关系**: 挂载子菜单时,父菜单必须已挂载
3. **排序规则**: sortOrder 数字越小越靠前,相同则按创建时间排序
4. **重复挂载**: 已挂载的菜单不能重复挂载,应返回 409 错误
5. **级联取消**: 取消父菜单挂载时,自动取消所有子菜单挂载

---

## 错误处理

```typescript
try {
  await menuApiService.mountMenu(params)
} catch (error) {
  if (error.errorCode === 'MENU_NOT_FOUND') {
    message.error('菜单不存在')
  } else if (error.errorCode === 'ALREADY_MOUNTED') {
    message.warning('菜单已经挂载')
  } else if (error.errorCode === 'PERMISSION_DENIED') {
    message.error('没有权限执行此操作')
  } else {
    message.error('操作失败,请稍后重试')
  }
}
```

---

## 测试清单

- [ ] 挂载单个菜单
- [ ] 取消挂载菜单
- [ ] 批量挂载菜单
- [ ] 更新挂载菜单排序
- [ ] 获取已挂载菜单列表
- [ ] 权限验证
- [ ] 错误处理
- [ ] 级联挂载/取消
- [ ] 管理端菜单实时更新

---

## 相关文档

- [完整API文档](./MENU_MOUNT_API.md)
- [菜单管理接口](./菜单管理接口.md)
- [资源管理系统设计](./design.md)
