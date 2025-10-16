/**
 * 统一布局组件导出
 */

// 导出类型
export type {
  ModuleType,
  ThemeConfig,
  HeaderAction,
  HeaderConfig,
  UserInfoConfig,
  SidebarConfig,
  LayoutConfig,
  UserMenuItem,
  UserInfo,
  BaseLayoutProps,
  AppHeaderProps,
  AppSidebarProps,
  DynamicMenuProps,
  UserDropdownProps,
  AppLogoProps,
} from '../types'

// 导出组件
export { default as BaseLayout } from './BaseLayout.vue'
export { default as AppHeader } from './AppHeader.vue'
export { default as AppSidebar } from './AppSidebar.vue'
export { default as DynamicMenu } from './DynamicMenu.vue'
export { default as DynamicMenuItem } from './DynamicMenuItem.vue'
export { default as UserDropdown } from './UserDropdown.vue'
export { default as AppLogo } from './AppLogo.vue'
