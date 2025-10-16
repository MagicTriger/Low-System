/**
 * 管理端布局配置
 */

import type { LayoutConfig } from '@/core/layout/types'

/**
 * 管理端布局配置
 */
export const adminLayoutConfig: LayoutConfig = {
  /**
   * 模块类型
   */
  module: 'admin',

  /**
   * 头部配置
   */
  header: {
    // 显示侧边栏切换按钮
    showSidebarToggle: true,
    // 标题
    title: '管理后台',
    // 不显示图标库按钮
    showIconLibrary: false,
    // 显示通知按钮
    showNotifications: true,
    // 显示设置按钮
    showSettings: true,
    // 自定义操作按钮
    actions: [],
  },

  /**
   * 侧边栏配置
   */
  sidebar: {
    // 默认宽度
    width: 240,
    // 折叠后宽度
    collapsedWidth: 64,
    // 默认是否折叠
    defaultCollapsed: false,
    // 显示用户信息
    showUserInfo: true,
    // 用户信息配置
    userInfo: {
      name: '',
      avatar: '',
      role: '',
    },
    // 菜单模式
    menuMode: 'inline',
    // 主题
    theme: 'dark',
  },

  /**
   * 主题配置
   */
  theme: {
    // 主色调 (Dashgum 风格的橙色)
    primaryColor: '#f6bb42',
    // 侧边栏背景色 (Dashgum 深色背景)
    sidebarBg: '#2f4050',
    // 头部背景色
    headerBg: '#ffffff',
    // 主要文本颜色
    textPrimary: '#ffffff',
    // 次要文本颜色
    textSecondary: 'rgba(255, 255, 255, 0.65)',
    // 悬停背景色
    bgHover: 'rgba(255, 255, 255, 0.08)',
    // 过渡动画时长
    transitionDuration: '0.3s',
    // 过渡动画时间函数
    transitionTiming: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
}

/**
 * 获取管理端布局配置
 */
export function getAdminLayoutConfig(): LayoutConfig {
  return adminLayoutConfig
}
