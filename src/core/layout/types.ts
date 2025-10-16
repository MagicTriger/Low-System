/**
 * 布局组件类型定义
 * 用于统一管理端和设计端的界面框架
 */

import type { MenuTreeNode } from '@/core/api/menu'

/**
 * 模块类型
 */
export type ModuleType = 'designer' | 'admin'

/**
 * 主题配置
 */
export interface ThemeConfig {
  /** 主题色 */
  primaryColor: string
  /** 头部背景色 */
  headerBg: string
  /** 侧边栏背景色 */
  sidebarBg: string
  /** 内容区背景色 */
  contentBg?: string
  /** 主要文本颜色 */
  textPrimary?: string
  /** 次要文本颜色 */
  textSecondary?: string
  /** 普通文本颜色 */
  textColor?: string
  /** 悬停背景色 */
  bgHover?: string
  /** 边框颜色 */
  borderColor?: string
  /** 过渡动画时长 */
  transitionDuration?: string
  /** 过渡动画时间函数 */
  transitionTiming?: string
}

/**
 * 头部操作按钮
 */
export interface HeaderAction {
  /** 按钮标识 */
  key: string
  /** 按钮标题 */
  title: string
  /** 图标 */
  icon?: string
  /** 点击回调 */
  onClick?: () => void
}

/**
 * 头部配置
 */
export interface HeaderConfig {
  /** 标题 */
  title: string
  /** 是否显示侧边栏切换按钮 */
  showSidebarToggle: boolean
  /** 是否显示图标库 */
  showIconLibrary: boolean
  /** 是否显示通知 */
  showNotifications: boolean
  /** 是否显示设置 */
  showSettings: boolean
  /** 自定义操作按钮 */
  actions?: HeaderAction[]
}

/**
 * 用户信息配置
 */
export interface UserInfoConfig {
  /** 用户头像 */
  avatar?: string
  /** 用户名称 */
  name?: string
  /** 用户角色 */
  role?: string
}

/**
 * Logo 配置
 */
export interface LogoConfig {
  /** Logo 图片 URL */
  logoUrl?: string
  /** Logo 文本 */
  logoText?: string
  /** 点击跳转路径 */
  to?: string
}

/**
 * 侧边栏配置
 */
export interface SidebarConfig {
  /** 宽度 */
  width: number
  /** 折叠后宽度 */
  collapsedWidth: number
  /** 默认是否折叠 */
  defaultCollapsed?: boolean
  /** Logo 配置 */
  logo?: LogoConfig
  /** 是否显示用户信息 */
  showUserInfo: boolean
  /** 用户信息配置 */
  userInfo?: UserInfoConfig
  /** 菜单模式 */
  menuMode: 'inline' | 'vertical'
  /** 主题 */
  theme: 'light' | 'dark'
}

/**
 * 布局配置
 */
export interface LayoutConfig {
  /** 模块标识 */
  module: ModuleType
  /** 头部配置 */
  header: HeaderConfig
  /** 侧边栏配置 */
  sidebar: SidebarConfig
  /** 主题配置 */
  theme: ThemeConfig
}

/**
 * 用户菜单项
 */
export interface UserMenuItem {
  /** 菜单项标识 */
  key: string
  /** 菜单项标签 */
  label: string
  /** 图标 */
  icon?: string
  /** 是否为分隔线 */
  divider?: boolean
}

/**
 * 用户信息
 */
export interface UserInfo {
  /** 用户头像 */
  avatar?: string
  /** 用户名称 */
  name: string
  /** 用户角色 */
  role?: string
  /** 用户邮箱 */
  email?: string
}

/**
 * BaseLayout Props
 */
export interface BaseLayoutProps {
  /** 布局配置 */
  config: LayoutConfig
  /** 是否显示侧边栏 */
  showSidebar?: boolean
  /** 是否显示头部 */
  showHeader?: boolean
  /** 初始折叠状态 */
  defaultCollapsed?: boolean
  /** 菜单数据 */
  menuData?: MenuTreeNode[]
}

/**
 * AppHeader Props
 */
export interface AppHeaderProps {
  /** 头部配置 */
  config: HeaderConfig
  /** 折叠状态 */
  collapsed: boolean
  /** 用户信息 */
  userInfo?: UserInfo
}

/**
 * AppSidebar Props
 */
export interface AppSidebarProps {
  /** 侧边栏配置 */
  config: SidebarConfig
  /** 折叠状态 */
  collapsed: boolean
  /** 菜单数据 */
  menuData: MenuTreeNode[]
  /** 当前选中的菜单 */
  selectedKeys?: string[]
}

/**
 * DynamicMenu Props
 */
export interface DynamicMenuProps {
  /** 菜单树数据 */
  menuTree: MenuTreeNode[]
  /** 折叠状态 */
  collapsed: boolean
  /** 当前选中的菜单 */
  selectedKeys?: string[]
  /** 菜单模式 */
  mode?: 'inline' | 'vertical'
  /** 主题 */
  theme?: 'light' | 'dark'
}

/**
 * UserDropdown Props
 */
export interface UserDropdownProps {
  /** 用户信息 */
  userInfo: UserInfo
  /** 菜单项配置 */
  menuItems?: UserMenuItem[]
}

/**
 * AppLogo Props
 */
export interface AppLogoProps {
  /** 折叠状态 */
  collapsed: boolean
  /** Logo 图片 URL */
  logoUrl?: string
  /** Logo 文本 */
  logoText?: string
  /** 点击跳转路径 */
  to?: string
}
