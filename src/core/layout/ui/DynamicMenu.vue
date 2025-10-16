<template>
  <a-menu
    :mode="mode"
    :theme="theme"
    :selected-keys="selectedKeys"
    :open-keys="openKeys"
    :inline-collapsed="collapsed"
    class="unified-layout-menu"
    @click="handleMenuClick"
    @open-change="handleOpenChange"
  >
    <template v-for="item in filteredMenuTree" :key="item.menuCode">
      <DynamicMenuItem :menu-item="item" :collapsed="collapsed" @menu-click="handleMenuClick" />
    </template>
  </a-menu>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { MenuTreeNode } from '@/core/api/menu'
import type { DynamicMenuProps } from '../types'
import DynamicMenuItem from './DynamicMenuItem.vue'

/**
 * DynamicMenu Props
 */
const props = withDefaults(defineProps<DynamicMenuProps>(), {
  selectedKeys: () => [],
  mode: 'inline',
  theme: 'dark',
})

/**
 * 过滤有权限的菜单项
 */
const filterMenuByPermission = (menus: MenuTreeNode[]): MenuTreeNode[] => {
  return menus
    .filter(() => {
      // TODO: 这里应该检查用户是否有对应的权限
      // 目前先简单返回 true,后续可以集成权限系统
      return true
    })
    .map(menu => {
      // 递归过滤子菜单
      if (menu.children && menu.children.length > 0) {
        return {
          ...menu,
          children: filterMenuByPermission(menu.children),
        }
      }
      return menu
    })
    .filter(menu => {
      // 如果是父菜单且所有子菜单都被过滤掉了,则隐藏父菜单
      if (menu.children) {
        return menu.children.length > 0
      }
      return true
    })
}

/**
 * 过滤后的菜单树
 */
const filteredMenuTree = computed(() => {
  return filterMenuByPermission(props.menuTree)
})

/**
 * Emits
 */
const emit = defineEmits<{
  'menu-click': [menuItem: MenuTreeNode]
}>()

/**
 * 展开的菜单键
 */
const openKeys = ref<string[]>([])

/**
 * 根据选中的菜单项找到其父级路径
 */
const getParentKeys = (menuCode: string, menus: MenuTreeNode[]): string[] => {
  const keys: string[] = []

  const findParent = (items: MenuTreeNode[], targetCode: string, parentKeys: string[]): boolean => {
    for (const item of items) {
      if (item.menuCode === targetCode) {
        keys.push(...parentKeys)
        return true
      }
      if (item.children && item.children.length > 0) {
        if (findParent(item.children, targetCode, [...parentKeys, item.menuCode])) {
          return true
        }
      }
    }
    return false
  }

  findParent(menus, menuCode, [])
  return keys
}

/**
 * 处理菜单点击
 */
const handleMenuClick = (info: any) => {
  const { key, item } = info
  // 如果是从子组件传递的 MenuTreeNode 对象
  if (item && typeof item === 'object' && 'menuCode' in item) {
    emit('menu-click', item as MenuTreeNode)
    return
  }

  // 否则根据 key 查找菜单项
  const findMenuItem = (menus: MenuTreeNode[], menuCode: string): MenuTreeNode | null => {
    for (const menu of menus) {
      if (menu.menuCode === menuCode) {
        return menu
      }
      if (menu.children && menu.children.length > 0) {
        const found = findMenuItem(menu.children, menuCode)
        if (found) return found
      }
    }
    return null
  }

  const menuItem = findMenuItem(props.menuTree, key)
  if (menuItem) {
    emit('menu-click', menuItem)
  }
}

/**
 * 处理子菜单展开/收起
 */
const handleOpenChange = (keys: string[]) => {
  openKeys.value = keys
}

/**
 * 监听选中的菜单变化,自动展开父级菜单
 */
watch(
  () => props.selectedKeys,
  newKeys => {
    if (newKeys && newKeys.length > 0 && !props.collapsed) {
      const parentKeys = getParentKeys(newKeys[0], props.menuTree)
      openKeys.value = parentKeys
    }
  },
  { immediate: true }
)

/**
 * 监听折叠状态变化
 */
watch(
  () => props.collapsed,
  collapsed => {
    if (collapsed) {
      // 折叠时清空展开的菜单
      openKeys.value = []
    } else {
      // 展开时恢复父级菜单的展开状态
      if (props.selectedKeys && props.selectedKeys.length > 0) {
        const parentKeys = getParentKeys(props.selectedKeys[0], props.menuTree)
        openKeys.value = parentKeys
      }
    }
  }
)
</script>

<style scoped>
.unified-layout-menu {
  border-right: none;
  background: transparent;
}

/* 深色主题 */
.unified-layout-menu:deep(.ant-menu-dark) {
  background: var(--layout-sidebar-bg);
}

.unified-layout-menu:deep(.ant-menu-dark .ant-menu-item),
.unified-layout-menu:deep(.ant-menu-dark .ant-menu-submenu-title) {
  color: var(--layout-text-secondary);
}

.unified-layout-menu:deep(.ant-menu-dark .ant-menu-item:hover),
.unified-layout-menu:deep(.ant-menu-dark .ant-menu-submenu-title:hover) {
  color: var(--layout-text-primary);
  background: var(--layout-bg-hover);
}

.unified-layout-menu:deep(.ant-menu-dark .ant-menu-item-selected) {
  background: var(--layout-primary-color);
  color: #fff;
}

/* 浅色主题 */
.unified-layout-menu:deep(.ant-menu-light) {
  background: #fff;
}

.unified-layout-menu:deep(.ant-menu-light .ant-menu-item-selected) {
  background: var(--layout-primary-color);
  color: #fff;
}

/* 折叠状态下的样式 */
.unified-layout-menu:deep(.ant-menu-inline-collapsed) {
  width: 64px;
}

.unified-layout-menu:deep(.ant-menu-inline-collapsed .ant-menu-item),
.unified-layout-menu:deep(.ant-menu-inline-collapsed .ant-menu-submenu-title) {
  padding: 0 20px;
}

/* 菜单项图标 */
.unified-layout-menu:deep(.ant-menu-item .anticon),
.unified-layout-menu:deep(.ant-menu-submenu-title .anticon) {
  font-size: 16px;
}

/* 子菜单箭头 */
.unified-layout-menu:deep(.ant-menu-submenu-arrow) {
  color: var(--layout-text-secondary);
}

/* 响应式设计 */
@media (max-width: 768px) {
  .unified-layout-menu:deep(.ant-menu-item),
  .unified-layout-menu:deep(.ant-menu-submenu-title) {
    font-size: 14px;
  }
}
</style>
