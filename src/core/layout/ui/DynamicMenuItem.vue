<template>
  <!-- 有子菜单的情况 -->
  <a-sub-menu v-if="menuItem.children && menuItem.children.length > 0" :key="menuItem.menuCode">
    <template #icon>
      <component :is="getIconComponent(menuItem.icon)" v-if="menuItem.icon" />
    </template>
    <template #title>
      {{ menuItem.menuName }}
    </template>
    <!-- 递归渲染子菜单 -->
    <DynamicMenuItem
      v-for="child in menuItem.children"
      :key="child.menuCode"
      :menu-item="child"
      :collapsed="collapsed"
      @menu-click="handleMenuClick"
    />
  </a-sub-menu>

  <!-- 没有子菜单的情况 -->
  <a-menu-item v-else :key="menuItem.menuCode" @click="handleClick">
    <template #icon>
      <component :is="getIconComponent(menuItem.icon)" v-if="menuItem.icon" />
    </template>
    {{ menuItem.menuName }}
  </a-menu-item>
</template>

<script setup lang="ts">
import { h } from 'vue'
import * as AntIcons from '@ant-design/icons-vue'
import type { MenuTreeNode } from '@/core/api/menu'

/**
 * DynamicMenuItem Props
 */
interface Props {
  /** 菜单项数据 */
  menuItem: MenuTreeNode
  /** 折叠状态 */
  collapsed?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  collapsed: false,
})

/**
 * Emits
 */
const emit = defineEmits<{
  'menu-click': [menuItem: MenuTreeNode]
}>()

/**
 * 获取图标组件
 */
const getIconComponent = (iconName?: string) => {
  if (!iconName) return null

  // 如果是 Ant Design 图标
  const iconComponent = (AntIcons as any)[iconName]
  if (iconComponent) {
    return iconComponent
  }

  // 如果找不到图标,返回默认图标
  return AntIcons.AppstoreOutlined
}

/**
 * 处理菜单项点击
 */
const handleClick = () => {
  emit('menu-click', props.menuItem)
}

/**
 * 处理子菜单项点击 (递归传递)
 */
const handleMenuClick = (menuItem: MenuTreeNode) => {
  emit('menu-click', menuItem)
}
</script>

<style scoped>
/* 菜单项样式由父组件 DynamicMenu 统一控制 */
</style>
